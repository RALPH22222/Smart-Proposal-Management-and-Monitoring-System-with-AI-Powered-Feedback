import { APIGatewayProxyEvent } from "aws-lambda";
import { supabase } from "../../lib/supabase";
import { buildCorsHeaders } from "../../utils/cors";
import { getAuthContext } from "../../utils/auth-context";

export const handler = buildCorsHeaders(async (event: APIGatewayProxyEvent) => {
  const auth = getAuthContext(event);
  if (!auth.userId) {
    return {
      statusCode: 401,
      body: JSON.stringify({ message: "Unauthorized" }),
    };
  }

  try {
    const queryParams = event.queryStringParameters || {};
    const limit = queryParams.limit ? parseInt(queryParams.limit) : 50;
    const offset = queryParams.offset ? parseInt(queryParams.offset) : 0;

    let query = supabase
      .from("notifications")
      .select("*", { count: "exact" })
      .eq("user_id", auth.userId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (queryParams.is_read !== undefined) {
      query = query.eq("is_read", queryParams.is_read === "true");
    }

    const { data, error, count } = await query;

    if (error) {
      return {
        statusCode: 500,
        body: JSON.stringify({ message: error.message }),
      };
    }

    const unreadCount = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", auth.userId)
      .eq("is_read", false);

    return {
      statusCode: 200,
      body: JSON.stringify({
        data,
        unread_count: unreadCount.count || 0,
        total: count || 0,
      }),
    };
  } catch (err: any) {
    console.error("Error fetching notifications:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: err.message || "Internal server error" }),
    };
  }
});
