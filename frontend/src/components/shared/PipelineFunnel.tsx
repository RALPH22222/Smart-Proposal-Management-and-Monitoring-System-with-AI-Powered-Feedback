interface FunnelStage {
  label: string;
  count: number;
  color: string;
}

interface PipelineFunnelProps {
  stages: FunnelStage[];
}

export default function PipelineFunnel({ stages }: PipelineFunnelProps) {
  const maxCount = Math.max(...stages.map((s) => s.count), 1);
  if (maxCount === 0) return null;

  return (
    <div className="bg-white shadow-xl rounded-2xl border border-slate-200 overflow-hidden">
      <div className="p-4 sm:p-5 border-b border-slate-100">
        <h3 className="text-base font-bold text-slate-800">Proposal Pipeline Flow</h3>
        <p className="text-xs text-slate-500 mt-1">How proposals progress through each stage</p>
      </div>

      <div className="p-4 sm:p-5 flex flex-col items-center gap-1">
        {stages.map((stage, idx) => {
          const widthPct = Math.max((stage.count / maxCount) * 100, 20); // min 20% width
          const prevCount = idx > 0 ? stages[idx - 1].count : null;
          const dropOff = prevCount && prevCount > 0
            ? Math.round(((prevCount - stage.count) / prevCount) * 100)
            : null;

          return (
            <div key={stage.label} className="w-full flex flex-col items-center">
              {/* Drop-off indicator */}
              {dropOff !== null && dropOff > 0 && (
                <div className="flex items-center gap-1 my-0.5">
                  <div className="w-px h-3 bg-slate-300" />
                  <span className="text-[9px] font-semibold text-slate-400">
                    -{dropOff}%
                  </span>
                  <div className="w-px h-3 bg-slate-300" />
                </div>
              )}

              {/* Stage bar */}
              <div
                className="relative rounded-lg py-2.5 px-4 flex items-center justify-between transition-all duration-500 group cursor-default"
                style={{
                  width: `${widthPct}%`,
                  backgroundColor: stage.color,
                  minWidth: '140px',
                }}
              >
                <span className="text-xs font-semibold text-white truncate">{stage.label}</span>
                <span className="text-sm font-bold text-white/90 tabular-nums ml-2">{stage.count}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
