import { useState } from 'react';
import { MapPin, LocateFixed, Check, AlertCircle } from 'lucide-react';
import type { GeoLocation } from '@/types';
import { reverseGeocode } from '@/lib/weather';
import { InlineSpinner } from '@/components/ui/LoadingState';

interface Props {
  location: GeoLocation | null;
  onLocation: (loc: GeoLocation) => void;
  disabled?: boolean;
}

export function LocationDetector({ location, onLocation, disabled }: Props) {
  const [loadingGps, setLoadingGps] = useState(false);
  const [manual, setManual] = useState('');
  const [error, setError] = useState<string | null>(null);

  const useGps = () => {
    setError(null);
    if (!('geolocation' in navigator)) {
      setError('Geolocation is not supported by this browser. Enter your location manually.');
      return;
    }
    setLoadingGps(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const label = await reverseGeocode(latitude, longitude);
        onLocation({ lat: latitude, lng: longitude, label, source: 'gps' });
        setLoadingGps(false);
      },
      (err) => {
        setLoadingGps(false);
        const msg =
          err.code === err.PERMISSION_DENIED
            ? 'Location permission denied. Enter your location manually below.'
            : 'Could not get your location. Try entering it manually.';
        setError(msg);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  };

  const submitManual = () => {
    const v = manual.trim();
    if (v.length < 2) {
      setError('Please enter a city, village, or region.');
      return;
    }
    setError(null);
    onLocation({
      // Generic coordinates — weather API will resolve the nearest grid point.
      lat: 0,
      lng: 0,
      label: v,
      source: 'manual',
    });
  };

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <button onClick={useGps} disabled={disabled || loadingGps} className="btn-primary flex-1">
          {loadingGps ? <InlineSpinner label="Locating…" /> : (<><LocateFixed className="h-4 w-4" /> Use my location</>)}
        </button>
        <div className="relative flex-1">
          <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-earth-400" />
          <input
            type="text"
            value={manual}
            disabled={disabled}
            onChange={(e) => setManual(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submitManual()}
            placeholder="Or enter city / village"
            className="w-full rounded-2xl border border-brand-200 bg-white px-9 py-3 text-sm text-earth-800 placeholder:text-earth-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200 disabled:opacity-60"
          />
        </div>
        <button onClick={submitManual} disabled={disabled} className="btn-ghost">
          Set
        </button>
      </div>

      {error && (
        <p className="mt-3 flex items-start gap-2 text-xs text-amber-700">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {error}
        </p>
      )}

      {location && (
        <div className="mt-3 flex items-center gap-2 rounded-2xl bg-brand-50 px-4 py-2.5 ring-1 ring-brand-100">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-600 text-white">
            <Check className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-earth-800">{location.label}</p>
            <p className="text-xs text-earth-500">
              {location.source === 'gps' ? `GPS · ${location.lat.toFixed(3)}, ${location.lng.toFixed(3)}` : 'Manual entry'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
