interface ProgressRingProps {
  size?: number;
  strokeWidth?: number;
  percentage: number;
  color?: string;
  trackColor?: string;
  showLabel?: boolean;
}

export default function ProgressRing({
  size = 44,
  strokeWidth = 4,
  percentage,
  color = '#3b82f6',
  trackColor = '#e2e8f0',
  showLabel = true,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(Math.min(percentage, 100), 0);
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        {/* Progress */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700"
        />
      </svg>
      {showLabel && (
        <span
          className="absolute inset-0 flex items-center justify-center font-bold text-slate-700"
          style={{ fontSize: size * 0.24 }}
        >
          {Math.round(clamped)}%
        </span>
      )}
    </div>
  );
}
