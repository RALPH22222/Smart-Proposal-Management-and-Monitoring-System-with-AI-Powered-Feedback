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
  agency: string;
  address: string;
  tags: string;
  email: string;
  telephone: string;
  cooperatingAgencies: string;
  researchStation: string;
  
  // Updated classification fields
  classificationType: 'research' | 'development' | '';
  researchType: {
    basic: boolean;
    applied: boolean;
    // Remove these if they're no longer used in the new structure
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