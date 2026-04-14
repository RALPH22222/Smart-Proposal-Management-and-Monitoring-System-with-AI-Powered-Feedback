import React from 'react';
import { createPortal } from 'react-dom';
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
	Mail,
	Building2
} from 'lucide-react';
import { formatDate, formatTime } from '../../utils/date-formatter';

interface EvaluatorDecision {
	evaluatorId: string;
	evaluatorName: string;
	evaluatorDepartment?: string;
	evaluatorEmail?: string;
	decision: string;
	comments: string;
	submittedDate: string;
	ratings?: {
		title: number;
		budget: number;
		timeline: number;
	};
}

interface AdminEvaluatorDecisionModalProps {
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

const AdminEvaluatorDecisionModal: React.FC<AdminEvaluatorDecisionModalProps> = ({
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
		if (value >= 4) return "bg-emerald-600 text-white border-emerald-600";
		if (value === 3) return "bg-amber-500 text-white border-amber-500";
		return "bg-red-600 text-white border-red-600";
	};

	const getFeedbackCardColor = (value: number) => {
		if (value >= 4) return "bg-emerald-50 border-emerald-200 text-emerald-900";
		if (value === 3) return "bg-amber-50 border-amber-200 text-amber-900";
		return "bg-red-50 border-red-200 text-red-900";
	};

	const getRatingLabel = (value: number) => {
		if (value === 1) return "Poor";
		if (value === 2) return "Fair";
		if (value === 3) return "Good";
		if (value === 4) return "Very Good";
		if (value === 5) return "Excellent";
		return "Not Rated";
	};

	const ratingKeys = ["title", "budget", "timeline"] as const;
	const totalScore = decision.ratings
		? decision.ratings.title + decision.ratings.budget + decision.ratings.timeline
		: 0;
	const maxScore = ratingKeys.length * 5;

		return createPortal(
			<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200] p-2 sm:p-4">
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
										Evaluation Date &amp; Time
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
								<div>
									<h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
										<MessageSquare className="w-5 h-5 text-[#C8102E]" />
										Evaluator Ratings
									</h3>
									<p className="text-sm text-slate-500 mt-1">
										Each criterion is scored from <span className="font-semibold text-slate-700">1 (Poor)</span> to{" "}
										<span className="font-semibold text-slate-700">5 (Excellent)</span>. Descriptions appear below their
										respective assessment rows.
									</p>
								</div>

								<div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 space-y-4">
									<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
										<div className="rounded-xl border border-slate-200 bg-white p-4">
											<p className="text-xs uppercase tracking-wider font-semibold text-slate-500">Overall Score</p>
											<p className="text-2xl font-black text-slate-900 mt-1">
												{totalScore}
												<span className="text-base font-bold text-slate-400">/{maxScore}</span>
											</p>
										</div>
										<div className="rounded-xl border border-slate-200 bg-white p-4">
											<p className="text-xs uppercase tracking-wider font-semibold text-slate-500">Average Rating</p>
											<p className="text-2xl font-black text-slate-900 mt-1">
												{(totalScore / ratingKeys.length).toFixed(1)}
												<span className="text-base font-bold text-slate-400">/5</span>
											</p>
										</div>
									</div>

									<div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
										<div className="overflow-x-auto">
											<table className="min-w-full text-sm">
												<thead className="bg-slate-50 border-b border-slate-200">
													<tr>
														<th className="text-left px-4 py-3 font-bold text-slate-700 min-w-[220px]">Criterion</th>
														{[1, 2, 3, 4, 5].map((num) => (
															<th key={num} className="text-center px-2 py-3 font-bold text-slate-700 min-w-[90px]">
																<div className="leading-tight">
																	<div className="text-base">{num}</div>
																	<div className="text-xs font-bold text-slate-600">
																		{num === 1 ? "Poor" : num === 2 ? "Fair" : num === 3 ? "Good" : num === 4 ? "Very Good" : "Excellent"}
																	</div>
																</div>
															</th>
														))}
													</tr>
												</thead>
												<tbody>
													{ratingKeys.map((criterionKey) => {
														const criterion = RATING_CRITERIA[criterionKey];
														const value = (decision.ratings as any)[criterionKey] ?? 0;
														return (
															<React.Fragment key={criterionKey}>
																<tr className="border-b border-slate-100">
																	<td className="px-4 py-3 align-middle bg-slate-50/50">
																		<div className="font-semibold text-slate-900">{criterion.label}</div>
																		{value > 0 && (
																			<span className={`mt-1 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${getRatingColor(value)}`}>
																				{getRatingLabel(value)}
																			</span>
																		)}
																	</td>
																	{[1, 2, 3, 4, 5].map((num) => {
																		const selected = value === num;
																		return (
																			<td key={num} className="px-0 py-0 text-center">
																				<div
																					className={`w-full h-12 border-r border-slate-200 text-sm font-bold flex items-center justify-center ${
																						selected ? `${getRatingColor(num)} shadow-inner` : "bg-white text-slate-400"
																					}`}
																				>
																					{num}
																				</div>
																			</td>
																		);
																	})}
																</tr>
																{value > 0 && (
																	<tr className="border-b border-slate-100 last:border-b-0">
																		<td colSpan={6} className="px-4 py-3 bg-white">
																			<div className={`text-sm leading-relaxed p-3 rounded-lg border ${getFeedbackCardColor(value)}`}>
																				<span className="font-bold">{getRatingLabel(value)} ({value}/5):</span>{" "}
																				{(criterion.descriptions as Record<number, string>)[value]}
																			</div>
																		</td>
																	</tr>
																)}
															</React.Fragment>
														);
													})}
												</tbody>
											</table>
										</div>
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
		</div>,
		document.body
	);
};

export default AdminEvaluatorDecisionModal;
