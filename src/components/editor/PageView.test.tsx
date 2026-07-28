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
    vi.stubGlobal('PointerEvent', MouseEvent);
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
    const initial = useEditorStore.getState().annotations[0]!;
    expect(initial.rect.width).toBe(0.09);
    fireEvent.change(editor, { target: { value: 'Typed annotation' } });
    expect(useEditorStore.getState().annotations[0]?.text).toBe('Typed annotation');
    expect(useEditorStore.getState().annotations[0]?.color).toBe('#25231f');
    expect(useEditorStore.getState().annotations[0]?.fillColor).toBeNull();
    expect(useEditorStore.getState().annotations[0]?.fontFamily).toBe('signature');
    expect(useEditorStore.getState().annotations[0]!.rect.width).toBeGreaterThan(initial.rect.width);

    const original = useEditorStore.getState().annotations[0]!;
    const southeastHandle = within(container).getByRole('button', { name: 'Resize se' });
    fireEvent.pointerDown(southeastHandle, { clientX: 304, clientY: 224, pointerId: 2 });
    fireEvent.pointerMove(southeastHandle, { clientX: 430, clientY: 300, pointerId: 2 });
    fireEvent.pointerUp(southeastHandle, { clientX: 430, clientY: 300, pointerId: 2 });
    const resized = useEditorStore.getState().annotations[0]!;
    expect(resized.rect.width).toBeGreaterThan(original.rect.width);
    expect(resized.rect.height).toBeGreaterThan(original.rect.height);
    expect(resized.fontSize).toBeGreaterThan(original.fontSize!);

    const topEdge = within(container).getByRole('button', {
      name: 'Move annotation from top edge',
    });
    const beforeMove = useEditorStore.getState().annotations[0]!;
    fireEvent.pointerDown(topEdge, { clientX: 120, clientY: 180, pointerId: 3 });
    fireEvent.pointerMove(topEdge, { clientX: 170, clientY: 220, pointerId: 3 });
    fireEvent.pointerUp(topEdge, { clientX: 170, clientY: 220, pointerId: 3 });
    const moved = useEditorStore.getState().annotations[0]!;
    expect(moved.rect.x).toBeGreaterThan(beforeMove.rect.x);
    expect(moved.rect.y).toBeGreaterThan(beforeMove.rect.y);
  });
});
