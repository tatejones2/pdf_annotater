import type { NormalizedPoint, NormalizedRect } from '../types/annotations';

export function domPointToNormalized(
  clientX: number,
  clientY: number,
  bounds: Pick<DOMRect, 'left' | 'top' | 'width' | 'height'>,
): NormalizedPoint {
  return {
    x: Math.min(1, Math.max(0, (clientX - bounds.left) / bounds.width)),
    y: Math.min(1, Math.max(0, (clientY - bounds.top) / bounds.height)),
  };
}

export function normalizedRectToPdf(
  rect: NormalizedRect,
  pageWidth: number,
  pageHeight: number,
) {
  return {
    x: rect.x * pageWidth,
    y: pageHeight - (rect.y + rect.height) * pageHeight,
    width: rect.width * pageWidth,
    height: rect.height * pageHeight,
  };
}

export function rectFromPoints(a: NormalizedPoint, b: NormalizedPoint): NormalizedRect {
  return {
    x: Math.min(a.x, b.x),
    y: Math.min(a.y, b.y),
    width: Math.abs(b.x - a.x),
    height: Math.abs(b.y - a.y),
  };
}
