import { useEffect, useRef, useState } from 'react';
import { Fretboard } from '@moonwave99/fretboard.js';
import './editor.css';
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
  const host = useRef<HTMLDivElement>(null);
  const [choice, setChoice] = useState('1:0'), [error, setError] = useState('');
  if (noteName(practice.parentTonic) !== noteName(context.parentTonic) || practice.family !== context.family) throw new Error('Editor context mismatch');
  const current: Fingering = value ?? { id: contextKey(context), source: '', review: 'unreviewed', events: [] };
  const change = (patch: Partial<Fingering>) => onChange({ ...current, ...patch, review: 'unreviewed' });
  const add = (string: number, fret: number) => {
    try {
      const event = eventAt(context, string, fret);
      if (current.events.length >= maxEvents) throw new Error('Too many events');
      change({ events: [...current.events, event] }); setError('');
    } catch (e) { setError(String(e)); }
  };
  const points: FingeringEvent[] = [];
  for (let string = 1; string <= 6; string++) for (let fret = 0; fret <= 24; fret++) {
    try { points.push(eventAt(context, string, fret)); } catch { /* outside the parent collection */ }
  }
  const addRef = useRef(add); addRef.current = add;
  const pointsKey = contextKey(context);
  useEffect(() => {
    const el = host.current!;
    const board = new Fretboard({ el, fretCount: 24, width: 2200, height: 270, scaleFrets: false, showFretNumbers: true, dotSize: 32, dotTextSize: 16, dotFill: '#f3ead8', dotStrokeColor: '#302c23', dotText: (p: { label: string }) => p.label });
    board.setDots(points.map(p => ({ string: p.string, fret: p.fret, label: noteName(p.pitch) }))).render();
    board.on('click', position => addRef.current(position.string, position.fret));
    return () => { board.removeEventListeners(); el.replaceChildren(); };
  }, [pointsKey]);
  useEffect(() => {
    const selected = new Set(current.events.map(event => `${event.string}:${event.fret}`));
    host.current?.querySelectorAll<SVGGElement>('.dot').forEach(dot => {
      const match = dot.getAttribute('class')?.match(/dot-id-s(\d+):f(\d+)/);
      dot.classList.toggle('pp-editor-selected', !!match && selected.has(`${match[1]}:${match[2]}`));
    });
  }, [pointsKey, current.events]);
  const chosen = points.find(p => `${p.string}:${p.fret}` === choice) ?? points[0];
  return <div className="pp-editor">
    <p>Tap scale notes to add them in order. Repeat notes as needed; scroll the neck for higher frets.</p>
    <div className="pp-editor-neck" aria-label="Interactive fretboard, scroll for higher frets"><div ref={host}/></div>
    <div className="pp-editor-keyboard"><label>Keyboard note <select value={`${chosen.string}:${chosen.fret}`} onChange={e => setChoice(e.target.value)}>{points.map(p => <option key={`${p.string}:${p.fret}`} value={`${p.string}:${p.fret}`}>{`String ${p.string}, fret ${p.fret}: ${noteName(p.pitch)}${p.pitch.octave}`}</option>)}</select></label> <button type="button" onClick={() => add(chosen.string, chosen.fret)}>Add note</button></div>
    {error && <p role="alert">{error}</p>}
    <p aria-live="polite">{current.events.length} notes in sequence</p>
    <button type="button" disabled={!current.events.length} onClick={() => change({ events: current.events.slice(0, -1) })}>Undo last note</button>
    <ol className="pp-editor-sequence">{current.events.map((event, i) => <li key={i}><span>{`String ${event.string}, fret ${event.fret}: ${noteName(event.pitch)}${event.pitch.octave}`}</span> <button type="button" aria-label={`Remove note ${i + 1}`} onClick={() => change({ events: current.events.filter((_, n) => n !== i) })}>Remove</button> <button type="button" aria-label={`Move note ${i + 1} up`} disabled={i === 0} onClick={() => { const events = [...current.events]; [events[i - 1], events[i]] = [events[i], events[i - 1]]; change({ events }); }}>↑</button> <button type="button" aria-label={`Move note ${i + 1} down`} disabled={i === current.events.length - 1} onClick={() => { const events = [...current.events]; [events[i + 1], events[i]] = [events[i], events[i + 1]]; change({ events }); }}>↓</button></li>)}</ol>
    <details><summary>Source and local review</summary><label>Source <input value={current.source} onChange={e => change({ source: e.target.value })}/></label><p>Review: {current.review}. Local review is not teacher approval; edits clear review.</p><button type="button" onClick={() => onChange({ ...current, review: 'reviewed' })}>Mark locally reviewed</button></details>
  </div>;
}
