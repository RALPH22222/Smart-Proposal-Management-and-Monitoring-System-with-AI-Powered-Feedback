import React, { useState } from 'react';
import { LogOut, User, ChevronDown } from 'lucide-react';

interface NavbarProps {
	userEmail?: string;
	userName?: string;
	userAvatar?: string;
	onLogout?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({
	userEmail = 'staff@wmsu.edu.ph',
	userName = 'R&D Staff',
	userAvatar,
	onLogout = () => console.log('Logout clicked')
}) => {
	const [isDropdownOpen, setIsDropdownOpen] = useState(false);

	const handleLogout = () => {
		setIsDropdownOpen(false);
		onLogout();
	};

	return (
		<nav className='bg-[#C10003] shadow-sm'>
			<div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
				<div className='flex justify-between items-center h-16'>
					{/* Logo and Title */}
					<div className='flex items-center'>
						<div className='flex-shrink-0'>
							<div>
								<h1 className='text-xl font-semibold text-white'>
									WMSU Proposal Management
								</h1>
								<p className='text-sm text-red-100'>R&D Staff Portal</p>
							</div>
						</div>
					</div>

					{/* User Account Section */}
					<div className='relative'>
						<button
							onClick={() => setIsDropdownOpen(!isDropdownOpen)}
							className='flex items-center space-x-3 p-2 rounded-lg hover:bg-[#A00002] transition-colors'
						>
							{/* User Avatar */}
							<div className='w-8 h-8 bg-white rounded-full flex items-center justify-center overflow-hidden'>
								{userAvatar ? (
									<img
										src={userAvatar}
										alt={userName}
										className='w-full h-full object-cover'
									/>
								) : (
									<User className='w-5 h-5 text-[#C10003]' />
								)}
							</div>

							{/* User Info */}
							<div className='hidden sm:block text-left'>
								<p className='text-sm font-medium text-white'>{userName}</p>
								<p className='text-xs text-red-100'>{userEmail}</p>
							</div>

							<ChevronDown
								className={`w-4 h-4 text-red-100 transition-transform ${
									isDropdownOpen ? 'rotate-180' : ''
								}`}
							/>
						</button>

						{/* Dropdown Menu */}
						{isDropdownOpen && (
							<>
								{/* Backdrop */}
								<div
									className='fixed inset-0 z-10'
									onClick={() => setIsDropdownOpen(false)}
								/>

								{/* Dropdown Content */}
								<div className='absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-20'>
									<div className='p-4 border-b border-gray-100'>
										<p className='text-sm font-medium text-gray-900'>
											{userName}
										</p>
										<p className='text-xs text-gray-500'>{userEmail}</p>
									</div>

									<div className='p-2'>
										<button
											onClick={handleLogout}
											className='w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors'
										>
											<LogOut className='w-4 h-4 mr-3' />
											Sign Out
										</button>
									</div>
								</div>
							</>
						)}
					</div>
				</div>
			</div>
		</nav>
	);
};

export default Navbar;
