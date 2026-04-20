import axios from "axios";
import { api } from "../utils/axios";
import { formatDate } from "../utils/date-formatter";
import { type Project, type ProjectStatus } from "../types/InterfaceProject";

// ─── Report File Upload Constants ────────────────────────────────────
export const REPORT_MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
export const REPORT_ALLOWED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
];
export const REPORT_ALLOWED_EXTENSIONS = ".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp";

export function validateReportFile(file: File): string | null {
  if (file.size > REPORT_MAX_FILE_SIZE) {
    const sizeLabel = file.size < 1024 * 1024
      ? `${(file.size / 1024).toFixed(0)} KB`
      : `${(file.size / 1024 / 1024).toFixed(1)} MB`;
    return `File "${file.name}" exceeds the 5 MB limit (${sizeLabel}).`;
  }
  if (!REPORT_ALLOWED_TYPES.includes(file.type)) {
    return `File "${file.name}" has an unsupported type. Allowed: PDF, DOC, DOCX, PNG, JPG, WEBP.`;
  }
  return null;
}

export async function getReportUploadUrl(
  filename: string,
  contentType: string,
  fileSize: number
): Promise<{ uploadUrl: string; fileUrl: string }> {
  const { data } = await api.get("/project/report-upload-url", {
    params: { filename, contentType, fileSize },
    withCredentials: true,
  });
  return data as { uploadUrl: string; fileUrl: string };
}

export async function uploadReportFileToS3(uploadUrl: string, file: File): Promise<void> {
  await axios.put(uploadUrl, file, {
    headers: { "Content-Type": file.type },
  });
}

/**
 * Upload a single report file and return its public URL.
 * Validates size (5 MB) and type before uploading.
 */
export async function uploadReportFile(file: File): Promise<string> {
  const error = validateReportFile(file);
  if (error) throw new Error(error);

  const { uploadUrl, fileUrl } = await getReportUploadUrl(file.name, file.type, file.size);
  await uploadReportFileToS3(uploadUrl, file);
  return fileUrl;
}

// ─── Backend Response Interfaces ────────────────────────────────────

export interface ApiFundedProject {
  id: number;
  proposal_id: number;
  project_lead_id: string;
  status: "on_going" | "completed" | "on_hold" | "blocked";
  funded_date: string;
  created_at: string;
  // Aggregates computed server-side by getFundedProjects. Populated for the list/CSV view;
  // the detail modal has its own, more authoritative calls for budget summary.
  completion_percentage: number;
  reports_count: number;
  reports_submitted_count: number;
  verified_reports_count: number;
  overdue_reports_count: number;
  pending_fund_requests_count: number;
  pending_extensions_count: number;
  terminal_report_verified: boolean;
  co_leads: { first_name: string | null; last_name: string | null }[];
  total_budget: number | null;
  approved_amount: number;
  utilized_amount: number;
  remaining_amount: number | null;
  last_activity_at: string | null;
  proposal: {
    id: number;
    project_title: string;
    program_title: string;
    plan_start_date: string;
    plan_end_date: string;
    department: { id: number; name: string } | null;
    sector: { id: number; name: string } | null;
  };
  project_lead: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  project_reports: {
    id: number;
    quarterly_report: string;
    status: string;
    progress: number;
    created_at: string;
  }[];
}

export type ComplianceDocStatus =
  | "not_uploaded"
  | "pending_verification"
  | "verified"
  | "rejected";

export interface ApiProjectDetail {
  id: number;
  proposal_id: number;
  project_lead_id: string;
  status: "on_going" | "completed" | "on_hold" | "blocked";
  funded_date: string;
  created_at: string;
  certificate_issued_at: string | null;
  certificate_issued_by: string | null;
  certificate_issuer: { id: string; first_name: string; last_name: string } | null;
  // DOST Form 4/5 uploads — populated post-funding by the proponent; null until uploaded.
  moa_file_url: string | null;
  agency_certification_file_url: string | null;
  // Verification state (Phase: compliance-doc verification). The fund-request
  // gate requires BOTH statuses to be 'verified'; proponent re-upload is only
  // allowed from 'not_uploaded' or 'rejected'.
  moa_status: ComplianceDocStatus;
  moa_verified_by: string | null;
  moa_verified_at: string | null;
  moa_review_note: string | null;
  agency_cert_status: ComplianceDocStatus;
  agency_cert_verified_by: string | null;
  agency_cert_verified_at: string | null;
  agency_cert_review_note: string | null;
  proposal: {
    id: number;
    project_title: string;
    program_title: string;
    plan_start_date: string;
    plan_end_date: string;
    duration: number | null;
    email: string | null;
    phone: string | null;
    work_plan_file_url: string | null;
    implementation_site: string | null;
    department: { id: number; name: string } | null;
    sector: { id: number; name: string } | null;
    discipline: { id: number; name: string } | null;
    agency: { id: number; name: string; street: string; barangay: string; city: string } | null;
    estimated_budget: { id: number; source: string; budget: string; item: string; amount: number }[];
  };
  project_lead: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  project_reports: ApiProjectReport[];
}

export interface ApiProjectReport {
  id: number;
  funded_project_id: number;
  year_number: number; // Phase 2A — multi-year scoping. Defaults to 1 for legacy single-year projects.
  quarterly_report: string;
  status: "submitted" | "verified" | "overdue" | "rejected";
  progress: number;
  comment: string | null;
  report_file_url: string[] | null;
  submitted_by_proponent_id: string;
  created_at: string;
  project_expenses: ApiProjectExpense[];
  // Populated when R&D rejects with a reason; null until then.
  review_note?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
}

export interface ApiProjectExpense {
  id: number;
  expenses: number;
  desription: string; // matches DB typo
  fund_request_item_id: number | null;
  approved_amount: number | null;
  created_at: string;
}

// ─── Status Mapping ─────────────────────────────────────────────────

const STATUS_MAP: Record<string, ProjectStatus> = {
  on_going: "Active",
  completed: "Completed",
  on_hold: "On Hold",
  blocked: "Delayed",
};

export function mapBackendStatus(backendStatus: string): ProjectStatus {
  return STATUS_MAP[backendStatus] || "Active";
}

// ─── File URL Helpers ───────────────────────────────────────────────

/**
 * Extract the original filename from an S3 report file URL.
 * URL format: https://{bucket}.s3.amazonaws.com/reports/uploads/{userId}/{timestamp}-{filename}
 */
export function extractFilenameFromUrl(url: string): string {
  try {
    const path = new URL(url).pathname;
    const segment = path.split('/').pop() || '';
    // Remove timestamp prefix: "1712748000000-filename.pdf" → "filename.pdf"
    const match = segment.match(/^\d+-(.+)$/);
    return decodeURIComponent(match ? match[1] : segment);
  } catch {
    return 'File';
  }
}

/** File type prefix labels used during upload tagging */
const FILE_TYPE_LABELS: Record<string, string> = {
  QR: 'Quarterly Report',
  TR: 'Terminal Report',
  RC: 'Receipt',
};

/**
 * Extract file type label and clean filename from a tagged S3 URL.
 * Tagged files have prefixes like: QR__report.pdf, TR__output.pdf, RC1__receipt.pdf
 * Untagged (legacy) files just return the raw filename with no label.
 */
export function extractFileInfo(url: string): { label: string; filename: string } {
  const rawName = extractFilenameFromUrl(url);
  const match = rawName.match(/^(QR|TR|RC)(\d*)__(.+)$/);
  if (match) {
    const [, type, num, name] = match;
    const baseLabel = FILE_TYPE_LABELS[type] || type;
    const label = num ? `${baseLabel} #${num}` : baseLabel;
    return { label, filename: name };
  }
  return { label: '', filename: rawName };
}

/**
 * Group proof files by their type prefix for categorized display.
 * Matches the proponent upload sections: Quarterly Report, Terminal Report, Receipts.
 */
export function groupProofFiles(urls: string[]): { category: string; files: { url: string; filename: string }[] }[] {
  const groups: Record<string, { url: string; filename: string }[]> = {
    'Quarterly Accomplishment Report': [],
    'Terminal Report (Expected Outputs)': [],
    'Additional Proofs / Receipts': [],
  };

  for (const url of urls) {
    const rawName = extractFilenameFromUrl(url);
    const match = rawName.match(/^(QR|TR|RC)(\d*)__(.+)$/);
    if (match) {
      const [, type, , name] = match;
      if (type === 'QR') groups['Quarterly Accomplishment Report'].push({ url, filename: name });
      else if (type === 'TR') groups['Terminal Report (Expected Outputs)'].push({ url, filename: name });
      else groups['Additional Proofs / Receipts'].push({ url, filename: name });
    } else {
      groups['Additional Proofs / Receipts'].push({ url, filename: rawName });
    }
  }

  return Object.entries(groups)
    .filter(([, files]) => files.length > 0)
    .map(([category, files]) => ({ category, files }));
}

// ─── Quarter Helpers ────────────────────────────────────────────────

const QUARTER_LABELS: Record<string, string> = {
  q1_report: "Q1 Report",
  q2_report: "Q2 Report",
  q3_report: "Q3 Report",
  q4_report: "Q4 Report",
};

const ALL_QUARTERS = ["q1_report", "q2_report", "q3_report", "q4_report"];

/** A single reporting period — year + quarter. Mirrors backend Period type. */
export type DisplayPeriod = { year_number: number; quarter: string };

/** Total reporting periods this project has — ceil(duration/3), clamped 1..40. */
export function computeTotalPeriods(durationMonths: number | null | undefined): number {
  const months = Number(durationMonths);
  if (!Number.isFinite(months) || months <= 0) return 4;
  return Math.min(40, Math.max(1, Math.ceil(months / 3)));
}

/** All applicable {year, quarter} periods for a project of this duration. */
export function getApplicablePeriods(durationMonths: number | null | undefined): DisplayPeriod[] {
  const total = computeTotalPeriods(durationMonths);
  return Array.from({ length: total }, (_, i) => {
    const year = Math.floor(i / 4) + 1;
    const quarter = ALL_QUARTERS[i % 4];
    return { year_number: year, quarter };
  });
}

/** Legacy Y1-only variant kept for any caller that hasn't migrated yet. */
export function getApplicableQuarters(durationMonths: number | null | undefined): string[] {
  return getApplicablePeriods(durationMonths)
    .filter((p) => p.year_number === 1)
    .map((p) => p.quarter);
}

/** Stable string key for a (year, quarter) pair — used for Map lookups and React keys. */
export function periodKey(p: DisplayPeriod): string {
  return `${p.year_number}_${p.quarter}`;
}

export function getQuarterLabel(quarterKey: string): string {
  return QUARTER_LABELS[quarterKey] || quarterKey;
}

/** Display label for a period. Single-year → "Q1 Report"; multi-year → "Y2 Q1". */
export function getPeriodLabel(p: DisplayPeriod, isMultiYear: boolean): string {
  const qShort = p.quarter.replace(/^q(\d)_report$/, "Q$1");
  return isMultiYear ? `Y${p.year_number} ${qShort}` : getQuarterLabel(p.quarter);
}

// ─── Transform: Backend → Frontend Project ──────────────────────────

export function transformToProject(fp: ApiFundedProject): Project {
  return {
    id: String(fp.id),
    backendId: fp.id,
    backendStatus: fp.status,
    projectId: `PROJ-${fp.id}`,
    title: fp.proposal?.project_title || "Untitled Project",
    description: fp.proposal?.program_title || "",
    principalInvestigator: fp.project_lead
      ? `${fp.project_lead.first_name} ${fp.project_lead.last_name}`
      : "Unknown",
    department: fp.proposal?.department?.name || "Unassigned",
    researchArea: fp.proposal?.sector?.name || "",
    startDate: fp.proposal?.plan_start_date || fp.funded_date || "",
    endDate: fp.proposal?.plan_end_date || "",
    // Budget now populated from the enriched list query. Falls back to 0 for legacy
    // projects with neither an active budget version nor a legacy estimated_budget row.
    budget: fp.total_budget ?? 0,
    status: mapBackendStatus(fp.status),
    completionPercentage: fp.completion_percentage || 0,
    lastModified: fp.created_at || "",
    overdueReportsCount: fp.overdue_reports_count ?? 0,
    pendingFundRequestsCount: fp.pending_fund_requests_count ?? 0,

    // Extended fields for CSV export.
    coLeads: (fp.co_leads ?? []).map((c) => ({
      firstName: c.first_name,
      lastName: c.last_name,
    })),
    fundedDate: fp.funded_date ?? null,
    reportsSubmittedCount: fp.reports_submitted_count ?? 0,
    verifiedReportsCount: fp.verified_reports_count ?? 0,
    pendingExtensionsCount: fp.pending_extensions_count ?? 0,
    terminalReportVerified: fp.terminal_report_verified ?? false,
    totalBudget: fp.total_budget ?? null,
    approvedAmount: fp.approved_amount ?? 0,
    utilizedAmount: fp.utilized_amount ?? 0,
    remainingAmount: fp.remaining_amount ?? null,
    lastActivityAt: fp.last_activity_at ?? null,
  };
}

// ─── Display Report Interface (for detail modal) ───────────────────

export interface DisplayReport {
  id: string; // Format: "${year_number}_${quarterKey}" — unique across all years.
  backendReportId: number | null; // null for placeholder reports
  year_number: number; // Phase 2A — which year this report belongs to.
  quarterKey: string; // Raw quarter enum value (e.g. "q1_report").
  quarter: string; // Display label ("Q1 Report" for single-year, "Y2 Q1" for multi-year).
  dueDate: string;
  status: "Locked" | "Due" | "Submitted" | "Verified" | "Overdue" | "Rejected";
  progress: number;
  expenses: { id: string; description: string; amount: number; approvedAmount: number | null }[];
  totalExpense: number;
  totalApproved: number;
  proofs: string[];
  submittedBy?: string;
  dateSubmitted?: string;
  // R&D's reason when status === 'Rejected'. Surfaced in the red banner on the proponent page.
  reviewNote?: string | null;
}

export interface ProjectDetailData {
  reports: DisplayReport[];
  totalBudget: number;
  certificateIssuedAt: string | null;
  certificateIssuedByName: string | null;
}

/**
 * Build display reports from backend project detail data.
 * Creates placeholders for quarters that don't have a report yet.
 */
export function buildDisplayReports(
  detail: ApiProjectDetail,
  _currentUserId: string
): ProjectDetailData {
  const existingReports = detail.project_reports || [];
  // Phase 2A: key by (year, quarter) instead of quarter alone so a 24-month
  // project can have Y1Q1 and Y2Q1 as distinct reports.
  const reportByPeriod = new Map<string, ApiProjectReport>();
  for (const r of existingReports) {
    const year = r.year_number ?? 1; // Legacy rows default to Y1 via DB DEFAULT
    reportByPeriod.set(`${year}_${r.quarterly_report}`, r);
  }

  const startDate = detail.proposal?.plan_start_date
    ? new Date(detail.proposal.plan_start_date)
    : new Date(detail.funded_date || detail.created_at);

  const applicablePeriods = getApplicablePeriods(detail.proposal?.duration);
  const isMultiYear = applicablePeriods.some((p) => p.year_number > 1);

  const now = new Date();
  let lastSubmittedIndex = -1;
  applicablePeriods.forEach((p, i) => {
    if (reportByPeriod.has(periodKey(p))) lastSubmittedIndex = i;
  });

  const reports: DisplayReport[] = applicablePeriods.map((p, i) => {
    const key = periodKey(p);
    const apiReport = reportByPeriod.get(key);
    // Due dates climb monotonically with period_index (3 months each). Month 12 = Y1Q4 end, Month 15 = Y2Q1 end, etc.
    const dueDateObj = new Date(startDate);
    dueDateObj.setMonth(dueDateObj.getMonth() + (i + 1) * 3);
    const dueDate = dueDateObj.toISOString().split("T")[0];
    const label = getPeriodLabel(p, isMultiYear);

    if (apiReport) {
      const statusMap: Record<string, DisplayReport["status"]> = {
        submitted: "Submitted",
        verified: "Verified",
        overdue: "Overdue",
        rejected: "Rejected",
      };

      const expenses = (apiReport.project_expenses || []).map((e) => ({
        id: String(e.id),
        description: e.desription || "Expense", // handle DB typo
        amount: e.expenses,
        approvedAmount: e.approved_amount ?? null,
      }));

      const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);
      const totalApproved = expenses.reduce((sum, e) => sum + (e.approvedAmount ?? e.amount), 0);

      return {
        id: key,
        backendReportId: apiReport.id,
        year_number: p.year_number,
        quarterKey: p.quarter,
        quarter: label,
        dueDate,
        status: statusMap[apiReport.status] || "Submitted",
        progress: apiReport.progress || 0,
        expenses,
        totalExpense,
        totalApproved,
        proofs: apiReport.report_file_url || [],
        submittedBy: undefined,
        dateSubmitted: apiReport.created_at
          ? formatDate(apiReport.created_at)
          : undefined,
        reviewNote: apiReport.review_note ?? null,
      };
    }

    // Placeholder (no report yet). Sequence gate: can only be "Due" if all prior periods
    // have reports (including rejected ones — they're still submitted).
    const isDue = i === lastSubmittedIndex + 1 && dueDateObj <= now;
    const isOverdue = i <= lastSubmittedIndex + 1 && dueDateObj < now;
    const placeholderStatus: DisplayReport["status"] =
      isOverdue && i === lastSubmittedIndex + 1 ? "Due" : i > lastSubmittedIndex + 1 ? "Locked" : "Due";

    if (detail.status === "completed") {
      return {
        id: key,
        backendReportId: null,
        year_number: p.year_number,
        quarterKey: p.quarter,
        quarter: label,
        dueDate,
        status: "Locked",
        progress: 0,
        expenses: [],
        totalExpense: 0,
        totalApproved: 0,
        proofs: [],
      };
    }

    return {
      id: key,
      backendReportId: null,
      year_number: p.year_number,
      quarterKey: p.quarter,
      quarter: label,
      dueDate,
      status: isDue || placeholderStatus === "Due" ? "Due" : "Locked",
      progress: 0,
      expenses: [],
      totalExpense: 0,
      totalApproved: 0,
      proofs: [],
      messages: [],
    };
  });

  // Calculate total budget from estimated_budget (sum all amount fields)
  const budgets = detail.proposal?.estimated_budget || [];
  const totalBudget = budgets.reduce(
    (sum, b) => sum + (Number(b.amount) || 0),
    0
  );

  const issuer = detail.certificate_issuer;
  const issuerName = issuer ? `${issuer.first_name || ""} ${issuer.last_name || ""}`.trim() : null;

  return {
    reports,
    totalBudget,
    certificateIssuedAt: detail.certificate_issued_at || null,
    certificateIssuedByName: issuerName,
  };
}

// ─── Cache ──────────────────────────────────────────────────────────

const PROJECT_CACHE_TTL = 30 * 1000; // 30 seconds
const projectCache: Record<string, { data: any; timestamp: number }> = {};

function getCached<T>(key: string): T | null {
  const entry = projectCache[key];
  if (entry && Date.now() - entry.timestamp < PROJECT_CACHE_TTL) {
    return entry.data as T;
  }
  return null;
}

function setCache(key: string, data: any): void {
  projectCache[key] = { data, timestamp: Date.now() };
}

/** Clear cached project data after mutations */
export function invalidateProjectCache(): void {
  for (const key of Object.keys(projectCache)) {
    delete projectCache[key];
  }
}

// ─── API Functions ──────────────────────────────────────────────────

export async function fetchFundedProjects(
  role?: string
): Promise<ApiFundedProject[]> {
  // Intentionally NOT cached. The module-level `projectCache` is keyed by role only
  // ("funded:proponent") with no user scope, so if User A views as proponent then logs
  // out and User B logs in within the 30s TTL, User B would briefly see User A's list.
  // The backend is the real authority on what each user can see — skip the cache here
  // and always refetch.
  const params: Record<string, string> = {};
  if (role) params.role = role;

  const { data } = await api.get<{ data: ApiFundedProject[] }>(
    "/project/funded",
    { params, withCredentials: true }
  );
  return data.data;
}

export async function fetchProjectDetail(
  projectId: number
): Promise<ApiProjectDetail> {
  const cacheKey = `detail:${projectId}`;
  const cached = getCached<ApiProjectDetail>(cacheKey);
  if (cached) return cached;

  let response;
  try {
    response = await api.get<{ data: ApiProjectDetail }>(
      "/project/view",
      { params: { project_id: projectId }, withCredentials: true }
    );
  } catch (err: any) {
    // Log the actual backend error body so we can see the Supabase message
    console.error("[fetchProjectDetail] Backend error body:", err?.response?.data);
    throw err;
  }
  setCache(cacheKey, response.data.data);
  return response.data.data;
}

export async function verifyReport(
  reportId: number
): Promise<void> {
  await api.post(
    "/project/verify-report",
    { report_id: reportId },
    { withCredentials: true }
  );
  invalidateProjectCache();
}

// R&D returns a quarterly report to the proponent with a required note. Triggers a
// notification + email; the proponent then sees a red banner with the reason on their
// monitoring page and can edit-and-resubmit via the normal report form.
export async function rejectReport(
  reportId: number,
  reviewNote: string
): Promise<void> {
  await api.post(
    "/project/reject-report",
    { report_id: reportId, review_note: reviewNote },
    { withCredentials: true }
  );
  invalidateProjectCache();
}

export async function updateProjectStatus(
  projectId: number,
  status: "on_going" | "completed" | "on_hold" | "blocked",
  updatedById: string
): Promise<void> {
  await api.post(
    "/project/update-status",
    { project_id: projectId, status, updated_by_id: updatedById },
    { withCredentials: true }
  );
  invalidateProjectCache();
}

// ─── Budget Summary Types ───────────────────────────────────────────

export interface ApiBudgetSummary {
  total_budget: number;
  total_approved: number;
  total_pending: number;
  remaining: number;
  total_actual_spent: number;
  total_for_return: number;
  budget_by_category: { ps: number; mooe: number; co: number };
  approved_by_category: { ps: number; mooe: number; co: number };
  pending_by_category: { ps: number; mooe: number; co: number };
}

// ─── Fund Request Types ─────────────────────────────────────────────

export interface ApiFundRequestItem {
  id: number;
  fund_request_id: number;
  budget_item_id: number | null; // Phase 4 LIB — links each fund-request line to a budget item.
  item_name: string;
  amount: number;
  description: string | null;
  category: "ps" | "mooe" | "co";
  created_at: string;
}

export interface ApiFundRequest {
  id: number;
  funded_project_id: number;
  year_number: number; // Phase 2A — multi-year scoping. Defaults to 1 for legacy rows.
  quarterly_report: string;
  status: "pending" | "approved" | "rejected";
  requested_by: string;
  reviewed_by: string | null;
  review_note: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string | null;
  requested_by_user: { id: string; first_name: string; last_name: string } | null;
  reviewed_by_user: { id: string; first_name: string; last_name: string } | null;
  fund_request_items: ApiFundRequestItem[];
}

export interface ApiFundRequestsResponse {
  fund_requests: ApiFundRequest[];
  budget_summary: ApiBudgetSummary | null;
}

// ─── Budget Summary API ─────────────────────────────────────────────

export async function fetchBudgetSummary(
  fundedProjectId: number
): Promise<ApiBudgetSummary> {
  const cacheKey = `budget:${fundedProjectId}`;
  const cached = getCached<ApiBudgetSummary>(cacheKey);
  if (cached) return cached;

  const { data } = await api.get<{ data: ApiBudgetSummary }>(
    "/project/budget-summary",
    { params: { funded_project_id: fundedProjectId }, withCredentials: true }
  );
  setCache(cacheKey, data.data);
  return data.data;
}

// ─── Fund Request API Functions ─────────────────────────────────────

export async function createFundRequest(
  fundedProjectId: number,
  quarterlyReport: string,
  items: {
    budget_item_id?: number | null;
    item_name: string;
    amount: number;
    description?: string;
    category: "ps" | "mooe" | "co";
  }[],
  yearNumber: number = 1
): Promise<{ fund_request: ApiFundRequest; budget_summary: ApiBudgetSummary }> {
  const { data } = await api.post<{ data: { items: ApiFundRequestItem[]; budget_summary: ApiBudgetSummary } & ApiFundRequest }>(
    "/project/create-fund-request",
    {
      funded_project_id: fundedProjectId,
      year_number: yearNumber,
      quarterly_report: quarterlyReport,
      items,
    },
    { withCredentials: true }
  );
  invalidateProjectCache();
  return data.data as unknown as { fund_request: ApiFundRequest; budget_summary: ApiBudgetSummary };
}

export async function fetchFundRequests(
  fundedProjectId: number,
  status?: "pending" | "approved" | "rejected"
): Promise<ApiFundRequestsResponse> {
  const cacheKey = `fund-requests:${fundedProjectId}:${status || "all"}`;
  const cached = getCached<ApiFundRequestsResponse>(cacheKey);
  if (cached) return cached;

  const params: Record<string, string | number> = { funded_project_id: fundedProjectId };
  if (status) params.status = status;

  const { data } = await api.get<{ data: ApiFundRequestsResponse }>(
    "/project/fund-requests",
    { params, withCredentials: true }
  );
  setCache(cacheKey, data.data);
  return data.data;
}

export async function reviewFundRequest(
  fundRequestId: number,
  status: "approved" | "rejected",
  reviewNote?: string
): Promise<ApiFundRequest> {
  const { data } = await api.post<{ data: ApiFundRequest }>(
    "/project/review-fund-request",
    {
      fund_request_id: fundRequestId,
      status,
      review_note: reviewNote,
    },
    { withCredentials: true }
  );
  invalidateProjectCache();
  return data.data;
}

// ─── Certificate API Functions ──────────────────────────────────────

export async function generateCertificate(
  fundedProjectId: number
): Promise<any> {
  const { data } = await api.post(
    "/project/generate-certificate",
    {
      funded_project_id: fundedProjectId,
    },
    { withCredentials: true }
  );
  invalidateProjectCache();
  return data;
}

export async function submitQuarterlyReport(
  fundedProjectId: number,
  quarterlyReport: string,
  progress: number,
  comment?: string,
  reportFileUrl?: string[],
  liquidations?: { fund_request_item_id: number; actual_amount: number }[],
  yearNumber: number = 1
): Promise<any> {
  const { data } = await api.post(
    "/project/submit-report",
    {
      funded_project_id: fundedProjectId,
      year_number: yearNumber,
      quarterly_report: quarterlyReport,
      progress,
      comment,
      report_file_url: reportFileUrl,
      liquidations,
    },
    { withCredentials: true }
  );
  invalidateProjectCache();
  return data;
}

// ─── Project Extension Types & API ─────────────────────────────────

export interface ApiProjectExtensionRequest {
  id: number;
  funded_project_id: number;
  extension_type: "time_only" | "with_funding";
  new_end_date: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  requested_by: string;
  reviewed_by: string | null;
  review_note: string | null;
  created_at: string;
  reviewed_at: string | null;
  requested_by_user: { id: string; first_name: string; last_name: string } | null;
  reviewed_by_user: { id: string; first_name: string; last_name: string } | null;
}

export async function requestProjectExtension(
  fundedProjectId: number,
  extensionType: "time_only" | "with_funding",
  newEndDate: string,
  reason: string
): Promise<ApiProjectExtensionRequest> {
  const { data } = await api.post<{ data: ApiProjectExtensionRequest }>(
    "/project/request-extension",
    {
      funded_project_id: fundedProjectId,
      extension_type: extensionType,
      new_end_date: newEndDate,
      reason,
    },
    { withCredentials: true }
  );
  invalidateProjectCache();
  return data.data;
}

export async function fetchProjectExtensionRequests(
  fundedProjectId: number
): Promise<ApiProjectExtensionRequest[]> {
  const { data } = await api.get<{ data: ApiProjectExtensionRequest[] }>(
    "/project/extension-requests",
    { params: { funded_project_id: fundedProjectId }, withCredentials: true }
  );
  return data.data;
}

export async function reviewProjectExtension(
  extensionRequestId: number,
  status: "approved" | "rejected",
  reviewNote?: string
): Promise<ApiProjectExtensionRequest> {
  const { data } = await api.post<{ data: ApiProjectExtensionRequest }>(
    "/project/review-extension",
    {
      extension_request_id: extensionRequestId,
      status,
      review_note: reviewNote,
    },
    { withCredentials: true }
  );
  invalidateProjectCache();
  return data.data;
}

// ─── Terminal Report Types & API ────────────────────────────────────

export interface ApiTerminalReport {
  id: number;
  funded_project_id: number;
  actual_start_date: string | null;
  actual_end_date: string | null;
  accomplishments: string;
  outputs_publications: string | null;
  outputs_patents_ip: string | null;
  outputs_products: string | null;
  outputs_people: string | null;
  outputs_partnerships: string | null;
  outputs_policy: string | null;
  problems_encountered: string | null;
  suggested_solutions: string | null;
  publications_list: string | null;
  report_file_url: string[] | null;
  status: "submitted" | "verified" | "rejected";
  // Financial reconciliation: unexpended balance the proponent declares will be
  // returned to the agency. Certificate gate requires spent + surrendered ≈ allocated.
  surrendered_amount: number;
  surrendered_at: string | null;
  surrendered_by: string | null;
  submitted_by: string;
  verified_by: string | null;
  verified_at: string | null;
  created_at: string;
  // Populated when R&D rejects with a reason; null until then.
  review_note?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  updated_at: string | null;
  submitted_by_user: { id: string; first_name: string; last_name: string } | null;
  verified_by_user: { id: string; first_name: string; last_name: string } | null;
}

export async function submitTerminalReport(args: {
  fundedProjectId: number;
  actualStartDate?: string;
  actualEndDate?: string;
  accomplishments: string;
  outputsPublications?: string;
  outputsPatentsIp?: string;
  outputsProducts?: string;
  outputsPeople?: string;
  outputsPartnerships?: string;
  outputsPolicy?: string;
  problemsEncountered?: string;
  suggestedSolutions?: string;
  publicationsList?: string;
  reportFileUrl?: string[];
  surrenderedAmount?: number;
}): Promise<ApiTerminalReport> {
  const { data } = await api.post<{ data: ApiTerminalReport }>(
    "/project/submit-terminal-report",
    {
      funded_project_id: args.fundedProjectId,
      actual_start_date: args.actualStartDate,
      actual_end_date: args.actualEndDate,
      accomplishments: args.accomplishments,
      outputs_publications: args.outputsPublications,
      outputs_patents_ip: args.outputsPatentsIp,
      outputs_products: args.outputsProducts,
      outputs_people: args.outputsPeople,
      outputs_partnerships: args.outputsPartnerships,
      outputs_policy: args.outputsPolicy,
      problems_encountered: args.problemsEncountered,
      suggested_solutions: args.suggestedSolutions,
      publications_list: args.publicationsList,
      report_file_url: args.reportFileUrl,
      surrendered_amount: args.surrenderedAmount,
    },
    { withCredentials: true }
  );
  invalidateProjectCache();
  return data.data;
}

export async function verifyTerminalReport(
  terminalReportId: number
): Promise<ApiTerminalReport> {
  const { data } = await api.post<{ data: ApiTerminalReport }>(
    "/project/verify-terminal-report",
    { terminal_report_id: terminalReportId },
    { withCredentials: true }
  );
  invalidateProjectCache();
  return data.data;
}

// R&D returns a terminal report to the proponent with a required note. Same pattern as
// rejectReport — proponent sees banner + reason, can edit and resubmit.
export async function rejectTerminalReport(
  terminalReportId: number,
  reviewNote: string
): Promise<ApiTerminalReport> {
  const { data } = await api.post<{ data: ApiTerminalReport }>(
    "/project/reject-terminal-report",
    { terminal_report_id: terminalReportId, review_note: reviewNote },
    { withCredentials: true }
  );
  invalidateProjectCache();
  return data.data;
}

export async function fetchTerminalReport(
  fundedProjectId: number
): Promise<ApiTerminalReport | null> {
  const { data } = await api.get<{ data: ApiTerminalReport | null }>(
    "/project/terminal-report",
    { params: { funded_project_id: fundedProjectId }, withCredentials: true }
  );
  return data.data;
}

// ─── Financial Report Types & API ──────────────────────────────────

type QuarterCellValue = { requested: number; spent: number } | null;

export interface FinancialReportLineItem {
  budget_item_id: number;
  item_name: string;
  category: "ps" | "mooe" | "co";
  approved_budget: number;
  // Legacy Y1-only shape — kept for backwards compat and single-year rendering.
  quarterly_data: {
    q1: QuarterCellValue;
    q2: QuarterCellValue;
    q3: QuarterCellValue;
    q4: QuarterCellValue;
  };
  // Phase 2A: full multi-year picture — { [year_number]: { q1..q4 } }.
  // Y2+ entries only present when the project has > 12 months duration.
  yearly_data: Record<number, Record<string, QuarterCellValue>>;
  total_requested: number;
  total_spent: number;
  balance: number;
}

export interface FinancialReportSummary {
  budget: number;
  requested: number;
  spent: number;
  balance: number;
}

export interface ApiFinancialReport {
  funded_project_id: number;
  budget_version: { id: number; version_number: number; grand_total: number };
  line_items: FinancialReportLineItem[];
  summary_by_category: {
    ps: FinancialReportSummary;
    mooe: FinancialReportSummary;
    co: FinancialReportSummary;
  };
  grand_total: FinancialReportSummary;
  duration_months: number | null;
  max_quarter: number;
  total_periods: number; // Phase 2A — drives year-selector visibility in the UI.
}

export async function fetchFinancialReport(
  fundedProjectId: number
): Promise<ApiFinancialReport> {
  const { data } = await api.get<{ data: ApiFinancialReport }>(
    "/project/financial-report",
    { params: { funded_project_id: fundedProjectId }, withCredentials: true }
  );
  return data.data;
}

// ============================================================
// Phase 3 of LIB feature: budget realignment workflow
// ============================================================

export type BudgetCategory = "ps" | "mooe" | "co";

export interface BudgetItemDto {
  id?: number;
  source: string;
  category: BudgetCategory;
  subcategory_id: number | null;
  custom_subcategory_label: string | null;
  item_name: string;
  spec: string | null;
  quantity: number;
  unit: string | null;
  unit_price: number;
  total_amount: number;
  display_order: number;
  notes?: string | null;
}

export interface BudgetVersionDto {
  id: number;
  proposal_id: number;
  version_number: number;
  grand_total: number;
  created_at: string;
  items: BudgetItemDto[];
}

export interface ActiveBudgetVersionResponse {
  funded_project_id: number;
  proposal_id: number;
  version: BudgetVersionDto;
}

export type RealignmentStatus =
  | "pending_review"
  | "endorsed_pending_admin"
  | "approved"
  | "rejected"
  | "revision_requested";

export interface RealignmentRecord {
  id: number;
  funded_project_id: number;
  from_version_id: number;
  to_version_id: number | null;
  status: RealignmentStatus;
  reason: string;
  file_url: string | null;
  proposed_payload: { items: any[]; grand_total: number };
  requested_by: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_note: string | null;
  // Pattern N two-tier approval fields
  requires_reclassification: boolean;
  endorsed_by: string | null;
  endorsed_at: string | null;
  endorser?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  } | null;
  // Computed by backend when requires_reclassification is true. Shows exactly which
  // over-reduced source items' freed cash is flowing into which absorption-room target
  // items. Uses natural-key identifiers (category + name + spec) since new-version
  // item IDs don't exist pre-approval.
  reclassification_preview?: Array<{
    source_category: string;
    source_item_name: string;
    source_spec: string | null;
    target_category: string;
    target_item_name: string;
    target_spec: string | null;
    amount: number;
  }>;
  created_at: string;
  updated_at: string;
  requester?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  } | null;
  reviewer?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  } | null;
  funded_project?: {
    id: number;
    proposal_id: number;
    proposals: { id: number; project_title: string };
  } | null;
  from_version?: BudgetVersionDto | null;
  to_version?: BudgetVersionDto | null;
}

export interface RealignmentLineInput {
  subcategoryId: number | null;
  customSubcategoryLabel: string | null;
  source: string;
  category: BudgetCategory;
  itemName: string;
  spec: string | null;
  quantity: number;
  unit: string | null;
  unitPrice: number;
  totalAmount: number;
  displayOrder?: number;
  notes?: string | null;
}

export async function fetchActiveBudgetVersion(
  fundedProjectId: number,
): Promise<ActiveBudgetVersionResponse> {
  const { data } = await api.get<ActiveBudgetVersionResponse>(
    `/project/budget-version?funded_project_id=${fundedProjectId}`,
    { withCredentials: true },
  );
  return data;
}

export async function requestBudgetRealignment(args: {
  fundedProjectId: number;
  reason: string;
  // Required: the server rejects submissions without a supporting document. In revise-mode
  // the caller can pass the previously-uploaded URL to avoid forcing a re-upload.
  fileUrl: string;
  items: RealignmentLineInput[];
}): Promise<{ message: string; data: RealignmentRecord }> {
  const { data } = await api.post<{ message: string; data: RealignmentRecord }>(
    "/project/realignment/request",
    {
      funded_project_id: args.fundedProjectId,
      reason: args.reason,
      file_url: args.fileUrl,
      items: args.items,
    },
    { withCredentials: true },
  );
  invalidateProjectCache();
  return data;
}

export async function reviewBudgetRealignment(args: {
  realignmentId: number;
  action: "approve" | "reject" | "request_revision";
  reviewNote?: string | null;
}): Promise<{ message: string; data: RealignmentRecord }> {
  const { data } = await api.post<{ message: string; data: RealignmentRecord }>(
    "/project/realignment/review",
    {
      realignment_id: args.realignmentId,
      action: args.action,
      review_note: args.reviewNote ?? null,
    },
    { withCredentials: true },
  );
  invalidateProjectCache();
  return data;
}

// Pattern N tier 1: RND endorses a realignment that requires reclassification.
// The realignment transitions to endorsed_pending_admin; Admin then confirms.
export async function endorseBudgetRealignment(
  realignmentId: number,
): Promise<{ message: string; data: RealignmentRecord }> {
  const { data } = await api.post<{ message: string; data: RealignmentRecord }>(
    "/project/realignment/endorse",
    { realignment_id: realignmentId },
    { withCredentials: true },
  );
  invalidateProjectCache();
  return data;
}

// Pattern N tier 2: Admin confirms an endorsed realignment. Maker-checker: the
// Admin who confirms must be different from the RND who endorsed.
export async function adminApproveBudgetRealignment(
  realignmentId: number,
): Promise<{ message: string; data: { realignment_id: number; new_version_id: number; status: string } }> {
  const { data } = await api.post<{ message: string; data: { realignment_id: number; new_version_id: number; status: string } }>(
    "/project/realignment/admin-approve",
    { realignment_id: realignmentId },
    { withCredentials: true },
  );
  invalidateProjectCache();
  return data;
}

// Pattern N: Admin returns an endorsed realignment to RND for rework.
export async function adminReturnBudgetRealignment(args: {
  realignmentId: number;
  reviewNote: string;
}): Promise<{ message: string; data: { realignment_id: number; status: string } }> {
  const { data } = await api.post<{ message: string; data: { realignment_id: number; status: string } }>(
    "/project/realignment/admin-return",
    {
      realignment_id: args.realignmentId,
      review_note: args.reviewNote,
    },
    { withCredentials: true },
  );
  invalidateProjectCache();
  return data;
}

export async function fetchRealignment(realignmentId: number): Promise<RealignmentRecord> {
  const { data } = await api.get<RealignmentRecord>(`/project/realignment?id=${realignmentId}`, {
    withCredentials: true,
  });
  return data;
}

export async function fetchRealignments(filters?: {
  status?: RealignmentStatus;
  fundedProjectId?: number;
}): Promise<RealignmentRecord[]> {
  const params = new URLSearchParams();
  if (filters?.status) params.append("status", filters.status);
  if (filters?.fundedProjectId) params.append("funded_project_id", String(filters.fundedProjectId));
  const url = `/project/realignments${params.toString() ? `?${params.toString()}` : ""}`;
  const { data } = await api.get<RealignmentRecord[]>(url, { withCredentials: true });
  return data ?? [];
}

// ── DOST Form Document Uploads (Forms 4 + 5) ──────────────────────────────

export async function uploadProjectDocument(
  fundedProjectId: number,
  documentType: "moa" | "agency_certification",
  file: File,
): Promise<{ funded_project_id: number; document_type: string; file_url: string; status: ComplianceDocStatus }> {
  // Reuse the report upload URL mechanism (same S3 bucket + presigned URL pattern)
  const fileUrl = await uploadReportFile(file);

  const { data } = await api.post<{ funded_project_id: number; document_type: string; file_url: string; status: ComplianceDocStatus }>(
    "/project/upload-document",
    { funded_project_id: fundedProjectId, document_type: documentType, file_url: fileUrl },
    { withCredentials: true },
  );
  invalidateProjectCache();
  return data;
}

export async function verifyProjectDocument(
  fundedProjectId: number,
  documentType: "moa" | "agency_certification",
): Promise<{ funded_project_id: number; document_type: string; status: ComplianceDocStatus }> {
  const { data } = await api.post<{ funded_project_id: number; document_type: string; status: ComplianceDocStatus }>(
    "/project/verify-document",
    { funded_project_id: fundedProjectId, document_type: documentType },
    { withCredentials: true },
  );
  invalidateProjectCache();
  return data;
}

export async function rejectProjectDocument(
  fundedProjectId: number,
  documentType: "moa" | "agency_certification",
  reviewNote: string,
): Promise<{ funded_project_id: number; document_type: string; status: ComplianceDocStatus }> {
  const { data } = await api.post<{ funded_project_id: number; document_type: string; status: ComplianceDocStatus }>(
    "/project/reject-document",
    {
      funded_project_id: fundedProjectId,
      document_type: documentType,
      review_note: reviewNote,
    },
    { withCredentials: true },
  );
  invalidateProjectCache();
  return data;
}
