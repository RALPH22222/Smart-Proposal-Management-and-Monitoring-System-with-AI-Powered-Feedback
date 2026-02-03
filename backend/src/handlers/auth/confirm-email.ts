import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { AuthService } from "../../services/auth.service";
import { supabase } from "../../lib/supabase";

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const token = event.queryStringParameters?.token;
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

  if (!token) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "text/html" },
      body: errorPage("Invalid Verification Link", "This verification link is invalid or incomplete. Please check your email and click the correct link."),
    };
  }

  const authService = new AuthService(supabase);
  const { data, error } = await authService.confirmEmail(token);

  if (error) {
    console.error("Email confirmation error:", error);
    return {
      statusCode: 400,
      headers: { "Content-Type": "text/html" },
      body: errorPage("Verification Failed", error.message || "An error occurred during email verification."),
    };
  }

  if (data?.alreadyVerified) {
    return {
      statusCode: 302,
      headers: { Location: `${frontendUrl}/login?verified=already` },
      body: "",
    };
  }

  console.log("Email verified successfully.");
  return {
    statusCode: 302,
    headers: { Location: `${frontendUrl}/login?verified=success` },
    body: "",
  };
};

function errorPage(title: string, message: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <title>${title}</title>
  <style>
    body { font-family: Arial, sans-serif; display: flex; justify-content: center;
           align-items: center; height: 100vh; margin: 0; background-color: #f5f5f5; }
    .container { text-align: center; background: white; padding: 40px;
                border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); max-width: 500px; }
    h1 { color: #C8102E; }
    p { color: #555; }
  </style>
</head>
<body>
  <div class="container">
    <h1>${title}</h1>
    <p>${message}</p>
  </div>
</body>
</html>`;
}
