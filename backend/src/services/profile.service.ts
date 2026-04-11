import { SupabaseClient } from "@supabase/supabase-js";
import { UpdateProfileInput } from "../schemas/profile-schema";

export class ProfileService {
  constructor(private db: SupabaseClient) {}

  async getProfile(userId: string) {
    const { data, error } = await this.db
      .from("users")
      .select("id, email, first_name, last_name, middle_ini, birth_date, sex, department_id, photo_profile_url, departments(name)")
      .eq("id", userId)
      .maybeSingle();

    if (error) return { data: null, error };
    return { data, error: null };
  }

  async updateProfile(userId: string, input: UpdateProfileInput) {
    // Clean up input to avoid undefined overriding with nulls if we don't want to
    const payload: any = {
      first_name: input.first_name,
      last_name: input.last_name,
    };
    if (input.middle_ini !== undefined) payload.middle_ini = input.middle_ini;
    if (input.birth_date !== undefined) payload.birth_date = input.birth_date;
    if (input.sex !== undefined) payload.sex = input.sex;
    if (input.department_id !== undefined) payload.department_id = input.department_id;

    const { data, error } = await this.db
      .from("users")
      .update(payload)
      .eq("id", userId)
      .select()
      .maybeSingle();

    if (error) return { data: null, error };
    return { data, error: null };
  }

  async changeEmail(userId: string, newEmail: string) {
    // 1. Update Auth identity
    // By default, using admin API updates it instantly. 
    const { error: authError } = await this.db.auth.admin.updateUserById(userId, {
      email: newEmail,
      email_confirm: true, // auto-confirm for now to avoid locking them out
    });

    if (authError) return { data: null, error: authError };

    // 2. Update users table email field (since we mirror it)
    const { error: updateError } = await this.db
      .from("users")
      .update({ email: newEmail })
      .eq("id", userId);

    if (updateError) return { data: null, error: updateError };

    return { data: { success: true }, error: null };
  }

  async updateAvatar(userId: string, photoUrl: string) {
    const { data, error } = await this.db
      .from("users")
      .update({ photo_profile_url: photoUrl })
      .eq("id", userId)
      .select("photo_profile_url")
      .maybeSingle();

    if (error) return { data: null, error };
    return { data, error: null };
  }
}
