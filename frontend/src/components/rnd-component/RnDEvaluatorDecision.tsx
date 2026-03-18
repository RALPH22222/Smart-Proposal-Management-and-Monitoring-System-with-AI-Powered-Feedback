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
	User,
	Building2,
	Mail
} from 'lucide-react';
import { formatDate, formatTime } from '../../utils/date-formatter';

interface EvaluatorDecision {
	evaluatorId: string;
	evaluatorName: string;
	decision: string;
	comments: string;
	submittedDate: string;
	evaluatorDepartment?: string;
	evaluatorEmail?: string;
	ratings?: {
		title: number;
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
	title: {
		label: "Title Assessment",
		descriptions: {
			5: "Title is concise, highly descriptive, accurately reflects the scope of the project, and is aligned with the research objectives",
			4: "Title is clear, relevant, and provides a good indication of the project's focus and goals",
			3: "Title is acceptable but could be more specific or better aligned with the project scope",
			2: "Title is vague, overly broad, or does not clearly convey the project's purpose",
			1: "Title is unclear, misleading, or irrelevant to the proposed research",
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
												<div className="flex items-center gap-2 ml-6 mt-0.5">
													<Building2 className="w-3.5 h-3.5 text-slate-400" />
													<p className="text-xs text-slate-500">
														{decision.evaluatorDepartment}
													</p>
												</div>
											)}
											{decision.evaluatorEmail && (
												<div className="flex items-center gap-2 ml-6 mt-0.5">
													<Mail className="w-3.5 h-3.5 text-slate-400" />
													<p className="text-xs text-slate-400">
														{decision.evaluatorEmail}
													</p>
												</div>
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
											<span>{formatDate(decision.submittedDate)}</span>
										</div>
										<div className="flex items-center gap-2">
											<Clock className="w-4 h-4" />
											<span>{formatTime(decision.submittedDate)}</span>
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
											{RATING_CRITERIA.title.label}
										</label>
										<div className="flex items-center gap-2">
											<span className="text-sm font-bold text-slate-700">
												<span className="inline-flex items-center justify-center w-8 h-8 text-white bg-[#C8102E] rounded-full text-sm font-semibold">
													{decision.ratings.title}/5
												</span>
											</span>
										</div>
									</div>
									<div className={`text-xs p-3 rounded-lg border ${getRatingColor(decision.ratings.title)}`}>
										{(RATING_CRITERIA.title.descriptions as Record<number, string>)[decision.ratings.title]}
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