import React, { useState, useRef } from "react";
import { Upload, Loader2, File as FileIcon, CheckCircle2, Download, Trash2 } from "lucide-react";
import { CmsApi } from "../../../../../services/CmsApi";
import { toast } from "react-hot-toast";
import { downloadFile } from "../../../../../utils/download-helper";

interface FileUploadProps {
  currentUrl: string;
  onUploadSuccess: (newUrl: string) => void;
  onDelete?: () => void;
  label?: string;
  accept?: string;
  className?: string;
  helperText?: string;
  maxSizeMB?: number;
  hideUrlMode?: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  currentUrl,
  onUploadSuccess,
  onDelete,
  label = "File",
  accept = ".docx,.pdf,.pptx,.xlsx",
  className = "",
  helperText = "Upload document templates (.docx, .pdf, .pptx, or .xlsx) up to 10MB.",
  maxSizeMB = 10,
  hideUrlMode = false,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isUrlMode, setIsUrlMode] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getFileNameFromUrl = (url: string) => {
    if (!url) return "";
    try {
      const decodedUrl = decodeURIComponent(url);
      const parts = decodedUrl.split("/");
      const lastPart = parts[parts.length - 1];
      // Remove timestamp prefix if it exists (e.g. 123456789-filename.docx)
      return lastPart.replace(/^\d+-/, "");
    } catch (e) {
      return "Uploaded File";
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error(`File size exceeds ${maxSizeMB}MB limit.`);
      return;
    }

    try {
      setIsUploading(true);
      const { uploadUrl, fileUrl } = await CmsApi.getUploadUrl(file.name, file.type);
      
      await CmsApi.uploadFile(uploadUrl, file);
      
      onUploadSuccess(fileUrl);
      toast.success("File uploaded successfully!");
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(`Failed to upload file: ${error.message || "Unknown error"}`);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleUrlApply = () => {
    if (!urlInput.trim()) {
      toast.error("Please enter a file URL.");
      return;
    }
    
    try {
      new URL(urlInput);
      onUploadSuccess(urlInput.trim());
      toast.success("File URL applied!");
      setUrlInput("");
    } catch (e) {
      toast.error("Please enter a valid URL.");
    }
  };

  const fileName = getFileNameFromUrl(currentUrl);

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="block text-sm font-semibold text-gray-800">{label}</label>
      {!hideUrlMode && (
        <div className="flex bg-gray-100 p-1 rounded-lg">
          <button
            type="button"
            onClick={() => setIsUrlMode(false)}
            className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${!isUrlMode ? 'bg-white shadow-sm text-red-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            UPLOAD
          </button>
          <button
            type="button"
            onClick={() => setIsUrlMode(true)}
            className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${isUrlMode ? 'bg-white shadow-sm text-red-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            URL
          </button>
        </div>
      )}
      </div>
      
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:border-red-200 transition-colors">
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${currentUrl ? 'bg-green-50' : 'bg-gray-50'}`}>
            {currentUrl ? (
              <FileCheck className="w-6 h-6 text-green-600" />
            ) : (
              <FileIcon className="w-6 h-6 text-gray-400" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            {currentUrl ? (
              <>
                <h4 className="text-sm font-bold text-gray-900 truncate" title={fileName}>
                  {fileName}
                </h4>
                <div className="flex items-center gap-3 mt-1">
                  <button
                    type="button"
                    onClick={() => downloadFile(currentUrl, fileName)}
                    className="text-[10px] font-bold text-red-600 hover:text-red-700 uppercase flex items-center gap-1 bg-transparent border-none p-0 cursor-pointer"
                  >
                    Download File <Download className="w-3 h-3" />
                  </button>
                  <span className="text-[10px] text-gray-400 font-medium">• ACTIVE TEMPLATE</span>
                </div>
              </>
            ) : (
              <>
                <h4 className="text-sm font-medium text-gray-500 italic">No template uploaded</h4>
                <p className="text-[10px] text-gray-400 mt-1">{helperText}</p>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            {currentUrl && !isUploading && (
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            )}
            {currentUrl && onDelete && !isUploading && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border-none bg-transparent cursor-pointer"
                title="Delete File"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {isUploading && (
          <div className="mt-4 flex items-center gap-3 p-3 bg-red-50 rounded-lg border border-red-100 animate-pulse">
            <Loader2 className="w-5 h-5 text-red-600 animate-spin" />
            <span className="text-xs font-bold text-red-700">Uploading new template...</span>
          </div>
        )}

        {!isUploading && (
          <div className="mt-4 pt-4 border-t border-gray-100 text-center">
            {isUrlMode ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Paste direct file URL here..."
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-1 focus:ring-red-500 outline-none"
                />
                <button
                  type="button"
                  onClick={handleUrlApply}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-red-700"
                >
                  SET
                </button>
              </div>
            ) : (
              <>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept={accept}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-gray-700 hover:bg-gray-100 hover:border-gray-300 transition-all"
                >
                  <Upload className="w-4 h-4" /> 
                  {currentUrl ? "Replace Template File" : "Upload Template File"}
                </button>
              </>
            )}
          </div>
        )}
      </div>
      <p className="text-[10px] text-gray-500 italic px-1">{helperText}</p>
    </div>
  );
};

const FileCheck: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    className={className} 
    fill="none" 
    stroke="currentColor" 
    viewBox="0 0 24 24"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);
