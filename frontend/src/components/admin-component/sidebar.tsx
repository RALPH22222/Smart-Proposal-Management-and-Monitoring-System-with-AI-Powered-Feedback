import React, { useState, useRef, useEffect } from "react";
import { LayoutDashboard, CircleUser, Users, FileText, Settings, LogOut, Menu, X, File, BarChart3, Gavel, DollarSign, ScrollText, Database, ShieldCheck } from "lucide-react";
import rdecLogo from "../../assets/IMAGES/RDEC-WMSU.png";
import { useAuthContext } from "../../context/AuthContext";
import SecureImage from "../shared/SecureImage";

interface SidebarProps {
  currentPage: string;
  onPageChange: (_page: string) => void;
}



const AdminSidebar: React.FC<SidebarProps> = ({ currentPage, onPageChange }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const { logout, user } = useAuthContext();

  const getFullName = () => {
    if (!user) return "User";
    const u: any = user;
    if (!u.first_name && !u.last_name) return u.email || "User";
    return `${u.first_name || ''} ${u.middle_ini ? u.middle_ini + ' ' : ''}${u.last_name || ''}`.trim();
  };



  const nameContainerRef = useRef<HTMLDivElement | null>(null);
  const nameTextRef = useRef<HTMLDivElement | null>(null);
  const [shouldScrollName, setShouldScrollName] = useState(false);

  useEffect(() => {
    const container = nameContainerRef.current;
    const text = nameTextRef.current;
    if (!container || !text) return;
    setShouldScrollName(text.scrollWidth > container.clientWidth);
  }, [user?.first_name]);

  const mainLinks = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "accounts", label: "Accounts", icon: CircleUser },
    { id: "proposals", label: "Proposals", icon: FileText },
    { id: "evaluators", label: "Evaluators", icon: Users },
    { id: "endorsements", label: "Endorsements", icon: Gavel },
    { id: "project-funding", label: "Project Funding", icon: DollarSign },
    { id: "monitoring", label: "Monitoring", icon: BarChart3 },
    { id: "lookups", label: "Lookups", icon: Database },
    { id: "contents", label: "Contents", icon: File },
    { id: "activity", label: "Activity Logs", icon: ScrollText },
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
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          50% { transform: translateX(-30%); }
          100% { transform: translateX(0); }
        }
        .animate-marquee { display: inline-block; animation: marquee 8s linear infinite; }
      `}</style>
      <aside
        className={`fixed lg:sticky top-0 h-screen w-64 bg-gradient-to-b from-white to-gray-50/50 border-r border-gray-200/60 shadow-lg backdrop-blur-sm flex flex-col z-40 transition-transform duration-300 ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }`}
      >
        {/* Header — fixed, never scrolls */}
        <div className="flex-shrink-0 p-2">
          <div className="relative overflow-hidden px-4 py-3 rounded-xl border-1 border-red-200" style={{ background: "linear-gradient(135deg, #fff1f2 0%, #fef2f2 60%, #fff 100%)" }}>
            {/* Logo watermark */}
            <img
              src={rdecLogo}
              alt="RDEC WMSU"
              className="absolute -right-2 -bottom-2 w-16 h-16 object-contain opacity-15 pointer-events-none select-none"
            />

            <div className="relative flex items-center gap-3">
              {/* Avatar with ring + online dot */}
              <div className="relative flex-shrink-0">
                <div className="w-12 h-12 rounded-full ring-2 ring-[#C8102E]/30 ring-offset-2 ring-offset-white overflow-hidden shadow-md">
                  <SecureImage
                    src={user?.profile_photo_url}
                    fallbackSrc={`https://ui-avatars.com/api/?name=${encodeURIComponent(getFullName())}&background=C8102E&color=fff&size=128`}
                    alt={getFullName()}
                    className="w-full h-full object-cover"
                  />
                </div>
                {/* Online indicator */}
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-white rounded-full shadow-sm" />
              </div>

              {/* Name & Role */}
              <div className="min-w-0 flex-1">
                <div ref={nameContainerRef} className="overflow-hidden">
                  <p ref={nameTextRef} className={`text-sm font-bold text-gray-900 whitespace-nowrap truncate ${shouldScrollName ? 'animate-marquee' : ''}`}>
                    {getFullName()}
                  </p>
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide bg-red-100 text-[#C8102E] border border-red-200">
                    <ShieldCheck className="w-2.5 h-2.5" />
                    Admin
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Nav Body — only this scrolls */}
        <nav className="flex-1 overflow-y-auto px-4 py-2 space-y-1 custom-scrollbar">
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
              </button>
            );
          })}
        </nav>

        {/* Footer — fixed, never scrolls */}
        <div className="flex-shrink-0 px-4 pt-2 pb-4 border-t border-gray-200/60 space-y-1">
          {bottomLinks.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            const isLogout = item.id === "logout";

            return (
              <button
                key={item.id}
                onClick={() => {
                  if (isLogout) {
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
                <div className="relative">
                  <Icon
                    className={`w-5 h-5 transition-all duration-200 ${isActive
                      ? "text-white"
                      : isLogout
                        ? "text-red-600"
                        : "text-gray-500 group-hover:text-gray-900"
                      }`}
                  />
                </div>
                <span className={`flex-1 ${isLogout && !isActive ? "text-red-600 font-bold" : ""}`}>{item.label}</span>
              </button>
            );
          })}
        </div>
      </aside>

    </>
  );
};

export default AdminSidebar;