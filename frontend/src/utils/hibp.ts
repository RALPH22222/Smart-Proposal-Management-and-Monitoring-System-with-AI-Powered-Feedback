// Checks a password against HaveIBeenPwned Pwned Passwords using k-anonymity:
// only the first 5 chars of its SHA-1 hash are sent. Returns the breach count
// if the password appears in a known breach, null otherwise. Fails open on
// network errors so a HIBP outage never blocks the user.
//
// Used by resetPassword.tsx because that flow updates the password via the
// frontend Supabase client directly and never hits our backend — so we can't
// route the check through the backend hibp.ts utility.
export async function checkPasswordPwned(password: string): Promise<number | null> {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest("SHA-1", data);
    const hash = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase();
    const prefix = hash.slice(0, 5);
    const suffix = hash.slice(5);

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 3000);
    const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      signal: controller.signal,
    });
    window.clearTimeout(timeout);

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
  } catch {
    return null;
  }
}

export const PWNED_PASSWORD_MESSAGE =
  "This password has appeared in a known data breach. Please choose a different one.";
