import { useCallback, useRef, useState } from 'react';
import { UploadCloud, Image as ImageIcon, Trash2, Sparkles } from 'lucide-react';

interface Props {
  imageUrl: string | null;
  onImage: (file: File | null) => void;
  onUseDemo?: () => void;
  disabled?: boolean;
}

export function ImageUploader({ imageUrl, onImage, onUseDemo, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;
      const file = files[0];
      if (!file.type.startsWith('image/')) return;
      onImage(file);
    },
    [onImage]
  );

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {!imageUrl ? (
        <div
          role="button"
          tabIndex={0}
          onClick={() => !disabled && inputRef.current?.click()}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && !disabled && inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            if (!disabled) setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            if (!disabled) handleFiles(e.dataTransfer.files);
          }}
          className={`group relative flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed px-6 py-10 text-center transition-all
            ${dragOver ? 'border-brand-500 bg-brand-50 scale-[1.01]' : 'border-brand-200 bg-brand-50/40 hover:border-brand-400 hover:bg-brand-50'}
            ${disabled ? 'pointer-events-none opacity-60' : ''}`}
        >
          <div className="relative mb-3">
            <span className="absolute inset-0 rounded-2xl bg-brand-200/50 animate-pulse-ring" />
            <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-brand-600 shadow-card ring-1 ring-brand-100 transition-transform group-hover:scale-110">
              <UploadCloud className="h-7 w-7" />
            </div>
          </div>
          <p className="font-display text-base font-bold text-earth-800">Drag & drop a crop photo</p>
          <p className="mt-1 text-sm text-earth-500">or click to browse · JPG / PNG · leaf or full plant</p>
          <p className="mt-3 text-xs text-earth-400">For best results: 15–30 cm from the leaf, in daylight, in focus</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-brand-100 bg-earth-50 shadow-card">
          <div className="relative aspect-[4/3] w-full bg-earth-100">
            <img src={imageUrl} alt="Uploaded crop" className="h-full w-full object-cover" />
            <div className="absolute right-3 top-3 flex gap-2">
              <button
                onClick={() => inputRef.current?.click()}
                disabled={disabled}
                className="inline-flex items-center gap-1.5 rounded-xl bg-white/95 px-3 py-1.5 text-xs font-semibold text-earth-700 shadow-card transition hover:bg-white disabled:opacity-50"
              >
                <ImageIcon className="h-3.5 w-3.5" /> Replace
              </button>
              <button
                onClick={() => onImage(null)}
                disabled={disabled}
                className="inline-flex items-center gap-1.5 rounded-xl bg-white/95 px-3 py-1.5 text-xs font-semibold text-red-600 shadow-card transition hover:bg-white disabled:opacity-50"
              >
                <Trash2 className="h-3.5 w-3.5" /> Remove
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-2.5 text-xs text-earth-500">
            <ImageIcon className="h-3.5 w-3.5 text-brand-600" />
            Photo ready for analysis
          </div>
        </div>
      )}

      {onUseDemo && !imageUrl && (
        <button
          onClick={onUseDemo}
          disabled={disabled}
          className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-brand-300 bg-brand-50/50 px-4 py-2.5 text-sm font-semibold text-brand-700 transition hover:bg-brand-50 disabled:opacity-50"
        >
          <Sparkles className="h-4 w-4" /> Try the demo: tomato leaf scenario
        </button>
      )}
    </div>
  );
}
