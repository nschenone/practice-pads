import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PlaybackVoicing, PlaybackStatus } from '../contracts';

const mock = vi.hoisted(() => {
  const state = { state: 'running', addEventListener: vi.fn(), removeEventListener: vi.fn() };
  const banks: { attack: number[]; release: number[]; disposed: boolean; all: number }[] = [];
  const gains: { values: number[]; disposed: boolean }[] = [];
  return { state, banks, gains, start: vi.fn() };
});
vi.mock('tone', () => ({
  start: mock.start, getContext: () => ({ rawContext: mock.state }), Synth: class {},
  Gain: class {
    item: { values: number[]; disposed: boolean };
    gain: { linearRampTo: (value: number) => void };
    constructor(value: number) { this.item = { values: [value], disposed: false }; mock.gains.push(this.item); this.gain = { linearRampTo: value => this.item.values.push(value) }; }
    toDestination() { return this; } dispose() { this.item.disposed = true; }
  },
  PolySynth: class {
    item = { attack: [] as number[], release: [] as number[], disposed: false, all: 0 };
    constructor() { mock.banks.push(this.item); }
    connect() { return this; } triggerAttack(n: number) { this.item.attack.push(n); }
    triggerRelease(n: number) { this.item.release.push(n); } releaseAll() { this.item.all++; }
    dispose() { this.item.disposed = true; }
  },
}));
import { PadAudioEngine } from './index';
const chord = (...midis: number[]): PlaybackVoicing => ({ pitches: midis.map(midi => ({ midi, octave: 4, letter: 'C', accidental: 0, pitchClass: 0 })) });
const deferred = () => { let resolve!: () => void; let reject!: (e: Error) => void; const promise = new Promise<void>((a, b) => { resolve = a; reject = b; }); return { promise, resolve, reject }; };
let engine: PadAudioEngine; let statuses: PlaybackStatus[];
beforeEach(() => { mock.banks.length = 0; mock.gains.length = 0; mock.state.state = 'running'; vi.clearAllMocks(); mock.start.mockResolvedValue(undefined); engine = new PadAudioEngine(); statuses = []; engine.subscribe(s => statuses.push(s)); });
describe('PadAudioEngine', () => {
  it('does not create sound until play and uses MIDI identity for diffs', async () => {
    engine.setVoicing(chord(60, 64)); expect(mock.banks).toHaveLength(0); await engine.play(); await engine.play();
    expect(mock.start).toHaveBeenCalledTimes(1); const bank = mock.banks[0]; expect(bank.attack).toHaveLength(2);
    engine.setVoicing(chord(64, 72)); expect(bank.release).toHaveLength(1); expect(bank.attack).toHaveLength(3);
    engine.setVoicing(chord(64, 72)); expect(bank.attack).toHaveLength(3); engine.stop(); expect(bank.all).toBe(1);
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
  it('clamps gain, bounds preset banks and cleans up on interruption', async () => {
    engine.setVolume(-1); engine.setVoicing(chord(60)); await engine.play(); expect(mock.gains[0].values[0]).toBe(0);
    engine.setVolume(2); expect(mock.gains[0].values.at(-1)).toBe(0.12);
    engine.setPreset('Airy'); engine.setPreset('Dark'); expect(mock.banks.map(b => b.disposed)).toEqual([true, true, false]);
    mock.state.state = 'suspended'; const callback = mock.state.addEventListener.mock.calls[0][1] as () => void; callback(); expect(statuses.at(-1)?.state).toBe('error');
    engine.dispose(); expect(mock.banks.at(-1)?.disposed).toBe(true); expect(mock.gains[0].disposed).toBe(true); expect(mock.state.removeEventListener).toHaveBeenCalled();
  });
});
