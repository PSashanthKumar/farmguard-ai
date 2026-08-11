import type { WeatherData, ForecastDay, WeatherCurrent } from '@/types';
import { DEMO_WEATHER, DEMO_LOCATION } from './demoData';

const WMO_CODE_MAP: Record<number, { label: string; code: string }> = {
  0: { label: 'Clear sky', code: 'clear' },
  1: { label: 'Mainly clear', code: 'mostly-clear' },
  2: { label: 'Partly cloudy', code: 'partly-cloudy' },
  3: { label: 'Overcast', code: 'cloudy' },
  45: { label: 'Fog', code: 'fog' },
  48: { label: 'Rime fog', code: 'fog' },
  51: { label: 'Light drizzle', code: 'drizzle' },
  53: { label: 'Drizzle', code: 'drizzle' },
  55: { label: 'Heavy drizzle', code: 'drizzle' },
  61: { label: 'Light rain', code: 'rain' },
  63: { label: 'Rain', code: 'rain' },
  65: { label: 'Heavy rain', code: 'heavy-rain' },
  66: { label: 'Freezing rain', code: 'rain' },
  67: { label: 'Freezing rain', code: 'rain' },
  71: { label: 'Light snow', code: 'snow' },
  73: { label: 'Snow', code: 'snow' },
  75: { label: 'Heavy snow', code: 'snow' },
  77: { label: 'Snow grains', code: 'snow' },
  80: { label: 'Rain showers', code: 'rain' },
  81: { label: 'Rain showers', code: 'rain' },
  82: { label: 'Violent rain showers', code: 'heavy-rain' },
  85: { label: 'Snow showers', code: 'snow' },
  86: { label: 'Snow showers', code: 'snow' },
  95: { label: 'Thunderstorm', code: 'storm' },
  96: { label: 'Thunderstorm w/ hail', code: 'storm' },
  99: { label: 'Thunderstorm w/ hail', code: 'storm' },
};

function describeWeather(code: number): { label: string; code: string } {
  return WMO_CODE_MAP[code] ?? { label: 'Unknown', code: 'cloudy' };
}

const COMPASS = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
function windDir(deg: number): string {
  return COMPASS[Math.round(deg / 22.5) % 16];
}

function dayName(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { weekday: 'short' });
}

/**
 * Fetch live weather from Open-Meteo (no API key required).
 * Falls back to demo weather if the network is unavailable.
 */
export async function fetchWeather(lat: number, lng: number, locationName: string): Promise<WeatherData> {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(3)}&longitude=${lng.toFixed(3)}` +
    `&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation_probability,weather_code,wind_speed_10m,wind_direction_10m,surface_pressure,is_day,uv_index` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_mean,relative_humidity_2m_mean,wind_speed_10m_max` +
    `&timezone=auto&forecast_days=5`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`Weather API returned ${res.status}`);
    const data = await res.json();

    const c = data.current;
    const wmo = describeWeather(c.weather_code);
    const current: WeatherCurrent = {
      tempC: Math.round(c.temperature_2m),
      feelsLikeC: Math.round(c.apparent_temperature),
      humidity: Math.round(c.relative_humidity_2m),
      rainProb: c.precipitation_probability ?? 0,
      windKph: Math.round(c.wind_speed_10m),
      windDir: windDir(c.wind_direction_10m),
      condition: wmo.label,
      conditionCode: wmo.code,
      uvIndex: Math.round(c.uv_index ?? 0),
      pressureHpa: Math.round(c.surface_pressure),
      isDay: c.is_day === 1,
      observedAt: c.time,
    };

    const forecast: ForecastDay[] = data.daily.time.map((t: string, i: number) => {
      const fwmo = describeWeather(data.daily.weather_code[i]);
      return {
        date: t,
        dayName: dayName(t),
        condition: fwmo.label,
        conditionCode: fwmo.code,
        tempMaxC: Math.round(data.daily.temperature_2m_max[i]),
        tempMinC: Math.round(data.daily.temperature_2m_min[i]),
        rainProb: data.daily.precipitation_probability_mean[i] ?? 0,
        humidity: Math.round(data.daily.relative_humidity_2m_mean[i] ?? 0),
        windKph: Math.round(data.daily.wind_speed_10m_max[i] ?? 0),
      };
    });

    return { current, forecast, source: 'live', locationName };
  } catch (err) {
    // Graceful fallback to demo data, relabeled to the requested location.
    return {
      ...DEMO_WEATHER,
      source: 'demo',
      locationName: locationName || DEMO_LOCATION.label,
    };
  }
}

/** Reverse-geocode coordinates to a place name using Open-Meteo's free geocoding (BigDataCloud). No key. */
export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) throw new Error('geocode failed');
    const d = await res.json();
    const parts = [d.locality, d.city, d.principalSubdivision, d.countryName].filter(Boolean);
    return parts.slice(0, 3).join(', ') || `${lat.toFixed(2)}, ${lng.toFixed(2)}`;
  } catch {
    return `${lat.toFixed(2)}, ${lng.toFixed(2)}`;
  }
}
