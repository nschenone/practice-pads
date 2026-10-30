# Integration notes

The production entry composes the controlled workspace, theory, audio and visualization modules. It starts at D jazz melodic minor, degree III. The position remains selected across parent, family and derivative changes. The circle pairs use Tonal major-key relative minor data; crossing major/minor follows the relative key and minor-to-minor retains the tonic. Self-guided playback uses the selected input chord, not a candidate's literal chord.

The five major templates are upstream fretboard.js data and not reviewed fingerings. At this base, no minor fingering or ordered exercise is supplied. See [the practice guide](practice.md) for planned changes and [visualization](visualization.md) for the corrected upstream notice. Independent educational-data provenance remains unreviewed.

Implementation and public release are planned, subject to final integration and release checks. Verify the planned UI and minor editor against the merged app; listen to audio, measure peaks and test interruption recovery; review positions and notation with a musician. Verify the public site and dependency notices before distribution.

## Validation and remaining gates

`npm ci`, `npm run check` (34 tests) and `npm audit` passed. Production preview under `/practice-pads/` was checked in a named Chromium browser session. The browser showed D melodic minor/F Lydian augmented, a changed degree, C major upstream template, remembered A harmonic minor, F# major, self-guided input, and a muted Play reporting Playing followed by Stop. Escape returned focus. At 390px and simulated 200% CSS zoom, document scroll width matched viewport width. The browser console reported Tone autoplay warnings before a gesture and an intermittent favicon 404; no claim of audio listening is made. One exploratory CLI eval had a syntax error; the subsequent native slider fill set mute successfully.

Not verified: sound by listening, digital peaks, interruption/recovery, repeated Stop, all presets and volume changes, all positions, browser/OS matrix, full keyboard flow, real browser zoom, musician notation/fingering review, or teacher approval. The final production build differs from the earlier screenshots by a policy extraction and visualization error boundary; F# and narrow checks used the final build. The preview is local, not deployed.
