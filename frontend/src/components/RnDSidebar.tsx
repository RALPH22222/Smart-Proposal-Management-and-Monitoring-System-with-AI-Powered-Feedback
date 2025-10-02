import React from 'react';
import {
	LayoutDashboard,
	FileText,
	RefreshCw,
	ChevronRight
} from 'lucide-react';
import { type Statistics } from '../types/InterfaceProposal';

interface SidebarProps {
	currentPage: string;
	onPageChange: (page: string) => void;
	statistics: Statistics;
	isCollapsed?: boolean;
	isMobile?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({
	currentPage,
	onPageChange,
	isCollapsed = false,
	isMobile = false
}) => {
	const menuItems = [
		{ id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
		{ id: 'proposals', label: 'Proposals', icon: FileText },
		{ id: 'revisions', label: 'Revision Requests', icon: RefreshCw }
	];

	return (
		<div
			className={`bg-white shadow-lg border-r border-gray-200 transition-all duration-300 ${
				isMobile ? 'w-64' : isCollapsed ? 'w-16' : 'w-64'
			} flex flex-col h-full`}
		>
			{/* Sidebar Header */}
			<div className='p-4 border-b border-gray-200'>
				{(!isCollapsed || isMobile) && (
					<h2 className='text-lg font-semibold text-gray-800'>Navigation</h2>
				)}
			</div>

			{/* Navigation Menu */}
			<nav className='flex-1 p-4 space-y-2'>
				{menuItems.map((item) => {
					const Icon = item.icon;
					const isActive = currentPage === item.id;

					return (
						<button
							key={item.id}
							onClick={() => onPageChange(item.id)}
							className={`w-full flex items-center px-3 py-2 rounded-lg text-left transition-colors ${
								isActive
									? 'bg-[#C10003] text-white'
									: 'text-gray-700 hover:bg-gray-100'
							}`}
							title={isCollapsed && !isMobile ? item.label : undefined}
						>
							<Icon className='w-5 h-5 flex-shrink-0' />
							{(!isCollapsed || isMobile) && (
								<>
									<span className='ml-3 font-medium'>{item.label}</span>
									{isActive && <ChevronRight className='w-4 h-4 ml-auto' />}
								</>
							)}
						</button>
					);
				})}
			</nav>
		</div>
	);
};

export default Sidebar;
