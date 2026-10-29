# Integration notes

The production entry composes the controlled workspace, theory, audio and visualization modules. It starts at D jazz melodic minor, degree III. The position remains selected across parent, family and derivative changes. The circle pairs use Tonal major-key relative minor data; crossing major/minor follows the relative key and minor-to-minor retains the tonic. Self-guided playback uses the selected input chord, not a candidate's literal chord.

The five major templates are upstream fretboard.js data and not reviewed fingerings. No minor fingering or ordered exercise is supplied. Source and pending labels remain visible. The unresolved upstream fretboard.js license notice and educational-data provenance must be confirmed before redistribution; see visualization.md for notices. Publication is not authorized.

## Paused checkpoint

The owner tried the integrated app and confirmed it works, with testing and refinement still needed. Work is paused after pushing the reviewed implementation. This is a usable technical prototype, not musical or release acceptance.

Resume with real audio listening, peak and interruption checks; review all five major positions and notation with the musician; then resolve reviewed minor-family fingerings and ordered exercises. Confirm the upstream notice before redistribution. Keep the repository private and do not publish without separate approval.

## Validation and remaining gates

`npm ci`, `npm run check` (34 tests) and `npm audit` passed. Production preview under `/practice-pads/` was checked in a named Chromium browser session. Screenshots and snapshots are in the integration run's `integration-review` directory, with command logs in `command-logs`. The browser showed D melodic minor/F Lydian augmented, a changed degree, C major upstream template, remembered A harmonic minor, F# major, self-guided input, and a muted Play reporting Playing followed by Stop. Escape returned focus. At 390px and simulated 200% CSS zoom, document scroll width matched viewport width. The browser console reported Tone autoplay warnings before a gesture and an intermittent favicon 404; no claim of audio listening is made. One exploratory CLI eval had a syntax error; the subsequent native slider fill set mute successfully.

Not verified: sound by listening, digital peaks, interruption/recovery, repeated Stop, all presets and volume changes, all positions, browser/OS matrix, full keyboard flow, real browser zoom, musician notation/fingering review, or teacher approval. The final production build differs from the earlier screenshots by a policy extraction and visualization error boundary; F# and narrow checks used the final build. The preview is local, not deployed.
