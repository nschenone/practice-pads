import { describe, expect, it } from 'vitest';
import { minorPosition } from './index';
import { deriveMode, guidedPractice, SUPPORTED_TONICS } from '../theory';

const families = ['jazz-melodic-minor', 'harmonic-minor'] as const;
const positions = ['C', 'A', 'G', 'E', 'D'] as const;
const c = SUPPORTED_TONICS[0];
const roots: Record<typeof positions[number], string[]> = {
  A: ['3:5', '5:3'], G: ['1:8', '3:5', '6:8'], E: ['1:8', '4:10', '6:8'],
  D: ['2:13', '4:10'], C: ['2:13', '5:15'],
};

describe('source-derived minor positions', () => {
  it('matches the C chart root anchors and named chord form identities', () => {
    for (const family of families) for (const position of positions) {
      const points = minorPosition(c, family, position);
      expect(points.filter(p => p.chroma === 0).map(p => `${p.string}:${p.fret}`).sort()).toEqual([...roots[position]].sort());
      expect(new Set(points.map(p => p.string)).size).toBe(6);
    }
  });
  it('transposes whole patterns for every supported parent, preserving all seven pitches and strings', () => {
    for (const family of families) for (const position of positions) for (const tonic of SUPPORTED_TONICS) {
      const points = minorPosition(tonic, family, position), original = minorPosition(c, family, position);
      const expected = deriveMode(tonic, family, 1).notes.map(n => n.pitchClass).sort((a,b) => a-b);
      expect([...new Set(points.map(p => p.chroma))].sort((a,b) => a-b)).toEqual(expected);
      expect(points.map(p => p.string)).toEqual(original.map(p => p.string));
      const shift = points[0].fret - original[0].fret;
      expect(((shift - tonic.pitchClass) % 12 + 12) % 12).toBe(0);
      expect(points.every((p, i) => p.fret - original[i].fret === shift && p.chroma === ([4,11,7,2,9,4][p.string-1] + p.fret) % 12)).toBe(true);
      expect(Math.min(...points.map(p => p.fret))).toBeGreaterThanOrEqual(1);
      expect(Math.max(...points.map(p => p.fret))).toBeLessThanOrEqual(18);
    }
  });
  it('retains physical points for the requested derivative modes', () => {
    for (const [letter, family, degree, modeRoot] of [['D','jazz-melodic-minor',3,'F'], ['C','harmonic-minor',6,'Ab'], ['D','harmonic-minor',6,'Bb']] as const) {
      const tonic = SUPPORTED_TONICS.find(n => n.letter === letter && n.accidental === 0)!;
      const base = guidedPractice(tonic, family, 1), mode = guidedPractice(tonic, family, degree);
      expect(mode.mode.tonic.letter + (mode.mode.tonic.accidental === -1 ? 'b' : '')).toBe(modeRoot);
      for (const position of positions) expect(minorPosition(mode.parentTonic, family, position)).toEqual(minorPosition(base.parentTonic, family, position));
    }
  });
});
