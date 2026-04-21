import React, { useState, useRef, useEffect } from "react";
import { useLogos } from "../../context/LogoContext";
import { LayoutDashboard, CircleUser, Users, FileText, Settings, LogOut, Menu, X, File, BarChart3, Gavel, DollarSign, ScrollText, Database, ShieldCheck, Gauge, FilePlus, LayoutGrid, ClipboardList, ClipboardCheck } from "lucide-react";
import { useAuthContext } from "../../context/AuthContext";
import SecureImage from "../shared/SecureImage";

interface SidebarProps {
  currentPage: string;
  onPageChange: (_page: string) => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (_open: boolean) => void;
}



const AdminSidebar: React.FC<SidebarProps> = ({ currentPage, onPageChange, isMobileMenuOpen, setIsMobileMenuOpen }) => {
  const { logos } = useLogos();

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
    { id: "activity", label: "Activity Logs", icon: ScrollText },
    { id: "evaluator-performance", label: "Evaluator Performance", icon: Gauge },
    { id: "accounts", label: "Accounts", icon: CircleUser },
    { id: "contents", label: "Contents", icon: File },
    { id: "lookups", label: "Lookups", icon: Database },
    { id: "proposals", label: "Proposals", icon: FileText },
    { id: "proponent-submission", label: "Submit Proposal", icon: FilePlus },
    { id: "proponent-monitoring", label: "Proponent Monitoring", icon: LayoutGrid },
    { id: "evaluators", label: "Evaluators", icon: Users },
    { id: "eval-review", label: "Evaluation In-Review", icon: ClipboardList },
    { id: "eval-reviewed", label: "Reviewed Proposals", icon: ClipboardCheck },
    { id: "endorsements", label: "Endorsements", icon: Gavel },
    { id: "project-funding", label: "Project Funding", icon: DollarSign },
    { id: "monitoring", label: "Monitoring", icon: BarChart3 },
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
              src={logos.rdec_logo}
              alt="RDEC WMSU"
              className="absolute -right-2 -bottom-2 w-16 h-16 object-contain opacity-15 pointer-events-none select-none"
            />

            <div className="relative flex items-center gap-3 group">
              {/* Profile Photo with hover premium effects */}
              <div className="relative flex-shrink-0 cursor-pointer">
                {/* Main square container with hover lift animation */}
                <div className="relative w-12 h-12 bg-white rounded-xl p-[1.5px] shadow-sm border border-gray-100 transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-lg group-hover:border-[#C8102E]/30">
                  {/* Thin inner gradient border */}
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-[#C8102E] to-[#E03A52] p-[1.5px]">
                    <div className="h-full w-full bg-white rounded-[10px] overflow-hidden">
                      <SecureImage
                        src={user?.profile_photo_url}
                        fallbackSrc={`https://ui-avatars.com/api/?name=${encodeURIComponent(getFullName())}&background=C8102E&color=fff&size=128`}
                        alt={getFullName()}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    </div>
                  </div>

                  {/* Decorative corner accents with hover animation */}
                  <div className="absolute -top-0.5 -left-0.5 w-2 h-2 border-t-2 border-l-2 border-[#C8102E] rounded-tl-[4px] opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:-top-1 group-hover:-left-1"></div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 border-b-2 border-r-2 border-[#C8102E] rounded-br-[4px] opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:-bottom-1 group-hover:-right-1"></div>
                </div>
              </div>

              {/* Name & Role */}
              <div className="min-w-0 flex-1">
                <div ref={nameContainerRef} className="overflow-hidden">
                  <p ref={nameTextRef} className={`text-sm font-bold text-gray-900 whitespace-nowrap truncate transition-colors duration-300 group-hover:text-[#C8102E] ${shouldScrollName ? 'animate-marquee' : ''}`}>
                    {getFullName()}
                  </p>
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide bg-red-100 text-[#C8102E] border border-red-200 shadow-sm transition-all duration-300 group-hover:bg-[#C8102E] group-hover:text-white group-hover:border-[#C8102E]">
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