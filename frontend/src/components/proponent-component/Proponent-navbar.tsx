import React, { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Logo from "../../assets/IMAGES/LOGO.png";
import { useAuthContext } from "../../context/AuthContext";

const COLORS = {
  brand: "#C8102E",
  brandLight: "#E03A52",
  white: "#FFFFFF",
  charcoal: "#333333",
  lightGray: "#f8f9fa",
};

// --- ICONS (Kept as provided) ---
const SubmissionIcon = ({ isActive }: { isActive: boolean }) => (
  <svg
    className={`w-6 h-6 ${isActive ? "text-white" : "text-white"}`}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
    />
  </svg>
);

const ProfileIcon = ({ isActive }: { isActive: boolean }) => (
  <svg
    className={`w-6 h-6 ${isActive ? "text-white" : "text-white"}`}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
    />
  </svg>
);

const SettingsIcon = ({ isActive }: { isActive: boolean }) => (
  <svg
    className={`w-6 h-6 ${isActive ? "text-white" : "text-white"}`}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
    />
  </svg>
);

const LogoutIcon = ({ isActive }: { isActive: boolean }) => (
  <svg
    className={`w-6 h-6 transition-colors duration-300 ${
      isActive ? "text-white" : "text-white" // Changed to always be white for mobile menu compatibility
    }`}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
    />
  </svg>
);

// New Menu Icons
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

const ProponentNavbar: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeLink, setActiveLink] = useState("submission");
  const [pageSubtitle, setPageSubtitle] = useState("Proponent Submission");
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuthContext();

  const handleScroll = useCallback(() => {
    requestAnimationFrame(() => {
      setScrolled(window.scrollY > 10);
    });
  }, []);

  useEffect(() => {
    const currentPath = location.pathname.toLowerCase();
    if (currentPath.includes("/submission")) {
      setActiveLink("submission");
      setPageSubtitle("Proponent Submission");
    } else if (currentPath.includes("/dashboard")) {
      setActiveLink("dashboard");
      setPageSubtitle("Proponent Profile");
    } else if (currentPath.includes("/settings")) {
      setActiveLink("settings");
      setPageSubtitle("Proponent Settings");
    } else {
      setActiveLink("submission");
      setPageSubtitle("Proponent Submission");
    }

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll, location]);

  const handleLogout = async () => {
    logout();
  };

  const navItems = [
    { name: "Submission", icon: SubmissionIcon, href: "/users/proponent/submission" },
    { name: "Dashboard", icon: ProfileIcon, href: "/users/proponent/dashboard" },
    { name: "Settings", icon: SettingsIcon, href: "/users/proponent/settings" },
  ];

  const handleNavClick = (item: string, href: string) => {
    setActiveLink(item.toLowerCase());
    setIsMobileMenuOpen(false); // Close menu on click
    navigate(href);
  };

  return (
    <>
      <header
        role="banner"
        className={`fixed top-0 w-full z-50 transition-all duration-500 ease-out ${
          scrolled || isMobileMenuOpen
            ? "bg-brand shadow-xl"
            : "bg-brand shadow-lg"
        }`}
        style={{ backgroundColor: COLORS.brand }}
      >
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            
            {/* Logo Area */}
            <a
              href="/users/proponent/submission"
              className="flex items-center gap-3 group focus:outline-none focus:ring-2 focus:ring-brandLight focus:ring-offset-2 z-50"
              onClick={(e) => {
                e.preventDefault();
                handleNavClick("submission", "/users/proponent/submission");
              }}
            >
              <div className="relative">
                <img
                  src={Logo}
                  alt="WMSU Logo"
                  className="h-8 w-8 lg:h-10 lg:w-10 object-contain group-hover:scale-110 transition-transform duration-300 group-hover:shadow-lg group-hover:shadow-brand/50"
                />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-base lg:text-lg font-bold tracking-tight text-white">
                  <span className="hidden lg:inline">WMSU Project Proposal</span>
                  <span className="inline lg:hidden">WMSU Project Proposal</span>
                </span>
                <span className="text-xs lg:text-sm opacity-80 text-white hidden sm:block">
                  {pageSubtitle}
                </span>
              </div>
            </a>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-1 pr-4">
              {navItems.map((item) => {
                const isActive = activeLink === item.name.toLowerCase();
                return (
                  <a
                    key={item.name}
                    href={item.href}
                    onClick={(e) => { e.preventDefault(); handleNavClick(item.name, item.href); }}
                    className={`relative px-4 py-2 font-medium transition-all duration-300 rounded-md ${
                      isActive ? "font-bold text-white" : "text-white/90 hover:text-brandLight"
                    }`}
                  >
                    {item.name}
                    <span className={`absolute bottom-0 left-0 h-0.5 rounded-full transition-all duration-300 ${isActive ? "w-full bg-white" : "w-0 bg-brandLight"}`} />
                  </a>
                );
              })}
              <button
                onClick={handleLogout}
                className="ml-4 px-5 py-2 rounded-lg font-semibold bg-white text-charcoal hover:bg-brandLight hover:text-white transition-all shadow-md flex items-center gap-2"
              >
                {/* Use a dark icon for desktop white button */}
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                 </svg>
                <span>Logout</span>
              </button>
            </nav>

            {/* Mobile Hamburger Button */}
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
          style={{ backgroundColor: COLORS.brand }} // Using brand color for background
        >
          <div className="flex flex-col p-4 space-y-2">
            {navItems.map((item) => {
               const isActive = activeLink === item.name.toLowerCase();
               const IconComponent = item.icon;
               return (
                <a
                  key={item.name}
                  href={item.href}
                  onClick={(e) => { e.preventDefault(); handleNavClick(item.name, item.href); }}
                  className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-colors ${
                    isActive 
                      ? "bg-red-800 text-white font-bold shadow-inner" 
                      : "text-white/90 hover:bg-red-700"
                  }`}
                >
                  <IconComponent isActive={true} />
                  <span className="text-lg">{item.name}</span>
                </a>
               )
            })}
            
            <div className="h-px bg-red-800 my-2"></div>
            
            <button
              onClick={handleLogout}
              className="flex items-center gap-4 px-4 py-3 text-white/90 font-medium hover:bg-red-700 rounded-xl transition-colors w-full text-left"
            >
              <LogoutIcon isActive={true} />
              <span className="text-lg">Logout</span>
            </button>
          </div>
        </div>
      </header>
    </>
  );
};

export default ProponentNavbar;