import React, { useState, useEffect } from 'react';
import {
  X, CheckCircle, FileText, User, Users,
  Building2, Mail, Phone, Calendar, DollarSign, Tags, Microscope, Target,
  MapPin, Briefcase, Globe, Loader2, AlertTriangle
} from 'lucide-react';
import { formatDateShort } from '../../utils/date-formatter';
import { api } from '../../utils/axios';

interface DocumentViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentUrl: string;
  title?: string;
  proposal?: any;
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
  proposal
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

  const formatString = (str: string) => {
    if (!str) return 'N/A';
    return str
      .split(/[_\s]+/)
      .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

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
                <iframe
                  src={signedUrl}
                  className="w-full h-full"
                  title={title}
                />
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
                  {p.lastUpdated && (
                    <p className="flex items-center gap-1.5 text-xs text-emerald-200 mt-1">
                      <Calendar className="w-3 h-3" />
                      Funded on <span className="font-semibold">{formatDateShort(p.lastUpdated)}</span>
                    </p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-extrabold text-white tracking-tight">{p.budgetTotal}</p>
                <p className="text-xs text-emerald-100 mt-0.5">Officially approved and funded</p>
              </div>
            </div>
          )}

          {/* Proposal Details */}
          {p && (
            <>
              {/* Leader & Agency */}
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-6">
                <h3 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-3 mb-4 flex items-center gap-2">
                  <User className="w-4 h-4 text-[#C8102E]" /> Leader & Agency Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-xs text-slate-500 font-bold tracking-wider uppercase block mb-1">Project Leader</label>
                    <p className="text-sm font-semibold text-slate-900 mb-2">{p.proponent || p.submittedBy || 'N/A'}</p>
                    <div className="space-y-1 mt-1">
                      <div className="flex items-center gap-2 text-sm text-slate-700">
                        <Mail className="w-3.5 h-3.5 text-slate-400" /> {p.email || 'N/A'}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-700">
                        <Phone className="w-3.5 h-3.5 text-slate-400" /> {p.telephone || 'N/A'}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-700">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" /> {p.department || p.proponentDepartment || 'N/A'}
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 font-bold tracking-wider uppercase block mb-1">Agency</label>
                    <p className="text-sm font-semibold text-slate-900 mb-2">{p.agency || 'N/A'}</p>
                    <div className="flex items-start gap-2 text-sm text-slate-700">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5" />
                      {p.address || 'N/A'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Implementation Sites */}
              {p.implementationSites && p.implementationSites.length > 0 && (
                <div className="bg-slate-50 rounded-xl border border-slate-200 p-6">
                  <h3 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-3 mb-4 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-[#C8102E]" /> Implementation Sites
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {p.implementationSites.map((site: any, i: number) => (
                      <div key={i} className="flex items-start gap-3 p-3 bg-white border border-slate-200 rounded-lg">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 text-blue-600">
                          <MapPin className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 leading-tight">{site.site}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{site.city}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Project Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                    <Users className="w-4 h-4 text-[#C8102E]" /> Cooperating Agencies
                  </h4>
                  <p className="text-sm text-slate-900">{p.cooperatingAgencies || 'None'}</p>
                </div>
                <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                    <FileText className="w-4 h-4 text-[#C8102E]" /> Mode of Implementation
                  </h4>
                  <p className="text-sm font-semibold text-slate-900">{formatString(p.modeOfImplementation)}</p>
                </div>
                <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                    <Tags className="w-4 h-4 text-[#C8102E]" /> Classification
                  </h4>
                  <p className="text-sm font-semibold text-slate-900">{formatString(p.classification)}</p>
                  {p.classificationDetails && p.classificationDetails !== 'N/A' && (
                    <p className="text-xs text-slate-600 mt-1">{formatString(p.classificationDetails)}</p>
                  )}
                </div>
                <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                    <Microscope className="w-4 h-4 text-[#C8102E]" /> R&D Station
                  </h4>
                  <p className="text-sm text-slate-900">{p.rdStation || 'N/A'}</p>
                </div>
                <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                    <Target className="w-4 h-4 text-[#C8102E]" /> Priority Areas
                  </h4>
                  <p className="text-sm font-semibold text-slate-900">{p.priorityAreas || 'N/A'}</p>
                </div>
                <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                    <Briefcase className="w-4 h-4 text-[#C8102E]" /> Sector
                  </h4>
                  <p className="text-sm font-semibold text-slate-900">{p.sector || 'N/A'}</p>
                </div>
                <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                    <Briefcase className="w-4 h-4 text-[#C8102E]" /> Discipline
                  </h4>
                  <p className="text-sm font-semibold text-slate-900">{p.discipline || 'N/A'}</p>
                </div>
              </div>

              {/* Schedule Section */}
              <div className="rounded-xl border p-4 bg-slate-50 border-slate-200">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
                  <Calendar className="w-4 h-4 text-[#C8102E]" /> Implementing Schedule
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Duration</p>
                    <p className="text-sm font-semibold text-slate-900">{p.duration || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Start Date</p>
                    <p className="text-sm font-medium text-slate-900">{p.startDate ? formatDateShort(p.startDate) : 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">End Date</p>
                    <p className="text-sm font-medium text-slate-900">{p.endDate ? formatDateShort(p.endDate) : 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Budget Requirements */}
              {p.budgetSources && p.budgetSources.length > 0 ? (
                <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
                  <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-[#C8102E]" /> Budget Requirements
                  </h3>

                  <div className="space-y-6">
                    {p.budgetSources.map((budget: any, index: number) => (
                      <div key={index} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                        <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="bg-blue-100 p-1.5 rounded text-blue-700">
                              <DollarSign className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Source of Funds</p>
                              <h4 className="font-bold text-slate-800 text-sm">{budget.source}</h4>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Subtotal</p>
                            <p className="text-sm font-bold text-[#C8102E]">{budget.total}</p>
                          </div>
                        </div>

                        <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 divide-y md:divide-y-0 md:divide-x divide-slate-100 text-xs">
                          {/* PS */}
                          <div className="space-y-2 pt-2 md:pt-0">
                            <div className="flex justify-between items-center mb-2">
                              <h5 className="font-bold text-slate-600 uppercase">Personal Services (PS)</h5>
                              <span className="font-semibold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">{budget.ps}</span>
                            </div>
                            <div className="space-y-1">
                              {budget.breakdown?.ps && budget.breakdown.ps.length > 0 ? (
                                budget.breakdown.ps.map((item: any, i: number) => (
                                  <div key={i} className="flex justify-between text-slate-500 hover:bg-slate-50 p-1 rounded">
                                    <span>{item.item}</span>
                                    <span className="font-medium text-slate-700">₱{(item.amount || 0).toLocaleString()}</span>
                                  </div>
                                ))
                              ) : <p className="italic text-slate-400">No items</p>}
                            </div>
                          </div>

                          {/* MOOE */}
                          <div className="space-y-2 pt-2 md:pt-0 pl-0 md:pl-4">
                            <div className="flex justify-between items-center mb-2">
                              <h5 className="font-bold text-slate-600 uppercase">MOOE</h5>
                              <span className="font-semibold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">{budget.mooe}</span>
                            </div>
                            <div className="space-y-1">
                              {budget.breakdown?.mooe && budget.breakdown.mooe.length > 0 ? (
                                budget.breakdown.mooe.map((item: any, i: number) => (
                                  <div key={i} className="flex justify-between text-slate-500 hover:bg-slate-50 p-1 rounded">
                                    <span>{item.item}</span>
                                    <span className="font-medium text-slate-700">₱{(item.amount || 0).toLocaleString()}</span>
                                  </div>
                                ))
                              ) : <p className="italic text-slate-400">No items</p>}
                            </div>
                          </div>

                          {/* CO */}
                          <div className="space-y-2 pt-2 md:pt-0 pl-0 md:pl-4">
                            <div className="flex justify-between items-center mb-2">
                              <h5 className="font-bold text-slate-600 uppercase">Capital Outlay (CO)</h5>
                              <span className="font-semibold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">{budget.co}</span>
                            </div>
                            <div className="space-y-1">
                              {budget.breakdown?.co && budget.breakdown.co.length > 0 ? (
                                budget.breakdown.co.map((item: any, i: number) => (
                                  <div key={i} className="flex justify-between text-slate-500 hover:bg-slate-50 p-1 rounded">
                                    <span>{item.item}</span>
                                    <span className="font-medium text-slate-700">₱{(item.amount || 0).toLocaleString()}</span>
                                  </div>
                                ))
                              ) : <p className="italic text-slate-400">No items</p>}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Grand Total Footer */}
                  <div className="mt-6 bg-slate-100 rounded-xl p-4 flex justify-between items-center border border-slate-200">
                    <div>
                      <h4 className="font-bold text-slate-700 text-sm uppercase">Total Project Cost</h4>
                      <p className="text-xs text-slate-500">Grand total of all sources</p>
                    </div>
                    <div className="text-xl font-black text-[#C8102E] font-mono">
                      {p.budgetTotal}
                    </div>
                  </div>
                </div>
              ) : p.budgetTotal ? (
                /* Fallback: only show grand total */
                <div className="rounded-xl bg-slate-100 p-5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow border border-slate-200">
                  <div>
                    <h4 className="font-bold text-slate-700 text-sm uppercase">Total Project Cost</h4>
                    <p className="text-xs text-slate-500">Grand total of all sources</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-black text-[#C8102E] font-mono">{p.budgetTotal}</p>
                  </div>
                </div>
              ) : null}
            </>
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
