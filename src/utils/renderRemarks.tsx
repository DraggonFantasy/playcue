import type { ReactNode } from 'react';

/**
 * Splits text by /remark/ patterns and wraps them in gray spans.
 * Handles partial (unclosed) remarks during streaming.
 */
export function renderRemarkText(text: string): ReactNode[] {
  const result: ReactNode[] = [];
  let pos = 0;
  let keyIdx = 0;

  while (pos < text.length) {
    const slashPos = text.indexOf('/', pos);
    if (slashPos === -1) {
      result.push(<span key={keyIdx++}>{text.slice(pos)}</span>);
      break;
    }

    if (slashPos > pos) {
      result.push(<span key={keyIdx++}>{text.slice(pos, slashPos)}</span>);
    }

    const closeSlash = text.indexOf('/', slashPos + 1);
    if (closeSlash === -1) {
      // Unclosed remark (partial during streaming)
      result.push(
        <span key={keyIdx++} className="remark">{text.slice(slashPos)}</span>
      );
      pos = text.length;
      break;
    }

    result.push(
      <span key={keyIdx++} className="remark">
        {text.slice(slashPos, closeSlash + 1)}
      </span>
    );
    pos = closeSlash + 1;
  }

  return result;
}
