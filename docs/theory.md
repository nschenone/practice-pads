# Theory API

Import named exports from `src/theory`. All functions are pure and reject invalid or inconsistent inputs with `RangeError`. Spelling uses ASCII `b` and `#`, up to double accidentals; a requested spelling requiring more is rejected. `SUPPORTED_TONICS` is the ordered conventional selector: C, Db, D, Eb, E, F, F#, G, Ab, A, Bb, B. Other consistent spelled roots are accepted when their resulting notes fit the double-accidental limit. `SCALE_FAMILIES` gives family order. Both catalog arrays and tonic entries are runtime-frozen and readonly; returned modes, chords, candidates and metadata are caller-owned values.

```ts
const practice = guidedPractice(d, 'jazz-melodic-minor', 3, 'position-1');
// practice.mode.tonic is F, parentTonic is D, chord is Fmaj7#5.
const next = guidedPractice(practice.parentTonic, practice.family, 4, practice.positionId);
const chord = constructChord(f, 'maj7#5');
const candidates = compatibleCandidates(f, 'maj7#5');
const voicing = playbackVoicing(chord); // unchanged four-note close chord, root written octave 3
const spread = playbackVoicing(chord, 3, 'spread'); // doubled bass root, repositioned literal chord tones
```

The `natural-minor` family starts on Aeolian, then Locrian, Ionian, Dorian, Phrygian, Lydian and Mixolydian. Its literal seventh qualities are m7, m7b5, maj7, m7, m7, maj7 and 7; its parent identity remains the minor key.

`deriveMode(parentTonic, family, degree)` returns the rotated, letter-preserving notes. `literalChord(mode)` stacks its literal seventh; melodic-minor vii is half-diminished, not an altered dominant. `modeMetadata(family, degree)` returns aliases, seven modal interval labels, three `extensionLabels` (degrees 2, 4 and 6 expressed as 9, 11 and 13), and optional one-based characteristic degrees. Extension labels preserve the mode’s literal accidentals: Lydian gives `9, #11, 13`, Lydian #2 gives `#9, #11, 13`, and Superlocrian gives `b9, b11, b13` over its literal m7b5. These describe the collection, not curated available tensions or sounding notes; some can clash with chord tones. Characteristic degrees are curated observations, not exhaustive prescriptions; they may overlap chord tones. `noteName` formats a validated spelling. `guidedPractice` defaults position to null and retains the passed position without interpreting it. `constructChord` supports the seven contract qualities; self-guided state is `{ kind: 'self-guided', root, quality }`.

`compatibleCandidates` tests pitch-class containment of the input chord, not harmonic suitability. It enumerates each supported parent spelling, family, then mode degree in the published order. Each parent/family/degree appears once, even where collections coincide; provenance is retained and each candidate's chord is the input chord. No matches returns `[]`. `playbackVoicing` defaults to the original ascending four-tone close position at written root octave 3. Its explicit `spread` variant adds the upper root above the bass root and repositions the literal chord tones: maj7, m(maj7) and m7b5 raise the third; dominant 7 moves the fifth below the upper root. Other seventh qualities conservatively keep their chord tones above the bass. No modal tensions are added, including for Superlocrian, whose literal chord stays m7b5. MIDI is computed from written octave and accidental (including crossings); out-of-range MIDI is rejected. These deterministic listening variants are not reviewed recommendations.

## Tonal boundary

The pinned direct dependency is `@tonaljs/tonal` 4.10.0 (the official Tonal umbrella package; its component versions are locked in `package-lock.json`). Tonal's `Note.get` and `Note.transpose` provide parsing, chroma, spelling, written octave and MIDI; `Scale.get` supplies parent scale intervals, `Interval.distance`/`Interval.get` derive modal intervals, and `Chord.getChord` supplies chord intervals. Explicit trust-boundary checks still reject inconsistent input, sparse arrays, triple accidentals and MIDI outside 0–127. Tonal's note output distinguishes written `B#3` from sounding MIDI 60 and `Cb4` from MIDI 59.

The app owns the four-family catalog, names, aliases, characteristic degrees, literal quality mapping, parent-letter rotation, practice relationships and pitch-containment policy. Modal intervals are obtained from the rotated parent collection, not Tonal's named modal scale; this preserves parent spelling. In particular [Tonal's altered dictionary](https://github.com/tonaljs/tonal/blob/main/packages/scale-type/data.ts) uses dominant-oriented spelling, whereas the literal seventh mode of D melodic minor is C# D E F G A B and its stacked seventh is C#ø7, not C#7alt. Chord and scale construction use Tonal's spelled intervals and transposition rather than enharmonic normalization. See the [official Tonal documentation](https://tonaljs.github.io/tonal/docs) and [note implementation](https://github.com/tonaljs/tonal/tree/main/packages/note).
