"use client"

import { useState } from "react"
import { Link, Outlet, useLocation } from "react-router-dom"
import {
  LogOut,
  LayoutDashboard,
  FileText,
  Bell,
  Settings,
  Menu,
  X,
  User,
  ChevronRight,
  CheckCircle,
} from "lucide-react"

export default function RdecPage() {
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const menuItems = [
    {
      name: "Dashboard",
      path: "/users/rdec/dashboard",
      icon: <LayoutDashboard size={20} />,
      description: "Overview and analytics",
    },
    {
      name: "Proposals",
      path: "/users/rdec/proposals",
      icon: <FileText size={20} />,
      description: "Research proposals",
    },
    {
      name: "Endorsed Proposals",
      path: "/users/rdec/endorsed",
      icon: <CheckCircle size={20} />,
      description: "Forwarded for funding",
    },
    {
      name: "Notifications",
      path: "/users/rdec/notifications",
      icon: <Bell size={20} />,
      description: "Updates and alerts",
    },
    {
      name: "Settings",
      path: "/users/rdec/settings",
      icon: <Settings size={20} />,
      description: "Account preferences",
    },
  ]

  const getCurrentPageName = () => {
    const currentItem = menuItems.find((item) => item.path === location.pathname)
    return currentItem?.name || "Dashboard"
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-white/95 backdrop-blur-sm border-r border-gray-200/50 shadow-xl transform transition-transform duration-300 ease-in-out flex flex-col ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        {/* Header */}
        <div className="px-6 py-6 border-b border-gray-200/50 bg-gradient-to-r from-[#C8102E]/5 to-[#C8102E]/10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-bold text-[#C8102E] text-xl tracking-tight">RDEC Portal</h1>
              <p className="text-sm text-gray-600 mt-1">Research & Development</p>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* User Profile Section */}
        <div className="px-6 py-4 border-b border-gray-200/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#C8102E] to-[#C8102E]/80 rounded-full flex items-center justify-center">
              <User size={18} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 truncate">Sarah Johnson</p>
              <p className="text-sm text-gray-600 truncate">Senior Researcher</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`group flex items-center gap-4 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${isActive ? "bg-gradient-to-r from-[#C8102E]/10 to-[#C8102E]/5 text-[#C8102E] shadow-sm border border-[#C8102E]/20" : "text-gray-700 hover:bg-gray-50 hover:text-[#C8102E]"}`}
              >
                <div
                  className={`p-2 rounded-lg transition-colors ${isActive ? "bg-[#C8102E]/10 text-[#C8102E]" : "bg-gray-100 text-gray-600 group-hover:bg-[#C8102E]/10 group-hover:text-[#C8102E] transition-colors"}`}
                >
                  {item.icon}
                </div>
                <div className="flex-1">
                  <div className="font-medium">{item.name}</div>
                  <div className="text-xs text-gray-500 group-hover:text-gray-600">{item.description}</div>
                </div>
                {isActive && <ChevronRight size={16} className="text-[#C8102E]" />}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200/50 bg-gray-50/50">
          <button className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-gray-700 hover:bg-white hover:text-[#C8102E] text-sm font-medium transition-all duration-200 group">
            <div className="p-2 rounded-lg bg-gray-100 text-gray-600 group-hover:bg-[#C8102E]/10 group-hover:text-[#C8102E] transition-colors">
              <LogOut size={16} />
            </div>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top bar */}
        <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 px-6 py-4 shadow-sm flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Menu size={20} />
              </button>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{getCurrentPageName()}</h2>
                <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                  <span>RDEC Portal</span>
                  <ChevronRight size={14} />
                  <span>{getCurrentPageName()}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-gray-900">Sarah Johnson</p>
                <p className="text-xs text-gray-600">Senior Researcher</p>
              </div>
              <div className="w-8 h-8 bg-gradient-to-br from-[#C8102E] to-[#C8102E]/80 rounded-full flex items-center justify-center">
                <User size={16} className="text-white" />
              </div>
            </div>
          </div>
        </header>

        {/* Main content area */}
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
