import type { APIGatewayProxyEvent } from "aws-lambda";

export interface AuthContext {
  userId: string;
  email?: string;
  first_name: string;
  last_name: string;
  roles: string[];
}

function parseRoles(value: unknown): string[] {
  if (typeof value !== "string") return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((r) => typeof r === "string") : [];
  } catch {
    return [];
  }
}

export function getAuthContext(event: APIGatewayProxyEvent): AuthContext {
  const authorizer = event.requestContext.authorizer ?? {};

  return {
    userId: String(authorizer.userId ?? ""),
    email: authorizer.email,
    first_name: authorizer.first_name,
    last_name: authorizer.last_name,
    roles: parseRoles(authorizer.roles),
  };
}
