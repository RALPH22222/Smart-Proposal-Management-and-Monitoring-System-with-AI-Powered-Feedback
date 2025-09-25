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
