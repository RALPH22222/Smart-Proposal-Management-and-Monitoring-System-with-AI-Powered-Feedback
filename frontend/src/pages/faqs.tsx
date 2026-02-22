import React, { useState, useRef, useEffect } from "react";
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

const FAQ: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState("general");
  const [openItems, setOpenItems] = useState<number[]>([]);
  const heroSection = useInView();
  const faqSection = useInView();

  const toggleItem = (index: number) => {
    setOpenItems((prev) =>
      prev.includes(index)
        ? prev.filter((item) => item !== index)
        : [...prev, index]
    );
  };

  // SVG Icons
  const CategoryIcons = {
    general: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    submission: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
    funding: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    technical: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    )
  };

  const ContactIcons = {
    email: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    phone: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
      </svg>
    )
  };

  const faqData = {
    general: [
      {
        question: "What are the proposal submission deadlines?",
        answer:
          "Proposal deadlines vary by funding source. Regular internal reviews occur monthly on the last Friday of each month, while external funding opportunities have specific timelines announced on our portal.",
      },
      {
        question: "How long does the proposal review process take?",
        answer:
          "Standard review takes 2-3 weeks. Complex proposals or those requiring ethics clearance may take 4-6 weeks.",
      },
      {
        question: "Who can submit research proposals?",
        answer:
          "All WMSU faculty members, graduate students, and research staff are eligible to submit proposals.",
      },
    ],
    submission: [
      {
        question: "What documents are required for proposal submission?",
        answer:
          "Required documents include: completed DOST Form 1B, project timeline, budget breakdown, and endorsement from department head.",
      },
      {
        question: "Can I submit proposals electronically?",
        answer:
          "Yes! All proposals must be submitted through our online portal. The system accepts PDF documents and provides confirmation.",
      },
    ],
    funding: [
      {
        question: "What funding sources are available through WMSU?",
        answer:
          "We support funding avenues including internal WMSU grants, DOST, CHED, and international collaborations.",
      },
      {
        question: "Can I get help with budget preparation?",
        answer:
          "Yes! Our research support team provides budget consultation to align with funding requirements.",
      },
    ],
    technical: [
      {
        question: "What if I encounter technical issues with the portal?",
        answer:
          "For technical support, email research.support@wmsu.edu.ph or call +63 (62) 991-4569.",
      },
    ],
  };

  // Get all FAQ items for mobile view
  const allFaqItems = Object.entries(faqData).flatMap(([category, items]) =>
    items.map((item, index) => ({
      ...item,
      category,
      globalIndex: Object.keys(faqData)
        .slice(0, Object.keys(faqData).indexOf(category))
        .reduce((acc, key) => acc + faqData[key as keyof typeof faqData].length, 0) + index
    }))
  );

  const categories = [
    { id: "general", name: "General Questions", icon: CategoryIcons.general },
    { id: "submission", name: "Submission Process", icon: CategoryIcons.submission },
    { id: "funding", name: "Funding & Budget", icon: CategoryIcons.funding },
    { id: "technical", name: "Technical Support", icon: CategoryIcons.technical },
  ];

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
        
        @keyframes slideDown {
          from {
            max-height: 0;
            opacity: 0;
          }
          to {
            max-height: 500px;
            opacity: 1;
          }
        }
        
        .animate-fade-in-down {
          animation: fadeInDown 0.8s ease-out forwards;
        }
        
        .animate-fade-in-up {
          animation: fadeInUp 0.8s ease-out forwards;
        }
        
        .animate-blob {
          animation: blob 7s infinite;
        }
        
        .animation-delay-100 {
          animation-delay: 100ms;
        }
        
        .animation-delay-200 {
          animation-delay: 200ms;
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

        <div ref={heroSection.ref} className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className={`transition-all duration-1000 ${heroSection.isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className="mb-2 animate-fade-in-down">
              <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-red-50 text-[#C8102E] border border-[#C8102E]/20">
                Support Center
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 animate-fade-in-up animation-delay-100">
              <span className="text-gray-800">Frequently Asked </span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-800 to-[#C8102E]">
                Questions
              </span>
            </h1>
            <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed animate-fade-in-up animation-delay-200">
              Find quick answers to questions about proposals, submission,
              funding, and technical help.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-8 sm:py-12 md:py-16 bg-white">
        <div ref={faqSection.ref} className="max-w-6xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
          {/* Sidebar - Hidden on mobile */}
          <div className={`lg:col-span-1 hidden lg:block transition-all duration-1000 ${faqSection.isInView ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}>
            <div className="bg-white rounded-2xl p-6 border border-[#C8102E]/20 shadow-md sticky top-24 transform hover:scale-102 transition-all duration-300">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Categories
              </h3>
              <div className="space-y-2">
                {categories.map((category, index) => (
                  <button
                    key={category.id}
                    onClick={() => setActiveCategory(category.id)}
                    className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 font-medium transition-all duration-300 transform ${activeCategory === category.id
                      ? "text-white shadow-lg hover:scale-101"
                      : "text-gray-700 hover:bg-gray-50 hover:text-[#C8102E] hover:scale-100"
                      }`}
                    style={{
                      backgroundColor:
                        activeCategory === category.id ? "#C8102E" : "white",
                      transitionDelay: `${index * 50}ms`
                    }}
                    onMouseOver={(e) => {
                      if (activeCategory !== category.id)
                        e.currentTarget.style.backgroundColor = "#FEECEC";
                    }}
                    onMouseOut={(e) => {
                      if (activeCategory !== category.id)
                        e.currentTarget.style.backgroundColor = "white";
                    }}
                  >
                    {category.icon}
                    {category.name}
                  </button>
                ))}
              </div>

              {/* Contact Box */}
              <div className="mt-8 pt-6 border-t border-[#C8102E]/30">
                <h4 className="font-semibold text-gray-900 mb-3">
                  Need More Help?
                </h4>
                <div className="space-y-3">
                  <a
                    href="mailto:research@wmsu.edu.ph"
                    className="flex items-center gap-3 px-4 py-2 rounded-lg transition-all text-sm transform hover:scale-100 hover:shadow-md"
                    style={{ color: "#C8102E" }}
                    onMouseOver={(e) =>
                      (e.currentTarget.style.backgroundColor = "#FEECEC")
                    }
                    onMouseOut={(e) =>
                      (e.currentTarget.style.backgroundColor = "transparent")
                    }
                  >
                    {ContactIcons.email}
                    Email Support
                  </a>
                  <a
                    href="tel:+63629914569"
                    className="flex items-center gap-3 px-4 py-2 rounded-lg transition-all text-sm transform hover:scale-100 hover:shadow-md"
                    style={{ color: "#C8102E" }}
                    onMouseOver={(e) =>
                      (e.currentTarget.style.backgroundColor = "#FEECEC")
                    }
                    onMouseOut={(e) =>
                      (e.currentTarget.style.backgroundColor = "transparent")
                    }
                  >
                    {ContactIcons.phone}
                    Call Support
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* FAQ Content */}
          <div className={`lg:col-span-3 transition-all duration-1000 ${faqSection.isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            {/* Category Selector for Mobile */}
            <div className="lg:hidden mb-6">
              <div className="bg-white rounded-2xl p-4 border border-[#C8102E]/20 shadow-md">
                <h3 className="text-lg font-bold text-gray-900 mb-3">
                  Filter by Category
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setActiveCategory(category.id)}
                      className={`px-3 py-2 rounded-lg flex items-center gap-2 font-medium transition-all duration-300 text-sm transform ${activeCategory === category.id
                        ? "text-white shadow-sm hover:scale-101"
                        : "text-gray-700 hover:bg-gray-50 hover:text-[#C8102E] border border-gray-200 hover:scale-100"
                        }`}
                      style={{
                        backgroundColor:
                          activeCategory === category.id ? "#C8102E" : "white",
                      }}
                    >
                      {category.icon}
                      <span className="truncate">{category.name.split(' ')[0]}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-3 sm:p-6 md:p-8 border border-[#C8102E]/20 shadow-md hover:shadow-xl transition-all duration-300 overflow-x-auto">
              {/* Desktop Category Header */}
              <div className="hidden lg:flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-[#C8102E]/10 rounded-xl flex items-center justify-center transform hover:rotate-12 transition-transform duration-300 min-w-[48px] min-h-[48px]">
                  {CategoryIcons[activeCategory as keyof typeof CategoryIcons]}
                </div>
                <div className="min-w-0">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {categories.find(cat => cat.id === activeCategory)?.name}
                  </h2>
                  <p className="text-gray-600 text-sm sm:text-base">
                    {faqData[activeCategory as keyof typeof faqData].length}{" "}
                    questions in this category
                  </p>
                </div>
              </div>

              {/* Mobile All Questions Header */}
              <div className="lg:hidden mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  All Questions
                </h2>
                <p className="text-gray-600 text-sm">
                  {allFaqItems.length} total questions available
                </p>
              </div>

              {/* FAQ Items */}
              <div className="space-y-4">
                {/* Desktop View - Filtered by Category */}
                <div className="hidden lg:block">
                  {faqData[
                    activeCategory as keyof typeof faqData
                  ].map((faq, index) => (
                    <div
                      key={index}
                      className="bg-white rounded-xl border border-gray-200 overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-100 mb-4"
                      style={{ transitionDelay: `${index * 50}ms` }}
                    >
                      <button
                        onClick={() => toggleItem(index)}
                        className="w-full text-left p-6 flex items-center justify-between gap-4 hover:bg-gray-50 transition-colors"
                      >
                        <h3 className="font-semibold text-gray-900 text-lg flex-1">
                          {faq.question}
                        </h3>
                        <svg
                          className={`w-5 h-5 text-[#C8102E] transition-transform duration-300 ${openItems.includes(index) ? "rotate-180" : ""}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </button>
                      <div
                        className={`transition-all duration-500 overflow-hidden ${openItems.includes(index)
                          ? "max-h-96 opacity-100"
                          : "max-h-0 opacity-0"
                          }`}
                      >
                        <div className="p-6 pt-0 border-t border-gray-100 text-gray-600">
                          {faq.answer}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Mobile View - All Questions */}
                <div className="lg:hidden space-y-4">
                  {allFaqItems.map((faq) => (
                    <div
                      key={faq.globalIndex}
                      className="bg-white rounded-xl border border-gray-200 overflow-hidden transition-all duration-300 hover:shadow-lg"
                    >
                      <div className="flex items-center gap-2 px-6 pt-4 pb-2">
                        <div className="flex items-center gap-2 text-xs text-[#C8102E] font-medium bg-[#C8102E]/10 px-2 py-1 rounded-full">
                          {CategoryIcons[faq.category as keyof typeof CategoryIcons]}
                          <span className="capitalize">{faq.category}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleItem(faq.globalIndex)}
                        className="w-full text-left p-6 pt-2 flex items-center justify-between gap-4 hover:bg-gray-50 transition-colors"
                      >
                        <h3 className="font-semibold text-gray-900 text-lg flex-1">
                          {faq.question}
                        </h3>
                        <svg
                          className={`w-5 h-5 text-[#C8102E] transition-transform duration-300 ${openItems.includes(faq.globalIndex) ? "rotate-180" : ""}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </button>
                      <div
                        className={`transition-all duration-500 overflow-hidden ${openItems.includes(faq.globalIndex)
                          ? "max-h-96 opacity-100"
                          : "max-h-0 opacity-0"
                          }`}
                      >
                        <div className="p-6 pt-0 border-t border-gray-100 text-gray-600">
                          {faq.answer}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Call to Action */}
              <div
                className="mt-8 p-6 rounded-xl text-center text-white shadow-lg transition-all duration-300 transform hover:scale-100 hover:shadow-2xl"
                style={{ backgroundColor: "#C8102E" }}
                onMouseOver={(e) =>
                  (e.currentTarget.style.backgroundColor = "#A00D26")
                }
                onMouseOut={(e) =>
                  (e.currentTarget.style.backgroundColor = "#C8102E")
                }
              >
                <h3 className="text-xl font-bold mb-2">
                  Still have questions?
                </h3>
                <p className="text-red-100 mb-4">
                  Please reach out to our support team for further help.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <a
                    href="mailto:research@wmsu.edu.ph"
                    className="inline-flex items-center justify-center px-6 py-3 bg-white text-[#C8102E] font-semibold rounded-lg hover:bg-gray-100 transition-all duration-300 shadow-md gap-2 transform hover:scale-100"
                  >
                    {ContactIcons.email}
                    Email Support
                  </a>
                  <a
                    href="tel:+63629914569"
                    className="inline-flex items-center justify-center px-6 py-3 border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-[#C8102E] transition-all duration-300 gap-2 transform hover:scale-100"
                  >
                    {ContactIcons.phone}
                    Call Now
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default FAQ;