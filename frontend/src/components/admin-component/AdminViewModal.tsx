import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Users,
  MessageSquare,
  Calendar,
  HandCoins,
  Phone,
  Mail,
  FileText,
  Search,
  User,
  Microscope,
  Tags,
  Download,
  XCircle,
  RefreshCw,
  Clock,
  Briefcase,
  FileCheck,
  Timer,
  Building2,
  MapPin,
  Send,
  Globe,
  CheckCircle,
  Target,

} from "lucide-react";
import { fetchAgencyAddresses, fetchDepartments, fetchRejectionSummary, type AddressItem, type LookupItem, fetchRevisionSummary, type RevisionSummary, getAssignmentTracker } from "../../services/proposal.api";
import { ProposalInsightButtons } from "../shared/ProposalInsightsPanel";
import { formatDateShort, formatDateTime, formatDate } from "../../utils/date-formatter";
import { openProposalFile, getFileName } from "../../utils/signed-url";

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
  workPlanFileUrl?: string;
  submittedBy?: string;
  submittedDate: string;
  lastModified?: string;
  proponent: string;
  proponentProfilePicture?: string;
  department?: string;
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
  budgetSources: BudgetSource[];
  budgetTotal: string;
  classification_type?: string;
  class_input?: string;
  assignedBy?: string;
  assignedRdStaff?: string;
  evaluators?: { name: string; department?: string; status: string }[];
  endorsementJustification?: string;
}

interface AdminViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Use 'any' for prop to accept parent data, then cast internally
  proposal: any;
  onAction?: (_action: 'sendToRnd' | 'forwardEval' | 'revision' | 'reject', _proposalId: string) => void;
  agencies?: LookupItem[];
  sectors?: LookupItem[];
  priorityAreas?: LookupItem[];
}

// --- HELPER FUNCTIONS ---

// Format classification type - remove "_class" suffix first
const formatClassificationType = (str: string) => {
  if (!str) return "N/A";
  // Remove _class suffix if present
  const cleaned = str.replace(/_class$/i, '');
  return cleaned
    .split(/[_\s]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

// Format class input - make it human readable
const formatClassInput = (str: string) => {
  if (!str) return "";
  return str
    .split(/[_\s]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

// --- SCROLLING TEXT HELPERS ---
const ScrollKeyframes = () => (
  <style>{`
    @keyframes banner-marquee-bounce {
      0%, 15% { transform: translateX(0); }
      85%, 100% { transform: translateX(var(--scroll-amount)); }
    }
    .animate-banner-marquee {
      animation: banner-marquee-bounce 8s alternate infinite ease-in-out;
    }
  `}</style>
);

const ScrollingBannerText: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "" }) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const textRef = React.useRef<HTMLDivElement>(null);
  const [shouldAnimate, setShouldAnimate] = React.useState(false);
  const [scrollAmount, setScrollAmount] = React.useState(0);

  React.useEffect(() => {
    const checkOverflow = () => {
      if (containerRef.current && textRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        const textWidth = textRef.current.scrollWidth;
        if (textWidth > containerWidth) {
          setShouldAnimate(true);
          setScrollAmount(textWidth - containerWidth + 24); // 24px extra buffer padding
        } else {
          setShouldAnimate(false);
          setScrollAmount(0);
        }
      }
    };
    checkOverflow();
    setTimeout(checkOverflow, 100);
    window.addEventListener('resize', checkOverflow);
    return () => window.removeEventListener('resize', checkOverflow);
  }, [children]);

  return (
    <div ref={containerRef} className={`overflow-hidden flex-1 ${className}`}>
      <div
        ref={textRef}
        className={`whitespace-nowrap inline-block ${shouldAnimate ? 'animate-banner-marquee' : ''}`}
        style={shouldAnimate ? { ['--scroll-amount' as any]: `-${scrollAmount}px` } : undefined}
      >
        {children}
      </div>
    </div>
  );
};

// Currency Formatter helper
const formatCurrency = (value: string | number) => {
  if (value === undefined || value === null) return "₱0.00";
  
  // If it's a string, try to remove currency symbols and commas before parsing
  let numericValue: number;
  if (typeof value === 'string') {
    numericValue = parseFloat(value.replace(/[₱,]/g, ''));
  } else {
    numericValue = value;
  }

  if (isNaN(numericValue)) return "₱0.00";

  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericValue);
};

// Format string (e.g. "research_class" -> "Research Class")
const formatString = (str: string) => {
  if (!str) return "N/A";
  return str
    .split(/[_\s]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

const AdminViewModal: React.FC<AdminViewModalProps> = ({
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
  // Local state for departments to resolving ID to name
  const [departmentsList, setDepartmentsList] = useState<LookupItem[]>([]);
  // Rejection summary state
  const [rejectionComment, setRejectionComment] = useState<string | null>(null);
  const [rejectionDate, setRejectionDate] = useState<string | null>(null);
  // Revision data
  const [revisionData, setRevisionData] = useState<RevisionSummary | null>(null);
  const [isLoadingRevision, setIsLoadingRevision] = useState(false);
  // Evaluators data
  const [evaluators, setEvaluators] = useState<{ name: string; department?: string; status: string }[]>([]);
  const [isLoadingEvaluators, setIsLoadingEvaluators] = useState(false);

  // Fetch Departments if not provided
  useEffect(() => {
    const loadDepartments = async () => {
      try {
        const deptsData = await fetchDepartments();
        setDepartmentsList(deptsData);
      } catch (error) {
        console.error("Failed to fetch departments:", error);
      }
    };

    if (isOpen) {
      loadDepartments();
    }
  }, [isOpen]);

  // Fetch agency addresses (matching RndViewModal pattern)
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

  // Fetch Rejection Summary (matching RndViewModal)
  useEffect(() => {
    const fetchRejection = async () => {
      const statusLower = (p.status || '').toLowerCase();
      const isRejected = ['rejected', 'rejected_rnd', 'disapproved', 'reject', 'rejected proposal'].includes(statusLower);

      console.log(`[AdminViewModal] Proposal ${p.id} status check:`, {
        originalStatus: p.status,
        statusLower,
        isRejected,
        proposalId: p.id
      });

      if (isRejected) {
        try {
          console.log(`[AdminViewModal] Fetching rejection summary for proposal ${p.id}...`);
          const summary = await fetchRejectionSummary(Number(p.id));
          console.log(`[AdminViewModal] Rejection summary received:`, summary);

          if (summary) {
            setRejectionComment(summary.comment || "No specific comment provided.");
            setRejectionDate(summary.created_at || null);
          } else {
            setRejectionComment("No specific comment provided.");
            setRejectionDate(null);
          }
        } catch (error: any) {
          // Only log error if it's not a 404 (missing rejection data is expected for some cases)
          const status = error?.response?.status;
          if (status !== 404) {
            console.error(`Failed to fetch rejection summary for proposal ${p.id}:`, {
              status,
              message: error?.response?.data?.message || error?.message,
              error
            });
          } else {
            console.log(`[AdminViewModal] No rejection data found (404) for proposal ${p.id}`);
          }
          // Set default message instead of error message
          setRejectionComment("No rejection details available.");
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
          const data = await fetchRevisionSummary(Number(p.id));
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

  // Load assigned evaluators from the assignment tracker
  useEffect(() => {
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

  // Derived Address (Matching RndViewModal logic)
  const displayAddress = React.useMemo(() => {
    if (!p) return "";

    // 1. Prefer proposal address if valid/meaningful string
    const addrString = p.address;
    // Check if it's not effectively empty or "N/A"
    if (addrString && addrString !== "N/A" && addrString.trim() !== "") {
      return addrString;
    }

    // 2. Fallback to first fetched agency address if available
    if (agencyAddresses.length > 0) {
      const a = agencyAddresses[0];
      const parts = [a.street, a.barangay, a.city].filter(Boolean);
      return parts.length > 0 ? parts.join(", ") : "N/A";
    }

    // 3. Last resort
    return "N/A";
  }, [p, agencyAddresses]);

  // Derived Department Name
  const departmentName = React.useMemo(() => {
    if (!p?.department) return null;
    // p.department is likely a UUID string or ID. departmentsList items have numeric ID if from LookupItem?
    // Wait, fetchDepartments returns LookupItem[] {id: number, name: string}.
    // If p.department is a UUID string, it won't match numeric ID.
    // Assuming backend returns numeric ID for department if using standard LookupItem, 
    // OR fetchDepartments returns objects with UUID ids if aligned with new backend.
    // We try to match loosely.
    const dept = departmentsList.find(d => String(d.id) === String(p.department));
    return dept ? dept.name : p.department; // Fallback to displaying the ID if not found
  }, [p?.department, departmentsList]);

  if (!isOpen || !proposal) return null;

  // --- VIEW HANDLER ---
  const handleViewFile = (fileUrl: string) => {
    openProposalFile(fileUrl);
  };

  // NO_OP

  const isFunded = ['funded', 'accepted', 'approved'].includes((p?.status || '').toLowerCase());

  // --- THEME HELPER ---
  const getStatusTheme = (status: string) => {
    const s = (status || "").toLowerCase();

    // Green
    if (["endorsed", "endorsed_for_funding", "endorsed for funding"].includes(s))
      return {
        bg: "bg-green-100",
        border: "border-green-200",
        text: "text-green-800",
        icon: <CheckCircle className="w-4 h-4 text-green-600" />,
        label: "Endorsed for funding",
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

    // Blue
    if (["review_rnd", "r&d evaluation", "under r&d evaluation", "under r&d review"].includes(s))
      return {
        bg: "bg-blue-100",
        border: "border-blue-200",
        text: "text-blue-800",
        icon: <Search className="w-4 h-4 text-blue-600" />,
        label: "Under R&D Review",
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

  const renderBreakdown = (items?: any[], category?: 'ps' | 'mooe' | 'co') => {
    if (!items || items.length === 0) {
      return (
        <div className="p-4 pt-2">
          <p className="italic text-slate-400 text-xs">No items recorded for this category.</p>
        </div>
      );
    }

    const categoryConfig = {
      ps: { label: 'Personal Services (PS)', color: 'text-red-800', dot: 'bg-red-500' },
      mooe: { label: 'Maintenance, Operating & Other Expenses (MOOE)', color: 'text-red-800', dot: 'bg-red-500' },
      co: { label: 'Capital Outlay (CO)', color: 'text-red-800', dot: 'bg-red-500' }
    };

    const config = category && categoryConfig[category] ? categoryConfig[category] : { label: 'Breakdown', color: 'text-slate-600', dot: 'bg-slate-400' };

    return (
      <div className="p-4">
        <h5 className={`text-[12px] font-bold uppercase tracking-wider ${config.color} mb-2 flex items-center gap-1.5`}>
          {config.label}
        </h5>
        <div className="overflow-x-auto rounded-lg border border-slate-100">
          <table className="w-full text-xs table-fixed">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="w-[20%] text-left px-3 py-2 font-semibold text-slate-500 uppercase tracking-wider">Subcategory</th>
                <th className="w-[30%] text-left px-3 py-2 font-semibold text-slate-500 uppercase tracking-wider">Item</th>
                <th className="w-[15%] text-left px-3 py-2 font-semibold text-slate-500 uppercase tracking-wider">Spec / Volume</th>
                <th className="w-[20%] text-center px-3 py-2 font-semibold text-slate-500 uppercase tracking-wider">Qty × Unit Price</th>
                <th className="w-[15%] text-right px-3 py-2 font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {items.map((b, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors">
                  <td className="px-3 py-2 text-slate-500 break-words whitespace-normal">{(b.subcategory || b.sub_category || b.budget_subcategory || b.budgetSubcategory || b.custom_subcategory_label) || '—'}</td>
                  <td className="px-3 py-2 text-slate-800 font-medium break-words whitespace-normal">{b.item || '—'}</td>
                  <td className="px-3 py-2 text-slate-500 italic break-words whitespace-normal">{(b.specifications || b.spec || b.spec_volume || b.volume) || '—'}</td>
                  <td className="px-3 py-2 text-slate-600 text-center font-mono">
                    {(b.quantity || b.qty || b.volume) ? (
                      `${b.quantity || b.qty || b.volume}${b.unit ? ` ${b.unit}` : ''} × ${formatCurrency(b.unitPrice || b.unit_price || 0)}`
                    ) : '—'}
                  </td>
                  <td className="px-3 py-2 text-slate-800 font-semibold text-right whitespace-nowrap">
                    {formatCurrency(b.amount || parseInt(b.amount) || 0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return createPortal(
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200] p-2 sm:p-4 animate-in fade-in duration-200">
      <ScrollKeyframes />
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
            <ScrollingBannerText className="pr-4">
              <h2 className="text-xl font-bold text-gray-900 leading-tight">
                {p.title}
              </h2>
            </ScrollingBannerText>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 self-start sm:self-center">
            <ProposalInsightButtons
              proposalId={p.id}
              proposalTitle={p.title}
            />
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
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
                  {(p.lastModified || p.submittedDate) && (
                    <p className="text-xs text-emerald-700/90 mt-2 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      Funded on <span className="font-semibold">{formatDateShort(p.lastModified || p.submittedDate)}</span>
                    </p>
                  )}
                </div>
              </div>
              <CheckCircle className="absolute -right-6 -bottom-6 w-32 h-32 text-emerald-200 opacity-50 z-0 pointer-events-none" />
            </div>
          )}

          {/* Pending Status Block */}
          {['pending', 'pending review'].includes((p.status || '').toLowerCase()) && (
            <div className="bg-slate-50 border border-yellow-200 rounded-xl p-5 md:p-6 relative overflow-hidden animate-in fade-in slide-in-from-bottom-2">
              <div className="relative z-10 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <div className="w-full">
                  <h3 className="text-lg font-bold text-yellow-600 mb-1 flex items-center gap-2">
                    Proposal is awaiting your assignment
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed max-w-3xl">
                    This proposal has been successfully submitted and is now in your queue. You can review the project details and assign it to a specific R&D staff for evaluation to proceed with the next steps.
                  </p>
                  {(p.lastModified || p.submittedDate) && (
                    <p className="text-xs text-yellow-600 mt-3 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      Status updated on <span className="font-semibold">{formatDateShort(p.lastModified || p.submittedDate)}</span>
                    </p>
                  )}
                </div>
              </div>
              <Clock className="absolute -right-6 -bottom-6 w-32 h-32 text-amber-200 opacity-40 z-0 pointer-events-none" />
            </div>
          )}

          {/* Under R&D Review Status Block */}
          {['review_rnd', 'under r&d evaluation', 'under r&d review'].includes((p.status || '').toLowerCase()) && (
            <div className="bg-slate-50 border border-blue-200 rounded-xl p-5 md:p-6 relative overflow-hidden animate-in fade-in slide-in-from-bottom-2">
              <div className="relative z-10 flex flex-col gap-4">
                <div>
                  <h3 className="text-lg font-bold text-blue-700 mb-1 flex items-center gap-2">
                    Under R&D Review
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed max-w-3xl">
                    This proposal is currently under R&D review. The R&D staff is assessing the project's viability, budget, and timeline to determine the next appropriate steps.
                  </p>
                  {(p.lastModified || p.submittedDate) && (
                    <p className="text-xs text-blue-700/90 mt-2 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      Status updated on <span className="font-semibold">{formatDateShort(p.lastModified || p.submittedDate)}</span>
                    </p>
                  )}
                </div>

                {p.assignedRdStaff && (
                  <div className="bg-white border border-blue-100 rounded-lg p-4 shadow-sm">
                    <p className="text-sm text-slate-700 mb-3">
                      This proposal is currently assigned to the following R&D staff for review:
                    </p>
                    <div className="flex items-center gap-3 bg-blue-50/50 p-3 rounded-lg border border-blue-100">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-sm font-bold">
                        {p.assignedRdStaff.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{p.assignedRdStaff.split('(')[0].trim()}</p>
                        {/* Extract department/email from format: Name (Dept) - Email */}
                        <p className="text-xs text-slate-500">{p.assignedRdStaff.substring(p.assignedRdStaff.indexOf('('))}</p>
                      </div>
                    </div>
                  </div>
                )}
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
                  {(p.lastModified || p.submittedDate) && (
                    <p className="text-xs text-purple-700/90 mt-2 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      Status updated on <span className="font-semibold">{formatDateShort(p.lastModified || p.submittedDate)}</span>
                    </p>
                  )}
                </div>

                <div className="bg-white border border-purple-100 rounded-lg p-4 shadow-sm">
                  <p className="text-sm text-slate-700 mb-3">
                    {isLoadingEvaluators ? (
                      <div className="animate-pulse flex flex-wrap gap-2 mb-2">
                        {[1, 2, 3].map(i => <div key={i} className="h-7 w-28 bg-purple-100 rounded-full" />)}
                      </div>
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

          {/* Endorsed for Funding block */}
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
                  {p.endorsementJustification && (
                    <div className="mt-4 bg-white/60 p-4 rounded-lg border border-blue-200">
                      <p className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5" /> Endorsement Justification (Admin)
                      </p>
                      <p className="text-sm text-slate-700 whitespace-pre-wrap">
                        {p.endorsementJustification}
                      </p>
                    </div>
                  )}
                  {(p.lastModified || p.submittedDate) && (
                    <p className="text-xs text-blue-700/90 mt-2 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      Endorsed on <span className="font-semibold">{formatDateShort(p.lastModified || p.submittedDate)}</span>
                    </p>
                  )}
                </div>
              </div>
              <CheckCircle className="absolute -right-6 -bottom-6 w-32 h-32 text-blue-200 opacity-50 z-0 pointer-events-none" />
            </div>
          )}

          {/* Status Feedback Blocks */}
          {['revise', 'revision', 'revision_rnd', 'revision required'].includes((p.status || '').toLowerCase()) && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-5 md:p-6 relative overflow-hidden animate-in fade-in slide-in-from-bottom-2">
              <div className="relative z-10">
                <h3 className="text-lg font-bold text-orange-800 mb-2 flex items-center gap-2">
                  <RefreshCw className="w-5 h-5 text-orange-600" /> Revision Requirements
                </h3>
                <p className="text-xs text-gray-500 mt-0.5 mb-4">Feedback provided to the proponent. They must submit a revised proposal by the deadline.</p>

                {isLoadingRevision ? (
                  <div className="animate-pulse grid gap-3 mt-4">
                    <div className="bg-white/100 p-5 rounded-lg border border-orange-100 shadow-sm space-y-3">
                      <div className="h-3 w-32 bg-orange-200 rounded opacity-60" />
                      <div className="space-y-2">
                        <div className="h-3 w-full bg-orange-100 rounded" />
                        <div className="h-3 w-5/6 bg-orange-100 rounded opacity-70" />
                      </div>
                    </div>
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

          {/* Rejection Details Block (matching RndViewModal) */}
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
                {!rejectionComment ? (
                  <div className="animate-pulse space-y-2 pt-1 mb-2">
                    <div className="h-3 w-full bg-red-100 rounded" />
                    <div className="h-3 w-5/6 bg-red-100 rounded opacity-70" />
                  </div>
                ) : (
                  <p className="text-sm text-slate-700 whitespace-pre-wrap mb-2">
                    {rejectionComment}
                  </p>
                )}
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
              <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-200 group hover:border-[#C8102E] transition-colors cursor-pointer" onClick={() => handleViewFile(p.projectFile)}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                    <FileCheck className="w-5 h-5 text-[#C8102E]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900 group-hover:text-[#C8102E] transition-colors truncate max-w-[200px] sm:max-w-xs" title={getFileName(p.projectFile)}>
                      {getFileName(p.projectFile)}
                    </p>
                    <p className="text-xs text-slate-500">
                      DOST Form 1B{p.submittedDate ? ` — Submitted ${formatDateShort(p.submittedDate)}` : ""}
                    </p>
                  </div>
                </div>
                <button className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-50 hover:bg-[#C8102E] hover:text-white rounded-md transition-all">
                  <Download className="w-3 h-3" />
                </button>
              </div>
              {p.workPlanFileUrl && (
                <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-200 group hover:border-[#C8102E] transition-colors cursor-pointer" onClick={() => handleViewFile(p.workPlanFileUrl!)}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                      <FileCheck className="w-5 h-5 text-[#C8102E]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900 group-hover:text-[#C8102E] transition-colors truncate max-w-[200px] sm:max-w-xs" title={getFileName(p.workPlanFileUrl)}>
                        {getFileName(p.workPlanFileUrl)}
                      </p>
                      <p className="text-xs text-slate-500">DOST Form 3 — Work & Financial Plan</p>
                    </div>
                  </div>
                  <button className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-50 hover:bg-[#C8102E] hover:text-white rounded-md transition-all">
                    <Download className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* General Information Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Leader Info */}
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
              <div className="flex items-center gap-1.5 mb-2">
                <User className="w-4 h-4 text-[#C8102E]" />
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Project Leader</h4>
              </div>
              <div className="flex items-center gap-3 mb-1">
                {p.proponentProfilePicture ? (
                  <img
                    src={p.proponentProfilePicture}
                    alt={p.proponent}
                    className="w-10 h-10 rounded-full object-cover border border-slate-200"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500">
                    <User className="w-5 h-5" />
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold text-slate-900">{p.proponent}</p>
                  {departmentName && <p className="text-xs text-slate-500">{departmentName}</p>}
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <div>
                  <p className="text-xs text-slate-500 flex items-center gap-1"><Mail className="w-3 h-3" /> Email</p>
                  <p className="text-sm text-slate-800">{p.email || "N/A"}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 flex items-center gap-1"><Phone className="w-3 h-3" /> Contact</p>
                  <p className="text-sm text-slate-800">{p.telephone || "N/A"}</p>
                </div>
              </div>
            </div>

            {/* Agency Info */}
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
              <div className="flex items-center gap-1.5 mb-2">
                <Building2 className="w-4 h-4 text-[#C8102E]" />
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Agency</h4>
              </div>
              <p className="text-sm font-semibold text-slate-900">{p.agency}</p>
              <p className="text-xs text-slate-600 mt-1 flex items-start gap-1">
                <MapPin className="w-3 h-3 mt-0.5" /> {displayAddress}
              </p>
            </div>
          </div>

          {/* Project Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                <Briefcase className="w-4 h-4 text-[#C8102E]" /> Mode of Implementation
              </h4>
              <p className="text-sm font-semibold text-slate-900">{formatString(p.modeOfImplementation)}</p>
            </div>

            <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                <Users className="w-4 h-4 text-[#C8102E]" /> Cooperating Agencies
              </h4>
              <p className="text-sm text-slate-900">
                {(() => {
                  const ca = p.cooperatingAgencies;
                  if (!ca || (Array.isArray(ca) && ca.length === 0)) return "None";
                  if (Array.isArray(ca)) {
                    return ca.map((c: any) => c.name || c).join(", ");
                  }
                  return ca;
                })()}
              </p>
            </div>

            <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                <Microscope className="w-4 h-4 text-[#C8102E]" /> R&D Station
              </h4>
              <p className="text-sm text-slate-900">{p.rdStation}</p>
            </div>

            <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                <Tags className="w-4 h-4 text-[#C8102E]" /> Classification
              </h4>
              <p className="text-sm font-semibold text-slate-900">{formatClassificationType(p.classification || p.classification_type || "")}</p>
              {(p.classificationDetails || p.class_input) && (
                <p className="text-xs text-slate-600 mt-1">{formatClassInput(p.classificationDetails || p.class_input || "")}</p>
              )}
            </div>

            {/* Priority Areas */}
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                <Target className="w-4 h-4 text-[#C8102E]" /> Priority Areas/STAND Classification
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
                <Briefcase className="w-4 h-4 text-[#C8102E]" /> Sector/Commodity
              </h4>
              <p className="text-sm font-semibold text-slate-900">
                {isNaN(Number(p.sector))
                  ? p.sector
                  : sectors.find(s => Number(s.id) === Number(p.sector))?.name || p.sector}
              </p>
            </div>

            {/* Discipline */}
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                <Briefcase className="w-4 h-4 text-[#C8102E]" /> Discipline
              </h4>
              <p className="text-sm font-semibold text-slate-900">
                {p.discipline || "N/A"}
              </p>
            </div>
          </div>

          {/* Sites */}
          {p.implementationSites && p.implementationSites.length > 0 && (
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                <Globe className="w-4 h-4 text-[#C8102E]" /> Implementation Sites
              </h4>
              <div className="flex flex-wrap gap-2">
                {p.implementationSites.map((site, i) => (
                  <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 shadow-sm">
                    <MapPin className="w-3.5 h-3.5 text-blue-500" />
                    {site.site}, {site.city}
                  </span>
                ))}
              </div>
            </div>
          )}

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
              <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                <HandCoins className="w-4 h-4 text-[#C8102E]" /> Budget Requirements
              </h3>

              <div className="space-y-6">
                {p.budgetSources.map((budget: any, index: number) => (
                  <div key={index} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    {/* Card Header */}
                    <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="bg-blue-100 p-1.5 rounded-lg text-blue-700">
                          <HandCoins className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Source of Funds</p>
                          <h4 className="font-bold text-slate-800 text-sm leading-tight">{budget.source}</h4>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Subtotal</p>
                        <p className="text-base font-bold text-[#C8102E]">{formatCurrency(budget.total)}</p>
                      </div>
                    </div>

                    {/* Category Summary Row */}
                    <div className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100 bg-slate-50/50">
                      <div className="px-4 py-2 flex items-center justify-between gap-2">
                        <span className="text-[12px] font-bold text-red-800 uppercase tracking-wider">PS</span>
                        <span className="text-xs font-bold text-slate-700">{formatCurrency(budget.ps)}</span>
                      </div>
                      <div className="px-4 py-2 flex items-center justify-between gap-2">
                        <span className="text-[12px] font-bold text-red-800 uppercase tracking-wider">MOOE</span>
                        <span className="text-xs font-bold text-slate-700">{formatCurrency(budget.mooe)}</span>
                      </div>
                      <div className="px-4 py-2 flex items-center justify-between gap-2">
                        <span className="text-[12px] font-bold text-red-800 uppercase tracking-wider">CO</span>
                        <span className="text-xs font-bold text-slate-700">{formatCurrency(budget.co)}</span>
                      </div>
                    </div>

                    {/* Card Body: Breakdown Tables */}
                    <div className="divide-y divide-slate-100">
                      {renderBreakdown(budget.breakdown?.ps, 'ps')}
                      {renderBreakdown(budget.breakdown?.mooe, 'mooe')}
                      {renderBreakdown(budget.breakdown?.co, 'co')}
                    </div>
                  </div>
                ))}

                {/* Grand Total Footer */}
                <div className="flex justify-between items-center bg-[#C8102E] text-white rounded-xl px-5 py-3 mt-2 shadow-lg">
                  <span className="text-sm font-bold uppercase tracking-wider">Total Project Cost</span>
                  <span className="text-xl font-black text-white">{formatCurrency(p.budgetTotal)}</span>
                </div>

              </div>
            </div>
          )}
        </div>

        {/* Modal Footer with Actions for Pending Reviews */}
        <div className="p-4 sm:p-6 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3">
          {onAction && (p.status === 'review_rnd' || p.status === 'pending review' || p.status === 'pending') && (
            <>
              <button
                onClick={() => onAction('sendToRnd', p.id)}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                Send to RND
              </button>
              <button
                onClick={() => onAction('forwardEval', p.id)}
                className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors shadow-sm flex items-center justify-center gap-2"
              >
                <Users className="w-4 h-4" />
                Assigned to Evaluator
              </button>
              <button
                onClick={() => onAction('revision', p.id)}
                className="px-4 py-2 text-sm font-medium text-orange-700 bg-orange-100 border border-orange-200 rounded-lg hover:bg-orange-200 transition-colors shadow-sm flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Revise
              </button>
              <button
                onClick={() => onAction('reject', p.id)}
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
      </div>
    </div>,
    document.body
  );
};

export default AdminViewModal;