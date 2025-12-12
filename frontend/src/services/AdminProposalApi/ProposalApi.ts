import {
  type Proposal,
  type Decision,
  type ProposalStatus,
  type Statistics,
  type Activity
} from '../../types/InterfaceProposal';

// Admin-specific API service
export const adminProposalApi = {
  // Fetch all proposals for Admin review
  fetchProposals: async (): Promise<Proposal[]> => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    console.log('Fetching ADMIN proposals from API...');
    return getAdminDummyProposals();
  },

  // Submit decision (Admin override/assignment)
  submitDecision: async (decision: Decision): Promise<void> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    console.log('Admin submitting decision:', decision);
  },

  // Update proposal status
  updateProposalStatus: async (
    proposalId: string,
    status: ProposalStatus
  ): Promise<void> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    console.log(`Admin updating proposal ${proposalId} status to ${status}`);
  },

  // Fetch Admin statistics
  fetchStatistics: async (): Promise<Statistics> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return getAdminDummyStatistics();
  },

  // Fetch Admin recent activity
  fetchRecentActivity: async (): Promise<Activity[]> => {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return getAdminDummyActivity();
  }
};

// --- ADMIN MOCK DATA ---

const getAdminDummyProposals = (): Proposal[] => [
  {
    id: 'PROP-2025-ADMIN-01',
    title: 'Automated Drone Surveillance for Campus Security',
    documentUrl: '#',
    status: 'Revised Proposal', // Status is Revised
    projectFile: "drone_security.pdf",
    submittedBy: 'Engr. Victor Magtanggol',
    submittedDate: '2025-02-10T08:30:00Z',
    lastModified: '2025-02-11T09:00:00Z',
    proponent: 'Engr. Victor Magtanggol',
    gender: 'Male',
    agency: [
        { name: "Western Mindanao State University", address: "Normal Road, Baliwasan" },
        { name: "DOST Region IX", address: "Pettit Barracks, Z.C." }
      ],
    telephone: '(062) 991-0001',
    fax: 'N/A',
    email: 'v.magtanggol@wmsu.edu.ph',
    modeOfImplementation: 'Single Agency',
    priorityAreas: 'Public Safety',
    projectType: 'Public Safety',
    cooperatingAgencies: 'PNP, LGU',
    rdStation: 'Robotics Lab',
    classification: 'Development',
    classificationDetails: 'Prototype',
    sector: 'Engineering',
    discipline: 'Electronics Engineering',
    duration: '12 months',
    startDate: 'May 2025',
    endDate: 'May 2026',
    budgetSources: [
      { source: 'WMSU', ps: '₱200,000', mooe: '₱100,000', co: '₱500,000', total: '₱800,000' }
    ],
    budgetTotal: '₱800,000',
    // CHANGED: Removed assignedRdStaff so it is "Just" a revised proposal (Unassigned)
    assignedRdStaff: undefined, 
  },
  {
    id: 'PROP-2025-ADMIN-02',
    title: 'Preservation of Zamboanga Chavacano through NLP',
    documentUrl: '#',
    status: 'Pending',
    projectFile: "chavacano_nlp.pdf",
    submittedBy: 'Prof. Maria Clara',
    submittedDate: '2025-02-12T14:15:00Z',
    lastModified: '2025-02-12T14:15:00Z',
    proponent: 'Prof. Maria Clara',
    gender: 'Female',
    agency: [
        { name: "Western Mindanao State University", address: "Normal Road, Baliwasan" },
        { name: "DOST Region IX", address: "Pettit Barracks, Z.C." }
      ],
    telephone: '(062) 991-0002',
    fax: 'N/A',
    email: 'm.clara@wmsu.edu.ph',
    modeOfImplementation: 'Single Agency',
    priorityAreas: 'Cultural Heritage',
    projectType: 'ICT',
    cooperatingAgencies: 'National Museum',
    rdStation: 'Social Sciences Lab',
    classification: 'Research',
    classificationDetails: 'Basic',
    sector: 'Social Sciences',
    discipline: 'Linguistics',
    duration: '24 months',
    startDate: 'June 2025',
    endDate: 'June 2027',
    budgetSources: [
      { source: 'NCCA', ps: '₱300,000', mooe: '₱150,000', co: '₱50,000', total: '₱500,000' }
    ],
    budgetTotal: '₱500,000',
    // UNASSIGNED SCENARIO
    assignedRdStaff: undefined, 
  },
  {
    id: 'PROP-2025-ADMIN-03',
    title: 'Hydroponics Automation for Urban Farming',
    documentUrl: '#',
    status: 'Sent to Evaluators',
    projectFile: "hydroponics.pdf",
    submittedBy: 'Dr. Juan Dela Cruz',
    submittedDate: '2025-02-05T11:45:00Z',
    lastModified: '2025-02-06T09:30:00Z',
    proponent: 'Dr. Juan Dela Cruz',
    gender: 'Male',
    agency: [
        { name: "Western Mindanao State University", address: "Normal Road, Baliwasan" },
        { name: "DOST Region IX", address: "Pettit Barracks, Z.C." }
      ],
    telephone: '(062) 991-0003',
    fax: 'N/A',
    email: 'j.delacruz@wmsu.edu.ph',
    modeOfImplementation: 'Multi Agency',
    priorityAreas: 'Food Security',
    projectType: 'Agriculture',
    cooperatingAgencies: 'DA',
    rdStation: 'Agri-Tech Center',
    classification: 'Development',
    classificationDetails: 'Pilot Testing',
    sector: 'Agriculture',
    discipline: 'Agricultural Engineering',
    duration: '18 months',
    startDate: 'May 2025',
    endDate: 'Nov 2026',
    budgetSources: [
      { source: 'DA', ps: '₱500,000', mooe: '₱200,000', co: '₱300,000', total: '₱1,000,000' }
    ],
    budgetTotal: '₱1,000,000',
    // MANUALLY ASSIGNED SCENARIO
    assignedRdStaff: 'Prof. Ben Reyes',
  },
  {
    id: 'PROP-2025-ADMIN-04',
    title: 'Solar-Powered Water Filtration for Remote Barangays',
    documentUrl: '#',
    status: 'Assigned to RnD',
    projectFile: "solar_water.pdf",
    submittedBy: 'Engr. Sarah Al-Fayed',
    submittedDate: '2025-02-14T09:00:00Z',
    lastModified: '2025-02-14T09:00:00Z',
    proponent: 'Engr. Sarah Al-Fayed',
    gender: 'Female',
    agency: [
        { name: "Western Mindanao State University", address: "Normal Road, Baliwasan" },
        { name: "DOST Region IX", address: "Pettit Barracks, Z.C." }
      ],
    telephone: '(062) 991-0004',
    fax: 'N/A',
    email: 's.alfayed@wmsu.edu.ph',
    modeOfImplementation: 'Multi Agency',
    priorityAreas: 'Water & Energy',
    projectType: 'Energy',
    cooperatingAgencies: 'DOST',
    rdStation: 'Energy Lab',
    classification: 'Development',
    classificationDetails: 'Technology Promotion',
    sector: 'Energy',
    discipline: 'Mechanical Engineering',
    duration: '12 months',
    startDate: 'July 2025',
    endDate: 'July 2026',
    budgetSources: [
      { source: 'DOST', ps: '₱400,000', mooe: '₱300,000', co: '₱800,000', total: '₱1,500,000' }
    ],
    budgetTotal: '₱1,500,000',
    // ASSIGNED SCENARIO - This will show the "Change R&D" button
    assignedRdStaff: 'Engr. Carla Lim',
  },
  {
    id: 'PROP-2025-ADMIN-05',
    title: 'Mental Health Chatbot for Students',
    documentUrl: '#',
    status: 'Revision Required',
    projectFile: "health_chatbot.pdf",
    submittedBy: 'Dr. psychology Lead',
    submittedDate: '2025-01-20T13:20:00Z',
    lastModified: '2025-01-25T15:00:00Z',
    proponent: 'Dr. psychology Lead',
    gender: 'Male',
    agency: [
        { name: "Western Mindanao State University", address: "Normal Road, Baliwasan" },
        { name: "DOST Region IX", address: "Pettit Barracks, Z.C." }
      ],
    telephone: '(062) 991-0005',
    fax: 'N/A',
    email: 'psy.lead@wmsu.edu.ph',
    modeOfImplementation: 'Single Agency',
    priorityAreas: 'Health',
    projectType: 'Healthcare',
    cooperatingAgencies: 'DOH',
    rdStation: 'Health Info Lab',
    classification: 'Research',
    classificationDetails: 'Applied',
    sector: 'Health',
    discipline: 'Psychology',
    duration: '12 months',
    startDate: 'April 2025',
    endDate: 'April 2026',
    budgetSources: [
      { source: 'WMSU', ps: '₱100,000', mooe: '₱50,000', co: '₱0', total: '₱150,000' }
    ],
    budgetTotal: '₱150,000',
    assignedRdStaff: 'Dr. Alice Santos',
  }
];

const getAdminDummyStatistics = (): Statistics => ({
  totalProposals: 125,
  pendingProposals: 15,
  acceptedProposals: 45,
  rejectedProposals: 10,
  revisionRequiredProposals: 8,
  monthlySubmissions: [
    { month: 'Jan 2025', count: 20 },
    { month: 'Dec 2024', count: 15 },
    { month: 'Nov 2024', count: 18 },
    { month: 'Oct 2024', count: 22 },
    { month: 'Sep 2024', count: 12 }
  ]
});

const getAdminDummyActivity = (): Activity[] => [
  {
    id: 'ACT-ADMIN-001',
    type: 'review',
    proposalId: 'PROP-2025-ADMIN-03',
    proposalTitle: 'Hydroponics Automation for Urban Farming',
    action: 'Manually Assigned to Prof. Ben Reyes',
    timestamp: '2025-02-06T09:30:00Z',
    user: 'Admin User'
  },
  {
    id: 'ACT-ADMIN-002',
    type: 'submission',
    proposalId: 'PROP-2025-ADMIN-04',
    proposalTitle: 'Solar-Powered Water Filtration',
    action: 'Auto-assigned to Engr. Carla Lim',
    timestamp: '2025-02-14T09:00:00Z',
    user: 'System Bot'
  }
];