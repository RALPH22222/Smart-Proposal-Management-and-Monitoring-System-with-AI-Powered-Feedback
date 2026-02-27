// types/InterfaceProject.ts

export type ProjectStatus = 'Active' | 'Completed' | 'On Hold' | 'At Risk' | 'Planning' | 'Delayed';

export interface BudgetRequest {
  id: string;
  amount: number;
  reason: string;
  dateRequested: string;
  status: 'Pending' | 'Approved' | 'Rejected';
}

export interface Milestone {
  id: string;
  name: string;
  dueDate: string;
  description?: string;
  status: 'Pending' | 'Completed' | 'Delayed' | 'Review Required' | 'Proposed';
  
  // For Active Status (Proof of completion from proponent)
  submissionDate?: string;
  submissionProof?: string; 
  
  // For Delayed Status (Extension request from proponent)
  extensionRequest?: {
    newDate: string;
    reason: string;
    status: 'Pending' | 'Approved' | 'Rejected';
  };

  // ADD THIS LINE TO FIX YOUR ERROR
  completed: boolean; 
}

export interface Project {
  id: string;
  projectId: string;
  title: string;
  description: string;
  principalInvestigator: string;
  coProponent?: string;
  department: string;
  researchArea: string;
  startDate: string;
  endDate: string;
  budget: number;
  status: ProjectStatus;
  completionPercentage: number;
  backendId?: number;
  backendStatus?: string;
  collaborators?: string[];
  milestones?: Milestone[];
  fundRequests?: BudgetRequest[];
  lastModified: string;
  
  // Extended fields
  gender?: string;
  address?: string;
  telephone?: string;
  email?: string;
  agency?: string;
  cooperatingAgencies?: string;
  rdStation?: string;
  classification?: string;
  classificationDetails?: string;
  modeOfImplementation?: string;
  priorityAreas?: string;
  sector?: string;
  discipline?: string;
  duration?: string;
  budgetSources?: any[];
  budgetTotal?: string;
  onHoldReason?: string;
}