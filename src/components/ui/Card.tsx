import type { ReactNode } from 'react';

export function Card({ className = '', children }: { className?: string; children: ReactNode }) {
  return <div className={`card p-5 sm:p-6 ${className}`}>{children}</div>;
}

export function CardHeader({
  icon,
  title,
  subtitle,
  action,
}: {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div className="flex items-start gap-3">
        {icon && (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 ring-1 ring-brand-100">
            {icon}
          </div>
        )}
        <div>
          <h3 className="font-display text-base font-bold leading-tight text-earth-800 sm:text-lg">{title}</h3>
          {subtitle && <p className="mt-0.5 text-sm text-earth-500">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

export function StepBadge({ n, label }: { n: number; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white shadow-sm">
        {n}
      </span>
      <span className="text-xs font-bold uppercase tracking-wider text-brand-700">{label}</span>
    </div>
  );
}
