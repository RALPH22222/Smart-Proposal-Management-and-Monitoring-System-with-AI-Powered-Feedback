import React from 'react';
import {
	TrendingUp,
	FileText,
	Clock,
	Send,
	XCircle,
	AlertCircle,
	Calendar,
	CheckCircle,
	User
} from 'lucide-react';
import { type Statistics, type Activity } from '../types/InterfaceProposal';

interface DashboardProps {
	statistics: Statistics;
	recentActivity: Activity[];
}

const Dashboard: React.FC<DashboardProps> = ({
	statistics,
	recentActivity
}) => {
	const statCards = [
		{
			title: 'Total Proposals',
			value: statistics.totalProposals,
			icon: FileText,
			color: 'text-blue-500',
			bgColor: 'bg-blue-50',
			borderColor: 'border-blue-200',
			trend: '+5%',
		},
		{
			title: 'Pending Review',
			value: statistics.pendingProposals,
			icon: Clock,
			color: 'text-amber-500',
			bgColor: 'bg-amber-50',
			borderColor: 'border-amber-200',
			trend: '+12%',
		},
		{
			title: 'Forward to Evaluators',
			value: statistics.acceptedProposals,
			icon: Send,
			color: 'text-emerald-500',
			bgColor: 'bg-emerald-50',
			borderColor: 'border-emerald-200',
			trend: '+8%',
		},
		{
			title: 'Rejected',
			value: statistics.rejectedProposals,
			icon: XCircle,
			color: 'text-red-500',
			bgColor: 'bg-red-50',
			borderColor: 'border-red-200',
			trend: '-3%',
		},
		{
			title: 'Need Revision',
			value: statistics.revisionRequiredProposals,
			icon: AlertCircle,
			color: 'text-orange-500',
			bgColor: 'bg-orange-50',
			borderColor: 'border-orange-200',
			trend: '+2%',
		}
	];

	const getActivityIcon = (type: string) => {
		switch (type) {
			case 'review':
				return CheckCircle;
			case 'submission':
				return FileText;
			case 'revision':
				return AlertCircle;
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

	return (
		<div className="flex w-full bg-gradient-to-br from-slate-50 to-slate-100">
			<div className="flex-1">
				<div className="p-2">
					{/* Header */}
					<header className="pb-4 sm:pb-6">
						<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
							<div>
								<h1 className="text-2xl sm:text-3xl font-bold text-[#C8102E] leading-tight">R&D Dashboard</h1>
								<p className="text-slate-600 mt-2 text-sm leading-relaxed">
									Overview of proposal management activities
								</p>
							</div>
							<div className="flex items-center gap-2 text-xs text-slate-500">
								<Calendar className="w-4 h-4" />
								<span>Last updated: Today, 2:30 PM</span>
							</div>
						</div>
					</header>

					{/* Stats Section */}
					<section className="mb-4 sm:mb-6" aria-labelledby="stats-heading">
						<h2 id="stats-heading" className="sr-only">
							Proposal Statistics
						</h2>
						<div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
							{/* First four stats cards */}
							<div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
								{statCards.slice(0, 4).map((stat, index) => {
									const IconComponent = stat.icon
									return (
										<div
											key={index}
											className={`${stat.bgColor} ${stat.borderColor} border-2 rounded-2xl p-4 transition-all duration-300 hover:shadow-lg hover:scale-105 group cursor-pointer`}
											role="button"
											tabIndex={0}
											aria-label={`${stat.title}: ${stat.value} proposals, ${stat.trend} change`}
										>
											<div className="flex items-center justify-between mb-3">
												<IconComponent
													className={`${stat.color} w-6 h-6 group-hover:scale-110 transition-transform duration-300`}
												/>
												<div className="flex items-center gap-1">
													<TrendingUp className="w-3 h-3 text-slate-400" />
													<span className="text-xs font-medium text-slate-600">{stat.trend}</span>
												</div>
											</div>
											<h3 className="text-xs font-semibold text-slate-700 mb-2 leading-tight">{stat.title}</h3>
											<p className="text-xl font-bold text-slate-800 tabular-nums">{stat.value.toLocaleString()}</p>
										</div>
									)
								})}
							</div>

							{/* Fifth stats card aligned with recent activity box */}
							<div className="w-full lg:w-80">
								{(() => {
									const stat = statCards[4]
									const IconComponent = stat.icon
									return (
										<div
											className={`${stat.bgColor} ${stat.borderColor} border-2 rounded-2xl p-4 transition-all duration-300 hover:shadow-lg hover:scale-105 group cursor-pointer`}
											role="button"
											tabIndex={0}
											aria-label={`${stat.title}: ${stat.value} proposals, ${stat.trend} change`}
										>
											<div className="flex items-center justify-between mb-3">
												<IconComponent
													className={`${stat.color} w-6 h-6 group-hover:scale-110 transition-transform duration-300`}
												/>
												<div className="flex items-center gap-1">
													<TrendingUp className="w-3 h-3 text-slate-400" />
													<span className="text-xs font-medium text-slate-600">{stat.trend}</span>
												</div>
											</div>
											<h3 className="text-xs font-semibold text-slate-700 mb-2 leading-tight">{stat.title}</h3>
											<p className="text-xl font-bold text-slate-800 tabular-nums">{stat.value.toLocaleString()}</p>
										</div>
									)
								})()}
							</div>
						</div>
					</section>

					{/* Content Section */}
					<section className="flex flex-col lg:flex-row gap-4 lg:gap-6">
						{/* Monthly Submissions Chart */}
						<div
							className="bg-white shadow-xl rounded-2xl border border-slate-200 overflow-hidden flex-1 flex flex-col"
							aria-labelledby="submissions-heading"
						>
							<div className="p-4 border-b border-slate-200 bg-slate-50">
								<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
									<h3 id="submissions-heading" className="text-lg font-bold text-slate-800 flex items-center gap-2">
										<TrendingUp className="w-5 h-5 text-[#C8102E]" />
										Monthly Submissions
									</h3>
									<div className="flex items-center gap-2 text-xs text-slate-500">
										<Calendar className="w-4 h-4" />
										<span>{statistics.monthlySubmissions.length} months tracked</span>
									</div>
								</div>
							</div>

							<div className="p-6 flex-1">
								<div className="space-y-4">
									{statistics.monthlySubmissions.map((month) => (
										<div
											key={month.month}
											className="flex items-center justify-between group"
										>
											<span className="text-sm font-medium text-slate-700">{month.month}</span>
											<div className="flex items-center space-x-3">
												<div className="w-32 bg-slate-200 rounded-full h-3">
													<div
														className="bg-[#C8102E] h-3 rounded-full transition-all duration-500 group-hover:bg-[#A00E26]"
														style={{
															width: `${
																(month.count /
																	Math.max(
																		...statistics.monthlySubmissions.map(
																			(m) => m.count
																		)
																	)
																) *
																100
															}%`
														}}
													></div>
												</div>
												<span className="text-sm font-bold text-slate-800 w-8 text-right tabular-nums">
													{month.count}
												</span>
											</div>
										</div>
									))}
								</div>
							</div>

							{/* Summary Stats */}
							<div className="p-4 bg-gradient-to-r from-slate-50 to-slate-100 border-t border-slate-200">
								<div className="grid grid-cols-3 gap-4">
									<div className="text-center">
										<div className="text-2xl font-bold text-emerald-600">
											{statistics.monthlySubmissions.reduce((sum, m) => sum + m.count, 0)}
										</div>
										<div className="text-xs text-slate-600">Total Submissions</div>
									</div>
									<div className="text-center border-x border-slate-300">
										<div className="text-2xl font-bold text-amber-600">
											{Math.max(...statistics.monthlySubmissions.map(m => m.count))}
										</div>
										<div className="text-xs text-slate-600">Peak Month</div>
									</div>
									<div className="text-center">
										<div className="text-2xl font-bold text-blue-600">
											{Math.round(statistics.monthlySubmissions.reduce((sum, m) => sum + m.count, 0) / statistics.monthlySubmissions.length)}
										</div>
										<div className="text-xs text-slate-600">Average</div>
									</div>
								</div>
							</div>
						</div>

						{/* Recent Activity */}
						<div className="bg-white shadow-xl rounded-2xl border border-slate-200 p-4 sm:p-6 w-full lg:w-80 flex flex-col">
							<h3 className="text-lg font-bold text-slate-800 mb-8 flex items-center gap-2">
								<CheckCircle className="w-5 h-5 text-[#C8102E]" />
								Recent Activity
							</h3>

							<div className="space-y-4 flex-1 overflow-y-auto">
								{recentActivity.slice(0, 5).map((activity) => {
									const Icon = getActivityIcon(activity.type);
									const colorClass = getActivityColor(activity.type);

									return (
										<div key={activity.id} className="flex items-start space-x-3 group">
											<div
												className={`p-2 rounded-xl ${colorClass.replace('text-', 'bg-').replace('-500', '-100')} group-hover:scale-110 transition-transform duration-200`}
											>
												<Icon className={`w-4 h-4 ${colorClass}`} />
											</div>
											<div className="flex-1 min-w-0">
												<p className="text-sm font-semibold text-slate-800 group-hover:text-[#C8102E] transition-colors duration-200">
													{activity.action}
												</p>
												<p className="text-xs text-slate-600 truncate mt-1">
													{activity.proposalTitle}
												</p>
												<div className="flex items-center mt-2 text-xs text-slate-500">
													<User className="w-3 h-3 mr-1" />
													<span>{activity.user}</span>
													<span className="mx-2">•</span>
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
										<div className="w-2 h-2 rounded-full bg-emerald-500"></div>
										<span>{recentActivity.filter(a => a.type === 'review').length} reviews completed</span>
									</div>
									<div className="flex items-center gap-2">
										<div className="w-2 h-2 rounded-full bg-blue-500"></div>
										<span>{recentActivity.filter(a => a.type === 'submission').length} new submissions</span>
									</div>
									<div className="flex items-center gap-2">
										<div className="w-2 h-2 rounded-full bg-orange-500"></div>
										<span>{recentActivity.filter(a => a.type === 'revision').length} revisions requested</span>
									</div>
								</div>
							</div>
						</div>
					</section>
				</div>
			</div>
		</div>
	);
};

export default Dashboard;