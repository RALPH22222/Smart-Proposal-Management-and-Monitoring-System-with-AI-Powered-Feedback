import React from "react";
import { NavLink } from "react-router-dom";

const accent = "#C8102E";

const Sidebar: React.FC = () => {
  const links = [
    { to: "/users/admin/dashboardAdmin", label: "Dashboard", icon: DashboardIcon },
    { to: "/users/admin/accounts", label: "Accounts", icon: UserIcon },
    { to: "/users/admin/proposals", label: "Proposals", icon: FileIcon },
    { to: "/users/admin/notices", label: "Notices", icon: BellIcon },
    { to: "/users/admin/settings", label: "Settings", icon: CogIcon },
    { to: "/logout", label: "Logout", icon: LogoutIcon },
  ];

  return (
    <aside className="sticky top-0 h-screen w-64 bg-white border-r shadow-sm p-4 overflow-y-auto">
      <div className="flex items-center gap-3 mb-6">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
          style={{ backgroundColor: accent }}
        >
          A
        </div>
        <div>
          <h3 className="text-lg font-semibold" style={{ color: accent }}>
            WMSU Admin
          </h3>
          <p className="text-xs text-gray-500">Project Portal</p>
        </div>
      </div>

      <nav className="flex flex-col gap-1">
        {links.map((ln) => (
          <NavLink
            key={ln.to}
            to={ln.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                isActive
                  ? "bg-red-50 text-[color]"
                  : "text-gray-700 hover:bg-red-50"
              }`
            }
            style={({ isActive }) =>
              isActive ? { color: accent, boxShadow: `inset 3px 0 0 ${accent}` } : {}
            }
          >
            <ln.icon className="w-5 h-5" style={{ color: accent }} />
            <span>{ln.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

/* Simple SVG icons */
function DashboardIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <rect x="3" y="3" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="13" y="3" width="8" height="5" rx="1.2" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="13" y="10" width="8" height="11" rx="1.2" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="3" y="13" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  );
}
function UserIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <circle
        cx="12"
        cy="8"
        r="4"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M4 20c0-4 4-6 8-6s8 2 8 6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
function FileIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M14 3v6h6" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  );
}
function BellIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M15 17H9a4 4 0 0 1-4-4V9a6 6 0 1 1 12 0v4a4 4 0 0 1-2 3z" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  );
}
function CogIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M12 15.5A3.5 3.5 0 1 0 12 8.5a3.5 3.5 0 0 0 0 7z" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06A2 2 0 1 1 2.3 16.88l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09c.66 0 1.22-.4 1.51-1A1.65 1.65 0 0 0 4.3 6.08l-.06-.06A2 2 0 1 1 7.07 3.2l.06.06c.45.45 1.14.54 1.71.25.47-.24 1-.37 1.59-.37H12c.6 0 1.12.13 1.59.37.57.29 1.26.2 1.71-.25l.06-.06A2 2 0 1 1 19.7 4.3l-.06.06c-.45.45-.54 1.14-.25 1.71.24.47.37 1 .37 1.59V9c0 .6.13 1.12.37 1.59.29.57.2 1.26-.25 1.71l-.06.06z" stroke="currentColor" strokeWidth="1.2"/>
    </svg>
  );
}
function LogoutIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M16 17l5-5-5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M21 12H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M9 19H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export default Sidebar;
