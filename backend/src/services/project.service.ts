import { SupabaseClient } from "@supabase/supabase-js";
import {
  GetFundedProjectsInput,
  SubmitReportInput,
  VerifyReportInput,
  AddCommentInput,
  AddExpenseInput,
  UpdateProjectStatusInput,
  GetProjectReportsInput,
  GetReportCommentsInput,
  GetProjectExpensesInput,
  GetProjectInput,
} from "../schemas/project-schema";
import { ReportStatus } from "../types/project";

export class ProjectService {
  constructor(private db: SupabaseClient) {}

  /**
   * Get funded projects with optional filtering
   * - Proponents see only their projects
   * - RND/Admin see all projects
   */
  async getFundedProjects(input: GetFundedProjectsInput) {
    let query = this.db
      .from("funded_projects")
      .select(
        `
        *,
        proposal:proposals (
          id,
          project_title,
          program_title,
          plan_start_date,
          plan_end_date,
          department:departments (id, name),
          sector:sectors (id, name)
        ),
        project_lead:users!project_lead_id (
          id,
          first_name,
          last_name,
          email
        ),
        project_reports (
          id,
          quarterly_report,
          status,
          progress,
          created_at
        )
      `
      )
      .order("created_at", { ascending: false });

    // Filter by status if provided
    if (input.status) {
      query = query.eq("status", input.status);
    }

    // Filter by proponent (user_id) if role is proponent
    if (input.role === "proponent" && input.user_id) {
      query = query.eq("project_lead_id", input.user_id);
    }

    // Apply pagination
    if (input.limit) {
      query = query.limit(input.limit);
    }
    if (input.offset) {
      query = query.range(input.offset, input.offset + (input.limit || 20) - 1);
    }

    const { data, error } = await query;

    if (error) {
      return { data: null, error };
    }

    // Calculate completion percentage based on latest report
    const projectsWithCompletion = data?.map((project) => {
      const latestReport = project.project_reports?.sort(
        (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )[0];

      return {
        ...project,
        completion_percentage: latestReport?.progress || 0,
        reports_count: project.project_reports?.length || 0,
      };
    });

    return { data: projectsWithCompletion, error: null };
  }

  /**
   * Get a single funded project by ID with full details
   */
  async getProject(input: GetProjectInput) {
    const { data, error } = await this.db
      .from("funded_projects")
      .select(
        `
        *,
        proposal:proposals (
          id,
          project_title,
          program_title,
          plan_start_date,
          plan_end_date,
          email,
          phone,
          implementation_site,
          department:departments (id, name),
          sector:sectors (id, name),
          discipline:disciplines (id, name),
          agency:agencies (id, name, street, barangay, city),
          estimated_budget (id, source, ps, mooe, co)
        ),
        project_lead:users!project_lead_id (
          id,
          first_name,
          last_name,
          email
        ),
        project_reports (
          *,
          project_comments (
            id,
            comments,
            users:users!users_id (id, first_name, last_name)
          ),
          project_expenses (id, expenses, desription, created_at)
        )
      `
      )
      .eq("id", input.project_id)
      .single();

    return { data, error };
  }

  /**
   * Submit a quarterly report for a funded project
   */
  async submitQuarterlyReport(input: SubmitReportInput) {
    // Check if a report for this quarter already exists
    const { data: existingReport } = await this.db
      .from("project_reports")
      .select("id")
      .eq("funded_project_id", input.funded_project_id)
      .eq("quarterly_report", input.quarterly_report)
      .single();

    if (existingReport) {
      return {
        data: null,
        error: {
          message: `A report for ${input.quarterly_report} already exists for this project.`,
          code: "DUPLICATE_REPORT",
        },
      };
    }

    const { data, error } = await this.db
      .from("project_reports")
      .insert({
        funded_project_id: input.funded_project_id,
        quarterly_report: input.quarterly_report,
        progress: input.progress,
        comment: input.comment || null,
        report_file_url: input.report_file_url || null,
        submitted_by_proponent_id: input.submitted_by_proponent_id,
        status: ReportStatus.SUBMITTED,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    return { data, error };
  }

  /**
   * Get all reports for a funded project
   */
  async getProjectReports(input: GetProjectReportsInput) {
    let query = this.db
      .from("project_reports")
      .select(
        `
        *,
        submitted_by:users!submitted_by_proponent_id (
          id,
          first_name,
          last_name
        ),
        project_comments (
          id,
          comments,
          users:users!users_id (id, first_name, last_name)
        ),
        project_expenses (id, expenses, desription, created_at)
      `
      )
      .eq("funded_project_id", input.funded_project_id)
      .order("created_at", { ascending: false });

    if (input.status) {
      query = query.eq("status", input.status);
    }

    const { data, error } = await query;

    return { data, error };
  }

  /**
   * Verify a quarterly report (RND/Admin action)
   */
  async verifyReport(input: VerifyReportInput) {
    const { data, error } = await this.db
      .from("project_reports")
      .update({
        status: ReportStatus.VERIFIED,
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.report_id)
      .select()
      .single();

    return { data, error };
  }

  /**
   * Add a comment to a project report
   */
  async addComment(input: AddCommentInput) {
    const { data, error } = await this.db
      .from("project_comments")
      .insert({
        project_reports_id: input.project_reports_id,
        users_id: input.users_id,
        comments: input.comments,
      })
      .select(
        `
        *,
        users:users!users_id (id, first_name, last_name)
      `
      )
      .single();

    return { data, error };
  }

  /**
   * Get comments for a project report
   */
  async getReportComments(input: GetReportCommentsInput) {
    const { data, error } = await this.db
      .from("project_comments")
      .select(
        `
        *,
        users:users!users_id (id, first_name, last_name)
      `
      )
      .eq("project_reports_id", input.project_reports_id)
      .order("id", { ascending: true });

    return { data, error };
  }

  /**
   * Add an expense entry to a project report
   */
  async addExpense(input: AddExpenseInput) {
    const { data, error } = await this.db
      .from("project_expenses")
      .insert({
        project_reports_id: input.project_reports_id,
        expenses: input.expenses,
        desription: input.desription, // Note: matches DB typo
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    return { data, error };
  }

  /**
   * Get expenses for a project report
   */
  async getProjectExpenses(input: GetProjectExpensesInput) {
    const { data, error } = await this.db
      .from("project_expenses")
      .select("*")
      .eq("project_reports_id", input.project_reports_id)
      .order("created_at", { ascending: false });

    return { data, error };
  }

  /**
   * Update project status (RND/Admin action)
   */
  async updateProjectStatus(input: UpdateProjectStatusInput) {
    const { data, error } = await this.db
      .from("funded_projects")
      .update({
        status: input.status,
      })
      .eq("id", input.project_id)
      .select()
      .single();

    return { data, error };
  }

  /**
   * Get overdue reports - reports that haven't been submitted within expected timeframe
   */
  async getOverdueReports() {
    // Get all active projects
    const { data: activeProjects, error: projectsError } = await this.db
      .from("funded_projects")
      .select(
        `
        id,
        proposal_id,
        funded_date,
        status,
        project_reports (quarterly_report, status)
      `
      )
      .eq("status", "on_going");

    if (projectsError) {
      return { data: null, error: projectsError };
    }

    // Determine which reports are overdue based on funded_date and current date
    const now = new Date();
    const overdueProjects = activeProjects?.filter((project) => {
      if (!project.funded_date) return false;

      const fundedDate = new Date(project.funded_date);
      const monthsSinceFunded = (now.getTime() - fundedDate.getTime()) / (1000 * 60 * 60 * 24 * 30);

      // Calculate expected reports based on months
      const expectedReports = Math.floor(monthsSinceFunded / 3);
      const submittedReports = project.project_reports?.length || 0;

      return expectedReports > submittedReports;
    });

    return { data: overdueProjects, error: null };
  }
}
