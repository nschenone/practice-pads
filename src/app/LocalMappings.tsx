import { useEffect, useState } from 'react';
import type { Fingering, GuidedPractice } from '../contracts';
import { contextKey, createFingeringStorage, FingeringEditor, parseMappings, type FingeringContext } from '../fingerings';

type Draft = { value: Fingering | undefined; dirty: boolean };
export function useLocalMapping(context: FingeringContext | undefined) {
  const id = context ? contextKey(context) : '';
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [json, setJSON] = useState('');
  const put = (value: Fingering | undefined, dirty = false) => setDrafts(all => ({ ...all, [id]: { value, dirty } }));
  const store = () => createFingeringStorage(window.localStorage);
  useEffect(() => {
    setMessage(''); setError('');
    if (!context || Object.hasOwn(drafts, id)) return;
    try { put(store().get(context)); }
    catch (e) { setError(`Saved mappings could not be loaded: ${String(e)}. You can still edit a draft.`); put(undefined); }
  }, [id]);
  const action = (operation: () => void) => {
    setError(''); setMessage('');
    try { operation(); } catch (e) { setError(String(e)); }
  };
  const value = drafts[id]?.value;
  return {
    value, dirty: drafts[id]?.dirty ?? false, message, error, json, setJSON,
    change: (next: Fingering) => put(next, true),
    save: () => action(() => { if (!context || !value) throw new Error('Add a mapping first'); store().save(context, value); put(value); setMessage('Saved in this browser.'); }),
    reload: () => action(() => { if (!context) return; put(store().get(context)); setMessage('Loaded the saved mapping; draft discarded.'); }),
    reset: () => action(() => { if (!context || !window.confirm('Remove this position’s saved mapping and draft? Other positions will stay unchanged.')) return; store().reset(context); put(undefined); setMessage('This position was reset.'); }),
    exportJSON: () => action(() => { setJSON(store().exportJSON()); setMessage('Saved mappings exported below. Unsaved drafts are not included.'); }),
    importJSON: () => action(() => {
      const incoming = parseMappings(json);
      if (incoming.mappings.some(entry => drafts[contextKey(entry.context)]?.dirty)) throw new Error('Save or discard matching drafts before importing.');
      store().importJSON(json);
      setDrafts(all => {
        const next = { ...all };
        for (const entry of incoming.mappings) next[contextKey(entry.context)] = { value: entry.fingering, dirty: false };
        return next;
      });
      setMessage('Imported valid mappings. Other saved positions were preserved.');
    }),
  };
}

export function LocalMappingControls({ practice, context, mapping }: { practice: GuidedPractice; context: FingeringContext; mapping: ReturnType<typeof useLocalMapping> }) {
  return <section className="pp-panel pp-mapping" aria-label="Local position configuration">
    <details><summary>Edit position</summary>
    <p>{context.position} position · changes stay local</p>
    <FingeringEditor key={contextKey(context)} practice={practice} context={context} value={mapping.value} onChange={mapping.change}/>
    <p role="status">{mapping.dirty ? 'Unsaved draft. ' : ''}{mapping.message}</p>
    {mapping.error && <p role="alert">{mapping.error}</p>}
    <div className="pp-mapping-actions">
      <button type="button" disabled={!mapping.value} onClick={mapping.save}>Save this position</button>
      <button type="button" onClick={mapping.reload}>Discard draft / reload saved</button>
      <button type="button" onClick={mapping.reset}>Reset this position</button>
    </div>
    </details>
    <details><summary>Import / export saved mappings</summary>
      <p>Copy this JSON as a backup or paste mappings to import. Import replaces matching saved positions, not the entire collection. A local review flag is not teacher approval.</p>
      <label>Mapping JSON<textarea rows={6} value={mapping.json} onChange={event => mapping.setJSON(event.target.value)} /></label>
      <div className="pp-mapping-actions"><button type="button" onClick={mapping.exportJSON}>Export saved mappings</button><button type="button" onClick={mapping.importJSON}>Import mappings</button></div>
    </details>
  </section>;
}
