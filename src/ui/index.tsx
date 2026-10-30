import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { ChordQuality, ModeDegree, PlaybackStatus, ScaleFamily } from '../contracts';
import './ui.css';

export type Choice = { value: string; label: string };
export type KeyPair = { major: Choice; minor: Choice };
export type RelationshipNote = { name: string; interval: string; tonic: boolean; chordTone: boolean; distinctiveRole?: string };
export type ModeChoice = { degree: ModeDegree; chord: string; name: string };
export type WorkspaceProps = {
  workflow: 'guided' | 'self-guided'; onWorkflow: (value: 'guided' | 'self-guided') => void;
  parent: string; family: ScaleFamily; keyPairs: KeyPair[]; onParent: (value: string, family: ScaleFamily) => void; onFamily: (value: ScaleFamily) => void;
  modes: ModeChoice[]; degree: ModeDegree; onMode: (degree: ModeDegree) => void;
  root: string; roots: Choice[]; quality: ChordQuality; qualities: { value: ChordQuality; label: string }[]; onRoot: (value: string) => void; onQuality: (value: ChordQuality) => void;
  chord: string; modeName: string; chordSpelling: string; parentNotes: string; notes: RelationshipNote[];
  candidates: { id: string; mode: string; parent: string }[];
  status: PlaybackStatus; onPlay: () => void; onStop: () => void;
  preset: string; presets: Choice[]; onPreset: (value: string) => void; volume: number; onVolume: (value: number) => void;
  position: string; positions: Choice[]; onPosition: (value: string) => void;
  view: 'diagram' | 'exercise'; onView: (value: 'diagram' | 'exercise') => void;
  notation: ReactNode; fretboard: ReactNode; exercise: ReactNode; configuration?: ReactNode;
};

export function ParentKeyPicker({ parent, family, pairs, onSelect }: { parent: string; family: ScaleFamily; pairs: KeyPair[]; onSelect: (parent: string, family: ScaleFamily) => void }) {
  const [open, setOpen] = useState(false); const root = useRef<HTMLDivElement>(null); const trigger = useRef<HTMLButtonElement>(null);
  useEffect(() => { if (!open) return; const outside = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); }; const key = (event: KeyboardEvent) => { if (event.key === 'Escape') { setOpen(false); trigger.current?.focus(); } }; document.addEventListener('pointerdown', outside); document.addEventListener('keydown', key); return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', key); }; }, [open]);
  return <div className="pp-parent" ref={root}><span>Parent tonic </span><button ref={trigger} type="button" aria-label={`Parent tonic ${parent}`} aria-expanded={open} aria-controls="pp-circle" onClick={() => setOpen(!open)}>{parent}</button>{open && <div className="pp-popover" id="pp-circle" role="group" aria-label="Parent tonic circle"><strong>Parent tonic</strong><p>Outer: major · Inner: relative natural minor signatures</p><div className="pp-circle">{pairs.map((pair, i) => [pair.major, pair.minor].map((choice, ring) => { const angle = i * 2 * Math.PI / pairs.length; const radius = ring ? 31 : 44; const selected = choice.value === parent && (ring ? family !== 'major' : family === 'major'); return <button type="button" key={`${ring}-${choice.value}`} aria-pressed={selected} aria-label={`${choice.label} ${ring ? 'minor' : 'major'}`} style={{ left: `${50 + radius * Math.sin(angle)}%`, top: `${50 - radius * Math.cos(angle)}%` }} onClick={() => { onSelect(choice.value, ring ? (family === 'major' ? 'jazz-melodic-minor' : family) : 'major'); setOpen(false); trigger.current?.focus(); }}>{choice.label}{ring ? 'm' : ''}</button>; }))}<div className="pp-center">Key<br/><small>{parent}</small></div></div><p>Minor family alterations are selected separately.</p></div>}</div>;
}

export function Player({ chord, modeName, status, onPlay, onStop, preset, presets, onPreset, volume, onVolume }: Pick<WorkspaceProps, 'chord' | 'modeName' | 'status' | 'onPlay' | 'onStop' | 'preset' | 'presets' | 'onPreset' | 'volume' | 'onVolume'>) {
  return <section className="pp-panel pp-player" aria-label="Chord player"><div className="pp-now"><small>Selected chord</small><strong>{chord}</strong><span>{modeName}</span></div><button className="pp-play" type="button" onClick={status.state === 'playing' || status.state === 'starting' ? onStop : onPlay}>{status.state === 'playing' || status.state === 'starting' ? 'Stop' : status.state === 'error' ? 'Retry' : 'Play'}</button><div role="status" aria-live="polite">{status.state === 'stopped' ? 'Stopped' : status.state === 'starting' ? 'Starting audio…' : status.state === 'playing' ? 'Playing' : `Audio stopped: ${status.message}`}</div><label>Sound <select value={preset} onChange={e => onPreset(e.target.value)}>{presets.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}</select></label><label>Volume <input type="range" min="0" max="1" step="0.01" value={volume} onChange={e => onVolume(Number(e.target.value))}/></label></section>;
}

export function Relationship({ notes }: Pick<WorkspaceProps, 'chord' | 'chordSpelling' | 'parentNotes' | 'modeName' | 'notes'>) {
  return <section className="pp-panel pp-relationship" aria-label="Notes and intervals"><h2>Notes &amp; intervals</h2><ul className="pp-notes">{notes.map((note, i) => <li key={`${note.name}-${i}`} aria-label={[note.name, note.interval, note.tonic && 'Tonic', note.chordTone && 'Chord tone', note.distinctiveRole && 'Characteristic'].filter(Boolean).join(', ')}><strong>{note.name}</strong><span>{note.interval}</span><span className="pp-note-marks" aria-hidden="true">{note.tonic ? '◎' : ''}{note.chordTone ? '●' : ''}{note.distinctiveRole ? '★' : ''}</span></li>)}</ul><p className="pp-legend">◎ Tonic &nbsp; ● Chord tone &nbsp; ★ Characteristic</p></section>;
}

export function PracticeWorkspace(p: WorkspaceProps) {
  return <main className="pp-shell"><section className="pp-panel pp-setup" aria-label="Parent scale"><ParentKeyPicker parent={p.parent} family={p.family} pairs={p.keyPairs} onSelect={p.onParent}/><label>Family <select value={p.family} onChange={e => p.onFamily(e.target.value as ScaleFamily)}><option value="major">Major</option><option value="jazz-melodic-minor">Jazz melodic minor</option><option value="harmonic-minor">Harmonic minor</option></select></label></section><div className="pp-modes" aria-label="Derivative modes">{p.modes.map(m => <button type="button" key={m.degree} aria-pressed={p.degree === m.degree} onClick={() => p.onMode(m.degree)}><small>{m.degree}</small><strong>{m.chord}</strong><span>{m.name}</span></button>)}</div>
  <Player {...p}/><Relationship {...p}/><div className="pp-study"><section className="pp-panel pp-guitar"><div className="pp-study-head"><h2>Guitar</h2><div className="pp-shapes" role="group" aria-label="CAGED shape">{p.positions.map(x => <button type="button" key={x.value} aria-label={x.label} aria-pressed={p.position === x.value} onClick={() => p.onPosition(x.value)}>{x.value}</button>)}</div></div><div className="pp-switch" aria-label="Guitar view"><button type="button" aria-pressed={p.view === 'diagram'} onClick={() => p.onView('diagram')}>Diagram</button><button type="button" aria-pressed={p.view === 'exercise'} onClick={() => p.onView('exercise')}>Exercise notation and tab</button></div><div className="pp-visual">{p.view === 'diagram' ? p.fretboard : p.exercise}</div></section><section className="pp-panel pp-notation"><h2>Mode notation</h2>{p.notation}</section></div>{p.configuration}</main>;
}
