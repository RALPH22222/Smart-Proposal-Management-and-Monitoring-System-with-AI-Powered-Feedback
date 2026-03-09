import { APIGatewayProxyEvent } from "aws-lambda";
import { AuthService } from "../../services/auth.service";
import { supabase } from "../../lib/supabase";
import { buildCorsHeaders } from "../../utils/cors";
import { z } from "zod";

const verifyOtpSchema = z.object({
    email: z.string().email(),
    token: z.string().max(8),
});

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

        // Use Supabase verifyOtp natively
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
                session: sessionData.session,
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
