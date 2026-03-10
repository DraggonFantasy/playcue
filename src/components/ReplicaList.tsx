import type { Replica, CharacterColorMap } from '../types';

interface Props {
  replicas: Replica[];
  colorMap: CharacterColorMap;
  currentIndex: number;
  onSeek: (index: number) => void;
}

export function ReplicaList({ replicas, colorMap, currentIndex, onSeek }: Props) {
  return (
    <div className="replica-list">
      <h3>Репліки</h3>
      <div className="replica-list__items">
        {replicas.map((r, idx) => (
          <div
            key={r.id}
            className={`replica-list__item ${idx === currentIndex ? 'replica-list__item--active' : ''}`}
            onClick={() => onSeek(idx)}
          >
            <span
              className="replica-list__char"
              style={{ color: colorMap[r.character] }}
            >
              {r.character}
            </span>
            <span className="replica-list__preview">
              {r.text.slice(0, 40)}
              {r.text.length > 40 ? '...' : ''}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
