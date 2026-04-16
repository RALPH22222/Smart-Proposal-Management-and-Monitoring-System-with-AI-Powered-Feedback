// Keep in sync with backend/src/schemas/auth-schema.ts `passwordSchema`.
// Returns the first violation message, or null if the password passes.
export function validatePasswordPolicy(password: string): string | null {
  if (password.length < 8) return "Password must be at least 8 characters";
  if (!/[A-Za-z]/.test(password)) return "Password must contain at least one letter";
  if (!/[0-9]/.test(password)) return "Password must contain at least one number";
  return null;
}

export const PASSWORD_POLICY_HINT = "At least 8 characters, with a letter and a number";
