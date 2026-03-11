interface Props {
  correct: number;
  missed: number;
}

export function ScoreDisplay({ correct, missed }: Props) {
  const total = correct + missed;
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;

  return (
    <div className="score-display">
      <span className="score-display__correct">Правильно: {correct}</span>
      <span className="score-display__missed">Пропущено: {missed}</span>
      {total > 0 && (
        <span className="score-display__pct">{pct}%</span>
      )}
    </div>
  );
}
