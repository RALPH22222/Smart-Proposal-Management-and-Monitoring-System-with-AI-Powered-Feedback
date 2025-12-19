export interface EvaluatorDecision {
	evaluatorId: string;
	evaluatorName: string;
	decision: string;
	comments: string;
	submittedDate: string;
}

export interface EvaluatorDecisionModalProps {
	isOpen: boolean;
	onClose: () => void;
	decision: EvaluatorDecision;
	proposalTitle: string;
	proposalId: string;
}