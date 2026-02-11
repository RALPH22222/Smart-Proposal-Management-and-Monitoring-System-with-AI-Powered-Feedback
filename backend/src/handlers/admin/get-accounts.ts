import { APIGatewayProxyEvent } from "aws-lambda";
import { supabase } from "../../lib/supabase";
import { AdminService } from "../../services/admin.service";
import { buildCorsHeaders } from "../../utils/cors";

export const handler = buildCorsHeaders(async (event: APIGatewayProxyEvent) => {
  try {
    const role = event.queryStringParameters?.role || undefined;
    const isDisabledParam = event.queryStringParameters?.is_disabled;
    const is_disabled = isDisabledParam === "true" ? true : isDisabledParam === "false" ? false : undefined;

    const service = new AdminService(supabase);
    const { data, error } = await service.getAccounts({ role, is_disabled });

    if (error) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: (error as any).message || "Failed to fetch accounts" }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify(data),
    };
  } catch (err: any) {
    console.error("Error fetching accounts:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: err.message || "Internal server error" }),
    };
  }
});
