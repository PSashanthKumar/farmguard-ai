import { memo } from 'react';
import { Clock, CloudRain, Sun, Eye, ShieldCheck, TriangleAlert, CalendarClock } from 'lucide-react';
import type { ClimateActionWindow, WindowStatus } from '@/types';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badges';

const STATUS_META: Record<WindowStatus, { label: string; icon: typeof Sun; bg: string; ring: string; text: string; dot: string }> = {
  good: { label: 'GOOD WINDOW', icon: Sun, bg: 'bg-brand-50', ring: 'ring-brand-300', text: 'text-brand-700', dot: 'bg-brand-500' },
  wait: { label: 'WAIT', icon: CloudRain, bg: 'bg-amber-50', ring: 'ring-amber-300', text: 'text-amber-700', dot: 'bg-amber-500' },
  monitor: { label: 'MONITOR', icon: Eye, bg: 'bg-sky2-50', ring: 'ring-sky2-300', text: 'text-sky2-700', dot: 'bg-sky2-500' },
};

export const ClimateActionWindow = memo(function ClimateActionWindow({ data }: { data: ClimateActionWindow }) {
  return (
    <Card className="border-brand-200/80 bg-gradient-to-b from-white to-brand-50/30">
      <CardHeader
        icon={<CalendarClock className="h-5 w-5" />}
        title="Climate-Aware Action Window"
        subtitle="Weather-timed guidance for the detected issue"
        action={
          <Badge tone={data.favorable ? 'brand' : 'amber'} icon={<TriangleAlert className="h-3 w-3" />}>
            {data.favorable ? 'Favorable now' : 'Act with care'}
          </Badge>
        }
      />

      <p className="text-sm leading-relaxed text-earth-700">{data.summary}</p>

      {/* Weather impact */}
      <div className="mt-4 rounded-2xl bg-white p-4 ring-1 ring-brand-100">
        <p className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand-700">
          <CloudRain className="h-3.5 w-3.5" /> How weather affects this issue
        </p>
        <p className="text-sm leading-relaxed text-earth-700">{data.weatherImpact}</p>
      </div>

      {/* Timeline */}
      <div className="mt-5">
        <p className="mb-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-earth-400">
          <Clock className="h-3.5 w-3.5" /> Action timeline
        </p>
        <div className="relative">
          {/* connecting line */}
          <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-brand-100 sm:left-1/2 sm:-translate-x-1/2" />
          <div className="space-y-3">
            {data.timeline.map((slot, i) => {
              const m = STATUS_META[slot.status];
              const Icon = m.icon;
              return (
                <div
                  key={slot.label}
                  className={`relative flex gap-3 rounded-2xl ${m.bg} p-3 ring-1 ${m.ring} animate-fade-in`}
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm ${m.text}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-display text-sm font-bold text-earth-800">{slot.label}</span>
                      <span className="text-xs text-earth-400">· {slot.range}</span>
                      <span className={`chip bg-white/80 ${m.text} ring-1 ${m.ring}`}>{m.label}</span>
                    </div>
                    <p className="mt-1 text-sm text-earth-600">{slot.detail}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Reasoning */}
      <div className="mt-5 rounded-2xl bg-brand-900/95 p-4 text-white">
        <p className="mb-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand-200">
          <Eye className="h-3.5 w-3.5" /> Why this timing
        </p>
        <p className="text-sm leading-relaxed text-brand-50">{data.reasoning}</p>
      </div>

      {/* Safety note */}
      <div className="mt-4 flex items-start gap-2.5 rounded-2xl bg-amber-50 p-3.5 ring-1 ring-amber-200">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
        <p className="text-xs leading-relaxed text-amber-800">{data.productSafetyNote}</p>
      </div>
    </Card>
  );
});
