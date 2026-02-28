import { useState, useEffect } from 'react';
import { useAuthContext } from '../../../context/AuthContext';
import { ActivityApi } from '../../../services/admin/ActivityApi';
import type { DashboardStats } from '../../../services/admin/ActivityApi';
import {
  Users,
  FileText,
  CheckCircle,
  Clock,
  BarChart3,
  Shield,
  Activity,
  FolderOpen,
  Loader2,
} from "lucide-react";

export default function DashboardAdmin() {
  const { user } = useAuthContext();
  const [isReturningUser] = useState(() => localStorage.getItem('admin_welcome_seen') === 'true');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isReturningUser) {
      localStorage.setItem('admin_welcome_seen', 'true');
    }
  }, [isReturningUser]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await ActivityApi.getDashboardStats();
        setStats(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load dashboard stats');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

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
        { label: "R&D Review", count: stats.proposals.review_rnd, color: "bg-amber-100 text-amber-700 border-amber-200" },
        { label: "Under Evaluation", count: stats.proposals.under_evaluation, color: "bg-blue-100 text-blue-700 border-blue-200" },
        { label: "Revision", count: stats.proposals.revision_rnd, color: "bg-orange-100 text-orange-700 border-orange-200" },
        { label: "Rejected", count: stats.proposals.rejected_rnd, color: "bg-red-100 text-red-700 border-red-200" },
        { label: "Endorsed", count: stats.proposals.endorsed_for_funding, color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
        { label: "Funded", count: stats.proposals.funded, color: "bg-green-100 text-green-700 border-green-200" },
      ]
    : [];

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
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-[#C8102E]" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-red-500">{error || 'Failed to load dashboard'}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-6 p-4 sm:p-6 h-full overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 pt-10 sm:pt-0 pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#C8102E] leading-tight min-h-[32px]">
              {isReturningUser ? 'Welcome back, ' : 'Welcome to RDEC, '}
              <span className="text-black">{user?.first_name || 'Admin'}</span>!
            </h1>
            <p className="text-slate-600 mt-2 text-sm leading-relaxed">
              System overview and real-time statistics
            </p>
          </div>
        </div>
      </header>

      {/* Stats Cards */}
      <section className="flex-shrink-0" aria-labelledby="stats-heading">
        <h2 id="stats-heading" className="sr-only">System Statistics</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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

      {/* Main Content Section */}
      <section className="flex flex-col lg:flex-row gap-4 lg:gap-6 flex-1 overflow-hidden">
        {/* Proposal Pipeline Table */}
        <div
          className="bg-white shadow-xl rounded-2xl border border-slate-200 overflow-hidden flex-1 flex flex-col"
          aria-labelledby="pipeline-heading"
        >
          <div className="p-4 border-b border-slate-200 bg-slate-50">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h3
                id="pipeline-heading"
                className="text-lg font-bold text-slate-800 flex items-center gap-2"
              >
                <Activity className="w-5 h-5 text-[#C8102E]" />
                Proposal Pipeline
              </h3>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <BarChart3 className="w-4 h-4" />
                <span>Status breakdown</span>
              </div>
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
        <div className="bg-white shadow-xl rounded-2xl border border-slate-200 p-4 sm:p-6 w-full lg:w-80 flex flex-col">
          <h3 className="text-lg font-bold text-slate-800 mb-8 flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#C8102E]" />
            System Status
          </h3>

          <div className="space-y-6 flex-1 flex flex-col justify-center">
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
          <div className="mt-6 pt-6 border-t border-slate-200">
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
