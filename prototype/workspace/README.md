# Throwaway workspace comparison

Question: which laptop workspace hierarchy makes modal guitar practice easiest? Three alternatives are on one standalone route; no verdict yet. This prototype must never merge to main and is not production code.

From the repository root:

```sh
python3 -m http.server 4174 --bind 127.0.0.1
```

Open http://127.0.0.1:4174/prototype/workspace/?variant=A (also `B` and `C`). The localhost-only floating switcher and left/right arrows cycle variants; state is in memory. The query parameter is shareable and browser back/forward works. The state disclosure records the current fixture settings.

Playback is simulated and has **no audio**. Score notation is illustrative, not music engraving. The standard-tuning pitch map is unreviewed and is not validated CAGED. Position stays fixed when changing mode. No user verdict has been collected; capture the eventual choice, rationale, and any mixed elements on the implementation issue after the user reviews it. Do not promote this prototype directly to production.
