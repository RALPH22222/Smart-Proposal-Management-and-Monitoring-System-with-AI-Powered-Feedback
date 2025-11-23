import { APIGatewayProxyEvent } from "aws-lambda";
import { AuthService } from "../services/auth.service";
import { supabase } from "../lib/supabase";
import { buildCorsHeaders } from "../utils/cors";

export const handler = buildCorsHeaders(async (event: APIGatewayProxyEvent) => {
  const authService = new AuthService(supabase);
  const { email, password, name, role } = JSON.parse(event.body || "{}");
  const { data, error } = await authService.signup(email, password, name, role);

  if (error) {
    console.error('Error during sign up: ', JSON.stringify(error, null, 2));
    return {
      statusCode: error.status || 400,
      body: JSON.stringify({
        message: error.message || error.code,
      }),
    };
  }

  console.log('Data response: ', JSON.stringify(data, null, 2))
  console.log('Successfully Signed up.')
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "Email invitation sent successfully.",
    }),
  };
});
