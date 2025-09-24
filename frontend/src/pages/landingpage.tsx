import React from "react";
import Navbar from '../components/navbar';
import CardSwap, { Card } from '../components/CardSwap';
import ElectricBorder from '../components/ElecticBorder';
{/* Gais kung may di kayo nagustuhan sabi lang sakin then kung meron kayo di alam sa code ko sabi lang if may time ako turuan ko lang how ga work*/}
const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900 overflow-x-hidden">
      <Navbar />
      <section className="pt-20 pb-12 bg-gradient-to-b from-white to-gray-100">
        <div className="max-w-6xl mx-auto px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-4">
              WMSU Project Proposal 
            </h1>
            <p className="text-lg text-gray-600 mb-6">
              A lightweight admin and monitoring system for project proposals — fast, responsive, and easy to use.
            </p>
            <div className="flex gap-4">
              <a
                href="/login"
                className="inline-block px-6 py-3 rounded-md font-medium"
                style={{ backgroundColor: '#C8102E', color: '#fff' }}
              >
                Get Started
              </a>
              <a
                href="#about"
                className="inline-block px-6 py-3 rounded-md font-medium border"
                style={{ borderColor: '#C8102E', color: '#C8102E' }}
              >
                Learn More
              </a>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <img
              src="https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?q=80&auto=format&fit=crop&w=1200&h=600"
              alt="Lecture hall with students"
              className="w-full h-44 sm:h-48 lg:h-56 object-cover rounded-xl shadow-md ring-1 ring-black/5"
            />
            <img
              src="https://images.unsplash.com/photo-1581093458791-9d09fda49360?q=80&auto=format&fit=crop&w=1200&h=600"
              alt="Researcher in a lab setting"
              className="w-full h-44 sm:h-48 lg:h-56 object-cover rounded-xl shadow-md ring-1 ring-black/5"
            />
            <img
              src="https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?q=80&auto=format&fit=crop&w=1600&h=600"
              alt="University library interior"
              className="w-full h-48 sm:h-56 lg:h-64 object-cover rounded-xl shadow-md ring-1 ring-black/5 sm:col-span-2"
            />
          </div>
        </div>
      </section>
      <section id="about" className="py-16">
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow p-8 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            <div className="md:col-span-2">
              <h2 className="text-2xl font-semibold mb-3">About the Office</h2>
              <p className="text-gray-600 mb-4">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer nec odio. Praesent libero.
                Sed cursus ante dapibus diam. Sed nisi. Nulla quis sem at nibh elementum imperdiet.
              </p>

              <div className="flex gap-3">
                <a href="mailto:office@example.edu" className="px-4 py-2 rounded-md" style={{ backgroundColor: '#C8102E', color: '#fff' }}>
                  Contact Office
                </a>
                <a href="#featured" className="px-4 py-2 rounded-md border" style={{ borderColor: '#C8102E', color: '#C8102E' }}>
                  Learn More
                </a>
              </div>
            </div>

            <div className="hidden md:block">
              <div className="w-full h-full rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center">
                <img
                  src="https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&auto=format&fit=crop&w=1200&h=800"
                  alt="Campus building exterior"
                  className="object-cover w-full h-full"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
      <section id="interactive" className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <h3 className="text-2xl font-semibold mb-6 text-center">Steps For Proponents</h3>

          <div className="mx-auto flex lg:block items-center justify-center min-h-[60vh] lg:min-h-0" style={{ maxWidth: 900 }}>
            <div className="relative h-[120px] md:h-[520px] lg:h-[600px] overflow-visible lg:-translate-y-24">
              <CardSwap
                cardDistance={60}
                verticalDistance={70}
                delay={5000}
                pauseOnHover={false}
              >
                <Card
                  customClass="p-6 bg-white text-gray-900 shadow-2xl rounded-xl flex gap-4 items-start border w-full md:w-[520px]"
                  style={{ height: 320, borderColor: 'rgba(200,16,46,0.12)' }}
                >
                  <img src="../src/assets/IMAGES/LOGO.png" alt="logo" className="w-16 h-16 rounded-md object-cover flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="text-2xl font-semibold mb-2" style={{ color: '#C8102E' }}>Proposal Submission</h3>
                    <p className="text-gray-600">Submit your project proposal through the portal. Follow the required format and attach necessary documents.</p>
                  </div>
                </Card>

                <Card
                  customClass="p-6 bg-white text-gray-900 shadow-2xl rounded-xl flex gap-4 items-start border w-full md:w-[520px]"
                  style={{ height: 320, borderColor: 'rgba(200,16,46,0.12)' }}
                >
                  <img src="../src/assets/IMAGES/LOGO.png" alt="logo" className="w-16 h-16 rounded-md object-cover flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="text-2xl font-semibold mb-2" style={{ color: '#C8102E' }}>Review & Approval</h3>
                    <p className="text-gray-600">Office staff will review, provide feedback, and approve your proposal. Track progress in the dashboard.</p>
                  </div>
                </Card>

                <Card
                  customClass="p-6 bg-white text-gray-900 shadow-2xl rounded-xl flex gap-4 items-start border w-full md:w-[520px]"
                  style={{ height: 320, borderColor: 'rgba(200,16,46,0.12)' }}
                >
                  <img src="../src/assets/IMAGES/LOGO.png" alt="logo" className="w-16 h-16 rounded-md object-cover flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="text-2xl font-semibold mb-2" style={{ color: '#C8102E' }}>Implementation</h3>
                    <p className="text-gray-600">Once approved, proceed with project implementation and use the portal to submit reports and updates.</p>
                  </div>
                </Card>
              </CardSwap>
            </div>
          </div>
        </div>
      </section>
      <section id="featured" className="py-16">
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <h3 className="text-2xl font-semibold mb-6 text-center">Featured</h3>

          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {['Proposal Highlights','Office Notices','Top Projects'].map((title, i) => (
              <ElectricBorder
                key={i}
                color="#C8102E"
                speed={1}
                chaos={0.5}
                thickness={5}
                style={{ borderRadius: 12, padding: 5, display: 'block' }}
              >
                <div className="bg-white rounded-lg overflow-hidden shadow-lg" style={{ minHeight: 220 }}>
                  <img
                    src={
                      i === 0
                        ? 'https://images.unsplash.com/photo-1558538337-9d03f5c5f37a?q=80&auto=format&fit=crop&w=1200&h=600' // students collaborating
                        : i === 1
                        ? 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?q=80&auto=format&fit=crop&w=1200&h=600' // campus hallway/notice
                        : 'https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?q=80&auto=format&fit=crop&w=1200&h=600' // project teamwork
                    }
                    alt={`featured ${i + 1}`}
                    className="w-full h-40 sm:h-44 lg:h-48 object-cover"
                  />
                  <div className="p-4">
                    <h4 className="text-lg font-semibold" style={{ color: '#C8102E' }}>{title}</h4>
                    <p className="mt-2 text-gray-600 text-sm">
                      Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                    </p>
                    <div className="mt-4">
                      <a
                        className="inline-block px-3 py-2 rounded-md text-sm font-medium"
                        href={i === 0 ? '#interactive' : i === 1 ? '#about' : '#featured'}
                        style={{ backgroundColor: '#C8102E', color: '#fff' }}
                      >
                        Learn More
                      </a>
                    </div>
                  </div>
                </div>
              </ElectricBorder>
            ))}
          </div>
        </div>
      </section>
      <footer className="mt-auto bg-white text-gray-800 py-10 border-t" style={{ borderColor: '#F3F4F6', boxShadow: '0 -6px 24px rgba(200,16,46,0.04)' }}>
        <div className="max-w-6xl mx-auto px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h5 className="text-lg font-semibold mb-2" style={{ color: '#C8102E' }}>WMSU Project Portal</h5>
            <p className="text-gray-600 text-sm">Monitoring and management for campus research and projects.</p>
          </div>

          <div>
            <h6 className="font-medium mb-2" style={{ color: '#C8102E' }}>Links</h6>
            <ul className="text-sm text-gray-600 space-y-1">
              <li><a href="#about" className="hover:underline" style={{ color: '#C8102E' }}>About</a></li>
              <li><a href="#interactive" className="hover:underline" style={{ color: '#C8102E' }}>Highlights</a></li>
              <li><a href="#featured" className="hover:underline" style={{ color: '#C8102E' }}>Featured</a></li>
            </ul>
          </div>

          <div>
            <h6 className="font-medium mb-2" style={{ color: '#C8102E' }}>Contact</h6>
            <p className="text-sm text-gray-600">office@example.edu</p>
            <p className="text-sm text-gray-600">+1 (555) 123-4567</p>
            <div className="mt-3">
              <a className="inline-block px-3 py-2 rounded-md text-sm font-medium" href="mailto:office@example.edu" style={{ backgroundColor: '#C8102E', color: '#fff' }}>
                Contact Office
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t pt-6 text-center" style={{ borderColor: '#F3F4F6' }}>
          <p className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} WMSU Project Proposal. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
