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
const MAX_VOICES = 16;
const FADE_SECONDS = 0.08;
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
  private bankGain?: Tone.Gain;
  // Count every attack, not just active notes: released voices remain allocated until silent.
  private attacks = 0;
  private transition?: number;
  private transitionVersion = 0;
  private raw?: AudioContext;
  private onState = () => {
    if (this.raw?.state === 'running') return;
    this.destroyBank();
    if (this.disposed) { this.finishDispose(); return; }
    if (this.status.state === 'playing') {
      this.generation++;
      this.publish({ state: 'error', message: 'Audio was interrupted. Press Play to retry.' });
    }
  };
  private finishDispose() {
    this.raw?.removeEventListener('statechange', this.onState);
    this.gain?.dispose(); this.gain = undefined;
  }
  private publish(status: PlaybackStatus) {
    this.status = status;
    this.listeners.forEach(listener => listener(status));
  }
  subscribe(listener: (status: PlaybackStatus) => void): () => void {
    this.listeners.add(listener); listener(this.status);
    return () => this.listeners.delete(listener);
  }
  setVoicing(voicing: PlaybackVoicing): void {
    if (!voicing || !Array.isArray(voicing.pitches)) throw new TypeError('Voicing must contain a dense pitch array');
    const values: number[] = [];
    for (let i = 0; i < voicing.pitches.length; i++) {
      const p = voicing.pitches[i];
      if (!(i in voicing.pitches) || !p || typeof p !== 'object' ||
          !['A', 'B', 'C', 'D', 'E', 'F', 'G'].includes(p.letter) ||
          !Number.isInteger(p.accidental) || p.accidental < -2 || p.accidental > 2 ||
          !Number.isInteger(p.pitchClass) || p.pitchClass < 0 || p.pitchClass > 11 ||
          !Number.isInteger(p.octave) || !Number.isInteger(p.midi) || p.midi < 0 || p.midi > 127) {
        throw new TypeError('Voicing contains an invalid pitch');
      }
      values.push(p.midi);
    }
    if (new Set(values).size > MAX_NOTES) throw new RangeError('Voicing requires at most eight distinct MIDI notes');
    this.notes = new Set(values);
    if (this.status.state === 'playing' && this.transition === undefined) this.sync();
  }
  private sync() {
    const additions = [...this.notes].filter(n => !this.held.has(n));
    if (this.attacks + additions.length > MAX_VOICES) { this.fadeBank(); return; }
    for (const n of this.held) if (!this.notes.has(n)) this.synth!.triggerRelease(frequency(n));
    for (const n of additions) { this.synth!.triggerAttack(frequency(n)); this.attacks++; }
    this.held = new Set(this.notes);
  }
  private createBank() {
    this.bankGain = new Tone.Gain(0).connect(this.gain!);
    this.synth = new Tone.PolySynth({ voice: Tone.Synth, maxPolyphony: MAX_VOICES, options: settings[this.preset] }).connect(this.bankGain);
    this.bankGain.gain.linearRampTo(1, FADE_SECONDS);
  }
  private destroyBank() {
    if (this.transition !== undefined) Tone.getContext().clearTimeout(this.transition);
    this.transition = undefined; this.transitionVersion++;
    this.synth?.dispose(); this.bankGain?.dispose();
    this.synth = undefined; this.bankGain = undefined; this.attacks = 0; this.held.clear();
  }
  private fadeBank() {
    if (!this.synth || this.transition !== undefined) return;
    this.bankGain!.gain.linearRampTo(0, FADE_SECONDS);
    const context = Tone.getContext();
    const version = ++this.transitionVersion;
    // Tone's clock fires lookAhead early; wait until the fade has actually rendered.
    this.transition = context.setTimeout(() => {
      if (version !== this.transitionVersion) return;
      this.destroyBank();
      if (this.disposed) this.finishDispose();
      else if (this.status.state === 'playing') { this.createBank(); this.sync(); }
    }, FADE_SECONDS + context.lookAhead);
  }
  setPreset(preset: PadPreset): void {
    if (!padPresets.includes(preset)) throw new RangeError('Unknown pad preset');
    if (preset === this.preset) return;
    this.preset = preset;
    if (this.synth) this.fadeBank();
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
      if (this.transition === undefined) this.sync();
      this.publish({ state: 'playing' });
    }).catch((error: unknown) => {
      if (!this.disposed && generation === this.generation) this.publish({ state: 'error', message: error instanceof Error ? error.message : 'Audio activation failed' });
    }).finally(() => { if (this.pending === pending) this.pending = undefined; });
    this.pending = pending;
    return pending;
  }
  stop(): void {
    if (this.disposed) return;
    this.generation++; this.pending = undefined;
    this.fadeBank(); this.publish({ state: 'stopped' });
  }
  dispose(): void {
    if (this.disposed) return;
    this.stop(); this.disposed = true;
    if (this.raw?.state !== 'running') this.destroyBank();
    if (!this.synth) this.finishDispose();
    this.listeners.clear();
  }
}
