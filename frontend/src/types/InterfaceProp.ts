export interface Proposal {
  id: string;
  title: string;
  status: 'pending' | 'revise' | 'approved' | 'reject';
  proponent: string;
  gender: string;
  agency: string;
  address: string;
  telephone: string;
  fax: string;
  email: string;
  cooperatingAgencies: string;
  rdStation: string;
  classification: string;
  classificationDetails: string;
  modeOfImplementation: string;
  priorityAreas: string;
  sector: string;
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

export interface BudgetSource {
  source: string;
  ps: string;
  mooe: string;
  co: string;
  total: string;
}