import { APIGatewayAuthorizerResult, APIGatewayRequestAuthorizerEvent } from "aws-lambda";
import { parseCookie } from "../../utils/cookies";
import { supabase } from "../../lib/supabase";
import { deriveAccountType } from "../../services/auth.service";

// ── In-memory user cache ────────────────────────────────────────────────────
// Persists across warm Lambda invocations. Keyed by the raw token (not userId)
// because verification is delegated to Supabase, so we need a way to skip the
// network round-trip on repeat requests with the same token. A new login or
// token refresh produces a new token → new cache key → fresh verification.
const USER_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

interface CachedUser {
  userId: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  roles: string[];
  account_type: "internal" | "external";
  cachedAt: number;
}

const userCache = new Map<string, CachedUser>();

const generatePolicy = (
  principalId: string,
  effect: "Allow" | "Deny",
  resource: string,
  context?: Record<string, any>,
): APIGatewayAuthorizerResult => {
  return {
    principalId,
    policyDocument: {
      Version: "2012-10-17",
      Statement: [
        {
          Action: "execute-api:Invoke",
          Effect: effect,
          Resource: resource,
        },
      ],
    },
    context,
  };
};

export const handler = async (event: APIGatewayRequestAuthorizerEvent): Promise<APIGatewayAuthorizerResult> => {
  const cookies_str = event.headers?.Cookie || event.headers?.cookie || "";
  const cookies = parseCookie(cookies_str);

  const authHeader = event.headers?.Authorization || event.headers?.authorization || "";
  const bearer = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

  // Bearer takes priority over the cookie. The Bearer header is an explicit
  // auth signal from the caller (e.g. /accept-invite sends the invited user's
  // Supabase access token), whereas the `tk` cookie is ambient and may belong
  // to a different account if the browser already has a session. Preferring
  // the cookie caused complete-invite to write the invited user's profile
  // data onto whichever account's cookie happened to be in the browser.
  const token = bearer || cookies.tk;

  if (!token) {
    throw "Unauthorized";
  }

  // ── Step 1: Check token cache ─────────────────────────────────────────
  const now = Date.now();
  const cached = userCache.get(token);

  let user: CachedUser;

  if (cached && now - cached.cachedAt < USER_CACHE_TTL_MS) {
    user = cached;
  } else {
    // ── Step 2: Verify via Supabase ──────────────────────────────────────
    // We delegate verification to Supabase instead of using a local secret so
    // the authorizer keeps working when Supabase rotates JWT signing keys
    // (the `kid` header in modern Supabase tokens points at a rotating key,
    // not the legacy single secret). Adds ~100ms on cache miss; cache absorbs
    // the cost on warm hits.
    const { data: authData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !authData?.user?.id) {
      console.error("Supabase token verification failed:", authError);
      throw "Unauthorized";
    }

    const userId = authData.user.id;
    const jwtEmail = (authData.user.email ?? "").trim().toLowerCase();

    // ── Step 3: Fetch user profile (roles, account_type) ────────────────
    const { data: row, error: dbError } = await supabase
      .from("users")
      .select("roles, email, first_name, last_name, account_type")
      .eq("id", userId)
      .maybeSingle();

    if (dbError || !row) {
      console.error("Authorizer DB lookup failed:", dbError);
      throw "Unauthorized";
    }

    const roles = Array.isArray(row.roles) ? row.roles : [];
    const currentEmail = jwtEmail || (row.email as string) || "";
    let accountType = (row.account_type as "internal" | "external") ?? "internal";

    // Self-healing upgrade (only runs on cache miss — rare)
    if (accountType === "external" && deriveAccountType(currentEmail) === "internal") {
      await supabase
        .from("users")
        .update({ account_type: "internal", email: currentEmail })
        .eq("id", userId);
      accountType = "internal";
    }

    user = {
      userId,
      email: currentEmail,
      first_name: (row.first_name as string) ?? null,
      last_name: (row.last_name as string) ?? null,
      roles,
      account_type: accountType,
      cachedAt: now,
    };

    userCache.set(token, user);

    // Evict stale entries to prevent unbounded growth (simple sweep)
    if (userCache.size > 200) {
      for (const [key, val] of userCache) {
        if (now - val.cachedAt > USER_CACHE_TTL_MS) userCache.delete(key);
      }
    }
  }

  // ── Step 4: Build policy ──────────────────────────────────────────────
  const [arn, stage] = event.methodArn.split("/");
  const wildcardResource = `${arn}/${stage}/*/*`;

  return generatePolicy(user.userId, "Allow", wildcardResource, {
    user_sub: user.userId,
    email: user.email,
    first_name: user.first_name,
    last_name: user.last_name,
    roles: JSON.stringify(user.roles),
    account_type: user.account_type,
  });
};
