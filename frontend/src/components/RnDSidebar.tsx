import React, { useState } from 'react';
import {
	LayoutDashboard,
	FileText,
	RefreshCw,
	CheckCircle,
	Users,
  Settings,
  LogOut,
  BarChart3
} from 'lucide-react';
import { type Statistics } from '../types/InterfaceProposal';

interface SidebarProps {
	currentPage: string;
	onPageChange: (page: string) => void;
	statistics: Statistics;
	isCollapsed?: boolean;
	isMobile?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({
	currentPage,
	onPageChange,
	isCollapsed = false,
	isMobile = false
}) => {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const accent = "#C10003";

  const mainLinks = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'proposals', label: 'Proposals', icon: FileText },
    { id: 'monitoring', label: 'Project Monitoring', icon: BarChart3 },
    { id: 'evaluators', label: 'Evaluators', icon: Users },
    { id: 'endorsements', label: 'Endorsements', icon: CheckCircle },
    { id: 'revisions', label: 'Revision Requests', icon: RefreshCw }
  ];

  const bottomLinks = [
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'logout', label: 'Logout', icon: LogOut },
  ];

  if (isCollapsed && !isMobile) {
    return (
      <aside className="fixed left-0 top-0 h-screen w-16 bg-gradient-to-b from-white to-gray-50/50 border-r border-gray-200/60 shadow-lg backdrop-blur-sm p-4 overflow-y-auto flex flex-col z-50">
        {/* Collapsed Header */}
        <div className="flex justify-center mb-8 p-3 rounded-xl bg-gradient-to-r from-red-50 to-red-50/30 border border-red-100/50 shadow-sm">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md"
            style={{
              backgroundColor: accent,
              background: `linear-gradient(135deg, ${accent} 0%, #A00E26 100%)`,
            }}
          >
            A
          </div>
        </div>

        <nav className="flex flex-col gap-2 flex-1">
          <div className="space-y-1">
            {mainLinks.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => onPageChange(item.id)}
                  onMouseEnter={() => setHoveredItem(item.id)}
                  onMouseLeave={() => setHoveredItem(null)}
                  className={`group relative flex items-center justify-center p-3 rounded-xl text-sm font-medium transition-all duration-300 transform ${
                    isActive
                      ? "bg-gradient-to-r from-red-50 to-red-100/50 text-red-700 shadow-md scale-[1.02] border border-red-200/50"
                      : "text-gray-700 hover:bg-gradient-to-r hover:from-red-50/50 hover:to-red-50/30 hover:text-red-600 hover:scale-[1.01] hover:shadow-sm"
                  }`}
                  title={item.label}
                  style={isActive ? { boxShadow: `inset 4px 0 0 ${accent}` } : {}}
                >
                  <div className="relative">
                    <Icon
                      className={`w-5 h-5 transition-all duration-300 ${hoveredItem === item.id ? "scale-110" : ""}`}
                      style={{ color: accent }}
                    />
                    <div
                      className={`absolute inset-0 w-5 h-5 rounded-full transition-opacity duration-300 ${
                        hoveredItem === item.id ? "opacity-20" : "opacity-0"
                      }`}
                      style={{ backgroundColor: accent, filter: "blur(8px)" }}
                    />
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-auto pt-4 border-t border-gray-200/60 space-y-1">
            {bottomLinks.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => onPageChange(item.id)}
                  onMouseEnter={() => setHoveredItem(item.id)}
                  onMouseLeave={() => setHoveredItem(null)}
                  className={`group relative flex items-center justify-center p-3 rounded-xl text-sm font-medium transition-all duration-300 transform ${
                    isActive
                      ? "bg-gradient-to-r from-red-50 to-red-100/50 text-red-700 shadow-md scale-[1.02]"
                      : item.id === "logout"
                        ? "text-gray-600 hover:bg-gradient-to-r hover:from-red-50/50 hover:to-red-100/30 hover:text-red-600 hover:scale-[1.01]"
                        : "text-gray-700 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100/50 hover:text-gray-800 hover:scale-[1.01]"
                  }`}
                  title={item.label}
                  style={isActive ? { boxShadow: `inset 4px 0 0 ${accent}` } : {}}
                >
                  <Icon
                    className={`w-5 h-5 transition-all duration-300 ${
                      hoveredItem === item.id ? "scale-110" : ""
                    } ${item.id === "logout" ? "group-hover:rotate-12" : ""}`}
                    style={{ color: item.id === "logout" ? "#dc2626" : accent }}
                  />
                </button>
              );
            })}
          </div>
        </nav>
      </aside>
    );
  }

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-gradient-to-b from-white to-gray-50/50 border-r border-gray-200/60 shadow-lg backdrop-blur-sm p-4 overflow-y-auto flex flex-col z-50">
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
            R&D
          </h3>
          <p className="text-xs text-gray-500 font-medium">Project Portal</p>
        </div>
      </div>

      <nav className="flex flex-col gap-2 flex-1">
        {/* Main Navigation Links with Enhanced Styling */}
        <div className="space-y-1">
          {mainLinks.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onPageChange(item.id)}
                onMouseEnter={() => setHoveredItem(item.id)}
                onMouseLeave={() => setHoveredItem(null)}
                className={`group relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 transform w-full text-left ${
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
              </button>
            );
          })}
        </div>

        {/* Enhanced Bottom Navigation */}
        <div className="mt-auto pt-4 border-t border-gray-200/60 space-y-1">
          {bottomLinks.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onPageChange(item.id)}
                onMouseEnter={() => setHoveredItem(item.id)}
                onMouseLeave={() => setHoveredItem(null)}
                className={`group relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 transform w-full text-left ${
                  isActive
                    ? "bg-gradient-to-r from-red-50 to-red-100/50 text-red-700 shadow-md scale-[1.02]"
                    : item.id === "logout"
                      ? "text-gray-600 hover:bg-gradient-to-r hover:from-red-50/50 hover:to-red-100/30 hover:text-red-600 hover:scale-[1.01]"
                      : "text-gray-700 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100/50 hover:text-gray-800 hover:scale-[1.01]"
                }`}
                style={isActive ? { boxShadow: `inset 4px 0 0 ${accent}` } : {}}
              >
                <Icon
                  className={`w-5 h-5 transition-all duration-300 ${
                    hoveredItem === item.id ? "scale-110" : ""
                  } ${item.id === "logout" ? "group-hover:rotate-12" : ""}`}
                  style={{ color: item.id === "logout" ? "#dc2626" : accent }}
                />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </aside>
  );
};

export default Sidebar;