import { useEffect, useRef } from 'react';
import type { PDFPageProxy } from '../../lib/pdfjs';

export function Thumbnail({ page, active, onClick, index }: { page: PDFPageProxy; active: boolean; onClick: () => void; index: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const viewport = page.getViewport({ scale: 0.2 });
    const canvas = ref.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const task = page.render({ canvasContext: context, viewport });
    return () => task.cancel();
  }, [page]);
  return (
    <button className={`thumbnail ${active ? 'active' : ''}`} onClick={onClick} aria-label={`Go to page ${index + 1}`}>
      <canvas ref={ref} />
      <span>{index + 1}</span>
    </button>
  );
}
