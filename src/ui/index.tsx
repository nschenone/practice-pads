import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { ModeDegree, PlaybackStatus, ScaleFamily } from '../contracts';
import './ui.css';

export type Choice = { value: string; label: string };
export type KeyPair = { major: Choice; minor: Choice };
export type RelationshipNote = { name: string; interval: string; tonic: boolean; chordTone: boolean; distinctiveRole?: string };
export type ModeChoice = { degree: ModeDegree; chord: string; name: string };
export type WorkspaceProps = {
  parent: string; family: ScaleFamily; keyPairs: KeyPair[]; onParent: (value: string, family: ScaleFamily) => void; onFamily: (value: ScaleFamily) => void;
  modes: ModeChoice[]; degree: ModeDegree; onMode: (degree: ModeDegree) => void;
  chord: string; modeName: string; notes: RelationshipNote[];
  status: PlaybackStatus; onPlay: () => void; onStop: () => void;
  preset: string; presets: Choice[]; onPreset: (value: string) => void; volume: number; onVolume: (value: number) => void;
  voicing: 'close' | 'spread'; onVoicing: (value: 'close' | 'spread') => void;
  rootOctave: number; onRootOctave: (value: number) => void; rootNote: string;
  reverb: number; onReverb: (value: number) => void;
  position: string; positions: Choice[]; onPosition: (value: string) => void;
  view: 'diagram' | 'exercise'; onView: (value: 'diagram' | 'exercise') => void;
  neckView?: 'position' | 'full'; onNeckView?: (value: 'position' | 'full') => void;
  notation: ReactNode; fretboard: ReactNode; exercise: ReactNode; configuration?: ReactNode;
};

// Two annular wedges per key sector keep each label and its hit area together.
function keyWedge(index: number, count: number, inner: number, outer: number) {
  const angle = (index - 0.5) * 2 * Math.PI / count - Math.PI / 2;
  const end = angle + 2 * Math.PI / count;
  const point = (radius: number, at: number) => `${190 + radius * Math.cos(at)},${190 + radius * Math.sin(at)}`;
  return `M${point(outer, angle)} A${outer},${outer} 0 0 1 ${point(outer, end)} L${point(inner, end)} A${inner},${inner} 0 0 0 ${point(inner, angle)} Z`;
}

export function ParentKeyPicker({ parent, family, pairs, onSelect }: { parent: string; family: ScaleFamily; pairs: KeyPair[]; onSelect: (parent: string, family: ScaleFamily) => void }) {
  const [open, setOpen] = useState(false); const root = useRef<HTMLDivElement>(null); const trigger = useRef<HTMLButtonElement>(null);
  useEffect(() => { if (!open) return; const outside = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); }; const key = (event: KeyboardEvent) => { if (event.key === 'Escape') { setOpen(false); trigger.current?.focus(); } }; document.addEventListener('pointerdown', outside); document.addEventListener('keydown', key); return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', key); }; }, [open]);
  const select = (choice: Choice, minor: boolean) => {
    onSelect(choice.value, minor ? (family === 'major' ? 'natural-minor' : family) : 'major');
    setOpen(false); trigger.current?.focus();
  };
  return <div className="pp-parent" ref={root}><span>Parent tonic </span><button ref={trigger} type="button" aria-label={`Parent tonic ${parent}`} aria-expanded={open} aria-controls="pp-circle" onClick={() => setOpen(!open)}>{parent}</button>{open && <div className="pp-popover" id="pp-circle" role="group" aria-label="Parent tonic circle"><p>Major outside · relative minor inside</p><div className="pp-circle"><svg className="pp-key-wheel" viewBox="0 0 380 380" role="group" aria-label="Circle of fifths">{pairs.map((pair, i) => [pair.major, pair.minor].map((choice, ring) => {
    const angle = i * 2 * Math.PI / pairs.length - Math.PI / 2;
    const radius = ring ? 98 : 152;
    const selected = choice.value === parent && (ring ? family !== 'major' : family === 'major');
    return <g key={`${ring}-${choice.value}`} className={selected ? 'pp-key-selected' : undefined}>
      <path className="pp-key-wedge" data-ring={ring ? 'minor' : 'major'} d={keyWedge(i, pairs.length, ring ? 70 : 126, ring ? 126 : 178)} role="button" tabIndex={0} aria-pressed={selected} aria-label={`${choice.label} ${ring ? 'minor' : 'major'}`} onClick={() => select(choice, !!ring)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); select(choice, !!ring); } }}/>
      <text className="pp-key-label" x={190 + radius * Math.cos(angle)} y={190 + radius * Math.sin(angle)}>{choice.label}{ring ? 'm' : ''}</text>
    </g>;
  }))}<text className="pp-key-label" x="190" y="178">Key</text><text className="pp-key-label pp-key-current" x="190" y="203">{parent}</text></svg></div></div>}</div>;
}

export function Player({ chord, modeName, status, onPlay, onStop, preset, presets, onPreset, volume, onVolume, voicing, onVoicing, rootOctave, onRootOctave, rootNote, reverb, onReverb }: Pick<WorkspaceProps, 'chord' | 'modeName' | 'status' | 'onPlay' | 'onStop' | 'preset' | 'presets' | 'onPreset' | 'volume' | 'onVolume' | 'voicing' | 'onVoicing' | 'rootOctave' | 'onRootOctave' | 'rootNote' | 'reverb' | 'onReverb'>) {
  return <section className="pp-panel pp-player" aria-label="Chord player"><div className="pp-now"><small>Selected chord</small><strong>{chord}</strong><span>{modeName}</span></div><button className="pp-play" type="button" onClick={status.state === 'playing' || status.state === 'starting' ? onStop : onPlay}>{status.state === 'playing' || status.state === 'starting' ? 'Stop' : status.state === 'error' ? 'Retry' : 'Play'}</button><div role="status" aria-live="polite">{status.state === 'stopped' ? 'Stopped' : status.state === 'starting' ? 'Starting audio…' : status.state === 'playing' ? 'Playing' : `Audio stopped: ${status.message}`}</div><div className="pp-switch" role="group" aria-label="Chord voicing"><button type="button" aria-pressed={voicing === 'close'} onClick={() => onVoicing('close')}>Close</button><button type="button" aria-pressed={voicing === 'spread'} onClick={() => onVoicing('spread')}>Spread</button></div><div className="pp-switch pp-octave" role="group" aria-label="Chord octave"><button type="button" aria-label="Down one octave" disabled={rootOctave <= 3} onClick={() => onRootOctave(rootOctave - 1)}>− Octave</button><span aria-live="polite">{rootNote}{rootOctave}</span><button type="button" aria-label="Up one octave" disabled={rootOctave >= 5} onClick={() => onRootOctave(rootOctave + 1)}>+ Octave</button></div><label>Sound <select value={preset} onChange={e => onPreset(e.target.value)}>{presets.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}</select></label><label>Reverb <input type="range" min="0" max="0.4" step="0.01" value={reverb} onChange={e => onReverb(Number(e.target.value))}/></label><label>Volume <input type="range" min="0" max="1" step="0.01" value={volume} onChange={e => onVolume(Number(e.target.value))}/></label></section>;
}

export function Relationship({ notes }: Pick<WorkspaceProps, 'notes'>) {
  return <section className="pp-panel pp-relationship" aria-label="Notes and intervals"><h2>Notes &amp; intervals</h2><ul className="pp-notes">{notes.map((note, i) => <li key={`${note.name}-${i}`} data-tonic={note.tonic || undefined} aria-label={[note.name, note.interval, note.tonic && 'Tonic', note.chordTone && 'Chord tone', note.distinctiveRole && 'Characteristic'].filter(Boolean).join(', ')}><strong>{note.name}</strong><span>{note.interval}</span><span className="pp-note-marks" aria-hidden="true">{note.tonic ? '◎' : ''}{note.chordTone ? '●' : ''}{note.distinctiveRole ? '★' : ''}</span></li>)}</ul><p className="pp-legend"><span className="pp-tonic-key">◎ Tonic</span> &nbsp; ● Chord tone &nbsp; ★ Characteristic</p></section>;
}

export function PracticeWorkspace(p: WorkspaceProps) {
  return <main className="pp-shell"><section className="pp-panel pp-setup" aria-label="Parent scale"><ParentKeyPicker parent={p.parent} family={p.family} pairs={p.keyPairs} onSelect={p.onParent}/><label>Family <select value={p.family} onChange={e => p.onFamily(e.target.value as ScaleFamily)}><option value="major">Major</option><option value="natural-minor">Natural minor</option><option value="jazz-melodic-minor">Jazz melodic minor</option><option value="harmonic-minor">Harmonic minor</option></select></label></section><div className="pp-modes" aria-label="Derivative modes">{p.modes.map(m => <button type="button" key={m.degree} aria-pressed={p.degree === m.degree} onClick={() => p.onMode(m.degree)}><small>{m.degree}</small><strong>{m.chord}</strong><span>{m.name}</span></button>)}</div>
  <Player {...p}/><div className="pp-study"><div className="pp-mode-study"><Relationship {...p}/><section className="pp-panel pp-notation"><h2>Mode notation</h2>{p.notation}</section></div><section className="pp-panel pp-guitar"><div className="pp-study-head"><h2>CAGED</h2><div className="pp-shapes" role="group" aria-label="CAGED shape">{p.positions.map(x => <button type="button" key={x.value} aria-label={x.label} aria-pressed={p.position === x.value} onClick={() => p.onPosition(x.value)}>{x.value}</button>)}</div></div><div className="pp-switch" aria-label="Guitar view"><button type="button" aria-pressed={p.view === 'diagram'} onClick={() => p.onView('diagram')}>Diagram</button><button type="button" aria-pressed={p.view === 'exercise'} onClick={() => p.onView('exercise')}>Exercise notation and tab</button></div>{p.view === 'diagram' && p.onNeckView && <div className="pp-switch pp-neck-view" role="group" aria-label="Fretboard range"><button type="button" aria-pressed={(p.neckView ?? 'position') === 'position'} onClick={() => p.onNeckView!('position')}>Position</button><button type="button" aria-pressed={p.neckView === 'full'} onClick={() => p.onNeckView!('full')}>Full neck</button>{p.neckView === 'full' && <small>{p.position} shape highlighted</small>}</div>}<div className="pp-visual">{p.view === 'diagram' ? p.fretboard : p.exercise}</div></section></div>{p.configuration}</main>;
}
