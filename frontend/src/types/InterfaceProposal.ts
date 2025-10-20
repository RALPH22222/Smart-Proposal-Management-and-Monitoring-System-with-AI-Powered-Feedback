// Enhanced TypeScript interfaces for the Advanced Proposal Management System
export interface Proposal {
	id: string;
	title: string;
	documentUrl: string;
	status: ProposalStatus;
	submittedBy: string;
	submittedDate: string;
	lastModified: string;
	category?: string;
	budget?: number;
	duration?: string;
	assignedEvaluators?: string[];
	evaluationDeadline?: string;
	rdStaffReviewer?: string;
}

export type ProposalStatus =
	| 'Pending'
	| 'Under Review'
	| 'Sent to Evaluators'
	| 'Revision Required'
	| 'Rejected Proposal';

export type DecisionType =
	| 'Sent to Evaluators'
	| 'Revision Required'
	| 'Rejected Proposal';

export interface CommentSection {
	id: string;
	title: string;
	content: string;
	lastModified: string;
	author: string;
}

export interface StructuredComments {
	introduction: CommentSection;
	methodology: CommentSection;
	projectScope: CommentSection;
	conclusion: CommentSection;
	budget?: CommentSection;
	references?: CommentSection;
	additional: CommentSection[];
}

export interface AttachmentFile {
	id: string;
	name: string;
	url: string;
	uploadedBy: string;
	uploadedDate: string;
	type: string;
	size: number;
}

export interface Decision {
	proposalId: string;
	decision: DecisionType;
	structuredComments: StructuredComments;
	attachments: AttachmentFile[];
	reviewedBy: string;
	reviewedDate: string;
	evaluationDeadline?: string;
}

export interface Reviewer {
	id: string;
	name: string;
	email: string;
	role: 'R&D Staff' | 'Evaluator';
	avatar?: string;
	isOnline?: boolean;
}

export interface EvaluatorFeedback {
	id: string;
	proposalId: string;
	evaluatorId: string;
	structuredComments: StructuredComments;
	attachments: AttachmentFile[];
	status: 'Pending' | 'In Progress' | 'Completed';
	submittedDate?: string;
	lastModified: string;
}

export interface CollaborationSession {
	proposalId: string;
	activeEvaluators: Reviewer[];
	typingIndicators: { [evaluatorId: string]: string };
	lastActivity: string;
}

export interface ProposalModalProps {
	proposal: Proposal | null;
	isOpen: boolean;
	onClose: () => void;
	onSubmitDecision: (decision: Decision) => void;
	userRole: 'R&D Staff' | 'Evaluator';
}

export interface Statistics {
	totalProposals: number;
	pendingProposals: number;
	acceptedProposals: number;
	rejectedProposals: number;
	revisionRequiredProposals: number;
	monthlySubmissions: {
		month: string;
		count: number;
	}[];
}

export interface Activity {
	id: string;
	type: 'review' | 'submission' | 'revision' | 'evaluation' | 'collaboration';
	proposalId: string;
	proposalTitle: string;
	action: string;
	timestamp: string;
	user: string;
	details?: string;
}
