import React, { useEffect, useState } from 'react';
import { Camera, LayoutDashboard, Shuffle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import {
  changeMyPassword,
  getMyProfile,
  updateMyAvatar,
  updateMyName, 
  type UserProfile
} from '../../../services/user/userService';

// --- Constants from Profile Setup ---
const DEPARTMENTS = [
  "College of Computing Studies",
  "College of Engineering",
  "College of Architecture",
  "College of Arts and Sciences",
  "College of Business",
  "College of Education",
  "College of Nursing"
];

const ROLES = ["Lead Proponent", "Co-Lead Proponent"];

// --- Extended Interface ---
interface ExtendedUserProfile extends UserProfile {
  firstName?: string;
  middleInitial?: string;
  lastName?: string;
  birthdate?: string;
  sex?: 'Male' | 'Female' | 'Prefer not to say' | '';
  role?: 'Lead Proponent' | 'Co-Lead Proponent' | '';
  department?: string;
}

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ExtendedUserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // --- Profile Data State ---
  const [formData, setFormData] = useState({
    firstName: '',
    middleInitial: '',
    lastName: '',
    birthdate: '',
    sex: '',
    role: '',
    department: '',
  });

  // --- Password State ---
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const me = await getMyProfile() as ExtendedUserProfile;
        setProfile(me);
        
        setFormData({
            firstName: me.firstName || '',
            middleInitial: me.middleInitial || '',
            lastName: me.lastName || '',
            birthdate: me.birthdate || '',
            sex: me.sex || '',
            role: me.role || '',
            department: me.department || '',
        });

      } catch (e) {
        if (e instanceof Error) {
          setError(e?.message || 'Failed to load profile');
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const withFeedback = async (fn: () => Promise<any>, successMsg: string) => {
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const res = await fn();
      setSuccess(successMsg);
      return res;
    } catch (e) {
      if (e instanceof Error) {
        setError(e?.message || 'Something went wrong');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const onSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setError('First and Last Name are required');
      return;
    }

    const fullName = `${formData.firstName} ${formData.lastName}`;
    const updated = await withFeedback(
        () => updateMyName(fullName),
        'Profile updated'
    );

    if (updated) setProfile({ ...profile, ...formData, name: fullName });
  };

  const onChangeAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await withFeedback(async () => {
      const res = await updateMyAvatar(file);
      setProfile((prev) =>
        prev ? { ...prev, avatarUrl: res.avatarUrl } : prev
      );
      return res;
    }, 'Profile picture updated');
    e.currentTarget.value = '';
  };

  const onChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      setError('Please fill out current and new password');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New password and confirm password do not match');
      return;
    }
    await withFeedback(
      () => changeMyPassword(currentPassword, newPassword),
      'Password changed successfully'
    );
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  // --- ROLE SWITCH HANDLER ---
  const handleSwitchRole = (targetRole: 'proponent' | 'evaluator' | 'rnd') => {
    Swal.fire({
      title: 'Switch Workspace?',
      text: `You are about to switch to the ${targetRole.toUpperCase()} view.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#C8102E',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Yes, switch',
    }).then((result) => {
      if (result.isConfirmed) {
        let path = '';
        switch (targetRole) {
          case 'evaluator':
            path = '/users/evaluator/evaluatorMainLayout';
            break;
          case 'rnd':
            path = '/users/rnd/rndMainLayout';
            break;
          case 'proponent':
          default:
            path = '/users/proponent/proponentMainLayout';
            break;
        }
        navigate(path);
      }
    });
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <header className='mb-6'>
        <h1 className='text-2xl font-bold text-gray-800'>Account Settings</h1>
        <p className='text-sm text-gray-500'>
          Manage your personal information, academic details, and workspace roles.
        </p>
      </header>

      {(error || success) && (
        <div className='mb-4'>
          {error && (
            <div className='rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700'>
              {error}
            </div>
          )}
          {success && (
            <div className='rounded-md border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-700'>
              {success}
            </div>
          )}
        </div>
      )}

      {/* --- Profile Photo Section --- */}
      <section className='bg-white rounded-lg shadow-sm border border-gray-100 p-6 mb-6'>
         <div className="flex flex-col items-center sm:flex-row sm:items-start gap-6">
            <div className="relative group">
                <div className="h-24 w-24 rounded-full overflow-hidden border-4 border-gray-100 shadow-sm">
                    <img
                        src={profile?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.firstName || 'User')}&background=E5E7EB&color=111827`}
                        alt='Avatar'
                        className='h-full w-full object-cover'
                    />
                </div>
                <label className="absolute bottom-0 right-0 bg-[#C8102E] hover:bg-[#A50D26] text-white p-2 rounded-full cursor-pointer shadow-md transition-transform transform hover:scale-105">
                    <Camera size={16} />
                    <input
                        type='file'
                        accept='image/*'
                        className='hidden'
                        onChange={onChangeAvatar}
                    />
                </label>
            </div>
            <div>
                <h2 className='text-lg font-medium text-gray-900'>Profile Photo</h2>
                <p className='text-sm text-gray-500'>
                    Update your profile picture. Accepted formats: JPG, PNG.
                </p>
            </div>
         </div>
      </section>

      {/* --- Main Profile Form --- */}
      <form onSubmit={onSaveProfile}>
        
        {/* Personal Info */}
        <section className='bg-white rounded-lg shadow-sm border border-gray-100 p-6 mb-6'>
            <h2 className='text-lg font-medium text-gray-800 mb-4 border-b pb-2'>Personal Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-4">
                <div className="md:col-span-5">
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                    <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E]/30"
                    />
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">M.I.</label>
                    <input
                        type="text"
                        name="middleInitial"
                        maxLength={2}
                        value={formData.middleInitial}
                        onChange={handleInputChange}
                        className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E]/30"
                    />
                </div>
                <div className="md:col-span-5">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                    <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E]/30"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Birthdate</label>
                    <input
                        type="date"
                        name="birthdate"
                        value={formData.birthdate}
                        onChange={handleInputChange}
                        className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E]/30"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sex</label>
                    <select
                        name="sex"
                        value={formData.sex}
                        onChange={handleInputChange}
                        className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E]/30"
                    >
                        <option value="" disabled>Select Sex</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Prefer not to say">Prefer not to say</option>
                    </select>
                </div>
            </div>
        </section>

        {/* Academic Info */}
        <section className='bg-white rounded-lg shadow-sm border border-gray-100 p-6 mb-6'>
            <h2 className='text-lg font-medium text-gray-800 mb-4 border-b pb-2'>Academic Information</h2>
            
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Department / College</label>
                <select
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E]/30"
                >
                    <option value="" disabled>Select Department</option>
                    {DEPARTMENTS.map((dept) => (
                        <option key={dept} value={dept}>{dept}</option>
                    ))}
                </select>
            </div>

            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Role in Project</label>
                <div className="flex gap-4">
                    {ROLES.map((role) => (
                        <label key={role} className="flex items-center space-x-2 cursor-pointer">
                            <input
                                type="radio"
                                name="role"
                                value={role}
                                checked={formData.role === role}
                                onChange={handleInputChange}
                                className="text-[#C8102E] focus:ring-[#C8102E]"
                            />
                            <span className="text-sm text-gray-700">{role}</span>
                        </label>
                    ))}
                </div>
            </div>

            <div className="flex justify-end">
                <button
                    type='submit'
                    disabled={loading}
                    className='px-6 py-2 rounded-md bg-[#C8102E] text-white font-medium hover:bg-[#A50D26] transition-colors shadow-sm disabled:opacity-50'
                >
                    {loading ? 'Saving...' : 'Save Profile Changes'}
                </button>
            </div>
        </section>

      </form>

      {/* --- Switch Role Section --- */}
      <section className='bg-white rounded-lg shadow-sm border border-gray-100 p-6 mb-6'>
        <div className="flex items-center gap-3 mb-4 border-b pb-2">
            <Shuffle className="text-gray-800" size={20} />
            <h2 className='text-lg font-medium text-gray-800'>Switch Workspace</h2>
        </div>
        
        <p className="text-sm text-gray-600 mb-4">
            Access different dashboards based on your assigned roles.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Proponent Button */}
            <button
                type="button"
                onClick={() => handleSwitchRole('proponent')}
                className="flex items-center justify-center gap-2 p-4 border rounded-lg hover:border-[#C8102E] hover:bg-red-50 hover:text-[#C8102E] transition-all group bg-white"
            >
                <LayoutDashboard size={20} className="text-gray-400 group-hover:text-[#C8102E]" />
                <span className="font-medium text-gray-700 group-hover:text-[#C8102E]">Proponent</span>
            </button>

            {/* Evaluator Button */}
            <button
                type="button"
                onClick={() => handleSwitchRole('evaluator')}
                className="flex items-center justify-center gap-2 p-4 border rounded-lg hover:border-[#C8102E] hover:bg-red-50 hover:text-[#C8102E] transition-all group bg-white"
            >
                <LayoutDashboard size={20} className="text-gray-400 group-hover:text-[#C8102E]" />
                <span className="font-medium text-gray-700 group-hover:text-[#C8102E]">Evaluator</span>
            </button>

            {/* RND Button */}
            <button
                type="button"
                onClick={() => handleSwitchRole('rnd')}
                className="flex items-center justify-center gap-2 p-4 border rounded-lg hover:border-[#C8102E] hover:bg-red-50 hover:text-[#C8102E] transition-all group bg-white"
            >
                <LayoutDashboard size={20} className="text-gray-400 group-hover:text-[#C8102E]" />
                <span className="font-medium text-gray-700 group-hover:text-[#C8102E]">RND</span>
            </button>
        </div>
      </section>

      {/* --- Security Section --- */}
      <section className='bg-white rounded-lg shadow-sm border border-gray-100 p-6'>
        <h2 className='text-lg font-medium text-gray-800 mb-4 border-b pb-2'>Security</h2>
        <form
          onSubmit={onChangePassword}
          className='grid grid-cols-1 sm:grid-cols-2 gap-4'
        >
          <div className="sm:col-span-2">
            <p className='text-sm text-gray-500 mb-2'>
              Ensure your account is using a long, random password to stay secure.
            </p>
          </div>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Current password
            </label>
            <input
              type='password'
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className='w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E]/30'
            />
          </div>
          <div></div> 
          
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              New password
            </label>
            <input
              type='password'
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className='w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E]/30'
            />
          </div>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Confirm new password
            </label>
            <input
              type='password'
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className='w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E]/30'
            />
          </div>
          <div className='sm:col-span-2 flex justify-end mt-2'>
            <button
              type='submit'
              disabled={loading}
              className='px-4 py-2 text-sm rounded-md border border-gray-300 bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50'
            >
              Update Password
            </button>
          </div>
        </form>
      </section>

    </div>
  );
};

export default Settings;