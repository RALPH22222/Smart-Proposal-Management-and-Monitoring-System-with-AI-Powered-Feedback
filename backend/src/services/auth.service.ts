import { SupabaseClient } from "@supabase/supabase-js";
import { ProfileSetup, SignUpInput, SignUpWithProfileInput } from "../schemas/auth-schema";
import jwt from "jsonwebtoken";
import { DecodedToken } from "../types/auth";
import { randomUUID } from "crypto";

type ProfileSetupDbPayload = Omit<ProfileSetup, "photo_profile_url"> & {
  photo_profile_url: string | null; // Photo is optional
};

// External-collaborator detection. WMSU employees and students register with @wmsu.edu.ph;
// anyone else (industry partners, collaborators from other schools, etc.) gets the
// 'external' flag and is gated to the monitoring-only UI. The authorizer auto-upgrades on
// the next login if the user has since switched their email to a WMSU one.
export function deriveAccountType(email: string | null | undefined): "internal" | "external" {
  if (!email) return "external";
  return email.trim().toLowerCase().endsWith("@wmsu.edu.ph") ? "internal" : "external";
}

export class AuthService {
  constructor(private db?: SupabaseClient) { }

  async login(email: string, password: string) {
    const { data, error } = await this.db!.auth.signInWithPassword({ email, password });
    if (error || !data.user) return { data, error };

    const userId = data.user.id;

    const { data: row, error: rolesError } = await this.db!.from("users")
      .select("roles, email_verified, is_disabled, password_change_required, account_type")
      .eq("id", userId)
      .maybeSingle();

    if (rolesError) return { data: null, error: rolesError };

    if (row?.is_disabled) {
      return {
        data: null,
        error: {
          message: "Your account has been disabled. Contact admin.",
          status: 403,
        },
      };
    }

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
    const password_change_required = row?.password_change_required === true;

    // Self-heal account_type on login too (same rule as verifyToken): if the user's
    // current email is a WMSU address but the DB still says external, upgrade them
    // on the spot so the login response reflects their real permissions.
    let account_type = (row?.account_type as "internal" | "external" | null) ?? "internal";
    const currentEmail = (data.user.email ?? "").trim().toLowerCase();
    if (account_type === "external" && currentEmail.endsWith("@wmsu.edu.ph")) {
      const { error: upgradeError } = await this.db!
        .from("users")
        .update({ account_type: "internal", email: currentEmail })
        .eq("id", userId);
      if (!upgradeError) {
        account_type = "internal";
      }
    }

    return { data: { ...data, roles, password_change_required, account_type }, error: null };
  }

  async signup({ email, password, roles, first_name, last_name, middle_ini, platform }: SignUpInput) {
    const { data, error } = await this.db!.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          roles,
          first_name,
          last_name,
          middle_ini,
          platform: platform || 'web'
        },
      },
    });

    if (error || !data.user) {
      return { data, error };
    }

    // Tag the new user's account_type based on email domain. Default column value is
    // 'internal' so we only need to UPDATE when it's external — skipping the write for
    // internal users avoids a second DB round trip.
    const accountType = deriveAccountType(email);
    if (accountType === "external") {
      const { error: typeError } = await this.db!
        .from("users")
        .update({ account_type: "external" })
        .eq("id", data.user.id);
      if (typeError) {
        console.error("Failed to set account_type on signup (non-critical):", typeError);
      }
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
    const { email, password, roles, first_name, last_name, middle_ini, birth_date, sex, department_id, platform } = input;

    // 1. Create auth account (trigger auto-creates users row)
    const { data, error } = await this.db!.auth.signUp({
      email,
      password,
      options: {
        data: { roles, first_name, last_name, middle_ini, platform: platform || 'web' },
      },
    });

    if (error || !data.user) {
      return { data, error };
    }

    // 2. Check duplicate email (Supabase returns a fake user with empty role)
    if (data.user.role !== "authenticated" && data.user.role === "") {
      return { data: null, error: { message: "Email already exists.", status: 409 } };
    }

    // 3. Update the users row with profile data + account_type + mark profile as completed
    const { error: profileError } = await this.db!
      .from("users")
      .update({
        birth_date,
        sex,
        department_id,
        photo_profile_url: photoUrl,
        profile_completed: true,
        account_type: deriveAccountType(email),
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
    const { data, error } = await this.db!.from("users")
      .select("profile_completed, password_change_required")
      .eq("id", userId)
      .maybeSingle();

    if (error) return { data: null, error };

    return {
      data: {
        isCompleted: data?.profile_completed === true,
        passwordChangeRequired: data?.password_change_required === true,
      },
      error: null,
    };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    // 1. Fetch the user's email so we can re-authenticate
    const { data: { user }, error: getUserError } = await this.db!.auth.admin.getUserById(userId);
    if (getUserError || !user?.email) {
      return { data: null, error: getUserError ?? { message: "User not found" } };
    }

    // 2. Verify current password by attempting a sign-in
    const { error: signInError } = await this.db!.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });
    if (signInError) {
      return {
        data: null,
        error: { message: "Current password is incorrect.", status: 401 },
      };
    }

    // 3. Update the password via admin API
    const { error: authError } = await this.db!.auth.admin.updateUserById(userId, {
      password: newPassword,
    });

    if (authError) return { data: null, error: authError };

    const { error: updateError } = await this.db!
      .from("users")
      .update({ password_change_required: false })
      .eq("id", userId);

    if (updateError) return { data: null, error: updateError };

    return { data: { success: true }, error: null };
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
        .select("roles,email,first_name,last_name,photo_profile_url,department_id,account_type,departments(id,name)")
        .eq("id", userId)
        .maybeSingle();

      if (rolesError) return { data: null, error: rolesError };

      const roles = Array.isArray(row?.roles) ? row.roles : [];
      const dept = row?.departments as unknown as { id: number; name: string } | null;

      // Self-healing upgrade: if the user's current email is a WMSU address but their
      // account_type is still 'external' (e.g. they just swapped emails via Supabase's
      // email change flow), promote them on the spot so the new session gets full access.
      // We never downgrade — internal accounts with non-WMSU emails (legacy admins) stay
      // internal. We also mirror the fresh email onto public.users.email so any code path
      // that reads that column (display, notifications, etc.) sees the current address
      // instead of the pre-change one.
      const currentEmail = (decoded.email ?? row?.email ?? "") as string;
      const normalizedEmail = currentEmail.trim().toLowerCase();
      let accountType = (row?.account_type as "internal" | "external" | null) ?? "internal";
      if (accountType === "external" && normalizedEmail.endsWith("@wmsu.edu.ph")) {
        const { error: upgradeError } = await this.db!
          .from("users")
          .update({ account_type: "internal", email: normalizedEmail })
          .eq("id", userId);
        if (!upgradeError) {
          accountType = "internal";
        } else {
          console.error("Failed to auto-upgrade account_type (non-critical):", upgradeError);
        }
      }

      return {
        data: {
          session: { exp: decoded.exp, iat: decoded.iat },
          user: {
            id: userId,
            email: currentEmail,
            first_name: (row?.first_name as string) ?? null,
            last_name: (row?.last_name as string) ?? null,
            roles,
            account_type: accountType,
            profile_photo_url: (row?.photo_profile_url as string) ?? null,
            department_id: dept?.id ?? null,
            department_name: dept?.name ?? null,
          },
        },
        error: null,
      };
    } catch (error) {
      return { data: null, error };
    }
  }
}
