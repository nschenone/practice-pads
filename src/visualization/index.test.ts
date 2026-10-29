import { describe, expect, it } from 'vitest';
import { majorPosition, validateFingeringEvent } from './index';
import { SUPPORTED_TONICS } from '../theory';

describe('visualization position input', () => {
  it('uses all five upstream major templates with physical pitch agreement', () => {
    const root = SUPPORTED_TONICS.find(n => n.letter === 'D' && n.accidental === 0)!;
    const tuning = ['E4', 'B3', 'G3', 'D3', 'A2', 'E2'];
    for (const position of ['C', 'A', 'G', 'E', 'D'] as const) {
      const points = majorPosition(root, position);
      expect(points.length).toBeGreaterThan(0);
      for (const point of points) {
        const open = [64, 59, 55, 50, 45, 40][point.string - 1];
        expect(point.chroma).toBe((open + point.fret) % 12);
        expect(tuning[point.string - 1]).toBeDefined();
      }
    }
  });
  it('validates open, high fret and invalid events', () => {
    const e = { letter: 'E' as const, accidental: 0 as const, pitchClass: 4 as const, octave: 4, midi: 64 };
    expect(() => validateFingeringEvent({ string: 1, fret: 0, pitch: e })).not.toThrow();
    expect(() => validateFingeringEvent({ string: 6, fret: 24, pitch: e })).not.toThrow();
    expect(() => validateFingeringEvent({ string: 6, fret: -1, pitch: e })).toThrow();
    expect(() => validateFingeringEvent({ string: 1, fret: 1, pitch: e })).toThrow();
  });
});
