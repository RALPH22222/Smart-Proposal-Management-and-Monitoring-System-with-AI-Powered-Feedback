import React, { useState } from 'react';
import Swal from 'sweetalert2';

export default function Login() {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [loading, setLoading] = useState(false);
	const handleLogin = async (e?: React.FormEvent) => {
		e?.preventDefault();
		if (!email || !password)
			return Swal.fire({
				icon: 'warning',
				title: 'Missing fields',
				text: 'Please provide email and password.'
			});

		try {
			setLoading(true);
			const res = await fetch('/api/auth/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, password })
			});
			if (!res.ok) {
				const err = await res.json().catch(() => null);
				throw new Error(err?.message || 'Login failed');
			}
			const data = await res.json().catch(() => ({}));
			Swal.fire({
				icon: 'success',
				title: 'Logged in',
				text: data.message || 'Successfully signed in.'
			});
			setEmail('');
			setPassword('');
		} catch (err) {
			if (err instanceof Error) {
				Swal.fire({
					icon: 'error',
					title: 'Error',
					text: err.message! || 'Login failed'
				});
			} else {
				console.error(err);
			}
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className='min-h-screen flex flex-col md:flex-row'>
			<div className='w-full md:w-1/2 flex items-center justify-center bg-white p-8'>
				<form
					onSubmit={handleLogin}
					className='w-full max-w-md bg-white rounded-xl shadow-lg p-8 space-y-4'
				>
					<h2 className='text-2xl font-semibold text-gray-900'>Sign in</h2>
					<p className='text-sm text-gray-600'>
						Use your institutional account or continue with Google.
					</p>

					<label className='block'>
						<span className='text-sm font-medium text-gray-700'>Email</span>
						<input
							type='email'
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							placeholder='Email address'
							className='mt-1 block w-full rounded-lg border border-gray-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#C8102E]/30'
						/>
					</label>

					<label className='block'>
						<span className='text-sm font-medium text-gray-700'>Password</span>
						<input
							type='password'
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							placeholder='Password'
							className='mt-1 block w-full rounded-lg border border-gray-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#C8102E]/30'
						/>
					</label>

					<div className='flex gap-3'>
						<button
							type='submit'
							disabled={loading}
							className='flex-1 inline-flex items-center justify-center px-4 py-2 bg-[#C8102E] text-white rounded-lg font-semibold shadow-sm disabled:opacity-60'
						>
							{loading ? 'Signing in...' : 'Sign in'}
						</button>

						<button
							type='button'
							onClick={() => {
								setEmail('');
								setPassword('');
							}}
							className='inline-flex items-center justify-center px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg shadow-sm'
						>
							Reset
						</button>
					</div>

					<div className='text-sm text-center text-gray-600'>
						Don't have an account?{' '}
						<a
							href='/register'
							className='font-semibold'
							style={{ color: '#C8102E' }}
						>
							Create one
						</a>
					</div>
				</form>
			</div>
			<div className='w-full md:w-1/2 flex items-center justify-center bg-[#C8102E] text-white p-8'>
				<div className='max-w-md text-center space-y-6'>
					<img
						src='../src/assets/IMAGES/LOGO.png'
						alt='Logo'
						className='mx-auto w-40 h-40 object-contain rounded-lg shadow-lg bg-white/10 p-2'
					/>
					<h1 className='text-4xl font-extrabold'>Project Proposal</h1>
					<p className='text-sm opacity-90'>
						Create, submit and track project proposals — fast, simple, and
						secure.
					</p>
				</div>
			</div>
		</div>
	);
}
