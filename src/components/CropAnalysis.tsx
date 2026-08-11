import { Sprout, Bug, Worm, Leaf, ShieldQuestion, Microscope, CircleAlert } from 'lucide-react';
import type { CropAnalysisResult } from '@/types';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge, SeverityBadge } from '@/components/ui/Badges';

const ISSUE_META = {
  disease: { icon: Worm, label: 'Disease', tone: 'red' as const },
  pest: { icon: Bug, label: 'Pest', tone: 'amber' as const },
  stress: { icon: Leaf, label: 'Stress', tone: 'sky' as const },
  healthy: { icon: Sprout, label: 'Healthy', tone: 'brand' as const },
  unknown: { icon: ShieldQuestion, label: 'Unclear', tone: 'earth' as const },
};

export function CropAnalysis({ result }: { result: CropAnalysisResult }) {
  const meta = ISSUE_META[result.issueType];
  const Icon = meta.icon;
  const confidenceColor =
    result.confidence >= 75 ? 'text-brand-600' : result.confidence >= 55 ? 'text-amber-600' : 'text-red-600';
  const confidenceBg =
    result.confidence >= 75 ? 'bg-brand-500' : result.confidence >= 55 ? 'bg-amber-500' : 'bg-red-500';

  return (
    <Card>
      <CardHeader
        icon={<Icon className="h-5 w-5" />}
        title="AI Crop Analysis"
        subtitle="Assisted estimate — not a laboratory diagnosis"
        action={<SeverityBadge level={severityToLevel(result.severity)} />}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl bg-earth-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-earth-400">Likely crop</p>
          <p className="mt-1 font-display font-bold text-earth-800">{result.likelyCrop}</p>
        </div>
        <div className="rounded-2xl bg-earth-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-earth-400">Detected issue</p>
          <p className="mt-1 font-display font-bold text-earth-800">{result.issue}</p>
        </div>
      </div>

      {/* Confidence bar */}
      {result.confidence > 0 && (
        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between text-sm">
            <span className="font-semibold text-earth-700">AI confidence</span>
            <span className={`font-bold ${confidenceColor}`}>{result.confidence}%</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-earth-100">
            <div
              className={`h-full rounded-full ${confidenceBg} transition-all duration-700`}
              style={{ width: `${result.confidence}%` }}
            />
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <Badge tone={meta.tone} icon={<Icon className="h-3 w-3" />}>{meta.label}</Badge>
        <Badge tone="earth">Severity: {result.severity}</Badge>
        <Badge tone={result.imageQuality === 'good' ? 'brand' : result.imageQuality === 'fair' ? 'amber' : 'red'}>
          Image: {result.imageQuality}
        </Badge>
        {result.expertVerificationRecommended && (
          <Badge tone="amber" icon={<Microscope className="h-3 w-3" />}>Expert verification advised</Badge>
        )}
      </div>

      {result.symptoms.length > 0 && (
        <div className="mt-5">
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-earth-400">Visible symptoms</p>
          <ul className="space-y-1.5">
            {result.symptoms.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-earth-700">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {result.contributingFactors.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-earth-400">Possible contributing factors</p>
          <ul className="space-y-1.5">
            {result.contributingFactors.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-earth-700">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-5 flex items-start gap-2.5 rounded-2xl bg-amber-50 p-3.5 text-sm text-amber-800 ring-1 ring-amber-200">
        <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
        <p>{result.note}</p>
      </div>
    </Card>
  );
}

function severityToLevel(s: 'Low' | 'Medium' | 'High'): 'success' | 'warning' | 'danger' {
  return s === 'Low' ? 'success' : s === 'Medium' ? 'warning' : 'danger';
}
