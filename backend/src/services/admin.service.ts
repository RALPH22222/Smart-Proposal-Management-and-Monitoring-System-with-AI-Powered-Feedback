import { SupabaseClient } from "@supabase/supabase-js";
import { CreateAccountInput, UpdateAccountInput, ToggleAccountStatusInput, InviteUserInput } from "../schemas/admin-schema";
import { logActivity } from "../utils/activity-logger";

export class AdminService {
  constructor(private db: SupabaseClient) {}

  async createAccount(input: CreateAccountInput) {
    const { email, password, roles, first_name, last_name, middle_ini } = input;

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

    // Flag admin-created accounts so they must change password on first login
    if (data.user) {
      await this.db
        .from("users")
        .update({ password_change_required: true })
        .eq("id", data.user.id);
    }

    return { data, error: null };
  }

  async getAccounts(filters?: { role?: string; is_disabled?: boolean }) {
    let query = this.db
      .from("users")
      .select("id, first_name, last_name, middle_ini, email, roles, is_disabled, department_id, photo_profile_url, profile_completed, departments(name)")
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
    if (updates.middle_ini !== undefined) payload.middle_ini = updates.middle_ini;
    if (updates.roles !== undefined) payload.roles = updates.roles;

    if (Object.keys(payload).length === 0) {
      return { data: null, error: { message: "No fields to update" } };
    }

    const { data, error } = await this.db
      .from("users")
      .update(payload)
      .eq("id", user_id)
      .select()
      .maybeSingle();

    if (error) {
      return { data: null, error };
    }

    return { data, error: null };
  }

  async inviteUser(input: InviteUserInput, redirectTo: string) {
    const { email, roles } = input;

    const { data, error } = await this.db.auth.admin.inviteUserByEmail(email, {
      data: { roles },
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

  async getAdminDashboardStats() {
    try {
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

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
        fundedProposalRes,
        totalProjectsRes,
        onGoingRes,
        completedRes,
        onHoldRes,
        blockedRes,
        logs24hRes,
        logs7dRes,
        recentLogsRes,
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
          .select(`id, user_id, action, category, target_id, target_type, details, created_at, users:users!user_id (first_name, last_name)`)
          .order("created_at", { ascending: false })
          .limit(5),
      ]);

      const recentActivity = (recentLogsRes.data || []).map((log: any) => ({
        id: log.id,
        action: log.action,
        category: log.category,
        target_id: log.target_id,
        target_type: log.target_type,
        details: log.details,
        created_at: log.created_at,
        user_name: log.users
          ? `${log.users.first_name || ""} ${log.users.last_name || ""}`.trim()
          : "Unknown",
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
        },
        error: null,
      };
    } catch (error) {
      return { data: null, error };
    }
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
        { count: "exact" }
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
      user_name: log.users
        ? `${log.users.first_name || ""} ${log.users.last_name || ""}`.trim()
        : "Unknown",
      user_roles: log.users?.roles || [],
      users: undefined,
    }));

    return { data: logs, error: null, count: count || 0 };
  }
}
