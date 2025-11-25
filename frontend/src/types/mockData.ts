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
];

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