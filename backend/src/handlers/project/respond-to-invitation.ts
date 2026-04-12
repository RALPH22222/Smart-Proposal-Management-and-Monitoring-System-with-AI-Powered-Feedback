import { APIGatewayProxyEvent } from "aws-lambda";
import { ProjectService } from "../../services/project.service";
import { supabase } from "../../lib/supabase";
import { buildCorsHeaders } from "../../utils/cors";
import { respondToInvitationSchema } from "../../schemas/project-schema";
import { getAuthContext } from "../../utils/auth-context";

export const handler = buildCorsHeaders(async (event: APIGatewayProxyEvent) => {
  const { userId } = getAuthContext(event);
  const payload = JSON.parse(event.body || "{}");

  const result = respondToInvitationSchema.safeParse(payload);

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
  const { data, error } = await projectService.respondToInvitation({
    member_id: result.data.member_id,
    action: result.data.action,
    user_id: userId,
  });

  if (error) {
    console.error("Respond to invitation error: ", JSON.stringify(error, null, 2));
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: (error as any).message || "Failed to respond to invitation.",
      }),
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      message:
        result.data.action === "accept"
          ? "Invitation accepted."
          : "Invitation declined.",
      data,
    }),
  };
});
