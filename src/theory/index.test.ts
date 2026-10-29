import { Chord as TonalChord, Interval, Note, Scale } from '@tonaljs/tonal';
import { describe, expect, it } from 'vitest';
import { compatibleCandidates, constructChord, deriveMode, guidedPractice, literalChord, modeMetadata, noteName, playbackVoicing, SCALE_FAMILIES, SUPPORTED_TONICS } from './index';
import type { ModeDegree, SpelledPitchClass } from '../contracts';

const c = SUPPORTED_TONICS[0], d = SUPPORTED_TONICS[2], f = SUPPORTED_TONICS[5];
const names = (notes: SpelledPitchClass[]) => notes.map(noteName);
const rows = [
  [['1','2','3','4','5','6','7'], 'maj7'], [['1','2','b3','4','5','6','b7'], 'm7'], [['1','b2','b3','4','5','b6','b7'], 'm7'], [['1','2','3','#4','5','6','7'], 'maj7'], [['1','2','3','4','5','6','b7'], '7'], [['1','2','b3','4','5','b6','b7'], 'm7'], [['1','b2','b3','4','b5','b6','b7'], 'm7b5'],
  [['1','2','b3','4','5','6','7'], 'm(maj7)'], [['1','b2','b3','4','5','6','b7'], 'm7'], [['1','2','3','#4','#5','6','7'], 'maj7#5'], [['1','2','3','#4','5','6','b7'], '7'], [['1','2','3','4','5','b6','b7'], '7'], [['1','2','b3','4','b5','b6','b7'], 'm7b5'], [['1','b2','b3','b4','b5','b6','b7'], 'm7b5'],
  [['1','2','b3','4','5','b6','7'], 'm(maj7)'], [['1','b2','b3','4','b5','6','b7'], 'm7b5'], [['1','2','3','4','#5','6','7'], 'maj7#5'], [['1','2','b3','#4','5','6','b7'], 'm7'], [['1','b2','3','4','5','b6','b7'], '7'], [['1','#2','3','#4','5','6','7'], 'maj7'], [['1','b2','b3','b4','b5','b6','bb7'], 'dim7'],
] as const;
describe('theory', () => {
  it('checks all 21 formula and literal chord rows', () => {
    SCALE_FAMILIES.forEach((family, fi) => { for (let i = 0; i < 7; i++) {
      const degree = (i + 1) as ModeDegree, mode = deriveMode(c, family, degree);
      expect(modeMetadata(family, degree).intervalLabels).toEqual(rows[fi * 7 + i][0]);
      expect(literalChord(mode).quality).toBe(rows[fi * 7 + i][1]);
      expect(literalChord(mode).tones).toEqual([mode.notes[0], mode.notes[2], mode.notes[4], mode.notes[6]]);
    }});
  });
  it('derives every supported parent and family', () => {
    for (const tonic of SUPPORTED_TONICS) for (const family of SCALE_FAMILIES) for (let i = 1; i <= 7; i++) {
      const mode = deriveMode(tonic, family, i as ModeDegree);
      expect(new Set(mode.notes.map(n => n.letter)).size).toBe(7);
      expect(literalChord(mode).tones).toHaveLength(4);
    }
  });
  it('preserves parent, position, and characteristic/chord overlap', () => {
    const first = guidedPractice(d, 'jazz-melodic-minor', 1, 'shape');
    const third = guidedPractice(first.parentTonic, first.family, 3, first.positionId);
    expect(first.chord.symbol).toBe('Dm(maj7)');
    expect(third.chord.symbol).toBe('Fmaj7#5');
    expect(names(third.mode.notes)).toEqual(['F','G','A','B','C#','D','E']);
    expect(modeMetadata(third.family, 3).characteristicDegrees).toEqual([4, 5]);
    expect(names(third.chord.tones)).toEqual(['F','A','C#','E']);
    expect(third.positionId).toBe('shape');
  });
  it('constructs spelled chords and validates enharmonic identities', () => {
    const db = SUPPORTED_TONICS[1], cs: SpelledPitchClass = { letter: 'C', accidental: 1, pitchClass: 1 };
    expect(names(constructChord(db, 'maj7').tones)).toEqual(['Db','F','Ab','C']);
    expect(names(constructChord(cs, 'maj7').tones)).toEqual(['C#','E#','G#','B#']);
    expect(constructChord(db, 'maj7').tones.map(n => n.pitchClass)).toEqual(constructChord(cs, 'maj7').tones.map(n => n.pitchClass));
    expect(() => constructChord({ ...c, pitchClass: 1 }, 'maj7')).toThrow();
    expect(() => constructChord({ letter: 'B', accidental: 2, pitchClass: 1 }, 'maj7#5')).toThrow();
    expect(() => deriveMode(c, 'bad' as never, 1)).toThrow();
    expect(() => deriveMode(c, 'major', 0 as never)).toThrow();
  });
  it('constructs every offered quality on every conventional root', () => {
    for (const root of SUPPORTED_TONICS) for (const quality of ['maj7', 'm7', '7', 'm7b5', 'm(maj7)', 'maj7#5', 'dim7'] as const) {
      expect(constructChord(root, quality).tones).toHaveLength(4);
      // Every offered quality is a literal chord in the catalog, so each has matches.
      expect(compatibleCandidates(root, quality).length).toBeGreaterThan(0);
    }
  });
  it('matches containment with input chord and parent provenance deterministically', () => {
    const candidates = compatibleCandidates(f, 'maj7#5');
    expect(candidates).toEqual(compatibleCandidates(f, 'maj7#5'));
    expect(candidates.some(x => x.parentTonic.pitchClass === d.pitchClass && x.mode.family === 'jazz-melodic-minor' && x.mode.degree === 3)).toBe(true);
    expect(candidates.every(x => x.chord.symbol === 'Fmaj7#5' && x.chord.tones.every(t => x.mode.notes.some(n => n.pitchClass === t.pitchClass)))).toBe(true);
    expect(candidates.some(x => literalChord(x.mode).symbol !== x.chord.symbol)).toBe(true);
    expect(() => compatibleCandidates(c, 'bad' as never)).toThrow();
  });
  it('protects catalog and returned values from mutations affecting later calls', () => {
    const before = compatibleCandidates(f, 'maj7#5');
    expect(Reflect.set(SUPPORTED_TONICS[0], 'pitchClass', 1)).toBe(false);
    expect(Reflect.set(SUPPORTED_TONICS, '0', d)).toBe(false);
    expect(Reflect.set(SCALE_FAMILIES, '0', 'harmonic-minor')).toBe(false);
    const metadata = modeMetadata('jazz-melodic-minor', 3);
    metadata.characteristicDegrees.push(7);
    const altered = modeMetadata('jazz-melodic-minor', 7);
    altered.aliases[0] = 'changed';
    expect(modeMetadata('jazz-melodic-minor', 3).characteristicDegrees).toEqual([4, 5]);
    expect(modeMetadata('jazz-melodic-minor', 7).aliases).toEqual(['Altered']);
    const results = compatibleCandidates(f, 'maj7#5');
    results[0].chord.tones[0].pitchClass = 0;
    expect(results[1].chord).toEqual(before[1].chord);
    results[0].mode.tonic.pitchClass = 0;
    expect(results[0].mode.notes[0]).toEqual(before[0].mode.notes[0]);
    expect(compatibleCandidates(f, 'maj7#5')).toEqual(before);
  });
  it('rejects missing and malformed public inputs and every missing indexed note', () => {
    for (const missing of [null, undefined]) {
      expect(() => playbackVoicing(missing as never)).toThrow(RangeError);
      expect(() => literalChord(missing as never)).toThrow(RangeError);
      expect(() => noteName(missing as never)).toThrow(RangeError);
      expect(() => deriveMode(missing as never, 'major', 1)).toThrow(RangeError);
      expect(() => constructChord(missing as never, 'maj7')).toThrow(RangeError);
      expect(() => compatibleCandidates(missing as never, 'maj7')).toThrow(RangeError);
    }
    expect(() => deriveMode(c, ['major'] as never, 1)).toThrow(RangeError);
    expect(() => constructChord(c, ['maj7'] as never)).toThrow(RangeError);
    const mode = deriveMode(c, 'major', 1), chord = constructChord(c, 'maj7');
    for (let i = 0; i < 7; i++) {
      const sparse = [...mode.notes]; delete sparse[i];
      expect(() => literalChord({ ...mode, notes: sparse })).toThrow(RangeError);
      const undefinedNote = [...mode.notes]; undefinedNote[i] = undefined as never;
      expect(() => literalChord({ ...mode, notes: undefinedNote })).toThrow(RangeError);
    }
    for (let i = 0; i < 4; i++) {
      const sparse = [...chord.tones]; delete sparse[i];
      expect(() => playbackVoicing({ ...chord, tones: sparse })).toThrow(RangeError);
      const undefinedTone = [...chord.tones]; undefinedTone[i] = undefined as never;
      expect(() => playbackVoicing({ ...chord, tones: undefinedTone })).toThrow(RangeError);
    }
  });
  it('computes written octave crossing and MIDI', () => {
    const bSharp: SpelledPitchClass = { letter: 'B', accidental: 1, pitchClass: 0 };
    const voicing = playbackVoicing(constructChord(bSharp, 'm7'), 3);
    expect(voicing.pitches.map(p => [noteName(p), p.octave, p.midi])).toEqual([['B#',3,60],['D#',4,63],['F##',4,67],['A#',4,70]]);
    expect(() => playbackVoicing(constructChord(c, 'maj7'), 10)).toThrow();
  });
});

it('cross-checks Tonal scale, interval, chord and written-octave APIs', () => {
  const parent = Scale.get('D melodic minor');
  expect(names(deriveMode(d, 'jazz-melodic-minor', 1).notes)).toEqual(parent.notes);
  expect(names(constructChord(f, 'maj7#5').tones)).toEqual(TonalChord.getChord('maj7#5', 'F').notes);
  const seventh = deriveMode(d, 'jazz-melodic-minor', 7);
  expect(names(seventh.notes)).toEqual(['C#', 'D', 'E', 'F', 'G', 'A', 'B']);
  expect(Scale.get('C# altered').notes).not.toEqual(names(seventh.notes));
  expect(Note.transpose('C#', Interval.distance('C#', 'F'))).toBe('F');
  expect(names(literalChord(seventh).tones)).toEqual(TonalChord.getChord('m7b5', 'C#').notes);
  const cb: SpelledPitchClass = { letter: 'C', accidental: -1, pitchClass: 11 };
  const pitch = playbackVoicing(constructChord(cb, 'maj7'), 4).pitches[0];
  expect([pitch.octave, pitch.midi]).toEqual([Note.get('Cb4').oct, Note.get('Cb4').midi]);
});
