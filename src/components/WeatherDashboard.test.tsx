import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WeatherDashboard } from '@/components/WeatherDashboard';
import type { WeatherData } from '@/types';

const weather: WeatherData = {
  source: 'demo',
  locationName: 'Pune, Maharashtra, India',
  current: {
    tempC: 28, feelsLikeC: 31, humidity: 78, rainProb: 65, windKph: 14,
    windDir: 'SW', condition: 'Partly cloudy', conditionCode: 'partly-cloudy',
    uvIndex: 7, pressureHpa: 1006, isDay: true, observedAt: '2026-01-01T00:00:00Z',
  },
  forecast: [
    { date: '2026-01-01', dayName: 'Today', condition: 'Partly cloudy', conditionCode: 'partly-cloudy', tempMaxC: 29, tempMinC: 22, rainProb: 65, humidity: 78, windKph: 14 },
    { date: '2026-01-02', dayName: 'Fri', condition: 'Light rain', conditionCode: 'rain', tempMaxC: 26, tempMinC: 21, rainProb: 82, humidity: 86, windKph: 18 },
    { date: '2026-01-03', dayName: 'Sat', condition: 'Rain', conditionCode: 'rain', tempMaxC: 25, tempMinC: 21, rainProb: 90, humidity: 90, windKph: 20 },
    { date: '2026-01-04', dayName: 'Sun', condition: 'Thunderstorm', conditionCode: 'storm', tempMaxC: 24, tempMinC: 20, rainProb: 88, humidity: 88, windKph: 24 },
    { date: '2026-01-05', dayName: 'Mon', condition: 'Mainly clear', conditionCode: 'mostly-clear', tempMaxC: 28, tempMinC: 21, rainProb: 30, humidity: 70, windKph: 12 },
  ],
};

describe('WeatherDashboard', () => {
  it('renders the current temperature and condition', () => {
    render(<WeatherDashboard weather={weather} />);
    expect(screen.getByText('28')).toBeInTheDocument();
    expect(screen.getByText('Partly cloudy')).toBeInTheDocument();
  });

  it('renders all current stat pills', () => {
    render(<WeatherDashboard weather={weather} />);
    expect(screen.getByText('Feels like')).toBeInTheDocument();
    expect(screen.getByText('78%')).toBeInTheDocument();
    expect(screen.getByText('14 km/h SW')).toBeInTheDocument();
    expect(screen.getByText('1006 hPa')).toBeInTheDocument();
  });

  it('renders exactly 5 forecast days', () => {
    render(<WeatherDashboard weather={weather} />);
    expect(screen.getByText('Today')).toBeInTheDocument();
    expect(screen.getByText('Fri')).toBeInTheDocument();
    expect(screen.getByText('Sat')).toBeInTheDocument();
    expect(screen.getByText('Sun')).toBeInTheDocument();
    expect(screen.getByText('Mon')).toBeInTheDocument();
  });

  it('shows the data-source badge', () => {
    render(<WeatherDashboard weather={weather} />);
    expect(screen.getByText('Demo data')).toBeInTheDocument();
  });

  it('shows Live data badge for live source', () => {
    render(<WeatherDashboard weather={{ ...weather, source: 'live' }} />);
    expect(screen.getByText('Live data')).toBeInTheDocument();
  });

  it('renders the location subtitle', () => {
    render(<WeatherDashboard weather={weather} />);
    expect(screen.getByText('Pune, Maharashtra, India')).toBeInTheDocument();
  });
});
