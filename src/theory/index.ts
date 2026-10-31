import { Chord as TonalChord, Interval, Note, Scale } from '@tonaljs/tonal';
import type { Chord, ChordQuality, GuidedPractice, ModeDegree, ModeIdentity, Pitch, PitchClass, PitchCompatibleCandidate, PlaybackVoicing, ScaleFamily, SpelledPitchClass } from '../contracts';

const letters = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const;
const families: Record<ScaleFamily, { scale: string; names: string[]; aliases: string[][]; qualities: ChordQuality[]; characteristics: number[][] }> = {
  major: { scale: 'major', names: ['Ionian', 'Dorian', 'Phrygian', 'Lydian', 'Mixolydian', 'Aeolian', 'Locrian'], aliases: [[], [], [], [], [], [], []], qualities: ['maj7', 'm7', 'm7', 'maj7', '7', 'm7', 'm7b5'], characteristics: [[], [], [], [4], [], [], []] },
  'jazz-melodic-minor': { scale: 'melodic minor', names: ['Jazz melodic minor', 'Dorian b2', 'Lydian augmented', 'Lydian dominant', 'Mixolydian b6', 'Locrian natural 2', 'Superlocrian'], aliases: [[], [], [], [], [], [], ['Altered']], qualities: ['m(maj7)', 'm7', 'maj7#5', '7', '7', 'm7b5', 'm7b5'], characteristics: [[], [], [4, 5], [4], [6], [], []] },
  'natural-minor': { scale: 'minor', names: ['Aeolian', 'Locrian', 'Ionian', 'Dorian', 'Phrygian', 'Lydian', 'Mixolydian'], aliases: [['Natural minor'], [], [], [], [], [], []], qualities: ['m7', 'm7b5', 'maj7', 'm7', 'm7', 'maj7', '7'], characteristics: [[], [], [], [], [], [4], []] },
  'harmonic-minor': { scale: 'harmonic minor', names: ['Harmonic minor', 'Locrian natural 6', 'Ionian augmented', 'Dorian #4', 'Phrygian dominant', 'Lydian #2', 'Ultralocrian'], aliases: [[], [], [], [], [], [], []], qualities: ['m(maj7)', 'm7b5', 'maj7#5', 'm7', '7', 'maj7', 'dim7'], characteristics: [[], [], [], [], [2, 6], [], []] },
};
const chordTypes: Record<ChordQuality, string> = { maj7: 'maj7', m7: 'm7', '7': '7', m7b5: 'm7b5', 'm(maj7)': 'mM7', 'maj7#5': 'maj7#5', dim7: 'dim7' };

function fromTonal(name: string): SpelledPitchClass {
  const parsed = Note.get(name);
  if (parsed.empty || parsed.oct !== undefined || parsed.alt < -2 || parsed.alt > 2 || parsed.chroma === undefined) throw new RangeError('Spelling requires at most a double accidental');
  return { letter: parsed.letter as SpelledPitchClass['letter'], accidental: parsed.alt as SpelledPitchClass['accidental'], pitchClass: parsed.chroma as PitchClass };
}
function validateNote(note: SpelledPitchClass): void {
  if (!note || !letters.includes(note.letter) || !Number.isInteger(note.accidental) || note.accidental < -2 || note.accidental > 2 || !Number.isInteger(note.pitchClass) || note.pitchClass < 0 || note.pitchClass > 11) throw new RangeError('Invalid or inconsistent spelled pitch class');
  const name = note.letter + (note.accidental < 0 ? 'b'.repeat(-note.accidental) : '#'.repeat(note.accidental));
  if (Note.get(name).chroma !== note.pitchClass) throw new RangeError('Invalid or inconsistent spelled pitch class');
}
function parentNotes(root: string, scale: string): SpelledPitchClass[] {
  return Scale.get(`${root} ${scale}`).intervals.map(interval => fromTonal(Note.transpose(root, interval)));
}
function modalIntervals(scale: string, index: number): string[] {
  const notes = parentNotes('C', scale).map(noteName);
  const rotated = [...notes.slice(index), ...notes.slice(0, index)];
  return rotated.map(note => Interval.distance(rotated[0], note));
}
function familyData(family: ScaleFamily) {
  if (typeof family !== 'string' || !Object.hasOwn(families, family)) throw new RangeError('Unsupported scale family');
  return families[family];
}
function degreeIndex(degree: ModeDegree): number {
  if (!Number.isInteger(degree) || degree < 1 || degree > 7) throw new RangeError('Invalid mode degree');
  return degree - 1;
}
export const SUPPORTED_TONICS: readonly Readonly<SpelledPitchClass>[] = Object.freeze(['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'].map(fromTonal).map(note => Object.freeze(note)));
export const SCALE_FAMILIES: readonly ScaleFamily[] = Object.freeze(['major', 'jazz-melodic-minor', 'harmonic-minor', 'natural-minor']);

export function noteName(note: SpelledPitchClass): string {
  validateNote(note);
  return note.letter + (note.accidental < 0 ? 'b'.repeat(-note.accidental) : '#'.repeat(note.accidental));
}
export function deriveMode(parentTonic: SpelledPitchClass, family: ScaleFamily, degree: ModeDegree): ModeIdentity {
  validateNote(parentTonic);
  const data = familyData(family), index = degreeIndex(degree);
  const notes = parentNotes(noteName(parentTonic), data.scale);
  const rotated = [...notes.slice(index), ...notes.slice(0, index)];
  return { family, degree, name: data.names[index], tonic: { ...rotated[0] }, notes: rotated };
}
/** Labels and characteristic degrees are relative to the mode tonic; degrees are one-based. */
export function modeMetadata(family: ScaleFamily, degree: ModeDegree): { aliases: string[]; intervalLabels: string[]; extensionLabels: string[]; characteristicDegrees: number[] } {
  const data = familyData(family), index = degreeIndex(degree);
  const intervalLabels = modalIntervals(data.scale, index).map(interval => {
    const { alt, num } = Interval.get(interval);
    if (alt === undefined || num === undefined) throw new RangeError('Invalid interval');
    return (alt < 0 ? 'b'.repeat(-alt) : '#'.repeat(alt)) + num;
  });
  // Descriptive mode degrees, not curated tensions or additional playback notes.
  const extensionLabels = [1, 3, 5].map(i => intervalLabels[i].replace(/\d+$/, degree => String(Number(degree) + 7)));
  return { aliases: [...data.aliases[index]], intervalLabels, extensionLabels, characteristicDegrees: [...data.characteristics[index]] };
}
export function constructChord(root: SpelledPitchClass, quality: ChordQuality): Chord {
  validateNote(root);
  if (typeof quality !== 'string' || !Object.hasOwn(chordTypes, quality)) throw new RangeError('Unsupported chord quality');
  const name = noteName(root);
  const intervals = TonalChord.getChord(chordTypes[quality], name).intervals;
  return { root: { ...root }, quality, symbol: name + quality, tones: intervals.map(interval => fromTonal(Note.transpose(name, interval))) };
}
export function literalChord(mode: ModeIdentity): Chord {
  // Re-derive from its first note as a consistency check of the supplied mode collection.
  if (!mode || !Array.isArray(mode.notes) || mode.notes.length !== 7) throw new RangeError('Invalid mode');
  const data = familyData(mode.family), index = degreeIndex(mode.degree);
  validateNote(mode.tonic);
  const expected = modalIntervals(data.scale, index).map(interval => fromTonal(Note.transpose(noteName(mode.tonic), interval)));
  if (mode.name !== data.names[index]) throw new RangeError('Inconsistent mode');
  for (let i = 0; i < expected.length; i++) {
    if (!Object.hasOwn(mode.notes, i)) throw new RangeError('Inconsistent mode');
    const n = mode.notes[i];
    validateNote(n);
    if (n.letter !== expected[i].letter || n.accidental !== expected[i].accidental || n.pitchClass !== expected[i].pitchClass) throw new RangeError('Inconsistent mode');
  }
  return constructChord(mode.tonic, data.qualities[index]);
}
export function guidedPractice(parentTonic: SpelledPitchClass, family: ScaleFamily, degree: ModeDegree, positionId: string | null = null): GuidedPractice {
  if (positionId !== null && typeof positionId !== 'string') throw new RangeError('Invalid position');
  const mode = deriveMode(parentTonic, family, degree);
  return { kind: 'guided', parentTonic: { ...parentTonic }, family, mode, chord: literalChord(mode), positionId };
}
export function compatibleCandidates(root: SpelledPitchClass, quality: ChordQuality): PitchCompatibleCandidate[] {
  const chord = constructChord(root, quality);
  const result: PitchCompatibleCandidate[] = [];
  for (const parentTonic of SUPPORTED_TONICS) for (const family of SCALE_FAMILIES) for (let degree = 1; degree <= 7; degree++) {
    const mode = deriveMode(parentTonic, family, degree as ModeDegree);
    if (chord.tones.every(tone => mode.notes.some(note => note.pitchClass === tone.pitchClass))) result.push({ parentTonic: { ...parentTonic }, mode, chord: { ...chord, root: { ...chord.root }, tones: chord.tones.map(tone => ({ ...tone })) } });
  }
  return result;
}
/** Close is the existing four-tone default. Spread doubles the bass root; the three referenced qualities raise the third, dominant 7 lowers the fifth relative to the upper root, and unreferenced qualities conservatively keep all four literal tones above the bass. */
export function playbackVoicing(chord: Chord, rootOctave = 3, variant: 'close' | 'spread' = 'close'): PlaybackVoicing {
  if (!Number.isInteger(rootOctave)) throw new RangeError('Invalid octave');
  if (variant !== 'close' && variant !== 'spread') throw new RangeError('Invalid voicing variant');
  if (!chord || typeof chord !== 'object') throw new RangeError('Invalid chord');
  const expected = constructChord(chord.root, chord.quality);
  if (chord.symbol !== expected.symbol || !Array.isArray(chord.tones) || chord.tones.length !== 4) throw new RangeError('Inconsistent chord');
  for (let i = 0; i < expected.tones.length; i++) {
    if (!Object.hasOwn(chord.tones, i)) throw new RangeError('Inconsistent chord');
    const n = chord.tones[i];
    validateNote(n);
    if (n.letter !== expected.tones[i].letter || n.accidental !== expected.tones[i].accidental || n.pitchClass !== expected.tones[i].pitchClass) throw new RangeError('Inconsistent chord');
  }
  const rootName = noteName(chord.root) + rootOctave;
  const intervals = TonalChord.getChord(chordTypes[chord.quality], noteName(chord.root)).intervals;
  const pitches: Pitch[] = intervals.map(interval => {
    const parsed = Note.get(Note.transpose(rootName, interval));
    if (parsed.empty || parsed.oct === undefined || parsed.midi === null || parsed.midi === undefined) throw new RangeError('Pitch outside MIDI range');
    return { ...fromTonal(parsed.pc), octave: parsed.oct, midi: parsed.midi };
  });
  if (variant === 'close') return { pitches };
  const offsets = chord.quality === '7' ? [0, 12, 0, 12]
    : chord.quality === 'maj7' || chord.quality === 'm(maj7)' || chord.quality === 'm7b5' ? [0, 24, 12, 12]
    : [0, 12, 12, 12];
  const raised = pitches.map((pitch, i) => {
    const octave = pitch.octave + offsets[i] / 12, midi = pitch.midi + offsets[i];
    if (midi > 127) throw new RangeError('Pitch outside MIDI range');
    return { ...pitch, octave, midi };
  });
  const upperRoot = { ...pitches[0], octave: pitches[0].octave + 1, midi: pitches[0].midi + 12 };
  if (upperRoot.midi > 127) throw new RangeError('Pitch outside MIDI range');
  return { pitches: [...raised, upperRoot].sort((a, b) => a.midi - b.midi) };
}
