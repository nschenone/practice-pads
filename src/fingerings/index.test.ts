import { describe, expect, it } from 'vitest';
import { contextKey, createFingeringStorage, eventAt, parseMappings } from './index';
import { SUPPORTED_TONICS, guidedPractice } from '../theory';
import { minorScaleMap, exerciseKeys } from '../visualization';
import { Scale } from '@tonaljs/tonal';
import type { FingeringContext } from './index';
const d = SUPPORTED_TONICS.find(n => n.letter === 'D' && n.accidental === 0)!;
const context: FingeringContext = { parentTonic: d, family: 'jazz-melodic-minor', position: 'C' };
function storage() { const map = new Map<string,string>(); return { getItem: (k: string) => map.get(k) ?? null, setItem: (k: string,v: string) => { map.set(k,v); }, removeItem: (k: string) => { map.delete(k); }, clear: () => map.clear(), key: (i: number) => [...map.keys()][i] ?? null, get length() { return map.size; } }; }
describe('minor parent mapping', () => {
  it('gets complete upstream collections and keeps coordinates across modes', () => {
    for (const [family, scale] of [['jazz-melodic-minor', 'melodic minor'], ['harmonic-minor', 'harmonic minor']] as const) {
      const a = guidedPractice(d, family, 1), b = guidedPractice(d, family, 3);
      const points = minorScaleMap(a.parentTonic, family);
      expect(new Set(points.map(p => p.chroma))).toEqual(new Set(Scale.get(`D ${scale}`).notes.map(n => b.mode.notes.find(p => p.letter + (p.accidental === 1 ? '#' : p.accidental === -1 ? 'b' : '') === n)!.pitchClass)));
      expect(points).toEqual(minorScaleMap(b.parentTonic, family));
      expect(points.some(p => p.chroma === 5)).toBe(true);
      if (family === 'harmonic-minor') expect(points.some(p => p.chroma === 10)).toBe(true);
    }
  });
  it('retains parent spelling across enharmonic octave boundaries', () => {
    const sharpMinor: FingeringContext = { ...context, parentTonic: { letter: 'C', accidental: 1, pitchClass: 1 }, family: 'harmonic-minor' };
    expect(eventAt(sharpMinor, 2, 1).pitch).toEqual({ letter: 'B', accidental: 1, pitchClass: 0, octave: 3, midi: 60 });
    const doubleSharp: FingeringContext = { ...context, parentTonic: { letter: 'G', accidental: 1, pitchClass: 8 }, family: 'harmonic-minor' };
    expect(eventAt(doubleSharp, 1, 3).pitch).toEqual({ letter: 'F', accidental: 2, pitchClass: 7, octave: 4, midi: 67 });
  });
  it('can reimport its own backup near the collection size limit', () => {
    const raw = storage(), original = createFingeringStorage(raw);
    const contexts: FingeringContext[] = [
      ...(['C', 'A', 'G', 'E', 'D'] as const).map(position => ({ ...context, position })),
      { ...context, family: 'harmonic-minor' },
    ];
    for (const ctx of contexts) original.save(ctx, {
      id: contextKey(ctx), source: 'synthetic size-boundary regression', review: 'unreviewed',
      events: Array(256).fill(eventAt(ctx, 1, 0)),
    });
    const compact = raw.getItem('practice-pads-fingerings-v1')!;
    expect(compact.length).toBeLessThan(200_000);
    expect(JSON.stringify(JSON.parse(compact), null, 2).length).toBeGreaterThan(200_000);
    const backup = original.exportJSON(), restored = createFingeringStorage(storage());
    restored.importJSON(backup);
    expect(restored.exportJSON()).toBe(backup);
    expect(parseMappings(backup).mappings).toHaveLength(6);
  });
  it('reports unavailable, quota and corrupt storage without overwriting saved data', () => {
    const raw = storage(), good = createFingeringStorage(raw);
    const f = { id: 'local', source: 'synthetic', review: 'unreviewed' as const, events: [eventAt(context, 1, 0)] };
    good.save(context, f); const backup = good.exportJSON();
    const unavailable = createFingeringStorage({ ...raw, getItem() { throw new Error('Storage unavailable'); } });
    expect(() => unavailable.get(context)).toThrow('Storage unavailable');
    const full = createFingeringStorage({ ...raw, setItem() { throw new Error('Quota exceeded'); } });
    expect(() => full.importJSON(backup)).toThrow('Quota exceeded');
    expect(good.exportJSON()).toBe(backup);
    raw.setItem('practice-pads-fingerings-v1', '{');
    expect(() => good.save(context, f)).toThrow();
    expect(raw.getItem('practice-pads-fingerings-v1')).toBe('{');
  });
  it('round trips order, isolates context, and refuses invalid imports without data loss', () => {
    const s = createFingeringStorage(storage());
    const f = { id: 'local', source: 'synthetic', review: 'unreviewed' as const, events: [eventAt(context, 2, 2), eventAt(context, 2, 0), eventAt(context, 2, 2)] };
    s.save(context, f); const json = s.exportJSON();
    expect(exerciseKeys(s.get(context)!)).toEqual(['c#/5', 'b/4', 'c#/5']);
    expect(s.get({ ...context, position: 'A' })).toBeUndefined();
    expect(contextKey(context)).not.toEqual(contextKey({ ...context, family: 'harmonic-minor' }));
    expect(() => s.importJSON('{"version":1,"mappings":[{"__proto__":{}}]}')).toThrow();
    expect(s.exportJSON()).toBe(json); s.reset(context); expect(s.get(context)).toBeUndefined(); s.importJSON(json); expect(s.get(context)).toEqual(f);
    const invalid = JSON.parse(json);
    invalid.mappings[0].fingering.events[0].fret = 2.5;
    expect(() => parseMappings(JSON.stringify(invalid))).toThrow();
  });
});
