import { useEffect, useRef } from 'react';
import type { Replica, StreamPhase, CharacterColorMap } from '../types';
import { renderRemarkText } from '../utils/renderRemarks';

interface Props {
  replicas: Replica[];
  currentReplicaIndex: number;
  currentCharIndex: number;
  phase: StreamPhase;
  colorMap: CharacterColorMap;
  userCharacters: Set<string>;
  hintWordsN: number;
}

function getHintText(text: string, n: number): string {
  if (n <= 0) return '';
  const words = text.split(/\s+/);
  return words.slice(0, n).join(' ') + (words.length > n ? '...' : '');
}

export function StreamingTextArea({
  replicas,
  currentReplicaIndex,
  currentCharIndex,
  phase,
  colorMap,
  userCharacters,
  hintWordsN,
}: Props) {
  const currentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    currentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [currentReplicaIndex, phase]);

  const isUserChar = (char: string) => userCharacters.has(char);

  return (
    <div className="streaming-area">
      {replicas.map((replica, idx) => {
        const isCurrent = idx === currentReplicaIndex;
        const isPast = idx < currentReplicaIndex;
        const isFuture = idx > currentReplicaIndex;

        if (isFuture) return null;

        const isStageDirection = replica.character === '';
        const charColor = colorMap[replica.character] || '#888';
        const isUser = !isStageDirection && isUserChar(replica.character);

        let textContent: React.ReactNode = null;

        if (isPast) {
          textContent = (
            <span className="replica__text">
              {renderRemarkText(replica.text)}
            </span>
          );
        } else if (isCurrent) {
          if (phase === 'user_reciting') {
            const hint = getHintText(replica.text, hintWordsN);
            textContent = (
              <span className="replica__text replica__text--hidden">
                {hint && <span className="replica__hint">{renderRemarkText(hint)}</span>}
                <span className="replica__prompt">
                  Проговоріть репліку... [ПРОБІЛ / ТАП для перевірки]
                </span>
              </span>
            );
          } else if (phase === 'user_reveal') {
            textContent = (
              <span className="replica__text replica__text--revealed">
                {renderRemarkText(replica.text)}
                <span className="replica__prompt">
                  {' '}[ПРОБІЛ / ТАП для продовження]
                </span>
              </span>
            );
          } else if (phase === 'waiting_for_space') {
            textContent = (
              <span className="replica__text replica__text--waiting">
                <span className="replica__prompt replica__prompt--pulse">
                  [Ваша репліка! ПРОБІЛ / ТАП]
                </span>
              </span>
            );
          } else {
            // streaming / pause_between / flash phases
            textContent = (
              <span className="replica__text">
                {renderRemarkText(replica.text.slice(0, currentCharIndex))}
                <span className="replica__cursor">|</span>
              </span>
            );
          }
        }

        return (
          <div
            key={replica.id}
            ref={isCurrent ? currentRef : undefined}
            className={`replica ${isPast ? 'replica--past' : ''} ${
              isCurrent ? 'replica--current' : ''
            } ${isUser ? 'replica--user' : ''} ${
              isStageDirection ? 'replica--stage-direction' : ''
            }`}
          >
            {!isStageDirection && (
              <>
                <span className="replica__character" style={{ color: charColor }}>
                  {replica.character}.
                </span>{' '}
              </>
            )}
            {textContent}
          </div>
        );
      })}

      {phase === 'finished' && (
        <div className="streaming-area__finished">
          Текст закінчився!
        </div>
      )}
    </div>
  );
}
