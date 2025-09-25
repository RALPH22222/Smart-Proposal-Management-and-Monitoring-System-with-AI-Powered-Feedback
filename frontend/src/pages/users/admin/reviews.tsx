import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import Sidebar from '../../../components/sidebar';
import { useLoading } from '../../../contexts/LoadingContext';

type DecisionStatus = 'pending' | 'approved' | 'rejected' | 'under_review';
type ItemType = 'document' | 'proposal' | 'policy' | 'budget' | 'project';

// WALA NA AKO MAISIP PAGE, PWEDE LANG TO ALISIN IF GUSTO NYO :>>
type CommitteeReview = {
	id: string;
	itemTitle: string;
	itemType: ItemType;
	submittedBy: string;
	assignedCommittee: string;
	status: DecisionStatus;
	priority: 'low' | 'medium' | 'high' | 'urgent';
	submittedAt: string;
	reviewDeadline: string;
	decidedAt?: string;
	decidedBy?: string;
	feedbackCount: number;
	lastActivity: string;
};

const accent = '#C8102E';

const statusLabel: Record<DecisionStatus, string> = {
	pending: 'Pending Review',
	approved: 'Approved',
	rejected: 'Rejected',
	under_review: 'Under Review'
};

const StatusBadge: React.FC<{ status: DecisionStatus }> = ({ status }) => {
	const styles: Record<DecisionStatus, string> = {
		pending: 'bg-amber-50 text-amber-700 border-amber-200',
		approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
		rejected: 'bg-red-50 text-red-700 border-red-200',
		under_review: 'bg-blue-50 text-blue-700 border-blue-200'
	};
	return (
		<span
			className={`px-2 py-1 text-xs font-medium rounded-md border ${styles[status]}`}
		>
			{statusLabel[status]}
		</span>
	);
};

const PriorityBadge: React.FC<{
	priority: 'low' | 'medium' | 'high' | 'urgent';
}> = ({ priority }) => {
	const styles = {
		low: 'bg-gray-50 text-gray-600 border-gray-200',
		medium: 'bg-yellow-50 text-yellow-700 border-yellow-200',
		high: 'bg-orange-50 text-orange-700 border-orange-200',
		urgent: 'bg-red-50 text-red-700 border-red-200'
	};
	return (
		<span
			className={`px-2 py-1 text-xs font-medium rounded-md border ${styles[priority]} capitalize`}
		>
			{priority}
		</span>
	);
};

const mockCommitteeReviews: CommitteeReview[] = [
	{
		id: 'CR-2024-089',
		itemTitle: 'New Student Scholarship Program Guidelines',
		itemType: 'policy',
		submittedBy: 'Dr. Maria Santos',
		assignedCommittee: 'Academic Affairs Committee',
		status: 'under_review',
		priority: 'high',
		submittedAt: '2025-09-20',
		reviewDeadline: '2025-09-27',
		feedbackCount: 3,
		lastActivity: '2025-09-23'
	},
	{
		id: 'CR-2024-087',
		itemTitle: 'Campus Infrastructure Upgrade Proposal',
		itemType: 'proposal',
		submittedBy: 'Eng. John Dela Cruz',
		assignedCommittee: 'Facilities Committee',
		status: 'approved',
		priority: 'urgent',
		submittedAt: '2025-09-15',
		reviewDeadline: '2025-09-22',
		decidedAt: '2025-09-21',
		decidedBy: 'Committee Chair',
		feedbackCount: 7,
		lastActivity: '2025-09-21'
	},
	{
		id: 'CR-2024-085',
		itemTitle: 'Research Budget Allocation FY 2025',
		itemType: 'budget',
		submittedBy: 'Dr. Sarah Johnson',
		assignedCommittee: 'Research Committee',
		status: 'pending',
		priority: 'medium',
		submittedAt: '2025-09-18',
		reviewDeadline: '2025-09-30',
		feedbackCount: 1,
		lastActivity: '2025-09-19'
	},
	{
		id: 'CR-2024-082',
		itemTitle: 'Digital Learning Platform Implementation',
		itemType: 'project',
		submittedBy: 'IT Department',
		assignedCommittee: 'Technology Committee',
		status: 'rejected',
		priority: 'medium',
		submittedAt: '2025-09-10',
		reviewDeadline: '2025-09-17',
		decidedAt: '2025-09-16',
		decidedBy: 'Committee Chair',
		feedbackCount: 5,
		lastActivity: '2025-09-16'
	},
	{
		id: 'CR-2024-078',
		itemTitle: 'Faculty Performance Evaluation Framework',
		itemType: 'document',
		submittedBy: 'HR Department',
		assignedCommittee: 'Personnel Committee',
		status: 'approved',
		priority: 'high',
		submittedAt: '2025-09-05',
		reviewDeadline: '2025-09-12',
		decidedAt: '2025-09-11',
		decidedBy: 'Committee Chair',
		feedbackCount: 4,
		lastActivity: '2025-09-11'
	}
];

function Reviews() {
	const [query, setQuery] = useState('');
	const [status, setStatus] = useState<'all' | DecisionStatus>('all');
	const [priority, setPriority] = useState<
		'all' | 'low' | 'medium' | 'high' | 'urgent'
	>('all');
	const [itemType, setItemType] = useState<'all' | ItemType>('all');
	const { setLoading } = useLoading();

	// datatable: sorting
	type SortKey = keyof Pick<
		CommitteeReview,
		| 'id'
		| 'itemTitle'
		| 'status'
		| 'priority'
		| 'submittedAt'
		| 'reviewDeadline'
	>;
	const [sortKey, setSortKey] = useState<SortKey>('submittedAt');
	const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

	// datatable: pagination
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(10);

	useEffect(() => {
		// show loading briefly on mount
		setLoading(true);
		const t = setTimeout(() => setLoading(false), 450);
		return () => clearTimeout(t);
	}, [setLoading]);

	const filtered = useMemo(() => {
		return mockCommitteeReviews.filter((review) => {
			const matchQuery = query
				? `${review.id} ${review.itemTitle} ${review.submittedBy} ${review.assignedCommittee}`
						.toLowerCase()
						.includes(query.toLowerCase())
				: true;
			const matchStatus = status === 'all' ? true : review.status === status;
			const matchPriority =
				priority === 'all' ? true : review.priority === priority;
			const matchItemType =
				itemType === 'all' ? true : review.itemType === itemType;
			return matchQuery && matchStatus && matchPriority && matchItemType;
		});
	}, [query, status, priority, itemType]);

	useEffect(() => {
		// reset to first page on filter change
		setPage(1);
	}, [query, status, priority, itemType]);

	const sorted = useMemo(() => {
		const arr = [...filtered];
		arr.sort((a, b) => {
			const dir = sortDir === 'asc' ? 1 : -1;
			const av = a[sortKey as keyof CommitteeReview];
			const bv = b[sortKey as keyof CommitteeReview];
			if (sortKey === 'submittedAt' || sortKey === 'reviewDeadline') {
				return (
					(new Date(av as string).getTime() -
						new Date(bv as string).getTime()) *
					dir
				);
			}
			if (av == null && bv == null) return 0;
			if (av == null) return -1 * dir;
			if (bv == null) return 1 * dir;
			return String(av).localeCompare(String(bv)) * dir;
		});
		return arr;
	}, [filtered, sortKey, sortDir]);

	const total = sorted.length;
	const totalPages = Math.max(1, Math.ceil(total / pageSize));
	const pageSafe = Math.min(page, totalPages);
	const startIdx = (pageSafe - 1) * pageSize;
	const endIdx = Math.min(startIdx + pageSize, total);
	const paginated = useMemo(
		() => sorted.slice(startIdx, endIdx),
		[sorted, startIdx, endIdx]
	);

	function onSort(nextKey: SortKey) {
		if (sortKey === nextKey) {
			setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
		} else {
			setSortKey(nextKey);
			setSortDir('asc');
		}
	}

	const stats = useMemo(() => {
		const pending = mockCommitteeReviews.filter(
			(r) => r.status === 'pending'
		).length;
		const underReview = mockCommitteeReviews.filter(
			(r) => r.status === 'under_review'
		).length;
		const approvedThisWeek = mockCommitteeReviews.filter(
			(r) =>
				r.status === 'approved' &&
				new Date(r.decidedAt || '').getTime() >
					Date.now() - 7 * 24 * 60 * 60 * 1000
		).length;
		const overdue = mockCommitteeReviews.filter(
			(r) =>
				r.status === 'pending' &&
				new Date(r.reviewDeadline).getTime() < Date.now()
		).length;
		return { pending, underReview, approvedThisWeek, overdue };
	}, []);

	const handleViewFeedback = (reviewId: string) => {
		console.log(`Viewing consolidated feedback for ${reviewId}`);
	};

	const handleViewDecisionLog = (reviewId: string) => {
		console.log(`Viewing decision log for ${reviewId}`);
	};

	return (
		<div className='min-h-screen flex bg-gray-50'>
			<Sidebar />
			<main className='flex-1 p-6'>
				<div className='max-w-7xl mx-auto'>
					<header className='mb-6 flex items-start md:items-center justify-between gap-4'>
						<div>
							<h1 className='text-2xl font-bold text-gray-900'>
								Committee Reviews
							</h1>
							<p className='text-gray-600 mt-1'>
								Track committee feedback and decision logs for institutional
								items.
							</p>
						</div>
						<div className='flex gap-2'>
							<button
								className='inline-flex items-center gap-2 px-4 py-2 rounded-md text-white text-sm shadow'
								style={{ backgroundColor: accent }}
							>
								<span>Export Decisions</span>
							</button>
						</div>
					</header>

					<section className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6'>
						<div className='bg-white rounded-lg shadow p-4'>
							<div className='text-xs text-gray-500'>Pending Reviews</div>
							<div className='mt-1 text-2xl font-semibold text-gray-900'>
								{stats.pending}
							</div>
							<div className='mt-2 text-xs text-gray-400'>
								Awaiting committee action
							</div>
						</div>
						<div className='bg-white rounded-lg shadow p-4'>
							<div className='text-xs text-gray-500'>Under Review</div>
							<div className='mt-1 text-2xl font-semibold text-gray-900'>
								{stats.underReview}
							</div>
							<div className='mt-2 text-xs text-gray-400'>
								Active committee review
							</div>
						</div>
						<div className='bg-white rounded-lg shadow p-4'>
							<div className='text-xs text-gray-500'>Approved (7d)</div>
							<div className='mt-1 text-2xl font-semibold text-gray-900'>
								{stats.approvedThisWeek}
							</div>
							<div className='mt-2 text-xs text-gray-400'>Last 7 days</div>
						</div>
						<div className='bg-white rounded-lg shadow p-4'>
							<div className='text-xs text-gray-500'>Overdue Items</div>
							<div className='mt-1 text-2xl font-semibold text-gray-900'>
								{stats.overdue}
							</div>
							<div className='mt-2 text-xs text-gray-400'>Past deadline</div>
						</div>
					</section>

					<section className='bg-white rounded-lg shadow p-4 mb-6'>
						<div className='flex flex-col md:flex-row gap-3 md:items-center'>
							<div className='flex-1'>
								<input
									value={query}
									onChange={(e) => setQuery(e.target.value)}
									placeholder='Search by ID, title, submitter, committee...'
									className='w-full px-3 py-2 rounded-md border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-200'
								/>
							</div>
							<div className='flex gap-3'>
								<select
									value={status}
									onChange={(e) => setStatus(e.target.value as typeof status)}
									className='px-3 py-2 rounded-md border border-gray-200 text-sm'
								>
									<option value='all'>All Status</option>
									<option value='pending'>Pending</option>
									<option value='under_review'>Under Review</option>
									<option value='approved'>Approved</option>
									<option value='rejected'>Rejected</option>
								</select>
								<select
									value={priority}
									onChange={(e) =>
										setPriority(e.target.value as typeof priority)
									}
									className='px-3 py-2 rounded-md border border-gray-200 text-sm'
								>
									<option value='all'>All Priority</option>
									<option value='urgent'>Urgent</option>
									<option value='high'>High</option>
									<option value='medium'>Medium</option>
									<option value='low'>Low</option>
								</select>
								<select
									value={itemType}
									onChange={(e) =>
										setItemType(e.target.value as typeof itemType)
									}
									className='px-3 py-2 rounded-md border border-gray-200 text-sm'
								>
									<option value='all'>All Types</option>
									<option value='document'>Document</option>
									<option value='proposal'>Proposal</option>
									<option value='policy'>Policy</option>
									<option value='budget'>Budget</option>
									<option value='project'>Project</option>
								</select>
								<select
									value={pageSize}
									onChange={(e) => {
										setPageSize(Number.parseInt(e.target.value, 10));
										setPage(1);
									}}
									className='px-3 py-2 rounded-md border border-gray-200 text-sm'
								>
									<option value={5}>5 / page</option>
									<option value={10}>10 / page</option>
									<option value={20}>20 / page</option>
								</select>
							</div>
						</div>
					</section>

					<section className='bg-white rounded-lg shadow'>
						{/* Desktop table */}
						<div className='hidden md:block overflow-x-auto'>
							<table className='min-w-full table-auto'>
								<thead>
									<tr className='text-left text-xs text-gray-500 border-b'>
										<th className='px-4 py-3'>
											<button
												className='inline-flex items-center gap-1 hover:underline'
												onClick={() => onSort('id')}
											>
												ID
												{sortKey === 'id'
													? sortDir === 'asc'
														? ' ▲'
														: ' ▼'
													: ''}
											</button>
										</th>
										<th className='px-4 py-3'>
											<button
												className='inline-flex items-center gap-1 hover:underline'
												onClick={() => onSort('itemTitle')}
											>
												Item
												{sortKey === 'itemTitle'
													? sortDir === 'asc'
														? ' ▲'
														: ' ▼'
													: ''}
											</button>
										</th>
										<th className='px-4 py-3'>Committee</th>
										<th className='px-4 py-3'>
											<button
												className='inline-flex items-center gap-1 hover:underline'
												onClick={() => onSort('priority')}
											>
												Priority
												{sortKey === 'priority'
													? sortDir === 'asc'
														? ' ▲'
														: ' ▼'
													: ''}
											</button>
										</th>
										<th className='px-4 py-3'>
											<button
												className='inline-flex items-center gap-1 hover:underline'
												onClick={() => onSort('status')}
											>
												Status
												{sortKey === 'status'
													? sortDir === 'asc'
														? ' ▲'
														: ' ▼'
													: ''}
											</button>
										</th>
										<th className='px-4 py-3'>
											<button
												className='inline-flex items-center gap-1 hover:underline'
												onClick={() => onSort('reviewDeadline')}
											>
												Deadline
												{sortKey === 'reviewDeadline'
													? sortDir === 'asc'
														? ' ▲'
														: ' ▼'
													: ''}
											</button>
										</th>
										<th className='px-4 py-3'>Feedback</th>
										<th className='px-4 py-3'>Actions</th>
									</tr>
								</thead>
								<tbody>
									{paginated.map((review) => (
										<tr key={review.id} className='border-b last:border-b-0'>
											<td className='px-4 py-3 text-sm font-medium text-gray-900'>
												{review.id}
											</td>
											<td className='px-4 py-3'>
												<div className='max-w-xs'>
													<div className='text-sm font-medium text-gray-800 truncate'>
														{review.itemTitle}
													</div>
													<div className='text-xs text-gray-500 truncate capitalize'>
														{review.itemType} • {review.submittedBy}
													</div>
												</div>
											</td>
											<td className='px-4 py-3 text-sm text-gray-700'>
												{review.assignedCommittee}
											</td>
											<td className='px-4 py-3'>
												<PriorityBadge priority={review.priority} />
											</td>
											<td className='px-4 py-3'>
												<StatusBadge status={review.status} />
											</td>
											<td className='px-4 py-3 text-sm text-gray-600'>
												{new Date(review.reviewDeadline).toLocaleDateString()}
											</td>
											<td className='px-4 py-3'>
												<span className='inline-flex items-center gap-1 text-sm text-gray-600'>
													<MessageIcon className='w-4 h-4' />
													{review.feedbackCount}
												</span>
											</td>
											<td className='px-4 py-3'>
												<div className='flex gap-1'>
													<button
														className='px-2 py-1 text-xs rounded-md text-white'
														style={{ backgroundColor: accent }}
														onClick={() => handleViewFeedback(review.id)}
													>
														Feedback
													</button>
													<button
														className='px-2 py-1 text-xs rounded-md text-white bg-gray-600 hover:bg-gray-700'
														onClick={() => handleViewDecisionLog(review.id)}
													>
														Log
													</button>
												</div>
											</td>
										</tr>
									))}
								</tbody>
							</table>
							{/* Pagination */}
							<div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 py-3'>
								<div className='text-xs text-gray-500'>
									Showing {total === 0 ? 0 : startIdx + 1}–{endIdx} of {total}
								</div>
								<div className='flex items-center gap-2'>
									<button
										className='px-3 py-1.5 text-sm rounded border border-gray-200 disabled:opacity-50'
										onClick={() => setPage((p) => Math.max(1, p - 1))}
										disabled={pageSafe <= 1}
									>
										Prev
									</button>
									<div className='text-xs text-gray-600'>
										Page {pageSafe} / {totalPages}
									</div>
									<button
										className='px-3 py-1.5 text-sm rounded border border-gray-200 disabled:opacity-50'
										onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
										disabled={pageSafe >= totalPages}
									>
										Next
									</button>
								</div>
							</div>
						</div>

						<div className='md:hidden divide-y'>
							{paginated.map((review) => (
								<div key={review.id} className='p-4'>
									<div className='flex items-start justify-between gap-3'>
										<div className='flex-1'>
											<div className='text-sm font-semibold text-gray-900'>
												{review.itemTitle}
											</div>
											<div className='mt-0.5 text-xs text-gray-500'>
												{review.id} • {review.assignedCommittee}
											</div>
											<div className='mt-1 flex items-center gap-2'>
												<PriorityBadge priority={review.priority} />
												<span className='text-xs text-gray-500 capitalize'>
													{review.itemType}
												</span>
											</div>
										</div>
										<StatusBadge status={review.status} />
									</div>
									<div className='mt-2 text-xs text-gray-600'>
										Submitted by {review.submittedBy} • Deadline:{' '}
										{new Date(review.reviewDeadline).toLocaleDateString()}
									</div>
									<div className='mt-2 flex items-center justify-between'>
										<span className='inline-flex items-center gap-1 text-xs text-gray-600'>
											<MessageIcon className='w-3 h-3' />
											{review.feedbackCount} feedback
										</span>
										<div className='text-xs text-gray-500'>
											Last activity:{' '}
											{new Date(review.lastActivity).toLocaleDateString()}
										</div>
									</div>
									<div className='mt-3 flex gap-2'>
										<button
											className='flex-1 px-3 py-2 text-sm rounded-md text-white'
											style={{ backgroundColor: accent }}
											onClick={() => handleViewFeedback(review.id)}
										>
											View Feedback
										</button>
										<button
											className='px-3 py-2 text-sm rounded-md text-white bg-gray-600'
											onClick={() => handleViewDecisionLog(review.id)}
										>
											Decision Log
										</button>
									</div>
								</div>
							))}
							{/* Mobile pagination */}
							<div className='flex items-center justify-between gap-2 px-4 py-3'>
								<div className='text-xs text-gray-500'>
									{total === 0 ? 0 : startIdx + 1}–{endIdx} of {total}
								</div>
								<div className='flex items-center gap-2'>
									<button
										className='px-3 py-1.5 text-sm rounded border border-gray-200 disabled:opacity-50'
										onClick={() => setPage((p) => Math.max(1, p - 1))}
										disabled={pageSafe <= 1}
									>
										Prev
									</button>
									<button
										className='px-3 py-1.5 text-sm rounded border border-gray-200 disabled:opacity-50'
										onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
										disabled={pageSafe >= totalPages}
									>
										Next
									</button>
								</div>
							</div>
						</div>
					</section>
				</div>
			</main>
		</div>
	);
}

function MessageIcon(props: React.SVGProps<SVGSVGElement>) {
	return (
		<svg viewBox='0 0 24 24' fill='none' {...props}>
			<path
				d='M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z'
				stroke='currentColor'
				strokeWidth='1.5'
				strokeLinecap='round'
				strokeLinejoin='round'
			/>
		</svg>
	);
}

export default Reviews;
