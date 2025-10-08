import React, { useState, useEffect } from 'react';
import Sidebar from '../../../components/RnDSidebar';
import Dashboard from '../../../components/RndDashboard';
import ReviewPage from '../../../components/RndReviewPage';
import {
	type Statistics,
	type Activity
} from '../../../types/InterfaceProposal';
import { proposalApi } from '../../../services/RndProposalApi/ProposalApi';
import EndorsePage from '../../../components/RnDEndorsePage';
import EvaluatorPage from '../../../components/RnDEvaluatorPage';

const MainLayout: React.FC = () => {
	const [currentPage, setCurrentPage] = useState('dashboard');
	const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
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

	useEffect(() => {
		const handleResize = () => {
			if (window.innerWidth >= 1024) {
				setIsMobileSidebarOpen(false);
			}
		};
		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	}, []);

	const renderCurrentPage = () => {
		switch (currentPage) {
			case 'dashboard':
				return (
					<Dashboard statistics={statistics} recentActivity={recentActivity} />
				);
			case 'proposals':
				return <ReviewPage onStatsUpdate={loadData} />;
			case 'revisions':
				return (
					<ReviewPage filter='Revision Required' onStatsUpdate={loadData} />
				);
			case 'endorsements':
				return <EndorsePage />;
			case 'evaluators':
				return <EvaluatorPage />;
			case 'reports':
				return (
					<div className='p-6'>
						<h1 className='text-2xl font-bold text-gray-900 mb-4'>Reports</h1>
						<p className='text-gray-600'>Export and download reports here.</p>
					</div>
				);
			case 'settings':
				return (
					<div className='p-6'>
						<h1 className='text-2xl font-bold text-gray-900 mb-4'>Settings</h1>
						<p className='text-gray-600'>
							Profile and account settings go here.
						</p>
					</div>
				);
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
		<div className='min-h-screen bg-gray-50 flex flex-col'>
			{/* Mobile Burger Menu */}
			<div className='lg:hidden flex items-center bg-white border-b border-gray-200 p-3 shadow-sm'>
				<button
					onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
					className='text-gray-700 focus:outline-none'
				>
					<svg
						className='w-6 h-6'
						fill='none'
						stroke='currentColor'
						viewBox='0 0 24 24'
					>
						<path
							strokeLinecap='round'
							strokeLinejoin='round'
							strokeWidth={2}
							d='M4 6h16M4 12h16M4 18h16'
						/>
					</svg>
				</button>
				<h1 className='ml-4 text-lg font-semibold text-gray-800 capitalize'>
					{currentPage}
				</h1>
			</div>

			<div className='flex flex-1 overflow-hidden'>
				{/* Sidebar */}
				<div
					className={`transition-all duration-300 ${
						isMobileSidebarOpen
							? 'block w-64 fixed inset-y-0 z-50 bg-white shadow-lg lg:static lg:block'
							: 'hidden lg:block lg:w-64'
					}`}
				>
					<Sidebar
						currentPage={currentPage}
						onPageChange={setCurrentPage}
						statistics={statistics}
						isMobile={false}
					/>
				</div>

				{/* Overlay for mobile sidebar */}
				{isMobileSidebarOpen && (
					<div
						className='fixed inset-0 bg-black bg-opacity-40 z-40'
						onClick={() => setIsMobileSidebarOpen(false)}
					></div>
				)}

				{/* Main Content */}
				<div className='flex-1 overflow-auto p-6 bg-gray-50'>
					{renderCurrentPage()}
				</div>
			</div>
		</div>
	);
};

export default MainLayout;
