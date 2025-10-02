// TypeScript interfaces for the Proposal Management System
export interface Proposal {
	id: string;
	title: string;
	documentUrl: string;
	status: ProposalStatus;
	submittedBy: string;
	submittedDate: string;
	lastModified: string;
}

export type ProposalStatus = 'Pending' | 'Revisable' | 'Rejected' | 'Accepted';

export type DecisionType = 'Revise' | 'Reject' | 'Accept';

export interface Decision {
	proposalId: string;
	decision: DecisionType;
	notes: string;
	reviewedBy: string;
	reviewedDate: string;
}

export interface ProposalModalProps {
	proposal: Proposal | null;
	isOpen: boolean;
	onClose: () => void;
	onSubmitDecision: (decision: Decision) => void;
}

export interface Statistics {
	totalProposals: number;
	pendingProposals: number;
	acceptedProposals: number;
	rejectedProposals: number;
	revisableProposals: number;
	monthlySubmissions: { month: string; count: number }[];
}

export interface Activity {
	id: string;
	type: 'review' | 'submission' | 'revision';
	proposalId: string;
	proposalTitle: string;
	action: string;
	timestamp: string;
	user: string;
}
