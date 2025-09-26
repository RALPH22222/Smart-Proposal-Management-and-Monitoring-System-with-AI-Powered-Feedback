import type React from 'react';
import { useState } from 'react';
import { NavLink } from 'react-router-dom';

const accent = '#C8102E';

const RnDSidebar: React.FC = () => {
	const [hoveredItem, setHoveredItem] = useState<string | null>(null);

	const mainLinks = [
		{ to: '/users/rnd/dashboard', label: 'Dashboard', icon: DashboardIcon },
		{
			to: '/users/rnd/review-proposals',
			label: 'Proposals',
			icon: ContentIcon
		},
		{ to: '/users/rnd/contents', label: 'Contents', icon: ContentIcon },
		{
			to: '/users/rnd/reports',
			label: 'Reports',
			icon: BellIcon,
			badge: '5'
		},
		{ to: '/users/admin/reviews', label: 'Reviews', icon: ReviewIcon }
	];

	return (
		<aside className='sticky top-0 h-screen w-64 bg-gradient-to-b from-white to-gray-50/50 border-r border-gray-200/60 shadow-lg backdrop-blur-sm p-4 overflow-y-auto'>
			{/* Enhanced Header with Animation */}
			<div className='flex items-center gap-3 mb-8 p-3 rounded-xl bg-gradient-to-r from-red-50 to-red-50/30 border border-red-100/50 shadow-sm'>
				<div
					className='w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md transform transition-transform duration-300 hover:scale-110 hover:rotate-3'
					style={{
						backgroundColor: accent,
						background: `linear-gradient(135deg, ${accent} 0%, #A00E26 100%)`
					}}
				>
					A
				</div>
				<div>
					<h3 className='text-xl font-bold bg-gradient-to-r from-red-600 to-red-700 bg-clip-text text-transparent'>
						WMSU Admin
					</h3>
					<p className='text-xs text-gray-500 font-medium'>Project Portal</p>
				</div>
			</div>

			<nav className='flex flex-col gap-2'>
				{/* Main Navigation Links with Enhanced Styling */}
				<div className='space-y-1'>
					{mainLinks.map((ln) => (
						<NavLink
							key={ln.to}
							to={ln.to}
							onMouseEnter={() => setHoveredItem(ln.to)}
							onMouseLeave={() => setHoveredItem(null)}
							className={({ isActive }) =>
								`group relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 transform ${
									isActive
										? 'bg-gradient-to-r from-red-50 to-red-100/50 text-red-700 shadow-md scale-[1.02] border border-red-200/50'
										: 'text-gray-700 hover:bg-gradient-to-r hover:from-red-50/50 hover:to-red-50/30 hover:text-red-600 hover:scale-[1.01] hover:shadow-sm'
								}`
							}
							style={({ isActive }) =>
								isActive ? { boxShadow: `inset 4px 0 0 ${accent}` } : {}
							}
						>
							<div className='relative'>
								<ln.icon
									className={`w-5 h-5 transition-all duration-300 ${
										hoveredItem === ln.to ? 'scale-110' : ''
									}`}
									style={{ color: accent }}
								/>
								{/* Animated glow effect */}
								<div
									className={`absolute inset-0 w-5 h-5 rounded-full transition-opacity duration-300 ${
										hoveredItem === ln.to ? 'opacity-20' : 'opacity-0'
									}`}
									style={{ backgroundColor: accent, filter: 'blur(8px)' }}
								/>
							</div>
							<span className='flex-1'>{ln.label}</span>
							{ln.badge && (
								<span
									className={`px-2 py-1 text-xs font-bold rounded-full transition-all duration-300 ${
										ln.badge === '!'
											? 'bg-red-500 text-white animate-pulse'
											: ln.badge === 'NEW'
											? 'bg-gradient-to-r from-green-400 to-green-500 text-white'
											: 'bg-red-100 text-red-600'
									} ${hoveredItem === ln.to ? 'scale-110' : ''}`}
								>
									{ln.badge}
								</span>
							)}
						</NavLink>
					))}
				</div>
			</nav>
		</aside>
	);
};

/* Reviews Icon */
function ReviewIcon(props: React.SVGProps<SVGSVGElement>) {
	return (
		<svg viewBox='0 0 24 24' fill='none' {...props}>
			<path
				d='M8 12h8M8 16h6'
				stroke='currentColor'
				strokeWidth='1.5'
				strokeLinecap='round'
			/>
			<path
				d='M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12c0 1.5.33 2.91.91 4.18.16.35.19.75.09 1.12l-.65 2.9 2.9-.65c.37-.08.77-.07 1.12.09A9.96 9.96 0 0012 22z'
				stroke='currentColor'
				strokeWidth='1.5'
			/>
			<path
				d='M16 8l-2 2-2-2'
				stroke='currentColor'
				strokeWidth='1.5'
				strokeLinecap='round'
				strokeLinejoin='round'
			/>
		</svg>
	);
}

/* Dashboard Icon */
function DashboardIcon(props: React.SVGProps<SVGSVGElement>) {
	return (
		<svg viewBox='0 0 24 24' fill='none' {...props}>
			<rect
				x='3'
				y='3'
				width='8'
				height='8'
				rx='1.5'
				stroke='currentColor'
				strokeWidth='1.5'
			/>
			<rect
				x='13'
				y='3'
				width='8'
				height='5'
				rx='1.2'
				stroke='currentColor'
				strokeWidth='1.5'
			/>
			<rect
				x='13'
				y='10'
				width='8'
				height='11'
				rx='1.2'
				stroke='currentColor'
				strokeWidth='1.5'
			/>
			<rect
				x='3'
				y='13'
				width='8'
				height='8'
				rx='1.5'
				stroke='currentColor'
				strokeWidth='1.5'
			/>
		</svg>
	);
}

/* User Icon */
function UserIcon(props: React.SVGProps<SVGSVGElement>) {
	return (
		<svg viewBox='0 0 24 24' fill='none' {...props}>
			<circle cx='12' cy='8' r='4' stroke='currentColor' strokeWidth='1.5' />
			<path
				d='M4 20c0-4 4-6 8-6s8 2 8 6'
				stroke='currentColor'
				strokeWidth='1.5'
				strokeLinecap='round'
			/>
		</svg>
	);
}

/* Content Icon */
function ContentIcon(props: React.SVGProps<SVGSVGElement>) {
	return (
		<svg viewBox='0 0 24 24' fill='none' {...props}>
			<path
				d='M7 3h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z'
				stroke='currentColor'
				strokeWidth='1.5'
			/>
			<path
				d='M9 8h6M9 12h6M9 16h4'
				stroke='currentColor'
				strokeWidth='1.5'
				strokeLinecap='round'
				strokeLinejoin='round'
			/>
		</svg>
	);
}

/* Bell Icon */
function BellIcon(props: React.SVGProps<SVGSVGElement>) {
	return (
		<svg viewBox='0 0 24 24' fill='none' {...props}>
			<path
				d='M15 17H9a4 4 0 0 1-4-4V9a6 6 0 1 1 12 0v4a4 4 0 0 1-2 3z'
				stroke='currentColor'
				strokeWidth='1.5'
			/>
			<path
				d='M13.73 21a2 2 0 0 1-3.46 0'
				stroke='currentColor'
				strokeWidth='1.5'
			/>
		</svg>
	);
}

/* Logout Icon */
function LogoutIcon(props: React.SVGProps<SVGSVGElement>) {
	return (
		<svg viewBox='0 0 24 24' fill='none' {...props}>
			<path
				d='M16 17l5-5-5-5'
				stroke='currentColor'
				strokeWidth='1.5'
				strokeLinecap='round'
				strokeLinejoin='round'
			/>
			<path
				d='M21 12H9'
				stroke='currentColor'
				strokeWidth='1.5'
				strokeLinecap='round'
				strokeLinejoin='round'
			/>
			<path
				d='M9 19H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h3'
				stroke='currentColor'
				strokeWidth='1.5'
				strokeLinecap='round'
				strokeLinejoin='round'
			/>
		</svg>
	);
}

export default RnDSidebar;
