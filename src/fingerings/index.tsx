import { useState } from 'react';
import { Note, Interval } from '@tonaljs/tonal';
import type { Fingering, FingeringEvent, GuidedPractice, ScaleFamily, SpelledPitchClass } from '../contracts';
import { deriveMode, noteName } from '../theory';
import { validateFingeringEvent, type MajorPosition } from '../visualization';

/** Identity deliberately excludes the selected derivative mode. */
export type FingeringContext = { parentTonic: SpelledPitchClass; family: ScaleFamily; position: MajorPosition };
type Entry = { context: FingeringContext; fingering: Fingering };
type Store = { version: 1; mappings: Entry[] };
const key = 'practice-pads-fingerings-v1';
const maxBytes = 200_000, maxMappings = 100, maxEvents = 256;
const tuning = ['E4', 'B3', 'G3', 'D3', 'A2', 'E2'];
const positions = ['C', 'A', 'G', 'E', 'D'];
const families = ['major', 'jazz-melodic-minor', 'harmonic-minor'];
function object(value: unknown, keys: string[]): asserts value is Record<string, any> {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).some(k => !keys.includes(k)) || keys.some(k => !Object.hasOwn(value, k))) throw new Error('Invalid data fields');
}
function text(value: unknown) { if (typeof value !== 'string' || value.length > 200) throw new Error('Invalid text'); }
export function contextKey(context: FingeringContext): string {
  object(context, ['parentTonic', 'family', 'position']);
  object(context.parentTonic, ['letter', 'accidental', 'pitchClass']);
  const root = noteName(context.parentTonic);
  if (!families.includes(context.family) || !positions.includes(context.position)) throw new Error('Invalid context');
  deriveMode(context.parentTonic, context.family, 1);
  return JSON.stringify([root, context.family, context.position]);
}
/** Compute the parent spelling and sounding octave from a standard-tuned coordinate. */
export function eventAt(context: FingeringContext, string: number, fret: number): FingeringEvent {
  contextKey(context);
  if (!Number.isInteger(string) || string < 1 || string > 6 || !Number.isInteger(fret) || fret < 0 || fret > 24) throw new Error('Invalid string or fret');
  const sounding = Note.get(Note.transpose(tuning[string - 1], Interval.fromSemitones(fret)));
  const spelling = deriveMode(context.parentTonic, context.family, 1).notes.find(n => n.pitchClass === sounding.chroma);
  if (!spelling || sounding.midi == null) throw new Error('Coordinate is outside parent collection');
  // Search spelled octaves: enharmonic spellings may cross an octave boundary.
  const octave = Array.from({ length: 12 }, (_, i) => i - 1).find(o => Note.get(`${noteName(spelling)}${o}`).midi === sounding.midi);
  if (octave === undefined) throw new Error('Invalid sounding pitch');
  return { string: string as FingeringEvent['string'], fret, pitch: { ...spelling, octave, midi: sounding.midi } };
}
export function validateMapping(context: FingeringContext, fingering: Fingering): void {
  contextKey(context); object(fingering, ['id', 'source', 'review', 'events']); text(fingering.id); text(fingering.source);
  if (!['unreviewed', 'reviewed', 'rejected'].includes(fingering.review) || !Array.isArray(fingering.events) || fingering.events.length > maxEvents) throw new Error('Invalid mapping');
  for (const event of fingering.events) {
    object(event, ['string', 'fret', 'pitch']); object(event.pitch, ['letter', 'accidental', 'pitchClass', 'octave', 'midi']);
    validateFingeringEvent(event);
    const expected = eventAt(context, event.string, event.fret);
    if (JSON.stringify(event.pitch) !== JSON.stringify(expected.pitch)) {
      const p = event.pitch, q = expected.pitch;
      if (p.letter !== q.letter || p.accidental !== q.accidental || p.pitchClass !== q.pitchClass || p.octave !== q.octave || p.midi !== q.midi) throw new Error('Pitch spelling is outside parent collection');
    }
  }
}
export function parseMappings(json: string): Store {
  if (typeof json !== 'string' || json.length > maxBytes) throw new Error('Import too large');
  const data: unknown = JSON.parse(json); object(data, ['version', 'mappings']);
  if (data.version !== 1 || !Array.isArray(data.mappings) || data.mappings.length > maxMappings) throw new Error('Invalid mappings');
  const seen = new Set<string>();
  for (const entry of data.mappings) { object(entry, ['context', 'fingering']); const id = contextKey(entry.context); if (seen.has(id)) throw new Error('Duplicate context'); seen.add(id); validateMapping(entry.context, entry.fingering); }
  return data as Store;
}
/** Operations throw on corrupt/unavailable storage and never overwrite it on failure. */
export function createFingeringStorage(storage: Storage) {
  const read = () => { const raw = storage.getItem(key); return raw === null ? { version: 1 as const, mappings: [] } : parseMappings(raw); };
  const write = (store: Store) => { const json = JSON.stringify(store); parseMappings(json); storage.setItem(key, json); };
  return {
    get(context: FingeringContext) { return read().mappings.find(e => contextKey(e.context) === contextKey(context))?.fingering; },
    save(context: FingeringContext, fingering: Fingering) { validateMapping(context, fingering); const store = read(), id = contextKey(context); store.mappings = store.mappings.filter(e => contextKey(e.context) !== id); store.mappings.push({ context, fingering }); write(store); },
    reset(context: FingeringContext) { const store = read(), id = contextKey(context); store.mappings = store.mappings.filter(e => contextKey(e.context) !== id); write(store); },
    exportJSON() { return JSON.stringify(read()); },
    importJSON(json: string) { const incoming = parseMappings(json), store = read(); const ids = new Set(incoming.mappings.map(e => contextKey(e.context))); store.mappings = [...store.mappings.filter(e => !ids.has(contextKey(e.context))), ...incoming.mappings]; write(store); },
  };
}

/** Controlled editor; persistence is explicit and supplied separately by the consumer. */
export function FingeringEditor({ practice, context, value, onChange }: { practice: GuidedPractice; context: FingeringContext; value: Fingering | undefined; onChange: (value: Fingering) => void }) {
  const [string, setString] = useState(1), [fret, setFret] = useState(0), [error, setError] = useState('');
  if (noteName(practice.parentTonic) !== noteName(context.parentTonic) || practice.family !== context.family) throw new Error('Editor context mismatch');
  const current: Fingering = value ?? { id: contextKey(context), source: '', review: 'unreviewed', events: [] };
  const change = (patch: Partial<Fingering>) => onChange({ ...current, ...patch, review: 'unreviewed' });
  return <details><summary>Edit local mapping</summary><p>Local review is not teacher approval. Editing clears review.</p>
    <label>Source <input value={current.source} onChange={e => change({ source: e.target.value })}/></label><p>Review: {current.review}</p>
    <label>String (1 high E–6 low E) <input type="number" min="1" max="6" value={string} onChange={e => setString(Number(e.target.value))}/></label>
    <label>Fret (0–24) <input type="number" min="0" max="24" value={fret} onChange={e => setFret(Number(e.target.value))}/></label>
    <button type="button" onClick={() => { try { const event = eventAt(context, string, fret); if (current.events.length >= maxEvents) throw new Error('Too many events'); change({ events: [...current.events, event] }); setError(''); } catch (e) { setError(String(e)); } }}>Add event</button>
    <p role="alert">{error}</p><ol>{current.events.map((event, i) => <li key={i}>{`String ${event.string}, fret ${event.fret}: ${noteName(event.pitch)}${event.pitch.octave}`} <button type="button" onClick={() => change({ events: current.events.filter((_, n) => n !== i) })}>Remove</button> <button type="button" disabled={i === 0} onClick={() => { const events = [...current.events]; [events[i - 1], events[i]] = [events[i], events[i - 1]]; change({ events }); }}>Move up</button> <button type="button" disabled={i === current.events.length - 1} onClick={() => { const events = [...current.events]; [events[i + 1], events[i]] = [events[i], events[i + 1]]; change({ events }); }}>Move down</button></li>)}</ol>
    <button type="button" onClick={() => onChange({ ...current, review: 'reviewed' })}>Mark locally reviewed (not teacher-approved)</button>
  </details>;
}
