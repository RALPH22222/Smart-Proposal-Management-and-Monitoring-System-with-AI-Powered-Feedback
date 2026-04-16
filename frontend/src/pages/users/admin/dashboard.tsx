import { useState, useEffect } from 'react';
import { useAuthContext } from '../../../context/AuthContext';
import type { DashboardStats } from '../../../services/admin/ActivityApi';

import {
  Users,
  FileText,
  Shield,
  Activity,
  TrendingUp,
  RefreshCw,
  BarChart3,
  XCircle,
  CheckCircle2,
  Clock3,
  Zap,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import PageLoader from '../../../components/shared/PageLoader';
import PipelineFunnel from '../../../components/shared/PipelineFunnel';

type ExtendedDashboardStats = DashboardStats & {
  proposals: DashboardStats['proposals'] & {
    daily_submissions?: { date: string; count: number }[];
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
        icon: BarChart3,
        label: "Total Monitoring Projects",
        value: stats.projects.total,
        color: "text-blue-500",
        bgColor: "bg-blue-50",
        borderColor: "border-blue-200",
      },
      {
        icon: XCircle,
        label: "Rejected Proposals",
        value: stats.proposals.rejected_rnd + stats.proposals.rejected_funding,
        color: "text-red-500",
        bgColor: "bg-red-50",
        borderColor: "border-red-200",
      },
    ]
    : [];

  const pipelineData = stats
    ? [
      { label: "Under R&D Evaluation", shortLabel: "R&D Eval", count: stats.proposals.review_rnd, hex: "#3b82f6" },
      { label: "Under Evaluators Assessment", shortLabel: "Assessment", count: stats.proposals.under_evaluation, hex: "#8b5cf6" },
      { label: "Revision", shortLabel: "Revision", count: stats.proposals.revision_rnd, hex: "#f97316" },
      { label: "Rejected", shortLabel: "Rejected", count: stats.proposals.rejected_rnd, hex: "#ef4444" },
      { label: "Endorsed for Funding", shortLabel: "Endorsed", count: stats.proposals.endorsed_for_funding, hex: "#1d4ed8" },
      { label: "Funded", shortLabel: "Funded", count: stats.proposals.funded, hex: "#22c55e" },
    ]
    : [];

  const totalPipeline = pipelineData.reduce((s, r) => s + r.count, 0);

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

  /* ─── Role breakdown for System Status ─── */
  const roles = [
    { role: "Proponents", count: stats.users.by_role.proponent, color: "#ef4444" },
    { role: "Evaluators", count: stats.users.by_role.evaluator, color: "#8b5cf6" },
    { role: "R&D Staff", count: stats.users.by_role.rnd, color: "#3a82efff" },
    { role: "Admins", count: stats.users.by_role.admin, color: "#921616ff" },
  ];
  const totalRoles = roles.reduce((s, r) => s + r.count, 0) || 1;

  return (
    <div className="min-h-screen overflow-y-auto pb-10 px-5 sm:px-8 lg:px-10 xl:px-12 2xl:px-16 py-8 lg:py-10 bg-gradient-to-br from-slate-50 to-slate-100 animate-fade-in flex flex-col gap-4 lg:gap-6">
      {/* ── Page Header ── */}
      <header className="flex-shrink-0">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#C8102E] leading-tight min-h-[32px]">
              {isReturningUser ? 'Welcome back, ' : 'Welcome to RDEC, '}
              <span className="text-black">{user?.first_name || 'Admin'}</span>!
            </h1>
            <p className="text-slate-600 mt-2 text-sm lg:text-base leading-relaxed">
              Admin Dashboard &amp; System Overview
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

        {/* ── Top KPI Cards ── */}
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

      {/* ── Daily Submissions Chart ── */}
      {stats && stats.proposals.daily_submissions && stats.proposals.daily_submissions.length > 0 && (
        <section className="flex flex-col xl:flex-row gap-4 lg:gap-6">
          <div
            className="bg-white shadow-xl rounded-2xl border border-slate-200 overflow-hidden flex-1 flex flex-col min-w-0"
            aria-labelledby="submissions-heading"
          >
            <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 id="submissions-heading" className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-[#C8102E]" />
                  Daily Submissions
                </h3>
                <p className="text-sm text-slate-500 mt-1">Last 14 days trend</p>
              </div>
              <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-slate-50 rounded-full border border-slate-200">
                <div className="w-2 h-2 rounded-full bg-[#C8102E]"></div>
                <span className="text-xs font-medium text-slate-600">Proposals</span>
              </div>
            </div>

            <div className="p-4 sm:p-6 flex-1 flex flex-col min-h-[180px]">
              <div className="w-full h-40 sm:h-48 xl:flex-1 relative pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={stats.proposals.daily_submissions}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(val) => val.split(' ')[1]}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#64748b', fontSize: 11 }}
                      dy={10}
                      interval={2}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#64748b', fontSize: 12 }}
                      dx={-10}
                      allowDecimals={false}
                    />
                    <RechartsTooltip
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      formatter={(value: any) => [`${value} Proposals`, 'Count']}
                      labelFormatter={(label: any) => label}
                    />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#C8102E"
                      strokeWidth={2}
                      dot={{ r: 3, fill: '#C8102E', strokeWidth: 2, stroke: '#fff' }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="px-4 py-3 sm:px-6 sm:py-4 bg-slate-50 border-t border-slate-200">
              <div className="grid grid-cols-3 gap-4 md:divide-x divide-slate-200">
                <div className="flex flex-col items-center justify-center px-2 md:px-4 md:first:pl-0">
                  <p className="text-xs font-semibold text-slate-500 tracking-wider mb-1">Total (14d)</p>
                  <span className="text-lg sm:text-xl font-bold text-slate-800">
                    {stats.proposals.daily_submissions.reduce((sum: number, d: any) => sum + d.count, 0)}
                  </span>
                </div>
                <div className="flex flex-col items-center justify-center px-2 md:px-4">
                  <p className="text-xs font-semibold text-slate-500 tracking-wider mb-1">Today</p>
                  <span className="text-lg sm:text-xl font-bold text-slate-800">
                    {stats.proposals.daily_submissions[stats.proposals.daily_submissions.length - 1]?.count || 0}
                  </span>
                </div>
                <div className="flex flex-col items-center justify-center px-2 md:px-4">
                  <p className="text-xs font-semibold text-slate-500 tracking-wider mb-1">Daily Avg</p>
                  <span className="text-lg sm:text-xl font-bold text-slate-800">
                    {Math.round(stats.proposals.daily_submissions.reduce((sum: number, d: any) => sum + d.count, 0) / stats.proposals.daily_submissions.length) || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Proposal Pipeline Funnel ── */}
      {stats && (
        <section>
          <PipelineFunnel
            stages={[
              { label: 'R&D Review', count: stats.proposals.review_rnd, color: '#3b82f6' },
              { label: 'Under Evaluation', count: stats.proposals.under_evaluation, color: '#8b5cf6' },
              { label: 'Endorsed for Funding', count: stats.proposals.endorsed_for_funding, color: '#1d4ed8' },
              { label: 'Funded', count: stats.proposals.funded, color: '#22c55e' },
            ]}
          />
        </section>
      )}

      {/* ── Main Content: Pipeline Chart + System Status ── */}
      <section className="flex flex-col lg:flex-row gap-4 lg:gap-6">

        {/* ── Proposal Pipeline Breakdown — Horizontal Bar Chart ── */}
        <div className="bg-white shadow-xl rounded-2xl border border-slate-200 overflow-hidden flex flex-col h-fit">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2">
                <Activity className="w-4 h-4 text-[#C8102E]" />
              </div>
              <div>
                <h3 id="pipeline-heading" className="text-base font-bold text-slate-800">
                  Proposal Pipeline Breakdown
                </h3>
                <p className="text-xs text-slate-500">{totalPipeline} total proposals across all stages</p>
              </div>
            </div>
          </div>

          {/* Horizontal Bar Chart */}
          <div className="p-4 sm:p-5">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={pipelineData}
                margin={{ top: 20, right: 10, left: 0, bottom: 5 }}
                barSize={35}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey="shortLabel"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 10, fontWeight: 500 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  dx={-10}
                  allowDecimals={false}
                />
                <RechartsTooltip
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: any, _name: any, props: any) => [
                    <span style={{ color: props.payload.hex, fontWeight: 700 }}>{value} proposals</span>,
                    props.payload.label,
                  ]}
                  labelFormatter={() => ''}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {pipelineData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.hex} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            {/* Color Legend */}
            <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-2 px-1">
              {pipelineData.map((item, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: item.hex }} />
                  <span className="text-[11px] text-slate-500">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Funded Projects mini summary */}
          <div className="px-4 sm:px-5 py-3 bg-gradient-to-r from-slate-50 to-slate-100 border-t border-slate-200">
            <p className="text-[10px] font-bold text-slate-400 tracking-widest mb-2">Funded Projects</p>
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: "On-going", value: stats.projects.on_going, color: "text-blue-600", bg: "bg-blue-50 border-blue-100" },
                { label: "Completed", value: stats.projects.completed, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-100" },
                { label: "Delayed", value: stats.projects.on_hold, color: "text-amber-600", bg: "bg-amber-50 border-amber-100" },
                { label: "Blocked", value: stats.projects.blocked, color: "text-red-600", bg: "bg-red-50 border-red-100" },
              ].map((p) => (
                <div key={p.label} className={`text-center py-2 px-1 ${p.bg} rounded-lg border`}>
                  <div className={`text-lg font-bold ${p.color} leading-none`}>{p.value}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5 leading-tight">{p.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── System Status (Improved) ── */}
        <div className="w-full lg:w-80 xl:w-[360px] flex flex-col gap-4">

          {/* User Health Card */}
          <div className="bg-white shadow-xl rounded-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 pt-5 pb-4 border-b border-slate-100 flex items-center gap-3">
              <Shield className="w-5 h-5 text-[#C8102E]" />
              <div>
                <h3 className="text-base font-bold text-slate-800">System Status</h3>
                <p className="text-xs text-slate-500">Live platform overview</p>
              </div>
            </div>

            <div className="p-5 space-y-4">
              {/* Total Users row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-semibold text-slate-700">Total Users</span>
                </div>
                <span className="text-xl font-bold text-slate-800">{stats.users.total}</span>
              </div>

              {/* Active vs Disabled progress bar */}
              <div>
                <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    Active — <strong className="text-slate-700">{stats.users.active}</strong>
                  </span>
                  <span className="flex items-center gap-1">
                    <XCircle className="w-3 h-3 text-red-400" />
                    Disabled — <strong className="text-slate-700">{stats.users.total - stats.users.active}</strong>
                  </span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-700"
                    style={{ width: stats.users.total > 0 ? `${(stats.users.active / stats.users.total) * 100}%` : '0%' }}
                  />
                </div>
                <p className="text-right text-[10px] text-slate-400 mt-1">
                  {stats.users.total > 0 ? Math.round((stats.users.active / stats.users.total) * 100) : 0}% active rate
                </p>
              </div>

              {/* Activity 24h */}
              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-violet-50 rounded-xl border border-purple-100">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-purple-100 rounded-lg">
                    <Zap className="w-3.5 h-3.5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-purple-700">Activity (24h)</p>
                    <p className="text-[10px] text-purple-400">Actions logged today</p>
                  </div>
                </div>
                <span className="text-2xl font-bold text-purple-700">{stats.activity.last_24h}</span>
              </div>
            </div>
          </div>

          {/* Role Distribution Card */}
          <div className="bg-white shadow-xl rounded-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 pt-4 pb-3 border-b border-slate-100 flex items-center gap-2">
              <Users className="w-4 h-4 text-[#C8102E]" />
              <h3 className="text-sm font-bold text-slate-800">User Role Distribution</h3>
            </div>
            <div className="p-4 space-y-3">
              {roles.map((item) => (
                <div key={item.role}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="text-xs font-medium text-slate-600">{item.role}</span>
                    </div>
                    <span className="text-xs font-bold text-slate-800">{item.count}</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${(item.count / totalRoles) * 100}%`,
                        backgroundColor: item.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          {stats.activity.recent.length > 0 && (
            <div className="bg-white shadow-xl rounded-2xl border border-slate-200 overflow-hidden flex-1">
              <div className="px-5 pt-4 pb-3 border-b border-slate-100 flex items-center gap-2">
                <Clock3 className="w-4 h-4 text-[#C8102E]" />
                <h3 className="text-sm font-bold text-slate-800">Recent Activity</h3>
              </div>
              <div className="p-4 space-y-2 max-h-[240px] overflow-y-auto custom-scrollbar">
                {stats.activity.recent.map((log) => (
                  <div key={log.id} className="flex items-start gap-3 p-2.5 bg-slate-50 hover:bg-slate-100 transition-colors rounded-xl">
                    <div className="w-7 h-7 bg-gradient-to-br from-slate-200 to-slate-300 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Activity className="w-3 h-3 text-slate-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-700 leading-tight">
                        <span className="font-semibold text-slate-800">{log.user_name}</span>{" "}
                        {log.action}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{formatTimeAgo(log.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── KPI Performance Metrics ── */}
      {stats.kpi && (
        <>
          {/* Performance Cards */}
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
            {[
              {
                label: "Proposal Success Rate",
                value: `${stats.kpi.proposal_success_rate}%`,
                description: "Funded / Total submitted",
                color: stats.kpi.proposal_success_rate >= 50 ? "text-emerald-600" : stats.kpi.proposal_success_rate >= 25 ? "text-amber-600" : "text-red-500",
                bgColor: stats.kpi.proposal_success_rate >= 50 ? "bg-emerald-50 border-emerald-200" : stats.kpi.proposal_success_rate >= 25 ? "bg-amber-50 border-amber-200" : "bg-red-50 border-red-200",
                icon: CheckCircle2,
              },
              {
                label: "Evaluation Completion",
                value: `${stats.kpi.evaluation_completion_rate}%`,
                description: "Evaluators who completed review",
                color: stats.kpi.evaluation_completion_rate >= 70 ? "text-emerald-600" : stats.kpi.evaluation_completion_rate >= 40 ? "text-amber-600" : "text-red-500",
                bgColor: stats.kpi.evaluation_completion_rate >= 70 ? "bg-emerald-50 border-emerald-200" : stats.kpi.evaluation_completion_rate >= 40 ? "bg-amber-50 border-amber-200" : "bg-red-50 border-red-200",
                icon: Users,
              },
              {
                label: "Fund Utilization",
                value: `${stats.kpi.fund_utilization_rate}%`,
                description: "Approved / Total requested",
                color: stats.kpi.fund_utilization_rate >= 60 ? "text-emerald-600" : "text-amber-600",
                bgColor: stats.kpi.fund_utilization_rate >= 60 ? "bg-emerald-50 border-emerald-200" : "bg-amber-50 border-amber-200",
                icon: BarChart3,
              },
              {
                label: "Avg. Review Time",
                value: stats.kpi.avg_turnaround_days.rnd_review
                  ? `${stats.kpi.avg_turnaround_days.rnd_review}d`
                  : "N/A",
                description: "R&D review duration",
                color: "text-blue-600",
                bgColor: "bg-blue-50 border-blue-200",
                icon: Clock3,
              },
            ].map((metric, index) => {
              const IconComp = metric.icon;
              return (
                <div
                  key={index}
                  className={`${metric.bgColor} border-2 rounded-2xl p-4 transition-all duration-300 hover:shadow-lg`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <IconComp className={`${metric.color} w-5 h-5`} />
                  </div>
                  <p className="text-2xl font-bold text-slate-800 tabular-nums">{metric.value}</p>
                  <h3 className="text-xs font-semibold text-slate-700 mt-1">{metric.label}</h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">{metric.description}</p>
                </div>
              );
            })}
          </section>

          {/* Turnaround Time Breakdown + Monthly Trends */}
          <section className="flex flex-col lg:flex-row gap-4 lg:gap-6">
            {/* Average Processing Time per Stage */}
            {Object.keys(stats.kpi.avg_turnaround_days).length > 0 && (
              <div className="bg-white shadow-xl rounded-2xl border border-slate-200 overflow-hidden flex-1">
                <div className="p-4 sm:p-5 border-b border-slate-100">
                  <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                    <Clock3 className="w-5 h-5 text-[#C8102E]" />
                    Average Processing Time
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">Days per workflow stage</p>
                </div>
                <div className="p-4 sm:p-5 space-y-3">
                  {[
                    { key: "submission_to_rnd", label: "Submission to R&D", color: "bg-blue-500" },
                    { key: "rnd_review", label: "R&D Review", color: "bg-indigo-500" },
                    { key: "evaluation", label: "Evaluator Assessment", color: "bg-purple-500" },
                    { key: "endorsement", label: "Endorsement Decision", color: "bg-amber-500" },
                    { key: "funding_decision", label: "Funding Decision", color: "bg-emerald-500" },
                  ].map((stage) => {
                    const days = stats.kpi?.avg_turnaround_days[stage.key] || 0;
                    const maxDays = Math.max(
                      ...Object.values(stats.kpi?.avg_turnaround_days || {}).filter((v) => v > 0),
                      1,
                    );
                    return (
                      <div key={stage.key}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-slate-600">{stage.label}</span>
                          <span className="text-xs font-bold text-slate-800">
                            {days > 0 ? `${days} day${days !== 1 ? "s" : ""}` : "No data"}
                          </span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${stage.color} rounded-full transition-all duration-700`}
                            style={{ width: days > 0 ? `${(days / maxDays) * 100}%` : "0%" }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Monthly Trends Chart */}
            {stats.kpi.monthly_trends.length > 0 && (
              <div className="bg-white shadow-xl rounded-2xl border border-slate-200 overflow-hidden flex-1">
                <div className="p-4 sm:p-5 border-b border-slate-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-[#C8102E]" />
                        Monthly Proposal Trends
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">Last 12 months</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                        <span className="text-[10px] text-slate-500">Submitted</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        <span className="text-[10px] text-slate-500">Funded</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                        <span className="text-[10px] text-slate-500">Rejected</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-4 sm:p-5">
                  <div className="w-full h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={stats.kpi.monthly_trends.map((t) => ({
                          ...t,
                          label: t.month.split("-")[1],
                        }))}
                        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                        barGap={2}
                        barSize={12}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis
                          dataKey="label"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: "#64748b", fontSize: 10 }}
                          dy={8}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: "#64748b", fontSize: 11 }}
                          dx={-5}
                          allowDecimals={false}
                        />
                        <RechartsTooltip
                          cursor={{ fill: "transparent" }}
                          contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)", fontSize: 12 }}
                          labelFormatter={(label) => {
                            const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                            const idx = parseInt(label, 10) - 1;
                            return months[idx] || label;
                          }}
                        />
                        <Bar dataKey="submitted" fill="#3b82f6" radius={[3, 3, 0, 0]} name="Submitted" />
                        <Bar dataKey="funded" fill="#22c55e" radius={[3, 3, 0, 0]} name="Funded" />
                        <Bar dataKey="rejected" fill="#f87171" radius={[3, 3, 0, 0]} name="Rejected" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
