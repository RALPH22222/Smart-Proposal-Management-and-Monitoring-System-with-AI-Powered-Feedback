import { useState, useEffect } from "react";
import {
  X,
  BookOpen,
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
} from "lucide-react";

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
  projectFile: string;
  proponent: string;
  agency: string;
  cooperatingAgencies: string;
  rdStation: string;
  classification: string;
  sector: string;
  discipline: string;
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
  onViewRubrics: () => void;
  onSubmit: (data: { decision: string; comments: any }) => void;
}

export default function ReviewModal({
  isOpen,
  onClose,
  proposal,
  onViewRubrics,
  onSubmit,
}: ReviewModalProps) {
  const [decision, setDecision] = useState<
    "Approve" | "Revise" | "Reject" | null
  >(null);
  const [comments, setComments] = useState({
    objectives: "",
    methodology: "",
    budget: "",
    timeline: "",
    overall: "",
  });

  useEffect(() => {
    if (isOpen) {
      setDecision(null);
      setComments({
        objectives: "",
        methodology: "",
        budget: "",
        timeline: "",
        overall: "",
      });
    }
  }, [isOpen, proposal]);

  const handleDownload = (fileName: string) => {
    console.log("Downloading:", fileName);
    alert(`Downloading ${fileName}`);
  };

  const handleSubmit = () => {
    if (decision) {
      onSubmit({ decision, comments });
    }
  };

  if (!isOpen || !proposal) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
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
              onClick={onViewRubrics}
              className="inline-flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors text-xs sm:text-sm font-medium whitespace-nowrap"
            >
              <BookOpen className="w-4 h-4" />
              Rubrics
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="space-y-4 sm:space-y-6">
            {/* File Download */}
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

            {/* Project Information */}
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#C8102E]" />
                Project Information
              </h3>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-600">Leader:</span>
                  <p className="font-semibold text-slate-900">
                    {proposal.proponent}
                  </p>
                </div>
                <div>
                  <span className="text-slate-600">Agency:</span>
                  <p className="font-semibold text-slate-900">
                    {proposal.agency}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                <Users className="w-4 h-4 text-[#C8102E]" />
                Cooperating Agencies
              </h3>
              <p className="text-xs text-slate-700">
                {proposal.cooperatingAgencies}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <h3 className="text-sm font-bold text-slate-900 mb-2">
                  R&D Station
                </h3>
                <p className="text-xs text-slate-700">{proposal.rdStation}</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <h3 className="text-sm font-bold text-slate-900 mb-2">
                  Classification
                </h3>
                <p className="text-xs text-slate-700">
                  {proposal.classification}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                  <Target className="w-4 h-4 text-[#C8102E]" />
                  Sector/Commodity
                </h3>
                <p className="text-xs text-slate-700">{proposal.sector}</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <h3 className="text-sm font-bold text-slate-900 mb-2">
                  Discipline
                </h3>
                <p className="text-xs text-slate-700">{proposal.discipline}</p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#C8102E]" />
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
              <p className="text-xs text-slate-500 mt-2">
                PS: Personal Services | MOOE: Maintenance and Other Operating
                Expenses | CO: Capital Outlay
              </p>
            </div>

            {/* Comments Section */}
            <div className="border-t-2 border-slate-300 pt-6 mt-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-[#C8102E]" />
                Evaluator Comments
              </h3>

              <div className="space-y-6">
                {/* Loop through fields to reduce code duplication */}
                {["Objectives", "Methodology", "Budget", "Timeline"].map(
                  (field) => (
                    <div key={field}>
                      <div className="mb-2">
                        <label className="block text-sm font-semibold text-slate-900">
                          {field} Assessment
                        </label>
                      </div>
                      <textarea
                        value={(comments as any)[field.toLowerCase()]}
                        onChange={(e) =>
                          setComments({
                            ...comments,
                            [field.toLowerCase()]: e.target.value,
                          })
                        }
                        placeholder={`Provide feedback on the ${field.toLowerCase()}...`}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-[#C8102E] resize-none"
                        rows={3}
                      />
                    </div>
                  )
                )}

                {/* Overall Assessment */}
                <div>
                  <div className="mb-2">
                    <label className="block text-sm font-semibold text-slate-900">
                      Overall Assessment
                    </label>
                  </div>
                  <textarea
                    value={comments.overall}
                    onChange={(e) =>
                      setComments({ ...comments, overall: e.target.value })
                    }
                    placeholder="Provide overall feedback and recommendations..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-[#C8102E] resize-none"
                    rows={4}
                  />
                </div>

                {/* Suggested Decision Section */}
                <div className="border-t border-slate-200 pt-6 mt-2">
                  <h4 className="block text-sm font-bold text-slate-900 mb-3">
                    Suggested Decision
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
                          decision === "Reject"
                            ? "text-white"
                            : "text-red-700"
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
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!decision}
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
              !decision
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
