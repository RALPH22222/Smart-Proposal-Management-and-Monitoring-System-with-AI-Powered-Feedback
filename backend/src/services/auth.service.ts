import { SupabaseClient } from "@supabase/supabase-js";
import { SignUpInput } from "../schemas/sign-up-schema";
import jwt from "jsonwebtoken";
import { DecodedToken } from "../types/auth";

export class AuthService {
  constructor(private db?: SupabaseClient) {}

  async login(email: string, password: string) {
    const { data, error } = await this.db!.auth.signInWithPassword({ email, password });
    if (error || !data.user) return { data, error };

    const userId = data.user.id;

    const { data: row, error: rolesError } = await this.db!.from("users")
      .select("roles")
      .eq("id", userId)
      .maybeSingle();

    console.log("auth userId:", userId);
    console.log("rolesRow:", row);
    console.log("rolesError:", rolesError);

    if (rolesError) return { data: null, error: rolesError };

    const roles = row?.roles ?? []; // ✅ array

    return { data: { ...data, roles }, error: null };
  }

  async signup({ email, password, roles, first_name, last_name }: SignUpInput) {
    const { data, error } = await this.db!.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          roles,
          first_name,
          last_name,
        },
      },
    });
    return { data, error };
  }

  async verifyToken(token: string) {
    const supabase_secret_jwt = process.env.SUPABASE_SECRET_JWT;

    if (!supabase_secret_jwt) {
      return {
        error: {
          type: "missing_environment_variable",
          message: "Missing SUPABASE SECRET JWT",
        },
      };
    }

    try {
      console.log("Verifying token: ", token);
      const data = jwt.verify(token, supabase_secret_jwt) as DecodedToken;
      return { data };
    } catch (error) {
      return { error };
    }
  }
}
