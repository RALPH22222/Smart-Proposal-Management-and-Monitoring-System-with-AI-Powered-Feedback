import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import Logo from "../assets/IMAGES/LOGO.png";

const COLORS = {
  brand: "#C8102E",
  white: "#FFFFFF",
  charcoal: "#333333",
};

const ProponentNavbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

    // Build context-specific menu items based on current route
    const location = useLocation();
    const path = location.pathname.toLowerCase();
    const onProfile = path.includes("/users/proponent/profile");
    const onSettings = path.includes("/users/proponent/settings");

    const menuItems = (() => {
      if (onProfile) {
        return [
          { label: "Home", to: "/users/Proponent/dashboard" },
          { label: "Settings", to: "/users/Proponent/settings" },
          { label: "Logout", to: "/login" },
        ];
      }
      if (onSettings) {
        return [
          { label: "Home", to: "/users/Proponent/dashboard" },
          { label: "Profile", to: "/users/Proponent/profile" },
          { label: "Logout", to: "/login" },
        ];
      }
      return [
        { label: "Profile", to: "/users/Proponent/profile" },
        { label: "Settings", to: "/users/Proponent/settings" },
        { label: "Logout", to: "/login" },
      ];
    })();

    return (
      <header
        className={`fixed top-0 w-full relative z-50 transition-shadow duration-300 border-b border-white/10 ${
          scrolled ? "shadow-md" : ""
        }`}
        style={{ backgroundColor: COLORS.brand }}
      >
        <div className="w-full px-0 sm:px-0 lg:px-0"> 
          <div className="flex items-center justify-between h-16">
            <a href="#home" className="flex items-center gap-2 pl-4"> 
              <img src={Logo} alt="Logo" className="h-10 w-10 object-contain" />
              <span
                className="text-lg md:text-xl font-semibold tracking-wide"
                style={{ color: COLORS.white }}
              >
                WMSU Project Proposal
              </span>
            </a>
            <div className="pr-4">
              <button
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Toggle menu"
                aria-expanded={isOpen}
                className="p-2 rounded-md hover:bg-white/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                style={{ color: COLORS.white }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        {isOpen && (
          <div className="absolute right-4 top-16 z-50">
            <div
              className="flex w-48 flex-col overflow-hidden rounded-lg bg-white shadow-xl ring-1 ring-gray-200"
            >
              {menuItems.map((item) => (
                <Link
                  key={item.label}
                  to={item.to}
                  className="px-3 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50 transition-colors text-right"
                  onClick={() => setIsOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </header>
    );
  };

  export default ProponentNavbar;
