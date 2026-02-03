import { APIGatewayProxyEvent } from "aws-lambda";
import { AuthService } from "../../services/auth.service";
import { EmailService } from "../../services/email.service";
import { supabase } from "../../lib/supabase";
import { buildCorsHeaders } from "../../utils/cors";
import { signUpSchema } from "../../schemas/auth-schema";

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
      statusCode: (error as { status?: number }).status || 400,
      body: JSON.stringify({
        message: error.message || (error as { code?: string }).code,
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

  // Send verification email via AWS SES
  try {
    const emailService = new EmailService();
    const verificationToken = (data as any).verificationToken;
    const domain = event.requestContext.domainName;
    const stage = event.requestContext.stage;
    const apiGatewayUrl = `https://${domain}/${stage}`;
    const verificationLink = `${apiGatewayUrl}/auth/confirm-email?token=${verificationToken}`;

    await emailService.sendVerificationEmail(
      result.data.email,
      result.data.first_name,
      verificationLink,
    );

    console.log("Successfully signed up and sent verification email.");
  } catch (emailError) {
    console.error("Failed to send verification email:", emailError);
    // User is created but email failed — still return success
    // They can contact support if they don't receive the email
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "Account created successfully. Please check your email to verify your account.",
    }),
  };
});
