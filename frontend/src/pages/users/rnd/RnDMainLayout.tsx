import React, { useState, useEffect } from 'react';
import Sidebar from '../../../components/rnd-component/RnDSidebar';
import Dashboard from './RndDashboard';
import ReviewPage from './RndProposalPage';
import Monitoring from './RnDMonitoringPage';
import Settings from './RndSettings'
import {
	type Statistics,
	type Activity
} from '../../../types/InterfaceProposal';
import { proposalApi } from '../../../services/RndProposalApi/ProposalApi';
import EndorsePage from './RnDEndorsePage';
import EvaluatorPage from './RnDEvaluatorPage';
import FundingPage from './RnDFundingPage';

const MainLayout: React.FC = () => {
	const [currentPage, setCurrentPage] = useState('dashboard');
	const [statistics, setStatistics] = useState<Statistics>({
		totalProposals: 0,
		pendingProposals: 0,
		acceptedProposals: 0,
		rejectedProposals: 0,
		revisionRequiredProposals: 0,
		monthlySubmissions: []
	});

	const [recentActivity, setRecentActivity] = useState<Activity[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		loadData();
	}, []);

	const loadData = async () => {
		try {
			setLoading(true);
			const [statsData, activityData] = await Promise.all([
				proposalApi.fetchStatistics(),
				proposalApi.fetchRecentActivity()
			]);
			setStatistics(statsData);
			setRecentActivity(activityData);
		} catch (error) {
			console.error('Error loading data:', error);
		} finally {
			setLoading(false);
		}
	};

	const renderCurrentPage = () => {
		switch (currentPage) {
			case 'dashboard':
				return (
					<Dashboard statistics={statistics} recentActivity={recentActivity} />
				);
			case 'proposals':
				return <ReviewPage />;
			case 'revisions':
				return (
					<ReviewPage filter='revision_rnd' onStatsUpdate={loadData} />
				);
			case 'evaluators':
				return <EvaluatorPage />;
			case 'endorsements':
				return <EndorsePage />;
      case 'funding':
        return <FundingPage />;
			case 'monitoring':
				return <Monitoring onStatsUpdate={loadData} />;
			case 'settings':
				return <Settings />;
			default:
				return (
					<Dashboard statistics={statistics} recentActivity={recentActivity} />
				);
		}
	};

	if (loading) {
		return (
			<div className='min-h-screen bg-gray-50 flex items-center justify-center'>
				<div className='text-center'>
					<div className='animate-spin rounded-full h-12 w-12 border-b-2 border-wmsu-red mx-auto'></div>
					<p className='mt-4 text-gray-600'>Loading system...</p>
				</div>
			</div>
		);
	}

	return (
		<div className='min-h-screen bg-gray-50 flex'>
			{/* Sidebar */}
			<div className='w-auto'>
				<Sidebar
					currentPage={currentPage}
					onPageChange={setCurrentPage}
					statistics={statistics}
				/>
			</div>

			{/* Main Content */}
			<div className='flex-1 bg-gray-50 overflow-y-auto'>
				{renderCurrentPage()}
			</div>
		</div>
	);
};

export default MainLayout;