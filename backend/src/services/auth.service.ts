import { SupabaseClient } from "@supabase/supabase-js";
import { ProfileSetup, SignUpInput, SignUpWithProfileInput } from "../schemas/auth-schema";
import jwt from "jsonwebtoken";
import { DecodedToken } from "../types/auth";
import { randomUUID } from "crypto";

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
      .select("roles, email_verified")
      .eq("id", userId)
      .maybeSingle();

    if (rolesError) return { data: null, error: rolesError };

    // TODO: Re-enable when email verification provider is configured
    // if (!row?.email_verified) {
    //   return {
    //     data: null,
    //     error: {
    //       message: "Please verify your email address before logging in. Check your inbox for the verification link.",
    //       status: 403,
    //     },
    //   };
    // }

    const roles = row?.roles ?? [];

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

    if (error || !data.user) {
      return { data, error };
    }

    // TODO: Re-enable when email verification provider is configured
    // const verificationToken = randomUUID();
    // const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    // const { error: tokenError } = await this.db!
    //   .from("users")
    //   .update({
    //     email_verification_token: verificationToken,
    //     email_verification_token_expires_at: expiresAt,
    //     email_verified: false,
    //   })
    //   .eq("id", data.user.id);
    // if (tokenError) {
    //   console.error("Failed to store verification token:", tokenError);
    // }

    return { data, error: null };
  }

  async signupWithProfile(
    input: Omit<SignUpWithProfileInput, "photo_profile_url">,
    photoUrl: string | null,
  ) {
    const { email, password, roles, first_name, last_name, middle_ini, birth_date, sex, department_id } = input;

    // 1. Create auth account (trigger auto-creates users row)
    const { data, error } = await this.db!.auth.signUp({
      email,
      password,
      options: {
        data: { roles, first_name, last_name, middle_ini },
      },
    });

    if (error || !data.user) {
      return { data, error };
    }

    // 2. Check duplicate email (Supabase returns a fake user with empty role)
    if (data.user.role !== "authenticated" && data.user.role === "") {
      return { data: null, error: { message: "Email already exists.", status: 409 } };
    }

    // 3. Update the users row with profile data + mark profile as completed
    const { error: profileError } = await this.db!
      .from("users")
      .update({
        birth_date,
        sex,
        department_id,
        photo_profile_url: photoUrl,
        profile_completed: true,
      })
      .eq("id", data.user.id);

    if (profileError) {
      console.error("Failed to update profile during signup:", profileError);
      return { data, error: null, profileError };
    }

    return { data, error: null, profileError: null };
  }

  async confirmEmail(token: string) {
    const { data: user, error: fetchError } = await this.db!
      .from("users")
      .select("id, email_verified, email_verification_token_expires_at")
      .eq("email_verification_token", token)
      .maybeSingle();

    if (fetchError || !user) {
      return { data: null, error: { message: "Invalid or expired verification token" } };
    }

    if (user.email_verified) {
      return { data: { alreadyVerified: true }, error: null };
    }

    const now = new Date();
    const expiresAt = new Date(user.email_verification_token_expires_at);
    if (now > expiresAt) {
      return { data: null, error: { message: "Verification token has expired. Please register again." } };
    }

    const { error: updateError } = await this.db!
      .from("users")
      .update({
        email_verified: true,
        email_verification_token: null,
        email_verification_token_expires_at: null,
      })
      .eq("id", user.id);

    if (updateError) {
      return { data: null, error: updateError };
    }

    return { data: { verified: true }, error: null };
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

    if (error) return { data: null, error };

    return { data, error };
  }

  async profileStatus(userId: string) {
    const { data, error } = await this.db!.from("users").select("profile_completed").eq("id", userId).maybeSingle();

    if (error) return { data: null, error };

    return { data: data?.profile_completed === true, error: null };
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
