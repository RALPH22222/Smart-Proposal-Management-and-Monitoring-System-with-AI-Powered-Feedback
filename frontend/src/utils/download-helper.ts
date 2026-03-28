/**
 * Utility for downloading files with custom names.
 * This helper fetches the target URL as a blob and triggers a browser download 
 * using a specified filename, effectively bypassing default numeric prefixes (e.g. timestamps).
 */
export const downloadFile = async (url: string, fileName: string) => {
  if (!url) return;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Network response was not ok");
    
    const blob = await response.blob();
    const objectUrl = window.URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = fileName;
    
    // Append to body, click, and remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Small timeout to ensure browser starts download
    setTimeout(() => {
      window.URL.revokeObjectURL(objectUrl);
    }, 100);
  } catch (error) {
    console.error("Download error:", error);
    // Fallback to direct link if fetch fails (e.g. CORS or network error)
    window.open(url, "_blank");
  }
};
