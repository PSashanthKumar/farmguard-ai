import type {
  WeatherData,
  GeoLocation,
  CropAnalysisResult,
  ClimateActionWindow,
  FarmActionPlan,
  FarmAlert,
  AnalysisBundle,
} from '@/types';

export const DEMO_LOCATION: GeoLocation = {
  lat: 18.5204,
  lng: 73.8567,
  label: 'Pune, Maharashtra, India',
  source: 'manual',
};

export const DEMO_WEATHER: WeatherData = {
  source: 'demo',
  locationName: 'Pune, Maharashtra, India',
  current: {
    tempC: 28,
    feelsLikeC: 31,
    humidity: 78,
    rainProb: 65,
    windKph: 14,
    windDir: 'SW',
    condition: 'Partly cloudy',
    conditionCode: 'partly-cloudy',
    uvIndex: 7,
    pressureHpa: 1006,
    isDay: true,
    observedAt: new Date().toISOString(),
  },
  forecast: [
    { date: addDay(0), dayName: 'Today', condition: 'Partly cloudy', conditionCode: 'partly-cloudy', tempMaxC: 29, tempMinC: 22, rainProb: 65, humidity: 78, windKph: 14 },
    { date: addDay(1), dayName: dayNameOf(addDay(1)), condition: 'Light rain', conditionCode: 'rain', tempMaxC: 26, tempMinC: 21, rainProb: 82, humidity: 86, windKph: 18 },
    { date: addDay(2), dayName: dayNameOf(addDay(2)), condition: 'Rain', conditionCode: 'rain', tempMaxC: 25, tempMinC: 21, rainProb: 90, humidity: 90, windKph: 20 },
    { date: addDay(3), dayName: dayNameOf(addDay(3)), condition: 'Thunderstorm', conditionCode: 'storm', tempMaxC: 24, tempMinC: 20, rainProb: 88, humidity: 88, windKph: 24 },
    { date: addDay(4), dayName: dayNameOf(addDay(4)), condition: 'Mainly clear', conditionCode: 'mostly-clear', tempMaxC: 28, tempMinC: 21, rainProb: 30, humidity: 70, windKph: 12 },
  ],
};

function addDay(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}
function dayNameOf(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { weekday: 'short' });
}

// Demo crop image (tomato leaf with early blight-like lesions)
export const DEMO_IMAGE_URL =
  'https://images.pexels.com/photos/5210035/pexels-photo-5210035.jpeg?auto=compress&cs=tinysrgb&w=900';

export const DEMO_CROP: CropAnalysisResult = {
  likelyCrop: 'Tomato (Solanum lycopersicum)',
  issue: 'Early blight (Alternaria solani) — probable',
  issueType: 'disease',
  confidence: 72,
  symptoms: [
    'Dark brown to black concentric ring lesions on older leaves',
    'Yellowing (chlorosis) surrounding the lesion sites',
    'Lesions concentrated on lower, older foliage',
    'Mild leaf curling at affected edges',
  ],
  contributingFactors: [
    'Prolonged high humidity (78%) favours Alternaria spore germination',
    'Recent rainfall keeps leaf wetness high, accelerating infection',
    'Dense canopy limiting air flow around lower leaves',
  ],
  severity: 'Medium',
  expertVerificationRecommended: true,
  note: 'This is an AI-assisted estimate, not a laboratory diagnosis. Symptoms overlap with Septoria leaf spot and nutrient stress — confirm with a local agronomist before any treatment.',
  imageQuality: 'good',
};

export function buildDemoBundle(weather: WeatherData): AnalysisBundle {
  const crop = DEMO_CROP;
  const climate: ClimateActionWindow = {
    weatherImpact:
      'The next 48 hours bring rising rain probability (82–90%) and humidity above 85%. Wet leaves persist for long periods, which strongly favours spread of Alternaria spores. Spraying during or just before rain is wasteful and risks runoff.',
    favorable: false,
    summary:
      'Conditions are currently unfavourable for field spraying. A short dry inspection window opens today before rain arrives; a better treatment window appears around day 5.',
    timeline: [
      { label: 'NOW', range: 'Next 2 hours', status: 'monitor', detail: 'Humidity high, rain building. Inspect lower leaves and mark affected plants, but hold any spray.' },
      { label: 'NEXT 6 HOURS', range: 'Hours 2–6', status: 'wait', detail: 'Rain probability climbs to 65%+. Avoid spraying — product will wash off before it can work.' },
      { label: 'TOMORROW', range: 'Day 2', status: 'wait', detail: '82% rain, humidity 86%. Leaf wetness too high for safe application.' },
      { label: 'NEXT 3 DAYS', range: 'Days 3–5', status: 'monitor', detail: 'Storms on day 3–4, then clearing. Wait for the dry break on day 5 before considering a protective spray.' },
    ],
    reasoning:
      'Fungal leaf diseases spread fastest when leaves stay wet for 6+ hours at warm temperatures. The forecast shows two wet days ahead, so the priority now is sanitation and monitoring — not chemical action. Once rainfall drops (day 5, rain ~30%), a protective spray has a real chance to dry on the leaf and work.',
    productSafetyNote:
      'For any crop-protection product, always follow the product label rate, pre-harvest interval, and local agricultural extension officer guidance. Do not mix pesticides on your own or exceed label dosage — this app will never recommend specific chemical doses.',
  };

  const plan: FarmActionPlan = {
    checkNow: [
      'Walk the field and tag plants showing concentric ring lesions',
      'Check the lowest 2–3 leaves on 10 random plants per row',
      'Note how many plants show yellowing vs. dark lesions',
    ],
    doNow: [
      'Remove and destroy (do not compost) heavily infected lower leaves to reduce spore load',
      'Improve air circulation: avoid overhead irrigation while rain is expected',
      'Stake or tie up touching branches so leaves dry faster after rain',
    ],
    monitor: [
      'Track spread from lower leaves upward — Early blight usually starts at the bottom',
      'Watch for lesion enlargement or new rings over the next 3 days',
      'Record daily rainfall and humidity from the weather card',
    ],
    nextCheck: 'Re-inspect in 2 days, ideally in the morning after leaves have dried.',
    expertContact:
      'Contact your local Krishi Vigyan Kendra / agricultural extension officer before spraying, especially because symptoms can resemble Septoria leaf spot. Bring tagged leaf samples in a paper bag.',
  };

  const alerts: FarmAlert[] = [
    { id: 'rain-soon', level: 'warning', title: 'Rain expected within 24 hours', detail: 'Tomorrow shows 82% rain probability. Hold any field spraying to avoid wash-off.' },
    { id: 'humidity-risk', level: 'danger', title: 'High humidity raises disease risk', detail: 'Humidity 78% now, rising to 90% over the next 2 days — ideal for fungal spread.' },
    { id: 'inspect-window', level: 'success', title: 'Brief inspection window now', detail: 'Leaves are currently visible and rain has not started — good time to tag affected plants.' },
    { id: 'expert-rec', level: 'info', title: 'Expert verification recommended', detail: 'AI confidence is 72% and symptoms overlap with other leaf diseases. Confirm with an agronomist.' },
  ];

  return { crop, climate, plan, alerts, generatedAt: new Date().toISOString() };
}
