import { APIGatewayProxyEvent } from "aws-lambda";
import { ProjectService } from "../../services/project.service";
import { supabase } from "../../lib/supabase";
import { buildCorsHeaders } from "../../utils/cors";
import { getAuthContext } from "../../utils/auth-context";
import { logActivity } from "../../utils/activity-logger";
import { addExpenseSchema } from "../../schemas/project-schema";

export const handler = buildCorsHeaders(async (event: APIGatewayProxyEvent) => {
  const payload = JSON.parse(event.body || "{}");

  // Payload Validation
  const result = addExpenseSchema.safeParse(payload);

  if (result.error) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        type: "validation_error",
        data: result.error.issues,
      }),
    };
  }

  const projectService = new ProjectService(supabase);
  const { data, error } = await projectService.addExpense(result.data);

  if (error) {
    console.error("Supabase error: ", JSON.stringify(error, null, 2));
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: error.message || "Internal server error.",
      }),
    };
  }

  const { userId } = getAuthContext(event);
  await logActivity(supabase, {
    user_id: userId,
    action: "project_expense_added",
    category: "project",
    target_id: String(result.data.project_reports_id),
    target_type: "report",
    details: { amount: result.data.expenses },
  });

  return {
    statusCode: 201,
    body: JSON.stringify({
      message: "Expense added successfully.",
      data,
    }),
  };
});
