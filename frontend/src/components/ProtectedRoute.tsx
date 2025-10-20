import React from 'react';
import { type User } from '../types/auth';

interface ProtectedRouteProps {
	children: React.ReactNode;
	user: User | null;
	isLoading: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
	children,
	user,
	isLoading
}) => {
	// Show loading spinner while checking authentication
	if (isLoading) {
		return (
			<div className='min-h-screen bg-gray-50 flex items-center justify-center'>
				<div className='text-center'>
					<div className='animate-spin rounded-full h-12 w-12 border-b-2 border-wmsu-red mx-auto'></div>
					<p className='mt-4 text-gray-600'>Checking authentication...</p>
				</div>
			</div>
		);
	}

	// If user is not authenticated, don't render children
	// The parent component (App) will handle showing the login page
	if (!user) {
		return null;
	}

	// User is authenticated, render the protected content
	return <>{children}</>;
};

export default ProtectedRoute;
