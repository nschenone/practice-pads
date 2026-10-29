# Theory API

Import named exports from `src/theory`. All functions are pure and reject invalid or inconsistent inputs with `RangeError`. Spelling uses ASCII `b` and `#`, up to double accidentals; a requested spelling requiring more is rejected. `SUPPORTED_TONICS` is the ordered conventional selector: C, Db, D, Eb, E, F, F#, G, Ab, A, Bb, B. Other consistent spelled roots are accepted when their resulting notes fit the double-accidental limit. `SCALE_FAMILIES` gives family order.

```ts
const practice = guidedPractice(d, 'jazz-melodic-minor', 3, 'position-1');
// practice.mode.tonic is F, parentTonic is D, chord is Fmaj7#5.
const next = guidedPractice(practice.parentTonic, practice.family, 4, practice.positionId);
const chord = constructChord(f, 'maj7#5');
const candidates = compatibleCandidates(f, 'maj7#5');
const voicing = playbackVoicing(chord); // root written octave 3
```

`deriveMode(parentTonic, family, degree)` returns the rotated, letter-preserving notes. `literalChord(mode)` stacks its literal seventh; melodic-minor vii is half-diminished, not an altered dominant. `modeMetadata(family, degree)` returns aliases, seven modal interval labels, and optional one-based characteristic degrees. Characteristic degrees are curated observations, not exhaustive prescriptions; they may overlap chord tones. `noteName` formats a validated spelling. `guidedPractice` defaults position to null and retains the passed position without interpreting it. `constructChord` supports the seven contract qualities; self-guided state is `{ kind: 'self-guided', root, quality }`.

`compatibleCandidates` tests pitch-class containment of the input chord, not harmonic suitability. It enumerates each supported parent spelling, family, then mode degree in the published order. Each parent/family/degree appears once, even where collections coincide; provenance is retained and each candidate's chord is the input chord. No matches returns `[]`. `playbackVoicing` creates ascending close-position chord tones, defaults to written root octave 3, and computes MIDI from written octave and accidental (including crossings); out-of-range MIDI is rejected. These are deterministic defaults, not reviewed voicings.
