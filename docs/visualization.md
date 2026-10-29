# Visualization API

Named exports from `src/visualization`: `ModeStaff({practice})`, `GuitarFretboard({practice, position, fingering?})`, `GuitarExercise({practice, fingering?})`. React components are controlled by their props; no application routing or state is owned here. `position` is an upstream major template identity `C | A | G | E | D`; the caller must retain it and the parent identity when changing mode. Major diagrams use fretboard.js public `FretboardSystem.getScale`, rooted **only on the parent major tonic**, then its `inBox` points. They are source-provided, not teacher-reviewed, do not provide fingers or an ordered exercise, and are not minor templates. Minor diagrams and exercises require caller-supplied `Fingering` events; absent data shows pending. Source and review status are visible; even rejected or unreviewed inputs are explicitly labeled, not approved. Caller must choose whether to supply them. Fixture events are synthetic rendering checks, not a teaching dataset.

Strings use guitar convention 1 high E, 6 low E; fret 0 is open, and frets 0–24 are validated against standard tuning using Tonal. Pitch in each event is sounding pitch. Exercise treble notation writes each supplied event exactly one octave above sounding; tab and staff use the same event order, without sorting. Scale staff is concert-pitch, ascending from the modal tonic in octave 4. The parent's major or minor signature is used; unsupported signatures fall back to no signature with explicit accidentals and a visible label. VexFlow manages accidentals. Notation displays one unmetered continuous sequence; barline/reset behavior is not demonstrated. Staff/tab and diagrams include text equivalents. The fretboard uses `*` for modal tonic and the text equivalent enumerates all tonic, chord and characteristic roles (including overlapping roles); the library diagram does not separately style every role. No color-only role is claimed. The board is responsive SVG; staff/tab scroll horizontally. Cleanup removes library nodes and event handlers.

Pure exports: `majorPosition`, `validateFingeringEvent`, `modeScaleKeys`, `exerciseKeys`, `notationKeySignature`. Invalid string/fret/pitch or an event outside the parent collection throws, rather than silently changing data. The supplied event spelling must match its sounding MIDI. Caller must ensure the practice and fingering selection correspond to the intended parent/position; the shared `Fingering` contract carries no parent identity. Human fingering/notation review remains required.

For dev-only inspection run `npm run dev` and open `/practice-pads/src/visualization/fixture/`. It is not a production route. The fixture shows D melodic minor and its F Lydian augmented derivative, an explicitly unreviewed synthetic event sequence, and a source-provided D-major C template.

## Sources and notices

- @moonwave99/fretboard.js 0.2.13, https://github.com/moonwave99/fretboard.js, author Diego Caponera. The npm package manifest declares ISC; its tarball supplies no standalone license text or copyright notice. No shape arrays are copied locally. The exact upstream notice and independent educational-data provenance remain unresolved and must be confirmed before redistribution. The source has five major-derived shapes; no reviewed jazz/harmonic minor shapes, finger numbers, or ordered exercises were found.
- VexFlow 5.0.0, https://github.com/vexflow/vexflow, MIT; notice reproduced below from the installed package. Tonal is the existing theory dependency.

VexFlow - A JavaScript library for rendering music notation.

Copyright (c) 2023-present VexFlow contributors (see AUTHORS.md).
Copyright (c) 2010-2022 Mohit Muthanna Cheppudira

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.