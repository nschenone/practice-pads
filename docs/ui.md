# Workspace UI

Import `PracticeWorkspace`, `Player`, `Relationship`, and `ParentKeyPicker` from `src/ui`; import `src/ui/ui.css` if your bundler does not follow the module CSS import. `WorkspaceProps` is the controlled API. All choices, labels, relationship roles, candidates, and rendered notation are supplied by the caller. The UI does not compute theory, render music, or control audio.

```tsx
<PracticeWorkspace {...workspaceData}
  onMode={degree => setPractice(current => deriveNextMode(current, degree, current.positionId))}
  onPlay={() => { void audio.play(); }} onStop={() => audio.stop()}
  notation={<ModeNotation />} fretboard={<Fretboard />} exercise={<Exercise />} />
```

The example assumes integration-defined data and renderers. `onMode` carries only the degree: keep the physical position when deriving the next mode. Call audio activation directly from `onPlay`; selection callbacks must not start stopped audio. Display engine `PlaybackStatus` unchanged. Supply five engine preset choices and normalized volume. Slots must include their own fingering source and review labels where appropriate.

`keyPairs` is ordered clockwise, paired by major and relative natural-minor signatures. Values are caller-defined parent-tonic identifiers; they must remain distinct from the modal tonic. Selecting an outer key sends `major`; selecting an inner key preserves the current minor family, or sends jazz melodic minor when switching from major. A caller that remembers a different minor family can override that payload in `onParent`. Family selection is separate. The circle uses native buttons, Escape returns focus, and outside pointer closes it; arrow keys are not intercepted. Provide unique candidate IDs and all seven mode choices. The self-guided list represents pitch containment, not a harmonic recommendation.
