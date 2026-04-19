import { useEffect, useMemo, useState, type ReactElement } from 'react';
import {
  Gauge,
  Search,
  RefreshCw,
  Download,
  Users,
  Activity,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { ActivityApi, type EvaluatorPerformanceRow } from '../../../services/admin/ActivityApi';
import PageLoader from '../../../components/shared/PageLoader';
import { exportToCsv } from '../../../utils/csv-export';

type SortKey =
  | 'name'
  | 'total_assignments'
  | 'active_assignments'
  | 'completed_assignments'
  | 'overdue_active'
  | 'acceptance_rate'
  | 'avg_turnaround_days';

type SortDir = 'asc' | 'desc';

// Compare helper that puts null values last regardless of direction so
// "no data yet" rows don't pollute the top of the table.
function compareValues(a: unknown, b: unknown, dir: SortDir): number {
  if (a === null || a === undefined) return 1;
  if (b === null || b === undefined) return -1;
  if (typeof a === 'number' && typeof b === 'number') {
    return dir === 'asc' ? a - b : b - a;
  }
  const aStr = String(a).toLowerCase();
  const bStr = String(b).toLowerCase();
  return dir === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
}

export default function EvaluatorPerformancePage() {
  const [rows, setRows] = useState<EvaluatorPerformanceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('total_assignments');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const load = async () => {
    try {
      const data = await ActivityApi.getEvaluatorPerformance();
      setRows(data);
    } catch (err) {
      console.error('Failed to fetch evaluator performance:', err);
      setRows([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    load();
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'name' ? 'asc' : 'desc');
    }
  };

  const sortIndicator = (key: SortKey) => {
    if (sortKey !== key) return <ArrowUpDown className="w-3 h-3 opacity-40" />;
    return sortDir === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />;
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const base = q
      ? rows.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.email.toLowerCase().includes(q) ||
          r.department.toLowerCase().includes(q),
      )
      : rows;
    const sorted = [...base].sort((a, b) => compareValues(a[sortKey], b[sortKey], sortDir));
    return sorted;
  }, [rows, search, sortKey, sortDir]);

  // Roll-ups across the currently-visible set (not full dataset) so the
  // cards reflect the filter.
  const totals = useMemo(() => {
    return {
      evaluators: filtered.length,
      active: filtered.reduce((s, r) => s + r.active_assignments, 0),
      overdue: filtered.reduce((s, r) => s + r.overdue_active, 0),
      avgAcceptance: (() => {
        const withRate = filtered.filter((r) => r.acceptance_rate !== null);
        if (withRate.length === 0) return null;
        return Math.round(
          withRate.reduce((s, r) => s + (r.acceptance_rate as number), 0) / withRate.length,
        );
      })(),
    };
  }, [filtered]);

  if (loading) return <PageLoader mode="activity" />;

  return (
    <div className="min-h-screen w-full max-w-[1400px] mx-auto px-5 sm:px-8 lg:px-10 xl:px-12 2xl:px-16 py-8 lg:py-10 bg-gradient-to-br from-slate-50 to-slate-100 animate-fade-in flex flex-col gap-4 lg:gap-6">
      <header>
        <h1 className="text-2xl font-bold text-[#C8102E] flex items-center gap-2">
          Evaluator Performance
        </h1>
        <p className="text-sm text-gray-600 mt-1 lg:text-base">
          Workload, reliability, and turnaround metrics per evaluator.
        </p>
      </header>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:gap-4">
        <div className="p-4 rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-gray-600" />
            <span className="text-xs font-medium text-gray-600">Evaluators</span>
          </div>
          <p className="text-xl font-bold text-gray-900 tabular-nums">{totals.evaluators}</p>
        </div>
        <div className="p-4 rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-4 h-4 text-gray-600" />
            <span className="text-xs font-medium text-gray-600">Active Assignments</span>
          </div>
          <p className="text-xl font-bold text-gray-900 tabular-nums">{totals.active}</p>
        </div>
        <div className="p-4 rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-gray-600" />
            <span className="text-xs font-medium text-gray-600">Overdue (Active)</span>
          </div>
          <p className="text-xl font-bold text-gray-900 tabular-nums">{totals.overdue}</p>
        </div>
        <div className="p-4 rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-gray-600" />
            <span className="text-xs font-medium text-gray-600">Avg Acceptance %</span>
          </div>
          <p className="text-xl font-bold text-gray-900 tabular-nums">
            {totals.avgAcceptance === null ? '—' : `${totals.avgAcceptance}%`}
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or department..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20 focus:border-[#C8102E]"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              exportToCsv('evaluator-performance', filtered, [
                { header: 'Name', accessor: (r) => r.name },
                { header: 'Email', accessor: (r) => r.email },
                { header: 'Department', accessor: (r) => r.department },
                { header: 'Total Assignments', accessor: (r) => r.total_assignments },
                { header: 'Active', accessor: (r) => r.active_assignments },
                { header: 'Completed', accessor: (r) => r.completed_assignments },
                { header: 'Declined', accessor: (r) => r.declined_assignments },
                { header: 'Overdue (Active)', accessor: (r) => r.overdue_active },
                { header: 'Acceptance Rate %', accessor: (r) => r.acceptance_rate ?? '' },
                { header: 'Avg Turnaround (days)', accessor: (r) => r.avg_turnaround_days ?? '' },
                { header: 'Avg Score Given', accessor: (r) => r.avg_score_given ?? '' },
                { header: 'Account Disabled', accessor: (r) => (r.is_disabled ? 'yes' : 'no') },
              ])
            }
            disabled={filtered.length === 0}
            className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-[#C8102E] bg-white border border-[#C8102E]/30 rounded-xl hover:bg-[#C8102E]/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white bg-[#C8102E] rounded-xl hover:bg-[#A00D24] transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Gauge className="w-10 h-10 mb-3" />
            <p className="text-sm">No evaluators match this filter</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <SortHeader label="Evaluator" active={sortKey === 'name'} indicator={sortIndicator('name')} onClick={() => handleSort('name')} />
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Department</th>
                  <SortHeader label="Total" active={sortKey === 'total_assignments'} indicator={sortIndicator('total_assignments')} onClick={() => handleSort('total_assignments')} align="right" />
                  <SortHeader label="Active" active={sortKey === 'active_assignments'} indicator={sortIndicator('active_assignments')} onClick={() => handleSort('active_assignments')} align="right" />
                  <SortHeader label="Completed" active={sortKey === 'completed_assignments'} indicator={sortIndicator('completed_assignments')} onClick={() => handleSort('completed_assignments')} align="right" />
                  <SortHeader label="Overdue" active={sortKey === 'overdue_active'} indicator={sortIndicator('overdue_active')} onClick={() => handleSort('overdue_active')} align="right" />
                  <SortHeader label="Accept %" active={sortKey === 'acceptance_rate'} indicator={sortIndicator('acceptance_rate')} onClick={() => handleSort('acceptance_rate')} align="right" />
                  <SortHeader label="Avg Days" active={sortKey === 'avg_turnaround_days'} indicator={sortIndicator('avg_turnaround_days')} onClick={() => handleSort('avg_turnaround_days')} align="right" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((row) => (
                  <tr key={row.evaluator_id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{row.name}</div>
                          <div className="text-xs text-gray-400">{row.email}</div>
                        </div>
                        {row.is_disabled && (
                          <span className="inline-block px-1.5 py-0.5 text-[10px] font-medium rounded bg-gray-100 text-gray-500">
                            disabled
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-600">{row.department || '—'}</td>
                    <td className="px-5 py-3.5 text-right tabular-nums text-sm text-gray-900">{row.total_assignments}</td>
                    <td className="px-5 py-3.5 text-right tabular-nums text-sm">
                      <span className={row.active_assignments > 0 ? 'text-emerald-700 font-semibold' : 'text-gray-400'}>
                        {row.active_assignments}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right tabular-nums text-sm text-gray-600">
                      <span className="inline-flex items-center gap-1">
                        <CheckCircle className="w-3 h-3 text-emerald-400" />
                        {row.completed_assignments}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right tabular-nums text-sm">
                      {row.overdue_active > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 font-semibold border border-rose-100">
                          {row.overdue_active}
                        </span>
                      ) : (
                        <span className="text-gray-300">0</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right tabular-nums text-sm">
                      {row.acceptance_rate === null ? (
                        <span className="text-gray-300">—</span>
                      ) : (
                        <span className={
                          row.acceptance_rate >= 80
                            ? 'text-emerald-700 font-semibold'
                            : row.acceptance_rate >= 50
                              ? 'text-amber-600 font-semibold'
                              : 'text-rose-600 font-semibold'
                        }>
                          {row.acceptance_rate}%
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right tabular-nums text-sm text-gray-700">
                      {row.avg_turnaround_days === null ? (
                        <span className="text-gray-300">—</span>
                      ) : (
                        <>{row.avg_turnaround_days} d</>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

interface SortHeaderProps {
  label: string;
  active: boolean;
  indicator: ReactElement;
  onClick: () => void;
  align?: 'left' | 'right';
}

function SortHeader({ label, active, indicator, onClick, align = 'left' }: SortHeaderProps) {
  return (
    <th
      className={`text-xs font-semibold uppercase tracking-wider px-5 py-3 select-none ${align === 'right' ? 'text-right' : 'text-left'
        } ${active ? 'text-[#C8102E]' : 'text-gray-500'}`}
    >
      <button
        type="button"
        onClick={onClick}
        className={`inline-flex items-center gap-1.5 hover:text-[#C8102E] transition-colors ${align === 'right' ? 'justify-end ml-auto' : ''
          }`}
      >
        {label}
        {indicator}
      </button>
    </th>
  );
}
