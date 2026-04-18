import { APIGatewayProxyEvent } from "aws-lambda";
import { ProjectService } from "../../services/project.service";
import { supabase } from "../../lib/supabase";
import { buildCorsHeaders } from "../../utils/cors";
import { getFundedProjectsSchema } from "../../schemas/project-schema";
import { getAuthContext } from "../../utils/auth-context";

export const handler = buildCorsHeaders(async (event: APIGatewayProxyEvent) => {
  // Extract identity from JWT - never trust query params for user identity
  const auth = getAuthContext(event);
  if (!auth.userId) {
    return {
      statusCode: 401,
      body: JSON.stringify({ message: "Unauthorized" }),
    };
  }

  // Parse query parameters (only non-identity fields)
  const queryParams = event.queryStringParameters || {};

  // Determine which "view" the client is asking for. A user may hold multiple roles
  // (e.g. a proponent who is also R&D staff) and the *page* they're on decides which
  // slice of projects they should see — proponent monitoring shows only their own
  // projects, R&D monitoring shows assignments, admin monitoring shows everything.
  //
  // The previous implementation hard-prioritized admin > rnd > proponent from the JWT
  // claims alone. That meant a proponent who also had the rnd role opened
  // /proponent/monitoring and got filtered as R&D — the page leaked projects they were
  // assigned to as a reviewer but had never proposed or been invited to.
  //
  // Fix: honor the client-supplied ?role=... if-and-only-if the user actually holds
  // that role in their JWT. Never let a client escalate (e.g. ?role=admin from a
  // proponent). Fall back to JWT priority only when the query param is absent.
  const VALID_VIEW_ROLES = ["proponent", "rnd", "admin"] as const;
  const requestedRole = queryParams.role;
  let role: "proponent" | "rnd" | "admin" | undefined;
  if (
    requestedRole &&
    (VALID_VIEW_ROLES as readonly string[]).includes(requestedRole) &&
    auth.roles.includes(requestedRole)
  ) {
    role = requestedRole as "proponent" | "rnd" | "admin";
  } else {
    role = auth.roles.includes("admin")
      ? "admin"
      : auth.roles.includes("rnd")
      ? "rnd"
      : auth.roles.includes("proponent")
      ? "proponent"
      : undefined;
  }

  const input = {
    user_id: auth.userId,
    role,
    status: queryParams.status as any,
    limit: queryParams.limit ? parseInt(queryParams.limit) : undefined,
    offset: queryParams.offset ? parseInt(queryParams.offset) : undefined,
  };

  // Payload Validation
  const result = getFundedProjectsSchema.safeParse(input);

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
  const { data, error } = await projectService.getFundedProjects(result.data);

  if (error) {
    console.error("Supabase error: ", JSON.stringify(error, null, 2));
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
      message: "Funded projects retrieved successfully.",
      data,
    }),
  };
});
