import { useEffect, useRef } from 'react';
import { Fretboard } from '@moonwave99/fretboard.js';
import { Note } from '@tonaljs/tonal';
import { Accidental, Formatter, Renderer, Stave, StaveNote, TabNote, TabStave, KeySignature, Voice } from 'vexflow';
import type { Fingering, GuidedPractice } from '../contracts';
import { modeMetadata, noteName } from '../theory';
import { majorPosition, minorScaleMap, validateFingeringEvent, type MajorPosition } from './index';

export function notationKeySignature(practice: GuidedPractice) {
  const key = noteName(practice.parentTonic) + (practice.family === 'major' ? '' : 'm');
  try { new KeySignature(key).format(); return { key, fallback: false }; }
  catch { return { key: 'C', fallback: true }; }
}

/** Ascending modal scale, as written at concert pitch, beginning in octave 4. */
export function modeScaleKeys(practice: GuidedPractice): string[] {
  let last = -1;
  return practice.mode.notes.map(note => {
    const name = noteName(note);
    let octave = 4;
    while ((Note.get(`${name}${octave}`).midi ?? -1) <= last && octave < 10) octave++;
    const midi = Note.get(`${name}${octave}`).midi;
    if (midi == null || midi <= last) throw new RangeError('Invalid scale pitch');
    last = midi;
    return `${name.toLowerCase()}/${octave}`;
  });
}

/** Guitar is written one octave above its sounding Pitch; spelling is retained. */
export function exerciseKeys(fingering: Fingering): string[] {
  return fingering.events.map(event => {
    validateFingeringEvent(event);
    return `${noteName(event.pitch).toLowerCase()}/${event.pitch.octave + 1}`;
  });
}

function notation(host: HTMLDivElement, keys: string[], key: string, tab?: Fingering) {
  if (!keys.length) return;
  const width = Math.max(360, keys.length * 32 + 100, host.clientWidth);
  const renderer = new Renderer(host, Renderer.Backends.SVG);
  renderer.resize(width, tab ? 260 : 150);
  const context = renderer.getContext();
  const stave = new Stave(10, 10, width - 20).addClef('treble').addKeySignature(key);
  stave.setContext(context).draw();
  const notes = keys.map(pitch => new StaveNote({ clef: 'treble', keys: [pitch], duration: 'q' }));
  const voice = new Voice({ numBeats: notes.length, beatValue: 4 }).setMode(Voice.Mode.SOFT).addTickables(notes);
  Accidental.applyAccidentals([voice], key);
  if (tab) {
    const tabStave = new TabStave(10, 145, width - 20).addClef('tab');
    tabStave.setNoteStartX(stave.getNoteStartX());
    tabStave.setContext(context).draw();
    const tabNotes = tab.events.map(event => new TabNote({ positions: [{ str: event.string, fret: event.fret }], duration: 'q' }));
    const tabVoice = new Voice({ numBeats: tabNotes.length, beatValue: 4 }).setMode(Voice.Mode.SOFT).addTickables(tabNotes);
    new Formatter().joinVoices([voice]).joinVoices([tabVoice]).formatToStave([voice, tabVoice], stave);
    voice.draw(context, stave); tabVoice.draw(context, tabStave);
  } else {
    new Formatter().joinVoices([voice]).formatToStave([voice], stave);
    voice.draw(context, stave);
  }
}

function Notation({ practice, fingering }: { practice: GuidedPractice; fingering?: Fingering }) {
  const host = useRef<HTMLDivElement>(null);
  const signature = notationKeySignature(practice);
  const keys = fingering ? exerciseKeys(fingering) : modeScaleKeys(practice);
  const keyList = keys.join(',');
  const tabPositions = fingering ? JSON.stringify(fingering.events.map(({ string, fret }) => [string, fret])) : '';
  useEffect(() => {
    const el = host.current!;
    let width = -1;
    const render = () => {
      if (width === el.clientWidth) return;
      width = el.clientWidth;
      el.replaceChildren();
      notation(el, keys, signature.key, fingering);
    };
    render();
    const observer = new ResizeObserver(render);
    observer.observe(el);
    return () => { observer.disconnect(); el.replaceChildren(); };
  }, [keyList, signature.key, fingering, tabPositions]);
  return <section><p>{fingering ? 'Guitar exercise: written one octave above sounding' : 'Mode scale: concert pitch'}; {signature.fallback ? `no key signature; explicit accidentals (unsupported parent key ${noteName(practice.parentTonic)})` : `parent key signature ${signature.key}`}.</p><div ref={host} style={{ overflowX: 'auto' }} aria-hidden="true"/><p>{keys.join(' · ')}</p>{fingering && <p>Tab, in provided order: {fingering.events.map(e => `string ${e.string} fret ${e.fret}`).join(' · ')}</p>}</section>;
}
export function ModeStaff({ practice }: { practice: GuidedPractice }) { return <Notation practice={practice}/>; }
export function GuitarExercise({ practice, fingering }: { practice: GuidedPractice; fingering?: Fingering }) {
  if (fingering?.review === 'rejected') return <p>Fingering rejected; exercise unavailable.</p>;
  if (!fingering || !fingering.events.length) return <p>Fingering and exercise pending review.</p>;
  for (const event of fingering.events) {
    if (!practice.mode.notes.some(note => note.pitchClass === event.pitch.pitchClass)) throw new RangeError('Fingering pitch is outside parent scale');
  }
  return <section><p>Source: {fingering.source}; review: {fingering.review}.</p><Notation practice={practice} fingering={fingering}/></section>;
}

/** Major positions are upstream, unreviewed; minor positions require supplied events. */
export function GuitarFretboard({ practice, position, fingering }: { practice: GuidedPractice; position: MajorPosition; fingering?: Fingering }) {
  const host = useRef<HTMLDivElement>(null);
  const usable = fingering && fingering.review !== 'rejected' && fingering.events.length > 0;
  const points = usable ? fingering.events.map(event => { validateFingeringEvent(event); return { string: event.string, fret: event.fret, chroma: event.pitch.pitchClass }; }) : practice.family === 'major' ? majorPosition(practice.parentTonic, position) : minorScaleMap(practice.parentTonic, practice.family);
  const metadata = modeMetadata(practice.family, practice.mode.degree);
  const labels = points.map(p => {
    const i = practice.mode.notes.findIndex(n => n.pitchClass === p.chroma);
    if (i < 0) throw new RangeError('Fingering pitch is outside parent scale');
    const note = practice.mode.notes[i];
    const roles = [i === 0 ? 'tonic' : '', practice.chord.tones.some(t => t.pitchClass === p.chroma) ? 'chord' : '', metadata.characteristicDegrees.includes(i + 1) ? 'distinctive' : ''].filter(Boolean);
    return { ...p, label: `${noteName(note)} ${metadata.intervalLabels[i]}${roles.length ? ` (${roles.join(', ')})` : ''}`, short: `${noteName(note)}${i === 0 ? '*' : ''}` };
  });
  const labelKey = JSON.stringify(labels);
  useEffect(() => {
    const el = host.current!;
    if (labels.length) {
      const fretCount = Math.max(12, ...labels.map(p => p.fret));
      const board = new Fretboard({ el, fretCount, showFretNumbers: true, dotFill: 'var(--pp-music-surface, #f3ead8)', dotStrokeColor: 'var(--pp-music-ink, #302c23)', dotText: (p: { short: string }) => p.short, width: 800 });
      board.setDots(labels).render();
      return () => { board.removeEventListeners(); el.replaceChildren(); };
    }
    return () => { el.replaceChildren(); };
  }, [labelKey]);
  return <section><p>{usable ? `Source: ${fingering.source}; review: ${fingering.review}` : practice.family === 'major' ? `fretboard.js ${position} major template; source-provided, not teacher-reviewed` : `Scale-note map, not a CAGED fingering; frets 0–12; ${position} mapping pending${fingering?.review === 'rejected' ? ' (supplied mapping rejected)' : ''}.`}</p><p>String 1 high E; fret 0 open. * marks modal tonic.</p><div ref={host} aria-hidden="true"/><details><summary>Note positions and roles</summary><p>{labels.map(p => `string ${p.string}, fret ${p.fret}: ${p.label}`).join('; ')}</p></details></section>;
}
