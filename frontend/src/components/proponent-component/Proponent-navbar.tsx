import React, { useState, useEffect, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Logo from "../../assets/IMAGES/LOGO.png";

const COLORS = {
  brand: "#C8102E",
  brandLight: "#E03A52",
  white: "#FFFFFF",
  charcoal: "#333333",
  lightGray: "#f8f9fa",
};

const SubmissionIcon = ({ isActive }: { isActive: boolean }) => (
  <svg className={`w-6 h-6 ${isActive ? 'text-white' : 'text-white'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

const ProfileIcon = ({ isActive }: { isActive: boolean }) => (
  <svg className={`w-6 h-6 ${isActive ? 'text-white' : 'text-white'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const SettingsIcon = ({ isActive }: { isActive: boolean }) => (
  <svg className={`w-6 h-6 ${isActive ? 'text-white' : 'text-white'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const LogoutIcon = ({ isActive }: { isActive: boolean }) => (
  <svg
    className={`w-6 h-6 transition-colors duration-300 ${
      isActive ? 'text-white' : 'text-red-800 group-hover:text-white'
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

const ProponentNavbar: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [activeLink, setActiveLink] = useState("submission");
  const [pageSubtitle, setPageSubtitle] = useState("Proponent Submission");
  const location = useLocation();
  const navigate = useNavigate();

  const handleScroll = useCallback(() => {
    requestAnimationFrame(() => {
      setScrolled(window.scrollY > 10);
    });
  }, []);

  useEffect(() => {
    // Set active link and subtitle based on current path
    const currentPath = location.pathname.toLowerCase();

    if (currentPath.includes("/submission")) {
      setActiveLink("submission");
      setPageSubtitle("Proponent Submission");
    } else if (currentPath.includes("/profile")) {
      setActiveLink("profile");
      setPageSubtitle("Proponent Profile");
    } else if (currentPath.includes("/settings")) {
      setActiveLink("settings");
      setPageSubtitle("Proponent Settings");
    } else {
      // Default case
      setActiveLink("submission");
      setPageSubtitle("Proponent Submission");
    }

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll, location]);

  const handleLogout = () => {
    // Add logout logic here
    console.log("Logging out...");
    navigate("/");
  };

  const navItems = [
    { name: "Submission", icon: SubmissionIcon, href: "/users/proponent/submission" },
    { name: "Profile", icon: ProfileIcon, href: "/users/proponent/profile" },
    { name: "Settings", icon: SettingsIcon, href: "/users/proponent/settings" },
  ];

  const handleNavClick = (item: string, href: string) => {
    setActiveLink(item.toLowerCase());
    navigate(href);
  };

  return (
    <>
      {/* Top Bar */}
      <header
        role="banner"
        className={`fixed top-0 w-full z-50 transition-all duration-500 ease-out ${
          scrolled ? "backdrop-blur-md bg-brand/95 shadow-xl" : "bg-brand shadow-lg"
        }`}
        style={{ backgroundColor: COLORS.brand }}
      >
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo and Title */}
            <a
              href="/users/proponent/submission"
              className="flex items-center gap-3 group focus:outline-none focus:ring-2 focus:ring-brandLight focus:ring-offset-2"
              onClick={() => handleNavClick("submission", "/users/proponent/submission")}
              aria-label="Submission - WMSU Project Proposal"
            >
              <div className="relative">
                <img
                  src={Logo}
                  alt="WMSU Project Proposal Logo"
                  className="h-8 w-8 lg:h-10 lg:w-10 object-contain group-hover:scale-110 transition-transform duration-300 group-hover:shadow-lg group-hover:shadow-brand/50"
                />
              </div>
               <div className="flex flex-col leading-tight">
                 <span
                   className="text-base lg:text-lg font-bold tracking-tight"
                   style={{ color: COLORS.white }}
                 >
                   <span className="hidden lg:inline">WMSU Project Proposal</span>
                   <span className="inline lg:hidden">WMSU ProjProp</span>
                 </span>
                 <span
                   className="text-xs lg:text-sm opacity-80 hidden lg:block"
                   style={{ color: COLORS.white }}
                 >
                   {pageSubtitle}
                 </span>
               </div>
            </a>

            {/* Desktop Menu */}
            <nav role="navigation" className="hidden md:flex items-center space-x-1 pr-4">
              {navItems.map((item) => {
                const lowerItem = item.name.toLowerCase();
                const isActive = activeLink === lowerItem;

                return (
                  <a
                    key={item.name}
                    href={item.href}
                    className={`relative px-4 py-2 font-medium transition-all duration-300 group focus:outline-none focus:ring-2 focus:ring-white/50 rounded-md ${
                      isActive ? "font-bold text-white" : "text-white/90 hover:text-brandLight"
                    }`}
                    aria-current={isActive ? "page" : undefined}
                    onClick={(e) => {
                      e.preventDefault();
                      handleNavClick(item.name, item.href);
                    }}
                  >
                    {item.name}
                    {/* Sliding Underline for Hover/Active */}
                    <span
                      className={`absolute bottom-0 left-0 h-0.5 rounded-full transition-all duration-300 ${
                        isActive ? "w-full bg-white" : "w-0 bg-brandLight group-hover:w-full"
                      }`}
                    />
                  </a>
                );
              })}

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="ml-4 px-4 py-1.5 rounded-lg font-semibold transition-all duration-300 flex items-center gap-2 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-brandLight focus:ring-offset-2 focus:ring-offset-brand/20 md:px-5 md:py-2 lg:px-6 lg:py-3"
                style={{
                  backgroundColor: COLORS.white,
                  color: COLORS.charcoal,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = COLORS.brandLight;
                  e.currentTarget.style.color = COLORS.white;
                  e.currentTarget.style.boxShadow = `0 4px 12px ${COLORS.brand}/20`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = COLORS.white;
                  e.currentTarget.style.color = COLORS.charcoal;
                  e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
                }}
              >
                <LogoutIcon isActive={false} />
                <span className="hidden lg:inline">Logout</span>
              </button>
            </nav>

            {/* Mobile Logout Button */}
            <button
              onClick={handleLogout}
              className="md:hidden px-2 py-2 rounded-lg font-semibold transition-all duration-300 flex items-center gap-2 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-brandLight"
              style={{
                backgroundColor: COLORS.white,
                color: COLORS.charcoal,
              }}
            >
              <LogoutIcon isActive={false} />
              <span className="text-xs">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-red-700 shadow-2xl"
        style={{ backgroundColor: COLORS.brand }}
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="flex justify-around items-center">
          {navItems.map((item) => {
            const lowerItem = item.name.toLowerCase();
            const isActive = activeLink === lowerItem;
            const IconComponent = item.icon;

            return (
              <a
                key={item.name}
                href={item.href}
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick(item.name, item.href);
                }}
                className={`flex flex-col items-center py-3 px-2 flex-1 min-w-0 transition-all duration-200 ${
                  isActive
                    ? "text-white bg-red-800"
                    : "text-white/90 hover:bg-red-800"
                }`}
                aria-current={isActive ? "page" : undefined}
              >
                <div className={`mb-1 transition-transform duration-200 ${
                  isActive ? "scale-110" : "scale-100"
                }`}>
                  <IconComponent isActive={isActive} />
                </div>
                <span className={`text-xs font-medium truncate max-w-full ${
                  isActive ? "font-bold" : "font-normal"
                }`}>
                  {item.name}
                </span>
              </a>
            );
          })}
        </div>
      </nav>

      {/* Add padding to prevent content from being hidden behind bottom nav */}
      <style>{`
        @media (max-width: 767px) {
          body {
            padding-bottom: 80px;
          }
        }
      `}</style>
    </>
  );
};

export default ProponentNavbar;
