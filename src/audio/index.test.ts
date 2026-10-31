import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PlaybackVoicing, PlaybackStatus } from '../contracts';

const mock = vi.hoisted(() => {
  type Bank = { attack: number[]; release: number[]; active: number[]; allocated: number; dropped: number; disposed: boolean };
  const banks: Bank[] = [];
  const gains: { values: number[]; disposed: boolean }[] = [];
  const reverbs: { wet: number[]; disposed: boolean }[] = [];
  const effects: { disposed: boolean }[] = [];
  let reverbReady: Promise<void> = Promise.resolve();
  const callbacks = new Map<number, () => void>();
  let id = 0;
  const raw = { state: 'running', addEventListener: vi.fn(), removeEventListener: vi.fn() };
  const context = { rawContext: raw, lookAhead: 0.1, setTimeout: vi.fn((fn: () => void) => { callbacks.set(++id, fn); return id; }), clearTimeout: vi.fn((key: number) => { callbacks.delete(key); }) };
  return { banks, gains, reverbs, effects, raw, context, callbacks, start: vi.fn(), setReverbReady: (ready: Promise<void>) => { reverbReady = ready; }, getReverbReady: () => reverbReady, flush: () => { const pending = [...callbacks.values()]; callbacks.clear(); pending.forEach(fn => fn()); } };
});
vi.mock('tone', () => ({
  start: mock.start, getContext: () => mock.context, Synth: class {}, FMSynth: class {},
  Reverb: class { item: { wet: number[]; disposed: boolean }; wet: { rampTo: (value: number) => void }; ready: Promise<void>;
    constructor(options: { wet: number }) { this.item = { wet: [options.wet], disposed: false }; mock.reverbs.push(this.item); this.wet = { rampTo: value => this.item.wet.push(value) }; this.ready = mock.getReverbReady(); }
    connect() { return this; } dispose() { this.item.disposed = true; }
  },
  Filter: class { item = { disposed: false }; constructor() { mock.effects.push(this.item); } connect() { return this; } dispose() { this.item.disposed = true; } },
  Chorus: class { item = { disposed: false }; constructor() { mock.effects.push(this.item); } start() { return this; } connect() { return this; } dispose() { this.item.disposed = true; } },
  Gain: class {
    item: { values: number[]; disposed: boolean };
    gain: { linearRampTo: (value: number, duration: number) => void };
    constructor(value: number) { this.item = { values: [value], disposed: false }; mock.gains.push(this.item); this.gain = { linearRampTo: value => this.item.values.push(value) }; }
    toDestination() { return this; } connect() { return this; } dispose() { this.item.disposed = true; }
  },
  PolySynth: class {
    item = { attack: [] as number[], release: [] as number[], active: [] as number[], allocated: 0, dropped: 0, disposed: false };
    max: number;
    volume = { value: 0 };
    constructor(options: { maxPolyphony: number }) { this.max = options.maxPolyphony; mock.banks.push(this.item); }
    connect() { return this; }
    triggerAttack(n: number) {
      // Tone retains released voices until their envelopes reach silence; no tails expire in this mock.
      if (this.item.allocated >= this.max) { this.item.dropped++; return; }
      this.item.allocated++; this.item.attack.push(n); this.item.active.push(n);
    }
    triggerRelease(n: number) { this.item.release.push(n); this.item.active = this.item.active.filter(value => value !== n); }
    dispose() { this.item.disposed = true; this.item.active = []; }
  },
}));
import { PadAudioEngine, padPresets } from './index';
const chord = (...midis: number[]): PlaybackVoicing => ({ pitches: midis.map(midi => ({ midi, octave: 4, letter: 'C', accidental: 0, pitchClass: 0 })) });
const hz = (midi: number) => 440 * 2 ** ((midi - 69) / 12);
const deferred = () => { let resolve!: () => void; let reject!: (e: Error) => void; const promise = new Promise<void>((a, b) => { resolve = a; reject = b; }); return { promise, resolve, reject }; };
let engine: PadAudioEngine; let statuses: PlaybackStatus[];
beforeEach(() => { mock.banks.length = 0; mock.gains.length = 0; mock.reverbs.length = 0; mock.effects.length = 0; mock.setReverbReady(Promise.resolve()); mock.callbacks.clear(); mock.raw.state = 'running'; vi.clearAllMocks(); mock.start.mockResolvedValue(undefined); engine = new PadAudioEngine(); statuses = []; engine.subscribe(s => statuses.push(s)); });
describe('PadAudioEngine', () => {
  it('is initially silent and retains exact enharmonic MIDI pitches but not octaves', async () => {
    expect(padPresets.slice(0, 2)).toEqual(['Lush pad', 'Electric keys']);
    engine.setVoicing(chord(61, 64)); expect(mock.banks).toHaveLength(0); await engine.play(); await engine.play();
    expect(mock.start).toHaveBeenCalledTimes(1); expect(mock.effects).toHaveLength(2); const bank = mock.banks[0];
    engine.setVoicing({ pitches: [{ letter: 'D', accidental: -1, pitchClass: 1, octave: 4, midi: 61 }, ...chord(73).pitches] });
    expect(bank.release).toEqual([hz(64)]); expect(bank.attack).toEqual([hz(61), hz(64), hz(73)]);
  });
  it('coalesces three immediate disjoint eight-note chords without dropped attacks', async () => {
    const a = [40,41,42,43,44,45,46,47], b = a.map(n => n + 12), c = a.map(n => n + 24);
    engine.setVoicing(chord(...a)); await engine.play(); engine.setVoicing(chord(...b)); engine.setVoicing(chord(...c)); engine.setVoicing(chord(...c));
    expect(mock.banks).toHaveLength(1); expect(mock.banks[0].dropped).toBe(0); expect(mock.gains[1].values.at(-1)).toBe(0);
    mock.flush(); expect(mock.banks[0].disposed).toBe(true); expect(mock.banks[1].active).toEqual(c.map(hz)); expect(mock.banks[1].dropped).toBe(0);
    engine.setVoicing(chord(...c)); expect(mock.banks[1].attack).toHaveLength(8);
  });
  it('replays latest chord after stop during transition without tail exhaustion', async () => {
    engine.setVoicing(chord(...[40,41,42,43,44,45,46,47])); await engine.play(); engine.stop();
    engine.setVoicing(chord(...[60,61,62,63,64,65,66,67])); await engine.play(); expect(mock.banks).toHaveLength(1); mock.flush();
    expect(mock.banks[1].active).toEqual([60,61,62,63,64,65,66,67].map(hz)); expect(mock.banks[1].dropped).toBe(0);
  });
  it('reports rejection and retries', async () => {
    mock.start.mockRejectedValueOnce(new Error('denied')); await engine.play(); expect(statuses.at(-1)).toEqual({ state: 'error', message: 'denied' });
    await engine.play(); expect(statuses.at(-1)).toEqual({ state: 'playing' });
  });
  it('uses latest chord and preset after pending activation', async () => {
    const d = deferred(); mock.start.mockReturnValueOnce(d.promise); engine.setVoicing(chord(60)); const p = engine.play(); expect(engine.play()).toBe(p);
    engine.setVoicing(chord(69)); engine.setPreset('Glass'); d.resolve(); await p; expect(mock.banks[0].attack).toEqual([440]);
  });
  it.each(['stop', 'dispose'] as const)('%s cancels pending activation', async action => {
    const d = deferred(); mock.start.mockReturnValueOnce(d.promise); const p = engine.play(); engine[action](); d.resolve(); await p; expect(mock.banks).toHaveLength(0); expect(statuses.at(-1)?.state).toBe('stopped');
  });
  it('bounds repeated preset transitions and handles stop and stale callbacks', async () => {
    engine.setVoicing(chord(60)); await engine.play(); engine.setPreset('Airy'); const stale = [...mock.callbacks.values()][0]; engine.setPreset('Dark'); engine.setPreset('Glass');
    expect(mock.banks).toHaveLength(1); expect(mock.gains[1].values.at(-1)).toBe(0); engine.stop(); mock.flush(); expect(mock.banks[0].disposed).toBe(true); expect(mock.banks).toHaveLength(1);
    stale(); expect(mock.banks).toHaveLength(1); await engine.play(); expect(mock.banks[1].attack).toEqual([hz(60)]);
  });
  it('disposes after fade and ignores stale timer', async () => {
    engine.setVoicing(chord(60)); await engine.play(); engine.setPreset('Airy'); const stale = [...mock.callbacks.values()][0]; engine.dispose(); expect(mock.banks[0].disposed).toBe(false);
    mock.flush(); expect(mock.banks[0].disposed).toBe(true); expect(mock.gains.every(g => g.disposed)).toBe(true); stale(); expect(mock.banks).toHaveLength(1);
    expect(mock.raw.removeEventListener).toHaveBeenCalled();
  });
  it('cleans interrupted transition and retries with a fresh bank', async () => {
    engine.setVoicing(chord(60)); await engine.play(); engine.setPreset('Airy'); const stale = [...mock.callbacks.values()][0];
    mock.raw.state = 'suspended'; const callback = mock.raw.addEventListener.mock.calls[0][1] as () => void; callback(); expect(statuses.at(-1)?.state).toBe('error'); expect(mock.banks[0].disposed).toBe(true);
    mock.raw.state = 'running'; engine.setVoicing(chord(69)); await engine.play(); stale(); expect(mock.banks[1].active).toEqual([440]); expect(mock.banks).toHaveLength(2);
  });
  it('cleans a disposed fading bank if the context suspends before its timer', async () => {
    engine.setVoicing(chord(60)); await engine.play(); engine.dispose();
    const stale = [...mock.callbacks.values()][0]; mock.raw.state = 'suspended';
    (mock.raw.addEventListener.mock.calls[0][1] as () => void)();
    expect(mock.banks[0].disposed).toBe(true);
    expect(mock.gains.every(g => g.disposed)).toBe(true); stale(); expect(mock.banks).toHaveLength(1);
  });
  it('keeps the same held notes while switching through both new sustained presets', async () => {
    engine.setPreset('Warm'); engine.setVoicing(chord(60, 64, 67, 71)); await engine.play();
    engine.setPreset('Lush pad'); mock.flush(); expect(mock.banks[1].active).toEqual([60, 64, 67, 71].map(hz));
    expect(mock.effects).toHaveLength(2);
    engine.setPreset('Electric keys'); mock.flush(); expect(mock.banks[2].active).toEqual([60, 64, 67, 71].map(hz));
    expect(mock.effects.slice(0, 2).every(effect => effect.disposed)).toBe(true);
    engine.dispose(); mock.flush(); expect(mock.effects.every(effect => effect.disposed)).toBe(true);
    expect(mock.reverbs[0].disposed).toBe(true);
  });
  it('ramps bounded reverb and cancels startup while its impulse loads', async () => {
    engine.setReverb(0.8); engine.setVoicing(chord(60));
    const ready = deferred(); mock.setReverbReady(ready.promise);
    const pending = engine.play(); await Promise.resolve(); await Promise.resolve();
    expect(mock.reverbs[0].wet[0]).toBe(0.4); expect(mock.banks).toHaveLength(0);
    engine.setReverb(0); expect(mock.reverbs[0].wet.at(-1)).toBe(0);
    engine.stop(); ready.resolve(); await pending; expect(mock.banks).toHaveLength(0);
    expect(statuses.at(-1)?.state).toBe('stopped');
    expect(() => engine.setReverb(NaN)).toThrow(RangeError);
    await engine.play(); expect(mock.banks).toHaveLength(1);
  });
  it('a second Play still waits for reverb after Stop cancels its first startup', async () => {
    const ready = deferred(); mock.setReverbReady(ready.promise); engine.setVoicing(chord(60));
    const first = engine.play(); await Promise.resolve(); await Promise.resolve();
    engine.stop(); const second = engine.play(); await Promise.resolve(); await Promise.resolve();
    expect(mock.banks).toHaveLength(0); expect(mock.reverbs).toHaveLength(1);
    ready.resolve(); await Promise.all([first, second]);
    expect(mock.banks).toHaveLength(1); expect(statuses.at(-1)?.state).toBe('playing');
  });
  it('dispose during reverb startup cannot create a bank or revive audio', async () => {
    const ready = deferred(); mock.setReverbReady(ready.promise);
    const pending = engine.play(); await Promise.resolve(); await Promise.resolve();
    engine.dispose(); ready.resolve(); await pending;
    expect(mock.banks).toHaveLength(0); expect(mock.reverbs[0].disposed).toBe(true);
    expect(mock.gains.every(gain => gain.disposed)).toBe(true);
  });
  it('retries after reverb loading fails', async () => {
    mock.setReverbReady(Promise.reject(new Error('Impulse failed')));
    await engine.play(); expect(statuses.at(-1)?.state).toBe('error'); expect(mock.reverbs[0].disposed).toBe(true);
    mock.setReverbReady(Promise.resolve()); await engine.play(); expect(statuses.at(-1)?.state).toBe('playing');
  });
  it('clamps volume and rejects malformed, sparse and excessive voicings without changing notes', async () => {
    engine.setVolume(-1); engine.setVoicing(chord(60)); await engine.play(); expect(mock.gains[0].values[0]).toBe(0); engine.setVolume(2); expect(mock.gains[0].values.at(-1)).toBe(0.12);
    for (const bad of [null, {}, { pitches: [null] }, { pitches: new Array(1) }, { pitches: [{ midi: 60 }] }, chord(...Array.from({ length: 9 }, (_, i) => i))]) {
      expect(() => engine.setVoicing(bad as PlaybackVoicing)).toThrow();
    }
    expect(mock.banks[0].active).toEqual([hz(60)]);
  });
});
