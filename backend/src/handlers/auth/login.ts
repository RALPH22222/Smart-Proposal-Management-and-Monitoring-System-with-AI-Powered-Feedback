import { APIGatewayProxyEvent } from "aws-lambda";
import { AuthService } from "../../services/auth.service";
import { supabase } from "../../lib/supabase";
import { setCookieString } from "../../utils/cookies";
import { buildCorsHeaders } from "../../utils/cors";

export const handler = buildCorsHeaders(async (event: APIGatewayProxyEvent) => {
  const authService = new AuthService(supabase);
  const { email, password } = JSON.parse(event.body || "{}");
  const { data, error } = await authService.login(email, password);

  if (error) {
    console.error("Error during login: ", JSON.stringify(error, null, 2));

    // Map Supabase errors to user-friendly messages
    let userMessage = "Login failed. Please try again.";
    const errorCode = (error as { code?: string }).code;
    const errorMessage = (error.message || "").toLowerCase();

    // Debug logging
    console.log("Error code:", errorCode);
    console.log("Error message (lowercase):", errorMessage);

    // Invalid credentials - check for exact Supabase message
    if (
      errorCode === "invalid_credentials" ||
      errorMessage.includes("invalid") && errorMessage.includes("login") ||
      errorMessage.includes("invalid") && errorMessage.includes("credentials") ||
      errorMessage.includes("invalid") && errorMessage.includes("password")
    ) {
      userMessage = "Invalid email or password. Please check your credentials and try again.";
    }
    // Email not confirmed
    else if (errorMessage.includes("email not confirmed") || errorMessage.includes("not confirmed")) {
      userMessage = "Please verify your email address before logging in. Check your inbox for the verification link.";
    }
    // User not found
    else if (errorMessage.includes("not found") || errorMessage.includes("no user")) {
      userMessage = "No account found with this email address. Please check your email or create a new account.";
    }
    // Too many requests
    else if (errorCode === "too_many_requests" || errorMessage.includes("too many")) {
      userMessage = "Too many login attempts. Please wait a few minutes and try again.";
    }
    // Network or server error
    else if ((error as { status?: number }).status && (error as { status?: number }).status! >= 500) {
      userMessage = "Server error. Please try again later.";
    }

    return {
      statusCode: (error as { status?: number }).status || 400,
      body: JSON.stringify({
        message: userMessage,
      }),
    };
  }

  console.log("Data response: ", JSON.stringify(data, null, 2));
  console.log("Successfully logged in.");

  const user_roles = (data as any)?.roles ?? [];

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "Successfully logged in.",
      user: {
        id: data.user?.id,
        email: data.user?.email,
        roles: user_roles,
      },
    }),
    headers: {
      "Set-Cookie": setCookieString("tk", data.session!.access_token),
    },
  };
});
