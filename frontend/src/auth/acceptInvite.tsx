import { useState, useEffect, type FormEvent } from 'react';
import { UserCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { supabase } from '../config/supabaseClient';
import { api } from '../utils/axios';
import RdecLogo from '../assets/IMAGES/RDEC-WMSU.png';

export default function AcceptInvite() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [middleIni, setMiddleIni] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const establishSession = async () => {
      // Supabase auto-detects hash fragment (#access_token=...&type=invite)
      const { data, error } = await supabase.auth.getSession();

      if (error || !data.session) {
        setErrorMessage('Invalid or expired invitation link. Please ask the admin to send a new invitation.');
        return;
      }

      setSessionReady(true);
    };

    establishSession();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!firstName || !lastName || !password || !confirmPassword) {
      return Swal.fire({
        icon: 'warning',
        title: 'Missing Fields',
        text: 'Please fill in all required fields.',
        confirmButtonColor: '#C8102E',
      });
    }

    if (password.length < 6) {
      return Swal.fire({
        icon: 'warning',
        title: 'Password Too Short',
        text: 'Password must be at least 6 characters.',
        confirmButtonColor: '#C8102E',
      });
    }

    if (password !== confirmPassword) {
      return Swal.fire({
        icon: 'error',
        title: 'Passwords Do Not Match',
        text: 'Please make sure both passwords match.',
        confirmButtonColor: '#C8102E',
      });
    }

    try {
      setLoading(true);

      // 1. Set password via Supabase Auth
      const { error: pwError } = await supabase.auth.updateUser({ password });
      if (pwError) throw new Error(pwError.message);

      // 2. Save name via backend API
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      await api.post(
        '/auth/complete-invite',
        { first_name: firstName, last_name: lastName, middle_ini: middleIni || undefined },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // 3. Sign out so user logs in fresh (cookie-based session)
      await supabase.auth.signOut();

      await Swal.fire({
        icon: 'success',
        title: 'Account Setup Complete',
        text: 'You can now log in with your email and password.',
        timer: 2500,
        showConfirmButton: false,
      });

      navigate('/login', { replace: true });
    } catch (error: any) {
      const msg = error.response?.data?.message || error.message || 'Failed to complete registration.';
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: msg,
        confirmButtonColor: '#C8102E',
      });
    } finally {
      setLoading(false);
    }
  };

  if (errorMessage) {
    return (
      <div className="min-h-screen relative flex items-center justify-center p-4">
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `url('https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Western_Mindanao_State_University_College_of_Teacher_Education_%28Normal_Road%2C_Baliwasan%2C_Zamboanga_City%3B_10-06-2023%29.jpg/2560px-Western_Mindanao_State_University_College_of_Teacher_Education_%28Normal_Road%2C_Baliwasan%2C_Zamboanga_City%3B_10-06-2023%29.jpg')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="absolute inset-0 bg-[#C8102E]/85"></div>
        </div>
        <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100 p-8 text-center">
          <img src={RdecLogo} alt="RDEC Logo" className="w-20 h-20 object-contain mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Invalid Invitation</h2>
          <p className="text-gray-600 text-sm mb-6">{errorMessage}</p>
          <button
            onClick={() => navigate('/login', { replace: true })}
            className="px-6 py-2 bg-[#C8102E] text-white rounded-xl font-medium text-sm hover:bg-[#A50D26] transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (!sessionReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500 text-sm">Verifying invitation...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4">
      {/* Background */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url('https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Western_Mindanao_State_University_College_of_Teacher_Education_%28Normal_Road%2C_Baliwasan%2C_Zamboanga_City%3B_10-06-2023%29.jpg/2560px-Western_Mindanao_State_University_College_of_Teacher_Education_%28Normal_Road%2C_Baliwasan%2C_Zamboanga_City%3B_10-06-2023%29.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-[#C8102E]/85"></div>
      </div>

      {/* Card */}
      <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
        {/* Header */}
        <div className="px-8 pt-8 pb-4 text-center">
          <img src={RdecLogo} alt="RDEC Logo" className="w-20 h-20 object-contain mx-auto mb-3" />
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="p-3 rounded-full bg-red-50 text-[#C8102E]">
              <UserCheck size={24} />
            </div>
            <div className="text-left">
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Complete Registration</h2>
              <p className="text-gray-500 text-sm mt-0.5">Set up your name and password.</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-8 pb-4 pt-2 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First name"
                required
                className="block w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20 focus:border-[#C8102E] hover:border-gray-300 transition-all duration-200 bg-white text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last name"
                required
                className="block w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20 focus:border-[#C8102E] hover:border-gray-300 transition-all duration-200 bg-white text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Middle Initial</label>
            <input
              type="text"
              value={middleIni}
              onChange={(e) => setMiddleIni(e.target.value)}
              placeholder="Optional"
              className="block w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20 focus:border-[#C8102E] hover:border-gray-300 transition-all duration-200 bg-white text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 6 characters"
                required
                className="block w-full rounded-xl border border-gray-200 px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20 focus:border-[#C8102E] hover:border-gray-300 transition-all duration-200 bg-white text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password *</label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm password"
              required
              className="block w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20 focus:border-[#C8102E] hover:border-gray-300 transition-all duration-200 bg-white text-sm"
            />
          </div>

          {password && (
            <div className="text-xs text-gray-500 space-y-1">
              <p className={password.length >= 6 ? 'text-green-600' : 'text-red-500'}>
                {password.length >= 6 ? '\u2713' : '\u2717'} At least 6 characters
              </p>
              <p className={password === confirmPassword && confirmPassword ? 'text-green-600' : 'text-red-500'}>
                {password === confirmPassword && confirmPassword ? '\u2713' : '\u2717'} Passwords match
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#C8102E] text-white rounded-xl font-bold text-sm shadow-md hover:bg-[#A50D26] hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-60 disabled:hover:translate-y-0"
          >
            {loading ? 'Setting up account...' : 'Complete Registration'}
          </button>
        </form>

        {/* Footer */}
        <div className="bg-gray-50 px-8 py-4 border-t border-gray-100">
          <p className="text-xs text-gray-400 text-center">
            After completing registration, you'll be redirected to the login page.
          </p>
        </div>
      </div>
    </div>
  );
}
