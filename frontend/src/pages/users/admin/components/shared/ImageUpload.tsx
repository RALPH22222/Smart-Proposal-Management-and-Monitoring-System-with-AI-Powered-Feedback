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

/**
 * Removes the background from a logo image using edge-connected flood fill.
 * Only removes near-white pixels that are CONNECTED TO THE BORDER of the image.
 * Internal white areas (e.g. book pages inside a logo) are preserved.
 */
const removeWhiteBackground = (file: File): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext("2d");
      if (!ctx) { reject(new Error("Canvas context not available")); return; }

      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(objectUrl);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      const w = canvas.width;
      const h = canvas.height;

      // Pixels with R, G, B all >= this value are considered "white/near-white"
      const THRESHOLD = 235;
      const visited = new Uint8Array(w * h);

      const isNearWhite = (flat: number): boolean => {
        const i = flat * 4;
        return data[i] >= THRESHOLD && data[i + 1] >= THRESHOLD && data[i + 2] >= THRESHOLD && data[i + 3] > 10;
      };

      const queue: number[] = [];

      // Seed the queue with all near-white pixels on the image border
      for (let x = 0; x < w; x++) {
        const top = x;
        const bot = (h - 1) * w + x;
        if (!visited[top] && isNearWhite(top)) { visited[top] = 1; queue.push(top); }
        if (!visited[bot] && isNearWhite(bot)) { visited[bot] = 1; queue.push(bot); }
      }
      for (let y = 1; y < h - 1; y++) {
        const left = y * w;
        const right = y * w + (w - 1);
        if (!visited[left] && isNearWhite(left)) { visited[left] = 1; queue.push(left); }
        if (!visited[right] && isNearWhite(right)) { visited[right] = 1; queue.push(right); }
      }

      // BFS: expand to connected near-white pixels
      while (queue.length > 0) {
        const flat = queue.pop()!;
        const i = flat * 4;
        data[i + 3] = 0; // Make transparent

        const x = flat % w;
        const y = Math.floor(flat / w);

        const neighbors = [flat - 1, flat + 1, flat - w, flat + w];
        const nx      = [x - 1,   x + 1,   x,     x    ];
        const ny      = [y,        y,        y - 1, y + 1];

        for (let k = 0; k < 4; k++) {
          const nf = neighbors[k];
          if (nx[k] < 0 || nx[k] >= w || ny[k] < 0 || ny[k] >= h) continue;
          if (visited[nf]) continue;
          if (isNearWhite(nf)) {
            visited[nf] = 1;
            queue.push(nf);
          }
        }
      }

      ctx.putImageData(imageData, 0, 0);
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("Failed to convert canvas to blob"))),
        "image/png"
      );
    };

    img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error("Failed to load image")); };
    img.src = objectUrl;
  });
};

export const ImageUpload: React.FC<ImageUploadProps> = ({
  currentUrl,
  onUploadSuccess,
  label = "Image",
  className = "",
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string | null>(null);
  const [isUrlMode, setIsUrlMode] = useState(false);
  const [urlInput, setUrlInput] = useState("");
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
      setProcessingStatus("Removing background...");

      let processedBlob: Blob = file;
      try {
        processedBlob = await removeWhiteBackground(file);
      } catch (bgError) {
        console.warn("Background removal failed, uploading original:", bgError);
        toast("Could not remove background — uploading as-is.", { icon: "⚠️" });
      }

      setProcessingStatus("Uploading...");
      const uploadFileName = file.name.replace(/\.[^.]+$/, ".png");
      // Convert Blob → File so CmsApi.uploadFile receives the correct type
      const fileToUpload = new File([processedBlob], uploadFileName, { type: "image/png" });
      const { uploadUrl, fileUrl } = await CmsApi.getUploadUrl(uploadFileName, "image/png");
      await CmsApi.uploadFile(uploadUrl, fileToUpload);

      onUploadSuccess(fileUrl);
      toast.success("Logo uploaded successfully!");
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(`Failed to upload image: ${error.message || "Unknown error"}`);
    } finally {
      setIsUploading(false);
      setProcessingStatus(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleUrlApply = () => {
    if (!urlInput.trim()) {
      toast.error("Please enter an image address.");
      return;
    }
    try {
      new URL(urlInput);
      onUploadSuccess(urlInput.trim());
      toast.success("Image address applied!");
      setUrlInput("");
    } catch (_e) {
      toast.error("Please enter a valid URL.");
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between mb-1">
        <label className="block text-sm font-medium text-gray-700">{label}</label>
        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 p-0.5 rounded-md">
            <button
              type="button"
              onClick={() => setIsUrlMode(false)}
              className={`px-2 py-0.5 text-[10px] font-bold rounded ${!isUrlMode ? "bg-white shadow-sm text-red-600" : "text-gray-500"}`}
            >
              UPLOAD
            </button>
            <button
              type="button"
              onClick={() => setIsUrlMode(true)}
              className={`px-2 py-0.5 text-[10px] font-bold rounded ${isUrlMode ? "bg-white shadow-sm text-red-600" : "text-gray-500"}`}
            >
              URL
            </button>
          </div>
          {currentUrl && (
            <a
              href={currentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-gray-600 transition-colors inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider"
              title="Open original image"
            >
              Link <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>

      <div className="relative group">
        <div
          className="aspect-video w-full rounded-lg border-2 border-dashed border-gray-300 overflow-hidden flex items-center justify-center relative"
          style={{
            background: currentUrl
              ? "repeating-conic-gradient(#d1d5db 0% 25%, #f9fafb 0% 50%) 0 0 / 16px 16px"
              : "#f9fafb",
          }}
        >
          {currentUrl ? (
            <>
              <img src={currentUrl} alt={label} className="w-full h-full object-contain p-2" />
              {!isUrlMode && (
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-white/90 text-gray-800 px-3 py-1.5 rounded-md text-sm font-medium hover:bg-white transition-colors flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" /> Change Image
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center gap-2 text-gray-500">
              <Upload className="w-8 h-8 opacity-40" />
              <span className="text-sm">No image set</span>
            </div>
          )}

          {isUploading && (
            <div className="absolute inset-0 bg-white/90 flex flex-col items-center justify-center z-10 gap-2">
              <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
              <span className="text-xs font-semibold text-gray-700">{processingStatus}</span>
            </div>
          )}
        </div>
      </div>

      {isUrlMode ? (
        <div className="flex gap-2 mt-2">
          <input
            type="text"
            placeholder="Paste image address here..."
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            className="flex-1 px-3 py-1.5 border border-gray-300 rounded-md text-xs focus:ring-1 focus:ring-red-500 focus:border-red-500 outline-none"
          />
          <button
            type="button"
            onClick={handleUrlApply}
            className="bg-red-600 text-white px-3 py-1.5 rounded-md text-xs font-bold hover:bg-red-700 transition-colors"
          >
            Apply
          </button>
        </div>
      ) : (
        <>
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
              {isUploading ? processingStatus : "No file chosen"}
            </span>
          </div>
        </>
      )}
    </div>
  );
};
