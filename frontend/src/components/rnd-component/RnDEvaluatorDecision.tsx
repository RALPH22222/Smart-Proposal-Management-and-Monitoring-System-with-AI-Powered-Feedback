import React from 'react';
import {
	CheckCircle,
	XCircle,
	RotateCcw,
	FileText,
	MessageSquare,
	Clock,
	Calendar,
	X,
	User
} from 'lucide-react';

interface EvaluatorDecision {
	evaluatorId: string;
	evaluatorName: string;
	decision: string;
	comments: string;
	submittedDate: string;
	evaluatorDepartment?: string;
	evaluatorEmail?: string;
	ratings?: {
		objectives: number;
		methodology: number;
		budget: number;
		timeline: number;
	};
}

interface EvaluatorDecisionModalProps {
	isOpen: boolean;
	onClose: () => void;
	decision: EvaluatorDecision;
	proposalTitle: string;
	proposalId: string;
}

const RATING_CRITERIA = {
	objectives: {
		label: "Objectives Assessment",
		descriptions: {
			5: "Objectives are crystal clear, highly measurable, and very significant to the field with clear alignment to national priorities",
			4: "Objectives are clear and relevant with well-defined metrics and good alignment",
			3: "Objectives are understandable but lack specificity in some areas or could be more significant",
			2: "Objectives are vague, poorly justified, or lack clear connection to project scope",
			1: "Objectives are unclear, not measurable, or insignificant to the research field",
		},
	},
	methodology: {
		label: "Methodology Assessment",
		descriptions: {
			5: "Methodology is rigorous, innovative, well-designed, and highly feasible with detailed implementation plan",
			4: "Methodology is sound with appropriate methods, tools, and realistic timeline",
			3: "Methodology is acceptable but has some gaps in detail or minor feasibility concerns",
			2: "Methodology has significant flaws, questionable feasibility, or unclear implementation steps",
			1: "Methodology is inadequate, not clearly described, or fundamentally flawed",
		},
	},
	budget: {
		label: "Budget Assessment",
		descriptions: {
			5: "Budget is well-justified, realistic, efficiently allocated, with clear cost breakdown and sound financial management plan",
			4: "Budget is appropriate with minor justification gaps or minor allocation concerns",
			3: "Budget is acceptable but lacks detailed justification for some line items",
			2: "Budget appears inflated or inadequately justified with unclear allocation logic",
			1: "Budget is unrealistic, poorly justified, or raises concerns about cost efficiency",
		},
	},
	timeline: {
		label: "Timeline Assessment",
		descriptions: {
			5: "Timeline is realistic, well-structured with clear milestones, deliverables, and contingency buffers",
			4: "Timeline is reasonable with appropriate milestones and reasonable contingency planning",
			3: "Timeline is acceptable but somewhat ambitious or lacks detailed milestone descriptions",
			2: "Timeline appears unrealistic, poorly structured, or lacks clear milestones",
			1: "Timeline is not feasible, unclear, or unrealistic given the project scope",
		},
	},
};

const EvaluatorDecisionModal: React.FC<EvaluatorDecisionModalProps> = ({
	isOpen,
	onClose,
	decision,
	proposalTitle,
	proposalId
}) => {
	if (!isOpen) return null;

	const getDecisionColor = (decision: string) => {
		switch (decision) {
			case 'Approve':
				return 'text-emerald-600 bg-emerald-50 border-emerald-200';
			case 'Revise':
				return 'text-yellow-600 bg-yellow-50 border-yellow-200';
			case 'Reject':
				return 'text-red-600 bg-red-50 border-red-200';
			case 'Pending':
				return 'text-yellow-600 bg-yellow-50 border-yellow-200';
			default:
				return 'text-slate-600 bg-slate-50 border-slate-200';
		}
	};

	const getDecisionIcon = (decision: string) => {
		switch (decision) {
			case 'Approve':
				return <CheckCircle className='w-4 h-4 sm:w-5 sm:h-5 text-emerald-600' />;
			case 'Revise':
				return <RotateCcw className='w-4 h-4 sm:w-5 sm:h-5 text-yellow-600' />;
			case 'Reject':
				return <XCircle className='w-4 h-4 sm:w-5 sm:h-5 text-red-600' />;
			case 'Pending':
				return <Clock className='w-4 h-4 sm:w-5 sm:h-5 text-yellow-600' />;
			default:
				return <FileText className='w-4 h-4 sm:w-5 sm:h-5 text-slate-600' />;
		}
	};

	const getRatingColor = (value: number) => {
		if (value >= 4) return "bg-emerald-100 text-emerald-700 border-emerald-200";
		if (value === 3) return "bg-blue-100 text-blue-700 border-blue-200";
		return "bg-yellow-100 text-yellow-700 border-yellow-200";
	};

	return (
		<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
			<div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-sm sm:max-w-2xl lg:max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden mx-2 sm:mx-4">
				{/* Header */}
				<div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-200 bg-slate-50">
					<div className="flex items-center gap-2 sm:gap-3">
						{getDecisionIcon(decision.decision)}
						<div>
							<h2 className="text-lg sm:text-xl font-bold text-slate-800">Evaluator Assessment</h2>
							<p className="text-xs sm:text-sm text-slate-600">Detailed review and comments</p>
						</div>
					</div>
					<button
						onClick={onClose}
						className="p-1 sm:p-2 hover:bg-slate-200 rounded-lg transition-colors duration-200 cursor-pointer"
					>
						<X className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600" />
					</button>
				</div>

				{/* Content */}
				<div className="overflow-y-auto max-h-[calc(95vh-140px)] sm:max-h-[calc(90vh-200px)]">
					<div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
						{/* Proposal Info */}
						<div className="grid grid-cols-1 gap-4 sm:gap-6">
							{/* Project Title and Evaluator */}
							<div className="space-y-3">
								<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
									<div>
										<label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
											Project Title
										</label>
										<p className="text-sm font-medium text-slate-800 mt-1 line-clamp-2">
											{proposalTitle}
										</p>
									</div>
									<div>
										<label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
											Evaluator
										</label>
										<div className="flex flex-col mt-1">
											<div className="flex items-center gap-2">
												<User className="w-4 h-4 text-slate-400" />
												<p className="text-sm font-medium text-slate-800">
													{decision.evaluatorName}
												</p>
											</div>
											{decision.evaluatorDepartment && (
												<p className="text-xs text-slate-500 ml-6">
													{decision.evaluatorDepartment}
												</p>
											)}
											{decision.evaluatorEmail && (
												<p className="text-xs text-slate-400 ml-6">
													{decision.evaluatorEmail}
												</p>
											)}
										</div>
									</div>
								</div>
							</div>

							{/* Proposal ID and Date/Time */}
							<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
								<div>
									<label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
										Proposal ID
									</label>
									<p className="text-sm font-medium text-slate-800 mt-1">{proposalId}</p>
								</div>
								<div>
									<label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
										Evaluation Date & Time
									</label>
									<div className="flex items-center gap-3 mt-1 text-sm text-slate-600">
										<div className="flex items-center gap-2">
											<Calendar className="w-4 h-4" />
											<span>{new Date(decision.submittedDate).toLocaleDateString()}</span>
										</div>
										<div className="flex items-center gap-2">
											<Clock className="w-4 h-4" />
											<span>{new Date(decision.submittedDate).toLocaleTimeString()}</span>
										</div>
									</div>
								</div>
							</div>
						</div>

						{/* Decision Badge */}
						<div className={`inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg border ${getDecisionColor(decision.decision)}`}>
							{getDecisionIcon(decision.decision)}
							<span className="font-semibold text-sm sm:text-base">Decision: {decision.decision}</span>
						</div>

						{/* Ratings Section */}
						{decision.ratings && (
							<div className="space-y-4">
								<h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
									<MessageSquare className="w-5 h-5 text-[#C8102E]" />
									Evaluator Ratings
								</h3>

								{/* Objectives Rating */}
								<div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
									<div className="flex items-center justify-between mb-3">
										<label className="text-sm font-semibold text-slate-900">
											{RATING_CRITERIA.objectives.label}
										</label>
										<div className="flex items-center gap-2">
											<span className="text-sm font-bold text-slate-700">
												<span className="inline-flex items-center justify-center w-8 h-8 text-white bg-[#C8102E] rounded-full text-sm font-semibold">
													{decision.ratings.objectives}/5
												</span>
											</span>
										</div>
									</div>
									<div className={`text-xs p-3 rounded-lg border ${getRatingColor(decision.ratings.objectives)}`}>
										{(RATING_CRITERIA.objectives.descriptions as Record<number, string>)[decision.ratings.objectives]}
									</div>
								</div>

								{/* Methodology Rating */}
								<div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
									<div className="flex items-center justify-between mb-3">
										<label className="text-sm font-semibold text-slate-900">
											{RATING_CRITERIA.methodology.label}
										</label>
										<div className="flex items-center gap-2">
											<span className="text-sm font-bold text-slate-700">
												<span className="inline-flex items-center justify-center w-8 h-8 text-white bg-[#C8102E] rounded-full text-sm font-semibold">
													{decision.ratings.methodology}/5
												</span>
											</span>
										</div>
									</div>
									<div className={`text-xs p-3 rounded-lg border ${getRatingColor(decision.ratings.methodology)}`}>
										{(RATING_CRITERIA.methodology.descriptions as Record<number, string>)[decision.ratings.methodology]}
									</div>
								</div>

								{/* Budget Rating */}
								<div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
									<div className="flex items-center justify-between mb-3">
										<label className="text-sm font-semibold text-slate-900">
											{RATING_CRITERIA.budget.label}
										</label>
										<div className="flex items-center gap-2">
											<span className="text-sm font-bold text-slate-700">
												<span className="inline-flex items-center justify-center w-8 h-8 text-white bg-[#C8102E] rounded-full text-sm font-semibold">
													{decision.ratings.budget}/5
												</span>
											</span>
										</div>
									</div>
									<div className={`text-xs p-3 rounded-lg border ${getRatingColor(decision.ratings.budget)}`}>
										{(RATING_CRITERIA.budget.descriptions as Record<number, string>)[decision.ratings.budget]}
									</div>
								</div>

								{/* Timeline Rating */}
								<div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
									<div className="flex items-center justify-between mb-3">
										<label className="text-sm font-semibold text-slate-900">
											{RATING_CRITERIA.timeline.label}
										</label>
										<div className="flex items-center gap-2">
											<span className="text-sm font-bold text-slate-700">
												<span className="inline-flex items-center justify-center w-8 h-8 text-white bg-[#C8102E] rounded-full text-sm font-semibold">
													{decision.ratings.timeline}/5
												</span>
											</span>
										</div>
									</div>
									<div className={`text-xs p-3 rounded-lg border ${getRatingColor(decision.ratings.timeline)}`}>
										{(RATING_CRITERIA.timeline.descriptions as Record<number, string>)[decision.ratings.timeline]}
									</div>
								</div>
							</div>
						)}

						{/* Comments */}
						<div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
							<label className="block text-sm font-bold text-slate-900 mb-2">
								Comments
							</label>
							<div className="bg-white p-3 rounded-lg border border-slate-200 text-sm text-slate-700 leading-relaxed">
								{decision.comments}
							</div>
						</div>
					</div>
				</div>

				{/* Footer */}
				<div className="flex justify-end p-4 sm:p-6 border-t border-slate-200 bg-slate-50">
					<button
						onClick={onClose}
						className="w-full sm:w-auto px-4 py-2 sm:px-6 sm:py-2 bg-white text-slate-700 border border-slate-300 rounded-lg hover:bg-gray-100 transition-colors duration-200 cursor-pointer font-medium text-sm sm:text-base"
					>
						Close
					</button>
				</div>
			</div>
		</div>
	);
};

export default EvaluatorDecisionModal;