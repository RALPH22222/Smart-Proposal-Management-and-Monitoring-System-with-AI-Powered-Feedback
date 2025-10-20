import React, { useState } from 'react';
import {
	LogOut,
	User,
	ChevronDown,
	Bell,
	Menu,
	X,
	Settings
} from 'lucide-react';

interface NavbarProps {
	userEmail?: string;
	userName?: string;
	userAvatar?: string;
	onLogout?: () => void;
	onToggleSidebar?: () => void;
	notificationCount?: number;
	isSidebarOpen?: boolean;
}

const Navbar: React.FC<NavbarProps> = ({
	userEmail = 'staff@wmsu.edu.ph',
	userName = 'R&D Staff',
	userAvatar,
	onLogout = () => console.log('Logout clicked'),
	onToggleSidebar,
	notificationCount = 3,
	isSidebarOpen = false
}) => {
	const [isDropdownOpen, setIsDropdownOpen] = useState(false);

	const handleLogout = () => {
		setIsDropdownOpen(false);
		onLogout();
	};

	return (
		<nav className='bg-[#C10003] shadow-sm'>
			<div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
				<div className='flex justify-between items-center h-16 relative'>
					{/* Left Section */}
					<div className='flex items-center space-x-2 sm:space-x-4 flex-1 min-w-0'>
						{/* Sidebar Toggle */}
						{onToggleSidebar && (
							<button
								onClick={onToggleSidebar}
								className='p-2 rounded-lg hover:bg-[#A00002] transition-colors lg:hidden flex-shrink-0'
							>
								{isSidebarOpen ? (
									<X className='w-5 h-5 text-white' />
								) : (
									<Menu className='w-5 h-5 text-white' />
								)}
							</button>
						)}

						{/* Logo and Title */}
						<div className='flex-shrink-0 min-w-0'>
							<div>
								<h1 className='text-lg sm:text-xl font-semibold text-white truncate'>
									WMSU Proposal Management
								</h1>
								<p className='text-xs sm:text-sm text-red-100 hidden sm:block'>
									R&D Staff Portal
								</p>
							</div>
						</div>
					</div>

					{/* Right Section */}
					<div className='flex items-center space-x-2 sm:space-x-4 flex-shrink-0'>
						{/* Desktop: Separate Notifications and Profile */}
						<div className='relative hidden sm:block'>
							<button className='p-2 rounded-lg hover:bg-[#A00002] transition-colors'>
								<Bell className='w-5 h-5 text-white' />
								{notificationCount > 0 && (
									<span className='absolute -top-1 -right-1 bg-yellow-400 text-[#C10003] text-xs font-bold rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center'>
										{notificationCount > 9 ? '9+' : notificationCount}
									</span>
								)}
							</button>
						</div>

						{/* Desktop: User Account Section */}
						<div className='relative hidden sm:block'>
							<button
								onClick={() => setIsDropdownOpen(!isDropdownOpen)}
								className='flex items-center space-x-2 sm:space-x-3 p-2 rounded-lg hover:bg-[#A00002] transition-colors'
							>
								{/* User Avatar */}
								<div className='w-7 h-7 sm:w-8 sm:h-8 bg-white rounded-full flex items-center justify-center overflow-hidden flex-shrink-0'>
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
								<div className='hidden md:block text-left min-w-0'>
									<p className='text-sm font-medium text-white truncate'>
										{userName}
									</p>
									<p className='text-xs text-red-100 truncate'>{userEmail}</p>
								</div>

								<ChevronDown
									className={`w-3 h-3 sm:w-4 sm:h-4 text-red-100 transition-transform flex-shrink-0 ${
										isDropdownOpen ? 'rotate-180' : ''
									}`}
								/>
							</button>

							{/* Desktop Dropdown Menu */}
							{isDropdownOpen && (
								<>
									{/* Backdrop */}
									<div
										className='fixed inset-0 z-10'
										onClick={() => setIsDropdownOpen(false)}
									/>

									{/* Dropdown Content */}
									<div className='absolute right-0 mt-2 w-48 sm:w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-20'>
										<div className='p-4 border-b border-gray-100'>
											<p className='text-sm font-medium text-gray-900 truncate'>
												{userName}
											</p>
											<p className='text-xs text-gray-500 truncate'>
												{userEmail}
											</p>
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

						{/* Mobile: Combined Settings Icon */}
						<div className='relative sm:hidden'>
							<button
								onClick={() => setIsDropdownOpen(!isDropdownOpen)}
								className='p-2 rounded-lg hover:bg-[#A00002] transition-colors relative'
							>
								<Settings className='w-5 h-5 text-white' />
								{notificationCount > 0 && (
									<span className='absolute -top-1 -right-1 bg-yellow-400 text-[#C10003] text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center'>
										{notificationCount > 9 ? '9+' : notificationCount}
									</span>
								)}
							</button>

							{/* Mobile Dropdown Menu */}
							{isDropdownOpen && (
								<>
									{/* Backdrop */}
									<div
										className='fixed inset-0 z-10'
										onClick={() => setIsDropdownOpen(false)}
									/>

									{/* Dropdown Content */}
									<div className='absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-20'>
										{/* User Info */}
										<div className='p-4 border-b border-gray-100'>
											<div className='flex items-center space-x-3'>
												<div className='w-10 h-10 bg-[#C10003] rounded-full flex items-center justify-center overflow-hidden flex-shrink-0'>
													{userAvatar ? (
														<img
															src={userAvatar}
															alt={userName}
															className='w-full h-full object-cover'
														/>
													) : (
														<User className='w-6 h-6 text-white' />
													)}
												</div>
												<div className='min-w-0 flex-1'>
													<p className='text-sm font-medium text-gray-900 truncate'>
														{userName}
													</p>
													<p className='text-xs text-gray-500 truncate'>
														{userEmail}
													</p>
												</div>
											</div>
										</div>

										{/* Notifications Section */}
										<div className='p-3 border-b border-gray-100'>
											<div className='flex items-center justify-between mb-2'>
												<h4 className='text-sm font-medium text-gray-900'>
													Notifications
												</h4>
												{notificationCount > 0 && (
													<span className='bg-[#C10003] text-white text-xs font-bold rounded-full px-2 py-1'>
														{notificationCount}
													</span>
												)}
											</div>
											<p className='text-xs text-gray-600'>
												{notificationCount > 0
													? `You have ${notificationCount} pending proposal${
															notificationCount > 1 ? 's' : ''
													  } to review`
													: 'No new notifications'}
											</p>
										</div>

										{/* Actions */}
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
			</div>
		</nav>
	);
};

export default Navbar;
