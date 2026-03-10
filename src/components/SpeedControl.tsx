import { MIN_SPEED_MS, MAX_SPEED_MS } from '../constants';

interface Props {
  speedMs: number;
  onChange: (ms: number) => void;
}

function speedLabel(ms: number): string {
  if (ms <= 25) return 'Дуже швидко';
  if (ms <= 40) return 'Швидко';
  if (ms <= 60) return 'Нормально';
  if (ms <= 100) return 'Повільно';
  return 'Дуже повільно';
}

export function SpeedControl({ speedMs, onChange }: Props) {
  return (
    <div className="speed-control">
      <label>
        Швидкість: {speedLabel(speedMs)}
        <input
          type="range"
          min={MIN_SPEED_MS}
          max={MAX_SPEED_MS}
          value={MAX_SPEED_MS + MIN_SPEED_MS - speedMs}
          onChange={(e) => onChange(MAX_SPEED_MS + MIN_SPEED_MS - Number(e.target.value))}
        />
      </label>
    </div>
  );
}
