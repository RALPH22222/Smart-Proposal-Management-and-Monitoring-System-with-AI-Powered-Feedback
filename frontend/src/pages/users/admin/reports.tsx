import React, { useEffect, useMemo, useState } from 'react';
import Sidebar from '../../../components/admin-component/sidebar';
import { useLoading } from '../../../contexts/LoadingContext';

type IssueStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
type IssueSeverity = 'low' | 'medium' | 'high' | 'critical';

type Issue = {
	id: string;
	title: string;
	module: string;
	status: IssueStatus;
	severity: IssueSeverity;
	createdAt: string;
	assignee?: string;
};

const accent = '#C8102E';

const statusLabel: Record<IssueStatus, string> = {
	open: 'Open',
	in_progress: 'In Progress',
	resolved: 'Resolved',
	closed: 'Closed'
};

const StatusBadge: React.FC<{ status: IssueStatus }> = ({ status }) => {
	const styles: Record<IssueStatus, string> = {
		open: 'bg-red-50 text-red-700 border-red-200',
		in_progress: 'bg-amber-50 text-amber-700 border-amber-200',
		resolved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
		closed: 'bg-gray-50 text-gray-700 border-gray-200'
	};
	return (
		<span
			className={`px-2 py-1 text-xs font-medium rounded-md border ${styles[status]}`}
		>
			{statusLabel[status]}
		</span>
	);
};

const severityLabel: Record<IssueSeverity, string> = {
	low: 'Low',
	medium: 'Medium',
	high: 'High',
	critical: 'Critical'
};

const SeverityBadge: React.FC<{ severity: IssueSeverity }> = ({ severity }) => {
	const styles: Record<IssueSeverity, string> = {
		low: 'bg-gray-100 text-gray-700',
		medium: 'bg-blue-50 text-blue-700',
		high: 'bg-orange-50 text-orange-700',
		critical: 'bg-red-100 text-red-800'
	};
	return (
		<span
			className={`px-2 py-0.5 text-xs font-medium rounded ${styles[severity]}`}
		>
			{severityLabel[severity]}
		</span>
	);
};

const mockIssues: Issue[] = [
	{
		id: 'ISS-1042',
		title: 'Approvals page fails to load for certain roles',
		module: 'Admin/Dashboard',
		status: 'open',
		severity: 'critical',
		createdAt: '2025-09-15',
		assignee: 'H. Labang'
	},
	{
		id: 'ISS-1037',
		title: 'Search results pagination off-by-one',
		module: 'Public/Search',
		status: 'in_progress',
		severity: 'high',
		createdAt: '2025-09-12',
		assignee: 'C. Candido'
	},
	{
		id: 'ISS-1028',
		title: 'Tooltip position overlaps on mobile',
		module: 'UI/Components',
		status: 'resolved',
		severity: 'medium',
		createdAt: '2025-09-08',
		assignee: 'A. Nieva'
	},
	{
		id: 'ISS-1019',
		title: 'Email notifications sometimes not sent',
		module: 'Notifications',
		status: 'open',
		severity: 'high',
		createdAt: '2025-09-03',
		assignee: 'Unassigned'
	},
	{
		id: 'ISS-1003',
		title: 'Minor spacing inconsistency in proposal form',
		module: 'Proposals',
		status: 'closed',
		severity: 'low',
		createdAt: '2025-08-21',
		assignee: 'D. Castillon'
	}
];

function Reports() {
	const [query, setQuery] = useState('');
	const [status, setStatus] = useState<'all' | IssueStatus>('all');
	const [severity, setSeverity] = useState<'all' | IssueSeverity>('all');
	const [showNewReportModal, setShowNewReportModal] = useState(false);
	const { setLoading } = useLoading();

	// datatable: sorting
	type SortKey = keyof Pick<
		Issue,
		'id' | 'title' | 'module' | 'severity' | 'status' | 'createdAt' | 'assignee'
	>;
	const [sortKey, setSortKey] = useState<SortKey>('createdAt');
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
		return mockIssues.filter((issue) => {
			const matchQuery = query
				? `${issue.id} ${issue.title} ${issue.module} ${issue.assignee ?? ''}`
						.toLowerCase()
						.includes(query.toLowerCase())
				: true;
			const matchStatus = status === 'all' ? true : issue.status === status;
			const matchSeverity =
				severity === 'all' ? true : issue.severity === severity;
			return matchQuery && matchStatus && matchSeverity;
		});
	}, [query, status, severity]);

	useEffect(() => {
		// reset to first page on filter change
		setPage(1);
	}, [query, status, severity]);

	const sorted = useMemo(() => {
		const arr = [...filtered];
		arr.sort((a, b) => {
			const dir = sortDir === 'asc' ? 1 : -1;
			const av = a[sortKey as keyof Issue];
			const bv = b[sortKey as keyof Issue];
			if (sortKey === 'createdAt') {
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
		const open = mockIssues.filter((i) => i.status === 'open').length;
		const resolvedThisWeek = 7; // placeholder
		const avgResolution = '1.8d'; // placeholder
		const criticalOpen = mockIssues.filter(
			(i) =>
				i.severity === 'critical' &&
				(i.status === 'open' || i.status === 'in_progress')
		).length;
		return { open, resolvedThisWeek, avgResolution, criticalOpen };
	}, []);

	return (
		<div className="flex h-screen bg-gradient-to-br from-slate-50 to-slate-100">
			<Sidebar />
			<div className="flex-1 overflow-y-auto">
				<div className="p-4 sm:p-6">
					{/* Header */}
					<header className="pt-11 sm:pt-0 pb-4 sm:pb-6">
						<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
							<div>
								<h1 className="text-xl sm:text-2xl font-bold text-red-700">
									Reports & Issues
								</h1>
								<p className="text-gray-600 mt-1 text-sm sm:text-base">
									Track bugs and operational problems within the system.
								</p>
							</div>
							<button
								onClick={() => setShowNewReportModal(true)}
								className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md text-white text-sm shadow w-full sm:w-auto"
								style={{ backgroundColor: accent }}
							>
								<span>New Report</span>
							</button>
						</div>
					</header>

					{/* Stats */}
					<section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
						<div className="bg-white rounded-lg shadow p-3 sm:p-4">
							<div className="text-xs text-gray-500">Open Issues</div>
							<div className="mt-1 text-xl sm:text-2xl font-semibold text-gray-900">
								{stats.open}
							</div>
							<div className="mt-2 text-xs text-gray-400">
								Requires attention
							</div>
						</div>
						<div className="bg-white rounded-lg shadow p-3 sm:p-4">
							<div className="text-xs text-gray-500">Resolved (7d)</div>
							<div className="mt-1 text-xl sm:text-2xl font-semibold text-gray-900">
								{stats.resolvedThisWeek}
							</div>
							<div className="mt-2 text-xs text-gray-400">Last 7 days</div>
						</div>
						<div className="bg-white rounded-lg shadow p-3 sm:p-4">
							<div className="text-xs text-gray-500">Avg Resolution</div>
							<div className="mt-1 text-xl sm:text-2xl font-semibold text-gray-900">
								{stats.avgResolution}
							</div>
							<div className="mt-2 text-xs text-gray-400">
								Across resolved tickets
							</div>
						</div>
						<div className="bg-white rounded-lg shadow p-3 sm:p-4">
							<div className="text-xs text-gray-500">Critical Open</div>
							<div className="mt-1 text-xl sm:text-2xl font-semibold text-gray-900">
								{stats.criticalOpen}
							</div>
							<div className="mt-2 text-xs text-gray-400">
								Must be prioritized
							</div>
						</div>
					</section>

					{/* Filters */}
					<section className="bg-white rounded-lg shadow p-3 sm:p-4 mb-6">
						<div className="flex flex-col lg:flex-row gap-3 lg:items-center">
							<div className="flex-1">
								<input
									value={query}
									onChange={(e) => setQuery(e.target.value)}
									placeholder="Search by ID, title, module, assignee..."
									className="w-full px-3 py-2 rounded-md border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-200 text-sm"
								/>
							</div>
							<div className="flex flex-col xs:flex-row gap-2">
								<select
									value={status}
									onChange={(e) => setStatus(e.target.value as typeof status)}
									className="px-3 py-2 rounded-md border border-gray-200 text-sm w-full xs:w-auto"
								>
									<option value="all">All Status</option>
									<option value="open">Open</option>
									<option value="in_progress">In Progress</option>
									<option value="resolved">Resolved</option>
									<option value="closed">Closed</option>
								</select>
								<select
									value={severity}
									onChange={(e) =>
										setSeverity(e.target.value as typeof severity)
									}
									className="px-3 py-2 rounded-md border border-gray-200 text-sm w-full xs:w-auto"
								>
									<option value="all">All Severity</option>
									<option value="low">Low</option>
									<option value="medium">Medium</option>
									<option value="high">High</option>
									<option value="critical">Critical</option>
								</select>
								<select
									value={pageSize}
									onChange={(e) => {
										setPageSize(parseInt(e.target.value, 10));
										setPage(1);
									}}
									className="px-3 py-2 rounded-md border border-gray-200 text-sm w-full xs:w-auto"
								>
									<option value={5}>5 / page</option>
									<option value={10}>10 / page</option>
									<option value={20}>20 / page</option>
								</select>
							</div>
						</div>
					</section>

					{/* List / Table */}
					<section className="bg-white rounded-lg shadow">
						{/* Desktop table */}
						<div className="hidden md:block overflow-x-auto">
							<table className="min-w-full table-auto">
								<thead>
									<tr className="text-left text-xs text-gray-500 border-b">
										<th className="px-3 sm:px-4 py-3">
											<button
												className="inline-flex items-center gap-1 hover:underline"
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
										<th className="px-3 sm:px-4 py-3">
											<button
												className="inline-flex items-center gap-1 hover:underline"
												onClick={() => onSort('title')}
											>
												Title
												{sortKey === 'title'
													? sortDir === 'asc'
														? ' ▲'
														: ' ▼'
													: ''}
											</button>
										</th>
										<th className="px-3 sm:px-4 py-3">
											<button
												className="inline-flex items-center gap-1 hover:underline"
												onClick={() => onSort('module')}
											>
												Module
												{sortKey === 'module'
													? sortDir === 'asc'
														? ' ▲'
														: ' ▼'
													: ''}
											</button>
										</th>
										<th className="px-3 sm:px-4 py-3">
											<button
												className="inline-flex items-center gap-1 hover:underline"
												onClick={() => onSort('severity')}
											>
												Severity
												{sortKey === 'severity'
													? sortDir === 'asc'
														? ' ▲'
														: ' ▼'
													: ''}
											</button>
										</th>
										<th className="px-3 sm:px-4 py-3">
											<button
												className="inline-flex items-center gap-1 hover:underline"
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
										<th className="px-3 sm:px-4 py-3">
											<button
												className="inline-flex items-center gap-1 hover:underline"
												onClick={() => onSort('createdAt')}
											>
												Created
												{sortKey === 'createdAt'
													? sortDir === 'asc'
														? ' ▲'
														: ' ▼'
													: ''}
											</button>
										</th>
										<th className="px-3 sm:px-4 py-3">
											<button
												className="inline-flex items-center gap-1 hover:underline"
												onClick={() => onSort('assignee')}
											>
												Assignee
												{sortKey === 'assignee'
													? sortDir === 'asc'
														? ' ▲'
														: ' ▼'
													: ''}
											</button>
										</th>
										<th className="px-3 sm:px-4 py-3">Action</th>
									</tr>
								</thead>
								<tbody>
									{paginated.map((i) => (
										<tr key={i.id} className="border-b last:border-b-0">
											<td className="px-3 sm:px-4 py-3 text-sm font-medium text-gray-900">
												{i.id}
											</td>
											<td className="px-3 sm:px-4 py-3 text-sm text-gray-800">
												{i.title}
											</td>
											<td className="px-3 sm:px-4 py-3 text-sm text-gray-600">
												{i.module}
											</td>
											<td className="px-3 sm:px-4 py-3">
												<SeverityBadge severity={i.severity} />
											</td>
											<td className="px-3 sm:px-4 py-3">
												<StatusBadge status={i.status} />
											</td>
											<td className="px-3 sm:px-4 py-3 text-sm text-gray-600">
												{new Date(i.createdAt).toLocaleDateString()}
											</td>
											<td className="px-3 sm:px-4 py-3 text-sm text-gray-700">
												{i.assignee ?? '—'}
											</td>
											<td className="px-3 sm:px-4 py-3">
												<button
													className="px-3 py-1.5 text-xs rounded-md text-white"
													style={{ backgroundColor: accent }}
												>
													View
												</button>
											</td>
										</tr>
									))}
								</tbody>
							</table>
							{/* Pagination */}
							<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-3 sm:px-4 py-3">
								<div className="text-xs text-gray-500">
									Showing {total === 0 ? 0 : startIdx + 1}–{endIdx} of {total}
								</div>
								<div className="flex items-center gap-2">
									<button
										className="px-3 py-1.5 text-sm rounded border border-gray-200 disabled:opacity-50"
										onClick={() => setPage((p) => Math.max(1, p - 1))}
										disabled={pageSafe <= 1}
									>
										Prev
									</button>
									<div className="text-xs text-gray-600">
										Page {pageSafe} / {totalPages}
									</div>
									<button
										className="px-3 py-1.5 text-sm rounded border border-gray-200 disabled:opacity-50"
										onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
										disabled={pageSafe >= totalPages}
									>
										Next
									</button>
								</div>
							</div>
						</div>

						{/* Mobile list */}
						<div className="md:hidden divide-y">
							{paginated.map((i) => (
								<div key={i.id} className="p-3 sm:p-4">
									<div className="flex items-start justify-between gap-3">
										<div className="min-w-0 flex-1">
											<div className="text-sm font-semibold text-gray-900 truncate">
												{i.title}
											</div>
											<div className="mt-0.5 text-xs text-gray-500">
												{i.id} • {i.module}
											</div>
										</div>
										<div className="flex items-center gap-2 flex-shrink-0">
											<SeverityBadge severity={i.severity} />
											<StatusBadge status={i.status} />
										</div>
									</div>
									<div className="mt-2 flex items-center justify-between">
										<div className="text-xs text-gray-500">
											{new Date(i.createdAt).toLocaleDateString()}
										</div>
										<div className="text-xs text-gray-700">
											{i.assignee ?? '—'}
										</div>
									</div>
									<div className="mt-3">
										<button
											className="w-full px-3 py-2 text-sm rounded-md text-white"
											style={{ backgroundColor: accent }}
										>
											View Details
										</button>
									</div>
								</div>
							))}
							{/* Mobile pagination */}
							<div className="flex items-center justify-between gap-2 px-3 sm:px-4 py-3">
								<div className="text-xs text-gray-500">
									{total === 0 ? 0 : startIdx + 1}–{endIdx} of {total}
								</div>
								<div className="flex items-center gap-2">
									<button
										className="px-3 py-1.5 text-sm rounded border border-gray-200 disabled:opacity-50"
										onClick={() => setPage((p) => Math.max(1, p - 1))}
										disabled={pageSafe <= 1}
									>
										Prev
									</button>
									<button
										className="px-3 py-1.5 text-sm rounded border border-gray-200 disabled:opacity-50"
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
			</div>

			{/* New Report Modal */}
			{showNewReportModal && (
				<div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50 p-4">
					<div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
						<div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
							<h3 className="text-lg sm:text-xl font-semibold text-gray-900">Create New Report</h3>
							<button
								onClick={() => setShowNewReportModal(false)}
								className="text-gray-500 hover:text-gray-700 text-xl"
							>
								✕
							</button>
						</div>
						<div className="p-4 sm:p-6 space-y-4">
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Title
								</label>
								<input
									type="text"
									className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
									placeholder="Enter issue title"
								/>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Description
								</label>
								<textarea
									rows={4}
									className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
									placeholder="Describe the issue in detail"
								/>
							</div>
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Module
									</label>
									<select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 text-sm">
										<option value="">Select Module</option>
										<option value="Admin/Dashboard">Admin/Dashboard</option>
										<option value="Public/Search">Public/Search</option>
										<option value="UI/Components">UI/Components</option>										<option value="Admin/Dashboard">Admin/Dashboard</option>
								              <option value="AI">AI Feedback</option>
										<option value="Notifications">Notifications</option>
										<option value="Proposals">Proposals</option>
									</select>
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Severity
									</label>
									<select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 text-sm">
										<option value="low">Low</option>
										<option value="medium">Medium</option>
										<option value="high">High</option>
										<option value="critical">Critical</option>
									</select>
								</div>
							</div>
							<div className="flex gap-3 pt-4">
								<button
									className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors text-sm"
									style={{ backgroundColor: accent }}
								>
									Submit Report
								</button>
								<button
									onClick={() => setShowNewReportModal(false)}
									className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors text-sm"
								>
									Cancel
								</button>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}

export default Reports;