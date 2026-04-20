import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, DollarSign } from 'lucide-react';
import {
  fetchFinancialReport,
  type ApiFinancialReport,
  type FinancialReportLineItem,
  type FinancialReportSummary,
} from '../../services/ProjectMonitoringApi';
import SkeletonPulse from '../shared/SkeletonPulse';

interface Props {
  fundedProjectId: number;
  projectTitle: string;
  onClose: () => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  ps: 'Personal Services (PS)',
  mooe: 'Maintenance & Other Operating Expenses (MOOE)',
  co: 'Capital Outlay (CO)',
};

const CATEGORY_SHORT: Record<string, string> = { ps: 'PS', mooe: 'MOOE', co: 'CO' };
const QUARTER_KEYS = ['q1_report', 'q2_report', 'q3_report', 'q4_report'] as const;
const QUARTER_LABELS = ['Q1', 'Q2', 'Q3', 'Q4'];

function formatAmount(n: number): string {
  return n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function QuarterCell({ data }: { data: { requested: number; spent: number } | null | undefined }) {
  if (!data) return <td className="px-2 py-1.5 text-center text-gray-300 text-xs">—</td>;
  return (
    <td className="px-2 py-1.5 text-right text-xs">
      <div>{formatAmount(data.requested)}</div>
      <div className={`text-[10px] ${data.spent > data.requested ? 'text-red-500' : 'text-gray-400'}`}>
        spent: {formatAmount(data.spent)}
      </div>
    </td>
  );
}

function SummaryRow({ label, data, bold }: { label: string; data: FinancialReportSummary; bold?: boolean }) {
  const cls = bold ? 'font-bold bg-gray-100' : 'font-semibold bg-gray-50';
  return (
    <tr className={cls}>
      <td className="px-3 py-2 text-xs" colSpan={2}>{label}</td>
      <td className="px-2 py-2 text-right text-xs">{formatAmount(data.budget)}</td>
      <td className="px-2 py-2 text-right text-xs" colSpan={4}></td>
      <td className="px-2 py-2 text-right text-xs">{formatAmount(data.requested)}</td>
      <td className="px-2 py-2 text-right text-xs">{formatAmount(data.spent)}</td>
      <td className={`px-2 py-2 text-right text-xs ${data.balance < 0 ? 'text-red-600' : 'text-green-600'}`}>
        {formatAmount(data.balance)}
      </td>
    </tr>
  );
}

/**
 * Pull a specific year's quarter data out of a line item. Falls back to the
 * legacy `quarterly_data` shape for year 1 on older backend responses that
 * predate the yearly_data field (defensive — shouldn't happen post-Phase 2A).
 */
function quarterFor(
  item: FinancialReportLineItem,
  yearNumber: number,
  quarterKey: string,
): { requested: number; spent: number } | null {
  const yd = item.yearly_data?.[yearNumber];
  if (yd && yd[quarterKey] !== undefined) return yd[quarterKey];
  // Legacy fallback for Y1
  if (yearNumber === 1) {
    const key = quarterKey.replace('_report', '') as 'q1' | 'q2' | 'q3' | 'q4';
    return item.quarterly_data?.[key] ?? null;
  }
  return null;
}

export default function FinancialReportModal({ fundedProjectId, projectTitle, onClose }: Props) {
  const [report, setReport] = useState<ApiFinancialReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Y1 is always the default landing view. `null` = "All years" stacked.
  const [activeYear, setActiveYear] = useState<number | null>(1);

  useEffect(() => {
    fetchFinancialReport(fundedProjectId)
      .then((data) => setReport(data))
      .catch((err) => setError(err?.response?.data?.message || 'Failed to load financial report.'))
      .finally(() => setLoading(false));
  }, [fundedProjectId]);

  // How many years does this project span? ceil(total_periods / 4). Falls back to 1
  // if total_periods isn't present (very old backend). Capped at 10 defensively.
  const yearCount = useMemo(() => {
    if (!report) return 1;
    const totalPeriods = report.total_periods ?? 4;
    return Math.min(10, Math.max(1, Math.ceil(totalPeriods / 4)));
  }, [report]);
  const isMultiYear = yearCount > 1;

  // Group items by category
  const groupedItems: Record<string, FinancialReportLineItem[]> = { ps: [], mooe: [], co: [] };
  if (report) {
    for (const item of report.line_items) {
      if (groupedItems[item.category]) {
        groupedItems[item.category].push(item);
      }
    }
  }

  // Which year(s) to render. "All" stacks every year vertically.
  const yearsToRender: number[] = activeYear === null
    ? Array.from({ length: yearCount }, (_, i) => i + 1)
    : [activeYear];

  const renderYearTable = (yearNumber: number) => {
    if (!report) return null;
    return (
      <div key={`year-${yearNumber}`} className="overflow-x-auto mb-6">
        {isMultiYear && (
          <h4 className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
            <span className="bg-[#C8102E] text-white text-xs font-bold px-2 py-0.5 rounded">
              YEAR {yearNumber}
            </span>
          </h4>
        )}
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="bg-gray-800 text-white">
              <th className="px-3 py-2.5 text-left font-semibold">#</th>
              <th className="px-3 py-2.5 text-left font-semibold">Line Item</th>
              <th className="px-2 py-2.5 text-right font-semibold">Approved Budget</th>
              {QUARTER_LABELS.map((q) => (
                <th key={q} className="px-2 py-2.5 text-center font-semibold">{q}</th>
              ))}
              <th className="px-2 py-2.5 text-right font-semibold">Total Requested</th>
              <th className="px-2 py-2.5 text-right font-semibold">Total Spent</th>
              <th className="px-2 py-2.5 text-right font-semibold">Balance</th>
            </tr>
          </thead>
          <tbody>
            {(['ps', 'mooe', 'co'] as const).map((cat) => {
              const items = groupedItems[cat];
              if (items.length === 0) return null;
              return (
                <React.Fragment key={`${cat}-y${yearNumber}`}>
                  <tr className="bg-gray-200">
                    <td colSpan={10} className="px-3 py-2 font-bold text-xs text-gray-700">
                      {CATEGORY_LABELS[cat]}
                    </td>
                  </tr>
                  {items.map((item, i) => (
                    <tr key={item.budget_item_id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-3 py-1.5 text-gray-400">{i + 1}</td>
                      <td className="px-3 py-1.5 max-w-[200px] truncate" title={item.item_name}>{item.item_name}</td>
                      <td className="px-2 py-1.5 text-right">{formatAmount(item.approved_budget)}</td>
                      {QUARTER_KEYS.map((qKey) => (
                        <QuarterCell key={qKey} data={quarterFor(item, yearNumber, qKey)} />
                      ))}
                      <td className="px-2 py-1.5 text-right">{formatAmount(item.total_requested)}</td>
                      <td className="px-2 py-1.5 text-right">{formatAmount(item.total_spent)}</td>
                      <td className={`px-2 py-1.5 text-right font-medium ${item.balance < 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {formatAmount(item.balance)}
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              );
            })}
            {/* Category subtotals + grand total — shown only on the last rendered year
                or when viewing a single year, so we don't repeat them per year block. */}
            {(activeYear !== null || yearNumber === yearCount) && (
              <>
                {(['ps', 'mooe', 'co'] as const).map((cat) => {
                  const items = groupedItems[cat];
                  if (items.length === 0) return null;
                  return (
                    <SummaryRow
                      key={`sum-${cat}`}
                      label={`Subtotal — ${CATEGORY_SHORT[cat]}`}
                      data={report.summary_by_category[cat]}
                    />
                  );
                })}
                <SummaryRow label="GRAND TOTAL" data={report.grand_total} bold />
              </>
            )}
          </tbody>
        </table>
      </div>
    );
  };

  const modalContent = (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
              <DollarSign className="w-5 h-5" strokeWidth={2.6} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800">Financial Report</h3>
              <p className="text-xs text-gray-500">{projectTitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto p-5 bg-slate-50">
          {loading && (
            <div className="space-y-4 animate-pulse">
              <div className="flex items-center gap-4 mb-4">
                <SkeletonPulse className="h-4 w-28" />
                <SkeletonPulse className="h-4 w-40" />
              </div>

              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-800 px-3 py-3 flex items-center gap-3">
                  <SkeletonPulse className="h-4 w-6 bg-slate-500/70" />
                  <SkeletonPulse className="h-4 w-36 bg-slate-500/70" />
                  <SkeletonPulse className="h-4 w-28 ml-auto bg-slate-500/70" />
                  <SkeletonPulse className="h-4 w-24 bg-slate-500/70" />
                  <SkeletonPulse className="h-4 w-24 bg-slate-500/70" />
                </div>

                <div className="divide-y divide-slate-100">
                  {[1, 2, 3].map((section) => (
                    <div key={section}>
                      <div className="bg-slate-100 px-3 py-2">
                        <SkeletonPulse className="h-4 w-56" />
                      </div>
                      {[1, 2, 3].map((row) => (
                        <div key={`${section}-${row}`} className="px-3 py-2 grid grid-cols-10 gap-2 items-center bg-white">
                          <SkeletonPulse className="h-3 col-span-1" />
                          <SkeletonPulse className="h-3 col-span-3" />
                          <SkeletonPulse className="h-3 col-span-1" />
                          <SkeletonPulse className="h-3 col-span-1" />
                          <SkeletonPulse className="h-3 col-span-1" />
                          <SkeletonPulse className="h-3 col-span-1" />
                          <SkeletonPulse className="h-3 col-span-1" />
                          <SkeletonPulse className="h-3 col-span-1" />
                        </div>
                      ))}
                      <div className="px-3 py-2 bg-slate-50 grid grid-cols-10 gap-2">
                        <SkeletonPulse className="h-3 col-span-3" />
                        <SkeletonPulse className="h-3 col-span-2 ml-auto" />
                        <SkeletonPulse className="h-3 col-span-2 ml-auto" />
                        <SkeletonPulse className="h-3 col-span-2 ml-auto" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="text-center py-20 text-red-500 text-sm">{error}</div>
          )}

          {report && (
            <div>
              <div className="flex items-center gap-4 mb-4 text-xs text-gray-500">
                <span>Budget Version: v{report.budget_version.version_number}</span>
                <span>Grand Total: {formatAmount(report.budget_version.grand_total)}</span>
                {report.duration_months != null && (
                  <span>Duration: {report.duration_months} months</span>
                )}
              </div>

              {/* Year selector — only shown when the project spans >1 year. */}
              {isMultiYear && (
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <span className="text-xs font-semibold text-slate-600 mr-1">View:</span>
                  {Array.from({ length: yearCount }, (_, i) => i + 1).map((y) => (
                    <button
                      key={y}
                      onClick={() => setActiveYear(y)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                        activeYear === y
                          ? 'bg-[#C8102E] text-white shadow-sm'
                          : 'bg-white border border-slate-300 text-slate-600 hover:border-[#C8102E]'
                      }`}
                    >
                      Year {y}
                    </button>
                  ))}
                  <button
                    onClick={() => setActiveYear(null)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                      activeYear === null
                        ? 'bg-slate-800 text-white shadow-sm'
                        : 'bg-white border border-slate-300 text-slate-600 hover:border-slate-500'
                    }`}
                  >
                    All Years
                  </button>
                </div>
              )}

              {yearsToRender.map((y) => renderYearTable(y))}
            </div>
          )}
        </div>

        {/* Footer (static: no loading state) */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 shadow-sm transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(modalContent, document.body);
}
