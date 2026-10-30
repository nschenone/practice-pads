import { describe, expect, it } from 'vitest';
import { keyPairs, relativeParent } from './keyPolicy';

describe('relative parent policy', () => {
  it('uses Tonal relative keys in circle order and retains the sector on family changes', () => {
    expect(keyPairs.map(p => p.major.value)).toEqual(['C','G','D','A','E','B','F#','Db','Ab','Eb','Bb','F']);
    expect(keyPairs.find(p => p.major.value === 'Db')?.minor.value).toBe('Bb');
    expect(relativeParent('C', 'major', 'natural-minor')).toBe('A');
    expect(relativeParent('A', 'natural-minor', 'major')).toBe('C');
    expect(relativeParent('A', 'natural-minor', 'harmonic-minor')).toBe('A');
    expect(relativeParent('C', 'major', 'harmonic-minor')).toBe('A');
    expect(relativeParent('A', 'harmonic-minor', 'major')).toBe('C');
    expect(relativeParent('A', 'harmonic-minor', 'jazz-melodic-minor')).toBe('A');
  });
});
