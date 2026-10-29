# Throwaway workspace comparison

The user chose **A — Practice desk** as the workspace direction. The current question is: **Can a serious musician quickly read the relationship between the selected mode and chord, including tonic, chord tones and characteristic tones, in this compact workspace?** The current refinement asks whether the relationship view feels engaging and reads clearly at laptop size, without sacrificing useful musical context. This revision has not yet been reviewed or approved. Guided supports newer players; self-guided keeps context optional for practiced players. B and C remain available for comparison. This prototype must never merge to main and is not production code.

From the repository root:

```sh
python3 -m http.server 4174 --bind 127.0.0.1
```

Open http://127.0.0.1:4174/prototype/workspace/?variant=A (also `B` and `C`). The localhost-only floating switcher and left/right arrows cycle variants; state is in memory. The query parameter is shareable and browser back/forward works. The state disclosure records the current fixture settings.

The only parent fixture is D jazz melodic minor; there is no tonic/family picker or actual chord/root engine. III / F Lydian augmented is initially selected. Chord markers represent the fixture's stacked modal degrees 1, 3, 5 and 7; they are not a claim that note containment establishes harmonic suitability. C#m7b5 is the literal fixture chord, not an altered dominant. Only the explicitly requested F #4 and #5 characteristic tones are annotated. Playback is simulated and has **no audio**. The score is an illustrative ordered sequence, not music engraving. The standard-tuning pitch map is unreviewed and is not validated CAGED. Position stays fixed when changing mode.

Capture the eventual relationship-readability verdict, rationale, and any requested changes on the implementation issue after user review. Do not promote this prototype directly to production.
