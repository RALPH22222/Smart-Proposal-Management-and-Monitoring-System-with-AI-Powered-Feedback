import type React from "react"
import { useState } from "react"
import { NavLink } from "react-router-dom"
import { Menu, X, LayoutDashboard, FileText, CheckCircle, RefreshCw, Settings, LogOut, Bell } from "lucide-react"

const accent = "#C10003"

const Sidebar: React.FC = () => {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const mainLinks = [
    { to: "/users/evaluator/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/users/evaluator/proposals", label: "Proposals", icon: FileText },
    { to: "/users/evaluator/review", label: "Under Review", icon: RefreshCw },
    { to: "/users/evaluator/reviewed", label: "Completed Reviews", icon: CheckCircle },
    { to: "/users/evaluator/notifications", label: "Notifications", icon: Bell, badge: "4" },
  ]

  const bottomLinks = [
    { to: "/users/evaluator/settings", label: "Settings", icon: Settings },
    { to: "/", label: "Logout", icon: LogOut },
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
        className={`fixed lg:sticky top-0 h-screen w-64 bg-gradient-to-b from-white to-gray-50/50 border-r border-gray-200/60 shadow-lg backdrop-blur-sm p-4 overflow-y-auto flex flex-col z-40 transition-transform duration-300 ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Enhanced Header with Animation */}
        <div className="flex items-center gap-3 mb-8 p-3 rounded-xl bg-gradient-to-r from-red-50 to-red-50/30 border border-red-100/50 shadow-sm">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md transform transition-transform duration-300 hover:scale-110 hover:rotate-3"
            style={{
              backgroundColor: accent,
              background: `linear-gradient(135deg, ${accent} 0%, #A00002 100%)`,
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

        <nav className="flex flex-col gap-2 flex-1">
          {/* Main Navigation Links with Enhanced Styling */}
          <div className="space-y-1">
            {mainLinks.map((ln) => {
              const Icon = ln.icon;
              return (
                <NavLink
                  key={ln.to}
                  to={ln.to}
                  onMouseEnter={() => setHoveredItem(ln.to)}
                  onMouseLeave={() => setHoveredItem(null)}
                  className={({ isActive }) =>
                    `group relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 transform w-full text-left ${
                      isActive
                        ? "bg-gradient-to-r from-red-50 to-red-100/50 text-red-700 shadow-md scale-[1.02] border border-red-200/50"
                        : "text-gray-700 hover:bg-gradient-to-r hover:from-red-50/50 hover:to-red-50/30 hover:text-red-600 hover:scale-[1.01] hover:shadow-sm"
                    }`
                  }
                  style={({ isActive }) => (isActive ? { boxShadow: `inset 4px 0 0 ${accent}` } : {})}
                >
                  <div className="relative">
                    <Icon
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
              );
            })}
          </div>

          {/* Enhanced Bottom Navigation */}
          <div className="mt-auto pt-4 border-t border-gray-200/60 space-y-1">
            {bottomLinks.map((ln) => {
              const Icon = ln.icon;
              return (
                <NavLink
                  key={ln.to}
                  to={ln.to}
                  onMouseEnter={() => setHoveredItem(ln.to)}
                  onMouseLeave={() => setHoveredItem(null)}
                  className={({ isActive }) =>
                    `group relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 transform w-full text-left ${
                      isActive
                        ? "bg-gradient-to-r from-red-50 to-red-100/50 text-red-700 shadow-md scale-[1.02]"
                        : ln.to === "/"
                          ? "text-gray-600 hover:bg-gradient-to-r hover:from-red-50/50 hover:to-red-100/30 hover:text-red-600 hover:scale-[1.01]"
                          : "text-gray-700 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100/50 hover:text-gray-800 hover:scale-[1.01]"
                    }`
                  }
                  style={({ isActive }) => (isActive ? { boxShadow: `inset 4px 0 0 ${accent}` } : {})}
                >
                  <Icon
                    className={`w-5 h-5 transition-all duration-300 ${
                      hoveredItem === ln.to ? "scale-110" : ""
                    } ${ln.to === "/" ? "group-hover:rotate-12" : ""}`}
                    style={{ color: ln.to === "/" ? "#dc2626" : accent }}
                  />
                  <span>{ln.label}</span>
                </NavLink>
              );
            })}
          </div>
        </nav>
      </aside>
    </>
  )
}

export default Sidebar