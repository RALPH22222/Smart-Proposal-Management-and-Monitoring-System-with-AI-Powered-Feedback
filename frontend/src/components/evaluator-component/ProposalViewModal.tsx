import {
  X,
  Users,
  Target,
  Calendar,
  DollarSign,
  Phone,
  Mail,
  MapPin,
  FileText,
  User,
  Microscope,
  Tags,
  Briefcase,
  BookOpen,
  CheckCircle,
  XCircle,
  Clock,
  Globe,
  CalendarClock,
  FileCheck,
  EyeOff,
  Lock,
  RefreshCw,
  RotateCcw,
} from "lucide-react";
import { formatDateShort } from "../../utils/date-formatter";
import { getBudgetCategory } from "../../utils/budget-category";
import { openProposalFile, downloadSignedUrl, getFileName } from "../../utils/signed-url";
import { getFileActionMeta } from "../shared/FileActionButton";

// --- LOCAL INTERFACES ---
interface Site {
  site: string;
  city: string;
}

interface BudgetSource {
  source: string;
  ps: string; // Display string (formatted currency)
  mooe: string;
  co: string;
  total: string;
  breakdown?: { // Optional breakdown if available
    ps: { item: string; amount: number }[];
    mooe: { item: string; amount: number }[];
    co: { item: string; amount: number }[];
  };
}

export interface Proposal {
  id: number | string;
  title: string;
  proponent: string;
  gender: string;
  agency: string;
  address: string;
  telephone: string;
  email: string;
  modeOfImplementation: string;
  implementationSites: Site[];
  priorityAreas: string;
  status: string;
  projectType: string;
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
  proponentInfoVisibility?: 'name' | 'agency' | 'both' | 'none';
  assignedRdStaff?: string;
  rdCommentsToEvaluator?: string;
  evaluationDeadline?: string;
  projectFile?: string;
  extensionReason?: string;
  submittedDate?: string;
  estimated_budget?: any[];
  classification_type?: string;
  class_input?: string;
  assignedDate?: string;
  evaluatedDate?: string;
  remarks?: string;
  deadline?: string;
}

interface ProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  proposal: any;
}

// --- HELPERS ---
const formatString = (str: string) => {
  if (!str) return "N/A";
  return str
    .split(/[_\s]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

const fmt = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function ProposalModal({
  isOpen,
  onClose,
  proposal,
}: ProposalModalProps) {
  if (!isOpen || !proposal) return null;

  // Safe cast & Normalization
  const rawP = proposal as Proposal;

  // Normalize Classification
  let classification = rawP.classification;
  if (!classification && rawP.classification_type) {
    const map: Record<string, string> = { research_class: "Research", development_class: "Development" };
    classification = map[rawP.classification_type] || rawP.classification_type;
  }

  const classificationDetails = rawP.classificationDetails || rawP.class_input;

  // Normalize Budget
  let budgetSources = rawP.budgetSources;
  let budgetTotal = rawP.budgetTotal;

  if ((!budgetSources || budgetSources.length === 0) && rawP.estimated_budget && Array.isArray(rawP.estimated_budget)) {
    interface CatData { items: { subcategory?: string; specifications?: string; item: string; amount: number; quantity?: number; unit?: string; unitPrice?: number; unit_price?: number }[]; total: number }
    const budgetMap: Record<string, { ps: CatData; mooe: CatData; co: CatData }> = {};

    rawP.estimated_budget.forEach((b: any) => {
      const src = b.source || b.funding_agency || "Unknown Source";

      let amount = 0;
      if (typeof b.amount === 'string') {
        amount = parseFloat(b.amount.replace(/,/g, '')) || 0;
      } else {
        amount = Number(b.total_amount || b.amount) || 0;
      }

      const item = b.item || b.item_description || b.item_name || "Unspecified Item";
      const subcategory = b.subcategory || b.sub_category;
      const specifications = b.specifications || b.spec_volume;
      const quantity = b.quantity || b.qty;
      const unit = b.unit;
      const unitPrice = b.unit_price || b.unitPrice;

      let cat: "ps" | "mooe" | "co" = "mooe"; // Default to MOOE if unknown
      const normalizedCategory = getBudgetCategory(b);
      if (normalizedCategory) cat = normalizedCategory;

      if (!budgetMap[src]) {
        budgetMap[src] = {
          ps: { items: [], total: 0 },
          mooe: { items: [], total: 0 },
          co: { items: [], total: 0 }
        };
      }

      budgetMap[src][cat].total += amount;
      budgetMap[src][cat].items.push({ item, subcategory, specifications, amount, quantity, unit, unitPrice });
    });

    budgetSources = Object.entries(budgetMap).map(([source, data]) => ({
      source,
      ps: fmt(data.ps.total),
      mooe: fmt(data.mooe.total),
      co: fmt(data.co.total),
      total: fmt(data.ps.total + data.mooe.total + data.co.total),
      breakdown: {
        ps: data.ps.items,
        mooe: data.mooe.items,
        co: data.co.items
      }
    }));

    const grandTotal = Object.values(budgetMap).reduce((acc, curr) => acc + curr.ps.total + curr.mooe.total + curr.co.total, 0);
    budgetTotal = fmt(grandTotal);
  }


  const p = {
    ...rawP,
    classification: classification || "N/A",
    classificationDetails: classificationDetails,
    budgetSources,
    budgetTotal: budgetTotal || "0.00"
  };

  const handleViewFile = (fileUrl?: string) => {
    openProposalFile(fileUrl);
  };

  // --- THEME HELPER (Matched to RndViewModal style) ---
  const getStatusTheme = (status: string) => {
    const s = (status || "").toLowerCase();

    // Green (Approved/Funded)
    if (["accepted", "accept", "approve", "approved", "funded"].includes(s))
      return {
        bg: "bg-emerald-100",
        border: "border-emerald-200",
        text: "text-emerald-800",
        icon: <CheckCircle className="w-4 h-4 text-emerald-600" />,
        label: "Proposal Approved",
      };

    if (["extension_approved"].includes(s))
      return {
        bg: "bg-emerald-100",
        border: "border-emerald-200",
        text: "text-emerald-800",
        icon: <CheckCircle className="w-4 h-4 text-emerald-600" />,
        label: "Extension Approved",
      };

    // Red (Declined)
    if (["reject", "rejected", "decline", "disapproved", "extension_rejected"].includes(s))
      return {
        bg: "bg-red-100",
        border: "border-red-200",
        text: "text-red-800",
        icon: <XCircle className="w-4 h-4 text-red-600" />,
        label: s === "reject" ? "Proposal Reject" : s.includes("extension") ? "Extension Declined" : "Reject",
      };

    // Amber (Revise)
    if (["revise", "revision"].includes(s))
      return {
        bg: "bg-amber-100",
        border: "border-amber-200",
        text: "text-amber-800",
        icon: <RotateCcw className="w-4 h-4 text-amber-600" />,
        label: "Proposal Revise",
      };

    // Blue (Extension Req)
    if (["extension_requested", "extend"].includes(s))
      return {
        bg: "bg-blue-100",
        border: "border-blue-200",
        text: "text-blue-800",
        icon: <CalendarClock className="w-4 h-4 text-blue-600" />,
        label: "Extension Requested",
      };

    // Amber (Pending)
    if (["pending"].includes(s))
      return {
        bg: "bg-amber-100",
        border: "border-amber-200",
        text: "text-amber-800",
        icon: <Clock className="w-4 h-4 text-amber-600" />,
        label: "Pending Review",
      };

    // Cyan (Under Review)
    if (["for_review", "under_evaluation"].includes(s))
      return {
        bg: "bg-cyan-100",
        border: "border-cyan-200",
        text: "text-cyan-800",
        icon: <RefreshCw className="w-4 h-4 text-cyan-600" />,
        label: "Under Review",
      };

    // Default
    return {
      bg: "bg-slate-100",
      border: "border-slate-200",
      text: "text-slate-700",
      icon: <Clock className="w-4 h-4 text-slate-500" />,
      label: formatString(status),
    };
  };

  const theme = getStatusTheme(p.status);

  // Helper for Privacy
  const isNameVisible = (p.proponentInfoVisibility === 'both' || p.proponentInfoVisibility === 'name' || !p.proponentInfoVisibility);
  const isAgencyVisible = (p.proponentInfoVisibility === 'both' || p.proponentInfoVisibility === 'agency' || !p.proponentInfoVisibility);

  const ConfidentialBadge = () => (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-900 text-white border border-gray-800 text-xs font-semibold select-none">
      <Lock className="w-3 h-3" /> Confidential
    </span>
  );

  const renderBreakdown = (items?: any[]) => {
    if (!items || items.length === 0) {
      return (
        <p className="italic text-slate-400 text-xs py-2 text-center">No items recorded</p>
      );
    }
    return (
      <div className="overflow-x-auto rounded-lg border border-slate-100">
        <table className="w-full text-xs table-fixed">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="w-[20%] text-left px-3 py-2 font-semibold text-slate-500 uppercase tracking-wider">Subcategory</th>
              <th className="w-[35%] text-left px-3 py-2 font-semibold text-slate-500 uppercase tracking-wider">Item</th>
              <th className="w-[15%] text-left px-3 py-2 font-semibold text-slate-500 uppercase tracking-wider">Spec / Volume</th>
              <th className="w-[18%] text-center px-3 py-2 font-semibold text-slate-500 uppercase tracking-wider">Qty × Unit Price</th>
              <th className="w-[12%] text-right px-3 py-2 font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {items.map((b, i) => (
              <tr key={i} className="hover:bg-slate-50 transition-colors">
                <td className="px-3 py-2 text-slate-500 break-words whitespace-normal">{b.subcategory || b.sub_category || b.budget_subcategory || b.budgetSubcategory || b.custom_subcategory_label || '—'}</td>
                <td className="px-3 py-2 text-slate-800 font-medium break-words whitespace-normal">{b.item || '—'}</td>
                <td className="px-3 py-2 text-slate-500 italic break-words whitespace-normal">{b.specifications || b.spec || b.spec_volume || b.volume || '—'}</td>
                <td className="px-3 py-2 text-slate-600 text-center font-mono">
                  {(b.quantity || b.qty || b.volume)
                    ? `${b.quantity || b.qty || b.volume}${b.unit ? ` ${b.unit}` : ''} × ₱${new Intl.NumberFormat('en-PH').format(b.unitPrice || b.unit_price || 0)}`
                    : '—'}
                </td>
                <td className="px-3 py-2 text-slate-800 font-semibold text-right whitespace-nowrap">
                  ₱{new Intl.NumberFormat('en-PH').format(b.amount || 0)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

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

        {/* --- STATUS CONTEXTUAL COMMENT BLOCKS --- */}

          {/* Pending Review */}
          {p.status === "pending" && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 relative overflow-hidden animate-in fade-in slide-in-from-top-2">
              <div className="relative z-10 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <div className="w-full">
                  <h3 className="text-lg font-bold text-amber-800 mb-1 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-amber-600" /> Pending Your Review
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    This proposal has been forwarded to you for evaluation. Please review the details and submit your assessment by the deadline.
                  </p>
                  {p.deadline && p.deadline !== "N/A" && (
                    <p className="text-xs text-amber-700/90 mt-2 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      Evaluation Deadline: <span className="font-semibold ml-1">{p.deadline}</span>
                    </p>
                  )}
                </div>
              </div>
              <Clock className="absolute -right-6 -bottom-6 w-32 h-32 text-amber-200 opacity-40 z-0 pointer-events-none" />
            </div>
          )}

          {/* Accepted / Reviewed - Proposal Approved */}
          {["accepted", "accept", "approve", "approved", "funded"].includes((p.status || "").toLowerCase()) && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 relative overflow-hidden animate-in fade-in slide-in-from-top-2">
              <div className="relative z-10">
                <h3 className="text-lg font-bold text-emerald-800 mb-1 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-600" /> Proposal Approved
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  You have completed your evaluation and recommended this proposal for approval.
                </p>
                {p.remarks && (
                  <div className="mt-3 bg-white p-3 rounded-lg border border-emerald-100">
                    <p className="text-xs font-bold text-emerald-700 mb-1">Your Remarks:</p>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">{p.remarks}</p>
                  </div>
                )}
                {p.evaluatedDate && (
                  <p className="text-xs text-emerald-700/80 mt-2 flex items-center gap-1.5">
                    <CalendarClock className="w-3.5 h-3.5" />
                    Evaluated on: <span className="font-semibold ml-1">{new Date(p.evaluatedDate).toLocaleDateString()}</span>
                  </p>
                )}
              </div>
              <CheckCircle className="absolute -right-6 -bottom-6 w-32 h-32 text-emerald-200 opacity-40 z-0 pointer-events-none" />
            </div>
          )}

          {/* Proposal Revise */}
          {["revise", "revision"].includes((p.status || "").toLowerCase()) && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 relative overflow-hidden animate-in fade-in slide-in-from-top-2">
              <div className="relative z-10">
                <h3 className="text-lg font-bold text-amber-800 mb-1 flex items-center gap-2">
                  <RotateCcw className="w-5 h-5 text-amber-600" /> Proposal Revise
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  You have completed your evaluation and recommended this proposal for revision before it can move forward.
                </p>
                {p.remarks && (
                  <div className="mt-3 bg-white p-3 rounded-lg border border-amber-100">
                    <p className="text-xs font-bold text-amber-700 mb-1">Your Remarks:</p>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">{p.remarks}</p>
                  </div>
                )}
                {p.evaluatedDate && (
                  <p className="text-xs text-amber-700/80 mt-2 flex items-center gap-1.5">
                    <CalendarClock className="w-3.5 h-3.5" />
                    Evaluated on: <span className="font-semibold ml-1">{new Date(p.evaluatedDate).toLocaleDateString()}</span>
                  </p>
                )}
              </div>
              <RotateCcw className="absolute -right-6 -bottom-6 w-32 h-32 text-amber-200 opacity-40 z-0 pointer-events-none" />
            </div>
          )}

          {/* Proposal Reject */}
          {(p.status || "").toLowerCase() === "reject" && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-5 relative overflow-hidden animate-in fade-in slide-in-from-top-2">
              <div className="relative z-10">
                <h3 className="text-lg font-bold text-red-800 mb-1 flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-red-600" /> Proposal Reject
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  You have completed your evaluation and recommended this proposal for rejection.
                </p>
                {p.remarks && (
                  <div className="mt-3 bg-white p-3 rounded-lg border border-red-100">
                    <p className="text-xs font-bold text-red-700 mb-1">Your Remarks:</p>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">{p.remarks}</p>
                  </div>
                )}
                {p.evaluatedDate && (
                  <p className="text-xs text-red-700/80 mt-2 flex items-center gap-1.5">
                    <CalendarClock className="w-3.5 h-3.5" />
                    Evaluated on: <span className="font-semibold ml-1">{new Date(p.evaluatedDate).toLocaleDateString()}</span>
                  </p>
                )}
              </div>
              <XCircle className="absolute -right-6 -bottom-6 w-32 h-32 text-red-200 opacity-40 z-0 pointer-events-none" />
            </div>
          )}

          {/* Extension Requested */}
          {p.status === "extension_requested" && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 relative overflow-hidden animate-in fade-in slide-in-from-top-2">
              <h3 className="text-sm font-bold text-blue-800 mb-3 flex items-center gap-2">
                <CalendarClock className="w-5 h-5" />
                Reason for Extension Request
              </h3>
              <div className="bg-white p-4 rounded-lg border border-blue-100">
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {p.extensionReason || "The evaluator has requested additional time to thoroughly review the technical specifications and methodology of this proposal."}
                </p>
              </div>
              {p.deadline && p.deadline !== "N/A" && (
                <p className="text-xs text-blue-700/80 mt-3 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Original Deadline: <span className="font-semibold ml-1">{p.deadline}</span>
                </p>
              )}
              <CalendarClock className="absolute -right-6 -bottom-6 w-32 h-32 text-blue-200 opacity-40 z-0 pointer-events-none" />
            </div>
          )}

          {/* Extension Approved */}
          {p.status === "extension_approved" && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 relative overflow-hidden animate-in fade-in slide-in-from-top-2">
              <div className="relative z-10">
                <h3 className="text-lg font-bold text-emerald-800 mb-1 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-600" /> Extension Approved
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Your request for a deadline extension has been approved by R&D. You now have additional time to complete your evaluation.
                </p>
                {p.remarks && (
                  <div className="mt-3 bg-white p-3 rounded-lg border border-emerald-100">
                    <p className="text-xs font-bold text-emerald-700 mb-1">R&D Remarks:</p>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">{p.remarks}</p>
                  </div>
                )}
              </div>
              <CheckCircle className="absolute -right-6 -bottom-6 w-32 h-32 text-emerald-200 opacity-40 z-0 pointer-events-none" />
            </div>
          )}

          {/* Extension Rejected */}
          {p.status === "extension_rejected" && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-5 relative overflow-hidden animate-in fade-in slide-in-from-top-2">
              <div className="relative z-10 flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-red-800 flex items-center gap-2">
                  <XCircle className="w-5 h-5" /> Extension Declined
                </h3>
              </div>
              <div className="bg-white p-4 rounded-xl border border-red-100 shadow-sm">
                <p className="text-xs font-bold text-red-700 mb-2">Reason for Declining Extension:</p>
                <p className="text-sm text-slate-700 whitespace-pre-wrap">
                  {p.remarks || "Your extension request was reviewed and declined. Please proceed with your evaluation by the original deadline."}
                </p>
              </div>
              <XCircle className="absolute -right-6 -bottom-6 w-32 h-32 text-red-200 opacity-40 z-0 pointer-events-none" />
            </div>
          )}

          {/* Declined */}
          {["reject", "rejected", "decline", "disapproved"].includes((p.status || "").toLowerCase()) && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-5 relative overflow-hidden animate-in fade-in slide-in-from-bottom-2">
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-red-800 flex items-center gap-2">
                    <XCircle className="w-5 h-5" /> Evaluation Declined
                  </h3>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider bg-red-100 text-red-700 border border-red-200">
                    {(!p.remarks || p.remarks.toLowerCase().includes("missed") || p.remarks.toLowerCase().includes("system")) ? "Auto Decline" : "User Declined"}
                  </span>
                </div>
                <div className="bg-white p-4 rounded-xl border border-red-100 shadow-sm">
                  <p className="text-sm font-bold text-red-800 mb-2 tracking-wide">Feedback / Reason:</p>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                    {p.remarks || "System: Evaluation period expired. The invitation was automatically declined due to no action within the given timeframe."}
                  </p>
                  {p.deadline && p.deadline !== "N/A" && (
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end text-xs text-slate-500 italic">
                      <Clock className="w-3.5 h-3.5 mr-1 text-red-400" />
                      Evaluation Deadline: <span className="font-semibold ml-1">{p.deadline}</span>
                    </div>
                  )}
                  {p.evaluatedDate && (
                    <div className="mt-2 text-xs text-slate-500 italic flex items-center justify-end">
                      <XCircle className="w-3.5 h-3.5 mr-1 text-red-500" />
                      Declined: <span className="font-semibold ml-1">{new Date(p.evaluatedDate).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>
              <XCircle className="absolute -right-6 -bottom-6 w-32 h-32 text-red-200 opacity-40 z-0 pointer-events-none" />
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
              <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-200 group hover:border-[#C8102E] transition-colors cursor-pointer"
                onClick={() => handleViewFile(p.projectFile)}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                    <FileCheck className="w-5 h-5 text-[#C8102E]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900 group-hover:text-[#C8102E] transition-colors truncate max-w-[200px] sm:max-w-xs" title={getFileName(p.projectFile)}>
                      {getFileName(p.projectFile)}
                    </p>
                    <p className="text-xs text-slate-500">
                      Current Version
                    </p>
                  </div>
                </div>
                {(() => {
                  const meta = getFileActionMeta(p.projectFile);
                  const ActionIcon = meta.Icon;
                  return (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (meta.isViewable) openProposalFile(p.projectFile);
                        else downloadSignedUrl(p.projectFile);
                      }}
                      title={meta.title}
                      className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-50 hover:bg-[#C8102E] hover:text-white rounded-md transition-all"
                    >
                      <ActionIcon className="w-3 h-3" />
                    </button>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* Leader & Agency Information (With Visibility Logic) */}
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-6">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-3 mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-[#C8102E]" /> Leader & Agency Information
              {!isNameVisible && !isAgencyVisible && (
                <span className="ml-auto inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 border border-slate-200 text-xs font-medium">
                  <EyeOff className="w-3 h-3" /> Blind Review
                </span>
              )}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Leader Info */}
              <div>
                <label className="text-xs text-slate-500 font-bold tracking-wider uppercase block mb-1">Project Leader</label>
                <div className="mb-2">
                  {isNameVisible ? (
                    <p className="text-sm font-semibold text-slate-900">{p.proponent}</p>
                  ) : <ConfidentialBadge />}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-slate-700">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    {isNameVisible ? p.email : "---"}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-700">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    {isNameVisible ? p.telephone : "---"}
                  </div>
                </div>
              </div>

              {/* Agency Info */}
              <div>
                <label className="text-xs text-slate-500 font-bold tracking-wider uppercase block mb-1">Agency</label>
                <div className="mb-2">
                  {isAgencyVisible ? (
                    <p className="text-sm font-semibold text-slate-900">{p.agency}</p>
                  ) : <ConfidentialBadge />}
                </div>
                <div className="flex items-start gap-2 text-sm text-slate-700">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5" />
                  <div>
                    {isAgencyVisible ? p.address : "---"}
                  </div>
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

          {/* Project Details Grid */}
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
                <Target className="w-4 h-4 text-[#C8102E]" /> Priority Areas/STAND Classification
              </h4>
              <p className="text-sm font-semibold text-slate-900">
                {p.priorityAreas || "N/A"}
              </p>
            </div>

            {/* Sector */}
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                <Briefcase className="w-4 h-4 text-[#C8102E]" /> Sector/Commodity
              </h4>
              <p className="text-sm font-semibold text-slate-900">
                {p.sector || "N/A"}
              </p>
            </div>

            {/* Discipline */}
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                <BookOpen className="w-4 h-4 text-[#C8102E]" /> Discipline
              </h4>
              <p className="text-sm font-semibold text-slate-900">
                {p.discipline || "N/A"}
              </p>
            </div>

          </div>

          {/* Schedule Section */}
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

          {/* Budget Requirements (Card Style) */}
          {p.budgetSources && (
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
              <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-[#C8102E]" /> Budget Requirements
              </h3>

              <div className="space-y-4">
                {p.budgetSources.map((budget, index) => (
                  <div key={index} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    {/* Card Header */}
                    <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="bg-blue-100 p-1.5 rounded-lg text-blue-700">
                          <DollarSign className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Source of Funds</p>
                          <h4 className="font-bold text-slate-800 text-sm leading-tight">{budget.source}</h4>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Subtotal</p>
                        <p className="text-base font-bold text-[#C8102E]">{budget.total}</p>
                      </div>
                    </div>

                    {/* Category Summary Row */}
                    <div className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100 bg-slate-50/50">
                      <div className="px-4 py-2 flex items-center justify-between gap-2">
                        <span className="text-[12px] font-bold text-red-800 uppercase tracking-wider">PS</span>
                        <span className="text-xs font-bold text-slate-700">{budget.ps}</span>
                      </div>
                      <div className="px-4 py-2 flex items-center justify-between gap-2">
                        <span className="text-[12px] font-bold text-red-800 uppercase tracking-wider">MOOE</span>
                        <span className="text-xs font-bold text-slate-700">{budget.mooe}</span>
                      </div>
                      <div className="px-4 py-2 flex items-center justify-between gap-2">
                        <span className="text-[12px] font-bold text-red-800 uppercase tracking-wider">CO</span>
                        <span className="text-xs font-bold text-slate-700">{budget.co}</span>
                      </div>
                    </div>

                    {/* Breakdown per category */}
                    <div className="divide-y divide-slate-100">
                      {/* PS */}
                      {budget.breakdown?.ps && budget.breakdown.ps.length > 0 && (
                        <div className="p-4">
                          <h5 className="text-[12px] font-bold uppercase text-red-800 mb-2 flex items-center gap-1.5">
                            Personal Services (PS)
                          </h5>
                          {renderBreakdown(budget.breakdown.ps)}
                        </div>
                      )}
                      {/* MOOE */}
                      {budget.breakdown?.mooe && budget.breakdown.mooe.length > 0 && (
                        <div className="p-4">
                          <h5 className="text-[12px] font-bold uppercase text-red-800 mb-2 flex items-center gap-1.5">
                            Maintenance, Operating & Other Expenses (MOOE)
                          </h5>
                          {renderBreakdown(budget.breakdown.mooe)}
                        </div>
                      )}
                      {/* CO */}
                      {budget.breakdown?.co && budget.breakdown.co.length > 0 && (
                        <div className="p-4">
                          <h5 className="text-[12px] font-bold uppercase text-red-800 mb-2 flex items-center gap-1.5">
                            Capital Outlay (CO)
                          </h5>
                          {renderBreakdown(budget.breakdown.co)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Grand Total Footer */}
                <div className="flex justify-between items-center bg-[#C8102E] text-white rounded-xl px-5 py-3 mt-2">
                  <span className="text-sm font-bold uppercase tracking-wider">Total Project Cost</span>
                  <span className="text-xl font-black text-white">{p.budgetTotal}</span>
                </div>

              </div>
            </div>
          )}

        </div>

        {/* --- FOOTER --- */}
        <div className="p-4 sm:p-6 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
