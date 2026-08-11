import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CropAnalysis } from '@/components/CropAnalysis';
import type { CropAnalysisResult } from '@/types';

const diseaseResult: CropAnalysisResult = {
  likelyCrop: 'Tomato (Solanum lycopersicum)',
  issue: 'Early blight (Alternaria solani) — probable',
  issueType: 'disease',
  confidence: 72,
  symptoms: ['Dark brown lesions', 'Yellowing around lesions'],
  contributingFactors: ['High humidity', 'Recent rainfall'],
  severity: 'Medium',
  expertVerificationRecommended: true,
  note: 'This is an AI-assisted estimate, not a laboratory diagnosis.',
  imageQuality: 'good',
};

const healthyResult: CropAnalysisResult = {
  likelyCrop: 'Maize',
  issue: 'No significant disease signature detected',
  issueType: 'healthy',
  confidence: 80,
  symptoms: [],
  contributingFactors: [],
  severity: 'Low',
  expertVerificationRecommended: false,
  note: 'AI did not detect clear disease markers.',
  imageQuality: 'good',
};

const unknownResult: CropAnalysisResult = {
  likelyCrop: 'Unconfirmed',
  issue: 'Image not clear enough for analysis',
  issueType: 'unknown',
  confidence: 0,
  symptoms: [],
  contributingFactors: [],
  severity: 'Low',
  expertVerificationRecommended: true,
  note: 'The image is too small. Please upload a clearer photo.',
  imageQuality: 'poor',
};

describe('CropAnalysis — disease result', () => {
  it('renders the likely crop and detected issue', () => {
    render(<CropAnalysis result={diseaseResult} />);
    expect(screen.getByText('Tomato (Solanum lycopersicum)')).toBeInTheDocument();
    expect(screen.getByText(/Early blight/)).toBeInTheDocument();
  });

  it('renders the confidence percentage and bar', () => {
    render(<CropAnalysis result={diseaseResult} />);
    expect(screen.getByText('72%')).toBeInTheDocument();
  });

  it('lists visible symptoms', () => {
    render(<CropAnalysis result={diseaseResult} />);
    expect(screen.getByText('Dark brown lesions')).toBeInTheDocument();
    expect(screen.getByText('Yellowing around lesions')).toBeInTheDocument();
  });

  it('lists contributing factors', () => {
    render(<CropAnalysis result={diseaseResult} />);
    expect(screen.getByText('High humidity')).toBeInTheDocument();
  });

  it('shows the uncertainty note', () => {
    render(<CropAnalysis result={diseaseResult} />);
    expect(screen.getByText(/AI-assisted estimate/i)).toBeInTheDocument();
  });

  it('shows the Expert verification advised badge when recommended', () => {
    render(<CropAnalysis result={diseaseResult} />);
    expect(screen.getByText(/expert verification advised/i)).toBeInTheDocument();
  });
});

describe('CropAnalysis — healthy result', () => {
  it('does not show the expert verification badge', () => {
    render(<CropAnalysis result={healthyResult} />);
    expect(screen.queryByText(/expert verification advised/i)).not.toBeInTheDocument();
  });

  it('does not render an empty symptoms section', () => {
    render(<CropAnalysis result={healthyResult} />);
    expect(screen.queryByText('Visible symptoms')).not.toBeInTheDocument();
  });
});

describe('CropAnalysis — unknown / error state', () => {
  it('renders the unclear-image note without a confidence bar', () => {
    render(<CropAnalysis result={unknownResult} />);
    expect(screen.getByText(/image is too small/i)).toBeInTheDocument();
    // confidence is 0, so the % label should not appear
    expect(screen.queryByText('0%')).not.toBeInTheDocument();
  });

  it('shows the Unclear issue badge', () => {
    render(<CropAnalysis result={unknownResult} />);
    expect(screen.getByText('Unclear')).toBeInTheDocument();
  });
});
