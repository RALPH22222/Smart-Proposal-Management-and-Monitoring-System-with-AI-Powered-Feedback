import React from "react";
import { useLogos } from "../../context/LogoContext";
import { useAuthContext } from "../../context/AuthContext";
import SecureImage from "./SecureImage";
import {
  User,
  FileText,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  FileClock,
  FileCheck,
  UserCheck,
  ContactRound,
  Users,
  FlaskConical,
  Signature,
  Send,
  DollarSign,
  Microscope
} from "lucide-react";

interface MultiSidebarProps {
  currentRoleGroup?: string;
  currentPage: string;
  onPageChange: (roleGroup: string, page: string) => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
}

const MultiSidebar: React.FC<MultiSidebarProps> = ({
  currentRoleGroup = "proponent",
  currentPage,
  onPageChange,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
}) => {
  const { logos } = useLogos();
  const { logout, user } = useAuthContext();

  const handleLogout = () => {
    logout();
  };

  const userRoles = (user as any)?.roles || [];

  // Group navigations by Role
  const roleGroups = [
    {
      role: "proponent",
      title: "Proponent Menu",
      icon: FlaskConical,
      items: [
        { id: "profile", name: "Profile", icon: User },
        { id: "submission", name: "Submission", icon: Send },
        { id: "monitoring", name: "Monitoring", icon: BarChart3 },
      ]
    },
    {
      role: "evaluator",
      title: "Evaluator Menu",
      icon: UserCheck,
      items: [
        { id: "dashboard", name: "Dashboard", icon: BarChart3 },
        { id: "proposals", name: "Proposals", icon: FileText },
        { id: "review", name: "Review", icon: FileClock },
        { id: "reviewed", name: "Reviewed", icon: FileCheck },
      ]
    },
    {
      role: "rnd",
      title: "R&D Menu",
      icon: Microscope,
      items: [
        { id: "dashboard", name: "Dashboard", icon: BarChart3 },
        { id: "proposals", name: "Proposals", icon: FileText },
        { id: "evaluators", name: "Evaluators", icon: Users },
        { id: "endorsements", name: "Endorsements", icon: Signature },
        { id: "funding", name: "Funding", icon: DollarSign },
        { id: "monitoring", name: "Monitoring", icon: BarChart3 },
      ]
    }
  ];

  // Filter groups to only show what the user has access to
  const availableGroups = roleGroups.filter(g => userRoles.includes(g.role));

  const bottomLinks = [
    { id: "settings", name: "Settings", icon: Settings },
    { id: "logout", name: "Logout", icon: LogOut },
  ];

  const getFullName = () => {
    if (!user) return "User";
    const u: any = user;
    if (!u.first_name && !u.last_name) return u.email || "User";
    return `${u.first_name || ""} ${u.middle_ini ? `${u.middle_ini} ` : ""}${u.last_name || ""}`.trim();
  };

  const roleLabels: Record<string, string> = {
    proponent: "Proponent",
    evaluator: "Evaluator",
    rnd: "R&D Staff",
    admin: "Admin",
  };

  const roleOrderMap: Record<string, number> = {
    proponent: 1,
    evaluator: 2,
    rnd: 3,
    admin: 4,
  };

  const renderRolesBadgeContent = () => {
    const orderedRoles = [...userRoles].sort((a, b) => (roleOrderMap[a] || 99) - (roleOrderMap[b] || 99));

    return orderedRoles.map((role: string, index: number) => {
      const isCurrent = currentRoleGroup === role;
      const roleLabel = roleLabels[role] || role;
      
      // All roles use the same color when current
      const colorClass = isCurrent ? "text-[#C8102E] font-bold" : "text-slate-500 font-medium";

      return (
        <React.Fragment key={role}>
          <span className={`transition-colors duration-300 ${colorClass}`}>{roleLabel}</span>
          {index < orderedRoles.length - 1 && <span className="text-slate-400">, </span>}
        </React.Fragment>
      );
    });
  };

  return (
    <>
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-lg border border-gray-200 backdrop-blur-sm"
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
        className={`fixed lg:sticky top-0 h-screen w-72 bg-gradient-to-b from-white to-gray-50/50 border-r border-gray-200/60 shadow-lg backdrop-blur-sm flex flex-col z-40 transition-transform duration-300 ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }`}
      >
        <div className="flex-shrink-0 p-2">
          <div className="relative overflow-hidden px-4 py-3 rounded-xl border border-red-200" style={{ background: "linear-gradient(135deg, #fff1f2 0%, #fef2f2 60%, #fff 100%)" }}>
            <img
              src={logos.rdec_logo}
              alt="RDEC WMSU"
              className="absolute -right-2 -bottom-2 w-16 h-16 object-contain opacity-15 pointer-events-none select-none"
            />
            <div className="relative flex items-center gap-3 group">
              <div className="relative flex-shrink-0 cursor-pointer">
                <div className="relative w-12 h-12 bg-white rounded-xl p-[1.5px] shadow-sm border border-gray-100 transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-lg group-hover:border-[#C8102E]/30">
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
                  <div className="absolute -top-0.5 -left-0.5 w-2 h-2 border-t-2 border-l-2 border-[#C8102E] rounded-tl-[4px] opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:-top-1 group-hover:-left-1"></div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 border-b-2 border-r-2 border-[#C8102E] rounded-br-[4px] opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:-bottom-1 group-hover:-right-1"></div>
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-gray-900 truncate transition-colors duration-300 group-hover:text-[#C8102E]">{getFullName()}</p>
                <span className={`inline-flex items-center gap-1 mt-1 px-2 py-1 rounded-full text-[10px] bg-slate-100 border border-slate-200 shadow-sm transition-all duration-300`}>
                  <ContactRound className="w-3 h-3 text-slate-500" />
                  <span>{renderRolesBadgeContent()}</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-2 space-y-6 custom-scrollbar">
          {availableGroups.map((group) => {
            const GroupIcon = group.icon;
            const isGroupActive = currentRoleGroup === group.role;

            return (
              <div key={group.role} className="space-y-1">
                <h3 className={`flex items-center gap-2 px-2 text-xs font-bold mb-2 ${isGroupActive ? 'text-[#C8102E]' : 'text-slate-400'}`}>
                  <GroupIcon className="w-4 h-4" />
                  {group.title}
                </h3>
                {group.items.map((item) => {
                  const isActive = isGroupActive && currentPage === item.id;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onPageChange(group.role, item.id);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`cursor-pointer group relative flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 transform w-full text-left ${
                          isActive
                          ? "bg-[#C8102E] text-white shadow-md"
                          : isGroupActive 
                            ? "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                            : "text-slate-400 hover:bg-gray-50 hover:text-gray-900"
                        }`}
                    >
                      <Icon className={`w-5 h-5 transition-all duration-200 ${
                        isActive 
                          ? "text-white" 
                          : isGroupActive
                            ? "text-gray-500 group-hover:text-gray-900" 
                            : "text-slate-300 group-hover:text-gray-900"}`} />
                      <span>{item.name}</span>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </nav>

        <div className="flex-shrink-0 px-4 pt-2 pb-4 border-t border-gray-200/60 space-y-1">
          {bottomLinks.map((item) => {
            const Icon = item.icon;
            const isActive = currentRoleGroup === 'system' && currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.id === "logout") {
                    handleLogout();
                  } else {
                    onPageChange('system', item.id);
                  }
                  setIsMobileMenuOpen(false);
                }}
                className={`cursor-pointer group relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 transform w-full text-left ${isActive
                    ? "bg-[#C8102E] text-white shadow-md"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }`}
              >
                <Icon
                  className={`w-5 h-5 transition-all duration-200 ${isActive
                      ? "text-white"
                      : item.id === "logout"
                        ? "text-red-600 group-hover:text-red-700"
                        : "text-gray-500 group-hover:text-gray-900"
                    }`}
                />
                <span className={`${item.id === "logout" && !isActive ? "text-red-600 font-bold" : ""}`}>
                  {item.name}
                </span>
              </button>
            );
          })}
        </div>
      </aside>
    </>
  );
};

export default MultiSidebar;