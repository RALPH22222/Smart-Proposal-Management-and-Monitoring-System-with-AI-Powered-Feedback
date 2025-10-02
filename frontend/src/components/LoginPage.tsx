import React, { useState } from 'react';
import { Eye, EyeOff, LogIn, User, Lock, AlertCircle } from 'lucide-react';
import { type LoginCredentials } from '../types/auth';

interface LoginPageProps {
	onLogin: (credentials: LoginCredentials) => Promise<void>;
	isLoading: boolean;
	error: string | null;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, isLoading, error }) => {
	const [credentials, setCredentials] = useState<LoginCredentials>({
		email: '',
		password: ''
	});
	const [showPassword, setShowPassword] = useState(false);
	const [validationErrors, setValidationErrors] = useState<{
		email?: string;
		password?: string;
	}>({});

	const validateForm = (): boolean => {
		const errors: { email?: string; password?: string } = {};

		// Email validation
		if (!credentials.email) {
			errors.email = 'Email is required';
		} else if (!credentials.email.includes('@wmsu.edu.ph')) {
			errors.email = 'Please use your WMSU email address';
		}

		// Password validation
		if (!credentials.password) {
			errors.password = 'Password is required';
		} else if (credentials.password.length < 6) {
			errors.password = 'Password must be at least 6 characters';
		}

		setValidationErrors(errors);
		return Object.keys(errors).length === 0;
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!validateForm()) {
			return;
		}

		try {
			await onLogin(credentials);
		} catch (error) {
			// Error is handled by parent component
			console.error('Login failed:', error);
		}
	};

	const handleInputChange = (field: keyof LoginCredentials, value: string) => {
		setCredentials((prev) => ({ ...prev, [field]: value }));

		// Clear validation error when user starts typing
		if (validationErrors[field]) {
			setValidationErrors((prev) => ({ ...prev, [field]: undefined }));
		}
	};

	return (
		<div className='min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4'>
			<div className='bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden'>
				{/* Header */}
				<div className='bg-gradient-to-r from-[#C10003] to-[#A00002] px-8 py-6 text-center'>
					<div className='w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg'>
						<User className='w-8 h-8 text-[#C10003]' />
					</div>
					<h1 className='text-2xl font-bold text-white mb-2'>
						WMSU Proposal Management
					</h1>
					<p className='text-red-100 text-sm'>R&D Staff Portal</p>
				</div>

				{/* Login Form */}
				<div className='p-8'>
					<div className='mb-6 text-center'>
						<h2 className='text-xl font-semibold text-gray-800 mb-2'>
							Welcome Back
						</h2>
						<p className='text-gray-600 text-sm'>
							Sign in to access the proposal management system
						</p>
					</div>

					{/* Demo Credentials Info */}
					<div className='mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg'>
						<h3 className='text-sm font-medium text-gray-700 mb-2'>
							Demo Credentials:
						</h3>
						<div className='text-xs text-gray-600 space-y-1'>
							<p>
								<strong>Email:</strong> j.smith@wmsu.edu.ph
							</p>
							<p>
								<strong>Password:</strong> password123
							</p>
						</div>
					</div>

					{/* Error Message */}
					{error && (
						<div className='mb-4 p-3 bg-red-50 border border-red-300 rounded-lg flex items-center'>
							<AlertCircle className='w-4 h-4 text-red-500 mr-2 flex-shrink-0' />
							<span className='text-sm text-red-700'>{error}</span>
						</div>
					)}

					<form onSubmit={handleSubmit} className='space-y-4'>
						{/* Email Field */}
						<div>
							<label
								htmlFor='email'
								className='block text-sm font-medium text-gray-700 mb-1'
							>
								Email Address
							</label>
							<div className='relative'>
								<div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
									<User className='w-4 h-4 text-gray-400' />
								</div>
								<input
									id='email'
									type='email'
									value={credentials.email}
									onChange={(e) => handleInputChange('email', e.target.value)}
									className={`block w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
										validationErrors.email
											? 'border-red-300 focus:ring-red-500 focus:border-red-500'
											: 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
									}`}
									placeholder='your.email@wmsu.edu.ph'
									disabled={isLoading}
								/>
							</div>
							{validationErrors.email && (
								<p className='mt-1 text-xs text-red-600'>
									{validationErrors.email}
								</p>
							)}
						</div>

						{/* Password Field */}
						<div>
							<label
								htmlFor='password'
								className='block text-sm font-medium text-gray-700 mb-1'
							>
								Password
							</label>
							<div className='relative'>
								<div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
									<Lock className='w-4 h-4 text-gray-400' />
								</div>
								<input
									id='password'
									type={showPassword ? 'text' : 'password'}
									value={credentials.password}
									onChange={(e) =>
										handleInputChange('password', e.target.value)
									}
									className={`block w-full pl-10 pr-10 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
										validationErrors.password
											? 'border-red-300 focus:ring-red-500 focus:border-red-500'
											: 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
									}`}
									placeholder='Enter your password'
									disabled={isLoading}
								/>
								<button
									type='button'
									onClick={() => setShowPassword(!showPassword)}
									className='absolute inset-y-0 right-0 pr-3 flex items-center'
									disabled={isLoading}
								>
									{showPassword ? (
										<EyeOff className='w-4 h-4 text-gray-400 hover:text-gray-600' />
									) : (
										<Eye className='w-4 h-4 text-gray-400 hover:text-gray-600' />
									)}
								</button>
							</div>
							{validationErrors.password && (
								<p className='mt-1 text-xs text-red-600'>
									{validationErrors.password}
								</p>
							)}
						</div>

						{/* Submit Button */}
						<button
							type='submit'
							disabled={isLoading}
							className='w-full flex items-center justify-center px-4 py-2 bg-gradient-to-r from-[#C10003] to-[#A00002] text-white font-medium rounded-lg hover:from-[#A00002] hover:to-[#C10003] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl'
						>
							{isLoading ? (
								<>
									<div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2'></div>
									Signing In...
								</>
							) : (
								<>
									<LogIn className='w-4 h-4 mr-2' />
									Sign In
								</>
							)}
						</button>
					</form>

					{/* Footer */}
					<div className='mt-6 text-center'>
						<p className='text-xs text-gray-400'>
							© 2025 Western Mindanao State University
						</p>
						<p className='text-xs text-gray-400 mt-1'>
							Research & Development Office
						</p>
					</div>
				</div>
			</div>
		</div>
	);
};

export default LoginPage;
