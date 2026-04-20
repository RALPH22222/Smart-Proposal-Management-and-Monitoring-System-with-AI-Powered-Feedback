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
import { ReportStatus, FundRequestStatus, ProjectMemberRole, ProjectMemberStatus, QuarterlyReport } from "../types/project";
import { logActivity } from "../utils/activity-logger";
import { EmailService } from "./email.service";
import { deriveAccountType } from "./auth.service";
import {
  RequestRealignmentInput,
  ReviewRealignmentInput,
} from "../schemas/realignment-schema";
import {
  computeMaxQuarterCount,
  computeTotalPeriods,
  getApplicableQuarters,
  getApplicablePeriods,
  isQuarterApplicable,
  isPeriodApplicable,
  quarterToIndex,
  periodIndex,
  periodFromIndex,
  monthsBetween,
  ALL_QUARTERS,
  MAX_PROJECT_DURATION_MONTHS,
} from "../utils/project-quarters";

export class ProjectService {
  constructor(private db: SupabaseClient) { }

  /**
   * Fetch the proposal.duration (months) for a funded project. Used by the
   * duration-aware quarter gate on fund-request / report / terminal / certificate
   * flows. Returns null if the project or proposal is missing.
   */
  private async getProjectDurationMonths(fundedProjectId: number): Promise<number | null> {
    const { data } = await this.db
      .from("funded_projects")
      .select("proposals(duration)")
      .eq("id", fundedProjectId)
      .single();
    const duration = (data as { proposals?: { duration?: number | null } } | null)
      ?.proposals?.duration;
    return typeof duration === "number" ? duration : null;
  }

  /**
   * Get funded projects with optional filtering
   * - Proponents see only their projects
   * - RND/Admin see all projects
   */
  async getFundedProjects(input: GetFundedProjectsInput) {
    // Enriched select: everything needed to power BOTH the monitoring card UI and the
    // funded-projects CSV export in a single query. We intentionally avoid an N+1 fetch
    // of getBudgetSummary per row — instead we pull fund_request_items + proposal_budget_versions
    // inline and reduce in memory below. Kept join-compact so the payload stays reasonable
    // even with 50+ projects.
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
          sector:sectors (id, name),
          estimated_budget (amount)
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
        fund_requests (
          id,
          status,
          created_at,
          fund_request_items (amount)
        ),
        project_terminal_reports (status),
        project_extension_requests (status),
        project_members (
          role,
          status,
          user:users!user_id (first_name, last_name)
        ),
        active_budget_version:proposal_budget_versions!current_budget_version_id (grand_total)
      `
      )
      .order("created_at", { ascending: false });

    // Filter by status if provided
    if (input.status) {
      query = query.eq("status", input.status);
    }

    // Filter by proponent (user_id) - Check if they are Project Lead OR Co-Lead Member.
    // We resolve both sets into a single list of allowed project IDs and apply a plain
    // .in() filter instead of .or(project_lead_id.eq.UUID,id.in.(...)). The nested .in()
    // inside .or() is a known PostgREST foot-gun — the inner commas can get swallowed by
    // the outer or-list parser and produce an over-broad filter that leaks projects the
    // user was never invited to. The two-step resolve is slightly chattier but always
    // correct, and empty ID sets short-circuit to [] instead of falling through to an
    // unfiltered query.
    if (input.role === "proponent" && input.user_id) {
      const [{ data: leadRows }, { data: memberships }, { data: rndAssignments }] = await Promise.all([
        this.db
          .from("funded_projects")
          .select("id")
          .eq("project_lead_id", input.user_id),
        this.db
          .from("project_members")
          .select("funded_project_id")
          .eq("user_id", input.user_id)
          .eq("status", ProjectMemberStatus.ACTIVE),
        // COI guard: exclude proposals this user is assigned to review as R&D. A dual-role
        // user (proponent + rnd) must not see a project on their proponent monitoring if
        // they're also the reviewer — reviewing your own work is a conflict of interest.
        // The same projects remain visible on the R&D monitoring view.
        this.db
          .from("proposal_rnd")
          .select("proposal_id")
          .eq("rnd_id", input.user_id),
      ]);

      const allowedIds = new Set<number>();
      leadRows?.forEach((p: any) => allowedIds.add(p.id));
      memberships?.forEach((m: any) => allowedIds.add(m.funded_project_id));

      if (allowedIds.size === 0) {
        return { data: [], error: null };
      }

      const rndProposalIds = new Set<number>(
        (rndAssignments ?? []).map((a: any) => a.proposal_id),
      );
      if (rndProposalIds.size > 0) {
        // Translate proposal ids → funded_project ids so we can subtract from allowedIds.
        const { data: rndProjects } = await this.db
          .from("funded_projects")
          .select("id")
          .in("proposal_id", Array.from(rndProposalIds));
        rndProjects?.forEach((r: any) => allowedIds.delete(r.id));

        if (allowedIds.size === 0) {
          return { data: [], error: null };
        }
      }

      query = query.in("id", Array.from(allowedIds));
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

    // Compute every field the monitoring card UI + CSV export need, from data already
    // pulled in the join above. No extra queries — this is the hot path on the dashboard.
    const projectsWithCompletion = data?.map((project) => {
      const reports: any[] = project.project_reports || [];
      const fundRequests: any[] = project.fund_requests || [];
      const terminal: any[] = project.project_terminal_reports || [];
      const extensions: any[] = project.project_extension_requests || [];
      const members: any[] = project.project_members || [];
      const activeVersion: any = project.active_budget_version || null;

      const latestReport = reports
        .slice()
        .sort(
          (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        )[0];

      const overdue_reports_count = reports.filter((r) => r.status === "overdue").length;
      const verified_reports_count = reports.filter((r) => r.status === "verified").length;
      const reports_submitted_count = reports.filter((r) => r.status !== "overdue").length;
      const pending_fund_requests_count = fundRequests.filter(
        (fr) => fr.status === "pending",
      ).length;
      const pending_extensions_count = extensions.filter((e) => e.status === "pending").length;

      const terminal_report_verified =
        terminal.length > 0 && terminal.some((t: any) => t.status === "verified");

      // Co-leads: role='co_lead', status='active'. Inactive/pending/declined invitations excluded.
      const co_leads = members
        .filter((m: any) => m.role === "co_lead" && m.status === "active")
        .map((m: any) => ({
          first_name: m.user?.first_name ?? null,
          last_name: m.user?.last_name ?? null,
        }));

      // Budget: authoritative total from active budget version; fallback to legacy
      // estimated_budget for projects that predate the Phase 1 LIB migration (e.g. project 8).
      // If neither exists, total is null — the UI/CSV renders blank rather than a bogus zero.
      let total_budget: number | null = null;
      if (activeVersion?.grand_total != null) {
        total_budget = Number(activeVersion.grand_total) || 0;
      } else {
        const legacy = (project.proposal?.estimated_budget || []) as { amount: number }[];
        if (legacy.length > 0) {
          total_budget = legacy.reduce((s, e) => s + (Number(e.amount) || 0), 0);
        }
      }

      // Approved / utilized from fund request items. Approved = items on approved FRs.
      // Utilized = same (we don't track partial liquidation at this level yet — that's
      // project_expenses, which is per-report and too granular for a list view).
      let approved_amount = 0;
      for (const fr of fundRequests) {
        if (fr.status !== "approved") continue;
        const items = (fr.fund_request_items || []) as { amount: number }[];
        for (const it of items) approved_amount += Number(it.amount) || 0;
      }
      const utilized_amount = approved_amount;
      const remaining_amount =
        total_budget != null ? total_budget - approved_amount : null;

      // Last activity: max created_at across reports + fund requests. NULL-safe.
      const activityDates: number[] = [];
      for (const r of reports) {
        const t = new Date(r.created_at).getTime();
        if (!isNaN(t)) activityDates.push(t);
      }
      for (const fr of fundRequests) {
        const t = new Date(fr.created_at).getTime();
        if (!isNaN(t)) activityDates.push(t);
      }
      const last_activity_at =
        activityDates.length > 0 ? new Date(Math.max(...activityDates)).toISOString() : null;

      // Strip heavy inline joins — the monitoring list + CSV only need the computed
      // aggregates, not the raw rows.
      const {
        fund_requests: _fr,
        project_terminal_reports: _tr,
        project_extension_requests: _er,
        project_members: _pm,
        active_budget_version: _abv,
        ...rest
      } = project;

      return {
        ...rest,
        completion_percentage: latestReport?.progress || 0,
        reports_count: reports.length,
        reports_submitted_count,
        verified_reports_count,
        overdue_reports_count,
        pending_fund_requests_count,
        pending_extensions_count,
        terminal_report_verified,
        co_leads,
        total_budget,
        approved_amount,
        utilized_amount,
        remaining_amount,
        last_activity_at,
      };
    });

    return { data: projectsWithCompletion, error: null };
  }

  /**
   * Get a single funded project by ID with full details
   */
  async getProject(input: GetProjectInput) {
    // NOTE: `estimated_budget` here is the LEGACY budget table — baseline only, frozen at
    // submission time. The authoritative current budget lives in `proposal_budget_versions` /
    // `proposal_budget_items` and is surfaced via `getBudgetSummary` / `getActiveBudgetVersion`.
    // Keep this join as an audit fallback (and as the source for `totalBudget` when the active
    // version hasn't been computed yet in `buildDisplayReports`). Any R&D code that wants a
    // *current* line-item view must NOT read `detail.proposal.estimated_budget` — it will be
    // stale after realignment.
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
          duration,
          email,
          phone,
          work_plan_file_url,
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
          year_number,
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
    // Year is Phase 2A. Input schema defaults to 1 for legacy single-year payloads.
    const yearNumber = input.year_number ?? 1;
    const currentPeriod = { year_number: yearNumber, quarter: input.quarterly_report };
    const currentPeriodIdx = periodIndex(currentPeriod);

    // Look up any existing report for THIS (year, quarter). Three cases to handle:
    //   - no row → first submission, normal INSERT path below
    //   - row with status='rejected' → resubmission after R&D returned it; UPDATE in place
    //   - row with any other status → genuine duplicate, reject
    const { data: existingReport } = await this.db
      .from("project_reports")
      .select("id, status")
      .eq("funded_project_id", input.funded_project_id)
      .eq("year_number", yearNumber)
      .eq("quarterly_report", input.quarterly_report)
      .maybeSingle();

    const isResubmission = existingReport?.status === ReportStatus.REJECTED;

    if (existingReport && !isResubmission) {
      return {
        data: null,
        error: {
          message: `A report for Y${yearNumber} ${input.quarterly_report} already exists for this project.`,
          code: "DUPLICATE_REPORT",
        },
      };
    }

    // Gate: this (year, quarter) must fall inside the project's duration envelope.
    const durationMonths = await this.getProjectDurationMonths(input.funded_project_id);
    if (durationMonths !== null && !isPeriodApplicable(currentPeriod, durationMonths)) {
      const total = computeTotalPeriods(durationMonths);
      const lastPeriod = periodFromIndex(total);
      return {
        data: null,
        error: {
          message: `This project's duration is ${durationMonths} month${durationMonths === 1 ? "" : "s"}, so only periods up to Y${lastPeriod.year_number} ${lastPeriod.quarter} can be submitted.`,
          code: "PERIOD_EXCEEDS_DURATION",
        },
      };
    }

    // Gate: Fund request for this (year, quarter) must be approved
    const { data: fundRequest } = await this.db
      .from("fund_requests")
      .select("id, status")
      .eq("funded_project_id", input.funded_project_id)
      .eq("year_number", yearNumber)
      .eq("quarterly_report", input.quarterly_report)
      .single();

    if (!fundRequest || fundRequest.status !== "approved") {
      return {
        data: null,
        error: {
          message: "Fund request for this period must be approved before submitting a report.",
          code: "FUND_REQUEST_NOT_APPROVED",
        },
      };
    }

    // Gate: Previous period must have a report row (sequential enforcement).
    // Uses global periodIndex so Y1Q4 unlocks Y2Q1 — no more reset-per-year.
    if (currentPeriodIdx > 1) {
      const prev = periodFromIndex(currentPeriodIdx - 1);
      const { data: prevReport } = await this.db
        .from("project_reports")
        .select("id")
        .eq("funded_project_id", input.funded_project_id)
        .eq("year_number", prev.year_number)
        .eq("quarterly_report", prev.quarter)
        .maybeSingle();

      if (!prevReport) {
        return {
          data: null,
          error: {
            message: `You must submit the Y${prev.year_number} ${prev.quarter.replace('_', ' ')} before submitting this period's report.`,
            code: "PREVIOUS_PERIOD_MISSING",
          },
        };
      }
    }

    // INSERT for a fresh submission; UPDATE for a resubmission after rejection. We flip
    // status back to 'submitted' but KEEP review_note / reviewed_by / reviewed_at so the
    // R&D modal can render a "previously returned on [date]: '[reason]'" pill as context
    // when they re-review. The proponent-side red banner is gated on status==='rejected',
    // so clearing status alone is enough to make it disappear on their side.
    let data: any = null;
    let error: any = null;
    if (isResubmission && existingReport) {
      const update = await this.db
        .from("project_reports")
        .update({
          progress: input.progress,
          comment: input.comment || null,
          report_file_url: input.report_file_url || null,
          submitted_by_proponent_id: input.submitted_by_proponent_id,
          status: ReportStatus.SUBMITTED,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingReport.id)
        .select()
        .single();
      data = update.data;
      error = update.error;

      // Wipe old expense rows — the proponent may have changed their liquidation mix when
      // revising. Simpler than diffing, and project_expenses has no FKs downstream that would
      // care about row ids.
      if (!error && data) {
        await this.db.from("project_expenses").delete().eq("project_reports_id", existingReport.id);
      }
    } else {
      const insert = await this.db
        .from("project_reports")
        .insert({
          funded_project_id: input.funded_project_id,
          year_number: yearNumber,
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
      data = insert.data;
      error = insert.error;
    }

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
        action: isResubmission ? "quarterly_report_resubmitted" : "quarterly_report_submitted",
        category: "project",
        target_id: String(input.funded_project_id),
        target_type: "funded_project",
        details: { quarter: input.quarterly_report, report_id: data.id },
      });
    }

    return { data, error, isResubmission };
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
   * Reject a quarterly report with a required note. Mirrors verifyReport but flips the
   * status to REJECTED instead of VERIFIED. The proponent's monitoring UI reads
   * status='rejected' + review_note and shows a red banner + an edit-and-resubmit path.
   *
   * Same COI guard as verify — the R&D user reviewing the report must not be in the
   * project's proponent/co-lead set.
   */
  async rejectReport(input: { report_id: number; reviewed_by: string; review_note: string }) {
    const { data: report } = await this.db
      .from("project_reports")
      .select("funded_project_id")
      .eq("id", input.report_id)
      .single();

    if (!report) {
      return { data: null, error: { message: "Project report not found." } };
    }

    const coi = await this.assertNoCoiOnProject(input.reviewed_by, report.funded_project_id);
    if (coi) {
      await logActivity(this.db, {
        user_id: input.reviewed_by,
        action: "coi_block_reject_report",
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
        status: ReportStatus.REJECTED,
        review_note: input.review_note,
        reviewed_by: input.reviewed_by,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.report_id)
      .eq("status", ReportStatus.SUBMITTED) // can only reject a still-submitted report
      .select()
      .single();

    if (error) {
      return { data: null, error };
    }

    if (!data) {
      return {
        data: null,
        error: { message: "Report not found or no longer in a submittable state." },
      };
    }

    await logActivity(this.db, {
      user_id: input.reviewed_by,
      action: "quarterly_report_rejected",
      category: "project",
      target_id: String(input.report_id),
      target_type: "report",
      details: { funded_project_id: data.funded_project_id, review_note: input.review_note },
    });

    // Notify the proponent who submitted it (in-app + email). Fire-and-forget.
    try {
      if (data.submitted_by_proponent_id) {
        const quarterLabel = String(data.quarterly_report || "Quarterly")
          .replace("_report", "")
          .toUpperCase();

        await this.db.from("notifications").insert({
          user_id: data.submitted_by_proponent_id,
          message: `Your ${quarterLabel} report was returned for revision. Reason: ${input.review_note}`,
          is_read: false,
          link: "project-monitoring",
        });

        const { data: proponent } = await this.db
          .from("users")
          .select("email, first_name")
          .eq("id", data.submitted_by_proponent_id)
          .single();

        if (proponent?.email && process.env.SMTP_USER) {
          const frontendUrl = process.env.FRONTEND_URL || "https://www.wmsu-rdec.com";
          const emailService = new EmailService();
          await emailService.sendNotificationEmail(
            proponent.email,
            proponent.first_name || "Proponent",
            `${quarterLabel} Report Returned for Revision`,
            `R&D returned your ${quarterLabel} report. Reason: ${input.review_note}. Sign in to SPMAMS to edit and resubmit.`,
            "View Project Monitoring",
            `${frontendUrl}/login`,
          );
        }
      }
    } catch (notifErr) {
      console.error("Reject notification failed (non-blocking):", notifErr);
    }

    return { data, error: null };
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
    const yearNumber = input.year_number ?? 1;
    const currentPeriod = { year_number: yearNumber, quarter: input.quarterly_report };

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

    // Gate: this (year, quarter) must fit inside the project's duration envelope.
    const durationMonths = await this.getProjectDurationMonths(input.funded_project_id);
    if (durationMonths !== null && !isPeriodApplicable(currentPeriod, durationMonths)) {
      const total = computeTotalPeriods(durationMonths);
      const lastPeriod = periodFromIndex(total);
      return {
        data: null,
        error: {
          message: `This project's duration is ${durationMonths} month${durationMonths === 1 ? "" : "s"}, so only periods up to Y${lastPeriod.year_number} ${lastPeriod.quarter} are valid for fund requests.`,
          code: "PERIOD_EXCEEDS_DURATION",
        },
      };
    }

    // Gate: compliance docs (MOA + Agency Cert) must be VERIFIED by R&D before
    // fund requests can be created. Presence-only was a trust gap — a proponent
    // could upload garbage and unlock the gate. See migration 20260420202938.
    const { data: complianceRow } = await this.db
      .from("funded_projects")
      .select("moa_status, agency_cert_status")
      .eq("id", input.funded_project_id)
      .single();
    if (complianceRow) {
      const { moa_status, agency_cert_status } = complianceRow as {
        moa_status: string;
        agency_cert_status: string;
      };
      const missing: string[] = [];
      if (moa_status !== "verified") {
        missing.push(`Memorandum of Agreement (${moa_status.replace(/_/g, " ")})`);
      }
      if (agency_cert_status !== "verified") {
        missing.push(`Agency Certification (${agency_cert_status.replace(/_/g, " ")})`);
      }
      if (missing.length > 0) {
        return {
          data: null,
          error: {
            message: `Compliance documents must be verified by R&D before submitting fund requests. Status: ${missing.join("; ")}.`,
            code: "COMPLIANCE_DOCS_NOT_VERIFIED",
          },
        };
      }
    }

    // Check for duplicate fund request for this (project, year, quarter)
    const { data: existing } = await this.db
      .from("fund_requests")
      .select("id")
      .eq("funded_project_id", input.funded_project_id)
      .eq("year_number", yearNumber)
      .eq("quarterly_report", input.quarterly_report)
      .maybeSingle();

    if (existing) {
      return {
        data: null,
        error: {
          message: `A fund request for Y${yearNumber} ${input.quarterly_report} already exists for this project.`,
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

    // Phase 2B.2 — snapshot the active budget version onto the fund request so
    // later realignments don't make historical validation ambiguous. A direct
    // select here is fine: the self-heal inside getActiveBudgetVersion only
    // matters for read paths; writes come through here and always carry the
    // freshly-snapshotted version forward.
    const { data: projectRow } = await this.db
      .from("funded_projects")
      .select("current_budget_version_id")
      .eq("id", input.funded_project_id)
      .single();
    const budgetVersionId = projectRow?.current_budget_version_id ?? null;

    // Create the fund request
    const { data: fundRequest, error: requestError } = await this.db
      .from("fund_requests")
      .insert({
        funded_project_id: input.funded_project_id,
        year_number: yearNumber,
        quarterly_report: input.quarterly_report,
        budget_version_id: budgetVersionId,
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
    // Also pull budget_version_id for the Phase 2C drift check below.
    const { data: fundRequest } = await this.db
      .from("fund_requests")
      .select("funded_project_id, budget_version_id")
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

    // Phase 2C.1 — defensive budget-version drift check. If a realignment was
    // approved during this fund request's review window, items it points at may
    // no longer belong to the active version. The Phase 4 guard blocks NEW fund
    // requests while realignment is pending, but a request pending BEFORE the
    // realignment arrives can still slip through without this check.
    //
    // Only runs on approval — rejections are always safe.
    if (input.status === "approved" && fundRequest.budget_version_id) {
      const { data: linkedItems } = await this.db
        .from("fund_request_items")
        .select("budget_item_id, proposal_budget_items(version_id)")
        .eq("fund_request_id", input.fund_request_id);

      const driftedItems: number[] = [];
      for (const row of linkedItems ?? []) {
        const r = row as {
          budget_item_id: number | null;
          proposal_budget_items?: { version_id: number } | { version_id: number }[] | null;
        };
        if (!r.budget_item_id) continue; // legacy free-text item, nothing to validate
        // PostgREST may return the join as an object (single FK) or as an array; normalize.
        const joined = Array.isArray(r.proposal_budget_items)
          ? r.proposal_budget_items[0]
          : r.proposal_budget_items;
        const itemVersionId = joined?.version_id;
        if (itemVersionId != null && itemVersionId !== fundRequest.budget_version_id) {
          driftedItems.push(r.budget_item_id);
        }
      }

      if (driftedItems.length > 0) {
        return {
          data: null,
          error: {
            message:
              "This fund request was created against an earlier budget version. An approved realignment has since shifted the active budget, so some of its line items are no longer valid. Ask the proponent to re-submit the fund request against the current version.",
            code: "BUDGET_VERSION_DRIFT",
          },
        };
      }
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
   * Generate a completion certificate after all applicable quarterly reports are verified.
   * "Applicable" is derived from the project's duration: a 6-month project requires Q1+Q2
   * only, not Q1-Q4. See utils/project-quarters.
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

    // Verify every applicable (year, quarter) report is verified
    const { data: reports, error: reportsError } = await this.db
      .from("project_reports")
      .select("year_number, quarterly_report, status")
      .eq("funded_project_id", input.funded_project_id);

    if (reportsError) {
      return { data: null, error: reportsError };
    }

    const durationMonths = await this.getProjectDurationMonths(input.funded_project_id);
    const requiredPeriods = getApplicablePeriods(durationMonths);
    const verifiedKeys = new Set(
      (reports || [])
        .filter((r) => r.status === "verified")
        .map((r) => `${r.year_number}_${r.quarterly_report}`),
    );

    const missingPeriods = requiredPeriods.filter(
      (p) => !verifiedKeys.has(`${p.year_number}_${p.quarter}`),
    );

    if (missingPeriods.length > 0) {
      const missingLabel = missingPeriods
        .map((p) => `Y${p.year_number} ${p.quarter}`)
        .join(", ");
      return {
        data: null,
        error: {
          message: `Cannot issue certificate. The following periods are not yet verified: ${missingLabel}.`,
          code: "INCOMPLETE_REPORTS",
        },
      };
    }

    // Check terminal report is verified
    const { data: terminalReport } = await this.db
      .from("project_terminal_reports")
      .select("id, status, surrendered_amount")
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

    // Financial reconciliation gate (RDEC President's "utilize all or block" rule):
    // certificate cannot be issued unless the books balance. Specifically:
    //   sum(approved expenses) + surrendered_amount ≈ sum(allocated LIB)
    // Tolerance is 0.01 PHP for rounding drift. Proponent declares surrender at
    // terminal report submission; R&D's verification confirms the declaration.
    {
      const { data: fpRow } = await this.db
        .from("funded_projects")
        .select("proposal_budget_versions!funded_projects_current_budget_version_id_fkey(grand_total)")
        .eq("id", input.funded_project_id)
        .single();
      const allocatedTotal = Number(
        (fpRow as any)?.proposal_budget_versions?.grand_total ?? 0,
      );

      const { data: expenseRows } = await this.db
        .from("project_expenses")
        .select("approved_amount, expenses, project_reports!inner(funded_project_id)")
        .eq("project_reports.funded_project_id", input.funded_project_id);
      const spentTotal = (expenseRows ?? []).reduce(
        (sum, e) => sum + (Number((e as any).approved_amount ?? (e as any).expenses) || 0),
        0,
      );

      const surrenderedTotal = Number((terminalReport as any).surrendered_amount ?? 0);
      const reconciled = spentTotal + surrenderedTotal;
      const diff = allocatedTotal - reconciled;

      if (diff > 0.01) {
        return {
          data: null,
          error: {
            message: `Cannot issue certificate. Budget not fully accounted for: ₱${allocatedTotal.toFixed(2)} allocated, ₱${spentTotal.toFixed(2)} spent, ₱${surrenderedTotal.toFixed(2)} surrendered — a gap of ₱${diff.toFixed(2)} remains. Proponent must either spend or surrender the difference before the certificate can be issued.`,
            code: "UTILIZATION_GAP",
          },
        };
      }
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

      if (latest) {
        // A version exists but the funded_project wasn't pointing at it yet.
        versionId = latest.id as number;
      } else {
        // Self-heal: no budget version exists for this proposal at all. This happens for
        // projects that predate the Phase 1 LIB migration and had no legacy estimated_budget
        // rows to seed from (the migration backfill only runs for proposals with legacy data).
        // Before this branch existed, the UI crashed with a 404 + cascading 500 on every
        // budget-summary lookup for such projects (e.g. funded_project 8).
        //
        // Creates an empty v1 (grand_total=0, no items). The proponent can then populate it
        // normally via the realignment flow if the project is still active, or it just stays
        // empty — either way the monitoring UI renders cleanly instead of breaking.
        //
        // Idempotent: UNIQUE(proposal_id, version_number) rejects racing inserts, so on a
        // double-call the loser re-reads the winner's row.
        const { data: newVersion, error: createError } = await this.db
          .from("proposal_budget_versions")
          .insert({
            proposal_id: project.proposal_id,
            version_number: 1,
            grand_total: 0,
          })
          .select("id")
          .maybeSingle();

        if (createError || !newVersion) {
          const { data: retryLatest } = await this.db
            .from("proposal_budget_versions")
            .select("id")
            .eq("proposal_id", project.proposal_id)
            .order("version_number", { ascending: false })
            .limit(1)
            .maybeSingle();
          if (!retryLatest) {
            return {
              data: null,
              error: createError ?? new Error("Failed to self-heal budget version"),
            };
          }
          versionId = retryLatest.id as number;
        } else {
          versionId = newVersion.id as number;
        }
      }

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
      // maybeSingle (not single) — the next lines already handle the null
      // case. Using .single() here would throw PGRST116 ("cannot coerce 0
      // rows") as a Supabase error and surface as a 500 to the client,
      // which masks the real cause (stale current_budget_version_id
      // pointer or a version that was deleted).
      .maybeSingle();

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

    // Phase 4 + Pattern N: per-line floor validation, now relaxed for reclassification.
    //
    // Original Phase 4 rule: each existing budget item's proposed new total must be ≥
    // already-drawn (approved fund_request_items). Reducing below drawn was a hard error
    // because it would silently invalidate prior approvals.
    //
    // Pattern N relaxation: reducing BELOW drawn is allowed IF the freed drawn amount is
    // absorbed by increases in other items (conservation of drawn cash). In that case we
    // flag the realignment as requires_reclassification, route it through the two-tier
    // approval chain (RND endorses → Admin approves), and create immutable reclassification
    // records on approval. The original fund_request_items.amount stays untouched.
    //
    // What's still blocked:
    //   - Removing an item entirely that has drawn cash on it (would need explicit
    //     reclassification target — keep it simple, require the proponent to keep at
    //     least the drawn line in proposed so the target item is explicit)
    //   - Reducing below drawn without sufficient "absorption capacity" elsewhere
    const baselineItems = (fromVersion.items ?? []) as Array<{
      id: number;
      category: string;
      item_name: string;
      spec: string | null;
      total_amount: number;
    }>;
    const baselineItemIds = baselineItems.map((it) => it.id);

    let requiresReclassification = false;

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

      // Pattern N: add reclassified_in amounts to each baseline item's effective drawn.
      // Prior reclassifications moved drawn cash INTO these items from earlier versions;
      // the floor check must treat reclassified_in as part of drawn to prevent reducing
      // the item below its full effective commitment.
      const { data: reclassIn } = await this.db
        .from("fund_request_reclassifications")
        .select("target_budget_item_id, amount")
        .in("target_budget_item_id", baselineItemIds);

      for (const row of reclassIn ?? []) {
        const r = row as { target_budget_item_id: number; amount: number };
        approvedByItemId.set(
          r.target_budget_item_id,
          (approvedByItemId.get(r.target_budget_item_id) ?? 0) + (Number(r.amount) || 0),
        );
      }

      if (approvedByItemId.size > 0) {
        const proposedByKey = new Map<string, number>();
        const baselineTotalByKey = new Map<string, number>();
        const makeKey = (cat: string, name: string, spec: string | null) =>
          `${cat}|${(name ?? "").trim().toLowerCase()}|${(spec ?? "").trim().toLowerCase()}`;

        for (const item of input.items) {
          const key = makeKey(item.category, item.itemName, item.spec ?? null);
          proposedByKey.set(key, (proposedByKey.get(key) ?? 0) + Number(item.totalAmount));
        }
        for (const baseline of baselineItems) {
          const key = makeKey(baseline.category, baseline.item_name, baseline.spec);
          baselineTotalByKey.set(
            key,
            (baselineTotalByKey.get(key) ?? 0) + Number(baseline.total_amount),
          );
        }

        // Compute per-item over-reduction (below drawn) and absorption capacity (above
        // baseline). Reclassification is valid only when sum(over-reduction) ≤ sum(room).
        let totalOverReductionCents = 0;
        let totalAbsorptionRoomCents = 0;
        const overReducedItems: string[] = [];

        for (const baseline of baselineItems) {
          const approvedFloor = approvedByItemId.get(baseline.id) ?? 0;
          const key = makeKey(baseline.category, baseline.item_name, baseline.spec);
          const proposedTotal = proposedByKey.get(key);
          const baselineTotal = baselineTotalByKey.get(key) ?? Number(baseline.total_amount);

          if (approvedFloor > 0) {
            if (proposedTotal == null) {
              return {
                data: null,
                error: new Error(
                  `Cannot remove "${baseline.item_name}" entirely — ₱${approvedFloor.toFixed(2)} has already been drawn against this line. Keep it in the proposal (you may reduce the amount) and the freed cash will be reclassified to other items you increase.`,
                ),
              };
            }
            if (Math.round(proposedTotal * 100) < Math.round(approvedFloor * 100)) {
              const overReduction = approvedFloor - proposedTotal;
              totalOverReductionCents += Math.round(overReduction * 100);
              overReducedItems.push(
                `"${baseline.item_name}" (-₱${overReduction.toFixed(2)} below drawn)`,
              );
            }
          }

          // Absorption room = proposed − baseline (positive deltas only). The absorbed
          // cash must be able to hold the reclassified amount from over-reduced items.
          if (proposedTotal != null && proposedTotal > baselineTotal) {
            totalAbsorptionRoomCents += Math.round((proposedTotal - baselineTotal) * 100);
          }
        }

        // New items in proposed (not in baseline) also provide absorption room.
        for (const [key, proposedTotal] of proposedByKey.entries()) {
          if (!baselineTotalByKey.has(key)) {
            totalAbsorptionRoomCents += Math.round(proposedTotal * 100);
          }
        }

        if (totalOverReductionCents > 0) {
          if (totalOverReductionCents > totalAbsorptionRoomCents) {
            return {
              data: null,
              error: new Error(
                `Proposal reduces drawn-cash items by a total of ₱${(totalOverReductionCents / 100).toFixed(2)} but only ₱${(totalAbsorptionRoomCents / 100).toFixed(2)} of absorption room is available in other items. Reclassification needs a matching increase elsewhere. Over-reduced: ${overReducedItems.join(", ")}.`,
              ),
            };
          }
          requiresReclassification = true;
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
          requires_reclassification: requiresReclassification,
          reviewed_by: null,
          reviewed_at: null,
          review_note: null,
          endorsed_by: null,
          endorsed_at: null,
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
        requires_reclassification: requiresReclassification,
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

  /**
   * Pattern N tier 1: RND endorses a realignment that requires reclassification.
   * Transitions pending_review → endorsed_pending_admin. The record locks (Admin
   * cannot be bypassed), endorser + timestamp are captured, and Admin users are
   * notified that a realignment is awaiting their confirmation.
   *
   * For non-reclassification realignments, RND should use reviewRealignment with
   * action="approve" — those don't need Admin confirmation.
   */
  async endorseRealignment(args: { realignment_id: number; endorsed_by: string }) {
    const { realignment_id, endorsed_by } = args;

    const { data: realignment, error: fetchError } = await this.db
      .from("budget_realignments")
      .select("id, funded_project_id, status, requires_reclassification, requested_by")
      .eq("id", realignment_id)
      .maybeSingle();

    if (fetchError || !realignment) {
      return { data: null, error: fetchError ?? new Error("Realignment not found") };
    }

    if (realignment.status !== "pending_review") {
      return {
        data: null,
        error: new Error(
          `Can only endorse realignments in pending_review state (current: ${realignment.status}).`,
        ),
      };
    }

    if (!realignment.requires_reclassification) {
      return {
        data: null,
        error: new Error(
          "This realignment doesn't require Admin confirmation. Use the standard approve action instead.",
        ),
      };
    }

    // COI guard — endorser cannot be a project member
    const coi = await this.assertNoCoiOnProject(endorsed_by, realignment.funded_project_id);
    if (coi) {
      return { data: null, error: new Error(coi.message) };
    }

    const { data: updated, error: updateError } = await this.db
      .from("budget_realignments")
      .update({
        status: "endorsed_pending_admin",
        endorsed_by,
        endorsed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", realignment_id)
      .eq("status", "pending_review") // concurrency guard
      .select()
      .single();

    if (updateError || !updated) {
      return {
        data: null,
        error: updateError ?? new Error("Failed to endorse realignment (may have been updated elsewhere)."),
      };
    }

    // Notify all Admins
    try {
      const { data: admins } = await this.db
        .from("users")
        .select("id")
        .contains("roles", ["admin"]);

      const { data: projectInfo } = await this.db
        .from("funded_projects")
        .select("proposals!inner(project_title)")
        .eq("id", realignment.funded_project_id)
        .single();
      const projectTitle = (projectInfo as any)?.proposals?.project_title ?? "a funded project";

      if (admins && admins.length > 0) {
        const notifications = admins.map((u) => ({
          user_id: u.id,
          message: `R&D endorsed a budget realignment with cash reclassification for "${projectTitle}". Your confirmation is required.`,
          is_read: false,
          link: "funding",
        }));
        await this.db.from("notifications").insert(notifications);
      }
    } catch (notifErr) {
      console.error("Realignment endorsement notification failed (non-blocking):", notifErr);
    }

    await logActivity(this.db, {
      user_id: endorsed_by,
      action: "budget_realignment_endorsed",
      category: "project",
      target_id: String(realignment_id),
      target_type: "budget_realignment",
      details: { funded_project_id: realignment.funded_project_id },
    });

    return { data: updated, error: null };
  }

  /**
   * Pattern N tier 2: Admin confirms an endorsed realignment. Same-user guard prevents
   * the same human who endorsed from also confirming (maker-checker integrity). Creates
   * the new budget version + reclassification records atomically. The original
   * fund_request_items stay untouched (COA cash-advance accountability preserved).
   */
  async adminApproveRealignment(args: { realignment_id: number; admin_id: string }) {
    const { realignment_id, admin_id } = args;

    const { data: realignment, error: fetchError } = await this.db
      .from("budget_realignments")
      .select(
        "id, funded_project_id, from_version_id, status, endorsed_by, requested_by, proposed_payload, requires_reclassification",
      )
      .eq("id", realignment_id)
      .maybeSingle();

    if (fetchError || !realignment) {
      return { data: null, error: fetchError ?? new Error("Realignment not found") };
    }

    if (realignment.status !== "endorsed_pending_admin") {
      return {
        data: null,
        error: new Error(
          `Can only admin-approve realignments in endorsed_pending_admin state (current: ${realignment.status}).`,
        ),
      };
    }

    // Same-user guard: the endorsing RND cannot also confirm as Admin. Preserves
    // maker-checker segregation even when one user has both roles.
    if (realignment.endorsed_by && realignment.endorsed_by === admin_id) {
      return {
        data: null,
        error: new Error(
          "You endorsed this realignment — a different Admin must confirm it (maker-checker rule).",
        ),
      };
    }

    // COI guard
    const coi = await this.assertNoCoiOnProject(admin_id, realignment.funded_project_id);
    if (coi) {
      return { data: null, error: new Error(coi.message) };
    }

    // Load project for version insert
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

    // Create the new version
    const { data: newVersion, error: vErr } = await this.db
      .from("proposal_budget_versions")
      .insert({
        proposal_id: project.proposal_id,
        version_number: nextVersionNumber,
        grand_total: grandTotal,
        created_by: admin_id,
      })
      .select()
      .single();
    if (vErr || !newVersion) {
      return { data: null, error: vErr ?? new Error("Failed to create new budget version") };
    }

    // Insert items into new version
    const itemRows = items.map((it: any, idx: number) => ({
      version_id: newVersion.id,
      source: it.source ?? "Unspecified",
      category: it.category,
      subcategory_id: it.subcategoryId ?? null,
      custom_subcategory_label: it.customSubcategoryLabel ?? null,
      item_name: it.itemName,
      spec: it.spec ?? null,
      quantity: it.quantity ?? 1,
      unit: it.unit ?? "pcs",
      unit_price: it.unitPrice ?? 0,
      total_amount: it.totalAmount ?? 0,
      display_order: it.displayOrder ?? idx,
      notes: it.notes ?? null,
    }));

    const { error: itemsErr } = await this.db.from("proposal_budget_items").insert(itemRows);
    if (itemsErr) {
      return { data: null, error: itemsErr };
    }

    // Load the newly-inserted items to get their IDs (needed for reclassification)
    const { data: newItems } = await this.db
      .from("proposal_budget_items")
      .select("id, category, item_name, spec, total_amount")
      .eq("version_id", newVersion.id);

    // Create reclassification records. For each baseline item that was over-reduced,
    // move the over-reduced amount to a target item (increased item in the new version).
    // Simple greedy allocation: over-reduction from item A goes into absorption room of
    // increase items in natural-key order. Audit reads cleanly even for multi-target reallocations.
    if (realignment.requires_reclassification) {
      const { data: baselineItems } = await this.db
        .from("proposal_budget_items")
        .select("id, category, item_name, spec, total_amount")
        .eq("version_id", realignment.from_version_id);

      // Recompute drawn per baseline item (same logic as request-time check)
      const baselineItemIds = (baselineItems ?? []).map((it) => it.id);
      const { data: linkedFundItems } = baselineItemIds.length
        ? await this.db
            .from("fund_request_items")
            .select("budget_item_id, amount, fund_requests!inner(status)")
            .in("budget_item_id", baselineItemIds)
        : { data: [] as any[] };

      const drawnByBaselineId = new Map<number, number>();
      for (const row of linkedFundItems ?? []) {
        const r = row as any;
        if (r.fund_requests?.status !== "approved") continue;
        if (r.budget_item_id == null) continue;
        drawnByBaselineId.set(
          r.budget_item_id,
          (drawnByBaselineId.get(r.budget_item_id) ?? 0) + (Number(r.amount) || 0),
        );
      }

      const makeKey = (cat: string, name: string, spec: string | null) =>
        `${cat}|${(name ?? "").trim().toLowerCase()}|${(spec ?? "").trim().toLowerCase()}`;

      // Map new-version items by natural key for absorption
      const newByKey = new Map<string, { id: number; total: number; remainingRoom: number }>();
      for (const it of newItems ?? []) {
        const key = makeKey(it.category, it.item_name, it.spec);
        const newTotal = Number(it.total_amount) || 0;
        newByKey.set(key, { id: it.id, total: newTotal, remainingRoom: 0 });
      }

      // Compute absorption room per new item relative to baseline
      const baselineTotalByKey = new Map<string, number>();
      for (const it of baselineItems ?? []) {
        const key = makeKey(it.category, it.item_name, it.spec);
        baselineTotalByKey.set(
          key,
          (baselineTotalByKey.get(key) ?? 0) + (Number(it.total_amount) || 0),
        );
      }
      for (const [key, entry] of newByKey.entries()) {
        const prevTotal = baselineTotalByKey.get(key) ?? 0;
        entry.remainingRoom = Math.max(0, entry.total - prevTotal);
      }

      // Build reclassification rows: for each baseline item over-reduced, greedy-fill targets
      const reclassificationRows: Array<{
        realignment_id: number;
        source_budget_item_id: number;
        target_budget_item_id: number;
        amount: number;
        created_by: string;
      }> = [];

      for (const baseline of baselineItems ?? []) {
        const drawn = drawnByBaselineId.get(baseline.id) ?? 0;
        if (drawn <= 0) continue;

        const key = makeKey(baseline.category, baseline.item_name, baseline.spec);
        const newEntry = newByKey.get(key);
        const newTotal = newEntry?.total ?? 0;
        let overReducedRemaining = Math.max(0, drawn - newTotal);
        if (overReducedRemaining <= 0) continue;

        // Greedy allocate over-reduction across new items with absorption room
        for (const [targetKey, target] of newByKey.entries()) {
          if (targetKey === key) continue; // can't reclassify to self
          if (target.remainingRoom <= 0) continue;
          const move = Math.min(overReducedRemaining, target.remainingRoom);
          if (move <= 0) continue;

          // Only insert if source item persists in new version (common path — proponent
          // kept the item but reduced it). Source budget_item_id points at the OLD
          // version's row (immutable audit anchor).
          reclassificationRows.push({
            realignment_id: realignment.id,
            source_budget_item_id: baseline.id,
            target_budget_item_id: target.id,
            amount: Number(move.toFixed(2)),
            created_by: admin_id,
          });
          overReducedRemaining -= move;
          target.remainingRoom -= move;
          if (overReducedRemaining <= 0) break;
        }
      }

      if (reclassificationRows.length > 0) {
        const { error: reclassErr } = await this.db
          .from("fund_request_reclassifications")
          .insert(reclassificationRows);
        if (reclassErr) {
          // Don't half-approve. Return error so Admin can retry after investigation.
          return { data: null, error: reclassErr };
        }
      }
    }

    // Flip the realignment to approved + record the new active version
    const { error: finalizeErr } = await this.db
      .from("budget_realignments")
      .update({
        status: "approved",
        to_version_id: newVersion.id,
        reviewed_by: admin_id,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", realignment_id);
    if (finalizeErr) {
      return { data: null, error: finalizeErr };
    }

    // Set as active on funded_projects
    await this.db
      .from("funded_projects")
      .update({ current_budget_version_id: newVersion.id })
      .eq("id", realignment.funded_project_id);

    // Notify proponent
    await this.db.from("notifications").insert({
      user_id: realignment.requested_by,
      message: "Your budget realignment (with cash reclassification) has been approved by Admin.",
      is_read: false,
      link: "project-monitoring",
    });

    await logActivity(this.db, {
      user_id: admin_id,
      action: "budget_realignment_admin_approved",
      category: "project",
      target_id: String(realignment_id),
      target_type: "budget_realignment",
      details: {
        funded_project_id: realignment.funded_project_id,
        new_version_id: newVersion.id,
      },
    });

    return { data: { realignment_id, new_version_id: newVersion.id, status: "approved" }, error: null };
  }

  /**
   * Pattern N — Admin bounces an endorsed realignment back to RND for rework. Requires
   * a review note so RND sees what Admin objected to. Status returns to pending_review
   * and endorsement fields clear (RND must re-endorse after rework).
   */
  async adminReturnRealignment(args: {
    realignment_id: number;
    admin_id: string;
    review_note: string;
  }) {
    const { realignment_id, admin_id, review_note } = args;

    if (!review_note || review_note.trim().length < 10) {
      return {
        data: null,
        error: new Error(
          "A review note of at least 10 characters is required when returning a realignment to RND.",
        ),
      };
    }

    const { data: realignment } = await this.db
      .from("budget_realignments")
      .select("id, funded_project_id, status, endorsed_by")
      .eq("id", realignment_id)
      .maybeSingle();

    if (!realignment) {
      return { data: null, error: new Error("Realignment not found") };
    }

    if (realignment.status !== "endorsed_pending_admin") {
      return {
        data: null,
        error: new Error(
          `Can only return realignments in endorsed_pending_admin state (current: ${realignment.status}).`,
        ),
      };
    }

    const { error: updateError } = await this.db
      .from("budget_realignments")
      .update({
        status: "pending_review",
        review_note: review_note.trim(),
        endorsed_by: null,
        endorsed_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", realignment_id);

    if (updateError) {
      return { data: null, error: updateError };
    }

    // Notify the original endorser (and other RND users) so they see the return
    try {
      const { data: rndUsers } = await this.db
        .from("users")
        .select("id")
        .contains("roles", ["rnd"]);

      if (rndUsers && rndUsers.length > 0) {
        const notifications = rndUsers.map((u) => ({
          user_id: u.id,
          message: `Admin returned a realignment for revision. Note: "${review_note.trim().slice(0, 120)}"`,
          is_read: false,
          link: "funding",
        }));
        await this.db.from("notifications").insert(notifications);
      }
    } catch (notifErr) {
      console.error("Return-for-revision notification failed (non-blocking):", notifErr);
    }

    await logActivity(this.db, {
      user_id: admin_id,
      action: "budget_realignment_admin_returned",
      category: "project",
      target_id: String(realignment_id),
      target_type: "budget_realignment",
      details: {
        funded_project_id: realignment.funded_project_id,
        review_note: review_note.trim(),
      },
    });

    return { data: { realignment_id, status: "pending_review" }, error: null };
  }

  async reviewRealignment(args: { input: ReviewRealignmentInput; reviewed_by: string }) {
    const { input, reviewed_by } = args;

    const { data: realignment, error: fetchError } = await this.db
      .from("budget_realignments")
      .select(
        "id, funded_project_id, from_version_id, status, requested_by, proposed_payload, requires_reclassification",
      )
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

    // Pattern N guard: realignments with reclassification must go through the two-tier
    // flow (RND endorses → Admin approves). reviewRealignment only handles the single-tier
    // RND-only path for non-reclassification realignments + reject/revision on either.
    if (realignment.requires_reclassification && input.action === "approve") {
      return {
        data: null,
        error: new Error(
          "This realignment reallocates drawn cash and requires Admin confirmation. Use the Endorse action instead — an Admin will confirm it.",
        ),
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
  // If requires_reclassification, also includes a preview of the computed from→to
  // source/target mapping so reviewers (RND endorser + Admin confirmer) see exactly
  // what they're approving, not just the resulting totals.
  async getRealignment(realignmentId: number) {
    const { data, error } = await this.db
      .from("budget_realignments")
      .select(
        `
        id, funded_project_id, from_version_id, to_version_id,
        status, reason, file_url, proposed_payload,
        requires_reclassification, endorsed_by, endorsed_at,
        requested_by, reviewed_by, reviewed_at, review_note,
        created_at, updated_at,
        requester:users!budget_realignments_requested_by_fkey (id, first_name, last_name, email),
        reviewer:users!budget_realignments_reviewed_by_fkey (id, first_name, last_name, email),
        endorser:users!budget_realignments_endorsed_by_fkey (id, first_name, last_name, email),
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

    if (error || !data) return { data, error };

    // Compute reclassification preview if applicable. Natural-key identifiers
    // (category + item_name + spec) are used because new-version item IDs don't
    // exist yet pre-approval — the preview shows which LIB lines will net out
    // where, expressed in terms the reviewer can verify against the diff.
    let reclassification_preview: Array<{
      source_category: string;
      source_item_name: string;
      source_spec: string | null;
      target_category: string;
      target_item_name: string;
      target_spec: string | null;
      amount: number;
    }> = [];

    const row = data as any;
    if (row.requires_reclassification) {
      try {
        reclassification_preview = await this.computeReclassificationPreview(
          row.from_version_id,
          (row.proposed_payload?.items ?? []) as Array<any>,
        );
      } catch (previewErr) {
        console.error("reclassification preview failed (non-blocking):", previewErr);
      }
    }

    return { data: { ...row, reclassification_preview }, error: null };
  }

  /**
   * Pattern N — computes the from→to reclassification mapping without committing.
   * Uses the same greedy allocation as adminApproveRealignment so what reviewers see
   * in the preview is exactly what gets persisted on approval.
   *
   * Identifiers are natural-key (category + item_name + spec) because target items
   * don't have IDs until the new budget version is inserted at approval time.
   */
  private async computeReclassificationPreview(
    fromVersionId: number,
    proposedItems: Array<{
      category: string;
      itemName: string;
      spec: string | null;
      totalAmount: number;
    }>,
  ): Promise<
    Array<{
      source_category: string;
      source_item_name: string;
      source_spec: string | null;
      target_category: string;
      target_item_name: string;
      target_spec: string | null;
      amount: number;
    }>
  > {
    const { data: baselineItems } = await this.db
      .from("proposal_budget_items")
      .select("id, category, item_name, spec, total_amount")
      .eq("version_id", fromVersionId);

    const baselineIds = (baselineItems ?? []).map((it) => it.id);
    if (baselineIds.length === 0) return [];

    const { data: linkedFundItems } = await this.db
      .from("fund_request_items")
      .select("budget_item_id, amount, fund_requests!inner(status)")
      .in("budget_item_id", baselineIds);

    const drawnById = new Map<number, number>();
    for (const row of linkedFundItems ?? []) {
      const r = row as any;
      if (r.fund_requests?.status !== "approved") continue;
      if (r.budget_item_id == null) continue;
      drawnById.set(r.budget_item_id, (drawnById.get(r.budget_item_id) ?? 0) + (Number(r.amount) || 0));
    }

    // Also add prior reclassifications INTO these baseline items
    const { data: reclassIn } = await this.db
      .from("fund_request_reclassifications")
      .select("target_budget_item_id, amount")
      .in("target_budget_item_id", baselineIds);

    for (const row of reclassIn ?? []) {
      const r = row as { target_budget_item_id: number; amount: number };
      drawnById.set(r.target_budget_item_id, (drawnById.get(r.target_budget_item_id) ?? 0) + (Number(r.amount) || 0));
    }

    const makeKey = (cat: string, name: string, spec: string | null) =>
      `${cat}|${(name ?? "").trim().toLowerCase()}|${(spec ?? "").trim().toLowerCase()}`;

    // Group proposed items by natural key (same as what will be inserted)
    const proposedByKey = new Map<
      string,
      { category: string; itemName: string; spec: string | null; total: number; remainingRoom: number }
    >();
    for (const it of proposedItems) {
      const key = makeKey(it.category, it.itemName, it.spec ?? null);
      const existing = proposedByKey.get(key);
      if (existing) {
        existing.total += Number(it.totalAmount) || 0;
      } else {
        proposedByKey.set(key, {
          category: it.category,
          itemName: it.itemName,
          spec: it.spec,
          total: Number(it.totalAmount) || 0,
          remainingRoom: 0,
        });
      }
    }

    // Baseline totals per natural key for absorption-room calculation
    const baselineTotalByKey = new Map<string, number>();
    for (const bi of baselineItems ?? []) {
      const key = makeKey(bi.category, bi.item_name, bi.spec);
      baselineTotalByKey.set(
        key,
        (baselineTotalByKey.get(key) ?? 0) + (Number(bi.total_amount) || 0),
      );
    }

    for (const [key, entry] of proposedByKey.entries()) {
      const prev = baselineTotalByKey.get(key) ?? 0;
      entry.remainingRoom = Math.max(0, entry.total - prev);
    }

    const preview: Array<{
      source_category: string;
      source_item_name: string;
      source_spec: string | null;
      target_category: string;
      target_item_name: string;
      target_spec: string | null;
      amount: number;
    }> = [];

    for (const baseline of baselineItems ?? []) {
      const drawn = drawnById.get(baseline.id) ?? 0;
      if (drawn <= 0) continue;

      const key = makeKey(baseline.category, baseline.item_name, baseline.spec);
      const proposedEntry = proposedByKey.get(key);
      const proposedTotal = proposedEntry?.total ?? 0;
      let overReducedRemaining = Math.max(0, drawn - proposedTotal);
      if (overReducedRemaining <= 0) continue;

      for (const [targetKey, target] of proposedByKey.entries()) {
        if (targetKey === key) continue;
        if (target.remainingRoom <= 0) continue;
        const move = Math.min(overReducedRemaining, target.remainingRoom);
        if (move <= 0) continue;

        preview.push({
          source_category: baseline.category,
          source_item_name: baseline.item_name,
          source_spec: baseline.spec,
          target_category: target.category,
          target_item_name: target.itemName,
          target_spec: target.spec,
          amount: Number(move.toFixed(2)),
        });
        overReducedRemaining -= move;
        target.remainingRoom -= move;
        if (overReducedRemaining <= 0) break;
      }
    }

    return preview;
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

    // Cap check — the resulting duration (plan_start_date → new_end_date) must fit
    // the single-year product rule. Multi-year lifts this in Phase 2.
    const { data: planDates } = await this.db
      .from("funded_projects")
      .select("proposals(plan_start_date)")
      .eq("id", input.funded_project_id)
      .single();
    const planStart = (planDates as { proposals?: { plan_start_date?: string } } | null)
      ?.proposals?.plan_start_date;
    if (planStart) {
      const projectedDuration = monthsBetween(planStart, input.new_end_date);
      if (projectedDuration > MAX_PROJECT_DURATION_MONTHS) {
        return {
          data: null,
          error: {
            message: `Extension would push total project duration to ${projectedDuration} months. Projects are capped at ${MAX_PROJECT_DURATION_MONTHS} months while multi-year support is pending client confirmation.`,
            code: "DURATION_EXCEEDS_CAP",
          },
        };
      }
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
      .select("funded_project_id, new_end_date")
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

    // If approving, validate that the new end-date still fits the single-year cap
    // and propagate plan_end_date + duration onto the proposal so the quarter gates
    // and monitoring UI pick up the new timeline.
    let projectedDuration: number | null = null;
    if (input.status === "approved") {
      const { data: project } = await this.db
        .from("funded_projects")
        .select("proposal_id, proposals(plan_start_date)")
        .eq("id", extensionRequest.funded_project_id)
        .single();
      const proposalId = (project as { proposal_id?: number } | null)?.proposal_id;
      const planStart = (project as { proposals?: { plan_start_date?: string } } | null)
        ?.proposals?.plan_start_date;

      if (proposalId && planStart && extensionRequest.new_end_date) {
        projectedDuration = monthsBetween(planStart, extensionRequest.new_end_date);
        if (projectedDuration > MAX_PROJECT_DURATION_MONTHS) {
          return {
            data: null,
            error: {
              message: `Cannot approve: extension would push total project duration to ${projectedDuration} months. Projects are capped at ${MAX_PROJECT_DURATION_MONTHS} months while multi-year support is pending client confirmation.`,
              code: "DURATION_EXCEEDS_CAP",
            },
          };
        }

        const { error: updateError } = await this.db
          .from("proposals")
          .update({
            plan_end_date: extensionRequest.new_end_date,
            duration: projectedDuration,
          })
          .eq("id", proposalId);
        if (updateError) {
          return { data: null, error: updateError };
        }
      }
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
      details: {
        review_note: input.review_note,
        ...(projectedDuration !== null
          ? {
              new_end_date: extensionRequest.new_end_date,
              new_duration_months: projectedDuration,
            }
          : {}),
      },
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
    // Check every applicable (year, quarter) report is verified. A 24-month project
    // requires Y1Q1..Y2Q4 verified; a 6-month project only Y1Q1..Y1Q2.
    const { data: reports } = await this.db
      .from("project_reports")
      .select("year_number, quarterly_report, status")
      .eq("funded_project_id", input.funded_project_id);

    const durationMonths = await this.getProjectDurationMonths(input.funded_project_id);
    const requiredPeriods = getApplicablePeriods(durationMonths);
    const verifiedKeys = new Set(
      (reports || [])
        .filter((r) => r.status === "verified")
        .map((r) => `${r.year_number}_${r.quarterly_report}`),
    );
    const missingPeriods = requiredPeriods.filter(
      (p) => !verifiedKeys.has(`${p.year_number}_${p.quarter}`),
    );

    if (missingPeriods.length > 0) {
      const missingLabel = missingPeriods
        .map((p) => `Y${p.year_number} ${p.quarter}`)
        .join(", ");
      return {
        data: null,
        error: {
          message: `All quarterly reports must be verified before submitting a terminal report. Missing: ${missingLabel}.`,
          code: "INCOMPLETE_REPORTS",
        },
      };
    }

    // Same three-way check as quarterly report submit: no row → INSERT; rejected row →
    // UPDATE in place as a resubmission; any other status → genuine duplicate, reject.
    const { data: existing } = await this.db
      .from("project_terminal_reports")
      .select("id, status")
      .eq("funded_project_id", input.funded_project_id)
      .maybeSingle();

    const isResubmission = existing?.status === "rejected";

    if (existing && !isResubmission) {
      return {
        data: null,
        error: {
          message: "A terminal report has already been submitted for this project.",
          code: "TERMINAL_REPORT_EXISTS",
        },
      };
    }

    // Financial reconciliation gate: the declared surrender must not exceed the
    // actual unexpended balance (allocated − spent). Over-surrender would mean
    // proponent is promising to return money they don't hold.
    const surrenderedAmount = Number(input.surrendered_amount ?? 0) || 0;
    if (surrenderedAmount > 0) {
      const { data: activeVersion } = await this.db
        .from("funded_projects")
        .select("current_budget_version_id, proposal_budget_versions!funded_projects_current_budget_version_id_fkey(grand_total)")
        .eq("id", input.funded_project_id)
        .single();
      const allocatedTotal = Number(
        (activeVersion as any)?.proposal_budget_versions?.grand_total ?? 0,
      );

      const { data: expenses } = await this.db
        .from("project_expenses")
        .select("approved_amount, expenses, project_reports!inner(funded_project_id)")
        .eq("project_reports.funded_project_id", input.funded_project_id);
      const spentTotal = (expenses ?? []).reduce(
        (sum, e) => sum + (Number((e as any).approved_amount ?? (e as any).expenses) || 0),
        0,
      );

      const unexpendedBalance = allocatedTotal - spentTotal;
      // Tolerate 0.01 PHP rounding drift
      if (surrenderedAmount > unexpendedBalance + 0.01) {
        return {
          data: null,
          error: {
            message: `Declared surrender (₱${surrenderedAmount.toFixed(2)}) exceeds the unexpended balance (₱${unexpendedBalance.toFixed(2)}). You can only surrender what hasn't been spent.`,
            code: "SURRENDER_EXCEEDS_BALANCE",
          },
        };
      }
    }

    const payload = {
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
      surrendered_amount: surrenderedAmount,
      surrendered_at: surrenderedAmount > 0 ? new Date().toISOString() : null,
      surrendered_by: surrenderedAmount > 0 ? input.submitted_by : null,
      status: "submitted" as const,
      submitted_by: input.submitted_by,
    };

    let data: any = null;
    let error: any = null;
    if (isResubmission && existing) {
      // Keep review_note / reviewed_by / reviewed_at on resubmit — R&D's modal surfaces them
      // as "previously returned" context. Status alone gates the proponent's red banner.
      const update = await this.db
        .from("project_terminal_reports")
        .update({
          ...payload,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id)
        .select(
          `
          *,
          submitted_by_user:users!project_terminal_reports_submitted_by_fkey (id, first_name, last_name)
        `,
        )
        .single();
      data = update.data;
      error = update.error;
    } else {
      const insert = await this.db
        .from("project_terminal_reports")
        .insert(payload)
        .select(
          `
          *,
          submitted_by_user:users!project_terminal_reports_submitted_by_fkey (id, first_name, last_name)
        `,
        )
        .single();
      data = insert.data;
      error = insert.error;
    }

    if (error) {
      return { data: null, error };
    }

    await logActivity(this.db, {
      user_id: input.submitted_by,
      action: isResubmission ? "terminal_report_resubmitted" : "terminal_report_submitted",
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
          message: isResubmission
            ? "A terminal report you previously returned has been resubmitted with revisions. Please re-review."
            : "A terminal report has been submitted and is awaiting your verification.",
          is_read: false,
          link: "project-monitoring",
        });
      }
    }

    return { data, error: null, isResubmission };
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

  /**
   * Reject a terminal report with a required note. Same pattern as rejectReport for
   * quarterly reports. Flips status 'submitted' → 'rejected' + persists review_note /
   * reviewed_by / reviewed_at so the proponent monitoring UI can render the reason.
   */
  async rejectTerminalReport(input: { terminal_report_id: number; reviewed_by: string; review_note: string }) {
    const { data: terminalReport } = await this.db
      .from("project_terminal_reports")
      .select("funded_project_id")
      .eq("id", input.terminal_report_id)
      .single();

    if (!terminalReport) {
      return { data: null, error: { message: "Terminal report not found." } };
    }

    const coi = await this.assertNoCoiOnProject(input.reviewed_by, terminalReport.funded_project_id);
    if (coi) {
      await logActivity(this.db, {
        user_id: input.reviewed_by,
        action: "coi_block_reject_terminal_report",
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
        status: "rejected",
        review_note: input.review_note,
        reviewed_by: input.reviewed_by,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.terminal_report_id)
      .eq("status", "submitted")
      .select(
        `
        *,
        submitted_by_user:users!project_terminal_reports_submitted_by_fkey (id, first_name, last_name)
      `,
      )
      .single();

    if (error) {
      return { data: null, error };
    }

    if (!data) {
      return {
        data: null,
        error: { message: "Terminal report not found or no longer in a submittable state." },
      };
    }

    await logActivity(this.db, {
      user_id: input.reviewed_by,
      action: "terminal_report_rejected",
      category: "project",
      target_id: String(input.terminal_report_id),
      target_type: "funded_project",
      details: { funded_project_id: terminalReport.funded_project_id, review_note: input.review_note },
    });

    // Notify the proponent (in-app + email, same pattern as verify)
    await this.db.from("notifications").insert({
      user_id: data.submitted_by,
      message: `Your terminal report was returned for revision. Reason: ${input.review_note}`,
      is_read: false,
      link: "project-monitoring",
    });

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
          "Terminal Report Returned for Revision",
          `R&D returned your terminal report. Reason: ${input.review_note}. Sign in to SPMAMS to edit and resubmit.`,
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
        id, year_number, quarterly_report, status,
        fund_request_items (id, item_name, amount, category, budget_item_id)
      `)
      .eq("funded_project_id", fundedProjectId)
      .eq("status", "approved");

    // 3. Get all expenses linked to fund request items
    const { data: allReports } = await this.db
      .from("project_reports")
      .select(`
        id, year_number, quarterly_report,
        project_expenses (id, expenses, fund_request_item_id, approved_amount)
      `)
      .eq("funded_project_id", fundedProjectId);

    // Build lookup: fund_request_item_id → {year_number, quarter}
    type PeriodKey = { year_number: number; quarter: string };
    const friToPeriod: Record<number, PeriodKey> = {};
    for (const fr of fundRequests || []) {
      const period: PeriodKey = {
        year_number: (fr as any).year_number ?? 1,
        quarter: fr.quarterly_report,
      };
      for (const item of (fr as any).fund_request_items || []) {
        friToPeriod[item.id] = period;
      }
    }

    // Build lookup: budget_item_id → { "year_quarter" → { requested, spent } }
    // The composite key ("1_q1_report") keeps Y1Q1 distinct from Y2Q1 etc.
    type QuarterData = { requested: number; spent: number };
    const periodKey = (yr: number, q: string) => `${yr}_${q}`;
    const itemPeriodMap: Record<number, Record<string, QuarterData>> = {};

    // Map fund request items to budget items by period
    for (const fr of fundRequests || []) {
      const year = (fr as any).year_number ?? 1;
      const q = fr.quarterly_report;
      const key = periodKey(year, q);
      for (const fri of (fr as any).fund_request_items || []) {
        const budgetItemId = fri.budget_item_id;
        if (!budgetItemId) continue;
        if (!itemPeriodMap[budgetItemId]) {
          itemPeriodMap[budgetItemId] = {};
        }
        if (!itemPeriodMap[budgetItemId][key]) {
          itemPeriodMap[budgetItemId][key] = { requested: 0, spent: 0 };
        }
        itemPeriodMap[budgetItemId][key].requested += Number(fri.amount) || 0;
      }
    }

    // Map expenses to budget items by period
    for (const report of allReports || []) {
      for (const expense of (report as any).project_expenses || []) {
        const friId = expense.fund_request_item_id;
        if (!friId) continue;

        const period = friToPeriod[friId];
        if (!period) continue;

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
        const key = periodKey(period.year_number, period.quarter);
        if (!itemPeriodMap[budgetItemId]) {
          itemPeriodMap[budgetItemId] = {};
        }
        if (!itemPeriodMap[budgetItemId][key]) {
          itemPeriodMap[budgetItemId][key] = { requested: 0, spent: 0 };
        }
        itemPeriodMap[budgetItemId][key].spent += Number(expense.expenses) || 0;
      }
    }

    // Build the line items response.
    // Backwards compatible: `quarterly_data` still shows Y1 only (what the legacy
    // frontend consumer expects). New `yearly_data` carries the full multi-year
    // picture: { [year_number]: { q1, q2, q3, q4 } }. Phase 2C polishes the
    // frontend table; for now consumers that already know about Phase 2A can
    // read yearly_data and consumers that don't keep working on quarterly_data.
    const quarterKeys = ["q1_report", "q2_report", "q3_report", "q4_report"];
    const lineItems = budgetItems.map((bi: any) => {
      const pData = itemPeriodMap[bi.id] || {};
      const yearlyData: Record<number, Record<string, QuarterData | null>> = {};
      let totalRequested = 0;
      let totalSpent = 0;

      for (const key of Object.keys(pData)) {
        const [yearStr, ...qParts] = key.split("_");
        const year = parseInt(yearStr, 10);
        const quarter = qParts.join("_");
        if (!yearlyData[year]) yearlyData[year] = {};
        yearlyData[year][quarter] = pData[key];
        totalRequested += pData[key].requested;
        totalSpent += pData[key].spent;
      }

      const y1 = yearlyData[1] || {};
      return {
        budget_item_id: bi.id,
        item_name: bi.item_name,
        category: bi.category as "ps" | "mooe" | "co",
        approved_budget: Number(bi.total_amount) || 0,
        quarterly_data: {
          q1: y1["q1_report"] || null,
          q2: y1["q2_report"] || null,
          q3: y1["q3_report"] || null,
          q4: y1["q4_report"] || null,
        },
        yearly_data: yearlyData,
        total_requested: totalRequested,
        total_spent: totalSpent,
        balance: (Number(bi.total_amount) || 0) - totalSpent,
      };
    });
    // Silence the "quarterKeys unused" lint — kept for documentation of the key shape.
    void quarterKeys;

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

    // Emit max_quarter + total_periods so the frontend can size columns per
    // project duration. max_quarter stays clamped at 4 for the legacy
    // single-year consumer; total_periods is the full multi-year count.
    const durationMonths = await this.getProjectDurationMonths(fundedProjectId);
    const maxQuarter = computeMaxQuarterCount(durationMonths);
    const totalPeriods = computeTotalPeriods(durationMonths);

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
        duration_months: durationMonths,
        max_quarter: maxQuarter,
        total_periods: totalPeriods,
      },
      error: null,
    };
  }

  // ── Upload Project Document (DOST Forms 4/5) ─────────────────────────────
  // Verification state machine: see migration 20260420202938. Upload transitions
  // the doc to 'pending_verification'. Re-upload is blocked during pending
  // (wait for RND review) and during verified (locked; admin reset required).
  async uploadProjectDocument(
    funded_project_id: number,
    document_type: "moa" | "agency_certification",
    file_url: string,
    user_id: string,
  ) {
    const statusCol = document_type === "moa" ? "moa_status" : "agency_cert_status";
    const reviewNoteCol = document_type === "moa" ? "moa_review_note" : "agency_cert_review_note";
    const verifiedByCol = document_type === "moa" ? "moa_verified_by" : "agency_cert_verified_by";
    const verifiedAtCol = document_type === "moa" ? "moa_verified_at" : "agency_cert_verified_at";
    const fileCol = document_type === "moa" ? "moa_file_url" : "agency_certification_file_url";

    // Verify project exists and user has access
    const { data: project, error: fetchError } = await this.db
      .from("funded_projects")
      .select(`id, project_lead_id, ${statusCol}`)
      .eq("id", funded_project_id)
      .single();

    if (fetchError || !project) {
      return { data: null, error: fetchError || new Error("Project not found") };
    }

    // Access check: project lead or active member
    const isLead = (project as { project_lead_id: string }).project_lead_id === user_id;
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

    // State-machine gate: block re-upload during pending or verified.
    const currentStatus = (project as Record<string, string>)[statusCol];
    if (currentStatus === "pending_verification") {
      return {
        data: null,
        error: {
          message: "This document is awaiting R&D verification. Please wait for the current review before re-uploading.",
          code: "DOC_PENDING_VERIFICATION",
        },
      };
    }
    if (currentStatus === "verified") {
      return {
        data: null,
        error: {
          message: "This document is already verified. Ask R&D/Admin to reset it if a re-upload is required.",
          code: "DOC_ALREADY_VERIFIED",
        },
      };
    }

    // not_uploaded → pending_verification OR rejected → pending_verification.
    // Clear prior verifier/note on re-upload so a fresh review starts clean.
    const { error: updateError } = await this.db
      .from("funded_projects")
      .update({
        [fileCol]: file_url,
        [statusCol]: "pending_verification",
        [reviewNoteCol]: null,
        [verifiedByCol]: null,
        [verifiedAtCol]: null,
      })
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
      details: { document_type, label: labelMap[document_type], status: "pending_verification" },
    });

    // Notify the assigned RND so the review queue is fresh.
    const { data: projLink } = await this.db
      .from("funded_projects")
      .select("proposal_id")
      .eq("id", funded_project_id)
      .single();
    if (projLink?.proposal_id) {
      const { data: assignment } = await this.db
        .from("proposal_rnd")
        .select("rnd_id")
        .eq("proposal_id", projLink.proposal_id)
        .single();
      if (assignment?.rnd_id) {
        await this.db.from("notifications").insert({
          user_id: assignment.rnd_id,
          message: `${labelMap[document_type]} uploaded — awaiting your verification.`,
          is_read: false,
          link: "project-monitoring",
        });
      }
    }

    return { data: { funded_project_id, document_type, file_url, status: "pending_verification" }, error: null };
  }

  // ── Verify / Reject Compliance Document (RND/Admin action) ──────────────
  async verifyProjectDocument(
    funded_project_id: number,
    document_type: "moa" | "agency_certification",
    reviewed_by: string,
  ) {
    const statusCol = document_type === "moa" ? "moa_status" : "agency_cert_status";
    const verifiedByCol = document_type === "moa" ? "moa_verified_by" : "agency_cert_verified_by";
    const verifiedAtCol = document_type === "moa" ? "moa_verified_at" : "agency_cert_verified_at";
    const reviewNoteCol = document_type === "moa" ? "moa_review_note" : "agency_cert_review_note";

    // COI guard — reviewer can't be a project member
    const coi = await this.assertNoCoiOnProject(reviewed_by, funded_project_id);
    if (coi) {
      return { data: null, error: { message: coi.message } };
    }

    const { data: current } = await this.db
      .from("funded_projects")
      .select(`${statusCol}, project_lead_id`)
      .eq("id", funded_project_id)
      .single();
    if (!current) {
      return { data: null, error: { message: "Project not found" } };
    }
    const status = (current as Record<string, string>)[statusCol];
    if (status !== "pending_verification") {
      return {
        data: null,
        error: { message: `Can only verify documents in pending_verification state (current: ${status}).` },
      };
    }

    const { error: updateError } = await this.db
      .from("funded_projects")
      .update({
        [statusCol]: "verified",
        [verifiedByCol]: reviewed_by,
        [verifiedAtCol]: new Date().toISOString(),
        [reviewNoteCol]: null,
      })
      .eq("id", funded_project_id);
    if (updateError) {
      return { data: null, error: updateError };
    }

    const labelMap = { moa: "Memorandum of Agreement", agency_certification: "Agency Certification" };
    await logActivity(this.db, {
      user_id: reviewed_by,
      action: "project_document_verified",
      category: "project",
      target_id: String(funded_project_id),
      target_type: "funded_project",
      details: { document_type, label: labelMap[document_type] },
    });

    // Notify the project lead
    const projectLeadId = (current as { project_lead_id: string }).project_lead_id;
    if (projectLeadId) {
      await this.db.from("notifications").insert({
        user_id: projectLeadId,
        message: `${labelMap[document_type]} verified by R&D. Fund requests can proceed.`,
        is_read: false,
        link: "project-monitoring",
      });
    }

    return { data: { funded_project_id, document_type, status: "verified" }, error: null };
  }

  async rejectProjectDocument(
    funded_project_id: number,
    document_type: "moa" | "agency_certification",
    reviewed_by: string,
    review_note: string,
  ) {
    if (!review_note || review_note.trim().length < 10) {
      return {
        data: null,
        error: { message: "A review note of at least 10 characters is required when rejecting a document." },
      };
    }

    const statusCol = document_type === "moa" ? "moa_status" : "agency_cert_status";
    const verifiedByCol = document_type === "moa" ? "moa_verified_by" : "agency_cert_verified_by";
    const verifiedAtCol = document_type === "moa" ? "moa_verified_at" : "agency_cert_verified_at";
    const reviewNoteCol = document_type === "moa" ? "moa_review_note" : "agency_cert_review_note";

    const coi = await this.assertNoCoiOnProject(reviewed_by, funded_project_id);
    if (coi) {
      return { data: null, error: { message: coi.message } };
    }

    const { data: current } = await this.db
      .from("funded_projects")
      .select(`${statusCol}, project_lead_id`)
      .eq("id", funded_project_id)
      .single();
    if (!current) {
      return { data: null, error: { message: "Project not found" } };
    }
    const status = (current as Record<string, string>)[statusCol];
    if (status !== "pending_verification") {
      return {
        data: null,
        error: { message: `Can only reject documents in pending_verification state (current: ${status}).` },
      };
    }

    const { error: updateError } = await this.db
      .from("funded_projects")
      .update({
        [statusCol]: "rejected",
        [verifiedByCol]: reviewed_by,
        [verifiedAtCol]: new Date().toISOString(),
        [reviewNoteCol]: review_note.trim(),
      })
      .eq("id", funded_project_id);
    if (updateError) {
      return { data: null, error: updateError };
    }

    const labelMap = { moa: "Memorandum of Agreement", agency_certification: "Agency Certification" };
    await logActivity(this.db, {
      user_id: reviewed_by,
      action: "project_document_rejected",
      category: "project",
      target_id: String(funded_project_id),
      target_type: "funded_project",
      details: { document_type, label: labelMap[document_type], review_note: review_note.trim() },
    });

    const projectLeadId = (current as { project_lead_id: string }).project_lead_id;
    if (projectLeadId) {
      await this.db.from("notifications").insert({
        user_id: projectLeadId,
        message: `${labelMap[document_type]} was rejected by R&D. Please review the note and re-upload.`,
        is_read: false,
        link: "project-monitoring",
      });
    }

    return { data: { funded_project_id, document_type, status: "rejected" }, error: null };
  }
}
