import {
  X,
  Building2,
  Users,
  Target,
  Calendar,
  DollarSign,
  Phone,
  Download,
  Mail,
  MapPin,
  FileText,
  User,
  Microscope,
  Tags,
  Briefcase,
  BookOpen,
  MessageSquare,
  UserCheck,
  GitBranch,
  Clock,
} from "lucide-react";

// Mock download handler
const handleDownload = (fileName: string) => {
  alert(`Downloading ${fileName}...`);
};

interface BudgetSource {
  source: string;
  ps: string;
  mooe: string;
  co: string;
  total: string;
}

export interface Proposal {
  id: number;
  title: string;
  proponent: string;
  gender: string;
  address: string;
  telephone: string;
  email: string;
  status: string;
  deadline: string;
  projectType: string;
  agency: string;
  cooperatingAgencies: string;
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
  projectFile?: string;
  assignedRdStaff?: string;
  rdCommentsToEvaluator?: string;
  evaluationDeadline?: string;
  assignedEvaluators?: string[];
}

interface ProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  proposal: Proposal | null | undefined;
}

export default function ProposalModal({
  isOpen,
  onClose,
  proposal,
}: ProposalModalProps) {
  if (!isOpen || !proposal) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="p-4 sm:p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex-1 pr-4">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">
              {proposal.title}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              DOST Form No. 1B - Capsule R&D Proposal
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-lg transition-colors flex-shrink-0"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
          <div className="space-y-4 sm:space-y-6">
            
            {/* --- UPDATED FILE DOWNLOAD SECTION --- */}
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#C8102E]" />
                Project Documents
              </h3>

              {/* Logic for Revised Proposal vs Standard */}
              {proposal.status === "Revised Proposal" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  {/* Previous Version */}
                  <div className="border border-slate-300 rounded-lg p-3 bg-slate-100 opacity-75">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Previous Version
                      </span>
                      <span className="text-[10px] text-slate-400">History</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-12 bg-slate-200 rounded flex items-center justify-center">
                        <FileText className="w-5 h-5 text-slate-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-700 truncate">
                          Proposal_v1.pdf
                        </p>
                        <p className="text-xs text-slate-500">2.4 MB</p>
                      </div>
                      <button
                        onClick={() => handleDownload("Proposal_v1.pdf")}
                        className="p-2 text-slate-500 hover:bg-slate-200 rounded-full cursor-pointer"
                        title="Download Previous Version"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* New Version */}
                  <div className="border border-indigo-200 rounded-lg p-3 bg-white shadow-sm ring-1 ring-indigo-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-indigo-600 uppercase flex items-center gap-1">
                        <GitBranch className="w-3 h-3" /> Latest Revision
                      </span>
                      <span className="text-[10px] text-indigo-400">
                        Current
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-12 bg-indigo-50 rounded flex items-center justify-center border border-indigo-100">
                        <FileText className="w-5 h-5 text-indigo-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {proposal.projectFile || "Proposal_v2_Revised.pdf"}
                        </p>
                        <p className="text-xs text-slate-500">2.6 MB</p>
                      </div>
                      <button
                        onClick={() =>
                          handleDownload(
                            proposal.projectFile || "Proposal_v2_Revised.pdf"
                          )
                        }
                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-full cursor-pointer"
                        title="Download Revised Version"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                // Standard Single Document Card
                <div
                  className="border border-slate-200 rounded-lg p-3 bg-white flex items-center justify-between group hover:border-[#C8102E] transition-colors cursor-pointer"
                  onClick={() => handleDownload(proposal.projectFile || "Full Project Proposal.pdf")}
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
                  <button className="cursor-pointer flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-50 hover:bg-[#C8102E] hover:text-white rounded-md transition-all">
                    <Download className="w-3 h-3" />
                    Download
                  </button>
                </div>
              )}
            </div>

            {/* 1. Leader & Agency Information */}
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2 border-b border-slate-200 pb-2">
                <User className="w-4 h-4 text-[#C8102E]" />
                Leader & Agency Information
              </h3>

              {/* Leader Name & Gender */}
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

              {/* Agency & Address */}
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

              {/* Contact Details */}
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

            {/* 2. Cooperating Agencies */}
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
                  Research & Development Station
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

            {/* Schedule */}
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#C8102E]" />
                Implementing Schedule
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs sm:text-sm">
                <div>
                  <span className="text-slate-500 text-xs uppercase tracking-wide">
                    Duration
                  </span>
                  <p className="font-semibold text-slate-900 mt-1">
                    {proposal.duration}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500 text-xs uppercase tracking-wide">
                    Start Date
                  </span>
                  <p className="font-semibold text-slate-900 mt-1">
                    {proposal.startDate}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500 text-xs uppercase tracking-wide">
                    End Date
                  </span>
                  <p className="font-semibold text-slate-900 mt-1">
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
              <div className="overflow-x-auto rounded-lg border border-slate-300">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="border-b border-r border-slate-300 px-3 py-2 text-left font-semibold text-slate-700">
                        Source of Funds
                      </th>
                      <th className="border-b border-r border-slate-300 px-3 py-2 text-right font-semibold text-slate-700">
                        PS
                      </th>
                      <th className="border-b border-r border-slate-300 px-3 py-2 text-right font-semibold text-slate-700">
                        MOOE
                      </th>
                      <th className="border-b border-r border-slate-300 px-3 py-2 text-right font-semibold text-slate-700">
                        CO
                      </th>
                      <th className="border-b border-slate-300 px-3 py-2 text-right font-semibold text-slate-700">
                        TOTAL
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {proposal.budgetSources.map((budget, index) => (
                      <tr key={index} className="hover:bg-slate-50">
                        <td className="border-b border-r border-slate-300 px-3 py-2 font-medium text-slate-800">
                          {budget.source}
                        </td>
                        <td className="border-b border-r border-slate-300 px-3 py-2 text-right text-slate-700">
                          {budget.ps}
                        </td>
                        <td className="border-b border-r border-slate-300 px-3 py-2 text-right text-slate-700">
                          {budget.mooe}
                        </td>
                        <td className="border-b border-r border-slate-300 px-3 py-2 text-right text-slate-700">
                          {budget.co}
                        </td>
                        <td className="border-b border-slate-300 px-3 py-2 text-right font-semibold text-slate-800">
                          {budget.total}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-slate-200 font-bold">
                      <td className="border-r border-slate-300 px-3 py-2 text-slate-900">
                        TOTAL
                      </td>
                      <td
                        className="border-r border-slate-300 px-3 py-2 text-right text-slate-900"
                        colSpan={3}
                      >
                        →
                      </td>
                      <td className="px-3 py-2 text-right text-[#C8102E] text-sm">
                        {proposal.budgetTotal}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-[10px] text-slate-500 mt-2 italic">
                PS: Personal Services | MOOE: Maintenance and Other Operating
                Expenses | CO: Capital Outlay
              </p>
            </div>

            {/* R&D Assignment & Comments Section */}
            {(proposal.assignedRdStaff || proposal.rdCommentsToEvaluator) && (
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2 border-b border-blue-200 pb-2">
                  <UserCheck className="w-4 h-4 text-[#C8102E]" />
                  R&D Staff Assignment & Instructions
                </h3>

                {/* R&D Staff Assignment */}
                {proposal.assignedRdStaff && (
                  <div className="mb-3">
                    <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
                      Assigned R&D Staff
                    </span>
                    <p className="font-semibold text-slate-900 text-sm">
                      {proposal.assignedRdStaff}
                    </p>
                  </div>
                )}

                {/* Evaluation Deadline */}
                {proposal.evaluationDeadline && (
                  <div className="mb-3">
                    <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
                      Evaluation Deadline
                    </span>
                    <p className="font-semibold text-slate-900 text-sm">
                      {proposal.evaluationDeadline}
                    </p>
                  </div>
                )}

                {/* Assigned Evaluators */}
                {proposal.assignedEvaluators &&
                  proposal.assignedEvaluators.length > 0 && (
                    <div className="mb-3">
                      <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
                        Assigned Evaluators
                      </span>
                      <div className="mt-1 space-y-1">
                        {proposal.assignedEvaluators.map((evaluator, index) => (
                          <p
                            key={index}
                            className="font-medium text-slate-900 text-sm"
                          >
                            • {evaluator}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}

                {/* R&D Comments to Evaluator */}
                {proposal.rdCommentsToEvaluator && (
                  <div className="pt-2 border-t border-blue-200">
                    <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
                      R&D Comments to Evaluator
                    </span>
                    <div className="flex items-start gap-1.5 mt-1">
                      <MessageSquare className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-slate-700 leading-relaxed">
                        {proposal.rdCommentsToEvaluator}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
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