import type { Chord, ChordQuality, GuidedPractice, ModeDegree, ModeIdentity, Pitch, PitchClass, PitchCompatibleCandidate, PlaybackVoicing, ScaleFamily, SpelledPitchClass } from '../contracts';

const letters = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const;
const natural = [0, 2, 4, 5, 7, 9, 11];
const mod = (n: number) => ((n % 12) + 12) % 12;
const families: Record<ScaleFamily, { intervals: number[]; names: string[]; aliases: string[][]; qualities: ChordQuality[]; characteristics: number[][] }> = {
  major: { intervals: [0, 2, 4, 5, 7, 9, 11], names: ['Ionian', 'Dorian', 'Phrygian', 'Lydian', 'Mixolydian', 'Aeolian', 'Locrian'], aliases: [[], [], [], [], [], [], []], qualities: ['maj7', 'm7', 'm7', 'maj7', '7', 'm7', 'm7b5'], characteristics: [[], [], [], [4], [], [], []] },
  'jazz-melodic-minor': { intervals: [0, 2, 3, 5, 7, 9, 11], names: ['Jazz melodic minor', 'Dorian b2', 'Lydian augmented', 'Lydian dominant', 'Mixolydian b6', 'Locrian natural 2', 'Superlocrian'], aliases: [[], [], [], [], [], [], ['Altered']], qualities: ['m(maj7)', 'm7', 'maj7#5', '7', '7', 'm7b5', 'm7b5'], characteristics: [[], [], [4, 5], [4], [6], [], []] },
  'harmonic-minor': { intervals: [0, 2, 3, 5, 7, 8, 11], names: ['Harmonic minor', 'Locrian natural 6', 'Ionian augmented', 'Dorian #4', 'Phrygian dominant', 'Lydian #2', 'Ultralocrian'], aliases: [[], [], [], [], [], [], []], qualities: ['m(maj7)', 'm7b5', 'maj7#5', 'm7', '7', 'maj7', 'dim7'], characteristics: [[], [], [], [], [2, 6], [], []] },
};
const chordIntervals: Record<ChordQuality, number[]> = { maj7: [0, 4, 7, 11], m7: [0, 3, 7, 10], '7': [0, 4, 7, 10], m7b5: [0, 3, 6, 10], 'm(maj7)': [0, 3, 7, 11], 'maj7#5': [0, 4, 8, 11], dim7: [0, 3, 6, 9] };

function validateNote(note: SpelledPitchClass): void {
  if (!note || !letters.includes(note.letter) || !Number.isInteger(note.accidental) || note.accidental < -2 || note.accidental > 2 || !Number.isInteger(note.pitchClass) || note.pitchClass < 0 || note.pitchClass > 11 || mod(natural[letters.indexOf(note.letter)] + note.accidental) !== note.pitchClass) throw new RangeError('Invalid or inconsistent spelled pitch class');
}
function spell(letterIndex: number, pitchClass: number): SpelledPitchClass {
  const i = letterIndex % 7;
  let accidental = mod(pitchClass - natural[i]);
  if (accidental > 6) accidental -= 12;
  if (accidental < -2 || accidental > 2) throw new RangeError('Spelling requires more than a double accidental');
  return { letter: letters[i], accidental: accidental as SpelledPitchClass['accidental'], pitchClass: mod(pitchClass) as PitchClass };
}
function familyData(family: ScaleFamily) {
  if (typeof family !== 'string' || !Object.hasOwn(families, family)) throw new RangeError('Unsupported scale family');
  return families[family];
}
function degreeIndex(degree: ModeDegree): number {
  if (!Number.isInteger(degree) || degree < 1 || degree > 7) throw new RangeError('Invalid mode degree');
  return degree - 1;
}
export const SUPPORTED_TONICS: readonly Readonly<SpelledPitchClass>[] = Object.freeze([spell(0, 0), spell(1, 1), spell(1, 2), spell(2, 3), spell(2, 4), spell(3, 5), spell(3, 6), spell(4, 7), spell(5, 8), spell(5, 9), spell(6, 10), spell(6, 11)].map(note => Object.freeze(note)));
export const SCALE_FAMILIES: readonly ScaleFamily[] = Object.freeze(['major', 'jazz-melodic-minor', 'harmonic-minor']);

export function noteName(note: SpelledPitchClass): string {
  validateNote(note);
  return note.letter + (note.accidental < 0 ? 'b'.repeat(-note.accidental) : '#'.repeat(note.accidental));
}
export function deriveMode(parentTonic: SpelledPitchClass, family: ScaleFamily, degree: ModeDegree): ModeIdentity {
  validateNote(parentTonic);
  const data = familyData(family), index = degreeIndex(degree), start = letters.indexOf(parentTonic.letter);
  const notes = data.intervals.map((interval, i) => spell((start + i) % 7, parentTonic.pitchClass + interval));
  const rotated = [...notes.slice(index), ...notes.slice(0, index)];
  return { family, degree, name: data.names[index], tonic: { ...rotated[0] }, notes: rotated };
}
/** Labels and characteristic degrees are relative to the mode tonic; degrees are one-based. */
export function modeMetadata(family: ScaleFamily, degree: ModeDegree): { aliases: string[]; intervalLabels: string[]; characteristicDegrees: number[] } {
  const data = familyData(family), index = degreeIndex(degree);
  const base = [0, 2, 4, 5, 7, 9, 11];
  const intervalLabels = base.map((value, i) => {
    const diff = mod(data.intervals[(index + i) % 7] - data.intervals[index]) - value;
    return (diff < 0 ? 'b'.repeat(-diff) : '#'.repeat(diff)) + (i + 1);
  });
  return { aliases: [...data.aliases[index]], intervalLabels, characteristicDegrees: [...data.characteristics[index]] };
}
export function constructChord(root: SpelledPitchClass, quality: ChordQuality): Chord {
  validateNote(root);
  if (typeof quality !== 'string' || !Object.hasOwn(chordIntervals, quality)) throw new RangeError('Unsupported chord quality');
  const start = letters.indexOf(root.letter);
  return { root: { ...root }, quality, symbol: noteName(root) + quality, tones: chordIntervals[quality].map((interval, i) => spell((start + 2 * i) % 7, root.pitchClass + interval)) };
}
export function literalChord(mode: ModeIdentity): Chord {
  // Re-derive from its first note as a consistency check of the supplied mode collection.
  if (!mode || !Array.isArray(mode.notes) || mode.notes.length !== 7) throw new RangeError('Invalid mode');
  const data = familyData(mode.family), index = degreeIndex(mode.degree);
  validateNote(mode.tonic);
  const start = letters.indexOf(mode.tonic.letter);
  const expected = data.intervals.map((_, i) => spell((start + i) % 7, mode.tonic.pitchClass + mod(data.intervals[(index + i) % 7] - data.intervals[index])));
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
/** Ascending close-position chord, with root at the specified written octave. */
export function playbackVoicing(chord: Chord, rootOctave = 3): PlaybackVoicing {
  if (!Number.isInteger(rootOctave)) throw new RangeError('Invalid octave');
  if (!chord || typeof chord !== 'object') throw new RangeError('Invalid chord');
  const expected = constructChord(chord.root, chord.quality);
  if (chord.symbol !== expected.symbol || !Array.isArray(chord.tones) || chord.tones.length !== 4) throw new RangeError('Inconsistent chord');
  for (let i = 0; i < expected.tones.length; i++) {
    if (!Object.hasOwn(chord.tones, i)) throw new RangeError('Inconsistent chord');
    const n = chord.tones[i];
    validateNote(n);
    if (n.letter !== expected.tones[i].letter || n.accidental !== expected.tones[i].accidental || n.pitchClass !== expected.tones[i].pitchClass) throw new RangeError('Inconsistent chord');
  }
  const rootIndex = letters.indexOf(chord.root.letter);
  const pitches: Pitch[] = expected.tones.map((note, i) => {
    const octave = rootOctave + Math.floor((rootIndex + 2 * i) / 7);
    const midi = 12 * (octave + 1) + natural[letters.indexOf(note.letter)] + note.accidental;
    if (midi < 0 || midi > 127) throw new RangeError('Pitch outside MIDI range');
    return { ...note, octave, midi };
  });
  return { pitches };
}
