interface CategoryBreakdown {
  ps: number;
  mooe: number;
  co: number;
}

interface BudgetUtilizationChartProps {
  budget_by_category: CategoryBreakdown;
  approved_by_category: CategoryBreakdown;
  pending_by_category: CategoryBreakdown;
}

const CATEGORIES: { key: keyof CategoryBreakdown; label: string; shortLabel: string }[] = [
  { key: 'ps', label: 'Personnel Services', shortLabel: 'PS' },
  { key: 'mooe', label: 'Maintenance & Operating Expenses', shortLabel: 'MOOE' },
  { key: 'co', label: 'Capital Outlay', shortLabel: 'CO' },
];

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 }).format(amount);

export default function BudgetUtilizationChart({
  budget_by_category: budgetByCategory,
  approved_by_category: approvedByCategory,
  pending_by_category: pendingByCategory,
}: BudgetUtilizationChartProps) {
  const hasData = CATEGORIES.some((c) => budgetByCategory[c.key] > 0);
  if (!hasData) return null;

  return (
    <div className="mt-3 bg-white border border-slate-200 rounded-xl p-4">
      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Budget Utilization by Category</p>

      <div className="space-y-3">
        {CATEGORIES.map(({ key, label, shortLabel }) => {
          const total = budgetByCategory[key] || 0;
          if (total === 0) return null;

          const approved = approvedByCategory[key] || 0;
          const pending = pendingByCategory[key] || 0;
          const remaining = Math.max(0, total - approved - pending);

          const approvedPct = (approved / total) * 100;
          const pendingPct = (pending / total) * 100;

          return (
            <div key={key}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-slate-700">{shortLabel}</span>
                <span className="text-[10px] text-slate-400" title={label}>
                  {formatCurrency(approved + pending)} / {formatCurrency(total)}
                </span>
              </div>
              <div className="w-full h-3 rounded-full overflow-hidden flex bg-slate-100">
                {approvedPct > 0 && (
                  <div
                    className="h-full bg-emerald-500 transition-all duration-700"
                    style={{ width: `${approvedPct}%` }}
                    title={`Approved: ${formatCurrency(approved)}`}
                  />
                )}
                {pendingPct > 0 && (
                  <div
                    className="h-full bg-amber-400 transition-all duration-700"
                    style={{ width: `${pendingPct}%` }}
                    title={`Pending: ${formatCurrency(pending)}`}
                  />
                )}
              </div>
              <div className="flex gap-3 mt-0.5 text-[10px] text-slate-400">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Approved {formatCurrency(approved)}
                </span>
                {pending > 0 && (
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    Pending {formatCurrency(pending)}
                  </span>
                )}
                {remaining > 0 && (
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                    Remaining {formatCurrency(remaining)}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
