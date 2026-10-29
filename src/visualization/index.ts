import { FretboardSystem, Systems } from '@moonwave99/fretboard.js';
import { Note } from '@tonaljs/tonal';
import type { FingeringEvent, SpelledPitchClass } from '../contracts';
import { noteName } from '../theory';

/** Library CAGED positions are upstream data, not teacher-reviewed fingerings. */
export type MajorPosition = 'C' | 'A' | 'G' | 'E' | 'D';
export function majorPosition(parentTonic: SpelledPitchClass, position: MajorPosition) {
  if (!['C', 'A', 'G', 'E', 'D'].includes(position)) throw new RangeError('Invalid CAGED position');
  return new FretboardSystem({ fretCount: 24 }).getScale({ root: noteName(parentTonic), type: 'major', box: { system: Systems.CAGED, box: position } }).filter(point => point.inBox);
}

/** Guitar strings 1–6 run high E to low E. Pitch is sounding, not written octave. */
export function validateFingeringEvent(event: FingeringEvent): void {
  const tuning = ['E4', 'B3', 'G3', 'D3', 'A2', 'E2'];
  if (!Number.isInteger(event.string) || event.string < 1 || event.string > 6 || !Number.isInteger(event.fret) || event.fret < 0 || event.fret > 24) throw new RangeError('Invalid guitar string or fret');
  const midi = Note.get(tuning[event.string - 1]).midi! + event.fret;
  if (!event.pitch || Note.get(`${noteName(event.pitch)}${event.pitch.octave}`).midi !== midi || event.pitch.midi !== midi) throw new RangeError('Fingering pitch does not match string and fret');
}
export { GuitarExercise, GuitarFretboard, ModeStaff, exerciseKeys, modeScaleKeys, notationKeySignature } from './views';
