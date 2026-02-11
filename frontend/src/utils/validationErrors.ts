interface ZodIssue {
  code: string;
  path: (string | number)[];
  message: string;
  minimum?: number;
  maximum?: number;
  type?: string;
}

interface ValidationErrorResponse {
  type: "validation_error";
  data: ZodIssue[];
}

const FIELD_LABELS: Record<string, string> = {
  proponent_id: "Proponent ID",
  department: "Department",
  sector: "Sector/Commodity",
  discipline: "Discipline",
  agency: "Agency",
  agency_address: "Agency Address",
  "agency_address.street": "Agency Street",
  "agency_address.barangay": "Agency Barangay",
  "agency_address.city": "Agency City",
  school_year: "School Year",
  program_title: "Program Title",
  project_title: "Project Title",
  email: "Email",
  phone: "Telephone",
  class_input: "Classification Type",
  classification_type: "Classification Type",
  implementation_mode: "Implementation Mode",
  plan_start_date: "Planned Start Date",
  plan_end_date: "Planned End Date",
  duration: "Duration",
  priorities_id: "Priority Areas",
  implementation_site: "Implementation Site",
  budget: "Budget",
  cooperating_agencies: "Cooperating Agencies",
  tags: "Tags",
  file_url: "Proposal File",
};

function getFieldLabel(path: (string | number)[]): string {
  if (path.length === 0) return "Unknown field";

  const fullPath = path.join(".");

  // Check full path first (e.g. "agency_address.city")
  if (FIELD_LABELS[fullPath]) return FIELD_LABELS[fullPath];

  // Check if it's a nested budget field (e.g. budget.0.source)
  if (path[0] === "budget") {
    if (path.includes("source")) return "Budget Source";
    if (path.includes("item")) return "Budget Item";
    if (path.includes("value")) return "Budget Amount";
    return "Budget";
  }

  // Check if it's an implementation_site field
  if (path[0] === "implementation_site") {
    if (path.includes("site_name")) return "Implementation Site Name";
    if (path.includes("city")) return "Implementation Site City";
    return "Implementation Site";
  }

  // Fall back to first path element
  const rootKey = String(path[0]);
  if (FIELD_LABELS[rootKey]) return FIELD_LABELS[rootKey];

  // Last resort: humanize the path
  return rootKey
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function parseValidationErrors(issues: ZodIssue[]): string[] {
  return issues.map((issue) => {
    const label = getFieldLabel(issue.path);

    // Use custom message if it's descriptive (not the generic Zod ones)
    if (
      issue.message &&
      issue.message !== "Required" &&
      !issue.message.startsWith("String must contain") &&
      !issue.message.startsWith("Number must be")
    ) {
      return `${label}: ${issue.message}`;
    }

    // Build a more helpful message based on issue code
    if (issue.code === "too_small") {
      if (issue.type === "string") {
        return `${label} is required`;
      }
      return `${label} is too short (minimum: ${issue.minimum})`;
    }

    if (issue.code === "too_big") {
      return `${label} is too long (maximum: ${issue.maximum} characters)`;
    }

    if (issue.code === "invalid_type") {
      return `${label} is required`;
    }

    if (issue.code === "invalid_enum_value") {
      return `${label} has an invalid value`;
    }

    return `${label}: ${issue.message || "Invalid value"}`;
  });
}

export function isValidationError(
  error: unknown
): error is { response: { data: ValidationErrorResponse } } {
  if (!error || typeof error !== "object") return false;
  const axiosError = error as { response?: { data?: ValidationErrorResponse } };
  return (
    axiosError.response?.data?.type === "validation_error" &&
    Array.isArray(axiosError.response?.data?.data)
  );
}
