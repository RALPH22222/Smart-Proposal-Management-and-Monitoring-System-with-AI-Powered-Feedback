import React from 'react';
import Navbar from '../../../components/RnDNavbar';
import Sidebar from '../../../components/RnDSidebar';

const RndDashboard: React.FC = () => {
	return (
		<div>
			<Navbar
				userName='Dr. John Smith'
				userEmail='j.smith@wmsu.edu.ph'
				onLogout={() => {
					console.log('User logged out');
					// In real app: redirect to login page or clear auth state
				}}
			/>
			<div className='flex'>
				<Sidebar />
				<main className='flex-1'>
					<h1>R&D Dashboard</h1>
				</main>
			</div>
		</div>
	);
};
export default RndDashboard;
