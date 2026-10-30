import { FretboardSystem, Systems } from '@moonwave99/fretboard.js';
import { Note } from '@tonaljs/tonal';
import type { FingeringEvent, SpelledPitchClass, ScaleFamily } from '../contracts';
import { noteName } from '../theory';
import { C_MINOR_POSITION_FRETS } from './minor-position-data';
export { MINOR_POSITION_SOURCE } from './minor-position-data';

/** Library CAGED positions are upstream data, not teacher-reviewed fingerings. */
export type MajorPosition = 'C' | 'A' | 'G' | 'E' | 'D';
export function majorPosition(parentTonic: SpelledPitchClass, position: MajorPosition) {
  if (!['C', 'A', 'G', 'E', 'D'].includes(position)) throw new RangeError('Invalid CAGED position');
  return new FretboardSystem({ fretCount: 24 }).getScale({ root: noteName(parentTonic), type: 'major', box: { system: Systems.CAGED, box: position } }).filter(point => point.inBox);
}

/** Chart-derived physical points, not fingerings or an ordered exercise. */
export function minorPosition(parentTonic: SpelledPitchClass, family: Exclude<ScaleFamily, 'major'>, position: MajorPosition): { string: number; fret: number; chroma: number }[] {
  noteName(parentTonic);
  if (!Object.hasOwn(C_MINOR_POSITION_FRETS, family)) throw new RangeError('Invalid minor family');
  if (!Object.hasOwn(C_MINOR_POSITION_FRETS[family], position)) throw new RangeError('Invalid CAGED position');
  const rows = C_MINOR_POSITION_FRETS[family][position];
  const min = Math.min(...rows.flat());
  const shift = ((min + parentTonic.pitchClass - 1) % 12 + 12) % 12 + 1 - min;
  const tuning = [4, 11, 7, 2, 9, 4];
  return rows.flatMap((frets, index) => frets.map(sourceFret => {
    const fret = sourceFret + shift;
    return { string: index + 1, fret, chroma: (tuning[index] + fret) % 12 };
  }));
}

/** Stable overview bound across every reference shape, independent of the active one. */
export function cagedOverviewLastFret(parentTonic: SpelledPitchClass, family: ScaleFamily): number {
  return Math.max(0, ...(['C','A','G','E','D'] as const).flatMap(position => {
    const points = family === 'major' ? majorPosition(parentTonic, position) : minorPosition(parentTonic, family, position);
    return points.map(point => point.fret);
  }));
}

/** Complete upstream parent collection, for a full-neck context view. */
export function parentScaleMap(parentTonic: SpelledPitchClass, family: ScaleFamily) {
  const types = { major: 'major', 'natural-minor': 'minor', 'jazz-melodic-minor': 'melodic minor', 'harmonic-minor': 'harmonic minor' };
  if (!Object.hasOwn(types, family)) throw new RangeError('Invalid scale family');
  return new FretboardSystem({ fretCount: 24 }).getScale({ root: noteName(parentTonic), type: types[family] });
}

/** Legacy unboxed minor collection over frets 0–12. */
export function minorScaleMap(parentTonic: SpelledPitchClass, family: Exclude<ScaleFamily, 'major'>) {
  if (!Object.hasOwn(C_MINOR_POSITION_FRETS, family)) throw new RangeError('Invalid minor family');
  return parentScaleMap(parentTonic, family).filter(point => point.fret <= 12);
}

/** Guitar strings 1–6 run high E to low E. Pitch is sounding, not written octave. */
export function validateFingeringEvent(event: FingeringEvent): void {
  const tuning = ['E4', 'B3', 'G3', 'D3', 'A2', 'E2'];
  if (!Number.isInteger(event.string) || event.string < 1 || event.string > 6 || !Number.isInteger(event.fret) || event.fret < 0 || event.fret > 24) throw new RangeError('Invalid guitar string or fret');
  const midi = Note.get(tuning[event.string - 1]).midi! + event.fret;
  if (!event.pitch || Note.get(`${noteName(event.pitch)}${event.pitch.octave}`).midi !== midi || event.pitch.midi !== midi) throw new RangeError('Fingering pitch does not match string and fret');
}
export { GuitarExercise, GuitarFretboard, ModeStaff, exerciseKeys, modeScaleKeys, notationKeySignature } from './views';
