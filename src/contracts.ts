/** Written spelling is independent of the sounding pitch class (C = 0). */
export type PitchClass = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;
export type SpelledPitchClass = { letter: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G'; accidental: -2 | -1 | 0 | 1 | 2; pitchClass: PitchClass };
/** MIDI note number identifies the actual sounding pitch, including octave. */
export type Pitch = SpelledPitchClass & { octave: number; midi: number };
export type ScaleFamily = 'major' | 'jazz-melodic-minor' | 'harmonic-minor';
export type ModeDegree = 1 | 2 | 3 | 4 | 5 | 6 | 7;
export type ModeIdentity = { family: ScaleFamily; degree: ModeDegree; name: string; tonic: SpelledPitchClass; notes: SpelledPitchClass[] };
export type ChordQuality = 'maj7' | 'm7' | '7' | 'm7b5' | 'm(maj7)' | 'maj7#5' | 'dim7';
export type Chord = { root: SpelledPitchClass; quality: ChordQuality; symbol: string; tones: SpelledPitchClass[] };
export type GuidedPractice = { kind: 'guided'; parentTonic: SpelledPitchClass; family: ScaleFamily; mode: ModeIdentity; chord: Chord; positionId: string | null };
export type SelfGuidedPractice = { kind: 'self-guided'; root: SpelledPitchClass; quality: ChordQuality };
export type PracticeConfig = GuidedPractice | SelfGuidedPractice;
/** A candidate means chord pitch classes are contained in the mode, not a harmonic recommendation. */
export type PitchCompatibleCandidate = { parentTonic: SpelledPitchClass; mode: ModeIdentity; chord: Chord };
export type PlaybackVoicing = { pitches: Pitch[] };
export type PlaybackStatus =
  | { state: 'stopped' }
  | { state: 'starting' }
  | { state: 'playing' }
  | { state: 'error'; message: string };
export type FingeringEvent = { string: 1 | 2 | 3 | 4 | 5 | 6; fret: number; pitch: Pitch };
export type Fingering = { id: string; source: string; review: 'unreviewed' | 'reviewed' | 'rejected'; events: FingeringEvent[] };
