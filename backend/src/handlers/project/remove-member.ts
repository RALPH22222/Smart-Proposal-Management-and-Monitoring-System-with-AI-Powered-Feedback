import { APIGatewayProxyEvent } from "aws-lambda";
import { ProjectService } from "../../services/project.service";
import { supabase } from "../../lib/supabase";
import { buildCorsHeaders } from "../../utils/cors";
import { removeMemberSchema } from "../../schemas/project-schema";
import { getAuthContext } from "../../utils/auth-context";

export const handler = buildCorsHeaders(async (event: APIGatewayProxyEvent) => {
  const { userId } = getAuthContext(event);
  const payload = JSON.parse(event.body || "{}");

  // Inject authenticated user as removed_by
  payload.removed_by = userId;

  // Payload Validation
  const result = removeMemberSchema.safeParse(payload);

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
  const { data, error } = await projectService.removeMember(result.data);

  if (error) {
    console.error("Remove member error: ", JSON.stringify(error, null, 2));
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: (error as any).message || "Failed to remove member.",
      }),
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "Member removed successfully.",
      data,
    }),
  };
});
