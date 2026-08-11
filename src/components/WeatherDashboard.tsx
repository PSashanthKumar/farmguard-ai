import { Droplets, Wind, CloudRain, Thermometer, Sun, Gauge, Eye } from 'lucide-react';
import type { WeatherData } from '@/types';
import { Card, CardHeader } from '@/components/ui/Card';
import { WeatherIcon } from '@/components/ui/WeatherIcon';
import { Badge } from '@/components/ui/Badges';

export function WeatherDashboard({ weather }: { weather: WeatherData }) {
  const { current, forecast, source } = weather;

  const stats = [
    { icon: Thermometer, label: 'Feels like', value: `${current.feelsLikeC}°`, tint: 'text-amber-600' },
    { icon: Droplets, label: 'Humidity', value: `${current.humidity}%`, tint: 'text-sky2-600' },
    { icon: CloudRain, label: 'Rain chance', value: `${current.rainProb}%`, tint: 'text-sky2-700' },
    { icon: Wind, label: 'Wind', value: `${current.windKph} km/h ${current.windDir}`, tint: 'text-earth-500' },
    { icon: Sun, label: 'UV index', value: `${current.uvIndex}`, tint: 'text-amber-500' },
    { icon: Gauge, label: 'Pressure', value: `${current.pressureHpa} hPa`, tint: 'text-earth-500' },
  ];

  return (
    <Card>
      <CardHeader
        icon={<WeatherIcon code={current.conditionCode} isDay={current.isDay} className="h-5 w-5" />}
        title="Weather Dashboard"
        subtitle={weather.locationName}
        action={
          <div className="flex items-center gap-2">
            <Badge tone={source === 'live' ? 'brand' : 'amber'} icon={<Eye className="h-3 w-3" />}>
              {source === 'live' ? 'Live data' : 'Demo data'}
            </Badge>
          </div>
        }
      />

      {/* Current */}
      <div className="flex flex-col gap-4 rounded-2xl bg-gradient-to-br from-brand-50 to-sky2-50 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <WeatherIcon code={current.conditionCode} isDay={current.isDay} className="h-14 w-14" />
          <div>
            <div className="flex items-end gap-1">
              <span className="font-display text-4xl font-extrabold text-earth-800">{current.tempC}</span>
              <span className="mb-1 text-xl font-bold text-earth-400">°C</span>
            </div>
            <p className="text-sm font-semibold text-earth-600">{current.condition}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {stats.slice(0, 3).map((s) => (
            <StatPill key={s.label} {...s} />
          ))}
        </div>
      </div>

      {/* Secondary stats */}
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {stats.slice(3).map((s) => (
          <StatPill key={s.label} {...s} />
        ))}
      </div>

      {/* 5-day forecast */}
      <div className="mt-5">
        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-earth-400">5-day forecast</p>
        <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
          {forecast.map((d, i) => (
            <div
              key={d.date}
              className={`flex flex-col items-center gap-1 rounded-2xl px-1 py-3 text-center transition ${
                i === 0 ? 'bg-brand-600 text-white shadow-glow' : 'bg-earth-50 text-earth-700 hover:bg-brand-50'
              }`}
            >
              <span className={`text-[11px] font-bold ${i === 0 ? 'text-white/90' : 'text-earth-500'}`}>{d.dayName}</span>
              <WeatherIcon code={d.conditionCode} className="h-6 w-6" />
              <span className="text-xs font-bold">{d.tempMaxC}°</span>
              <span className={`text-[10px] ${i === 0 ? 'text-white/70' : 'text-earth-400'}`}>{d.tempMinC}°</span>
              <span className={`mt-0.5 flex items-center gap-0.5 text-[10px] font-semibold ${i === 0 ? 'text-white/80' : 'text-sky2-600'}`}>
                <Droplets className="h-2.5 w-2.5" /> {d.rainProb}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

function StatPill({ icon: Icon, label, value, tint }: { icon: typeof Droplets; label: string; value: string; tint: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 ring-1 ring-earth-100">
      <Icon className={`h-4 w-4 ${tint}`} />
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-earth-400">{label}</p>
        <p className="truncate text-sm font-bold text-earth-800">{value}</p>
      </div>
    </div>
  );
}
