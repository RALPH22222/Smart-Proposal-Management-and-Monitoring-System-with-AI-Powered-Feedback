import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Sidebar from '../../../components/rnd-component/RnDSidebar';
import Dashboard from './RndDashboard';
import ReviewPage from './RndProposalPage';
import Monitoring from './RnDMonitoringPage';
import Settings from './RndSettings';
import {
	type Statistics,
	type Activity
} from '../../../types/InterfaceProposal';
import { proposalApi } from '../../../services/RndProposalApi/ProposalApi';
import EndorsePage from './RnDEndorsePage';
import EvaluatorPage from './RnDEvaluatorPage';
import FundingPage from './RnDFundingPage';

const MainLayout: React.FC = () => {
	const [searchParams, setSearchParams] = useSearchParams();
	const currentPage = searchParams.get("tab") || "dashboard";
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

	const [statistics, setStatistics] = useState<Statistics>({
		totalProposals: 0,
		pendingProposals: 0,
		acceptedProposals: 0,
		rejectedProposals: 0,
		revisionRequiredProposals: 0,
		monthlySubmissions: []
	});

	const [recentActivity, setRecentActivity] = useState<Activity[]>([]);
	const [dashboardLoading, setDashboardLoading] = useState(true);

	useEffect(() => {
		loadData();
	}, []);

	const loadData = async () => {
		setDashboardLoading(true);
		try {
			const { statistics: statsData, recentActivity: activityData } = await proposalApi.fetchDashboardData();
			setStatistics(statsData);
			setRecentActivity(activityData);
		} catch (error) {
			console.error('Error loading data:', error);
		} finally {
			setDashboardLoading(false);
		}
	};

	const handlePageChange = (page: string) => {
		setSearchParams({ tab: page });
	};

	const renderCurrentPage = () => {
		switch (currentPage) {
			case 'dashboard':
				return (
					<Dashboard statistics={statistics} recentActivity={recentActivity} onRefresh={loadData} isLoading={dashboardLoading} />
				);
			case 'proposals':
				return <ReviewPage />;
			case 'evaluators':
				return <EvaluatorPage />;
			case 'endorsements':
				return <EndorsePage />;
			case 'funding':
				return <FundingPage />;
			case 'monitoring':
				return <Monitoring onStatsUpdate={loadData} />
			case 'settings':
				return <Settings />;
			default:
				return (
					<Dashboard statistics={statistics} recentActivity={recentActivity} onRefresh={loadData} isLoading={dashboardLoading} />
				);
		}
	};

	return (
		<div className='min-h-screen bg-gray-50 flex'>
			{/* Sidebar */}
			<div className='w-auto'>
				<Sidebar
					currentPage={currentPage}
					onPageChange={handlePageChange}
					statistics={statistics}
					isMobileMenuOpen={isMobileMenuOpen}
					setIsMobileMenuOpen={setIsMobileMenuOpen}
				/>
			</div>

			{/* Main Content */}
			<div className='flex-1 bg-gray-50 overflow-y-auto' onClick={() => isMobileMenuOpen && setIsMobileMenuOpen(false)}>
				{renderCurrentPage()}
			</div>
		</div>
	);
};

export default MainLayout;
