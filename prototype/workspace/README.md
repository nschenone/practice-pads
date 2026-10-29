# Throwaway workspace comparison

The user chose A, Practice desk. The pending revision uses key-aware concentric rings: outer major keys and their aligned relative minor keys. The minor ring uses the remembered jazz melodic or harmonic minor family; the family selector changes to the corresponding relative key when crossing rings. The pairs describe major / natural-minor key signatures, not identical melodic- or harmonic-minor collections. The selected parent remains distinct from the modal tonic. Changing key or mode preserves the degree and physical fret window. User verdict on this revision is pending. B and C remain for comparison. This prototype must never merge to main and is not production code.

From the repository root, serve locally with `python3 -m http.server 4174 --bind 127.0.0.1` and open http://127.0.0.1:4174/prototype/workspace/?variant=A. The localhost-only switcher and left/right arrows cycle variants; state is in memory.

Static scale spellings, intervals and chromas were generated using `@tonaljs/tonal` 4.10.0. To reproduce without installing in this repository, install that version in a scratch directory and run `NODE_PATH=/path/to/scratch/node_modules node prototype/workspace/generate-fixtures.cjs > prototype/workspace/fixtures.js`. Mode names and literal stacked-seventh chord qualities are curated metadata. Only jazz melodic minor mode III's #4 and #5 are marked as distinctive. Chord markers show stacked degrees 1, 3, 5 and 7; shared notes alone do not establish harmonic suitability.

Playback is simulated and has **no audio**. The score is an illustrative ordered sequence, not music engraving. The standard-tuning pitch map is unreviewed and is not validated CAGED. Do not treat the fretboard as a canonical CAGED representation.

Capture the relationship-readability verdict, rationale, and requested changes after user review. Do not promote this prototype directly to production.
