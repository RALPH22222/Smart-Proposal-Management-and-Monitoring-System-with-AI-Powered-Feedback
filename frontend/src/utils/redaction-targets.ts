type Visibility = "name" | "agency" | "both" | "none";

const INVALID_VALUES = new Set(["n/a", "na", "unknown", "confidential"]);
const NAME_STOP_WORDS = new Set(["mr", "mrs", "ms", "dr", "prof", "sir", "maam", "madam"]);
const AGENCY_TOKEN_STOP_WORDS = new Set([
  "and",
  "the",
  "for",
  "inc",
  "corp",
  "corporation",
  "company",
  "co",
  "agency",
  "office",
  "department",
  "bureau",
  "board",
  "council",
  "commission",
  "university",
  "college",
  "campus",
  "city",
  "municipality",
  "municipal",
  "state",
  "national",
]);

function normalizeValue(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function isUsableValue(value?: string | null): value is string {
  if (!value) return false;
  const normalized = normalizeValue(value);
  if (!normalized) return false;
  return !INVALID_VALUES.has(normalized.toLowerCase());
}

function cleanTokens(value: string): string[] {
  return normalizeValue(value)
    .split(/[\s,./()&-]+/)
    .map((token) => token.replace(/^[^A-Za-z0-9]+|[^A-Za-z0-9]+$/g, ""))
    .filter(Boolean);
}

function addTarget(targets: Set<string>, value: string): void {
  const normalized = normalizeValue(value);
  if (normalized.length >= 2) {
    targets.add(normalized);
  }
}

function addNameTargets(targets: Set<string>, value: string): void {
  const normalizedName = normalizeValue(value);
  addTarget(targets, normalizedName);

  const tokens = cleanTokens(normalizedName).filter(
    (token) => token.length >= 2 && !NAME_STOP_WORDS.has(token.toLowerCase()),
  );

  for (const token of tokens) {
    addTarget(targets, token);
  }

  if (tokens.length >= 2) {
    addTarget(targets, `${tokens[0]} ${tokens[tokens.length - 1]}`);
    addTarget(targets, `${tokens[tokens.length - 1]}, ${tokens[0]}`);
    addTarget(targets, `${tokens[tokens.length - 1]} ${tokens[0]}`);
  }

  if (tokens.length >= 3) {
    const first = tokens[0];
    const last = tokens[tokens.length - 1];
    for (const middle of tokens.slice(1, -1)) {
      addTarget(targets, `${first} ${middle} ${last}`);
      addTarget(targets, `${first} ${middle[0]}. ${last}`);
    }
  }
}

function addEmailTargets(targets: Set<string>, value: string): void {
  const normalizedEmail = normalizeValue(value);
  addTarget(targets, normalizedEmail);

  const [localPart] = normalizedEmail.split("@");
  if (!localPart) return;

  addTarget(targets, localPart);
  for (const token of cleanTokens(localPart)) {
    if (token.length >= 2) {
      addTarget(targets, token);
    }
  }
}

function addPhoneTargets(targets: Set<string>, value: string): void {
  const normalizedPhone = normalizeValue(value);
  addTarget(targets, normalizedPhone);

  const digitsOnly = normalizedPhone.replace(/\D+/g, "");
  if (digitsOnly.length >= 7) {
    addTarget(targets, digitsOnly);
  }
}

function buildAgencyAcronym(tokens: string[]): string {
  return tokens
    .filter((token) => /^[A-Za-z]+$/.test(token))
    .map((token) => token[0]?.toUpperCase() ?? "")
    .join("");
}

export function buildRedactionTargets(input: {
  proponent?: string | null;
  email?: string | null;
  telephone?: string | null;
  fax?: string | null;
  agency?: string | null;
  address?: string | null;
  visibility: Visibility;
}): string[] {
  const { proponent, email, telephone, fax, agency, address, visibility } = input;
  const targets = new Set<string>();

  const shouldHideName = visibility === "agency" || visibility === "none";
  const shouldHideAgency = visibility === "name" || visibility === "none";

  if (shouldHideName && isUsableValue(proponent)) {
    addNameTargets(targets, proponent);
  }

  if (shouldHideName && isUsableValue(email)) {
    addEmailTargets(targets, email);
  }

  if (shouldHideName && isUsableValue(telephone)) {
    addPhoneTargets(targets, telephone);
  }

  if (shouldHideName && isUsableValue(fax)) {
    addPhoneTargets(targets, fax);
  }

  if (shouldHideAgency && isUsableValue(agency)) {
    const normalizedAgency = normalizeValue(agency);
    addTarget(targets, normalizedAgency);

    if (normalizedAgency.includes("&")) {
      addTarget(targets, normalizedAgency.replace(/\s*&\s*/g, " and "));
    }

    const agencyTokens = cleanTokens(normalizedAgency);
    for (const token of agencyTokens) {
      if (token.length >= 3 && !AGENCY_TOKEN_STOP_WORDS.has(token.toLowerCase())) {
        addTarget(targets, token);
      }
    }

    const acronym = buildAgencyAcronym(agencyTokens);
    if (acronym.length >= 3) {
      addTarget(targets, acronym);
    }
  }

  if (shouldHideAgency && isUsableValue(address)) {
    addTarget(targets, address);
  }

  return Array.from(targets).sort((a, b) => b.length - a.length);
}
