import * as Tone from 'tone';
import type { PlaybackStatus, PlaybackVoicing } from '../contracts';

export const padPresets = ['Warm', 'Airy', 'Glass', 'Dark', 'Organ'] as const;
export type PadPreset = typeof padPresets[number];
const settings = {
  Warm: { oscillator: { type: 'sine' as const }, envelope: { attack: 0.5, decay: 0.4, sustain: 0.7, release: 1.2 } },
  Airy: { oscillator: { type: 'triangle' as const }, envelope: { attack: 1, decay: 0.7, sustain: 0.55, release: 1.8 } },
  Glass: { oscillator: { type: 'sine' as const }, envelope: { attack: 0.15, decay: 1.2, sustain: 0.45, release: 1.5 } },
  Dark: { oscillator: { type: 'triangle' as const }, envelope: { attack: 0.8, decay: 0.5, sustain: 0.45, release: 1.4 } },
  Organ: { oscillator: { type: 'sine' as const }, envelope: { attack: 0.12, decay: 0.2, sustain: 0.8, release: 0.5 } },
};
const MAX_NOTES = 8;
const frequency = (midi: number) => 440 * 2 ** ((midi - 69) / 12);

/** One instance per player, retained across UI renders. */
export class PadAudioEngine {
  private status: PlaybackStatus = { state: 'stopped' };
  private listeners = new Set<(status: PlaybackStatus) => void>();
  private notes = new Set<number>();
  private held = new Set<number>();
  private preset: PadPreset = 'Warm';
  private volume = 0.5;
  private generation = 0;
  private disposed = false;
  private pending: Promise<void> | undefined;
  private gain?: Tone.Gain;
  private synth?: Tone.PolySynth;
  private raw?: AudioContext;
  private onState = () => {
    if (this.status.state === 'playing' && this.raw?.state !== 'running') {
      this.generation++;
      this.synth?.releaseAll();
      this.held.clear();
      this.publish({ state: 'error', message: 'Audio was interrupted. Press Play to retry.' });
    }
  };
  private publish(status: PlaybackStatus) {
    this.status = status;
    this.listeners.forEach(listener => listener(status));
  }
  subscribe(listener: (status: PlaybackStatus) => void): () => void {
    this.listeners.add(listener); listener(this.status);
    return () => this.listeners.delete(listener);
  }
  setVoicing(voicing: PlaybackVoicing): void {
    const values = voicing.pitches.map(p => p.midi);
    if (values.some(n => !Number.isInteger(n) || n < 0 || n > 127) || new Set(values).size > MAX_NOTES) throw new RangeError('Voicing requires at most eight distinct MIDI notes (0–127).');
    this.notes = new Set(values);
    if (this.status.state === 'playing') this.sync();
  }
  private sync() {
    for (const n of this.held) if (!this.notes.has(n)) this.synth?.triggerRelease(frequency(n));
    for (const n of this.notes) if (!this.held.has(n)) this.synth?.triggerAttack(frequency(n));
    this.held = new Set(this.notes);
  }
  private createBank() {
    this.synth = new Tone.PolySynth({ voice: Tone.Synth, maxPolyphony: 16, options: settings[this.preset] }).connect(this.gain!);
  }
  setPreset(preset: PadPreset): void {
    if (!padPresets.includes(preset)) throw new RangeError('Unknown pad preset');
    if (preset === this.preset) return;
    this.preset = preset;
    if (this.synth) {
      // A single bank bounds overlap, including rapid changes; replacement is immediate.
      this.synth.dispose(); this.synth = undefined; this.held.clear();
      if (this.status.state === 'playing') { this.createBank(); this.sync(); }
    }
  }
  setVolume(volume: number): void {
    if (!Number.isFinite(volume)) throw new RangeError('Volume must be finite');
    this.volume = Math.max(0, Math.min(1, volume));
    this.gain?.gain.linearRampTo(this.volume * 0.12, 0.05);
  }
  play(): Promise<void> {
    if (this.disposed) return Promise.reject(new Error('Audio engine disposed'));
    if (this.status.state === 'playing') return Promise.resolve();
    if (this.pending) return this.pending;
    const generation = ++this.generation;
    this.publish({ state: 'starting' });
    if (this.disposed || generation !== this.generation) return Promise.resolve();
    // Invoke start synchronously in the gesture, before any asynchronous work.
    let activation: Promise<void>;
    try { activation = Tone.start(); } catch (error) { activation = Promise.reject(error); }
    const pending = activation.then(() => {
      if (this.disposed || generation !== this.generation) return;
      const raw = Tone.getContext().rawContext as AudioContext;
      if (raw.state !== 'running') throw new Error('Audio context is not running');
      if (!this.raw) { this.raw = raw; raw.addEventListener('statechange', this.onState); }
      if (!this.gain) this.gain = new Tone.Gain(this.volume * 0.12).toDestination();
      if (!this.synth) this.createBank();
      this.sync(); this.publish({ state: 'playing' });
    }).catch((error: unknown) => {
      if (!this.disposed && generation === this.generation) this.publish({ state: 'error', message: error instanceof Error ? error.message : 'Audio activation failed' });
    }).finally(() => { if (this.pending === pending) this.pending = undefined; });
    this.pending = pending;
    return pending;
  }
  stop(): void {
    if (this.disposed) return;
    this.generation++; this.pending = undefined;
    this.synth?.releaseAll(); this.held.clear(); this.publish({ state: 'stopped' });
  }
  dispose(): void {
    if (this.disposed) return;
    this.stop(); this.disposed = true;
    this.raw?.removeEventListener('statechange', this.onState);
    this.synth?.dispose(); this.gain?.dispose(); this.listeners.clear();
  }
}
