import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Alerts } from '@/components/Alerts';
import type { FarmAlert } from '@/types';

const mixed: FarmAlert[] = [
  { id: 'rain', level: 'warning', title: 'Rain expected soon', detail: '82% rain tomorrow.' },
  { id: 'humid', level: 'danger', title: 'High humidity raises disease risk', detail: 'Humidity 78%.' },
  { id: 'expert', level: 'info', title: 'Expert verification recommended', detail: 'Confirm with an agronomist.' },
  { id: 'inspect', level: 'success', title: 'Inspection window open', detail: 'Good time to tag plants.' },
];

describe('Alerts — populated list', () => {
  it('renders the alert count in the subtitle', () => {
    render(<Alerts alerts={mixed} />);
    expect(screen.getByText(/4 alerts based on crop \+ weather/i)).toBeInTheDocument();
  });

  it('renders every alert title', () => {
    render(<Alerts alerts={mixed} />);
    expect(screen.getByText('Rain expected soon')).toBeInTheDocument();
    expect(screen.getByText('High humidity raises disease risk')).toBeInTheDocument();
    expect(screen.getByText('Expert verification recommended')).toBeInTheDocument();
    expect(screen.getByText('Inspection window open')).toBeInTheDocument();
  });

  it('renders severity labels (Urgent, Watch, Info, Good)', () => {
    render(<Alerts alerts={mixed} />);
    expect(screen.getByText('Urgent')).toBeInTheDocument();
    expect(screen.getByText('Watch')).toBeInTheDocument();
    expect(screen.getByText('Info')).toBeInTheDocument();
    expect(screen.getByText('Good')).toBeInTheDocument();
  });

  it('orders alerts by severity (danger first)', () => {
    const { container } = render(<Alerts alerts={mixed} />);
    const items = container.querySelectorAll('li');
    expect(items.length).toBe(4);
    // First rendered item should be the danger alert
    expect(items[0]).toHaveTextContent('High humidity raises disease risk');
  });

  it('uses singular "alert" for a single alert', () => {
    render(<Alerts alerts={[mixed[0]]} />);
    expect(screen.getByText(/1 alert based on crop \+ weather/i)).toBeInTheDocument();
  });
});

describe('Alerts — empty state', () => {
  it('shows the all-clear message when no alerts', () => {
    render(<Alerts alerts={[]} />);
    expect(screen.getByText(/all clear — keep monitoring/i)).toBeInTheDocument();
  });
});
