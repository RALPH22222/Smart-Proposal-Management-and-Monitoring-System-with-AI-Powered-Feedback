import { APIGatewayProxyEvent } from "aws-lambda";
import { AuthService } from "../../services/auth.service";
import { supabase } from "../../lib/supabase";
import { buildCorsHeaders } from "../../utils/cors";
import { signUpSchema } from "../../schemas/auth-schema";

export const handler = buildCorsHeaders(async (event: APIGatewayProxyEvent) => {
  const payload = JSON.parse(event.body || "{}");

  // Payload Validation
  const result = signUpSchema.safeParse(payload);

  if (result.error) {
    // Create user-friendly message from validation errors
    const errorMessages = result.error.issues.map(issue => issue.message).join(", ");

    return {
      statusCode: 409,
      body: JSON.stringify({
        type: "validation_error",
        message: errorMessages || "Please check your input and try again.",
        data: result.error.issues,
      }),
    };
  }

  const authService = new AuthService(supabase);
  const { data, error } = await authService.signup(result.data);

  if (error) {
    console.error("Error during sign up: ", JSON.stringify(error, null, 2));

    // Map Supabase errors to user-friendly messages
    let userMessage = "Registration failed. Please try again.";
    const errorCode = (error as { code?: string }).code;
    const errorMessage = error.message?.toLowerCase() || "";

    // User already exists
    if (errorCode === "user_already_exists" || errorMessage.includes("already") || errorMessage.includes("exists") || errorMessage.includes("registered")) {
      userMessage = "An account with this email address already exists. Please sign in instead or use a different email.";
    }
    // Invalid email format
    else if (errorMessage.includes("invalid") && errorMessage.includes("email")) {
      userMessage = "Please enter a valid email address.";
    }
    // Weak password
    else if (errorMessage.includes("password") && (errorMessage.includes("weak") || errorMessage.includes("short") || errorMessage.includes("6"))) {
      userMessage = "Password is too weak. Please use at least 6 characters.";
    }
    // Rate limit
    else if (errorCode === "over_email_send_rate_limit" || errorMessage.includes("rate limit")) {
      userMessage = "Too many registration attempts. Please wait a few minutes and try again.";
    }
    // Server error
    else if (error.status && error.status >= 500) {
      userMessage = "Server error. Please try again later.";
    }

    return {
      statusCode: error.status || 400,
      body: JSON.stringify({
        message: userMessage,
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
      message: "Email invitation sent successfully.",
    }),
  };
});
