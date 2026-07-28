import { useEffect, useMemo, useRef, useState } from 'react';
import type { PDFPageProxy } from '../../lib/pdfjs';
import { domPointToNormalized, rectFromPoints } from '../../lib/coordinates';
import type { Annotation, NormalizedPoint } from '../../types/annotations';
import { useEditorStore } from '../../stores/useEditorStore';

type Props = {
  page: PDFPageProxy;
  pageIndex: number;
  zoom: number;
  onVisible: (page: number) => void;
};

function AnnotationView({ annotation }: { annotation: Annotation }) {
  const selectedId = useEditorStore((state) => state.selectedId);
  const select = useEditorStore((state) => state.select);
  const update = useEditorStore((state) => state.update);
  const activeTool = useEditorStore((state) => state.activeTool);
  const selected = selectedId === annotation.id;
  const startRef = useRef<{ point: NormalizedPoint; rect: Annotation['rect'] } | null>(null);
  const style: React.CSSProperties = {
    left: `${annotation.rect.x * 100}%`,
    top: `${annotation.rect.y * 100}%`,
    width: `${annotation.rect.width * 100}%`,
    height: `${annotation.rect.height * 100}%`,
    zIndex: annotation.zIndex,
    opacity: annotation.opacity,
    color: annotation.color,
  };

  const beginMove = (event: React.PointerEvent) => {
    if (activeTool !== 'select' || annotation.locked) return;
    event.stopPropagation();
    select(annotation.id);
    const bounds = event.currentTarget.parentElement?.getBoundingClientRect();
    if (!bounds) return;
    startRef.current = {
      point: domPointToNormalized(event.clientX, event.clientY, bounds),
      rect: annotation.rect,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const move = (event: React.PointerEvent) => {
    if (!startRef.current) return;
    const bounds = event.currentTarget.parentElement?.getBoundingClientRect();
    if (!bounds) return;
    const point = domPointToNormalized(event.clientX, event.clientY, bounds);
    const dx = point.x - startRef.current.point.x;
    const dy = point.y - startRef.current.point.y;
    update(annotation.id, {
      rect: {
        ...startRef.current.rect,
        x: Math.max(0, Math.min(1 - annotation.rect.width, startRef.current.rect.x + dx)),
        y: Math.max(0, Math.min(1 - annotation.rect.height, startRef.current.rect.y + dy)),
      },
    });
    startRef.current = { point, rect: { ...annotation.rect, x: annotation.rect.x + dx, y: annotation.rect.y + dy } };
  };

  const className = `annotation annotation-${annotation.type} ${annotation.fontFamily === 'signature' ? 'font-signature' : 'font-sans'} ${selected ? 'selected' : ''} ${annotation.locked ? 'locked' : ''}`;

  if (annotation.type === 'pen' && annotation.points) {
    const path = annotation.points.map((point, index) => `${index ? 'L' : 'M'} ${point.x * 100} ${point.y * 100}`).join(' ');
    return (
      <svg className={className} style={{ zIndex: annotation.zIndex }} viewBox="0 0 100 100" preserveAspectRatio="none">
        <path d={path} fill="none" stroke={annotation.color} strokeWidth={annotation.width / 2} strokeLinecap="round" strokeLinejoin="round" opacity={annotation.opacity} />
      </svg>
    );
  }

  return (
    <div
      className={className}
      style={style}
      onPointerDown={beginMove}
      onPointerMove={move}
      onPointerUp={() => { startRef.current = null; }}
      onClick={(event) => {
        if (activeTool === 'select') {
          event.stopPropagation();
          select(annotation.id);
        }
      }}
    >
      {(annotation.type === 'text' || annotation.type === 'sticky-note') && (
        <textarea
          aria-label={annotation.type === 'text' ? 'Annotation text' : 'Sticky note text'}
          autoFocus={selected && !annotation.locked}
          readOnly={annotation.locked}
          value={annotation.text ?? ''}
          placeholder={annotation.type === 'text' ? 'Type here…' : 'Note…'}
          style={{ color: annotation.color, fontSize: annotation.fontSize ?? 14 }}
          onPointerDown={(event) => {
            event.stopPropagation();
            select(annotation.id);
          }}
          onFocus={() => select(annotation.id)}
          onChange={(event) => update(annotation.id, { text: event.target.value })}
        />
      )}
      {annotation.type === 'arrow' && (
        <svg viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs><marker id={`arrow-${annotation.id}`} markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L7,3 z" fill={annotation.color} /></marker></defs>
          <line x1="2" y1="98" x2="96" y2="4" stroke={annotation.color} strokeWidth={annotation.width} markerEnd={`url(#arrow-${annotation.id})`} />
        </svg>
      )}
      {selected && <><i className="handle nw" /><i className="handle se" /></>}
    </div>
  );
}

export function PageView({ page, pageIndex, zoom, onVisible }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const renderTaskRef = useRef<ReturnType<PDFPageProxy['render']> | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);
  const viewport = useMemo(() => page.getViewport({ scale: zoom }), [page, zoom]);
  const [start, setStart] = useState<NormalizedPoint | null>(null);
  const [penPoints, setPenPoints] = useState<NormalizedPoint[]>([]);
  const allAnnotations = useEditorStore((state) => state.annotations);
  const annotations = useMemo(
    () => allAnnotations.filter((item) => item.pageIndex === pageIndex),
    [allAnnotations, pageIndex],
  );
  const tool = useEditorStore((state) => state.activeTool);
  const add = useEditorStore((state) => state.add);
  const select = useEditorStore((state) => state.select);
  const setTool = useEditorStore((state) => state.setTool);
  const textFont = useEditorStore((state) => state.textFont);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let disposed = false;

    const render = async () => {
      const previousTask = renderTaskRef.current;
      if (previousTask) {
        previousTask.cancel();
        try {
          await previousTask.promise;
        } catch {
          // Cancellation is expected when zoom changes or React remounts effects.
        }
      }
      if (disposed) return;

      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(viewport.width * ratio);
      canvas.height = Math.floor(viewport.height * ratio);
      canvas.style.width = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;
      const context = canvas.getContext('2d');
      if (!context) {
        setRenderError('Canvas rendering is unavailable in this browser.');
        return;
      }
      const renderParameters = {
        canvas,
        canvasContext: context,
        viewport,
        transform: ratio === 1 ? undefined : [ratio, 0, 0, ratio, 0, 0],
      };
      const renderTask = page.render(
        renderParameters as Parameters<PDFPageProxy['render']>[0],
      );
      renderTaskRef.current = renderTask;
      try {
        await renderTask.promise;
        if (!disposed) setRenderError(null);
      } catch (error) {
        if (!disposed && !(error instanceof Error && error.name === 'RenderingCancelledException')) {
          console.error('Unable to render PDF page', error);
          setRenderError('This page could not be rendered. Try reopening the PDF.');
        }
      } finally {
        if (renderTaskRef.current === renderTask) renderTaskRef.current = null;
      }
    };

    void render();
    return () => {
      disposed = true;
      renderTaskRef.current?.cancel();
    };
  }, [page, viewport]);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry?.isIntersecting) onVisible(pageIndex + 1); },
      { threshold: 0.35 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [onVisible, pageIndex]);

  const point = (event: React.PointerEvent) => {
    const bounds = containerRef.current?.getBoundingClientRect();
    return bounds ? domPointToNormalized(event.clientX, event.clientY, bounds) : null;
  };

  const onPointerDown = (event: React.PointerEvent) => {
    if (tool === 'select') {
      select(null);
      return;
    }
    const next = point(event);
    if (!next) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    setStart(next);
    setPenPoints(tool === 'pen' ? [next] : []);
  };

  const onPointerMove = (event: React.PointerEvent) => {
    if (tool !== 'pen' || !start) return;
    const next = point(event);
    if (next) setPenPoints((points) => [...points, next]);
  };

  const onPointerUp = (event: React.PointerEvent) => {
    if (!start || tool === 'select') return;
    const end = point(event) ?? start;
    if (tool === 'pen') {
      if (penPoints.length > 1) add('pen', pageIndex, { x: 0, y: 0, width: 1, height: 1 }, { points: penPoints });
    } else if (tool === 'text') {
      add(
        'text',
        pageIndex,
        { x: start.x, y: start.y, width: 0.3, height: 0.055 },
        {
          text: '',
          color: '#25231f',
          fillColor: null,
          fontFamily: textFont,
          fontSize: textFont === 'signature' ? 20 : 14,
          opacity: 1,
        },
      );
      setTool('select');
    } else if (tool === 'sticky-note') {
      add('sticky-note', pageIndex, { x: start.x, y: start.y, width: 0.18, height: 0.13 }, { text: '', opacity: 1 });
      setTool('select');
    } else {
      const rect = rectFromPoints(start, end);
      const fallback = { ...rect, width: Math.max(rect.width, 0.03), height: Math.max(rect.height, 0.015) };
      add(tool, pageIndex, fallback);
    }
    setStart(null);
    setPenPoints([]);
  };

  return (
    <article className="pdf-page-wrap" aria-label={`Page ${pageIndex + 1}`}>
      <span className="page-label">Page {pageIndex + 1}</span>
      <div
        ref={containerRef}
        className={`pdf-page tool-${tool}`}
        style={{ width: viewport.width, height: viewport.height }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        <canvas ref={canvasRef} />
        {renderError && <div className="page-render-error" role="alert">{renderError}</div>}
        <div className="annotation-layer">
          {annotations.map((annotation) => <AnnotationView key={annotation.id} annotation={annotation} />)}
          {tool === 'pen' && penPoints.length > 1 && (
            <svg className="pen-preview" viewBox="0 0 100 100" preserveAspectRatio="none">
              <polyline points={penPoints.map((p) => `${p.x * 100},${p.y * 100}`).join(' ')} fill="none" stroke="currentColor" strokeWidth="0.6" />
            </svg>
          )}
        </div>
      </div>
    </article>
  );
}
