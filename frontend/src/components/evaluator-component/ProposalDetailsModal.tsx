import {
  X,
  FileText,
  Download,
  Building2,
  Target,
  Calendar,
  DollarSign,
  MessageSquare,
  User,
  MapPin,
  Phone,
  Mail,
  Microscope,
  Tags,
  Briefcase,
  BookOpen,
  CheckCircle,
  AlertCircle,
  XCircle,
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
}

interface Proposal {
  id: number;
  title: string;
  description: string;
  proponent: string;
  gender: string;
  address: string;
  telephone: string;
  email: string;
  agency: string;
  rdStation: string;
  classification: string;
  classificationDetails: string;
  modeOfImplementation: string;
  priorityAreas: string;
  sector: string;
  discipline: string;
  duration: string;
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
            {/* File Download Section */}
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Project Proposal Document
                  </p>
                  <p className="text-xs text-slate-600">
                    {proposal.projectFile}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleDownload(proposal.projectFile)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
            </div>

            {/* Leader & Agency Information */}
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2 border-b border-slate-200 pb-2">
                <User className="w-4 h-4 text-[#C8102E]" />
                Leader & Agency Information
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">
                <div>
                  <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
                    Leader / Proponent
                  </span>
                  <p className="font-semibold text-slate-900 text-sm">
                    {proposal.proponent}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
                    Gender
                  </span>
                  <p className="font-medium text-slate-900 text-sm">
                    {proposal.gender}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">
                <div>
                  <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
                    Agency
                  </span>
                  <div className="flex items-start gap-1.5 mt-0.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-400 mt-0.5" />
                    <p className="font-medium text-slate-900 text-sm">
                      {proposal.agency}
                    </p>
                  </div>
                </div>
                <div>
                  <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
                    Address
                  </span>
                  <div className="flex items-start gap-1.5 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5" />
                    <p className="text-slate-900 text-sm">{proposal.address}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                <div>
                  <span className="text-xs text-slate-500">Telephone</span>
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3 h-3 text-slate-400" />
                    <p className="text-sm text-slate-900">
                      {proposal.telephone}
                    </p>
                  </div>
                </div>
                <div>
                  <span className="text-xs text-slate-500">Email</span>
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-3 h-3 text-slate-400" />
                    <p className="text-sm text-slate-900">{proposal.email}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* R&D Station & Classification */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                  <Microscope className="w-4 h-4 text-[#C8102E]" />
                  Research and Development Station
                </h3>
                <p className="text-xs sm:text-sm text-slate-700">
                  {proposal.rdStation}
                </p>
              </div>
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                  <Tags className="w-4 h-4 text-[#C8102E]" />
                  Classification
                </h3>
                <p className="text-xs sm:text-sm text-slate-700">
                  <span className="font-semibold text-slate-900">
                    {proposal.classification}:
                  </span>{" "}
                  {proposal.classificationDetails}
                </p>
              </div>
            </div>

            {/* Mode & Priority Areas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#C8102E]" />
                  Mode of Implementation
                </h3>
                <p className="text-xs sm:text-sm text-slate-700">
                  {proposal.modeOfImplementation}
                </p>
              </div>
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                  <Target className="w-4 h-4 text-[#C8102E]" />
                  Priority Areas
                </h3>
                <p className="text-xs sm:text-sm text-slate-700">
                  {proposal.priorityAreas}
                </p>
              </div>
            </div>

            {/* Sector & Discipline */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-[#C8102E]" />
                  Sector/Commodity
                </h3>
                <p className="text-xs text-slate-700">{proposal.sector}</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[#C8102E]" />
                  Discipline
                </h3>
                <p className="text-xs text-slate-700">{proposal.discipline}</p>
              </div>
            </div>

            {/* Implementing Schedule */}
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#C8102E]" />
                Implementing Schedule
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-slate-600">Duration:</span>
                  <p className="font-semibold text-slate-900">
                    {proposal.duration}
                  </p>
                </div>
                <div>
                  <span className="text-slate-600">Start Date:</span>
                  <p className="font-semibold text-slate-900">
                    {proposal.startDate}
                  </p>
                </div>
                <div>
                  <span className="text-slate-600">End Date:</span>
                  <p className="font-semibold text-slate-900">
                    {proposal.endDate}
                  </p>
                </div>
              </div>
            </div>

            {/* Budget Table */}
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-[#C8102E]" />
                Estimated Budget by Source
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="border border-slate-300 px-3 py-2 text-left font-semibold text-slate-700">
                        Source of Funds
                      </th>
                      <th className="border border-slate-300 px-3 py-2 text-right font-semibold text-slate-700">
                        PS
                      </th>
                      <th className="border border-slate-300 px-3 py-2 text-right font-semibold text-slate-700">
                        MOOE
                      </th>
                      <th className="border border-slate-300 px-3 py-2 text-right font-semibold text-slate-700">
                        CO
                      </th>
                      <th className="border border-slate-300 px-3 py-2 text-right font-semibold text-slate-700">
                        TOTAL
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {proposal.budgetSources.map((budget, index) => (
                      <tr key={index} className="hover:bg-slate-50">
                        <td className="border border-slate-300 px-3 py-2 font-medium text-slate-800">
                          {budget.source}
                        </td>
                        <td className="border border-slate-300 px-3 py-2 text-right text-slate-700">
                          {budget.ps}
                        </td>
                        <td className="border border-slate-300 px-3 py-2 text-right text-slate-700">
                          {budget.mooe}
                        </td>
                        <td className="border border-slate-300 px-3 py-2 text-right text-slate-700">
                          {budget.co}
                        </td>
                        <td className="border border-slate-300 px-3 py-2 text-right font-semibold text-slate-800">
                          {budget.total}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-slate-200 font-bold">
                      <td className="border border-slate-300 px-3 py-2 text-slate-900">
                        TOTAL
                      </td>
                      <td
                        className="border border-slate-300 px-3 py-2 text-right text-slate-900"
                        colSpan={3}
                      >
                        →
                      </td>
                      <td className="border border-slate-300 px-3 py-2 text-right text-[#C8102E] text-sm">
                        {proposal.budgetTotal}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Evaluator Comments & Ratings Section (Read-Only) */}
            <div className="border-t-2 border-slate-300 pt-6 mt-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-[#C8102E]" />
                Evaluator Review Details
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
                          {[1, 2, 3, 4, 5].map((num) => (
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
                          className={`text-xs p-3 rounded-lg border ${
                            ratingValue > 0
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
                      className={`flex flex-col sm:flex-row items-center justify-center gap-2 p-3 rounded-xl border transition-all duration-200 cursor-default ${
                        proposal.decision === "Approve"
                          ? "bg-green-600 text-white border-green-600 shadow-md"
                          : "bg-slate-50 text-slate-300 border-slate-100 opacity-50"
                      }`}
                    >
                      <CheckCircle
                        className={`w-5 h-5 ${
                          proposal.decision === "Approve"
                            ? "text-white"
                            : "text-slate-300"
                        }`}
                      />
                      <span className="font-semibold text-sm">Approve</span>
                    </div>

                    {/* Revise Button */}
                    <div
                      className={`flex flex-col sm:flex-row items-center justify-center gap-2 p-3 rounded-xl border transition-all duration-200 cursor-default ${
                        proposal.decision === "Revise"
                          ? "bg-yellow-500 text-white border-yellow-500 shadow-md"
                          : "bg-slate-50 text-slate-300 border-slate-100 opacity-50"
                      }`}
                    >
                      <AlertCircle
                        className={`w-5 h-5 ${
                          proposal.decision === "Revise"
                            ? "text-white"
                            : "text-slate-300"
                        }`}
                      />
                      <span className="font-semibold text-sm">Revise</span>
                    </div>

                    {/* Reject Button */}
                    <div
                      className={`flex flex-col sm:flex-row items-center justify-center gap-2 p-3 rounded-xl border transition-all duration-200 cursor-default ${
                        proposal.decision === "Reject"
                          ? "bg-red-700 text-white border-red-700 shadow-md"
                          : "bg-slate-50 text-slate-300 border-slate-100 opacity-50"
                      }`}
                    >
                      <XCircle
                        className={`w-5 h-5 ${
                          proposal.decision === "Reject"
                            ? "text-white"
                            : "text-slate-300"
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
