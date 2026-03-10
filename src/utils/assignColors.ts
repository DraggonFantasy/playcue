import type { CharacterColorMap } from '../types';
import { COLOR_PALETTE } from '../constants';

export function assignColors(characters: string[]): CharacterColorMap {
  const map: CharacterColorMap = {};
  characters.forEach((char, i) => {
    map[char] = COLOR_PALETTE[i % COLOR_PALETTE.length];
  });
  return map;
}
