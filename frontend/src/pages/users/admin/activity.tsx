import { useState, useEffect, useCallback, useMemo } from "react";
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
  Settings,
  Calendar,
  Download,
} from "lucide-react";
import { ActivityApi, type ActivityLog, type ActivityLogsFilters } from "../../../services/admin/ActivityApi";
import PageLoader from "../../../components/shared/PageLoader";
import { formatDateTime } from "../../../utils/date-formatter";
import { exportToCsv } from "../../../utils/csv-export";

const ACTION_LABELS: Record<string, string> = {
  // Proposal
  proposal_created: "Created a proposal",
  proposal_forwarded_to_rnd: "Forwarded proposal to R&D",
  proposal_forwarded_to_evaluators: "Forwarded proposal to evaluators",
  proposal_revision_requested: "Requested revision from proponent",
  proposal_rejected: "Rejected proposal",
  proposal_endorsed_for_funding: "Endorsed proposal for funding",
  proposal_revision_after_evaluation: "Requested revision after evaluation",
  proposal_rejected_after_evaluation: "Rejected proposal after evaluation",
  proposal_revision_submitted: "Submitted revised proposal",
  proposal_revision_funding: "Requested revision (funding)",
  proposal_rejected_funding: "Rejected at funding stage",
  proposal_status_updated: "Updated proposal status",
  proposal_funded: "Marked proposal funded",
  proposal_auto_distributed: "Auto-distributed proposal to R&D",
  proposal_rnd_reassigned_on_disable: "Reassigned R&D on account disable",
  rnd_transfer_requested: "Requested R&D transfer",
  funding_decision_made: "Made funding decision",
  // Evaluation
  evaluator_assigned: "Assigned evaluator",
  evaluator_accepted: "Accepted evaluation assignment",
  evaluator_declined: "Declined evaluation assignment",
  evaluator_decision_submitted: "Submitted evaluator decision",
  evaluator_extension_requested: "Requested deadline extension",
  evaluator_extension_approved: "Approved extension request",
  evaluator_extension_denied: "Denied extension request",
  evaluator_removed: "Removed evaluator from proposal",
  evaluator_auto_declined_overdue: "Auto-declined (overdue)",
  evaluation_scores_submitted: "Submitted evaluation scores",
  proposal_evaluator_reassigned_on_disable: "Reassigned evaluator on account disable",
  extension_request_handled: "Handled extension request",
  // Project
  quarterly_report_submitted: "Submitted quarterly report",
  quarterly_report_verified: "Verified quarterly report",
  project_report_verified: "Verified project report",
  terminal_report_submitted: "Submitted terminal report",
  terminal_report_verified: "Verified terminal report",
  project_comment_added: "Added comment on report",
  project_expense_added: "Added project expense",
  project_status_updated: "Updated project status",
  project_member_invited: "Invited project member",
  project_member_removed: "Removed project member",
  project_invitation_accepted: "Accepted project invitation",
  project_invitation_declined: "Declined project invitation",
  project_document_uploaded: "Uploaded project document",
  fund_request_created: "Created fund request",
  fund_request_resubmitted: "Resubmitted fund request",
  certificate_issued: "Issued project certificate",
  budget_realignment_requested: "Requested budget realignment",
  budget_realignment_resubmitted: "Resubmitted budget realignment",
  project_extension_requested: "Requested project extension",
  proponent_extension_requested: "Requested proponent extension",
  proponent_extension_approved: "Approved proponent extension",
  proponent_extension_rejected: "Rejected proponent extension",
  // COI guards (security blocks — rare but visible)
  coi_block_verify_report: "Blocked: COI guard on report verification",
  coi_block_update_project_status: "Blocked: COI guard on status update",
  coi_block_review_fund_request: "Blocked: COI guard on fund request review",
  coi_block_generate_certificate: "Blocked: COI guard on certificate issuance",
  coi_block_review_extension: "Blocked: COI guard on extension review",
  coi_block_verify_terminal_report: "Blocked: COI guard on terminal report",
  // Account & auth
  account_created: "Created user account",
  account_updated: "Updated user account",
  account_disabled: "Disabled user account",
  account_enabled: "Enabled user account",
  account_self_registered: "Self-registered account",
  user_invited: "Sent user invitation",
  invite_profile_completed: "Completed invited profile",
  user_logged_in: "Logged in",
  // Settings & content
  late_submission_policy_updated: "Updated late-submission policy",
  evaluation_deadline_updated: "Updated evaluation deadline",
  lookup_created: "Created lookup entry",
  lookup_updated: "Updated lookup entry",
  lookup_deleted: "Deleted lookup entry",
  agency_address_created: "Created agency address",
  agency_address_updated: "Updated agency address",
  agency_address_deleted: "Deleted agency address",
  updated_about: "Updated About page",
  updated_logos: "Updated site logos",
  updated_home: "Updated Home page",
  updated_contacts: "Updated contact info",
  updated_faq: "Updated FAQ",
};

const CATEGORY_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  proposal: { label: "Proposal", color: "bg-blue-100 text-blue-700", icon: FileText },
  evaluation: { label: "Evaluation", color: "bg-purple-100 text-purple-700", icon: ClipboardCheck },
  project: { label: "Project", color: "bg-green-100 text-green-700", icon: FolderOpen },
  account: { label: "Account", color: "bg-amber-100 text-amber-700", icon: Users },
  settings: { label: "Settings", color: "bg-slate-100 text-slate-700", icon: Settings },
};

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-red-100 text-red-700",
  rnd: "bg-indigo-100 text-indigo-700",
  evaluator: "bg-purple-100 text-purple-700",
  proponent: "bg-emerald-100 text-emerald-700",
  co_lead: "bg-teal-100 text-teal-700",
};

/** Badge text: R&D for rnd; otherwise capitalize first letter of each underscore segment (rest lowercase). */
function formatRoleBadge(role: string): string {
  const key = role.trim().toLowerCase();
  if (key === "rnd") return "R&D";
  return key
    .split("_")
    .map((part) => (part ? part.charAt(0).toUpperCase() + part.slice(1).toLowerCase() : ""))
    .filter(Boolean)
    .join(" ");
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Render any detail value; if it's a UUID the backend resolved to a name, show the name. */
function renderDetailValue(value: unknown, resolved?: Record<string, string>): string {
  if (typeof value === "string" && UUID_RE.test(value)) {
    return resolved?.[value] || value;
  }
  if (Array.isArray(value)) {
    return value.map((v) => renderDetailValue(v, resolved)).join(", ");
  }
  if (value && typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
}

/** Humanize a detail key: `rnd_id` → `R&D`, `to_rnd_id` → `To R&D`, fallbacks to Title Case. */
function formatDetailKey(key: string): string {
  const stripped = key.replace(/_id$/, "");
  return stripped
    .split("_")
    .map((part) => (part.toLowerCase() === "rnd" ? "R&D" : part.charAt(0).toUpperCase() + part.slice(1)))
    .join(" ");
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
  return formatDateTime(iso);
}

export default function Activity() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const limit = 20;

  const fetchLogs = useCallback(async () => {
    try {
      const filters: ActivityLogsFilters = { page, limit };
      if (categoryFilter) filters.category = categoryFilter;
      // Date filters — `from` is start-of-day, `to` is end-of-day so the
      // picked day is inclusive on both ends.
      if (fromDate) filters.from = new Date(`${fromDate}T00:00:00`).toISOString();
      if (toDate) filters.to = new Date(`${toDate}T23:59:59.999`).toISOString();

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
  }, [page, categoryFilter, fromDate, toDate]);

  useEffect(() => {
    setLoading(true);
    fetchLogs();
  }, [fetchLogs]);

  // Reset to page 1 whenever the date range changes so we don't land on
  // an out-of-bounds page after narrowing the result set.
  useEffect(() => {
    setPage(1);
  }, [fromDate, toDate]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchLogs();
  };

  // Broadened search: matches user name, raw action, friendly label,
  // target id/type, and stringified details so admins can find things
  // like "actions on proposal 42" or entries whose details mention a term.
  const filteredLogs = useMemo(() => {
    if (!search.trim()) return logs;
    const q = search.trim().toLowerCase();
    return logs.filter((log) => {
      if (log.user_name.toLowerCase().includes(q)) return true;
      if (log.action.toLowerCase().includes(q)) return true;
      if ((ACTION_LABELS[log.action] || "").toLowerCase().includes(q)) return true;
      if (log.target_id && String(log.target_id).toLowerCase().includes(q)) return true;
      if (log.target_type && log.target_type.toLowerCase().includes(q)) return true;
      if (log.user_roles?.some((r) => r.toLowerCase().includes(q))) return true;
      if (log.details && Object.keys(log.details).length > 0) {
        try {
          if (JSON.stringify(log.details).toLowerCase().includes(q)) return true;
        } catch {
          // stringify failed — ignore
        }
      }
      return false;
    });
  }, [logs, search]);

  // CSV export of currently-filtered rows. Uses the same data the user
  // can see, so filters carry through (category + date range + search).
  const handleExportCsv = () => {
    if (filteredLogs.length === 0) return;
    setExporting(true);
    try {
      exportToCsv("activity-logs", filteredLogs, [
        { header: "Time", accessor: (l) => l.created_at },
        { header: "User", accessor: (l) => l.user_name },
        { header: "Roles", accessor: (l) => (l.user_roles || []).join(" / ") },
        { header: "Action", accessor: (l) => ACTION_LABELS[l.action] || l.action },
        { header: "Category", accessor: (l) => l.category },
        { header: "Target ID", accessor: (l) => l.target_id ?? "" },
        { header: "Target Type", accessor: (l) => l.target_type ?? "" },
        { header: "Details", accessor: (l) => l.details ?? "" },
      ]);
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return <PageLoader mode="activity" />;
  }

  return (
    <div className="min-h-screen w-full max-w-[1400px] mx-auto px-5 sm:px-8 lg:px-10 xl:px-12 2xl:px-16 py-8 lg:py-10 bg-gradient-to-br from-slate-50 to-slate-100 animate-fade-in flex flex-col gap-4 lg:gap-6">
      <header>
        <h1 className="text-2xl font-bold text-[#C8102E]">Activity Logs</h1>
        <p className="text-sm text-gray-600 mt-1 lg:text-base">
          Track all user actions across the system
        </p>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:gap-4">
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
                <span className="text-xs font-medium text-gray-600">{config.label}</span>
              </div>
              <p className="text-xl font-bold text-gray-900">{count}</p>
            </button>
          );
        })}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col sm:flex-row gap-2 flex-1">
          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search user, action, target, role, details..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20 focus:border-[#C8102E]"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white">
              <Calendar className="w-4 h-4 text-gray-400" />
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                max={toDate || undefined}
                className="text-sm text-gray-700 focus:outline-none bg-transparent"
                aria-label="From date"
              />
              <span className="text-xs text-gray-400">→</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                min={fromDate || undefined}
                className="text-sm text-gray-700 focus:outline-none bg-transparent"
                aria-label="To date"
              />
            </div>
            {(fromDate || toDate) && (
              <button
                onClick={() => { setFromDate(""); setToDate(""); }}
                className="text-xs text-gray-500 hover:text-[#C8102E] transition-colors"
              >
                Clear dates
              </button>
            )}
          </div>
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
            onClick={handleExportCsv}
            disabled={exporting || filteredLogs.length === 0}
            className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-[#C8102E] bg-white border border-[#C8102E]/30 rounded-xl hover:bg-[#C8102E]/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title={filteredLogs.length === 0 ? "No rows to export" : "Export currently-visible rows to CSV"}
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
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
        {filteredLogs.length === 0 ? (
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
                        <div className="text-xs text-gray-400">{formatDateTime(log.created_at)}</div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="text-sm font-medium text-gray-900">{log.user_name}</div>
                        <div className="flex gap-1 mt-0.5 flex-wrap">
                          {log.user_roles.map((role) => (
                            <span
                              key={role}
                              className={`inline-block px-1.5 py-0.5 text-[10px] font-medium rounded ${
                                ROLE_COLORS[role.toLowerCase()] || "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {formatRoleBadge(role)}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="text-sm text-gray-900">
                          {ACTION_LABELS[log.action] || log.action.replace(/_/g, " ")}
                        </div>
                        {log.details && Object.keys(log.details).length > 0 && (
                          <div
                            className="text-xs text-gray-400 mt-0.5 max-w-xs truncate"
                            title={JSON.stringify(log.details, null, 2)}
                          >
                            {Object.entries(log.details)
                              .filter(([, v]) => v !== null && v !== undefined)
                              .map(([k, v]) => `${formatDetailKey(k)}: ${renderDetailValue(v, log.resolved_names)}`)
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
                          (() => {
                            const isUuid = UUID_RE.test(log.target_id);
                            const resolvedName = isUuid ? log.resolved_names?.[log.target_id] : undefined;
                            const typeLabel = log.target_type
                              ? log.target_type === "rnd"
                                ? "R&D"
                                : log.target_type.charAt(0).toUpperCase() + log.target_type.slice(1)
                              : null;
                            if (resolvedName) {
                              return (
                                <div title={log.target_id}>
                                  <span className="text-sm text-gray-700">
                                    {typeLabel ? `${typeLabel}: ` : ""}
                                    {resolvedName}
                                  </span>
                                </div>
                              );
                            }
                            return (
                              <div title={isUuid ? log.target_id : undefined}>
                                <span className="text-sm text-gray-700">
                                  {typeLabel ? `${typeLabel} ` : ""}#{isUuid ? `${log.target_id.slice(0, 8)}…` : log.target_id}
                                </span>
                              </div>
                            );
                          })()
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
