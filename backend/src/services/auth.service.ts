import { SupabaseClient } from "@supabase/supabase-js";
import { ProfileSetup, SignUpInput } from "../schemas/auth-schema";
import jwt from "jsonwebtoken";
import { DecodedToken } from "../types/auth";

type ProfileSetupDbPayload = Omit<ProfileSetup, "photo_profile_url"> & {
  photo_profile_url: string | null; // Photo is optional
};

export class AuthService {
  constructor(private db?: SupabaseClient) { }

  async login(email: string, password: string) {
    const { data, error } = await this.db!.auth.signInWithPassword({ email, password });
    if (error || !data.user) return { data, error };

    const userId = data.user.id;

    const { data: row, error: rolesError } = await this.db!.from("users")
      .select("roles")
      .eq("id", userId)
      .maybeSingle();

    // console.log("auth userId:", userId);
    // console.log("rolesRow:", row);
    // console.log("rolesError:", rolesError);

    if (rolesError) return { data: null, error: rolesError };

    const roles = row?.roles ?? []; // ✅ array

    return { data: { ...data, roles }, error: null };
  }

  async signup({ email, password, roles, first_name, last_name, middle_ini }: SignUpInput) {
    const { data, error } = await this.db!.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          roles,
          first_name,
          last_name,
          middle_ini,
        },
      },
    });
    return { data, error };
  }

  async profileSetup(userId: string, input: ProfileSetupDbPayload) {
    const { data, error } = await this.db!.from("users")
      .update({
        birth_date: input.birth_date,
        sex: input.sex,
        department_id: input.department_id,
        photo_profile_url: input.photo_profile_url,
        profile_completed: true,
      })
      .eq("id", userId)
      .select()
      .maybeSingle();

    return { data, error };
  }

  async verifyToken(token: string) {
    if (!token) return { data: null, error: { message: "Missing token" } };

    const supabase_secret_jwt = process.env.SUPABASE_SECRET_JWT;
    if (!supabase_secret_jwt) {
      return { data: null, error: { message: "Missing SUPABASE_SECRET_JWT" } };
    }

    try {
      const decoded = jwt.verify(token, supabase_secret_jwt) as DecodedToken;
      if (!decoded?.sub) return { data: null, error: { message: "Invalid token" } };

      const userId = decoded.sub;

      const { data: row, error: rolesError } = await this.db!.from("users")
        .select("roles,email,first_name,last_name")
        .eq("id", userId)
        .maybeSingle();

      if (rolesError) return { data: null, error: rolesError };

      const roles = Array.isArray(row?.roles) ? row.roles : [];

      return {
        data: {
          session: { exp: decoded.exp, iat: decoded.iat },
          user: {
            id: userId,
            email: decoded.email ?? (row?.email as string),
            first_name: (row?.first_name as string) ?? null,
            last_name: (row?.last_name as string) ?? null,
            roles,
          },
        },
        error: null,
      };
    } catch (error) {
      return { data: null, error };
    }
  }
}
