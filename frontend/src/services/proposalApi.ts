import {
	type Proposal,
	type Decision,
	type ProposalStatus
} from '../types/proposal';

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
	}
};

// Dummy data for demonstration
const getDummyProposals = (): Proposal[] => [
	{
		id: 'PROP-2025-001',
		title:
			'Development of AI-Powered Student Learning Analytics Platform for Enhanced Academic Performance',
		documentUrl:
			'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
		status: 'Pending',
		submittedBy: 'Dr. Maria Santos',
		submittedDate: '2025-01-10T08:30:00Z',
		lastModified: '2025-01-10T08:30:00Z'
	},
	{
		id: 'PROP-2025-002',
		title: 'Sustainable Water Management System Using IoT and Machine Learning',
		documentUrl:
			'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
		status: 'Revisable',
		submittedBy: 'Prof. Juan dela Cruz',
		submittedDate: '2025-01-08T14:15:00Z',
		lastModified: '2025-01-12T10:20:00Z'
	},
	{
		id: 'PROP-2025-003',
		title: 'Blockchain-Based Academic Credential Verification System',
		documentUrl:
			'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
		status: 'Accepted',
		submittedBy: 'Dr. Angela Rivera',
		submittedDate: '2025-01-05T11:45:00Z',
		lastModified: '2025-01-11T16:30:00Z'
	},
	{
		id: 'PROP-2025-004',
		title: 'Mobile Health Monitoring Application for Remote Patient Care',
		documentUrl:
			'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
		status: 'Pending',
		submittedBy: 'Dr. Carlos Mendoza',
		submittedDate: '2025-01-12T09:00:00Z',
		lastModified: '2025-01-12T09:00:00Z'
	},
	{
		id: 'PROP-2025-005',
		title: 'Smart Campus Security System with Facial Recognition Technology',
		documentUrl:
			'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
		status: 'Rejected',
		submittedBy: 'Prof. Lisa Garcia',
		submittedDate: '2025-01-03T13:20:00Z',
		lastModified: '2025-01-09T14:45:00Z'
	},
	{
		id: 'PROP-2025-006',
		title: 'Virtual Reality Learning Environment for STEM Education',
		documentUrl:
			'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
		status: 'Pending',
		submittedBy: 'Dr. Roberto Fernandez',
		submittedDate: '2025-01-13T10:30:00Z',
		lastModified: '2025-01-13T10:30:00Z'
	}
];
