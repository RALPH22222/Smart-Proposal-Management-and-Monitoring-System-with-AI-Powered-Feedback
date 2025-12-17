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
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Send,
  Globe, 
} from "lucide-react";

// --- INTERFACES ---
// Defined locally to match your exact dummy data structure
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

// Renamed to avoid conflict with global Proposal type
export interface ViewModalProposal {
  id: string;
  title: string;
  documentUrl: string;
  status: string;
  projectFile: string;
  submittedBy: string;
  submittedDate: string;
  lastModified: string;
  proponent: string;
  gender: string;
  agency: string; // Fixed: String
  address: string; // Fixed: String
  telephone: string;
  fax: string;
  email: string;
  modeOfImplementation: string;
  implementationSites: Site[]; // Fixed: Array of sites
  priorityAreas: string;
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
}

interface RnDViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Accepts 'any' temporarily to fix the strict type mismatch from parent
  // or use ViewModalProposal if you cast it in the parent.
  proposal: ViewModalProposal | any | null; 
}

// Mock download handler
const handleDownload = (fileName: string) => {
  alert(`Downloading ${fileName}...`);
};

export default function RnDViewModal({
  isOpen,
  onClose,
  proposal,
}: RnDViewModalProps) {
  if (!isOpen || !proposal) return null;

  // --- 1. DETERMINE DISPLAY STATUS ---
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
        return "blue";
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
      default:
        return FileText;
    }
  };

  const statusColor = getStatusColor(proposal.status);
  const StatusIcon = getStatusIcon(proposal.status);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
        
        {/* --- HEADER --- */}
        <div className="p-4 sm:p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex-1 pr-4">
            <div className="flex items-center gap-2 mb-2">
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border capitalize 
                 ${statusColor === "emerald" ? "bg-emerald-50 border-emerald-200 text-emerald-700" : ""}
                 ${statusColor === "red" ? "bg-red-50 border-red-200 text-red-700" : ""}
                 ${statusColor === "amber" ? "bg-amber-50 border-amber-200 text-amber-700" : ""}
                 ${statusColor === "blue" ? "bg-blue-50 border-blue-200 text-blue-700" : ""}
                 ${statusColor === "orange" ? "bg-orange-50 border-orange-200 text-orange-700" : ""}
                 ${statusColor === "slate" ? "bg-slate-50 border-slate-200 text-slate-700" : ""}
                `}
              >
                <StatusIcon className="w-3 h-3" />
                {proposal.status}
              </span>
              <span className="text-xs text-slate-500">DOST Form No. 1B</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">
              {proposal.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-lg transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* --- BODY --- */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
          <div className="space-y-4 sm:space-y-6">
            
            {/* 1. Project Documents */}
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#C8102E]" />
                Project Documents
              </h3>
              <div
                className="border border-slate-200 rounded-lg p-3 bg-white flex items-center justify-between group hover:border-[#C8102E] transition-colors cursor-pointer"
                onClick={() => handleDownload(proposal.projectFile)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-12 bg-red-50 rounded flex items-center justify-center border border-red-100">
                    <FileText className="w-5 h-5 text-[#C8102E]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900 group-hover:text-[#C8102E] transition-colors">
                      {proposal.projectFile || "Project_Proposal.pdf"}
                    </p>
                    <p className="text-xs text-slate-500">
                      Submitted: {proposal.submittedDate ? new Date(proposal.submittedDate).toLocaleDateString() : "N/A"}
                    </p>
                  </div>
                </div>
                <button className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-50 hover:bg-[#C8102E] hover:text-white rounded-md transition-all">
                  <Download className="w-3 h-3" />
                  Download
                </button>
              </div>
            </div>

            {/* 2. Leader & Agency Information */}
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
            {proposal.implementationSites && proposal.implementationSites.length > 0 && (
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-[#C8102E]" />
                  Implementation Sites ({proposal.implementationSites.length})
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {proposal.implementationSites.map((site: Site, index: number) => (
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
                  ))}
                </div>
              </div>
            )}

            {/* 4. Cooperating Agencies & Mode */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#C8102E]" />
                  Cooperating Agencies
                </h3>
                <p className="text-xs sm:text-sm text-slate-700">
                  {proposal.cooperatingAgencies}
                </p>
              </div>
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-[#C8102E]" />
                  Mode of Implementation
                </h3>
                <p className="text-xs sm:text-sm text-slate-700">
                  {proposal.modeOfImplementation}
                </p>
              </div>
            </div>

            {/* 5. Classification & Station */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                  <Tags className="w-4 h-4 text-[#C8102E]" />
                  Classification
                </h3>
                <p className="text-xs sm:text-sm text-slate-700">
                  <span className="font-semibold">{proposal.classification}:</span> {proposal.classificationDetails}
                </p>
              </div>
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                  <Microscope className="w-4 h-4 text-[#C8102E]" />
                  R&D Station
                </h3>
                <p className="text-xs sm:text-sm text-slate-700">
                  {proposal.rdStation}
                </p>
              </div>
            </div>

            {/* 6. Sector, Priority, Discipline */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                    <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                        <Target className="w-4 h-4 text-[#C8102E]" />
                        Priority Areas
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-700">{proposal.priorityAreas}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                    <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-[#C8102E]" />
                        Discipline
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-700">{proposal.discipline}</p>
                </div>
            </div>

            {/* 7. Schedule */}
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#C8102E]" />
                Implementing Schedule
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs sm:text-sm">
                <div>
                  <span className="text-slate-500 text-xs tracking-wide">
                    Duration
                  </span>
                  <p className="font-semibold text-slate-900 mt-1">
                    {proposal.duration}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500 text-xs tracking-wide">
                    Start Date
                  </span>
                  <p className="font-semibold text-slate-900 mt-1">
                    {proposal.startDate}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500 text-xs tracking-wide">
                    End Date
                  </span>
                  <p className="font-semibold text-slate-900 mt-1">
                    {proposal.endDate}
                  </p>
                </div>
              </div>
            </div>

            {/* 8. Budget Table */}
            {proposal.budgetSources && (
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
                          Source
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
                      {proposal.budgetSources.map((budget: BudgetSource, index: number) => (
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
              </div>
            )}

          </div>
        </div>

        {/* --- FOOTER --- */}
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