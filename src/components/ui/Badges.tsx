import type { ReactNode } from 'react';
import { AlertTriangle, Info, CheckCircle2, XCircle } from 'lucide-react';
import type { AlertLevel } from '@/types';

const CONFIG: Record<AlertLevel, { icon: typeof Info; bar: string; bg: string; text: string; ring: string; label: string }> = {
  info: { icon: Info, bar: 'bg-sky2-500', bg: 'bg-sky2-50', text: 'text-sky2-700', ring: 'ring-sky2-200', label: 'Info' },
  success: { icon: CheckCircle2, bar: 'bg-brand-500', bg: 'bg-brand-50', text: 'text-brand-700', ring: 'ring-brand-200', label: 'Good' },
  warning: { icon: AlertTriangle, bar: 'bg-sun-500', bg: 'bg-amber-50', text: 'text-amber-700', ring: 'ring-amber-200', label: 'Watch' },
  danger: { icon: XCircle, bar: 'bg-red-500', bg: 'bg-red-50', text: 'text-red-700', ring: 'ring-red-200', label: 'Urgent' },
};

export function SeverityBadge({ level }: { level: AlertLevel }) {
  const c = CONFIG[level];
  const Icon = c.icon;
  return (
    <span className={`chip ${c.bg} ${c.text} ring-1 ${c.ring}`}>
      <Icon className="h-3.5 w-3.5" />
      {c.label}
    </span>
  );
}

export function LevelIcon({ level, className = 'h-5 w-5' }: { level: AlertLevel; className?: string }) {
  const Icon = CONFIG[level].icon;
  return <Icon className={className} />;
}

export function LevelColors(level: AlertLevel) {
  return CONFIG[level];
}

export function Badge({
  children,
  tone = 'brand',
  icon,
}: {
  children: ReactNode;
  tone?: 'brand' | 'earth' | 'sky' | 'amber' | 'red';
  icon?: ReactNode;
}) {
  const tones: Record<string, string> = {
    brand: 'bg-brand-50 text-brand-700 ring-1 ring-brand-200',
    earth: 'bg-earth-100 text-earth-700 ring-1 ring-earth-200',
    sky: 'bg-sky2-50 text-sky2-700 ring-1 ring-sky2-200',
    amber: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
    red: 'bg-red-50 text-red-700 ring-1 ring-red-200',
  };
  return (
    <span className={`chip ${tones[tone]}`}>
      {icon}
      {children}
    </span>
  );
}
