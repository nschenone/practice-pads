import { expect, test } from 'vitest';
import type { Chord, Fingering, GuidedPractice, PitchCompatibleCandidate, PlaybackStatus, PlaybackVoicing, SelfGuidedPractice, SpelledPitchClass } from './contracts';

const note = (letter: SpelledPitchClass['letter'], accidental: SpelledPitchClass['accidental'], pitchClass: SpelledPitchClass['pitchClass']): SpelledPitchClass => ({ letter, accidental, pitchClass });
const d = note('D', 0, 2), f = note('F', 0, 5), a = note('A', 0, 9), cs = note('C', 1, 1), e = note('E', 0, 4);
const chord: Chord = { root: f, quality: 'maj7#5', symbol: 'Fmaj7#5', tones: [f, a, cs, e] };
const guided: GuidedPractice = { kind: 'guided', parentTonic: d, family: 'jazz-melodic-minor', mode: { family: 'jazz-melodic-minor', degree: 3, name: 'Lydian augmented', tonic: f, notes: [f, note('G', 0, 7), a, note('B', 0, 11), cs, d, e] }, chord, positionId: 'position-1' };
const self: SelfGuidedPractice = { kind: 'self-guided', root: f, quality: 'maj7#5' };
const candidate: PitchCompatibleCandidate = { parentTonic: d, mode: guided.mode, chord };
const pitch = { ...f, octave: 3, midi: 53 };
const voicing: PlaybackVoicing = { pitches: [pitch] };
const fingering: Fingering = { id: 'position-1', source: 'fixture', review: 'unreviewed', events: [{ string: 4, fret: 3, pitch }] };
const statuses: PlaybackStatus[] = [{ state: 'starting' }, { state: 'error', message: 'Startup rejected' }, { state: 'stopped' }];

test('shared contracts represent the handoff examples', () => {
  expect(candidate.mode.notes.map(n => n.letter)).toEqual(['F', 'G', 'A', 'B', 'C', 'D', 'E']);
  expect([guided.parentTonic, guided.positionId, self.quality]).toEqual([d, fingering.id, chord.quality]);
  expect(voicing.pitches[0].midi).toBe(fingering.events[0].pitch.midi);
  expect(statuses.map(s => s.state)).toEqual(['starting', 'error', 'stopped']);
});
