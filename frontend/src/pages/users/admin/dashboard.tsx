import { useState, useEffect } from 'react';
import { useAuthContext } from '../../../context/AuthContext';
import type { DashboardStats } from '../../../services/admin/ActivityApi';


import {
  Users,
  FileText,
  CheckCircle,
  Clock,
  Shield,
  Activity,
  FolderOpen,
  TrendingUp,
  RefreshCw
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
} from 'recharts';
import PageLoader from '../../../components/shared/PageLoader';

type ExtendedDashboardStats = DashboardStats & {
  proposals: DashboardStats['proposals'] & {
    monthly_submissions?: { month: string; count: number }[];
  }
};

interface DashboardProps {
  stats: ExtendedDashboardStats | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => Promise<void>;
}

export default function DashboardAdmin({ stats, loading, error, onRefresh }: DashboardProps) {
  const { user } = useAuthContext();
  const [isReturningUser] = useState(() => localStorage.getItem('admin_welcome_seen') === 'true');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (!isReturningUser) {
      localStorage.setItem('admin_welcome_seen', 'true');
    }
  }, [isReturningUser]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await onRefresh();
    setIsRefreshing(false);
  };

  const topCards = stats
    ? [
      {
        icon: Users,
        label: "Total Users",
        value: stats.users.total,
        color: "text-blue-500",
        bgColor: "bg-blue-50",
        borderColor: "border-blue-200",
      },
      {
        icon: FileText,
        label: "Total Proposals",
        value: stats.proposals.total,
        color: "text-purple-500",
        bgColor: "bg-purple-50",
        borderColor: "border-purple-200",
      },
      {
        icon: FolderOpen,
        label: "Funded Projects",
        value: stats.projects.total,
        color: "text-emerald-500",
        bgColor: "bg-emerald-50",
        borderColor: "border-emerald-200",
      },
      {
        icon: Clock,
        label: "Pending Review",
        value: stats.proposals.review_rnd,
        color: "text-amber-500",
        bgColor: "bg-amber-50",
        borderColor: "border-amber-200",
      },
    ]
    : [];

  const pipelineRows = stats
    ? [
      { label: "R&D Review", count: stats.proposals.review_rnd, color: "bg-amber-100 text-amber-700 border-amber-200", hex: "#f59e0b" },
      { label: "Under Evaluation", count: stats.proposals.under_evaluation, color: "bg-blue-100 text-blue-700 border-blue-200", hex: "#3b82f6" },
      { label: "Revision", count: stats.proposals.revision_rnd, color: "bg-orange-100 text-orange-700 border-orange-200", hex: "#f97316" },
      { label: "Rejected", count: stats.proposals.rejected_rnd, color: "bg-red-100 text-red-700 border-red-200", hex: "#ef4444" },
      { label: "Endorsed for Funding", count: stats.proposals.endorsed_for_funding, color: "bg-emerald-100 text-emerald-700 border-emerald-200", hex: "#10b981" },
      { label: "Funding Revision", count: stats.proposals.revision_funding ?? 0, color: "bg-yellow-100 text-yellow-700 border-yellow-200", hex: "#eab308" },
      { label: "Funding Rejected", count: stats.proposals.rejected_funding ?? 0, color: "bg-rose-100 text-rose-700 border-rose-200", hex: "#f43f5e" },
      { label: "Funded", count: stats.proposals.funded, color: "bg-green-100 text-green-700 border-green-200", hex: "#22c55e" },
    ]
    : [];

  // const rolesData = stats
  //   ? [
  //     { name: "Proponents", value: stats.users.by_role.proponent, color: "#3b82f6" },
  //     { name: "Evaluators", value: stats.users.by_role.evaluator, color: "#8b5cf6" },
  //     { name: "R&D Staff", value: stats.users.by_role.rnd, color: "#f59e0b" },
  //     { name: "Admin", value: stats.users.by_role.admin, color: "#ef4444" }
  //   ].filter(r => r.value > 0)
  //   : [];

  const formatTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  if (loading) {
    return <PageLoader mode="admin-dashboard" />;
  }

  if (error || !stats) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-red-500">{error || 'Failed to load dashboard'}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-y-auto pb-10 px-5 sm:px-8 lg:px-10 xl:px-12 2xl:px-16 py-8 lg:py-10 bg-gradient-to-br from-slate-50 to-slate-100 animate-fade-in flex flex-col gap-4 lg:gap-6">
      <header className="flex-shrink-0">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#C8102E] leading-tight min-h-[32px]">
              {isReturningUser ? 'Welcome back, ' : 'Welcome to RDEC, '}
              <span className="text-black">{user?.first_name || 'Admin'}</span>!
            </h1>
            <p className="text-slate-600 mt-2 text-sm lg:text-base leading-relaxed">
              Admin Dashboard & System Overview
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:border-[#C8102E] hover:text-[#C8102E] text-slate-700 text-sm font-medium rounded-xl shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Refresh Dashboard Data"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        <section aria-labelledby="stats-heading">
          <h2 id="stats-heading" className="sr-only">System Statistics</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          {topCards.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <div
                key={index}
                className={`${stat.bgColor} ${stat.borderColor} border-2 rounded-2xl p-4 transition-all duration-300 hover:shadow-lg hover:scale-105 group cursor-pointer`}
                role="button"
                tabIndex={0}
                aria-label={`${stat.label}: ${stat.value}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <IconComponent
                    className={`${stat.color} w-6 h-6 group-hover:scale-110 transition-transform duration-300`}
                  />
                </div>
                <h3 className="text-xs font-semibold text-slate-700 mb-2 leading-tight">
                  {stat.label}
                </h3>
                <p className="text-xl font-bold text-slate-800 tabular-nums">
                  {stat.value}
                </p>
              </div>
            );
          })}
        </div>
        </section>
      </header>

      {/* Monthly Submissions */}
      {stats && stats.proposals.monthly_submissions && stats.proposals.monthly_submissions.length > 0 && (
        <section className="flex flex-col xl:flex-row gap-4 lg:gap-6">
          <div
            className="bg-white shadow-xl rounded-2xl border border-slate-200 overflow-hidden flex-1 flex flex-col min-w-0"
            aria-labelledby="submissions-heading"
          >
            {/* Header */}
            <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 id="submissions-heading" className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-[#C8102E]" />
                  Monthly Submissions
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  Trends for the last {stats.proposals.monthly_submissions.length} months
                </p>
              </div>

              {/* Legend */}
              <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-slate-50 rounded-full border border-slate-200">
                <div className="w-2 h-2 rounded-full bg-[#C8102E]"></div>
                <span className="text-xs font-medium text-slate-600">Volume</span>
              </div>
            </div>

            {/* Chart Area - Responsive Wrapper */}
            <div className="p-4 sm:p-6 flex-1 flex flex-col min-h-[300px]">
              <div className="w-full h-64 sm:h-72 xl:flex-1 relative pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={stats.proposals.monthly_submissions}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis
                      dataKey="month"
                      tickFormatter={(val) => val.substring(0, 3)}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#64748b', fontSize: 12 }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#64748b', fontSize: 12 }}
                      dx={-10}
                    />
                    <RechartsTooltip
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                      formatter={(value: any) => [`${value} Proposals`, 'Volume']}
                    />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#C8102E"
                      strokeWidth={3}
                      dot={{ r: 4, fill: '#C8102E', strokeWidth: 2, stroke: '#fff' }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Summary Stats Footer */}
            <div className="px-4 py-4 sm:px-6 sm:py-5 bg-slate-50 border-t border-slate-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-0 md:divide-x divide-slate-200">
                <div className="flex flex-row md:flex-col items-center justify-between md:justify-center px-2 md:px-4 md:first:pl-0">
                  <p className="text-xs font-semibold text-slate-500 tracking-wider md:mb-1">Total Submissions</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg sm:text-2xl font-bold text-slate-800">
                      {stats.proposals.monthly_submissions.reduce((sum: number, m: any) => sum + m.count, 0)}
                    </span>
                  </div>
                </div>
                <div className="flex flex-row md:flex-col items-center justify-between md:justify-center px-2 md:px-4">
                  <p className="text-xs font-semibold text-slate-500 tracking-wider md:mb-1">Peak Month</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg sm:text-2xl font-bold text-slate-800">
                      {Math.max(...stats.proposals.monthly_submissions.map((m: any) => m.count))}
                    </span>
                    <span className="text-xs text-slate-400">proposals</span>
                  </div>
                </div>
                <div className="flex flex-row md:flex-col items-center justify-between md:justify-center px-2 md:px-4">
                  <p className="text-xs font-semibold text-slate-500 tracking-wider md:mb-1">Monthly Average</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg sm:text-2xl font-bold text-slate-800">
                      {Math.round(stats.proposals.monthly_submissions.reduce((sum: number, m: any) => sum + m.count, 0) / stats.proposals.monthly_submissions.length) || 0}
                    </span>
                    <span className="text-xs text-slate-400">/ mo</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Main Content Section */}
      <section className="flex flex-col lg:flex-row gap-4 lg:gap-6 flex-1 min-h-[500px]">
        {/* Main Charts and Table Container */}
        <div className="bg-white shadow-xl rounded-2xl border border-slate-200 overflow-hidden flex-1 flex flex-col custom-scrollbar overflow-y-auto">

          <div className="p-4 border-b border-slate-200 bg-slate-50 mt-auto">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h3 id="pipeline-heading" className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Activity className="w-5 h-5 text-[#C8102E]" />
                Proposal Pipeline Breakdown
              </h3>
            </div>
          </div>

          <div className="overflow-x-auto flex-1">
            <table
              className="w-full"
              role="table"
              aria-label="Proposal pipeline table"
            >
              <thead>
                <tr className="bg-slate-100 text-left text-slate-700 border-b border-slate-200">
                  <th className="p-3 font-semibold text-xs uppercase tracking-wider" scope="col">
                    #
                  </th>
                  <th className="p-3 font-semibold text-xs uppercase tracking-wider min-w-[200px]" scope="col">
                    Status
                  </th>
                  <th className="p-3 font-semibold text-xs uppercase tracking-wider" scope="col">
                    Count
                  </th>
                </tr>
              </thead>
              <tbody>
                {pipelineRows.map((row, index) => (
                  <tr
                    key={index}
                    className="border-b border-slate-100 hover:bg-slate-50 transition-colors duration-200 group"
                    role="row"
                  >
                    <td className="p-3 text-slate-600 font-medium tabular-nums text-sm" role="cell">
                      {index + 1}
                    </td>
                    <td className="p-3" role="cell">
                      <div className="font-semibold text-slate-800 group-hover:text-[#C8102E] transition-colors duration-200 text-sm">
                        {row.label}
                      </div>
                    </td>
                    <td className="p-3" role="cell">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${row.color}`}>
                        {row.count}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Project Stats Summary */}
          <div className="p-4 bg-gradient-to-r from-slate-50 to-slate-100 border-t border-slate-200">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Funded Projects</h4>
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.projects.on_going}</div>
                <div className="text-xs text-slate-600">On-going</div>
              </div>
              <div className="text-center border-x border-slate-300">
                <div className="text-2xl font-bold text-emerald-600">{stats.projects.completed}</div>
                <div className="text-xs text-slate-600">Completed</div>
              </div>
              <div className="text-center border-r border-slate-300">
                <div className="text-2xl font-bold text-amber-600">{stats.projects.on_hold}</div>
                <div className="text-xs text-slate-600">On Hold</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{stats.projects.blocked}</div>
                <div className="text-xs text-slate-600">Blocked</div>
              </div>
            </div>
          </div>
        </div>

        {/* System Status Box */}
        <div className="bg-white shadow-xl rounded-2xl border border-slate-200 p-4 sm:p-5 w-full lg:w-80 xl:w-96 flex flex-col max-h-[850px] overflow-y-auto custom-scrollbar">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2 sticky top-0 bg-white z-10 py-1">
            <Shield className="w-5 h-5 text-[#C8102E]" />
            System Status
          </h3>

          <div className="space-y-4">
            {/* Active Users */}
            <div className="flex items-center justify-between p-5 bg-blue-50 rounded-xl border border-blue-200 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center gap-4">
                <Users className="w-6 h-6 text-blue-500" />
                <span className="font-semibold text-blue-700 text-base">Active Users</span>
              </div>
              <span className="text-2xl font-bold text-blue-700">{stats.users.active}</span>
            </div>

            {/* Proposals In Progress */}
            <div className="flex items-center justify-between p-5 bg-emerald-50 rounded-xl border border-emerald-200 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center gap-4">
                <CheckCircle className="w-6 h-6 text-emerald-500" />
                <span className="font-semibold text-emerald-700 text-base">In Progress</span>
              </div>
              <span className="text-2xl font-bold text-emerald-700">
                {stats.proposals.under_evaluation + stats.proposals.review_rnd}
              </span>
            </div>

            {/* Pending Actions */}
            <div className="flex items-center justify-between p-5 bg-amber-50 rounded-xl border border-amber-200 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center gap-4">
                <Clock className="w-6 h-6 text-amber-500" />
                <span className="font-semibold text-amber-700 text-base">Pending Actions</span>
              </div>
              <span className="text-2xl font-bold text-amber-700">{stats.proposals.review_rnd}</span>
            </div>
          </div>

          {/* User Breakdown by Role */}
          <div className="mt-8 pt-6 border-t border-slate-200">
            <h4 className="text-sm font-semibold text-slate-700 mb-3">Users by Role</h4>
            <div className="space-y-3 text-xs text-slate-600">
              {[
                { role: "Proponents", count: stats.users.by_role.proponent },
                { role: "Evaluators", count: stats.users.by_role.evaluator },
                { role: "R&D Staff", count: stats.users.by_role.rnd },
                { role: "Administrators", count: stats.users.by_role.admin },
              ].map((item) => (
                <div key={item.role} className="flex items-center justify-between">
                  <span>{item.role}</span>
                  <span className="font-semibold text-slate-800 px-2 py-1 bg-slate-100 rounded-full">
                    {item.count}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity Feed */}
          {stats.activity.recent.length > 0 && (
            <div className="mt-6 pt-6 border-t border-slate-200">
              <h4 className="text-sm font-semibold text-slate-700 mb-3">Recent Activity</h4>
              <div className="space-y-3">
                {stats.activity.recent.map((log) => (
                  <div key={log.id} className="flex items-start gap-2 text-xs">
                    <Activity className="w-3 h-3 text-slate-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-700 truncate">
                        <span className="font-medium">{log.user_name}</span>{" "}
                        {log.action}
                      </p>
                      <p className="text-slate-400">{formatTimeAgo(log.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
