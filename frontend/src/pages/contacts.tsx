import React, { useRef, useState, useEffect } from "react";
import Navbar from "../components/navbar";
import Footer from "../components/footer";

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
    <div className="min-h-screen bg-gray-50 flex flex-col overflow-x-hidden">
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
        
        @keyframes pulse-slow {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.8;
          }
        }
        
        .animate-fade-in-down {
          animation: fadeInDown 0.8s ease-out forwards;
        }
        
        .animate-fade-in-up {
          animation: fadeInUp 0.8s ease-out forwards;
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        
        .animate-blob {
          animation: blob 7s infinite;
        }
        
        .animate-pulse-slow {
          animation: pulse-slow 3s ease-in-out infinite;
        }
        
        .animation-delay-100 {
          animation-delay: 100ms;
        }
        
        .animation-delay-200 {
          animation-delay: 200ms;
        }
        
        .animation-delay-300 {
          animation-delay: 300ms;
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

      {/* Contact Content with scroll animations */}
      <section className="flex-1 py-16 bg-white">
        <div ref={contactSection.ref} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start transition-all duration-1000 ${contactSection.isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>

            {/* Contact Details with staggered animations */}
            <div className="space-y-10">

              {/* Location */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 sm:p-8 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 hover:scale-100 animate-fade-in-up animation-delay-100">
                <div className="flex items-start gap-4 sm:gap-6">
                  <div className="bg-red-100 p-3 rounded-xl flex-shrink-0 transform hover:rotate-12 hover:scale-110 transition-all duration-300">
                    <svg className="w-6 h-6 text-red-600 animate-pulse-slow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg sm:text-xl mb-2">Research Office Location</h3>
                    <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                      Research and Development Center<br />
                      Western Mindanao State University<br />
                      Normal Road, Baliwasan, Zamboanga City<br />
                      <span className="text-red-600 font-semibold">2nd Floor, Administration Building</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Telephone */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 sm:p-8 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 hover:scale-100 animate-fade-in-up animation-delay-200">
                <div className="flex items-start gap-4 sm:gap-6">
                  <div className="bg-red-100 p-3 rounded-xl flex-shrink-0 transform hover:rotate-12 hover:scale-110 transition-all duration-300">
                    <svg className="w-6 h-6 text-red-600 animate-pulse-slow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg sm:text-xl mb-2">Telephone Lines</h3>
                    <ul className="text-gray-600 text-sm sm:text-base space-y-1">
                      <li className="hover:text-red-600 transition-colors duration-200"><span className="font-medium">Main Office:</span> +63 (62) 991-4567</li>
                      <li className="hover:text-red-600 transition-colors duration-200"><span className="font-medium">Research Desk:</span> +63 (62) 991-4568</li>
                      <li className="hover:text-red-600 transition-colors duration-200"><span className="font-medium">Proposal Hotline:</span> +63 (62) 991-4569</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Email */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 sm:p-8 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 hover:scale-100 animate-fade-in-up animation-delay-300">
                <div className="flex items-start gap-4 sm:gap-6">
                  <div className="bg-red-100 p-3 rounded-xl flex-shrink-0 transform hover:rotate-12 hover:scale-110 transition-all duration-300">
                    <svg className="w-6 h-6 text-red-600 animate-pulse-slow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg sm:text-xl mb-2">Email Communications</h3>
                    <ul className="text-gray-600 text-sm sm:text-base space-y-1">
                      <li>
                        <span className="font-medium">General Inquiries:</span>{" "}
                        <span className="text-red-600 font-semibold hover:underline">research@wmsu.edu.ph</span>
                      </li>
                      <li>
                        <span className="font-medium">Proposal Submissions:</span>{" "}
                        <span className="text-red-600 font-semibold hover:underline">proposals@wmsu.edu.ph</span>
                      </li>
                      <li>
                        <span className="font-medium">Technical Support:</span>{" "}
                        <span className="text-red-600 font-semibold hover:underline">research.support@wmsu.edu.ph</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Office Hours */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 sm:p-8 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 hover:scale-100 animate-fade-in-up animation-delay-400">
                <h3 className="font-bold text-gray-900 text-lg sm:text-xl mb-4">Office Hours & Availability</h3>
                <ul className="text-gray-600 text-sm sm:text-base space-y-2">
                  <li className="flex justify-between p-2 rounded-lg hover:bg-green-50 transition-colors duration-200">
                    <span>Monday - Friday</span>
                    <span className="font-semibold text-green-700">8:00 AM - 5:00 PM</span>
                  </li>
                  <li className="flex justify-between p-2 rounded-lg hover:bg-blue-50 transition-colors duration-200">
                    <span>Saturday</span>
                    <span className="font-semibold text-blue-700">9:00 AM - 12:00 PM</span>
                  </li>
                  <li className="flex justify-between p-2 rounded-lg hover:bg-red-50 transition-colors duration-200">
                    <span>Sunday</span>
                    <span className="font-semibold text-red-700">Closed</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Right Column - Map and Emergency Button */}
            <div className="space-y-6">
              {/* Google Map */}
              <div className="border-2 border-solid border-gray-200 rounded-2xl p-6 sm:p-8 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-100 animate-fade-in-up animation-delay-100">
                <div className="text-center mb-4">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
                    Our Location
                  </h3>
                  <p className="text-gray-600 text-sm sm:text-base max-w-md mx-auto">
                    Visit the Western Mindanao State University Research and Development Center, located within the main campus at Baliwasan, Zamboanga City.
                  </p>
                </div>

                <div className="h-[350px] sm:h-[400px] md:h-[450px] rounded-2xl overflow-hidden shadow-lg border border-gray-200 transform hover:scale-100 transition-transform duration-500">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d979.0!2d122.06087!3d6.91359!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x325041dd7a24816f%3A0x51af215fb64cc81a!2sWestern%20Mindanao%20State%20University%20Research%20and%20Development%20Center!5e0!3m2!1sen!2sph!4v1738592748000!5m2!1sen!2sph"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="WMSU Research Center Map"
                  />
                </div>
              </div>

              {/* Emergency Line Button */}
              <a
                href="tel:+63629914570"
                className="group flex items-center justify-center gap-3 text-white rounded-lg py-4 px-6 font-bold text-base sm:text-lg shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 hover:scale-100 animate-fade-in-up animation-delay-200"
                style={{ backgroundColor: '#C8102E' }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#A00D26'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#C8102E'}
              >
                <svg
                  className="w-5 h-5 group-hover:animate-pulse"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
                Emergency Research Line: +63 (62) 991-4570
              </a>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Contacts;