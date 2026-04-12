import { APIGatewayProxyEvent } from "aws-lambda";
import { ProjectService } from "../../services/project.service";
import { supabase } from "../../lib/supabase";
import { buildCorsHeaders } from "../../utils/cors";
import { getAuthContext } from "../../utils/auth-context";

export const handler = buildCorsHeaders(async (event: APIGatewayProxyEvent) => {
  const { userId } = getAuthContext(event);

  const projectService = new ProjectService(supabase);
  const { data, error } = await projectService.getPendingInvitations(userId);

  if (error) {
    console.error("Get pending invitations error: ", JSON.stringify(error, null, 2));
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: error.message || "Internal server error.",
      }),
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "Pending invitations retrieved successfully.",
      data,
    }),
  };
});
