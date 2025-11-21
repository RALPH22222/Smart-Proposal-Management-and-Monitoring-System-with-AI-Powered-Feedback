export type ProjectStatus = 'Active' | 'Completed' | 'On Hold' | 'At Risk' | 'Planning';
export type ProjectPhase = 'Conceptualization' | 'Planning' | 'Execution' | 'Monitoring' | 'Closing';

export interface Milestone {
  name: string;
  dueDate: string;
  description?: string;
  completed: boolean;
}

export interface Project {
  id: string;
  projectId: string;
  title: string;
  description: string;
  principalInvestigator: string;
  department: string;
  researchArea: string;
  startDate: string;
  endDate: string;
  budget: number;
  status: ProjectStatus;
  currentPhase: ProjectPhase;
  completionPercentage: number;
  collaborators?: string[];
  milestones?: Milestone[];
  lastModified: string;
}