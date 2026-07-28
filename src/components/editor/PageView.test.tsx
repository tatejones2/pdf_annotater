import { StrictMode } from 'react';
import { cleanup, fireEvent, render, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { PDFPageProxy } from '../../lib/pdfjs';
import { useEditorStore } from '../../stores/useEditorStore';
import { PageView } from './PageView';

class IntersectionObserverMock {
  observe() {}
  disconnect() {}
  unobserve() {}
  takeRecords() { return []; }
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('PageView rendering', () => {
  it('waits for a cancelled render before using the canvas again', async () => {
    vi.stubGlobal('IntersectionObserver', IntersectionObserverMock);
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
      {} as CanvasRenderingContext2D,
    );
    Object.defineProperty(HTMLElement.prototype, 'setPointerCapture', {
      configurable: true,
      value: vi.fn(),
    });

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

  it('focuses a newly placed text annotation so typing works immediately', async () => {
    vi.stubGlobal('IntersectionObserver', IntersectionObserverMock);
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
      {} as CanvasRenderingContext2D,
    );
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
      left: 0,
      top: 0,
      width: 612,
      height: 792,
      right: 612,
      bottom: 792,
      x: 0,
      y: 0,
      toJSON: () => undefined,
    });
    const page = {
      getViewport: () => ({ width: 612, height: 792 }),
      render: () => ({ promise: Promise.resolve(), cancel: () => undefined }),
    } as unknown as PDFPageProxy;
    useEditorStore.getState().clear();
    useEditorStore.getState().setTool('text');
    useEditorStore.getState().setStyle({ textFont: 'signature' });

    const { container } = render(
      <PageView page={page} pageIndex={0} zoom={1} onVisible={() => undefined} />,
    );
    const pdfPage = container.querySelector('.pdf-page');
    expect(pdfPage).not.toBeNull();
    fireEvent.pointerDown(pdfPage!, { clientX: 120, clientY: 180, pointerId: 1 });
    fireEvent.pointerUp(pdfPage!, { clientX: 120, clientY: 180, pointerId: 1 });

    const editor = await within(container).findByLabelText('Annotation text');
    expect(editor).toHaveFocus();
    expect(useEditorStore.getState().activeTool).toBe('select');
    fireEvent.change(editor, { target: { value: 'Typed annotation' } });
    expect(useEditorStore.getState().annotations[0]?.text).toBe('Typed annotation');
    expect(useEditorStore.getState().annotations[0]?.color).toBe('#25231f');
    expect(useEditorStore.getState().annotations[0]?.fillColor).toBeNull();
    expect(useEditorStore.getState().annotations[0]?.fontFamily).toBe('signature');
  });
});
