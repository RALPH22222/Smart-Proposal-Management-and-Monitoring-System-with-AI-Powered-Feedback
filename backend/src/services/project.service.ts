import { SupabaseClient } from "@supabase/supabase-js";
import {
  GetFundedProjectsInput,
  SubmitReportInput,
  VerifyReportInput,
  AddExpenseInput,
  UpdateProjectStatusInput,
  GetProjectReportsInput,
  GetProjectExpensesInput,
  GetProjectInput,
  InviteMemberInput,
  RemoveMemberInput,
  GetProjectMembersInput,
  CreateFundRequestInput,
  GetFundRequestsInput,
  ReviewFundRequestInput,
  GenerateCertificateInput,
} from "../schemas/project-schema";
import { ReportStatus, FundRequestStatus, ProjectMemberRole, ProjectMemberStatus } from "../types/project";
import { logActivity } from "../utils/activity-logger";
import { EmailService } from "./email.service";

export class ProjectService {
  constructor(private db: SupabaseClient) { }

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

    // Filter by proponent (user_id) - Check if they are Project Lead OR Co-Lead Member
    if (input.role === "proponent" && input.user_id) {
      // 1. Get projects where user is the lead
      // 2. Get projects where user is an active member
      const { data: memberships } = await this.db
        .from("project_members")
        .select("funded_project_id")
        .eq("user_id", input.user_id)
        .eq("status", ProjectMemberStatus.ACTIVE);

      const projectMemberIds = memberships?.map((m) => m.funded_project_id) || [];

      // Combine: where (project_lead_id == user_id) OR (id IN projectMemberIds)
      if (projectMemberIds.length > 0) {
        query = query.or(`project_lead_id.eq.${input.user_id},id.in.(${projectMemberIds.join(",")})`);
      } else {
        query = query.eq("project_lead_id", input.user_id);
      }
    }

    // Filter for RND: only show projects assigned to this RND user via proposal_rnd
    if (input.role === "rnd" && input.user_id) {
      const { data: rndAssignments } = await this.db
        .from("proposal_rnd")
        .select("proposal_id")
        .eq("rnd_id", input.user_id);

      const proposalIds = rndAssignments?.map((a) => a.proposal_id) || [];
      if (proposalIds.length === 0) {
        return { data: [], error: null };
      }
      query = query.in("proposal_id", proposalIds);
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
          implementation_site(site_name,city),
          department:departments (id, name),
          sector:sectors (id, name),
          discipline:disciplines (id, name),
          agency:agencies (id, name, street, barangay, city),
          estimated_budget (id, source, budget, item, amount)
        ),
        project_lead:users!project_lead_id (
          id,
          first_name,
          last_name,
          email
        ),
        project_reports (
          id,
          funded_project_id,
          quarterly_report,
          status,
          progress,
          comment,
          report_file_url,
          submitted_by_proponent_id,
          created_at,
          project_expenses (id, expenses, desription, fund_request_item_id, approved_amount, created_at)
        )
      `
      )
      .eq("id", input.project_id)
      .single();

    if (error || !data) {
      return { data, error };
    }

    // Resolve certificate issuer name separately (avoids PostgREST schema cache issues with multiple FKs to users)
    let certificate_issuer = null;
    if (data.certificate_issued_by) {
      const { data: issuer } = await this.db
        .from("users")
        .select("id, first_name, last_name")
        .eq("id", data.certificate_issued_by)
        .single();
      certificate_issuer = issuer || null;
    }

    return { data: { ...data, certificate_issuer }, error: null };
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

    // Gate: Fund request for this quarter must be approved
    const { data: fundRequest } = await this.db
      .from("fund_requests")
      .select("id, status")
      .eq("funded_project_id", input.funded_project_id)
      .eq("quarterly_report", input.quarterly_report)
      .single();

    if (!fundRequest || fundRequest.status !== "approved") {
      return {
        data: null,
        error: {
          message: "Fund request for this quarter must be approved before submitting a report.",
          code: "FUND_REQUEST_NOT_APPROVED",
        },
      };
    }

    // Gate: Previous quarter must be submitted/verified first (sequential enforcement)
    const quarterOrder = ["q1_report", "q2_report", "q3_report", "q4_report"];
    const currentIndex = quarterOrder.indexOf(input.quarterly_report);
    if (currentIndex > 0) {
      const prevQuarter = quarterOrder[currentIndex - 1];
      const { data: prevReport } = await this.db
        .from("project_reports")
        .select("id")
        .eq("funded_project_id", input.funded_project_id)
        .eq("quarterly_report", prevQuarter)
        .single();

      if (!prevReport) {
        return {
          data: null,
          error: {
            message: `You must submit the ${prevQuarter.replace('_', ' ')} before submitting this quarter's report.`,
            code: "PREVIOUS_QUARTER_MISSING",
          },
        };
      }
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
      // Fetch approved fund request items for this quarter
      const { data: fundReqItems } = await this.db
        .from("fund_request_items")
        .select("id, item_name, amount")
        .eq("fund_request_id", fundRequest.id);

      if (input.liquidations !== undefined) {
        // Liquidation mode: proponent selected which items they spent on
        if (input.liquidations.length > 0) {
          const itemMap = new Map(
            (fundReqItems || []).map((i) => [i.id, i])
          );

          // Validate each liquidation entry
          for (const entry of input.liquidations) {
            const item = itemMap.get(entry.fund_request_item_id);
            if (!item) {
              return {
                data: null,
                error: {
                  message: `Invalid fund request item ID: ${entry.fund_request_item_id}`,
                  code: "INVALID_LIQUIDATION_ITEM",
                },
              };
            }
            if (entry.actual_amount > Number(item.amount)) {
              return {
                data: null,
                error: {
                  message: `Actual amount for "${item.item_name}" exceeds approved amount (${item.amount}).`,
                  code: "AMOUNT_EXCEEDS_APPROVED",
                },
              };
            }
          }

          const expenseRows = input.liquidations.map((entry) => {
            const item = itemMap.get(entry.fund_request_item_id)!;
            return {
              project_reports_id: data.id,
              expenses: entry.actual_amount,
              approved_amount: Number(item.amount),
              fund_request_item_id: entry.fund_request_item_id,
              desription: item.item_name, // matches DB typo
              created_at: new Date().toISOString(),
            };
          });

          await this.db.from("project_expenses").insert(expenseRows);
        }
        // Empty liquidations array = proponent spent nothing this quarter (no rows inserted)
      } else {
        // Legacy path: auto-copy all items (backward compat)
        if (fundReqItems && fundReqItems.length > 0) {
          const expenseRows = fundReqItems.map((item) => ({
            project_reports_id: data.id,
            expenses: item.amount,
            desription: item.item_name, // matches DB typo
            created_at: new Date().toISOString(),
          }));

          await this.db.from("project_expenses").insert(expenseRows);
        }
      }

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
      // User exists — insert as PENDING; they must accept via the in-app
      // Pending Invitations panel before becoming an active co-lead.
      const { data: member, error: insertError } = await this.db
        .from("project_members")
        .insert({
          funded_project_id: input.funded_project_id,
          user_id: existingUser.id,
          role: ProjectMemberRole.CO_LEAD,
          status: ProjectMemberStatus.PENDING,
          invited_by: input.invited_by,
        })
        .select()
        .single();

      if (insertError) {
        if (insertError.code === "23505") {
          return { data: null, error: { message: "This user is already a member of this project." } };
        }
        return { data: null, error: insertError };
      }

      // Send notification — proponent role is granted only on accept.
      await this.db.from("notifications").insert({
        user_id: existingUser.id,
        message: "You have a pending co-lead invitation. Open Project Monitoring to accept or decline.",
        is_read: false,
        link: "project-monitoring",
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
          data: { roles: ["proponent"] },
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
   * - Cleans up co_lead role if user has no other active memberships
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

    // Send notification
    await this.db.from("notifications").insert({
      user_id: member.user_id,
      message: "You have been removed from a funded project.",
      is_read: false,
      link: "project-monitoring",
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
   * Get all pending co-lead invitations for a user.
   * Returns rows joined with the funded project (title) and inviter user.
   */
  async getPendingInvitations(userId: string) {
    const { data, error } = await this.db
      .from("project_members")
      .select(
        `
        id,
        funded_project_id,
        invited_at,
        funded_project:funded_projects!funded_project_id (
          id,
          proposal:proposals (project_title)
        ),
        inviter:users!invited_by (id, first_name, last_name, email)
      `
      )
      .eq("user_id", userId)
      .eq("status", ProjectMemberStatus.PENDING)
      .order("invited_at", { ascending: false });

    return { data, error };
  }

  /**
   * Respond to a pending co-lead invitation.
   * - On accept: flip to active, set accepted_at, ensure proponent role.
   * - On decline: hard-delete the row so the lead can re-invite later.
   */
  async respondToInvitation(input: {
    member_id: number;
    user_id: string;
    action: "accept" | "decline";
  }) {
    const { data: member, error: fetchError } = await this.db
      .from("project_members")
      .select("id, user_id, status, funded_project_id")
      .eq("id", input.member_id)
      .single();

    if (fetchError || !member) {
      return { data: null, error: { message: "Invitation not found." } };
    }

    if (member.user_id !== input.user_id) {
      return { data: null, error: { message: "You are not authorized to respond to this invitation." } };
    }

    if (member.status !== ProjectMemberStatus.PENDING) {
      return { data: null, error: { message: "This invitation is no longer pending." } };
    }

    if (input.action === "accept") {
      const { data: updated, error: updateError } = await this.db
        .from("project_members")
        .update({
          status: ProjectMemberStatus.ACTIVE,
          accepted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", input.member_id)
        .select()
        .single();

      if (updateError) {
        return { data: null, error: updateError };
      }

      // Ensure the user has the proponent role.
      const { data: user } = await this.db
        .from("users")
        .select("roles")
        .eq("id", input.user_id)
        .single();

      const roles: string[] = user?.roles || [];
      if (!roles.includes("proponent")) {
        await this.db
          .from("users")
          .update({ roles: [...roles, "proponent"] })
          .eq("id", input.user_id);
      }

      await logActivity(this.db, {
        user_id: input.user_id,
        action: "project_invitation_accepted",
        category: "project",
        target_id: String(member.funded_project_id),
        target_type: "funded_project",
        details: { member_id: input.member_id },
      });

      return { data: updated, error: null };
    }

    // Decline — hard delete so the lead can re-invite if needed.
    const { error: deleteError } = await this.db
      .from("project_members")
      .delete()
      .eq("id", input.member_id);

    if (deleteError) {
      return { data: null, error: deleteError };
    }

    await logActivity(this.db, {
      user_id: input.user_id,
      action: "project_invitation_declined",
      category: "project",
      target_id: String(member.funded_project_id),
      target_type: "funded_project",
      details: { member_id: input.member_id },
    });

    return { data: { id: input.member_id, declined: true }, error: null };
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
      link: "project-monitoring",
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
      link: "project-monitoring",
    }));

    await this.db.from("notifications").insert(notifications);
  }

  // ===================== FUND REQUESTS =====================

  /**
   * Get the total approved budget for a funded project from its proposal's estimated_budget.
   * Also calculates how much has already been approved/pending in fund requests.
   *
   * estimated_budget columns: proposal_id, source, budget (category: ps/mooe/co), item, amount
   * Total budget = SUM(amount) from estimated_budget for the proposal.
   */
  async getBudgetSummary(fundedProjectId: number) {
    // Get proposal_id for this funded project
    const { data: project, error: projectError } = await this.db
      .from("funded_projects")
      .select("proposal_id")
      .eq("id", fundedProjectId)
      .single();

    if (projectError || !project) {
      return { data: null, error: projectError || { message: "Funded project not found." } };
    }

    // Get total budget from estimated_budget (sum of all amount values)
    const { data: budgetRows, error: budgetError } = await this.db
      .from("estimated_budget")
      .select("amount, budget")
      .eq("proposal_id", project.proposal_id);

    if (budgetError) {
      return { data: null, error: budgetError };
    }

    const totalBudget = (budgetRows || []).reduce((sum, row) => sum + (Number(row.amount) || 0), 0);

    // Breakdown by category
    const budgetByCategory = { ps: 0, mooe: 0, co: 0 };
    for (const row of budgetRows || []) {
      const cat = (row.budget || "").toString().toLowerCase() as keyof typeof budgetByCategory;
      if (cat in budgetByCategory) {
        budgetByCategory[cat] += Number(row.amount) || 0;
      }
    }

    // Get all fund requests for this project with their items
    const { data: fundRequests, error: frError } = await this.db
      .from("fund_requests")
      .select("id, status, fund_request_items (amount, category)")
      .eq("funded_project_id", fundedProjectId);

    if (frError) {
      return { data: null, error: frError };
    }

    // Calculate amounts by status
    let totalApproved = 0;
    let totalPending = 0;
    const approvedByCategory = { ps: 0, mooe: 0, co: 0 };
    const pendingByCategory = { ps: 0, mooe: 0, co: 0 };

    for (const fr of fundRequests || []) {
      const items = (fr as any).fund_request_items || [];
      for (const item of items) {
        const amount = Number(item.amount) || 0;
        const cat = (item.category || "").toString().toLowerCase() as keyof typeof approvedByCategory;
        if (fr.status === "approved") {
          totalApproved += amount;
          if (cat in approvedByCategory) approvedByCategory[cat] += amount;
        } else if (fr.status === "pending") {
          totalPending += amount;
          if (cat in pendingByCategory) pendingByCategory[cat] += amount;
        }
      }
    }

    const remaining = totalBudget - totalApproved;

    // Calculate actual spending from project_expenses (liquidation data)
    const { data: reports } = await this.db
      .from("project_reports")
      .select("id")
      .eq("funded_project_id", fundedProjectId);

    let totalActualSpent = 0;
    let totalForReturn = 0;

    if (reports && reports.length > 0) {
      const reportIds = reports.map((r) => r.id);
      const { data: expenses } = await this.db
        .from("project_expenses")
        .select("expenses, approved_amount")
        .in("project_reports_id", reportIds);

      for (const exp of expenses || []) {
        const actual = Number(exp.expenses) || 0;
        const approved = Number(exp.approved_amount) || 0;
        totalActualSpent += actual;
        // Only count for-return on liquidated rows (approved_amount is set)
        if (exp.approved_amount !== null) {
          totalForReturn += approved - actual;
        }
      }
    }

    return {
      data: {
        total_budget: totalBudget,
        total_approved: totalApproved,
        total_pending: totalPending,
        remaining,
        total_actual_spent: totalActualSpent,
        total_for_return: totalForReturn,
        budget_by_category: budgetByCategory,
        approved_by_category: approvedByCategory,
        pending_by_category: pendingByCategory,
      },
      error: null,
    };
  }

  /**
   * Create a fund request for a specific quarter.
   * Validates that the requested amount doesn't exceed the remaining budget
   * (total budget from estimated_budget minus already-approved fund requests).
   */
  async createFundRequest(input: CreateFundRequestInput) {
    // Check for duplicate fund request for same project + quarter
    const { data: existing } = await this.db
      .from("fund_requests")
      .select("id")
      .eq("funded_project_id", input.funded_project_id)
      .eq("quarterly_report", input.quarterly_report)
      .single();

    if (existing) {
      return {
        data: null,
        error: {
          message: `A fund request for ${input.quarterly_report} already exists for this project.`,
          code: "DUPLICATE_FUND_REQUEST",
        },
      };
    }

    // Get budget summary to validate against remaining funds
    const { data: budgetSummary, error: budgetError } = await this.getBudgetSummary(
      input.funded_project_id
    );

    if (budgetError || !budgetSummary) {
      return { data: null, error: budgetError || { message: "Could not retrieve budget information." } };
    }

    const requestedAmount = input.items.reduce((sum, i) => sum + i.amount, 0);

    if (requestedAmount > budgetSummary.remaining) {
      return {
        data: null,
        error: {
          message: `Requested amount (${requestedAmount.toLocaleString()}) exceeds remaining budget (${budgetSummary.remaining.toLocaleString()}). Total budget: ${budgetSummary.total_budget.toLocaleString()}, already approved: ${budgetSummary.total_approved.toLocaleString()}.`,
          code: "EXCEEDS_BUDGET",
        },
      };
    }

    // Also validate per category
    const requestedByCategory = { ps: 0, mooe: 0, co: 0 };
    for (const item of input.items) {
      requestedByCategory[item.category] += item.amount;
    }

    for (const cat of ["ps", "mooe", "co"] as const) {
      const categoryBudget = budgetSummary.budget_by_category[cat];
      const categoryApproved = budgetSummary.approved_by_category[cat];
      const categoryRemaining = categoryBudget - categoryApproved;
      if (requestedByCategory[cat] > categoryRemaining) {
        return {
          data: null,
          error: {
            message: `Requested ${cat.toUpperCase()} amount (${requestedByCategory[cat].toLocaleString()}) exceeds remaining ${cat.toUpperCase()} budget (${categoryRemaining.toLocaleString()}). Total ${cat.toUpperCase()}: ${categoryBudget.toLocaleString()}, approved: ${categoryApproved.toLocaleString()}.`,
            code: "EXCEEDS_CATEGORY_BUDGET",
          },
        };
      }
    }

    // Create the fund request
    const { data: fundRequest, error: requestError } = await this.db
      .from("fund_requests")
      .insert({
        funded_project_id: input.funded_project_id,
        quarterly_report: input.quarterly_report,
        requested_by: input.requested_by,
        status: FundRequestStatus.PENDING,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (requestError) {
      return { data: null, error: requestError };
    }

    // Insert all items
    const items = input.items.map((item) => ({
      fund_request_id: fundRequest.id,
      item_name: item.item_name,
      amount: item.amount,
      description: item.description || null,
      category: item.category,
      created_at: new Date().toISOString(),
    }));

    const { data: insertedItems, error: itemsError } = await this.db
      .from("fund_request_items")
      .insert(items)
      .select();

    if (itemsError) {
      return { data: null, error: itemsError };
    }

    await logActivity(this.db, {
      user_id: input.requested_by,
      action: "fund_request_created",
      category: "project",
      target_id: String(input.funded_project_id),
      target_type: "funded_project",
      details: {
        quarter: input.quarterly_report,
        fund_request_id: fundRequest.id,
        total_amount: requestedAmount,
      },
    });

    // Notify RND/Admin about the new fund request
    const { data: project } = await this.db
      .from("funded_projects")
      .select("proposal_id")
      .eq("id", input.funded_project_id)
      .single();

    if (project) {
      const { data: rndAssignment } = await this.db
        .from("proposal_rnd")
        .select("rnd_id")
        .eq("proposal_id", project.proposal_id)
        .single();

      if (rndAssignment) {
        await this.db.from("notifications").insert({
          user_id: rndAssignment.rnd_id,
          message: `A new fund request (${requestedAmount.toLocaleString()}) has been submitted for ${input.quarterly_report.replace("_", " ").toUpperCase()}.`,
          is_read: false,
          link: "funding",
        });
      }
    }

    return {
      data: {
        ...fundRequest,
        items: insertedItems,
        budget_summary: budgetSummary,
      },
      error: null,
    };
  }

  /**
   * Get fund requests for a funded project.
   * Includes a budget summary showing total budget, approved, pending, and remaining.
   */
  async getFundRequests(input: GetFundRequestsInput) {
    let query = this.db
      .from("fund_requests")
      .select(
        `
        *,
        requested_by_user:users!requested_by (id, first_name, last_name),
        reviewed_by_user:users!reviewed_by (id, first_name, last_name),
        fund_request_items (*)
      `
      )
      .eq("funded_project_id", input.funded_project_id)
      .order("created_at", { ascending: true });

    if (input.status) {
      query = query.eq("status", input.status);
    }

    const { data, error } = await query;

    if (error) {
      return { data: null, error };
    }

    // Include budget summary so the frontend can show remaining funds
    const { data: budgetSummary } = await this.getBudgetSummary(input.funded_project_id);

    return {
      data: {
        fund_requests: data,
        budget_summary: budgetSummary,
      },
      error: null,
    };
  }

  /**
   * Review (approve/reject) a fund request - RND/Admin action
   */
  async reviewFundRequest(input: ReviewFundRequestInput) {
    const { data, error } = await this.db
      .from("fund_requests")
      .update({
        status: input.status,
        reviewed_by: input.reviewed_by,
        review_note: input.review_note || null,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.fund_request_id)
      .eq("status", "pending") // Can only review pending requests
      .select(
        `
        *,
        requested_by_user:users!requested_by (id, first_name, last_name)
      `
      )
      .single();

    if (error) {
      return { data: null, error };
    }

    if (!data) {
      return {
        data: null,
        error: { message: "Fund request not found or already reviewed." },
      };
    }

    await logActivity(this.db, {
      user_id: input.reviewed_by,
      action: `fund_request_${input.status}`,
      category: "project",
      target_id: String(input.fund_request_id),
      target_type: "fund_request",
      details: { review_note: input.review_note },
    });

    // Notify the proponent
    await this.db.from("notifications").insert({
      user_id: data.requested_by,
      message: `Your fund request has been ${input.status}.${input.review_note ? ` Note: ${input.review_note}` : ""}`,
      is_read: false,
      link: "project-monitoring",
    });

    // Send email notification (fire-and-forget)
    try {
      const { data: proponent } = await this.db
        .from("users")
        .select("email, first_name")
        .eq("id", data.requested_by)
        .single();

      if (proponent?.email && process.env.SMTP_USER) {
        const emailService = new EmailService();
        await emailService.sendNotificationEmail(
          proponent.email,
          proponent.first_name || "Proponent",
          `Fund Request ${input.status === "approved" ? "Approved" : "Rejected"}`,
          `Your fund request has been ${input.status}.${input.review_note ? ` Note: ${input.review_note}` : ""} Please log in to SPMAMS for details.`,
        );
      }
    } catch (emailErr) {
      console.error("Email notification failed (non-blocking):", emailErr);
    }

    return { data, error: null };
  }

  // ===================== CERTIFICATE =====================

  /**
   * Generate a completion certificate after all 4 quarterly reports are verified
   */
  async generateCertificate(input: GenerateCertificateInput) {
    // Verify all 4 quarterly reports exist and are verified
    const { data: reports, error: reportsError } = await this.db
      .from("project_reports")
      .select("quarterly_report, status")
      .eq("funded_project_id", input.funded_project_id);

    if (reportsError) {
      return { data: null, error: reportsError };
    }

    const quarters = ["q1_report", "q2_report", "q3_report", "q4_report"];
    const verifiedQuarters = (reports || [])
      .filter((r) => r.status === "verified")
      .map((r) => r.quarterly_report);

    const missingQuarters = quarters.filter((q) => !verifiedQuarters.includes(q));

    if (missingQuarters.length > 0) {
      return {
        data: null,
        error: {
          message: `Cannot issue certificate. The following quarters are not yet verified: ${missingQuarters.join(", ")}.`,
          code: "INCOMPLETE_REPORTS",
        },
      };
    }

    // Check if certificate was already issued
    const { data: project } = await this.db
      .from("funded_projects")
      .select("id, certificate_issued_at, project_lead_id, proposal_id")
      .eq("id", input.funded_project_id)
      .single();

    if (!project) {
      return { data: null, error: { message: "Funded project not found." } };
    }

    if (project.certificate_issued_at) {
      return {
        data: null,
        error: {
          message: "Certificate has already been issued for this project.",
          code: "CERTIFICATE_ALREADY_ISSUED",
        },
      };
    }

    // Mark project as completed and record certificate issuance
    const { data: updated, error: updateError } = await this.db
      .from("funded_projects")
      .update({
        status: "completed",
        certificate_issued_at: new Date().toISOString(),
        certificate_issued_by: input.issued_by,
      })
      .eq("id", input.funded_project_id)
      .select(
        `
        *,
        proposal:proposals (
          id,
          project_title,
          program_title,
          plan_start_date,
          plan_end_date,
          department:departments (id, name)
        ),
        project_lead:users!project_lead_id (
          id,
          first_name,
          last_name,
          email
        )
      `
      )
      .single();

    if (updateError) {
      return { data: null, error: updateError };
    }

    await logActivity(this.db, {
      user_id: input.issued_by,
      action: "certificate_issued",
      category: "project",
      target_id: String(input.funded_project_id),
      target_type: "funded_project",
    });

    // Notify the project lead
    await this.db.from("notifications").insert({
      user_id: project.project_lead_id,
      message: "Congratulations! A completion certificate has been issued for your project.",
      is_read: false,
      link: "project-monitoring",
    });

    // Send email notification (fire-and-forget)
    try {
      const { data: lead } = await this.db
        .from("users")
        .select("email, first_name")
        .eq("id", project.project_lead_id)
        .single();

      if (lead?.email && process.env.SMTP_USER) {
        const emailService = new EmailService();
        await emailService.sendNotificationEmail(
          lead.email,
          lead.first_name || "Proponent",
          "Completion Certificate Issued",
          "Congratulations! A completion certificate has been issued for your project. Please log in to SPMAMS to view it.",
        );
      }
    } catch (emailErr) {
      console.error("Email notification failed (non-blocking):", emailErr);
    }

    return { data: updated, error: null };
  }
}
