// Per-user (or per-IP) rate limiting backed by DynamoDB.
//
// Design: fixed-window counter keyed by (rate_key, window_start). Each request
// computes its window bucket (unix-seconds rounded down to `windowSeconds`),
// atomically increments the counter via UpdateItem, and reads back the new
// value. If the new value exceeds the limit, we return { allowed: false,
// retryAfter }. TTL on `expires_at` auto-deletes old windows.
//
// Trade-off: fixed window can technically allow up to 2x the limit at window
// boundaries (N requests at 59s + N at 61s). Acceptable for abuse/DoS
// protection — we're not trying to meter billing here.
//
// CRITICAL: this utility must FAIL OPEN. DynamoDB outage, missing table, IAM
// misconfig → we log a warning and allow the request. A rate-limit outage
// must never take down the app.

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";

const client = DynamoDBDocumentClient.from(
  new DynamoDBClient({ region: process.env.AWS_REGION ?? "us-east-1" }),
);

const TABLE = process.env.RATE_LIMITS_TABLE;

export interface RateLimitArgs {
  /**
   * Namespace for the bucket. Use a stable per-actor prefix so different
   * endpoints don't collide. Examples:
   *   - `user:${userId}:create-proposal`
   *   - `ip:${ip}:login`
   */
  key: string;
  /** Max allowed requests within the window. */
  limit: number;
  /** Window size in seconds. */
  windowSeconds: number;
}

export type RateLimitResult =
  | { allowed: true }
  | { allowed: false; retryAfter: number; current: number; limit: number };

/**
 * Consume one token for `key` in the current window. Returns `{ allowed: true }`
 * if under the limit, else `{ allowed: false, retryAfter }` where retryAfter is
 * the number of seconds until the current window resets.
 *
 * Fails open: if the table isn't reachable or the env var is missing, we log
 * and return `{ allowed: true }`. Never throws.
 */
export async function enforceRateLimit(args: RateLimitArgs): Promise<RateLimitResult> {
  if (!TABLE) {
    // Misconfigured environment — don't break the app. This should only happen
    // in local dev or if someone forgot to pass rateLimitsTableName through CDK.
    console.warn("[rate-limit] RATE_LIMITS_TABLE env var missing; allowing request");
    return { allowed: true };
  }

  const now = Math.floor(Date.now() / 1000);
  const windowStart = Math.floor(now / args.windowSeconds) * args.windowSeconds;
  const windowEnd = windowStart + args.windowSeconds;
  // Keep row alive for 2 windows (covers the window in use + a grace period
  // for any late-arriving reads). TTL is best-effort in DynamoDB — rows can
  // linger up to 48h past their TTL — but we key by window_start so stale
  // rows can't affect future windows anyway.
  const expiresAt = windowStart + args.windowSeconds * 2;

  try {
    const result = await client.send(
      new UpdateCommand({
        TableName: TABLE,
        Key: { rate_key: args.key, window_start: windowStart },
        UpdateExpression: "ADD #c :one SET #e = :exp",
        ExpressionAttributeNames: {
          "#c": "count",
          "#e": "expires_at",
        },
        ExpressionAttributeValues: {
          ":one": 1,
          ":exp": expiresAt,
        },
        ReturnValues: "UPDATED_NEW",
      }),
    );

    const current = Number(result.Attributes?.count ?? 0);
    if (current > args.limit) {
      return {
        allowed: false,
        retryAfter: Math.max(1, windowEnd - now),
        current,
        limit: args.limit,
      };
    }
    return { allowed: true };
  } catch (err) {
    // Fail open. Log with enough context that we can spot a chronic failure
    // in CloudWatch without having to reproduce.
    console.warn(
      "[rate-limit] UpdateItem failed, allowing request:",
      (err as Error).message,
      { key: args.key, limit: args.limit, window: args.windowSeconds },
    );
    return { allowed: true };
  }
}

/**
 * Canonical per-endpoint rate-limit configuration. Centralized so we can tune
 * numbers in one place as we learn what real usage looks like. These are
 * conservative starting values; raise after observing CloudWatch.
 */
export const RATE_LIMITS = {
  // Proposal mutations — a user rarely creates more than 1-2 proposals per day
  createProposal: { limit: 5, windowSeconds: 15 * 60 },
  submitRevision: { limit: 5, windowSeconds: 15 * 60 },
  uploadUrl: { limit: 20, windowSeconds: 5 * 60 },
  analyzeProposal: { limit: 10, windowSeconds: 5 * 60 },
  parseLib: { limit: 10, windowSeconds: 5 * 60 },

  // Project mutations
  submitQuarterlyReport: { limit: 5, windowSeconds: 15 * 60 },
  submitTerminalReport: { limit: 3, windowSeconds: 30 * 60 },
  createFundRequest: { limit: 5, windowSeconds: 15 * 60 },
  requestRealignment: { limit: 3, windowSeconds: 30 * 60 },

  // Auth endpoints (key by IP, not user)
  login: { limit: 5, windowSeconds: 60 },
  signup: { limit: 3, windowSeconds: 5 * 60 },
  verifyOtp: { limit: 5, windowSeconds: 5 * 60 },
  forgotPassword: { limit: 3, windowSeconds: 10 * 60 },
} as const;

/**
 * Builds the standard 429 Lambda response. Call sites can spread the result's
 * `.response` into their own response object.
 */
export function tooManyRequestsResponse(result: Extract<RateLimitResult, { allowed: false }>) {
  return {
    statusCode: 429,
    headers: {
      "Retry-After": String(result.retryAfter),
    },
    body: JSON.stringify({
      message: `Too many requests. Please try again in ${result.retryAfter} second${result.retryAfter === 1 ? "" : "s"}.`,
    }),
  };
}
