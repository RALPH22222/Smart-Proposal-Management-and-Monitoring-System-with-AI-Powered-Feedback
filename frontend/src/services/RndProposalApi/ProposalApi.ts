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
		status: 'Revision Required',
		submittedBy: 'Prof. Juan dela Cruz',
		submittedDate: '2025-01-08T14:15:00Z',
		lastModified: '2025-01-12T10:20:00Z'
	},
	{
		id: 'PROP-2025-003',
		title: 'Blockchain-Based Academic Credential Verification System',
		documentUrl:
			'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
		status: 'Sent to Evaluators',
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
		status: 'Rejected Proposal',
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
