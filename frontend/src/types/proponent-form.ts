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

export interface AgencyAddress {
  street: string;
  barangay: string;
  city: string;
}
export type LookupItem = { id: number; name: string };
export interface FormData {
  programTitle: string;
  projectTitle: string; 
  department?: string;
  agencyName: number | string;
  agencyAddress: AgencyAddress;
  schoolYear: string;
  tags: string[];
  email: string;
  telephone: string;
  cooperatingAgencies: { id: number; name: string }[];
  implementationSite: { site: string; city: string }[];
  researchStation: string;
  classificationType: "research" | "development" | ""; 
  researchType: {
    basic: boolean;
    applied: boolean;
    other?: string;
    development?: boolean;
    pilotTesting?: boolean;
    techPromotion?: boolean;
    [key: string]: boolean | string | undefined; 
  };
  developmentType: "pilotTesting" | "techPromotion" | "";
  implementationMode: {
    singleAgency: boolean;
    multiAgency: boolean;
  };
  priorityAreas: {
    stand: boolean;
    coconutIndustry: boolean;
    exportWinners: boolean;
    otherPriorityAreas: boolean;
    supportIndustries: boolean;
    [key: string]: boolean;
  };
  sectorCommodity: string;
  discipline: string;
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