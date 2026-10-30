# Practicing with Practice Pads

To practice, select a parent tonic and family, then choose one of its seven modes. The selected mode has its own tonic and literal seventh chord, but its notes come from the parent. Switching modes retains the selected physical position. Choose Play to start the pad; Stop releases it. Adjust the volume before listening, and try the five synthesized sounds at a low level.

For D jazz melodic minor, select degree III to hear Fmaj7#5 and see F Lydian augmented: F G A B C# D E. B is the #4 and C# is the #5 relative to F. C# also belongs to the chord F A C# E. The parent remains D jazz melodic minor, not F major.

## Guitar positions

The major diagram uses fretboard.js's five major-derived templates. They have not been teacher-reviewed. A position describes physical locations; fingering specifies fingers, an ordered exercise specifies a sequence, and phrasing concerns how notes are played in time. One does not automatically supply the others.

Natural minor (Aeolian) is available directly in the Family selector, with its own minor parent and five minor-form positions. It shares notes with degree VI of its relative major, but is not represented by switching to that major parent. A natural minor is A B C D E F G; its V chord is Em7, not the E7 of A harmonic minor.

Use the C, A, G, E and D buttons to select a position directly. Form names are not fret-order numbers. All three minor families use five transcribed reference position maps from [published CAGED charts](minor-caged-sources.md), not a full-neck scale-note fallback. The shape labels are inferred from root anchors; transcription, naming and playability need independent musician review. **Position** crops the diagram to the selected shape and retains actual fret numbers. **Full neck** shows the parent scale from the nut through the highest fret used by the selected position or custom mapping. Selected notes stay opaque; other notes and their labels fade to 30% opacity, retaining tonic color. These controls do not change the parent, mode or shape. The browser remembers the view separately from your mappings; switching to Exercise preserves it too. Reference dots do not define an exercise sequence or finger numbers.

## Correcting a local position

Below the study panels, open **Edit position**. Tap scale notes on the fretboard in the order you want to practice; scroll the neck to reach higher frets. The **Keyboard note** selector and **Add note** provide a keyboard alternative. String 1 is high E, string 6 is low E, and fret 0 is open. Tonal validates each coordinate against the parent collection. Undo the last note, remove a note, or move notes to correct the sequence. The same events drive the diagram and exercise staff/tab; repeated notes are allowed. No finger numbers, rhythms or phrasing are inferred.

Each mapping belongs to a parent tonic, scale family and position. Switching derivative mode keeps it; switching parent, family or position selects a different mapping. Drafts remain available while switching positions in this session. Choose **Save this position** to keep a draft after a reload. Editing clears its review flag. **Mark locally reviewed** means you checked it, not that a teacher approved it.

**Discard draft / reload saved** restores the saved version. **Reset this position** asks for confirmation before removing that context's saved mapping and draft; it does not remove other positions. In **Import / export saved mappings**, export the JSON and copy it somewhere safe. Imports validate all entries before writing and replace only matching saved contexts. Save or discard matching unsaved drafts before importing. Invalid data or storage failures are shown without intentionally overwriting saved mappings.

Mappings stay in this browser's local storage; they are not uploaded, synced or backed up. A different browser, device or site origin has separate data. Clearing site data removes them. Export a backup before moving from a local preview to the public site.

Musician review of positions, notation and exercises remains necessary. See the [visualization reference](visualization.md) and [CAGED research](caged-research.md).
