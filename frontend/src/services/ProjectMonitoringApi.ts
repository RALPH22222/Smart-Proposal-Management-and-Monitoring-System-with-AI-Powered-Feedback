import { api } from "../utils/axios";
import { type Project, type ProjectStatus } from "../types/InterfaceProject";

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
  project_comments: ApiProjectComment[];
  project_expenses: ApiProjectExpense[];
}

export interface ApiProjectComment {
  id: number;
  comments: string;
  users: { id: string; first_name: string; last_name: string };
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
  messages: { id: string; sender: "R&D" | "Proponent"; text: string; timestamp: string }[];
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
  currentUserId: string
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

      const messages = (apiReport.project_comments || []).map((c, idx) => ({
        id: String(c.id || idx),
        sender: (c.users?.id === currentUserId ? "R&D" : "Proponent") as "R&D" | "Proponent",
        text: c.comments,
        timestamp: "",
      }));

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
          ? new Date(apiReport.created_at).toLocaleDateString()
          : undefined,
        messages,
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
        messages: [],
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

// ─── API Functions ──────────────────────────────────────────────────

export async function fetchFundedProjects(
  role?: string
): Promise<ApiFundedProject[]> {
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
  const { data } = await api.get<{ data: ApiProjectDetail }>(
    "/project/view",
    { params: { project_id: projectId }, withCredentials: true }
  );
  return data.data;
}

export async function verifyReport(
  reportId: number,
  verifiedById: string
): Promise<void> {
  await api.post(
    "/project/verify-report",
    { report_id: reportId, verified_by_id: verifiedById },
    { withCredentials: true }
  );
}

export async function addReportComment(
  reportId: number,
  userId: string,
  text: string
): Promise<ApiProjectComment> {
  const { data } = await api.post<{ data: ApiProjectComment }>(
    "/project/add-comment",
    { project_reports_id: reportId, users_id: userId, comments: text },
    { withCredentials: true }
  );
  return data.data;
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
}
