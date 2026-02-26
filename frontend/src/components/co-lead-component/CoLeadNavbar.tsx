import React, { useState, useEffect, useCallback } from "react";
import Logo from "../../assets/IMAGES/WMSU.png";
import RdecLogo from "../../assets/IMAGES/RDEC-WMSU.png";
import { useAuthContext } from "../../context/AuthContext";

const COLORS = {
  brand: "#C8102E",
};

const ProfileIcon = () => (
  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const MonitoringIcon = () => (
  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const LogoutIcon = () => (
  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);

const MenuIcon = () => (
  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

const XIcon = () => (
  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

interface NavbarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

const CoLeadNavbar: React.FC<NavbarProps> = ({ currentPage, onPageChange }) => {
  const [scrolled, setScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { logout } = useAuthContext();

  const handleScroll = useCallback(() => {
    requestAnimationFrame(() => {
      setScrolled(window.scrollY > 10);
    });
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  const handleLogout = async () => {
    logout();
  };

  const navItems = [
    { id: "profile", name: "Profile", icon: ProfileIcon },
    { id: "projects", name: "My Projects", icon: MonitoringIcon },
  ];

  const getPageTitle = () => {
    if (currentPage === "profile") return "Co-Lead Dashboard";
    if (currentPage === "projects") return "My Projects";
    return "WMSU Project Proposal";
  };

  return (
    <header
      role="banner"
      className={`fixed top-0 w-full z-50 transition-all duration-500 ease-out ${
        scrolled || isMobileMenuOpen ? "bg-brand shadow-xl" : "bg-brand shadow-lg"
      }`}
      style={{ backgroundColor: COLORS.brand }}
    >
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo Area */}
          <a
            href="#"
            className="flex items-center gap-3 group focus:outline-none z-50"
            onClick={(e) => {
              e.preventDefault();
              onPageChange("profile");
            }}
          >
            <div className="relative flex items-center gap-2">
              <img src={Logo} alt="WMSU Logo" className="h-8 w-8 lg:h-10 lg:w-10 object-contain group-hover:scale-110 transition-transform duration-300" />
              <img src={RdecLogo} alt="RDEC-WMSU Logo" className="h-8 w-8 lg:h-10 lg:w-10 object-contain group-hover:scale-110 transition-transform duration-300" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-base lg:text-lg font-bold tracking-tight text-white">WMSU Project Proposal</span>
              <span className="text-xs lg:text-sm opacity-80 text-white hidden sm:block">{getPageTitle()}</span>
            </div>
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1 pr-4">
            {navItems.map((item) => {
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onPageChange(item.id)}
                  className={`cursor-pointer relative px-4 py-2 font-medium transition-all duration-300 rounded-md flex items-center gap-2 ${
                    isActive ? "font-bold text-white" : "text-white/90 hover:text-white"
                  }`}
                >
                  {item.name}
                  <span className={`absolute bottom-0 left-0 h-0.5 rounded-full transition-all duration-300 ${isActive ? "w-full bg-white" : "w-0"}`} />
                </button>
              );
            })}
            <button
              onClick={handleLogout}
              className="cursor-pointer ml-4 px-5 py-2 rounded-lg font-semibold bg-white text-red-800 hover:bg-red-800 hover:text-white transition-all shadow-md flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Logout</span>
            </button>
          </nav>

          {/* Mobile Hamburger */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-white hover:bg-white/10 rounded-lg transition-colors focus:outline-none z-50"
          >
            {isMobileMenuOpen ? <XIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      <div
        className={`md:hidden absolute top-16 left-0 w-full border-b border-red-800 shadow-xl transition-all duration-300 ease-in-out transform origin-top ${
          isMobileMenuOpen ? "scale-y-100 opacity-100" : "scale-y-0 opacity-0 h-0 overflow-hidden"
        }`}
        style={{ backgroundColor: COLORS.brand }}
      >
        <div className="flex flex-col p-4 space-y-2">
          {navItems.map((item) => {
            const isActive = currentPage === item.id;
            const IconComponent = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onPageChange(item.id);
                  setIsMobileMenuOpen(false);
                }}
                className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-colors w-full text-left ${
                  isActive ? "bg-red-800 text-white font-bold shadow-inner" : "text-white/90 hover:bg-red-700"
                }`}
              >
                <IconComponent />
                <span className="text-lg">{item.name}</span>
              </button>
            );
          })}
          <div className="h-px bg-red-800 my-2"></div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-4 px-4 py-3 text-white/90 font-medium hover:bg-red-700 rounded-xl transition-colors w-full text-left"
          >
            <LogoutIcon />
            <span className="text-lg">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default CoLeadNavbar;
