# FarmGuard AI

> **From Field Signals to Smarter Decisions.**
> AI-powered crop & climate intelligence for smallholder and commercial farmers.

FarmGuard AI is a real-time bridge between raw field conditions and practical agricultural guidance. A farmer uploads a photo of a crop leaf, shares their location, and the app combines that with live weather data to produce a **climate-aware crop advisory** — not just a disease label, but *when* to act, *when* to wait, and *what* to watch.

Built for the **Agriculture & Climate Resilience** hackathon.

---

## Problem

Farmers face two problems that existing crop-scanning apps solve separately, if at all:

1. **"What is wrong with my crop?"** — most AI disease detectors stop at a label and a confidence score.
2. **"When should I do something about it?"** — weather is rarely factored in, so advice like "apply a fungicide" can lead a farmer to spray right before rain, wasting money and increasing chemical runoff.

The gap between *diagnosis* and *timely, safe action* is where most crop loss happens.

## Solution

FarmGuard AI treats the photo, the location, and the weather forecast as a **single signal** and returns:

- A transparent AI crop analysis (likely crop, possible issue, confidence, severity, symptoms)
- A **Climate-Aware Action Window** — a NOW → NEXT 6 HOURS → TOMORROW → NEXT 3 DAYS timeline labelled GOOD WINDOW / WAIT / MONITOR, with reasoning
- A plain-language **Farm Action Plan** (check, do, monitor, re-check, contact expert)
- **FarmGuard Alerts** prioritised by severity (rain soon, high humidity, low confidence, etc.)
- An **Expert Verification** panel that routes the farmer to local extension services when confidence is low or symptoms are ambiguous

The app **never** presents an uncertain AI result as a guaranteed diagnosis, gives no pesticide mixing instructions or unverified dosages, and always directs farmers to the product label and local agricultural experts.

## Key features

- **Scan Your Crop** — drag-and-drop upload with preview, replace, and remove
- **Location** — one-tap GPS (`Use My Location`) plus manual city/village fallback
- **Weather Dashboard** — current temp, humidity, rain probability, wind, UV, pressure, condition + 5-day forecast
- **AI Crop Analysis** — likely crop, possible disease/pest/stress, confidence %, visible symptoms, contributing factors, severity, image-quality check
- **Climate-Aware Action Window** — the standout feature: weather-timed guidance with a visual timeline
- **Farm Action Plan** — 5-point plain-language checklist
- **FarmGuard Alerts** — severity-ranked smart alerts with icons
- **Expert Verification** — sample-collection steps + link to local extension services
- **Demo Mode** — a full tomato-leaf scenario with realistic weather, so the entire journey works with zero API keys

## Tech stack

- **React 18 + TypeScript**
- **Vite** (dev server & build)
- **Tailwind CSS** (custom green/earth/sky design system, 8px spacing, animations)
- **lucide-react** (icons)
- **Open-Meteo API** (key-free live weather + reverse geocoding via BigDataCloud)

No backend required for the demo. The architecture is structured so Supabase (already provisioned) can be added for history/records without touching the analysis flow.

## AI workflow

```
Photo ─┐
        ├─► extractImageFeatures()  (color, greenness, brownness, variance)
Location ─┤
        ├─► fetchWeather()           (Open-Meteo, key-free)
Weather ─┘
        │
        ▼
   analyzeImageFeatures()  ──►  CropAnalysisResult
        │
        ▼
   buildAnalysisBundle()   ──►  ClimateActionWindow + FarmActionPlan + Alerts
```

`extractImageFeatures` downsamples the image to 64px and computes average RGB, green/brown/yellow pixel ratios, and luminance variance. `analyzeImageFeatures` maps those features to a plausible, explainable result (healthy / fungal disease / nutrient stress / unclear). The whole module is isolated in `src/lib/analysis.ts` so it can be swapped for a real hosted plant-disease model or an on-device TensorFlow.js model without changing the UI.

**Transparency:** if the image is too small, too blurry, or lacks clear signals, the app tells the user to upload a clearer photo instead of fabricating a diagnosis.

## Weather integration

- Live data: [Open-Meteo](https://open-meteo.com/) (no API key, no exposure in frontend code). Returns current conditions + 5-day forecast using WMO weather codes.
- Reverse geocoding: [BigDataCloud](https://www.bigdatacloud.com/) (client-side, key-free).
- Fallback: if the network is unavailable, the app falls back to clearly-labelled **demo weather** so the flow still works.

To connect another weather provider, replace the single function `fetchWeather()` in `src/lib/weather.ts` — everything downstream expects the `WeatherData` shape from `src/types.ts`.

## Demo mode

Because this is a hackathon demo and API keys may not be available:

- The **"Try the demo"** button on the upload card loads a sample tomato-leaf photo, a Pune (India) location, and realistic monsoon weather.
- Pressing **Analyze Crop** runs the full pipeline against the demo crop (`src/lib/demoData.ts`) and renders the complete result dashboard — Climate-Aware Action Window, Farm Action Plan, Alerts, and Expert Verification.

The application is fully functional in demo mode with no network dependency.

## Getting started

```bash
npm install
npm run dev      # start the dev server
npm run build    # production build
npm run typecheck
```

The app runs entirely in the browser. No environment variables are required for the demo. Live weather works out of the box via Open-Meteo.

## Project structure

```
src/
  App.tsx                      # Orchestrates the full user flow
  types.ts                     # Shared domain types
  index.css                    # Tailwind + design tokens
  lib/
    weather.ts                 # Open-Meteo fetch + geocoding + fallback
    analysis.ts                # Image feature extraction + heuristic analysis + climate synthesis
    demoData.ts                # Demo crop + weather scenario
  components/
    ImageUploader.tsx          # Step 1 — drag & drop photo upload
    LocationDetector.tsx       # Step 2 — GPS + manual location
    WeatherDashboard.tsx       # Step 3 — current + 5-day forecast
    CropAnalysis.tsx           # Step 4 — AI diagnosis card
    ClimateActionWindow.tsx    # Step 5 — the standout timeline feature
    FarmActionPlan.tsx         # Step 6 — plain-language action plan
    Alerts.tsx                 # Step 7 — FarmGuard smart alerts
    ExpertVerification.tsx     # Expert routing + sample collection
    ui/                        # Card, Badges, LoadingState, WeatherIcon
```

## Safety & ethics

- AI results are **estimates**, never a guaranteed diagnosis.
- The app gives **no pesticide mixing instructions and no unverified chemical dosages**.
- For crop-protection products, farmers are always directed to the **product label** and **local agricultural extension officer**.
- Expert verification is recommended whenever confidence is low or symptoms are ambiguous.

## Future improvements

- Real plant-disease model (hosted API or on-device TFJS) behind the existing `analyzeImage` interface
- Save scan history per farmer (Supabase is provisioned and ready to wire in)
- Multi-language support for regional farmers (Hindi, Marathi, Swahili, etc.)
- Push / SMS alerts for upcoming rain and disease-risk windows
- Offline-first caching of weather and last scan
- Photo library of known diseases for side-by-side farmer comparison
- Integration with government extension services for direct expert routing
