import { SupabaseClient } from "@supabase/supabase-js";
import { CreateAccountInput, UpdateAccountInput, ToggleAccountStatusInput, InviteUserInput } from "../schemas/admin-schema";

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
}
