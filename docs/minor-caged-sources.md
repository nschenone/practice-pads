# Actual minor CAGED positions

## Verified teaching references

Jens Larsen publishes five-position CAGED charts for **both minor families in this app**:

- [Melodic minor Scale – CAGED](https://jenslarsen.nl/melodic-minor-scale-caged/): the author explicitly describes five CAGED positions in C. The [full-size chart](https://jenslarsen.nl/WP/wp-content/uploads/2019/09/CAGED-Melodic-Minor.jpg) shows five distinct neck patterns, with roots highlighted. Its collection is C, D, E-flat, F, G, A, B: ascending/jazz melodic minor, not natural minor.
- [Harmonic minor Scale – CAGED](https://jenslarsen.nl/harmonic-minor-scale-caged/): the author explicitly describes five CAGED positions in C. The [full-size chart](https://jenslarsen.nl/WP/wp-content/uploads/2019/09/CAGED-Harmonic-minor.jpg) shows five distinct patterns with roots highlighted. Its collection is C, D, E-flat, F, G, A-flat, B.

Both first-party pages and both full-size charts were fetched and the images inspected. These are specified position patterns, not arbitrary fret windows, natural-minor substitutes, pentatonic boxes or a complete-neck pitch map. The author notes that position shifts matter. The five rows are not individually labeled C/A/G/E/D, so their correspondence to the app's existing shape buttons must be checked rather than inferred from row number.

## What this resolves

Real published minor CAGED positions do exist. The app's current scale-note fallback does not implement them. Earlier research only failed to verify a complete reusable software dataset; that is not evidence that teaching references are unavailable.

The coordinate encoding in `src/visualization/minor-position-data.ts` was checked directly against both full-size images, string 1 high E through string 6 low E. The rows correspond to A, G, E, D, C respectively: their C root anchors are A: strings 5 fret 3 / 3 fret 5; G: 6 fret 8 / 3 fret 5 / 1 fret 8; E: 6 fret 8 / 4 fret 10 / 1 fret 8; D: 4 fret 10 / 2 fret 13; C: 5 fret 15 / 2 fret 13. These match the respective movable minor chord-root configurations; the source itself does not name the rows. Some neighboring shapes share roots, so their other root anchors distinguish them. This mapping is an interpretation, not a label supplied by the author.

Transpose all frets by the parent tonic's chromatic distance from C, adding or subtracting whole octaves so the lowest fret is 1–12. This preserves the actual shape rather than clipping it or creating an open-position variant. Derivative modes retain the parent tonic, family and shape. Tests cover all supported tonics and both families, all seven parent pitch classes, physical string pitch, roots and whole-shape shifts. A diagram does not supply finger numbers or an ordered exercise, so neither is invented from dot order. A musician should independently review the transcription, chord-form naming and playability; the charts do not certify this adapter.

## Reuse boundary

The charts carry a Jens Larsen 2019 copyright notice. No public redistribution license was verified on these pages. Link to the originals; the downloaded images are not committed or bundled with the app. The implementation encodes factual string/fret coordinates as an independent transcription, not the chart artwork or lesson prose; it does not claim author endorsement or an open license. The pages do not establish rights in artwork or an independently licensed software dataset. The charts remain linked rather than bundled.
