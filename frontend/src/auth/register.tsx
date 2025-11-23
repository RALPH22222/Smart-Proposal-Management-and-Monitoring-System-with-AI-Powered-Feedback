import { api } from '@utils/axios';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

type SignUpResponse = {
  message: string;
}

export default function Register() {
	const [email, setEmail] = useState('');
	const [name, setName] = useState('');
	const [password, setPassword] = useState('');
	const [loading, setLoading] = useState(false);
	const navigate = useNavigate();

	const handleRegister = async (e?: React.FormEvent) => {
		e?.preventDefault();

		if (!name || !password)
			return Swal.fire({
				icon: 'warning',
				title: 'Missing fields',
				text: 'Please provide name and password.'
			});

		try {
			setLoading(true);
			const res = await api.post<SignUpResponse>('/auth/sign-up',
			  { name, email, password, role: 'proponent' },
				{
          headers: {
            "Content-Type": "application/json",
          },
        },);

			Swal.fire({
				icon: 'success',
				title: 'Registered',
				text: res.data.message
			});
			setName('');
			setEmail('');
			setPassword('');
			navigate('/login');
		} catch (err) {
			if (err instanceof Error) {
				Swal.fire({
					icon: 'error',
					title: 'Error',
					text: err.message || 'Registration failed'
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
			<div
                       className="w-full md:w-1/2 flex items-center justify-center relative p-8 text-white"
                       style={{
                         backgroundImage: `url('https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Western_Mindanao_State_University_College_of_Teacher_Education_%28Normal_Road%2C_Baliwasan%2C_Zamboanga_City%3B_10-06-2023%29.jpg/2560px-Western_Mindanao_State_University_College_of_Teacher_Education_%28Normal_Road%2C_Baliwasan%2C_Zamboanga_City%3B_10-06-2023%29.jpg')`,
                         backgroundSize: "cover",
                         backgroundPosition: "center",
                       }}
                     >
                       {/* Red overlay */}
                       <div className="absolute inset-0 bg-[#C8102E]/85"></div>

                       {/* Content */}
                       <div className="relative max-w-md text-center space-y-6">
                         <img
                           src="../src/assets/IMAGES/LOGO.png"
                           alt="Logo"
                           className="mx-auto w-40 h-40 object-contain rounded-lg shadow-lg bg-white/10 p-2"
                         />
                         <h1 className="text-4xl font-extrabold">Project Proposal</h1>
                         <p className="text-sm opacity-90">
                           Create, submit and track project proposals — fast, simple, and secure.
                         </p>
                       </div>
                     </div>

			<div className='w-full md:w-1/2 flex items-center justify-center bg-white p-8'>
				<form
					onSubmit={handleRegister}
					className='w-full max-w-md bg-white rounded-xl shadow-lg p-8 space-y-4'
				>
					<h2 className='text-2xl font-semibold text-gray-900'>Sign up</h2>
					<p className='text-sm text-gray-600'>
						Input all the field to create an account and get started.
					</p>

					<label className='block'>
						<span className='text-sm font-medium text-gray-700'>name</span>
						<input
							type='text'
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder='Your username'
							className='mt-1 block w-full rounded-lg border border-gray-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#C8102E]/30'
						/>
					</label>

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
							className='flex-1 inline-flex items-center justify-center px-4 py-2 bg-[#C8102E] text-white rounded-lg font-semibold shadow-sm'
						>
							{loading ? 'Processing...' : 'Create Account'}
						</button>

						<button
							type='button'
							onClick={() => {
								setEmail('');
								setName('');
								setPassword('');
							}}
							className='inline-flex items-center justify-center px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg shadow-sm'
						>
							Reset
						</button>
					</div>

					<div className='text-sm text-center text-gray-600'>
						Already have an account?{' '}
						<a
							href='/login'
							className='font-semibold'
							style={{ color: '#C8102E' }}
						>
							Sign in
						</a>
					</div>
				</form>
			</div>
		</div>
	);
}
