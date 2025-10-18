import React from "react";
import Navbar from "../components/navbar";
import Footer from "../components/footer";

const Contacts: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      {/* Hero Section (Unchanged) */}
      <section className="pt-24 pb-16 bg-gradient-to-br from-white via-white to-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="mb-3 md:mb-4">
              <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-red-50 text-red-700 border border-red-200">
                Connect With Us
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 px-4">
              <span className="bg-gradient-to-r from-gray-800 to-red-700 bg-clip-text text-transparent">
                Research Support Center
              </span>
            </h1>
            <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Direct access to our research committee and support staff. Get comprehensive assistance
              for your project proposals and research initiatives at Western Mindanao State University.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Content (Improved Design) */}
      <section className="flex-1 py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">

            {/* Contact Details */}
            <div className="space-y-10">

              {/* Location */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 sm:p-8 transition hover:shadow-xl">
                <div className="flex items-start gap-4 sm:gap-6">
                  <div className="bg-red-100 p-3 rounded-xl flex-shrink-0">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 sm:p-8 transition hover:shadow-xl">
                <div className="flex items-start gap-4 sm:gap-6">
                  <div className="bg-red-100 p-3 rounded-xl flex-shrink-0">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg sm:text-xl mb-2">Telephone Lines</h3>
                    <ul className="text-gray-600 text-sm sm:text-base space-y-1">
                      <li><span className="font-medium">Main Office:</span> +63 (62) 991-4567</li>
                      <li><span className="font-medium">Research Desk:</span> +63 (62) 991-4568</li>
                      <li><span className="font-medium">Proposal Hotline:</span> +63 (62) 991-4569</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Email */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 sm:p-8 transition hover:shadow-xl">
                <div className="flex items-start gap-4 sm:gap-6">
                  <div className="bg-red-100 p-3 rounded-xl flex-shrink-0">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg sm:text-xl mb-2">Email Communications</h3>
                    <ul className="text-gray-600 text-sm sm:text-base space-y-1">
                      <li>
                        <span className="font-medium">General Inquiries:</span>{" "}
                        <span className="text-red-600 font-semibold">research@wmsu.edu.ph</span>
                      </li>
                      <li>
                        <span className="font-medium">Proposal Submissions:</span>{" "}
                        <span className="text-red-600 font-semibold">proposals@wmsu.edu.ph</span>
                      </li>
                      <li>
                        <span className="font-medium">Technical Support:</span>{" "}
                        <span className="text-red-600 font-semibold">research.support@wmsu.edu.ph</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Office Hours */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 sm:p-8 transition hover:shadow-xl">
                <h3 className="font-bold text-gray-900 text-lg sm:text-xl mb-4">Office Hours & Availability</h3>
                <ul className="text-gray-600 text-sm sm:text-base space-y-2">
                  <li className="flex justify-between">
                    <span>Monday - Friday</span>
                    <span className="font-semibold text-green-700">8:00 AM - 5:00 PM</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Saturday</span>
                    <span className="font-semibold text-blue-700">9:00 AM - 12:00 PM</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Sunday</span>
                    <span className="font-semibold text-red-700">Closed</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Right Column - Map and Emergency Button */}
            <div className="space-y-6">
              {/* Google Map */}
              <div className="border-2 border-solid border-gray-200 rounded-2xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition">
                <div className="text-center mb-4">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
                    Our Location
                  </h3>
                  <p className="text-gray-600 text-sm sm:text-base max-w-md mx-auto">
                    Visit the Western Mindanao State University Research and Development Center, located within the main campus at Baliwasan, Zamboanga City.
                  </p>
                </div>
              
                <div className="h-[350px] sm:h-[400px] md:h-[450px] rounded-2xl overflow-hidden shadow-lg border border-gray-200">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3352.2460096198806!2d122.0587976741552!3d6.913594193085905!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x325041dd7a24816f%3A0x51af215fb64cc81a!2sWestern%20Mindanao%20State%20University!5e1!3m2!1sen!2sph!4v1760439603433!5m2!1sen!2sph"
                    width="100%" 
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="WMSU Map"
                  />
                </div>
              </div>

              {/* Emergency Line Button - Now below the map */}
              <a
                href="tel:+63629914570"
                className="flex items-center justify-center gap-3 text-white rounded-lg py-4 px-6 font-bold text-base sm:text-lg shadow-lg hover:shadow-xl transition-all duration-300"
                style={{ backgroundColor: '#C8102E' }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#A00D26'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#C8102E'}
              >
                <svg
                  className="w-5 h-5"
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