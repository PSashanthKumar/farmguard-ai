import { Bell, CircleDot } from 'lucide-react';
import type { FarmAlert } from '@/types';
import { Card, CardHeader } from '@/components/ui/Card';
import { LevelColors, LevelIcon } from '@/components/ui/Badges';

export function Alerts({ alerts }: { alerts: FarmAlert[] }) {
  if (alerts.length === 0) {
    return (
      <Card>
        <CardHeader icon={<Bell className="h-5 w-5" />} title="FarmGuard Alerts" subtitle="No active alerts right now" />
        <p className="py-6 text-center text-sm text-earth-500">All clear — keep monitoring.</p>
      </Card>
    );
  }

  const ordered = [...alerts].sort((a, b) => rank(b.level) - rank(a.level));

  return (
    <Card>
      <CardHeader
        icon={<Bell className="h-5 w-5" />}
        title="FarmGuard Alerts"
        subtitle={`${alerts.length} alert${alerts.length > 1 ? 's' : ''} based on crop + weather`}
        action={
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500" />
          </span>
        }
      />
      <ul className="space-y-2.5">
        {ordered.map((a) => {
          const c = LevelColors(a.level);
          return (
            <li
              key={a.id}
              className={`flex items-start gap-3 overflow-hidden rounded-2xl ${c.bg} ring-1 ${c.ring} animate-fade-in`}
            >
              <div className={`flex w-1.5 shrink-0 self-stretch ${c.bar}`} />
              <div className="flex items-start gap-3 py-3 pr-4">
                <LevelIcon level={a.level} className={`mt-0.5 h-5 w-5 shrink-0 ${c.text}`} />
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-sm font-bold text-earth-800">
                    {a.title}
                    <span className={`chip bg-white/70 ${c.text} ring-1 ${c.ring} text-[10px]`}>
                      <CircleDot className="h-2.5 w-2.5" /> {c.label}
                    </span>
                  </p>
                  <p className="mt-0.5 text-sm text-earth-600">{a.detail}</p>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

function rank(l: FarmAlert['level']): number {
  return { danger: 4, warning: 3, info: 2, success: 1 }[l];
}
