import type { ParsedScript, Replica } from '../types';

const CHARACTER_LINE_RE =
  /^([A-ZА-ЯЁІЇЄҐ][A-ZА-ЯЁІЇЄҐ''-]*(?:\s+[A-ZА-ЯЁІЇЄҐ][A-ZА-ЯЁІЇЄҐ''-]*)*)\s*(\/[^/]*\/\s*)?\.[ \t]?(.*)/;

const STANDALONE_REMARK_RE = /^\s*\//;

export function parseScript(text: string): ParsedScript {
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
        if (currentCharacter && !charactersSet.includes(currentCharacter)) {
          charactersSet.push(currentCharacter);
        }
      }
    }
    currentCharacter = null;
    currentTextLines = [];
  };

  for (const line of lines) {
    const match = line.match(CHARACTER_LINE_RE);
    if (match) {
      flush();
      currentCharacter = match[1].trim();
      const remark = match[2]?.trim() || '';
      const restOfLine = match[3] || '';
      const textStart = remark ? remark + ' ' + restOfLine : restOfLine;
      currentTextLines = [textStart];
    } else if (STANDALONE_REMARK_RE.test(line) && line.trim().length > 1) {
      flush();
      replicas.push({
        id: replicas.length,
        character: '',
        text: line.trim(),
      });
    } else if (currentCharacter !== null) {
      currentTextLines.push(line);
    }
  }
  flush();

  return { replicas, characters: charactersSet };
}
