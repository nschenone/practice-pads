# Theory API

Import named exports from `src/theory`. All functions are pure and reject invalid or inconsistent inputs with `RangeError`. Spelling uses ASCII `b` and `#`, up to double accidentals; a requested spelling requiring more is rejected. `SUPPORTED_TONICS` is the ordered conventional selector: C, Db, D, Eb, E, F, F#, G, Ab, A, Bb, B. Other consistent spelled roots are accepted when their resulting notes fit the double-accidental limit. `SCALE_FAMILIES` gives family order. Both catalog arrays and tonic entries are runtime-frozen and readonly; returned modes, chords, candidates and metadata are caller-owned values.

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

## Tonal boundary

The pinned direct dependency is `@tonaljs/tonal` 4.10.0 (the official Tonal umbrella package; its component versions are locked in `package-lock.json`). Tonal's `Note.get` and `Note.transpose` provide parsing, chroma, spelling, written octave and MIDI; `Scale.get` supplies parent scale intervals, `Interval.distance`/`Interval.get` derive modal intervals, and `Chord.getChord` supplies chord intervals. Explicit trust-boundary checks still reject inconsistent input, sparse arrays, triple accidentals and MIDI outside 0–127. Tonal's note output distinguishes written `B#3` from sounding MIDI 60 and `Cb4` from MIDI 59.

The app owns the three-family catalog, names, aliases, characteristic degrees, literal quality mapping, parent-letter rotation, practice relationships and pitch-containment policy. Modal intervals are obtained from the rotated parent collection, not Tonal's named modal scale; this preserves parent spelling. In particular [Tonal's altered dictionary](https://github.com/tonaljs/tonal/blob/main/packages/scale-type/data.ts) uses dominant-oriented spelling, whereas the literal seventh mode of D melodic minor is C# D E F G A B and its stacked seventh is C#ø7, not C#7alt. Chord and scale construction use Tonal's spelled intervals and transposition rather than enharmonic normalization. See the [official Tonal documentation](https://tonaljs.github.io/tonal/docs) and [note implementation](https://github.com/tonaljs/tonal/tree/main/packages/note).
