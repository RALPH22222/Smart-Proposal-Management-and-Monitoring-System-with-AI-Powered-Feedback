import React, { useState, useEffect, useCallback } from "react";
import Logo from "../assets/IMAGES/LOGO.png";

const COLORS = {
  brand: "#C8102E",
  brandLight: "#E03A52",
  white: "#FFFFFF",
  charcoal: "#333333",
  lightGray: "#f8f9fa",
};

const HomeIcon = ({ isActive }: { isActive: boolean }) => (
  <svg className={`w-6 h-6 ${isActive ? 'text-white' : 'text-white'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

const AboutIcon = ({ isActive }: { isActive: boolean }) => (
  <svg className={`w-6 h-6 ${isActive ? 'text-white' : 'text-white'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

// const ServicesIcon = ({ isActive }: { isActive: boolean }) => (
//   <svg className={`w-6 h-6 ${isActive ? 'text-white' : 'text-white'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
//     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
//   </svg>
// );

const ContactIcon = ({ isActive }: { isActive: boolean }) => (
  <svg className={`w-6 h-6 ${isActive ? 'text-white' : 'text-white'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const FAQIcon = ({ isActive }: { isActive: boolean }) => (
  <svg className={`w-6 h-6 ${isActive ? 'text-white' : 'text-white'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const Navbar: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [activeLink, setActiveLink] = useState("home");

  const handleScroll = useCallback(() => {
    requestAnimationFrame(() => {
      setScrolled(window.scrollY > 10);
      
      const currentPath = window.location.pathname;
      if (currentPath === '/about') {
        setActiveLink('about');
        return;
      }
      if (currentPath === '/contacts') {
        setActiveLink('contacts');
        return;
      }
      
      const sections = ["home", "faq"];
      const current = sections.find((section) => {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          return rect.top <= 50 && rect.bottom >= 50;
        }
        return false;
      });
      if (current) setActiveLink(current);
      else if (window.scrollY === 0 && currentPath === '/') setActiveLink("home");
    });
  }, []);

  useEffect(() => {
    // Set initial active link based on current path
    const currentPath = window.location.pathname;
    if (currentPath === '/about') {
      setActiveLink('about');
    // } else if (currentPath === '/services') {
    //   setActiveLink('services');  
    } else if (currentPath === '/contacts') {
      setActiveLink('contacts');
    } else if (currentPath === '/faqs') {
      setActiveLink('faq');
    } else if (currentPath === '/') {
      setActiveLink('home');
    }
    
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  const navItems = [
    { name: "Home", icon: HomeIcon, href: "/" },
    { name: "About", icon: AboutIcon, href: "/about" },
    // { name: "Services", icon: ServicesIcon, href: "#services" },
    { name: "Contacts", icon: ContactIcon, href: "/contacts" },
    { name: "FAQ", icon: FAQIcon, href: "/faqs" }
  ];

  const handleNavClick = (item: string, href: string) => {
    setActiveLink(item.toLowerCase());
    // For anchor links, let the default behavior handle scrolling
    if (href.startsWith('#')) {
      const element = document.getElementById(href.substring(1));
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
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
              href="/"
              className="flex items-center gap-3 group focus:outline-none focus:ring-2 focus:ring-brandLight focus:ring-offset-2"
              onClick={() => handleNavClick("home", "/")}
              aria-label="Home - WMSU Project Proposal"
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
                   Research Oversight Ethics Committee
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
                    onClick={() => handleNavClick(item.name, item.href)}
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
              {/* Get Started Button */}
              <a
                href="/login"
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
                Get Started
              </a>
            </nav>

            {/* Mobile Get Started Button */}
            <a
              href="/login"
              className="md:hidden px-4 py-2 rounded-lg font-semibold transition-all duration-300 flex items-center gap-2 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-brandLight"
              style={{
                backgroundColor: COLORS.white,
                color: COLORS.charcoal,
              }}
            >
              <span className="text-xs">Get Started</span>
            </a>
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
                onClick={() => handleNavClick(item.name, item.href)}
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

export default Navbar;