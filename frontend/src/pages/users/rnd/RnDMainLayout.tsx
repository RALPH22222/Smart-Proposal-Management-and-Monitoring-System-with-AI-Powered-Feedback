import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Sidebar from '../../../components/rnd-component/RnDSidebar';
import Dashboard from './RndDashboard';
import ReviewPage from './RndProposalPage';
import Monitoring from './RnDMonitoringPage';
import Settings from './RndSettings';
import RnDFloatingNotification from '../../../components/rnd-component/RnDFloatingNotification';
import {
	type Statistics,
	type Activity
} from '../../../types/InterfaceProposal';
import { proposalApi } from '../../../services/RndProposalApi/ProposalApi';
import { getProposalsForEndorsement } from '../../../services/proposal.api';
import { fetchFundedProjects } from '../../../services/ProjectMonitoringApi';
import EndorsePage from './RnDEndorsePage';
import EvaluatorPage from './RnDEvaluatorPage';
import FundingPage from './RnDFundingPage';

// Per-R&D roll-ups that drive the "Needs Your Attention" dashboard panel.
// All values are derived from existing endpoints — no new backend needed.
export interface RnDAttention {
	readyForEndorsement: number;
	overdueReports: number;
	pendingFundRequests: number;
}

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
	const [attention, setAttention] = useState<RnDAttention>({
		readyForEndorsement: 0,
		overdueReports: 0,
		pendingFundRequests: 0,
	});

	useEffect(() => {
		loadData();
	}, []);

	const loadData = async () => {
		setDashboardLoading(true);
		try {
			// Fire all three queries in parallel. Each uses an existing endpoint:
			// fetchDashboardData → statistics + activity,
			// getProposalsForEndorsement('active') → readyForEndorsement count,
			// fetchFundedProjects('rnd') → sums overdue reports + pending fund requests
			// across all projects assigned to this R&D.
			const [{ statistics: statsData, recentActivity: activityData }, endorsementList, projects] =
				await Promise.all([
					proposalApi.fetchDashboardData(),
					getProposalsForEndorsement('active').catch(() => []),
					fetchFundedProjects('rnd').catch(() => []),
				]);
			setStatistics(statsData);
			setRecentActivity(activityData);
			setAttention({
				readyForEndorsement: (endorsementList || []).filter((p: any) => p.readyForEndorsement).length,
				overdueReports: (projects || []).reduce(
					(sum: number, p: any) => sum + (p.overdue_reports_count || 0),
					0,
				),
				pendingFundRequests: (projects || []).reduce(
					(sum: number, p: any) => sum + (p.pending_fund_requests_count || 0),
					0,
				),
			});
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
					<Dashboard
						statistics={statistics}
						recentActivity={recentActivity}
						onRefresh={loadData}
						isLoading={dashboardLoading}
						attention={attention}
						onPageChange={handlePageChange}
					/>
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
					<Dashboard
						statistics={statistics}
						recentActivity={recentActivity}
						onRefresh={loadData}
						isLoading={dashboardLoading}
						attention={attention}
						onPageChange={handlePageChange}
					/>
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
			<div className='flex-1 bg-gray-50 flex min-w-0 h-screen relative'>
				<main 
					className="flex-1 overflow-y-auto"
					onClick={() => isMobileMenuOpen && setIsMobileMenuOpen(false)}
				>
					{renderCurrentPage()}
				</main>
				<RnDFloatingNotification onPageChange={handlePageChange} />
			</div>
		</div>
	);
};

export default MainLayout;
