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
  InviteMemberInput,
  RemoveMemberInput,
  GetProjectMembersInput,
} from "../schemas/project-schema";
import { ReportStatus, ProjectMemberRole, ProjectMemberStatus } from "../types/project";
import { logActivity } from "../utils/activity-logger";

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

    // Filter for co-lead: find projects where user is an active member
    if (input.role === "lead_proponent" && input.user_id) {
      const { data: memberships } = await this.db
        .from("project_members")
        .select("funded_project_id")
        .eq("user_id", input.user_id)
        .eq("status", ProjectMemberStatus.ACTIVE);

      const projectIds = memberships?.map((m) => m.funded_project_id) || [];
      if (projectIds.length === 0) {
        return { data: [], error: null };
      }
      query = query.in("id", projectIds);
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

    if (!error && data) {
      await logActivity(this.db, {
        user_id: input.submitted_by_proponent_id,
        action: "quarterly_report_submitted",
        category: "project",
        target_id: String(input.funded_project_id),
        target_type: "funded_project",
        details: { quarter: input.quarterly_report, report_id: data.id },
      });
    }

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

    if (!error && data) {
      await logActivity(this.db, {
        user_id: input.verified_by_id,
        action: "quarterly_report_verified",
        category: "project",
        target_id: String(input.report_id),
        target_type: "report",
        details: { funded_project_id: data.funded_project_id },
      });
    }

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

    if (!error && data) {
      await logActivity(this.db, {
        user_id: input.users_id,
        action: "project_comment_added",
        category: "project",
        target_id: String(input.project_reports_id),
        target_type: "report",
      });
    }

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
   * Also handles co-lead suspension when project is blocked / restoration when unblocked
   */
  async updateProjectStatus(input: UpdateProjectStatusInput) {
    // Fetch current status before updating
    const { data: current } = await this.db
      .from("funded_projects")
      .select("status")
      .eq("id", input.project_id)
      .single();

    const previousStatus = current?.status;

    const { data, error } = await this.db
      .from("funded_projects")
      .update({
        status: input.status,
      })
      .eq("id", input.project_id)
      .select()
      .single();

    if (!error && data) {
      // Suspend co-leads when project becomes blocked
      if (input.status === "blocked" && previousStatus !== "blocked") {
        await this.suspendCoLeadsForProject(input.project_id);
      }
      // Restore co-leads when project is unblocked
      if (previousStatus === "blocked" && input.status !== "blocked") {
        await this.restoreCoLeadsForProject(input.project_id);
      }

      await logActivity(this.db, {
        user_id: input.updated_by_id,
        action: "project_status_updated",
        category: "project",
        target_id: String(input.project_id),
        target_type: "funded_project",
        details: { previous_status: previousStatus, new_status: input.status },
      });
    }

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

  // ===================== PROJECT MEMBERS (CO-LEAD) =====================

  /**
   * Invite a member (co-lead) to a funded project
   * - Only the project lead can invite
   * - Existing users are added directly as active
   * - New users get a Supabase invite email and are added as pending
   */
  async inviteMember(
    input: InviteMemberInput,
    supabaseAdmin: SupabaseClient | null,
    redirectTo: string
  ) {
    // Verify caller is the project lead
    const { data: project, error: projectError } = await this.db
      .from("funded_projects")
      .select("id, project_lead_id")
      .eq("id", input.funded_project_id)
      .single();

    if (projectError || !project) {
      return { data: null, error: { message: "Funded project not found." } };
    }

    if (project.project_lead_id !== input.invited_by) {
      return { data: null, error: { message: "Only the project lead can invite members." } };
    }

    // Self-invite prevention
    const { data: inviter } = await this.db
      .from("users")
      .select("email")
      .eq("id", input.invited_by)
      .single();

    if (inviter?.email === input.email) {
      return { data: null, error: { message: "You cannot invite yourself." } };
    }

    // Check if user exists
    const { data: existingUser } = await this.db
      .from("users")
      .select("id, roles")
      .eq("email", input.email)
      .single();

    if (existingUser) {
      // User exists — insert as active member
      const { data: member, error: insertError } = await this.db
        .from("project_members")
        .insert({
          funded_project_id: input.funded_project_id,
          user_id: existingUser.id,
          role: ProjectMemberRole.CO_LEAD,
          status: ProjectMemberStatus.ACTIVE,
          invited_by: input.invited_by,
          accepted_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertError) {
        if (insertError.code === "23505") {
          return { data: null, error: { message: "This user is already a member of this project." } };
        }
        return { data: null, error: insertError };
      }

      // Append lead_proponent role if not present
      const roles: string[] = existingUser.roles || [];
      if (!roles.includes("lead_proponent")) {
        await this.db
          .from("users")
          .update({ roles: [...roles, "lead_proponent"] })
          .eq("id", existingUser.id);
      }

      // Send notification
      await this.db.from("notifications").insert({
        user_id: existingUser.id,
        message: "You have been added as a co-lead to a funded project.",
        is_read: false,
      });

      await logActivity(this.db, {
        user_id: input.invited_by,
        action: "project_member_invited",
        category: "project",
        target_id: String(input.funded_project_id),
        target_type: "funded_project",
        details: { invited_email: input.email, member_id: member?.id },
      });

      return { data: member, error: null };
    } else {
      // User doesn't exist — send Supabase invite email
      if (!supabaseAdmin) {
        return { data: null, error: { message: "Admin client not available. Cannot send invite." } };
      }

      const { data: inviteData, error: inviteError } =
        await supabaseAdmin.auth.admin.inviteUserByEmail(input.email, {
          data: { roles: ["lead_proponent"] },
          redirectTo,
        });

      if (inviteError) {
        return { data: null, error: { message: inviteError.message } };
      }

      // Insert as pending member (will be activated on profile completion)
      const newUserId = inviteData.user.id;
      const { data: member, error: insertError } = await this.db
        .from("project_members")
        .insert({
          funded_project_id: input.funded_project_id,
          user_id: newUserId,
          role: ProjectMemberRole.CO_LEAD,
          status: ProjectMemberStatus.PENDING,
          invited_by: input.invited_by,
        })
        .select()
        .single();

      if (insertError) {
        return { data: null, error: insertError };
      }

      await logActivity(this.db, {
        user_id: input.invited_by,
        action: "project_member_invited",
        category: "project",
        target_id: String(input.funded_project_id),
        target_type: "funded_project",
        details: { invited_email: input.email, member_id: member?.id, is_new_user: true },
      });

      return { data: member, error: null };
    }
  }

  /**
   * Remove a co-lead from a funded project
   * - Only the project lead can remove
   * - Cannot remove the lead themselves
   * - Cleans up lead_proponent role if user has no other active memberships
   */
  async removeMember(input: RemoveMemberInput) {
    // Verify caller is the project lead
    const { data: project } = await this.db
      .from("funded_projects")
      .select("id, project_lead_id")
      .eq("id", input.funded_project_id)
      .single();

    if (!project) {
      return { data: null, error: { message: "Funded project not found." } };
    }

    if (project.project_lead_id !== input.removed_by) {
      return { data: null, error: { message: "Only the project lead can remove members." } };
    }

    // Fetch the member
    const { data: member } = await this.db
      .from("project_members")
      .select("id, user_id, role")
      .eq("id", input.member_id)
      .eq("funded_project_id", input.funded_project_id)
      .single();

    if (!member) {
      return { data: null, error: { message: "Member not found." } };
    }

    if (member.role === ProjectMemberRole.LEAD) {
      return { data: null, error: { message: "Cannot remove the project lead." } };
    }

    // Set status to removed
    const { data: updated, error: updateError } = await this.db
      .from("project_members")
      .update({ status: ProjectMemberStatus.REMOVED, updated_at: new Date().toISOString() })
      .eq("id", input.member_id)
      .select()
      .single();

    if (updateError) {
      return { data: null, error: updateError };
    }

    // Check if user is co-lead on any other active project
    const { data: otherMemberships } = await this.db
      .from("project_members")
      .select("id")
      .eq("user_id", member.user_id)
      .in("status", [ProjectMemberStatus.ACTIVE, ProjectMemberStatus.PENDING])
      .neq("id", input.member_id);

    if (!otherMemberships || otherMemberships.length === 0) {
      // Remove lead_proponent role
      const { data: user } = await this.db
        .from("users")
        .select("roles")
        .eq("id", member.user_id)
        .single();

      if (user?.roles) {
        const newRoles = (user.roles as string[]).filter((r) => r !== "lead_proponent");
        await this.db.from("users").update({ roles: newRoles }).eq("id", member.user_id);
      }
    }

    // Send notification
    await this.db.from("notifications").insert({
      user_id: member.user_id,
      message: "You have been removed from a funded project.",
      is_read: false,
    });

    await logActivity(this.db, {
      user_id: input.removed_by,
      action: "project_member_removed",
      category: "project",
      target_id: String(input.funded_project_id),
      target_type: "funded_project",
      details: { removed_user_id: member.user_id, member_id: input.member_id },
    });

    return { data: updated, error: null };
  }

  /**
   * Get all members (excluding removed) for a funded project
   */
  async getProjectMembers(input: GetProjectMembersInput) {
    const { data, error } = await this.db
      .from("project_members")
      .select(
        `
        *,
        user:users!user_id (id, first_name, last_name, email)
      `
      )
      .eq("funded_project_id", input.funded_project_id)
      .neq("status", ProjectMemberStatus.REMOVED)
      .order("role", { ascending: true });

    return { data, error };
  }

  /**
   * Suspend all active co-leads for a project (called when project is blocked)
   */
  async suspendCoLeadsForProject(projectId: number) {
    const { data: members } = await this.db
      .from("project_members")
      .select("id, user_id")
      .eq("funded_project_id", projectId)
      .eq("role", ProjectMemberRole.CO_LEAD)
      .eq("status", ProjectMemberStatus.ACTIVE);

    if (!members || members.length === 0) return;

    await this.db
      .from("project_members")
      .update({ status: ProjectMemberStatus.SUSPENDED, updated_at: new Date().toISOString() })
      .eq("funded_project_id", projectId)
      .eq("role", ProjectMemberRole.CO_LEAD)
      .eq("status", ProjectMemberStatus.ACTIVE);

    // Notify each suspended co-lead
    const notifications = members.map((m) => ({
      user_id: m.user_id,
      message: "Your co-lead access has been suspended because the project has been blocked.",
      is_read: false,
    }));

    await this.db.from("notifications").insert(notifications);
  }

  /**
   * Restore suspended co-leads for a project (called when project is unblocked)
   * Does NOT restore removed members
   */
  async restoreCoLeadsForProject(projectId: number) {
    const { data: members } = await this.db
      .from("project_members")
      .select("id, user_id")
      .eq("funded_project_id", projectId)
      .eq("role", ProjectMemberRole.CO_LEAD)
      .eq("status", ProjectMemberStatus.SUSPENDED);

    if (!members || members.length === 0) return;

    await this.db
      .from("project_members")
      .update({ status: ProjectMemberStatus.ACTIVE, updated_at: new Date().toISOString() })
      .eq("funded_project_id", projectId)
      .eq("role", ProjectMemberRole.CO_LEAD)
      .eq("status", ProjectMemberStatus.SUSPENDED);

    // Notify each restored co-lead
    const notifications = members.map((m) => ({
      user_id: m.user_id,
      message: "Your co-lead access has been restored. The project is no longer blocked.",
      is_read: false,
    }));

    await this.db.from("notifications").insert(notifications);
  }
}
