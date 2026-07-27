import { useEffect, useRef } from 'react';
import type { PDFPageProxy } from '../../lib/pdfjs';

export function Thumbnail({ page, active, onClick, index }: { page: PDFPageProxy; active: boolean; onClick: () => void; index: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const renderTaskRef = useRef<ReturnType<PDFPageProxy['render']> | null>(null);
  useEffect(() => {
    const viewport = page.getViewport({ scale: 0.2 });
    const canvas = ref.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;
    let disposed = false;
    const render = async () => {
      const previousTask = renderTaskRef.current;
      if (previousTask) {
        previousTask.cancel();
        try {
          await previousTask.promise;
        } catch {
          // Cancellation is expected while the thumbnail is being replaced.
        }
      }
      if (disposed) return;
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const renderParameters = { canvas, canvasContext: context, viewport };
      const task = page.render(
        renderParameters as Parameters<PDFPageProxy['render']>[0],
      );
      renderTaskRef.current = task;
      try {
        await task.promise;
      } catch (error) {
        if (!(error instanceof Error && error.name === 'RenderingCancelledException')) {
          console.error('Unable to render PDF thumbnail', error);
        }
      } finally {
        if (renderTaskRef.current === task) renderTaskRef.current = null;
      }
    };
    void render();
    return () => {
      disposed = true;
      renderTaskRef.current?.cancel();
    };
  }, [page]);
  return (
    <button className={`thumbnail ${active ? 'active' : ''}`} onClick={onClick} aria-label={`Go to page ${index + 1}`}>
      <canvas ref={ref} />
      <span>{index + 1}</span>
    </button>
  );
}
