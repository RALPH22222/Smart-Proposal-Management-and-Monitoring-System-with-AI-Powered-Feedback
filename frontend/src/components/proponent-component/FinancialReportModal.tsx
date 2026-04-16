import React, { useState, useEffect } from 'react';
import { X, DollarSign, Loader2 } from 'lucide-react';
import {
  fetchFinancialReport,
  type ApiFinancialReport,
  type FinancialReportLineItem,
  type FinancialReportSummary,
} from '../../services/ProjectMonitoringApi';

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

function formatAmount(n: number): string {
  return n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function QuarterCell({ data }: { data: { requested: number; spent: number } | null }) {
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

export default function FinancialReportModal({ fundedProjectId, projectTitle, onClose }: Props) {
  const [report, setReport] = useState<ApiFinancialReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFinancialReport(fundedProjectId)
      .then((data) => setReport(data))
      .catch((err) => setError(err?.response?.data?.message || 'Failed to load financial report.'))
      .finally(() => setLoading(false));
  }, [fundedProjectId]);

  // Group items by category
  const groupedItems: Record<string, FinancialReportLineItem[]> = { ps: [], mooe: [], co: [] };
  if (report) {
    for (const item of report.line_items) {
      if (groupedItems[item.category]) {
        groupedItems[item.category].push(item);
      }
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800">Financial Report</h3>
              <p className="text-xs text-gray-500">{projectTitle}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto p-5">
          {loading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
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
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr className="bg-gray-800 text-white">
                      <th className="px-3 py-2.5 text-left font-semibold">#</th>
                      <th className="px-3 py-2.5 text-left font-semibold">Line Item</th>
                      <th className="px-2 py-2.5 text-right font-semibold">Approved Budget</th>
                      <th className="px-2 py-2.5 text-center font-semibold">Q1</th>
                      <th className="px-2 py-2.5 text-center font-semibold">Q2</th>
                      <th className="px-2 py-2.5 text-center font-semibold">Q3</th>
                      <th className="px-2 py-2.5 text-center font-semibold">Q4</th>
                      <th className="px-2 py-2.5 text-right font-semibold">Total Requested</th>
                      <th className="px-2 py-2.5 text-right font-semibold">Total Spent</th>
                      <th className="px-2 py-2.5 text-right font-semibold">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(['ps', 'mooe', 'co'] as const).map((cat) => {
                      const items = groupedItems[cat];
                      if (items.length === 0) return null;
                      const catSummary = report.summary_by_category[cat];
                      return (
                        <React.Fragment key={cat}>
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
                              <QuarterCell data={item.quarterly_data.q1} />
                              <QuarterCell data={item.quarterly_data.q2} />
                              <QuarterCell data={item.quarterly_data.q3} />
                              <QuarterCell data={item.quarterly_data.q4} />
                              <td className="px-2 py-1.5 text-right">{formatAmount(item.total_requested)}</td>
                              <td className="px-2 py-1.5 text-right">{formatAmount(item.total_spent)}</td>
                              <td className={`px-2 py-1.5 text-right font-medium ${item.balance < 0 ? 'text-red-600' : 'text-green-600'}`}>
                                {formatAmount(item.balance)}
                              </td>
                            </tr>
                          ))}
                          <SummaryRow label={`Subtotal — ${CATEGORY_SHORT[cat]}`} data={catSummary} />
                        </React.Fragment>
                      );
                    })}
                    <SummaryRow label="GRAND TOTAL" data={report.grand_total} bold />
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
