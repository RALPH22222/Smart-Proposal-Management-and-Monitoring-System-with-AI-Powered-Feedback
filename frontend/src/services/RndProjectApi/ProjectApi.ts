import type { Project} from '../../types/InterfaceProject';

const mockProjects: Project[] = [
  {
    id: '1',
    projectId: 'RND-2024-001',
    title: 'AI-Powered Research Paper Analysis System',
    description: 'Development of an AI system to analyze and categorize research papers for the R&D department.',
    principalInvestigator: 'Dr. Maria Santos',
    department: 'Computer Science',
    researchArea: 'Artificial Intelligence',
    startDate: '2024-01-15',
    endDate: '2024-12-15',
    budget: 500000,
    status: 'Active',
    completionPercentage: 65,
    collaborators: ['DOST', 'DPWH'],
    milestones: [
      { id: 'm1-1', status: 'Completed', name: 'Requirements Analysis', dueDate: '2024-02-15', completed: true },
      { id: 'm1-2', status: 'Completed', name: 'System Design', dueDate: '2024-04-30', completed: true },
      { id: 'm1-3', status: 'Pending', name: 'Development Phase 1', dueDate: '2024-08-31', completed: false },
      { id: 'm1-4', status: 'Pending', name: 'Testing & Deployment', dueDate: '2024-11-30', completed: false }
    ],
    lastModified: '2024-06-15'
  },
  {
    id: '2',
    projectId: 'RND-2024-002',
    title: 'Renewable Energy Materials Research',
    description: 'Research on novel materials for improving solar cell efficiency.',
    principalInvestigator: 'Dr. Robert Lim',
    department: 'Engineering',
    researchArea: 'Materials Science',
    startDate: '2024-03-01',
    endDate: '2025-02-28',
    budget: 750000,
    status: 'Active',
    completionPercentage: 40,
    collaborators: ['Dr. Anna Torres'],
    lastModified: '2024-06-10'
  },
  {
    id: '3',
    projectId: 'RND-2024-003',
    title: 'Climate Change Impact on Coastal Communities',
    description: 'Study on the socio-economic impacts of climate change on coastal communities in the region.',
    principalInvestigator: 'Dr. Sarah Johnson',
    department: 'Environmental Science',
    researchArea: 'Climate Studies',
    startDate: '2024-02-01',
    endDate: '2024-10-31',
    budget: 300000,
    status: 'Completed',
    completionPercentage: 100,
    collaborators: ['Dr. Michael Chen', 'Dr. Emily Wong'],
    milestones: [
      { id: 'm3-1', status: 'Completed', name: 'Literature Review', dueDate: '2024-03-15', completed: true },
      { id: 'm3-2', status: 'Completed', name: 'Field Research', dueDate: '2024-06-30', completed: true },
      { id: 'm3-3', status: 'Completed', name: 'Data Analysis', dueDate: '2024-08-31', completed: true },
      { id: 'm3-4', status: 'Completed', name: 'Final Report', dueDate: '2024-10-15', completed: true }
    ],
    lastModified: '2024-10-20'
  },
  {
    id: '4',
    projectId: 'RND-2024-004',
    title: 'Traditional Medicine Database Development',
    description: 'Creating a comprehensive database of traditional medicinal plants and their applications.',
    principalInvestigator: 'Dr. Carlos Reyes',
    department: 'Biology',
    researchArea: 'Ethnobotany',
    startDate: '2024-05-01',
    endDate: '2024-11-30',
    budget: 450000,
    status: 'At Risk',
    completionPercentage: 35,
    collaborators: ['Dr. Maria Lopez'],
    milestones: [
      { id: 'm4-1', status: 'Completed', name: 'Plant Collection', dueDate: '2024-06-30', completed: true },
      { id: 'm4-2', status: 'Pending', name: 'Laboratory Analysis', dueDate: '2024-08-31', completed: false },
      { id: 'm4-3', status: 'Pending', name: 'Database Development', dueDate: '2024-10-31', completed: false },
      { id: 'm4-4', status: 'Pending', name: 'Documentation', dueDate: '2024-11-20', completed: false }
    ],
    lastModified: '2024-07-15'
  },
  {
    id: '5',
    projectId: 'RND-2024-005',
    title: 'Educational Technology Integration Study',
    description: 'Research on the effectiveness of technology integration in classroom settings.',
    principalInvestigator: 'Dr. James Wilson',
    department: 'Education',
    researchArea: 'Educational Technology',
    startDate: '2024-04-15',
    endDate: '2025-01-31',
    budget: 600000,
    status: 'On Hold',
    completionPercentage: 20,
    collaborators: ['Dr. Patricia Garcia'],
    lastModified: '2024-06-01'
  }
];

export const projectApi = {
  fetchProjects: async (): Promise<Project[]> => {
    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(mockProjects);
      }, 1000);
    });
  },

  updateProject: async (projectId: string, updates: Partial<Project>): Promise<Project> => {
    // Simulate API update
    return new Promise((resolve) => {
      setTimeout(() => {
        const project = mockProjects.find(p => p.id === projectId);
        const updatedProject = { ...project, ...updates, lastModified: new Date().toISOString() } as Project;
        resolve(updatedProject);
      }, 500);
    });
  },

  fetchProjectById: async (projectId: string): Promise<Project | null> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const project = mockProjects.find(p => p.id === projectId);
        resolve(project || null);
      }, 300);
    });
  }
};