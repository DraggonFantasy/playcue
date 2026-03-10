import { SpeedControl } from './SpeedControl';
import { ScoreDisplay } from './ScoreDisplay';
import { HintModeControl } from './HintModeControl';

interface Props {
  speedMs: number;
  onSpeedChange: (ms: number) => void;
  hintWords: number;
  onHintChange: (n: number) => void;
  correct: number;
  missed: number;
  currentIndex: number;
  totalReplicas: number;
  onSeek: (index: number) => void;
  onRewind: () => void;
  onForward: () => void;
}

export function ControlBar({
  speedMs,
  onSpeedChange,
  hintWords,
  onHintChange,
  correct,
  missed,
  currentIndex,
  totalReplicas,
  onSeek,
  onRewind,
  onForward,
}: Props) {
  return (
    <div className="control-bar">
      <div className="control-bar__nav">
        <button onClick={onRewind} title="Назад">⏪</button>
        <span className="control-bar__position">
          {currentIndex + 1} / {totalReplicas}
        </span>
        <button onClick={onForward} title="Вперед">⏩</button>
        <input
          type="range"
          className="control-bar__seek"
          min={0}
          max={totalReplicas - 1}
          value={currentIndex}
          onChange={(e) => onSeek(Number(e.target.value))}
        />
      </div>
      <div className="control-bar__settings">
        <SpeedControl speedMs={speedMs} onChange={onSpeedChange} />
        <HintModeControl hintWords={hintWords} onChange={onHintChange} />
      </div>
      <ScoreDisplay correct={correct} missed={missed} />
    </div>
  );
}
