import React, { useState } from 'react';
import {
	Clock,
	Edit2,
	User,
	FileText,
	Search,
	Filter,
	History
} from 'lucide-react';
import RnDEvaluatorPageModal from './RnDEvaluatorPageModal';

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
	const [selectedProposalHistory, setSelectedProposalHistory] = useState<
		HistoryRecord[]
	>([]);
	const [showModal, setShowModal] = useState(false);
	const [currentEvaluators, setCurrentEvaluators] = useState<EvaluatorOption[]>(
		[]
	);

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

	return (
		<div className='p-6'>
			<h1 className='text-2xl font-bold text-gray-900 mb-2'>
				Evaluator Assignment Tracker
			</h1>
			<p className='text-gray-600 mb-6'>
				This table shows all evaluator assignments, deadlines, and proposal
				statuses.
			</p>

			{/* Filter Container */}
			<div className='bg-white border border-gray-200 rounded-lg shadow-sm mb-6'>
				<div className='p-4 flex flex-col sm:flex-row sm:items-center gap-4'>
					<div className='relative flex-1'>
						<Search className='absolute left-3 top-2.5 text-gray-400 w-5 h-5' />
						<input
							type='text'
							placeholder='Search evaluator or proposal title...'
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							className='w-full border border-gray-300 rounded-md pl-10 pr-3 py-2 text-sm focus:ring-2 focus:ring-[#C10003] focus:outline-none'
						/>
					</div>

					<div className='relative w-full sm:w-48'>
						<Filter className='absolute left-3 top-2.5 text-gray-400 w-5 h-5' />
						<select
							value={statusFilter}
							onChange={(e) => setStatusFilter(e.target.value)}
							className='w-full border border-gray-300 rounded-md pl-10 pr-3 py-2 text-sm focus:ring-2 focus:ring-[#C10003] focus:outline-none bg-white'
						>
							<option value='All'>All Status</option>
							<option value='Pending'>Pending</option>
							<option value='Accepts'>Accepts</option>
							<option value='Completed'>Completed</option>
							<option value='Overdue'>Overdue</option>
							<option value='Rejected'>Rejected</option>
						</select>
					</div>
				</div>
			</div>

			{/* Table */}
			<div className='overflow-x-auto bg-white shadow rounded-lg'>
				<table className='min-w-full divide-y divide-gray-200'>
					<thead className='bg-gray-100'>
						<tr>
							<th className='px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider'>
								<FileText className='inline w-4 h-4 mr-1' /> Proposal Title
							</th>
							<th className='px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider'>
								<User className='inline w-4 h-4 mr-1' /> Evaluators
							</th>
							<th className='px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider'>
								Department
							</th>
							<th className='px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider'>
								<Clock className='inline w-4 h-4 mr-1' /> Deadline
							</th>
							<th className='px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider'>
								Status
							</th>
							<th className='px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider'>
								Actions
							</th>
						</tr>
					</thead>
					<tbody className='bg-white divide-y divide-gray-200'>
						{filteredAssignments.length === 0 ? (
							<tr>
								<td
									colSpan={6}
									className='px-6 py-4 text-center text-gray-500 text-sm'
								>
									No assignments found.
								</td>
							</tr>
						) : (
							filteredAssignments.map((item) => (
								<tr key={item.id} className='hover:bg-gray-50'>
									<td className='px-6 py-4 text-sm text-gray-800 font-medium whitespace-nowrap'>
										{item.proposalTitle}
									</td>
									<td className='px-6 py-4 text-sm text-gray-700 whitespace-normal max-w-xs break-words'>
										{item.evaluatorNames.join(', ')}
									</td>
									<td className='px-6 py-4 text-sm text-gray-700 whitespace-nowrap'>
										{item.department}
									</td>
									<td className='px-6 py-4 text-sm text-gray-600 whitespace-nowrap'>
										{new Date(item.deadline).toLocaleDateString()}
									</td>
									<td className='px-6 py-4 text-sm whitespace-nowrap'>
										<span
											className={`px-2 py-1 rounded-full text-xs font-medium ${
												item.status === 'Overdue'
													? 'bg-red-100 text-red-700'
													: item.status === 'Completed'
													? 'bg-green-100 text-green-700'
													: item.status === 'Accepts'
													? 'bg-green-100 text-green-700'
													: item.status === 'Rejected'
													? 'bg-red-100 text-red-700'
													: 'bg-yellow-100 text-yellow-800'
											}`}
										>
											{item.status}
										</span>
									</td>
									<td className='px-6 py-4 text-right text-sm flex justify-end gap-3 whitespace-nowrap'>
										<button
											onClick={() => handleViewHistory(item.proposalId)}
											className='text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1'
										>
											<History className='w-4 h-4' /> View History
										</button>
										<button
											onClick={() => handleEdit(item.id)}
											className='text-[#C10003] hover:text-[#A00002] font-semibold flex items-center gap-1'
										>
											<Edit2 className='w-4 h-4' /> Edit
										</button>
									</td>
								</tr>
							))
						)}
					</tbody>
				</table>
			</div>

			{/* History Modal */}
			{showHistoryModal && (
				<div className='fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4'>
					<div className='bg-white rounded-lg w-full max-w-lg shadow-lg overflow-hidden'>
						<div className='bg-[#C10003] text-white px-4 py-3 flex justify-between items-center'>
							<h3 className='text-lg font-semibold'>Evaluation History</h3>
							<button
								onClick={() => setShowHistoryModal(false)}
								className='text-white hover:text-gray-200 text-xl'
							>
								✕
							</button>
						</div>
						<div className='p-4 max-h-[70vh] overflow-y-auto'>
							{selectedProposalHistory.length === 0 ? (
								<p className='text-gray-500 text-sm text-center py-4'>
									No history records found for this proposal.
								</p>
							) : (
								<table className='w-full text-sm border border-gray-200 rounded-lg'>
									<thead className='bg-gray-100'>
										<tr>
											<th className='px-3 py-2 text-left text-gray-600'>
												Evaluator
											</th>
											<th className='px-3 py-2 text-left text-gray-600'>
												Decision
											</th>
											<th className='px-3 py-2 text-left text-gray-600'>
												Comment
											</th>
											<th className='px-3 py-2 text-left text-gray-600'>
												Date
											</th>
										</tr>
									</thead>
									<tbody>
										{selectedProposalHistory.map((record) => (
											<tr key={record.id} className='border-t hover:bg-gray-50'>
												<td className='px-3 py-2 text-gray-800 font-medium'>
													{record.evaluatorName}
												</td>
												<td
													className={`px-3 py-2 font-semibold ${
														record.decision === 'Accept'
															? 'text-green-700'
															: 'text-red-600'
													}`}
												>
													{record.decision}
												</td>
												<td className='px-3 py-2 text-gray-700'>
													{record.comment}
												</td>
												<td className='px-3 py-2 text-gray-500'>
													{new Date(record.date).toLocaleDateString()}
												</td>
											</tr>
										))}
									</tbody>
								</table>
							)}
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

			{/* Summary */}
			<div className='mt-6 bg-gray-50 p-4 rounded-lg text-sm text-gray-700'>
				<p>
					{' '}
					Total Evaluators:{' '}
					<strong>
						{new Set(assignments.flatMap((a) => a.evaluatorIds)).size}
					</strong>{' '}
				</p>
				<p>
					{' '}
					Total Proposals:{' '}
					<strong>
						{new Set(assignments.map((a) => a.proposalId)).size}
					</strong>{' '}
				</p>
			</div>
		</div>
	);
};

export default RnDEvaluatorPage;
