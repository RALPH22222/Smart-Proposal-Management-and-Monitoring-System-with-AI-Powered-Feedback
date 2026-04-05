import React, { useState, useEffect } from "react";
import {
  X,
  Users,
  Calendar,
  DollarSign,
  Phone,
  Mail,
  FileText,
  User,
  Microscope,
  Tags,
  Download,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Clock,
  Signature,
  Briefcase,
  FileCheck,
  Timer,
  MapPin,
  Globe,
  Building2,
  CheckCircle,
  Search,
  Eye,
  Target,
  Edit
} from "lucide-react";
import { type LookupItem, fetchAgencyAddresses, type AddressItem, fetchRejectionSummary, fetchRevisionSummary, type RevisionSummary, getAssignmentTracker } from "../../services/proposal.api";
import { formatDateShort, formatDateTime, formatDate } from "../../utils/date-formatter";

// --- LOCAL INTERFACES TO MATCH DATA STRUCTURE ---
interface Site {
  site: string;
  city: string;
}

interface BudgetSource {
  source: string;
  ps: string;
  mooe: string;
  co: string;
  total: string;
}

// Defined locally to ensure it matches the new dummy data structure
export interface ModalProposalData {
  id: string;
  title: string;
  documentUrl?: string;
  status: string;
  projectFile: string;
  submittedBy?: string;
  submittedDate: string;
  lastModified?: string;
  proponent: string;
  proponentDepartment?: string;
  agency: string;
  address: string;
  telephone: string;
  fax?: string;
  email: string;
  modeOfImplementation: string;
  implementationSites?: Site[];
  priorityAreas: string;
  projectType?: string;
  cooperatingAgencies: string;
  rdStation: string;
  classification: string;
  classificationDetails: string;
  sector: string;
  discipline: string;
  duration: string;
  startDate: string;
  endDate: string;
  department?: string;
  budgetSources: BudgetSource[];
  budgetTotal: string;
  fundingDocumentUrl?: string;
  lastUpdated?: string;
  proponentInfoVisibility?: 'name' | 'agency' | 'both' | 'none';
  evaluators?: { name: string; department?: string; status: string }[];
  assignedBy?: string;
  versions?: string[];
  /** When status is revised_proposal, date the proponent submitted the revision (latest proposal_version.created_at) */
  revisedSubmittedAt?: string;
}

interface RndViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Use 'any' for prop to accept parent data, then cast internally
  proposal: any;
  // Handler for actions, slightly adjusted types for generic usage if needed
  onAction?: (action: 'forwardEval' | 'revision' | 'reject', proposalId: string) => void;
  agencies?: LookupItem[];
  sectors?: LookupItem[];
  priorityAreas?: LookupItem[];
}

// --- HELPER FUNCTIONS ---


const getOrdinal = (n: number) => {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

// Format string (e.g. "research_class" -> "Research Class")
const formatString = (str: string) => {
  if (!str) return "N/A";
  return str
    .split(/[_\s]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};


// Format any date string to YYYY-MM-DD for input value
// const formatDateForInput = (dateStr: string) => { ... };
// Extract number from duration string
// const cleanDuration = (d: string | number) => { ... };

const RndViewModal: React.FC<RndViewModalProps> = ({
  isOpen,
  onClose,
  proposal,
  onAction,
  agencies = [],
  sectors = [],
  priorityAreas = [],
}) => {
  // Safe cast for internal use
  const p = proposal as ModalProposalData;

  const [agencyAddresses, setAgencyAddresses] = useState<AddressItem[]>([]);
  const [rejectionComment, setRejectionComment] = useState<string | null>(null);
  const [rejectionDate, setRejectionDate] = useState<string | null>(null);
  const [revisionData, setRevisionData] = useState<RevisionSummary | null>(null);
  const [isLoadingRevision, setIsLoadingRevision] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ type: 'revision' | 'reject' | null, id: string | number | null }>({ type: null, id: null });
  const [evaluators, setEvaluators] = useState<{ name: string; department?: string; status: string }[]>([]);
  const [isLoadingEvaluators, setIsLoadingEvaluators] = useState(false);

  const isFunded = ['funded', 'accepted', 'approved'].includes((p?.status || '').toLowerCase());

  useEffect(() => {
    const fetchAddresses = async () => {
      const targetAgencyName = p?.agency;
      if (!targetAgencyName) return;

      const agency = agencies.find(a => a.name === targetAgencyName);
      if (agency) {
        try {
          const addresses = await fetchAgencyAddresses(agency.id);
          setAgencyAddresses(addresses);
        } catch (error) {
          console.error("Failed to fetch agency addresses:", error);
          setAgencyAddresses([]);
        }
      } else {
        setAgencyAddresses([]);
      }
    };

    if (isOpen && p?.agency) {
      fetchAddresses();
    }
  }, [isOpen, p?.agency, agencies]);

  useEffect(() => {
    const fetchRejection = async () => {
      if (['rejected', 'rejected_rnd', 'disapproved', 'reject', 'rejected proposal'].includes((p.status || '').toLowerCase())) {
        try {
          const summary = await fetchRejectionSummary(Number(p.id));
          if (summary) {
            setRejectionComment(summary.comment || "No specific comment provided.");
            setRejectionDate(summary.created_at || null);
          } else {
            setRejectionComment("No specific comment provided.");
            setRejectionDate(null);
          }
        } catch (error) {
          console.error("Failed to fetch rejection summary:", error);
          setRejectionComment("Failed to load rejection details.");
          setRejectionDate(null);
        }
      } else {
        setRejectionComment(null);
        setRejectionDate(null);
      }
    };

    if (isOpen && p?.id) {
      fetchRejection();
    }
  }, [isOpen, p?.id, p?.status]);

  useEffect(() => {
    const fetchRevision = async () => {
      const pStatus = (p.status || '').toLowerCase();
      if (['revise', 'revision', 'revision_rnd', 'revision required', 'under r&d review'].includes(pStatus)) {
        setIsLoadingRevision(true);
        try {
          const data = await fetchRevisionSummary(Number(confirmAction.id || p.id));
          setRevisionData(data);
        } catch (error) {
          console.error("Failed to fetch revision summary:", error);
          setRevisionData(null);
        } finally {
          setIsLoadingRevision(false);
        }
      } else {
        setRevisionData(null);
        setIsLoadingRevision(false);
      }
    };

    if (isOpen && p?.id) {
      fetchRevision();
    }
  }, [isOpen, p?.id, p?.status]);

  // Load assigned evaluators from the assignment tracker so this view
  // always reflects the latest evaluator list from the R&D tracker.
  useEffect(() => {
    // If modal is closed or proposal not yet ready, clear and exit early.
    if (!isOpen || !p || !p.id) {
      setEvaluators([]);
      setIsLoadingEvaluators(false);
      return;
    }

    const shouldShowEvaluators =
      ['under_evaluation', 'evaluators assessment', 'under evaluators assessment'].includes(
        (p.status || '').toLowerCase()
      );

    if (!shouldShowEvaluators) {
      setEvaluators([]);
      setIsLoadingEvaluators(false);
      return;
    }

    const loadEvaluators = async () => {
      setIsLoadingEvaluators(true);
      try {
        const data = await getAssignmentTracker(Number(p.id));

        // Deduplicate by evaluator_id.id and map to simple display structure
        const seen = new Set<string>();
        const mapped: { name: string; department?: string; status: string }[] = [];

        (data || []).forEach((item: any) => {
          if (!item || !item.evaluator_id) return;

          const evalId = item.evaluator_id.id;
          if (!evalId || seen.has(evalId)) return;
          seen.add(evalId);

          const firstName = item.evaluator_id.first_name || 'Unknown';
          const lastName = item.evaluator_id.last_name || '';
          const name = `${firstName} ${lastName}`.trim();
          const department = item.evaluator_id.department_id?.name || 'N/A';
          const status = String(item.status || 'pending');

          mapped.push({ name, department, status });
        });

        setEvaluators(mapped);
      } catch (error) {
        console.error('Failed to load evaluators for proposal', p.id, error);
        setEvaluators([]);
      } finally {
        setIsLoadingEvaluators(false);
      }
    };

    loadEvaluators();
  }, [isOpen, p?.id, p?.status]);

  if (!isOpen || !proposal) return null;

  // --- DOWNLOAD HANDLER ---
  const handleDownload = (fileName: string) => {
    alert(`Downloading ${fileName}...`);
  };

  // --- THEME HELPER ---
  const getStatusTheme = (status: string) => {
    const s = (status || "").toLowerCase();

    // Green
    if (["endorsed", "endorsed_for_funding", "endorsed for funding"].includes(s))
      return {
        bg: "bg-blue-100",
        border: "border-blue-200",
        text: "text-blue-800",
        icon: <Signature className="w-4 h-4 text-blue-800" />,
        label: "Endorsed for Funding",
      };

    // Emerald
    if (["funded", "accepted", "approved"].includes(s))
      return {
        bg: "bg-emerald-100",
        border: "border-emerald-200",
        text: "text-emerald-800",
        icon: <CheckCircle className="w-4 h-4 text-emerald-600" />,
        label: "Project Funded",
      };

    // Red
    if (["rejected", "rejected_rnd", "disapproved", "reject", "rejected proposal"].includes(s))
      return {
        bg: "bg-red-100",
        border: "border-red-200",
        text: "text-red-800",
        icon: <XCircle className="w-4 h-4 text-red-600" />,
        label: "Proposal Rejected",
      };

    // Orange (Pending Review)
    if (["pending", "pending review"].includes(s))
      return {
        bg: "bg-orange-100",
        border: "border-orange-200",
        text: "text-orange-800",
        icon: <Clock className="w-4 h-4 text-orange-600" />,
        label: "Pending Review",
      };

    // Revision (Amber)
    if (["revise", "revision", "revision_rnd", "revision required"].includes(s))
      return {
        bg: "bg-amber-100",
        border: "border-amber-200",
        text: "text-amber-800",
        icon: <RefreshCw className="w-4 h-4 text-amber-600" />,
        label: "Revision Required",
      };

    if (["revised_proposal", "revised proposal"].includes(s))
      return {
        bg: "bg-yellow-100",
        border: "border-yellow-200",
        text: "text-yellow-800",
        icon: <Edit className="w-4 h-4 text-yellow-600" />,
        label: "Revised Proposal",
      };

    // Blue (Under R&D Review)
    if (["review_rnd", "r&d evaluation", "under r&d evaluation", "pending"].includes(s))
      return {
        bg: "bg-blue-100",
        border: "border-blue-200",
        text: "text-blue-800",
        icon: <Search className="w-4 h-4 text-blue-600" />,
        label: "Under R&D Review",
      };

    // Purple
    if (["under_evaluation", "evaluators assessment", "under evaluators assessment"].includes(s))
      return {
        bg: "bg-purple-100",
        border: "border-purple-200",
        text: "text-purple-800",
        icon: <FileText className="w-4 h-4 text-purple-600" />,
        label: "Under Evaluators Assessment",
      };

    // Default/Pending
    return {
      bg: "bg-slate-100",
      border: "border-slate-200",
      text: "text-slate-700",
      icon: <Clock className="w-4 h-4 text-slate-500" />,
      label: "Pending Review",
    };
  };

  const theme = getStatusTheme(p.status);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-5xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">

        {/* --- HEADER --- */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-6 border-b border-gray-100 bg-white gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${theme.bg} ${theme.border} ${theme.text}`}>
                {theme.icon}
                {theme.label}
              </span>
              <span className="text-xs text-slate-500 font-normal">
                DOST Form No. 1B
              </span>
            </div>
            <h2 className="text-xl font-bold text-gray-900 leading-tight truncate pr-4">
              {p.title}
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

          {/* Project Funding Approved (isFunded) Block */}
          {isFunded && (
            <div className="bg-slate-50 border border-emerald-300 rounded-xl p-5 md:p-6 relative overflow-hidden animate-in fade-in slide-in-from-bottom-2">
              <div className="relative z-10 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <div className="w-full">
                  <h3 className="text-lg font-bold text-emerald-800 mb-1 flex items-center gap-2">
                    Project Funding Approved
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed max-w-3xl">
                    This project has been funded.
                  </p>
                  {(p.lastModified || p.lastUpdated) && (
                    <p className="text-xs text-emerald-700/90 mt-2 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      Funded on <span className="font-semibold">{formatDateShort(p.lastModified || p.lastUpdated)}</span>
                    </p>
                  )}
                </div>
              </div>
              <CheckCircle className="absolute -right-6 -bottom-6 w-32 h-32 text-emerald-200 opacity-50 z-0 pointer-events-none" />
            </div>
          )}

          {/* Under R&D Review / Pending Status Block */}
          {['pending', 'review_rnd', 'under r&d evaluation'].includes((p.status || '').toLowerCase()) && (
            <div className="bg-slate-50 border border-blue-200 rounded-xl p-5 md:p-6 relative overflow-hidden animate-in fade-in slide-in-from-bottom-2">
              <div className="relative z-10 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <div className="w-full">
                  <h3 className="text-lg font-bold text-blue-700 mb-1 flex items-center gap-2">
                    Assigned to you for Review
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed max-w-3xl">
                    This proposal is currently assigned to you for review. Assess the project's viability, budget, and timeline to determine the next appropriate steps (Forward to Evaluators, Request Revision, or Reject).
                  </p>
                  {(p.lastModified || p.lastUpdated) && (
                    <p className="text-xs text-blue-700/90 mt-2 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      Status updated on <span className="font-semibold">{formatDateShort(p.lastModified || p.lastUpdated)}</span>
                    </p>
                  )}
                </div>
              </div>
              <Search className="absolute -right-6 -bottom-6 w-32 h-32 text-blue-200 opacity-40 z-0 pointer-events-none" />
            </div>
          )}

          {/* Evaluators Section (Only for Under Evaluation) */}
          {['under_evaluation', 'evaluators assessment', 'under evaluators assessment'].includes((p.status || '').toLowerCase()) && (
            <div className="bg-slate-50 border border-purple-200 rounded-xl p-5 md:p-6 relative overflow-hidden animate-in fade-in slide-in-from-bottom-2">
              <div className="relative z-10 flex flex-col gap-3">
                <div>
                  <h3 className="text-lg font-bold text-purple-800 mb-1 flex items-center gap-2">
                    Evaluators assigned to review this proposal
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed max-w-3xl">
                    This proposal has been forwarded to the evaluator panel for detailed assessment. Below is a summary of how many and who the evaluators are that this proposal was assigned to.
                  </p>
                  {(p.lastModified || p.lastUpdated) && (
                    <p className="text-xs text-purple-700/90 mt-2 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      Status updated on <span className="font-semibold">{formatDateShort(p.lastModified || p.lastUpdated)}</span>
                    </p>
                  )}
                </div>

                <div className="bg-white border border-purple-100 rounded-lg p-4 shadow-sm">
                  <p className="text-sm text-slate-700 mb-3">
                    {isLoadingEvaluators ? (
                      <span className="text-sm text-slate-500">Loading assigned evaluators...</span>
                    ) : evaluators && evaluators.length > 0 ? (
                      <>You have assigned this proposal to <span className="font-semibold text-purple-700">{evaluators.length}</span> evaluator{evaluators.length > 1 ? 's' : ''}.</>
                    ) : (
                      <span className="italic text-slate-400">No evaluators are currently assigned to this proposal.</span>
                    )}
                  </p>

                  {evaluators && evaluators.length > 0 && !isLoadingEvaluators && (
                    <div className="flex flex-wrap gap-2">
                      {evaluators.map((ev, idx) => (
                        <div
                          key={idx}
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-50 border border-purple-200 text-xs text-purple-900"
                        >
                          <User className="w-3.5 h-3.5 text-purple-500" />
                          <span className="font-semibold truncate max-w-[160px]" title={ev.name}>
                            {ev.name}
                          </span>
                          {ev.department && (
                            <span className="text-[11px] text-slate-500 truncate max-w-[140px]" title={ev.department}>
                              {ev.department}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <FileText className="absolute -right-6 -bottom-6 w-32 h-32 text-purple-200 opacity-40 z-0 pointer-events-none" />
            </div>
          )}

          {/* Endorsed for Funding — awaiting funding decision */}
          {['endorsed', 'endorsed_for_funding', 'endorsed for funding'].includes((p.status || '').toLowerCase()) && (
            <div className="bg-slate-50 border border-blue-300 rounded-xl p-5 md:p-6 relative overflow-hidden animate-in fade-in slide-in-from-bottom-2">
              <div className="relative z-10 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <div className="w-full">
                  <h3 className="text-lg font-bold text-blue-800 mb-1 flex items-center gap-2">
                    Awaiting Funding Decision
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed max-w-3xl">
                    This proposal has been endorsed for funding and is now waiting for the final decision to fund from the RDEC Committee.
                  </p>
                  {(p.lastModified || p.submittedDate) && (
                    <p className="text-xs text-blue-700/90 mt-2 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      Endorsed on <span className="font-semibold">{formatDateShort(p.lastModified || p.submittedDate)}</span>
                    </p>
                  )}
                </div>
              </div>
              <Signature className="absolute -right-6 -bottom-6 w-32 h-32 text-blue-200 opacity-50 z-0 pointer-events-none" />
            </div>
          )}

          {/* Status Feedback Blocks */}

          {['revised_proposal', 'revised proposal'].includes((p.status || '').toLowerCase()) && (() => {
            const revisionNumber = Math.max(1, (p.versions?.length || 2) - 1);
            const submittedDate = p.revisedSubmittedAt ? formatDateShort(p.revisedSubmittedAt) : null;
            return (
              <div className="bg-slate-50 border border-amber-200 rounded-xl p-5 md:p-6 relative overflow-hidden animate-in fade-in slide-in-from-bottom-2">
                <div className="relative z-10 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                  <div className="w-full">
                    <h3 className="text-lg font-bold text-amber-700 mb-1 flex items-center gap-2">
                      Revised Proposal Submitted
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed max-w-3xl text-justify">
                      The proponent has submitted their <span className="font-bold text-amber-700">{getOrdinal(revisionNumber)}</span> revised version. Review the modifications they made based on your feedback and determine the next appropriate steps.
                    </p>
                    {submittedDate && (
                      <p className="text-xs text-amber-700/90 mt-2 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        Submitted on <span className="font-semibold">{submittedDate}</span>
                      </p>
                    )}
                  </div>
                </div>
                <Edit className="absolute -right-6 -bottom-6 w-32 h-32 text-amber-200 opacity-40 z-0 pointer-events-none" />
              </div>
            );
          })()}

          {['revise', 'revision', 'revision_rnd', 'revision required'].includes((p.status || '').toLowerCase()) && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-5 md:p-6 relative overflow-hidden animate-in fade-in slide-in-from-bottom-2">
              <div className="relative z-10">
                <h3 className="text-lg font-bold text-orange-800 mb-2 flex items-center gap-2">
                  <RefreshCw className="w-5 h-5 text-orange-600" /> Revision Requirements
                </h3>
                <p className="text-xs text-gray-500 mt-0.5 mb-4">Feedback you provided to the proponent. They must submit a revised proposal by the deadline.</p>

                {isLoadingRevision ? (
                  <div className="p-4 rounded-lg border bg-white/100 border-orange-100 shadow-sm flex flex-col items-center justify-center py-6 mt-3">
                    <RefreshCw className="w-5 h-5 animate-spin text-orange-600 mb-2" />
                    <p className="text-xs text-orange-400">Loading feedback details...</p>
                  </div>
                ) : (
                  <div className="grid gap-3 mt-4">
                    {[
                      { section: "Title Assessment", comment: revisionData?.title_comment },
                      { section: "Budget Assessment", comment: revisionData?.budget_comment },
                      { section: "Timeline Assessment", comment: revisionData?.timeline_comment },
                      { section: "Overall Comments", comment: revisionData?.overall_comment },
                    ].filter(item => item.comment).map((c, i) => {
                      const isOverall = c.section === "Overall Comments";
                      const textStyle = isOverall ? "italic" : "";
                      return (
                        <div key={i} className="bg-white/100 p-5 rounded-lg border border-orange-100 shadow-sm">
                          <h4 className="text-sm font-bold tracking-wider text-orange-700 mb-2 flex items-center gap-2">
                            {c.section}:
                          </h4>
                          <div className={`text-sm leading-relaxed ${textStyle} text-gray-700 whitespace-pre-wrap`}>
                            {c.comment}
                          </div>
                        </div>
                      );
                    })}

                    {(!revisionData || ![
                      revisionData?.title_comment,
                      revisionData?.budget_comment,
                      revisionData?.timeline_comment,
                      revisionData?.overall_comment,
                    ].some(Boolean)) && (
                        <div className="text-center py-8 bg-white/80 rounded-xl border border-dashed border-orange-200">
                          <p className="text-sm text-gray-500 italic">No specific feedback comments provided.</p>
                        </div>
                      )}

                    {revisionData?.created_at != null && revisionData?.deadline != null && (
                      <div className="bg-orange-100 p-4 rounded-lg border border-orange-200 shadow-sm flex items-center gap-3 mt-1">
                        <Timer className="w-5 h-5 text-orange-600 flex-shrink-0" />
                        <div className="text-xs text-orange-800">
                          <span className="font-bold">Submission deadline for proponent:</span>{" "}
                          {formatDateTime(new Date(new Date(revisionData.created_at).getTime() + revisionData.deadline * 86400000))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <RefreshCw className="absolute -right-6 -bottom-6 w-32 h-32 text-orange-200 opacity-40 z-0 pointer-events-none" />
            </div>
          )}

          {/* Rejection Details Block */}
          {(['rejected', 'rejected_rnd', 'disapproved', 'reject', 'rejected proposal'].includes((p.status || '').toLowerCase())) && (
            <div className="bg-red-50 rounded-lg p-5 border border-red-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-red-800 flex items-center gap-2">
                  <XCircle className="w-5 h-5" />
                  Rejection Details
                </h3>
              </div>
              <div className="bg-white p-4 rounded border border-red-100">
                <p className="text-xs font-bold text-red-700 mb-2">Reason for Rejection</p>
                <p className="text-sm text-slate-700 whitespace-pre-wrap">
                  {rejectionComment || "Loading rejection details..."}
                </p>
                {rejectionDate && (
                  <p className="text-xs text-slate-500 mt-2 text-right italic">
                    Rejected on: {formatDate(rejectionDate)}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Documents Section */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#C8102E]" /> Project Documents
              </h3>
            </div>
            <div className="flex flex-col gap-3">
              {(() => {
                const projectFiles = p.versions && p.versions.length > 0 ? p.versions : (p.projectFile ? [p.projectFile] : []);

                const getFileName = (url: string) => {
                  if (!url) return "Document.pdf";
                  try {
                    const decoded = decodeURIComponent(url);
                    const parts = decoded.split(/[/\\]/);
                    return parts[parts.length - 1] || "Document.pdf";
                  } catch {
                    return "Document.pdf";
                  }
                };

                return projectFiles.length > 0 ? (
                  [...projectFiles].reverse().map((fileUrl, reversedIndex) => {
                    const isLatest = reversedIndex === 0;
                    const originalIndex = projectFiles.length - 1 - reversedIndex;
                    return (
                      <div key={originalIndex} className={`flex items-center justify-between bg-white p-3 rounded-lg border ${isLatest && projectFiles.length > 1 ? 'border-green-200 shadow-sm' : 'border-slate-200'} group hover:border-[#C8102E] transition-colors cursor-pointer`} onClick={() => handleDownload(fileUrl)}>
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 ${isLatest && projectFiles.length > 1 ? 'bg-green-100' : 'bg-slate-100'} rounded-lg flex items-center justify-center`}>
                            <FileCheck className={`w-5 h-5 ${isLatest && projectFiles.length > 1 ? 'text-green-600' : 'text-[#C8102E]'}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 group-hover:text-[#C8102E] transition-colors truncate max-w-[200px] sm:max-w-xs" title={getFileName(fileUrl)}>
                              {getFileName(fileUrl)}
                            </p>
                            <p className={`text-xs ${isLatest && projectFiles.length > 1 ? 'text-green-600 font-medium' : 'text-slate-500'}`}>
                              {isLatest ? 'Latest version' : `Version ${originalIndex + 1}`}
                            </p>
                          </div>
                        </div>
                        <button className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-50 hover:bg-[#C8102E] hover:text-white rounded-md transition-all">
                          <Download className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-200">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                        <FileCheck className="w-5 h-5 text-slate-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-400">No file uploaded</p>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* General Information Grid (Leader & Agency) */}
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-6">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-3 mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-[#C8102E]" /> Leader & Agency Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Leader Info */}
              <div>
                <label className="text-xs text-slate-500 font-bold tracking-wider uppercase block mb-1">Project Leader</label>
                <p className="text-sm font-semibold text-slate-900 mb-2">{p.proponent}</p>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-slate-700">
                    <Mail className="w-3.5 h-3.5 text-slate-400" /> {p.email}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-700">
                    <Phone className="w-3.5 h-3.5 text-slate-400" /> {p.telephone}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-700">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" /> {p.department || "N/A"}
                  </div>
                </div>
              </div>

              {/* Agency Info */}
              <div>
                <label className="text-xs text-slate-500 font-bold tracking-wider uppercase block mb-1">Agency</label>
                <p className="text-sm font-semibold text-slate-900 mb-2">{p.agency}</p>
                <div className="flex items-start gap-2 text-sm text-slate-700">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5" />
                  {(() => {
                    const addrString = p.address;
                    if (addrString && addrString !== "N/A" && addrString.trim() !== "") {
                      return addrString;
                    }
                    if (agencyAddresses.length > 0) {
                      const a = agencyAddresses[0];
                      const parts = [a.street, a.barangay, a.city].filter(Boolean);
                      return parts.length > 0 ? parts.join(", ") : "N/A";
                    }
                    return "N/A";
                  })()}
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
                {p.implementationSites.map((site, i) => (
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

          {/* Project Details Grid (Consolidated) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Cooperating Agencies */}
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                <Users className="w-4 h-4 text-[#C8102E]" /> Cooperating Agencies
              </h4>
              <p className="text-sm text-slate-900">{p.cooperatingAgencies || "None"}</p>
            </div>

            {/* Mode of Implementation */}
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                <FileText className="w-4 h-4 text-[#C8102E]" /> Mode of Implementation
              </h4>
              <p className="text-sm font-semibold text-slate-900">{formatString(p.modeOfImplementation)}</p>
            </div>

            {/* Classification */}
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                <Tags className="w-4 h-4 text-[#C8102E]" /> Classification
              </h4>
              <p className="text-sm font-semibold text-slate-900">{formatString(p.classification)}</p>
              {p.classificationDetails && p.classificationDetails !== "N/A" && <p className="text-xs text-slate-600 mt-1">{formatString(p.classificationDetails)}</p>}
            </div>

            {/* R&D Station */}
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                <Microscope className="w-4 h-4 text-[#C8102E]" /> R&D Station
              </h4>
              <p className="text-sm text-slate-900">{p.rdStation}</p>
            </div>

            {/* Priority Areas */}
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                <Target className="w-4 h-4 text-[#C8102E]" /> Priority Areas
              </h4>
              <p className="text-sm font-semibold text-slate-900">
                {(() => {
                  if (!p.priorityAreas) return "N/A";
                  // Try to parse array of IDs
                  try {
                    const parsed = JSON.parse(p.priorityAreas);
                    if (Array.isArray(parsed)) {
                      return parsed.map(id =>
                        priorityAreas.find(pa => Number(pa.id) === Number(id))?.name || id
                      ).join(", ");
                    }
                    return p.priorityAreas;
                  } catch {
                    return p.priorityAreas;
                  }
                })()}
              </p>
            </div>

            {/* Sector */}
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                <Briefcase className="w-4 h-4 text-[#C8102E]" /> Sector
              </h4>
              <p className="text-sm font-semibold text-slate-900">
                {isNaN(Number(p.sector))
                  ? p.sector
                  : sectors.find(s => Number(s.id) === Number(p.sector))?.name || p.sector}
              </p>
            </div>

            {/* Discipline (If available in data, else show N/A or hide) */}
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                <Briefcase className="w-4 h-4 text-[#C8102E]" /> Discipline
              </h4>
              <p className="text-sm font-semibold text-slate-900">
                {p.discipline || "N/A"}
              </p>
            </div>

          </div>

          {/* Schedule Section (ReadOnly) */}
          <div className="rounded-xl border p-4 bg-slate-50 border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#C8102E]" /> Implementing Schedule
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-slate-500 mb-1">Duration</p>
                <p className="text-sm font-semibold text-slate-900">{p.duration}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Start Date</p>
                <p className="text-sm font-medium text-slate-900">{formatDateShort(p.startDate)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">End Date</p>
                <p className="text-sm font-medium text-slate-900">{formatDateShort(p.endDate)}</p>
              </div>
            </div>
          </div>

          {/* Budget */}
          {p.budgetSources && (
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
              <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-[#C8102E]" /> Budget Requirements
              </h3>

              <div className="space-y-6">
                {p.budgetSources.map((budget: any, index: number) => (
                  <div key={index} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                    {/* Card Header */}
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

                    {/* Card Body */}
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

                {/* Visibility Setting Indicator (Visible to R&D) */}
                {(p.proponentInfoVisibility && p.proponentInfoVisibility !== 'both') && (
                  <div className="bg-yellow-50 px-4 py-3 border-t border-yellow-100 flex items-center gap-2 text-yellow-800 text-xs">
                    <Eye className="w-4 h-4" />
                    <span className="font-semibold">Visibility Restriction Active:</span>
                    <span>
                      {p.proponentInfoVisibility === 'name' ? 'Evaluators cannot see Proponent Name.' :
                        p.proponentInfoVisibility === 'agency' ? 'Evaluators cannot see Agency.' :
                          'Evaluators cannot see Name or Agency.'}
                    </span>
                  </div>
                )}

                {/* Grant Total Footer */}
                <div className="flex justify-end items-center gap-4 pt-2">
                  <span className="text-sm font-bold text-slate-600 uppercase">Grand Total Requirements</span>
                  <span className="text-xl font-bold text-[#C8102E]">{p.budgetTotal}</span>
                </div>

              </div>
            </div>
          )}
        </div>

        {/* Modal Footer with Actions for Pending Reviews (RND Context) */}
        <div className="p-4 sm:p-6 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3">
          {onAction && (p.status === 'review_rnd' || p.status === 'pending review' || p.status === 'pending' || p.status === 'revised_proposal' || p.status === 'Revised Proposal') && (
            <>
              {/* NOTE: 'Send to RND' button removed here for RND user context as they ARE the RND team */}
              <button
                onClick={() => onAction('forwardEval', p.id)}
                className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors shadow-sm flex items-center justify-center gap-2"
              >
                <Users className="w-4 h-4" />
                Assigned to Evaluator
              </button>
              <button
                onClick={() => setConfirmAction({ type: 'revision', id: p.id })}
                className="px-4 py-2 text-sm font-medium text-orange-700 bg-orange-100 border border-orange-200 rounded-lg hover:bg-orange-200 transition-colors shadow-sm flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Revise
              </button>
              <button
                onClick={() => setConfirmAction({ type: 'reject', id: p.id })}
                className="px-4 py-2 text-sm font-medium text-red-700 bg-red-100 border border-red-200 rounded-lg hover:bg-red-200 transition-colors shadow-sm flex items-center justify-center gap-2"
              >
                <XCircle className="w-4 h-4" />
                Reject
              </button>
            </>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors flex items-center justify-center"
          >
            Close
          </button>
        </div>

        {/* Confirmation Modal */}
        {confirmAction.type && (
          <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/20 backdrop-blur-[1px] p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-xl border border-slate-200 p-6 w-full max-w-sm transform scale-100 animate-in zoom-in-95 duration-200">
              <div className="flex flex-col items-center text-center gap-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${confirmAction.type === 'reject' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>
                  {confirmAction.type === 'reject' ? <AlertTriangle className="w-6 h-6" /> : <RefreshCw className="w-6 h-6" />}
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  {confirmAction.type === 'reject' ? 'Reject Proposal?' : 'Request Revision?'}
                </h3>
                <p className="text-sm text-slate-600">
                  {confirmAction.type === 'reject'
                    ? "Are you sure you want to reject this proposal? This action cannot be undone."
                    : "Are you sure you want to return this proposal for revision?"}
                </p>
                <div className="flex w-full gap-3 mt-4">
                  <button
                    onClick={() => setConfirmAction({ type: null, id: null })}
                    className="flex-1 px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (onAction && confirmAction.id) {
                        onAction(confirmAction.type as 'revision' | 'reject', String(confirmAction.id));
                      }
                      setConfirmAction({ type: null, id: null });
                    }}
                    className={`flex-1 px-4 py-2 text-sm font-bold text-white rounded-lg transition-colors ${confirmAction.type === 'reject' ? 'bg-red-600 hover:bg-red-700' : 'bg-orange-600 hover:bg-orange-700'}`}
                  >
                    Yes, {confirmAction.type === 'reject' ? 'Reject' : 'Revise'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RndViewModal;