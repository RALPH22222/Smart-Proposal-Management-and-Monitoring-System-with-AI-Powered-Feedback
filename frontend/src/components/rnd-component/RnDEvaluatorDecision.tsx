import React from 'react';
import {
	CheckCircle,
	XCircle,
	RotateCcw,
	FileText,
	MessageSquare,
	TrendingUp,
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
}

interface EvaluatorDecisionModalProps {
	isOpen: boolean;
	onClose: () => void;
	decision: EvaluatorDecision;
	proposalTitle: string;
	proposalId: string;
}

const EvaluatorDecisionModal: React.FC<EvaluatorDecisionModalProps> = ({
	isOpen,
	onClose,
	decision,
	proposalTitle,
	proposalId
}) => {
	if (!isOpen) return null;

	const assessmentData = {
		objectiveAssessment: "The project objectives are clearly defined and aligned with institutional goals. The AI implementation shows strong potential for improving student learning outcomes.",
		methodologyAssessment: "Research methodology is sound and well-structured. The use of machine learning algorithms is appropriate for the stated objectives.",
		budgetAssessment: "Budget allocation is reasonable and well-justified. However, some line items could benefit from more detailed breakdown.",
		timelineAssessment: "Project timeline is realistic and accounts for potential delays. Milestones are clearly defined and achievable.",
		overallAssessment: decision.comments
	};

	const getDecisionColor = (decision: string) => {
		switch (decision) {
			case 'Approve':
				return 'text-emerald-600 bg-emerald-50 border-emerald-200';
			case 'Revise':
				return 'text-amber-600 bg-amber-50 border-amber-200';
			case 'Reject':
				return 'text-red-600 bg-red-50 border-red-200';
			default:
				return 'text-slate-600 bg-slate-50 border-slate-200';
		}
	};

	const getDecisionIcon = (decision: string) => {
		switch (decision) {
			case 'Approve':
				return <CheckCircle className='w-4 h-4 sm:w-5 sm:h-5 text-emerald-600' />;
			case 'Revise':
				return <RotateCcw className='w-4 h-4 sm:w-5 sm:h-5 text-amber-600' />;
			case 'Reject':
				return <XCircle className='w-4 h-4 sm:w-5 sm:h-5 text-red-600' />;
			default:
				return <FileText className='w-4 h-4 sm:w-5 sm:h-5 text-slate-600' />;
		}
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
										<div className="flex items-center gap-2 mt-1">
											<User className="w-4 h-4 text-slate-400" />
											<p className="text-sm font-medium text-slate-800">
												{decision.evaluatorName}
											</p>
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

						{/* Assessment Sections */}
						<div className="space-y-3 sm:space-y-4">
							{/* Objective Assessment */}
							<div className="bg-slate-50 rounded-lg p-3 sm:p-4">
								<h3 className="text-sm font-semibold text-slate-800 mb-2 flex items-center gap-2">
									<CheckCircle className="w-4 h-4 text-[#C8102E] flex-shrink-0" />
									<span className="text-xs sm:text-sm">Objective Assessment</span>
								</h3>
								<p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
									{assessmentData.objectiveAssessment}
								</p>
							</div>

							{/* Methodology Assessment */}
							<div className="bg-slate-50 rounded-lg p-3 sm:p-4">
								<h3 className="text-sm font-semibold text-slate-800 mb-2 flex items-center gap-2">
									<FileText className="w-4 h-4 text-[#C8102E] flex-shrink-0" />
									<span className="text-xs sm:text-sm">Methodology Assessment</span>
								</h3>
								<p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
									{assessmentData.methodologyAssessment}
								</p>
							</div>

							{/* Budget Assessment */}
							<div className="bg-slate-50 rounded-lg p-3 sm:p-4">
								<h3 className="text-sm font-semibold text-slate-800 mb-2 flex items-center gap-2">
									<TrendingUp className="w-4 h-4 text-[#C8102E] flex-shrink-0" />
									<span className="text-xs sm:text-sm">Budget Assessment</span>
								</h3>
								<p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
									{assessmentData.budgetAssessment}
								</p>
							</div>

							{/* Timeline Assessment */}
							<div className="bg-slate-50 rounded-lg p-3 sm:p-4">
								<h3 className="text-sm font-semibold text-slate-800 mb-2 flex items-center gap-2">
									<Clock className="w-4 h-4 text-[#C8102E] flex-shrink-0" />
									<span className="text-xs sm:text-sm">Timeline Assessment</span>
								</h3>
								<p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
									{assessmentData.timelineAssessment}
								</p>
							</div>

							{/* Overall Assessment */}
							<div className="bg-blue-50 rounded-lg p-3 sm:p-4 border border-blue-200">
								<h3 className="text-sm font-semibold text-blue-800 mb-2 flex items-center gap-2">
									<MessageSquare className="w-4 h-4 text-blue-600 flex-shrink-0" />
									<span className="text-xs sm:text-sm">Overall Assessment</span>
								</h3>
								<p className="text-xs sm:text-sm text-blue-700 leading-relaxed">
									{assessmentData.overallAssessment}
								</p>
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