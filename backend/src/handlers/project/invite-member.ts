import { APIGatewayProxyEvent } from "aws-lambda";
import { ProjectService } from "../../services/project.service";
import { supabase, supabaseAdmin } from "../../lib/supabase";
import { buildCorsHeaders } from "../../utils/cors";
import { inviteMemberSchema } from "../../schemas/project-schema";
import { getAuthContext } from "../../utils/auth-context";
import { logActivity } from "../../utils/activity-logger";

export const handler = buildCorsHeaders(async (event: APIGatewayProxyEvent) => {
  const { userId } = getAuthContext(event);
  const payload = JSON.parse(event.body || "{}");

  // Inject authenticated user as invited_by
  payload.invited_by = userId;

  // Payload Validation
  const result = inviteMemberSchema.safeParse(payload);

  if (result.error) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        type: "validation_error",
        data: result.error.issues,
      }),
    };
  }

  const frontendUrl = process.env.FRONTEND_URL || "https://wmsu-spmams.vercel.app";
  const redirectTo = `${frontendUrl}/accept-invite`;

  const projectService = new ProjectService(supabase);
  const { data, error } = await projectService.inviteMember(result.data, supabaseAdmin, redirectTo);

  if (error) {
    console.error("Invite member error: ", JSON.stringify(error, null, 2));
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: (error as any).message || "Failed to invite member.",
      }),
    };
  }

  await logActivity(supabase, {
    user_id: userId,
    action: "project_member_invited",
    category: "project",
    target_id: String(result.data.funded_project_id),
    target_type: "funded_project",
    details: { invited_email: result.data.email },
  });

  return {
    statusCode: 201,
    body: JSON.stringify({
      message: "Member invited successfully.",
      data,
    }),
  };
});
