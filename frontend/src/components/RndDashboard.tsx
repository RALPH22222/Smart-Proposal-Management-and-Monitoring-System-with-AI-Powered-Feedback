import React from 'react';
import {
	TrendingUp,
	FileText,
	Clock,
	CheckCircle,
	XCircle,
	AlertCircle,
	Calendar,
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
			color: 'bg-blue-500',
			textColor: 'text-blue-600',
			bgColor: 'bg-blue-50'
		},
		{
			title: 'Pending Review',
			value: statistics.pendingProposals,
			icon: Clock,
			color: 'bg-orange-500',
			textColor: 'text-orange-600',
			bgColor: 'bg-orange-50'
		},
		{
			title: 'Accepted',
			value: statistics.acceptedProposals,
			icon: CheckCircle,
			color: 'bg-green-500',
			textColor: 'text-green-600',
			bgColor: 'bg-green-50'
		},
		{
			title: 'Rejected',
			value: statistics.rejectedProposals,
			icon: XCircle,
			color: 'bg-red-500',
			textColor: 'text-red-600',
			bgColor: 'bg-red-50'
		},
		{
			title: 'Need Revision',
			value: statistics.revisableProposals,
			icon: AlertCircle,
			color: 'bg-yellow-500',
			textColor: 'text-yellow-600',
			bgColor: 'bg-yellow-50'
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
				return 'text-green-600';
			case 'submission':
				return 'text-blue-600';
			case 'revision':
				return 'text-orange-600';
			default:
				return 'text-gray-600';
		}
	};

	return (
		<div className='p-6 space-y-6'>
			{/* Header */}
			<div>
				<h1 className='text-2xl font-bold text-gray-900'>Dashboard</h1>
				<p className='text-gray-600'>
					Overview of proposal management activities
				</p>
			</div>

			{/* Statistics Cards */}
			<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6'>
				{statCards.map((card) => {
					const Icon = card.icon;
					return (
						<div
							key={card.title}
							className={`${card.bgColor} rounded-lg p-6 border border-gray-200`}
						>
							<div className='flex items-center justify-between'>
								<div>
									<p className='text-sm font-medium text-gray-600'>
										{card.title}
									</p>
									<p className={`text-2xl font-bold ${card.textColor}`}>
										{card.value}
									</p>
								</div>
								<div className={`${card.color} p-3 rounded-lg`}>
									<Icon className='w-6 h-6 text-white' />
								</div>
							</div>
						</div>
					);
				})}
			</div>

			<div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
				{/* Monthly Submissions Chart */}
				<div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
					<div className='flex items-center justify-between mb-4'>
						<h3 className='text-lg font-semibold text-gray-900'>
							Monthly Submissions
						</h3>
						<TrendingUp className='w-5 h-5 text-gray-400' />
					</div>
					<div className='space-y-3'>
						{statistics.monthlySubmissions.map((month) => (
							<div
								key={month.month}
								className='flex items-center justify-between'
							>
								<span className='text-sm text-gray-600'>{month.month}</span>
								<div className='flex items-center space-x-2'>
									<div className='w-24 bg-gray-200 rounded-full h-2'>
										<div
											className='bg-[#C10003] h-2 rounded-full transition-all duration-300'
											style={{
												width: `${
													(month.count /
														Math.max(
															...statistics.monthlySubmissions.map(
																(m) => m.count
															)
														)) *
													100
												}%`
											}}
										></div>
									</div>
									<span className='text-sm font-medium text-gray-900 w-8 text-right'>
										{month.count}
									</span>
								</div>
							</div>
						))}
					</div>
				</div>

				{/* Recent Activity */}
				<div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
					<div className='flex items-center justify-between mb-4'>
						<h3 className='text-lg font-semibold text-gray-900'>
							Recent Activity
						</h3>
						<Calendar className='w-5 h-5 text-gray-400' />
					</div>
					<div className='space-y-4'>
						{recentActivity.slice(0, 5).map((activity) => {
							const Icon = getActivityIcon(activity.type);
							const colorClass = getActivityColor(activity.type);

							return (
								<div key={activity.id} className='flex items-start space-x-3'>
									<div
										className={`p-1 rounded-full ${colorClass
											.replace('text-', 'bg-')
											.replace('-600', '-100')}`}
									>
										<Icon className={`w-4 h-4 ${colorClass}`} />
									</div>
									<div className='flex-1 min-w-0'>
										<p className='text-sm text-gray-900'>
											<span className='font-medium'>{activity.action}</span>
										</p>
										<p className='text-xs text-gray-500 truncate'>
											{activity.proposalTitle}
										</p>
										<div className='flex items-center mt-1 text-xs text-gray-400'>
											<User className='w-3 h-3 mr-1' />
											<span>{activity.user}</span>
											<span className='mx-2'>•</span>
											<span>
												{new Date(activity.timestamp).toLocaleDateString()}
											</span>
										</div>
									</div>
								</div>
							);
						})}
					</div>
				</div>
			</div>

			{/* Status Distribution */}
			<div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
				<h3 className='text-lg font-semibold text-gray-900 mb-4'>
					Proposal Status Distribution
				</h3>
				<div className='grid grid-cols-2 md:grid-cols-5 gap-4'>
					{statCards.map((card) => {
						const percentage =
							statistics.totalProposals > 0
								? ((card.value / statistics.totalProposals) * 100).toFixed(1)
								: '0';

						return (
							<div key={card.title} className='text-center'>
								<div
									className={`w-16 h-16 ${card.color} rounded-full flex items-center justify-center mx-auto mb-2`}
								>
									<span className='text-white font-bold text-lg'>
										{card.value}
									</span>
								</div>
								<p className='text-sm font-medium text-gray-900'>
									{card.title}
								</p>
								<p className='text-xs text-gray-500'>{percentage}%</p>
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
};

export default Dashboard;
