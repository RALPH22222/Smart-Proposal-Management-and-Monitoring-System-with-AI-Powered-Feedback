import { APIGatewayAuthorizerResult, APIGatewayRequestAuthorizerEvent } from "aws-lambda";
import { AuthService } from "../../services/auth.service";
import { parseCookie } from "../../utils/cookies";
import { supabase } from "../../lib/supabase";

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

  const authHeader = event.headers?.Authorization || event.headers?.authorization || "";
  const bearer = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

  // Bearer takes priority over the cookie. The Bearer header is an explicit
  // auth signal from the caller (e.g. /accept-invite sends the invited user's
  // Supabase access token), whereas the `tk` cookie is ambient and may belong
  // to a different account if the browser already has a session. Preferring
  // the cookie caused complete-invite to write the invited user's profile
  // data onto whichever account's cookie happened to be in the browser.
  const token = bearer || cookies.tk;

  if (!token) {
    throw "Unauthorized";
  }

  const authService = new AuthService(supabase);
  const { data, error } = await authService.verifyToken(token);

  if (error && !data) {
    console.log("Auth service verify token error: ", JSON.stringify(error, null, 2));
    throw "Unauthorized";
  }

  console.log("Auth service verify token data: ", JSON.stringify(data, null, 2));

  // event.methodArn = arn:aws:execute-api:region:account:apiId/stage/VERB/path/...
  const [arn, stage, ...rest] = event.methodArn.split("/");
  const wildcardResource = `${arn}/${stage}/*/*`;
  // This means: all methods, all paths under this stage for this API

  const user_sub = data!.user.id;

  return generatePolicy(user_sub, "Allow", wildcardResource, {
    user_sub,
    email: data?.user.email,
    first_name: data?.user.first_name,
    last_name: data?.user.last_name,
    roles: JSON.stringify(data?.user.roles),
    // External-collaborator flag. Downstream handlers that need to gate writes on
    // account_type (e.g. anything the proponent "submit proposal" flow touches) can read
    // this via getAuthContext. verifyToken has already auto-upgraded the DB row if the
    // user's email is now @wmsu.edu.ph, so this value is always the fresh classification.
    account_type: data?.user.account_type ?? "internal",
  });
};
