import { APIGatewayProxyHandler, APIGatewayProxyEvent } from "aws-lambda";
import { AuthService } from "../services/auth.service";
import { supabase } from "../lib/supabase";

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent) => {
  const authService = new AuthService(supabase);
  const { email, password } = JSON.parse(event.body || "{}");
  const { data, error } = await authService.login(email, password);

  if (error) {
    return {
      statusCode: error.status || 400,
      body: error.message,
    };
  }
  return {
    statusCode: 200,
    body: "Successfully logged in.",
  };
};
