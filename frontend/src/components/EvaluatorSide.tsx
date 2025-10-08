"use client"

import type React from "react"
import { useState } from "react"
import { NavLink } from "react-router-dom"
import { Menu, X } from "lucide-react"

const accent = "#C8102E"

const Sidebar: React.FC = () => {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const mainLinks = [
    { to: "/users/evaluator/dashboard", label: "Dashboard", icon: DashboardIcon },
    { to: "/users/evaluator/proposals", label: "Proposals", icon: UserIcon },
    { to: "/users/evaluator/review", label: "Review Proposals", icon: ReviewIcon },
    { to: "/users/evaluator/reviewed", label: "Reviewed Proposals", icon: CheckedIcon },
    { to: "/users/evaluator/notifications", label: "Notifications", icon: BellIcon, badge: "5" },
  ]
  const bottomLinks = [
    { to: "/users/evaluator/settings", label: "Settings", icon: CogIcon },
    { to: "/logout", label: "Logout", icon: LogoutIcon },
  ]

  return (
    <>
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-lg border border-gray-200"
        aria-label="Toggle menu"
      >
        {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed lg:sticky top-0 h-screen w-64 bg-gradient-to-b from-white to-gray-50/50 border-r border-gray-200/60 shadow-lg backdrop-blur-sm p-4 overflow-y-auto z-40 transition-transform duration-300 ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Enhanced Header with Animation */}
        <div className="flex items-center gap-3 mb-8 p-3 rounded-xl bg-gradient-to-r from-red-50 to-red-50/30 border border-red-100/50 shadow-sm">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md transform transition-transform duration-300 hover:scale-110 hover:rotate-3"
            style={{
              backgroundColor: accent,
              background: `linear-gradient(135deg, ${accent} 0%, #A00E26 100%)`,
            }}
          >
            A
          </div>
          <div>
            <h3 className="text-xl font-bold bg-gradient-to-r from-red-600 to-red-700 bg-clip-text text-transparent">
              Evaluator
            </h3>
            <p className="text-xs text-gray-500 font-medium">Project Portal</p>
          </div>
        </div>

        <nav className="flex flex-col gap-2">
          {/* Main Navigation Links with Enhanced Styling */}
          <div className="space-y-1">
            {mainLinks.map((ln) => (
              <NavLink
                key={ln.to}
                to={ln.to}
                onMouseEnter={() => setHoveredItem(ln.to)}
                onMouseLeave={() => setHoveredItem(null)}
                className={({ isActive }) =>
                  `group relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 transform ${
                    isActive
                      ? "bg-gradient-to-r from-red-50 to-red-100/50 text-red-700 shadow-md scale-[1.02] border border-red-200/50"
                      : "text-gray-700 hover:bg-gradient-to-r hover:from-red-50/50 hover:to-red-50/30 hover:text-red-600 hover:scale-[1.01] hover:shadow-sm"
                  }`
                }
                style={({ isActive }) => (isActive ? { boxShadow: `inset 4px 0 0 ${accent}` } : {})}
              >
                <div className="relative">
                  <ln.icon
                    className={`w-5 h-5 transition-all duration-300 ${hoveredItem === ln.to ? "scale-110" : ""}`}
                    style={{ color: accent }}
                  />
                  {/* Animated glow effect */}
                  <div
                    className={`absolute inset-0 w-5 h-5 rounded-full transition-opacity duration-300 ${
                      hoveredItem === ln.to ? "opacity-20" : "opacity-0"
                    }`}
                    style={{ backgroundColor: accent, filter: "blur(8px)" }}
                  />
                </div>
                <span className="flex-1">{ln.label}</span>
                {ln.badge && (
                  <span
                    className={`px-2 py-1 text-xs font-bold rounded-full transition-all duration-300 ${
                      ln.badge === "!"
                        ? "bg-red-500 text-white animate-pulse"
                        : ln.badge === "NEW"
                          ? "bg-gradient-to-r from-green-400 to-green-500 text-white"
                          : "bg-red-100 text-red-600"
                    } ${hoveredItem === ln.to ? "scale-110" : ""}`}
                  >
                    {ln.badge}
                  </span>
                )}
              </NavLink>
            ))}
          </div>

          {/* Enhanced Bottom Navigation */}
          <div className="mt-auto pt-4 border-t border-gray-200/60 space-y-1">
            {bottomLinks.map((ln) => (
              <NavLink
                key={ln.to}
                to={ln.to}
                onMouseEnter={() => setHoveredItem(ln.to)}
                onMouseLeave={() => setHoveredItem(null)}
                className={({ isActive }) =>
                  `group relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 transform ${
                    isActive
                      ? "bg-gradient-to-r from-red-50 to-red-100/50 text-red-700 shadow-md scale-[1.02]"
                      : ln.to === "/logout"
                        ? "text-gray-600 hover:bg-gradient-to-r hover:from-red-50/50 hover:to-red-100/30 hover:text-red-600 hover:scale-[1.01]"
                        : "text-gray-700 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100/50 hover:text-gray-800 hover:scale-[1.01]"
                  }`
                }
                style={({ isActive }) => (isActive ? { boxShadow: `inset 4px 0 0 ${accent}` } : {})}
              >
                <div className="relative">
                  <ln.icon
                    className={`w-5 h-5 transition-all duration-300 ${
                      hoveredItem === ln.to ? "scale-110" : ""
                    } ${ln.to === "/logout" ? "group-hover:rotate-12" : ""}`}
                    style={{ color: ln.to === "/logout" ? "#dc2626" : accent }}
                  />
                  {/* Animated glow effect */}
                  <div
                    className={`absolute inset-0 w-5 h-5 rounded-full transition-opacity duration-300 ${
                      hoveredItem === ln.to ? "opacity-20" : "opacity-0"
                    }`}
                    style={{ backgroundColor: ln.to === "/logout" ? "#dc2626" : accent, filter: "blur(8px)" }}
                  />
                </div>
                <span>{ln.label}</span>
              </NavLink>
            ))}
          </div>
        </nav>
      </aside>
    </>
  )
}

/* Reviews Icon */
function ReviewIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M8 12h8M8 16h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path
        d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12c0 1.5.33 2.91.91 4.18.16.35.19.75.09 1.12l-.65 2.9 2.9-.65c.37-.08.77-.07 1.12.09A9.96 9.96 0 0012 22z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path d="M16 8l-2 2-2-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/* Dashboard Icon */
function DashboardIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <rect x="3" y="3" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="13" y="3" width="8" height="5" rx="1.2" stroke="currentColor" strokeWidth="1.5" />
      <rect x="13" y="10" width="8" height="11" rx="1.2" stroke="currentColor" strokeWidth="1.5" />
      <rect x="3" y="13" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

/* User Icon */
function UserIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5" />
      <path d="M4 20c0-4 4-6 8-6s8 2 8 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

/* Bell Icon */
function BellIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M15 17H9a4 4 0 0 1-4-4V9a6 6 0 1 1 12 0v4a4 4 0 0 1-2 3z" stroke="currentColor" strokeWidth="1.5" />
      <path d="M13.73 21a2 2 0 0 0-3.46 0" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

/* Cog Icon */
function CogIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M12 15.5A3.5 3.5 0 1 0 12 8.5a3.5 3.5 0 0 0 0 7z" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06A2 2 0 1 1 2.3 16.88l.06-.06A2 2 0 1 1 7.07 3.2l.06.06c.45.45 1.14.54 1.71.25.47-.24 1-.37 1.59-.37H12c.6 0 1.12.13 1.59.37.57.29 1.26.2 1.71-.25l.06-.06z"
        stroke="currentColor"
        strokeWidth="1.2"
      />
    </svg>
  )
}

/* Logout Icon */
function LogoutIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M16 17l5-5-5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M21 12H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path
        d="M9 19H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/* Checked Icon for Reviewed Proposals */
function CheckedIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M9 11l3 3L22 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path
        d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default Sidebar