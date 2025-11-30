import type React from "react";
import { useState } from "react";

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
    firstName: "Dhaif",
    lastName: "Labang",
    email: "rnd@example.com",
    phone: "+63 900 000 0000",
    organization: "WMSU",
    title: "Research and Development Officer",
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
  <div className="grid gap-6 md:grid-cols-2">
    <Card title="Email Notifications">
      <form className="space-y-3">
        <label className="flex items-center gap-2">
          <input type="checkbox" defaultChecked /> Account Updates
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" defaultChecked /> System Alerts
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" /> Marketing Messages
        </label>
        <button
          type="submit"
          className="mt-3 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
        >
          Save
        </button>
      </form>
    </Card>

    <Card title="Push Notifications">
      <form className="space-y-3">
        <label className="flex items-center gap-2">
          <input type="checkbox" defaultChecked /> New Messages
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" /> Event Reminders
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" defaultChecked /> Security Alerts
        </label>
        <button
          type="submit"
          className="mt-3 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
        >
          Save
        </button>
      </form>
    </Card>
  </div>
);

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
    "profile" | "security" | "notifications" | "preferences"
  >("profile");

  return (
    <div className="flex flex-col gap-6 p-6 h-full overflow-hidden">
      <header className="flex-shrink-0">
        <h1 className="text-2xl font-bold text-slate-900">Research and Development Settings</h1>
        <p className="text-slate-600 mt-1">
          Manage your account, security and preferences.
        </p>
      </header>

      {/* Tabs */}
      <div className="bg-white shadow rounded-lg border border-slate-200 flex-shrink-0">
        <nav className="flex gap-2 sm:gap-6 px-4 sm:px-6 overflow-x-auto">
          {[
            {
              id: "profile",
              label: "Profile",
            },
            {
              id: "security",
              label: "Security",
            },
            {
              id: "notifications",
              label: "Notifications",
            },
            {
              id: "preferences",
              label: "Preferences",
            },
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
        {activeTab === "preferences" && <PreferencesSection />}
      </div>
    </div>
  );
};

export default RdecSettings;