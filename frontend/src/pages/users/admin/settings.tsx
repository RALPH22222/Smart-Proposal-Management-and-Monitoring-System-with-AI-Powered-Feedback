import React, { useEffect, useState } from 'react';
import { useLoading } from '../../../contexts/LoadingContext';

const TABS = [
  { id: 'profile', label: 'Profile' },
  { id: 'security', label: 'Security' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'preferences', label: 'Preferences' }
] as const;

const STATUS = [
  {
    key: 'proposalSubmitted',
    label: 'When a new proposal is submitted'
  },
  { key: 'proposalReviewed', label: 'When my proposal is reviewed' },
  {
    key: 'proposalApproved',
    label: 'When a proposal is approved/rejected'
  },
  { key: 'weeklyDigest', label: 'Weekly activity digest' }
] as const;
const PRIMARY = '#C8102E';

const Card: React.FC<{ title?: string } & { children?: React.ReactNode }> = ({
  title,
  children
}) => (
  <div className='bg-white rounded-lg shadow p-4 sm:p-6'>
    {title && (
      <h3 className='text-sm font-medium text-gray-700 mb-3'>{title}</h3>
    )}
    {children}
  </div>
);

const AdminSettings: React.FC = () => {
  const { setLoading } = useLoading();
  const [activeTab, setActiveTab] =
    useState<(typeof TABS)[number]['id']>('profile');

  // Simulate page-loading animation on mount and tab switch
  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 350);
    return () => clearTimeout(t);
  }, [activeTab, setLoading]);

  return (
    <div className="flex flex-col gap-4 sm:gap-6 p-4 sm:p-6 h-full overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 pt-11 sm:pt-0 pb-4 sm:pb-6">
        <h1 className='text-xl sm:text-2xl font-bold text-red-700'>Admin Settings</h1>
        <p className='text-gray-600 mt-1 text-sm sm:text-base'>
          Manage your account, security and preferences.
        </p>
      </header>

      {/* Tabs */}
      <div className='bg-white rounded-lg shadow-sm border border-gray-200 mb-6 flex-shrink-0'>
        <nav className='flex gap-4 sm:gap-6 px-3 sm:px-5 overflow-x-auto'>
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`py-3 text-xs sm:text-sm border-b-2 -mb-px transition-colors whitespace-nowrap ${
                activeTab === t.id
                  ? 'border-red-600 text-red-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'profile' && <ProfileSection />}
        {activeTab === 'security' && <SecuritySection />}
        {activeTab === 'notifications' && <NotificationsSection />}
        {activeTab === 'preferences' && <PreferencesSection />}
      </div>
    </div>
  );
};

const AvatarUpload: React.FC = () => {
  return (
    <div className='flex flex-col items-center gap-3'>
      <div className='w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-gray-200 flex items-center justify-center text-gray-500'>
        IMG
      </div>
      <div className='flex flex-col sm:flex-row gap-2 w-full'>
        <button
          className='px-3 py-2 text-sm rounded-md text-white w-full sm:w-auto'
          style={{ background: PRIMARY }}
        >
          Upload
        </button>
        <button className='px-3 py-2 text-sm rounded-md border border-gray-300 text-gray-700 w-full sm:w-auto'>
          Remove
        </button>
      </div>
    </div>
  );
};

const ProfileSection: React.FC = () => {
  const [form, setForm] = useState({
    firstName: 'Robert',
    lastName: 'William',
    email: 'admin@example.com',
    phone: '+63 900 000 0000',
    organization: 'WMSU',
    title: 'System Administrator'
  });

  return (
    <div className='grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6'>
      <Card title='Avatar'>
        <AvatarUpload />
      </Card>

      <div className='lg:col-span-2'>
        <Card title='Personal Information'>
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4'>
            <div>
              <label className='block text-sm text-gray-600 mb-1'>
                First name
              </label>
              <input
                value={form.firstName}
                onChange={(e) =>
                  setForm({ ...form, firstName: e.target.value })
                }
                className='w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm'
              />
            </div>
            <div>
              <label className='block text-sm text-gray-600 mb-1'>
                Last name
              </label>
              <input
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                className='w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm'
              />
            </div>
            <div className="sm:col-span-2">
              <label className='block text-sm text-gray-600 mb-1'>Email</label>
              <input
                type='email'
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className='w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm'
              />
            </div>
            <div>
              <label className='block text-sm text-gray-600 mb-1'>Phone</label>
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className='w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm'
              />
            </div>
            <div>
              <label className='block text-sm text-gray-600 mb-1'>
                Organization
              </label>
              <input
                value={form.organization}
                onChange={(e) =>
                  setForm({ ...form, organization: e.target.value })
                }
                className='w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm'
              />
            </div>
            <div>
              <label className='block text-sm text-gray-600 mb-1'>Title</label>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className='w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm'
              />
            </div>
          </div>
          <div className='mt-4 flex gap-2 flex-wrap'>
            <button
              className='px-4 py-2 rounded-lg text-white text-sm sm:text-base w-full sm:w-auto'
              style={{ background: PRIMARY }}
            >
              Save changes
            </button>
            <button className='px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm sm:text-base w-full sm:w-auto'>
              Cancel
            </button>
          </div>
        </Card>
      </div>

      <div className='lg:col-span-3'>
        <Card title='Contact & Address'>
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4'>
            <div className="sm:col-span-2 lg:col-span-1">
              <label className='block text-sm text-gray-600 mb-1'>
                Address
              </label>
              <input
                className='w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm'
                placeholder='Street, Barangay'
              />
            </div>
            <div>
              <label className='block text-sm text-gray-600 mb-1'>City</label>
              <input className='w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm' />
            </div>
            <div>
              <label className='block text-sm text-gray-600 mb-1'>Zip</label>
              <input className='w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm' />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

const SecuritySection: React.FC = () => {
  const [twoFA, setTwoFA] = useState(false);
  const [pwd, setPwd] = useState({ current: '', next: '', confirm: '' });
  return (
    <div className='grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6'>
      <Card title='Password'>
        <div className='space-y-3'>
          <div>
            <label className='block text-sm text-gray-600 mb-1'>
              Current password
            </label>
            <input
              type='password'
              value={pwd.current}
              onChange={(e) => setPwd({ ...pwd, current: e.target.value })}
              className='w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm'
            />
          </div>
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
            <div>
              <label className='block text-sm text-gray-600 mb-1'>
                New password
              </label>
              <input
                type='password'
                value={pwd.next}
                onChange={(e) => setPwd({ ...pwd, next: e.target.value })}
                className='w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm'
              />
            </div>
            <div>
              <label className='block text-sm text-gray-600 mb-1'>
                Confirm password
              </label>
              <input
                type='password'
                value={pwd.confirm}
                onChange={(e) => setPwd({ ...pwd, confirm: e.target.value })}
                className='w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm'
              />
            </div>
          </div>
          <button
            className='mt-2 px-4 py-2 rounded-lg text-white text-sm sm:text-base w-full sm:w-auto'
            style={{ background: PRIMARY }}
          >
            Update password
          </button>
        </div>
      </Card>

      <Card title='Two‑Factor Authentication (2FA)'>
        <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3'>
          <p className='text-sm text-gray-600 flex-1'>
            Protect your account by requiring a code when signing in.
          </p>
          <label className='inline-flex items-center cursor-pointer flex-shrink-0'>
            <input
              type='checkbox'
              className='sr-only'
              checked={twoFA}
              onChange={(e) => setTwoFA(e.target.checked)}
            />
            <span
              className={`w-10 h-6 flex items-center bg-gray-200 rounded-full p-1 transition ${
                twoFA ? 'bg-red-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`bg-white w-4 h-4 rounded-full transform transition ${
                  twoFA ? 'translate-x-4' : ''
                }`}
              />
            </span>
          </label>
        </div>
      </Card>
    </div>
  );
};

const NotificationsSection: React.FC = () => {
  const [prefs, setPrefs] = useState<{
      proposalSubmitted: boolean;
      proposalReviewed: boolean;
      proposalApproved: boolean;
      weeklyDigest: boolean;
      smsAlerts: boolean;
  }>({
    proposalSubmitted: true,
    proposalReviewed: true,
    proposalApproved: true,
    weeklyDigest: false,
    smsAlerts: false
  });

  const toggle = (k: keyof typeof prefs) =>
    setPrefs((p) => ({ ...p, [k]: !p[k] }));

  return (
    <div className='grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6'>
      <Card title='Email Notifications'>
        <div className='space-y-3'>
          {STATUS.map((row) => (
            <label key={row.key} className='flex items-center gap-3 text-sm'>
              <input
                type='checkbox'
                checked={prefs[row.key as keyof typeof prefs]}
                onChange={() => toggle(row.key as keyof typeof prefs)}
              />
              <span className='text-gray-700'>{row.label}</span>
            </label>
          ))}
        </div>
      </Card>
      <Card title='SMS Alerts'>
        <div className='space-y-3 text-sm'>
          <label className='flex items-center gap-3'>
            <input
              type='checkbox'
              checked={prefs.smsAlerts}
              onChange={() => toggle('smsAlerts')}
            />
            <span className='text-gray-700'>Enable important SMS alerts</span>
          </label>
          <p className='text-gray-500'>Carrier rates may apply.</p>
        </div>
      </Card>
    </div>
  );
};

const PreferencesSection: React.FC = () => {
  const [pref, setPref] = useState({ density: 'comfortable', theme: 'light' });
  return (
    <div className='grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6'>
      <Card title='Appearance'>
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4'>
          <div>
            <label className='block text-sm text-gray-600 mb-1'>Theme</label>
            <select
              value={pref.theme}
              onChange={(e) => setPref({ ...pref, theme: e.target.value })}
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 text-sm'
            >
              <option value='light'>Light</option>
              <option value='system'>System</option>
            </select>
          </div>
          <div>
            <label className='block text-sm text-gray-600 mb-1'>Density</label>
            <select
              value={pref.density}
              onChange={(e) => setPref({ ...pref, density: e.target.value })}
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 text-sm'
            >
              <option value='comfortable'>Comfortable</option>
              <option value='compact'>Compact</option>
            </select>
          </div>
        </div>
      </Card>
      <Card title='Session'>
        <div className='text-sm text-gray-600 space-y-2'>
          <div>Last login: 2 hours ago</div>
          <div>Active sessions: 2 devices</div>
          <button
            className='mt-2 px-3 py-2 rounded-md text-white text-sm w-full sm:w-auto'
            style={{ background: PRIMARY }}
          >
            Sign out of all devices
          </button>
        </div>
      </Card>
    </div>
  );
};

export default AdminSettings;