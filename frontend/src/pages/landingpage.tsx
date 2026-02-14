import React, { useState, useEffect, useRef } from "react";
import Navbar from '../components/navbar';
import Footer from '../components/footer';
import CardSwap, { Card } from '../components/CardSwap';
import templatePDF from '../assets/template/DOST-Template.pdf';
import { ClipboardCheck, Clock, Bell, Mail, FileCheck, AlertCircle } from 'lucide-react';

const useCountUp = (end: number, duration: number = 2000, shouldStart: boolean = false) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!shouldStart) return;

    let startTime: number | null = null;
    const startValue = 0;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);

      setCount(Math.floor(progress * (end - startValue) + startValue));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [end, duration, shouldStart]);

  return count;
};

// Intersection Observer hook for scroll animations
const useInView = (options?: IntersectionObserverInit) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsInView(true);
      }
    }, { threshold: 0.1, ...options });

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, []);

  return { ref, isInView };
};

const mobileCards = [
  {
    step: 1,
    title: "Proposal Submission",
    color: "red-400",
    desc: "Submit your project proposal using the standardized DOST Form 1B template. Ensure all required documents are attached for faster processing.",
  },
  {
    step: 2,
    title: "Review & Approval",
    color: "red-500",
    desc: "Our research committee will review your proposal, provide feedback, and approve compliant submissions. Track progress in real-time through your dashboard.",
  },
  {
    step: 3,
    title: "Implementation",
    color: "red-600",
    desc: "Once approved, proceed with project implementation. Use our portal to submit progress reports, request support, and manage project milestones.",
  },
];

function MobileCardSwap() {
  const [current, setCurrent] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % mobileCards.length);
    }, 3500);
    return () => clearInterval(timer);
  }, []);
  return (
    <div className="block sm:hidden relative h-[340px] flex items-center justify-center">
      {mobileCards.map((card, idx) => (
        <div
          key={card.step}
          className={`absolute left-0 right-0 mx-auto w-[98%] bg-white rounded-2xl shadow-2xl border border-red-200 transition-all duration-500 ease-in-out
            ${idx === current ? 'z-20 opacity-100 scale-100 translate-y-0' : 'z-10 opacity-0 scale-95 translate-y-6 pointer-events-none'}`}
          style={{ top: 32 }}
        >
          <div className="flex gap-4 items-start p-6">
            <div className={`w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0`}>
              <span className={`text-${card.color} font-bold text-lg`}>{card.step}</span>
            </div>
            <div className="flex-1">
              <h3 className={`text-xl font-bold mb-2 text-${card.color}`}>{card.title}</h3>
              <p className="text-gray-700 text-base">{card.desc}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Animated stat component
interface AnimatedStatProps {
  value: number;
  suffix: string;
  label: string;
  shouldStart: boolean;
}

const AnimatedStat: React.FC<AnimatedStatProps> = ({ value, suffix, label, shouldStart }) => {
  const count = useCountUp(value, 2000, shouldStart);

  return (
    <div className="text-center sm:text-left transform hover:scale-105 transition-transform duration-300">
      <p className="text-2xl font-bold text-gray-800">
        {count}{suffix}
      </p>
      <p className="text-sm text-gray-600">{label}</p>
    </div>
  );
};

{/* Gais kung may di kayo nagustuhan sabi lang sakin then kung meron kayo di alam sa code ko sabi lang if may time ako turuan ko lang how ga work*/ }
const LandingPage: React.FC = () => {
  const heroSection = useInView();
  const aboutSection = useInView();
  const statsSection = useInView();
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900 overflow-x-hidden">
      {/* CSS Animations */}
      <style>{`
        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeInLeft {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes fadeInRight {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }
        
        @keyframes blob {
          0%, 100% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }
        
        .animate-fade-in-down {
          animation: fadeInDown 0.8s ease-out forwards;
        }
        
        .animate-fade-in-up {
          animation: fadeInUp 0.8s ease-out forwards;
        }
        
        .animate-fade-in-left {
          animation: fadeInLeft 1s ease-out forwards;
        }
        
        .animate-fade-in-right {
          animation: fadeInRight 1s ease-out forwards;
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        
        .animate-blob {
          animation: blob 7s infinite;
        }
        
        .animation-delay-200 {
          animation-delay: 200ms;
        }
        
        .animation-delay-400 {
          animation-delay: 400ms;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>

      <Navbar />
      <section className="pt-24 pb-16 bg-gradient-to-br from-white via-white to-gray-50 relative overflow-hidden">
        {/* Animated background shapes */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-red-100 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-red-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-red-50 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>

        <div ref={heroSection.ref} className="max-w-7xl mx-auto px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
          {/* Text Content */}
          <div className={`order-2 lg:order-1 transition-all duration-1000 ${heroSection.isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className="mb-2 animate-fade-in-down">
              <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-red-50 text-red-700 border border-red-200">
                Western Mindanao State University
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-5xl font-bold leading-tight mb-6 animate-fade-in-up">
              <span className="text-transparent bg-clip-text">
                <span className="text-gray-800">WMSU</span>{' '}
                <span className="font-bold mb-6 bg-gradient-to-r from-gray-800 to-red-700 bg-clip-text text-transparent">Project Proposal</span>
              </span>
            </h1>
            <p className="text-lg md:text-xl text-gray-600 mb-8 leading-relaxed animate-fade-in-up animation-delay-200">
              A streamlined admin and monitoring system for project proposals —
              <span className="font-medium text-gray-800"> fast, responsive, and intuitive</span>.
              Experience seamless navigation and effortless proposal management with our user-centric design.</p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mb-12 animate-fade-in-up animation-delay-400">
              <a
                href="/login"
                className="group inline-flex items-center justify-center px-7 py-3.5 rounded-lg font-medium transition-all duration-300 shadow-md hover:shadow-lg text-white focus:outline-none focus:ring-2 focus:ring-red-300 focus:ring-offset-2 transform hover:-translate-y-0.5"
                style={{ backgroundColor: '#C8102E' }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#A00D26'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#C8102E'}
              >
                <span>Get Started</span>
                <svg className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
                </svg>
              </a>
              <a
                href="#about"
                className="group inline-flex items-center justify-center px-7 py-3.5 rounded-lg font-medium transition-all duration-300 border-2 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-300 focus:ring-offset-2 transform hover:-translate-y-0.5"
                style={{ borderColor: '#C8102E', color: '#C8102E' }}
              >
                <span>Learn More</span>
                <svg className="ml-2 w-4 h-4 transition-transform group-hover:translate-y-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </a>
            </div>

            {/* Stats Section with Animated Counters */}
            <div ref={statsSection.ref} className={`mt-12 pt-8 border-t border-gray-200 transition-all duration-1000 ${statsSection.isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <div className="flex flex-wrap gap-8">
                <AnimatedStat value={200} suffix="+" label="Research Proposals" shouldStart={statsSection.isInView} />
                <AnimatedStat value={84} suffix="%" label="Funding Success Rate" shouldStart={statsSection.isInView} />
                <AnimatedStat value={300} suffix="+" label="Total Proponents" shouldStart={statsSection.isInView} />
              </div>
            </div>
          </div>

          {/* Image Gallery with staggered animation */}
          <div className={`order-1 lg:order-2 relative transition-all duration-1000 delay-200 ${heroSection.isInView ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}>
            <div className="grid grid-cols-2 gap-4 md:gap-6">
              <div className="space-y-4 md:space-y-6 animate-fade-in-left">
                <div className="overflow-hidden rounded-2xl shadow-lg transform transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:rotate-1">
                  <img
                    src="https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?q=80&auto=format&fit=crop&w=1200&h=600"
                    alt="Lecture hall with students"
                    className="w-full h-44 sm:h-48 lg:h-56 object-cover transition-transform duration-700 hover:scale-110"
                  />
                </div>
                <div className="overflow-hidden rounded-2xl shadow-lg transform transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:rotate-1">
                  <img
                    src="https://naomidsouza.com/wp-content/uploads/2024/01/How-to-write-a-research-paper.webp"
                    alt="Data research and analysis on computer screens"
                    className="w-full max-w-2xl object-cover rounded-xl transition-transform duration-700 hover:scale-110"
                  />
                </div>
              </div>
              <div className="pt-8 md:pt-12 animate-fade-in-right animation-delay-200">
                <div className="overflow-hidden rounded-2xl shadow-lg transform transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:-rotate-1">
                  <img
                    src="https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?q=80&auto=format&fit=crop&w=1600&h=600"
                    alt="University library interior"
                    className="w-full h-80 sm:h-72 lg:h-96 object-cover transition-transform duration-700 hover:scale-110"
                  />
                </div>
              </div>
            </div>

            {/* Decorative elements with floating animation */}
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-red-100 rounded-full opacity-70 -z-10 animate-float"></div>
            <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-red-50 rounded-full opacity-60 -z-10 animate-float animation-delay-2000"></div>
          </div>
        </div>
      </section>
      <section id="about" className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div ref={aboutSection.ref} className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className={`bg-white rounded-2xl shadow-xl p-8 md:p-12 grid grid-cols-1 lg:grid-cols-3 gap-8 items-center transform hover:shadow-[0_20px_50px_rgba(128,0,0,0.15)] transition-all duration-1000 ${aboutSection.isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>         <div className="lg:col-span-2">
            <div className="mb-3">
              <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-red-50 text-red-700 border border-red-200 mb-4">
                About Our Office
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-gray-800 to-red-700 bg-clip-text text-transparent leading-relaxed">
              Research Development & Evaluation Center
            </h2>
            <p className="text-lg text-gray-600 mb-6 leading-relaxed">
              The central hub RDEC for research excellence at Western Mindanao State University.
              We facilitate innovative research projects, provide administrative support,
              and ensure compliance with academic standards and funding requirements.
            </p>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                <span className="text-sm text-gray-600">Proposal Guidance</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                <span className="text-sm text-gray-600">Funding Support</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                <span className="text-sm text-gray-600">Compliance Monitoring</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                <span className="text-sm text-gray-600">Research Ethics</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href="mailto:research@wmsu.edu.ph"
                className="inline-flex items-center justify-center px-6 py-3 rounded-lg font-medium transition-all duration-300 shadow-md hover:shadow-lg text-white text-center bg-[#C8102E] focus:outline-none focus:ring-2 focus:ring-red-300 focus:ring-offset-2"
                style={{ backgroundColor: '#C8102E' }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#A00D26'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#C8102E'}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Contact Our Office
              </a>
              <a
                href="#services"
                className="inline-flex items-center justify-center px-6 py-3 rounded-lg font-medium transition-all duration-300 border-2 hover:bg-red-50 text-center focus:outline-none focus:ring-2 focus:ring-red-300 focus:ring-offset-2"
                style={{ borderColor: '#C8102E', color: '#C8102E' }}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                View Services
              </a>
            </div>
          </div>

            <div className="relative">
              <div className="w-full h-64 lg:h-80 rounded-xl overflow-hidden shadow-lg">
                <img
                  src="https://media.philstar.com/photos/2021/05/13/wmsu-campus_2021-05-13_15-03-21.jpg"
                  alt="WMSU Campus View"
                  className="object-cover w-full h-full transform hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-red-100 rounded-full opacity-80 -z-10"></div>
              <div className="absolute -top-4 -left-4 w-16 h-16 bg-red-50 rounded-full opacity-60 -z-10"></div>
            </div>
          </div>
        </div>
      </section>

      <section id="interactive" className="py-20 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            {/* Left Side - PDF Template & Description */}
            <div className="order-2 lg:order-1">
              <div className="mb-3">
                <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-red-50 text-red-700 border border-red-200">
                  Proposal Template
                </span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6 bg-gradient-to-r from-gray-800 to-red-700 bg-clip-text text-transparent">
                Research Proposal Template
              </h2>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                Use our standardized DOST Form 1B template to ensure your research proposal meets all requirements.
                This template follows the official CAPSULE Research & Development Proposal format for proper documentation and faster approval.
              </p>

              {/* PDF Preview Card */}
              <div className="bg-white rounded-2xl shadow-xl p-6 transform hover:shadow-[0_20px_50px_rgba(128,0,0,0.15)] transition-all duration-300 border border-gray-100">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800">DOST Form 1B Template</h3>
                    <p className="text-gray-600 text-sm">CAPSULE Research & Development Proposal</p>
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                    <span className="text-sm text-gray-600">Standardized format for faster review</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                    <span className="text-sm text-gray-600">Includes all required sections</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                    <span className="text-sm text-gray-600">Compliant with DOST guidelines</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <a
                    href={templatePDF}
                    download
                    className="inline-flex items-center justify-center px-6 py-3 rounded-lg font-medium transition-all duration-300 shadow-md hover:shadow-lg text-white text-center flex-1 bg-[#C8102E] focus:outline-none focus:ring-2 focus:ring-red-300 focus:ring-offset-2"
                    style={{ backgroundColor: '#C8102E' }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#A00D26'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#C8102E'}
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download Template
                  </a>
                  <a
                    href="/src/assets/template/DOST-Template.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center px-6 py-3 rounded-lg font-medium transition-all duration-300 border-2 hover:bg-red-50 text-center flex-1 focus:outline-none focus:ring-2 focus:ring-red-300 focus:ring-offset-2"
                    style={{ borderColor: '#C8102E', color: '#C8102E' }}
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    View Template
                  </a>
                </div>
              </div>
            </div>

            {/* Right Side - Interactive Cards */}
            <div className="order-1 lg:order-2">
              <div className="mb-3">
                <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-red-50 text-red-700 border border-red-200">
                  Submission Process
                </span>
              </div>
              <h3 className="text-3xl md:text-4xl font-bold mb-6 bg-gradient-to-r from-gray-800 to-red-700 bg-clip-text text-transparent">
                How It Works
              </h3>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                Follow these simple steps to submit and manage your research proposal through our platform.
              </p>

              {/* Mobile: Animated swapping cards */}
              <MobileCardSwap />

              {/* Tablet and Desktop: CardSwap */}
              <div className="hidden sm:flex mt-8 items-center justify-center">
                <div className="relative h-[320px] w-full max-w-md overflow-visible">
                  <CardSwap
                    cardDistance={30}
                    verticalDistance={40}
                    delay={5000}
                    pauseOnHover={true}
                    skewAmount={5}
                  >
                    <Card
                      customClass="p-6 bg-white text-gray-900 shadow-2xl rounded-xl flex gap-4 items-start border w-full"
                      style={{ height: 260, borderColor: 'rgba(200,16,46,0.12)' }}
                    >
                      <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-red-600 font-bold text-lg">1</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold mb-3" style={{ color: '#C8102E' }}>Proposal Submission</h3>
                        <p className="text-gray-600 leading-relaxed">Submit your project proposal using the standardized DOST Form 1B template. Ensure all required documents are attached for faster processing.</p>
                      </div>
                    </Card>

                    <Card
                      customClass="p-6 bg-white text-gray-900 shadow-2xl rounded-xl flex gap-4 items-start border w-full"
                      style={{ height: 260, borderColor: 'rgba(200,16,46,0.12)' }}
                    >
                      <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-red-600 font-bold text-lg">2</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold mb-3" style={{ color: '#C8102E' }}>Review & Approval</h3>
                        <p className="text-gray-600 leading-relaxed">Our research committee will review your proposal, provide feedback, and approve compliant submissions. Track progress in real-time through your dashboard.</p>
                      </div>
                    </Card>

                    <Card
                      customClass="p-6 bg-white text-gray-900 shadow-2xl rounded-xl flex gap-4 items-start border w-full"
                      style={{ height: 260, borderColor: 'rgba(200,16,46,0.12)' }}
                    >
                      <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-red-600 font-bold text-lg">3</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold mb-3" style={{ color: '#C8102E' }}>Implementation</h3>
                        <p className="text-gray-600 leading-relaxed">Once approved, proceed with project implementation. Use our portal to submit progress reports, request support, and manage project milestones.</p>
                      </div>
                    </Card>
                  </CardSwap>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Submission Guidelines Section - Unique Editorial Design */}
      <section className="py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">

            {/* Left Column: Sticky Title & Intro */}
            <div className="lg:col-span-4 lg:sticky lg:top-32 self-start">
              <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-red-50 text-red-700 border border-red-200 mb-6">
                Essentials
              </span>
              <h2 className="text-3xl md:text-4xl font-bold mb-6 bg-gradient-to-r from-gray-800 to-red-700 bg-clip-text text-transparent leading-relaxed">
                Submission Guidelines & Requirements
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed mb-8">
                Your roadmap to a successful proposal submission. Follow these core requirements to ensure a smooth approval process.
              </p>

              {/* Pro Tip Integrated on Left */}
              <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 hidden lg:block">
                <div className="flex items-center gap-3 mb-3">
                  <AlertCircle className="text-[#C8102E] w-5 h-5" />
                  <span className="font-bold text-gray-900">Pro Tip</span>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Gather your CVs, consent forms, and research instruments <span className="font-semibold text-[#C8102E]">before</span> you start to avoid timeouts or errors.
                </p>
              </div>
            </div>

            {/* Right Column: The List (No Cards) */}
            <div className="lg:col-span-8 space-y-12">
              {/* Item 1 */}
              <div className="flex flex-col sm:flex-row gap-6 group">
                <div className="shrink-0">
                  <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center text-[#C8102E] group-hover:scale-110 transition-transform duration-300">
                    <ClipboardCheck size={32} />
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-[#C8102E] transition-colors">Complete Documentation</h3>
                  <p className="text-gray-600 text-lg leading-relaxed">
                    Incomplete attachments lead to automatic rejection. Ensure every required file is uploaded before you hit submit.
                  </p>
                </div>
              </div>
              <hr className="border-gray-100" />

              {/* Item 2 */}
              <div className="flex flex-col sm:flex-row gap-6 group">
                <div className="shrink-0">
                  <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center text-[#C8102E] group-hover:scale-110 transition-transform duration-300">
                    <Clock size={32} />
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-[#C8102E] transition-colors">7-Day Revision Window</h3>
                  <p className="text-gray-600 text-lg leading-relaxed">
                    Feedback received? You have exactly <span className="font-semibold text-gray-900">7 working days</span> to resubmit your revised proposal. Plan your timeline carefully.
                  </p>
                </div>
              </div>
              <hr className="border-gray-100" />

              {/* Item 3 */}
              <div className="flex flex-col sm:flex-row gap-6 group">
                <div className="shrink-0">
                  <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center text-[#C8102E] group-hover:scale-110 transition-transform duration-300">
                    <Bell size={32} />
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-[#C8102E] transition-colors">Stay Updated</h3>
                  <p className="text-gray-600 text-lg leading-relaxed">
                    We notify via portal & email. Check your spam folder regularly so you don't miss critical updates about your proposal.
                  </p>
                </div>
              </div>
              <hr className="border-gray-100" />

              {/* Item 4 */}
              <div className="flex flex-col sm:flex-row gap-6 group">
                <div className="shrink-0">
                  <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center text-[#C8102E] group-hover:scale-110 transition-transform duration-300">
                    <Mail size={32} />
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-[#C8102E] transition-colors">Official Channels Only</h3>
                  <p className="text-gray-600 text-lg leading-relaxed">
                    All communication happens inside the portal. Avoid direct emails for procedural steps. Keep it official and documented.
                  </p>
                </div>
              </div>

              {/* Mobile Only Pro Tip */}
              <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 lg:hidden mt-8">
                <div className="flex items-center gap-3 mb-3">
                  <AlertCircle className="text-[#C8102E] w-5 h-5" />
                  <span className="font-bold text-gray-900">Pro Tip</span>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Gather your CVs, consent forms, and research instruments <span className="font-semibold text-[#C8102E]">before</span> you start.
                </p>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* Evaluation Criteria Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-red-50 text-red-700 border border-red-200 mb-4">
              Our Standards
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-gray-900 via-[#C8102E] to-gray-800 bg-clip-text text-transparent">
              Evaluation Criteria
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Learn how proposals are judged to ensure your project meets the highest standards for approval and funding.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Relevance to Institutional Goals */}
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 hover:shadow-xl transition-all duration-300 hover:border-red-200">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Relevance to Institutional Goals</h3>
              <p className="text-gray-600 leading-relaxed">
                Proposals must align with WMSU's strategic objectives, addressing key priorities in education, research, and community development that support the university's mission and vision.
              </p>
            </div>

            {/* Originality and Innovation */}
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 hover:shadow-xl transition-all duration-300 hover:border-red-200">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Originality and Innovation</h3>
              <p className="text-gray-600 leading-relaxed">
                Projects should demonstrate creative thinking, novel approaches, and innovative solutions that contribute new knowledge or improve existing practices in their respective fields.
              </p>
            </div>

            {/* Methodological Soundness */}
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 hover:shadow-xl transition-all duration-300 hover:border-red-200">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Methodological Soundness</h3>
              <p className="text-gray-600 leading-relaxed">
                Research designs and implementation plans must be scientifically rigorous, appropriate for the objectives, and demonstrate clear, logical methodology for data collection and analysis.
              </p>
            </div>

            {/* Feasibility */}
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 hover:shadow-xl transition-all duration-300 hover:border-red-200">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Feasibility</h3>
              <p className="text-gray-600 leading-relaxed">
                Projects must be realistically achievable within proposed timelines, budgets, and available resources, with clear implementation plans and capable project teams.
              </p>
            </div>

            {/* Ethical Compliance */}
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 hover:shadow-xl transition-all duration-300 hover:border-red-200">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Ethical Compliance</h3>
              <p className="text-gray-600 leading-relaxed">
                All research must adhere to WMSU's ethical standards, ensuring participant safety, data privacy, intellectual property rights, and responsible conduct of research.
              </p>
            </div>

            {/* Budget Justification */}
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 hover:shadow-xl transition-all duration-300 hover:border-red-200">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Budget Justification</h3>
              <p className="text-gray-600 leading-relaxed">
                Budget allocations must be reasonable, well-documented, and directly support project objectives, with clear justification for all expenses and cost-effective resource utilization.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured
     <section id="featured" className="py-20 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-red-50 text-red-700 border border-red-200 mb-4">
            Featured Content
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-gray-800 to-red-700 bg-clip-text text-transparent">
            Explore Our Resources
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Discover the latest research highlights, important announcements, and successful projects from our community.
          </p>
        </div>     

        <div className="grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {[
            {
              title: 'Proposal Highlights',
              description: 'Browse through successful research proposals and get inspired for your next project submission.',
              image: 'https://img.freepik.com/free-photo/colleagues-doing-team-work-project_23-2149361602.jpg?semt=ais_hybrid&w=740&q=80',
              link: '#interactive'
            },
            {
              title: 'Office Notices',
              description: 'Stay updated with the latest announcements, deadlines, and important updates from the research office.',
              image: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?q=80&auto=format&fit=crop&w=1200&h=600',
              link: '#about'
            },
            {
              title: 'Top Projects',
              description: 'Explore groundbreaking research projects that have made significant impact in their respective fields.',
              image: 'https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?q=80&auto=format&fit=crop&w=1200&h=600',
              link: '#featured'
            }
          ].map((item, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl shadow-lg overflow-hidden transform transition-all duration-300 hover:-translate-y-2 hover:shadow-xl border border-gray-100 border-b-4 border-b-red-700"
            >
              <div className="relative overflow-hidden">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-48 object-cover transform transition-transform duration-500 hover:scale-105"
                />
                <div className="absolute top-4 left-4">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-md">
                    <span className="text-red-600 font-bold text-lg">{i + 1}</span>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-3" style={{ color: '#C8102E' }}>
                  {item.title}
                </h3>
                <p className="text-gray-600 mb-4 leading-relaxed">
                  {item.description}
                </p>
                <div className="mt-4">
                  <a
                    href={item.link}
                    className="inline-flex items-center justify-center px-4 py-2 rounded-lg font-medium transition-all duration-300 hover:shadow-md bg-[#C8102E] focus:outline-none focus:ring-2 focus:ring-red-300 focus:ring-offset-2"
                    style={{ backgroundColor: '#C8102E', color: '#fff' }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#A00D26'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#C8102E'}
                  >
                    <span>Learn More</span>
                    <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/>
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section> */}
      <Footer />
    </div>
  );
};

export default LandingPage;
