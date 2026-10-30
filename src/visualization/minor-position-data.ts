import type { ScaleFamily } from '../contracts';
import type { MajorPosition } from './index';

/** C-root chart coordinates, strings 1 (high E) through 6 (low E). Not ordered exercises. */
export const MINOR_POSITION_SOURCE = {
  author: 'Jens Larsen',
  melodic: 'https://jenslarsen.nl/WP/wp-content/uploads/2019/09/CAGED-Melodic-Minor.jpg',
  harmonic: 'https://jenslarsen.nl/WP/wp-content/uploads/2019/09/CAGED-Harmonic-minor.jpg',
} as const;

export const C_MINOR_POSITION_FRETS: Record<Exclude<ScaleFamily, 'major'>, Record<MajorPosition, readonly (readonly number[])[]>> = {
  'jazz-melodic-minor': {
    A: [[3,5],[3,4,6],[2,4,5],[3,5],[2,3,5,6],[3,5]],
    G: [[5,7,8],[6,8],[4,5,7,8],[5,7],[5,6,8],[5,7,8]],
    E: [[7,8,10],[8,10],[7,8,10],[7,9,10],[6,8,10],[7,8,10]],
    D: [[10,11,13],[10,12,13],[10,12],[9,10,12,13],[10,12],[10,11,13]],
    C: [[11,13,15],[12,13,15],[12,14],[12,13,15],[12,14,15],[11,13,15]],
  },
  'harmonic-minor': {
    A: [[3,4],[3,4,6],[4,5],[3,5,6],[2,3,5,6],[3,4]],
    G: [[7,8],[6,8,9],[4,5,7,8],[5,6],[5,6,8],[7,8]],
    E: [[7,8,10],[8,9],[7,8,10],[9,10],[8,10,11],[8,10,11]],
    D: [[10,11,13],[12,13],[10,12,13],[9,10,12,13],[10,11],[10,11,13]],
    C: [[13,15,16],[12,13,15,16],[12,13],[12,13,15],[14,15],[13,15,16]],
  },
};
