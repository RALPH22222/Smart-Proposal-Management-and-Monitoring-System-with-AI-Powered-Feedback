import { api } from '@utils/axios';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

const BACKGROUND_IMAGE_URL = "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Western_Mindanao_State_University_College_of_Teacher_Education_%28Normal_Road%2C_Baliwasan%2C_Zamboanga_City%3B_10-06-2023%29.jpg/2560px-Western_Mindanao_State_University_College_of_Teacher_Education_%28Normal_Road%2C_Baliwasan%2C_Zamboanga_City%3B_10-06-2023%29.jpg";

type SignUpResponse = {
  message: string;
}

export default function Register() {
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [lastName, setLastName] = useState(''); 
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleRegister = async (e?: React.FormEvent) => {
        e?.preventDefault();

        // Validate fields
        if (!name || !lastName || !password) {
            return Swal.fire({
                icon: 'warning',
                title: 'Missing fields',
                text: 'Please provide name, last name, and password.'
            });
        }

        try {
            setLoading(true);
            
            // Sending data to backend
            await api.post<SignUpResponse>('/auth/sign-up',
              { name, lastName, email, password, role: 'proponent' },
                {
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );

            // Success Modal
            await Swal.fire({
                icon: 'success',
                title: 'Registration Successful!',
                text: 'Your account has been created. Please log in to complete your personal information setup.',
                confirmButtonText: 'Login to Complete Profile',
                confirmButtonColor: '#C8102E',
                allowOutsideClick: false
            });
            
            // Clear fields
            setName('');
            setLastName(''); 
            setEmail('');
            setPassword('');
            
            // Navigate
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
            {/* Image/Banner Section */}
            <div
                className="order-1 md:order-1 w-full md:w-1/2 flex items-center justify-center relative p-8 text-white min-h-[40vh] md:min-h-screen"
                style={{
                    backgroundImage: `url('${BACKGROUND_IMAGE_URL}')`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                }}
            >
                {/* Red Overlay */}
                <div className="absolute inset-0 bg-[#C8102E]/85"></div>
                
                {/* Content */}
                <div className="relative max-w-md text-center space-y-4 md:space-y-6">
                    <img
                        src="../src/assets/IMAGES/LOGO.png"
                        alt="Logo"
                        className="mx-auto w-24 h-24 md:w-40 md:h-40 object-contain rounded-lg shadow-lg bg-white/10 p-2 hover:scale-105 transition-transform duration-300 cursor-pointer"
                    />
                    <h1 className="text-2xl md:text-4xl font-extrabold hover:text-gray-200 transition-colors duration-300 cursor-pointer">Project Proposal</h1>
                    <p className="text-sm opacity-90 px-4 md:px-0 hover:opacity-100 transition-opacity duration-300">
                        Create, submit and track project proposals — fast, simple, and secure.
                    </p>
                </div>
            </div>

            {/* Form Section */}
            <div className='order-2 md:order-2 w-full md:w-1/2 flex items-center justify-center bg-white p-6 md:p-8'>
                <form
                    onSubmit={handleRegister}
                    className='w-full max-w-md bg-white rounded-xl shadow-lg p-6 md:p-8 space-y-4 md:space-y-6'
                >
                    <h2 className='text-xl md:text-2xl font-semibold text-gray-900 hover:text-[#C8102E] transition-colors duration-300 cursor-pointer text-center md:text-left'>Sign up</h2>
                    <p className='text-sm text-gray-600 text-center md:text-left'>
                        Input all the field to create an account and get started.
                    </p>

                    <label className='block'>
                        <span className='text-sm font-medium text-gray-700'>First Name</span>
                        <input
                            type='text'
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder='Enter your first name'
                            className='mt-1 block w-full rounded-lg border border-gray-200 px-4 py-3 md:py-2 focus:outline-none focus:ring-2 focus:ring-[#C8102E]/30 hover:border-gray-300 transition-colors duration-200'
                        />
                    </label>
                    <label className='block'>
                        <span className='text-sm font-medium text-gray-700'>Last Name</span>
                        <input
                            type='text'
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            placeholder='Enter your last name'
                            className='mt-1 block w-full rounded-lg border border-gray-200 px-4 py-3 md:py-2 focus:outline-none focus:ring-2 focus:ring-[#C8102E]/30 hover:border-gray-300 transition-colors duration-200'
                        />
                    </label>
                    <label className='block'>
                        <span className='text-sm font-medium text-gray-700'>Email</span>
                        <input
                            type='email'
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder='Email address'
                            className='mt-1 block w-full rounded-lg border border-gray-200 px-4 py-3 md:py-2 focus:outline-none focus:ring-2 focus:ring-[#C8102E]/30 hover:border-gray-300 transition-colors duration-200'
                        />
                    </label>

                    <label className='block'>
                        <span className='text-sm font-medium text-gray-700'>Password</span>
                        <input
                            type='password'
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder='Password'
                            className='mt-1 block w-full rounded-lg border border-gray-200 px-4 py-3 md:py-2 focus:outline-none focus:ring-2 focus:ring-[#C8102E]/30 hover:border-gray-300 transition-colors duration-200'
                        />
                    </label>

                    <div className='flex flex-col sm:flex-row gap-3'>
                        <button
                            type='submit'
                            disabled={loading}
                            className='flex-1 inline-flex items-center justify-center px-4 py-3 md:py-2 bg-[#C8102E] text-white rounded-lg font-semibold shadow-sm disabled:opacity-60 hover:bg-[#A50D26] transition-colors duration-300'
                        >
                            {loading ? 'Processing...' : 'Create Account'}
                        </button>

                        <button
                            type='button'
                            onClick={() => {
                                setName('');
                                setLastName('');
                                setEmail('');
                                setPassword('');
                            }}
                            className='inline-flex items-center justify-center px-4 py-3 md:py-2 bg-white border border-gray-200 text-gray-700 rounded-lg shadow-sm hover:bg-gray-50 hover:border-gray-300 hover:text-gray-900 transition-all duration-300'
                        >
                            Reset
                        </button>
                    </div>

                    <div className='text-sm text-center text-gray-600'>
                        Already have an account?{' '}
                        <a
                            href='/login'
                            className='font-semibold hover:text-[#A50D26] transition-colors duration-300'
                            style={{ color: '#C8102E' }}
                            onMouseOver={(e) => e.currentTarget.style.color = '#A50D26'}
                            onMouseOut={(e) => e.currentTarget.style.color = '#C8102E'}
                        >
                            Sign in
                        </a>
                    </div>
                </form>
            </div>
        </div>
    );
}