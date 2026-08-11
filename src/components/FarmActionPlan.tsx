import { ClipboardCheck, Eye, Wrench, Repeat, PhoneCall, CircleCheck } from 'lucide-react';
import type { FarmActionPlan } from '@/types';
import { Card, CardHeader } from '@/components/ui/Card';

export function FarmActionPlan({ plan }: { plan: FarmActionPlan }) {
  const sections = [
    { icon: Eye, title: 'What to check', items: plan.checkNow, tint: 'bg-sky2-50 text-sky2-600 ring-sky2-100' },
    { icon: Wrench, title: 'What to do now', items: plan.doNow, tint: 'bg-brand-50 text-brand-600 ring-brand-100' },
    { icon: ClipboardCheck, title: 'What to monitor', items: plan.monitor, tint: 'bg-amber-50 text-amber-600 ring-amber-100' },
  ];

  return (
    <Card>
      <CardHeader icon={<ClipboardCheck className="h-5 w-5" />} title="Farm Action Plan" subtitle="Plain-language steps you can take today" />

      <div className="grid gap-4 sm:grid-cols-3">
        {sections.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.title} className="rounded-2xl border border-earth-100 p-4">
              <div className={`mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl ring-1 ${s.tint}`}>
                <Icon className="h-4.5 w-4.5" />
              </div>
              <p className="mb-2 font-display text-sm font-bold text-earth-800">{s.title}</p>
              <ul className="space-y-1.5">
                {s.items.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-earth-600">
                    <CircleCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="flex items-start gap-3 rounded-2xl bg-brand-600 p-4 text-white">
          <Repeat className="mt-0.5 h-5 w-5 shrink-0 text-brand-100" />
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-brand-100">When to check again</p>
            <p className="mt-0.5 text-sm leading-relaxed text-white">{plan.nextCheck}</p>
          </div>
        </div>
        <div className="flex items-start gap-3 rounded-2xl bg-earth-800 p-4 text-white">
          <PhoneCall className="mt-0.5 h-5 w-5 shrink-0 text-earth-300" />
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-earth-300">When to contact an expert</p>
            <p className="mt-0.5 text-sm leading-relaxed text-white">{plan.expertContact}</p>
          </div>
        </div>
      </div>
    </Card>
  );
}
