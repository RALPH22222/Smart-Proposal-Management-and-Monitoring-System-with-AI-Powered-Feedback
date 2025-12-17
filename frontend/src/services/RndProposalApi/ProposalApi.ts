import {
	type Proposal,
	type Decision,
	type ProposalStatus,
	type Statistics,
	type Activity
} from '../../types/InterfaceProposal';

// API service functions (stubbed for demo)
export const proposalApi = {
	// Fetch all proposals for R&D staff review
	fetchProposals: async (): Promise<Proposal[]> => {
		// Simulate API delay
		await new Promise((resolve) => setTimeout(resolve, 500));

		// In real implementation, this would be:
		// const response = await fetch('/api/proposals');
		// return response.json();

		console.log('Fetching proposals from API...');
		return getDummyProposals();
	},

	// Submit decision for a proposal
	submitDecision: async (decision: Decision): Promise<void> => {
		// Simulate API delay
		await new Promise((resolve) => setTimeout(resolve, 300));

		// In real implementation, this would be:
		// await fetch('/api/proposals/decisions', {
		//   method: 'POST',
		//   headers: { 'Content-Type': 'application/json' },
		//   body: JSON.stringify(decision)
		// });

		console.log('Submitting decision to API:', decision);
	},

	// Update proposal status
	updateProposalStatus: async (
		proposalId: string,
		status: ProposalStatus
	): Promise<void> => {
		// Simulate API delay
		await new Promise((resolve) => setTimeout(resolve, 200));

		// In real implementation, this would be:
		// await fetch(`/api/proposals/${proposalId}/status`, {
		//   method: 'PATCH',
		//   headers: { 'Content-Type': 'application/json' },
		//   body: JSON.stringify({ status })
		// });

		console.log(`Updating proposal ${proposalId} status to ${status}`);
	},

	// Fetch statistics
	fetchStatistics: async (): Promise<Statistics> => {
		await new Promise((resolve) => setTimeout(resolve, 300));

		console.log('Fetching statistics from API...');
		return getDummyStatistics();
	},

	// Fetch recent activity
	fetchRecentActivity: async (): Promise<Activity[]> => {
		await new Promise((resolve) => setTimeout(resolve, 200));

		console.log('Fetching recent activity from API...');
		return getDummyActivity();
	}
};

// Enhanced dummy data with detailed proposal information
const getDummyProposals = (): Proposal[] => [
  {
    id: 'PROP-2025-001',
    title: 'Development of AI-Powered Student Learning Analytics Platform for Enhanced Academic Performance',
    documentUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    status: 'Pending',
    projectFile: "development_ai.pdf",
    submittedBy: 'Dr. Maria Santos',
    submittedDate: '2025-01-10T08:30:00Z',
    lastModified: '2025-01-10T08:30:00Z',                     
    proponent: 'Dr. Maria Santos',
    gender: 'Female',
    agency: "Western Mindanao State University",
    address: "Normal Road, Baliwasan",
    telephone: '(062) 991-1771',
    fax: 'N/A',
    email: 'm.santos@wmsu.edu.ph',
    modeOfImplementation: 'Multi Agency',
    implementationSites: [
      { site: 'Main Campus', city: 'Zamboanga City' },
      { site: 'Satellite Campus', city: 'Pagadian City' }
    ],
    priorityAreas: 'Artificial Intelligence in Education',
    projectType: 'ICT',
    cooperatingAgencies: 'DepEd RO9, CHED RO9, DICT RO9',
    rdStation: 'College of Computing Studies',
    classification: 'Development',
    classificationDetails: 'Pilot Testing',
    sector: 'Education Technology',
    discipline: 'Information and Communication Technology',
    duration: '24 months',
    startDate: 'April 2025',
    endDate: 'March 2027',
    budgetSources: [
      {
        source: 'DOST',
        ps: '₱600,000.00',
        mooe: '₱500,000.00',
        co: '₱150,000.00',
        total: '₱1,250,000.00',
      },
    ],
    budgetTotal: '₱1,250,000.00',
    assignedEvaluators: [],
    evaluatorInstruction: ''
    
  },
  {
    id: 'PROP-2025-002',
    title: 'Sustainable Water Management System Using IoT and Machine Learning',
    documentUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    status: 'Revision Required',
    projectFile: "research_proposal_document.pdf",
    submittedBy: 'Prof. Juan dela Cruz',
    submittedDate: '2025-01-08T14:15:00Z',
    lastModified: '2025-01-12T10:20:00Z',
    proponent: 'Prof. Juan dela Cruz',
    gender: 'Male',
    agency: "Western Mindanao State University",
    address: "Normal Road, Baliwasan",
    telephone: '(062) 991-2002',
    fax: 'N/A',
    email: 'j.delacruz@zscmst.edu.ph',
    modeOfImplementation: 'Multi Agency',
    implementationSites: [
      { site: 'Main Campus', city: 'Zamboanga City' },
      { site: 'Satellite Campus', city: 'Pagadian City' }
    ],
    priorityAreas: 'Renewable Energy & Smart Grids',
    projectType: 'Energy',
    cooperatingAgencies: 'DA RO9, DTI RO9, LGU Zamboanga',
    rdStation: 'Agricultural Research Center',
    classification: 'Development',
    classificationDetails: 'Technology Promotion/Commercialization',
    sector: 'Agriculture and Fisheries',
    discipline: 'Agricultural Engineering',
    duration: '36 months',
    startDate: 'March 2025',
    endDate: 'February 2028',
    budgetSources: [
      {
        source: 'DOST',
        ps: '₱800,000.00',
        mooe: '₱700,000.00',
        co: '₱100,000.00',
        total: '₱1,600,000.00',
      },
      {
        source: 'DA RO9',
        ps: '₱300,000.00',
        mooe: '₱200,000.00',
        co: '₱0.00',
        total: '₱500,000.00',
      },
    ],
    budgetTotal: '₱2,100,000.00',
    assignedEvaluators: [],
    evaluatorInstruction: ''
    
  },
  {
    id: 'PROP-2025-003',
    title: 'Blockchain-Based Academic Credential Verification System',
    documentUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    status: 'Sent to Evaluators',
    projectFile: "research_proposal_document.pdf",
    submittedBy: 'Dr. Angela Rivera',
    submittedDate: '2025-01-05T11:45:00Z',
    lastModified: '2025-01-11T16:30:00Z',
    proponent: 'Dr. Angela Rivera',
    gender: 'Female',
    agency: "Western Mindanao State University",
    address: "Normal Road, Baliwasan",
    telephone: '(062) 991-3333',
    fax: '(062) 991-3334',
    email: 'a.rivera@zcmc.doh.gov.ph',
    modeOfImplementation: 'Single Agency',
    implementationSites: [
      { site: 'Main Campus', city: 'Zamboanga City' }
    ],
    priorityAreas: 'Internet of Things (IoT)',
    projectType: 'ICT',
    cooperatingAgencies: 'DOH RO9, PhilHealth RO9, DICT RO9',
    rdStation: 'Medical Informatics Department',
    classification: 'Research',
    classificationDetails: 'Applied',
    sector: 'Health and Wellness',
    discipline: 'Health Information Technology',
    duration: '30 months',
    startDate: 'February 2025',
    endDate: 'July 2027',
    budgetSources: [
      {
        source: 'DOST',
        ps: '₱700,000.00',
        mooe: '₱800,000.00',
        co: '₱300,000.00',
        total: '₱1,800,000.00',
      },
    ],
    budgetTotal: '₱1,800,000.00',
    assignedEvaluators: [
      'Dr. John Joseph',
      'Engr. Amelia Reyes'
    ],
    evaluatorInstruction: 'Please focus strictly on the methodology and the budget feasibility. We need this reviewed by Friday.'
  },
  {
    id: 'PROP-2025-004',
    title: 'Mobile Health Monitoring Application for Remote Patient Care',
    documentUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    status: 'Pending',
    projectFile: "research_proposal_document.pdf",
    submittedBy: 'Dr. Carlos Mendoza',
    submittedDate: '2025-01-12T09:00:00Z',
    lastModified: '2025-01-12T09:00:00Z',
    proponent: 'Dr. Carlos Mendoza',
    gender: 'Male',
    agency: "Western Mindanao State University",
    address: "Normal Road, Baliwasan",
    telephone: '(062) 991-4444',
    fax: 'N/A',
    email: 'c.mendoza@msu.edu.ph',
    modeOfImplementation: 'Single Agency',
    implementationSites: [
      { site: 'Main Campus', city: 'Zamboanga City' }
    ],
    priorityAreas: 'Quantum Computing',
    projectType: 'Healthcare',
    cooperatingAgencies: 'DOST RO9, DICT RO9, Private Sector',
    rdStation: 'Computer Science Research Lab',
    classification: 'Research',
    classificationDetails: 'Applied',
    sector: 'Information Technology',
    discipline: 'Computer Science',
    duration: '24 months',
    startDate: 'April 2025',
    endDate: 'March 2027',
    budgetSources: [
      {
        source: 'DOST',
        ps: '₱1,000,000.00',
        mooe: '₱900,000.00',
        co: '₱400,000.00',
        total: '₱2,300,000.00',
      },
      {
        source: 'MSU',
        ps: '₱150,000.00',
        mooe: '₱50,000.00',
        co: '₱0.00',
        total: '₱200,000.00',
      },
    ],
    budgetTotal: '₱2,500,000.00',
    assignedEvaluators: [],
    evaluatorInstruction: ''
  },
  {
    id: 'PROP-2025-005',
    title: 'Smart Campus Security System with Facial Recognition Technology',
    documentUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    status: 'Rejected Proposal',
    projectFile: "research_proposal_document.pdf",
    submittedBy: 'Prof. Lisa Garcia',
    submittedDate: '2025-01-03T13:20:00Z',
    lastModified: '2025-01-09T14:45:00Z',
    proponent: 'Prof. Lisa Garcia',
    gender: 'Female',
    agency: "Western Mindanao State University",
    address: "Normal Road, Baliwasan",
    telephone: '(062) 991-5555',
    fax: 'N/A',
    email: 'l.garcia@msu.edu.ph',
    modeOfImplementation: 'Multi Agency',
    implementationSites: [
      { site: 'Main Campus', city: 'Zamboanga City' },
      { site: 'Satellite Campus', city: 'Pagadian City' }
    ],
    priorityAreas: 'Energy Storage Systems',
    projectType: 'Public Safety',
    cooperatingAgencies: 'DOE RO9, NEDA RO9, Private Sector Partners',
    rdStation: 'Renewable Energy Research Lab',
    classification: 'Development',
    classificationDetails: 'Technology Promotion/Commercialization',
    sector: 'Energy and Power',
    discipline: 'Electrical Engineering',
    duration: '24 months',
    startDate: 'April 2025',
    endDate: 'March 2027',
    budgetSources: [
      {
        source: 'DOST',
        ps: '₱1,200,000.00',
        mooe: '₱800,000.00',
        co: '₱300,000.00',
        total: '₱2,300,000.00',
      },
      {
        source: 'DOE RO9',
        ps: '₱100,000.00',
        mooe: '₱100,000.00',
        co: '₱0.00',
        total: '₱200,000.00',
      },
    ],
    budgetTotal: '₱2,500,000.00',
    assignedEvaluators: [],
    evaluatorInstruction: ''
  },
  {
    id: 'PROP-2025-006',
    title: 'Virtual Reality Learning Environment for STEM Education',
    documentUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    status: 'Pending',
    projectFile: "virtual_reality_learning.pdf", 
    submittedBy: 'Dr. Roberto Fernandez',
    submittedDate: '2025-01-13T10:30:00Z',
    lastModified: '2025-01-13T10:30:00Z',
    proponent: 'Dr. Roberto Fernandez',
    gender: 'Male',
    agency: "Western Mindanao State University",
    address: "Normal Road, Baliwasan",
    telephone: '(062) 991-6666',
    fax: 'N/A',
    email: 'r.fernandez@adzu.edu.ph',
    modeOfImplementation: 'Single Agency',
    implementationSites: [
      { site: 'Main Campus', city: 'Zamboanga City' }
    ],
    priorityAreas: 'Artificial Intelligence',
    projectType: 'ICT',
    cooperatingAgencies: 'DOST RO9, DICT RO9',
    rdStation: 'AI Research Center',
    classification: 'Research',
    classificationDetails: 'Applied',
    sector: 'Artificial Intelligence',
    discipline: 'Computer Science and Mathematics',
    duration: '18 months',
    startDate: 'May 2025',
    endDate: 'October 2026',
    budgetSources: [
      {
        source: 'DOST',
        ps: '₱700,000.00',
        mooe: '₱600,000.00',
        co: '₱200,000.00',
        total: '₱1,500,000.00',
      },
    ],
    budgetTotal: '₱1,500,000.00',
    assignedEvaluators: [],
    evaluatorInstruction: ''
  }
];

// Dummy statistics for demonstration
const getDummyStatistics = (): Statistics => ({
	totalProposals: 6,
	pendingProposals: 3,
	acceptedProposals: 1,
	rejectedProposals: 1,
	revisionRequiredProposals: 1,
	monthlySubmissions: [
		{ month: 'Jan 2025', count: 6 },
		{ month: 'Dec 2024', count: 4 },
		{ month: 'Nov 2024', count: 8 },
		{ month: 'Oct 2024', count: 5 },
		{ month: 'Sep 2024', count: 7 }
	]
});

// Dummy activity for demonstration
const getDummyActivity = (): Activity[] => [
	{
		id: 'ACT-001',
		type: 'review',
		proposalId: 'PROP-2025-003',
		proposalTitle: 'Blockchain-Based Academic Credential Verification System',
		action: 'Proposal accepted',
		timestamp: '2025-01-11T16:30:00Z',
		user: 'Dr. John Smith'
	},
	{
		id: 'ACT-002',
		type: 'submission',
		proposalId: 'PROP-2025-006',
		proposalTitle: 'Virtual Reality Learning Environment for STEM Education',
		action: 'New proposal submitted',
		timestamp: '2025-01-13T10:30:00Z',
		user: 'Dr. Roberto Fernandez'
	},
	{
		id: 'ACT-003',
		type: 'revision',
		proposalId: 'PROP-2025-002',
		proposalTitle:
			'Sustainable Water Management System Using IoT and Machine Learning',
		action: 'Revision requested',
		timestamp: '2025-01-12T10:20:00Z',
		user: 'Dr. John Smith'
	},
	{
		id: 'ACT-004',
		type: 'review',
		proposalId: 'PROP-2025-005',
		proposalTitle:
			'Smart Campus Security System with Facial Recognition Technology',
		action: 'Proposal rejected',
		timestamp: '2025-01-09T14:45:00Z',
		user: 'Dr. John Smith'
	},
	{
		id: 'ACT-005',
		type: 'submission',
		proposalId: 'PROP-2025-004',
		proposalTitle:
			'Mobile Health Monitoring Application for Remote Patient Care',
		action: 'New proposal submitted',
		timestamp: '2025-01-12T09:00:00Z',
		user: 'Dr. Carlos Mendoza'
	}
];
