# Practice Pads prototype plan

This is a historical design plan. Implementation and public release are planned, subject to final integration and release checks. See the [practice guide](practice.md) for current limitations and intended changes.

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

## Checks and limits

Use one small test runner for deterministic musical logic and lifecycle checks. Browser audio still needs actual listening; mocks cannot certify timbre, smoothness or output levels. Prefer one end-to-end browser smoke path over a large automation suite initially.

The acceptance scenario selects D jazz melodic minor, starts Dm(maj7), switches to Fmaj7#5, and verifies F G A B C# D E in the standalone scale view while the physical guitar position stays fixed. Stop must reliably silence the pad. Repeat with another key/family and self-guided chord selection. Test the target laptop first, then available Chrome/Firefox/Safari desktop coverage; record skipped systems honestly.

No backend, accounts, database, paid services, router, analytics or sampled instrument library. Use synthesized presets. The Pages base path is prepared; release remains subject to final checks.

## Admission decisions

The owner approved the one-workspace prototype, structured chord selectors, and explicit labeling of guitar positions awaiting musician review. Unreviewed positions must not be presented as validated CAGED fingerings.

Proposed implementation rule: self-guided suggestions initially require all selected chord pitch classes to be contained in a candidate mode. Label this as pitch compatibility, not a universal harmonic recommendation. Keep literal seventh chords separate from any curated alternate applications. If a chord has no matches among the three supported families, report that honestly rather than silently substituting another chord.

The scaffold ticket must fix narrow cross-module types before parallel work; avoid abstract engine/plugin frameworks. The visualization ticket must document the source and review state of each fingering. Human approval of CAGED correctness remains a separate acceptance gate; it does not block rendering an explicitly unreviewed pitch map.

Research and source references: [technical and musical research](research.md).
