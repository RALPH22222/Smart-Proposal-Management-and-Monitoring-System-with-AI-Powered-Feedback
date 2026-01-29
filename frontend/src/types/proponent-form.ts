export interface ExpenseItem {
  item: string;
  value: number;
}

export interface BudgetItem {
  id: number;
  source: string;
  budget: {
    ps: ExpenseItem[];
    mooe: ExpenseItem[];
    co: ExpenseItem[];
  };
}

enum ClassificationType {
  RESEARCH_CLASS = "research_class",
  DEVELOPMENT_CLASS = "development_class",
}

export interface AgencyAddress {
  street: string;
  barangay: string;
  city: string;
}
export type LookupItem = { id: number; name: string };
export interface FormData {
  program_title: string;
  project_title: string;
  department: number | string; // ID or name for lookup
  sector: number | string; // ID or name for lookup
  agency: number | string;
  agencyAddress: AgencyAddress;
  schoolYear: string;
  tags: number[]; // Array of tag IDs
  email: string;
  telephone: string;
  cooperating_agencies: { id: number; name: string }[];
  implementation_site: { site: string; city: string }[];
  researchStation: string; // Display name for UI
  sectorCommodity: string; // Display name for UI
  classificiation_type: ClassificationType;
  class_input: string;
  priorities_id: (number | string)[];
  discipline: number | string; // ID or name for lookup
  disciplineName: string; // Display name for UI
  duration: string;
  plannedStartDate: string | null;
  plannedEndDate: string | null;
  budgetItems: BudgetItem[];
}
export interface AICheckResult {
  isValid: boolean;
  issues: string[];
  suggestions: string[];
  score: number;
  type: "template" | "form";
  title: string;
}

export interface DashboardProps {
  formData: FormData;
  onFormDataChange: (data: FormData) => void;
  selectedFile: File | null;
  onFileSelect: (file: File | null) => void;
  onAITemplateCheck: () => void;
  onAIFormCheck: () => void;
  onSubmit: () => void;
  isFormComplete: boolean;
  isCheckingTemplate: boolean;
  isCheckingForm: boolean;
  aiCheckResult: AICheckResult | null;
  showAIModal: boolean;
  onAIModalClose: () => void;
  years: string[];
}

export type ProposalOptionsResponse = {
  agencies: LookupItem[];
  tags: LookupItem[];
  stations: LookupItem[];
  sectors: LookupItem[];
  disciplines: LookupItem[];
  priorities: LookupItem[];
};

export type ProposalCreateResponse = { message: string };
