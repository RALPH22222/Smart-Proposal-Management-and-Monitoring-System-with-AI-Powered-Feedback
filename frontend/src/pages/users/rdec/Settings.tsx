"use client"

import type React from "react"
import { useState } from "react"

const PRIMARY = "#C8102E"

const Card: React.FC<{ title?: string } & { children?: React.ReactNode }> = ({ title, children }) => (
  <div className="bg-white shadow-xl rounded-2xl border border-slate-200 p-6">
    {title && <h3 className="text-lg font-semibold text-slate-800 mb-4">{title}</h3>}
    {children}
  </div>
)

const RdecSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"profile" | "security" | "notifications" | "preferences">("profile")

  return (
    <div className="bg-gradient-to-br from-slate-50 to-slate-100 h-full flex flex-col gap-6 p-6">
      <header className="flex-shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#C8102E] leading-tight">RDEC Settings</h1>
            <p className="text-slate-600 mt-2 text-sm leading-relaxed">
              Manage your account, security and preferences.
            </p>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white shadow-xl rounded-2xl border border-slate-200 flex-shrink-0">
        <nav className="flex gap-6 px-6 overflow-x-auto">
          {[
            { id: "profile", label: "Profile" },
            { id: "security", label: "Security" },
            { id: "notifications", label: "Notifications" },
            { id: "preferences", label: "Preferences" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`py-4 text-sm font-medium border-b-2 -mb-px transition-colors ${
                activeTab === t.id
                  ? "border-[#C8102E] text-[#C8102E]"
                  : "border-transparent text-slate-600 hover:text-slate-800 hover:border-slate-200"
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="flex-1">
        {activeTab === "profile" && <ProfileSection />}
        {activeTab === "security" && <SecuritySection />}
        {activeTab === "notifications" && <NotificationsSection />}
        {activeTab === "preferences" && <PreferencesSection />}
      </div>
    </div>
  )
}

const AvatarUpload: React.FC = () => {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="w-24 h-24 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 text-lg font-medium">
        SJ
      </div>
      <div className="flex flex-col gap-3 w-full">
        <button
          className="px-4 py-2 text-sm font-medium rounded-lg text-white transition-colors hover:opacity-90"
          style={{ background: PRIMARY }}
        >
          Upload Photo
        </button>
        <button className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors">
          Remove
        </button>
      </div>
    </div>
  )
}

const ProfileSection: React.FC = () => {
  const [form, setForm] = useState({
    firstName: "Sarah",
    lastName: "Johnson",
    email: "rdec@wmsu.edu.ph",
    phone: "+63 900 000 0000",
    organization: "WMSU",
    title: "Senior Researcher",
  })

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card title="Profile Photo">
        <AvatarUpload />
      </Card>

      <div className="lg:col-span-2">
        <Card title="Personal Information">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">First name</label>
              <input
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-[#C8102E] transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Last name</label>
              <input
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-[#C8102E] transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-[#C8102E] transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Phone</label>
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-[#C8102E] transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Organization</label>
              <input
                value={form.organization}
                onChange={(e) => setForm({ ...form, organization: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-[#C8102E] transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Title</label>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-[#C8102E] transition-colors"
              />
            </div>
          </div>
          <div className="mt-6 flex gap-3">
            <button
              className="px-6 py-2.5 rounded-lg text-white font-medium transition-colors hover:opacity-90"
              style={{ background: PRIMARY }}
            >
              Save Changes
            </button>
            <button className="px-6 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition-colors">
              Cancel
            </button>
          </div>
        </Card>
      </div>

      <div className="lg:col-span-3">
        <Card title="Contact & Address">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Address</label>
              <input
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-[#C8102E] transition-colors"
                placeholder="Street, Barangay"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">City</label>
              <input className="w-full px-3 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-[#C8102E] transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Zip Code</label>
              <input className="w-full px-3 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-[#C8102E] transition-colors" />
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

const SecuritySection: React.FC = () => {
  const [twoFA, setTwoFA] = useState(false)
  const [pwd, setPwd] = useState({ current: "", next: "", confirm: "" })
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card title="Change Password">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Current password</label>
            <input
              type="password"
              value={pwd.current}
              onChange={(e) => setPwd({ ...pwd, current: e.target.value })}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-[#C8102E] transition-colors"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">New password</label>
              <input
                type="password"
                value={pwd.next}
                onChange={(e) => setPwd({ ...pwd, next: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-[#C8102E] transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Confirm password</label>
              <input
                type="password"
                value={pwd.confirm}
                onChange={(e) => setPwd({ ...pwd, confirm: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-[#C8102E] transition-colors"
              />
            </div>
          </div>
          <button
            className="mt-4 px-6 py-2.5 rounded-lg text-white font-medium transition-colors hover:opacity-90"
            style={{ background: PRIMARY }}
          >
            Update Password
          </button>
        </div>
      </Card>

      <Card title="Two‑Factor Authentication">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-slate-600 mb-2">Enhance your account security</p>
            <p className="text-xs text-slate-500">Require a verification code when signing in to your account.</p>
          </div>
          <label className="inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only" checked={twoFA} onChange={(e) => setTwoFA(e.target.checked)} />
            <span
              className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${twoFA ? "bg-[#C8102E]" : "bg-slate-300"}`}
            >
              <span
                className={`bg-white w-4 h-4 rounded-full transform transition-transform ${twoFA ? "translate-x-6" : ""}`}
              />
            </span>
          </label>
        </div>
      </Card>
    </div>
  )
}

const NotificationsSection: React.FC = () => {
  const [prefs, setPrefs] = useState({
    proposalSubmitted: true,
    proposalReviewed: true,
    proposalApproved: true,
    weeklyDigest: false,
    smsAlerts: false,
  })

  const toggle = (k: keyof typeof prefs) => setPrefs((p) => ({ ...p, [k]: !p[k] }))

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card title="Email Notifications">
        <div className="space-y-4">
          {[
            { key: "proposalSubmitted", label: "When a new RDEC proposal is submitted" },
            { key: "proposalReviewed", label: "When my RDEC proposal is reviewed" },
            { key: "proposalApproved", label: "When an RDEC proposal is endorsed/rejected" },
            { key: "weeklyDigest", label: "Weekly RDEC activity digest" },
          ].map((row: any) => (
            <label key={row.key} className="flex items-start gap-3 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={(prefs as any)[row.key]}
                onChange={() => toggle(row.key)}
                className="mt-0.5 w-4 h-4 text-[#C8102E] border-slate-300 rounded focus:ring-[#C8102E]"
              />
              <span className="text-slate-700 leading-relaxed">{row.label}</span>
            </label>
          ))}
        </div>
      </Card>
      <Card title="SMS & Mobile Alerts">
        <div className="space-y-4">
          <label className="flex items-start gap-3 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={prefs.smsAlerts}
              onChange={() => toggle("smsAlerts")}
              className="mt-0.5 w-4 h-4 text-[#C8102E] border-slate-300 rounded focus:ring-[#C8102E]"
            />
            <div>
              <span className="text-slate-700 block">Enable important RDEC SMS alerts</span>
              <span className="text-xs text-slate-500 mt-1 block">
                Get notified about critical RDEC updates via SMS
              </span>
            </div>
          </label>
          <p className="text-xs text-slate-500 mt-3">Standard carrier rates may apply for SMS notifications.</p>
        </div>
      </Card>
    </div>
  )
}

const PreferencesSection: React.FC = () => {
  const [pref, setPref] = useState({ density: "comfortable", theme: "light" })
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card title="Display Preferences">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Theme</label>
            <select
              value={pref.theme}
              onChange={(e) => setPref({ ...pref, theme: e.target.value })}
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-[#C8102E] transition-colors"
            >
              <option value="light">Light Mode</option>
              <option value="system">System Default</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Interface Density</label>
            <select
              value={pref.density}
              onChange={(e) => setPref({ ...pref, density: e.target.value })}
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-[#C8102E] transition-colors"
            >
              <option value="comfortable">Comfortable</option>
              <option value="compact">Compact</option>
            </select>
          </div>
        </div>
      </Card>
      <Card title="Session Management">
        <div className="space-y-4">
          <div className="text-sm text-slate-600 space-y-2">
            <div className="flex justify-between">
              <span>Last login:</span>
              <span className="font-medium">2 hours ago</span>
            </div>
            <div className="flex justify-between">
              <span>Active sessions:</span>
              <span className="font-medium">2 devices</span>
            </div>
            <div className="flex justify-between">
              <span>Current session:</span>
              <span className="font-medium text-emerald-600">Active</span>
            </div>
          </div>
          <button
            className="mt-4 px-6 py-2.5 rounded-lg text-white font-medium transition-colors hover:opacity-90"
            style={{ background: PRIMARY }}
          >
            Sign Out All Devices
          </button>
        </div>
      </Card>
    </div>
  )
}

export default RdecSettings
