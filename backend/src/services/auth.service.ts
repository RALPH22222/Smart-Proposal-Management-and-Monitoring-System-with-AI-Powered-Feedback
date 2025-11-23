import { SupabaseClient } from "@supabase/supabase-js";
import { Role } from "../constants/user";

export class AuthService {
  constructor(private db: SupabaseClient) {}

  async login(email: string, password: string) {
    const { data, error } = await this.db.auth.signInWithPassword({
      email: email,
      password: password,
    });
    return { data, error };
  }

  async signup(email: string, password: string, name: string, role: typeof Role[keyof typeof Role]) {
    const { data, error } = await this.db.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          role,
          name
        }
      }
    });
    return { data, error };
  }
}
