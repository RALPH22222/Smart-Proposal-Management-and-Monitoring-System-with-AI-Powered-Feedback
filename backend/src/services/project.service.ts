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
  RequestProjectExtensionInput,
  ReviewProjectExtensionInput,
  SubmitTerminalReportInput,
  VerifyTerminalReportInput,
} from "../schemas/project-schema";
import { ReportStatus, FundRequestStatus, ProjectMemberRole, ProjectMemberStatus } from "../types/project";
import { logActivity } from "../utils/activity-logger";
import { EmailService } from "./email.service";
import { deriveAccountType } from "./auth.service";
import {
  RequestRealignmentInput,
  ReviewRealignmentInput,
} from "../schemas/realignment-schema";

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
        ),
        fund_requests (status)
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

    // Calculate completion percentage based on latest report + surface two
    // actionable summaries so the monitoring dashboard can show them without
    // extra per-project calls.
    const projectsWithCompletion = data?.map((project) => {
      const latestReport = project.project_reports?.sort(
        (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )[0];

      const reports: any[] = project.project_reports || [];
      const fundRequests: any[] = project.fund_requests || [];

      const overdue_reports_count = reports.filter((r) => r.status === "overdue").length;
      const pending_fund_requests_count = fundRequests.filter(
        (fr) => fr.status === "pending",
      ).length;

      // Strip fund_requests from the outgoing payload — the monitoring UI
      // only needs the count, not the raw rows.
      const { fund_requests: _fr, ...rest } = project;

      return {
        ...rest,
        completion_percentage: latestReport?.progress || 0,
        reports_count: reports.length,
        overdue_reports_count,
        pending_fund_requests_count,
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
    // COI guard — lookup the project this report belongs to first.
    const { data: report } = await this.db
      .from("project_reports")
      .select("funded_project_id")
      .eq("id", input.report_id)
      .single();

    if (!report) {
      return { data: null, error: { message: "Project report not found." } };
    }

    const coi = await this.assertNoCoiOnProject(input.verified_by_id, report.funded_project_id);
    if (coi) {
      await logActivity(this.db, {
        user_id: input.verified_by_id,
        action: "coi_block_verify_report",
        category: "project",
        target_id: String(input.report_id),
        target_type: "report",
        details: { funded_project_id: report.funded_project_id },
      });
      return { data: null, error: { message: coi.message } };
    }

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
    // COI guard — updater must not be a member of the project.
    const coi = await this.assertNoCoiOnProject(input.updated_by_id, input.project_id);
    if (coi) {
      await logActivity(this.db, {
        user_id: input.updated_by_id,
        action: "coi_block_update_project_status",
        category: "project",
        target_id: String(input.project_id),
        target_type: "funded_project",
        details: { attempted_status: input.status },
      });
      return { data: null, error: { message: coi.message } };
    }

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
      .select("id, project_lead_id, proposal:proposals(project_title)")
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
      .select("email, first_name, last_name")
      .eq("id", input.invited_by)
      .single();

    if (inviter?.email === input.email) {
      return { data: null, error: { message: "You cannot invite yourself." } };
    }

    // Derived once — used by both the existing-user notification email and the
    // Supabase-invite email template data payload for new users.
    const projectTitle = (project as any).proposal?.project_title || "a funded project";
    const inviterName =
      [inviter?.first_name, inviter?.last_name].filter(Boolean).join(" ") ||
      "A project lead";

    // Check if user exists
    const { data: existingUser } = await this.db
      .from("users")
      .select("id, roles, first_name")
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

      try {
        if (process.env.SMTP_USER) {
          const frontendUrl = process.env.FRONTEND_URL || "https://www.wmsu-rdec.com";
          const emailService = new EmailService();
          await emailService.sendNotificationEmail(
            input.email,
            existingUser.first_name || "Co-lead",
            "Co-Lead Invitation",
            `${inviterName} has invited you to join "${projectTitle}" as a co-lead. Sign in and open Project Monitoring to accept or decline the invitation.`,
            "View Invitation",
            `${frontendUrl}/login`,
          );
        }
      } catch (emailErr) {
        console.error("Co-lead invite email failed (non-blocking):", emailErr);
      }

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
          data: {
            roles: ["proponent"],
            invite_type: "colead",
            project_title: projectTitle,
            inviter_name: inviterName,
          },
          redirectTo,
        });

      if (inviteError) {
        return { data: null, error: { message: inviteError.message } };
      }

      // Insert as pending member (will be activated on profile completion)
      const newUserId = inviteData.user.id;

      // Tag the freshly-created user as external/internal based on invite email domain.
      // Default column value is 'internal' so we only write for external invitees. The
      // public.users row was auto-created by Supabase's trigger when inviteUserByEmail ran.
      if (deriveAccountType(input.email) === "external") {
        const { error: accountTypeError } = await this.db
          .from("users")
          .update({ account_type: "external" })
          .eq("id", newUserId);
        if (accountTypeError) {
          console.error(
            "Failed to set account_type=external on invited user (non-critical):",
            accountTypeError,
          );
        }
      }

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
   * Conflict-of-interest guard. Returns an error object if `userId` is a
   * lead or co-lead on `fundedProjectId` (status active or pending). The
   * caller is responsible for surfacing the error to the client and writing
   * the audit log entry — this method does not log on its own so each
   * decision endpoint can record its own action name.
   */
  async assertNoCoiOnProject(userId: string, fundedProjectId: number) {
    const { data: membership } = await this.db
      .from("project_members")
      .select("id, role")
      .eq("user_id", userId)
      .eq("funded_project_id", fundedProjectId)
      .in("status", [ProjectMemberStatus.ACTIVE, ProjectMemberStatus.PENDING])
      .maybeSingle();

    if (membership) {
      return {
        coi: true as const,
        message:
          "Conflict of interest: you are a member of this project and cannot perform this action. Another R&D officer or admin must handle it.",
      };
    }

    return null;
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
    // Phase 4 of LIB feature: read from the structured budget tables instead of the legacy
    // estimated_budget. The active version reflects any approved realignments — the legacy
    // table is now read-only audit history and would silently return stale totals.
    const versionResult = await this.getActiveBudgetVersion(fundedProjectId);
    if (versionResult.error || !versionResult.data) {
      return { data: null, error: versionResult.error ?? { message: "Funded project not found." } };
    }

    const version = versionResult.data.version;
    const totalBudget = Number(version.grand_total) || 0;

    const budgetByCategory = { ps: 0, mooe: 0, co: 0 };
    for (const item of version.items ?? []) {
      const cat = item.category as keyof typeof budgetByCategory;
      if (cat in budgetByCategory) {
        budgetByCategory[cat] += Number(item.total_amount) || 0;
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
    // Phase 4 of LIB feature: block fund-request creation while a realignment is pending
    // R&D review. Otherwise the fund_request_items.budget_item_id would point to an item
    // in the old budget version — once the realignment is approved, that budget line is
    // no longer the active one, and the per-line floor validation on future realignments
    // wouldn't see that committed spend. Revision_requested is NOT blocked since the
    // realignment can't be approved without the proponent resubmitting first.
    const { data: pendingRealignment } = await this.db
      .from("budget_realignments")
      .select("id")
      .eq("funded_project_id", input.funded_project_id)
      .eq("status", "pending_review")
      .maybeSingle();

    if (pendingRealignment) {
      return {
        data: null,
        error: {
          message:
            "Cannot submit a fund request while a budget realignment is under R&D review. Wait for the realignment decision first.",
          code: "REALIGNMENT_IN_PROGRESS",
        },
      };
    }

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

    // Phase 4 of LIB feature: when budget_item_id is provided, re-derive item_name and
    // category from the linked budget item server-side (don't trust client). Also verify
    // the item belongs to this project's active budget version so a malicious client
    // can't link to some other project's line.
    let resolvedItems = input.items;
    const linkedIds = input.items
      .map((it) => it.budget_item_id)
      .filter((id): id is number => typeof id === "number" && id > 0);

    if (linkedIds.length > 0) {
      const versionResult = await this.getActiveBudgetVersion(input.funded_project_id);
      if (versionResult.error || !versionResult.data) {
        return {
          data: null,
          error: { message: "Could not load the project's active budget for validation." },
        };
      }
      const validIds = new Map<number, { item_name: string; category: string }>();
      for (const item of versionResult.data.version.items ?? []) {
        validIds.set(Number(item.id), {
          item_name: item.item_name,
          category: item.category as string,
        });
      }

      for (const it of input.items) {
        if (it.budget_item_id == null) continue;
        if (!validIds.has(it.budget_item_id)) {
          return {
            data: null,
            error: {
              message: `Budget item ${it.budget_item_id} does not belong to this project's active budget.`,
              code: "INVALID_BUDGET_ITEM",
            },
          };
        }
      }

      resolvedItems = input.items.map((it) => {
        if (it.budget_item_id == null) return it;
        const linked = validIds.get(it.budget_item_id)!;
        return {
          ...it,
          item_name: linked.item_name,
          category: linked.category as typeof it.category,
        };
      });
    }

    // Insert all items
    const items = resolvedItems.map((item) => ({
      fund_request_id: fundRequest.id,
      budget_item_id: item.budget_item_id ?? null,
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
    // COI guard — lookup the project this fund request belongs to first.
    const { data: fundRequest } = await this.db
      .from("fund_requests")
      .select("funded_project_id")
      .eq("id", input.fund_request_id)
      .single();

    if (!fundRequest) {
      return { data: null, error: { message: "Fund request not found." } };
    }

    const coi = await this.assertNoCoiOnProject(input.reviewed_by, fundRequest.funded_project_id);
    if (coi) {
      await logActivity(this.db, {
        user_id: input.reviewed_by,
        action: "coi_block_review_fund_request",
        category: "project",
        target_id: String(input.fund_request_id),
        target_type: "fund_request",
        details: { funded_project_id: fundRequest.funded_project_id, attempted_status: input.status },
      });
      return { data: null, error: { message: coi.message } };
    }

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
        const frontendUrl = process.env.FRONTEND_URL || "https://www.wmsu-rdec.com";
        const emailService = new EmailService();
        await emailService.sendNotificationEmail(
          proponent.email,
          proponent.first_name || "Proponent",
          `Fund Request ${input.status === "approved" ? "Approved" : "Rejected"}`,
          `Your fund request has been ${input.status}.${input.review_note ? ` Note: ${input.review_note}` : ""} Sign in to SPMAMS for details.`,
          "View Project Monitoring",
          `${frontendUrl}/login`,
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
    // COI guard — issuer must not be a member of the project being certified.
    const coi = await this.assertNoCoiOnProject(input.issued_by, input.funded_project_id);
    if (coi) {
      await logActivity(this.db, {
        user_id: input.issued_by,
        action: "coi_block_generate_certificate",
        category: "project",
        target_id: String(input.funded_project_id),
        target_type: "funded_project",
        details: {},
      });
      return { data: null, error: { message: coi.message } };
    }

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

    // Check terminal report is verified
    const { data: terminalReport } = await this.db
      .from("project_terminal_reports")
      .select("id, status")
      .eq("funded_project_id", input.funded_project_id)
      .single();

    if (!terminalReport || terminalReport.status !== "verified") {
      return {
        data: null,
        error: {
          message: "Cannot issue certificate. Terminal report has not been submitted or verified.",
          code: "TERMINAL_REPORT_NOT_VERIFIED",
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
        const frontendUrl = process.env.FRONTEND_URL || "https://www.wmsu-rdec.com";
        const emailService = new EmailService();
        await emailService.sendNotificationEmail(
          lead.email,
          lead.first_name || "Proponent",
          "Completion Certificate Issued",
          "Congratulations! A completion certificate has been issued for your project. Sign in to SPMAMS to view and download it.",
          "View Certificate",
          `${frontendUrl}/login`,
        );
      }
    } catch (emailErr) {
      console.error("Email notification failed (non-blocking):", emailErr);
    }

    return { data: updated, error: null };
  }

  // ============================================================
  // Phase 3 of LIB feature: Budget realignment workflow
  // ============================================================

  // Returns the active budget version for a funded project, including all line items.
  // Lazily backfills funded_projects.current_budget_version_id from the latest version
  // if it's NULL — covers funded_projects rows created BEFORE Phase 1 deploy or by code
  // paths that don't yet set the column. Cleaned up properly in Phase 4.
  async getActiveBudgetVersion(fundedProjectId: number) {
    const { data: project, error: projectError } = await this.db
      .from("funded_projects")
      .select("id, proposal_id, current_budget_version_id")
      .eq("id", fundedProjectId)
      .maybeSingle();

    if (projectError || !project) {
      return { data: null, error: projectError ?? new Error("Funded project not found") };
    }

    let versionId: number | null = project.current_budget_version_id ?? null;

    if (!versionId) {
      const { data: latest } = await this.db
        .from("proposal_budget_versions")
        .select("id")
        .eq("proposal_id", project.proposal_id)
        .order("version_number", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!latest) {
        return {
          data: null,
          error: new Error(
            "No structured budget version exists for this proposal yet. The proponent must resubmit the budget after Phase 1 deploy.",
          ),
        };
      }

      versionId = latest.id as number;

      await this.db
        .from("funded_projects")
        .update({ current_budget_version_id: versionId })
        .eq("id", fundedProjectId);
    }

    const { data: version, error: versionError } = await this.db
      .from("proposal_budget_versions")
      .select(
        `
        id, proposal_id, version_number, grand_total, created_at,
        items:proposal_budget_items (
          id, source, category, subcategory_id, custom_subcategory_label,
          item_name, spec, quantity, unit, unit_price, total_amount, display_order, notes
        )
      `,
      )
      .eq("id", versionId)
      .single();

    if (versionError || !version) {
      return { data: null, error: versionError ?? new Error("Budget version not found") };
    }

    return {
      data: {
        funded_project_id: project.id,
        proposal_id: project.proposal_id,
        version,
      },
      error: null,
    };
  }

  async requestRealignment(args: { input: RequestRealignmentInput; requested_by: string }) {
    const { input, requested_by } = args;

    const versionResult = await this.getActiveBudgetVersion(input.funded_project_id);
    if (versionResult.error || !versionResult.data) {
      return { data: null, error: versionResult.error };
    }
    const { version: fromVersion } = versionResult.data;

    // Hard ceiling: new grand total cannot exceed baseline. Compare in integer cents to
    // avoid floating-point drift that would otherwise reject a strictly-equal realignment.
    const newGrandTotalCents = input.items.reduce(
      (sum, item) => sum + Math.round(item.totalAmount * 100),
      0,
    );
    const baselineCents = Math.round((Number(fromVersion.grand_total) || 0) * 100);

    if (newGrandTotalCents > baselineCents) {
      return {
        data: null,
        error: new Error(
          `New grand total (₱${(newGrandTotalCents / 100).toFixed(2)}) exceeds the original ceiling (₱${(baselineCents / 100).toFixed(2)}).`,
        ),
      };
    }

    // Phase 4 of LIB feature: per-line floor validation. For each existing budget item
    // that has approved fund_request_items linked to it, the new total must be ≥ the
    // already-approved sum. Removing such an item is also blocked.
    const baselineItems = (fromVersion.items ?? []) as Array<{
      id: number;
      category: string;
      item_name: string;
      spec: string | null;
      total_amount: number;
    }>;
    const baselineItemIds = baselineItems.map((it) => it.id);

    if (baselineItemIds.length > 0) {
      const { data: linkedFundItems } = await this.db
        .from("fund_request_items")
        .select("budget_item_id, amount, fund_requests!inner(status)")
        .in("budget_item_id", baselineItemIds);

      const approvedByItemId = new Map<number, number>();
      for (const row of linkedFundItems ?? []) {
        const r = row as any;
        const status = r.fund_requests?.status;
        if (status !== "approved") continue;
        const itemId = r.budget_item_id as number | null;
        if (itemId == null) continue;
        approvedByItemId.set(itemId, (approvedByItemId.get(itemId) ?? 0) + (Number(r.amount) || 0));
      }

      if (approvedByItemId.size > 0) {
        // Build a quick lookup from match key → proposed item total so we can detect
        // both "removed" and "reduced below floor" in one pass.
        const proposedByKey = new Map<string, number>();
        const makeKey = (cat: string, name: string, spec: string | null) =>
          `${cat}|${(name ?? "").trim().toLowerCase()}|${(spec ?? "").trim().toLowerCase()}`;

        for (const item of input.items) {
          const key = makeKey(item.category, item.itemName, item.spec ?? null);
          proposedByKey.set(key, (proposedByKey.get(key) ?? 0) + Number(item.totalAmount));
        }

        for (const baseline of baselineItems) {
          const approvedFloor = approvedByItemId.get(baseline.id);
          if (!approvedFloor || approvedFloor <= 0) continue;

          const key = makeKey(baseline.category, baseline.item_name, baseline.spec);
          const proposedTotal = proposedByKey.get(key);

          if (proposedTotal == null) {
            return {
              data: null,
              error: new Error(
                `Cannot remove "${baseline.item_name}" — ₱${approvedFloor.toFixed(2)} has already been approved against this line. Adjust the line's amount instead, or wait until those fund requests are completed.`,
              ),
            };
          }

          if (Math.round(proposedTotal * 100) < Math.round(approvedFloor * 100)) {
            return {
              data: null,
              error: new Error(
                `Cannot reduce "${baseline.item_name}" below ₱${approvedFloor.toFixed(2)} — that amount has already been approved in fund requests.`,
              ),
            };
          }
        }
      }
    }

    // Friendly check before the unique index slams the door. Two branches:
    //   - pending_review  → reject outright; R&D still has it in their queue
    //   - revision_requested → update the existing row in place, flip back to pending_review.
    //     This is how proponents respond to R&D's "please revise" feedback — same realignment
    //     row (so the diff history stays simple), new items, new reason, cleared review trail.
    const { data: existingPending } = await this.db
      .from("budget_realignments")
      .select("id, status, requested_by")
      .eq("funded_project_id", input.funded_project_id)
      .in("status", ["pending_review", "revision_requested"])
      .maybeSingle();

    if (existingPending?.status === "pending_review") {
      return {
        data: null,
        error: new Error(
          "There is already a realignment pending review for this project. Wait for R&D to respond first.",
        ),
      };
    }

    const newGrandTotal = newGrandTotalCents / 100;

    if (existingPending?.status === "revision_requested") {
      // Lock down re-submission to the original requester so one co-lead can't hijack another's
      // revision in flight. In practice the UI only surfaces the revise button on projects the
      // user is a member of, but better to enforce it here too.
      if (existingPending.requested_by && existingPending.requested_by !== requested_by) {
        return {
          data: null,
          error: new Error(
            "Only the proponent who submitted the original realignment can resubmit this revision.",
          ),
        };
      }

      const { data: updated, error: updateError } = await this.db
        .from("budget_realignments")
        .update({
          status: "pending_review",
          from_version_id: fromVersion.id,
          reason: input.reason,
          file_url: input.file_url ?? null,
          proposed_payload: { items: input.items, grand_total: newGrandTotal },
          reviewed_by: null,
          reviewed_at: null,
          review_note: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingPending.id)
        .select()
        .single();

      if (updateError || !updated) {
        return {
          data: null,
          error: updateError ?? new Error("Failed to resubmit the revised realignment"),
        };
      }

      // Notify R&D again so they know it's back in their queue.
      try {
        const { data: rndUsers } = await this.db
          .from("users")
          .select("id")
          .contains("roles", ["rnd"]);

        const { data: projectInfo } = await this.db
          .from("funded_projects")
          .select("proposal_id, proposals!inner(project_title)")
          .eq("id", input.funded_project_id)
          .single();

        const projectTitle = (projectInfo as any)?.proposals?.project_title ?? "a funded project";

        if (rndUsers && rndUsers.length > 0) {
          const notifications = rndUsers.map((u) => ({
            user_id: u.id,
            message: `A revised budget realignment has been resubmitted for "${projectTitle}".`,
            is_read: false,
            link: "funding",
          }));
          await this.db.from("notifications").insert(notifications);
        }
      } catch (notifErr) {
        console.error("Realignment resubmit notification failed (non-blocking):", notifErr);
      }

      await logActivity(this.db, {
        user_id: requested_by,
        action: "budget_realignment_resubmitted",
        category: "project",
        target_id: String(updated.id),
        target_type: "budget_realignment",
        details: {
          funded_project_id: input.funded_project_id,
          from_version_id: fromVersion.id,
          proposed_grand_total: newGrandTotal,
        },
      });

      return { data: updated, error: null };
    }

    const { data: inserted, error: insertError } = await this.db
      .from("budget_realignments")
      .insert({
        funded_project_id: input.funded_project_id,
        from_version_id: fromVersion.id,
        to_version_id: null,
        status: "pending_review",
        reason: input.reason,
        file_url: input.file_url ?? null,
        proposed_payload: { items: input.items, grand_total: newGrandTotal },
        requested_by,
      })
      .select()
      .single();

    if (insertError || !inserted) {
      return { data: null, error: insertError ?? new Error("Failed to create realignment request") };
    }

    // Notify R&D users — fire and forget so SMTP / DB hiccups don't fail the request.
    try {
      const { data: rndUsers } = await this.db
        .from("users")
        .select("id")
        .contains("roles", ["rnd"]);

      const { data: projectInfo } = await this.db
        .from("funded_projects")
        .select("proposal_id, proposals!inner(project_title)")
        .eq("id", input.funded_project_id)
        .single();

      const projectTitle = (projectInfo as any)?.proposals?.project_title ?? "a funded project";

      if (rndUsers && rndUsers.length > 0) {
        const notifications = rndUsers.map((u) => ({
          user_id: u.id,
          message: `A budget realignment request has been submitted for "${projectTitle}".`,
          is_read: false,
          link: "funding",
        }));
        await this.db.from("notifications").insert(notifications);
      }
    } catch (notifErr) {
      console.error("Realignment request notification failed (non-blocking):", notifErr);
    }

    await logActivity(this.db, {
      user_id: requested_by,
      action: "budget_realignment_requested",
      category: "project",
      target_id: String(inserted.id),
      target_type: "budget_realignment",
      details: {
        funded_project_id: input.funded_project_id,
        from_version_id: fromVersion.id,
        baseline_grand_total: baselineCents / 100,
        proposed_grand_total: newGrandTotal,
      },
    });

    return { data: inserted, error: null };
  }

  async reviewRealignment(args: { input: ReviewRealignmentInput; reviewed_by: string }) {
    const { input, reviewed_by } = args;

    const { data: realignment, error: fetchError } = await this.db
      .from("budget_realignments")
      .select("id, funded_project_id, from_version_id, status, requested_by, proposed_payload")
      .eq("id", input.realignment_id)
      .maybeSingle();

    if (fetchError || !realignment) {
      return { data: null, error: fetchError ?? new Error("Realignment not found") };
    }

    if (!["pending_review", "revision_requested"].includes(realignment.status)) {
      return {
        data: null,
        error: new Error(`This realignment is already ${realignment.status} and cannot be reviewed again.`),
      };
    }

    const now = new Date().toISOString();
    let to_version_id: number | null = null;
    let new_status: "approved" | "rejected" | "revision_requested";

    if (input.action === "approve") {
      const { data: project } = await this.db
        .from("funded_projects")
        .select("proposal_id")
        .eq("id", realignment.funded_project_id)
        .single();

      if (!project) {
        return { data: null, error: new Error("Funded project not found") };
      }

      const { data: latestVersion } = await this.db
        .from("proposal_budget_versions")
        .select("version_number")
        .eq("proposal_id", project.proposal_id)
        .order("version_number", { ascending: false })
        .limit(1)
        .maybeSingle();

      const nextVersionNumber = (latestVersion?.version_number ?? 1) + 1;
      const payload = realignment.proposed_payload as { items: any[]; grand_total: number };
      const items = payload.items ?? [];
      const grandTotal =
        payload.grand_total ?? items.reduce((s, it) => s + (Number(it.totalAmount) || 0), 0);

      const { data: newVersion, error: vErr } = await this.db
        .from("proposal_budget_versions")
        .insert({
          proposal_id: project.proposal_id,
          version_number: nextVersionNumber,
          grand_total: grandTotal,
          created_by: reviewed_by,
        })
        .select("id")
        .single();

      if (vErr || !newVersion) {
        return { data: null, error: vErr ?? new Error("Failed to create new budget version") };
      }

      if (items.length > 0) {
        const itemRows = items.map((it: any, idx: number) => ({
          version_id: newVersion.id,
          source: it.source,
          category: it.category,
          subcategory_id: it.subcategoryId ?? null,
          custom_subcategory_label: it.customSubcategoryLabel ?? null,
          item_name: it.itemName,
          spec: it.spec ?? null,
          quantity: it.quantity,
          unit: it.unit ?? null,
          unit_price: it.unitPrice,
          total_amount: it.totalAmount,
          display_order: it.displayOrder ?? idx + 1,
          notes: it.notes ?? null,
        }));

        const { error: itemsErr } = await this.db.from("proposal_budget_items").insert(itemRows);

        if (itemsErr) {
          // Cleanup the orphaned version row so a retry can succeed.
          await this.db.from("proposal_budget_versions").delete().eq("id", newVersion.id);
          return { data: null, error: itemsErr };
        }
      }

      // Flip the active version pointer.
      const { error: pointerErr } = await this.db
        .from("funded_projects")
        .update({ current_budget_version_id: newVersion.id })
        .eq("id", realignment.funded_project_id);

      if (pointerErr) {
        // The version + items exist, the pointer doesn't. Surface the error so the user
        // can retry — the unique index won't prevent it because the realignment is still pending.
        return { data: null, error: pointerErr };
      }

      to_version_id = newVersion.id as number;
      new_status = "approved";
    } else if (input.action === "reject") {
      new_status = "rejected";
    } else {
      new_status = "revision_requested";
    }

    const { data: updated, error: updateError } = await this.db
      .from("budget_realignments")
      .update({
        status: new_status,
        reviewed_by,
        reviewed_at: now,
        review_note: input.review_note ?? null,
        to_version_id,
        updated_at: now,
      })
      .eq("id", input.realignment_id)
      .select()
      .single();

    if (updateError) {
      return { data: null, error: updateError };
    }

    // Notify the proponent.
    try {
      const { data: projectInfo } = await this.db
        .from("funded_projects")
        .select("proposal_id, proposals!inner(project_title)")
        .eq("id", realignment.funded_project_id)
        .single();

      const projectTitle = (projectInfo as any)?.proposals?.project_title ?? "your project";
      const verb =
        input.action === "approve"
          ? "approved"
          : input.action === "reject"
            ? "rejected"
            : "marked for revision";

      await this.db.from("notifications").insert({
        user_id: realignment.requested_by,
        message: `Your budget realignment for "${projectTitle}" has been ${verb}.`,
        is_read: false,
        link: "monitoring",
      });
    } catch (notifErr) {
      console.error("Realignment decision notification failed (non-blocking):", notifErr);
    }

    await logActivity(this.db, {
      user_id: reviewed_by,
      action: `budget_realignment_${input.action}`,
      category: "project",
      target_id: String(input.realignment_id),
      target_type: "budget_realignment",
      details: {
        funded_project_id: realignment.funded_project_id,
        from_version_id: realignment.from_version_id,
        to_version_id,
      },
    });

    return { data: updated, error: null };
  }

  // Returns one realignment with both versions inlined for the diff view.
  async getRealignment(realignmentId: number) {
    const { data, error } = await this.db
      .from("budget_realignments")
      .select(
        `
        id, funded_project_id, from_version_id, to_version_id,
        status, reason, file_url, proposed_payload,
        requested_by, reviewed_by, reviewed_at, review_note,
        created_at, updated_at,
        requester:users!budget_realignments_requested_by_fkey (id, first_name, last_name, email),
        reviewer:users!budget_realignments_reviewed_by_fkey (id, first_name, last_name, email),
        funded_project:funded_projects!inner (
          id, proposal_id,
          proposals!inner (id, project_title)
        ),
        from_version:proposal_budget_versions!budget_realignments_from_version_id_fkey (
          id, version_number, grand_total, created_at,
          items:proposal_budget_items (
            id, source, category, subcategory_id, custom_subcategory_label,
            item_name, spec, quantity, unit, unit_price, total_amount, display_order
          )
        ),
        to_version:proposal_budget_versions!budget_realignments_to_version_id_fkey (
          id, version_number, grand_total, created_at,
          items:proposal_budget_items (
            id, source, category, subcategory_id, custom_subcategory_label,
            item_name, spec, quantity, unit, unit_price, total_amount, display_order
          )
        )
      `,
      )
      .eq("id", realignmentId)
      .maybeSingle();

    return { data, error };
  }

  // Lists realignments with role-based filtering. R&D / admin see everything; proponents
  // see only their own. Optional status filter for the RND tab UI.
  async listRealignments(args: {
    status?: string;
    funded_project_id?: number;
    user_id?: string;
    user_roles?: string[];
  }) {
    let query = this.db
      .from("budget_realignments")
      .select(
        `
        id, funded_project_id, from_version_id, to_version_id,
        status, reason, requested_by, reviewed_by, reviewed_at, review_note,
        created_at, updated_at, file_url, proposed_payload,
        requester:users!budget_realignments_requested_by_fkey (id, first_name, last_name, email),
        funded_project:funded_projects!inner (
          id, proposal_id,
          proposals!inner (id, project_title)
        ),
        from_version:proposal_budget_versions!budget_realignments_from_version_id_fkey (id, version_number, grand_total)
      `,
      )
      .order("created_at", { ascending: false });

    if (args.status) query = query.eq("status", args.status);
    if (args.funded_project_id) query = query.eq("funded_project_id", args.funded_project_id);

    const isPrivileged =
      Array.isArray(args.user_roles) && (args.user_roles.includes("rnd") || args.user_roles.includes("admin"));

    // Proponents only see their own requests.
    if (!isPrivileged && args.user_id) {
      query = query.eq("requested_by", args.user_id);
    }

    return query;
  }

  // ===================== PROJECT EXTENSIONS =====================

  async requestProjectExtension(input: RequestProjectExtensionInput) {
    // Check for existing pending extension request (prevent duplicates)
    const { data: existing } = await this.db
      .from("project_extension_requests")
      .select("id")
      .eq("funded_project_id", input.funded_project_id)
      .eq("status", "pending")
      .single();

    if (existing) {
      return {
        data: null,
        error: {
          message: "There is already a pending extension request for this project.",
          code: "DUPLICATE_EXTENSION_REQUEST",
        },
      };
    }

    const { data, error } = await this.db
      .from("project_extension_requests")
      .insert({
        funded_project_id: input.funded_project_id,
        extension_type: input.extension_type,
        new_end_date: input.new_end_date,
        reason: input.reason,
        requested_by: input.requested_by,
        status: "pending",
      })
      .select(
        `
        *,
        requested_by_user:users!project_extension_requests_requested_by_fkey (id, first_name, last_name)
      `
      )
      .single();

    if (error) {
      return { data: null, error };
    }

    await logActivity(this.db, {
      user_id: input.requested_by,
      action: "project_extension_requested",
      category: "project",
      target_id: String(input.funded_project_id),
      target_type: "funded_project",
      details: {
        extension_request_id: data.id,
        extension_type: input.extension_type,
        new_end_date: input.new_end_date,
      },
    });

    // Notify assigned RND user
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
        const typeLabel = input.extension_type === "time_only" ? "time-only" : "with funding";
        await this.db.from("notifications").insert({
          user_id: rndAssignment.rnd_id,
          message: `A project extension request (${typeLabel}) has been submitted for review.`,
          is_read: false,
          link: "project-monitoring",
        });
      }
    }

    return { data, error: null };
  }

  async reviewProjectExtension(input: ReviewProjectExtensionInput) {
    // Lookup the extension request to get the project ID for COI check
    const { data: extensionRequest } = await this.db
      .from("project_extension_requests")
      .select("funded_project_id")
      .eq("id", input.extension_request_id)
      .single();

    if (!extensionRequest) {
      return { data: null, error: { message: "Extension request not found." } };
    }

    // COI guard
    const coi = await this.assertNoCoiOnProject(input.reviewed_by, extensionRequest.funded_project_id);
    if (coi) {
      await logActivity(this.db, {
        user_id: input.reviewed_by,
        action: "coi_block_review_extension",
        category: "project",
        target_id: String(input.extension_request_id),
        target_type: "funded_project",
        details: { funded_project_id: extensionRequest.funded_project_id, attempted_status: input.status },
      });
      return { data: null, error: { message: coi.message } };
    }

    const { data, error } = await this.db
      .from("project_extension_requests")
      .update({
        status: input.status,
        reviewed_by: input.reviewed_by,
        review_note: input.review_note || null,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", input.extension_request_id)
      .eq("status", "pending") // Can only review pending requests
      .select(
        `
        *,
        requested_by_user:users!project_extension_requests_requested_by_fkey (id, first_name, last_name)
      `
      )
      .single();

    if (error) {
      return { data: null, error };
    }

    if (!data) {
      return {
        data: null,
        error: { message: "Extension request not found or already reviewed." },
      };
    }

    await logActivity(this.db, {
      user_id: input.reviewed_by,
      action: `project_extension_${input.status}`,
      category: "project",
      target_id: String(input.extension_request_id),
      target_type: "funded_project",
      details: { review_note: input.review_note },
    });

    // Notify the proponent
    await this.db.from("notifications").insert({
      user_id: data.requested_by,
      message: `Your project extension request has been ${input.status}.${input.review_note ? ` Note: ${input.review_note}` : ""}`,
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
        const frontendUrl = process.env.FRONTEND_URL || "https://www.wmsu-rdec.com";
        const emailService = new EmailService();
        await emailService.sendNotificationEmail(
          proponent.email,
          proponent.first_name || "Proponent",
          `Extension Request ${input.status === "approved" ? "Approved" : "Rejected"}`,
          `Your project extension request has been ${input.status}.${input.review_note ? ` Note: ${input.review_note}` : ""} Sign in to SPMAMS for details.`,
          "View Project Monitoring",
          `${frontendUrl}/login`,
        );
      }
    } catch (emailErr) {
      console.error("Email notification failed (non-blocking):", emailErr);
    }

    return { data, error: null };
  }

  async getProjectExtensionRequests(input: { funded_project_id: number }) {
    const { data, error } = await this.db
      .from("project_extension_requests")
      .select(
        `
        *,
        requested_by_user:users!project_extension_requests_requested_by_fkey (id, first_name, last_name),
        reviewed_by_user:users!project_extension_requests_reviewed_by_fkey (id, first_name, last_name)
      `
      )
      .eq("funded_project_id", input.funded_project_id)
      .order("created_at", { ascending: false });

    if (error) {
      return { data: null, error };
    }

    return { data, error: null };
  }

  // ===================== TERMINAL REPORT =====================

  async submitTerminalReport(input: SubmitTerminalReportInput) {
    // Check all 4 quarterly reports are verified
    const { data: reports } = await this.db
      .from("project_reports")
      .select("quarterly_report, status")
      .eq("funded_project_id", input.funded_project_id);

    const quarters = ["q1_report", "q2_report", "q3_report", "q4_report"];
    const verifiedQuarters = (reports || [])
      .filter((r) => r.status === "verified")
      .map((r) => r.quarterly_report);
    const missingQuarters = quarters.filter((q) => !verifiedQuarters.includes(q));

    if (missingQuarters.length > 0) {
      return {
        data: null,
        error: {
          message: `All quarterly reports must be verified before submitting a terminal report. Missing: ${missingQuarters.join(", ")}.`,
          code: "INCOMPLETE_REPORTS",
        },
      };
    }

    // Check no existing terminal report
    const { data: existing } = await this.db
      .from("project_terminal_reports")
      .select("id")
      .eq("funded_project_id", input.funded_project_id)
      .single();

    if (existing) {
      return {
        data: null,
        error: {
          message: "A terminal report has already been submitted for this project.",
          code: "TERMINAL_REPORT_EXISTS",
        },
      };
    }

    const { data, error } = await this.db
      .from("project_terminal_reports")
      .insert({
        funded_project_id: input.funded_project_id,
        actual_start_date: input.actual_start_date || null,
        actual_end_date: input.actual_end_date || null,
        accomplishments: input.accomplishments,
        outputs_publications: input.outputs_publications || null,
        outputs_patents_ip: input.outputs_patents_ip || null,
        outputs_products: input.outputs_products || null,
        outputs_people: input.outputs_people || null,
        outputs_partnerships: input.outputs_partnerships || null,
        outputs_policy: input.outputs_policy || null,
        problems_encountered: input.problems_encountered || null,
        suggested_solutions: input.suggested_solutions || null,
        publications_list: input.publications_list || null,
        report_file_url: input.report_file_url || null,
        status: "submitted",
        submitted_by: input.submitted_by,
      })
      .select(
        `
        *,
        submitted_by_user:users!project_terminal_reports_submitted_by_fkey (id, first_name, last_name)
      `
      )
      .single();

    if (error) {
      return { data: null, error };
    }

    await logActivity(this.db, {
      user_id: input.submitted_by,
      action: "terminal_report_submitted",
      category: "project",
      target_id: String(input.funded_project_id),
      target_type: "funded_project",
      details: { terminal_report_id: data.id },
    });

    // Notify assigned RND user
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
          message: "A terminal report has been submitted and is awaiting your verification.",
          is_read: false,
          link: "project-monitoring",
        });
      }
    }

    return { data, error: null };
  }

  async verifyTerminalReport(input: VerifyTerminalReportInput) {
    // Lookup the terminal report to get the project ID for COI check
    const { data: terminalReport } = await this.db
      .from("project_terminal_reports")
      .select("funded_project_id")
      .eq("id", input.terminal_report_id)
      .single();

    if (!terminalReport) {
      return { data: null, error: { message: "Terminal report not found." } };
    }

    // COI guard
    const coi = await this.assertNoCoiOnProject(input.verified_by, terminalReport.funded_project_id);
    if (coi) {
      await logActivity(this.db, {
        user_id: input.verified_by,
        action: "coi_block_verify_terminal_report",
        category: "project",
        target_id: String(input.terminal_report_id),
        target_type: "funded_project",
        details: { funded_project_id: terminalReport.funded_project_id },
      });
      return { data: null, error: { message: coi.message } };
    }

    const { data, error } = await this.db
      .from("project_terminal_reports")
      .update({
        status: "verified",
        verified_by: input.verified_by,
        verified_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.terminal_report_id)
      .eq("status", "submitted") // Can only verify submitted reports
      .select(
        `
        *,
        submitted_by_user:users!project_terminal_reports_submitted_by_fkey (id, first_name, last_name)
      `
      )
      .single();

    if (error) {
      return { data: null, error };
    }

    if (!data) {
      return {
        data: null,
        error: { message: "Terminal report not found or already verified." },
      };
    }

    await logActivity(this.db, {
      user_id: input.verified_by,
      action: "terminal_report_verified",
      category: "project",
      target_id: String(input.terminal_report_id),
      target_type: "funded_project",
      details: { funded_project_id: terminalReport.funded_project_id },
    });

    // Notify the proponent
    await this.db.from("notifications").insert({
      user_id: data.submitted_by,
      message: "Your terminal report has been verified. A completion certificate can now be issued.",
      is_read: false,
      link: "project-monitoring",
    });

    // Send email notification (fire-and-forget)
    try {
      const { data: proponent } = await this.db
        .from("users")
        .select("email, first_name")
        .eq("id", data.submitted_by)
        .single();

      if (proponent?.email && process.env.SMTP_USER) {
        const frontendUrl = process.env.FRONTEND_URL || "https://www.wmsu-rdec.com";
        const emailService = new EmailService();
        await emailService.sendNotificationEmail(
          proponent.email,
          proponent.first_name || "Proponent",
          "Terminal Report Verified",
          "Your terminal report has been verified and approved. A completion certificate can now be issued for your project. Sign in to SPMAMS for details.",
          "View Project Monitoring",
          `${frontendUrl}/login`,
        );
      }
    } catch (emailErr) {
      console.error("Email notification failed (non-blocking):", emailErr);
    }

    return { data, error: null };
  }

  async getTerminalReport(input: { funded_project_id: number }) {
    const { data, error } = await this.db
      .from("project_terminal_reports")
      .select(
        `
        *,
        submitted_by_user:users!project_terminal_reports_submitted_by_fkey (id, first_name, last_name),
        verified_by_user:users!project_terminal_reports_verified_by_fkey (id, first_name, last_name)
      `
      )
      .eq("funded_project_id", input.funded_project_id)
      .maybeSingle();

    if (error) {
      return { data: null, error };
    }

    return { data: data || null, error: null };
  }

  // ===================== FINANCIAL REPORT (Auto-Generated) =====================

  async getFinancialReport(fundedProjectId: number) {
    // 1. Get the active budget version with line items
    const versionResult = await this.getActiveBudgetVersion(fundedProjectId);
    if (versionResult.error || !versionResult.data) {
      return { data: null, error: versionResult.error ?? new Error("No budget version found.") };
    }

    const version = versionResult.data.version;
    const budgetItems = version.items || [];

    // 2. Get all approved fund requests with items for this project
    const { data: fundRequests } = await this.db
      .from("fund_requests")
      .select(`
        id, quarterly_report, status,
        fund_request_items (id, item_name, amount, category, budget_item_id)
      `)
      .eq("funded_project_id", fundedProjectId)
      .eq("status", "approved");

    // 3. Get all expenses linked to fund request items
    const { data: allReports } = await this.db
      .from("project_reports")
      .select(`
        id, quarterly_report,
        project_expenses (id, expenses, fund_request_item_id, approved_amount)
      `)
      .eq("funded_project_id", fundedProjectId);

    // Build lookup: fund_request_item_id → quarter
    const friToQuarter: Record<number, string> = {};
    for (const fr of fundRequests || []) {
      for (const item of (fr as any).fund_request_items || []) {
        friToQuarter[item.id] = fr.quarterly_report;
      }
    }

    // Build lookup: budget_item_id → { quarter → { requested, spent } }
    type QuarterData = { requested: number; spent: number };
    const quarterKeys = ["q1_report", "q2_report", "q3_report", "q4_report"];
    const itemQuarterMap: Record<number, Record<string, QuarterData>> = {};

    // Map fund request items to budget items by quarter
    for (const fr of fundRequests || []) {
      for (const fri of (fr as any).fund_request_items || []) {
        const budgetItemId = fri.budget_item_id;
        if (!budgetItemId) continue;
        if (!itemQuarterMap[budgetItemId]) {
          itemQuarterMap[budgetItemId] = {};
        }
        const q = fr.quarterly_report;
        if (!itemQuarterMap[budgetItemId][q]) {
          itemQuarterMap[budgetItemId][q] = { requested: 0, spent: 0 };
        }
        itemQuarterMap[budgetItemId][q].requested += Number(fri.amount) || 0;
      }
    }

    // Map expenses to budget items by quarter
    for (const report of allReports || []) {
      for (const expense of (report as any).project_expenses || []) {
        const friId = expense.fund_request_item_id;
        if (!friId) continue;

        // Find which budget item this expense maps to
        const quarter = friToQuarter[friId];
        if (!quarter) continue;

        // Find the budget_item_id from the fund_request_item
        let budgetItemId: number | null = null;
        for (const fr of fundRequests || []) {
          for (const fri of (fr as any).fund_request_items || []) {
            if (fri.id === friId) {
              budgetItemId = fri.budget_item_id;
              break;
            }
          }
          if (budgetItemId) break;
        }

        if (!budgetItemId) continue;
        if (!itemQuarterMap[budgetItemId]) {
          itemQuarterMap[budgetItemId] = {};
        }
        if (!itemQuarterMap[budgetItemId][quarter]) {
          itemQuarterMap[budgetItemId][quarter] = { requested: 0, spent: 0 };
        }
        itemQuarterMap[budgetItemId][quarter].spent += Number(expense.expenses) || 0;
      }
    }

    // Build the line items response
    const lineItems = budgetItems.map((bi: any) => {
      const qData = itemQuarterMap[bi.id] || {};
      const quarterlyData: Record<string, QuarterData | null> = {};
      let totalRequested = 0;
      let totalSpent = 0;

      for (const q of quarterKeys) {
        if (qData[q]) {
          quarterlyData[q] = qData[q];
          totalRequested += qData[q].requested;
          totalSpent += qData[q].spent;
        } else {
          quarterlyData[q] = null;
        }
      }

      return {
        budget_item_id: bi.id,
        item_name: bi.item_name,
        category: bi.category as "ps" | "mooe" | "co",
        approved_budget: Number(bi.total_amount) || 0,
        quarterly_data: {
          q1: quarterlyData["q1_report"],
          q2: quarterlyData["q2_report"],
          q3: quarterlyData["q3_report"],
          q4: quarterlyData["q4_report"],
        },
        total_requested: totalRequested,
        total_spent: totalSpent,
        balance: (Number(bi.total_amount) || 0) - totalSpent,
      };
    });

    // Build category summaries
    const categories = ["ps", "mooe", "co"] as const;
    const summaryByCategory: Record<string, { budget: number; requested: number; spent: number; balance: number }> = {};
    for (const cat of categories) {
      const catItems = lineItems.filter((li: any) => li.category === cat);
      const budget = catItems.reduce((s: number, li: any) => s + li.approved_budget, 0);
      const requested = catItems.reduce((s: number, li: any) => s + li.total_requested, 0);
      const spent = catItems.reduce((s: number, li: any) => s + li.total_spent, 0);
      summaryByCategory[cat] = { budget, requested, spent, balance: budget - spent };
    }

    const grandBudget = lineItems.reduce((s: number, li: any) => s + li.approved_budget, 0);
    const grandRequested = lineItems.reduce((s: number, li: any) => s + li.total_requested, 0);
    const grandSpent = lineItems.reduce((s: number, li: any) => s + li.total_spent, 0);

    return {
      data: {
        funded_project_id: fundedProjectId,
        budget_version: {
          id: version.id,
          version_number: version.version_number,
          grand_total: version.grand_total,
        },
        line_items: lineItems,
        summary_by_category: summaryByCategory,
        grand_total: {
          budget: grandBudget,
          requested: grandRequested,
          spent: grandSpent,
          balance: grandBudget - grandSpent,
        },
      },
      error: null,
    };
  }

  // ── Upload Project Document (DOST Forms 4/5) ─────────────────────────────
  async uploadProjectDocument(
    funded_project_id: number,
    document_type: "moa" | "agency_certification",
    file_url: string,
    user_id: string,
  ) {
    // Verify project exists and user has access
    const { data: project, error: fetchError } = await this.db
      .from("funded_projects")
      .select("id, project_lead_id")
      .eq("id", funded_project_id)
      .single();

    if (fetchError || !project) {
      return { data: null, error: fetchError || new Error("Project not found") };
    }

    // Check if user is project lead or a member
    const isLead = project.project_lead_id === user_id;
    if (!isLead) {
      const { data: member } = await this.db
        .from("project_members")
        .select("id")
        .eq("funded_project_id", funded_project_id)
        .eq("user_id", user_id)
        .eq("status", "active")
        .maybeSingle();
      if (!member) {
        return { data: null, error: new Error("You don't have access to this project") };
      }
    }

    const column = document_type === "moa" ? "moa_file_url" : "agency_certification_file_url";
    const { error: updateError } = await this.db
      .from("funded_projects")
      .update({ [column]: file_url })
      .eq("id", funded_project_id);

    if (updateError) {
      return { data: null, error: updateError };
    }

    const labelMap = { moa: "Memorandum of Agreement", agency_certification: "Agency Certification" };
    await logActivity(this.db, {
      user_id,
      action: "project_document_uploaded",
      category: "project",
      target_id: String(funded_project_id),
      target_type: "funded_project",
      details: { document_type, label: labelMap[document_type] },
    });

    return { data: { funded_project_id, document_type, file_url }, error: null };
  }
}
