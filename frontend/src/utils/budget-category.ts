export type BudgetCategory = "ps" | "mooe" | "co";

export function normalizeBudgetCategory(raw: unknown): BudgetCategory | null {
  const value = String(raw ?? "").trim().toLowerCase();
  if (!value) return null;

  const compact = value.replace(/[^a-z]/g, "");

  if (
    compact === "ps" ||
    compact === "personalservices" ||
    compact.includes("personnel") ||
    compact.includes("personal")
  ) {
    return "ps";
  }

  if (
    compact === "mooe" ||
    compact.includes("maintenance") ||
    compact.includes("operating") ||
    compact.includes("mooe")
  ) {
    return "mooe";
  }

  if (
    compact === "co" ||
    compact === "capitaloutlay" ||
    compact.includes("capital")
  ) {
    return "co";
  }

  return null;
}

export function getBudgetCategory(item: {
  category?: unknown;
  budget?: unknown;
  item_type?: unknown;
} | null | undefined): BudgetCategory | null {
  return normalizeBudgetCategory(item?.category ?? item?.budget ?? item?.item_type);
}
