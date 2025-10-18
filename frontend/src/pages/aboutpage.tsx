import React, { useState, useEffect } from "react";
import Navbar from '../components/navbar';
import Footer from '../components/footer'; 

const About: React.FC = () => {
  const [currentImage, setCurrentImage] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev === 2 ? 0 : prev + 1));
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      
      {/* Hero Section - Landing Page Style */}
      <section className="pt-24 pb-16 bg-gradient-to-br from-white via-white to-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="mb-2">
              <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-red-50 text-red-700 border border-red-200">
                About Our Service
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              <span className="text-transparent bg-clip-text">
                <span className="text-gray-800">About</span>{' '}
                <span className="font-bold mb-6 bg-gradient-to-r from-gray-800 to-red-700 bg-clip-text text-transparent">WMSU Project Proposal</span> 
              </span>
            </h1>
            <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Empowering students and faculty with professionally crafted project proposals 
              that secure funding and drive innovation at Western Mindanao State University.
            </p>
          </div>
        </div>
      </section>

      {/* Our Story Section - Mixed Style */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center transform hover:shadow-[0_20px_50px_rgba(128,0,0,0.15)] transition-all duration-300 border border-gray-100">
            {/* Text Content */}
            <div>
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
                research and project development, WMSU Project Proposal was born from a 
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

            {/* Carousel */}
            <div className="w-full h-full">
              <div className="relative h-96 lg:h-full w-full overflow-hidden rounded-lg shadow-lg">                
                {[
                  "https://wmsu.edu.ph/wp-content/uploads/2025/09/542810728_1254124280094134_3626675184462897497_n.jpg",
                  "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Western_Mindanao_State_University_College_of_Teacher_Education_%28Normal_Road%2C_Baliwasan%2C_Zamboanga_City%3B_10-06-2023%29.jpg/640px-Western_Mindanao_State_University_College_of_Teacher_Education_%28Normal_Road%2C_Baliwasan%2C_Zamboanga_City%3B_10-06-2023%29.jpg",
                  "https://wmsu.edu.ph/wp-content/uploads/2024/10/463327480_971931538313411_5392180422034756990_n-1024x576.jpg"
                ].map((image, index) => (
                  <div
                    key={index}
                    className={`absolute inset-0 transition-opacity duration-500 ease-in-out ${
                      index === currentImage ? 'opacity-100' : 'opacity-0'
                    }`}
                  >
                    <img 
                      src={image} 
                      alt={`Carousel ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
              
              {/* Carousel Indicators */}
              <div className="flex justify-center mt-4 space-x-2">
                {[0, 1, 2].map((index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImage(index)}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      index === currentImage ? 'bg-red-600' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision Section - Landing Page Card Style */}
      <section className="py-16 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Mission Card */}
            <div className="bg-white rounded-2xl shadow-xl p-8 transform hover:shadow-[0_20px_50px_rgba(128,0,0,0.15)] transition-all duration-300 border border-gray-100 border-b-4 border-b-red-300 hover:border-b-red-600">
              <div className="w-15 h-15 bg-red-100 m-auto rounded-2xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
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
            <div className="bg-white rounded-2xl shadow-xl p-8 transform hover:shadow-[0_20px_50px_rgba(128,0,0,0.15)] transition-all duration-300 border border-gray-100 border-b-4 border-b-red-300 hover:border-b-red-600">
              <div className="w-15 h-15 bg-red-100 m-auto rounded-2xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
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

      <style>{`
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
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        .animate-fadeInUp {
          animation: fadeInUp 0.6s ease-out forwards;
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        .animate-stagger:nth-child(1) { animation-delay: 0.1s; }
        .animate-stagger:nth-child(2) { animation-delay: 0.2s; }
        .animate-stagger:nth-child(3) { animation-delay: 0.3s; }
        .animate-stagger:nth-child(4) { animation-delay: 0.4s; }
        .animate-stagger:nth-child(5) { animation-delay: 0.5s; }
        .animate-stagger:nth-child(6) { animation-delay: 0.6s; }
      `}</style>
      
      <section className="py-20 bg-gradient-to-br from-white via-red-50/10 to-white relative overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute top-10 left-10 w-20 h-20 bg-red-200 rounded-full opacity-20 animate-float"></div>
        <div className="absolute bottom-20 right-16 w-16 h-16 bg-red-300 rounded-full opacity-30 animate-float" style={{animationDelay: '1.5s'}}></div>
        <div className="absolute top-1/3 right-1/4 w-12 h-12 bg-red-100 rounded-full opacity-40 animate-float" style={{animationDelay: '2s'}}></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Header */}
          <div className="text-center mb-16 animate-fadeInUp">
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
      
          {/* Main Feature - Split Layout */}
          <div className="mb-16 bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 animate-fadeInUp">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              <div className="p-12 lg:p-16 bg-gradient-to-br from-red-50 to-white">
                <div className="flex items-center gap-4 mb-8">
                  <h3 className="text-3xl font-bold text-gray-900 bg-gradient-to-r from-gray-900 via-[#C8102E] to-gray-800 bg-clip-text text-transparent">University-Tailored Expertise</h3>
                </div>
                <p className="text-lg text-gray-700 leading-relaxed mb-6">
                  Our team consists of former WMSU faculty and research committee members who understand the intricate requirements and approval processes unique to our university.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3 text-gray-600">
                    <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                    Familiar with WMSU research protocols and formats
                  </li>
                  <li className="flex items-center gap-3 text-gray-600">
                    <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                    Established relationships with review committees
                  </li>
                  <li className="flex items-center gap-3 text-gray-600">
                    <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                    Updated on latest university research policies
                  </li>
                </ul>
              </div>
              <div className="bg-gradient-to-br from-gray-900 to-[#C8102E] p-12 lg:p-16 text-white">
                <h4 className="text-2xl font-bold mb-6">Proven Track Record</h4>
                <div className="grid grid-cols-2 gap-8 mb-8">
                  <div className="text-center">
                    <div className="text-3xl font-bold mb-2">89%</div>
                    <div className="text-red-200 text-sm">Approval Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold mb-2">50+</div>
                    <div className="text-red-200 text-sm">Projects Funded</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold mb-2">₱2.3M+</div>
                    <div className="text-red-200 text-sm">Funding Secured</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold mb-2">100%</div>
                    <div className="text-red-200 text-sm">Client Satisfaction</div>
                  </div>
                </div>
                <p className="text-red-100 leading-relaxed">
                  Join the growing community of successful researchers who have transformed their ideas into funded projects through our specialized support.
                </p>
              </div>
            </div>
          </div>
      
          {/* Process Timeline */}
          <div className="mb-16 animate-fadeInUp">
           <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-8 sm:mb-12 text-gray-900">Our Streamlined Process</h3>
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
                 <div key={index} className="relative">
                   {/* Mobile Layout */}
                   <div className="md:hidden bg-white p-6 rounded-2xl shadow-lg border-l-4 border-red-600">
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
                           <div className="bg-white p-6 lg:p-8 rounded-2xl shadow-lg border-l-4 border-red-600 text-right">
                             <div className="text-sm font-semibold text-red-600 mb-2">Step {item.step}</div>
                             <h4 className="text-lg lg:text-xl font-bold text-gray-900 mb-3">{item.title}</h4>
                             <p className="text-gray-600 leading-relaxed text-sm lg:text-base">{item.description}</p>
                           </div>
                         </div>
                         <div className="w-8 h-8 bg-red-600 rounded-full border-4 border-white shadow-lg z-10 flex-shrink-0"></div>
                         <div className="w-1/2"></div>
                       </>
                     )}
         
                     {/* Right-aligned content */}
                     {item.alignment === "right" && (
                       <>
                         <div className="w-1/2"></div>
                         <div className="w-8 h-8 bg-red-600 rounded-full border-4 border-white shadow-lg z-10 flex-shrink-0"></div>
                         <div className="w-1/2 pl-8 lg:pl-12">
                           <div className="bg-white p-6 lg:p-8 rounded-2xl shadow-lg border-l-4 border-red-600">
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
      
          {/* Unique Value Propositions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fadeInUp">
             <div className="p-10 rounded-3xl border border-red-100 shadow-lg"
              style={{ backgroundColor: "rgb(200, 16, 46)" }}
             >
              <div className="flex items-start gap-6">
                <div>
                  <h4 className="text-2xl font-bold text-white mb-4">Response Guarantee</h4>
                  <p className="text-gray-300 leading-relaxed mb-4">
                    Get feedback within 48 hours and complete proposals in as little as 2 weeks, ensuring you never miss important deadlines.
                  </p>
                  <div className="inline-flex items-center gap-2 px-4 py-2 border-1 border-solid border-white bg-red-500 text-white rounded-full text-sm font-semibold">
                    <span>Get Feedback</span>
                  </div>
                </div>
              </div>
            </div>
      
            <div className="bg-gradient-to-br from-red to-red-50 p-10 rounded-3xl border border-red-100 shadow-lg">
              <div className="flex items-start gap-6">
                <div>
                 <h4
                   className="text-2xl font-bold mb-4"
                   style={{ color: "rgb(200, 16, 46)" }}
                 >
                   Budget-Conscious Solutions
                 </h4>
                  <p className="text-red-900 leading-relaxed mb-4">
                    Special student and faculty rates with flexible payment options, because great research shouldn't be limited by budget constraints.
                  </p>
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-full text-sm font-semibold">
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