import React, { useRef, useState, useEffect } from "react";
import Navbar from "../components/navbar";
import Footer from "../components/footer";
import { MapPin, Phone, Mail, Clock, ShieldAlert, ChevronRight } from "lucide-react";

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

const Contacts: React.FC = () => {
  const heroSection = useInView();
  const contactSection = useInView();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans overflow-x-hidden">
      <Navbar />

      {/* Hero Section with animated background */}
      <section className="pt-24 pb-16 bg-gradient-to-br from-white via-white to-gray-50 relative overflow-hidden">
        {/* Animated background shapes */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-red-100 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-red-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-red-50 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>

        <div ref={heroSection.ref} className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className={`text-center transition-all duration-1000 ${heroSection.isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className="mb-3 md:mb-4 animate-fade-in-down">
              <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-red-50 text-red-700 border border-red-200">
                Connect With Us
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 px-4 animate-fade-in-up animation-delay-100">
              <span className="bg-gradient-to-r from-gray-800 to-red-700 bg-clip-text text-transparent">
                Research Support Center
              </span>
            </h1>
            <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed animate-fade-in-up animation-delay-200">
              Direct access to our research committee and support staff. Get comprehensive assistance
              for your project proposals and research initiatives at Western Mindanao State University.
            </p>
          </div>
        </div>
      </section>

      {/* --- MAIN CONTENT --- */}
      <section className="flex-1 py-16 bg-white relative">
        <div ref={contactSection.ref} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-start transition-all duration-1000 ${contactSection.isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>

            {/* Left Column: Contact Cards (Span 5) */}
            <div className="lg:col-span-5 space-y-6">

              {/* Card: Location */}
              <div className="group bg-white rounded-2xl p-6 sm:p-8 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] hover:shadow-xl border border-gray-100 transition-all duration-300 hover:-translate-y-1 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-red-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                <div className="flex items-start gap-6 relative z-10">
                  <div className="bg-red-100/80 p-4 rounded-2xl text-[#C8102E] shadow-sm">
                    <MapPin size={28} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Visit Our Office</h3>
                    <p className="text-gray-600 leading-relaxed">
                      Research & Development Center<br />
                      Western Mindanao State University<br />
                      Normal Road, Baliwasan, Zamboanga City
                    </p>
                    <div className="mt-3 text-sm font-medium text-[#C8102E] flex items-center gap-1">
                      2nd Floor, Admin Building <ChevronRight size={14} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Card: Phone & Email */}
              <div className="group bg-white rounded-2xl p-6 sm:p-8 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] hover:shadow-xl border border-gray-100 transition-all duration-300 hover:-translate-y-1">
                <div className="space-y-8">
                  {/* Phone */}
                  <div className="flex items-start gap-6">
                    <div className="bg-red-50 p-4 rounded-2xl text-[#C8102E] shadow-sm">
                      <Phone size={28} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">Call Us</h3>
                      <ul className="space-y-2 text-gray-600">
                        <li className="flex items-center justify-between gap-4"><span className="text-sm text-gray-500">Main</span> <span className="font-medium hover:text-[#C8102E] transition-colors cursor-pointer">+63 (62) 991-4567</span></li>
                        <li className="flex items-center justify-between gap-4"><span className="text-sm text-gray-500">Research Desk</span> <span className="font-medium hover:text-[#C8102E] transition-colors cursor-pointer">+63 (62) 991-4568</span></li>
                        <li className="flex items-center justify-between gap-4"><span className="text-sm text-gray-500">Proposal Hotline</span> <span className="font-medium hover:text-[#C8102E] transition-colors cursor-pointer">+63 (62) 991-4569</span></li>
                      </ul>
                    </div>
                  </div>

                  <div className="h-px bg-gray-100 w-full" />

                  {/* Email */}
                  <div className="flex items-start gap-6">
                    <div className="bg-red-50 p-4 rounded-2xl text-[#C8102E] shadow-sm">
                      <Mail size={28} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">Email Us</h3>
                      <ul className="space-y-2">
                        <li><a href="mailto:research@wmsu.edu.ph" className="text-gray-600 hover:text-[#C8102E] transition-colors font-medium hover:underline">research@wmsu.edu.ph</a></li>
                        <li><a href="mailto:proposals@wmsu.edu.ph" className="text-gray-600 hover:text-[#C8102E] transition-colors font-medium hover:underline">proposals@wmsu.edu.ph</a></li>
                        <li><a href="mailto:support@wmsu.edu.ph" className="text-gray-600 hover:text-[#C8102E] transition-colors font-medium hover:underline">research.support@wmsu.edu.ph</a></li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card: Office Hours */}
              <div className="group bg-white rounded-2xl p-6 sm:p-8 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] hover:shadow-xl border border-gray-100 transition-all duration-300 hover:-translate-y-1 relative overflow-hidden">
                <div className="flex items-start gap-6 relative z-10">
                  <div className="bg-red-50 p-4 rounded-2xl text-[#C8102E] shadow-sm">
                    <Clock size={28} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Office Hours</h3>
                    <ul className="space-y-3">
                      <li className="flex justify-between items-center text-sm">
                        <span className="text-gray-500">Monday - Friday</span>
                        <span className="text-gray-900 font-semibold bg-red-50 px-3 py-1 rounded-full text-xs text-red-700">8:00 AM - 5:00 PM</span>
                      </li>
                      <li className="flex justify-between items-center text-sm">
                        <span className="text-gray-500">Saturday</span>
                        <span className="text-gray-900 font-semibold bg-red-50 px-3 py-1 rounded-full text-xs text-red-700">9:00 AM - 12:00 PM</span>
                      </li>
                      <li className="flex justify-between items-center text-sm">
                        <span className="text-gray-500">Sunday</span>
                        <span className="text-gray-900 font-semibold bg-red-50 px-3 py-1 rounded-full text-xs text-red-700">Closed</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

            </div>

            {/* Right Column: Map & CTA (Span 7) */}
            <div className="lg:col-span-7 flex flex-col gap-6">

              {/* Map Container */}
              <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden h-[500px] lg:h-[600px] relative group transition-all duration-300 hover:shadow-2xl">
                <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur-md px-4 py-2 rounded-xl shadow-lg border border-gray-200/50">
                  <span className="flex items-center gap-2 text-gray-800 font-semibold text-sm">
                    <MapPin size={16} className="text-[#C8102E]" /> WMSU Main Campus
                  </span>
                </div>
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d979.0!2d122.06087!3d6.91359!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x325041dd7a24816f%3A0x51af215fb64cc81a!2sWestern%20Mindanao%20State%20University%20Research%20and%20Development%20Center!5e0!3m2!1sen!2sph!4v1738592748000!5m2!1sen!2sph"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="WMSU Research Center Map"
                  className="grayscale-0 hover:grayscale-0 transition-all duration-700"
                />
              </div>

              {/* Emergency CTA */}
              <a
                href="tel:+63629914570"
                className="group relative overflow-hidden bg-gradient-to-r from-[#C8102E] to-[#A00D26] rounded-2xl p-6 sm:p-8 text-white shadow-xl shadow-red-900/20 hover:shadow-2xl hover:shadow-red-900/30 transition-all duration-300 transform hover:-translate-y-1"
              >
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-16 -mt-32 transition-transform group-hover:scale-110"></div>
                <div className="relative z-10 flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-6">
                    <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-sm shadow-inner group-hover:bg-white/30 transition-colors">
                      <ShieldAlert size={36} className="animate-pulse" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold mb-1">Emergency Research Line</h3>
                      <p className="text-red-100 font-medium opacity-90">Available 24/7 for urgent matters</p>
                    </div>
                  </div>
                  <div className="text-2xl sm:text-3xl font-mono font-bold tracking-wider bg-black/20 px-4 py-2 rounded-lg backdrop-blur-sm">
                    +63 (62) 991-4570
                  </div>
                </div>
              </a>

            </div>
          </div>
        </div>
      </section>

      {/* --- CSS ANIMATIONS --- */}
      <style>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>

      <Footer />
    </div>
  );
};

export default Contacts;