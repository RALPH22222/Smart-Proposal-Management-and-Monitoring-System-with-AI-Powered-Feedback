import {
  APIGatewayAuthorizerResult,
  APIGatewayRequestAuthorizerEvent,
} from "aws-lambda";
import { AuthService } from "../../services/auth.service";
import { parseCookie } from "../../utils/cookies";
import { JwtPayload } from "jsonwebtoken";

const generatePolicy = (
  principalId: string,
  effect: "Allow" | "Deny",
  resource: string,
  context?: Record<string, any>,
): APIGatewayAuthorizerResult => {
  return {
    principalId,
    policyDocument: {
      Version: "2012-10-17",
      Statement: [
        {
          Action: "execute-api:Invoke",
          Effect: effect,
          Resource: resource,
        },
      ],
    },
    context,
  };
};

export const handler = async (
  event: APIGatewayRequestAuthorizerEvent,
): Promise<APIGatewayAuthorizerResult> => {
  const cookies_str = event.headers?.Cookie || event.headers?.cookie || "";
  const cookies = parseCookie(cookies_str);

  const authService = new AuthService();
  const { data, error } = await authService.verifyToken(cookies.tk);

  if (error && !data) {
    throw "Unauthorized";
  }

  const user_sub = (data as JwtPayload).sub!;

  return generatePolicy(user_sub, "Allow", event.methodArn, {
    user_sub: user_sub,
  });
};
