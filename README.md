# Practice Pads

A browser-based workspace for practicing modes with sustained chord pads. Guided practice keeps the parent scale and position while changing modes. Self-guided practice lists pitch-compatible modes for an input chord; containment is not a harmonic recommendation.

## Local development

Use Node 24 and npm 11. Run `npm ci`, then `npm run dev` and open the printed `/practice-pads/` URL. `npm run check` runs typecheck, tests and the production build. To inspect the actual build, run `npm run build && npx vite preview --host 127.0.0.1` and open `http://127.0.0.1:4173/practice-pads/`.

Major guitar templates come from fretboard.js and are not teacher-reviewed. Minor fingerings and ordered exercises are pending. Start with low device volume; audio quality, peak levels and interruption recovery still need listening and measurement. See [integration notes](docs/integration.md) and [visualization sources](docs/visualization.md). The unresolved fretboard.js notice is a before-redistribution gate. Publication and hosting require separate approval.

- [Prototype plan](docs/prototype-plan.md)
- [Shared contracts](docs/contracts.md)
- [Technical and musical research](docs/research.md)
