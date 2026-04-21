import React, { useState, useEffect } from 'react';
import {
  X, CheckCircle, FileText, Calendar, Loader2, AlertTriangle, Eye, ChevronRight, Download
} from 'lucide-react';
import { formatDateShort } from '../../utils/date-formatter';
import { api } from '../../utils/axios';
import { isOfficeExtension, openSignedUrl } from '../../utils/signed-url';

interface DocumentViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentUrl: string;
  title?: string;
  proposal?: any;
  onOpenDetails?: (proposal: any) => void;
}

/**
 * Extract the S3 object key from a stored S3 URL.
 * e.g. "https://bucket.s3.amazonaws.com/proposals/file.pdf" -> "proposals/file.pdf"
 * or   "https://s3.us-east-1.amazonaws.com/bucket/proposals/file.pdf" -> "proposals/file.pdf"
 */
const extractS3Key = (url: string): string | null => {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    // path always starts with "/" — remove it
    let path = parsed.pathname.replace(/^\//, '');
    // If the URL is path-style (s3.region.amazonaws.com/bucket/key), strip the bucket prefix
    // For virtual-hosted style (bucket.s3.amazonaws.com/key), pathname IS the key
    const pathStyleMatch = parsed.hostname.match(/^s3[.-]/);
    if (pathStyleMatch) {
      // path = "bucket/key" — remove first segment
      const segments = path.split('/');
      segments.shift(); // remove bucket name
      path = segments.join('/');
    }
    return decodeURIComponent(path) || null;
  } catch {
    return null;
  }
};

const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  isOpen,
  onClose,
  documentUrl,
  title = 'Document Viewer',
  proposal,
  onOpenDetails
}) => {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [isLoadingUrl, setIsLoadingUrl] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !documentUrl) {
      setSignedUrl(null);
      setUrlError(null);
      return;
    }

    const fetchSignedUrl = async () => {
      setIsLoadingUrl(true);
      setUrlError(null);
      try {
        const key = extractS3Key(documentUrl);
        if (!key) {
          // Not an S3 URL or already signed — use as-is
          setSignedUrl(documentUrl);
          return;
        }
        const { data } = await api.get<{ url: string }>('/files/signed-url', {
          params: { key, bucket: 'proposals' },
          withCredentials: true,
        });
        setSignedUrl(data.url);
      } catch (err) {
        console.error('Failed to get signed URL:', err);
        // Fallback to direct URL (may still fail if bucket is private)
        setSignedUrl(documentUrl);
        setUrlError('Could not generate a secure preview link. The document may not be accessible.');
      } finally {
        setIsLoadingUrl(false);
      }
    };

    fetchSignedUrl();
  }, [isOpen, documentUrl]);

  if (!isOpen) return null;

  const p = proposal;


  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-5xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">

        {/* --- HEADER --- */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-6 border-b border-gray-100 bg-white gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border bg-emerald-100 border-emerald-200 text-emerald-800">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                Funded Approved Document
              </span>
              <span className="text-xs text-slate-500 font-normal">
                Archive Viewer
              </span>
            </div>
            <h2 className="text-xl font-bold text-gray-900 leading-tight truncate pr-4">
              {p?.title || title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors self-start sm:self-center"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* --- BODY --- */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-6">

          {/* Document Viewer Section */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm flex flex-col h-[60vh] min-h-[400px]">
            <div className="bg-slate-100 p-3 border-b flex items-center gap-2 border-slate-200">
              <FileText className="w-4 h-4 text-red-600" />
              <h3 className="text-sm font-bold text-slate-800">Document Preview</h3>
            </div>

            {urlError && (
              <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border-b border-amber-200 text-xs text-amber-700">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                {urlError}
              </div>
            )}

            <div className="flex-1 w-full bg-slate-200/50 relative">
              {isLoadingUrl ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-50">
                  <Loader2 className="w-8 h-8 animate-spin text-[#C8102E]" />
                  <p className="text-sm text-slate-500">Preparing secure document preview…</p>
                </div>
              ) : signedUrl ? (
                // Browsers can only render PDF and images inline. For Office
                // docs (.docx / .xlsx / .pptx / etc.) an iframe either shows
                // garbage or a "can't display" page, so we surface a download
                // CTA instead — the user opens it in their desktop app.
                isOfficeExtension(
                  (() => {
                    const src = documentUrl || '';
                    const match = src.match(/\.([a-zA-Z0-9]+)(?:$|\?)/);
                    return match ? match[1] : '';
                  })(),
                ) ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-50 px-6 text-center">
                    <FileText className="w-12 h-12 text-slate-400" />
                    <p className="text-sm font-semibold text-slate-700">This is an Office document</p>
                    <p className="text-xs text-slate-500 max-w-sm">
                      Word, Excel, and PowerPoint files can't be previewed in the browser.
                      Download the file and open it in your desktop app.
                    </p>
                    <button
                      type="button"
                      onClick={() => openSignedUrl(documentUrl)}
                      className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#C8102E] text-white text-sm font-semibold hover:bg-[#a80d26] transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Download document
                    </button>
                  </div>
                ) : (
                  <iframe
                    src={signedUrl}
                    className="w-full h-full"
                    title={title}
                  />
                )
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-50">
                  <AlertTriangle className="w-8 h-8 text-slate-400" />
                  <p className="text-sm text-slate-500">No document available.</p>
                </div>
              )}
            </div>
          </div>

          {/* Total Funded Amount - outside the document viewer card */}
          {p && p.budgetTotal && (
            <div className="rounded-xl bg-emerald-600 p-5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg shadow-emerald-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs font-bold text-emerald-100 tracking-wider">Total Funded Amount</p>
                  <p className="text-sm text-emerald-50">Grand Total Budget Requirements</p>
                  {p.lastModified && (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/20 border border-white/10 text-white text-[12px] font-bold mt-2 shadow-sm">
                      <Calendar className="w-3 h-3 text-emerald-200" />
                      Funded on: {formatDateShort(p.lastModified)}
                    </div>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-extrabold text-white tracking-tight">{p.budgetTotal}</p>
                <p className="text-xs text-emerald-100 mt-0.5">Officially approved and funded</p>
              </div>
            </div>
          )}

          {/* Open Full Details Link */}
          {p && (
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-6 flex items-center justify-between group hover:border-[#C8102E] transition-all cursor-pointer shadow-sm"
              onClick={() => onOpenDetails?.(p)}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center text-[#C8102E] group-hover:bg-[#C8102E] group-hover:text-white transition-all">
                  <Eye className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">View Full Proposal Details</h3>
                  <p className="text-sm text-slate-500">Access complete implementation sites, budget breakdowns, and project schedules</p>
                </div>
              </div>
              <div className="p-2 rounded-full bg-slate-100 text-slate-400 group-hover:bg-[#C8102E]/10 group-hover:text-[#C8102E] transition-all">
                <ChevronRight className="w-6 h-6" />
              </div>
            </div>
          )}
        </div>

        {/* --- FOOTER --- */}
        <div className="p-4 sm:p-6 border-t border-slate-200 bg-slate-50 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors flex items-center justify-center"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default DocumentViewerModal;
