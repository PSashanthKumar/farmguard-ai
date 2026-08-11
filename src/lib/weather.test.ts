import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchWeather, reverseGeocode } from '@/lib/weather';
import { DEMO_WEATHER, DEMO_CROP, buildDemoBundle } from '@/lib/demoData';
import type { WeatherData } from '@/types';

beforeEach(() => {
  vi.restoreAllMocks();
});

function mockFetchResponse(body: unknown): typeof fetch {
  const res = { ok: true, status: 200, json: async () => body } as unknown as Response;
  return vi.fn(async () => res) as unknown as typeof fetch;
}

describe('fetchWeather — live path', () => {
  it('parses Open-Meteo current + daily into WeatherData with source=live', async () => {
    const apiBody = {
      current: {
        time: '2026-01-01T12:00',
        temperature_2m: 27.4,
        apparent_temperature: 30.1,
        relative_humidity_2m: 82.3,
        precipitation_probability: 60,
        weather_code: 63,
        wind_speed_10m: 14.6,
        wind_direction_10m: 225,
        surface_pressure: 1008.2,
        is_day: 1,
        uv_index: 4.2,
      },
      daily: {
        time: ['2026-01-01', '2026-01-02', '2026-01-03', '2026-01-04', '2026-01-05'],
        weather_code: [63, 61, 80, 95, 1],
        temperature_2m_max: [28, 27, 26, 25, 29],
        temperature_2m_min: [20, 19, 19, 18, 20],
        precipitation_probability_mean: [60, 70, 65, 80, 10],
        relative_humidity_2m_mean: [82, 85, 80, 88, 60],
        wind_speed_10m_max: [14, 16, 18, 22, 10],
      },
    };
    vi.stubGlobal('fetch', mockFetchResponse(apiBody));

    const w = await fetchWeather(18.5, 73.8, 'Pune');
    expect(w.source).toBe('live');
    expect(w.locationName).toBe('Pune');
    expect(w.current.tempC).toBe(27);
    expect(w.current.feelsLikeC).toBe(30);
    expect(w.current.humidity).toBe(82);
    expect(w.current.condition).toBe('Rain');
    expect(w.current.conditionCode).toBe('rain');
    expect(w.current.isDay).toBe(true);
    expect(w.forecast.length).toBe(5);
    expect(w.forecast[0].tempMaxC).toBe(28);
    expect(w.forecast[3].conditionCode).toBe('storm');
  });

  it('maps WMO code 0 to clear sky', async () => {
    const apiBody = {
      current: { time: 't', temperature_2m: 20, apparent_temperature: 20, relative_humidity_2m: 50, precipitation_probability: 0, weather_code: 0, wind_speed_10m: 5, wind_direction_10m: 0, surface_pressure: 1000, is_day: 1, uv_index: 1 },
      daily: { time: ['2026-01-01'], weather_code: [0], temperature_2m_max: [20], temperature_2m_min: [10], precipitation_probability_mean: [0], relative_humidity_2m_mean: [50], wind_speed_10m_max: [5] },
    };
    vi.stubGlobal('fetch', mockFetchResponse(apiBody));
    const w = await fetchWeather(0, 0, 'X');
    expect(w.current.condition).toBe('Clear sky');
    expect(w.current.conditionCode).toBe('clear');
  });
});

describe('fetchWeather — fallback path', () => {
  it('falls back to demo weather when fetch throws', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('network down'); }));
    const w = await fetchWeather(18.5, 73.8, 'Remote Village');
    expect(w.source).toBe('demo');
    expect(w.locationName).toBe('Remote Village');
    expect(w.forecast.length).toBeGreaterThan(0);
  });

  it('falls back to demo weather when response is not ok', async () => {
    const res = { ok: false, status: 500, json: async () => ({}) } as unknown as Response;
    vi.stubGlobal('fetch', vi.fn(async () => res));
    const w = await fetchWeather(18.5, 73.8, 'Nowhere');
    expect(w.source).toBe('demo');
  });

  it('uses DEMO_LOCATION label when locationName is empty', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('x'); }));
    const w = await fetchWeather(18.5, 73.8, '');
    expect(w.locationName).toBe('Pune, Maharashtra, India');
  });
});

describe('reverseGeocode', () => {
  it('returns a joined place name from BigDataCloud', async () => {
    vi.stubGlobal('fetch', mockFetchResponse({ locality: 'Baner', city: 'Pune', principalSubdivision: 'Maharashtra', countryName: 'India' }));
    const label = await reverseGeocode(18.5, 73.8);
    expect(label).toContain('Pune');
    expect(label).toContain('Maharashtra');
  });

  it('falls back to coordinates when the API fails', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('no net'); }));
    const label = await reverseGeocode(18.56, 73.85);
    expect(label).toMatch(/18\.56.*73\.85/);
  });
});

describe('demoData', () => {
  it('DEMO_WEATHER has 5 forecast days and monsoon-like humidity', () => {
    expect(DEMO_WEATHER.forecast).toHaveLength(5);
    expect(DEMO_WEATHER.current.humidity).toBeGreaterThanOrEqual(70);
    expect(DEMO_WEATHER.source).toBe('demo');
  });

  it('DEMO_CROP is a disease with expert verification recommended', () => {
    expect(DEMO_CROP.issueType).toBe('disease');
    expect(DEMO_CROP.expertVerificationRecommended).toBe(true);
    expect(DEMO_CROP.confidence).toBeGreaterThan(0);
  });

  it('buildDemoBundle returns a complete bundle with safety note', () => {
    const b = buildDemoBundle(DEMO_WEATHER as WeatherData);
    expect(b.crop).toBe(DEMO_CROP);
    expect(b.climate.timeline).toHaveLength(4);
    expect(b.plan.checkNow.length).toBeGreaterThan(0);
    expect(b.alerts.length).toBeGreaterThan(0);
    expect(b.climate.productSafetyNote).toMatch(/product label/i);
  });
});
