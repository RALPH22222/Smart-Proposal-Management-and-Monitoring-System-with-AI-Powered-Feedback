import {
	type Proposal,
	type ProposalStatus,
    type Statistics,
} from '../../types/InterfaceProposal';

// Simplified Admin API service
export const adminProposalApi = {
	// Fetch all proposals for Admin review (can be different filter than R&D)
	fetchProposals: async (): Promise<Proposal[]> => {
		// Simulate API delay
		await new Promise((resolve) => setTimeout(resolve, 600));
        console.log('Fetching proposals for Admin from API...');
		return getDummyAdminProposals();
	},

	// Submit final admin decision
	submitAdminDecision: async (decision: any): Promise<void> => {
		await new Promise((resolve) => setTimeout(resolve, 400));
		console.log('Submitting Admin decision:', decision);
	},

	// Update proposal status (Admin override)
	updateProposalStatus: async (
		proposalId: string,
		status: ProposalStatus
	): Promise<void> => {
		await new Promise((resolve) => setTimeout(resolve, 300));
		console.log(`Admin updating proposal ${proposalId} status to ${status}`);
	},

    // Fetch Admin Dashboard Stats
    fetchAdminStatistics: async (): Promise<Statistics> => {
        await new Promise((resolve) => setTimeout(resolve, 300));
        return {
            totalProposals: 12,
            pendingProposals: 5,
            acceptedProposals: 4,
            rejectedProposals: 3,
            revisionRequiredProposals: 0,
            monthlySubmissions: [
                { month: 'Jan 2025', count: 12 },
                { month: 'Dec 2024', count: 8 },
            ]
        };
    }
};

// Admin-specific dummy data (can be tailored)
const getDummyAdminProposals = (): Proposal[] => [
  {
    id: 'PROP-2025-008',
    title: 'Smart City Traffic Management System using IoT',
    documentUrl: 'https://example.com/doc.pdf',
    status: 'Endorsed', // Ready for admin funding check
    projectFile: "traffic_iot.pdf",
    submittedBy: 'Engr. David Lee',
    submittedDate: '2025-01-22T08:30:00Z',
    lastModified: '2025-01-24T08:30:00Z',                     
    proponent: 'Engr. David Lee',
    gender: 'Male',
    agency: "City Eng",
    address: "Manila",
    telephone: 'N/A',
    fax: 'N/A',
    email: 'd.lee@city.gov.ph',
    modeOfImplementation: 'Single',
    implementationSites: [],
    priorityAreas: 'Smart City',
    projectType: 'ICT',
    cooperatingAgencies: 'LTO',
    rdStation: 'Traffic Lab',
    classification: 'Development',
    classificationDetails: 'Pilot',
    sector: 'ICT',
    discipline: 'IT',
    duration: '24 months',
    startDate: 'June 2025',
    endDate: 'May 2027',
    budgetSources: [
      { source: 'DOST', ps: '₱600,000', mooe: '₱500,000', co: '₱150,000', total: '₱1,250,000' }
    ],
    budgetTotal: '₱1,250,000',
    assignedEvaluators: [],
    evaluatorInstruction: '',
    rdStaffReviewer: 'RD Staff 1',
    endorsementJustification: 'High impact potential for urban development. Technical architecture is sound.'
  },
  {
    id: 'PROP-2025-007',
    title: 'Automated Traffic Control System',
    documentUrl: 'https://example.com/doc.pdf',
    status: 'Waiting for Funding',
    projectFile: "traffic.pdf",
    submittedBy: 'Engr. Sarah Lee',
    submittedDate: '2025-01-14T09:00:00Z',
    lastModified: '2025-01-21T09:00:00Z',
    proponent: 'Engr. Sarah Lee',
    gender: 'Female',
    agency: "CEO",
    address: "Zamboanga City",
    telephone: 'N/A',
    fax: 'N/A',
    email: 's.lee@email.com',
    modeOfImplementation: 'Single',
    implementationSites: [],
    priorityAreas: 'Smart City',
    projectType: 'ICT',
    cooperatingAgencies: 'LTO',
    rdStation: 'Smart Lab',
    classification: 'Development',
    classificationDetails: 'Pilot',
    sector: 'ICT',
    discipline: 'CpE',
    duration: '12 months',
    startDate: 'June 2025',
    endDate: 'May 2026',
    budgetSources: [ { source: 'LGU', ps: '₱500,000', mooe: '₱200,000', co: '₱300,000', total: '₱1,000,000' } ],
    budgetTotal: '₱1,000,000',
    assignedEvaluators: [],
    evaluatorInstruction: '',
    rdStaffReviewer: 'RD Staff 2',
    endorsementJustification: 'Highly relevant to city needs.'
  },
   {
    id: 'PROP-2025-009',
    title: 'Hybrid Solar-Wind Energy System',
    documentUrl: 'https://example.com/doc.pdf',
    status: 'Funded', // Already funded
    projectFile: "energy.pdf",
    submittedBy: 'Engr. Tom Cruz',
    submittedDate: '2024-11-15T13:00:00Z',
    lastModified: '2025-01-05T14:00:00Z',
    proponent: 'Engr. Tom Cruz',
    gender: 'Male',
    agency: "DA",
    address: "Zamboanga City",
    telephone: 'N/A',
    fax: 'N/A',
    email: 't.cruz@email.com',
    modeOfImplementation: 'Single',
    implementationSites: [],
    priorityAreas: 'Energy',
    projectType: 'Agriculture',
    cooperatingAgencies: 'NIA',
    rdStation: 'Agri Lab',
    classification: 'Development',
    classificationDetails: 'Rollout',
    sector: 'Energy',
    discipline: 'Agri Eng',
    duration: '18 months',
    startDate: 'Jan 2025',
    endDate: 'June 2026',
    budgetSources: [ { source: 'DA', ps: '₱2M', mooe: '₱1M', co: '₱500k', total: '₱3.5M' } ],
    budgetTotal: '₱3,500,000',
    assignedEvaluators: [],
    evaluatorInstruction: '',
    rdStaffReviewer: 'RD Staff 3',
    endorsementJustification: 'Critical infrastructure project.'
  }
];
