import React, { useState } from "react";
import {
  Menu,
  X,
  LayoutDashboard,
  FileText,
  CheckCircle,
  RefreshCw,
  Settings,
  LogOut,
  Bell,
} from "lucide-react";
import { useAuthContext } from "../../context/AuthContext";

interface SidebarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

const accent = "#C10003";

const Sidebar: React.FC<SidebarProps> = ({ currentPage, onPageChange }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const { logout, user } = useAuthContext();

  const getFullName = () => {
    if (!user) return "User";
    const u: any = user;
    if (!u.first_name && !u.last_name) return u.email || "User";
    return `${u.first_name || ''} ${u.middle_ini ? u.middle_ini + ' ' : ''}${u.last_name || ''}`.trim();
  };

  const avatarUrl = user?.profile_photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(getFullName())}&background=C8102E&color=fff&size=128`;

  // Define navigation items with IDs
  const mainLinks = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
    },
    {
      id: "proposals",
      label: "Proposals",
      icon: FileText
    },
    {
      id: "review",
      label: "Under Review",
      icon: RefreshCw
    },
    {
      id: "reviewed",
      label: "Completed Reviews",
      icon: CheckCircle,
    },
    {
      id: "notifications",
      label: "Notifications",
      icon: Bell,
      badge: "4",
    },
  ];

  const bottomLinks = [
    { id: "settings", label: "Settings", icon: Settings },
    { id: "logout", label: "Logout", icon: LogOut },
  ];

  const handleLogout = () => {
    logout();
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-lg border border-gray-200"
        aria-label="Toggle menu"
      >
        {isMobileMenuOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <Menu className="w-6 h-6" />
        )}
      </button>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:sticky top-0 h-screen w-64 bg-gradient-to-b from-white to-gray-50/50 border-r border-gray-200/60 shadow-lg backdrop-blur-sm p-4 overflow-y-auto flex flex-col z-40 transition-transform duration-300 ${isMobileMenuOpen
          ? "translate-x-0"
          : "-translate-x-full lg:translate-x-0"
          }`}
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-8 p-3 rounded-xl bg-gradient-to-r from-red-50 to-red-50/30 border border-red-100/50 shadow-sm">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md transform transition-transform duration-300 hover:scale-110 hover:rotate-3 overflow-hidden"
            style={{
              backgroundColor: accent,
              background: `linear-gradient(135deg, ${accent} 0%, #A00002 100%)`,
            }}
          >
            <img src={avatarUrl} alt={getFullName()} className="w-full h-full object-cover" />
          </div>
          <div>
            <h3 className="text-xl font-bold bg-gradient-to-r from-red-600 to-red-700 bg-clip-text text-transparent">
              Evaluator
            </h3>
            <p className="text-xs text-gray-500 font-medium">Project Portal</p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex flex-col gap-2 flex-1">
          <div className="space-y-1">
            {mainLinks.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onPageChange(item.id);
                    setIsMobileMenuOpen(false); // Close mobile menu
                  }}
                  className={`cursor-pointer group relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 w-full text-left ${isActive
                    ? "bg-[#C8102E] text-white shadow-md"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                >
                  <div className="relative">
                    <Icon
                      className={`w-5 h-5 transition-all duration-200 ${isActive ? "text-white" : "text-gray-500 group-hover:text-gray-900"}`}
                    />
                  </div>
                  <span className="flex-1">{item.label}</span>
                  {item.badge && (
                    <span
                      className={`px-2 py-1 text-xs font-bold rounded-full transition-all duration-300 ${item.badge === "!"
                        ? "bg-red-500 text-white animate-pulse"
                        : item.badge === "NEW"
                          ? "bg-gradient-to-r from-green-400 to-green-500 text-white"
                          : "bg-red-100 text-red-600"
                        } ${isActive ? "" : "bg-red-100 text-red-600"}`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Bottom Navigation */}
          <div className="mt-auto pt-4 border-t border-gray-200/60 space-y-1">
            {bottomLinks.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.id === "logout") {
                      handleLogout();
                    } else {
                      onPageChange(item.id);
                    }
                    setIsMobileMenuOpen(false);
                  }}
                  className={`cursor-pointer group relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 w-full text-left ${isActive
                    ? "bg-[#C8102E] text-white shadow-md"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                >
                  <Icon
                    className={`w-5 h-5 transition-all duration-200 ${isActive ? "text-white" : item.id === "logout" ? "text-red-600 group-hover:text-red-700" : "text-gray-500 group-hover:text-gray-900"
                      }`}
                  />
                  <span className={`${item.id === "logout" && !isActive ? "text-red-600 font-bold" : ""}`}>{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
