import { APIGatewayProxyEvent } from "aws-lambda";
import { supabase } from "../../lib/supabase";
import { buildCorsHeaders } from "../../utils/cors";
import { z } from "zod";

const verifyOtpSchema = z.object({
    email: z.string().email(),
    token: z.string().max(8),
});

// Mobile-only endpoint: verifies OTP code sent to user's email during signup.
// Web users use the confirm-email flow (email link) instead.
export const handler = buildCorsHeaders(async (event: APIGatewayProxyEvent) => {
    try {
        const payload = JSON.parse(event.body || "{}");

        const result = verifyOtpSchema.safeParse(payload);

        if (result.error) {
            return {
                statusCode: 400,
                body: JSON.stringify({
                    type: "validation_error",
                    data: result.error.issues,
                }),
            };
        }

        const { email, token } = result.data;

        const { data: sessionData, error } = await supabase.auth.verifyOtp({
            email,
            token,
            type: 'signup',
        });

        if (error) {
            console.error("OTP verification error:", error);
            return {
                statusCode: 400,
                body: JSON.stringify({
                    message: error.message || "Invalid or expired verification code.",
                }),
            };
        }

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: "Email successfully verified.",
                user: sessionData.user ? {
                    id: sessionData.user.id,
                    email: sessionData.user.email,
                    email_confirmed_at: sessionData.user.email_confirmed_at,
                } : null,
                access_token: sessionData.session?.access_token,
                refresh_token: sessionData.session?.refresh_token,
            }),
        };
    } catch (error) {
        console.error("Unexpected error during OTP verification:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: "An unexpected error occurred during verification.",
            }),
        };
    }
});
