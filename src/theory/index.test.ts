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
  it('checks all 28 formula and literal chord rows', () => {
    SCALE_FAMILIES.forEach((family, fi) => { for (let i = 0; i < 7; i++) {
      const degree = (i + 1) as ModeDegree, mode = deriveMode(c, family, degree);
      const row = rows[family === 'natural-minor' ? (i + 5) % 7 : fi * 7 + i];
      expect(modeMetadata(family, degree).intervalLabels).toEqual(row[0]);
      expect(literalChord(mode).quality).toBe(row[1]);
      expect(literalChord(mode).tones).toEqual([mode.notes[0], mode.notes[2], mode.notes[4], mode.notes[6]]);
    }});
  });
  it('offers natural minor as its own parent and modal family', () => {
    const a = SUPPORTED_TONICS.find(n => noteName(n) === 'A')!;
    const practice = guidedPractice(a, 'natural-minor', 1, 'E');
    expect(names(practice.mode.notes)).toEqual(['A','B','C','D','E','F','G']);
    expect(practice.mode.name).toBe('Aeolian');
    expect(practice.chord.symbol).toBe('Am7');
    expect(modeMetadata('natural-minor', 1).aliases).toEqual(['Natural minor']);
    expect(Array.from({ length: 7 }, (_, i) => guidedPractice(a, 'natural-minor', (i + 1) as ModeDegree).chord.symbol)).toEqual(['Am7','Bm7b5','Cmaj7','Dm7','Em7','Fmaj7','G7']);
    const sixth = guidedPractice(a, 'natural-minor', 6, 'E');
    expect(sixth.mode.name).toBe('Lydian');
    expect(names(sixth.mode.notes)).toEqual(['F','G','A','B','C','D','E']);
    expect(sixth.parentTonic).toEqual(a);
    expect(sixth.positionId).toBe('E');
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
  it('matches the supplied C spread MIDI without adding dominant tensions', () => {
    const fixtures = [
      ['maj7', ['C3:48', 'C4:60', 'G4:67', 'B4:71', 'E5:76']],
      ['m(maj7)', ['C3:48', 'C4:60', 'G4:67', 'B4:71', 'Eb5:75']],
      ['m7b5', ['C3:48', 'C4:60', 'Gb4:66', 'Bb4:70', 'Eb5:75']],
      ['7', ['C3:48', 'G3:55', 'C4:60', 'E4:64', 'Bb4:70']],
    ] as const;
    expect(playbackVoicing(constructChord(c, 'maj7')).pitches.map(p => p.midi)).toEqual([48, 52, 55, 59]);
    for (const [quality, expected] of fixtures) {
      const chord = constructChord(c, quality);
      expect(playbackVoicing(chord, 3, 'spread').pitches.map(p => `${noteName(p)}${p.octave}:${p.midi}`)).toEqual(expected);
      expect(chord.tones).toEqual(constructChord(c, quality).tones);
    }
    const superlocrian = literalChord(deriveMode(SUPPORTED_TONICS[1], 'jazz-melodic-minor', 7));
    expect(superlocrian.symbol).toBe('Cm7b5');
    expect(playbackVoicing(superlocrian, 3, 'spread').pitches.map(p => p.midi)).toEqual([48, 60, 66, 70, 75]);
    expect(playbackVoicing(constructChord(d, 'maj7'), 3, 'spread').pitches.map(p => `${noteName(p)}${p.octave}:${p.midi}`)).toEqual(['D3:50', 'D4:62', 'A4:69', 'C#5:73', 'F#5:78']);
    expect(playbackVoicing(constructChord(d, '7'), 3, 'spread').pitches.map(p => p.midi)).toEqual([50, 57, 62, 66, 72]);
  });
  it('projects unsupported spread qualities with only literal tones and a doubled bass', () => {
    for (const quality of ['m7', 'maj7#5', 'dim7'] as const) {
      const chord = constructChord(c, quality);
      const close = playbackVoicing(chord).pitches;
      const spread = playbackVoicing(chord, 3, 'spread').pitches;
      expect(spread.map(p => p.midi)).toEqual([close[0].midi, close[0].midi + 12, ...close.slice(1).map(p => p.midi + 12)]);
      expect(spread.map(p => noteName(p))).toEqual([noteName(chord.root), ...chord.tones.map(noteName)]);
    }
  });
  it('preserves close defaults and spelled chord tones for every parent, mode and quality', () => {
    for (const root of SUPPORTED_TONICS) for (const quality of ['maj7', 'm7', '7', 'm7b5', 'm(maj7)', 'maj7#5', 'dim7'] as const) {
      const chord = constructChord(root, quality);
      const spread = playbackVoicing(chord, 3, 'spread').pitches;
      expect(spread).toHaveLength(5);
      expect(names(spread).sort()).toEqual([noteName(root), ...names(chord.tones)].sort());
      expect(spread.every(p => p.midi >= 0 && p.midi <= 127 && Note.get(`${noteName(p)}${p.octave}`).midi === p.midi)).toBe(true);
    }
    for (const tonic of SUPPORTED_TONICS) for (const family of SCALE_FAMILIES) for (let degree = 1; degree <= 7; degree++) {
      const chord = literalChord(deriveMode(tonic, family, degree as ModeDegree));
      const close = playbackVoicing(chord);
      const spread = playbackVoicing(chord, 3, 'spread').pitches;
      expect(playbackVoicing(chord, 3, 'close')).toEqual(close);
      expect(spread).toHaveLength(5);
      expect(spread.map(p => p.midi)).toEqual([...spread.map(p => p.midi)].sort((a, b) => a - b));
      expect(spread.every(p => p.midi >= 0 && p.midi <= 127 && Note.get(`${noteName(p)}${p.octave}`).midi === p.midi)).toBe(true);
      expect(names(spread).sort()).toEqual([noteName(chord.root), ...names(chord.tones)].sort());
    }
  });
  it('rejects malformed spread inputs and MIDI overflow while preserving close validation', () => {
    const chord = constructChord(c, 'maj7');
    expect(() => playbackVoicing(chord, 3, 'wide' as never)).toThrow(RangeError);
    expect(() => playbackVoicing({ ...chord, symbol: 'C7' }, 3, 'spread')).toThrow(RangeError);
    expect(() => playbackVoicing(chord, 8, 'spread')).toThrow(RangeError);
    expect(() => playbackVoicing(chord, -2, 'spread')).toThrow(RangeError);
    expect(playbackVoicing(chord, -1, 'spread').pitches.every(p => p.midi >= 0)).toBe(true);
    const bSharp: SpelledPitchClass = { letter: 'B', accidental: 1, pitchClass: 0 };
    expect(playbackVoicing(constructChord(bSharp, 'm7'), 3, 'spread').pitches.map(p => `${noteName(p)}${p.octave}:${p.midi}`)).toEqual(['B#3:60', 'B#4:72', 'D#5:75', 'F##5:79', 'A#5:82']);
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
