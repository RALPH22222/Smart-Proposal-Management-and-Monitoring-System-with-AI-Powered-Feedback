interface Segment {
  label: string;
  count: number;
  color: string;
}

interface ProjectHealthBarProps {
  segments: Segment[];
}

export default function ProjectHealthBar({ segments }: ProjectHealthBarProps) {
  const total = segments.reduce((s, seg) => s + seg.count, 0);
  if (total === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Project Distribution</p>

      {/* Stacked bar */}
      <div className="w-full h-4 rounded-full overflow-hidden flex bg-slate-100">
        {segments.map((seg) => {
          const pct = (seg.count / total) * 100;
          if (pct === 0) return null;
          return (
            <div
              key={seg.label}
              className="h-full transition-all duration-700 first:rounded-l-full last:rounded-r-full relative group"
              style={{ width: `${Math.max(pct, 2)}%`, backgroundColor: seg.color }}
              title={`${seg.label}: ${seg.count} (${Math.round(pct)}%)`}
            >
              {/* Tooltip on hover */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-white text-[10px] font-medium rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                {seg.label}: {seg.count}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3">
        {segments.map((seg) => (
          <div key={seg.label} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: seg.color }} />
            <span className="text-[11px] text-slate-600">{seg.label}</span>
            <span className="text-[11px] font-bold text-slate-800">{seg.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
