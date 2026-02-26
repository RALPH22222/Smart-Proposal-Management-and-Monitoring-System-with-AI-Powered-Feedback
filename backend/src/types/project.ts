/**
 * Project Monitoring Types
 * Matches database tables: funded_projects, project_reports, project_comments, project_expenses
 */

// Enums matching database types
export enum ProjectStatus {
  ON_GOING = "on_going",
  COMPLETED = "completed",
  ON_HOLD = "on_hold",
  BLOCKED = "blocked",
}

export enum QuarterlyReport {
  Q1 = "q1_report",
  Q2 = "q2_report",
  Q3 = "q3_report",
  Q4 = "q4_report",
}

export enum ReportStatus {
  SUBMITTED = "submitted",
  VERIFIED = "verified",
  OVERDUE = "overdue",
}

// Matches 'public.funded_projects' table
export interface FundedProject {
  id: number;
  proposal_id: number;
  status: ProjectStatus;
  funded_date: string | null;
  created_at: string;
  project_lead_id: string; // UUID
}

// Matches 'public.project_reports' table
export interface ProjectReport {
  id: number;
  funded_project_id: number;
  report_file_url: string[] | null;
  comment: string | null;
  created_at: string;
  updated_at: string | null;
  progress: number | null;
  quarterly_report: QuarterlyReport;
  submitted_by_proponent_id: string; // UUID
  status: ReportStatus;
}

// Matches 'public.project_comments' table
export interface ProjectComment {
  id: number;
  project_reports_id: number;
  users_id: string; // UUID
  comments: string;
}

// Matches 'public.project_expenses' table
export interface ProjectExpense {
  id: number;
  project_reports_id: number;
  expenses: number;
  desription: string; // Note: typo in DB schema (desription vs description)
  created_at: string;
}

// Extended types for API responses
export interface FundedProjectWithDetails extends FundedProject {
  proposal: {
    id: number;
    project_title: string;
    program_title: string | null;
    plan_start_date: string | null;
    plan_end_date: string | null;
    department: { id: number; name: string } | null;
    sector: { id: number; name: string } | null;
  } | null;
  project_lead: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  } | null;
  reports?: ProjectReport[];
  total_budget?: number;
  completion_percentage?: number;
}

export interface ProjectReportWithDetails extends ProjectReport {
  funded_project?: FundedProject;
  comments?: ProjectComment[];
  expenses?: ProjectExpense[];
  submitted_by?: {
    id: string;
    first_name: string;
    last_name: string;
  } | null;
}

// Input types for service methods
export interface GetFundedProjectsInput {
  user_id?: string;
  role?: "proponent" | "rnd" | "admin" | "lead_proponent";
  status?: ProjectStatus;
  limit?: number;
  offset?: number;
}

export interface SubmitReportInput {
  funded_project_id: number;
  quarterly_report: QuarterlyReport;
  progress: number;
  comment?: string;
  report_file_url?: string[];
  submitted_by_proponent_id: string;
}

export interface VerifyReportInput {
  report_id: number;
  verified_by_id: string;
}

export interface AddCommentInput {
  project_reports_id: number;
  users_id: string;
  comments: string;
}

export interface AddExpenseInput {
  project_reports_id: number;
  expenses: number;
  desription: string;
}

export interface UpdateProjectStatusInput {
  project_id: number;
  status: ProjectStatus;
  updated_by_id: string;
}

// Project Members (Co-Lead) types
export enum ProjectMemberRole {
  LEAD = "lead",
  CO_LEAD = "co_lead",
}

export enum ProjectMemberStatus {
  PENDING = "pending",
  ACTIVE = "active",
  SUSPENDED = "suspended",
  REMOVED = "removed",
}

export interface ProjectMember {
  id: number;
  funded_project_id: number;
  user_id: string;
  role: ProjectMemberRole;
  status: ProjectMemberStatus;
  invited_by: string;
  invited_at: string;
  accepted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectMemberWithUser extends ProjectMember {
  user: { id: string; first_name: string; last_name: string; email: string };
}
