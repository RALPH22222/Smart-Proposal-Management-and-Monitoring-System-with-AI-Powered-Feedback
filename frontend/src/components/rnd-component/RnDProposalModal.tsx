import React, { useState, useEffect } from 'react';
import {
	X,
	FileText,
	User,
	Calendar,
	Upload,
	Plus,
	Trash2,
	Clock,
	Users,
	Send,
	Eye,
	EyeOff
} from 'lucide-react';
import {
	type Proposal,
	type Decision,
	type DecisionType,
	type StructuredComments,
	type CommentSection,
	type AttachmentFile,
	type CollaborationSession,
	type Reviewer
} from '../../types/InterfaceProposal';
import { type Evaluator } from '../../types/evaluator';
import templatePDF from '../../assets/template/DOST-Template.pdf';

type EvaluatorAssignPayload = {
	department: string;
	evaluators: Evaluator[];
};

interface EnhancedProposalModalProps {
	proposal: Proposal | null;
	isOpen: boolean;
	onClose: () => void;
	onSubmitDecision: (decision: Decision) => void;
	userRole: 'R&D Staff' | 'Evaluator';
	collaborationSession?: CollaborationSession;
	currentUser: Reviewer;
}

const EnhancedProposalModal: React.FC<EnhancedProposalModalProps> = ({
	proposal,
	isOpen,
	onClose,
	onSubmitDecision,
	userRole,
	collaborationSession,
	currentUser
}) => {
	const evaluators: Evaluator[] = [
		{
			id: '1',
			name: 'Dr. Alice Santos',
			department: 'Information Technology',
			specialty: ['AI', 'Systems'],
			availabilityStatus: 'Available',
			currentWorkload: 2,
			maxWorkload: 5,
			rating: 4.8,
			completedReviews: 20,
			email: 'alice@wmsu.edu.ph',
			agency: 'WMSU - College of Computing Studies'
		},
		{
			id: '2',
			name: 'Prof. Ben Reyes',
			department: 'Computer Science',
			specialty: ['Security', 'Networks'],
			availabilityStatus: 'Busy',
			currentWorkload: 4,
			maxWorkload: 5,
			rating: 4.5,
			completedReviews: 15,
			email: 'ben@wmsu.edu.ph',
			agency: 'WMSU - College of Engineering'
		},
		{
			id: '3',
			name: 'Engr. Carla Lim',
			department: 'Information Technology',
			specialty: ['Databases', 'Web Dev'],
			availabilityStatus: 'Available',
			currentWorkload: 1,
			maxWorkload: 4,
			rating: 4.9,
			completedReviews: 30,
			email: 'carla@wmsu.edu.ph',
			agency: 'WMSU - College of Computing Studies'
		}
	];

	const [decision, setDecision] = useState<DecisionType>('Sent to Evaluators');
	const [evaluationDeadline, setEvaluationDeadline] = useState('14');
	const [structuredComments, setStructuredComments] =
		useState<StructuredComments>({
			objectives: {
				id: '1',
				title: 'Objectives',
				content: '',
				lastModified: '',
				author: currentUser.name
			},
			methodology: {
				id: '2',
				title: 'Methodology',
				content: '',
				lastModified: '',
				author: currentUser.name
			},
			budget: {
				id: '3',
				title: 'Budget',
				content: '',
				lastModified: '',
				author: currentUser.name
			},
			timeline: {
				id: '4',
				title: 'Timeline',
				content: '',
				lastModified: '',
				author: currentUser.name
			},
			overall: {
				id: '5',
				title: 'Overall',
				content: '',
				lastModified: '',
				author: currentUser.name
			},
			additional: []
		});
	const [selectedDepartment, setSelectedDepartment] = useState<string>('');
	const [availableEvaluators, setAvailableEvaluators] = useState<Evaluator[]>(
		[]
	);
	const [selectedEvaluator, setSelectedEvaluator] = useState<Evaluator | null>(
		null
	);
	const [selectedEvaluators, setSelectedEvaluators] = useState<Evaluator[]>([]);
	const [showAnonymitySelection, setShowAnonymitySelection] = useState(false);
	const [showProponentInfo, setShowProponentInfo] = useState<'name' | 'agency' | 'both'>('both');

	const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
	const [activeSection, setActiveSection] = useState<string>('objectives');
	const [typingSection, setTypingSection] = useState<string>('');
	const [showEvaluatorModal, setShowEvaluatorModal] = useState(false);

	// Reset modal state when proposal changes or modal opens
	useEffect(() => {
		if (isOpen && proposal) {
			setDecision('Sent to Evaluators');
			setEvaluationDeadline('14');
			setStructuredComments({
				objectives: {
					id: '1',
					title: 'Objectives',
					content: '',
					lastModified: '',
					author: currentUser.name
				},
				methodology: {
					id: '2',
					title: 'Methodology',
					content: '',
					lastModified: '',
					author: currentUser.name
				},
				budget: {
					id: '3',
					title: 'Budget',
					content: '',
					lastModified: '',
					author: currentUser.name
				},
					timeline: {
					id: '4',
					title: 'Timeline',
					content: '',
					lastModified: '',
					author: currentUser.name
				},
				overall: {
					id: '5',
					title: 'Overall',
					content: '',
					lastModified: '',
					author: currentUser.name
				},
				additional: []
			});
			setAttachments([]);
			setActiveSection('objectives');
			setShowAnonymitySelection(false);
			setShowProponentInfo('both');
		}
	}, [isOpen, proposal, currentUser.name]);

	// Set default comment for reject decision
	useEffect(() => {
		if (decision === 'Rejected Proposal') {
			setStructuredComments((prev) => ({
				...prev,
				objectives: {
					...prev.objectives,
					content:
						prev.objectives.content ||
						'After careful review of this proposal, we have determined that it does not meet the required standards for approval. The following concerns have been identified:\n\n1. [Specify main concern]\n2. [Additional concerns if any]\n\nWe recommend that the proponent address these issues before resubmission.',
					lastModified: new Date().toISOString()
				}
			}));
		}
	}, [decision]);

	// Filter evaluators based on department
	useEffect(() => {
		if (selectedDepartment) {
			const filtered = evaluators.filter((ev) => ev.department === selectedDepartment);
			setAvailableEvaluators(filtered);
		}
	}, [selectedDepartment]);

	// Simulate typing indicators
	useEffect(() => {
		if (typingSection) {
			const timer = setTimeout(() => setTypingSection(''), 2000);
			return () => clearTimeout(timer);
		}
	}, [typingSection]);

	const handleCommentChange = (
		sectionKey: keyof StructuredComments | number,
		content: string
	) => {
		setTypingSection(
			typeof sectionKey === 'string' ? sectionKey : `additional-${sectionKey}`
		);

		setStructuredComments((prev) => {
			if (typeof sectionKey === 'string' && sectionKey !== 'additional') {
				return {
					...prev,
					[sectionKey]: {
						...(prev[sectionKey] as CommentSection),
						content,
						lastModified: new Date().toISOString()
					}
				};
			} else if (typeof sectionKey === 'number') {
				const newAdditional = [...prev.additional];
				newAdditional[sectionKey] = {
					...newAdditional[sectionKey],
					content,
					lastModified: new Date().toISOString()
				};
				return { ...prev, additional: newAdditional };
			}
			return prev;
		});
	};

	const addAdditionalSection = () => {
		const newSection: CommentSection = {
			id: `additional-${Date.now()}`,
			title: `Additional Section ${structuredComments.additional.length + 1}`,
			content: '',
			lastModified: new Date().toISOString(),
			author: currentUser.name
		};

		setStructuredComments((prev) => ({
			...prev,
			additional: [...prev.additional, newSection]
		}));
	};

	const removeAdditionalSection = (index: number) => {
		setStructuredComments((prev) => ({
			...prev,
			additional: prev.additional.filter((_, i) => i !== index)
		}));
	};

	const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
		const files = event.target.files;
		if (files) {
			Array.from(files).forEach((file) => {
				const newAttachment: AttachmentFile = {
					id: `file-${Date.now()}-${Math.random()}`,
					name: file.name,
					url: URL.createObjectURL(file),
					uploadedBy: currentUser.name,
					uploadedDate: new Date().toISOString(),
					type: file.type,
					size: file.size
				};
				setAttachments((prev) => [...prev, newAttachment]);
			});
		}
	};

	const removeAttachment = (attachmentId: string) => {
		setAttachments((prev) => prev.filter((att) => att.id !== attachmentId));
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		if (!proposal) return;

		if (decision === 'Sent to Evaluators' && userRole === 'R&D Staff') {
			handleForwardToEvaluators();
			return;
		}
		const decisionData: Decision = {
			proposalId: proposal.id,
			decision,
			structuredComments,
			attachments,
			reviewedBy: currentUser.name,
			reviewedDate: new Date().toISOString(),
			evaluationDeadline:
				decision === 'Sent to Evaluators'
					? new Date(
							Date.now() + parseInt(evaluationDeadline) * 24 * 60 * 60 * 1000
					  ).toISOString()
					: undefined
		};

		onSubmitDecision(decisionData);
		onClose();
	};

	const handleForwardToEvaluators = () => {
		setShowAnonymitySelection(true);
	};

	const handleAnonymitySelection = (option: 'name' | 'agency' | 'both') => {
		setShowProponentInfo(option);
		setShowAnonymitySelection(false);
		setShowEvaluatorModal(true);
	};

	const handleEvaluatorAssignment = (
		assignmentData: EvaluatorAssignPayload
	) => {
		console.log('Evaluators assigned:', assignmentData);
		console.log('Show proponent info:', showProponentInfo);

		const deadlineIso = new Date(
			Date.now() + parseInt(evaluationDeadline, 10) * 24 * 60 * 60 * 1000
		).toISOString();

		const decisionData: Decision & { proponentInfoVisibility?: 'name' | 'agency' | 'both' } = {
			proposalId: proposal!.id,
			decision: 'Sent to Evaluators',
			structuredComments,
			attachments: [],
			reviewedBy: currentUser.name,
			reviewedDate: new Date().toISOString(),
			evaluationDeadline: deadlineIso,
			proponentInfoVisibility: showProponentInfo
		};

		onSubmitDecision(decisionData);
		setShowEvaluatorModal(false);
		onClose();
	};

	const handleBackdropClick = (e: React.MouseEvent) => {
		if (e.target === e.currentTarget) {
			onClose();
		}
	};

	const getDecisionButtonText = (decisionType: DecisionType) => {
		switch (decisionType) {
			case 'Sent to Evaluators':
				return userRole === 'R&D Staff'
					? 'Sent to Evaluators'
					: 'Approve Proposal';
			case 'Revision Required':
				return 'Send back to Proponent with Feedback';
			case 'Rejected Proposal':
				return 'Reject Proposal with Explanation';
			default:
				return decisionType;
		}
	};

	const shouldShowAttachments = () => {
		return false;
	};

	const shouldShowStructuredComments = () => {
		return decision === 'Revision Required';
	};

	const shouldShowSimpleComments = () => {
		return (
			decision === 'Sent to Evaluators' || decision === 'Rejected Proposal'
		);
	};

	const formatFileSize = (bytes: number) => {
		if (bytes === 0) return '0 Bytes';
		const k = 1024;
		const sizes = ['Bytes', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
	};

	if (!isOpen || !proposal) return null;

	const sections = [
		{
			key: 'objectives',
			title: 'Objectives Assessment',
			data: structuredComments.objectives
		},
		{
			key: 'methodology',
			title: 'Methodology Assessment',
			data: structuredComments.methodology
		},
		{
			key: 'budget',
			title: 'Budget Assessment',
			data: structuredComments.budget
		},
		{
		       key: 'timeline',
			title: 'Timeline Assessment',
			data: structuredComments.timeline
		},
		{
		
			key: 'overall',
			title: 'Overall Asessment',
			data: structuredComments.overall
		},
		...structuredComments.additional.map((section, index) => ({
			key: `additional-${index}`,
			title: section.title,
			data: section
		}))
	];

	return (
		<>
			{/* Main Modal */}
			<div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4'>
				<div className='bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[100vh] overflow-hidden'>
					{/* Modal Header */}
					<div className='p-4 sm:p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50'>
						<div className='flex-1 text-gray-600'>
							<div className='flex items-center gap-3 mb-1'>
								<h2 className='text-lg font-bold text-black'>
									{userRole === 'R&D Staff'
										? 'Review Proposal'
										: 'Evaluate Proposal'}
								</h2>
								{userRole === 'Evaluator' && collaborationSession && (
									<div className='flex items-center gap-2 bg-white bg-opacity-20 rounded-full px-2 py-1'>
										<Users className='w-3 h-3' />
										<span className='text-xs'>
											{collaborationSession.activeEvaluators.length} evaluators
										</span>
									</div>
								)}
							</div>
							<h3 className='text-base font-medium opacity-90 line-clamp-2'>
								{proposal.title}
							</h3>
							{proposal.evaluationDeadline && (
								<div className='flex items-center gap-1 mt-1 text-xs opacity-80'>
									<Clock className='w-3 h-3' />
									<span>
										Deadline:{' '}
										{new Date(proposal.evaluationDeadline).toLocaleDateString()}
									</span>
								</div>
							)}
						</div>
						<button
							onClick={onClose}
							className='p-1 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors flex-shrink-0 ml-2 text-white'
							aria-label='Close modal'
						>
							<X className='w-5 h-5 text-black' />
						</button>
					</div>

					<div className='flex flex-col lg:flex-row h-full max-h-[calc(90vh-64px)] min-h-[500px]'>
						{/* Document Preview Section */}
						<div className='flex-1 p-4 lg:border-r border-gray-200 min-h-0 overflow-hidden'>
							<div className='mb-3 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-xs text-gray-600'>
								<div className='flex items-center gap-1'>
									<User className='w-3 h-3' />
									<span className='truncate'>By: {proposal.submittedBy}</span>
								</div>
								<div className='flex items-center gap-1'>
									<Calendar className='w-3 h-3' />
									<span className='truncate'>
										Submitted:{' '}
										{new Date(proposal.submittedDate).toLocaleDateString()}
									</span>
								</div>
								{proposal.rdStaffReviewer && (
									<div className='flex items-center gap-1'>
										<User className='w-3 h-3' />
										<span className='truncate'>
											R&D Reviewer: {proposal.rdStaffReviewer}
										</span>
									</div>
								)}
							</div>

							<div className='bg-gray-100 rounded-lg h-[100px] min-h-[460px] flex items-center justify-center overflow-hidden'>
								{proposal.documentUrl ? (
								<iframe
                                                          src={proposal.documentUrl || templatePDF}
                                                          className='w-full h-full rounded-lg border-0'
                                                          title={`Document for ${proposal.title}`}
                                                        />
								) : (
									<div className='text-center text-gray-500'>
										<FileText className='w-12 h-12 mx-auto mb-2 opacity-50' />
										<p className='text-sm font-medium'>Document Preview</p>
										<p className='text-xs'>Document preview would appear here</p>
									</div>
								)}
							</div>
						</div>

						{/* Review Form Section */}
						<div className='w-full lg:w-[450px] border-t lg:border-t-0 border-gray-200 overflow-y-auto'>
							<form onSubmit={handleSubmit} className='h-full flex flex-col'>
								{/* Decision Options */}
								<div className='p-4 border-b border-gray-200'>
									<h4 className='text-base font-semibold text-gray-800 mb-3'>
										Make Decision
									</h4>
									<div className='space-y-2'>
										{(
											[
												'Sent to Evaluators',
												'Revision Required',
												'Rejected Proposal'
											] as DecisionType[]
										).map((option) => (
											<label
												key={option}
												className='flex items-center p-2 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors'
											>
												<input
													type='radio'
													name='decision'
													value={option}
													checked={decision === option}
													onChange={(e) =>
														setDecision(e.target.value as DecisionType)
													}
													className='w-3 h-3 text-[#C10003] bg-gray-100 border-gray-300 focus:ring-[#C10003] focus:ring-2'
												/>
												<div className='ml-2 flex-1'>
													<span
														className={`text-xs font-medium ${
															option === 'Sent to Evaluators'
																? 'text-green-700'
																: option === 'Revision Required'
																? 'text-orange-700'
																: 'text-red-700'
														}`}
													>
														{getDecisionButtonText(option)}
													</span>
												</div>
											</label>
										))}
									</div>
								</div>

								{/* Time Limit Section - Only show for "Forward to Evaluators" */}
								{decision === 'Sent to Evaluators' && (
									<div className='p-4 border-b border-gray-200'>
										<h4 className='text-base font-semibold text-gray-800 mb-3'>
											Evaluation Time Limit
										</h4>
										<div className='space-y-2'>
											<label className='block text-xs font-medium text-gray-700'>
												Deadline for evaluators to complete review:
											</label>
											<select
												value={evaluationDeadline}
												onChange={(e) => setEvaluationDeadline(e.target.value)}
												className='w-full px-2 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C10003] focus:border-transparent'
											>
												<option value='7'>1 Week</option>
												<option value='14'>2 Weeks (Default)</option>
												<option value='21'>3 Weeks</option>
												<option value='30'>1 Month</option>
												<option value='45'>6 Weeks</option>
												<option value='60'>2 Months</option>
											</select>
											<p className='text-xs text-gray-500'>
												Evaluators will be notified of this deadline when the
												proposal is assigned to them.
											</p>
										</div>
									</div>
								)}

								{/* Evaluator Assignment Section - Only show for "Forward to Evaluators" */}
								{decision === 'Sent to Evaluators' && (
									<div className='p-4 border-b border-gray-200'>
										<h4 className='text-base font-semibold text-gray-800 mb-3'>
											Evaluator Assignment
										</h4>

										<p className='text-xs text-gray-600 mb-3'>
											Choose a department first, then pick evaluator(s) to assign
											for this proposal.
										</p>

										{/* Step 1: Department Dropdown */}
										<div className='mb-3'>
											<label className='block text-xs font-medium text-gray-700 mb-1'>
												Select Department
											</label>
											<select
												value={selectedDepartment}
												onChange={(e) => {
													const dept = e.target.value;
													setSelectedDepartment(dept);
													setSelectedEvaluators([]);
												}}
												className='block w-full px-2 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C10003] focus:border-transparent'
											>
												<option value=''>-- Choose Department --</option>
												{[...new Set(evaluators.map((e) => e.department))].map(
													(dept) => (
														<option key={dept} value={dept}>
															{dept}
														</option>
													)
												)}
											</select>
										</div>

										{/* Step 2: Evaluator Dropdown */}
										{selectedDepartment && (
											<div className='mb-3'>
												<label className='block text-xs font-medium text-gray-700 mb-1'>
													Select Evaluator
												</label>
												<div className='flex items-center gap-2'>
													<select
														value={selectedEvaluator?.id || ''}
														onChange={(e) => {
															const selected = availableEvaluators.find(
																(ev) => ev.id === e.target.value
															);
															setSelectedEvaluator(selected || null);
														}}
														className='flex-1 px-2 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C10003] focus:border-transparent'
													>
														<option value=''>-- Choose Evaluator --</option>
														{availableEvaluators.map((ev) => (
															<option key={ev.id} value={ev.id}>
																{ev.name} - {ev.agency}
															</option>
														))}
													</select>

													<button
														type='button'
														disabled={!selectedEvaluator}
														onClick={() => {
															if (
																selectedEvaluator &&
																!selectedEvaluators.some(
																	(e) => e.id === selectedEvaluator.id
																)
															) {
																setSelectedEvaluators([
																	...selectedEvaluators,
																	selectedEvaluator
																]);
																setSelectedEvaluator(null);
															}
														}}
														className={`px-3 py-1 text-xs rounded-md text-white font-medium ${
															selectedEvaluator
																? 'bg-[#C10003] hover:bg-[#A00002]'
																: 'bg-gray-300 cursor-not-allowed'
														}`}
													>
														Add
													</button>
												</div>
											</div>
										)}

										{/* Step 3: Display Added Evaluators */}
										{selectedEvaluators.length > 0 && (
											<div className='mt-3'>
												<h5 className='text-xs font-medium text-gray-800 mb-2'>
													Assigned Evaluators ({selectedEvaluators.length}):
												</h5>
												<div className='space-y-1 max-h-24 overflow-y-auto'>
													{selectedEvaluators.map((ev) => (
														<div
															key={ev.id}
															className='bg-[#C10003] text-white px-2 py-1 rounded text-xs flex items-center justify-between'
														>
															<div className='flex-1 min-w-0'>
																<p className='font-medium truncate'>{ev.name}</p>
																<p className='text-[10px] opacity-80 truncate'>{ev.agency}</p>
															</div>
															<button
																type='button'
																className='text-white hover:text-gray-200 ml-2 flex-shrink-0'
																onClick={() =>
																	setSelectedEvaluators(
																		selectedEvaluators.filter(
																			(e) => e.id !== ev.id
																		)
																	)
																}
															>
																✕
															</button>
														</div>
													))}
												</div>
											</div>
										)}
									</div>
								)}

								{/* Structured Comments Section */}
								{shouldShowStructuredComments() && (
									<div className='flex-1 p-4 border-b border-gray-200'>
										<div className='flex items-center justify-between mb-3'>
											<h4 className='text-base font-semibold text-gray-800'>
												Structured Comments
											</h4>
											<button
												type='button'
												onClick={addAdditionalSection}
												className='flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors'
											>
												<Plus className='w-3 h-3' />
												Add Section
											</button>
										</div>

										{/* Section Tabs */}
										<div className='flex flex-wrap gap-1 mb-3 border-b border-gray-200'>
											{sections.map((section) => (
												<button
													key={section.key}
													type='button'
													onClick={() => setActiveSection(section.key)}
													className={`px-2 py-1 text-xs font-medium rounded-t-lg transition-colors ${
														activeSection === section.key
															? 'bg-[#C10003] text-white'
															: 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
													}`}
												>
													{section.title}
													{section.data.content && (
														<span className='ml-1 w-1 h-1 bg-green-400 rounded-full inline-block'></span>
													)}
												</button>
											))}
										</div>

										{/* Active Section Content */}
										{sections.map((section) => (
											<div
												key={section.key}
												className={
													activeSection === section.key ? 'block' : 'hidden'
												}
											>
												<div className='flex items-center justify-between mb-2'>
													<label className='block text-xs font-medium text-gray-700'>
														{section.title}
													</label>
													{section.key.startsWith('additional-') && (
														<button
															type='button'
															onClick={() =>
																removeAdditionalSection(
																	parseInt(section.key.split('-')[1])
																)
															}
															className='p-1 text-red-500 hover:text-red-700 transition-colors'
														>
															<Trash2 className='w-3 h-3' />
														</button>
													)}
												</div>

												<textarea
													value={section.data.content}
													onChange={(e) => {
														if (section.key.startsWith('additional-')) {
															handleCommentChange(
																parseInt(section.key.split('-')[1]),
																e.target.value
															);
														} else {
															handleCommentChange(
																section.key as keyof StructuredComments,
																e.target.value
															);
														}
													}}
													rows={3}
													className='w-full px-2 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C10003] focus:border-transparent resize-none'
													placeholder={`Enter your comments for ${section.title.toLowerCase()}...`}
												/>

												{/* Typing Indicator */}
												{typingSection === section.key &&
													userRole === 'Evaluator' && (
														<p className='text-xs text-blue-600 mt-1 animate-pulse'>
															You are typing...
														</p>
													)}

												{/* Collaboration Indicators */}
												{userRole === 'Evaluator' &&
													collaborationSession?.typingIndicators[section.key] && (
														<p className='text-xs text-green-600 mt-1 animate-pulse'>
															{collaborationSession.typingIndicators[section.key]}{' '}
															is typing...
														</p>
													)}
											</div>
										))}
									</div>
								)}

								{/* Simple Comments Section */}
								{shouldShowSimpleComments() && (
									<div className='flex-1 p-4 border-b border-gray-200'>
										<h4 className='text-base font-semibold text-gray-800 mb-3'>
											{decision === 'Sent to Evaluators'
												? 'Comments for Evaluators'
												: 'Rejection Explanation'}
										</h4>
										<textarea
											value={structuredComments.objectives.content}
											onChange={(e) =>
												handleCommentChange('objectives', e.target.value)
											}
											rows={4}
											className='w-full px-2 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C10003] focus:border-transparent resize-none'
											placeholder={
												decision === 'Sent to Evaluators'
													? 'Enter any comments or instructions for the evaluators...'
													: 'Provide a clear explanation for rejecting this proposal...'
											}
										/>
									</div>
								)}

								{/* Action Buttons */}
								<div className='p-4'>
									<div className='flex flex-col gap-2'>
										<button
											type='button'
											onClick={onClose}
											className='w-full px-3 py-2 text-xs text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium'
										>
											Cancel
										</button>
										{decision === 'Sent to Evaluators' &&
										userRole === 'R&D Staff' ? (
											<button
												type='button'
												onClick={handleForwardToEvaluators}
												className='w-full px-3 py-2 text-xs text-white bg-[#C10003] hover:bg-[#A00002] rounded-lg transition-colors font-medium flex items-center justify-center gap-1'
											>
												<Send className='w-3 h-3' />
												<span>Forward to Evaluators</span>
											</button>
										) : (
											<button
												type='submit'
												className='w-full px-3 py-2 text-xs text-white bg-[#C10003] hover:bg-[#A00002] rounded-lg transition-colors font-medium'
											>
												{getDecisionButtonText(decision)}
											</button>
										)}
									</div>
								</div>
							</form>
						</div>
					</div>
				</div>
			</div>

			{/* Anonymity Selection Modal */}
			{showAnonymitySelection && (
				<div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4'>
					<div className='bg-white rounded-xl shadow-2xl w-full max-w-md'>
						<div className='p-6'>
							<div className='flex items-center gap-3 mb-4'>
								<Eye className='w-6 h-6 text-[#C10003]' />
								<h3 className='text-lg font-semibold text-gray-800'>
									Proponent Information Visibility
								</h3>
							</div>
							
							<p className='text-sm text-gray-600 mb-6'>
								Choose what information about the proponent will be visible to evaluators:
							</p>

							<div className='space-y-3 mb-6'>
								<label className='flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors'>
									<input
										type='radio'
										name='proponentInfo'
										value='both'
										checked={showProponentInfo === 'both'}
										onChange={() => handleAnonymitySelection('both')}
										className='w-4 h-4 text-[#C10003] bg-gray-100 border-gray-300 focus:ring-[#C10003] focus:ring-2'
									/>
									<div className='ml-3 flex-1'>
										<span className='text-sm font-medium text-gray-700'>Show Both Name and Agency</span>
										<p className='text-xs text-gray-500 mt-1'>Evaluators will see the proponent's full name and agency</p>
									</div>
								</label>

								<label className='flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors'>
									<input
										type='radio'
										name='proponentInfo'
										value='name'
										checked={showProponentInfo === 'name'}
										onChange={() => handleAnonymitySelection('name')}
										className='w-4 h-4 text-[#C10003] bg-gray-100 border-gray-300 focus:ring-[#C10003] focus:ring-2'
									/>
									<div className='ml-3 flex-1'>
										<span className='text-sm font-medium text-gray-700'>Show Name Only</span>
										<p className='text-xs text-gray-500 mt-1'>Hide agency information, show only proponent name</p>
									</div>
								</label>

								<label className='flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors'>
									<input
										type='radio'
										name='proponentInfo'
										value='agency'
										checked={showProponentInfo === 'agency'}
										onChange={() => handleAnonymitySelection('agency')}
										className='w-4 h-4 text-[#C10003] bg-gray-100 border-gray-300 focus:ring-[#C10003] focus:ring-2'
									/>
									<div className='ml-3 flex-1'>
										<span className='text-sm font-medium text-gray-700'>Show Agency Only</span>
										<p className='text-xs text-gray-500 mt-1'>Hide proponent name, show only agency information</p>
									</div>
								</label>
							</div>

							<div className='flex gap-3'>
								<button
									onClick={() => setShowAnonymitySelection(false)}
									className='flex-1 px-4 py-3 text-gray-600 bg-transparent hover:bg-gray-50 rounded-lg transition-colors font-medium border border-gray-300'
								>
									Cancel
								</button>
								<button
									onClick={() => handleAnonymitySelection(showProponentInfo)}
									className='flex-1 px-4 py-3 text-white bg-[#C10003] hover:bg-[#A00002] rounded-lg transition-colors font-medium'
								>
									Continue
								</button>
							</div>
						</div>
					</div>
				</div>
			)}
		</>
	);
};

export default EnhancedProposalModal;