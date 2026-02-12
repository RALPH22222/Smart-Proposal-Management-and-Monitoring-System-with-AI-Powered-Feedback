import { useState, type FormEvent, useEffect } from 'react';
import { Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { api } from '../utils/axios';

export default function ChangePassword() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // On mount, check if password change is actually required
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const { data } = await api.get<{ isCompleted: boolean; passwordChangeRequired: boolean }>('/auth/profile-status');
        if (!data.passwordChangeRequired) {
          // No password change needed — redirect to profile setup or dashboard
          if (!data.isCompleted) {
            navigate('/profile-setup', { replace: true });
          } else {
            // Read roles from localStorage to determine dashboard
            const stored = localStorage.getItem('user');
            if (stored) {
              const user = JSON.parse(stored);
              const role = user.roles?.[0]?.toLowerCase();
              navigateToDashboard(role);
            } else {
              navigate('/login', { replace: true });
            }
          }
        }
      } catch {
        // If check fails, let them stay on the page
      }
    };
    checkStatus();
  }, [navigate]);

  const navigateToDashboard = (role?: string) => {
    switch (role) {
      case 'proponent':
        navigate('/users/proponent/proponentMainLayout', { replace: true });
        break;
      case 'rnd':
        navigate('/users/rnd/rndMainLayout', { replace: true });
        break;
      case 'admin':
        navigate('/users/admin/adminMainLayout', { replace: true });
        break;
      case 'evaluator':
        navigate('/users/evaluator/evaluatorMainLayout', { replace: true });
        break;
      default:
        navigate('/login', { replace: true });
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!newPassword || !confirmPassword) {
      return Swal.fire({
        icon: 'warning',
        title: 'Missing Fields',
        text: 'Please fill in both password fields.',
        confirmButtonColor: '#C8102E',
      });
    }

    if (newPassword.length < 6) {
      return Swal.fire({
        icon: 'warning',
        title: 'Password Too Short',
        text: 'Password must be at least 6 characters.',
        confirmButtonColor: '#C8102E',
      });
    }

    if (newPassword !== confirmPassword) {
      return Swal.fire({
        icon: 'error',
        title: 'Passwords Do Not Match',
        text: 'Please make sure both passwords match.',
        confirmButtonColor: '#C8102E',
      });
    }

    try {
      setLoading(true);
      await api.post('/auth/change-password', { new_password: newPassword });

      await Swal.fire({
        icon: 'success',
        title: 'Password Changed',
        text: 'Your password has been updated successfully.',
        timer: 2000,
        showConfirmButton: false,
      });

      // Check if profile is complete to decide where to go next
      try {
        const { data } = await api.get<{ isCompleted: boolean; passwordChangeRequired: boolean }>('/auth/profile-status');
        if (!data.isCompleted) {
          navigate('/profile-setup', { replace: true });
        } else {
          const stored = localStorage.getItem('user');
          if (stored) {
            const user = JSON.parse(stored);
            const role = user.roles?.[0]?.toLowerCase();
            navigateToDashboard(role);
          } else {
            navigate('/login', { replace: true });
          }
        }
      } catch {
        navigate('/profile-setup', { replace: true });
      }
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Failed to change password. Please try again.';
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

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4">
      {/* Background Image Layer */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url('https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Western_Mindanao_State_University_College_of_Teacher_Education_%28Normal_Road%2C_Baliwasan%2C_Zamboanga_City%3B_10-06-2023%29.jpg/2560px-Western_Mindanao_State_University_College_of_Teacher_Education_%28Normal_Road%2C_Baliwasan%2C_Zamboanga_City%3B_10-06-2023%29.jpg')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-[#C8102E]/85"></div>
      </div>

      {/* Card */}
      <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
        {/* Header */}
        <div className="px-8 pt-8 pb-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-full bg-red-50 text-[#C8102E]">
              <Lock size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Change Password</h2>
              <p className="text-gray-500 text-sm mt-0.5">Set a new password for your account.</p>
            </div>
          </div>

          <div className="mt-4 bg-amber-50 text-amber-800 px-4 py-3 rounded-lg text-sm border border-amber-100">
            Your account was created by an administrator. Please set a personal password to continue.
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-8 pb-4 pt-2 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="block w-full rounded-xl border border-gray-200 px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20 focus:border-[#C8102E] hover:border-gray-300 transition-all duration-200 bg-white"
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              className="block w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20 focus:border-[#C8102E] hover:border-gray-300 transition-all duration-200 bg-white"
            />
          </div>

          {newPassword && (
            <div className="text-xs text-gray-500 space-y-1">
              <p className={newPassword.length >= 6 ? 'text-green-600' : 'text-red-500'}>
                {newPassword.length >= 6 ? '\u2713' : '\u2717'} At least 6 characters
              </p>
              <p className={newPassword === confirmPassword && confirmPassword ? 'text-green-600' : 'text-red-500'}>
                {newPassword === confirmPassword && confirmPassword ? '\u2713' : '\u2717'} Passwords match
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#C8102E] text-white rounded-xl font-bold text-sm shadow-md hover:bg-[#A50D26] hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-60 disabled:hover:translate-y-0"
          >
            {loading ? 'Changing Password...' : 'Set New Password'}
          </button>
        </form>

        {/* Footer */}
        <div className="bg-gray-50 px-8 py-4 border-t border-gray-100">
          <p className="text-xs text-gray-400 text-center">
            You'll be redirected to complete your profile after changing your password.
          </p>
        </div>
      </div>
    </div>
  );
}
