import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { SettingsApi, type LateSubmissionPolicy } from '../../../services/admin/SettingsApi';

const TABS = [
  { id: 'profile', label: 'Profile' },
  { id: 'security', label: 'Security' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'preferences', label: 'Preferences' },
  { id: 'system', label: 'System' }
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
  const [activeTab, setActiveTab] =
    useState<(typeof TABS)[number]['id']>('profile');

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
        {activeTab === 'system' && <SystemSection />}
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

const SystemSection: React.FC = () => {
  const [policy, setPolicy] = useState<LateSubmissionPolicy>({ enabled: false });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lateType, setLateType] = useState<'until_date' | 'indefinite'>('until_date');
  const [deadline, setDeadline] = useState('');

  useEffect(() => {
    loadPolicy();
  }, []);

  const loadPolicy = async () => {
    try {
      const data = await SettingsApi.getLateSubmissionPolicy();
      setPolicy(data);
      if (data.enabled) {
        setLateType(data.type);
        if (data.type === 'until_date') {
          setDeadline(data.deadline.slice(0, 16));
        }
      }
    } catch {
      // Default to disabled if fetch fails
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    let newPolicy: LateSubmissionPolicy;

    if (!policy.enabled) {
      newPolicy = { enabled: false };
    } else if (lateType === 'until_date') {
      if (!deadline) {
        Swal.fire('Validation Error', 'Please select a deadline date.', 'warning');
        return;
      }
      newPolicy = { enabled: true, type: 'until_date', deadline: new Date(deadline).toISOString() };
    } else {
      newPolicy = { enabled: true, type: 'indefinite' };
    }

    setSaving(true);
    try {
      const updated = await SettingsApi.updateLateSubmissionPolicy(newPolicy);
      setPolicy(updated);
      Swal.fire('Saved', 'Late submission policy updated successfully.', 'success');
    } catch {
      Swal.fire('Error', 'Failed to update late submission policy.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600" />
      </div>
    );
  }

  return (
    <div className='grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6'>
      <Card title='Late Submission Policy'>
        <p className='text-sm text-gray-500 mb-4'>
          Allow proponents to submit proposals after the regular submission deadline.
        </p>

        {/* Enable/Disable toggle */}
        <div className='flex items-center justify-between mb-4'>
          <span className='text-sm text-gray-700'>Allow late submissions</span>
          <label className='inline-flex items-center cursor-pointer'>
            <input
              type='checkbox'
              className='sr-only'
              checked={policy.enabled}
              onChange={(e) => {
                if (e.target.checked) {
                  setPolicy({ enabled: true, type: lateType, ...(lateType === 'until_date' ? { deadline: deadline ? new Date(deadline).toISOString() : '' } : {}) } as LateSubmissionPolicy);
                } else {
                  setPolicy({ enabled: false });
                }
              }}
            />
            <span
              className={`w-10 h-6 flex items-center rounded-full p-1 transition ${
                policy.enabled ? 'bg-red-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`bg-white w-4 h-4 rounded-full transform transition ${
                  policy.enabled ? 'translate-x-4' : ''
                }`}
              />
            </span>
          </label>
        </div>

        {/* Options when enabled */}
        {policy.enabled && (
          <div className='space-y-4 border-t border-gray-100 pt-4'>
            <div className='space-y-2'>
              <label className='flex items-center gap-2 text-sm cursor-pointer'>
                <input
                  type='radio'
                  name='lateType'
                  value='until_date'
                  checked={lateType === 'until_date'}
                  onChange={() => setLateType('until_date')}
                  className='accent-red-600'
                />
                <span className='text-gray-700'>Until a specific date</span>
              </label>

              {lateType === 'until_date' && (
                <div className='ml-6'>
                  <input
                    type='datetime-local'
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className='w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm'
                  />
                </div>
              )}

              <label className='flex items-center gap-2 text-sm cursor-pointer'>
                <input
                  type='radio'
                  name='lateType'
                  value='indefinite'
                  checked={lateType === 'indefinite'}
                  onChange={() => setLateType('indefinite')}
                  className='accent-red-600'
                />
                <span className='text-gray-700'>Indefinite (no deadline)</span>
              </label>
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className='px-4 py-2 rounded-lg text-white text-sm disabled:opacity-50 w-full sm:w-auto'
              style={{ background: PRIMARY }}
            >
              {saving ? 'Saving...' : 'Save Policy'}
            </button>
          </div>
        )}

        {/* Save when disabling */}
        {!policy.enabled && (
          <button
            onClick={handleSave}
            disabled={saving}
            className='px-4 py-2 rounded-lg text-white text-sm disabled:opacity-50 w-full sm:w-auto'
            style={{ background: PRIMARY }}
          >
            {saving ? 'Saving...' : 'Save Policy'}
          </button>
        )}

        {/* Current status */}
        <div className='mt-4 p-3 bg-gray-50 rounded-md'>
          <p className='text-xs text-gray-500 font-medium mb-1'>Current Status</p>
          {!policy.enabled && (
            <p className='text-sm text-gray-700'>Late submissions are <span className='font-semibold text-red-600'>disabled</span>.</p>
          )}
          {policy.enabled && policy.type === 'indefinite' && (
            <p className='text-sm text-gray-700'>Late submissions are <span className='font-semibold text-green-600'>allowed indefinitely</span>.</p>
          )}
          {policy.enabled && policy.type === 'until_date' && (
            <p className='text-sm text-gray-700'>
              Late submissions are <span className='font-semibold text-green-600'>allowed</span> until{' '}
              <span className='font-semibold'>{new Date(policy.deadline).toLocaleString()}</span>.
            </p>
          )}
        </div>
      </Card>
    </div>
  );
};

export default AdminSettings;