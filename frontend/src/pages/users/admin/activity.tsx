import { useState, useEffect, useCallback } from "react";
import {
  ScrollText,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Filter,
  FileText,
  Users,
  FolderOpen,
  ClipboardCheck,
} from "lucide-react";
import { ActivityApi, type ActivityLog, type ActivityLogsFilters } from "../../../services/admin/ActivityApi";

const ACTION_LABELS: Record<string, string> = {
  // Proposal
  proposal_created: "Created a proposal",
  proposal_forwarded_to_rnd: "Forwarded proposal to RND",
  proposal_forwarded_to_evaluators: "Forwarded proposal to evaluators",
  proposal_revision_requested: "Requested revision from proponent",
  proposal_rejected: "Rejected proposal",
  proposal_endorsed_for_funding: "Endorsed proposal for funding",
  proposal_revision_after_evaluation: "Requested revision after evaluation",
  proposal_rejected_after_evaluation: "Rejected proposal after evaluation",
  proposal_revision_submitted: "Submitted revised proposal",
  proposal_status_updated: "Updated proposal status",
  // Evaluation
  evaluator_accepted: "Accepted evaluation assignment",
  evaluator_declined: "Declined evaluation assignment",
  evaluator_extension_requested: "Requested deadline extension",
  evaluator_extension_approved: "Approved extension request",
  evaluator_extension_denied: "Denied extension request",
  evaluator_removed: "Removed evaluator from proposal",
  evaluation_scores_submitted: "Submitted evaluation scores",
  // Project
  quarterly_report_submitted: "Submitted quarterly report",
  quarterly_report_verified: "Verified quarterly report",
  project_comment_added: "Added comment on report",
  project_expense_added: "Added project expense",
  project_status_updated: "Updated project status",
  project_member_invited: "Invited project member",
  project_member_removed: "Removed project member",
  // Account
  account_created: "Created user account",
  account_updated: "Updated user account",
  account_disabled: "Disabled user account",
  account_enabled: "Enabled user account",
  user_invited: "Sent user invitation",
};

const CATEGORY_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  proposal: { label: "Proposal", color: "bg-blue-100 text-blue-700", icon: FileText },
  evaluation: { label: "Evaluation", color: "bg-purple-100 text-purple-700", icon: ClipboardCheck },
  project: { label: "Project", color: "bg-green-100 text-green-700", icon: FolderOpen },
  account: { label: "Account", color: "bg-amber-100 text-amber-700", icon: Users },
};

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-red-100 text-red-700",
  rnd: "bg-indigo-100 text-indigo-700",
  evaluator: "bg-purple-100 text-purple-700",
  proponent: "bg-emerald-100 text-emerald-700",
  lead_proponent: "bg-teal-100 text-teal-700",
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(iso);
}

export default function Activity() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const limit = 20;

  const fetchLogs = useCallback(async () => {
    try {
      const filters: ActivityLogsFilters = { page, limit };
      if (categoryFilter) filters.category = categoryFilter;

      const response = await ActivityApi.getLogs(filters);
      setLogs(response.data || []);
      setTotalPages(response.pagination.total_pages);
      setTotal(response.pagination.total);
    } catch (err) {
      console.error("Failed to fetch activity logs:", err);
      setLogs([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, categoryFilter]);

  useEffect(() => {
    setLoading(true);
    fetchLogs();
  }, [fetchLogs]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchLogs();
  };

  const filteredLogs = search
    ? logs.filter(
        (log) =>
          log.user_name.toLowerCase().includes(search.toLowerCase()) ||
          log.action.toLowerCase().includes(search.toLowerCase()) ||
          (ACTION_LABELS[log.action] || "").toLowerCase().includes(search.toLowerCase())
      )
    : logs;

  return (
    <div className="p-6 lg:p-8 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 bg-red-50 rounded-lg">
            <ScrollText className="w-6 h-6 text-[#C8102E]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Activity Logs</h1>
            <p className="text-sm text-gray-500">
              Track all user actions across the system
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {Object.entries(CATEGORY_CONFIG).map(([key, config]) => {
          const count = logs.filter((l) => l.category === key).length;
          const Icon = config.icon;
          return (
            <button
              key={key}
              onClick={() => {
                setCategoryFilter(categoryFilter === key ? "" : key);
                setPage(1);
              }}
              className={`p-4 rounded-xl border transition-all cursor-pointer ${
                categoryFilter === key
                  ? "border-[#C8102E] bg-red-50 shadow-sm"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Icon className="w-4 h-4 text-gray-500" />
                <span className="text-xs font-medium text-gray-500 uppercase">{config.label}</span>
              </div>
              <p className="text-xl font-bold text-gray-900">{count}</p>
            </button>
          );
        })}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by user or action..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20 focus:border-[#C8102E]"
          />
        </div>
        <div className="flex items-center gap-2">
          {categoryFilter && (
            <button
              onClick={() => {
                setCategoryFilter("");
                setPage(1);
              }}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Filter className="w-3.5 h-3.5" />
              Clear filter
            </button>
          )}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white bg-[#C8102E] rounded-xl hover:bg-[#A00D24] transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="w-6 h-6 text-gray-400 animate-spin" />
            <span className="ml-3 text-gray-500">Loading logs...</span>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <ScrollText className="w-10 h-10 mb-3" />
            <p className="text-sm">No activity logs found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">
                    Time
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">
                    User
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">
                    Action
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">
                    Category
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">
                    Target
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map((log) => {
                  const catConfig = CATEGORY_CONFIG[log.category] || {
                    label: log.category,
                    color: "bg-gray-100 text-gray-700",
                    icon: FileText,
                  };
                  return (
                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{timeAgo(log.created_at)}</div>
                        <div className="text-xs text-gray-400">{formatDate(log.created_at)}</div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="text-sm font-medium text-gray-900">{log.user_name}</div>
                        <div className="flex gap-1 mt-0.5 flex-wrap">
                          {log.user_roles.map((role) => (
                            <span
                              key={role}
                              className={`inline-block px-1.5 py-0.5 text-[10px] font-medium rounded ${
                                ROLE_COLORS[role] || "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {role}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="text-sm text-gray-900">
                          {ACTION_LABELS[log.action] || log.action.replace(/_/g, " ")}
                        </div>
                        {log.details && Object.keys(log.details).length > 0 && (
                          <div className="text-xs text-gray-400 mt-0.5 max-w-xs truncate">
                            {Object.entries(log.details)
                              .filter(([, v]) => v !== null && v !== undefined)
                              .map(([k, v]) => `${k}: ${typeof v === "object" ? JSON.stringify(v) : v}`)
                              .join(" | ")}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${catConfig.color}`}>
                          {catConfig.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        {log.target_id ? (
                          <div>
                            <span className="text-sm text-gray-700">#{log.target_id}</span>
                            {log.target_type && (
                              <span className="text-xs text-gray-400 ml-1">({log.target_type})</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-300">--</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-slate-50/30">
            <p className="text-sm text-gray-500">
              Showing page {page} of {totalPages} ({total} total)
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const start = Math.max(1, Math.min(page - 2, totalPages - 4));
                const num = start + i;
                if (num > totalPages) return null;
                return (
                  <button
                    key={num}
                    onClick={() => setPage(num)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                      page === num
                        ? "bg-[#C8102E] text-white"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {num}
                  </button>
                );
              })}
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
