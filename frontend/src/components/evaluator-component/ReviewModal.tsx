import { useState, useEffect } from "react";
import {
  X,
  FileText,
  Download,
  Building2,
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
} from "lucide-react";

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
  modeOfImplementation: string;
  implementationSites: Sites[];
  priorityAreas: string;
  sector: string;
  discipline: string;
  schoolYear: string;
  duration: string;
  startDate: string;
  endDate: string;
  budgetSources: BudgetSource[];
  budgetTotal: string;
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
}

export default function ReviewModal({
  isOpen,
  onClose,
  proposal,
  onSubmit,
}: ReviewModalProps) {
  const [decision, setDecision] = useState<
    "Approve" | "Revise" | "Reject" | null
  >(null);

  const [ratings, setRatings] = useState({
    objectives: 0,
    methodology: 0,
    budget: 0,
    timeline: 0,
  });

  const [overallComment, setOverallComment] = useState("");

  useEffect(() => {
    if (isOpen) {
      setDecision(null);
      setRatings({
        objectives: 0,
        methodology: 0,
        budget: 0,
        timeline: 0,
      });
      setOverallComment("");
    }
  }, [isOpen, proposal]);

  // Validation Check: All ratings must be > 0 and a decision must be made.
  const isFormValid =
    decision !== null &&
    ratings.objectives > 0 &&
    ratings.methodology > 0 &&
    ratings.budget > 0 &&
    ratings.timeline > 0;

  const handleDownload = (fileName: string) => {
    console.log("Downloading:", fileName);
    alert(`Downloading ${fileName}`);
  };

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
    if (value >= 4) return "bg-emerald-100 text-emerald-700 border-emerald-200";
    if (value === 3) return "bg-blue-100 text-blue-700 border-blue-200";
    return "bg-amber-100 text-amber-700 border-amber-200";
  };

  if (!isOpen || !proposal) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
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
            {/* File Download */}
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#C8102E]" /> Project
                Documents
              </h3>

              <div
                className="border border-slate-200 rounded-lg p-3 bg-white flex items-center justify-between group hover:border-[#C8102E] transition-colors cursor-pointer"
                onClick={() =>
                  handleDownload(
                    proposal.projectFile || "Full Project Proposal.pdf"
                  )
                }
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-12 bg-red-50 rounded flex items-center justify-center border border-red-100">
                    <FileText className="w-5 h-5 text-[#C8102E]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900 group-hover:text-[#C8102E] transition-colors">
                      {proposal.projectFile || "Full Project Proposal.pdf"}
                    </p>
                    <p className="text-xs text-slate-500">
                      PDF Document • 2.4 MB
                    </p>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownload(
                      proposal.projectFile || "Full Project Proposal.pdf"
                    );
                  }}
                  className="cursor-pointer flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-50 hover:bg-[#C8102E] hover:text-white rounded-md transition-all"
                >
                  <Download className="w-3 h-3" />
                  Download
                </button>
              </div>
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
                {/* Agency*/}
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
                {/* Address*/}
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

            {/* 3. Implementation Sites */}
            {proposal.implementationSites &&
              proposal.implementationSites.length > 0 && (
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                  <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-[#C8102E]" />
                    Implementation Sites ({proposal.implementationSites.length})
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {proposal.implementationSites.map(
                      (site: Sites, index: number) => (
                        <div
                          key={index}
                          className="flex items-start gap-3 p-3 bg-white border border-slate-200 rounded-lg shadow-sm"
                        >
                          <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0 text-blue-600">
                            <MapPin className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900 leading-tight">
                              {site.site}
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {site.city}
                            </p>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

            {/* Cooperating Agencies */}
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                <Users className="w-4 h-4 text-[#C8102E]" />
                Cooperating Agencies
              </h3>
              <p className="text-xs sm:text-sm text-slate-700">
                {proposal.cooperatingAgencies}
              </p>
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
                <p className="text-xs sm:text-sm text-slate-700">
                  {proposal.sector}
                </p>
              </div>
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[#C8102E]" />
                  Discipline
                </h3>
                <p className="text-xs sm:text-sm text-slate-700">
                  {proposal.discipline}
                </p>
              </div>
            </div>

            {/* Implementing Schedule */}
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#C8102E]" />
                Implementing Schedule
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-slate-600">School Year:</span>
                  <p className="font-semibold text-slate-900">
                    {proposal.schoolYear}
                  </p>
                </div>
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

            {/* --- EVALUATOR COMMENTS & RATINGS SECTION --- */}
            <div className="border-t-2 border-slate-300 pt-6 mt-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-[#C8102E]" />
                Evaluator Comments & Ratings
              </h3>

              <div className="space-y-6">
                {/* 1. Objectives Rating */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 gap-2">
                    <label className="block text-sm font-bold text-slate-900">
                      {RATING_CRITERIA.objectives.label}{" "}
                      <span className="text-red-500">*</span>
                    </label>
                  </div>
                  <div className="flex gap-2 mb-3">
                    {[1, 2, 3, 4, 5].map((num) => (
                      <button
                        key={num}
                        onClick={() => handleRatingChange("objectives", num)}
                        className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-200 border cursor-pointer ${
                          (ratings as any).objectives === num
                            ? "bg-[#C8102E] text-white border-[#C8102E] shadow-md scale-105"
                            : "bg-white text-slate-500 border-slate-200 hover:border-[#C8102E] hover:text-[#C8102E]"
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                  <div
                    className={`text-xs p-3 rounded-lg border ${
                      (ratings as any).objectives > 0
                        ? getRatingColor((ratings as any).objectives)
                        : "bg-slate-100 text-slate-500 border-slate-200 italic"
                    }`}
                  >
                    {(ratings as any).objectives > 0
                      ? (RATING_CRITERIA.objectives.descriptions as any)[
                          (ratings as any).objectives
                        ]
                      : "Select a rating (1-5) to view description."}
                  </div>
                </div>

                {/* 2. Methodology Rating */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 gap-2">
                    <label className="block text-sm font-bold text-slate-900">
                      {RATING_CRITERIA.methodology.label}{" "}
                      <span className="text-red-500">*</span>
                    </label>
                  </div>
                  <div className="flex gap-2 mb-3">
                    {[1, 2, 3, 4, 5].map((num) => (
                      <button
                        key={num}
                        onClick={() => handleRatingChange("methodology", num)}
                        className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-200 border cursor-pointer ${
                          (ratings as any).methodology === num
                            ? "bg-[#C8102E] text-white border-[#C8102E] shadow-md scale-105"
                            : "bg-white text-slate-500 border-slate-200 hover:border-[#C8102E] hover:text-[#C8102E]"
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                  <div
                    className={`text-xs p-3 rounded-lg border ${
                      (ratings as any).methodology > 0
                        ? getRatingColor((ratings as any).methodology)
                        : "bg-slate-100 text-slate-500 border-slate-200 italic"
                    }`}
                  >
                    {(ratings as any).methodology > 0
                      ? (RATING_CRITERIA.methodology.descriptions as any)[
                          (ratings as any).methodology
                        ]
                      : "Select a rating (1-5) to view description."}
                  </div>
                </div>

                {/* 3. Budget Rating */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 gap-2">
                    <label className="block text-sm font-bold text-slate-900">
                      {RATING_CRITERIA.budget.label}{" "}
                      <span className="text-red-500">*</span>
                    </label>
                  </div>
                  <div className="flex gap-2 mb-3">
                    {[1, 2, 3, 4, 5].map((num) => (
                      <button
                        key={num}
                        onClick={() => handleRatingChange("budget", num)}
                        className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-200 border cursor-pointer ${
                          (ratings as any).budget === num
                            ? "bg-[#C8102E] text-white border-[#C8102E] shadow-md scale-105"
                            : "bg-white text-slate-500 border-slate-200 hover:border-[#C8102E] hover:text-[#C8102E]"
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                  <div
                    className={`text-xs p-3 rounded-lg border ${
                      (ratings as any).budget > 0
                        ? getRatingColor((ratings as any).budget)
                        : "bg-slate-100 text-slate-500 border-slate-200 italic"
                    }`}
                  >
                    {(ratings as any).budget > 0
                      ? (RATING_CRITERIA.budget.descriptions as any)[
                          (ratings as any).budget
                        ]
                      : "Select a rating (1-5) to view description."}
                  </div>
                </div>

                {/* 4. Timeline Rating */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 gap-2">
                    <label className="block text-sm font-bold text-slate-900">
                      {RATING_CRITERIA.timeline.label}{" "}
                      <span className="text-red-500">*</span>
                    </label>
                  </div>
                  <div className="flex gap-2 mb-3">
                    {[1, 2, 3, 4, 5].map((num) => (
                      <button
                        key={num}
                        onClick={() => handleRatingChange("timeline", num)}
                        className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-200 border cursor-pointer ${
                          (ratings as any).timeline === num
                            ? "bg-[#C8102E] text-white border-[#C8102E] shadow-md scale-105"
                            : "bg-white text-slate-500 border-slate-200 hover:border-[#C8102E] hover:text-[#C8102E]"
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                  <div
                    className={`text-xs p-3 rounded-lg border ${
                      (ratings as any).timeline > 0
                        ? getRatingColor((ratings as any).timeline)
                        : "bg-slate-100 text-slate-500 border-slate-200 italic"
                    }`}
                  >
                    {(ratings as any).timeline > 0
                      ? (RATING_CRITERIA.timeline.descriptions as any)[
                          (ratings as any).timeline
                        ]
                      : "Select a rating (1-5) to view description."}
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
                      className={`flex cursor-pointer flex-col sm:flex-row items-center justify-center gap-2 p-3 rounded-xl border transition-all duration-200 ${
                        decision === "Approve"
                          ? "bg-green-600 text-white border-green-600 shadow-md transform scale-[1.02]"
                          : "bg-white text-slate-600 border-slate-200 hover:border-green-500 hover:text-green-600 hover:bg-green-50"
                      }`}
                    >
                      <CheckCircle
                        className={`w-5 h-5 ${
                          decision === "Approve"
                            ? "text-white"
                            : "text-green-600"
                        }`}
                      />
                      <span className="font-semibold text-sm">Approve</span>
                    </button>

                    <button
                      onClick={() => setDecision("Revise")}
                      className={`flex cursor-pointer flex-col sm:flex-row items-center justify-center gap-2 p-3 rounded-xl border transition-all duration-200 ${
                        decision === "Revise"
                          ? "bg-yellow-500 text-white border-yellow-500 shadow-md transform scale-[1.02]"
                          : "bg-white text-slate-600 border-slate-200 hover:border-yellow-500 hover:text-yellow-600 hover:bg-yellow-50"
                      }`}
                    >
                      <AlertCircle
                        className={`w-5 h-5 ${
                          decision === "Revise"
                            ? "text-white"
                            : "text-yellow-500"
                        }`}
                      />
                      <span className="font-semibold text-sm">Revise</span>
                    </button>

                    <button
                      onClick={() => setDecision("Reject")}
                      className={`flex cursor-pointer flex-col sm:flex-row items-center justify-center gap-2 p-3 rounded-xl border transition-all duration-200 ${
                        decision === "Reject"
                          ? "bg-red-700 text-white border-red-700 shadow-md transform scale-[1.02]"
                          : "bg-white text-slate-600 border-slate-200 hover:border-red-800 hover:text-red-700 hover:bg-red-50"
                      }`}
                    >
                      <XCircle
                        className={`w-5 h-5 ${
                          decision === "Reject" ? "text-white" : "text-red-700"
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
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!isFormValid}
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
              !isFormValid
                ? "bg-slate-400 cursor-not-allowed"
                : "cursor-pointer bg-[#C8102E] hover:bg-[#A00E26]"
            }`}
          >
            Submit Review
          </button>
        </div>
      </div>
    </div>
  );
}
