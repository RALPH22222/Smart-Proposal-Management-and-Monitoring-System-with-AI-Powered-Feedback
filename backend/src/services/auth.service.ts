import { SupabaseClient } from "@supabase/supabase-js";
import { SignUpInput } from "../schemas/sign-up-schema";
import jwt from "jsonwebtoken";

export class AuthService {
  constructor(private db?: SupabaseClient) {}

  async login(email: string, password: string) {
    const { data, error } = await this.db!.auth.signInWithPassword({
      email: email,
      password: password,
    });
    return { data, error };
  }

  async signup({ email, password, role, name }: SignUpInput) {
    const { data, error } = await this.db!.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          role,
          name,
        },
      },
    });
    return { data, error };
  }

  async verifytoken(token: string) {
    const supabase_secret_jwt = process.env.SUPABASE_SECRET_JWT;

    if (!supabase_secret_jwt) {
      return {
        error: {
          message: "Missing SUPABASE SECRET JWT",
        },
      };
    }

    try {
      const data = jwt.verify(token, supabase_secret_jwt);
      return { data };
    } catch (error) {
      return { error };
    }
  }
}
