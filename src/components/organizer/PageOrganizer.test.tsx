import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { PageOrganizer } from './PageOrganizer';

const pdfMocks = vi.hoisted(() => ({
  pageCounts: [] as number[],
}));

vi.mock('../../lib/pdfjs', () => ({
  getDocument: vi.fn(() => {
    const numPages = pdfMocks.pageCounts.shift() ?? 1;
    return {
      promise: Promise.resolve({
        numPages,
        cleanup: vi.fn(),
        getPage: vi.fn(async () => ({
          getViewport: ({ scale }: { scale: number }) => ({
            width: 600 * scale,
            height: 800 * scale,
          }),
          render: vi.fn(() => ({ promise: Promise.resolve(), cancel: vi.fn() })),
        })),
      }),
    };
  }),
}));

afterEach(() => {
  cleanup();
  pdfMocks.pageCounts = [];
  vi.restoreAllMocks();
});

function pdfFile(name: string) {
  const file = new File(['pdf'], name, { type: 'application/pdf' });
  Object.defineProperty(file, 'arrayBuffer', {
    value: async () => new Uint8Array([37, 80, 68, 70]).buffer,
  });
  return file;
}

describe('PageOrganizer', () => {
  it('swaps the source and destination PDFs with their selected pages', async () => {
    pdfMocks.pageCounts = [4, 7];
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
      {} as CanvasRenderingContext2D,
    );
    const { container } = render(<PageOrganizer onClose={vi.fn()} />);

    let fileInputs = container.querySelectorAll<HTMLInputElement>('input[type="file"]');
    fireEvent.change(fileInputs[0], { target: { files: [pdfFile('source.pdf')] } });
    await screen.findByRole('heading', { name: 'source.pdf' });

    fileInputs = container.querySelectorAll<HTMLInputElement>('input[type="file"]');
    fireEvent.change(fileInputs[1], { target: { files: [pdfFile('destination.pdf')] } });
    await screen.findByRole('heading', { name: 'destination.pdf' });

    const pageInputs = screen.getAllByRole('spinbutton');
    fireEvent.change(pageInputs[0], { target: { value: '3' } });
    fireEvent.change(pageInputs[1], { target: { value: '6' } });

    fireEvent.click(screen.getByRole('button', { name: 'Swap source and destination PDFs' }));

    await waitFor(() => {
      expect(screen.getAllByRole('spinbutton')[0]).toHaveValue(6);
      expect(screen.getAllByRole('spinbutton')[1]).toHaveValue(3);
    });
    expect(container.querySelector('.organizer-summary p')).toHaveTextContent(
      'Copy page 6 from destination.pdf. Replace page 3 in source.pdf.',
    );
  });
});
