import React, { useState, useRef, useEffect } from "react";
import { Search, FileText, PiggyBank, Wrench, Mail, Phone } from "lucide-react";
import Navbar from "../components/navbar";
import Footer from "../components/footer";
import { FaqApi } from "../services/FaqApi";
import { type FaqInfo, DEFAULT_FAQ_INFO } from "../schemas/faq-schema";

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
  const [faqData, setFaqData] = useState<FaqInfo>(DEFAULT_FAQ_INFO);
  
  // Set default active category from the default data
  const [activeCategory, setActiveCategory] = useState<string>(DEFAULT_FAQ_INFO.categories[0].id);
  const [openItems, setOpenItems] = useState<string[]>([]);
  
  const heroSection = useInView();
  const faqSection = useInView();

  useEffect(() => {
    FaqApi.getFaqInfo()
      .then((data) => {
        if (data && data.categories !== undefined && data.hero?.badge) {
          setFaqData(data);
          if (data.categories.length > 0) {
            setActiveCategory(data.categories[0].id);
          }
        }
      })
      .catch(() => { /* keep defaults */ });
  }, []);

  const toggleItem = (itemId: string) => {
    setOpenItems((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    );
  };

  // SVG Icons
  const CategoryIcons: Record<string, React.ReactElement> = {
    general: <Search className="w-5 h-5" />,
    submission: <FileText className="w-5 h-5" />,
    funding: <PiggyBank className="w-5 h-5" />,
    technical: <Wrench className="w-5 h-5" />
  };

  const getCategoryIcon = (icon: string) => CategoryIcons[icon] ?? CategoryIcons["general"];

  const ContactIcons = {
    email: <Mail className="w-4 h-4" />,
    phone: <Phone className="w-4 h-4" />
  };

  if (!faqData) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <div className="flex-grow flex items-center justify-center text-red-500 font-medium text-lg">
          Failed to load FAQ information. Please try again later.
        </div>
        <Footer />
      </div>
    );
  }

  // Get all FAQ items for mobile view
  const allFaqItems = faqData.categories.flatMap((category) =>
    category.items.map((item) => ({
      ...item,
      categoryName: category.name,
      categoryIcon: category.icon,
    }))
  );

  const activeCategoryData = faqData.categories.find(cat => cat.id === activeCategory);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col overflow-x-hidden">

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
                {faqData.hero.badge}
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 animate-fade-in-up animation-delay-100">
              <span className="text-gray-800">{faqData.hero.titlePrefix} </span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-800 to-[#C8102E]">
                {faqData.hero.titleHighlight}
              </span>
            </h1>
            <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed animate-fade-in-up animation-delay-200">
              {faqData.hero.description}
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
                {faqData.categories.map((category, index) => (
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
                    {getCategoryIcon(category.icon)}
                    {category.name}
                  </button>
                ))}
              </div>

              {/* Contact Box */}
              <div className="mt-8 pt-6 border-t border-[#C8102E]/30">
                <h4 className="font-semibold text-gray-900 mb-3">
                  {faqData.support.title}
                </h4>
                <div className="space-y-3">
                  {faqData.support.email && (
                    <a
                      href={`mailto:${faqData.support.email}`}
                      className="flex items-center gap-3 px-4 py-2 rounded-lg transition-all text-sm transform hover:scale-100 hover:shadow-md break-all"
                      style={{ color: "#C8102E" }}
                      onMouseOver={(e) =>
                        (e.currentTarget.style.backgroundColor = "#FEECEC")
                      }
                      onMouseOut={(e) =>
                        (e.currentTarget.style.backgroundColor = "transparent")
                      }
                    >
                      <span className="flex-shrink-0">{ContactIcons.email}</span>
                      Email Support
                    </a>
                  )}
                  {faqData.support.phone && (
                    <a
                      href={`tel:${faqData.support.phone}`}
                      className="flex items-center gap-3 px-4 py-2 rounded-lg transition-all text-sm transform hover:scale-100 hover:shadow-md"
                      style={{ color: "#C8102E" }}
                      onMouseOver={(e) =>
                        (e.currentTarget.style.backgroundColor = "#FEECEC")
                      }
                      onMouseOut={(e) =>
                        (e.currentTarget.style.backgroundColor = "transparent")
                      }
                    >
                      <span className="flex-shrink-0">{ContactIcons.phone}</span>
                      Call Support
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* FAQ Content */}
          <div className={`lg:col-span-3 transition-all duration-1000 ${faqSection.isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>

            <div className="bg-white rounded-2xl p-3 sm:p-6 md:p-8 border border-[#C8102E]/20 shadow-md hover:shadow-xl transition-all duration-300 overflow-x-auto">
              
              {activeCategoryData && (
                 <>
                   {/* Desktop Category Header */}
                   <div className="hidden lg:flex items-center gap-4 mb-6">
                     <div className="w-12 h-12 bg-[#C8102E]/10 rounded-xl flex items-center justify-center transform hover:rotate-12 transition-transform duration-300 min-w-[48px] min-h-[48px]">
                       {getCategoryIcon(activeCategoryData.icon)}
                     </div>
                     <div className="min-w-0">
                       <h2 className="text-2xl font-bold text-gray-900">
                         {activeCategoryData.name}
                       </h2>
                       <p className="text-gray-600 text-sm sm:text-base">
                         {activeCategoryData.items.length}{" "}
                         questions in this category
                       </p>
                     </div>
                   </div>
                 </>
              )}

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
                  {activeCategoryData?.items.map((faq, index) => (
                    <div
                      key={faq.id}
                      className="bg-white rounded-xl border border-gray-200 overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-100 mb-4"
                      style={{ transitionDelay: `${index * 50}ms` }}
                    >
                      <button
                        onClick={() => toggleItem(faq.id)}
                        className="w-full text-left p-6 flex items-center justify-between gap-4 hover:bg-gray-50 transition-colors"
                      >
                        <h3 className="font-semibold text-gray-900 text-lg flex-1">
                          {faq.question}
                        </h3>
                        <svg
                          className={`w-5 h-5 text-[#C8102E] transition-transform duration-300 ${openItems.includes(faq.id) ? "rotate-180" : ""}`}
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
                        className={`transition-all duration-500 overflow-hidden ${openItems.includes(faq.id)
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
                  {activeCategoryData?.items.length === 0 && (
                     <div className="text-center py-8 text-gray-500 text-lg">No questions in this category.</div>
                  )}
                </div>
                {/* Mobile View - All Questions */}
                <div className="lg:hidden space-y-4">
                  {allFaqItems.map((faq) => (
                    <div
                      key={`mob_${faq.id}`}
                      className="bg-white rounded-xl border border-gray-200 overflow-hidden transition-all duration-300 hover:shadow-lg"
                    >
                      <div className="flex items-center gap-2 px-6 pt-4 pb-2">
                        <div className="flex items-center gap-2 text-xs text-[#C8102E] font-medium bg-[#C8102E]/10 px-2 py-1 rounded-full">
                          {getCategoryIcon(faq.categoryIcon)}
                          <span className="capitalize">{faq.categoryName}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleItem(`mob_${faq.id}`)}
                        className="w-full text-left p-6 pt-2 flex items-center justify-between gap-4 hover:bg-gray-50 transition-colors"
                      >
                        <h3 className="font-semibold text-gray-900 text-lg flex-1">
                          {faq.question}
                        </h3>
                        <svg
                          className={`w-5 h-5 text-[#C8102E] transition-transform duration-300 ${openItems.includes(`mob_${faq.id}`) ? "rotate-180" : ""}`}
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
                        className={`transition-all duration-500 overflow-hidden ${openItems.includes(`mob_${faq.id}`)
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
                  {faqData.support.title}
                </h3>
                <p className="text-red-100 mb-4">
                  {faqData.support.description}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  {faqData.support.email && (
                     <a
                       href={`mailto:${faqData.support.email}`}
                       className="inline-flex items-center justify-center px-6 py-3 bg-white text-[#C8102E] font-semibold rounded-lg hover:bg-gray-100 transition-all duration-300 shadow-md gap-2 transform hover:scale-100"
                     >
                       {ContactIcons.email}
                       Email Support
                     </a>
                  )}
                  {faqData.support.phone && (
                     <a
                       href={`tel:${faqData.support.phone}`}
                       className="inline-flex items-center justify-center px-6 py-3 border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-[#C8102E] transition-all duration-300 gap-2 transform hover:scale-100"
                     >
                       {ContactIcons.phone}
                       Call Now
                     </a>
                  )}
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