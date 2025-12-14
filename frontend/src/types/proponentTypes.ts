export interface Project {
  id: string;
  title: string;
  currentIndex: number;
  submissionDate: string;
  lastUpdated: string;
  budget: string;
  duration: string;
  priority: 'high' | 'medium' | 'low';
  evaluators: number;
}

export interface Notification {
  id: string;
  title: string;
  time: string;
  read: boolean;
}

export interface BudgetSource {
  source: string;
  ps: string;
  mooe: string;
  co: string;
  total: string;
}

interface Sites {
  site: string;
  city: string;
}

export interface Proposal {
  id: string;
  title: string;
  status: 'endorsed' | 'r&d evaluation' | 'evaluators assessment' | 'revise' | 'funded' | 'reject';
  proponent: string;
  gender: string;
  agency: string;
  schoolYear: string;
  address: string;
  telephone: string;
  email: string;
  cooperatingAgencies: string;
  rdStation: string;
  classification: string;
  classificationDetails: string;
  modeOfImplementation: string;
  implementationSites: Sites[];
  priorityAreas: string;
  sector: string;
  coProponent?: string;
  discipline: string;
  duration: string;
  startDate: string;
  endDate: string;
  budgetSources: BudgetSource[];
  budgetTotal: string;
  uploadedFile: string;
  lastUpdated: string;
  deadline?: string;
}