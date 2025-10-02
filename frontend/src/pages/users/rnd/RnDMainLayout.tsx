import React, { useState, useEffect } from 'react';
import Navbar from '../../../components/RnDNavbar';
import Sidebar from '../../../components/RnDSidebar';
import Dashboard from '../../../components/RndDashboard';
import ReviewPage from '../../../components/RndReviewPage';
import {
	type Statistics,
	type Activity
} from '../../../types/InterfaceProposal';
import { proposalApi } from '../../../services/RndProposalApi/ProposalApi';

const MainLayout: React.FC = () => {
	const [currentPage, setCurrentPage] = useState('dashboard');
	const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
	const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
	const [statistics, setStatistics] = useState<Statistics>({
		totalProposals: 0,
		pendingProposals: 0,
		acceptedProposals: 0,
		rejectedProposals: 0,
		revisableProposals: 0,
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

	const toggleSidebar = () => {
		// For mobile, toggle the mobile sidebar
		if (window.innerWidth < 1024) {
			setIsMobileSidebarOpen(!isMobileSidebarOpen);
		} else {
			// For desktop, toggle collapsed state
			setSidebarCollapsed(!sidebarCollapsed);
		}
	};

	// Close mobile sidebar when window is resized to desktop
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
			case 'statistics':
				return (
					<div className='p-6'>
						<h1 className='text-2xl font-bold text-gray-900 mb-4'>
							Statistics
						</h1>
						<p className='text-gray-600'>
							Detailed statistics and analytics will be displayed here.
						</p>
					</div>
				);
			case 'reports':
				return (
					<div className='p-6'>
						<h1 className='text-2xl font-bold text-gray-900 mb-4'>Reports</h1>
						<p className='text-gray-600'>
							Export and download options for reports will be available here.
						</p>
					</div>
				);
			case 'revisions':
				return <ReviewPage filter='Revisable' onStatsUpdate={loadData} />;
			case 'evaluators':
				return (
					<div className='p-6'>
						<h1 className='text-2xl font-bold text-gray-900 mb-4'>
							Evaluators
						</h1>
						<p className='text-gray-600'>
							Forwarded proposals tracking will be displayed here.
						</p>
					</div>
				);
			case 'settings':
				return (
					<div className='p-6'>
						<h1 className='text-2xl font-bold text-gray-900 mb-4'>Settings</h1>
						<p className='text-gray-600'>
							Profile and account settings will be available here.
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
			{/* Navbar */}
			<Navbar
				userName='John Doe'
				userEmail='john.doe@example.com'
				onToggleSidebar={toggleSidebar}
				notificationCount={statistics.pendingProposals}
				isSidebarOpen={isMobileSidebarOpen}
			/>

			<div className='flex flex-1 overflow-hidden'>
				{/* Sidebar */}
				<div
					className={`${
						sidebarCollapsed ? 'w-16' : 'w-64'
					} transition-all duration-300 hidden lg:block`}
				>
					<Sidebar
						currentPage={currentPage}
						onPageChange={setCurrentPage}
						statistics={statistics}
						isCollapsed={sidebarCollapsed}
						isMobile={false}
					/>
				</div>

				{/* Mobile Sidebar Overlay */}
				{isMobileSidebarOpen && (
					<div className='lg:hidden fixed inset-0 z-50 flex'>
						<div
							className='fixed inset-0 bg-black bg-opacity-50'
							onClick={() => setIsMobileSidebarOpen(false)}
						/>
						<div className='relative w-64 bg-white'>
							<Sidebar
								currentPage={currentPage}
								onPageChange={(page) => {
									setCurrentPage(page);
									setIsMobileSidebarOpen(false);
								}}
								statistics={statistics}
								isCollapsed={false}
								isMobile={true}
							/>
						</div>
					</div>
				)}

				{/* Main Content */}
				<div className='flex-1 overflow-auto'>{renderCurrentPage()}</div>
			</div>
		</div>
	);
};

export default MainLayout;
