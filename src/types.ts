// Shared domain types for FarmGuard AI

export interface GeoLocation {
  lat: number;
  lng: number;
  label: string;
  source: 'gps' | 'manual';
}

export interface WeatherCurrent {
  tempC: number;
  feelsLikeC: number;
  humidity: number; // %
  rainProb: number; // % chance of rain (next few hours)
  windKph: number;
  windDir: string;
  condition: string;
  conditionCode: string; // stable code for icon mapping
  uvIndex: number;
  pressureHpa: number;
  isDay: boolean;
  observedAt: string; // ISO
}

export interface ForecastDay {
  date: string; // ISO date
  dayName: string;
  condition: string;
  conditionCode: string;
  tempMaxC: number;
  tempMinC: number;
  rainProb: number;
  humidity: number;
  windKph: number;
}

export interface WeatherData {
  current: WeatherCurrent;
  forecast: ForecastDay[];
  source: 'live' | 'demo';
  locationName: string;
}

export type Severity = 'Low' | 'Medium' | 'High';

export interface CropAnalysisResult {
  likelyCrop: string;
  issue: string;
  issueType: 'disease' | 'pest' | 'stress' | 'healthy' | 'unknown';
  confidence: number; // 0-100
  symptoms: string[];
  contributingFactors: string[];
  severity: Severity;
  expertVerificationRecommended: boolean;
  note: string;
  imageQuality: 'good' | 'fair' | 'poor';
}

export type WindowStatus = 'good' | 'wait' | 'monitor';

export interface ActionSlot {
  label: string;
  range: string;
  status: WindowStatus;
  detail: string;
}

export interface ClimateActionWindow {
  weatherImpact: string;
  favorable: boolean;
  summary: string;
  timeline: ActionSlot[];
  reasoning: string;
  productSafetyNote: string;
}

export interface FarmActionPlan {
  checkNow: string[];
  doNow: string[];
  monitor: string[];
  nextCheck: string;
  expertContact: string;
}

export type AlertLevel = 'info' | 'warning' | 'danger' | 'success';

export interface FarmAlert {
  id: string;
  level: AlertLevel;
  title: string;
  detail: string;
}

export interface AnalysisBundle {
  crop: CropAnalysisResult;
  climate: ClimateActionWindow;
  plan: FarmActionPlan;
  alerts: FarmAlert[];
  generatedAt: string;
}
