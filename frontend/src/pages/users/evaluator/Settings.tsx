import type React from "react";
import { useState, useEffect } from "react";
import Swal from 'sweetalert2';
import { SettingsApi } from '../../../services/admin/SettingsApi';
import NotificationPreferencesCard from '../../../components/shared/NotificationPreferencesCard';

const PRIMARY = "#C8102E";

const Card: React.FC<{ title?: string; children?: React.ReactNode }> = ({
  title,
  children,
}) => (
  <div className="bg-white shadow rounded-lg border border-slate-200 p-6">
    {title && (
      <h3 className="text-lg font-semibold text-slate-800 mb-4">{title}</h3>
    )}
    {children}
  </div>
);

const AvatarUpload: React.FC = () => {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="w-50 h-50 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
        IMG
      </div>
      <div className="flex flex-col gap-2 w-full">
        <button
          className="px-3 py-2 text-sm rounded-md text-white"
          style={{ background: PRIMARY }}
        >
          Upload
        </button>
        <button className="px-3 py-2 text-sm rounded-md border border-gray-300 text-gray-700">
          Remove
        </button>
      </div>
    </div>
  );
};

// === Profile Section ===
const ProfileSection: React.FC = () => {
  const [form, setForm] = useState({
    firstName: "Robert",
    lastName: "William",
    email: "evaluator@example.com",
    phone: "+63 900 000 0000",
    organization: "WMSU",
    title: "Evaluator",
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card title="Avatar">
        <AvatarUpload />
      </Card>

      <div className="lg:col-span-2">
        <Card title="Personal Information">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                First name
              </label>
              <input
                value={form.firstName}
                onChange={(e) =>
                  setForm({ ...form, firstName: e.target.value })
                }
                className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Last name
              </label>
              <input
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Phone</label>
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Organization
              </label>
              <input
                value={form.organization}
                onChange={(e) =>
                  setForm({ ...form, organization: e.target.value })
                }
                className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Title</label>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              className="px-4 py-2 rounded-lg text-white"
              style={{ background: PRIMARY }}
            >
              Save changes
            </button>
            <button className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700">
              Cancel
            </button>
          </div>
        </Card>
      </div>

      <div className="lg:col-span-3">
        <Card title="Contact & Address">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Address
              </label>
              <input
                className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Street, Barangay"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">City</label>
              <input className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Zip</label>
              <input className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500" />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

// === Security Section ===
const SecuritySection: React.FC = () => (
  <div className="grid gap-6 md:grid-cols-2">
    <Card title="Change Password">
      <form className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-600">
            Current Password
          </label>
          <input
            type="password"
            className="mt-1 w-full border rounded-lg px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-600">
            New Password
          </label>
          <input
            type="password"
            className="mt-1 w-full border rounded-lg px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-600">
            Confirm New Password
          </label>
          <input
            type="password"
            className="mt-1 w-full border rounded-lg px-3 py-2"
          />
        </div>
        <button
          type="submit"
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
        >
          Update Password
        </button>
      </form>
    </Card>

    <Card title="Two-Factor Authentication">
      <p className="text-slate-600 mb-4">
        Add an extra layer of security to your account.
      </p>
      <button className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700">
        Enable 2FA
      </button>
    </Card>
  </div>
);

// === Notifications Section ===
const NotificationsSection: React.FC = () => (
  <NotificationPreferencesCard
    visibleEvents={[
      'evaluator_assigned',
      'proposal_revision',
    ]}
  />
);

// === Availability Section ===
const AvailabilitySection: React.FC = () => {
  const [isAvailable, setIsAvailable] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Load current availability from notification preferences endpoint (piggyback on user data)
    // The availability is stored on the users table, we check it via a simple fetch
    setLoading(false); // default to true (available)
  }, []);

  const handleToggle = async () => {
    const newValue = !isAvailable;
    setSaving(true);
    try {
      await SettingsApi.updateAvailability(newValue);
      setIsAvailable(newValue);
      Swal.fire(
        'Updated',
        newValue
          ? 'You are now available for new proposal reviews.'
          : 'You are now marked as unavailable for new reviews.',
        'success'
      );
    } catch {
      Swal.fire('Error', 'Failed to update availability status.', 'error');
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
    <div className="grid gap-6 md:grid-cols-2">
      <Card title="Review Availability">
        <p className="text-sm text-slate-600 mb-4">
          Control whether RND can assign you new proposals to review.
          When unavailable, you won't receive new evaluation assignments.
        </p>
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-700">
            {isAvailable ? 'Available for reviews' : 'Unavailable for reviews'}
          </span>
          <button
            onClick={handleToggle}
            disabled={saving}
            className="relative"
          >
            <span
              className={`w-12 h-7 flex items-center rounded-full p-1 transition ${
                isAvailable ? 'bg-green-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`bg-white w-5 h-5 rounded-full shadow transform transition ${
                  isAvailable ? 'translate-x-5' : ''
                }`}
              />
            </span>
          </button>
        </div>
        <div className="mt-4 p-3 bg-slate-50 rounded-md">
          <p className="text-xs text-slate-500 font-medium mb-1">Current Status</p>
          <p className="text-sm text-slate-700">
            You are currently{' '}
            <span className={`font-semibold ${isAvailable ? 'text-green-600' : 'text-red-600'}`}>
              {isAvailable ? 'available' : 'unavailable'}
            </span>{' '}
            for new proposal reviews.
          </p>
        </div>
      </Card>
    </div>
  );
};

// === Preferences Section ===
const PreferencesSection: React.FC = () => (
  <div className="grid gap-6 md:grid-cols-2">
    <Card title="Theme">
      <select className="w-full border rounded-lg px-3 py-2">
        <option>Light</option>
        <option>Dark</option>
        <option>System</option>
      </select>
    </Card>

    <Card title="Language">
      <select className="w-full border rounded-lg px-3 py-2">
        <option>English</option>
        <option>Filipino</option>
        <option>Spanish</option>
      </select>
    </Card>
  </div>
);

// === Main Component ===
const RdecSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    "profile" | "security" | "notifications" | "availability" | "preferences"
  >("profile");

  return (
    <div className="flex flex-col gap-6 p-6 h-full overflow-hidden">
      <header className="flex-shrink-0">
        <h1 className="text-2xl font-bold text-slate-900">Evaluator Settings</h1>
        <p className="text-slate-600 mt-1">
          Manage your account, security, availability and preferences.
        </p>
      </header>

      {/* Tabs */}
      <div className="bg-white shadow rounded-lg border border-slate-200 flex-shrink-0">
        <nav className="flex gap-2 sm:gap-6 px-4 sm:px-6 overflow-x-auto">
          {[
            { id: "profile", label: "Profile" },
            { id: "security", label: "Security" },
            { id: "notifications", label: "Notifications" },
            { id: "availability", label: "Availability" },
            { id: "preferences", label: "Preferences" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`py-3 px-2 text-xs sm:text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${
                activeTab === t.id
                  ? "border-red-600 text-red-600"
                  : "border-transparent text-slate-600 hover:text-slate-800 hover:border-slate-200"
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto pb-6">
        {activeTab === "profile" && <ProfileSection />}
        {activeTab === "security" && <SecuritySection />}
        {activeTab === "notifications" && <NotificationsSection />}
        {activeTab === "availability" && <AvailabilitySection />}
        {activeTab === "preferences" && <PreferencesSection />}
      </div>
    </div>
  );
};

export default RdecSettings;