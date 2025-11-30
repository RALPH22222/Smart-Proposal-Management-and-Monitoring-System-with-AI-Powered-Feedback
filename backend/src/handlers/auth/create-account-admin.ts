import { APIGatewayProxyEvent } from "aws-lambda";
import { AuthService } from "../../services/auth.service";
import { supabase } from "../../lib/supabase";
import { buildCorsHeaders } from "../../utils/cors";
import { signUpSchema } from "../../schemas/sign-up-schema";

export const handler = buildCorsHeaders(async (event: APIGatewayProxyEvent) => {
  const payload = JSON.parse(event.body || "{}");

  // Payload Validation
  const result = signUpSchema.safeParse(payload);

  if (result.error) {
    return {
      statusCode: 409,
      body: JSON.stringify({
        type: "validation_error",
        data: result.error.issues,
      }),
    };
  }

  const authService = new AuthService(supabase);
  const { data, error } = await authService.signup(result.data);

  if (error) {
    console.error("Error during sign up: ", JSON.stringify(error, null, 2));
    return {
      statusCode: error.status || 400,
      body: JSON.stringify({
        message: error.message || error.code,
      }),
    };
  }

  console.log("Data response: ", JSON.stringify(data, null, 2));

  if (data.user && data.user.role !== "authenticated" && data.user.role === "") {
    console.error("Email already exists. ");
    return {
      statusCode: 409,
      body: JSON.stringify({
        message: "Email already exists.",
      }),
    };
  }

  console.log("Successfully Signed up.");
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "Email created successfully.",
    }),
  };
});
