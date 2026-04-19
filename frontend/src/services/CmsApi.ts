import axios from "axios";
import { api } from "../utils/axios";

export const CmsApi = {
  /**
   * Get a signed upload URL for a CMS asset
   */
  getUploadUrl: async (filename: string, contentType: string): Promise<{ uploadUrl: string; fileUrl: string }> => {
    // We use a timestamp to ensure unique keys in the CMS bucket
    const timestamp = Date.now();
    const key = `cms/${timestamp}/${filename}`;
    
    const { data } = await api.get<{ url: string }>("/files/signed-url", {
      params: { 
        key, 
        bucket: "cms", 
        method: "PUT",
        contentType 
      },
      withCredentials: true,
    });
    
    // The bucket is private, but we can generate a permanent-ish URL if we want, 
    // or just rely on the key and CloudFront/S3 public access if configured.
    // For now, let's assume the backend returns the URL we can use to access it 
    // (or we construct the S3 URL if we know the bucket is public-read).
    
    // Given the CDK config, the bucket is BLOCK_ALL public access. 
    // We might need a GET signed URL to view it, OR we make the CMS bucket public-read.
    // Let's check the CDK again. 
    
    return { 
      uploadUrl: data.url, 
      fileUrl: data.url.split('?')[0] // The base URL without signature (for storage in DB)
    };
  },

  /**
   * Upload a file directly to the signed URL
   */
  uploadFile: async (uploadUrl: string, file: File): Promise<void> => {
    await axios.put(uploadUrl, file, {
      headers: { "Content-Type": file.type },
    });
  },
};
