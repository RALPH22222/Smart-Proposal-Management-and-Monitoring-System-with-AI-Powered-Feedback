import React, { useState, useEffect } from 'react';
import {
	TrendingUp,
	FileText,
	XCircle,
	CheckCircle,
	RotateCcw,
	User,
	BarChart as BarChartIcon,
	Search,
	RefreshCw
} from 'lucide-react';
import { type Statistics, type Activity } from '../../../types/InterfaceProposal';
import {
	ResponsiveContainer,
	LineChart,
	Line,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip as RechartsTooltip,
	BarChart,
	Bar,
	Cell
} from 'recharts';
import { useAuthContext } from '../../../context/AuthContext';
import PageLoader from '../../../components/shared/PageLoader';

interface DashboardProps {
	statistics: Statistics;
	recentActivity: Activity[];
	onRefresh?: () => Promise<void> | void;
	isLoading?: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({
	statistics,
	recentActivity,
	onRefresh,
	isLoading = false
}) => {
	const { user } = useAuthContext();
	const [isRefreshing, setIsRefreshing] = useState(false);
	const [displayedText, setDisplayedText] = useState({ prefix: '', name: '', suffix: '' });

	useEffect(() => {
		if (!user) return;

		const hasVisited = localStorage.getItem('rnd_welcome_seen');
		const isNewUser = !hasVisited;

		if (isNewUser) {
			localStorage.setItem('rnd_welcome_seen', 'true');
		}

		const firstName = user.first_name || 'R&D Staff';
		const targetPrefix = isNewUser ? 'Welcome to RDEC, ' : 'Welcome back, ';
		const targetName = firstName;
		const targetSuffix = !isNewUser ? '!' : '';

		const totalLength = targetPrefix.length + targetName.length + targetSuffix.length;
		let charIndex = 0;

		setDisplayedText({ prefix: '', name: '', suffix: '' });

		const typeInterval = setInterval(() => {
			charIndex++;
			const currentTotal = charIndex;

			const pLen = targetPrefix.length;
			const nLen = targetName.length;

			const p = targetPrefix.slice(0, Math.min(currentTotal, pLen));
			const n = currentTotal > pLen ? targetName.slice(0, Math.min(currentTotal - pLen, nLen)) : '';
			const s = currentTotal > pLen + nLen ? targetSuffix.slice(0, currentTotal - (pLen + nLen)) : '';

			setDisplayedText({ prefix: p, name: n, suffix: s });

			if (currentTotal >= totalLength) {
				clearInterval(typeInterval);
			}
		}, 50);

		return () => clearInterval(typeInterval);
	}, [user?.first_name]);

	const handleRefresh = async () => {
		if (onRefresh) {
			setIsRefreshing(true);
			await onRefresh();
			setIsRefreshing(false);
		}
	};

	const calculateRate = (value: number) => {
		if (statistics.totalProposals === 0) return '0%';
		return ((value / statistics.totalProposals) * 100).toFixed(1) + '%';
	};

	const statCards = [
		{
			title: 'Total Proposals',
			value: statistics.totalProposals,
			icon: FileText,
			color: 'text-slate-600',
			bgColor: 'bg-slate-50',
			borderColor: 'border-slate-200',
			rate: null
		},
		{
			title: 'Under R&D Review',
			value: statistics.pendingProposals,
			icon: Search,
			color: 'text-blue-600',
			bgColor: 'bg-blue-50',
			borderColor: 'border-blue-200',
			rate: calculateRate(statistics.pendingProposals)
		},
		{
			title: 'Under Evaluators Assessment',
			value: statistics.acceptedProposals,
			icon: FileText,
			color: 'text-purple-700',
			bgColor: 'bg-purple-50',
			borderColor: 'border-purple-200',
			rate: calculateRate(statistics.acceptedProposals)
		},
		{
			title: 'Rejected',
			value: statistics.rejectedProposals,
			icon: XCircle,
			color: 'text-red-600',
			bgColor: 'bg-red-50',
			borderColor: 'border-red-200',
			rate: calculateRate(statistics.rejectedProposals)
		},
		{
			title: 'Need Revision',
			value: statistics.revisionRequiredProposals,
			icon: RotateCcw,
			color: 'text-orange-600',
			bgColor: 'bg-orange-50',
			borderColor: 'border-orange-200',
			rate: calculateRate(statistics.revisionRequiredProposals)
		}
	];

	const getActivityIcon = (type: string) => {
		switch (type) {
			case 'review':
				return CheckCircle;
			case 'submission':
				return FileText;
			case 'revision':
				return RotateCcw;
			default:
				return FileText;
		}
	};

	const getActivityColor = (type: string) => {
		switch (type) {
			case 'review':
				return 'text-emerald-500';
			case 'submission':
				return 'text-blue-500';
			case 'revision':
				return 'text-orange-500';
			default:
				return 'text-slate-500';
		}
	};

	const pipelineData = [
		{ name: 'Under R&D Review', value: statistics.pendingProposals, color: '#2563eb' },
		{ name: 'Under Evaluators Assessment', value: statistics.acceptedProposals, color: '#7e22ce' },
		{ name: 'Needs Revision', value: statistics.revisionRequiredProposals, color: '#ea580c' },
		{ name: 'Rejected', value: statistics.rejectedProposals, color: '#dc2626' }
	];

	if (isLoading) {
		return (
			<div className="min-h-screen">
				<PageLoader text="Loading dashboard..." />
			</div>
		);
	}

	return (
		<div className="min-h-screen p-6 bg-gradient-to-br from-slate-50 to-slate-100">
			{/* Header */}
			<header className="pb-4 sm:pb-6">
				<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
					<div>
						<h1 className="text-2xl sm:text-3xl font-bold text-[#C8102E] leading-tight min-h-[40px]">
							<span className="text-[#C8102E]">{displayedText.prefix}</span>
							<span className="text-black">{displayedText.name}</span>
							<span className="text-[#C8102E]">{displayedText.suffix}</span>
						</h1>
						<p className="text-slate-600 mt-2 text-sm leading-relaxed">
							Overview of proposal management activities
						</p>
					</div>
					{onRefresh && (
						<button
							onClick={handleRefresh}
							disabled={isRefreshing}
							className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:border-[#C8102E] hover:text-[#C8102E] text-slate-700 text-sm font-medium rounded-xl shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20 disabled:opacity-50 disabled:cursor-not-allowed"
							title="Refresh Dashboard Data"
						>
							<RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
							{isRefreshing ? 'Refreshing...' : 'Refresh'}
						</button>
					)}
				</div>
			</header>

			{/* Stats Section */}
			<section className="mb-6 sm:mb-8" aria-labelledby="stats-heading">
				<h2 id="stats-heading" className="sr-only">
					Proposal Statistics
				</h2>
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
					{statCards.map((stat, index) => {
						const IconComponent = stat.icon;
						return (
							<div
								key={index}
								className={`${stat.bgColor} ${stat.borderColor} border-2 rounded-2xl p-4 transition-all duration-300 hover:shadow-lg hover:scale-105 group cursor-pointer`}
								role="button"
								tabIndex={0}
								aria-label={`${stat.title}: ${stat.value} proposals`}
							>
								<div className="flex items-center justify-between mb-3">
									<IconComponent
										className={`${stat.color} w-5 h-5 sm:w-6 sm:h-6 group-hover:scale-110 transition-transform duration-300`}
									/>
									{stat.rate && (
										<span className={`text-xs font-bold px-2 py-0.5 rounded-full bg-white/50 ${stat.color} border ${stat.borderColor}`}>
											{stat.rate}
										</span>
									)}
								</div>
								<h3 className="text-xs sm:text-sm font-semibold text-slate-700 mb-2 leading-tight">{stat.title}</h3>
								<p className="text-lg sm:text-xl font-bold text-slate-800 tabular-nums">{stat.value.toLocaleString()}</p>
							</div>
						);
					})}
				</div>
			</section>

			{/* Content Section */}
			<section className="flex flex-col xl:flex-row gap-6">
				<div
					className="bg-white shadow-xl rounded-2xl border border-slate-200 overflow-hidden flex-1 flex flex-col min-w-0"
					aria-labelledby="submissions-heading"
				>
					{/* Header */}
					<div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
						<div>
							<h3 id="submissions-heading" className="text-lg font-bold text-slate-800 flex items-center gap-2">
								<TrendingUp className="w-5 h-5 text-[#C8102E]" />
								Monthly Submissions
							</h3>
							<p className="text-sm text-slate-500 mt-1">
								Trends for the last {statistics.monthlySubmissions.length} months
							</p>
						</div>

						{/* Legend */}
						<div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-slate-50 rounded-full border border-slate-200">
							<div className="w-2 h-2 rounded-full bg-[#C8102E]"></div>
							<span className="text-xs font-medium text-slate-600">Volume</span>
						</div>
					</div>

					{/* Chart Area - Responsive Wrapper */}
					<div className="p-4 sm:p-6 flex-1 flex flex-col min-h-[300px]">
						<div className="w-full h-64 sm:h-72 xl:flex-1 relative pt-4">
							<ResponsiveContainer width="100%" height="100%">
								<LineChart
									data={statistics.monthlySubmissions}
									margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
								>
									<CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
									<XAxis
										dataKey="month"
										tickFormatter={(val) => val.substring(0, 3)}
										axisLine={false}
										tickLine={false}
										tick={{ fill: '#64748b', fontSize: 12 }}
										dy={10}
									/>
									<YAxis
										axisLine={false}
										tickLine={false}
										tick={{ fill: '#64748b', fontSize: 12 }}
										dx={-10}
									/>
									<RechartsTooltip
										contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
										formatter={(value: any) => [`${value} Proposals`, 'Volume']}
									/>
									<Line
										type="monotone"
										dataKey="count"
										stroke="#C8102E"
										strokeWidth={3}
										dot={{ r: 4, fill: '#C8102E', strokeWidth: 2, stroke: '#fff' }}
										activeDot={{ r: 6 }}
									/>
								</LineChart>
							</ResponsiveContainer>
						</div>
					</div>

					{/* Summary Stats Footer */}
					<div className="px-4 py-4 sm:px-6 sm:py-5 bg-slate-50 border-t border-slate-200">
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-0 md:divide-x divide-slate-200">

							{/* Stat 1 */}
							<div className="flex flex-row md:flex-col items-center justify-between md:justify-center px-2 md:px-4 md:first:pl-0">
								<p className="text-xs font-semibold text-slate-500 tracking-wider md:mb-1">Total Submissions</p>
								<div className="flex items-baseline gap-2">
									<span className="text-lg sm:text-2xl font-bold text-slate-800">
										{statistics.monthlySubmissions.reduce((sum, m) => sum + m.count, 0)}
									</span>
								</div>
							</div>

							{/* Stat 2 */}
							<div className="flex flex-row md:flex-col items-center justify-between md:justify-center px-2 md:px-4">
								<p className="text-xs font-semibold text-slate-500 tracking-wider md:mb-1">Peak Month</p>
								<div className="flex items-baseline gap-2">
									<span className="text-lg sm:text-2xl font-bold text-slate-800">
										{Math.max(...statistics.monthlySubmissions.map(m => m.count))}
									</span>
									<span className="text-xs text-slate-400">proposals</span>
								</div>
							</div>

							{/* Stat 3 */}
							<div className="flex flex-row md:flex-col items-center justify-between md:justify-center px-2 md:px-4">
								<p className="text-xs font-semibold text-slate-500 tracking-wider md:mb-1">Monthly Average</p>
								<div className="flex items-baseline gap-2">
									<span className="text-lg sm:text-2xl font-bold text-slate-800">
										{Math.round(statistics.monthlySubmissions.reduce((sum, m) => sum + m.count, 0) / statistics.monthlySubmissions.length) || 0}
									</span>
									<span className="text-xs text-slate-400">/ mo</span>
								</div>
							</div>

						</div>
					</div>
				</div>


				{/* Recent Activity */}
				<div className="bg-white shadow-xl rounded-2xl border border-slate-200 p-4 sm:p-6 w-full xl:w-80 flex flex-col min-w-0">
					<h3 className="text-lg font-bold text-slate-800 mb-6 sm:mb-8 flex items-center gap-2">
						<CheckCircle className="w-5 h-5 text-[#C8102E]" />
						Recent Activity
					</h3>

					<div className="space-y-4 flex-1 overflow-y-auto max-h-96">
						{recentActivity.slice(0, 5).map((activity) => {
							const Icon = getActivityIcon(activity.type);
							const colorClass = getActivityColor(activity.type);

							return (
								<div key={activity.id} className="flex items-start space-x-3 group">
									<div
										className={`p-2 rounded-xl ${colorClass.replace('text-', 'bg-').replace('-500', '-100')} group-hover:scale-110 transition-transform duration-200 flex-shrink-0`}
									>
										<Icon className={`w-4 h-4 ${colorClass}`} />
									</div>
									<div className="flex-1 min-w-0">
										<p className="text-sm font-semibold text-slate-800 group-hover:text-[#C8102E] transition-colors duration-200 line-clamp-2">
											{activity.action}
										</p>
										<p className="text-xs text-slate-600 mt-1 line-clamp-1">
											{activity.proposalTitle}
										</p>
										<div className="flex items-center mt-2 text-xs text-slate-500 flex-wrap gap-1">
											<div className="flex items-center">
												<User className="w-3 h-3 mr-1" />
												<span>{activity.user}</span>
											</div>
											<span>•</span>
											<span>
												{new Date(activity.timestamp).toLocaleDateString()}
											</span>
										</div>
									</div>
								</div>
							);
						})}
					</div>

					<div className="mt-6 pt-6 border-t border-slate-200">
						<h4 className="text-sm font-semibold text-slate-700 mb-3">Activity Summary</h4>
						<div className="space-y-2 text-xs text-slate-600">
							<div className="flex items-center gap-2">
								<div className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0"></div>
								<span>{recentActivity.filter(a => a.type === 'review').length} reviews completed</span>
							</div>
							<div className="flex items-center gap-2">
								<div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0"></div>
								<span>{recentActivity.filter(a => a.type === 'submission').length} new submissions</span>
							</div>
							<div className="flex items-center gap-2">
								<div className="w-2 h-2 rounded-full bg-orange-500 flex-shrink-0"></div>
								<span>{recentActivity.filter(a => a.type === 'revision').length} revisions requested</span>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Analytics by Distribution Section */}
			<section className="mt-6 flex flex-col xl:flex-row gap-6">
				<div className="bg-white shadow-xl rounded-2xl border border-slate-200 p-4 sm:p-6 w-full flex-1">
					<h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
						<BarChartIcon className="w-5 h-5 text-[#C8102E]" />
						Current Proposal Pipeline
					</h3>
					<div className="h-64 sm:h-80 w-full relative">
						<ResponsiveContainer width="100%" height="100%">
							<BarChart
								data={pipelineData}
								margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
								barSize={45}
							>
								<CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
								<XAxis
									dataKey="name"
									axisLine={false}
									tickLine={false}
									tick={{ fill: '#64748b', fontSize: 13, fontWeight: 500 }}
									dy={10}
								/>
								<YAxis
									axisLine={false}
									tickLine={false}
									tick={{ fill: '#64748b', fontSize: 12 }}
									dx={-10}
									allowDecimals={false}
								/>
								<RechartsTooltip
									cursor={{ fill: 'transparent' }}
									contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
									formatter={(value: any) => [`${value} Proposals`, 'Count']}
								/>
								<Bar dataKey="value" radius={[6, 6, 0, 0]}>
									{pipelineData.map((entry, index) => (
										<Cell key={`cell-${index}`} fill={entry.color} />
									))}
								</Bar>
							</BarChart>
						</ResponsiveContainer>
					</div>
				</div>
			</section>
		</div>
	);
};

export default Dashboard;
