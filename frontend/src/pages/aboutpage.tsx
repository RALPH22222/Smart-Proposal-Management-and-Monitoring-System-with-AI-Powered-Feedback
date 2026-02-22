import React, { useState, useEffect, useRef } from "react";
import { GraduationCap, BookOpenText } from "lucide-react";
import Navbar from '../components/navbar';
import Footer from '../components/footer';

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
    <div className="text-center transform hover:scale-110 transition-transform duration-300">
      <div className="text-3xl font-bold mb-2">
        {count}{suffix}
      </div>
      <div className="text-red-200 text-sm">{label}</div>
    </div>
  );
};

const About: React.FC = () => {
  const [currentImage, setCurrentImage] = useState(0);
  const heroSection = useInView();
  const storySection = useInView();
  const missionSection = useInView();
  const statsSection = useInView();
  const processSection = useInView();

  useEffect(() => {
    }, []);

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
        
        @keyframes slideInFromBottom {
          from {
            opacity: 0;
            transform: translateY(50px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
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
        
        .animate-slide-in {
          animation: slideInFromBottom 0.8s ease-out forwards;
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
            <div className="mb-2 animate-fade-in-down">
              <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-red-50 text-red-700 border border-red-200">
                About Our Service
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 animate-fade-in-up animation-delay-100">
              <span className="text-transparent bg-clip-text">
                <span className="text-gray-800">About</span>{' '}
                <span className="font-bold mb-6 bg-gradient-to-r from-gray-800 to-red-700 bg-clip-text text-transparent">Smart Project Proposal</span>
              </span>
            </h1>
            <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed animate-fade-in-up animation-delay-200">
              Empowering students and faculty with professionally crafted project proposals
              that secure funding and drive innovation at Western Mindanao State University.
            </p>
          </div>
        </div>
      </section>

      {/* Our Story Section with scroll animation */}
      <section className="py-16 bg-white">
        <div ref={storySection.ref} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`bg-white rounded-2xl shadow-xl p-8 md:p-12 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center transform hover:shadow-[0_20px_50px_rgba(128,0,0,0.15)] transition-all duration-1000 border border-gray-100 ${storySection.isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            {/* Text Content */}
            <div className="animate-fade-in-left">
              <div className="mb-3">
                <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-red-50 text-red-700 border border-red-200">
                  Our Story
                </span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6 bg-gradient-to-r from-gray-800 to-red-700 bg-clip-text text-transparent leading-relaxed">
                Transforming Ideas into Funded Projects
              </h2>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                Founded by dedicated professionals with extensive experience in academic
                research and project development, Smart Project Proposal was born from a
                simple observation: many brilliant ideas at our university never see the
                light of day due to inadequate proposal writing.
              </p>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                We recognized the gap between innovative concepts and successful funding
                approvals. Our mission became clear: to bridge this gap by providing
                expert proposal writing services tailored specifically for WMSU's unique
                academic environment.
              </p>
              <p className="text-lg text-gray-600 leading-relaxed">
                Today, we're proud to have helped numerous students and faculty members
                transform their visions into funded, impactful projects that contribute
                to WMSU's legacy of excellence.
              </p>
            </div>

            <div className="w-full h-full flex flex-col items-center justify-center animate-fade-in-right animation-delay-200">
              <div className="relative h-96 w-full overflow-hidden rounded-lg shadow-lg group">
                <img
                  src="https://upload.wikimedia.org/wikipedia/en/c/c8/Western_Mindanao_State_University_Gym_%28RT_Lim_Boulevard%2C_Zamboanga_City%3B_10-06-2023%29.jpg"
                  alt="Western Mindanao State University"
                  className="w-full h-full object-cover transform transition-transform duration-500 group-hover:scale-105"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision Section with staggered animation */}
      <section className="py-16 bg-gradient-to-b from-gray-50 to-white">
        <div ref={missionSection.ref} className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`grid grid-cols-1 md:grid-cols-2 gap-8 transition-all duration-1000 ${missionSection.isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            {/* Mission Card */}
            <div className="bg-white rounded-2xl shadow-xl p-8 transform hover:shadow-[0_20px_50px_rgba(128,0,0,0.15)] hover:-translate-y-2 transition-all duration-300 border border-gray-100 border-b-4 border-b-red-300 hover:border-b-red-600 animate-fade-in-left">
              <div className="w-15 h-15 bg-red-100 m-auto rounded-2xl flex items-center justify-center mb-6 transform transition-transform duration-300">
                <GraduationCap className="w-10 h-10 text-red-600 transition-transform duration-300 group-hover:scale-110" />
              </div>
              <h3 className="text-3xl font-bold flex items-center justify-center mb-4">
                <span className="text-red-600">❝</span>
                <span className="text-gray-900 pl-1 pr-1">Our Mission</span>
                <span className="text-red-600">❞</span>
              </h3>
              <p className="text-gray-600 leading-relaxed">
                To empower WMSU students and faculty with professionally crafted project proposals
                that secure funding, drive innovation, and contribute to the university's academic
                excellence and community impact.
              </p>
            </div>

            {/* Vision Card */}
            <div className="bg-white rounded-2xl shadow-xl p-8 transform hover:shadow-[0_20px_50px_rgba(128,0,0,0.15)] hover:-translate-y-2 transition-all duration-300 border border-gray-100 border-b-4 border-b-red-300 hover:border-b-red-600 animate-fade-in-right animation-delay-200">
              <div className="w-15 h-15 bg-red-100 m-auto rounded-2xl flex items-center justify-center mb-6 transform transition-transform duration-300">
                <BookOpenText className="w-10 h-10 text-red-600 transition-transform duration-300 group-hover:scale-110" />
              </div>
              <h3 className="text-3xl font-bold flex items-center justify-center mb-4">
                <span className="text-red-600">❝</span>
                <span className="text-gray-900 pl-1 pr-1">Our Vision</span>
                <span className="text-red-600">❞</span>
              </h3>
              <p className="text-gray-600 leading-relaxed">
                To become the leading project proposal consultancy at Western Mindanao State University,
                recognized for transforming innovative ideas into funded projects that create lasting
                positive change in academia and society.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* WMSU Lead Section with animated stats */}
      <section className="py-20 bg-gradient-to-br from-white via-red-50/10 to-white relative overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute top-10 left-10 w-20 h-20 bg-red-200 rounded-full opacity-20 animate-float"></div>
        <div className="absolute bottom-20 right-16 w-16 h-16 bg-red-300 rounded-full opacity-30 animate-float animation-delay-2000"></div>
        <div className="absolute top-1/3 right-1/4 w-12 h-12 bg-red-100 rounded-full opacity-40 animate-float animation-delay-4000"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Header */}
          <div className="text-center mb-16 animate-fade-in-up">
            <div className="inline-block px-3 py-1 items-center rounded-full bg-red-50 border border-red-300 mb-4">
              <span className="text-xs text-red-700 font-semibold rounded-fulltext-red-700">
                Our Distinct Approach
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-gray-900 via-[#C8102E] to-gray-800 bg-clip-text text-transparent">
              The WMSU Lead
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Experience a partnership built on academic excellence, tailored specifically for the Western Mindanao State University community.
            </p>
          </div>

          {/* Main Feature - Split Layout with animated stats */}
          <div className="mb-16 bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 animate-fade-in-up animation-delay-200">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              <div className="p-12 lg:p-16 bg-gradient-to-br from-red-50 to-white">
                <div className="flex items-center gap-4 mb-8">
                  <h3 className="text-3xl font-bold text-gray-900 bg-gradient-to-r from-gray-900 via-[#C8102E] to-gray-800 bg-clip-text">University-Tailored Expertise</h3>
                </div>
                <p className="text-lg text-gray-700 leading-relaxed mb-6">
                  Our team consists of former WMSU faculty and research committee members who understand the intricate requirements and approval processes unique to our university.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3 text-gray-600 transform hover:translate-x-2 transition-transform duration-300">
                    <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                    Familiar with WMSU research protocols and formats
                  </li>
                  <li className="flex items-center gap-3 text-gray-600 transform hover:translate-x-2 transition-transform duration-300">
                    <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                    Established relationships with review committees
                  </li>
                  <li className="flex items-center gap-3 text-gray-600 transform hover:translate-x-2 transition-transform duration-300">
                    <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                    Updated on latest university research policies
                  </li>
                </ul>
              </div>
              <div ref={statsSection.ref} className="bg-gradient-to-br from-gray-900 to-[#C8102E] p-12 lg:p-16 text-white">
                <h4 className="text-2xl font-bold mb-6">Proven Track Record</h4>
                <div className={`grid grid-cols-2 gap-8 mb-8 transition-all duration-1000 ${statsSection.isInView ? 'opacity-100' : 'opacity-0'}`}>
                  <AnimatedStat value={89} suffix="%" label="Approval Rate" shouldStart={statsSection.isInView} />
                  <AnimatedStat value={50} suffix="+" label="Projects Funded" shouldStart={statsSection.isInView} />
                  <div className="text-center transform hover:scale-110 transition-transform duration-300">
                    <div className="text-3xl font-bold mb-2">₱2.3M+</div>
                    <div className="text-red-200 text-sm">Funding Secured</div>
                  </div>
                  <AnimatedStat value={100} suffix="%" label="Client Satisfaction" shouldStart={statsSection.isInView} />
                </div>
                <p className="text-red-100 leading-relaxed">
                  Join the growing community of successful researchers who have transformed their ideas into funded projects through our specialized support.
                </p>
              </div>
            </div>
          </div>

          {/* Process Timeline with scroll reveal */}
          <div ref={processSection.ref} className="mb-16">
            <h3 className={`text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-8 sm:mb-12 text-gray-900 transition-all duration-1000 ${processSection.isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>Our Streamlined Process</h3>
            <div className="relative">
              {/* Timeline Line - Hidden on mobile, visible on medium+ */}
              <div className="hidden md:block absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-gradient-to-b from-red-200 to-red-300"></div>

              <div className="space-y-6 sm:space-y-8 md:space-y-12">
                {[
                  {
                    step: "01",
                    title: "Team Formation & Proposal Preparation",
                    description: "Assemble your research team and develop your initial proposal concept with our guidance",
                    alignment: "left",
                  },
                  {
                    step: "02",
                    title: "Proposal Submission",
                    description: "Submit your completed proposal through our streamlined online portal for initial review",
                    alignment: "right",
                  },
                  {
                    step: "03",
                    title: "R&D Staff & Evaluator Review",
                    description: "Our research and development team and expert evaluators conduct comprehensive assessment",
                    alignment: "left",
                  },
                  {
                    step: "04",
                    title: "RDEC Endorsement",
                    description: "Successful proposals receive official endorsement from the Research and Development Ethics Committee",
                    alignment: "right",
                  },
                  {
                    step: "05",
                    title: "Funding Approval & Implementation",
                    description: "Your proposal is declared fundable and ready for project implementation and execution",
                    alignment: "left",
                  }
                ].map((item, index) => (
                  <div key={index} className={`relative transition-all duration-700 ${processSection.isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`} style={{ transitionDelay: `${index * 150}ms` }}>
                    {/* Mobile Layout */}
                    <div className="md:hidden bg-white p-6 rounded-2xl shadow-lg border-l-4 border-red-600 hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300">
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-red-600 mb-1">Step {item.step}</div>
                        <h4 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h4>
                        <p className="text-gray-600 text-sm leading-relaxed">{item.description}</p>
                      </div>
                    </div>

                    {/* Desktop Layout */}
                    <div className="hidden md:flex items-center w-full">
                      {/* Left-aligned content */}
                      {item.alignment === "left" && (
                        <>
                          <div className="w-1/2 pr-8 lg:pr-12">
                            <div className="bg-white p-6 lg:p-8 rounded-2xl shadow-lg border-l-4 border-red-600 text-right hover:shadow-xl transform hover:-translate-x-2 hover:scale-105 transition-all duration-300">
                              <div className="text-sm font-semibold text-red-600 mb-2">Step {item.step}</div>
                              <h4 className="text-lg lg:text-xl font-bold text-gray-900 mb-3">{item.title}</h4>
                              <p className="text-gray-600 leading-relaxed text-sm lg:text-base">{item.description}</p>
                            </div>
                          </div>
                          <div className="w-8 h-8 bg-red-600 rounded-full border-4 border-white shadow-lg z-10 flex-shrink-0 animate-pulse"></div>
                          <div className="w-1/2"></div>
                        </>
                      )}

                      {/* Right-aligned content */}
                      {item.alignment === "right" && (
                        <>
                          <div className="w-1/2"></div>
                          <div className="w-8 h-8 bg-red-600 rounded-full border-4 border-white shadow-lg z-10 flex-shrink-0 animate-pulse"></div>
                          <div className="w-1/2 pl-8 lg:pl-12">
                            <div className="bg-white p-6 lg:p-8 rounded-2xl shadow-lg border-l-4 border-red-600 hover:shadow-xl transform hover:translate-x-2 hover:scale-105 transition-all duration-300">
                              <div className="text-sm font-semibold text-red-600 mb-2">Step {item.step}</div>
                              <h4 className="text-lg lg:text-xl font-bold text-gray-900 mb-3">{item.title}</h4>
                              <p className="text-gray-600 leading-relaxed text-sm lg:text-base">{item.description}</p>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Unique Value Propositions with hover effects */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in-up animation-delay-400">
            <div className="group p-10 rounded-3xl border border-red-100 shadow-lg transform hover:scale-105 hover:shadow-2xl transition-all duration-300"
              style={{ backgroundColor: "rgb(200, 16, 46)" }}
            >
              <div className="flex items-start gap-6">
                <div>
                  <h4 className="text-2xl font-bold text-white mb-4 group-hover:scale-110 transition-transform duration-300 inline-block">Response Guarantee</h4>
                  <p className="text-gray-300 leading-relaxed mb-4">
                    Get feedback within 48 hours and complete proposals in as little as 2 weeks, ensuring you never miss important deadlines.
                  </p>
                  <div className="inline-flex items-center gap-2 px-4 py-2 border-1 border-solid border-white bg-red-500 text-white rounded-full text-sm font-semibold hover:bg-red-600 transform hover:scale-105 transition-all duration-300 cursor-pointer">
                    <span>Get Feedback</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="group bg-gradient-to-br from-red to-red-50 p-10 rounded-3xl border border-red-100 shadow-lg transform hover:scale-105 hover:shadow-2xl transition-all duration-300">
              <div className="flex items-start gap-6">
                <div>
                  <h4
                    className="text-2xl font-bold mb-4 group-hover:scale-110 transition-transform duration-300 inline-block"
                    style={{ color: "rgb(200, 16, 46)" }}
                  >
                    Budget-Conscious Solutions
                  </h4>
                  <p className="text-red-900 leading-relaxed mb-4">
                    Special student and faculty rates with flexible payment options, because great research shouldn't be limited by budget constraints.
                  </p>
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-full text-sm font-semibold hover:bg-red-200 transform hover:scale-105 transition-all duration-300 cursor-pointer">
                    <span>Affordable Excellence</span>
                  </div>
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

export default About;