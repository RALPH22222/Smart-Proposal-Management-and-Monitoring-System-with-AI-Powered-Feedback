import React, { useState, useEffect } from "react";
import Logo from "../assets/IMAGES/LOGO.png";

const COLORS = {
  brand: "#C8102E",
  white: "#FFFFFF",
  charcoal: "#333333",
};

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 w-full z-50 transition-shadow duration-300 ${
        scrolled ? "shadow-md" : ""
      }`}
      style={{ backgroundColor: COLORS.brand }}
    >
      <div className="w-full px-0 sm:px-0 lg:px-0"> {/* Removed horizontal padding */}
        <div className="flex items-center justify-between h-16">
          {/* Logo and Title: Now flush left */}
          <a href="#home" className="flex items-center gap-2 pl-4"> 
            <img src={Logo} alt="Logo" className="h-10 w-10 object-contain" />
            <span
              className="text-lg md:text-xl font-semibold tracking-wide"
              style={{ color: COLORS.white }}
            >
              WMSU Project Proposal
            </span>
          </a>

          {/* Desktop Menu */}
          <nav className="hidden md:flex items-center space-x-8 pr-4">
            {["Home", "About", "Services", "Contact"].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="font-medium hover:opacity-80 transition"
                style={{ color: COLORS.white }}
              >
                {item}
              </a>
            ))}
            <a
              href="/login"
              className="px-4 py-2 rounded-md font-medium transition-opacity hover:opacity-90"
              style={{
                backgroundColor: COLORS.white,
                color: COLORS.charcoal,
              }}
            >
              Get Started
            </a>
          </nav>

          {/* Mobile Hamburger */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
            className="md:hidden p-2 pr-4"
            style={{ color: COLORS.white }}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {isOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Dropdown */}
      {isOpen && (
        <div className="md:hidden" style={{ backgroundColor: COLORS.brand }}>
          {["Home", "About", "Services", "Contact"].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase()}`}
              className="block px-4 py-3 text-white hover:bg-opacity-20 transition"
            >
              {item}
            </a>
          ))}
          <a
            href="#contact"
            className="m-4 block text-center px-4 py-2 rounded-md font-medium"
            style={{
              backgroundColor: COLORS.white,
              color: COLORS.charcoal,
            }}
          >
            Get Started
          </a>
        </div>
      )}
    </header>
  );
};

export default Navbar;
