# Throwaway workspace comparison

The user chose **A — Practice desk**. This revision adds a parent-tonic circle-of-fifths picker to explore the relationship between a mode and its chord. The selected parent remains distinct from the modal tonic; changing parent preserves the degree and physical fret window. The user verdict on this revision is pending. B and C remain for comparison. This prototype must never merge to main and is not production code.

From the repository root, serve locally with `python3 -m http.server 4174 --bind 127.0.0.1` and open http://127.0.0.1:4174/prototype/workspace/?variant=A. The localhost-only switcher and left/right arrows cycle variants; state is in memory.

The picker offers twelve explicitly spelled parent tonics in circle-of-fifths order. The family is fixed to jazz melodic minor, with seven curated modes and literal stacked-seventh chord qualities, including half-diminished on VII. The static note spellings and chromas were generated using `@tonaljs/tonal` 4.10.0. To reproduce without installing in this repository, install that version in a scratch directory and run `NODE_PATH=/path/to/scratch/node_modules node prototype/workspace/generate-fixtures.cjs > prototype/workspace/fixtures.js`. This is a bounded fixture, not a general theory or chord engine. Only mode III's #4 and #5 are marked as distinctive tones. Chord markers show stacked degrees 1, 3, 5 and 7; shared notes alone do not establish harmonic suitability.

Playback is simulated and has **no audio**. The score is an illustrative ordered sequence, not music engraving. The standard-tuning pitch map is unreviewed and is not validated CAGED. Do not treat the fretboard as a canonical CAGED representation.

Capture the relationship-readability verdict, rationale, and requested changes after user review. Do not promote this prototype directly to production.
