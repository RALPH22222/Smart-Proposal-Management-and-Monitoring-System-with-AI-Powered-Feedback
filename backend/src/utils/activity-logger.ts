import { SupabaseClient } from "@supabase/supabase-js";

export interface LogEntry {
  user_id: string;
  action: string;
  category: "proposal" | "evaluation" | "project" | "account";
  target_id?: string;
  target_type?: "proposal" | "funded_project" | "user" | "report";
  details?: Record<string, any>;
}

/**
 * Fire-and-forget log insertion into pms_logs.
 * Failures are silently caught so logging never breaks the main action.
 */
export async function logActivity(
  db: SupabaseClient,
  entry: LogEntry
): Promise<void> {
  try {
    await db.from("pms_logs").insert({
      user_id: entry.user_id,
      action: entry.action,
      category: entry.category,
      target_id: entry.target_id ?? null,
      target_type: entry.target_type ?? null,
      details: entry.details ?? {},
    });
  } catch (err) {
    console.error("[pms_logs] Failed to insert log:", err);
  }
}
