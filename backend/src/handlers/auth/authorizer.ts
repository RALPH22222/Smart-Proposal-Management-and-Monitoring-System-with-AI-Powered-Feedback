import { APIGatewayAuthorizerResult, APIGatewayRequestAuthorizerEvent } from "aws-lambda";
import { AuthService } from "../../services/auth.service";
import { parseCookie } from "../../utils/cookies";

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

export const handler = async (event: APIGatewayRequestAuthorizerEvent): Promise<APIGatewayAuthorizerResult> => {
  const cookies_str = event.headers?.Cookie || event.headers?.cookie || "";
  const cookies = parseCookie(cookies_str);

  const authService = new AuthService();
  const { data, error } = await authService.verifyToken(cookies.tk);

  if (error && !data) {
    console.log("Auth service verify token error: ", JSON.stringify(error, null, 2));
    throw "Unauthorized";
  }

  console.log("Auth service verify token data: ", JSON.stringify(data, null, 2));

  // event.methodArn = arn:aws:execute-api:region:account:apiId/stage/VERB/path/...
  const [arn, stage, ...rest] = event.methodArn.split("/");
  const wildcardResource = `${arn}/${stage}/*/*`;
  // This means: all methods, all paths under this stage for this API

  const user_sub = data!.sub;

  return generatePolicy(user_sub, "Allow", wildcardResource, {
    user_sub: user_sub,
  });
};
