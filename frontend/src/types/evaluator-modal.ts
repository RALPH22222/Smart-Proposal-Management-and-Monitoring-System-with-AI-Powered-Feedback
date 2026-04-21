export interface EvaluatorDecision {
	evaluatorId: string;
	evaluatorName: string;
	decision: string;
	comments: string;
	submittedDate: string;
	evaluatorProfilePicture?: string | null;
}

export interface EvaluatorDecisionModalProps {
	isOpen: boolean;
	onClose: () => void;
	decision: EvaluatorDecision;
	proposalTitle: string;
	proposalId: string;
}