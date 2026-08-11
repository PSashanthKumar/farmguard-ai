import { Microscope, PhoneCall, CircleCheck, CircleAlert } from 'lucide-react';
import type { CropAnalysisResult } from '@/types';
import { Card, CardHeader } from '@/components/ui/Card';

export function ExpertVerification({ crop }: { crop: CropAnalysisResult }) {
  const needed = crop.expertVerificationRecommended;
  return (
    <Card className={needed ? 'border-amber-200 bg-amber-50/40' : 'border-brand-200 bg-brand-50/40'}>
      <CardHeader
        icon={<Microscope className="h-5 w-5" />}
        title="Expert Verification"
        subtitle={needed ? 'Recommended before any treatment' : 'Optional — continue monitoring'}
      />
      {needed ? (
        <div className="space-y-3">
          <div className="flex items-start gap-2.5 text-sm text-amber-900">
            <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <p>
              AI confidence is <strong>{crop.confidence}%</strong> and symptoms can resemble more than one condition.
              Before applying any treatment, confirm the diagnosis with a qualified agricultural professional.
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <Step n={1} text="Collect 3–5 affected leaves" />
            <Step n={2} text="Place in a dry paper bag (not plastic)" />
            <Step n={3} text="Visit your local extension officer" />
          </div>
          <a
            href="https://www.fao.org/land-water/land-water-governance/land-tenure/en/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-2xl bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-700"
          >
            <PhoneCall className="h-4 w-4" /> Find local agricultural extension services
          </a>
        </div>
      ) : (
        <div className="flex items-start gap-2.5 text-sm text-brand-800">
          <CircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
          <p>
            No expert verification is required for this reading, but keep weekly monitoring. If symptoms worsen or
            spread, re-scan and contact your local extension officer.
          </p>
        </div>
      )}
    </Card>
  );
}

function Step({ n, text }: { n: number; text: string }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl bg-white px-3 py-2.5 ring-1 ring-amber-100">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-600 text-xs font-bold text-white">{n}</span>
      <span className="text-xs font-semibold text-earth-700">{text}</span>
    </div>
  );
}
