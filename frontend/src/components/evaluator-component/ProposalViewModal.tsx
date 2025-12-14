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
  Globe,
} from "lucide-react";

// --- LOCAL INTERFACES ---
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
  assignedRdStaff?: string;
  rdCommentsToEvaluator?: string;
  evaluationDeadline?: string;
  projectFile?: string;
  extensionReason?: string; 
}

interface ProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  proposal: any; 
}

export default function ProposalModal({
  isOpen,
  onClose,
  proposal,
}: ProposalModalProps) {
  if (!isOpen || !proposal) return null;

  // Safe cast
  const p = proposal as Proposal;

  const handleDownload = (file: string) => {
    alert(`Downloading ${file}...`);
  };

  // --- STATUS HELPERS ---
  const getStatusColor = (status: string) => {
    const s = (status || "").toLowerCase();
    switch (s) {
      case "accepted": return "emerald";
      case "rejected": return "red";
      case "pending": return "amber";
      case "revision required": return "orange";
      case "extension_requested": return "blue";
      default: return "slate";
    }
  };

  const getStatusIcon = (status: string) => {
    const s = (status || "").toLowerCase();
    switch (s) {
      case "accepted": return CheckCircle;
      case "rejected": return XCircle;
      case "pending": return Clock;
      case "revision required": return AlertTriangle;
      case "extension_requested": return Clock;
      default: return FileText;
    }
  };

  const statusColor = getStatusColor(p.status);
  const StatusIcon = getStatusIcon(p.status);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex-1 pr-4">
            <div className="flex items-center gap-2 mb-2">
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border capitalize 
                 ${statusColor === "emerald" ? "bg-emerald-50 border-emerald-200 text-emerald-700" : ""}
                 ${statusColor === "red" ? "bg-red-50 border-red-200 text-red-700" : ""}
                 ${statusColor === "amber" ? "bg-amber-50 border-amber-200 text-amber-700" : ""}
                 ${statusColor === "blue" ? "bg-blue-50 border-blue-200 text-blue-700" : ""}
                 ${statusColor === "orange" ? "bg-orange-50 border-orange-200 text-orange-700" : ""}
                 ${statusColor === "slate" ? "bg-slate-50 border-slate-200 text-slate-700" : ""}
                `}>
                <StatusIcon className="w-3 h-3" />
                {p.status === 'extension_requested' ? 'Extension Requested' : p.status}
              </span>
              <span className="text-xs text-slate-500">ID: {p.id}</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">
              {p.title}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-lg transition-colors flex-shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
          <div className="space-y-6">
            
            {/* --- REASON FOR EXTENSION (Visible only if status is extension_requested) --- */}
            {p.status === "extension_requested" && (
              <div className="bg-blue-50 rounded-lg p-5 border border-blue-200">
                <h3 className="text-sm font-bold text-blue-800 mb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Reason for Extension
                </h3>
                <div className="bg-white/60 p-3 rounded border border-blue-100">
                  <p className="text-sm text-blue-900 leading-relaxed">
                    {p.extensionReason || "The evaluator has requested additional time to thoroughly review the technical specifications and methodology of this proposal."}
                  </p>
                </div>
              </div>
            )}

            {/* Documents */}
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
               <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#C8102E]" /> Project Documents
               </h3>
               <div className="flex items-center justify-between bg-white p-3 rounded border border-slate-200 cursor-pointer hover:border-[#C8102E] transition-colors"
                    onClick={() => handleDownload(p.projectFile || "file")}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-10 bg-red-50 rounded flex items-center justify-center border border-red-100">
                      <FileText className="w-4 h-4 text-[#C8102E]" />
                    </div>
                    <span className="text-sm font-medium text-slate-700">{p.projectFile || "Project_Proposal.pdf"}</span>
                  </div>
                  <button className="text-xs flex items-center gap-1 text-slate-600 hover:text-[#C8102E]">
                    <Download className="w-3 h-3" /> Download
                  </button>
               </div>
            </div>

            {/* Leader & Agency */}
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
               <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2 border-b border-slate-200 pb-2">
                  <User className="w-4 h-4 text-[#C8102E]" /> Leader & Agency Info
               </h3>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">
                  <div>
                     <span className="text-xs text-slate-500 uppercase font-semibold">Proponent</span>
                     <p className="text-sm font-medium text-slate-900">{p.proponent}</p>
                  </div>
                  <div>
                     <span className="text-xs text-slate-500 uppercase font-semibold">Gender</span>
                     <p className="text-sm font-medium text-slate-900">{p.gender}</p>
                  </div>
               </div>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">
                  {/* Agency String */}
                  <div>
                     <span className="text-xs text-slate-500 uppercase font-semibold">Agency</span>
                     <div className="flex items-start gap-1.5 mt-0.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 mt-0.5" />
                        <p className="text-sm font-medium text-slate-900">{p.agency}</p>
                     </div>
                  </div>
                  {/* Address String */}
                  <div>
                     <span className="text-xs text-slate-500 uppercase font-semibold">Address</span>
                     <div className="flex items-start gap-1.5 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5" />
                        <p className="text-sm text-slate-700">{p.address}</p>
                     </div>
                  </div>
               </div>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                  <div>
                     <span className="text-xs text-slate-500 uppercase font-semibold">Contact</span>
                     <div className="flex items-center gap-1.5 mt-0.5">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <p className="text-sm text-slate-700">{p.telephone}</p>
                     </div>
                  </div>
                  <div>
                     <span className="text-xs text-slate-500 uppercase font-semibold">Email</span>
                     <div className="flex items-center gap-1.5 mt-0.5">
                        <Mail className="w-3 h-3 text-slate-400" />
                        <p className="text-sm text-slate-700">{p.email}</p>
                     </div>
                  </div>
               </div>
            </div>

            {/* Implementation Sites */}
            {p.implementationSites && p.implementationSites.length > 0 && (
               <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                  <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                     <Globe className="w-4 h-4 text-[#C8102E]" /> Implementation Sites ({p.implementationSites.length})
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                     {p.implementationSites.map((site, i) => (
                        <div key={i} className="bg-white p-3 rounded-lg border border-slate-200 flex items-start gap-3 shadow-sm">
                           <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0 text-blue-600">
                              <MapPin className="w-4 h-4" />
                           </div>
                           <div>
                              <p className="text-sm font-bold text-slate-900">{site.site}</p>
                              <p className="text-xs text-slate-500">{site.city}</p>
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

            {/* 5. Classification & Station */}
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

            {/* 6. Sector, Priority, Discipline */}
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

            {/* 7. Schedule */}
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

            {/* 8. Budget Table */}
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
                      {p.budgetSources.map((budget, index) => (
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

        {/* Footer */}
        <div className="p-4 sm:p-6 border-t border-slate-200 bg-slate-50 flex justify-end">
           <button onClick={onClose} className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
             Close
           </button>
        </div>
      </div>
    </div>
  );
}