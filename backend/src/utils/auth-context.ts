import type { APIGatewayProxyEvent } from "aws-lambda";

export type AccountType = "internal" | "external";

export interface AuthContext {
  userId: string;
  email?: string;
  first_name: string;
  last_name: string;
  roles: string[];
  account_type: AccountType;
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

function parseAccountType(value: unknown): AccountType {
  return value === "external" ? "external" : "internal";
}

export function getAuthContext(event: APIGatewayProxyEvent): AuthContext {
  const authorizer = event.requestContext.authorizer ?? {};

  return {
    userId: String(authorizer.user_sub ?? ""),
    email: authorizer.email,
    first_name: authorizer.first_name,
    last_name: authorizer.last_name,
    roles: parseRoles(authorizer.roles),
    account_type: parseAccountType(authorizer.account_type),
  };
}
