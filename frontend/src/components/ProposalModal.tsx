import React, { useState, useEffect } from 'react';
import { X, FileText, User, Calendar } from 'lucide-react';
import {
	type Decision,
	type DecisionType,
	type ProposalModalProps
} from '../types/proposal';

const ProposalModal: React.FC<ProposalModalProps> = ({
	proposal,
	isOpen,
	onClose,
	onSubmitDecision
}) => {
	const [decision, setDecision] = useState<DecisionType>('Revise');
	const [notes, setNotes] = useState('');

	// Reset modal state when proposal changes or modal opens
	useEffect(() => {
		if (isOpen) {
			setDecision('Revise');
			setNotes('');
		}
	}, [isOpen, proposal]);

	// Handle form submission
	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		if (!proposal) return;

		const decisionData: Decision = {
			proposalId: proposal.id,
			decision,
			notes,
			reviewedBy: 'R&D Staff', // In real app, get from auth context
			reviewedDate: new Date().toISOString()
		};

		onSubmitDecision(decisionData);
		onClose();
	};

	// Handle backdrop click
	const handleBackdropClick = (e: React.MouseEvent) => {
		if (e.target === e.currentTarget) {
			onClose();
		}
	};

	if (!isOpen || !proposal) return null;

	return (
		<div
			className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm'
			onClick={handleBackdropClick}
		>
			<div className='bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden'>
				{/* Modal Header */}
				<div className='flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50'>
					<div className='flex-1'>
						<h2 className='text-xl font-semibold text-gray-800 mb-2'>
							Review Proposal
						</h2>
						<h3 className='text-lg font-medium text-gray-600 line-clamp-2'>
							{proposal.title}
						</h3>
					</div>
					<button
						onClick={onClose}
						className='p-2 hover:bg-gray-200 rounded-lg transition-colors'
						aria-label='Close modal'
					>
						<X className='w-5 h-5 text-gray-500' />
					</button>
				</div>

				<div className='flex flex-col lg:flex-row h-full max-h-[calc(90vh-88px)]'>
					{/* Document Preview Section */}
					<div className='flex-1 p-6 border-r border-gray-200 min-h-0'>
						<div className='mb-4 flex items-center gap-4 text-sm text-gray-600'>
							<div className='flex items-center gap-1'>
								<User className='w-4 h-4' />
								<span>By: {proposal.submittedBy}</span>
							</div>
							<div className='flex items-center gap-1'>
								<Calendar className='w-4 h-4' />
								<span>
									Submitted:{' '}
									{new Date(proposal.submittedDate).toLocaleDateString()}
								</span>
							</div>
						</div>

						<div className='bg-gray-100 rounded-lg h-full min-h-[400px] flex items-center justify-center'>
							{proposal.documentUrl ? (
								<iframe
									src={proposal.documentUrl}
									className='w-full h-full rounded-lg'
									title={`Document for ${proposal.title}`}
									frameBorder='0'
								/>
							) : (
								<div className='text-center text-gray-500'>
									<FileText className='w-16 h-16 mx-auto mb-4 opacity-50' />
									<p className='text-lg font-medium'>Document Preview</p>
									<p className='text-sm'>Document preview would appear here</p>
								</div>
							)}
						</div>
					</div>

					{/* Decision Form Section */}
					<div className='w-full lg:w-96 p-6'>
						<form onSubmit={handleSubmit} className='h-full flex flex-col'>
							<div className='flex-1'>
								<h4 className='text-lg font-semibold text-gray-800 mb-6'>
									Make Decision
								</h4>

								{/* Decision Options */}
								<div className='mb-6'>
									<label className='block text-sm font-medium text-gray-700 mb-3'>
										Decision *
									</label>
									<div className='space-y-3'>
										{(['Accept', 'Revise', 'Reject'] as DecisionType[]).map(
											(option) => (
												<label
													key={option}
													className='flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors'
												>
													<input
														type='radio'
														name='decision'
														value={option}
														checked={decision === option}
														onChange={(e) =>
															setDecision(e.target.value as DecisionType)
														}
														className='w-4 h-4 text-wmsu-red bg-gray-100 border-gray-300 focus:ring-wmsu-red focus:ring-2'
													/>
													<span
														className={`ml-3 text-sm font-medium ${
															option === 'Accept'
																? 'text-green-700'
																: option === 'Revise'
																? 'text-orange-700'
																: 'text-red-700'
														}`}
													>
														{option}
													</span>
												</label>
											)
										)}
									</div>
								</div>

								{/* Notes Section */}
								<div className='mb-6'>
									<label
										htmlFor='notes'
										className='block text-sm font-medium text-gray-700 mb-2'
									>
										Comments & Feedback
									</label>
									<textarea
										id='notes'
										value={notes}
										onChange={(e) => setNotes(e.target.value)}
										rows={6}
										className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-wmsu-red focus:border-transparent resize-none'
										placeholder='Provide detailed feedback or comments for the proponent...'
									/>
									<p className='text-xs text-gray-500 mt-1'>
										{notes.length}/500 characters
									</p>
								</div>
							</div>

							{/* Action Buttons */}
							<div className='flex gap-3 pt-4 border-t border-gray-200'>
								<button
									type='button'
									onClick={onClose}
									className='flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium'
								>
									Cancel
								</button>
								<button
									type='submit'
									className='flex-1 px-4 py-2 text-white bg-wmsu-red hover:bg-wmsu-red-dark rounded-lg transition-colors font-medium'
								>
									Submit Decision
								</button>
							</div>
						</form>
					</div>
				</div>
			</div>
		</div>
	);
};

export default ProposalModal;
