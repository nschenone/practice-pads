import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { FingeringEditor, createFingeringStorage, type FingeringContext } from '../index';
import { GuitarFretboard, GuitarExercise } from '../../visualization';
import { guidedPractice, SUPPORTED_TONICS } from '../../theory';
import type { Fingering } from '../../contracts';
function Fixture() {
  const [family, setFamily] = useState<'jazz-melodic-minor' | 'harmonic-minor'>('jazz-melodic-minor');
  const [value, setValue] = useState<Fingering>(); const [json, setJSON] = useState(''); const [message, setMessage] = useState('');
  const context: FingeringContext = { parentTonic: SUPPORTED_TONICS[2], family, position: 'C' }; const practice = guidedPractice(context.parentTonic, family, 1);
  const run = (fn: () => void) => { try { fn(); setMessage('Done'); } catch (e) { setMessage(String(e)); } };
  const storage = () => createFingeringStorage(localStorage);
  return <main style={{ background: '#f3ead8', color: '#302c23' }}><h1>Development-only mapping fixture</h1><button onClick={() => { setFamily(family === 'harmonic-minor' ? 'jazz-melodic-minor' : 'harmonic-minor'); setValue(undefined); }}>Switch family</button><h2>{family}</h2><GuitarFretboard practice={practice} position="C" fingering={value}/><GuitarExercise practice={practice} fingering={value}/><FingeringEditor practice={practice} context={context} value={value} onChange={setValue}/><button onClick={() => run(() => { if (!value) throw Error('No mapping'); storage().save(context, value); })}>Save</button><button onClick={() => run(() => setValue(storage().get(context)))}>Load</button><button onClick={() => run(() => { storage().reset(context); setValue(undefined); })}>Reset</button><button onClick={() => run(() => setJSON(storage().exportJSON()))}>Export</button><button onClick={() => run(() => storage().importJSON(json))}>Import</button><label>JSON <textarea value={json} onChange={e => setJSON(e.target.value)}/></label><p role="status">{message}</p></main>;
}
createRoot(document.getElementById('root')!).render(<Fixture/>);
