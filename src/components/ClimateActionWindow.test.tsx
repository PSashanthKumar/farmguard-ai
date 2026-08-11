import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ClimateActionWindow } from '@/components/ClimateActionWindow';
import type { ClimateActionWindow as ClimateData } from '@/types';

const favorableData: ClimateData = {
  weatherImpact: 'Dry and stable — no rain conflict.',
  favorable: true,
  summary: 'Conditions are currently workable for inspection.',
  timeline: [
    { label: 'NOW', range: 'Next 2 hours', status: 'good', detail: 'Dry and workable — safe to inspect.' },
    { label: 'NEXT 6 HOURS', range: 'Hours 2–6', status: 'good', detail: 'Low rain chance.' },
    { label: 'TOMORROW', range: 'Fri', status: 'monitor', detail: 'Marginal conditions.' },
    { label: 'NEXT 3 DAYS', range: 'Sat–Mon', status: 'good', detail: 'Mostly dry.' },
  ],
  reasoning: 'Fungal diseases spread slowest in dry conditions.',
  productSafetyNote: 'Always follow the product label and local extension officer guidance.',
};

const waitData: ClimateData = {
  ...favorableData,
  favorable: false,
  summary: 'Rain is expected soon — hold any spraying.',
  timeline: [
    { label: 'NOW', range: 'Next 2 hours', status: 'wait', detail: 'Rain likely now.' },
    { label: 'NEXT 6 HOURS', range: 'Hours 2–6', status: 'wait', detail: 'Hold spraying.' },
    { label: 'TOMORROW', range: 'Fri', status: 'wait', detail: 'Too wet.' },
    { label: 'NEXT 3 DAYS', range: 'Sat–Mon', status: 'monitor', detail: 'Wait for dry break.' },
  ],
};

describe('ClimateActionWindow', () => {
  it('renders all four timeline labels', () => {
    render(<ClimateActionWindow data={favorableData} />);
    expect(screen.getByText('NOW')).toBeInTheDocument();
    expect(screen.getByText('NEXT 6 HOURS')).toBeInTheDocument();
    expect(screen.getByText('TOMORROW')).toBeInTheDocument();
    expect(screen.getByText('NEXT 3 DAYS')).toBeInTheDocument();
  });

  it('renders GOOD WINDOW and MONITOR status chips', () => {
    render(<ClimateActionWindow data={favorableData} />);
    expect(screen.getAllByText('GOOD WINDOW').length).toBeGreaterThan(0);
    expect(screen.getAllByText('MONITOR').length).toBeGreaterThan(0);
  });

  it('renders WAIT status chips when conditions are wet', () => {
    render(<ClimateActionWindow data={waitData} />);
    expect(screen.getAllByText('WAIT').length).toBeGreaterThan(0);
  });

  it('shows the Favorable now badge when favorable', () => {
    render(<ClimateActionWindow data={favorableData} />);
    expect(screen.getByText('Favorable now')).toBeInTheDocument();
  });

  it('shows Act with care badge when not favorable', () => {
    render(<ClimateActionWindow data={waitData} />);
    expect(screen.getByText('Act with care')).toBeInTheDocument();
  });

  it('renders the weather-impact explanation', () => {
    render(<ClimateActionWindow data={favorableData} />);
    expect(screen.getByText(/Dry and stable/i)).toBeInTheDocument();
  });

  it('renders the product-label safety note', () => {
    render(<ClimateActionWindow data={favorableData} />);
    expect(screen.getByText(/product label/i)).toBeInTheDocument();
    expect(screen.getByText(/extension officer/i)).toBeInTheDocument();
  });

  it('renders the reasoning section', () => {
    render(<ClimateActionWindow data={favorableData} />);
    expect(screen.getByText(/Fungal diseases spread slowest/i)).toBeInTheDocument();
  });
});
