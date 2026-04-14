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
  certificate_issued_at: string | null;
  certificate_issued_by: string | null;
  certificate_issuer: { id: string; first_name: string; last_name: string } | null;
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
  expenses: { id: string; description: string; amount: number; approvedAmount: number | null }[];
  totalExpense: number;
  totalApproved: number;
  proofs: string[];
  submittedBy?: string;
  dateSubmitted?: string;
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
        approvedAmount: e.approved_amount ?? null,
      }));

      const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);
      const totalApproved = expenses.reduce((sum, e) => sum + (e.approvedAmount ?? e.amount), 0);

      return {
        id: q,
        backendReportId: apiReport.id,
        quarter: getQuarterLabel(q),
        dueDate,
        status: statusMap[apiReport.status] || "Submitted",
        progress: apiReport.progress || 0,
        expenses,
        totalExpense,
        totalApproved,
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
        totalApproved: 0,
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
  items: {
    budget_item_id?: number | null;
    item_name: string;
    amount: number;
    description?: string;
    category: "ps" | "mooe" | "co";
  }[]
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
  reportFileUrl?: string[],
  liquidations?: { fund_request_item_id: number; actual_amount: number }[]
): Promise<any> {
  const { data } = await api.post(
    "/project/submit-report",
    {
      funded_project_id: fundedProjectId,
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
  fileUrl: string | null;
  items: RealignmentLineInput[];
}): Promise<{ message: string; data: RealignmentRecord }> {
  const { data } = await api.post(
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
  const { data } = await api.post(
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
