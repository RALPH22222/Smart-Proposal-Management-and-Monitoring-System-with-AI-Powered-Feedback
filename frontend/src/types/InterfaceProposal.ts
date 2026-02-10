// Enhanced TypeScript interfaces for the Advanced Proposal Management System
export interface BudgetSource {
	source: string;
	ps: string;
	mooe: string;
	co: string;
	total: string;
}

interface Site {
	site: string;
	city: string;
}

export interface Proposal {
	id: string;
	title: string;
	documentUrl: string;
	status: ProposalStatus;
	submittedBy: string;
	submittedDate: string;
	lastModified: string;
	proponent: string;
	gender: string;
	telephone: string;
	fax: string;
	email: string;
	projectType: string;
	agency: string;
	address: string;
	department?: string;
	cooperatingAgencies: string;
	rdStation: string;
	classification: string;
	classificationDetails: string;
	modeOfImplementation: string;
	implementationSites: Site[];
	priorityAreas: string;
	sector: string;
	discipline: string;
	duration: string;
	startDate: string;
	endDate: string;
	budgetSources: BudgetSource[];
	budgetTotal: string;
	projectFile?: string;
	endorsementJustification?: string;
	rdStaffReviewer?: string;
	evaluationDeadline?: string;
	assignedRdStaff?: string;
	rdCommentsToEvaluator?: string;
	assignedEvaluators?: string[];
	evaluatorInstruction?: string;
	tags?: string[];
}

export type ProposalStatus =
	| 'Pending'
	| 'Under R&D Review'
	| 'Under Evaluators Assessment'
	| 'Revision Required'
	| 'Rejected Proposal'
	| 'Revised Proposal'
	| 'Assigned to RnD'
	| 'Endorsed'
	| 'Waiting for Funding'
	| 'Funded'
	| 'Unassigned'
	| 'Under Review' // Keep for backward compatibility if needed
	| 'Sent to Evaluators'; // Keep for backward compatibility if needed

export type DecisionType =
	| 'Sent to Evaluators'
	| 'Revision Required'
	| 'Rejected Proposal'
	| 'Assign to RnD';

export interface CommentSection {
	id: string;
	title: string;
	content: string;
	lastModified: string;
	author: string;
}

export interface StructuredComments {
	objectives: CommentSection;
	methodology: CommentSection;
	budget: CommentSection;
	timeline: CommentSection;
	overall: CommentSection;
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
	assignedEvaluators?: string[];
	assignedRdStaffId?: string;
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
