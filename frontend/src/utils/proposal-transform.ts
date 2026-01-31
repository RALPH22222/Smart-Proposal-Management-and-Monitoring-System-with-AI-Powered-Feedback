/**
 * Transforms a raw backend proposal object into the shape expected
 * by RndViewModal and AdminViewModal.
 */

const fmt = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function transformProposalForModal(raw: any) {
  if (!raw) return null;

  // Proponent name
  const proponent =
    raw.proponent_id && typeof raw.proponent_id === "object"
      ? `${raw.proponent_id.first_name || ""} ${raw.proponent_id.last_name || ""}`.trim() || "Unknown"
      : "Unknown";

  // Agency (string)
  const agency = raw.agency && typeof raw.agency === "object" ? raw.agency.name || "N/A" : "N/A";

  // Address from agency object
  const address =
    raw.agency && typeof raw.agency === "object"
      ? [raw.agency.street, raw.agency.barangay, raw.agency.city].filter(Boolean).join(", ") || "N/A"
      : "N/A";

  // Cooperating agencies → comma-separated string
  const cooperatingAgencies =
    (raw.cooperating_agencies || [])
      .map((ca: any) => ca.agencies?.name)
      .filter(Boolean)
      .join(", ") || "None";

  // Implementation sites
  const implementationSites = (raw.implementation_site || []).map((s: any) => ({
    site: s.site_name || "",
    city: s.city || "",
  }));

  // Priority areas → comma-separated string
  const priorityAreas =
    (raw.proposal_priorities || [])
      .map((pp: any) => pp.priorities?.name)
      .filter(Boolean)
      .join(", ") || "N/A";

  // Budget transformation: group by source, sum by category, collect items
  interface CategoryData { items: { item: string; amount: number }[]; total: number }
  const budgetMap: Record<string, { ps: CategoryData; mooe: CategoryData; co: CategoryData }> = {};

  (raw.estimated_budget || []).forEach((b: any) => {
    const src = b.source || "Unknown";
    if (!budgetMap[src]) {
      budgetMap[src] = {
        ps: { items: [], total: 0 },
        mooe: { items: [], total: 0 },
        co: { items: [], total: 0 }
      };
    }
    const cat = b.budget as "ps" | "mooe" | "co";
    const itemData = { item: b.item_name || b.item || "Unspecified", amount: b.amount || 0 };

    if (cat && budgetMap[src][cat]) {
      budgetMap[src][cat].total += b.amount || 0;
      budgetMap[src][cat].items.push(itemData);
    }
  });

  const budgetSources = Object.entries(budgetMap).map(([source, vals]) => ({
    source,
    ps: fmt(vals.ps.total),
    mooe: fmt(vals.mooe.total),
    co: fmt(vals.co.total),
    total: fmt(vals.ps.total + vals.mooe.total + vals.co.total),
    breakdown: {
      ps: vals.ps.items,
      mooe: vals.mooe.items,
      co: vals.co.items
    }
  }));

  const budgetGrandTotal = Object.values(budgetMap).reduce((sum, v) => sum + v.ps.total + v.mooe.total + v.co.total, 0);

  // Latest file version
  const versions = raw.proposal_version || [];
  const latestVersion = versions.length > 0 ? versions[versions.length - 1] : null;

  // Classification display
  const classificationMap: Record<string, string> = {
    research_class: "Research",
    development_class: "Development",
  };
  const classification = classificationMap[raw.classification_type] || raw.classification_type || "N/A";

  // Implementation mode display
  const modeMap: Record<string, string> = {
    single_agency: "Single Agency",
    multi_agency: "Multi Agency",
  };
  const modeOfImplementation = modeMap[raw.implementation_mode] || raw.implementation_mode || "N/A";

  return {
    id: raw.id,
    title: raw.project_title || "Untitled",
    status: raw.status || "",
    projectFile: latestVersion?.file_url || "",
    submittedDate: raw.created_at || "",
    lastModified: raw.updated_at || raw.created_at || "",
    proponent,
    agency,
    address,
    telephone: raw.phone || "N/A",
    email: raw.email || "N/A",
    modeOfImplementation,
    implementationSites,
    priorityAreas,
    cooperatingAgencies,
    rdStation: raw.rnd_station?.name || "N/A",
    classification,
    classificationDetails: raw.class_input || "N/A",
    sector: raw.sector?.name || "N/A",
    discipline: raw.discipline?.name || "N/A",
    duration: raw.duration ? `${raw.duration} Months` : "N/A",
    startDate: raw.plan_start_date || "",
    endDate: raw.plan_end_date || "",
    budgetSources,
    budgetTotal: fmt(budgetGrandTotal),
    documentUrl: latestVersion?.file_url || "",
  };
}
