interface Props {
  hintWords: number;
  onChange: (n: number) => void;
}

export function HintModeControl({ hintWords, onChange }: Props) {
  return (
    <div className="hint-control">
      <label>
        Підказка (слів): {hintWords === 0 ? 'вимк' : hintWords}
        <input
          type="range"
          min={0}
          max={10}
          value={hintWords}
          onChange={(e) => onChange(Number(e.target.value))}
        />
      </label>
    </div>
  );
}
