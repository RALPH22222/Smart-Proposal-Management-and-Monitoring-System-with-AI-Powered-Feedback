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

function buildAgencyAcronym(tokens: string[]): string {
  return tokens
    .filter((token) => /^[A-Za-z]+$/.test(token))
    .map((token) => token[0]?.toUpperCase() ?? "")
    .join("");
}

export function buildRedactionTargets(input: {
  proponent?: string | null;
  agency?: string | null;
  visibility: Visibility;
}): string[] {
  const { proponent, agency, visibility } = input;
  const targets = new Set<string>();

  const shouldHideName = visibility === "agency" || visibility === "none";
  const shouldHideAgency = visibility === "name" || visibility === "none";

  if (shouldHideName && isUsableValue(proponent)) {
    const normalizedName = normalizeValue(proponent);
    addTarget(targets, normalizedName);

    for (const token of cleanTokens(normalizedName)) {
      if (token.length >= 2 && !NAME_STOP_WORDS.has(token.toLowerCase())) {
        addTarget(targets, token);
      }
    }
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

  return Array.from(targets).sort((a, b) => b.length - a.length);
}
