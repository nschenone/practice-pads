# Pad audio

`PadAudioEngine` owns at most one Tone synth bank and its gains, but uses Tone's **shared global context**. Create one engine per player, retain it across renders and dispose it on unmount; disposal never closes the global context or disposes other Tone resources. Tone 15.1.22 is pinned; its published source defines `start`, `getContext`, `PolySynth`, `Synth`, `Gain` and their lifecycle APIs ([repository](https://github.com/Tonejs/Tone.js/tree/15.1.22), [package](https://www.npmjs.com/package/tone)). Node 24 is the project runtime; the package declares no Node engine. Tone import works in Node, but actual audio needs a browser.

```ts
import { PadAudioEngine } from './audio';
import type { PlaybackVoicing } from './contracts';

const player = new PadAudioEngine(); // keep across rerenders
const unsubscribe = player.subscribe(status => console.log(status));
const voicing: PlaybackVoicing = { pitches: [
  { letter: 'C', accidental: 0, pitchClass: 0, octave: 4, midi: 60 },
] };
player.setVoicing(voicing); // silent until Play
// In the actual click/keyboard handler, directly:
void player.play();
player.setVoicing({ pitches: [{ letter: 'E', accidental: 0, pitchClass: 4, octave: 4, midi: 64 }] });
player.setVolume(0.3); // normalized 0–1; 0 is mute
player.setPreset('Airy'); // Warm, Airy, Glass, Dark, Organ, Lush pad, Electric keys
player.setReverb(0.12); // 0–0.4 wet mix; reverb tails ring after Stop
player.stop();
unsubscribe(); player.dispose();
```

`play()` invokes Tone activation synchronously, and returns a promise that resolves after success or reported failure. Repeated Play during startup shares the pending request; while playing it is a no-op. Stop invalidates pending activation; a later Play is a new request. During startup, latest voicing and preset win. While stopped or errored, edits do not attack. Invalid, sparse or malformed pitch arrays are rejected before changing the current voicing. MIDI identity, not spelling, determines shared notes; duplicate MIDI values collapse, and at most eight distinct notes in MIDI range are accepted.

Exact shared notes remain held during ordinary changes in the same bank. Tone retains released voices until their tails finish. The engine conservatively counts every attack in a bank against its 16-voice limit, even after tails might have finished. Before that budget can be exhausted, it fades the bank out and replaces it with a fresh one, attacking the latest voicing. Preset changes use the same transition. At most one bank exists; requests during a transition coalesce, so intermediate chords or presets may never sound. This also means common notes restart when a bank is replaced. Fade-out and fade-in are each 80 ms; replacement waits for fade-out plus Tone's context look-ahead and scheduler delay, then the new envelope attacks. The actual audible latency depends on the browser and context. Stop fades the bank and removes it; Play during that fade waits for a fresh bank. The shared reverb remains connected, so its tail rings out after Stop. Lush pad adds a filtered, chorused saw oscillator; Electric keys uses FM with a sustained amplitude envelope. Reverb generates its impulse asynchronously on the first Play, which waits for readiness; preset changes still use the existing bank transition. Dispose also fades and cleans up asynchronously, or cleans up immediately if the context is not running. An interrupted context discards its bank and reports an error, requiring another gesture. Disposal never closes the shared global context. Volume is clamped and ramped with a fixed conservative trim, not a limiter or hearing-safety guarantee.

Unit mocks cannot establish sound quality, peak levels, browser autoplay behavior or acoustic safety. A bounded desktop browser check sampled both output channels for three seconds per case: Warm, Lush pad and Electric keys with Fmaj7#5 Spread at root octaves 3–5, full app volume and 40% reverb. The largest observed sample peak was about 0.48; this was neither continuous true-peak measurement nor a hearing-safety certification. Low-volume listening, broader peak/transition measurements and browser/device interruption checks remain acceptance work.
