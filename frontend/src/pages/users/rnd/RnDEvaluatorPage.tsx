import React, { useState } from 'react';
import {
	Clock,
	Edit2,
	User,
	FileText,
	Search,
	Filter,
	History,
	TrendingUp,
	ChevronLeft,
	ChevronRight
} from 'lucide-react';
import RnDEvaluatorPageModal from '../../../components/RnDEvaluatorPageModal';

interface Assignment {
	id: string;
	proposalId: string;
	proposalTitle: string;
	evaluatorIds: string[];
	evaluatorNames: string[];
	department: string;
	deadline: string;
	status: 'Pending' | 'Accepts' | 'Completed' | 'Overdue' | 'Rejected';
}

interface HistoryRecord {
	id: string;
	evaluatorName: string;
	decision: 'Accept' | 'Reject';
	comment: string;
	date: string;
}

interface EvaluatorOption {
	id: string;
	name: string;
	department: string;
	status: 'Accepts' | 'Rejected' | 'Pending';
}

export const RnDEvaluatorPage: React.FC = () => {
	const [search, setSearch] = useState('');
	const [statusFilter, setStatusFilter] = useState('All');
	const [showHistoryModal, setShowHistoryModal] = useState(false);
	const [selectedProposalHistory, setSelectedProposalHistory] = useState<HistoryRecord[]>([]);
	const [showModal, setShowModal] = useState(false);
	const [currentEvaluators, setCurrentEvaluators] = useState<EvaluatorOption[]>([]);
	const [currentPage, setCurrentPage] = useState(1);
	const itemsPerPage = 5;

	const [assignments] = useState<Assignment[]>([
		{
			id: '1',
			proposalId: 'p1',
			proposalTitle: 'AI-driven Smart Proposal Management System',
			evaluatorIds: ['e1', 'e2'],
			evaluatorNames: ['Dr. Alice Santos', 'Prof. Ben Reyes'],
			department: 'Information Technology',
			deadline: '2025-10-20',
			status: 'Accepts'
		},
		{
			id: '2',
			proposalId: 'p2',
			proposalTitle: 'Blockchain-based Voting Application',
			evaluatorIds: ['e3'],
			evaluatorNames: ['Engr. Carla Lim'],
			department: 'Information Technology',
			deadline: '2025-10-25',
			status: 'Pending'
		},
		{
			id: '3',
			proposalId: 'p3',
			proposalTitle: 'IoT-based Waste Management for Zamboanga City',
			evaluatorIds: ['e4', 'e5'],
			evaluatorNames: ['Dr. John Cruz', 'Prof. Eva Martinez'],
			department: 'Engineering',
			deadline: '2025-10-30',
			status: 'Rejected'
		},
		{
			id: '4',
			proposalId: 'p4',
			proposalTitle: 'Machine Learning for Agricultural Optimization',
			evaluatorIds: ['e6', 'e7'],
			evaluatorNames: ['Dr. Maria Santos', 'Prof. Carlos Reyes'],
			department: 'Agriculture',
			deadline: '2025-11-05',
			status: 'Completed'
		},
		{
			id: '5',
			proposalId: 'p5',
			proposalTitle: 'Renewable Energy Microgrid Systems',
			evaluatorIds: ['e8'],
			evaluatorNames: ['Engr. David Tan'],
			department: 'Engineering',
			deadline: '2025-09-15',
			status: 'Overdue'
		}
	]);

	const mockHistoryData: Record<string, HistoryRecord[]> = {
		p1: [
			{
				id: 'h1',
				evaluatorName: 'Dr. Alice Santos',
				decision: 'Accept',
				comment: 'Excellent and feasible research idea.',
				date: '2025-10-02'
			},
			{
				id: 'h2',
				evaluatorName: 'Prof. Ben Reyes',
				decision: 'Reject',
				comment: 'Needs better scope definition.',
				date: '2025-10-03'
			}
		],
		p2: [
			{
				id: 'h3',
				evaluatorName: 'Engr. Carla Lim',
				decision: 'Reject',
				comment: 'Incomplete methodology section.',
				date: '2025-10-05'
			}
		],
		p3: [
			{
				id: 'h4',
				evaluatorName: 'Dr. John Cruz',
				decision: 'Reject',
				comment: 'Not aligned with current R&D goals.',
				date: '2025-10-07'
			}
		]
	};

	const handleViewHistory = (proposalId: string) => {
		setSelectedProposalHistory(mockHistoryData[proposalId] || []);
		setShowHistoryModal(true);
	};

	const handleEdit = (id: string) => {
		const record = assignments.find((a) => a.id === id);
		if (record) {
			setCurrentEvaluators(
				record.evaluatorNames.map((name, index) => ({
					id: record.evaluatorIds[index] || `temp-${index}`,
					name,
					department: record.department,
					status:
						record.status === 'Rejected'
							? 'Rejected'
							: record.status === 'Accepts'
							? 'Accepts'
							: 'Pending'
				}))
			);
			setShowModal(true);
		}
	};

	const handleReassignEvaluators = (newEvaluators: EvaluatorOption[]) => {
		console.log('Reassigned Evaluators:', newEvaluators);
		setShowModal(false);
	};

	const filteredAssignments = assignments.filter((a) => {
		const matchesSearch =
			a.evaluatorNames
				.join(', ')
				.toLowerCase()
				.includes(search.toLowerCase()) ||
			a.proposalTitle.toLowerCase().includes(search.toLowerCase());
		const matchesStatus = statusFilter === 'All' || a.status === statusFilter;
		return matchesSearch && matchesStatus;
	});

	// Pagination
	const totalPages = Math.ceil(filteredAssignments.length / itemsPerPage);
	const startIndex = (currentPage - 1) * itemsPerPage;
	const paginatedAssignments = filteredAssignments.slice(startIndex, startIndex + itemsPerPage);

	const getStatusBadge = (status: string) => {
		const baseClasses = 'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border border-current border-opacity-20';

		switch (status) {
			case 'Overdue':
				return `${baseClasses} text-red-600 bg-red-50 border-red-200`;
			case 'Completed':
				return `${baseClasses} text-emerald-600 bg-emerald-50 border-emerald-200`;
			case 'Accepts':
				return `${baseClasses} text-emerald-600 bg-emerald-50 border-emerald-200`;
			case 'Rejected':
				return `${baseClasses} text-red-600 bg-red-50 border-red-200`;
			case 'Pending':
				return `${baseClasses} text-amber-600 bg-amber-50 border-amber-200`;
			default:
				return `${baseClasses} text-slate-600 bg-slate-50 border-slate-200`;
		}
	};

	return (
		<div className="bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen lg:h-screen flex flex-col lg:flex-row gap-0 lg:gap-6">
			<div className="flex-1 flex flex-col gap-4 sm:gap-6 p-2 sm:p-2 overflow-hidden pt-2 lg:pt-2">
				{/* Header */}
				<header className="flex-shrink-0">
					<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
						<div>
							<h1 className="text-2xl sm:text-3xl font-bold text-[#C8102E] leading-tight">
								Evaluator Assignment Tracker
							</h1>
							<p className="text-slate-600 mt-2 text-sm leading-relaxed">
								Track evaluator assignments, deadlines, and proposal statuses across departments
							</p>
						</div>
						<div className="flex items-center gap-2 text-xs text-slate-500">
							<TrendingUp className="w-4 h-4" />
							<span>Last updated: Today, 2:30 PM</span>
						</div>
					</div>
				</header>

				{/* Filters and Search */}
				<section className="flex-shrink-0" aria-label="Filter assignments">
					<div className="bg-white shadow-xl rounded-2xl border border-slate-200 p-4">
						<div className="flex flex-col sm:flex-row sm:items-center gap-4">
							{/* Search */}
							<div className="relative flex-1 max-w-md">
								<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
									<Search className="h-4 w-4 text-slate-400" aria-hidden="true" />
								</div>
								<input
									type="text"
									placeholder="Search evaluators or proposal titles..."
									value={search}
									onChange={(e) => setSearch(e.target.value)}
									className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-[#C8102E] transition-colors"
									aria-label="Search assignments"
								/>
							</div>

							{/* Status Filter */}
							<div className="relative">
								<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
									<Filter className="h-4 w-4 text-slate-400" aria-hidden="true" />
								</div>
								<select
									value={statusFilter}
									onChange={(e) => setStatusFilter(e.target.value)}
									className="appearance-none bg-white pl-10 pr-8 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-[#C8102E] transition-colors"
									aria-label="Filter by status"
								>
									<option value="All">All Statuses</option>
									<option value="Pending">Pending</option>
									<option value="Accepts">Accepts</option>
									<option value="Completed">Completed</option>
									<option value="Overdue">Overdue</option>
									<option value="Rejected">Rejected</option>
								</select>
							</div>
						</div>

						<div className="mt-4 text-xs text-slate-600">
							Showing {filteredAssignments.length} of {assignments.length} assignments
						</div>
					</div>
				</section>

				{/* Assignments List */}
				<main className="bg-white shadow-xl rounded-2xl border border-slate-200 overflow-hidden flex-1 flex flex-col">
					<div className="p-4 border-b border-slate-200 bg-slate-50">
						<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
							<h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
								<FileText className="w-5 h-5 text-[#C8102E]" />
								Evaluator Assignments
							</h3>
							<div className="flex items-center gap-2 text-xs text-slate-500">
								<User className="w-4 h-4" />
								<span>{new Set(assignments.flatMap(a => a.evaluatorIds)).size} total evaluators</span>
							</div>
						</div>
					</div>

					<div className="flex-1 overflow-y-auto">
						{filteredAssignments.length === 0 ? (
							<div className="text-center py-12 px-4">
								<div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
									<FileText className="w-8 h-8 text-slate-400" />
								</div>
								<h3 className="text-lg font-medium text-slate-900 mb-2">No assignments found</h3>
								<p className="text-slate-500 max-w-sm mx-auto">
									{search || statusFilter !== 'All'
										? 'Try adjusting your search or filter criteria.'
										: 'No assignments have been created yet.'}
								</p>
							</div>
						) : (
							<div className="divide-y divide-slate-100">
								{paginatedAssignments.map((assignment) => (
									<article
										key={assignment.id}
										className="p-4 hover:bg-slate-50 transition-colors duration-200 group"
										aria-labelledby={`assignment-title-${assignment.id}`}
									>
										<div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
											<div className="flex-1 min-w-0">
												<h2
													id={`assignment-title-${assignment.id}`}
													className="text-base font-semibold text-slate-800 mb-2 line-clamp-2 group-hover:text-[#C8102E] transition-colors duration-200"
												>
													{assignment.proposalTitle}
												</h2>

												<div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mb-2">
													<div className="flex items-center gap-1.5">
														<User className="w-3 h-3" aria-hidden="true" />
														<span>{assignment.evaluatorNames.join(', ')}</span>
													</div>
													<div className="flex items-center gap-1.5">
														<Clock className="w-3 h-3" aria-hidden="true" />
														<span>Deadline: {new Date(assignment.deadline).toLocaleDateString()}</span>
													</div>
													<div className="flex items-center gap-1.5">
														<span className="text-xs font-medium text-slate-500">{assignment.department}</span>
													</div>
												</div>
											</div>

											<div className="flex items-center gap-3 flex-shrink-0">
												<span className={getStatusBadge(assignment.status)}>
													{assignment.status}
												</span>

												<div className="flex items-center gap-2">
													<button
														onClick={() => handleViewHistory(assignment.proposalId)}
														className="inline-flex items-center justify-center px-3 h-8 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-all duration-200 cursor-pointer text-xs font-medium"
														aria-label={`View history for ${assignment.proposalTitle}`}
													>
														<History className="w-3 h-3 mr-1" />
														History
													</button>
													<button
														onClick={() => handleEdit(assignment.id)}
														className="inline-flex items-center justify-center px-3 h-8 rounded-lg bg-[#C8102E] text-white hover:bg-[#A00E26] hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:ring-offset-1 transition-all duration-200 cursor-pointer text-xs font-medium"
														aria-label={`Edit assignment for ${assignment.proposalTitle}`}
													>
														<Edit2 className="w-3 h-3 mr-1" />
														Edit
													</button>
												</div>
											</div>
										</div>
									</article>
								))}
							</div>
						)}
					</div>

					{/* Pagination */}
					{filteredAssignments.length > 0 && (
						<div className="p-4 bg-slate-50 border-t border-slate-200 flex-shrink-0">
							<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-xs text-slate-600">
								<span>
									Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredAssignments.length)} of {filteredAssignments.length} assignments
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

				{/* Summary Cards */}
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div className="bg-white shadow-xl rounded-2xl border border-slate-200 p-4">
						<h4 className="text-sm font-semibold text-slate-800 mb-2">Total Evaluators</h4>
						<p className="text-2xl font-bold text-[#C8102E]">
							{new Set(assignments.flatMap(a => a.evaluatorIds)).size}
						</p>
					</div>
					<div className="bg-white shadow-xl rounded-2xl border border-slate-200 p-4">
						<h4 className="text-sm font-semibold text-slate-800 mb-2">Total Proposals</h4>
						<p className="text-2xl font-bold text-[#C8102E]">
							{new Set(assignments.map(a => a.proposalId)).size}
						</p>
					</div>
				</div>
			</div>

			{/* History Modal */}
			{showHistoryModal && (
				<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
					<div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
						<div className="p-4 sm:p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50">
							<div>
								<h2 className="text-xl font-bold text-slate-900">Evaluation History</h2>
								<p className="text-sm text-slate-600 mt-1">Previous evaluation decisions and comments</p>
							</div>
							<button
								onClick={() => setShowHistoryModal(false)}
								className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
								aria-label="Close modal"
							>
								✕
							</button>
						</div>

						<div className="flex-1 overflow-y-auto p-4 sm:p-6">
							{selectedProposalHistory.length === 0 ? (
								<div className="text-center py-8">
									<FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
									<p className="text-slate-500">No history records found for this proposal.</p>
								</div>
							) : (
								<div className="space-y-4">
									{selectedProposalHistory.map((record) => (
										<div key={record.id} className="bg-slate-50 rounded-lg p-4 border border-slate-200">
											<div className="flex items-center justify-between mb-2">
												<h4 className="font-semibold text-slate-800">{record.evaluatorName}</h4>
												<span className={`px-2 py-1 rounded-full text-xs font-medium ${
													record.decision === 'Accept' 
														? 'bg-emerald-100 text-emerald-700' 
														: 'bg-red-100 text-red-700'
												}`}>
													{record.decision}
												</span>
											</div>
											<p className="text-sm text-slate-700 mb-2">{record.comment}</p>
											<p className="text-xs text-slate-500">
												{new Date(record.date).toLocaleDateString()}
											</p>
										</div>
									))}
								</div>
							)}
						</div>

						<div className="p-4 sm:p-6 border-t border-slate-200 bg-slate-50 flex items-center justify-end">
							<button
								onClick={() => setShowHistoryModal(false)}
								className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
							>
								Close
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Evaluator Page Modal Trigger */}
			<RnDEvaluatorPageModal
				isOpen={showModal}
				onClose={() => setShowModal(false)}
				currentEvaluators={currentEvaluators}
				onReassign={handleReassignEvaluators}
			/>
		</div>
	);
};

export default RnDEvaluatorPage;