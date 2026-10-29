# Practice Pads prototype plan

Status: scope and ticket breakdown approved for tracker setup. Implementation dispatch is not yet authorized.

Execution tracker: [Build the first Practice Pads rehearsal prototype](https://github.com/nschenone/practice-pads/issues/1). Its native child issues and blocker relationships are the dependency authority.

## Goal

Build a laptop-first practice workspace that implements the original guided and self-guided workflows. Get it into a musician's hands quickly, then revise from actual practice feedback. Use D jazz melodic minor as a regression example, not a hardcoded product boundary.

The repository starts private. Treat its contents as public-safe from day one. Making it public and enabling Pages are separate owner-approved steps; do not change visibility automatically.

## Prototype experience

One workspace, no onboarding wizard or page navigation needed. Use restrained styling and native controls where possible. Prioritize readable notation, obvious playback status, and comfortable laptop use over a designed marketing site.

```text
Practice Pads                 [Guided | Self-guided]

Parent tonic [D]     Parent scale [Jazz melodic minor]

[Dm(maj7)] [Em7] [Fmaj7#5] [G7] [A7] [Bm7b5] [C#m7b5]
 mode name under each chord; selected choice stays visible

Fmaj7#5   ·   F Lydian augmented
[Play / Stop]      Sound [Warm pad]      Volume [------]

Mode scale: treble-clef notation, then readable note names

Guitar position [reviewed position]
Fretboard with modal tonic distinguished by shape and color
[Diagram | Exercise notation and tab]
```

Changing derivative mode updates the chord, modal name, staff scale and modal-tonic emphasis. It retains the parent scale and selected physical guitar position. Changes while stopped never start playback.

Self-guided practice replaces the parent/mode controls with explicit root and chord-quality selection and a displayed chord symbol. It keeps the player and lists compatible modes with parent scales. No fretboard in this workflow, matching the brief. A structured selector is the agreed first interpretation of chord input; arbitrary text parsing is not required. Suggestions are candidates based on documented matching rules, not claims of universal harmonic suitability.

Target catalog: major, jazz melodic minor and harmonic minor; all twelve sounding tonics with a deliberate spelling policy; approximately five synthesis presets. Keep correct spellings separate from audio pitch identity. A generic pitch map may be useful during development, but must not be labeled a validated CAGED fingering.

Reviewed CAGED positions and their exercise notation/tab remain part of the intended core brief. If review is not available, label that portion incomplete rather than inventing canonical shapes. Lessons, quizzes, MIDI, bebop scales and parallel browsing are later capabilities.

## Proposed work pieces

Keep six implementation tickets under one parent issue. These are build tickets, not Wayfinder decision tickets. Each gets owned paths, explicit inputs/outputs and runnable checks before orchestration. Do not create separate plans for every component.

| Piece | Owns | Completion evidence | Prerequisites |
|---|---|---|---|
| Establish app scaffold and shared contracts | Vite/React/TS setup, scripts, minimal checks, narrow shared types | Development/build commands work; contracts cover practice configuration, pitches and fingering events | None |
| Implement theory and practice configurations | Parent-scale/mode derivation, spelling, literal seventh chords, chord matching rules | All 21 interval/chord combinations checked; D→F example; enharmonic and parallel-compatible model boundaries | Scaffold/contracts |
| Implement sustained pad engine | Gesture activation, chord voicing/playback, presets, gain, cleanup and status | Play/Stop, held notes, shared-note changes, interrupted startup and bounded voice lifecycle checks; low-volume listening | Scaffold/contracts |
| Build the prototype workspace | Laptop layout, accessible selectors/player, controlled presentation components | Guided/self-guided UI works with fixtures; keyboard and zoom checks; no duplicated theory/audio logic | Scaffold/contracts |
| Render staff, fretboard and guitar exercises | VexFlow rendering, SVG fretboard, fingering data and review status | Correct spelling/accidentals; position invariance; tab/staff pitch agreement; explicit limits on unreviewed fingerings | Theory; approved fingering policy/data |
| Integrate and validate the rehearsal prototype | Wire modules into workspace; browser checks; public-safe deployment preparation | Guided and self-guided flows work end to end; production subpath build; documented manual results and remaining review needs | All implementation pieces |

After the first ticket fixes the contracts, theory, audio and prototype UI can run independently in isolated worktrees (at most three lanes). Visualization follows theory. UI owns presentation files; integration owns the final composition rather than multiple workers editing the same app entry point. New dependencies/configuration changes must have a single owner.

Theory-first does not mean building a universal music framework. Use explicit family definitions and small pure functions. Audio receives pitches rather than interpreting chord strings. Rendering receives spelled notes or ordered fingering events rather than calculating harmonic meaning.

## Checks and limits

Use one small test runner for deterministic musical logic and lifecycle checks. Browser audio still needs actual listening; mocks cannot certify timbre, smoothness or output levels. Prefer one end-to-end browser smoke path over a large automation suite initially.

The acceptance scenario selects D jazz melodic minor, starts Dm(maj7), switches to Fmaj7#5, and verifies F G A B C# D E in the standalone scale view while the physical guitar position stays fixed. Stop must reliably silence the pad. Repeat with another key/family and self-guided chord selection. Test the friend's laptop first, then available Chrome/Firefox/Safari desktop coverage; record skipped systems honestly.

No backend, accounts, database, paid services, router, analytics or sampled instrument library. Use synthesized presets. Prepare the Pages base path, but do not enable public hosting or switch repository visibility without approval.

## Admission decisions

The owner approved the one-workspace prototype, structured chord selectors, and explicit labeling of guitar positions awaiting the friend's review. Unreviewed positions must not be presented as validated CAGED fingerings.

Proposed implementation rule: self-guided suggestions initially require all selected chord pitch classes to be contained in a candidate mode. Label this as pitch compatibility, not a universal harmonic recommendation. Keep literal seventh chords separate from any curated alternate applications. If a chord has no matches among the three supported families, report that honestly rather than silently substituting another chord.

The scaffold ticket must fix narrow cross-module types before parallel work; avoid abstract engine/plugin frameworks. The visualization ticket must document the source and review state of each fingering. Human approval of CAGED correctness remains a separate acceptance gate; it does not block rendering an explicitly unreviewed pitch map.

Use the orchestrate-tickets skill only after this scope and the GitHub parent/child DAG are approved. Use Terra with medium thinking for implementation delegation unless directed otherwise. The coordinator retains repository visibility and publication authority.

Research and source references: [technical and musical research](research.md).
