import type {
  CropAnalysisResult,
  WeatherData,
  ClimateActionWindow,
  FarmActionPlan,
  FarmAlert,
  AnalysisBundle,
  Severity,
  ActionSlot,
  WindowStatus,
  AlertLevel,
} from '@/types';

/**
 * Lightweight, deterministic "analysis" derived from image properties
 * (average color + variance + aspect). This is NOT a real ML model — it's
 * a transparent heuristic so the hackathon demo produces a plausible,
 * explainable result without an API key. The code is structured so a real
 * model (e.g. a hosted plant-disease API or on-device TFJS model) can be
 * dropped into `analyzeImage` later.
 */

interface ImageFeatures {
  avgR: number;
  avgG: number;
  avgB: number;
  greenness: number; // 0-1, how dominant green is
  brownness: number; // 0-1, brown/yellow lesions
  yellowness: number; // 0-1
  variance: number; // color variation -> texture
  width: number;
  height: number;
  hasImage: boolean;
}

export async function extractImageFeatures(file: File): Promise<ImageFeatures> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const max = 64;
      const scale = Math.min(max / img.width, max / img.height, 1);
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(url);
        return resolve(emptyFeatures(img.width, img.height));
      }
      ctx.drawImage(img, 0, 0, w, h);
      let { data } = ctx.getImageData(0, 0, w, h);
      let r = 0, g = 0, b = 0, count = 0;
      let brownPixels = 0, yellowPixels = 0, greenPixels = 0;
      const lumas: number[] = [];
      for (let i = 0; i < data.length; i += 4) {
        const R = data[i], G = data[i + 1], B = data[i + 2];
        r += R; g += G; b += B; count++;
        lumas.push(0.299 * R + 0.587 * G + 0.114 * B);
        if (G > R + 12 && G > B + 12) greenPixels++;
        if (R > 90 && G > 70 && B < 90 && R > G) brownPixels++;
        if (R > 180 && G > 160 && B < 140) yellowPixels++;
      }
      const avgR = r / count, avgG = g / count, avgB = b / count;
      const meanLuma = lumas.reduce((a, x) => a + x, 0) / lumas.length;
      const variance = lumas.reduce((a, x) => a + (x - meanLuma) ** 2, 0) / lumas.length;
      URL.revokeObjectURL(url);
      resolve({
        avgR, avgG, avgB,
        greenness: greenPixels / count,
        brownness: brownPixels / count,
        yellowness: yellowPixels / count,
        variance,
        width: img.width,
        height: img.height,
        hasImage: true,
      });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(emptyFeatures(0, 0));
    };
    img.src = url;
  });
}

function emptyFeatures(w: number, h: number): ImageFeatures {
  return { avgR: 0, avgG: 0, avgB: 0, greenness: 0, brownness: 0, yellowness: 0, variance: 0, width: w, height: h, hasImage: false };
}

/** Heuristic analysis from image features. Replace with a real model call when available. */
export function analyzeImageFeatures(f: ImageFeatures): CropAnalysisResult {
  if (!f.hasImage || (f.width < 80 && f.height < 80)) {
    return unclearResult('The image is too small or could not be read. Please upload a clearer, closer photo of the leaf in good light.');
  }

  const imageQuality: 'good' | 'fair' | 'poor' =
    f.width >= 600 && f.height >= 400 ? 'good' : f.width >= 200 && f.height >= 150 ? 'fair' : 'poor';

  if (imageQuality === 'poor') {
    return unclearResult('The image resolution is low. For a reliable read, upload a sharp photo taken 15–30 cm from the leaf, in daylight.');
  }

  const green = f.greenness;
  const brown = f.brownness;
  const yellow = f.yellowness;
  const texture = f.variance;

  // Healthy, mostly green, low discoloration
  if (green > 0.5 && brown < 0.05 && yellow < 0.05) {
    return {
      likelyCrop: greenishCropName(f),
      issue: 'No significant disease signature detected',
      issueType: 'healthy',
      confidence: Math.round(58 + green * 25),
      symptoms: ['Foliage appears uniformly green', 'No prominent lesions or yellowing detected in the sample'],
      contributingFactors: ['Good leaf coloration suggests adequate nutrition and water', 'Low visible stress markers'],
      severity: 'Low',
      expertVerificationRecommended: false,
      note: 'AI did not detect clear disease markers, but a single photo cannot rule out early-stage issues. Keep monitoring weekly.',
      imageQuality,
    };
  }

  // Brown lesions -> likely fungal leaf disease
  if (brown > 0.06) {
    const sev: Severity = brown > 0.18 ? 'High' : brown > 0.1 ? 'Medium' : 'Low';
    return {
      likelyCrop: cropNameFromHue(f),
      issue: brown > 0.15 ? 'Probable fungal leaf blight (e.g. Early blight / Alternaria)' : 'Possible fungal leaf spot',
      issueType: 'disease',
      confidence: Math.round(60 + Math.min(brown * 120, 25)),
      symptoms: [
        'Dark brown to black lesions visible on leaf surface',
        yellow > 0.05 ? 'Yellowing (chlorosis) around affected areas' : 'Localized discoloration',
        brown > 0.15 ? 'Lesions appear to have concentric rings or expanding edges' : 'Scattered small spots',
        'Affected areas concentrated on older/lower foliage',
      ],
      contributingFactors: [
        'High humidity and leaf wetness encourage fungal spore germination',
        'Recent or upcoming rainfall increases spread risk',
        'Dense canopy may limit air circulation',
      ],
      severity: sev,
      expertVerificationRecommended: sev !== 'Low' || imageQuality !== 'good',
      note: 'This is an AI-assisted estimate, not a laboratory diagnosis. Several leaf diseases look similar (Early blight, Septoria, bacterial spot). Confirm with a local agronomist before treatment.',
      imageQuality,
    };
  }

  // Yellowing dominant -> nutrient stress or early disease
  if (yellow > 0.08) {
    return {
      likelyCrop: cropNameFromHue(f),
      issue: 'Possible nutrient stress or early chlorosis',
      issueType: 'stress',
      confidence: Math.round(54 + Math.min(yellow * 90, 22)),
      symptoms: ['Generalised yellowing of leaf tissue', 'Green veins may still be visible', 'No dark lesions detected'],
      contributingFactors: ['Possible nitrogen or magnesium deficiency', 'Waterlogging or irregular watering can cause chlorosis', 'High heat or bright sun can bleach young leaves'],
      severity: yellow > 0.2 ? 'Medium' : 'Low',
      expertVerificationRecommended: yellow > 0.2,
      note: 'Yellowing has many causes. A soil test and a closer expert look are recommended before any fertilizer application.',
      imageQuality,
    };
  }

  // Some texture but no strong signature
  return {
    likelyCrop: greenishCropName(f),
    issue: 'Mild stress signatures present — not enough to identify a specific disease',
    issueType: 'stress',
    confidence: Math.round(48 + Math.min(texture / 6, 18)),
    symptoms: ['Leaf color is slightly uneven', 'No clear lesion pattern detected'],
    contributingFactors: ['Possible early stress from water, heat, or minor pest activity', 'Image may not show the affected area clearly'],
    severity: 'Low',
    expertVerificationRecommended: false,
    note: 'The AI could not confidently identify a specific issue from this photo. If you see a problem in the field, upload a closer, well-lit image of the affected leaf.',
    imageQuality,
  };
}

function unclearResult(message: string): CropAnalysisResult {
  return {
    likelyCrop: 'Unconfirmed',
    issue: 'Image not clear enough for analysis',
    issueType: 'unknown',
    confidence: 0,
    symptoms: [],
    contributingFactors: [],
    severity: 'Low',
    expertVerificationRecommended: true,
    note: message,
    imageQuality: 'poor',
  };
}

function greenishCropName(f: ImageFeatures): string {
  const cool = f.avgG > f.avgR + 40 && f.avgG > f.avgB + 30;
  return cool ? 'Leafy vegetable / broadleaf crop' : 'Green foliage crop';
}

function cropNameFromHue(f: ImageFeatures): string {
  if (f.avgR > f.avgG && f.brownness > 0.1) return 'Tomato or solanaceous crop (probable)';
  if (f.avgG > f.avgR + 20) return 'Cucurbit or broadleaf vegetable';
  return 'Broadleaf crop';
}

// ---------------- Climate + plan + alerts synthesis ----------------

export function buildAnalysisBundle(crop: CropAnalysisResult, weather: WeatherData): AnalysisBundle {
  const climate = buildClimateWindow(crop, weather);
  const plan = buildActionPlan(crop, weather);
  const alerts = buildAlerts(crop, weather);
  return { crop, climate, plan, alerts, generatedAt: new Date().toISOString() };
}

function buildClimateWindow(crop: CropAnalysisResult, weather: WeatherData): ClimateActionWindow {
  if (crop.issueType === 'unknown' || crop.confidence === 0) {
    return {
      weatherImpact: 'No reliable crop reading is available, so weather cannot be matched to a specific issue yet. Please upload a clearer image to unlock climate-aware guidance.',
      favorable: false,
      summary: 'Awaiting a clear crop image before recommending any field action.',
      timeline: [
        { label: 'NOW', range: 'Next 2 hours', status: 'wait', detail: 'No action until the crop is identified.' },
        { label: 'NEXT 6 HOURS', range: 'Hours 2–6', status: 'wait', detail: 'Use this time to capture a better photo.' },
        { label: 'TOMORROW', range: 'Day 2', status: 'monitor', detail: 'Inspect field for obvious damage after any overnight rain.' },
        { label: 'NEXT 3 DAYS', range: 'Days 3–5', status: 'monitor', detail: 'Keep observing and re-scan with a clearer image.' },
      ],
      reasoning: 'Climate guidance only makes sense once we know what we are looking at. Clearer input first, then weather-aware timing.',
      productSafetyNote: 'Never apply crop-protection products without a confirmed diagnosis and label guidance.',
    };
  }

  const today = weather.forecast[0];
  const tomorrow = weather.forecast[1] ?? today;
  const d3 = weather.forecast[2] ?? tomorrow;
  const d4 = weather.forecast[3] ?? d3;
  const d5 = weather.forecast[4] ?? d4;
  const rainSoon = tomorrow.rainProb >= 60 || today.rainProb >= 60;
  const wetStreak = [tomorrow, d3, d4].filter((d) => d.rainProb >= 60).length;
  const dryDay = weather.forecast.find((d) => d.rainProb <= 35);
  const humidNow = weather.current.humidity >= 70;
  const fungalRisk = crop.issueType === 'disease' && (humidNow || rainSoon);

  const weatherImpact = fungalRisk
    ? `Humidity is ${weather.current.humidity}% ${rainSoon ? 'and rain is expected soon' : ''}. These are exactly the conditions that spread fungal leaf diseases — spores need wet leaves for several hours to infect. Acting at the wrong time (spraying right before rain) wastes product and increases runoff.`
    : crop.issueType === 'healthy'
      ? `Current weather (${weather.current.condition}, ${weather.current.tempC}°C) is not raising red flags for the detected foliage. Keep an eye on the forecast for sudden heat or prolonged wet spells.`
      : `Weather over the next few days may influence the detected stress. ${rainSoon ? 'Rain is expected soon — avoid any spray until it passes.' : 'Conditions are relatively stable for routine inspection.'}`;

  const favorable = !rainSoon && weather.current.rainProb < 50;

  const timeline: ActionSlot[] = [
    {
      label: 'NOW',
      range: 'Next 2 hours',
      status: weather.current.rainProb >= 60 ? 'wait' : weather.current.rainProb >= 35 ? 'monitor' : 'good',
      detail: weather.current.rainProb >= 60
        ? 'Rain likely now — stay out of the field and do not spray.'
        : weather.current.rainProb >= 35
          ? 'Dry but rain building — good for a quick inspection, not for spraying.'
          : 'Dry and workable — safe to inspect and do sanitation work.',
    },
    {
      label: 'NEXT 6 HOURS',
      range: 'Hours 2–6',
      status: today.rainProb >= 60 ? 'wait' : today.rainProb >= 35 ? 'monitor' : 'good',
      detail: today.rainProb >= 60
        ? `Rain probability ${today.rainProb}%. Hold all spraying — product would wash off.`
        : today.rainProb >= 35
          ? 'Increasing rain chance. Finish any inspection early.'
          : 'Low rain chance — a reasonable window for inspection and light field work.',
    },
    {
      label: 'TOMORROW',
      range: dayLabel(tomorrow),
      status: tomorrow.rainProb >= 60 ? 'wait' : tomorrow.rainProb >= 35 ? 'monitor' : 'good',
      detail: tomorrow.rainProb >= 60
        ? `${tomorrow.rainProb}% rain, humidity ${tomorrow.humidity}%. Too wet for spraying fungal issues.`
        : tomorrow.rainProb >= 35
          ? 'Marginal conditions — monitor but do not commit to treatment.'
          : 'Looks dry enough to consider a protective spray after expert confirmation.',
    },
    {
      label: 'NEXT 3 DAYS',
      range: `${d3.dayName}–${d5.dayName}`,
      status: wetStreak >= 2 ? 'wait' : dryDay ? 'monitor' : 'good',
      detail: wetStreak >= 2
        ? `${wetStreak} wet days ahead. Wait for a dry break ${dryDay ? `around ${dryDay.dayName}` : 'later'} before treating.`
        : dryDay
          ? `Best spray window appears around ${dryDay.dayName} (rain ${dryDay.rainProb}%). Confirm with an expert first.`
          : 'Mostly dry stretch — suitable for follow-up inspection and, if advised, treatment.',
    },
  ];

  const reasoning = fungalRisk
    ? 'Fungal leaf diseases spread fastest when leaves stay wet for 6+ hours at warm temperatures. With rain in the forecast, the priority is sanitation (removing infected leaves) and monitoring — not spraying. Spraying just before rain is the single most common mistake and wastes money.'
    : crop.issueType === 'healthy'
      ? 'No urgent weather-crop conflict detected. The timeline below shows when routine inspection and care are most comfortable.'
      : 'Stress issues often need observation over action. Use dry windows to inspect and rule out causes before intervening.';

  return {
    weatherImpact,
    favorable,
    summary: favorable
      ? 'Conditions are currently workable for inspection and light field care.'
      : rainSoon
        ? 'Rain is expected soon — prioritise inspection and sanitation now, hold any spraying until a dry window.'
        : 'Mixed conditions — monitor closely and time any action around the dry windows below.',
    timeline,
    reasoning,
    productSafetyNote:
      'For any crop-protection product, always follow the product label rate, pre-harvest interval, and local agricultural extension officer guidance. Do not mix pesticides on your own or exceed label dosage — this app will never recommend specific chemical doses.',
  };
}

function buildActionPlan(crop: CropAnalysisResult, weather: WeatherData): FarmActionPlan {
  if (crop.issueType === 'unknown' || crop.confidence === 0) {
    return {
      checkNow: ['Re-capture a sharper, closer photo of the affected leaf in good light'],
      doNow: ['Do not apply any treatment until the issue is confirmed'],
      monitor: ['Observe whether discoloration spreads over the next 2 days'],
      nextCheck: 'Re-scan with a clearer image as soon as possible.',
      expertContact: 'If the problem is visibly worsening, contact your local agricultural extension officer with a sample.',
    };
  }

  const rainSoon = (weather.forecast[1]?.rainProb ?? 0) >= 60 || weather.current.rainProb >= 60;

  if (crop.issueType === 'healthy') {
    return {
      checkNow: ['Walk the field and confirm foliage looks as healthy in person as in the photo', 'Check underside of random lower leaves for early pests'],
      doNow: ['Maintain current irrigation and nutrition routine', 'Keep records of today\'s field condition as a baseline'],
      monitor: ['Watch the 5-day forecast for heat spikes or prolonged rain', 'Re-scan if you notice new yellowing or spots'],
      nextCheck: 'Re-inspect in 5–7 days, or sooner if weather turns.',
      expertContact: 'No expert visit needed now, but keep your extension officer\'s contact handy.',
    };
  }

  const checkNow = [
    'Tag plants showing the symptoms you see in the photo',
    'Inspect 10 random plants per row, focusing on lower leaves first',
    'Estimate what percentage of leaves show symptoms',
  ];
  const doNow = crop.issueType === 'disease'
    ? [
        'Remove and destroy (do not compost) heavily infected lower leaves to reduce spore load',
        rainSoon ? 'Avoid overhead irrigation while rain is expected' : 'Water at the base, not on leaves, to keep foliage dry',
        'Space out or tie up touching branches so leaves dry faster',
      ]
    : crop.issueType === 'pest'
      ? ['Hand-pick visible pests if the infestation is small', 'Check for pest eggs on leaf undersides', 'Encourage natural predators (ladybirds, lacewings) where possible']
      : ['Check soil moisture — both waterlogging and dryness cause yellowing', 'Look for patterns: whole plant vs. single branch yellowing', 'Avoid fertiliser guessing — get a soil test first'];

  const monitor = [
    'Track whether symptoms spread from lower leaves upward',
    'Compare lesion count today vs. in 3 days',
    `Log daily rainfall and humidity from the weather card (now ${weather.current.humidity}% humidity)`,
  ];

  const nextCheck = rainSoon
    ? 'Re-inspect in 2 days, after the rain passes and leaves have dried.'
    : 'Re-inspect in 3 days. If symptoms are spreading fast, move to expert contact sooner.';

  const expertContact =
    crop.expertVerificationRecommended
      ? 'Contact your local agricultural extension officer (e.g. Krishi Vigyan Kendra) before any spray. Bring tagged leaf samples in a dry paper bag.'
      : 'If symptoms worsen or you are unsure, contact your local agricultural extension officer with a sample.';

  return { checkNow, doNow, monitor, nextCheck, expertContact };
}

function buildAlerts(crop: CropAnalysisResult, weather: WeatherData): FarmAlert[] {
  const alerts: FarmAlert[] = [];
  const today = weather.forecast[0];
  const tomorrow = weather.forecast[1] ?? today;

  if (tomorrow.rainProb >= 60 || weather.current.rainProb >= 60) {
    alerts.push({ id: 'rain-soon', level: 'warning', title: 'Rain expected soon', detail: `Rain probability ${Math.max(tomorrow.rainProb, weather.current.rainProb)}%. Hold any field spraying to avoid wash-off.` });
  }
  if (weather.current.humidity >= 75) {
    const fungal = crop.issueType === 'disease';
    alerts.push({
      id: 'humidity-risk',
      level: fungal ? 'danger' : 'warning',
      title: fungal ? 'High humidity raises disease spread risk' : 'High humidity',
      detail: `Humidity is ${weather.current.humidity}%, ${fungal ? 'ideal for fungal spore spread of the detected issue.' : 'which can encourage fungal diseases — keep foliage dry.'}`,
    });
  }
  if (crop.confidence > 0 && crop.confidence < 65) {
    alerts.push({ id: 'low-confidence', level: 'warning', title: 'Image confidence is low', detail: `AI confidence is ${crop.confidence}%. Upload a sharper, closer photo for a better read.` });
  }
  if (crop.imageQuality === 'poor') {
    alerts.push({ id: 'poor-image', level: 'warning', title: 'Low-quality image', detail: 'Photo is too small or unclear. Re-capture 15–30 cm from the leaf in daylight.' });
  }
  if (crop.expertVerificationRecommended) {
    alerts.push({ id: 'expert-rec', level: 'info', title: 'Expert verification recommended', detail: 'AI results are estimates. Confirm with a local agronomist before treatment.' });
  }
  if (weather.current.rainProb < 35 && tomorrow.rainProb < 50) {
    alerts.push({ id: 'inspect-window', level: 'success', title: 'Conditions suitable for inspection', detail: 'Low rain chance now — a good time to walk the field and tag affected plants.' });
  }
  if (crop.issueType === 'healthy') {
    alerts.push({ id: 'healthy', level: 'success', title: 'No significant disease detected', detail: 'Foliage looks healthy. Keep weekly monitoring.' });
  }
  if (crop.severity === 'High') {
    alerts.push({ id: 'severity-high', level: 'danger', title: 'High severity flagged', detail: 'Act promptly on sanitation and contact an expert — do not wait for the next routine check.' });
  }
  return alerts;
}

function dayLabel(d: { dayName: string }): string {
  return d.dayName === 'Today' ? 'Tomorrow' : d.dayName;
}
