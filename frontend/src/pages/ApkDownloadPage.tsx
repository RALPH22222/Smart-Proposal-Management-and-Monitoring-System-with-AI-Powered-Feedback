import React, { useState, useEffect } from 'react';
import { Download, Loader2, RotateCcw } from 'lucide-react';
import { BsAndroid2 } from 'react-icons/bs';
import MobileImage from '../assets/IMAGES/Mobile-App.jpg';
import WmsuFallbackLogo from '../assets/IMAGES/WMSU.png';
import RdecFallbackLogo from '../assets/IMAGES/RDEC.jpg';
import { HomeApi } from '../services/HomeApi';
import { downloadFile } from '../utils/download-helper';

const ApkDownloadPage: React.FC = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [apkUrl, setApkUrl] = useState<string>('');
  const [phoneImageUrl, setPhoneImageUrl] = useState<string>('');
  const [isLoadingApk, setIsLoadingApk] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);

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

  // QR points to the clean /download URL — mobile detection handles the auto-download
  const pageUrl = typeof window !== 'undefined' ? `${window.location.origin}/download` : '/download';
  const qrCodeUrl = apkUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=10&data=${encodeURIComponent(pageUrl)}`
    : '';

  useEffect(() => {
    setIsLoaded(true);
    HomeApi.getHomeInfo()
      .then((data) => {
        const url = data?.app_config?.apk_url || '';
        setApkUrl(url);
        setPhoneImageUrl(data?.app_config?.phone_image_url || '');
        // Auto-download on mobile devices (QR scans open the page on a phone)
        const isMobile = /android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent);
        if (isMobile && url) {
          const filename = (() => {
            try {
              const raw = decodeURIComponent(new URL(url).pathname.split('/').pop() || 'app.apk');
              return raw.replace(/^\d+-/, '');
            } catch { return 'app.apk'; }
          })();
          downloadFile(url, filename);
        }
      })
      .catch(() => {})
      .finally(() => setIsLoadingApk(false));
  }, []);

  const handleDownload = async () => {
    if (!apkUrl || isDownloading) return;
    setIsDownloading(true);
    await downloadFile(apkUrl, apkFilename);
    setIsDownloading(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900">
      {/* Flip card styles */}
      <style>{`
        .flip-card { perspective: 1200px; }
        .flip-inner {
          transition: transform 0.7s cubic-bezier(0.4, 0.2, 0.2, 1);
          transform-style: preserve-3d;
          position: relative;
        }
        .flip-inner.flipped { transform: rotateY(180deg); }
        .flip-front, .flip-back {
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }
        .flip-back { transform: rotateY(180deg); }
      `}</style>

      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 shadow-lg" style={{ backgroundColor: 'rgb(200, 16, 46)' }}>
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            <a href="/" className="flex items-center gap-3 group focus:outline-none focus:ring-2 focus:ring-white/30 rounded-md">
              <div className="relative flex items-center gap-2">
                <div className="h-8 w-8 lg:h-10 lg:w-10 rounded-full overflow-hidden bg-white/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <img src={WmsuFallbackLogo} alt="WMSU Logo" className="h-full w-full object-contain rounded-full" />
                </div>
                <div className="h-8 w-8 lg:h-10 lg:w-10 rounded-full overflow-hidden bg-white/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <img src={RdecFallbackLogo} alt="RDEC Logo" className="h-full w-full object-contain rounded-full" />
                </div>
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-base lg:text-lg font-bold tracking-tight text-white">
                  <span className="hidden min-[321px]:inline">WMSU </span>
                  <span>Mobile App</span>
                </span>
                <span className="text-xs lg:text-sm opacity-80 hidden lg:block text-white/90">
                  Research Development &amp; Evaluation Center
                </span>
              </div>
            </a>
            <div className="hidden md:flex items-center space-x-1 pr-4">
              <a href="/about" className="relative px-4 py-2 font-medium transition-all duration-300 text-white/90 hover:text-white group focus:outline-none focus:ring-2 focus:ring-white/30 rounded-md">
                Learn More
                <span className="absolute bottom-0 left-0 h-0.5 rounded-full transition-all duration-300 w-0 bg-white group-hover:w-full" />
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-white relative overflow-hidden flex-1 flex items-center py-12 sm:py-16 lg:py-24">
        <div className="absolute top-20 left-10 w-72 h-72 bg-red-100 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob" />
        <div className="absolute top-40 right-10 w-72 h-72 bg-red-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000" />
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-red-50 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000" />

        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <BsAndroid2 className="absolute top-[10%] left-[15%] text-green-500/20 w-12 h-12 -rotate-12 animate-float filter drop-shadow-[0_10px_10px_rgba(0,0,0,0.1)]" />
          <BsAndroid2 className="absolute top-[65%] left-[5%] text-green-600/10 w-24 h-24 rotate-12 animate-float animation-delay-2000" />
          <BsAndroid2 className="absolute top-[15%] right-[20%] text-green-500/15 w-16 h-16 rotate-45 animate-float animation-delay-1000" />
          <BsAndroid2 className="absolute top-[75%] right-[10%] text-green-400/10 w-32 h-32 -rotate-45 animate-float animation-delay-3000" />
          <BsAndroid2 className="absolute top-[20%] left-[80%] text-green-400/20 w-8 h-8 rotate-12 animate-float animation-delay-700" />
        </div>

        <div className={`max-w-7xl mx-auto px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center relative transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>

          {/* Left */}
          <div className="order-2 lg:order-1 relative z-10">
            <a href="/" className="inline-flex items-center gap-3 px-5 py-3 rounded-full text-sm font-semibold text-gray-700 bg-white border-2 border-gray-200 shadow-sm transition-all duration-300 hover:bg-red-50 hover:text-[#C8102E] hover:border-red-300 hover:shadow-lg hover:-translate-y-1 group mb-6">
              <svg className="w-4 h-4 text-gray-600 group-hover:text-[#C8102E] transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="font-semibold">Back to Home</span>
            </a>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              <span className="text-gray-800 block">Project Proposal</span>
              <span className="text-[#C8102E] block">Mobile App</span>
            </h1>

            <p className="text-lg md:text-xl text-gray-600 mb-6 leading-relaxed max-w-xl">
              Submit proposals, gain approvals, secure funding, and monitor project implementation—all from your fingertips.
            </p>


            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              {isLoadingApk ? (
                <button disabled className="inline-flex items-center justify-center px-8 py-4 rounded-lg font-semibold shadow-lg text-white opacity-70 cursor-wait" style={{ backgroundColor: '#C8102E' }}>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" /><span>Loading...</span>
                </button>
              ) : apkUrl ? (
                <button
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className="group inline-flex items-center justify-center px-8 py-4 rounded-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl text-white focus:outline-none focus:ring-2 focus:ring-red-300 focus:ring-offset-2 transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-wait cursor-pointer"
                  style={{ backgroundColor: '#C8102E' }}
                  onMouseOver={(e) => { if (!isDownloading) e.currentTarget.style.backgroundColor = '#A00D26'; }}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#C8102E'}
                >
                  {isDownloading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Download className="w-5 h-5 mr-2" />}
                  <span>{isDownloading ? 'Downloading...' : 'Download APK'}</span>
                  {!isDownloading && (
                    <svg className="ml-2 w-4 h-4 transition-transform group-hover:translate-y-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  )}
                </button>
              ) : (
                <button disabled className="inline-flex items-center justify-center px-8 py-4 rounded-lg font-semibold shadow-lg text-white opacity-50 cursor-not-allowed" style={{ backgroundColor: '#C8102E' }}>
                  <Download className="w-5 h-5 mr-2" /><span>APK Not Available</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-6 text-sm text-gray-500">
              <div className="flex items-center gap-2"><BsAndroid2 className="w-4 h-4 text-green-600" /><span>Android</span></div>
              <div className="w-1 h-1 bg-gray-300 rounded-full" />
              <span>Latest Version</span>
              <div className="w-1 h-1 bg-gray-300 rounded-full" />
              <span>Free Download</span>
            </div>
          </div>

          {/* Right — flip card */}
          <div className={`order-1 lg:order-2 relative z-[60] mt-8 lg:mt-0 transition-all duration-1000 delay-200 ${isLoaded ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}>
            <div className="relative mx-auto lg:ml-0 w-full max-w-[240px] sm:max-w-[280px] md:max-w-[320px] lg:max-w-[380px] xl:max-w-[420px] flip-card">
              <div className={`flip-inner w-full`} style={{ height: 'min(70vh, 520px)', transform: isFlipped ? 'rotateY(180deg)' : 'none' }}>

                {/* FRONT — phone mockup */}
                <div
                  className="flip-front absolute inset-0 cursor-pointer"
                  onClick={() => apkUrl && setIsFlipped(true)}
                >
                  <div className="relative animate-float w-full h-full hover:scale-[1.02] transition-transform duration-300">
                    <img
                      src={phoneImageUrl || MobileImage}
                      alt="RDEC Mobile App"
                      className="w-full h-full object-contain rounded-[2rem] brightness-110 contrast-105 mix-blend-multiply"
                    />
                    {apkUrl && (
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs font-semibold px-3 py-1.5 rounded-full backdrop-blur-sm whitespace-nowrap select-none pointer-events-none">
                        📷 Tap to show QR Code
                      </div>
                    )}
                  </div>
                </div>

                {/* BACK — QR code */}
                <div
                  className="flip-back absolute inset-0 flex flex-col items-center justify-center bg-white rounded-[2rem] shadow-2xl border border-gray-100 cursor-pointer p-6"
                  onClick={() => setIsFlipped(false)}
                >
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Scan to Download</p>

                  {isLoadingApk ? (
                    <div className="w-44 h-44 sm:w-52 sm:h-52 flex items-center justify-center">
                      <Loader2 className="w-8 h-8 text-gray-300 animate-spin" />
                    </div>
                  ) : apkUrl ? (
                    <div className="bg-white p-3 rounded-2xl shadow-md border border-gray-100">
                      <img
                        src={qrCodeUrl}
                        alt="QR Code — scan to download APK"
                        className="w-44 h-44 sm:w-52 sm:h-52 object-contain"
                      />
                    </div>
                  ) : (
                    <div className="w-44 h-44 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-400 text-sm">
                      No APK available
                    </div>
                  )}

                  <p className="text-xs text-gray-400 mt-4 text-center max-w-[180px] leading-relaxed">
                    Point your phone camera at the QR — the APK will download immediately
                  </p>

                  <button
                    className="mt-5 flex items-center gap-1.5 text-xs font-semibold text-[#C8102E] hover:underline"
                    onClick={(e) => { e.stopPropagation(); setIsFlipped(false); }}
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Flip back
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>
    </div>
  );
};

export default ApkDownloadPage;
