import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { guidedPractice, SUPPORTED_TONICS } from '../../theory';
import { GuitarExercise, GuitarFretboard, ModeStaff } from '../index';
import type { Fingering } from '../../contracts';

// Synthetic rendering test events only: not a reviewed position or exercise.
const example: Fingering = { id: 'fixture-only', source: 'synthetic dev fixture; not instructional', review: 'unreviewed', events: [
  { string: 2, fret: 3, pitch: { letter: 'D', accidental: 0, pitchClass: 2, octave: 4, midi: 62 } },
  { string: 2, fret: 0, pitch: { letter: 'B', accidental: 0, pitchClass: 11, octave: 3, midi: 59 } },
  { string: 2, fret: 2, pitch: { letter: 'C', accidental: 1, pitchClass: 1, octave: 4, midi: 61 } },
] };
function Fixture() {
  const [degree, setDegree] = useState<1 | 3>(1);
  const d = SUPPORTED_TONICS.find(n => n.letter === 'D' && n.accidental === 0)!;
  const minor = guidedPractice(d, 'jazz-melodic-minor', degree, 'fixture-only');
  const major = guidedPractice(d, 'major', degree, 'C');
  return <main style={{ fontFamily: 'sans-serif', maxWidth: 1000, margin: 'auto' }}><h1>Dev-only visualization fixture</h1><button onClick={() => setDegree(degree === 1 ? 3 : 1)}>Switch derivative mode</button><h2>{minor.mode.name} — {minor.chord.symbol}</h2><ModeStaff practice={minor}/><GuitarFretboard practice={minor} position="C" fingering={example}/><GuitarExercise practice={minor} fingering={example}/><h2>Upstream D major C template — {major.mode.name}</h2><GuitarFretboard practice={major} position="C"/></main>;
}
createRoot(document.getElementById('root')!).render(<Fixture/>);
