# Practice Pads

Practice modes over a sustained chord in your browser. Choose a parent scale, hear its chords, and explore how each mode relates to the same notes and guitar position. Practice Pads supports major, jazz melodic minor and harmonic minor, with seven modes per family.

Changing the mode changes the tonal center and chord while retaining the parent collection and selected position. For example, D jazz melodic minor gives F Lydian augmented on degree III: B is its #4 and C# its #5, also a chord tone in Fmaj7#5.

Play starts audio only after a user gesture. Start at low device and app volume. Tone.js synthesizes five sounds: Warm, Airy, Glass, Dark and Organ. Browsers and devices differ in autoplay and interruption behavior; sound quality, peak levels and recovery still need review. VexFlow renders notation and tab; fretboard.js renders the guitar diagram. Major positions use its templates; both minor families have five reference-derived CAGED position maps. Transcription, shape identity and playability still need independent musician review. Tap notes in the fretboard editor to build your own ordered sequence, save it locally, or import/export mappings. Local review is not teacher approval; position maps do not supply finger numbers or an ordered exercise.

[Open Practice Pads](https://nschenone.github.io/practice-pads/). This prototype has no accounts, backend, analytics, router or cloud sync.

## Run locally

Use Node 24 and npm:

```sh
npm ci
npm run dev
```

Open the URL printed by Vite. To run type checks, tests and a production build, use `npm run check`. To preview the production build under its configured base path:

```sh
npm run build
npx vite preview --host 127.0.0.1
```

Open <http://127.0.0.1:4173/practice-pads/>.

[Practice guide](docs/practice.md) · [Theory API](docs/theory.md) · [Visualization API and notices](docs/visualization.md) · [Research](docs/research.md) · [Release checks](docs/integration.md)
