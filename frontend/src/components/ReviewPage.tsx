import React, { useState, useEffect } from 'react';
import { FileText, Calendar, User, Eye, Filter, Search } from 'lucide-react';
import {
	type Proposal,
	type Decision,
	type ProposalStatus
} from '../types/proposal';
import { proposalApi } from '../services/proposalApi';
import ProposalModal from './ProposalModal';
import Navbar from './NavbarR&D';

const ReviewPage: React.FC = () => {
	const [proposals, setProposals] = useState<Proposal[]>([]);
	const [filteredProposals, setFilteredProposals] = useState<Proposal[]>([]);
	const [loading, setLoading] = useState(true);
	const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(
		null
	);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [statusFilter, setStatusFilter] = useState<ProposalStatus | 'All'>(
		'All'
	);
	const [searchTerm, setSearchTerm] = useState('');

	// Load proposals on component mount
	useEffect(() => {
		loadProposals();
	}, []);

	// Filter proposals based on status and search term
	useEffect(() => {
		let filtered = proposals;

		// Apply status filter
		if (statusFilter !== 'All') {
			filtered = filtered.filter(
				(proposal) => proposal.status === statusFilter
			);
		}

		// Apply search filter
		if (searchTerm) {
			filtered = filtered.filter(
				(proposal) =>
					proposal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
					proposal.submittedBy
						.toLowerCase()
						.includes(searchTerm.toLowerCase()) ||
					proposal.id.toLowerCase().includes(searchTerm.toLowerCase())
			);
		}

		setFilteredProposals(filtered);
	}, [proposals, statusFilter, searchTerm]);

	const loadProposals = async () => {
		try {
			setLoading(true);
			const data = await proposalApi.fetchProposals();
			setProposals(data);
		} catch (error) {
			console.error('Error loading proposals:', error);
		} finally {
			setLoading(false);
		}
	};

	const handleViewProposal = (proposal: Proposal) => {
		setSelectedProposal(proposal);
		setIsModalOpen(true);
	};

	const handleCloseModal = () => {
		setIsModalOpen(false);
		setSelectedProposal(null);
	};

	const handleSubmitDecision = async (decision: Decision) => {
		try {
			// Submit decision to API
			await proposalApi.submitDecision(decision);

			// Update proposal status locally
			const newStatus: ProposalStatus =
				decision.decision === 'Accept'
					? 'Accepted'
					: decision.decision === 'Reject'
					? 'Rejected'
					: 'Revisable';

			// Update the proposal in state
			setProposals((prev) =>
				prev.map((proposal) =>
					proposal.id === decision.proposalId
						? {
								...proposal,
								status: newStatus,
								lastModified: new Date().toISOString()
						  }
						: proposal
				)
			);

			// Update status via API
			await proposalApi.updateProposalStatus(decision.proposalId, newStatus);

			console.log('Decision submitted successfully:', decision);
		} catch (error) {
			console.error('Error submitting decision:', error);
		}
	};

	const getStatusBadge = (status: ProposalStatus) => {
		const baseClasses =
			'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';

		switch (status) {
			case 'Pending':
				return `${baseClasses} bg-blue-100 text-blue-800`;
			case 'Accepted':
				return `${baseClasses} bg-green-100 text-green-800`;
			case 'Rejected':
				return `${baseClasses} bg-red-100 text-red-800`;
			case 'Revisable':
				return `${baseClasses} bg-orange-100 text-orange-800`;
			default:
				return `${baseClasses} bg-gray-100 text-gray-800`;
		}
	};

	const getStatusCount = (status: ProposalStatus | 'All') => {
		if (status === 'All') return proposals.length;
		return proposals.filter((p) => p.status === status).length;
	};

	if (loading) {
		return (
			<div className='min-h-screen bg-gray-50 flex items-center justify-center'>
				<div className='text-center'>
					<div className='animate-spin rounded-full h-12 w-12 border-b-2 border-wmsu-red mx-auto'></div>
					<p className='mt-4 text-gray-600'>Loading proposals...</p>
				</div>
			</div>
		);
	}

	return (
		<div className='min-h-screen bg-gray-50'>
			{/* Navigation Bar */}
			<Navbar
				userName='Dr. John Smith'
				userEmail='j.smith@wmsu.edu.ph'
				onLogout={() => {
					console.log('User logged out');
					// In real app: redirect to login page or clear auth state
				}}
			/>

			{/* Header */}
			<div className='bg-white shadow-sm border-b'>
				<div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
					<div className='py-6'>
						<h1 className='text-3xl font-bold text-gray-900'>
							Research Proposal Review
						</h1>
						<p className='mt-2 text-gray-600'>
							Review and evaluate research proposals submitted to WMSU
						</p>
					</div>
				</div>
			</div>

			{/* Main Content */}
			<div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
				{/* Filters and Search */}
				<div className='mb-8 bg-white rounded-lg shadow-sm p-6'>
					<div className='flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center'>
						{/* Search */}
						<div className='relative flex-1 max-w-md'>
							<div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
								<Search className='h-5 w-5 text-gray-400' />
							</div>
							<input
								type='text'
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								placeholder='Search proposals...'
								className='block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
							/>
						</div>

						{/* Status Filter */}
						<div className='flex items-center gap-2'>
							<Filter className='h-5 w-5 text-gray-400' />
							<select
								value={statusFilter}
								onChange={(e) =>
									setStatusFilter(e.target.value as ProposalStatus | 'All')
								}
								className='border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-wmsu-red focus:border-transparent'
							>
								<option value='All'>All ({getStatusCount('All')})</option>
								<option value='Pending'>
									Pending ({getStatusCount('Pending')})
								</option>
								<option value='Revisable'>
									Revisable ({getStatusCount('Revisable')})
								</option>
								<option value='Accepted'>
									Accepted ({getStatusCount('Accepted')})
								</option>
								<option value='Rejected'>
									Rejected ({getStatusCount('Rejected')})
								</option>
							</select>
						</div>
					</div>
				</div>

				{/* Proposals Grid */}
				{filteredProposals.length === 0 ? (
					<div className='bg-white rounded-lg shadow-sm p-12 text-center'>
						<FileText className='w-16 h-16 text-gray-300 mx-auto mb-4' />
						<h3 className='text-lg font-medium text-gray-900 mb-2'>
							No proposals found
						</h3>
						<p className='text-gray-600'>
							{searchTerm || statusFilter !== 'All'
								? 'Try adjusting your search or filter criteria.'
								: 'No proposals have been submitted yet.'}
						</p>
					</div>
				) : (
					<div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
						{filteredProposals.map((proposal) => (
							<div
								key={proposal.id}
								className='bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow duration-200'
							>
								<div className='p-6'>
									{/* Header */}
									<div className='flex items-start justify-between mb-4'>
										<div className='flex-1'>
											<div className='flex items-center gap-2 mb-2'>
												<span className='text-sm font-medium text-gray-500'>
													{proposal.id}
												</span>
												<span className={getStatusBadge(proposal.status)}>
													{proposal.status}
												</span>
											</div>
											<h3 className='text-lg font-semibold text-gray-900 line-clamp-3 mb-3'>
												{proposal.title}
											</h3>
										</div>
									</div>

									{/* Meta Info */}
									<div className='space-y-2 mb-6'>
										<div className='flex items-center text-sm text-gray-600'>
											<User className='w-4 h-4 mr-2' />
											<span>{proposal.submittedBy}</span>
										</div>
										<div className='flex items-center text-sm text-gray-600'>
											<Calendar className='w-4 h-4 mr-2' />
											<span>
												Submitted:{' '}
												{new Date(proposal.submittedDate).toLocaleDateString()}
											</span>
										</div>
									</div>

									{/* Actions */}
									<div className='flex gap-3'>
										<button
											onClick={() => handleViewProposal(proposal)}
											className='flex-1 inline-flex items-center justify-center px-4 py-2 bg-wmsu-red text-white text-sm font-medium rounded-lg hover:bg-wmsu-red-dark transition-colors'
										>
											<Eye className='w-4 h-4 mr-2' />
											View Documents
										</button>
									</div>
								</div>
							</div>
						))}
					</div>
				)}
			</div>

			{/* Modal */}
			<ProposalModal
				proposal={selectedProposal}
				isOpen={isModalOpen}
				onClose={handleCloseModal}
				onSubmitDecision={handleSubmitDecision}
			/>
		</div>
	);
};

export default ReviewPage;
