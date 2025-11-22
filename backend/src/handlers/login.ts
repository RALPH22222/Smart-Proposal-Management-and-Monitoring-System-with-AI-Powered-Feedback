import { APIGatewayProxyHandler, APIGatewayProxyEvent } from "aws-lambda";
import { AuthService } from "../services/auth.service";
import { supabase } from "../lib/supabase";

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent) => {
  console.log(JSON.stringify(event, null, 2))
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
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS'
    }
  };
};
