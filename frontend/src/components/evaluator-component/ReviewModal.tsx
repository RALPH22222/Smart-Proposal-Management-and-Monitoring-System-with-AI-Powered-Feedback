import { useState, useEffect, Fragment } from "react";
import {
  X,
  FileText,
  Download,
  Users,
  Target,
  Calendar,
  DollarSign,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  XCircle,
  User,
  MapPin,
  Phone,
  Mail,
  Microscope,
  Tags,
  Briefcase,
  BookOpen,
  Globe,
  FileCheck, // Added
  Lock,
  EyeOff,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { formatDateShort } from "../../utils/date-formatter";
import { openProposalFile, getFileName } from "../../utils/signed-url";
import RubricsModal from "./RubricsModal";

const RATING_CRITERIA = {
  title: {
    label: "Title Assessment",
    descriptions: {
      5: "Title is concise, highly descriptive, accurately reflects the scope of the project, and is aligned with the research objectives",
      4: "Title is clear, relevant, and provides a good indication of the project's focus and goals",
      3: "Title is acceptable but could be more specific or better aligned with the project scope",
      2: "Title is vague, overly broad, or does not clearly convey the project's purpose",
      1: "Title is unclear, misleading, or irrelevant to the proposed research",
    },
  },
  budget: {
    label: "Budget Assessment",
    descriptions: {
      5: "Budget is well-justified, realistic, efficiently allocated, with clear cost breakdown and sound financial management plan",
      4: "Budget is appropriate with minor justification gaps or minor allocation concerns",
      3: "Budget is acceptable but lacks detailed justification for some line items",
      2: "Budget appears inflated or inadequately justified with unclear allocation logic",
      1: "Budget is unrealistic, poorly justified, or raises concerns about cost efficiency",
    },
  },
  timeline: {
    label: "Timeline Assessment",
    descriptions: {
      5: "Timeline is realistic, well-structured with clear milestones, deliverables, and contingency buffers",
      4: "Timeline is reasonable with appropriate milestones and reasonable contingency planning",
      3: "Timeline is acceptable but somewhat ambitious or lacks detailed milestone descriptions",
      2: "Timeline appears unrealistic, poorly structured, or lacks clear milestones",
      1: "Timeline is not feasible, unclear, or unrealistic given the project scope",
    },
  },
};

interface BudgetSource {
  source: string;
  ps: string;
  mooe: string;
  co: string;
  total: string;
  breakdown?: {
    ps: { item: string; amount: number }[];
    mooe: { item: string; amount: number }[];
    co: { item: string; amount: number }[];
  }
}

interface Sites {
  site: string;
  city: string;
}

interface Proposal {
  id: number;
  title: string;
  projectFile: string;
  proponent: string;
  gender: string;
  telephone: string;
  email: string;
  agency: string;
  address: string;
  cooperatingAgencies: string;
  rdStation: string;
  classification: string;
  classificationDetails: string;
  class_input?: string;
  modeOfImplementation: string;
  implementationSites: Sites[];
  priorityAreas: string;
  sector: string;
  discipline: string;
  year: number;
  duration: string;
  startDate: string;
  endDate: string;
  budgetSources: BudgetSource[];
  budgetTotal: string;
  proponentInfoVisibility?: 'name' | 'agency' | 'both' | 'none';
}

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  proposal: Proposal | null | undefined;
  onSubmit: (data: {
    decision: string;
    ratings: any;
    comments: string;
  }) => void;
  isLoading?: boolean;
}

export default function ReviewModal({
  isOpen,
  onClose,
  proposal,
  onSubmit,
  isLoading = false,
}: ReviewModalProps) {
  const [decision, setDecision] = useState<
    "Approve" | "Revise" | "Reject" | null
  >(null);

  const [ratings, setRatings] = useState({
    title: 0,
    budget: 0,
    timeline: 0,
  });

  const [isRubricsModalOpen, setIsRubricsModalOpen] = useState(false);
  const [overallComment, setOverallComment] = useState("");

  useEffect(() => {
    if (isOpen) {
      setDecision(null);
      setRatings({
        title: 0,
        budget: 0,
        timeline: 0,
      });
      setOverallComment("");
    }
  }, [isOpen, proposal]);

  // Validation Check: All ratings must be > 0 and a decision must be made.
  const isFormValid =
    decision !== null &&
    ratings.title > 0 &&
    ratings.budget > 0 &&
    ratings.timeline > 0;
  const ratingKeys = ["title", "budget", "timeline"] as const;
  const totalScore = ratings.title + ratings.budget + ratings.timeline;
  const maxScore = ratingKeys.length * 5;
  const completionCount = ratingKeys.filter((key) => ratings[key] > 0).length;

  const handleViewFile = (fileUrl?: string) => {
    openProposalFile(fileUrl);
  };

  const isNameVisible = (proposal?.proponentInfoVisibility === 'both' || proposal?.proponentInfoVisibility === 'name' || !proposal?.proponentInfoVisibility);
  const isAgencyVisible = (proposal?.proponentInfoVisibility === 'both' || proposal?.proponentInfoVisibility === 'agency' || !proposal?.proponentInfoVisibility);

  const ConfidentialBadge = () => (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-900 text-white border border-gray-800 text-xs font-semibold select-none">
      <Lock className="w-3 h-3" /> Confidential
    </span>
  );

  const handleRatingChange = (category: string, value: number) => {
    setRatings((prev) => ({
      ...prev,
      [category]: value,
    }));
  };

  const handleSubmit = () => {
    if (isFormValid) {
      onSubmit({
        decision: decision!,
        ratings,
        comments: overallComment,
      });
    }
  };

  const getRatingColor = (value: number) => {
    if (value >= 4) return "bg-emerald-600 text-white border-emerald-600";
    if (value === 3) return "bg-amber-500 text-white border-amber-500";
    return "bg-red-600 text-white border-red-600";
  };

  const getFeedbackCardColor = (value: number) => {
    if (value >= 4) return "bg-emerald-50 border-emerald-200 text-emerald-900";
    if (value === 3) return "bg-amber-50 border-amber-200 text-amber-900";
    return "bg-red-50 border-red-200 text-red-900";
  };

  const getRatingLabel = (value: number) => {
    if (value === 1) return "Poor";
    if (value === 2) return "Fair";
    if (value === 3) return "Good";
    if (value === 4) return "Very Good";
    if (value === 5) return "Excellent";
    return "Not Rated";
  };


  // Helper to format string for display
  const formatString = (str: string) => {
    if (!str) return "N/A";
    return str
      .split(/[_\s]+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const renderBreakdown = (items?: any[]) => {
    if (!items || items.length === 0) {
      return (
        <p className="italic text-slate-400 text-xs py-2 text-center">No items recorded</p>
      );
    }
    return (
      <div className="overflow-x-auto rounded-lg border border-slate-100">
        <table className="min-w-[800px] w-full text-xs table-fixed">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="w-[30%] text-left px-3 py-2 font-semibold text-slate-500 uppercase tracking-wider">Item</th>
              <th className="w-[20%] text-left px-3 py-2 font-semibold text-slate-500 uppercase tracking-wider">Subcategory</th>
              <th className="w-[15%] text-left px-3 py-2 font-semibold text-slate-500 uppercase tracking-wider">Spec / Volume</th>
              <th className="w-[20%] text-center px-3 py-2 font-semibold text-slate-500 uppercase tracking-wider">Qty × Unit Price</th>
              <th className="w-[15%] text-right px-3 py-2 font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {items.map((b, i) => (
              <tr key={i} className="hover:bg-slate-50 transition-colors">
                <td className="px-3 py-2 text-slate-800 font-medium break-words whitespace-normal">{b.item || '—'}</td>
                <td className="px-3 py-2 text-slate-500 break-words whitespace-normal">{b.subcategory || b.sub_category || '—'}</td>
                <td className="px-3 py-2 text-slate-500 italic break-words whitespace-normal">{b.specifications || b.spec_volume || '—'}</td>
                <td className="px-3 py-2 text-slate-600 text-center font-mono">
                  {(b.quantity || b.qty)
                    ? `${b.quantity || b.qty}${b.unit ? ` ${b.unit}` : ''} × ₱${new Intl.NumberFormat('en-PH').format(b.unitPrice || b.unit_price || 0)}`
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

  if (!isOpen || !proposal) return null;

  return (
    <>
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-100 text-cyan-800 border border-cyan-200">
                <RefreshCw className="w-3.5 h-3.5 text-cyan-600" />
                Under Review
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              {proposal.title}
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Review and provide feedback
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
          <div className="space-y-4 sm:space-y-6">

            {/* Documents Section (Updated Layout) */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#C8102E]" /> Project Documents
                </h3>
              </div>
              <div
                className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-200 group hover:border-[#C8102E] transition-colors cursor-pointer"
                onClick={() => handleViewFile(proposal.projectFile)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                    <FileCheck className="w-5 h-5 text-[#C8102E]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900 group-hover:text-[#C8102E] transition-colors truncate max-w-[200px] sm:max-w-xs" title={getFileName(proposal.projectFile)}>
                      {getFileName(proposal.projectFile)}
                    </p>
                    <p className="text-xs text-slate-500">
                      PDF Document
                    </p>
                  </div>
                </div>
                <button className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-50 hover:bg-[#C8102E] hover:text-white rounded-md transition-all">
                  <Download className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* General Information Grid (Leader & Agency) - REMOVED GENDER */}
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
                      <p className="text-sm font-semibold text-slate-900">{proposal.proponent}</p>
                    ) : <ConfidentialBadge />}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-slate-700">
                      <Mail className="w-3.5 h-3.5 text-slate-400" /> {isNameVisible ? proposal.email : "---"}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-700">
                      <Phone className="w-3.5 h-3.5 text-slate-400" /> {isNameVisible ? proposal.telephone : "---"}
                    </div>
                  </div>
                </div>

                {/* Agency Info */}
                <div>
                  <label className="text-xs text-slate-500 font-bold tracking-wider uppercase block mb-1">Agency</label>
                  <div className="mb-2">
                    {isAgencyVisible ? (
                      <p className="text-sm font-semibold text-slate-900">{proposal.agency}</p>
                    ) : <ConfidentialBadge />}
                  </div>
                  <div className="flex items-start gap-2 text-sm text-slate-700">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5" />
                    <div>
                      {isAgencyVisible ? proposal.address : "---"}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Implementation Sites */}
            {proposal.implementationSites && proposal.implementationSites.length > 0 && (
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-6">
                <h3 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-3 mb-4 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-[#C8102E]" /> Implementation Sites ({proposal.implementationSites.length})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {proposal.implementationSites.map((site, i) => (
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
                <p className="text-sm text-slate-900">{proposal.cooperatingAgencies || "None"}</p>
              </div>

              {/* Mode of Implementation */}
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                  <FileText className="w-4 h-4 text-[#C8102E]" /> Mode of Implementation
                </h4>
                <p className="text-sm font-semibold text-slate-900">{formatString(proposal.modeOfImplementation)}</p>
              </div>

              {/* Classification */}
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                  <Tags className="w-4 h-4 text-[#C8102E]" /> Classification
                </h4>
                <p className="text-sm font-semibold text-slate-900">{formatString(proposal.classification)}</p>
                {proposal.classificationDetails && proposal.classificationDetails !== "N/A" && (
                  <p className="text-xs text-slate-600 mt-1">{formatString(proposal.classificationDetails)}</p>
                )}
              </div>

              {/* R&D Station */}
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                  <Microscope className="w-4 h-4 text-[#C8102E]" /> R&D Station
                </h4>
                <p className="text-sm text-slate-900">{proposal.rdStation}</p>
              </div>

              {/* Priority Areas */}
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                  <Target className="w-4 h-4 text-[#C8102E]" /> Priority Areas/STAND Classification
                </h4>
                <p className="text-sm font-semibold text-slate-900">
                  {proposal.priorityAreas || "N/A"}
                </p>
              </div>

              {/* Sector */}
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                  <Briefcase className="w-4 h-4 text-[#C8102E]" /> Sector/Commodity
                </h4>
                <p className="text-sm font-semibold text-slate-900">
                  {proposal.sector || "N/A"}
                </p>
              </div>

              {/* Discipline */}
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                  <BookOpen className="w-4 h-4 text-[#C8102E]" /> Discipline
                </h4>
                <p className="text-sm font-semibold text-slate-900">
                  {proposal.discipline || "N/A"}
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
                  <p className="text-sm font-semibold text-slate-900">{proposal.duration}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Start Date</p>
                  <p className="text-sm font-medium text-slate-900">{formatDateShort(proposal.startDate)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">End Date</p>
                  <p className="text-sm font-medium text-slate-900">{formatDateShort(proposal.endDate)}</p>
                </div>
              </div>
            </div>

            {/* Budget Requirements (Card Style) */}
            {proposal.budgetSources && (
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
                <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-[#C8102E]" /> Budget Requirements
                </h3>

                <div className="space-y-4">
                  {proposal.budgetSources.map((budget, index) => (
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
                          <span className="text-[10px] font-bold text-violet-600 uppercase tracking-wider">PS</span>
                          <span className="text-xs font-bold text-slate-700">{budget.ps}</span>
                        </div>
                        <div className="px-4 py-2 flex items-center justify-between gap-2">
                          <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">MOOE</span>
                          <span className="text-xs font-bold text-slate-700">{budget.mooe}</span>
                        </div>
                        <div className="px-4 py-2 flex items-center justify-between gap-2">
                          <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">CO</span>
                          <span className="text-xs font-bold text-slate-700">{budget.co}</span>
                        </div>
                      </div>

                      {/* Breakdown per category */}
                      <div className="divide-y divide-slate-100">
                        {budget.breakdown?.ps && budget.breakdown.ps.length > 0 && (
                          <div className="p-4">
                            <h5 className="text-[10px] font-extrabold uppercase tracking-widest text-violet-600 mb-2 flex items-center gap-1.5">
                              <span className="inline-block w-2 h-2 rounded-full bg-violet-500"></span>
                              Personal Services (PS)
                            </h5>
                            {renderBreakdown(budget.breakdown.ps)}
                          </div>
                        )}
                        {budget.breakdown?.mooe && budget.breakdown.mooe.length > 0 && (
                          <div className="p-4">
                            <h5 className="text-[10px] font-extrabold uppercase tracking-widest text-amber-600 mb-2 flex items-center gap-1.5">
                              <span className="inline-block w-2 h-2 rounded-full bg-amber-500"></span>
                              Maintenance, Operating & Other Expenses (MOOE)
                            </h5>
                            {renderBreakdown(budget.breakdown.mooe)}
                          </div>
                        )}
                        {budget.breakdown?.co && budget.breakdown.co.length > 0 && (
                          <div className="p-4">
                            <h5 className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-600 mb-2 flex items-center gap-1.5">
                              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
                              Capital Outlay (CO)
                            </h5>
                            {renderBreakdown(budget.breakdown.co)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Grand Total Footer */}
                  <div className="flex justify-between items-center bg-slate-900 text-white rounded-xl px-5 py-3 mt-2">
                    <span className="text-sm font-bold uppercase tracking-wider">Total Project Cost</span>
                    <span className="text-xl font-black text-white">{proposal.budgetTotal}</span>
                  </div>

                </div>
              </div>
            )}



            {/* --- EVALUATOR COMMENTS & RATINGS SECTION --- */}
            <div className="border-t-2 border-slate-300 pt-6 mt-6">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-[#C8102E]" />
                  Evaluator Comments & Ratings
                </h3>
                <button
                  type="button"
                  onClick={() => setIsRubricsModalOpen(true)}
                  className="px-3 py-1.5 text-xs font-bold text-[#C8102E] bg-red-50 hover:bg-red-100 rounded-lg flex items-center gap-1.5 transition-colors border border-red-100"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  View Rubrics
                </button>
              </div>
              <p className="text-sm text-slate-500 mb-4">
                Use the matrix below to rate each criterion from <span className="font-semibold text-slate-700">1 (Poor)</span> to{" "}
                <span className="font-semibold text-slate-700">5 (Excellent)</span>. Select one rating per criterion row.
              </p>

              <div className="space-y-6">
                <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <p className="text-xs uppercase tracking-wider font-semibold text-slate-500">Overall Score</p>
                    <p className="text-2xl font-black text-slate-900 mt-1">
                      {totalScore}
                      <span className="text-base font-bold text-slate-400">/{maxScore}</span>
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <p className="text-xs uppercase tracking-wider font-semibold text-slate-500">Average Rating</p>
                    <p className="text-2xl font-black text-slate-900 mt-1">
                      {(totalScore / ratingKeys.length).toFixed(1)}
                      <span className="text-base font-bold text-slate-400">/5</span>
                    </p>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 font-medium">Rated {completionCount}/{ratingKeys.length} criteria</p>

                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="text-left px-4 py-3 font-bold text-slate-700 min-w-[220px]">Criterion</th>
                          {[1, 2, 3, 4, 5].map((num) => (
                            <th key={num} className="text-center px-2 py-3 font-bold text-slate-700 min-w-[90px]">
                              <div className="leading-tight">
                                <div className="text-base">{num}</div>
                                <div className="text-xs font-bold text-slate-600">
                                  {num === 1 ? "Poor" : num === 2 ? "Fair" : num === 3 ? "Good" : num === 4 ? "Very Good" : "Excellent"}
                                </div>
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {ratingKeys.map((criterionKey) => {
                          const criterion = RATING_CRITERIA[criterionKey];
                          const value = (ratings as any)[criterionKey] ?? 0;
                          return (
                            <Fragment key={criterionKey}>
                              <tr key={criterionKey} className="border-b border-slate-100">
                                <td className="px-4 py-3 align-middle bg-slate-50/50">
                                  <div className="font-semibold text-slate-900">{criterion.label} <span className="text-red-500">*</span></div>
                                  {value > 0 && (
                                    <span className={`mt-1 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${getRatingColor(value)}`}>
                                      {getRatingLabel(value)}
                                    </span>
                                  )}
                                </td>
                                {[1, 2, 3, 4, 5].map((num) => {
                                  const selected = value === num;
                                  return (
                                    <td key={num} className="px-0 py-0 text-center">
                                      <button
                                        type="button"
                                        onClick={() => handleRatingChange(criterionKey, num)}
                                        className={`w-full h-12 border-r border-slate-200 text-sm font-bold transition-all duration-200 ease-out cursor-pointer active:scale-95 ${
                                          selected
                                            ? `${getRatingColor(num)} shadow-inner scale-[1.02]`
                                            : "bg-white text-slate-500 hover:bg-slate-100 hover:text-slate-800 hover:-translate-y-[1px] hover:shadow-sm"
                                        }`}
                                        aria-pressed={selected}
                                        aria-label={`${criterion.label}: ${num}`}
                                      >
                                        {num}
                                      </button>
                                    </td>
                                  );
                                })}
                              </tr>
                              {value > 0 && (
                                <tr className="border-b border-slate-100 last:border-b-0">
                                  <td colSpan={6} className="px-4 py-3 bg-white">
                                    <div className={`text-sm leading-relaxed p-3 rounded-lg border ${getFeedbackCardColor(value)}`}>
                                      <span className="font-bold">{getRatingLabel(value)} ({value}/5):</span>{" "}
                                      {(criterion.descriptions as Record<number, string>)[value]}
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
                </div>

                {/* 5. Comments (Optional) */}
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-slate-500" />
                    <label className="block text-sm font-bold text-slate-900">
                      Comments{" "}
                      <span className="text-slate-400 font-normal text-xs">
                        (Optional)
                      </span>
                    </label>
                  </div>
                  <textarea
                    value={overallComment}
                    onChange={(e) => setOverallComment(e.target.value)}
                    placeholder="Provide overall feedback and recommendations..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-[#C8102E] resize-none"
                    rows={4}
                  />
                </div>

                {/* Suggested Decision Section */}
                <div className="border-t border-slate-200 pt-6 mt-2">
                  <h4 className="block text-sm font-bold text-slate-900 mb-3">
                    Suggested Decision <span className="text-red-500">*</span>
                  </h4>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={() => setDecision("Approve")}
                      className={`flex cursor-pointer flex-col sm:flex-row items-center justify-center gap-2 p-3 rounded-xl border transition-all duration-200 ${decision === "Approve"
                        ? "bg-green-600 text-white border-green-600 shadow-md transform scale-[1.02]"
                        : "bg-white text-slate-600 border-slate-200 hover:border-green-500 hover:text-green-600 hover:bg-green-50"
                        }`}
                    >
                      <CheckCircle
                        className={`w-5 h-5 ${decision === "Approve"
                          ? "text-white"
                          : "text-green-600"
                          }`}
                      />
                      <span className="font-semibold text-sm">Approve</span>
                    </button>

                    <button
                      onClick={() => setDecision("Revise")}
                      className={`flex cursor-pointer flex-col sm:flex-row items-center justify-center gap-2 p-3 rounded-xl border transition-all duration-200 ${decision === "Revise"
                        ? "bg-yellow-500 text-white border-yellow-500 shadow-md transform scale-[1.02]"
                        : "bg-white text-slate-600 border-slate-200 hover:border-yellow-500 hover:text-yellow-600 hover:bg-yellow-50"
                        }`}
                    >
                      <AlertCircle
                        className={`w-5 h-5 ${decision === "Revise"
                          ? "text-white"
                          : "text-yellow-500"
                          }`}
                      />
                      <span className="font-semibold text-sm">Revise</span>
                    </button>

                    <button
                      onClick={() => setDecision("Reject")}
                      className={`flex cursor-pointer flex-col sm:flex-row items-center justify-center gap-2 p-3 rounded-xl border transition-all duration-200 ${decision === "Reject"
                        ? "bg-red-700 text-white border-red-700 shadow-md transform scale-[1.02]"
                        : "bg-white text-slate-600 border-slate-200 hover:border-red-800 hover:text-red-700 hover:bg-red-50"
                        }`}
                    >
                      <XCircle
                        className={`w-5 h-5 ${decision === "Reject" ? "text-white" : "text-red-700"
                          }`}
                      />
                      <span className="font-semibold text-sm">Reject</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors border ${
              isLoading 
                ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed" 
                : "text-slate-700 bg-white border-slate-300 hover:bg-slate-100 cursor-pointer"
            }`}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!isFormValid || isLoading}
            className={`px-6 py-2 text-sm font-medium text-white rounded-lg transition-all shadow-sm flex items-center justify-center gap-2 min-w-[140px] ${
              !isFormValid || isLoading
                ? "bg-slate-400 cursor-not-allowed opacity-80"
                : "cursor-pointer bg-[#C8102E] hover:bg-[#A00E26]"
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Review"
            )}
          </button>
        </div>
      </div>
    </div>
    <RubricsModal 
      isOpen={isRubricsModalOpen} 
      onClose={() => setIsRubricsModalOpen(false)} 
    />
    </>
  );
}