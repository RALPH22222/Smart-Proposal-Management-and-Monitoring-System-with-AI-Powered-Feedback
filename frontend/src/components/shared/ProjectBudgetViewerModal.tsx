// Phase 4 follow-up: read-only budget/money tracker for R&D on the Project Funding page.
//
// Shows the current active budget version's line items + a utilization summary so R&D and
// higher-ups can see at a glance what was allocated, what's been approved in fund requests,
// what's pending, and what's left — per category and as a grand total. Uses the same
// getBudgetSummary the proponent monitoring page uses, so numbers are consistent across
// both sides after any realignment.

import React, { useEffect, useState } from 'react';
import { X, Loader2, AlertTriangle, Banknote, TrendingUp, Clock, Wallet } from 'lucide-react';
import {
  fetchActiveBudgetVersion,
  fetchBudgetSummary,
  type ActiveBudgetVersionResponse,
  type ApiBudgetSummary,
  type BudgetItemDto,
} from '../../services/ProjectMonitoringApi';

interface ProjectBudgetViewerModalProps {
  fundedProjectId: number;
  projectTitle: string;
  onClose: () => void;
}

const formatPHP = (n: number) =>
  new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 2 }).format(n || 0);

const CATEGORY_LABELS: Record<'ps' | 'mooe' | 'co', string> = {
  ps: 'Personnel Services',
  mooe: 'Maintenance & Other Operating Expenses',
  co: 'Capital Outlay / Equipment',
};

export const ProjectBudgetViewerModal: React.FC<ProjectBudgetViewerModalProps> = ({
  fundedProjectId,
  projectTitle,
  onClose,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState<ActiveBudgetVersionResponse | null>(null);
  const [summary, setSummary] = useState<ApiBudgetSummary | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    // Both requests can run in parallel — they hit different Lambdas and neither depends
    // on the other. The summary reads from the active version under the hood, so the two
    // will always agree on totals.
    Promise.all([fetchActiveBudgetVersion(fundedProjectId), fetchBudgetSummary(fundedProjectId)])
      .then(([v, s]) => {
        if (cancelled) return;
        setVersion(v);
        setSummary(s);
      })
      .catch((err: any) => {
        if (cancelled) return;
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          'Failed to load the project budget.';
        setError(msg);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [fundedProjectId]);

  // Group line items by category for the display, preserving display_order within category.
  const itemsByCategory: Record<'ps' | 'mooe' | 'co', BudgetItemDto[]> = {
    ps: [],
    mooe: [],
    co: [],
  };
  if (version) {
    for (const item of version.version.items ?? []) {
      if (item.category in itemsByCategory) {
        itemsByCategory[item.category].push(item);
      }
    }
    (['ps', 'mooe', 'co'] as const).forEach((cat) => {
      itemsByCategory[cat].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
    });
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl flex flex-col max-h-[94vh]">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-[#C8102E] to-[#E03A52] text-white">
          <div className="min-w-0">
            <h3 className="font-bold text-lg truncate flex items-center gap-2">
              <Banknote className="w-5 h-5" /> Project Budget Tracker
            </h3>
            <p className="text-xs text-white/80 truncate">{projectTitle}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {loading && (
            <div className="flex items-center justify-center py-10 text-gray-500">
              <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading budget...
            </div>
          )}

          {error && !loading && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" /> {error}
            </div>
          )}

          {!loading && !error && version && summary && (
            <>
              {/* Summary cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500 flex items-center gap-1">
                    <Wallet className="w-3 h-3" /> Total Budget
                  </p>
                  <p className="text-lg font-black text-slate-800 mt-1 truncate" title={formatPHP(summary.total_budget)}>
                    {formatPHP(summary.total_budget)}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Active version: <strong>v{version.version.version_number}</strong>
                  </p>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-600 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" /> Approved
                  </p>
                  <p className="text-lg font-black text-emerald-700 mt-1 truncate" title={formatPHP(summary.total_approved)}>
                    {formatPHP(summary.total_approved)}
                  </p>
                  <p className="text-[10px] text-emerald-500/70 mt-0.5">via fund requests</p>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-amber-600 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Pending
                  </p>
                  <p className="text-lg font-black text-amber-700 mt-1 truncate" title={formatPHP(summary.total_pending)}>
                    {formatPHP(summary.total_pending)}
                  </p>
                  <p className="text-[10px] text-amber-500/70 mt-0.5">awaiting review</p>
                </div>
                <div className="bg-[#C8102E]/5 border border-[#C8102E]/20 rounded-xl p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-[#C8102E]">Remaining</p>
                  <p className="text-lg font-black text-[#C8102E] mt-1 truncate" title={formatPHP(summary.remaining)}>
                    {formatPHP(summary.remaining)}
                  </p>
                  <p className="text-[10px] text-[#C8102E]/70 mt-0.5">unallocated</p>
                </div>
              </div>

              {/* Per-category utilization bars */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-600">Utilization by Category</p>
                  {summary.total_actual_spent > 0 && (
                    <p className="text-[10px] text-slate-500">
                      Actual spent (liquidated): <strong>{formatPHP(summary.total_actual_spent)}</strong>
                    </p>
                  )}
                </div>
                {(['ps', 'mooe', 'co'] as const).map((cat) => {
                  const allocated = summary.budget_by_category[cat] || 0;
                  const approved = summary.approved_by_category[cat] || 0;
                  const pending = summary.pending_by_category[cat] || 0;
                  const pctApproved = allocated > 0 ? (approved / allocated) * 100 : 0;
                  const pctPending = allocated > 0 ? (pending / allocated) * 100 : 0;
                  if (allocated === 0 && approved === 0 && pending === 0) return null;
                  return (
                    <div key={cat}>
                      <div className="flex justify-between text-[11px] font-semibold text-slate-700 mb-1">
                        <span>{cat.toUpperCase()} — {CATEGORY_LABELS[cat]}</span>
                        <span className="font-mono text-slate-500">
                          {formatPHP(approved)} / {formatPHP(allocated)}
                        </span>
                      </div>
                      <div className="w-full h-2.5 rounded-full bg-slate-200 overflow-hidden flex">
                        <div className="bg-emerald-500 h-full" style={{ width: `${Math.min(pctApproved, 100)}%` }} />
                        <div className="bg-amber-400 h-full" style={{ width: `${Math.min(pctPending, 100 - pctApproved)}%` }} />
                      </div>
                      {pending > 0 && (
                        <p className="text-[10px] text-amber-600 mt-0.5">
                          {formatPHP(pending)} pending approval
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Line items grouped by category */}
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-600 mb-2">
                  Line Items (active version)
                </p>
                {(['ps', 'mooe', 'co'] as const).map((cat) => {
                  const catItems = itemsByCategory[cat];
                  if (catItems.length === 0) return null;
                  const catTotal = catItems.reduce((s, i) => s + (Number(i.total_amount) || 0), 0);
                  return (
                    <div key={cat} className="border border-gray-200 rounded-lg overflow-hidden mb-3">
                      <div className="bg-slate-100 px-3 py-2 flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wide text-slate-700">
                          {cat.toUpperCase()} — {CATEGORY_LABELS[cat]}
                        </span>
                        <span className="text-xs font-mono font-bold text-slate-700">{formatPHP(catTotal)}</span>
                      </div>
                      <div className="divide-y divide-gray-100">
                        {catItems.map((item) => (
                          <div key={item.id ?? `${item.item_name}-${item.display_order}`} className="p-2 text-xs grid grid-cols-12 gap-2 items-center hover:bg-slate-50">
                            <span className="col-span-6 truncate">
                              <strong className="text-gray-800">{item.item_name}</strong>
                              {item.spec && <span className="text-gray-500"> ({item.spec})</span>}
                              {item.source && (
                                <span className="text-[10px] text-gray-400 ml-2">from {item.source}</span>
                              )}
                            </span>
                            <span className="col-span-3 text-right font-mono text-gray-600">
                              {item.quantity} {item.unit ?? ''} @ {formatPHP(Number(item.unit_price) || 0)}
                            </span>
                            <span className="col-span-3 text-right font-mono font-semibold text-gray-800">
                              {formatPHP(Number(item.total_amount) || 0)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
                {version.version.items.length === 0 && (
                  <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-lg p-3 text-sm">
                    No line items in the active budget version yet.
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectBudgetViewerModal;
