# Visualization (partial; not ready for integration)

`majorPosition(parentTonic, position)` wraps the public `FretboardSystem.getScale` API of @moonwave99/fretboard.js 0.2.13 and selects its `inBox` points for a parent major scale. Position names are C, A, G, E and D. String 1 is high E; fret 0 is open. No modal tonic is supplied to this function. These upstream major templates are not teacher-reviewed and contain neither an ordered exercise nor finger numbers. They are not minor-family fingerings.

`validateFingeringEvent` checks standard-tuning sounding MIDI, spelling, string and frets 0–24; it does not approve a fingering. No renderer, staff, tab, pending state, fixture or notation octave convention has been implemented yet. Do not integrate this partial module as the requested visualization.

Provenance: npm package @moonwave99/fretboard.js 0.2.13, author Diego Caponera, https://github.com/moonwave99/fretboard.js. The published package manifest declares ISC but the package contains no license file or complete copyright notice; confirm the upstream notice before redistribution. VexFlow 5.0.0 is installed but not yet used; its packaged LICENSE contains the MIT notice. Upstream templates and their educational provenance still require teacher review.
