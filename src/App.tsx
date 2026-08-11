import { memo, useCallback, useRef, useState } from 'react';
import {
  Leaf,
  CloudSun,
  ScanLine,
  MapPin,
  Sparkles,
  Wand2,
  RotateCcw,
  ShieldCheck,
  AlertTriangle,
  CircleCheck,
  Wind,
} from 'lucide-react';
import type { GeoLocation, WeatherData, AnalysisBundle, CropAnalysisResult } from '@/types';
import { fetchWeather } from '@/lib/weather';
import { extractImageFeatures, analyzeImageFeatures, buildAnalysisBundle } from '@/lib/analysis';
import {
  DEMO_LOCATION,
  DEMO_WEATHER,
  DEMO_IMAGE_URL,
  DEMO_CROP,
} from '@/lib/demoData';
import { ImageUploader } from '@/components/ImageUploader';
import { LocationDetector } from '@/components/LocationDetector';
import { WeatherDashboard } from '@/components/WeatherDashboard';
import { CropAnalysis } from '@/components/CropAnalysis';
import { ClimateActionWindow } from '@/components/ClimateActionWindow';
import { FarmActionPlan } from '@/components/FarmActionPlan';
import { Alerts } from '@/components/Alerts';
import { ExpertVerification } from '@/components/ExpertVerification';
import { Card, CardHeader, StepBadge } from '@/components/ui/Card';
import { LoadingState } from '@/components/ui/LoadingState';
import { Badge } from '@/components/ui/Badges';

type Phase = 'input' | 'analyzing' | 'results';

export default function App() {
  const [phase, setPhase] = useState<Phase>('input');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [location, setLocation] = useState<GeoLocation | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [bundle, setBundle] = useState<AnalysisBundle | null>(null);
  const [demoMode, setDemoMode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const blobUrlRef = useRef<string | null>(null);

  // When image changes
  const handleImage = useCallback((file: File | null) => {
    setImageFile(file);
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
    if (file) {
      const url = URL.createObjectURL(file);
      blobUrlRef.current = url;
      setImageUrl(url);
      setDemoMode(false);
    } else {
      setImageUrl(null);
    }
    setBundle(null);
    setPhase('input');
  }, []);

  // When location changes -> fetch weather (skipped if same location)
  const handleLocation = useCallback(async (loc: GeoLocation) => {
    setLocation((prev) => {
      if (prev && prev.lat === loc.lat && prev.lng === loc.lng && prev.label === loc.label) {
        return prev;
      }
      return loc;
    });
    // Skip fetch if the location hasn't actually changed
    if (location && location.lat === loc.lat && location.lng === loc.lng && location.label === loc.label) {
      return;
    }
    setWeatherLoading(true);
    setError(null);
    const w = await fetchWeather(loc.lat, loc.lng, loc.label);
    setWeather(w);
    setWeatherLoading(false);
  }, [location]);

  // Demo mode: load everything
  const loadDemo = useCallback(() => {
    setDemoMode(true);
    setImageFile(null);
    setImageUrl(DEMO_IMAGE_URL);
    setLocation(DEMO_LOCATION);
    setWeather({ ...DEMO_WEATHER, locationName: DEMO_LOCATION.label });
    setBundle(null);
    setPhase('input');
    setError(null);
  }, []);

  const ready = Boolean(imageUrl && location && weather);

  const analyze = useCallback(async () => {
    if (!imageUrl || !weather) return;
    setError(null);
    setPhase('analyzing');

    // Simulate a short, perceptible analysis for the demo feel
    await new Promise((r) => setTimeout(r, 1300));

    try {
      let crop: CropAnalysisResult;
      if (demoMode) {
        crop = DEMO_CROP;
      } else if (imageFile) {
        const features = await extractImageFeatures(imageFile);
        crop = analyzeImageFeatures(features);
      } else {
        setError('Something went wrong with the image. Please upload again.');
        setPhase('input');
        return;
      }
      const b = buildAnalysisBundle(crop, weather);
      setBundle(b);
      setPhase('results');
      requestAnimationFrame(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    } catch (e) {
      setError('Analysis failed. Please try again with a different photo.');
      setPhase('input');
    }
  }, [imageUrl, imageFile, weather, demoMode]);

  const reset = useCallback(() => {
    setBundle(null);
    setPhase('input');
    resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50/40 via-white to-white text-earth-800">
      <BackgroundDecor />
      <Header demoMode={demoMode} />

      <main className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <Hero />

        {/* INPUT GRID */}
        <section className="grid gap-5 lg:grid-cols-12">
          {/* Step 1: Image */}
          <div className="lg:col-span-5">
            <Card className="h-full">
              <div className="mb-4">
                <StepBadge n={1} label="Scan your crop" />
              </div>
              <CardHeader icon={<ScanLine className="h-5 w-5" />} title="Upload a crop photo" subtitle="Leaf or whole plant, in daylight" />
              <ImageUploader imageUrl={imageUrl} onImage={handleImage} onUseDemo={loadDemo} disabled={phase === 'analyzing'} />
            </Card>
          </div>

          {/* Step 2 + 3: Location + Weather */}
          <div className="space-y-5 lg:col-span-7">
            <Card>
              <div className="mb-4">
                <StepBadge n={2} label="Your location" />
              </div>
              <CardHeader icon={<MapPin className="h-5 w-5" />} title="Where is your field?" subtitle="GPS or manual entry" />
              <LocationDetector location={location} onLocation={handleLocation} disabled={phase === 'analyzing'} />
            </Card>

            <div>
              <div className="mb-2 flex items-center gap-2">
                <StepBadge n={3} label="Weather" />
                {weather && <Badge tone={weather.source === 'live' ? 'brand' : 'amber'}>{weather.source === 'live' ? 'Live' : 'Demo'}</Badge>}
              </div>
              {weatherLoading ? (
                <Card><LoadingState label="Loading weather…" sublabel="Fetching live conditions for your location" /></Card>
              ) : weather ? (
                <WeatherDashboard weather={weather} />
              ) : (
                <Card>
                  <EmptyWeather />
                </Card>
              )}
            </div>
          </div>
        </section>

        {/* ANALYZE BUTTON */}
        <section className="mt-8">
          <div className="flex flex-col items-center gap-3 rounded-3xl border border-brand-100 bg-white/80 p-6 text-center shadow-card backdrop-blur sm:p-8">
            <div className="flex items-center gap-2 text-sm font-semibold text-brand-700">
              <Wand2 className="h-4 w-4" /> Step 4 — Run AI crop analysis
            </div>
            <h2 className="font-display text-xl font-extrabold text-earth-800 sm:text-2xl">
              Ready to turn field signals into a plan?
            </h2>
            <p className="max-w-xl text-sm text-earth-500">
              We'll combine your photo, location, and the weather forecast to produce a climate-aware crop advisory —
              with a safe action window, plain-language plan, and smart alerts.
            </p>

            {error && (
              <p className="flex items-center gap-2 rounded-2xl bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 ring-1 ring-red-200">
                <AlertTriangle className="h-4 w-4" /> {error}
              </p>
            )}

            <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
              <button onClick={analyze} disabled={!ready || phase === 'analyzing'} className="btn-primary text-base sm:px-7 sm:py-3.5">
                {phase === 'analyzing' ? (
                  <><Sparkles className="h-5 w-5 animate-spin-slow" /> Analyzing…</>
                ) : (
                  <><Wand2 className="h-5 w-5" /> Analyze Crop</>
                )}
              </button>
              {!ready && (
                <span className="text-xs text-earth-400">
                  {!imageUrl && 'Add a photo · '}
                  {!location && 'Set location · '}
                  {!weather && 'Load weather'}
                </span>
              )}
              {phase === 'results' && (
                <button onClick={reset} className="btn-ghost">
                  <RotateCcw className="h-4 w-4" /> Analyze another
                </button>
              )}
            </div>
            {demoMode && (
              <p className="mt-1 text-xs font-semibold text-amber-700">Demo mode is loaded — press Analyze to see the full result dashboard.</p>
            )}
          </div>
        </section>

        {/* RESULTS */}
        {phase === 'analyzing' && (
          <section ref={resultsRef} className="mt-8">
            <Card>
              <LoadingState label="Analyzing crop & weather…" sublabel="Reading leaf signals, checking the forecast, building your action window" />
            </Card>
          </section>
        )}

        {phase === 'results' && bundle && weather && (
          <section ref={resultsRef} className="mt-10 space-y-5 animate-fade-in">
            <ResultsHeader bundle={bundle} demoMode={demoMode} />

            <div className="grid gap-5 lg:grid-cols-12">
              <div className="lg:col-span-7 space-y-5">
                <CropAnalysis result={bundle.crop} />
                <ClimateActionWindow data={bundle.climate} />
              </div>
              <div className="lg:col-span-5 space-y-5">
                <WeatherImpactSummary bundle={bundle} weather={weather} />
                <Alerts alerts={bundle.alerts} />
                <ExpertVerification crop={bundle.crop} />
              </div>
            </div>

            <FarmActionPlan plan={bundle.plan} />
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}

/* ---------------- Sub-views ---------------- */

const Header = memo(function Header({ demoMode }: { demoMode: boolean }) {
  return (
    <header className="sticky top-0 z-30 border-b border-brand-100/70 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2.5">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white shadow-glow">
            <Leaf className="h-5 w-5" />
            <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-amber-400 ring-2 ring-white" />
          </div>
          <div className="leading-tight">
            <p className="font-display text-base font-extrabold text-earth-800">FarmGuard <span className="text-brand-600">AI</span></p>
            <p className="hidden text-[11px] text-earth-400 sm:block">AI-powered crop & climate intelligence</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {demoMode && <Badge tone="amber" icon={<Sparkles className="h-3 w-3" />}>Demo mode</Badge>}
          <Badge tone="brand" icon={<ShieldCheck className="h-3 w-3" />}>Hackathon build</Badge>
        </div>
      </div>
    </header>
  );
});

const Hero = memo(function Hero() {
  return (
    <section className="py-10 text-center sm:py-14">
      <div className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full bg-brand-50 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-brand-700 ring-1 ring-brand-100">
        <CloudSun className="h-3.5 w-3.5" /> Agriculture & Climate Resilience
      </div>
      <h1 className="font-display text-3xl font-extrabold leading-tight tracking-tight text-earth-800 text-balance sm:text-5xl">
        Know Your Crop. <br className="sm:hidden" />
        <span className="text-brand-600">Understand Your Weather.</span> Act Smarter.
      </h1>
      <p className="mx-auto mt-4 max-w-2xl text-base text-earth-500 text-balance sm:text-lg">
        FarmGuard AI turns a single field photo into weather-aware guidance — so you treat at the right time,
        not just the first time. From field signals to smarter decisions.
      </p>
    </section>
  );
});

const EmptyWeather = memo(function EmptyWeather() {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-sky2-50 text-sky2-500">
        <CloudSun className="h-6 w-6" />
      </div>
      <p className="font-display text-sm font-bold text-earth-700">Weather appears once you set a location</p>
      <p className="mt-1 text-xs text-earth-400">Live data via Open-Meteo · automatic demo fallback if offline</p>
    </div>
  );
});

const ResultsHeader = memo(function ResultsHeader({ bundle, demoMode }: { bundle: AnalysisBundle; demoMode: boolean }) {
  const overall =
    bundle.crop.severity === 'High' ? { tone: 'red' as const, label: 'High severity' } :
    bundle.crop.severity === 'Medium' ? { tone: 'amber' as const, label: 'Medium severity' } :
    { tone: 'brand' as const, label: 'Low severity / healthy' };

  return (
    <div className="flex flex-col items-start justify-between gap-3 rounded-3xl bg-gradient-to-r from-brand-600 to-brand-700 p-6 text-white shadow-card-lg sm:flex-row sm:items-center">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-brand-100">Result Dashboard</p>
        <h2 className="mt-1 font-display text-2xl font-extrabold">{bundle.crop.likelyCrop}</h2>
        <p className="mt-0.5 text-sm text-brand-100">{bundle.crop.issue}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="chip bg-white/15 text-white ring-1 ring-white/25">{overall.label}</span>
        {bundle.crop.confidence > 0 && (
          <span className="chip bg-white/15 text-white ring-1 ring-white/25">Confidence {bundle.crop.confidence}%</span>
        )}
        {demoMode && <span className="chip bg-amber-400/90 text-amber-950 ring-1 ring-amber-200">Demo scenario</span>}
      </div>
    </div>
  );
});

const WeatherImpactSummary = memo(function WeatherImpactSummary({ bundle, weather }: { bundle: AnalysisBundle; weather: WeatherData }) {
  const c = weather.current;
  const items = [
    { icon: CloudSun, label: 'Condition', value: c.condition, tint: 'text-sky2-600' },
    { icon: Wind, label: 'Wind', value: `${c.windKph} km/h`, tint: 'text-earth-500' },
    { icon: Sparkles, label: 'Humidity', value: `${c.humidity}%`, tint: 'text-sky2-600' },
  ];
  return (
    <Card>
      <CardHeader icon={<CloudSun className="h-5 w-5" />} title="Weather Impact" subtitle="Snapshot driving today's advice" />
      <div className="grid grid-cols-3 gap-2">
        {items.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="rounded-2xl bg-earth-50 p-3 text-center">
              <Icon className={`mx-auto h-5 w-5 ${s.tint}`} />
              <p className="mt-1.5 text-[10px] font-bold uppercase tracking-wide text-earth-400">{s.label}</p>
              <p className="text-sm font-bold text-earth-800">{s.value}</p>
            </div>
          );
        })}
      </div>
      <div className={`mt-3 flex items-start gap-2.5 rounded-2xl p-3.5 text-sm ${bundle.climate.favorable ? 'bg-brand-50 text-brand-800 ring-1 ring-brand-200' : 'bg-amber-50 text-amber-800 ring-1 ring-amber-200'}`}>
        {bundle.climate.favorable ? <CircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" /> : <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />}
        <p>{bundle.climate.summary}</p>
      </div>
    </Card>
  );
});

const Footer = memo(function Footer() {
  return (
    <footer className="border-t border-brand-100 bg-white/60">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
              <Leaf className="h-4 w-4" />
            </div>
            <div>
              <p className="font-display text-sm font-bold text-earth-800">FarmGuard AI</p>
              <p className="text-[11px] text-earth-400">From field signals to smarter decisions.</p>
            </div>
          </div>
          <p className="max-w-md text-center text-[11px] text-earth-400 sm:text-right">
            AI results are estimates, not a substitute for professional agronomic advice. Always follow product labels
            and local extension officer guidance. Built for the Agriculture & Climate Resilience hackathon.
          </p>
        </div>
      </div>
    </footer>
  );
});

const BackgroundDecor = memo(function BackgroundDecor() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-brand-200/40 blur-3xl" />
      <div className="absolute right-0 top-40 h-80 w-80 rounded-full bg-sky2-200/30 blur-3xl" />
      <div className="absolute inset-0 bg-grid opacity-60" />
    </div>
  );
});
