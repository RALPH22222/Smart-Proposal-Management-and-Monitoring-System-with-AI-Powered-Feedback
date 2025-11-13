// Enhanced TypeScript interfaces for evaluator assignment and tracking
export interface Evaluator {
	id: string;
	name: string;
	email: string;
	specialty: string[];
	currentWorkload: number;
	maxWorkload: number;
	availabilityStatus: 'Available' | 'Busy' | 'Unavailable';
	avatar?: string;
	rating: number;
	completedReviews: number;
	department: string;
	agency: string;

}

export interface Assignment {
	id: string;
	proposalId: string;
	evaluatorId: string;
	assignedDate: string;
	deadline: string;
	status: ReviewStatus;
	timeRemaining: number; // in days
	biasFiltering: BiasFilteringOptions;
	assignedBy: string;
}

export type ReviewStatus =
	| 'Pending'
	| 'Under Review'
	| 'Rejected Proposal'
	| 'Finished Evaluating';

export interface BiasFilteringOptions {
	hideProponentName: boolean;
	hideOrganization: boolean;
}

export interface EvaluatorAssignmentData {
	proposalId: string;
	selectedEvaluators: string[];
	deadline: string;
	biasFiltering: BiasFilteringOptions;
	assignedBy: string;
}

export interface EndorsementProposal {
	id: string;
	title: string;
	submittedBy: string;
	evaluatorDecisions: EvaluatorDecision[];
	overallRecommendation: 'Approve' | 'Revise' | 'Reject';
	readyForEndorsement: boolean;
}

export interface EvaluatorDecision {
	evaluatorId: string;
	evaluatorName: string;
	decision: 'Approve' | 'Revise' | 'Reject';
	comments: string;
	submittedDate: string;
}

export interface TrackingTableRow {
	assignmentId: string;
	evaluatorName: string;
	specialty: string;
	proposalTitle: string;
	timeRemaining: number;
	status: ReviewStatus;
	deadline: string;
}