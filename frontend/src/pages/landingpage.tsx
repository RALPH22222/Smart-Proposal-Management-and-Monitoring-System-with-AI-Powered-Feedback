import React from "react";
import Navbar from '../components/navbar';
import CardSwap, { Card } from '../components/CardSwap';
import ElectricBorder from '../components/ElecticBorder';
{/* Gais kung may di kayo nagustuhan sabi lang sakin then kung meron kayo di alam sa code ko sabi lang if may time ako turuan ko lang how ga work*/}
const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900">
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

          <div className="grid grid-cols-2 gap-4">
            <img
              src="https://scontent.fcgy1-2.fna.fbcdn.net/v/t39.30808-6/479186455_671527225200257_140539643212713243_n.jpg?_nc_cat=105&ccb=1-7&_nc_sid=a5f93a&_nc_eui2=AeGYBskeDlCdiIxI_katwvpSWnXcRcawRjxaddxFxrBGPGg9x2-ii1bbYI8tp3rxtWLMi4jZL8ASPXla-lmgDJy-&_nc_ohc=AGKdBxsUruAQ7kNvwGc1PCA&_nc_oc=AdmyHCbhQPeHej_lihjNQcy2q7iGamKLURTo3Yx4nITB-P5x2Gnce76kgscPGEjD8Kc&_nc_zt=23&_nc_ht=scontent.fcgy1-2.fna&_nc_gid=wXS3OGkKg2iz1kRzMUvafQ&oh=00_Afb7SxeNP1qWtVOzInW8uzliVXfri7R5vWFnb2_2Zczglg&oe=68D4F061"
              alt="placeholder 1"
              className="w-full h-44 object-cover rounded-lg shadow-sm"
            />
            <img
              src="https://scontent.fcgy1-3.fna.fbcdn.net/v/t1.6435-9/88197233_480215789522042_7705417705527967744_n.jpg?_nc_cat=107&ccb=1-7&_nc_sid=a5f93a&_nc_eui2=AeG3KDFrIacAyYAuOsHOwZqPWEX_DvL6GgpYRf8O8voaCkXxHiJZ2OZXrpwEJVSBnys7uHVj9liIi3pvSx5mguyB&_nc_ohc=KZRAaWidt8oQ7kNvwG6a9UJ&_nc_oc=Adl_ogn0LMrEg1kSziR8J9DnpDdNV4Aa1-6HYSs4zPWqxTa3Y_58BVFQvOEl2eHLr0A&_nc_zt=23&_nc_ht=scontent.fcgy1-3.fna&_nc_gid=wBDh6wLRWUooLGmqeF6pDw&oh=00_AfYEQqakIp5etOkhjBNXbn395MYJhZhyPsL7AbzkAVvAMw&oe=68F682AC"
              alt="placeholder 2"
              className="w-full h-44 object-cover rounded-lg shadow-sm"
            />
            <img
              src="https://scontent.fcgy1-2.fna.fbcdn.net/v/t39.30808-6/487410400_2211707282621132_3419906964591658393_n.jpg?_nc_cat=108&ccb=1-7&_nc_sid=a5f93a&_nc_eui2=AeFSZXBT3jngsxKdXpFHpaG9ogx_pOxKvjSiDH-k7Eq-NHI4fUO_aHxpZCddR_tdzrDdmuhdOM2wmT6Z2g9AN2IQ&_nc_ohc=Q1XE9Rt6DXYQ7kNvwGD6O9C&_nc_oc=AdlPUVPS4UnmxCw4WORXXSXI3mYkUo8VaWD3MGH-N1Zu-0yJ3HkJu94IIa-agfxj0DE&_nc_zt=23&_nc_ht=scontent.fcgy1-2.fna&_nc_gid=R6oGDTqquR-4sRzdaXYCPw&oh=00_AfaLTWsuoFnPVP67Kjs752DidBMMAw2_lzFNtQTnEAO3Vg&oe=68D5008D"
              alt="placeholder 3"
              className="w-full h-44 object-cover rounded-lg shadow-sm col-span-2"
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
                  src="https://scontent.fcgy1-1.fna.fbcdn.net/v/t39.30808-6/481335175_1061209699381731_6163952778813124354_n.jpg?_nc_cat=102&ccb=1-7&_nc_sid=833d8c&_nc_eui2=AeGWxEGHROGVQeY50ploi1U13komRiTB0c_eSiZGJMHRz7cwKh5D5_mtcr58FZ_kUVM_O_5r5wMpmpVYriie9ChO&_nc_ohc=WmmiknkgMI0Q7kNvwHHQyG6&_nc_oc=AdnI_3pZwnzjmxToum42ohqwn7imFkArO5I8nYTC0CrkchZqfh1aLuRRb09WhYGqDF4&_nc_zt=23&_nc_ht=scontent.fcgy1-1.fna&_nc_gid=NtbCSJ8-59sUxgu8tqfOzg&oh=00_AfaoAtTdge8Tn9jjsp5Mg6CqTcGyM6b-z3murtMHdh-TRw&oe=68D4F594"
                  alt="office placeholder"
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

          <div className="mx-auto" style={{ maxWidth: 900 }}>
            <div style={{ height: '600px', position: 'relative', transform: 'translateY(-200px)' }}>
              <CardSwap
                cardDistance={60}
                verticalDistance={70}
                delay={5000}
                pauseOnHover={false}
              >
                <Card
                  customClass="p-6 bg-white text-gray-900 shadow-2xl rounded-xl flex gap-4 items-start border"
                  style={{ width: 520, height: 320, borderColor: 'rgba(200,16,46,0.12)' }}
                >
                  <img src="../src/assets/IMAGES/LOGO.png" alt="logo" className="w-16 h-16 rounded-md object-cover flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="text-2xl font-semibold mb-2" style={{ color: '#C8102E' }}>Proposal Submission</h3>
                    <p className="text-gray-600">Submit your project proposal through the portal. Follow the required format and attach necessary documents.</p>
                  </div>
                </Card>

                <Card
                  customClass="p-6 bg-white text-gray-900 shadow-2xl rounded-xl flex gap-4 items-start border"
                  style={{ width: 520, height: 320, borderColor: 'rgba(200,16,46,0.12)' }}
                >
                  <img src="../src/assets/IMAGES/LOGO.png" alt="logo" className="w-16 h-16 rounded-md object-cover flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="text-2xl font-semibold mb-2" style={{ color: '#C8102E' }}>Review & Approval</h3>
                    <p className="text-gray-600">Office staff will review, provide feedback, and approve your proposal. Track progress in the dashboard.</p>
                  </div>
                </Card>

                <Card
                  customClass="p-6 bg-white text-gray-900 shadow-2xl rounded-xl flex gap-4 items-start border"
                  style={{ width: 520, height: 320, borderColor: 'rgba(200,16,46,0.12)' }}
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
                      i === 0 || i === 1 || i === 2
                        ? 'https://scontent.fcgy1-3.fna.fbcdn.net/v/t39.30808-6/489958368_3038610116278509_661823795661958936_n.jpg?_nc_cat=107&ccb=1-7&_nc_sid=cf85f3&_nc_eui2=AeH9vC9dVVOw6ieIiSA_899zCa851pmWEwEJrznWmZYTAbT-2rYWxsHhjggTy1HYpTNJ7LQxqD0m3DpDNt5AuEqN&_nc_ohc=OWDln8-3rsEQ7kNvwEB0NbS&_nc_oc=AdmUKu8C-5_6YtegHspg-ncJ6hUZ2GmF9XcOi21Jx2w1Gb3rFhIczAHP3iAQkVkVCcU&_nc_zt=23&_nc_ht=scontent.fcgy1-3.fna&_nc_gid=Adg_pnyFqx2DPNx-Hez6uA&oh=00_AfbFX_1vc4VGBLdUY-yLr7KXkfLEyWtjybWWpdE-hVR6tg&oe=68D4F80B'
                        : `https://via.placeholder.com/600x240?text=Featured+${i + 1}`
                    }
                    alt={`featured ${i + 1}`}
                    className="w-full h-40 object-cover"
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
