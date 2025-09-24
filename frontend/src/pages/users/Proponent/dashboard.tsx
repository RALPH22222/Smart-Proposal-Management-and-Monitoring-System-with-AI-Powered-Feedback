import React, { useRef, useState, useCallback } from "react";
import ProponentNavbar from "../../../components/Proponent-navbar";
import Logo from '../../../assets/IMAGES/LOGO.png';

const Dashboard: React.FC = () => {
  // File upload state and handlers
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleButtonClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0] ? e.target.files[0] : null;
    setSelectedFile(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files && e.dataTransfer.files[0] ? e.dataTransfer.files[0] : null;
    setSelectedFile(file);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  const handleSubmit = useCallback(() => {
    if (!selectedFile) return;
    // TODO: Replace with API call to upload the file
    console.log('Submitting file:', selectedFile.name);
  }, [selectedFile]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900">
      <ProponentNavbar />
    <main className="max-w-6xl mx-auto px-6 lg:px-8 py-12 pb-28">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Left hero */}
        <div className="relative">
          <div className="relative z-10">
            <div className="flex items-center gap-8">
              <div className="relative">
                {/* subtle theme-colored accent behind logo (no yellow) */}
                <div
                  className="absolute -left-6 -top-6 w-44 h-44 rounded-full filter blur-md"
                  style={{ backgroundColor: 'rgba(200,16,46,0.12)' }}
                />
                <a href="/">
                  <img
                    src={Logo}
                    alt="WMSU logo"
                    className="w-48 h-48 object-contain rounded-lg shadow-lg relative z-20"
                  />
                </a>
              </div>

              <div className="flex-1">
                <h1 className="text-5xl md:text-6xl font-extrabold leading-tight text-gray-800">
                  Upload
                  <br />
                  Your Research
                </h1>
                <p className="mt-6 text-gray-600 text-lg">
                  100% Automatically and{" "}
                  <span
                    className="inline-block ml-2 px-3 py-1 rounded-full text-sm font-semibold"
                    style={{ backgroundColor: '#C8102E', color: '#fff' }}
                  >
                    Safe
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
          {/* Right card - uploader style (moved down a little) */}
          <div className="flex justify-center" style={{ transform: 'translateY(36px)' }}>
            <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-10">
              <div className="flex flex-col items-center gap-6">
                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleFileChange}
                />
                {/* Drop zone */}
                <div
                  className="w-full h-40 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center cursor-pointer hover:border-[#C8102E] hover:bg-red-50 transition-colors duration-200"
                  onClick={handleButtonClick}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  role="button"
                  aria-label="Upload file"
                  title="Click or drop a file to upload"
                >
                  {selectedFile ? (
                    <div className="text-gray-700 text-center">
                      <p className="font-medium">Selected:</p>
                      <p className="text-sm mt-1 truncate max-w-[90%] mx-auto">{selectedFile.name}</p>
                    </div>
                  ) : (
                    <p className="text-gray-400">Drop file here or click Upload</p>
                  )}
                </div>
                <button
                  onClick={selectedFile ? handleSubmit : handleButtonClick}
                  className="px-8 py-3 rounded-full text-white font-medium text-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#C8102E] hover:brightness-90 cursor-pointer"
                  style={{ backgroundColor: "#C8102E" }}
                  title={selectedFile ? "Submit your selected file" : "Select a file to upload"}
                >
                  {selectedFile ? "Submit" : "Upload File"}
                </button>
                {selectedFile && (
                  <button
                    type="button"
                    onClick={handleButtonClick}
                    className="text-sm text-gray-600 underline hover:text-[#C8102E] cursor-pointer"
                  >
                    Choose another file
                  </button>
                )}
                <p className="text-gray-600 text-center">
                  or drop a file, <span className="underline">paste file</span> or{" "}
                  <span className="underline">URL</span>
                </p>
                <div className="w-full">
                  <p className="text-sm text-gray-600 mb-2">
                    No template? Try this:
                  </p>
                  <div className="flex gap-2">
                    { [
                      "https://via.placeholder.com/64?text=1",
                    ].map((src, i) => (
                      <img
                        key={i}
                        src={src}
                        alt={`thumb-${i}`}
                        className="w-12 h-12 rounded-lg object-cover border"
                      />
                    )) }
                  </div>

                  <p className="text-xs text-gray-400 mt-4">
                    By uploading a Research or URL you agree to our Terms of Service
                    and Privacy Policy.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      {/* Page-specific bottom status bar (acts like a footer) */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-md z-40">
        <div className="max-w-6xl mx-auto px-6 lg:px-8 py-3">
          <div className="flex flex-wrap items-center justify-between gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-700">Submitted:</span>
              <span className="px-2.5 py-1 rounded-full text-white text-xs font-medium" style={{ backgroundColor: '#C8102E' }}>Not submitted</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-700">Screening:</span>
              <span className="px-2.5 py-1 rounded-full bg-yellow-100 text-yellow-800 text-xs font-medium">Pending</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-700">Needs Revision:</span>
              <span className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-medium">—</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-700">Last updated:</span>
              <span className="text-gray-800">—</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Dashboard;