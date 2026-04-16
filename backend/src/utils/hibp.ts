import { createHash } from "node:crypto";

// Checks a password against HaveIBeenPwned Pwned Passwords using k-anonymity:
// only the first 5 chars of its SHA-1 hash ever leave our server. Returns the
// breach count if the password appears in a known breach, null otherwise.
// Fails open on network errors / timeouts so a HIBP outage never blocks auth.
export async function checkPasswordPwned(password: string): Promise<number | null> {
  try {
    const hash = createHash("sha1").update(password).digest("hex").toUpperCase();
    const prefix = hash.slice(0, 5);
    const suffix = hash.slice(5);

    const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: { "Add-Padding": "true" },
      signal: AbortSignal.timeout(3000),
    });

    if (!res.ok) return null;

    const text = await res.text();
    for (const line of text.split("\n")) {
      const [hashSuffix, countStr] = line.trim().split(":");
      if (hashSuffix === suffix) {
        const count = parseInt(countStr, 10);
        return Number.isNaN(count) ? 1 : count;
      }
    }
    return null;
  } catch (err) {
    console.warn("HIBP check failed (failing open):", err);
    return null;
  }
}

export const PWNED_PASSWORD_MESSAGE =
  "This password has appeared in a known data breach. Please choose a different one.";
