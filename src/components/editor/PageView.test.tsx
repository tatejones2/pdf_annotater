import { StrictMode } from 'react';
import { render, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { PDFPageProxy } from '../../lib/pdfjs';
import { PageView } from './PageView';

class IntersectionObserverMock {
  observe() {}
  disconnect() {}
  unobserve() {}
  takeRecords() { return []; }
}

describe('PageView rendering', () => {
  it('waits for a cancelled render before using the canvas again', async () => {
    vi.stubGlobal('IntersectionObserver', IntersectionObserverMock);
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
      {} as CanvasRenderingContext2D,
    );

    const renderPdfPage = vi.fn(() => {
      let rejectTask: (reason: Error) => void = () => undefined;
      const promise = new Promise<void>((resolve, reject) => {
        rejectTask = reject;
        queueMicrotask(resolve);
      });
      return {
        promise,
        cancel: () => rejectTask(Object.assign(new Error('cancelled'), {
          name: 'RenderingCancelledException',
        })),
      };
    });
    const page = {
      getViewport: () => ({ width: 612, height: 792 }),
      render: renderPdfPage,
    } as unknown as PDFPageProxy;

    render(
      <StrictMode>
        <PageView page={page} pageIndex={0} zoom={1} onVisible={() => undefined} />
      </StrictMode>,
    );

    await waitFor(() => expect(renderPdfPage).toHaveBeenCalled());
    expect(document.querySelector('[role="alert"]')).not.toBeInTheDocument();
  });
});
