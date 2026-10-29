import { Key } from '@tonaljs/tonal';
import type { ScaleFamily } from '../contracts';

const majors = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'Db', 'Ab', 'Eb', 'Bb', 'F'];
export const keyPairs = majors.map(major => ({ major: { value: major, label: major }, minor: { value: Key.majorKey(major).minorRelative, label: Key.majorKey(major).minorRelative } }));
export function relativeParent(parent: string, from: ScaleFamily, to: ScaleFamily): string {
  if ((from === 'major') === (to === 'major')) return parent;
  const pair = keyPairs.find(p => from === 'major' ? p.major.value === parent : p.minor.value === parent);
  return pair ? (to === 'major' ? pair.major.value : pair.minor.value) : parent;
}
