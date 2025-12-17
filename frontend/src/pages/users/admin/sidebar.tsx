import React, { useState } from "react";
import { LayoutDashboard, Users, FileText, Bell, Settings, LogOut, Server, Menu, X, File, UserPen, BarChart3} from "lucide-react";
import { useAuthContext } from "../../../context/AuthContext";

interface SidebarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

const accent = "#C10003";

const AdminSidebar: React.FC<SidebarProps> = ({ currentPage, onPageChange }) => {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const { logout } = useAuthContext();

  const mainLinks = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "accounts", label: "Accounts", icon: Users },
    { id: "proposals", label: "Proposals", icon: FileText },
    { id: "evaluators", label: "Evaluators", icon: UserPen },
    { id: "monitoring", label: "Monitoring", icon: BarChart3 },
    { id: "contents", label: "Contents", icon: File },
    { id: "reports", label: "Reports", icon: Bell, badge: "5" },
    { id: "system", label: "System", icon: Server },
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
      {/* Mobile Menu Toggle Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-lg border border-gray-200"
        aria-label="Toggle menu"
      >
        {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 h-screen w-64 bg-gradient-to-b from-white to-gray-50/50 border-r border-gray-200/60 shadow-lg backdrop-blur-sm p-4 overflow-y-auto flex flex-col z-40 transition-transform duration-300 ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Header */}
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
              Admin
            </h3>
            <p className="text-xs text-gray-500 font-medium">Project Portal</p>
          </div>
        </div>

        <nav className="flex flex-col gap-2 flex-1">
          {/* Main Navigation Links */}
          <div className="space-y-1">
            {mainLinks.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onPageChange(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  onMouseEnter={() => setHoveredItem(item.id)}
                  onMouseLeave={() => setHoveredItem(null)}
                  className={`cursor-pointer group relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 transform w-full text-left ${
                    isActive
                      ? "bg-gradient-to-r from-red-50 to-red-100/50 text-red-700 shadow-md scale-[1.02] border border-red-200/50"
                      : "text-gray-700 hover:bg-gradient-to-r hover:from-red-50/50 hover:to-red-50/30 hover:text-red-600 hover:scale-[1.01] hover:shadow-sm"
                  }`}
                  style={isActive ? { boxShadow: `inset 4px 0 0 ${accent}` } : {}}
                >
                  <div className="relative">
                    <Icon
                      className={`w-5 h-5 transition-all duration-300 ${hoveredItem === item.id ? "scale-110" : ""}`}
                      style={{ color: accent }}
                    />
                    {/* Animated glow effect */}
                    <div
                      className={`absolute inset-0 w-5 h-5 rounded-full transition-opacity duration-300 ${
                        hoveredItem === item.id ? "opacity-20" : "opacity-0"
                      }`}
                      style={{ backgroundColor: accent, filter: "blur(8px)" }}
                    />
                  </div>
                  <span className="flex-1">{item.label}</span>
                  {item.badge && (
                    <span
                      className={`px-2 py-1 text-xs font-bold rounded-full transition-all duration-300 ${
                        item.badge === "!"
                          ? "bg-red-500 text-white animate-pulse"
                          : item.badge === "NEW"
                            ? "bg-gradient-to-r from-green-400 to-green-500 text-white"
                            : "bg-red-100 text-red-600"
                      } ${hoveredItem === item.id ? "scale-110" : ""}`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Bottom Links */}
          <div className="mt-auto pt-4 border-t border-gray-200/60 space-y-1">
            {bottomLinks.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if(item.id === "logout") {
                      handleLogout();
                    } else {
                      onPageChange(item.id);
                    }
                    setIsMobileMenuOpen(false);
                  }}
                  onMouseEnter={() => setHoveredItem(item.id)}
                  onMouseLeave={() => setHoveredItem(null)}
                  className={`cursor-pointer group relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 transform w-full text-left ${
                    isActive
                      ? "bg-gradient-to-r from-red-50 to-red-100/50 text-red-700 shadow-md scale-[1.02] border border-red-200/50"
                      : "text-gray-700 hover:bg-gradient-to-r hover:from-red-50/50 hover:to-red-50/30 hover:text-red-600 hover:scale-[1.01] hover:shadow-sm"
                  }`}
                  style={isActive ? { boxShadow: `inset 4px 0 0 ${accent}` } : {}}
                >
                  <div className="relative">
                    <Icon
                      className={`w-5 h-5 transition-all duration-300 ${hoveredItem === item.id ? "scale-110" : ""}`}
                      style={{ color: accent }}
                    />
                  </div>
                  <span className="flex-1">{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      </aside>
    </>
  );
};

export default AdminSidebar;