import {
  X,
  FileText,
  Download,
  MessageSquare,
  CheckCircle,
  RotateCcw,
  XCircle,
  User,
  MapPin,
  Phone,
  Mail,
  Microscope,
  Tags,
  Briefcase,
  BookOpen,
  Target,
  Calendar,
  DollarSign,
  Globe,
  Users,
  Lock,
  EyeOff,
} from "lucide-react";

// --- Data Constants ---
const RATING_CRITERIA = {
  objectives: {
    label: "Objectives Assessment",
    descriptions: {
      5: "Objectives are crystal clear, highly measurable, and very significant to the field with clear alignment to national priorities",
      4: "Objectives are clear and relevant with well-defined metrics and good alignment",
      3: "Objectives are understandable but lack specificity in some areas or could be more significant",
      2: "Objectives are vague, poorly justified, or lack clear connection to project scope",
      1: "Objectives are unclear, not measurable, or insignificant to the research field",
    },
  },
  methodology: {
    label: "Methodology Assessment",
    descriptions: {
      5: "Methodology is rigorous, innovative, well-designed, and highly feasible with detailed implementation plan",
      4: "Methodology is sound with appropriate methods, tools, and realistic timeline",
      3: "Methodology is acceptable but has some gaps in detail or minor feasibility concerns",
      2: "Methodology has significant flaws, questionable feasibility, or unclear implementation steps",
      1: "Methodology is inadequate, not clearly described, or fundamentally flawed",
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
  description: string;
  proponent: string;
  gender: string;
  telephone: string;
  email: string;
  agency: string;
  cooperatingAgencies: string;
  address: string;
  rdStation: string;
  classification: string;
  classificationDetails: string;
  class_input?: string;
  modeOfImplementation: string;
  implementationSites: Sites[];
  priorityAreas: string;
  sector: string;
  discipline: string;
  duration: string;
  schoolYear: string;
  startDate: string;
  endDate: string;
  budgetSources: BudgetSource[];
  budgetTotal: string;
  projectFile: string;
  ratings?: {
    objectives: number;
    methodology: number;
    budget: number;
    timeline: number;
  };
  decision?: string;
  comment: string; // Single string comment
  proponentInfoVisibility?: 'name' | 'agency' | 'both' | 'none';
}

interface ProposalDetailsModalProps {
  proposal: Proposal | undefined;
  isOpen: boolean;
  onClose: () => void;
}

export default function ProposalDetailsModal({
  proposal,
  isOpen,
  onClose,
}: ProposalDetailsModalProps) {
  if (!isOpen || !proposal) return null;

  const handleDownload = (fileName: string) => {
    console.log("[v0] Downloading file:", fileName);
    alert(`Downloading ${fileName}`);
  };

  const isNameVisible = (proposal.proponentInfoVisibility === 'both' || proposal.proponentInfoVisibility === 'name' || !proposal.proponentInfoVisibility);
  const isAgencyVisible = (proposal.proponentInfoVisibility === 'both' || proposal.proponentInfoVisibility === 'agency' || !proposal.proponentInfoVisibility);

  const ConfidentialBadge = () => (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-900 text-white border border-gray-800 text-xs font-semibold select-none">
      <Lock className="w-3 h-3" /> Confidential
    </span>
  );

  const getRatingColor = (value: number) => {
    if (value >= 4) return "bg-emerald-100 text-emerald-700 border-emerald-200";
    if (value === 3) return "bg-blue-100 text-blue-700 border-blue-200";
    return "bg-amber-100 text-amber-700 border-amber-200";
  };

  const getButtonStyles = (isSelected: boolean) => {
    if (isSelected) {
      return "bg-[#C8102E] text-white border-[#C8102E] shadow-md scale-105 font-bold";
    }
    return "bg-slate-50 text-slate-300 border-slate-100";
  };

  // Helper to format string for display
  const formatString = (str: string) => {
    if (!str) return "N/A";
    return str
      .split(/[_\s]+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const renderBreakdown = (items?: { item: string; amount: number }[]) => {
    if (!items || items.length === 0) {
      return <p className="italic text-slate-400">No itemized breakdown available</p>;
    }
    return (
      <ul className="space-y-1">
        {items.map((b, i) => (
          <li key={i} className="flex justify-between items-start gap-2">
            <span className="text-slate-600 line-clamp-2">{b.item}</span>
            <span className="text-slate-900 font-medium whitespace-nowrap">
              {new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(b.amount)}
            </span>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="p-4 sm:p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {proposal.title}
            </h2>
            <p className="text-sm text-slate-600 mt-1">Completed Review</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
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
                onClick={() => handleDownload(proposal.projectFile || "Full Project Proposal.pdf")}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-[#C8102E]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900 group-hover:text-[#C8102E] transition-colors">
                      {proposal.projectFile || "Full Project Proposal.pdf"}
                    </p>
                    <p className="text-xs text-slate-500">
                      PDF Document
                    </p>
                  </div>
                </div>
                <button className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-50 hover:bg-[#C8102E] hover:text-white rounded-md transition-all">
                  <Download className="w-3 h-3" />
                  Download
                </button>
              </div>
            </div>

            {/* General Information Grid (Leader & Agency) */}
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
                  <Target className="w-4 h-4 text-[#C8102E]" /> Priority Areas
                </h4>
                <p className="text-sm font-semibold text-slate-900">
                  {proposal.priorityAreas || "N/A"}
                </p>
              </div>

              {/* Sector */}
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                  <Briefcase className="w-4 h-4 text-[#C8102E]" /> Sector
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
                  <p className="text-sm font-medium text-slate-900">{proposal.startDate}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">End Date</p>
                  <p className="text-sm font-medium text-slate-900">{proposal.endDate}</p>
                </div>
              </div>
            </div>

            {/* Budget Requirements (Card Style) */}
            {proposal.budgetSources && (
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
                <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-[#C8102E]" /> Budget Requirements
                </h3>

                <div className="space-y-6">
                  {proposal.budgetSources.map((budget, index) => (
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
                        <div className="space-y-2 pt-2 md:pt-0 pl-0">
                          <div className="flex justify-between items-center mb-2">
                            <h5 className="font-bold text-slate-600 uppercase">Personal Services (PS)</h5>
                            <span className="font-semibold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">{budget.ps}</span>
                          </div>
                          {renderBreakdown(budget.breakdown?.ps)}
                        </div>

                        {/* MOOE */}
                        <div className="space-y-2 pt-2 md:pt-0 pl-0 md:pl-4">
                          <div className="flex justify-between items-center mb-2">
                            <h5 className="font-bold text-slate-600 uppercase">MOOE</h5>
                            <span className="font-semibold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">{budget.mooe}</span>
                          </div>
                          {renderBreakdown(budget.breakdown?.mooe)}
                        </div>

                        {/* CO */}
                        <div className="space-y-2 pt-2 md:pt-0 pl-0 md:pl-4">
                          <div className="flex justify-between items-center mb-2">
                            <h5 className="font-bold text-slate-600 uppercase">Capital Outlay (CO)</h5>
                            <span className="font-semibold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">{budget.co}</span>
                          </div>
                          {renderBreakdown(budget.breakdown?.co)}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Grand Total Footer */}
                  <div className="flex justify-end items-center gap-4 pt-2">
                    <span className="text-sm font-bold text-slate-600 uppercase">Grand Total Requirements</span>
                    <span className="text-xl font-bold text-[#C8102E]">{proposal.budgetTotal}</span>
                  </div>

                </div>
              </div>
            )}


            {/* --- EVALUATOR COMMENTS & RATINGS SECTION --- */}
            <div className="border-t-2 border-slate-300 pt-6 mt-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-[#C8102E]" />
                Evaluator Comments & Ratings
              </h3>

              <div className="space-y-6">
                {/* Loop for the 4 main rated sections */}
                {["objectives", "methodology", "budget", "timeline"].map(
                  (key) => {
                    const field = key as keyof typeof RATING_CRITERIA;
                    // Safe access with fallback 0
                    const ratingValue = proposal.ratings?.[field] || 0;
                    const ratingDesc =
                      (RATING_CRITERIA[field].descriptions as any)[
                      ratingValue
                      ] || "No rating provided.";

                    return (
                      <div
                        key={key}
                        className="bg-slate-50 p-4 rounded-xl border border-slate-200"
                      >
                        <div className="mb-3">
                          <label className="block text-sm font-bold text-slate-900">
                            {RATING_CRITERIA[field].label}
                          </label>
                        </div>

                        {/* 1-5 Visual Indicators (Read-Only) */}
                        <div className="flex gap-2 mb-3">
                          {[5, 4, 3, 2, 1].map((num) => (
                            <div
                              key={num}
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm border transition-all duration-200 cursor-default ${getButtonStyles(
                                ratingValue === num
                              )}`}
                            >
                              {num}
                            </div>
                          ))}
                        </div>

                        {/* Rating Description ONLY */}
                        <div
                          className={`text-xs p-3 rounded-lg border ${ratingValue > 0
                            ? getRatingColor(ratingValue)
                            : "bg-slate-100 text-slate-500 border-slate-200 italic"
                            }`}
                        >
                          {ratingDesc}
                        </div>
                      </div>
                    );
                  }
                )}

                {/* Comments */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <label className="block text-sm font-bold text-slate-900 mb-2">
                    Comments
                  </label>
                  <div className="bg-white p-3 rounded-lg border border-slate-200 text-sm text-slate-700 leading-relaxed">
                    {proposal.comment}
                  </div>
                </div>

                {/* Suggested Decision Section (Read-Only) */}
                <div className="border-t border-slate-200 pt-6 mt-2">
                  <h4 className="block text-sm font-bold text-slate-900 mb-3">
                    Suggested Decision
                  </h4>
                  <div className="grid grid-cols-3 gap-3">
                    {/* Approve Button */}
                    <div
                      className={`flex flex-col sm:flex-row items-center justify-center gap-2 p-3 rounded-xl border transition-all duration-200 cursor-default ${proposal.decision === "Approve"
                        ? "bg-green-600 text-white border-green-600 shadow-md"
                        : "bg-green-50 text-green-400 border-green-200 opacity-70"
                        }`}
                    >
                      <CheckCircle
                        className={`w-5 h-5 ${proposal.decision === "Approve"
                          ? "text-white"
                          : "text-green-400"
                          }`}
                      />
                      <span className="font-semibold text-sm">Approve</span>
                    </div>

                    {/* Revise Button */}
                    <div
                      className={`flex flex-col sm:flex-row items-center justify-center gap-2 p-3 rounded-xl border transition-all duration-200 cursor-default ${proposal.decision === "Revise"
                        ? "bg-yellow-500 text-white border-yellow-500 shadow-md"
                        : "bg-yellow-50 text-yellow-500 border-yellow-200 opacity-70"
                        }`}
                    >
                      <RotateCcw
                        className={`w-5 h-5 ${proposal.decision === "Revise"
                          ? "text-white"
                          : "text-yellow-500"
                          }`}
                      />
                      <span className="font-semibold text-sm">Revise</span>
                    </div>

                    {/* Reject Button */}
                    <div
                      className={`flex flex-col sm:flex-row items-center justify-center gap-2 p-3 rounded-xl border transition-all duration-200 cursor-default ${proposal.decision === "Reject"
                        ? "bg-red-700 text-white border-red-700 shadow-md"
                        : "bg-red-50 text-red-400 border-red-200 opacity-70"
                        }`}
                    >
                      <XCircle
                        className={`w-5 h-5 ${proposal.decision === "Reject"
                          ? "text-white"
                          : "text-red-400"
                          }`}
                      />
                      <span className="font-semibold text-sm">Reject</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-6 border-t border-slate-200 bg-slate-50 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}