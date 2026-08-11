import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ImageUploader } from '@/components/ImageUploader';

describe('ImageUploader — empty state', () => {
  it('shows the drop zone and demo button when no image is set', () => {
    render(<ImageUploader imageUrl={null} onImage={vi.fn()} onUseDemo={vi.fn()} />);
    expect(screen.getByText(/drag & drop a crop photo/i)).toBeInTheDocument();
    expect(screen.getByText(/try the demo/i)).toBeInTheDocument();
  });

  it('hides the demo button when onUseDemo is not provided', () => {
    render(<ImageUploader imageUrl={null} onImage={vi.fn()} />);
    expect(screen.queryByText(/try the demo/i)).not.toBeInTheDocument();
  });

  it('calls onUseDemo when the demo button is clicked', async () => {
    const onUseDemo = vi.fn();
    render(<ImageUploader imageUrl={null} onImage={vi.fn()} onUseDemo={onUseDemo} />);
    await userEvent.click(screen.getByText(/try the demo/i));
    expect(onUseDemo).toHaveBeenCalledTimes(1);
  });
});

describe('ImageUploader — preview state', () => {
  it('renders the uploaded image and a Remove button', () => {
    render(<ImageUploader imageUrl="https://example.com/x.jpg" onImage={vi.fn()} />);
    const img = screen.getByAltText('Uploaded crop');
    expect(img).toHaveAttribute('src', 'https://example.com/x.jpg');
    expect(screen.getByText(/remove/i)).toBeInTheDocument();
    expect(screen.getByText(/replace/i)).toBeInTheDocument();
  });

  it('calls onImage(null) when Remove is clicked', async () => {
    const onImage = vi.fn();
    render(<ImageUploader imageUrl="https://example.com/x.jpg" onImage={onImage} />);
    await userEvent.click(screen.getByText(/remove/i));
    expect(onImage).toHaveBeenCalledWith(null);
  });

  it('shows the ready-for-analysis hint', () => {
    render(<ImageUploader imageUrl="https://example.com/x.jpg" onImage={vi.fn()} />);
    expect(screen.getByText(/photo ready for analysis/i)).toBeInTheDocument();
  });
});

describe('ImageUploader — file handling', () => {
  it('invokes onImage with an image file from the hidden input', () => {
    const onImage = vi.fn();
    render(<ImageUploader imageUrl={null} onImage={onImage} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['data'], 'leaf.png', { type: 'image/png' });
    fireEvent.change(input, { target: { files: [file] } });
    expect(onImage).toHaveBeenCalledWith(file);
  });

  it('ignores non-image files', () => {
    const onImage = vi.fn();
    render(<ImageUploader imageUrl={null} onImage={onImage} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['data'], 'doc.pdf', { type: 'application/pdf' });
    fireEvent.change(input, { target: { files: [file] } });
    expect(onImage).not.toHaveBeenCalled();
  });
});

describe('ImageUploader — disabled state', () => {
  it('does not call onUseDemo when disabled', async () => {
    const onUseDemo = vi.fn();
    render(<ImageUploader imageUrl={null} onImage={vi.fn()} onUseDemo={onUseDemo} disabled />);
    const btn = screen.getByText(/try the demo/i).closest('button')!;
    expect(btn).toBeDisabled();
    await userEvent.click(btn);
    expect(onUseDemo).not.toHaveBeenCalled();
  });
});
