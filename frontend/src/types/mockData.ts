import type { Project, Notification } from './proponentTypes';

export const mockProjects: Project[] = [
  { 
    id: "p1", 
    title: "Community Health Outreach Program", 
    currentIndex: 2,
    submissionDate: "2024-01-15",
    lastUpdated: "2024-01-28",
    budget: "₱250,000",
    duration: "12 months",
    priority: 'high',
    evaluators: 3
  },
  { 
    id: "p2", 
    title: "AgriTech Digital Transformation", 
    currentIndex: 1,
    submissionDate: "2024-01-10",
    lastUpdated: "2024-01-25",
    budget: "₱500,000",
    duration: "18 months",
    priority: 'high',
    evaluators: 2
  },
  { 
    id: "p3", 
    title: "STEM Education Enhancement", 
    currentIndex: 3,
    submissionDate: "2024-01-05",
    lastUpdated: "2024-02-01",
    budget: "₱150,000",
    duration: "6 months",
    priority: 'medium',
    evaluators: 3
  },
  { 
    id: "p4", 
    title: "Digital Library Modernization", 
    currentIndex: 4,
    submissionDate: "2024-01-12",
    lastUpdated: "2024-01-30",
    budget: "₱300,000",
    duration: "9 months",
    priority: 'medium',
    evaluators: 3
  },
  { 
    id: "p5", 
    title: "Renewable Energy Research", 
    currentIndex: 2,
    submissionDate: "2024-02-01",
    lastUpdated: "2024-02-01",
    budget: "₱750,000",
    duration: "24 months",
    priority: 'high',
    evaluators: 5
  },
  // Add more projects to cover all statuses
  { 
    id: "p6", 
    title: "Environmental Conservation Study", 
    currentIndex: 0,
    submissionDate: "2024-02-05",
    lastUpdated: "2024-02-05",
    budget: "₱200,000",
    duration: "8 months",
    priority: 'medium',
    evaluators: 0
  },
  { 
    id: "p7", 
    title: "AI Research Project", 
    currentIndex: 3,
    submissionDate: "2024-01-20",
    lastUpdated: "2024-02-02",
    budget: "₱600,000",
    duration: "15 months",
    priority: 'high',
    evaluators: 4
  },
  { 
    id: "p8", 
    title: "Cultural Heritage Preservation", 
    currentIndex: 5,
    submissionDate: "2024-01-08",
    lastUpdated: "2024-01-29",
    budget: "₱180,000",
    duration: "10 months",
    priority: 'low',
    evaluators: 2
  }
];

// KEEP THE ORIGINAL STAGE SYSTEM FOR ACTIVE PROJECT OVERVIEW
export const stageLabels = [
  "R&D Evaluation",
  "Evaluators Assessment", 
  "Endorsement",
  "Funding",
  "Completed"
];

export const currentStageLabels = [
  "Submitted",
  "R&D Evaluation",
  "Evaluators Assessment",
  "Endorsement", 
  "Funded"
];

export const stageDescriptions = [
  "Proposal will be reviewed by the R&D staff",
  "Under review by the assigned evaluators.",
  "This will be reviewed to assess if it is eligible for endorsement.",
  "Financial review and budget allocation assessment",
  "Project has been approved and ready for implementation"
];

export const initialNotifications: Notification[] = [
  { 
    id: 'n1', 
    title: 'New comment on "AgriTech Digital Transformation"', 
    time: '2h', 
    read: false 
  },
  { 
    id: 'n2', 
    title: 'Budget review requested for "Digital Library Modernization"', 
    time: '1d', 
    read: false 
  },
  { 
    id: 'n3', 
    title: 'Proposal "Renewable Energy Research" moved to Draft', 
    time: '3d', 
    read: true 
  }
];

export const stageLabelsList = [
  "Submitted",
  "R&D Evaluation", 
  "Evaluators Assessment",
  "Endorsement",
  "Funded"
];

export const commentsMap: Record<string, { 
  id: string; 
  text: string; 
  author?: string; 
  time: string; 
}[]> = {
  p2: [{ 
    id: 'c1', 
    text: 'Please clarify the methodology section.', 
    author: 'Evaluator A', 
    time: '2d' 
  }],
  p3: [{ 
    id: 'c2', 
    text: 'Budget needs revision.', 
    author: 'Evaluator B', 
    time: '1d' 
  }]
};

// NEW: Helper function to get status from currentIndex for cards and modals
export const getStatusFromIndex = (currentIndex: number): 'pending' | 'r&d evaluation' | 'evaluators assessment' | 'revise' | 'funded' | 'reject' => {
  const statusMap: Record<number, 'pending' | 'r&d evaluation' | 'evaluators assessment' | 'revise' | 'funded' | 'reject'> = {
    0: 'pending',
    1: 'r&d evaluation',
    2: 'evaluators assessment', 
    3: 'revise',
    4: 'funded',
    5: 'reject'
  };
  return statusMap[currentIndex] || 'pending';
};

// NEW: Helper function to get progress percentage from status for cards
export const getProgressPercentage = (status: string): number => {
  const progressMap: Record<string, number> = {
    'pending': 0,
    'r&d evaluation': 25,
    'evaluators assessment': 50,
    'revise': 10,
    'funded': 100,
    'reject': 0
  };
  return progressMap[status] || 0;
};

// NEW: Helper function to get status label for cards
export const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    'pending': 'Pending',
    'r&d evaluation': 'R&D Evaluation',
    'evaluators assessment': 'Evaluators Assessment', 
    'revise': 'Revision Required',
    'funded': 'Funded',
    'reject': 'Rejected'
  };
  return labels[status] || status;
};