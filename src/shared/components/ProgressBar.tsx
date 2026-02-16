interface ProgressBarProps {
  value: number;
  max: number;
  label?: string;
  className?: string;
  colorClass?: string;
}

export function ProgressBar({
  value,
  max,
  label,
  className = '',
  colorClass = 'bg-action-green',
}: ProgressBarProps) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;

  return (
    <div className={className}>
      {label && (
        <div className="flex justify-between text-xs text-gorgon-text-dim mb-1">
          <span>{label}</span>
          <span className="font-mono">{value}/{max}</span>
        </div>
      )}
      <div className="w-full h-2 bg-gorgon-dark rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${colorClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
