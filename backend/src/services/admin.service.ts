import { SupabaseClient } from "@supabase/supabase-js";
import {
  CreateAccountInput,
  UpdateAccountInput,
  ToggleAccountStatusInput,
  CheckActiveAssignmentsInput,
  InviteUserInput,
} from "../schemas/admin-schema";
import { LateSubmissionPolicy, NotificationPreferences, EvaluationDeadlineInput } from "../schemas/settings-schema";
import { logActivity } from "../utils/activity-logger";

export class AdminService {
  constructor(private db: SupabaseClient) {}

  async createAccount(input: CreateAccountInput, photoUrl: string | null = null) {
    const { email, password, roles, first_name, last_name, middle_ini, birth_date, sex, department_id } = input;

    // Create auth user - the DB trigger auto-creates the users row
    const { data, error } = await this.db.auth.signUp({
      email,
      password,
      options: {
        data: {
          roles,
          first_name,
          last_name,
          middle_ini: middle_ini || null,
        },
      },
    });

    if (error) {
      return { data: null, error };
    }

    // Check duplicate email (Supabase returns a fake user with empty role)
    if (data.user && data.user.role !== "authenticated" && data.user.role === "") {
      return { data: null, error: { message: "Email already exists.", status: 409 } };
    }

    if (data.user) {
      const { error: profileError } = await this.db
        .from("users")
        .update({
          birth_date,
          sex,
          department_id,
          photo_profile_url: photoUrl,
          profile_completed: true,
          password_change_required: true,
        })
        .eq("id", data.user.id);

      if (profileError) {
        console.error("Failed to write profile fields after admin createAccount:", profileError);
        return { data, error: profileError };
      }
    }

    return { data, error: null };
  }

  async getAccounts(filters?: { role?: string; is_disabled?: boolean }) {
    let query = this.db
      .from("users")
      .select(
        "id, first_name, last_name, middle_ini, email, roles, is_disabled, department_id, photo_profile_url, profile_completed, created_at, departments(name)",
      )
      .order("created_at", { ascending: false });

    if (filters?.role) {
      query = query.contains("roles", [filters.role]);
    }

    if (filters?.is_disabled !== undefined) {
      query = query.eq("is_disabled", filters.is_disabled);
    }

    const { data, error } = await query;

    if (error) {
      return { data: null, error };
    }

    // Flatten departments join
    const accounts = (data || []).map((user: any) => ({
      ...user,
      department_name: user.departments?.name || null,
      departments: undefined,
    }));

    return { data: accounts, error: null };
  }

  async updateAccount(input: UpdateAccountInput) {
    const { user_id, ...updates } = input;

    // Build update payload (only include provided fields)
    const payload: Record<string, any> = {};
    if (updates.first_name !== undefined) payload.first_name = updates.first_name;
    if (updates.last_name !== undefined) payload.last_name = updates.last_name;
    if (updates.middle_ini !== undefined) payload.middle_ini = updates.middle_ini || null;
    if (updates.roles !== undefined) payload.roles = updates.roles;

    if (Object.keys(payload).length === 0) {
      return { data: null, error: { message: "No fields to update" } };
    }

    const { data, error } = await this.db.from("users").update(payload).eq("id", user_id).select().maybeSingle();

    if (error) {
      return { data: null, error };
    }

    return { data, error: null };
  }

  async inviteUser(input: InviteUserInput, redirectTo: string) {
    const { email, roles } = input;

    const { data, error } = await this.db.auth.admin.inviteUserByEmail(email, {
      data: { roles, invite_type: "staff" },
      redirectTo,
    });

    if (error) {
      return { data: null, error };
    }

    return { data, error: null };
  }

  async toggleAccountStatus(input: ToggleAccountStatusInput) {
    const { user_id, is_disabled } = input;

    const { data, error } = await this.db
      .from("users")
      .update({ is_disabled })
      .eq("id", user_id)
      .select("id, is_disabled")
      .maybeSingle();

    if (error) {
      return { data: null, error };
    }

    return { data, error: null };
  }

  async checkActiveAssignments(userId: string) {
    // Get user info to know their roles
    const { data: user, error: userErr } = await this.db
      .from("users")
      .select("id, roles")
      .eq("id", userId)
      .maybeSingle();

    if (userErr) return { data: null, error: userErr };
    if (!user) return { data: null, error: { message: "User not found" } };

    const roles: string[] = user.roles || [];

    // Active proposal statuses (not terminal)
    const activeProposalStatuses = [
      "review_rnd",
      "under_evaluation",
      "revision_rnd",
      "endorsed_for_funding",
      "revision_funding",
    ];

    // Active evaluator statuses (not completed/declined)
    const activeEvaluatorStatuses = ["pending", "for_review", "extend"];

    let rndAssignments: any[] = [];
    let evaluatorAssignments: any[] = [];

    if (roles.includes("rnd") || roles.includes("admin")) {
      const { data, error } = await this.db
        .from("proposal_rnd")
        .select("proposal_id, proposals(id, project_title, status, department_id)")
        .eq("rnd_id", userId);

      if (!error && data) {
        rndAssignments = data
          .filter((r: any) => r.proposals && activeProposalStatuses.includes(r.proposals.status))
          .map((r: any) => ({
            proposal_id: r.proposal_id,
            project_title: r.proposals.project_title,
            proposal_status: r.proposals.status,
            department_id: r.proposals.department_id,
          }));
      }
    }

    if (roles.includes("evaluator")) {
      const { data, error } = await this.db
        .from("proposal_evaluators")
        .select("proposal_id, status, proposals(id, project_title, status)")
        .eq("evaluator_id", userId);

      if (!error && data) {
        evaluatorAssignments = data
          .filter(
            (e: any) =>
              e.proposals && activeEvaluatorStatuses.includes(e.status),
          )
          .map((e: any) => ({
            proposal_id: e.proposal_id,
            project_title: e.proposals.project_title,
            proposal_status: e.proposals.status,
            evaluator_status: e.status,
          }));
      }
    }

    return {
      data: {
        user_id: userId,
        user_roles: roles,
        rnd_assignments: rndAssignments,
        evaluator_assignments: evaluatorAssignments,
        has_active_assignments: rndAssignments.length > 0 || evaluatorAssignments.length > 0,
      },
      error: null,
    };
  }

  async disableWithReassignment(input: {
    user_id: string;
    reassignments: {
      rnd: Array<{ proposal_id: number; new_rnd_id: string }>;
      evaluator: Array<{ proposal_id: number; new_evaluator_id: string }>;
    };
    admin_id: string;
  }) {
    // Execute RND reassignments
    for (const r of input.reassignments.rnd) {
      // Delete old assignment
      await this.db
        .from("proposal_rnd")
        .delete()
        .eq("proposal_id", r.proposal_id)
        .eq("rnd_id", input.user_id);

      // Insert new assignment
      const { error: insertErr } = await this.db
        .from("proposal_rnd")
        .insert({ proposal_id: r.proposal_id, rnd_id: r.new_rnd_id });

      if (insertErr) {
        return { data: null, error: { message: `Failed to reassign RND for proposal ${r.proposal_id}: ${insertErr.message}` } };
      }

      await logActivity(this.db, {
        user_id: input.admin_id,
        action: "proposal_rnd_reassigned_on_disable",
        category: "account",
        target_id: String(r.proposal_id),
        target_type: "proposal",
        details: {
          disabled_user_id: input.user_id,
          new_rnd_id: r.new_rnd_id,
          reason: "account_disabled",
        },
      });
    }

    // Execute Evaluator reassignments
    for (const e of input.reassignments.evaluator) {
      // Fetch old evaluator record to copy metadata
      const { data: oldRecord } = await this.db
        .from("proposal_evaluators")
        .select("deadline_at, forwarded_by_rnd, comments_for_evaluators, proponent_info_visibility, anonymized_file_url")
        .eq("proposal_id", e.proposal_id)
        .eq("evaluator_id", input.user_id)
        .maybeSingle();

      // Delete old evaluator assignment
      await this.db
        .from("proposal_evaluators")
        .delete()
        .eq("proposal_id", e.proposal_id)
        .eq("evaluator_id", input.user_id);

      // Delete old tracker entry
      await this.db
        .from("proposal_assignment_tracker")
        .delete()
        .eq("proposal_id", e.proposal_id)
        .eq("evaluator_id", input.user_id);

      // Insert new evaluator assignment (copy metadata from old record)
      const { error: insertErr } = await this.db
        .from("proposal_evaluators")
        .insert({
          proposal_id: e.proposal_id,
          evaluator_id: e.new_evaluator_id,
          status: "pending",
          deadline_at: oldRecord?.deadline_at || null,
          forwarded_by_rnd: oldRecord?.forwarded_by_rnd || null,
          comments_for_evaluators: oldRecord?.comments_for_evaluators || null,
          proponent_info_visibility: oldRecord?.proponent_info_visibility ?? true,
          anonymized_file_url: oldRecord?.anonymized_file_url || null,
        });

      if (insertErr) {
        return { data: null, error: { message: `Failed to reassign evaluator for proposal ${e.proposal_id}: ${insertErr.message}` } };
      }

      // Insert new tracker entry
      await this.db
        .from("proposal_assignment_tracker")
        .insert({
          proposal_id: e.proposal_id,
          evaluator_id: e.new_evaluator_id,
          status: "pending",
        });

      await logActivity(this.db, {
        user_id: input.admin_id,
        action: "proposal_evaluator_reassigned_on_disable",
        category: "account",
        target_id: String(e.proposal_id),
        target_type: "proposal",
        details: {
          disabled_user_id: input.user_id,
          new_evaluator_id: e.new_evaluator_id,
          reason: "account_disabled",
        },
      });
    }

    // Finally, disable the account
    const { data, error } = await this.db
      .from("users")
      .update({ is_disabled: true })
      .eq("id", input.user_id)
      .select("id, is_disabled")
      .maybeSingle();

    if (error) {
      return { data: null, error };
    }

    return { data, error: null };
  }

  async getAdminDashboardStats() {
    try {
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

      // Date boundaries for KPI queries
      const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1).toISOString();

      const [
        totalUsersRes,
        activeUsersRes,
        proponentRes,
        evaluatorRes,
        rndRes,
        adminRes,
        totalProposalsRes,
        reviewRndRes,
        underEvalRes,
        revisionRndRes,
        rejectedRndRes,
        endorsedRes,
        revisionFundingRes,
        rejectedFundingRes,
        fundedProposalRes,
        totalProjectsRes,
        onGoingRes,
        completedRes,
        onHoldRes,
        blockedRes,
        logs24hRes,
        logs7dRes,
        recentLogsRes,
        // KPI queries
        evaluatorAssignmentsRes,
        proposalStatusLogsRes,
        monthlyProposalsRes,
        fundRequestsRes,
      ] = await Promise.all([
        // User stats
        this.db.from("users").select("*", { count: "exact", head: true }),
        this.db.from("users").select("*", { count: "exact", head: true }).eq("is_disabled", false),
        this.db.from("users").select("*", { count: "exact", head: true }).contains("roles", ["proponent"]),
        this.db.from("users").select("*", { count: "exact", head: true }).contains("roles", ["evaluator"]),
        this.db.from("users").select("*", { count: "exact", head: true }).contains("roles", ["rnd"]),
        this.db.from("users").select("*", { count: "exact", head: true }).contains("roles", ["admin"]),

        // Proposal stats
        this.db.from("proposals").select("*", { count: "exact", head: true }),
        this.db.from("proposals").select("*", { count: "exact", head: true }).eq("status", "review_rnd"),
        this.db.from("proposals").select("*", { count: "exact", head: true }).eq("status", "under_evaluation"),
        this.db.from("proposals").select("*", { count: "exact", head: true }).eq("status", "revision_rnd"),
        this.db.from("proposals").select("*", { count: "exact", head: true }).eq("status", "rejected_rnd"),
        this.db.from("proposals").select("*", { count: "exact", head: true }).eq("status", "endorsed_for_funding"),
        this.db.from("proposals").select("*", { count: "exact", head: true }).eq("status", "revision_funding"),
        this.db.from("proposals").select("*", { count: "exact", head: true }).eq("status", "rejected_funding"),
        this.db.from("proposals").select("*", { count: "exact", head: true }).eq("status", "funded"),

        // Funded project stats
        this.db.from("funded_projects").select("*", { count: "exact", head: true }),
        this.db.from("funded_projects").select("*", { count: "exact", head: true }).eq("status", "on_going"),
        this.db.from("funded_projects").select("*", { count: "exact", head: true }).eq("status", "completed"),
        this.db.from("funded_projects").select("*", { count: "exact", head: true }).eq("status", "on_hold"),
        this.db.from("funded_projects").select("*", { count: "exact", head: true }).eq("status", "blocked"),

        // Activity stats
        this.db.from("pms_logs").select("*", { count: "exact", head: true }).gte("created_at", oneDayAgo),
        this.db.from("pms_logs").select("*", { count: "exact", head: true }).gte("created_at", sevenDaysAgo),

        // Recent activity (last 5)
        this.db
          .from("pms_logs")
          .select(
            `id, user_id, action, category, target_id, target_type, details, created_at, users:users!user_id (first_name, last_name)`,
          )
          .order("created_at", { ascending: false })
          .limit(5),

        // KPI: Evaluator completion rate
        this.db.from("proposal_evaluators").select("id, status"),

        // KPI: Status transition timestamps for turnaround time
        this.db
          .from("pms_logs")
          .select("target_id, action, created_at")
          .eq("target_type", "proposal")
          .in("action", [
            "proposal_created",
            "proposal_forwarded_to_rnd",
            "proposal_auto_distributed",
            "evaluator_assigned",
            "evaluation_scores_submitted",
            "proposal_endorsed_for_funding",
            "proposal_funded",
          ])
          .order("created_at", { ascending: true }),

        // KPI: Monthly proposal trends (last 12 months)
        this.db
          .from("proposals")
          .select("id, status, created_at")
          .gte("created_at", twelveMonthsAgo),

        // KPI: Fund utilization — fund requests with their line item amounts
        this.db
          .from("fund_requests")
          .select("id, funded_project_id, status, fund_request_items(amount)"),
      ]);

      const recentActivity = (recentLogsRes.data || []).map((log: any) => ({
        id: log.id,
        action: log.action,
        category: log.category,
        target_id: log.target_id,
        target_type: log.target_type,
        details: log.details,
        created_at: log.created_at,
        user_name: log.users ? `${log.users.first_name || ""} ${log.users.last_name || ""}`.trim() : "Unknown",
      }));

      // ── KPI Computation ───────────────────────────────────────────────────

      // 1. Evaluation completion rate
      const evalAssignments = evaluatorAssignmentsRes.data || [];
      const totalAssignments = evalAssignments.length;
      const completedAssignments = evalAssignments.filter(
        (a: any) => ["approve", "revise", "reject"].includes(a.status),
      ).length;
      const evaluationCompletionRate = totalAssignments > 0 ? Math.round((completedAssignments / totalAssignments) * 100) : 0;

      // 2. Proposal success rate
      const totalProposals = totalProposalsRes.count || 0;
      const fundedCount = fundedProposalRes.count || 0;
      const proposalSuccessRate = totalProposals > 0 ? Math.round((fundedCount / totalProposals) * 100) : 0;

      // 3. Average turnaround time per stage (in days)
      const statusLogs = proposalStatusLogsRes.data || [];
      const logsByProposal: Record<string, { action: string; created_at: string }[]> = {};
      for (const log of statusLogs) {
        if (!log.target_id) continue;
        if (!logsByProposal[log.target_id]) logsByProposal[log.target_id] = [];
        logsByProposal[log.target_id].push({ action: log.action, created_at: log.created_at });
      }

      // Define stage transitions: from action → to action = stage duration
      const stageTransitions = [
        { from: "proposal_created", to: "proposal_forwarded_to_rnd", stage: "submission_to_rnd" },
        { from: "proposal_created", to: "proposal_auto_distributed", stage: "submission_to_rnd" },
        { from: "proposal_forwarded_to_rnd", to: "evaluator_assigned", stage: "rnd_review" },
        { from: "proposal_auto_distributed", to: "evaluator_assigned", stage: "rnd_review" },
        { from: "evaluator_assigned", to: "evaluation_scores_submitted", stage: "evaluation" },
        { from: "evaluation_scores_submitted", to: "proposal_endorsed_for_funding", stage: "endorsement" },
        { from: "proposal_endorsed_for_funding", to: "proposal_funded", stage: "funding_decision" },
      ];

      const stageDurations: Record<string, number[]> = {};
      for (const logs of Object.values(logsByProposal)) {
        for (const transition of stageTransitions) {
          const fromLog = logs.find((l) => l.action === transition.from);
          const toLog = logs.find((l) => l.action === transition.to);
          if (fromLog && toLog) {
            const diffDays = (new Date(toLog.created_at).getTime() - new Date(fromLog.created_at).getTime()) / (1000 * 60 * 60 * 24);
            if (diffDays >= 0 && diffDays < 365) { // sanity bound
              if (!stageDurations[transition.stage]) stageDurations[transition.stage] = [];
              stageDurations[transition.stage].push(diffDays);
            }
          }
        }
      }

      const avgTurnaroundDays: Record<string, number> = {};
      for (const [stage, durations] of Object.entries(stageDurations)) {
        avgTurnaroundDays[stage] = durations.length > 0
          ? Math.round((durations.reduce((s, d) => s + d, 0) / durations.length) * 10) / 10
          : 0;
      }

      // 4. Fund utilization rate — sum amounts from fund_request_items
      const fundRequests = fundRequestsRes.data || [];
      const sumItems = (r: any) => ((r.fund_request_items || []) as any[]).reduce((s: number, i: any) => s + (Number(i.amount) || 0), 0);
      const approvedRequests = fundRequests.filter((r: any) => r.status === "approved");
      const totalApproved = approvedRequests.reduce((sum: number, r: any) => sum + sumItems(r), 0);
      const totalRequested = fundRequests
        .filter((r: any) => r.status !== "rejected")
        .reduce((sum: number, r: any) => sum + sumItems(r), 0);
      const fundUtilizationRate = totalRequested > 0 ? Math.round((totalApproved / totalRequested) * 100) : 0;

      // 5. Monthly trends (last 12 months)
      const monthlyProposals = monthlyProposalsRes.data || [];
      const monthMap: Record<string, { submitted: number; funded: number; rejected: number }> = {};

      // Initialize last 12 months
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        monthMap[key] = { submitted: 0, funded: 0, rejected: 0 };
      }

      for (const p of monthlyProposals) {
        const d = new Date(p.created_at);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        if (monthMap[key]) {
          monthMap[key].submitted++;
          if (p.status === "funded") monthMap[key].funded++;
          if (["rejected_rnd", "rejected_funding"].includes(p.status)) monthMap[key].rejected++;
        }
      }

      const monthlyTrends = Object.entries(monthMap).map(([month, counts]) => ({
        month,
        ...counts,
      }));

      return {
        data: {
          users: {
            total: totalUsersRes.count || 0,
            active: activeUsersRes.count || 0,
            by_role: {
              proponent: proponentRes.count || 0,
              evaluator: evaluatorRes.count || 0,
              rnd: rndRes.count || 0,
              admin: adminRes.count || 0,
            },
          },
          proposals: {
            total: totalProposalsRes.count || 0,
            review_rnd: reviewRndRes.count || 0,
            under_evaluation: underEvalRes.count || 0,
            revision_rnd: revisionRndRes.count || 0,
            rejected_rnd: rejectedRndRes.count || 0,
            endorsed_for_funding: endorsedRes.count || 0,
            revision_funding: revisionFundingRes.count || 0,
            rejected_funding: rejectedFundingRes.count || 0,
            funded: fundedProposalRes.count || 0,
          },
          projects: {
            total: totalProjectsRes.count || 0,
            on_going: onGoingRes.count || 0,
            completed: completedRes.count || 0,
            on_hold: onHoldRes.count || 0,
            blocked: blockedRes.count || 0,
          },
          activity: {
            last_24h: logs24hRes.count || 0,
            last_7d: logs7dRes.count || 0,
            recent: recentActivity,
          },
          kpi: {
            avg_turnaround_days: avgTurnaroundDays,
            evaluation_completion_rate: evaluationCompletionRate,
            proposal_success_rate: proposalSuccessRate,
            fund_utilization_rate: fundUtilizationRate,
            monthly_trends: monthlyTrends,
          },
        },
        error: null,
      };
    } catch (error) {
      return { data: null, error };
    }
  }

  // ===================== SYSTEM SETTINGS =====================

  async getSystemSettings() {
    const { data, error } = await this.db
      .from("system_settings")
      .select("key, value");

    if (error) {
      return { data: null, error };
    }

    // Convert array of { key, value } into a keyed object
    const settings: Record<string, any> = {};
    for (const row of data || []) {
      settings[row.key] = row.value;
    }

    return { data: settings, error: null };
  }

  async getLateSubmissionPolicy() {
    const { data, error } = await this.db
      .from("system_settings")
      .select("value")
      .eq("key", "late_submission_policy")
      .maybeSingle();

    if (error) {
      return { data: null, error };
    }

    // Default to disabled if not found
    const policy: LateSubmissionPolicy = data?.value || { enabled: false };
    return { data: policy, error: null };
  }

  async updateLateSubmissionPolicy(policy: LateSubmissionPolicy, updatedBy: string) {
    const { data, error } = await this.db
      .from("system_settings")
      .upsert(
        { key: "late_submission_policy", value: policy },
        { onConflict: "key" }
      )
      .select()
      .single();

    if (error) {
      return { data: null, error };
    }

    await logActivity(this.db, {
      user_id: updatedBy,
      action: "late_submission_policy_updated",
      category: "settings",
      target_type: "system_settings",
      details: policy,
    });

    return { data: data.value, error: null };
  }

  // ===================== NOTIFICATION PREFERENCES =====================

  async getNotificationPreferences(userId: string) {
    const { data, error } = await this.db
      .from("users")
      .select("notification_preferences")
      .eq("id", userId)
      .single();

    if (error) {
      return { data: null, error };
    }

    const defaults: NotificationPreferences = {
      email: {
        proposal_endorsed: true,
        proposal_revision: true,
        fund_request_reviewed: true,
        certificate_issued: true,
        evaluator_assigned: true,
      },
      in_app: {
        proposal_endorsed: true,
        proposal_revision: true,
        fund_request_reviewed: true,
        certificate_issued: true,
        evaluator_assigned: true,
      },
    };

    return { data: data?.notification_preferences || defaults, error: null };
  }

  async updateNotificationPreferences(userId: string, prefs: NotificationPreferences) {
    const { data, error } = await this.db
      .from("users")
      .update({ notification_preferences: prefs })
      .eq("id", userId)
      .select("notification_preferences")
      .single();

    if (error) {
      return { data: null, error };
    }

    return { data: data.notification_preferences, error: null };
  }

  // ===================== EVALUATION DEADLINE =====================

  async getEvaluationDeadline() {
    const { data, error } = await this.db
      .from("system_settings")
      .select("value")
      .eq("key", "default_evaluation_deadline")
      .maybeSingle();

    if (error) {
      return { data: null, error };
    }

    return { data: data?.value || { days: 14 }, error: null };
  }

  async updateEvaluationDeadline(input: EvaluationDeadlineInput, updatedBy: string) {
    const { data, error } = await this.db
      .from("system_settings")
      .upsert(
        { key: "default_evaluation_deadline", value: input },
        { onConflict: "key" }
      )
      .select()
      .single();

    if (error) {
      return { data: null, error };
    }

    await logActivity(this.db, {
      user_id: updatedBy,
      action: "evaluation_deadline_updated",
      category: "settings",
      target_type: "system_settings",
      details: input,
    });

    return { data: data.value, error: null };
  }

  async getActivityLogs(filters?: {
    category?: string;
    action?: string;
    user_id?: string;
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
  }) {
    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 50;
    const offset = (page - 1) * limit;

    let query = this.db
      .from("pms_logs")
      .select(
        `
        id,
        user_id,
        action,
        category,
        target_id,
        target_type,
        details,
        created_at,
        users:users!user_id (id, first_name, last_name, roles)
      `,
        { count: "exact" },
      )
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (filters?.category) {
      query = query.eq("category", filters.category);
    }
    if (filters?.action) {
      query = query.eq("action", filters.action);
    }
    if (filters?.user_id) {
      query = query.eq("user_id", filters.user_id);
    }
    if (filters?.from) {
      query = query.gte("created_at", filters.from);
    }
    if (filters?.to) {
      query = query.lte("created_at", filters.to);
    }

    const { data, error, count } = await query;

    if (error) {
      return { data: null, error, count: 0 };
    }

    // Flatten user join
    const logs = (data || []).map((log: any) => ({
      ...log,
      user_name: log.users ? `${log.users.first_name || ""} ${log.users.last_name || ""}`.trim() : "Unknown",
      user_roles: log.users?.roles || [],
      users: undefined,
    }));

    return { data: logs, error: null, count: count || 0 };
  }

}
