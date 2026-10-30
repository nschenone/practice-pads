# Practice Pads

Practice modes over a sustained chord in your browser. Choose a parent scale, hear its chords, and explore how each mode relates to the same notes and guitar position. Practice Pads supports major, jazz melodic minor and harmonic minor, with seven modes per family.

In **Guided** practice, changing the mode changes the tonal center and chord while retaining the parent collection and selected position. In **Self-guided**, choose a chord to see pitch-compatible modes; the list is not a harmonic recommendation. For example, D jazz melodic minor gives F Lydian augmented on degree III: B is its #4 and C# its #5, also a chord tone in Fmaj7#5.

Play starts audio only after a user gesture. Start at low device and app volume. Tone.js synthesizes five sounds: Warm, Airy, Glass, Dark and Organ. Browsers and devices differ in autoplay and interruption behavior; sound quality, peak levels and recovery still need review. VexFlow renders notation and tab; fretboard.js renders the guitar diagram. Major positions use its unreviewed templates. Minor families show a scale-note map until you supply a local position mapping. You can edit, save and import/export mappings in this browser; local review is not teacher approval. A pitch map is not a reviewed CAGED fingering.

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
