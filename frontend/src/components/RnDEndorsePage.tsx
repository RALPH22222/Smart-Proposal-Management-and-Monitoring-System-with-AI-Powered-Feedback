import React, { useState, useEffect } from 'react';
import {
	CheckCircle,
	XCircle,
	RotateCcw,
	FileText,
	User,
	MessageSquare
} from 'lucide-react';
import { type EndorsementProposal } from '../types/evaluator';

const EndorsePage: React.FC = () => {
	const [endorsementProposals, setEndorsementProposals] = useState<
		EndorsementProposal[]
	>([]);
	const [loading, setLoading] = useState(true);

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
					comments:
						'Excellent methodology and clear objectives. The AI implementation is well-structured.',
					submittedDate: '2025-01-20T14:30:00Z'
				},
				{
					evaluatorId: 'eval-2',
					evaluatorName: 'Dr. Michael Chen',
					decision: 'Approve',
					comments:
						'Strong technical foundation. Recommend minor adjustments to the data privacy section.',
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
					comments:
						'Innovative approach to credential verification. Security measures are comprehensive.',
					submittedDate: '2025-01-19T16:45:00Z'
				},
				{
					evaluatorId: 'eval-3',
					evaluatorName: 'Dr. Lisa Rodriguez',
					decision: 'Revise',
					comments:
						'Good concept but needs clearer user interface design and accessibility considerations.',
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
					comments:
						'Outstanding educational technology proposal. VR implementation is cutting-edge.',
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
				return <CheckCircle className='w-4 h-4 text-green-600' />;
			case 'Revise':
				return <RotateCcw className='w-4 h-4 text-orange-600' />;
			case 'Reject':
				return <XCircle className='w-4 h-4 text-red-600' />;
			default:
				return <FileText className='w-4 h-4 text-gray-600' />;
		}
	};

	const getDecisionColor = (decision: string) => {
		switch (decision) {
			case 'Approve':
				return 'text-green-600 bg-green-50 border-green-200';
			case 'Revise':
				return 'text-orange-600 bg-orange-50 border-orange-200';
			case 'Reject':
				return 'text-red-600 bg-red-50 border-red-200';
			default:
				return 'text-gray-600 bg-gray-50 border-gray-200';
		}
	};

	const getOverallRecommendationColor = (recommendation: string) => {
		switch (recommendation) {
			case 'Approve':
				return 'bg-green-100 text-green-800';
			case 'Revise':
				return 'bg-orange-100 text-orange-800';
			case 'Reject':
				return 'bg-red-100 text-red-800';
			default:
				return 'bg-gray-100 text-gray-800';
		}
	};

	if (loading) {
		return (
			<div className='min-h-screen bg-gray-50 flex items-center justify-center'>
				<div className='text-center'>
					<div className='animate-spin rounded-full h-12 w-12 border-b-2 border-wmsu-red mx-auto'></div>
					<p className='mt-4 text-gray-600'>Loading endorsement proposals...</p>
				</div>
			</div>
		);
	}

	return (
		<div className='min-h-screen bg-gray-50'>
			<div className='p-6'>
				{/* Header */}
				<div className='mb-6'>
					<h1 className='text-2xl font-bold text-gray-900'>
						Proposal Endorsement
					</h1>
					<p className='text-gray-600'>
						Review evaluator decisions and endorse proposals for final approval
					</p>
				</div>

				{/* Stats Cards */}
				<div className='grid grid-cols-1 md:grid-cols-4 gap-6 mb-8'>
					<div className='bg-white rounded-lg shadow-sm p-6 border border-gray-200'>
						<div className='flex items-center justify-between'>
							<div>
								<p className='text-sm font-medium text-gray-600'>
									Ready for Endorsement
								</p>
								<p className='text-2xl font-bold text-blue-600'>
									{
										endorsementProposals.filter((p) => p.readyForEndorsement)
											.length
									}
								</p>
							</div>
							<CheckCircle className='w-8 h-8 text-blue-500' />
						</div>
					</div>

					<div className='bg-white rounded-lg shadow-sm p-6 border border-gray-200'>
						<div className='flex items-center justify-between'>
							<div>
								<p className='text-sm font-medium text-gray-600'>
									Pending Evaluators
								</p>
								<p className='text-2xl font-bold text-orange-600'>
									{
										endorsementProposals.filter((p) => !p.readyForEndorsement)
											.length
									}
								</p>
							</div>
							<User className='w-8 h-8 text-orange-500' />
						</div>
					</div>

					<div className='bg-white rounded-lg shadow-sm p-6 border border-gray-200'>
						<div className='flex items-center justify-between'>
							<div>
								<p className='text-sm font-medium text-gray-600'>Approved</p>
								<p className='text-2xl font-bold text-green-600'>
									{
										endorsementProposals.filter(
											(p) => p.overallRecommendation === 'Approve'
										).length
									}
								</p>
							</div>
							<CheckCircle className='w-8 h-8 text-green-500' />
						</div>
					</div>

					<div className='bg-white rounded-lg shadow-sm p-6 border border-gray-200'>
						<div className='flex items-center justify-between'>
							<div>
								<p className='text-sm font-medium text-gray-600'>
									Need Revision
								</p>
								<p className='text-2xl font-bold text-orange-600'>
									{
										endorsementProposals.filter(
											(p) => p.overallRecommendation === 'Revise'
										).length
									}
								</p>
							</div>
							<RotateCcw className='w-8 h-8 text-orange-500' />
						</div>
					</div>
				</div>

				{/* Proposals List */}
				{endorsementProposals.length === 0 ? (
					<div className='bg-white rounded-lg shadow-sm p-12 text-center'>
						<FileText className='w-16 h-16 text-gray-300 mx-auto mb-4' />
						<h3 className='text-lg font-medium text-gray-900 mb-2'>
							No proposals ready for endorsement
						</h3>
						<p className='text-gray-600'>
							Proposals will appear here once evaluators complete their reviews.
						</p>
					</div>
				) : (
					<div className='space-y-6'>
						{endorsementProposals.map((proposal) => (
							<div
								key={proposal.id}
								className='bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden'
							>
								{/* Proposal Header */}
								<div className='p-6 border-b border-gray-200'>
									<div className='flex flex-col lg:flex-row lg:items-center justify-between gap-4'>
										<div className='flex-1'>
											<div className='flex items-center gap-3 mb-2'>
												<h3 className='text-lg font-semibold text-gray-900'>
													{proposal.title}
												</h3>
												<span
													className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getOverallRecommendationColor(
														proposal.overallRecommendation
													)}`}
												>
													{proposal.overallRecommendation}
												</span>
												{!proposal.readyForEndorsement && (
													<span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800'>
														Pending Evaluators
													</span>
												)}
											</div>
											<div className='flex items-center gap-4 text-sm text-gray-600'>
												<div className='flex items-center'>
													<User className='w-4 h-4 mr-1' />
													<span>By: {proposal.submittedBy}</span>
												</div>
												<div className='flex items-center'>
													<FileText className='w-4 h-4 mr-1' />
													<span>{proposal.id}</span>
												</div>
											</div>
										</div>

										{proposal.readyForEndorsement && (
											<div className='flex flex-col sm:flex-row gap-2'>
												<button
													onClick={() => handleEndorseProposal(proposal.id)}
													className='px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors'
												>
													<CheckCircle className='w-4 h-4 inline mr-2' />
													Endorse Proposal
												</button>
												<button
													onClick={() => handleReturnForRevision(proposal.id)}
													className='px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 transition-colors'
												>
													<RotateCcw className='w-4 h-4 inline mr-2' />
													Return for Revision
												</button>
												<button
													onClick={() =>
														handleRejectForClarification(proposal.id)
													}
													className='px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors'
												>
													<XCircle className='w-4 h-4 inline mr-2' />
													Reject for Clarification
												</button>
											</div>
										)}
									</div>
								</div>

								{/* Evaluator Decisions */}
								<div className='p-6'>
									<h4 className='text-md font-semibold text-gray-800 mb-4'>
										Evaluator Decisions
									</h4>
									<div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
										{proposal.evaluatorDecisions.map((decision) => (
											<div
												key={decision.evaluatorId}
												className={`border rounded-lg p-4 ${getDecisionColor(
													decision.decision
												)}`}
											>
												<div className='flex items-center justify-between mb-3'>
													<div className='flex items-center'>
														{getDecisionIcon(decision.decision)}
														<span className='ml-2 font-medium'>
															{decision.evaluatorName}
														</span>
													</div>
													<span className='text-xs text-gray-500'>
														{new Date(
															decision.submittedDate
														).toLocaleDateString()}
													</span>
												</div>

												<div className='flex items-center mb-2'>
													<span className='text-sm font-medium'>
														Decision: {decision.decision}
													</span>
												</div>

												<div className='bg-white bg-opacity-50 rounded p-3'>
													<div className='flex items-start'>
														<MessageSquare className='w-4 h-4 mt-0.5 mr-2 text-gray-500' />
														<p className='text-sm text-gray-700'>
															{decision.comments}
														</p>
													</div>
												</div>
											</div>
										))}

										{/* Show missing evaluators */}
										{proposal.evaluatorDecisions.length < 2 && (
											<div className='border-2 border-dashed border-gray-300 rounded-lg p-4 flex items-center justify-center'>
												<div className='text-center text-gray-500'>
													<User className='w-8 h-8 mx-auto mb-2 opacity-50' />
													<p className='text-sm'>
														Waiting for additional evaluator
													</p>
													<p className='text-xs'>
														Cannot endorse until all evaluators complete review
													</p>
												</div>
											</div>
										)}
									</div>
								</div>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
};

export default EndorsePage;
