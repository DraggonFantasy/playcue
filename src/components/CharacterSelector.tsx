import type { CharacterColorMap } from '../types';

interface Props {
  characters: string[];
  colorMap: CharacterColorMap;
  selected: Set<string>;
  onToggle: (character: string) => void;
}

export function CharacterSelector({ characters, colorMap, selected, onToggle }: Props) {
  return (
    <div className="character-selector">
      <h3>Ваші персонажі:</h3>
      <div className="character-selector__list">
        {characters.map((char) => (
          <label
            key={char}
            className="character-selector__item"
            style={{ borderColor: colorMap[char] }}
          >
            <input
              type="checkbox"
              checked={selected.has(char)}
              onChange={() => onToggle(char)}
            />
            <span style={{ color: colorMap[char] }}>{char}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
