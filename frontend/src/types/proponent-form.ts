export interface BudgetItem {
  id: number;
  source: string;
  mooe: number;
  ps: number;
  co: number;
  total: number;
  isExpanded: boolean;
  year: string;
}

export interface FormData {
  programTitle: string;
  projectTitle: string;
  leaderGender: string;
  agencyName: string;
  agencyAddress: string;
  schoolYear: string;
  tags: string;
  email: string;
  telephone: string;
  cooperatingAgencies: { id: number; name: string }[];
  implementationSite: { site: string; city: string }[];
  researchStation: string;
  classificationType: 'research' | 'development' | '';
  researchType: {
    basic: boolean;
    applied: boolean;
    other?: string;
    development?: boolean;
    pilotTesting?: boolean;
    techPromotion?: boolean;
  };
  developmentType: 'pilotTesting' | 'techPromotion' | '';
  
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
  };
  sectorCommodity: string;
  discipline: string;
  duration: string;
  plannedStartDate: string;
  plannedEndDate: string;
  budgetItems: BudgetItem[];
}

export interface AICheckResult {
  isValid: boolean;
  issues: string[];
  suggestions: string[];
  score: number;
  type: 'template' | 'form';
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