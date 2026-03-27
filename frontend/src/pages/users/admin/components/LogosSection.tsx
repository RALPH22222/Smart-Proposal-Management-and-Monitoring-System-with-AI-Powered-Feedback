import React, { useState, useEffect } from "react";
import { type LogosInfo } from "../../../../schemas/logo-schema";
import { LogosApi } from "../../../../services/admin/LogosApi";
import { ImageUpload } from "./shared/ImageUpload";
import { toast, Toaster } from "react-hot-toast";
import { Shield, LayoutDashboard } from "lucide-react";
import { useLogos } from "../../../../context/LogoContext";

export const LogosSection: React.FC = () => {
  const { logos: currentLogos, refreshLogos } = useLogos();
  const [logos, setLogos] = useState<LogosInfo>(currentLogos);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setLogos(currentLogos);
  }, [currentLogos]);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await LogosApi.updateLogos(logos);
      await refreshLogos();
      toast.success("System logos updated successfully!");
    } catch (error) {
      console.error("Save logos error:", error);
      toast.error("Failed to save logos.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className='p-4 sm:p-6'>
      <Toaster position="top-right" />
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h2 className='text-lg sm:text-xl font-semibold text-gray-900'>System Branding & Logos</h2>
          <p className="text-sm text-gray-500">Manage the official WMSU and RDEC logos used across the system headers and sidebars.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto text-sm sm:text-base font-medium flex items-center justify-center gap-2 shadow-md"
        >
          {isSaving ? "Saving..." : "Save Branding Changes"}
        </button>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
        {/* WMSU BRANDING */}
        <div className='bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow'>
          <div className="flex items-center gap-2 mb-4">
            <div className="bg-red-100 p-2 rounded-lg">
              <Shield className="w-5 h-5 text-red-600" />
            </div>
            <h3 className='text-md font-bold text-gray-800 tracking-tight'>WMSU Seal (Primary)</h3>
          </div>
          
          <div className="space-y-4">
            <p className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg border border-gray-100 italic">
              This logo appears on the landing page, proponent dashboard, and all official headers. 
              Recommended: Transparent PNG, 512x512px.
            </p>
            <ImageUpload
              currentUrl={logos.wmsu_logo}
              label="WMSU Logo"
              onUploadSuccess={(newUrl) => {
                setLogos({ ...logos, wmsu_logo: newUrl });
              }}
            />
          </div>
        </div>

        {/* RDEC BRANDING */}
        <div className='bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow'>
          <div className="flex items-center gap-2 mb-4">
            <div className="bg-red-100 p-2 rounded-lg">
              <LayoutDashboard className="w-5 h-5 text-red-600" />
            </div>
            <h3 className='text-md font-bold text-gray-800 tracking-tight'>RDEC-WMSU Logo</h3>
          </div>
          
          <div className="space-y-4">
            <p className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg border border-gray-100 italic">
              This logo identifies the Research Development & Evaluation Center. 
              It is paired with the WMSU seal in standard navigation bars.
            </p>
            <ImageUpload
              currentUrl={logos.rdec_logo}
              label="RDEC Logo"
              onUploadSuccess={(newUrl) => {
                setLogos({ ...logos, rdec_logo: newUrl });
              }}
            />
          </div>
        </div>
      </div>

      <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h4 className="text-sm font-semibold text-yellow-800 flex items-center gap-2 mb-1">
          💡 System Note
        </h4>
        <p className="text-xs text-yellow-700 leading-relaxed">
          Updating these logos will synchronize branding across all user portals instantly. 
          Make sure to use high-quality logos with transparent backgrounds to maintain professional aesthetics.
        </p>
      </div>
    </div>
  );
};
