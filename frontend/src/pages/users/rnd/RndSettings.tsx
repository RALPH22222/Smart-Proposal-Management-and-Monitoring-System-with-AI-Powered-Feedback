import React, { useEffect, useState, useRef } from 'react';
import {
  Camera, User, Lock,
  Eye, EyeOff, CheckCircle, Mail,
  Calendar, Shield,
} from 'lucide-react';
import {
  changeMyPassword,
  getMyProfile,
  updateMyAvatar,
  updateMyProfile,
  updateMyEmail,
} from '../../../services/user/userService';
import { fetchDepartments, type LookupItem } from '../../../services/proposal.api';
import SecureImage from '../../../components/shared/SecureImage';
import PageLoader from '../../../components/shared/PageLoader';

// ── Types ──────────────────────────────────────────────────────────────────────
interface ExtendedUserProfile {
  id?: string;
  email?: string;
  name?: string;
  firstName?: string;
  middleInitial?: string;
  lastName?: string;
  birthdate?: string;
  sex?: 'Male' | 'Female' | 'Prefer not to say' | '';
  department?: string;
  department_id?: string;
  avatarUrl?: string | null;
}

// ── Helpers ────────────────────────────────────────────────────────────────────
const getPasswordStrength = (password: string): { label: string; color: string; width: string } => {
  if (!password) return { label: '', color: '', width: '0%' };
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (score <= 1) return { label: 'Weak', color: 'bg-red-500', width: '25%' };
  if (score <= 2) return { label: 'Fair', color: 'bg-orange-400', width: '50%' };
  if (score <= 3) return { label: 'Good', color: 'bg-yellow-400', width: '75%' };
  return { label: 'Strong', color: 'bg-green-500', width: '100%' };
};

// ── Shared UI Components ───────────────────────────────────────────────────────
const SectionHeader: React.FC<{ icon: React.ReactNode; title: string; description: string }> = ({ icon, title, description }) => (
  <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
    <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center text-[#C8102E] flex-shrink-0">
      {icon}
    </div>
    <div>
      <h2 className="text-base font-semibold text-gray-900">{title}</h2>
      <p className="text-xs text-gray-500 mt-0.5">{description}</p>
    </div>
  </div>
);

const FormInput: React.FC<{
  label: string;
  type?: string;
  name?: string;
  value: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  readOnly?: boolean;
  disabled?: boolean;
  required?: boolean;
  maxLength?: number;
  suffix?: React.ReactNode;
}> = ({ label, type = 'text', name, value, onChange, placeholder, readOnly, disabled, required, maxLength, suffix }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1.5">
      {label}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    <div className="relative">
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        readOnly={readOnly}
        disabled={disabled || readOnly}
        maxLength={maxLength}
        className={`block w-full rounded-lg border px-3.5 py-2.5 text-sm transition-all duration-200 outline-none
          ${readOnly
            ? 'bg-gray-50 border-gray-200 text-gray-500 cursor-not-allowed'
            : 'bg-white border-gray-300 text-gray-900 focus:border-[#C8102E] focus:ring-2 focus:ring-[#C8102E]/15 hover:border-gray-400'
          }
          ${suffix ? 'pr-10' : ''}
        `}
      />
      {suffix && (
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          {suffix}
        </div>
      )}
    </div>
  </div>
);

const SpinnerIcon = () => (
  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
  </svg>
);

// ── Main Component ─────────────────────────────────────────────────────────────
type TabId = 'profile' | 'email' | 'security';

const TABS: { id: TabId; label: string }[] = [
  { id: 'profile', label: 'Profile' },
  { id: 'email', label: 'Email' },
  { id: 'security', label: 'Security' },
];

const RndSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('profile');
  const [profile, setProfile] = useState<ExtendedUserProfile | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [departments, setDepartments] = useState<LookupItem[]>([]);
  const [isDeptOpen, setIsDeptOpen] = useState(false);
  const deptDropdownRef = useRef<HTMLDivElement>(null);

  // Close dept dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (deptDropdownRef.current && !deptDropdownRef.current.contains(e.target as Node)) {
        setIsDeptOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Profile form
  const [formData, setFormData] = useState({ firstName: '', middleInitial: '', lastName: '', birthdate: '', sex: '', department_id: '' });
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Email
  const [emailValue, setEmailValue] = useState('');
  const [isSavingEmail, setIsSavingEmail] = useState(false);
  const [emailMsg, setEmailMsg] = useState<{ type: 'success' | 'error'; info: boolean; text: string } | null>(null);

  // Password
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const passwordStrength = getPasswordStrength(passwords.new);

  useEffect(() => {
    const load = async () => {
      try {
        const [me, depts] = await Promise.all([
          getMyProfile() as Promise<ExtendedUserProfile>,
          fetchDepartments(),
        ]);
        setProfile(me);
        setDepartments(depts);
        setEmailValue(me.email || '');
        setFormData({
          firstName: me.firstName || '',
          middleInitial: me.middleInitial || '',
          lastName: me.lastName || '',
          birthdate: me.birthdate || '',
          sex: me.sex || '',
          department_id: (me as any).department_id ? String((me as any).department_id) : '',
        });
      } catch {
        setProfileMsg({ type: 'error', text: 'Failed to load profile data. Please refresh the page.' });
      } finally {
        setPageLoading(false);
      }
    };
    load();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const onSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setProfileMsg({ type: 'error', text: 'First and Last Name are required.' }); return;
    }
    setIsSavingProfile(true);
    try {
      await updateMyProfile(formData as any);
      setProfile(prev => prev ? { ...prev, ...formData, sex: formData.sex as ExtendedUserProfile['sex'], name: [formData.firstName, formData.middleInitial, formData.lastName].filter(Boolean).join(' ') } : null);
      setProfileMsg({ type: 'success', text: 'Profile updated successfully!' });
    } catch {
      setProfileMsg({ type: 'error', text: 'Failed to save profile changes. Please try again.' });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const onSaveEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailMsg(null);
    if (!emailValue.trim() || !emailValue.includes('@')) {
      setEmailMsg({ type: 'error', info: false, text: 'Please enter a valid email address.' }); return;
    }
    setIsSavingEmail(true);
    try {
      await updateMyEmail(emailValue);
      setEmailMsg({ type: 'success', info: true, text: 'Verification emails sent! Check your old and new inbox to confirm the change.' });
    } catch {
      setEmailMsg({ type: 'error', info: false, text: 'Failed to update email. Please try again later.' });
    } finally {
      setIsSavingEmail(false);
    }
  };

  const onChangeAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await updateMyAvatar(file);
      setProfile(prev => prev ? { ...prev, avatarUrl: res.avatarUrl } : prev);
    } catch {
      setProfileMsg({ type: 'error', text: 'Failed to update profile picture.' });
    }
    e.currentTarget.value = '';
  };

  const onChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);
    if (!passwords.current || !passwords.new) { setPasswordMsg({ type: 'error', text: 'Please fill in all password fields.' }); return; }
    if (passwords.new !== passwords.confirm) { setPasswordMsg({ type: 'error', text: 'New password and confirmation do not match.' }); return; }
    if (passwords.new.length < 8) { setPasswordMsg({ type: 'error', text: 'New password must be at least 8 characters.' }); return; }
    setIsSavingPassword(true);
    try {
      await changeMyPassword(passwords.current, passwords.new);
      setPasswordMsg({ type: 'success', text: 'Password changed successfully!' });
      setPasswords({ current: '', new: '', confirm: '' });
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to change password. Please check your current password.';
      setPasswordMsg({ type: 'error', text: msg });
    } finally {
      setIsSavingPassword(false);
    }
  };

  if (pageLoading) return <PageLoader mode="account-settings-tabs" />;

  const displayName = profile?.name || `${formData.firstName} ${formData.lastName}`.trim() || 'R&D Staff';
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="bg-gradient-to-br p-6 from-slate-50 to-slate-100 min-h-screen animate-fade-in">
      <div className="flex flex-col min-w-0">

      {/* ── Page Header ── */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your personal information, system policies, and security.</p>
      </div>

      {/* ── Profile Header Card ── */}
      <div className="bg-gradient-to-br from-[#C8102E] to-[#8B0C20] rounded-2xl p-6 mb-6 text-white shadow-lg">
        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="h-24 w-24 rounded-2xl overflow-hidden border-4 border-white/30 shadow-xl">
              <SecureImage
                src={profile?.avatarUrl ?? undefined}
                fallbackSrc={`https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=C8102E&color=fff&bold=true`}
                alt="Avatar"
                className="h-full w-full object-cover"
              />
            </div>
            <label className="absolute -bottom-2 -right-2 bg-white text-[#C8102E] hover:bg-gray-50 p-2 rounded-xl cursor-pointer shadow-lg transition-all duration-200 hover:scale-110">
              <Camera size={16} />
              <input type="file" accept="image/*" className="hidden" onChange={onChangeAvatar} />
            </label>
          </div>

          {/* Info */}
          <div className="text-center sm:text-left flex-1">
            <h2 className="text-xl font-bold">{displayName}</h2>
            <p className="text-red-200 text-sm mt-0.5">{profile?.email || '—'}</p>
            <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-3">
              {departments.find(d => String(d.id) === formData.department_id) && (
                <span className="bg-white/10 backdrop-blur-sm text-white text-xs font-medium px-3 py-1 rounded-full border border-white/20 max-w-[250px] truncate">
                  {departments.find(d => String(d.id) === formData.department_id)?.name}
                </span>
              )}
            </div>
          </div>

          {/* Role Badge */}
          <div className="flex sm:flex-col items-center gap-4 sm:gap-2 bg-white/10 rounded-xl px-4 py-3 text-center">
            <div>
              <div className="text-xl font-bold">R&D Staff</div>
              <div className="text-red-200 text-xs">Account Role</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm mb-6 overflow-x-auto">
        <nav className="flex gap-1 px-4 pt-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`py-3 px-4 text-xs sm:text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap rounded-t-lg ${
                activeTab === t.id
                  ? 'border-[#C8102E] text-[#C8102E]'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      {/* ── Tab Content ── */}

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <form onSubmit={onSaveProfile}>
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <SectionHeader icon={<User size={20} />} title="Personal Information" description="Your basic identity details on the system" />

            {profileMsg && (
              <div className={`mb-5 flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-medium border ${profileMsg.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                {profileMsg.type === 'success' ? <CheckCircle size={16} className="flex-shrink-0" /> : <Shield size={16} className="flex-shrink-0" />}
                {profileMsg.text}
              </div>
            )}

            {/* Name Row */}
            <div className="grid grid-cols-12 gap-3 mb-4">
              <div className="col-span-12 sm:col-span-5">
                <FormInput label="First Name" name="firstName" value={formData.firstName} onChange={handleInputChange} placeholder="e.g. Juan" required />
              </div>
              <div className="col-span-12 sm:col-span-2">
                <FormInput label="M.I." name="middleInitial" value={formData.middleInitial} onChange={handleInputChange} placeholder="e.g. D" maxLength={2} />
              </div>
              <div className="col-span-12 sm:col-span-5">
                <FormInput label="Last Name" name="lastName" value={formData.lastName} onChange={handleInputChange} placeholder="e.g. Dela Cruz" required />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1">
                  <Calendar size={13} className="text-gray-400" /> Birthdate
                </label>
                <input type="date" name="birthdate" value={formData.birthdate} onChange={handleInputChange}
                  className="block w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm bg-white text-gray-900 focus:border-[#C8102E] focus:ring-2 focus:ring-[#C8102E]/15 hover:border-gray-400 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Sex</label>
                <select name="sex" value={formData.sex} onChange={handleInputChange}
                  className="block w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm bg-white text-gray-900 focus:border-[#C8102E] focus:ring-2 focus:ring-[#C8102E]/15 hover:border-gray-400 outline-none transition-all"
                >
                  <option value="" disabled>Select sex</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>
            </div>

            <div className="mb-6 relative" ref={deptDropdownRef}>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Department / Station</label>
              <button
                type="button"
                onClick={() => setIsDeptOpen(prev => !prev)}
                className={`block w-full text-left rounded-lg border px-3.5 py-2.5 text-sm bg-white transition-all outline-none ${
                  formData.department_id
                    ? 'text-gray-900 border-gray-300 hover:border-gray-400 focus:border-[#C8102E] focus:ring-2 focus:ring-[#C8102E]/15'
                    : 'text-gray-400 border-gray-300 hover:border-gray-400'
                }`}
              >
                {formData.department_id
                  ? departments.find(d => String(d.id) === formData.department_id)?.name || 'Select your department'
                  : 'Select your department'
                }
              </button>
              {isDeptOpen && (
                <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-xl max-h-52 overflow-y-auto">
                  {departments.map((dept) => (
                    <div
                      key={dept.id}
                      className={`px-4 py-2.5 text-sm cursor-pointer transition-colors ${
                        String(dept.id) === formData.department_id
                          ? 'bg-[#C8102E]/10 text-[#C8102E] font-medium'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                      onClick={() => {
                        setFormData(prev => ({ ...prev, department_id: String(dept.id) }));
                        setIsDeptOpen(false);
                      }}
                    >
                      {dept.name}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <button type="submit" disabled={isSavingProfile} className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#C8102E] text-white text-sm font-semibold hover:bg-[#A50D26] transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
                {isSavingProfile ? <><SpinnerIcon /> Saving...</> : <><CheckCircle size={16} /> Save Changes</>}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Email Tab */}
      {activeTab === 'email' && (
        <form onSubmit={onSaveEmail}>
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <SectionHeader icon={<Mail size={20} />} title="Email Address" description="Manage your primary login and communication email" />

            {emailMsg && (
              <div className={`mb-5 flex items-start gap-2.5 rounded-xl px-4 py-3 text-sm font-medium border ${emailMsg.type === 'success' && emailMsg.info ? 'bg-blue-50 border-blue-200 text-blue-700' : emailMsg.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                <CheckCircle size={16} className="mt-0.5 flex-shrink-0" />
                {emailMsg.text}
              </div>
            )}

            <div className="mb-4">
              <FormInput label="Primary Email" type="email" value={emailValue} onChange={(e) => setEmailValue(e.target.value)} placeholder="e.g. user@example.com" required suffix={<Mail size={15} className="text-gray-400" />} />
              {profile?.email !== emailValue && (
                <p className="text-xs text-orange-600 mt-1.5 ml-0.5 font-medium">Changes must be verified via confirmation link sent to both addresses.</p>
              )}
            </div>

            <div className="flex justify-end">
              <button type="submit" disabled={isSavingEmail || profile?.email === emailValue} className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gray-600 text-white text-sm font-semibold hover:bg-gray-700 transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
                {isSavingEmail ? <><SpinnerIcon /> Processing...</> : 'Update Email'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <SectionHeader icon={<Lock size={20} />} title="Security" description="Keep your account secure with a strong password" />

          <form onSubmit={onChangePassword}>
            {passwordMsg && (
              <div className={`mb-5 flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-medium border ${passwordMsg.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                {passwordMsg.type === 'success' ? <CheckCircle size={16} className="flex-shrink-0" /> : <Shield size={16} className="flex-shrink-0" />}
                {passwordMsg.text}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
              <div className="sm:col-span-2">
                <FormInput label="Current Password" type={showPasswords.current ? 'text' : 'password'} value={passwords.current} onChange={(e) => setPasswords(prev => ({ ...prev, current: e.target.value }))} placeholder="Enter your current password"
                  suffix={<button type="button" onClick={() => setShowPasswords(p => ({ ...p, current: !p.current }))} className="text-gray-400 hover:text-gray-600">{showPasswords.current ? <EyeOff size={16} /> : <Eye size={16} />}</button>}
                />
              </div>
              <div>
                <FormInput label="New Password" type={showPasswords.new ? 'text' : 'password'} value={passwords.new} onChange={(e) => setPasswords(prev => ({ ...prev, new: e.target.value }))} placeholder="At least 8 characters"
                  suffix={<button type="button" onClick={() => setShowPasswords(p => ({ ...p, new: !p.new }))} className="text-gray-400 hover:text-gray-600">{showPasswords.new ? <EyeOff size={16} /> : <Eye size={16} />}</button>}
                />
                {passwords.new && (
                  <div className="mt-2">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Password strength</span>
                      <span className={`font-semibold ${passwordStrength.label === 'Strong' ? 'text-green-600' : passwordStrength.label === 'Good' ? 'text-yellow-600' : passwordStrength.label === 'Fair' ? 'text-orange-600' : 'text-red-600'}`}>{passwordStrength.label}</span>
                    </div>
                    <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-500 ${passwordStrength.color}`} style={{ width: passwordStrength.width }} />
                    </div>
                  </div>
                )}
              </div>
              <div>
                <FormInput label="Confirm New Password" type={showPasswords.confirm ? 'text' : 'password'} value={passwords.confirm} onChange={(e) => setPasswords(prev => ({ ...prev, confirm: e.target.value }))} placeholder="Repeat new password"
                  suffix={<button type="button" onClick={() => setShowPasswords(p => ({ ...p, confirm: !p.confirm }))} className="text-gray-400 hover:text-gray-600">{showPasswords.confirm ? <EyeOff size={16} /> : <Eye size={16} />}</button>}
                />
                {passwords.confirm && (
                  <p className={`text-xs mt-1.5 font-medium flex items-center gap-1 ${passwords.new === passwords.confirm ? 'text-green-600' : 'text-red-500'}`}>
                    {passwords.new === passwords.confirm ? <><CheckCircle size={12} /> Passwords match</> : <><Shield size={12} /> Passwords do not match</>}
                  </p>
                )}
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 mb-5">
              <p className="text-xs font-semibold text-gray-600 mb-2">Password requirements</p>
              <ul className="space-y-1">
                {[
                  { check: passwords.new.length >= 8, text: 'At least 8 characters' },
                  { check: /[A-Z]/.test(passwords.new), text: 'One uppercase letter' },
                  { check: /[0-9]/.test(passwords.new), text: 'One number' },
                  { check: /[^A-Za-z0-9]/.test(passwords.new), text: 'One special character (!@#$...)' },
                ].map(({ check, text }) => (
                  <li key={text} className={`flex items-center gap-2 text-xs font-medium ${check ? 'text-green-600' : 'text-gray-400'}`}>
                    <CheckCircle size={12} className={check ? 'text-green-500' : 'text-gray-300'} />{text}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex justify-end">
              <button type="submit" disabled={isSavingPassword} className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gray-800 text-white text-sm font-semibold hover:bg-gray-900 transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
                {isSavingPassword ? <><SpinnerIcon /> Updating...</> : <><Lock size={15} /> Update Password</>}
              </button>
            </div>
          </form>
        </div>
      )}



      <div className="h-8" />
      </div>
    </div>
  );
};

export default RndSettings;
