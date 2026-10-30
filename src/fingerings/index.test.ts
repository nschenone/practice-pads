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
  it('round trips order, isolates context, and refuses invalid imports without data loss', () => {
    const s = createFingeringStorage(storage());
    const f = { id: 'local', source: 'synthetic', review: 'unreviewed' as const, events: [eventAt(context, 2, 2), eventAt(context, 2, 0), eventAt(context, 2, 2)] };
    s.save(context, f); const json = s.exportJSON();
    expect(exerciseKeys(s.get(context)!)).toEqual(['c#/5', 'b/4', 'c#/5']);
    expect(s.get({ ...context, position: 'A' })).toBeUndefined();
    expect(contextKey(context)).not.toEqual(contextKey({ ...context, family: 'harmonic-minor' }));
    expect(() => s.importJSON('{"version":1,"mappings":[{"__proto__":{}}]}')).toThrow();
    expect(s.exportJSON()).toBe(json); s.reset(context); expect(s.get(context)).toBeUndefined(); s.importJSON(json); expect(s.get(context)).toEqual(f);
    expect(() => parseMappings(json.replace('"fret": 2', '"fret": 2.5'))).toThrow();
  });
});
