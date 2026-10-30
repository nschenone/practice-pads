# Integration and release checks

The production entry composes the controlled workspace, Tonal theory, Tone audio, VexFlow notation and fretboard.js. It starts at D jazz melodic minor, degree III. Changing derivative mode retains the parent and position. Relative-key changes use Tonal data and remember the selected minor family. Self-guided playback uses the input chord, not a candidate's literal chord.

The five major templates are source-provided and unreviewed. Minor families without a usable mapping show a complete scale-note map over frets 0–12, explicitly not CAGED. No instructional minor dataset or ordered exercise is invented. The local editor accepts an ordered sequence for each parent/family/position, validates it, and saves it in browser storage. Diagram and exercise use that same sequence. See the [practice guide](practice.md) and [visualization reference and notices](visualization.md).

## Verified locally

Clean installation, typecheck, 40 tests, production build and a zero-vulnerability npm audit passed. A size-boundary regression verifies that every saved collection in the test can export a compact backup and reimport it within the same size limit. The production preview was exercised in Chromium under `/practice-pads/`, not only through development fixtures.

Browser checks covered complete melodic/harmonic minor maps (including F and B-flat in D harmonic minor), adding and saving a synthetic two-event mapping, exact exercise staff/tab order, derivative-mode retention, shape isolation, reload persistence, invalid-import preservation, confirmed reset and successful reimport. The synthetic mapping is a rendering test, not an approved exercise. All five upstream major shape buttons rendered. Muted Play/Stop reached the real engine's statuses, and all five preset controls were exercised; this was not a listening or peak measurement.

At 1280, 1024 and 390 CSS-pixel viewport widths, document scroll width matched viewport width. At 1280 the scale staff fit its panel without horizontal clipping. Long exercises and the minimum-width notation at narrow sizes scroll within their hosts. Screenshots were inspected for warm-paper contrast, visible accidentals and the neck. The browser console showed no errors, with Tone autoplay warnings before the gesture; the favicon is now supplied. Earlier test scripts needed selector and native-dialog handling corrections; only completed runs count as evidence.

## Still to verify

Real audio listening, digital peaks, interruption/recovery, repeated Stop, the full keyboard and browser/OS matrix, actual browser zoom, and musician review of positions, notation and exercises remain open. Local review flags do not establish teacher approval. Independent origin of the educational template data has not been reviewed; the packaged fretboard.js ISC notice is available and retained. No original-project license has been selected merely by making the source public.

Public repository visibility and Pages activation require the final sensitive-content/history review. The deployment workflow is prepared, but local checks alone do not establish that GitHub Actions or the public site works. Confirm the hosted artifact, asset base, HTTPS and gesture-based playback after deployment.
