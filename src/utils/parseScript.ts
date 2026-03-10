import type { ParsedScript, Replica } from '../types';

const CHARACTER_LINE_RE = /^([A-ZА-ЯЁІЇЄҐ][A-ZА-ЯЁІЇЄҐ\s''-]*)\.\s?(.*)/;

export function parseScript(text: string): ParsedScript {
  // Strip BOM
  const clean = text.replace(/^\uFEFF/, '');
  const lines = clean.split('\n');

  const replicas: Replica[] = [];
  const charactersSet: string[] = [];
  let currentCharacter: string | null = null;
  let currentTextLines: string[] = [];

  const flush = () => {
    if (currentCharacter !== null && currentTextLines.length > 0) {
      const text = currentTextLines.join('\n').trimEnd();
      if (text) {
        replicas.push({
          id: replicas.length,
          character: currentCharacter,
          text,
        });
        if (!charactersSet.includes(currentCharacter)) {
          charactersSet.push(currentCharacter);
        }
      }
    }
    currentTextLines = [];
  };

  for (const line of lines) {
    const match = line.match(CHARACTER_LINE_RE);
    if (match) {
      flush();
      currentCharacter = match[1].trim();
      const restOfLine = match[2] || '';
      currentTextLines = [restOfLine];
    } else if (currentCharacter !== null) {
      currentTextLines.push(line);
    }
  }
  flush();

  return { replicas, characters: charactersSet };
}
