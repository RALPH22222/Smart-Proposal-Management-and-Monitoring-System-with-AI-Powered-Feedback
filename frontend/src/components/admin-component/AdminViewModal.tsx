import React from "react";
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
  GitBranch,
  Clock,
  Briefcase,
  BookOpen,
  Target,
  Timer,
  Bot,
  Building2,
  MapPin,
  Send,
  Globe, // Added for Implementation Sites
  CheckCircle // Added for Status Icons
} from "lucide-react";

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
  gender: string;
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
}

interface AdminViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Use 'any' for prop to accept parent data, then cast internally
  proposal: any;
}

const AdminViewModal: React.FC<AdminViewModalProps> = ({
  isOpen,
  onClose,
  proposal,
}) => {
  if (!isOpen || !proposal) return null;

  // Safe cast for internal use
  const p = proposal as ModalProposalData;

  // --- DOWNLOAD HANDLER ---
  const handleDownload = (fileName: string) => {
    alert(`Downloading ${fileName}...`);
  };

  // Mock Assessment Data
  const mockAssessment = {
    objectives:
      "The specific objectives are generally clear but need more measurable indicators (SMART criteria).",
    methodology:
      "The proposed statistical analysis method (ANOVA) needs further justification.",
    budget:
      "The travel expenses listed for Q3 seem excessive relative to the project scope.",
    timeline:
      "The data collection phase is too short (2 weeks). Recommended extending to at least 1 month.",
    overall:
      "The proposal is promising but requires adjustments in the methodology and budget allocation.",
  };

  const mockRejection =
    "The proposal does not align with the current priority agenda of the institution.";

  const mockRevisionDeadline = "November 30, 2025 | 5:00 PM";

  // --- DETERMINE DISPLAY STATUS & COLOR ---
  const getStatusColor = (status: string) => {
    const s = (status || "").toLowerCase();
    switch (s) {
      case "accepted":
      case "approved":
        return "emerald";
      case "rejected":
      case "rejected proposal":
        return "red";
      case "pending":
        return "amber";
      case "revision required":
        return "orange";
      case "sent to evaluators":
        return "emerald";
      case "assigned to rnd":
        return "blue";
      case "revised proposal":
        return "purple";
      default:
        return "slate";
    }
  };

  const getStatusIcon = (status: string) => {
    const s = (status || "").toLowerCase();
    switch (s) {
      case "accepted":
      case "approved":
        return CheckCircle;
      case "rejected":
      case "rejected proposal":
        return XCircle;
      case "pending":
        return Clock;
      case "revision required":
        return AlertTriangle;
      case "sent to evaluators":
        return Send;
      case "assigned to rnd":
        return Bot;
      case "revised proposal":
        return GitBranch;
      default:
        return FileText;
    }
  };

  const statusColor = getStatusColor(p.status);
  const StatusIcon = getStatusIcon(p.status);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex-1 pr-4">
            <div className="flex items-center gap-2 mb-2">
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border capitalize 
                 ${statusColor === "emerald" ? "bg-emerald-50 border-emerald-200 text-emerald-700" : ""}
                 ${statusColor === "red" ? "bg-red-50 border-red-200 text-red-700" : ""}
                 ${statusColor === "amber" ? "bg-amber-50 border-amber-200 text-amber-700" : ""}
                 ${statusColor === "blue" ? "bg-blue-50 border-blue-200 text-blue-700" : ""}
                 ${statusColor === "purple" ? "bg-purple-50 border-purple-200 text-purple-700" : ""}
                 ${statusColor === "orange" ? "bg-orange-50 border-orange-200 text-orange-700" : ""}
                 ${statusColor === "slate" ? "bg-slate-50 border-slate-200 text-slate-700" : ""}
                `}
              >
                <StatusIcon className="w-3 h-3" />
                {p.status}
              </span>
              <span className="text-xs text-slate-500">DOST Form No. 1B</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">
              {p.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-lg transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
          <div className="space-y-4 sm:space-y-6">
            
            {/* --- ADMIN SPECIFIC STATUS BLOCKS --- */}
            {p.status === "Revision Required" && (
              <div className="bg-orange-50 rounded-lg p-5 border border-orange-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-orange-800 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    Revision Requirements
                  </h3>
                </div>
                <div className="mb-5 bg-white border-l-4 border-red-500 rounded shadow-sm p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold text-red-600 tracking-wider mb-1">
                      Revision Submission Deadline
                    </p>
                    <div className="flex items-center gap-2 text-slate-900">
                      <Timer className="w-5 h-5 text-red-500" />
                      <span className="font-medium text-base">{mockRevisionDeadline}</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="bg-white p-3 rounded border border-orange-100">
                    <p className="text-xs font-bold text-orange-700 mb-1">Objectives Assessment</p>
                    <p className="text-sm text-slate-700">{mockAssessment.objectives}</p>
                  </div>
                  <div className="bg-orange-100 p-3 rounded border border-orange-200">
                    <p className="text-xs font-bold text-orange-800 mb-1">Overall Comments</p>
                    <p className="text-sm text-orange-900 italic">"{mockAssessment.overall}"</p>
                  </div>
                </div>
              </div>
            )}

            {p.status === "Rejected Proposal" && (
              <div className="bg-red-50 rounded-lg p-5 border border-red-200">
                <h3 className="text-sm font-bold text-red-800 mb-2 flex items-center gap-2">
                  <XCircle className="w-4 h-4" />
                  Rejection Reason
                </h3>
                <p className="text-sm text-red-900 leading-relaxed">
                  {mockRejection}
                </p>
              </div>
            )}

            {/* --- 1. PROJECT DOCUMENTS --- */}
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#C8102E]" />
                Project Documents
              </h3>
              
              {p.status === "Revised Proposal" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Previous Version */}
                  <div className="border border-slate-300 rounded-lg p-3 bg-slate-100 opacity-75">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Previous Version
                      </span>
                      <span className="text-[10px] text-slate-400">History</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-12 bg-slate-200 rounded flex items-center justify-center">
                        <FileText className="w-5 h-5 text-slate-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-700 truncate">Proposal_v1.pdf</p>
                        <p className="text-xs text-slate-500">2.4 MB</p>
                      </div>
                      <button className="p-2 text-slate-500 hover:bg-slate-200 rounded-full cursor-pointer">
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  {/* Latest Version */}
                  <div className="border border-purple-200 rounded-lg p-3 bg-white shadow-sm ring-1 ring-purple-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-purple-600 flex items-center gap-1">
                        <GitBranch className="w-3 h-3" /> Latest Revision
                      </span>
                      <span className="text-[10px] text-purple-400">Just now</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-12 bg-purple-50 rounded flex items-center justify-center border border-purple-100">
                        <FileText className="w-5 h-5 text-purple-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{p.projectFile || "Proposal_v2_Revised.pdf"}</p>
                        <p className="text-xs text-slate-500">2.6 MB</p>
                      </div>
                      <button onClick={() => handleDownload(p.projectFile)} className="p-2 text-purple-600 hover:bg-purple-50 rounded-full cursor-pointer">
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  className="border border-slate-200 rounded-lg p-3 bg-white flex items-center justify-between group hover:border-[#C8102E] transition-colors cursor-pointer"
                  onClick={() => handleDownload(p.projectFile)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-12 bg-red-50 rounded flex items-center justify-center border border-red-100">
                      <FileText className="w-5 h-5 text-[#C8102E]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900 group-hover:text-[#C8102E] transition-colors">
                        {p.projectFile || "Full Project Proposal.pdf"}
                      </p>
                      <p className="text-xs text-slate-500">
                        Submitted: {p.submittedDate ? new Date(p.submittedDate).toLocaleDateString() : "N/A"}
                      </p>
                    </div>
                  </div>
                  <button className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-50 hover:bg-[#C8102E] hover:text-white rounded-md transition-all">
                    <Download className="w-3 h-3" /> Download
                  </button>
                </div>
              )}
            </div>

            {/* --- 2. LEADER & AGENCY INFORMATION --- */}
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2 border-b border-slate-200 pb-2">
                <User className="w-4 h-4 text-[#C8102E]" />
                Leader & Agency Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">
                <div>
                  <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Leader / Proponent</span>
                  <p className="font-semibold text-slate-900 text-sm">{p.proponent}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Gender</span>
                  <p className="font-medium text-slate-900 text-sm">{p.gender}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">
                {/* Agency String */}
                <div>
                  <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Agency</span>
                  <div className="flex items-start gap-1.5 mt-0.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-400 mt-0.5" />
                    <p className="font-medium text-slate-900 text-sm">{p.agency}</p>
                  </div>
                </div>
                {/* Address String */}
                <div>
                  <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Address</span>
                  <div className="flex items-start gap-1.5 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5" />
                    <p className="text-slate-900 text-sm">{p.address}</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                <div>
                  <span className="text-xs text-slate-500">Telephone</span>
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3 h-3 text-slate-400" />
                    <p className="text-sm text-slate-900">{p.telephone}</p>
                  </div>
                </div>
                <div>
                  <span className="text-xs text-slate-500">Email</span>
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-3 h-3 text-slate-400" />
                    <p className="text-sm text-slate-900">{p.email}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* --- 3. IMPLEMENTATION SITES --- */}
            {p.implementationSites && p.implementationSites.length > 0 && (
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-[#C8102E]" />
                  Implementation Sites ({p.implementationSites.length})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {p.implementationSites.map((site: Site, index: number) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-white border border-slate-200 rounded-lg shadow-sm">
                      <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0 text-blue-600">
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

            {/* --- 4. COOPERATING & MODE --- */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#C8102E]" /> Cooperating Agencies
                </h3>
                <p className="text-xs sm:text-sm text-slate-700">{p.cooperatingAgencies}</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-[#C8102E]" /> Mode of Implementation
                </h3>
                <p className="text-xs sm:text-sm text-slate-700">{p.modeOfImplementation}</p>
              </div>
            </div>

            {/* --- 5. CLASSIFICATION & STATION --- */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                  <Tags className="w-4 h-4 text-[#C8102E]" /> Classification
                </h3>
                <p className="text-xs sm:text-sm text-slate-700">
                  <span className="font-semibold">{p.classification}:</span> {p.classificationDetails}
                </p>
              </div>
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                  <Microscope className="w-4 h-4 text-[#C8102E]" /> R&D Station
                </h3>
                <p className="text-xs sm:text-sm text-slate-700">{p.rdStation}</p>
              </div>
            </div>

            {/* --- 6. SECTOR & DISCIPLINE --- */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                    <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                        <Target className="w-4 h-4 text-[#C8102E]" /> Priority Areas
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-700">{p.priorityAreas}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                    <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-[#C8102E]" /> Discipline
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-700">{p.discipline}</p>
                </div>
            </div>

            {/* --- 7. SCHEDULE --- */}
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#C8102E]" /> Implementing Schedule
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs sm:text-sm">
                <div>
                  <span className="text-slate-500 text-xs tracking-wide">Duration</span>
                  <p className="font-semibold text-slate-900 mt-1">{p.duration}</p>
                </div>
                <div>
                  <span className="text-slate-500 text-xs tracking-wide">Start Date</span>
                  <p className="font-semibold text-slate-900 mt-1">{p.startDate}</p>
                </div>
                <div>
                  <span className="text-slate-500 text-xs tracking-wide">End Date</span>
                  <p className="font-semibold text-slate-900 mt-1">{p.endDate}</p>
                </div>
              </div>
            </div>

            {/* --- 8. BUDGET --- */}
            {p.budgetSources && (
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-[#C8102E]" /> Estimated Budget by Source
                </h3>
                <div className="overflow-x-auto rounded-lg border border-slate-300">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100">
                        <th className="border-b border-r border-slate-300 px-3 py-2 text-left font-semibold text-slate-700">Source</th>
                        <th className="border-b border-r border-slate-300 px-3 py-2 text-right font-semibold text-slate-700">PS</th>
                        <th className="border-b border-r border-slate-300 px-3 py-2 text-right font-semibold text-slate-700">MOOE</th>
                        <th className="border-b border-r border-slate-300 px-3 py-2 text-right font-semibold text-slate-700">CO</th>
                        <th className="border-b border-slate-300 px-3 py-2 text-right font-semibold text-slate-700">TOTAL</th>
                      </tr>
                    </thead>
                    <tbody>
                      {p.budgetSources.map((budget: BudgetSource, index: number) => (
                        <tr key={index} className="hover:bg-slate-50">
                          <td className="border-b border-r border-slate-300 px-3 py-2 font-medium text-slate-800">{budget.source}</td>
                          <td className="border-b border-r border-slate-300 px-3 py-2 text-right text-slate-700">{budget.ps}</td>
                          <td className="border-b border-r border-slate-300 px-3 py-2 text-right text-slate-700">{budget.mooe}</td>
                          <td className="border-b border-r border-slate-300 px-3 py-2 text-right text-slate-700">{budget.co}</td>
                          <td className="border-b border-slate-300 px-3 py-2 text-right font-semibold text-slate-800">{budget.total}</td>
                        </tr>
                      ))}
                      <tr className="bg-slate-200 font-bold">
                        <td className="border-r border-slate-300 px-3 py-2 text-slate-900">TOTAL</td>
                        <td className="border-r border-slate-300 px-3 py-2 text-right text-slate-900" colSpan={3}>→</td>
                        <td className="px-3 py-2 text-right text-[#C8102E] text-sm">{p.budgetTotal}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
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
};

export default AdminViewModal;