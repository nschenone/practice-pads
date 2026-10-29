import { Component, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Note } from '@tonaljs/tonal';
import { keyPairs as pairs, relativeParent } from './app/keyPolicy';
import { PadAudioEngine, padPresets, type PadPreset } from './audio';
import type { ChordQuality, ModeDegree, PlaybackStatus, ScaleFamily, SpelledPitchClass } from './contracts';
import { compatibleCandidates, constructChord, guidedPractice, modeMetadata, noteName, playbackVoicing, SUPPORTED_TONICS } from './theory';
import { PracticeWorkspace } from './ui';
import { GuitarExercise, GuitarFretboard, ModeStaff, type MajorPosition } from './visualization';

class VisualError extends Component<{ children: ReactNode }, { message: string }> {
  state = { message: '' };
  static getDerivedStateFromError(error: unknown) { return { message: error instanceof Error ? error.message : 'Visualization failed' }; }
  render() { return this.state.message ? <p role="alert">Visualization unavailable: {this.state.message}</p> : this.props.children; }
}
const positions: MajorPosition[] = ['C', 'A', 'G', 'E', 'D'];
const qualities: ChordQuality[] = ['maj7', 'm7', '7', 'm7b5', 'm(maj7)', 'maj7#5', 'dim7'];
const degrees: ModeDegree[] = [1, 2, 3, 4, 5, 6, 7];
function pitch(name: string): SpelledPitchClass {
  const n = Note.get(name);
  if (n.empty || n.chroma === undefined || n.alt < -2 || n.alt > 2) throw new Error(`Invalid tonic: ${name}`);
  return { letter: n.letter as SpelledPitchClass['letter'], accidental: n.alt as SpelledPitchClass['accidental'], pitchClass: n.chroma as SpelledPitchClass['pitchClass'] };
}
export default function App() {
  const [workflow, setWorkflow] = useState<'guided' | 'self-guided'>('guided');
  const [parent, setParent] = useState('D'); const [family, setFamily] = useState<ScaleFamily>('jazz-melodic-minor');
  const [minorFamily, setMinorFamily] = useState<ScaleFamily>('jazz-melodic-minor');
  const [degree, setDegree] = useState<ModeDegree>(3); const [position, setPosition] = useState<MajorPosition>('C');
  const [root, setRoot] = useState('F'); const [quality, setQuality] = useState<ChordQuality>('maj7#5');
  const [view, setView] = useState<'diagram' | 'exercise'>('diagram');
  const [preset, setPreset] = useState<PadPreset>('Warm'); const [volume, setVolume] = useState(0.2);
  const [status, setStatus] = useState<PlaybackStatus>({ state: 'stopped' }); const [error, setError] = useState('');
  const engine = useRef<PadAudioEngine | null>(null);
  const data = useMemo(() => {
    try {
      const practice = guidedPractice(pitch(parent), family, degree, position);
      const chord = workflow === 'guided' ? practice.chord : constructChord(pitch(root), quality);
      const modes = degrees.map(d => guidedPractice(pitch(parent), family, d, position));
      const metadata = modeMetadata(family, degree);
      return { practice, chord, modes, metadata, voicing: playbackVoicing(chord), candidates: workflow === 'self-guided' ? compatibleCandidates(pitch(root), quality) : [], error: '' };
    } catch (e) { return { error: e instanceof Error ? e.message : 'Unable to derive practice' }; }
  }, [parent, family, degree, position, workflow, root, quality]);
  useEffect(() => { const player = new PadAudioEngine(); engine.current = player; const unsubscribe = player.subscribe(setStatus); return () => { unsubscribe(); engine.current = null; player.dispose(); }; }, []);
  useEffect(() => { try { if (data.voicing) engine.current?.setVoicing(data.voicing); engine.current?.setPreset(preset); engine.current?.setVolume(volume); setError(''); } catch (e) { setError(e instanceof Error ? e.message : 'Audio configuration failed'); } }, [data, preset, volume]);
  if (!data.practice || !data.chord || !data.modes || !data.metadata) return <main role="alert">Unable to derive practice: {data.error}</main>;
  const { practice, chord, modes, metadata } = data;
  const selectFamily = (next: ScaleFamily) => {
    setParent(relativeParent(parent, family, next));
    if (next !== 'major') setMinorFamily(next); setFamily(next);
  };
  return <>{error && <p role="alert">{error}</p>}<PracticeWorkspace workflow={workflow} onWorkflow={setWorkflow} parent={parent} family={family} keyPairs={pairs} onParent={(value, selected) => { setParent(value); const next = selected === 'major' ? 'major' : minorFamily; setFamily(next); }} onFamily={selectFamily}
    modes={modes.map(p => ({ degree: p.mode.degree, chord: p.chord.symbol, name: `${noteName(p.mode.tonic)} ${p.mode.name}` }))} degree={degree} onMode={setDegree}
    root={root} roots={SUPPORTED_TONICS.map(n => ({ value: noteName(n), label: noteName(n) }))} quality={quality} qualities={qualities.map(q => ({ value: q, label: q }))} onRoot={setRoot} onQuality={setQuality}
    chord={chord.symbol} modeName={workflow === 'guided' ? `${noteName(practice.mode.tonic)} ${practice.mode.name}` : 'Input chord · pitch containment, not endorsement'} chordSpelling={chord.tones.map(noteName).join(' · ')} parentNotes={modes[0].mode.notes.map(noteName).join(' · ')}
    notes={practice.mode.notes.map((n, i) => ({ name: noteName(n), interval: metadata.intervalLabels[i], tonic: i === 0, chordTone: chord.tones.some(t => t.pitchClass === n.pitchClass), distinctiveRole: metadata.characteristicDegrees.includes(i + 1) ? `Distinctive ${metadata.intervalLabels[i]}` : undefined }))}
    candidates={(data.candidates ?? []).map(c => ({ id: `${noteName(c.parentTonic)}-${c.mode.family}-${c.mode.degree}`, mode: `${noteName(c.mode.tonic)} ${c.mode.name}`, parent: `${noteName(c.parentTonic)} ${c.mode.family}` }))}
    status={status} onPlay={() => { if (engine.current) void engine.current.play().catch(e => setError(String(e))); }} onStop={() => engine.current?.stop()} preset={preset} presets={padPresets.map(p => ({ value: p, label: p }))} onPreset={p => setPreset(p as PadPreset)} volume={volume} onVolume={setVolume}
    position={position} positions={positions.map(p => ({ value: p, label: `${p} shape (unreviewed)` }))} onPosition={p => setPosition(p as MajorPosition)} view={view} onView={setView}
    notation={<VisualError key={`${parent}-${family}-${degree}`}><ModeStaff practice={practice}/></VisualError>} fretboard={<VisualError key={`${parent}-${family}-${degree}-${position}`}><GuitarFretboard practice={practice} position={position}/></VisualError>} exercise={<VisualError key={`${parent}-${family}-${degree}`}><GuitarExercise practice={practice}/></VisualError>} /></>;
}
