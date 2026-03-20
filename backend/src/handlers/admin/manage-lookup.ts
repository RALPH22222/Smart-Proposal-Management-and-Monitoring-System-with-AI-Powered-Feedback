import { APIGatewayProxyEvent } from "aws-lambda";
import { supabase } from "../../lib/supabase";
import { buildCorsHeaders } from "../../utils/cors";
import { getAuthContext } from "../../utils/auth-context";
import { logActivity } from "../../utils/activity-logger";
import { z } from "zod";

const ALLOWED_TABLES = ["departments", "sectors", "disciplines", "agencies", "priorities", "tags"] as const;

// --- Lookup CRUD schemas ---
const createSchema = z.object({
  action: z.literal("create"),
  table: z.enum(ALLOWED_TABLES),
  name: z.string().min(1).max(255),
});

const updateSchema = z.object({
  action: z.literal("update"),
  table: z.enum(ALLOWED_TABLES),
  id: z.number().int().positive(),
  name: z.string().min(1).max(255),
});

const deleteSchema = z.object({
  action: z.literal("delete"),
  table: z.enum(ALLOWED_TABLES),
  id: z.number().int().positive(),
});

// --- Agency Address schemas ---
const getAddressesSchema = z.object({
  action: z.literal("get_addresses"),
  agency_id: z.number().int().positive(),
});

const createAddressSchema = z.object({
  action: z.literal("create_address"),
  agency_id: z.number().int().positive(),
  city: z.string().min(1).max(255),
  barangay: z.string().max(255).optional(),
  street: z.string().max(255).optional(),
});

const updateAddressSchema = z.object({
  action: z.literal("update_address"),
  id: z.string().uuid(),
  city: z.string().min(1).max(255),
  barangay: z.string().max(255).optional(),
  street: z.string().max(255).optional(),
});

const deleteAddressSchema = z.object({
  action: z.literal("delete_address"),
  id: z.string().uuid(),
});

const manageLookupSchema = z.discriminatedUnion("action", [
  createSchema,
  updateSchema,
  deleteSchema,
  getAddressesSchema,
  createAddressSchema,
  updateAddressSchema,
  deleteAddressSchema,
]);

export const handler = buildCorsHeaders(async (event: APIGatewayProxyEvent) => {
  try {
    const auth = getAuthContext(event);
    if (!auth.userId) {
      return { statusCode: 401, body: JSON.stringify({ message: "Unauthorized" }) };
    }

    const ALLOWED_ROLES = ["admin"];
    if (!auth.roles.some((r) => ALLOWED_ROLES.includes(r))) {
      return { statusCode: 403, body: JSON.stringify({ message: "Forbidden" }) };
    }

    const payload = JSON.parse(event.body || "{}");
    const result = manageLookupSchema.safeParse(payload);

    if (!result.success) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Validation error", errors: result.error.flatten().fieldErrors }),
      };
    }

    const input = result.data;

    switch (input.action) {
      // ==================== LOOKUP CRUD ====================
      case "create": {
        const { data: existing } = await supabase
          .from(input.table)
          .select("id")
          .ilike("name", input.name)
          .maybeSingle();

        if (existing) {
          return {
            statusCode: 409,
            body: JSON.stringify({ message: `"${input.name}" already exists in ${input.table}` }),
          };
        }

        const { data, error } = await supabase
          .from(input.table)
          .insert({ name: input.name })
          .select("id, name")
          .single();

        if (error) {
          return { statusCode: 400, body: JSON.stringify({ message: error.message }) };
        }

        await logActivity(supabase, {
          user_id: auth.userId,
          action: "lookup_created",
          category: "admin",
          target_id: String(data.id),
          target_type: "system_settings",
          details: { table: input.table, name: input.name },
        });

        return { statusCode: 201, body: JSON.stringify({ message: "Created", data }) };
      }

      case "update": {
        const { data: existing } = await supabase
          .from(input.table)
          .select("id")
          .ilike("name", input.name)
          .neq("id", input.id)
          .maybeSingle();

        if (existing) {
          return {
            statusCode: 409,
            body: JSON.stringify({ message: `"${input.name}" already exists in ${input.table}` }),
          };
        }

        const { data, error } = await supabase
          .from(input.table)
          .update({ name: input.name })
          .eq("id", input.id)
          .select("id, name")
          .single();

        if (error) {
          return { statusCode: 400, body: JSON.stringify({ message: error.message }) };
        }

        await logActivity(supabase, {
          user_id: auth.userId,
          action: "lookup_updated",
          category: "admin",
          target_id: String(input.id),
          target_type: "system_settings",
          details: { table: input.table, name: input.name },
        });

        return { statusCode: 200, body: JSON.stringify({ message: "Updated", data }) };
      }

      case "delete": {
        const refChecks: { table: string; column: string; label: string }[] = [];

        if (input.table === "departments") {
          refChecks.push(
            { table: "users", column: "department_id", label: "users" },
            { table: "proposals", column: "department_id", label: "proposals" },
          );
        } else if (input.table === "sectors") {
          refChecks.push({ table: "proposals", column: "sector_id", label: "proposals" });
        } else if (input.table === "disciplines") {
          refChecks.push({ table: "proposals", column: "discipline_id", label: "proposals" });
        } else if (input.table === "agencies") {
          refChecks.push(
            { table: "proposals", column: "agency_id", label: "proposals" },
            { table: "cooperating_agencies", column: "agency_id", label: "cooperating agencies" },
          );
        } else if (input.table === "priorities") {
          refChecks.push({ table: "proposal_priorities", column: "priority_id", label: "proposals" });
        } else if (input.table === "tags") {
          refChecks.push({ table: "proposal_tags", column: "tag_id", label: "proposals" });
        }

        for (const check of refChecks) {
          const { count } = await supabase
            .from(check.table)
            .select("*", { count: "exact", head: true })
            .eq(check.column, input.id);

          if (count && count > 0) {
            return {
              statusCode: 409,
              body: JSON.stringify({
                message: `Cannot delete — this entry is referenced by ${count} ${check.label}`,
              }),
            };
          }
        }

        const { error } = await supabase
          .from(input.table)
          .delete()
          .eq("id", input.id);

        if (error) {
          return { statusCode: 400, body: JSON.stringify({ message: error.message }) };
        }

        await logActivity(supabase, {
          user_id: auth.userId,
          action: "lookup_deleted",
          category: "admin",
          target_id: String(input.id),
          target_type: "system_settings",
          details: { table: input.table },
        });

        return { statusCode: 200, body: JSON.stringify({ message: "Deleted" }) };
      }

      // ==================== AGENCY ADDRESS CRUD ====================
      case "get_addresses": {
        const { data, error } = await supabase
          .from("agency_address")
          .select("id, city, barangay, street")
          .eq("agency_id", input.agency_id)
          .order("city");

        if (error) {
          return { statusCode: 400, body: JSON.stringify({ message: error.message }) };
        }

        return { statusCode: 200, body: JSON.stringify(data || []) };
      }

      case "create_address": {
        const { data, error } = await supabase
          .from("agency_address")
          .insert({
            agency_id: input.agency_id,
            city: input.city,
            barangay: input.barangay || null,
            street: input.street || null,
          })
          .select("id, city, barangay, street")
          .single();

        if (error) {
          return { statusCode: 400, body: JSON.stringify({ message: error.message }) };
        }

        await logActivity(supabase, {
          user_id: auth.userId,
          action: "agency_address_created",
          category: "admin",
          target_id: data.id,
          target_type: "system_settings",
          details: { agency_id: input.agency_id, city: input.city },
        });

        return { statusCode: 201, body: JSON.stringify({ message: "Address created", data }) };
      }

      case "update_address": {
        const { data, error } = await supabase
          .from("agency_address")
          .update({
            city: input.city,
            barangay: input.barangay || null,
            street: input.street || null,
          })
          .eq("id", input.id)
          .select("id, city, barangay, street")
          .single();

        if (error) {
          return { statusCode: 400, body: JSON.stringify({ message: error.message }) };
        }

        await logActivity(supabase, {
          user_id: auth.userId,
          action: "agency_address_updated",
          category: "admin",
          target_id: input.id,
          target_type: "system_settings",
        });

        return { statusCode: 200, body: JSON.stringify({ message: "Address updated", data }) };
      }

      case "delete_address": {
        // Check if address is referenced by proposals
        const { count } = await supabase
          .from("proposals")
          .select("*", { count: "exact", head: true })
          .eq("agency_address_id", input.id);

        if (count && count > 0) {
          return {
            statusCode: 409,
            body: JSON.stringify({ message: `Cannot delete — this address is used by ${count} proposals` }),
          };
        }

        const { error } = await supabase
          .from("agency_address")
          .delete()
          .eq("id", input.id);

        if (error) {
          return { statusCode: 400, body: JSON.stringify({ message: error.message }) };
        }

        await logActivity(supabase, {
          user_id: auth.userId,
          action: "agency_address_deleted",
          category: "admin",
          target_id: input.id,
          target_type: "system_settings",
        });

        return { statusCode: 200, body: JSON.stringify({ message: "Address deleted" }) };
      }
    }
  } catch (err: any) {
    console.error("Error managing lookup:", err);
    return { statusCode: 500, body: JSON.stringify({ message: err.message || "Internal server error" }) };
  }
});
