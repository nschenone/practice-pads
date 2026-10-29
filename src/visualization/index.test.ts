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

import { exerciseKeys, modeScaleKeys, notationKeySignature } from './index';
import { guidedPractice } from '../theory';
import type { Fingering } from '../contracts';

describe('notation inputs', () => {
  const d = SUPPORTED_TONICS.find(n => n.letter === 'D' && n.accidental === 0)!;
  const fingering: Fingering = { id: 'test', source: 'test only', review: 'unreviewed', events: [
    { string: 2, fret: 0, pitch: { letter: 'B', accidental: 0, pitchClass: 11, octave: 3, midi: 59 } },
    { string: 2, fret: 2, pitch: { letter: 'C', accidental: 1, pitchClass: 1, octave: 4, midi: 61 } },
  ] };
  it('rotates D minor to F and retains B natural and C sharp', () => {
    const practice = guidedPractice(d, 'jazz-melodic-minor', 3, 'same');
    expect(modeScaleKeys(practice)).toEqual(['f/4', 'g/4', 'a/4', 'b/4', 'c#/5', 'd/5', 'e/5']);
    expect(notationKeySignature(practice)).toEqual({ key: 'Dm', fallback: false });
  });
  it('uses the ordered sounding events with written guitar octave', () => {
    expect(exerciseKeys(fingering)).toEqual(['b/4', 'c#/5']);
  });
  it('retains parent major position through modal change', () => {
    const first = guidedPractice(d, 'major', 1, 'D');
    const third = guidedPractice(d, 'major', 3, 'D');
    expect(majorPosition(first.parentTonic, 'D')).toEqual(majorPosition(third.parentTonic, 'D'));
    expect(majorPosition(d, 'D').some(point => point.fret > 9)).toBe(true);
  });
  it('uses explicit accidentals rather than changing unsupported key spelling', () => {
    const root = { letter: 'G' as const, accidental: 1 as const, pitchClass: 8 as const };
    expect(notationKeySignature(guidedPractice(root, 'major', 1))).toEqual({ key: 'C', fallback: true });
  });
});

import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { GuitarExercise } from './index';

describe('GuitarExercise collection validation', () => {
  it('rejects physically valid F natural in D major before engraving', () => {
    const d = SUPPORTED_TONICS.find(n => n.letter === 'D' && n.accidental === 0)!;
    const bad: Fingering = { id: 'bad', source: 'test', review: 'unreviewed', events: [
      { string: 1, fret: 1, pitch: { letter: 'F', accidental: 0, pitchClass: 5, octave: 4, midi: 65 } },
    ] };
    expect(() => renderToStaticMarkup(createElement(GuitarExercise, { practice: guidedPractice(d, 'major', 1), fingering: bad }))).toThrow('outside parent scale');
  });
});
