import { describe, it, expect } from 'vitest';
import { analyzeImageFeatures, buildAnalysisBundle } from '@/lib/analysis';
import type { CropAnalysisResult, WeatherData } from '@/types';

function features(overrides: Partial<ReturnType<typeof emptyFeatures>> = {}) {
  return { ...emptyFeatures(), ...overrides };
}
function emptyFeatures() {
  return {
    avgR: 0, avgG: 0, avgB: 0,
    greenness: 0, brownness: 0, yellowness: 0,
    variance: 0, width: 0, height: 0, hasImage: false,
  };
}

const baseWeather: WeatherData = {
  source: 'demo',
  locationName: 'Testville',
  current: {
    tempC: 25, feelsLikeC: 26, humidity: 80, rainProb: 70, windKph: 12,
    windDir: 'SW', condition: 'Rain', conditionCode: 'rain', uvIndex: 3,
    pressureHpa: 1010, isDay: true, observedAt: '2026-01-01T00:00:00Z',
  },
  forecast: [
    { date: '2026-01-01', dayName: 'Today', condition: 'Rain', conditionCode: 'rain', tempMaxC: 25, tempMinC: 18, rainProb: 70, humidity: 80, windKph: 12 },
    { date: '2026-01-02', dayName: 'Fri', condition: 'Rain', conditionCode: 'rain', tempMaxC: 24, tempMinC: 18, rainProb: 75, humidity: 85, windKph: 14 },
    { date: '2026-01-03', dayName: 'Sat', condition: 'Rain', conditionCode: 'rain', tempMaxC: 23, tempMinC: 17, rainProb: 80, humidity: 88, windKph: 16 },
    { date: '2026-01-04', dayName: 'Sun', condition: 'Rain', conditionCode: 'rain', tempMaxC: 23, tempMinC: 17, rainProb: 78, humidity: 84, windKph: 14 },
    { date: '2026-01-05', dayName: 'Mon', condition: 'Clear', conditionCode: 'clear', tempMaxC: 27, tempMinC: 18, rainProb: 20, humidity: 60, windKph: 10 },
  ],
};

describe('analyzeImageFeatures — image quality gating', () => {
  it('flags an image with no data as unknown', () => {
    const r = analyzeImageFeatures(features({ hasImage: false }));
    expect(r.issueType).toBe('unknown');
    expect(r.confidence).toBe(0);
    expect(r.expertVerificationRecommended).toBe(true);
    expect(r.likelyCrop).toBe('Unconfirmed');
  });

  it('flags a tiny image (<80px both dims) as unknown', () => {
    const r = analyzeImageFeatures(features({ hasImage: true, width: 50, height: 50 }));
    expect(r.issueType).toBe('unknown');
    expect(r.imageQuality).toBe('poor');
    expect(r.note).toMatch(/too small/i);
  });

  it('flags a low-resolution fair image as poor/unknown', () => {
    // 150x150 passes the <80 both-dims check but fails the fair threshold (needs >=200x150)
    const r = analyzeImageFeatures(features({ hasImage: true, width: 150, height: 150 }));
    expect(r.imageQuality).toBe('poor');
    expect(r.issueType).toBe('unknown');
  });
});

describe('analyzeImageFeatures — healthy crop', () => {
  it('classifies a green, low-discoloration image as healthy', () => {
    const r = analyzeImageFeatures(features({
      hasImage: true, width: 800, height: 600,
      greenness: 0.7, brownness: 0.01, yellowness: 0.01,
      avgR: 60, avgG: 140, avgB: 70,
    }));
    expect(r.issueType).toBe('healthy');
    expect(r.severity).toBe('Low');
    expect(r.expertVerificationRecommended).toBe(false);
    expect(r.confidence).toBeGreaterThan(58);
  });
});

describe('analyzeImageFeatures — disease detection', () => {
  it('classifies brown lesions as disease and scales severity', () => {
    const r = analyzeImageFeatures(features({
      hasImage: true, width: 800, height: 600,
      greenness: 0.3, brownness: 0.2, yellowness: 0.1,
      avgR: 120, avgG: 90, avgB: 60,
    }));
    expect(r.issueType).toBe('disease');
    expect(r.severity).toBe('High');
    expect(r.expertVerificationRecommended).toBe(true);
    expect(r.symptoms.length).toBeGreaterThan(0);
  });

  it('keeps severity Low for minor brownness', () => {
    const r = analyzeImageFeatures(features({
      hasImage: true, width: 800, height: 600,
      greenness: 0.4, brownness: 0.07, yellowness: 0.02,
      avgR: 90, avgG: 110, avgB: 70,
    }));
    expect(r.issueType).toBe('disease');
    expect(r.severity).toBe('Low');
  });
});

describe('analyzeImageFeatures — stress / yellowing', () => {
  it('classifies dominant yellowing as stress', () => {
    const r = analyzeImageFeatures(features({
      hasImage: true, width: 700, height: 500,
      greenness: 0.2, brownness: 0.02, yellowness: 0.25,
      avgR: 200, avgG: 180, avgB: 100,
    }));
    expect(r.issueType).toBe('stress');
    expect(r.severity).toBe('Medium');
    expect(r.expertVerificationRecommended).toBe(true);
  });
});

describe('analyzeImageFeatures — ambiguous fallback', () => {
  it('returns a mild stress result when no strong signature is present', () => {
    const r = analyzeImageFeatures(features({
      hasImage: true, width: 700, height: 500,
      greenness: 0.3, brownness: 0.02, yellowness: 0.02,
      avgR: 100, avgG: 120, avgB: 90, variance: 30,
    }));
    expect(r.issueType).toBe('stress');
    expect(r.confidence).toBeLessThan(70);
  });
});

describe('buildAnalysisBundle — unknown crop', () => {
  const unknownCrop: CropAnalysisResult = {
    likelyCrop: 'Unconfirmed', issue: 'Image not clear enough for analysis',
    issueType: 'unknown', confidence: 0, symptoms: [], contributingFactors: [],
    severity: 'Low', expertVerificationRecommended: true, note: 'x', imageQuality: 'poor',
  };

  it('produces a wait-dominant timeline for unknown crops', () => {
    const b = buildAnalysisBundle(unknownCrop, baseWeather);
    expect(b.crop).toBe(unknownCrop);
    expect(b.climate.favorable).toBe(false);
    const statuses = b.climate.timeline.map((t) => t.status);
    expect(statuses).toContain('wait');
    expect(b.plan.doNow).toContain('Do not apply any treatment until the issue is confirmed');
  });
});

describe('buildAnalysisBundle — disease + wet weather', () => {
  const diseaseCrop: CropAnalysisResult = {
    likelyCrop: 'Tomato', issue: 'Early blight', issueType: 'disease', confidence: 70,
    symptoms: ['lesions'], contributingFactors: ['humidity'], severity: 'Medium',
    expertVerificationRecommended: true, note: 'estimate', imageQuality: 'good',
  };

  it('marks conditions unfavourable when rain is imminent', () => {
    const b = buildAnalysisBundle(diseaseCrop, baseWeather);
    expect(b.climate.favorable).toBe(false);
    expect(b.climate.timeline.length).toBe(4);
    // Now slot should be 'wait' because current rainProb (70) >= 60
    expect(b.climate.timeline[0].status).toBe('wait');
  });

  it('always includes the product-label safety note with no chemical doses', () => {
    const b = buildAnalysisBundle(diseaseCrop, baseWeather);
    expect(b.climate.productSafetyNote).toMatch(/product label/i);
    expect(b.climate.productSafetyNote).toMatch(/extension officer/i);
    expect(b.climate.productSafetyNote.toLowerCase()).not.toContain('ml per');
  });

  it('emits a rain alert and humidity alert for wet conditions', () => {
    const b = buildAnalysisBundle(diseaseCrop, baseWeather);
    const ids = b.alerts.map((a) => a.id);
    expect(ids).toContain('rain-soon');
    expect(ids).toContain('humidity-risk');
    // humidity alert should be danger because issueType is disease
    const hum = b.alerts.find((a) => a.id === 'humidity-risk')!;
    expect(hum.level).toBe('danger');
  });

  it('recommends removing infected leaves in the action plan for disease', () => {
    const b = buildAnalysisBundle(diseaseCrop, baseWeather);
    expect(b.plan.doNow.some((s) => /destroy/i.test(s))).toBe(true);
    expect(b.plan.checkNow.length).toBeGreaterThan(0);
    expect(b.plan.nextCheck.length).toBeGreaterThan(0);
  });
});

describe('buildAnalysisBundle — healthy crop + dry weather', () => {
  const healthyCrop: CropAnalysisResult = {
    likelyCrop: 'Maize', issue: 'No significant disease', issueType: 'healthy',
    confidence: 80, symptoms: [], contributingFactors: [], severity: 'Low',
    expertVerificationRecommended: false, note: 'ok', imageQuality: 'good',
  };
  const dryWeather: WeatherData = {
    ...baseWeather,
    current: { ...baseWeather.current, rainProb: 10, humidity: 50 },
    forecast: baseWeather.forecast.map((d) => ({ ...d, rainProb: 15, humidity: 55 })),
  };

  it('marks conditions favourable when dry', () => {
    const b = buildAnalysisBundle(healthyCrop, dryWeather);
    expect(b.climate.favorable).toBe(true);
  });

  it('emits a healthy alert and an inspection-window alert', () => {
    const b = buildAnalysisBundle(healthyCrop, dryWeather);
    const ids = b.alerts.map((a) => a.id);
    expect(ids).toContain('healthy');
    expect(ids).toContain('inspect-window');
  });

  it('does not emit rain or humidity alerts when dry', () => {
    const b = buildAnalysisBundle(healthyCrop, dryWeather);
    const ids = b.alerts.map((a) => a.id);
    expect(ids).not.toContain('rain-soon');
    expect(ids).not.toContain('humidity-risk');
  });
});

describe('buildAnalysisBundle — severity-high alert', () => {
  it('emits a high-severity danger alert', () => {
    const highCrop: CropAnalysisResult = {
      likelyCrop: 'Tomato', issue: 'Severe blight', issueType: 'disease', confidence: 85,
      symptoms: ['x'], contributingFactors: ['y'], severity: 'High',
      expertVerificationRecommended: true, note: 'n', imageQuality: 'good',
    };
    const b = buildAnalysisBundle(highCrop, baseWeather);
    const sev = b.alerts.find((a) => a.id === 'severity-high');
    expect(sev).toBeDefined();
    expect(sev!.level).toBe('danger');
  });
});
