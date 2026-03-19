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
    return `File "${file.name}" exceeds the 5 MB limit (${(file.size / 1024 / 1024).toFixed(1)} MB).`;
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
  completion_percentage: number;
  reports_count: number;
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

export interface ApiProjectDetail {
  id: number;
  proposal_id: number;
  project_lead_id: string;
  status: "on_going" | "completed" | "on_hold" | "blocked";
  funded_date: string;
  created_at: string;
  proposal: {
    id: number;
    project_title: string;
    program_title: string;
    plan_start_date: string;
    plan_end_date: string;
    email: string | null;
    phone: string | null;
    implementation_site: string | null;
    department: { id: number; name: string } | null;
    sector: { id: number; name: string } | null;
    discipline: { id: number; name: string } | null;
    agency: { id: number; name: string; street: string; barangay: string; city: string } | null;
    estimated_budget: { id: number; source: string; ps: number; mooe: number; co: number }[];
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
  quarterly_report: string;
  status: "submitted" | "verified" | "overdue";
  progress: number;
  comment: string | null;
  report_file_url: string[] | null;
  submitted_by_proponent_id: string;
  created_at: string;
  project_expenses: ApiProjectExpense[];
}

export interface ApiProjectExpense {
  id: number;
  expenses: number;
  desription: string; // matches DB typo
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

// ─── Quarter Helpers ────────────────────────────────────────────────

const QUARTER_LABELS: Record<string, string> = {
  q1_report: "Q1 Report",
  q2_report: "Q2 Report",
  q3_report: "Q3 Report",
  q4_report: "Q4 Report",
};

const ALL_QUARTERS = ["q1_report", "q2_report", "q3_report", "q4_report"];

export function getQuarterLabel(quarterKey: string): string {
  return QUARTER_LABELS[quarterKey] || quarterKey;
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
    budget: 0, // Budget only available in detail view
    status: mapBackendStatus(fp.status),
    completionPercentage: fp.completion_percentage || 0,
    lastModified: fp.created_at || "",
  };
}

// ─── Display Report Interface (for detail modal) ───────────────────

export interface DisplayReport {
  id: string;
  backendReportId: number | null; // null for placeholder reports
  quarter: string;
  dueDate: string;
  status: "Locked" | "Due" | "Submitted" | "Verified" | "Overdue";
  progress: number;
  expenses: { id: string; description: string; amount: number }[];
  totalExpense: number;
  proofs: string[];
  submittedBy?: string;
  dateSubmitted?: string;
}

export interface ProjectDetailData {
  reports: DisplayReport[];
  totalBudget: number;
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
  const reportByQuarter = new Map<string, ApiProjectReport>();
  for (const r of existingReports) {
    reportByQuarter.set(r.quarterly_report, r);
  }

  // Compute quarter due dates based on plan_start_date
  const startDate = detail.proposal?.plan_start_date
    ? new Date(detail.proposal.plan_start_date)
    : new Date(detail.funded_date || detail.created_at);

  const quarterDueDates: Record<string, string> = {};
  ALL_QUARTERS.forEach((q, i) => {
    const dueDate = new Date(startDate);
    dueDate.setMonth(dueDate.getMonth() + (i + 1) * 3);
    quarterDueDates[q] = dueDate.toISOString().split("T")[0];
  });

  const now = new Date();
  let lastSubmittedIndex = -1;
  ALL_QUARTERS.forEach((q, i) => {
    if (reportByQuarter.has(q)) lastSubmittedIndex = i;
  });

  const reports: DisplayReport[] = ALL_QUARTERS.map((q, i) => {
    const apiReport = reportByQuarter.get(q);
    const dueDate = quarterDueDates[q];

    if (apiReport) {
      // Real report from backend
      const statusMap: Record<string, DisplayReport["status"]> = {
        submitted: "Submitted",
        verified: "Verified",
        overdue: "Overdue",
      };

      const expenses = (apiReport.project_expenses || []).map((e) => ({
        id: String(e.id),
        description: e.desription || "Expense", // handle DB typo
        amount: e.expenses,
      }));

      const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);

      return {
        id: q,
        backendReportId: apiReport.id,
        quarter: getQuarterLabel(q),
        dueDate,
        status: statusMap[apiReport.status] || "Submitted",
        progress: apiReport.progress || 0,
        expenses,
        totalExpense,
        proofs: apiReport.report_file_url || [],
        submittedBy: undefined, // Could fetch from submitted_by_proponent_id if needed
        dateSubmitted: apiReport.created_at
          ? formatDate(apiReport.created_at)
          : undefined,
      };
    }

    // No report exists for this quarter - placeholder
    const isDue = i === lastSubmittedIndex + 1 && new Date(dueDate) <= now;
    const isOverdue = i <= lastSubmittedIndex + 1 && new Date(dueDate) < now;
    const placeholderStatus: DisplayReport["status"] =
      isOverdue && i === lastSubmittedIndex + 1 ? "Due" : i > lastSubmittedIndex + 1 ? "Locked" : "Due";

    // If the project is completed, all missing quarters should show as Locked
    if (detail.status === "completed") {
      return {
        id: q,
        backendReportId: null,
        quarter: getQuarterLabel(q),
        dueDate,
        status: "Locked",
        progress: 0,
        expenses: [],
        totalExpense: 0,
        proofs: [],
      };
    }

    return {
      id: q,
      backendReportId: null,
      quarter: getQuarterLabel(q),
      dueDate,
      status: isDue || placeholderStatus === "Due" ? "Due" : "Locked",
      progress: 0,
      expenses: [],
      totalExpense: 0,
      proofs: [],
      messages: [],
    };
  });

  // Calculate total budget from estimated_budget
  const budgets = detail.proposal?.estimated_budget || [];
  const totalBudget = budgets.reduce(
    (sum, b) => sum + (b.ps || 0) + (b.mooe || 0) + (b.co || 0),
    0
  );

  return { reports, totalBudget };
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
  const cacheKey = `funded:${role || "all"}`;
  const cached = getCached<ApiFundedProject[]>(cacheKey);
  if (cached) return cached;

  const params: Record<string, string> = {};
  if (role) params.role = role;

  const { data } = await api.get<{ data: ApiFundedProject[] }>(
    "/project/funded",
    { params, withCredentials: true }
  );
  setCache(cacheKey, data.data);
  return data.data;
}

export async function fetchProjectDetail(
  projectId: number
): Promise<ApiProjectDetail> {
  const cacheKey = `detail:${projectId}`;
  const cached = getCached<ApiProjectDetail>(cacheKey);
  if (cached) return cached;

  const { data } = await api.get<{ data: ApiProjectDetail }>(
    "/project/view",
    { params: { project_id: projectId }, withCredentials: true }
  );
  setCache(cacheKey, data.data);
  return data.data;
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
  budget_by_category: { ps: number; mooe: number; co: number };
  approved_by_category: { ps: number; mooe: number; co: number };
  pending_by_category: { ps: number; mooe: number; co: number };
}

// ─── Fund Request Types ─────────────────────────────────────────────

export interface ApiFundRequestItem {
  id: number;
  fund_request_id: number;
  item_name: string;
  amount: number;
  description: string | null;
  category: "ps" | "mooe" | "co";
  created_at: string;
}

export interface ApiFundRequest {
  id: number;
  funded_project_id: number;
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
  items: { item_name: string; amount: number; description?: string; category: "ps" | "mooe" | "co" }[]
): Promise<{ fund_request: ApiFundRequest; budget_summary: ApiBudgetSummary }> {
  const { data } = await api.post<{ data: { items: ApiFundRequestItem[]; budget_summary: ApiBudgetSummary } & ApiFundRequest }>(
    "/project/create-fund-request",
    {
      funded_project_id: fundedProjectId,
      quarterly_report: quarterlyReport,
      items,
    },
    { withCredentials: true }
  );
  invalidateProjectCache();
  return { fund_request: data.data, budget_summary: data.data.budget_summary };
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
  reportFileUrl?: string[]
): Promise<any> {
  const { data } = await api.post(
    "/project/submit-report",
    {
      funded_project_id: fundedProjectId,
      quarterly_report: quarterlyReport,
      progress,
      comment,
      report_file_url: reportFileUrl,
    },
    { withCredentials: true }
  );
  invalidateProjectCache();
  return data;
}
