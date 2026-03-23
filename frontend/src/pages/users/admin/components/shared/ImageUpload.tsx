import React, { useState, useRef } from "react";
import { Upload, Loader2, ExternalLink } from "lucide-react";
import { CmsApi } from "../../../../../services/CmsApi";
import { toast } from "react-hot-toast";

interface ImageUploadProps {
  currentUrl: string;
  onUploadSuccess: (newUrl: string) => void;
  label?: string;
  className?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  currentUrl,
  onUploadSuccess,
  label = "Image",
  className = "",
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file.");
      return;
    }

    try {
      setIsUploading(true);
      const { uploadUrl, fileUrl } = await CmsApi.getUploadUrl(file.name, file.type);
      
      // We directly upload to S3 bypassing our API Gateway for the file data
      await CmsApi.uploadFile(uploadUrl, file);
      
      onUploadSuccess(fileUrl);
      toast.success("Image uploaded successfully!");
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(`Failed to upload image: ${error.message || "Unknown error"}`);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between mb-1">
        <label className="block text-sm font-medium text-gray-700">{label}</label>
        {currentUrl && (
          <a 
            href={currentUrl} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-gray-400 hover:text-gray-600 transition-colors inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider"
            title="Open original image"
          >
            Preview <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
      
      <div className="relative group">
        <div className="aspect-video w-full rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 overflow-hidden flex items-center justify-center relative">
          {currentUrl ? (
            <>
              <img src={currentUrl} alt={label} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-white/90 text-gray-800 px-3 py-1.5 rounded-md text-sm font-medium hover:bg-white transition-colors flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" /> Change Image
                </button>
              </div>
            </>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors"
            >
              <Upload className="w-8 h-8 opacity-40" />
              <span className="text-sm">Click to upload image</span>
            </button>
          )}

          {isUploading && (
            <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center z-10">
              <Loader2 className="w-8 h-8 text-red-600 animate-spin mb-2" />
              <span className="text-xs font-medium text-gray-600">Uploading...</span>
            </div>
          )}
        </div>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
      
      <div className="flex items-center gap-3 mt-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="bg-red-50 text-red-700 px-4 py-1.5 rounded-md text-xs font-bold hover:bg-red-100 transition-colors disabled:opacity-50 border border-red-100"
        >
          Choose File
        </button>
        <span className="text-xs text-gray-400 truncate max-w-[150px] italic">
          {isUploading ? "Uploading..." : "No file chosen"}
        </span>
      </div>
    </div>
  );
};
