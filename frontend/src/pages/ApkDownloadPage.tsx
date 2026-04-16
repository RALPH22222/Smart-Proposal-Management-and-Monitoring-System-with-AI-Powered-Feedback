import React, { useState, useEffect } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { BsAndroid2 } from 'react-icons/bs';
import MobileImage from '../assets/IMAGES/Mobile-App.jpg';
import WmsuFallbackLogo from '../assets/IMAGES/WMSU.png';
import RdecFallbackLogo from '../assets/IMAGES/RDEC.jpg';
import { HomeApi } from '../services/HomeApi';
import { downloadFile } from '../utils/download-helper';

const ApkDownloadPage: React.FC = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [apkUrl, setApkUrl] = useState<string>('');
  const [isLoadingApk, setIsLoadingApk] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);

  const apkFilename = (() => {
    if (!apkUrl) return 'app.apk';
    try {
      const pathname = new URL(apkUrl).pathname;
      const raw = decodeURIComponent(pathname.split('/').pop() || 'app.apk');
      return raw.replace(/^\d+-/, '');
    } catch {
      return 'app.apk';
    }
  })();

  useEffect(() => {
    setIsLoaded(true);
    HomeApi.getHomeInfo()
      .then((data) => {
        setApkUrl(data?.app_config?.apk_url || '');
      })
      .catch(() => {
        // leave apkUrl empty — button will be disabled
      })
      .finally(() => setIsLoadingApk(false));
  }, []);

  const handleDownload = async () => {
    if (!apkUrl || isDownloading) return;
    setIsDownloading(true);
    await downloadFile(apkUrl, apkFilename);
    setIsDownloading(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900 overflow-x-hidden">
      {/* Custom Navbar - Inverted colors (white bg, red text/buttons) */}
      <nav className="fixed top-0 w-full z-50 shadow-lg" style={{ backgroundColor: 'rgb(200, 16, 46)' }}>
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo and Title */}
            <a
              href="/"
              className="flex items-center gap-3 group focus:outline-none focus:ring-2 focus:ring-white/30 rounded-md"
            >
              <div className="relative flex items-center gap-2">
                <div className="h-8 w-8 lg:h-10 lg:w-10 rounded-full overflow-hidden bg-white/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 group-hover:shadow-lg">
                  <img
                    src={WmsuFallbackLogo}
                    alt="WMSU Logo"
                    className="h-full w-full object-contain rounded-full"
                  />
                </div>
                <div className="h-8 w-8 lg:h-10 lg:w-10 rounded-full overflow-hidden bg-white/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 group-hover:shadow-lg">
                  <img
                    src={RdecFallbackLogo}
                    alt="RDEC Logo"
                    className="h-full w-full object-contain rounded-full"
                  />
                </div>
              </div>
              <div className="flex flex-col leading-tight">
                <span
                  className="text-base lg:text-lg font-bold tracking-tight text-white"
                >
                  <span className="hidden min-[321px]:inline">WMSU  </span>
                  <span> Mobile App</span>
                </span>
                <span
                  className="text-xs lg:text-sm opacity-80 hidden lg:block text-white/90"
                >
                  Research Development & Evaluation Center
                </span>
              </div>
            </a>

            {/* Nav Links - Desktop */}
            <div className="hidden md:flex items-center space-x-1 pr-4">
              <a
                href="/about"
                className="relative px-4 py-2 font-medium transition-all duration-300 text-white/90 hover:text-white group focus:outline-none focus:ring-2 focus:ring-white/30 rounded-md"
              >
                Learn More
                <span className="absolute bottom-0 left-0 h-0.5 rounded-full transition-all duration-300 w-0 bg-white group-hover:w-full" />
              </a>
            </div>
          </div>
        </div>
      </nav>
      
      {/* Hero Section */}
      <section className="pt-10 pb-16 bg-gradient-to-br from-white via-white to-gray-50 relative overflow-hidden flex-1 flex items-center">
        {/* Animated background shapes */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-red-100 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-red-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-red-50 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>

        <div className={`max-w-7xl mx-auto px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10 transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          
          {/* Left Column - Content */}
          <div className="order-2 lg:order-1">
            {/* Clearer Back to Home Button */}
            <a
              href="/"
              className="inline-flex items-center gap-3 px-5 py-3 rounded-full text-sm font-semibold text-gray-700 bg-white border-2 border-gray-200 shadow-sm transition-all duration-300 hover:bg-red-50 hover:text-[#C8102E] hover:border-red-300 hover:shadow-lg hover:-translate-y-1 group mb-6"
            >
              <div className="w-4 h-4 rounded-full bg-gray-100 group-hover:bg-red-100 flex items-center justify-center transition-colors duration-300">
                <svg className="w-4 h-4 text-gray-600 group-hover:text-[#C8102E] transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </div>
              <span className="font-semibold">Back to Home</span>
            </a>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              <span className="text-gray-800 block">Project Proposal </span>
              <span className="text-[#C8102E] block">Mobile App</span>
            </h1>
            
            <p className="text-lg md:text-xl text-gray-600 mb-8 leading-relaxed max-w-xl">
              Submit proposals, gain approvals, secure funding, and monitor project implementation—all from your fingertips.
            </p>

            {/* Download Button Only */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              {isLoadingApk ? (
                <button disabled className="group inline-flex items-center justify-center px-8 py-4 rounded-lg font-semibold shadow-lg text-white opacity-70 cursor-wait" style={{ backgroundColor: '#C8102E' }}>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  <span>Loading...</span>
                </button>
              ) : apkUrl ? (
                <button
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className="group inline-flex items-center justify-center px-8 py-4 rounded-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl text-white focus:outline-none focus:ring-2 focus:ring-red-300 focus:ring-offset-2 transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-wait disabled:transform-none cursor-pointer"
                  style={{ backgroundColor: '#C8102E' }}
                  onMouseOver={(e) => { if (!isDownloading) e.currentTarget.style.backgroundColor = '#A00D26'; }}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#C8102E'}
                >
                  {isDownloading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Download className="w-5 h-5 mr-2" />}
                  <span>{isDownloading ? 'Downloading...' : 'Download APK'}</span>
                  {!isDownloading && (
                    <svg className="ml-2 w-4 h-4 transition-transform group-hover:translate-y-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
                    </svg>
                  )}
                </button>
              ) : (
                <button disabled className="group inline-flex items-center justify-center px-8 py-4 rounded-lg font-semibold shadow-lg text-white opacity-50 cursor-not-allowed" style={{ backgroundColor: '#C8102E' }}>
                  <Download className="w-5 h-5 mr-2" />
                  <span>APK Not Available</span>
                </button>
              )}
            </div>

            {/* App info badge */}
            <div className="flex items-center gap-6 text-md text-gray-500">
              <div className="flex items-center gap-2">
                <BsAndroid2 className="w-4 h-4 text-green-600" />
                <span>Android</span>
              </div>
              <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
              <span>Latest Version</span>
              <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
              <span>Free Download</span>
            </div>
          </div>

          {/* Right Column - App Image Area */}
          <div className={`order-1 lg:order-2 relative z-0 mt-16 lg:mt-20 transition-all duration-1000 delay-200 transform ${isLoaded ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}>
            <div className="relative mx-auto max-w-[280px] z-0 group">
              {/* Decorative elements */}
              <div className="absolute -top-4 -right-4 w-20 h-20 bg-red-100 rounded-full opacity-70 -z-10 animate-float"></div>
              <div className="absolute -bottom-6 -left-6 w-28 h-28 bg-red-50 rounded-full opacity-60 -z-10 animate-float animation-delay-2000"></div>
              
              <img 
                src={MobileImage} 
                alt="RDEC Mobile App" 
                className="w-full h-auto object-cover rounded-[3rem] shadow-2xl brightness-110 contrast-105 animate-float border-3 border-[#C8102E] bg-gray-900 transition-all duration-500 ease-out hover:scale-105 hover:shadow-[0_35px_60px_-15px_rgba(0,0,0,0.4)] hover:rotate-1 hover:brightness-115 cursor-pointer group-hover:[animation-play-state:paused]"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ApkDownloadPage;
