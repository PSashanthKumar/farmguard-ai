import {
  Sun,
  CloudSun,
  Cloud,
  CloudFog,
  CloudDrizzle,
  CloudRain,
  CloudRainWind,
  CloudLightning,
  CloudSnow,
  Moon,
  CloudMoon,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const MAP: Record<string, { Icon: LucideIcon; tint: string }> = {
  clear: { Icon: Sun, tint: 'text-amber-500' },
  'mostly-clear': { Icon: CloudSun, tint: 'text-amber-500' },
  'partly-cloudy': { Icon: CloudSun, tint: 'text-sky2-500' },
  cloudy: { Icon: Cloud, tint: 'text-earth-400' },
  fog: { Icon: CloudFog, tint: 'text-earth-400' },
  drizzle: { Icon: CloudDrizzle, tint: 'text-sky2-500' },
  rain: { Icon: CloudRain, tint: 'text-sky2-600' },
  'heavy-rain': { Icon: CloudRainWind, tint: 'text-sky2-700' },
  storm: { Icon: CloudLightning, tint: 'text-amber-600' },
  snow: { Icon: CloudSnow, tint: 'text-sky2-400' },
  'night-clear': { Icon: Moon, tint: 'text-indigo-500' },
  'night-partly': { Icon: CloudMoon, tint: 'text-indigo-400' },
};

export function WeatherIcon({ code, isDay = true, className = 'h-7 w-7' }: { code: string; isDay?: boolean; className?: string }) {
  let key = code;
  if (!isDay) {
    if (code === 'clear') key = 'night-clear';
    if (code === 'partly-cloudy' || code === 'mostly-clear') key = 'night-partly';
  }
  const entry = MAP[key] ?? MAP.cloudy;
  const { Icon, tint } = entry;
  return <Icon className={`${className} ${tint}`} />;
}
