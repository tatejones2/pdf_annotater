import { describe, expect, it } from 'vitest';
import { domPointToNormalized, normalizedRectToPdf, rectFromPoints } from './coordinates';

describe('coordinate conversion', () => {
  it('normalizes a DOM point independent of rendered zoom', () => {
    expect(domPointToNormalized(350, 450, { left: 50, top: 50, width: 600, height: 800 }))
      .toEqual({ x: 0.5, y: 0.5 });
  });

  it('converts top-left normalized geometry to PDF coordinates', () => {
    expect(normalizedRectToPdf({ x: 0.1, y: 0.2, width: 0.3, height: 0.1 }, 600, 800))
      .toEqual({ x: 60, y: 560, width: 180, height: 80 });
  });

  it('creates a positive rectangle regardless of drag direction', () => {
    expect(rectFromPoints({ x: 0.8, y: 0.7 }, { x: 0.2, y: 0.1 }))
      .toEqual({ x: 0.2, y: 0.1, width: 0.6000000000000001, height: 0.6 });
  });
});
