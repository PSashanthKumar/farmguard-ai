import { Loader2 } from 'lucide-react';

export function LoadingState({ label = 'Working…', sublabel }: { label?: string; sublabel?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
      <div className="relative flex h-14 w-14 items-center justify-center">
        <span className="absolute inset-0 rounded-full bg-brand-200/60 animate-pulse-ring" />
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
      <div>
        <p className="font-display text-sm font-bold text-earth-800">{label}</p>
        {sublabel && <p className="mt-1 text-xs text-earth-500">{sublabel}</p>}
      </div>
    </div>
  );
}

export function SkeletonCard({ className = '' }: { className?: string }) {
  return <div className={`shimmer-bg h-32 rounded-3xl ${className}`} />;
}

export function InlineSpinner({ label }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm text-brand-700">
      <Loader2 className="h-4 w-4 animate-spin" />
      {label}
    </span>
  );
}
