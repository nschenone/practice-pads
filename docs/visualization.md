# Visualization API

Named exports from `src/visualization`: `ModeStaff({practice})`, `GuitarFretboard({practice, position, fingering?})`, `GuitarExercise({practice, fingering?})`. React components are controlled by their props; no application routing or state is owned here. `position` is a CAGED shape identity `C | A | G | E | D`; the caller must retain it and the parent identity when changing mode. Major diagrams use fretboard.js public `FretboardSystem.getScale`, rooted **only on the parent major tonic**, then its `inBox` points. They are source-provided, not teacher-reviewed, do not provide fingers or an ordered exercise, and are not minor templates. Usable caller-supplied `Fingering` events override the diagram for any family and provide the exact ordered exercise. Without usable events, minor diagrams use `minorPosition`: five reference-derived physical position maps for each minor family. Source coordinates, inferred shape labels and transposition are documented in [minor references](minor-caged-sources.md); transcription and playability still need independent musician review. Reference dots are not an ordered exercise. Rejected mappings are not rendered as exercises and fall back to the reference position. Source and review status are available under Diagram info; local review is not teacher approval. Fixture events are synthetic rendering checks, not a teaching dataset.

Strings use guitar convention 1 high E, 6 low E; fret 0 is open, and frets 0–24 are validated against standard tuning using Tonal. Pitch in each event is sounding pitch. Exercise treble notation writes each supplied event exactly one octave above sounding; tab and staff use the same event order, without sorting. Scale staff is concert-pitch, ascending from the modal tonic in octave 4. The parent's major or minor signature is used; unsupported signatures fall back to no signature with explicit accidentals and a visible label. VexFlow manages accidentals. Notation displays one unmetered continuous sequence; barline/reset behavior is not demonstrated. Staff/tab and diagrams include text equivalents. The fretboard uses `*` for modal tonic and the text equivalent enumerates all tonic, chord and characteristic roles (including overlapping roles); the library diagram does not separately style every role. No color-only role is claimed. The board is responsive SVG. Staff/tab render to the available host width with a minimum readable width; long sequences scroll horizontally. A resize observer redraws notation without duplicating nodes. Note-position, role and notation text equivalents are visually hidden for assistive technology, not repeated as visible blocks. The library crops the neck to the actual position while retaining fret numbers. Cleanup removes library nodes, observers and event handlers.

Pure exports: `majorPosition`, `minorPosition`, `minorScaleMap` (legacy full-neck map helper), `MINOR_POSITION_SOURCE`, `validateFingeringEvent`, `modeScaleKeys`, `exerciseKeys`, `notationKeySignature`. Invalid string/fret/pitch or an event outside the parent collection throws, rather than silently changing data. The supplied event spelling must match its sounding MIDI. Caller must ensure the practice and fingering selection correspond to the intended parent/position; the shared `Fingering` contract carries no parent identity. Human fingering/notation review remains required.

For dev-only inspection run `npm run dev` and open `/practice-pads/src/visualization/fixture/`. It is not a production route. The fixture shows D melodic minor and its F Lydian augmented derivative, an explicitly unreviewed synthetic event sequence, and a source-provided D-major C template.

## Sources and notices

- @moonwave99/fretboard.js 0.2.13, https://github.com/moonwave99/fretboard.js, author Diego Caponera. The npm package manifest declares ISC. Correction: the installed package README contains the full ISC notice and copyright; the earlier assertion that its tarball lacked a copyright notice was wrong. The notice is reproduced below. No upstream major shape arrays are copied locally. Independent educational-data provenance remains unreviewed. The source has five major-derived shapes; no reviewed jazz/harmonic minor shapes, finger numbers, or ordered exercises were found.
- VexFlow 5.0.0, https://github.com/vexflow/vexflow, MIT; notice reproduced below from the installed package. Tonal is the existing theory dependency.

### fretboard.js ISC notice

Copyright (c) 2020, Diego Caponera <hello@diegocaponera.com>

Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.

### VexFlow MIT notice

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