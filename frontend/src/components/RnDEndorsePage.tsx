import React, { useState, useEffect } from 'react';
import {
	CheckCircle,
	XCircle,
	RotateCcw,
	FileText,
	User,
	MessageSquare,
	TrendingUp,
	ChevronLeft,
	ChevronRight
} from 'lucide-react';
import { type EndorsementProposal } from '../types/evaluator';

const EndorsePage: React.FC = () => {
	const [endorsementProposals, setEndorsementProposals] = useState<EndorsementProposal[]>([]);
	const [loading, setLoading] = useState(true);
	const [currentPage, setCurrentPage] = useState(1);
	const itemsPerPage = 5;

	// Mock data for proposals ready for endorsement
	const mockEndorsementProposals: EndorsementProposal[] = [
		{
			id: 'PROP-2025-001',
			title: 'Development of AI-Powered Student Learning Analytics Platform',
			submittedBy: 'Dr. Maria Santos',
			evaluatorDecisions: [
				{
					evaluatorId: 'eval-1',
					evaluatorName: 'Dr. Sarah Johnson',
					decision: 'Approve',
					comments: 'Excellent methodology and clear objectives. The AI implementation is well-structured.',
					submittedDate: '2025-01-20T14:30:00Z'
				},
				{
					evaluatorId: 'eval-2',
					evaluatorName: 'Dr. Michael Chen',
					decision: 'Approve',
					comments: 'Strong technical foundation. Recommend minor adjustments to the data privacy section.',
					submittedDate: '2025-01-21T09:15:00Z'
				}
			],
			overallRecommendation: 'Approve',
			readyForEndorsement: true
		},
		{
			id: 'PROP-2025-003',
			title: 'Blockchain-Based Academic Credential Verification System',
			submittedBy: 'Dr. Angela Rivera',
			evaluatorDecisions: [
				{
					evaluatorId: 'eval-4',
					evaluatorName: 'Dr. Robert Kim',
					decision: 'Approve',
					comments: 'Innovative approach to credential verification. Security measures are comprehensive.',
					submittedDate: '2025-01-19T16:45:00Z'
				},
				{
					evaluatorId: 'eval-3',
					evaluatorName: 'Dr. Lisa Rodriguez',
					decision: 'Revise',
					comments: 'Good concept but needs clearer user interface design and accessibility considerations.',
					submittedDate: '2025-01-20T11:20:00Z'
				}
			],
			overallRecommendation: 'Revise',
			readyForEndorsement: true
		},
		{
			id: 'PROP-2025-006',
			title: 'Virtual Reality Learning Environment for STEM Education',
			submittedBy: 'Dr. Roberto Fernandez',
			evaluatorDecisions: [
				{
					evaluatorId: 'eval-5',
					evaluatorName: 'Dr. Amanda Foster',
					decision: 'Approve',
					comments: 'Outstanding educational technology proposal. VR implementation is cutting-edge.',
					submittedDate: '2025-01-18T13:00:00Z'
				}
			],
			overallRecommendation: 'Approve',
			readyForEndorsement: false // Missing second evaluator
		}
	];

	useEffect(() => {
		loadEndorsementProposals();
	}, []);

	const loadEndorsementProposals = async () => {
		try {
			setLoading(true);
			// Simulate API call
			await new Promise((resolve) => setTimeout(resolve, 1000));
			setEndorsementProposals(mockEndorsementProposals);
		} catch (error) {
			console.error('Error loading endorsement proposals:', error);
		} finally {
			setLoading(false);
		}
	};

	const handleEndorseProposal = async (proposalId: string) => {
		try {
			// Simulate API call
			await new Promise((resolve) => setTimeout(resolve, 500));

			setEndorsementProposals((prev) =>
				prev.filter((proposal) => proposal.id !== proposalId)
			);

			console.log(`Proposal ${proposalId} endorsed successfully`);
		} catch (error) {
			console.error('Error endorsing proposal:', error);
		}
	};

	const handleReturnForRevision = async (proposalId: string) => {
		try {
			// Simulate API call
			await new Promise((resolve) => setTimeout(resolve, 500));

			setEndorsementProposals((prev) =>
				prev.filter((proposal) => proposal.id !== proposalId)
			);

			console.log(`Proposal ${proposalId} returned for revision`);
		} catch (error) {
			console.error('Error returning proposal for revision:', error);
		}
	};

	const handleRejectForClarification = async (proposalId: string) => {
		try {
			// Simulate API call
			await new Promise((resolve) => setTimeout(resolve, 500));

			setEndorsementProposals((prev) =>
				prev.filter((proposal) => proposal.id !== proposalId)
			);

			console.log(`Proposal ${proposalId} rejected for clarification`);
		} catch (error) {
			console.error('Error rejecting proposal:', error);
		}
	};

	const getDecisionIcon = (decision: string) => {
		switch (decision) {
			case 'Approve':
				return <CheckCircle className='w-4 h-4 text-emerald-600' />;
			case 'Revise':
				return <RotateCcw className='w-4 h-4 text-amber-600' />;
			case 'Reject':
				return <XCircle className='w-4 h-4 text-red-600' />;
			default:
				return <FileText className='w-4 h-4 text-slate-600' />;
		}
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

	const getOverallRecommendationBadge = (recommendation: string) => {
		const baseClasses = 'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border border-current border-opacity-20';

		switch (recommendation) {
			case 'Approve':
				return `${baseClasses} text-emerald-600 bg-emerald-50 border-emerald-200`;
			case 'Revise':
				return `${baseClasses} text-amber-600 bg-amber-50 border-amber-200`;
			case 'Reject':
				return `${baseClasses} text-red-600 bg-red-50 border-red-200`;
			default:
				return `${baseClasses} text-slate-600 bg-slate-50 border-slate-200`;
		}
	};

	// Pagination
	const totalPages = Math.ceil(endorsementProposals.length / itemsPerPage);
	const startIndex = (currentPage - 1) * itemsPerPage;
	const paginatedProposals = endorsementProposals.slice(startIndex, startIndex + itemsPerPage);

	if (loading) {
		return (
			<div className="bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C8102E] mx-auto"></div>
					<p className="mt-4 text-slate-600">Loading endorsement proposals...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen lg:h-screen flex flex-col lg:flex-row gap-0 lg:gap-6">
			<div className="flex-1 flex flex-col gap-4 sm:gap-6 p-4 sm:p-6 overflow-hidden pt-16 lg:pt-6">
				{/* Header */}
				<header className="flex-shrink-0">
					<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
						<div>
							<h1 className="text-2xl sm:text-3xl font-bold text-[#C8102E] leading-tight">
								Proposal Endorsement
							</h1>
							<p className="text-slate-600 mt-2 text-sm leading-relaxed">
								Review evaluator decisions and endorse proposals for final approval
							</p>
						</div>
						<div className="flex items-center gap-2 text-xs text-slate-500">
							<TrendingUp className="w-4 h-4" />
							<span>Last updated: Today, 2:30 PM</span>
						</div>
					</div>
				</header>

				{/* Stats Cards */}
				<section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
					<div className="bg-white shadow-xl rounded-2xl border border-slate-200 p-4 transition-all duration-300 hover:shadow-lg hover:scale-105 group cursor-pointer">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-xs font-semibold text-slate-700 mb-2">Ready for Endorsement</p>
								<p className="text-xl font-bold text-blue-600 tabular-nums">
									{endorsementProposals.filter((p) => p.readyForEndorsement).length}
								</p>
							</div>
							<CheckCircle className="w-6 h-6 text-blue-500 group-hover:scale-110 transition-transform duration-300" />
						</div>
					</div>

					<div className="bg-white shadow-xl rounded-2xl border border-slate-200 p-4 transition-all duration-300 hover:shadow-lg hover:scale-105 group cursor-pointer">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-xs font-semibold text-slate-700 mb-2">Pending Evaluators</p>
								<p className="text-xl font-bold text-amber-600 tabular-nums">
									{endorsementProposals.filter((p) => !p.readyForEndorsement).length}
								</p>
							</div>
							<User className="w-6 h-6 text-amber-500 group-hover:scale-110 transition-transform duration-300" />
						</div>
					</div>

					<div className="bg-white shadow-xl rounded-2xl border border-slate-200 p-4 transition-all duration-300 hover:shadow-lg hover:scale-105 group cursor-pointer">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-xs font-semibold text-slate-700 mb-2">Approved</p>
								<p className="text-xl font-bold text-emerald-600 tabular-nums">
									{endorsementProposals.filter((p) => p.overallRecommendation === 'Approve').length}
								</p>
							</div>
							<CheckCircle className="w-6 h-6 text-emerald-500 group-hover:scale-110 transition-transform duration-300" />
						</div>
					</div>

					<div className="bg-white shadow-xl rounded-2xl border border-slate-200 p-4 transition-all duration-300 hover:shadow-lg hover:scale-105 group cursor-pointer">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-xs font-semibold text-slate-700 mb-2">Need Revision</p>
								<p className="text-xl font-bold text-orange-600 tabular-nums">
									{endorsementProposals.filter((p) => p.overallRecommendation === 'Revise').length}
								</p>
							</div>
							<RotateCcw className="w-6 h-6 text-orange-500 group-hover:scale-110 transition-transform duration-300" />
						</div>
					</div>
				</section>

				{/* Proposals List */}
				<main className="bg-white shadow-xl rounded-2xl border border-slate-200 overflow-hidden flex-1 flex flex-col">
					<div className="p-4 border-b border-slate-200 bg-slate-50">
						<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
							<h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
								<FileText className="w-5 h-5 text-[#C8102E]" />
								Endorsement Proposals
							</h3>
							<div className="flex items-center gap-2 text-xs text-slate-500">
								<User className="w-4 h-4" />
								<span>{endorsementProposals.length} total proposals</span>
							</div>
						</div>
					</div>

					<div className="flex-1 overflow-y-auto">
						{endorsementProposals.length === 0 ? (
							<div className="text-center py-12 px-4">
								<div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
									<FileText className="w-8 h-8 text-slate-400" />
								</div>
								<h3 className="text-lg font-medium text-slate-900 mb-2">
									No proposals ready for endorsement
								</h3>
								<p className="text-slate-500 max-w-sm mx-auto">
									Proposals will appear here once evaluators complete their reviews.
								</p>
							</div>
						) : (
							<div className="divide-y divide-slate-100">
								{paginatedProposals.map((proposal) => (
									<article
										key={proposal.id}
										className="p-4 hover:bg-slate-50 transition-colors duration-200 group"
										aria-labelledby={`proposal-title-${proposal.id}`}
									>
										<div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
											<div className="flex-1 min-w-0">
												<div className="flex items-start gap-3 mb-3">
													<h2
														id={`proposal-title-${proposal.id}`}
														className="text-base font-semibold text-slate-800 line-clamp-2 group-hover:text-[#C8102E] transition-colors duration-200"
													>
														{proposal.title}
													</h2>
													<span className={getOverallRecommendationBadge(proposal.overallRecommendation)}>
														{proposal.overallRecommendation}
													</span>
													{!proposal.readyForEndorsement && (
														<span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border border-amber-200 text-amber-600 bg-amber-50">
															Pending Evaluators
														</span>
													)}
												</div>

												<div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mb-3">
													<div className="flex items-center gap-1.5">
														<User className="w-3 h-3" aria-hidden="true" />
														<span>By: {proposal.submittedBy}</span>
													</div>
													<div className="flex items-center gap-1.5">
														<FileText className="w-3 h-3" aria-hidden="true" />
														<span>ID: {proposal.id}</span>
													</div>
												</div>

												{/* Evaluator Decisions */}
												<div className="space-y-3">
													<h4 className="text-sm font-semibold text-slate-800">
														Evaluator Decisions
													</h4>
													<div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
														{proposal.evaluatorDecisions.map((decision) => (
															<div
																key={decision.evaluatorId}
																className={`border rounded-lg p-3 ${getDecisionColor(decision.decision)}`}
															>
																<div className="flex items-center justify-between mb-2">
																	<div className="flex items-center">
																		{getDecisionIcon(decision.decision)}
																		<span className="ml-2 text-sm font-medium">
																			{decision.evaluatorName}
																		</span>
																	</div>
																	<span className="text-xs text-slate-500">
																		{new Date(decision.submittedDate).toLocaleDateString()}
																	</span>
																</div>

																<div className="flex items-center mb-2">
																	<span className="text-xs font-medium">
																		Decision: {decision.decision}
																	</span>
																</div>

																<div className="bg-white bg-opacity-50 rounded p-2">
																	<div className="flex items-start">
																		<MessageSquare className="w-3 h-3 mt-0.5 mr-2 text-slate-500" />
																		<p className="text-xs text-slate-700">
																			{decision.comments}
																		</p>
																	</div>
																</div>
															</div>
														))}

														{/* Show missing evaluators */}
														{proposal.evaluatorDecisions.length < 2 && (
															<div className="border-2 border-dashed border-slate-300 rounded-lg p-4 flex items-center justify-center">
																<div className="text-center text-slate-500">
																	<User className="w-6 h-6 mx-auto mb-2 opacity-50" />
																	<p className="text-xs font-medium">Waiting for additional evaluator</p>
																	<p className="text-xs">
																		Cannot endorse until all evaluators complete review
																	</p>
																</div>
															</div>
														)}
													</div>
												</div>
											</div>

											{proposal.readyForEndorsement && (
												<div className="flex flex-col sm:flex-row gap-2 flex-shrink-0">
													<button
														onClick={() => handleEndorseProposal(proposal.id)}
														className="inline-flex items-center justify-center px-3 h-8 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1 transition-all duration-200 cursor-pointer text-xs font-medium"
													>
														<CheckCircle className="w-3 h-3 mr-1" />
														Endorse
													</button>
													<button
														onClick={() => handleReturnForRevision(proposal.id)}
														className="inline-flex items-center justify-center px-3 h-8 rounded-lg bg-amber-600 text-white hover:bg-amber-700 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-1 transition-all duration-200 cursor-pointer text-xs font-medium"
													>
														<RotateCcw className="w-3 h-3 mr-1" />
														Return
													</button>
													<button
														onClick={() => handleRejectForClarification(proposal.id)}
														className="inline-flex items-center justify-center px-3 h-8 rounded-lg bg-red-600 text-white hover:bg-red-700 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 transition-all duration-200 cursor-pointer text-xs font-medium"
													>
														<XCircle className="w-3 h-3 mr-1" />
														Reject
													</button>
												</div>
											)}
										</div>
									</article>
								))}
							</div>
						)}
					</div>

					{/* Pagination */}
					{endorsementProposals.length > 0 && (
						<div className="p-4 bg-slate-50 border-t border-slate-200 flex-shrink-0">
							<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-xs text-slate-600">
								<span>
									Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, endorsementProposals.length)} of {endorsementProposals.length} proposals
								</span>
								<div className="flex items-center gap-2">
									<button
										onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
										disabled={currentPage === 1}
										className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#C8102E] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
									>
										<ChevronLeft className="w-3 h-3" />
										Previous
									</button>
									<span className="px-3 py-1.5 text-xs font-medium text-slate-600">
										Page {currentPage} of {totalPages}
									</span>
									<button
										onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
										disabled={currentPage === totalPages}
										className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#C8102E] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
									>
										Next
										<ChevronRight className="w-3 h-3" />
									</button>
								</div>
							</div>
						</div>
					)}
				</main>
			</div>
		</div>
	);
};

export default EndorsePage;