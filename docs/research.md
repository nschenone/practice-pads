# Practice Pads: technical and musical research

Research session: 2026-10-29 (session metadata). Laptop-first; no implementation, installation, browser testing or deployment has been performed. This brief consolidates four parallel research tracks. Recommendations below are not implemented decisions.

## Findings that matter

1. **The requested app can be entirely static.** GitHub Pages can serve the application while the browser synthesizes sound and renders the music. A public repository on GitHub Free is the straightforward hosting route; a backend is not required for the described functionality. [GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)
2. **The hard parts are musical correctness and practice quality, not hosting.** Note spelling, the distinction between diatonic chords and jazz applications, and reviewed guitar fingerings need explicit treatment.
3. **Sustained synthesis does not require an audio loop.** Tone.js supports attacking notes and releasing them later. A pad can hold at a nonzero envelope sustain until Stop; actual sound quality, level and browser behavior still need testing. [Tone.js](https://github.com/Tonejs/Tone.js/)
4. **A fretboard pitch map is not a validated CAGED fingering.** Drawing all scale notes in a fret window does not define a playable exercise, string choices or fingers. Keep reviewed fingering data separate from rendering.
5. **Start with one sound and the D melodic minor example.** Confirm that the pad is pleasant to practice with and the mode change teaches the intended relationship before expanding the catalog.

## 1. Hosting and application structure

GitHub Pages publishes static HTML, CSS and JavaScript. For a repository called `practice-pads`, the default project URL is `https://<owner>.github.io/practice-pads/`. GitHub Free supports Pages from public repositories; private-source publishing requires an eligible paid plan. A private source repository does not by itself make the published site private. Confirm account eligibility before choosing private source. [Overview](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages), [publishing source](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)

The default URL avoids a domain purchase. A custom domain is optional. Pages supports HTTPS. Service limits include a 1 GB published site and a 100 GB/month soft bandwidth limit, comfortably above the expected needs of a small synthesized practice tool, but not unlimited hosting. Pages also has restrictions on commercial business/SaaS use; reassess if the project becomes a paid product. [HTTPS](https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https), [limits and terms](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits)

**Recommendation:** React + Vite + TypeScript, one entry page, ordinary component state. This is a maintainability choice, not a Pages requirement. Native DOM/SVG would also work. Do not add a server framework, router, account system or database for this scope.

Vite documents the Pages deployment process: set `base: '/practice-pads/'`, choose GitHub Actions as the Pages source, build the app, upload `dist`, and deploy it. Its example uses workflow permissions rather than an application API secret. Validate the built site under that subpath, not only the development server. [Vite deployment guide](https://vite.dev/guide/static-deploy#github-pages)

Use in-memory state initially. Later, validated query or fragment state can support shareable practice configurations without nested-path routing. Fragments are not sent to the server, though they are still visible in copied links and browser history. If preferences use `localStorage`, handle blocked storage and remember that it is origin-scoped, not an account or backup. Namespace keys because other project sites on the same origin share storage. [URL fragments](https://developer.mozilla.org/en-US/docs/Web/URI/Reference/Fragment), [localStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)

Do not ship secrets in browser code. Avoid analytics or remote sound services unless needed; GitHub itself still records visitor IP addresses for security, so “no backend” is not a promise of zero data collection. [Pages overview](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)

## 2. Candidate libraries

| Concern | Candidate | Evidence and limits | Recommendation |
|---|---|---|---|
| UI/build | React, Vite, TypeScript | Vite provides a React/TS template and static builds. [Docs](https://vite.dev/guide/) | Reasonable starting stack; no router needed. |
| Audio | Tone.js | Polyphonic instruments, envelopes, gain/effects; MIT. [Repository](https://github.com/Tonejs/Tone.js/) | Use for the first pad; no Transport or sequencer needed. |
| Theory | Tonal.js | Notes, intervals, scales, chords; MIT. [Repository](https://github.com/tonaljs/tonal) | Add when generalizing keys; retain curated teaching metadata. |
| Staff/tab | VexFlow | SVG/Canvas notation, key signatures, accidentals, tab; MIT. [Repository](https://github.com/vexflow/vexflow) | Use rather than hand-drawing engraved notation. |
| Guitar map | Custom SVG or fretboard.js | Library supports fretboards, scale boxes and shapes; ISC. [Repository](https://github.com/moonwave99/fretboard.js) | Custom SVG is likely enough for the initial fixed display; neither option validates fingerings. |

Licenses are permissive but still require applicable notices. Audit the selected versions, transitive dependencies and any fonts/samples before distribution. Library capability is documented; interoperability, bundle size, performance and release maintenance cadence have not been validated.

**Version caution:** the audio track consulted Tone API docs for 14.9.17. A subsequent check of the upstream `dev` manifest showed version 15.5.64; that is a branch observation, not proof of the latest published stable release. Match documentation to a pinned package during implementation. The fretboard.js `master` manifest showed 0.2.12 and ISC licensing; age alone does not establish abandonment. [Tone manifest](https://github.com/Tonejs/Tone.js/blob/dev/package.json), [fretboard manifest](https://github.com/moonwave99/fretboard.js/blob/master/package.json)

## 3. Audio: hold notes, manage transitions, test recovery

Tone's `PolySynth` provides note attack/release, `releaseAll`, voice allocation and disposal. For a continuous pad, attack the chord with a nonzero sustain envelope and release it on Stop; `triggerAttackRelease` is for a specified duration. Native Web Audio can do this too, but the app would own oscillator lifetimes, voice allocation and envelope scheduling. [Tone README](https://github.com/Tonejs/Tone.js/), [versioned PolySynth API](https://tonejs.github.io/docs/14.9.17/classes/PolySynth.html), [Web Audio specification](https://www.w3.org/TR/webaudio-1.0/)

**Recommended first implementation:** one polyphonic synth, gentle attack/release, one reviewed chord voicing, gain control with a real mute, conservative output trim, and an output guard if needed. No samples or timer-driven loop. A limiter is not a hearing-safety guarantee; device volume and headphones determine acoustic exposure.

For chord changes within a sound, compare actual pitches including octave, not just names or pitch classes. Keep exact shared pitches held, release removed notes and attack new notes. This is a proposed algorithm, not automatic Tone behavior. Canonicalize enharmonic equivalents for audio while preserving spelling for notation. Account for release tails when setting voice capacity and testing mix levels.

Whole-bank crossfades are an alternative, especially for preset changes, but can double shared pitches and increase level. Rapid changes need bounded voice/bank lifetimes and cleanup. Ramp gain rather than stepping it to avoid clicks. [GainNode](https://developer.mozilla.org/en-US/docs/Web/API/GainNode), [AudioParam ramps](https://developer.mozilla.org/en-US/docs/Web/API/AudioParam/linearRampToValueAtTime)

Call and await `Tone.start()` directly from Play's user gesture. Reflect successful startup, suspension and errors in the UI; do not label a failed start as playing. Stop while startup is pending must prevent a later stale attack. Treat browser suspension, sleep and output-device changes as recovery cases, not a promise of uninterrupted background playback. [Tone README](https://github.com/Tonejs/Tone.js/), [autoplay policies](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay), [context state](https://developer.mozilla.org/en-US/docs/Web/API/BaseAudioContext/state)

## 4. Musical model and reference tables

Use separate concepts for **parent tonic**, **parent family**, **mode degree**, **modal tonic**, **spelled mode notes**, **literal seventh chord**, and **harmonic application**. Audio voicing and guitar fingering are additional choices, not properties implied by a chord symbol.

Derivative selection keeps a parent collection and changes modal tonic. Parallel selection keeps modal tonic and changes collection. Merely rotating written notes does not establish an audible modal center; the accompanying harmony and phrasing matter. Berklee teaches deriving major modes from different degrees and describes multiple scale choices over a given chord. [Berklee](https://online.berklee.edu/takenote/jazz-improvisation-10-scales/)

For this app, label melodic minor as **jazz melodic minor**: `1 2 ♭3 4 5 6 7` in both directions. Classical teaching commonly lowers 6 and 7 when descending. Harmonic minor is `1 2 ♭3 4 5 ♭6 7`. [Minor scales](https://musictheory.pugetsound.edu/mt21c/MinorScales.html), [jazz scales](https://musictheory.pugetsound.edu/mt21c/JazzScales.html)

### Derived seven-mode reference

The following formulas and literal chords were calculated by rotating each parent's seven degrees and stacking modal degrees 1, 3, 5 and 7. A Python arithmetic check verified all 21 rows against the parent semitone patterns. This validates interval arithmetic, not teaching suitability or library behavior. Names/aliases vary; prefer the friend's vocabulary. Sources for formulas and names: [Puget Sound](https://musictheory.pugetsound.edu/mt21c/JazzScales.html), [Berklee](https://online.berklee.edu/takenote/jazz-improvisation-10-scales/), [Tonal scale dictionary](https://github.com/tonaljs/tonal/blob/main/packages/scale-type/data.ts).

Chord abbreviations: `ø7` = half-diminished seventh; `°7` = diminished seventh; `m(maj7)` = minor triad with major seventh. Qualities are relative to the modal tonic.

| Parent | Degree / mode | Modal intervals | Literal seventh |
|---|---|---|---|
| Major | 1 Ionian | 1 2 3 4 5 6 7 | maj7 |
| Major | 2 Dorian | 1 2 ♭3 4 5 6 ♭7 | m7 |
| Major | 3 Phrygian | 1 ♭2 ♭3 4 5 ♭6 ♭7 | m7 |
| Major | 4 Lydian | 1 2 3 ♯4 5 6 7 | maj7 |
| Major | 5 Mixolydian | 1 2 3 4 5 6 ♭7 | 7 |
| Major | 6 Aeolian | 1 2 ♭3 4 5 ♭6 ♭7 | m7 |
| Major | 7 Locrian | 1 ♭2 ♭3 4 ♭5 ♭6 ♭7 | ø7 |
| Melodic minor | 1 Jazz melodic minor | 1 2 ♭3 4 5 6 7 | m(maj7) |
| Melodic minor | 2 Dorian ♭2 | 1 ♭2 ♭3 4 5 6 ♭7 | m7 |
| Melodic minor | 3 Lydian augmented | 1 2 3 ♯4 ♯5 6 7 | maj7♯5 |
| Melodic minor | 4 Lydian dominant | 1 2 3 ♯4 5 6 ♭7 | 7 |
| Melodic minor | 5 Mixolydian ♭6 | 1 2 3 4 5 ♭6 ♭7 | 7 |
| Melodic minor | 6 Locrian ♮2 | 1 2 ♭3 4 ♭5 ♭6 ♭7 | ø7 |
| Melodic minor | 7 Superlocrian / altered | 1 ♭2 ♭3 ♭4 ♭5 ♭6 ♭7 | ø7 |
| Harmonic minor | 1 Harmonic minor | 1 2 ♭3 4 5 ♭6 7 | m(maj7) |
| Harmonic minor | 2 Locrian ♮6 | 1 ♭2 ♭3 4 ♭5 6 ♭7 | ø7 |
| Harmonic minor | 3 Ionian augmented | 1 2 3 4 ♯5 6 7 | maj7♯5 |
| Harmonic minor | 4 Dorian ♯4 | 1 2 ♭3 ♯4 5 6 ♭7 | m7 |
| Harmonic minor | 5 Phrygian dominant | 1 ♭2 3 4 5 ♭6 ♭7 | 7 |
| Harmonic minor | 6 Lydian ♯2 | 1 ♯2 3 ♯4 5 6 7 | maj7 |
| Harmonic minor | 7 Ultralocrian | 1 ♭2 ♭3 ♭4 ♭5 ♭6 ♭♭7 | °7 |

### Important exception: altered scale

D melodic minor's seventh mode, preserving its letters, is `C♯ D E F G A B`. Stacking thirds gives `C♯ E G B`, or **C♯ø7**. In an altered-dominant application, F sounds as E♯, the major third of C♯; E can function as D-double-sharp, its ♯9. The same pitch collection can therefore support **C♯7alt**, but that is a different chord interpretation, not an alternative spelling of the same seventh chord. Do not silently replace the literal vii chord with an altered dominant. [Puget Sound formulas](https://musictheory.pugetsound.edu/mt21c/JazzScales.html), [Berklee applications](https://online.berklee.edu/takenote/jazz-improvisation-10-scales/)

Other application labels can expose characteristic extensions: Lydian dominant supplies ♯11, Mixolydian ♭6 supplies ♭13, and Phrygian dominant supplies ♭9/♭13. These are derived interval observations, not context-free prescriptions. Self-guided lookup should eventually present candidates with context rather than one purportedly correct answer.

Tonal can help calculate and transpose, but its named altered-scale dictionary uses dominant-oriented enharmonic spelling. Its Greek `Mode` dictionary should not be assumed to represent every mode of all three families. Preserve parent-letter spelling in the derivative view and test library results against explicit examples. [Tonal data](https://github.com/tonaljs/tonal/blob/main/packages/scale-type/data.ts), [Tonal docs](https://tonaljs.github.io/tonal/docs)

### Reference example to preserve

| Concept | Value |
|---|---|
| Parent | D jazz melodic minor: D E F G A B C♯ |
| First mode / chord | D melodic minor; D F A C♯ = Dm(maj7) |
| Third mode | F G A B C♯ D E = F Lydian augmented |
| Third-mode chord | F A C♯ E = Fmaj7♯5 |
| Characteristic tones | B = ♯4 and C♯ = ♯5 relative to F |
| Guitar invariant | Same chosen parent fingering, different modal-tonic emphasis |

These are calculated consequences of the parent collection; the example is musically consistent.

## 5. Guitar positions, notation and tab

CAGED connects five familiar chord-form families to overlapping scale regions. Five-position teaching is established, but that does not make a particular fret window a universally canonical scale fingering. [Learn Jazz Standards](https://www.learnjazzstandards.com/blog/caged-system-scales-for-guitar/), [Berklee Guitar Scales 101](https://online.berklee.edu/courses/guitar-scales-101)

**Recommendation:** distinguish the set of displayed scale locations from an ordered exercise. Reviewed fingering data should specify string/fret events, parent-root anchors, range, optional fingers and open-string exceptions. Do not copy instructional diagrams without checking reuse permission. Minor-family shapes need review rather than automatically relabeling major-scale boxes.

Open strings cannot simply be shifted while remaining open. Transposition near the nut can require alternative fingerings or otherwise produce impossible negative frets. The original claim that the lowest D melodic-minor position is specifically the canonical “D shape” remains **unverified**. Let the friend approve the actual diagram and terminology.

For derivative mode changes, retain shape identity and physical note locations. Staff notation can rotate to start on the modal tonic while the selected guitar exercise remains fixed; the UI must distinguish these two views. Whether the ordered tab exercise should also rotate is a teaching decision, not a rendering requirement.

VexFlow supplies rendering primitives, including staff notation, key signatures, accidentals, `TabStave` and `TabNote`. It does not choose musical spelling or a correct fingering. The staff/tab of a guitar exercise should come from the same ordered string/fret events. Store pitch octave separately from spelling, and decide whether guitar notation is written an octave above sounding pitch. [VexFlow repository](https://github.com/vexflow/vexflow)

**Proposed notation policy:** use the conventional parent major/minor key signature and explicit modal alterations. Under D minor's one-flat signature, D jazz melodic minor needs B-natural and C-sharp signs where required; accidentals must reset/cancel appropriately. This is a proposed policy, not a claim that VexFlow infers it. Preserve letters rather than selecting enharmonics only from pitch class. Test against VexFlow's selected version. [Accidental source](https://github.com/vexflow/vexflow/blob/main/src/accidental.ts), [key signatures](https://github.com/vexflow/vexflow/blob/main/src/keysignature.ts)

For the first fretboard: six labeled strings, a clear nut or numbered frets, note names, tonic indicated by both shape and color, and a readable text equivalent. Provide five position choices only after those five datasets have been reviewed. A small custom SVG avoids adopting a broader interaction system prematurely; fretboard.js remains an option if its scale-box features reduce actual work. [fretboard.js documentation](https://moonwave99.github.io/fretboard.js/documentation-fretboard.html)

## 6. Recommended first build and acceptance checks

### First vertical slice

One laptop workspace for D jazz melodic minor, seven degree choices, one warm pad with Play/Stop/volume, modal name and notes, a treble staff, and one reviewed guitar position. At minimum demonstrate Dm(maj7) → Fmaj7♯5 without moving the diagram. Add tab once an ordered exercise is agreed. Publish the static slice early; keep self-guided parsing, parallel selection, extra sounds, lessons and MIDI out of the initial build.

### Acceptance plan — not yet executed

- **Theory:** verify all seven D chords and modal rotations; assert D→F selection retains parent notes and selected physical position. The 21-row interval/chord arithmetic has already passed an independent Python check; rerun equivalent checks against implementation data.
- **Notation:** musician checks D-minor signature, B-natural/C-sharp, modal ordering, octave convention, barline resets and eventual tab/staff agreement. Include sharp and flat keys when generalizing.
- **Audio:** no sound on load; gesture starts exactly one chord; several-minute sustain; clean Stop; no stuck/doubled voices after repeated clicks, rapid changes or pending startup. Measure digital peaks during voice overlap, test mute, and listen at low device volume. Digital metering is not hearing-safety certification.
- **Recovery:** background/foreground, sleep/wake and output changes; accurate status and explicit retry if interrupted; no unexpected restart after Stop.
- **Desktop matrix:** current Safari/Chrome on macOS and Chrome/Firefox on Windows, with actual versions recorded. Prioritize the friend's own laptop first. Test keyboard-only use, visible focus, non-color-only highlights, a 13-inch viewport and 200% zoom. [WCAG reference](https://www.w3.org/WAI/WCAG22/quickref/)
- **Deployment:** build/preview and published `/practice-pads/` asset paths; reload/direct entry; no secrets; notices retained. No persistence or routing complexity unless needed.

## 7. Decisions for the friend

1. Is publicly readable source and a public website acceptable? Which laptop OS/browser should be the first test target?
2. What should the pad sound like, in what register, and should it include a low root? A reference recording would be more useful than five preset names.
3. Should guided practice default to literal diatonic seventh chords, with altered-dominant and other applications clearly separated?
4. Can they approve the first open-D fingering, shape label and exercise order, then review the remaining positions?
5. Should mode changes rotate only the standalone scale notation, or also the ordered guitar exercise? Which notation octave convention do they expect?
6. Which names and tonic spellings should be supported first? Uncommon modes, enharmonics and double accidentals need an explicit policy before a broad catalog.

## Evidence limits

Sources establish capabilities and musical formulas, not a tested product. No dependency lockfile/license audit, browser integration, deployed build, sound design, performance measurement or teacher-approved fingering dataset exists yet. Some research-track automated source checks returned “unclear”; they were not treated as verification. Official documentation and original teaching sources were used instead. Latest stable package versions and maintenance guarantees remain unconfirmed. The open-D CAGED label, preset quality and interruption behavior need direct validation.
