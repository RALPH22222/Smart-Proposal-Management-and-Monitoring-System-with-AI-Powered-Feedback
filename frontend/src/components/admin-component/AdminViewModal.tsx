import React, { useState, useEffect } from "react";
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
  RefreshCw,
  Clock,
  Briefcase,
  FileCheck,
  Timer,
  Building2,
  MapPin,
  Send,
  Globe,
  CheckCircle,
  Edit2, // Added
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
  onAction?: (action: 'sendToRnd' | 'forwardEval' | 'revision' | 'reject', proposalId: string) => void;
}

// --- HELPER FUNCTIONS ---

// Format YYYY-MM-DD to MM/DD/YYYY for display
const formatDateForDisplay = (dateStr: string) => {
  if (!dateStr) return "N/A";
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date);
  } catch (e) {
    return dateStr;
  }
};

// Format string (e.g. "research_class" -> "Research Class")
const formatString = (str: string) => {
  if (!str) return "N/A";
  return str
    .split(/[_\s]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

// Format any date string to YYYY-MM-DD for input value
const formatDateForInput = (dateStr: string) => {
  if (!dateStr) return "";
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "";
    return date.toISOString().split('T')[0];
  } catch (e) {
    return "";
  }
};

// Extract number from duration string (e.g., "12 Months" -> "12")
const cleanDuration = (d: string | number) => {
  if (!d) return "";
  // If it's already a number, return as string
  if (typeof d === 'number') return d.toString();
  // If string, replace non-digits
  return d.toString().replace(/\D/g, '');
};

const AdminViewModal: React.FC<AdminViewModalProps> = ({
  isOpen,
  onClose,
  proposal,
  onAction,
}) => {
  // --- STATE FOR EDITING SCHEDULE ---
  const [isEditingSchedule, setIsEditingSchedule] = useState(false);
  const [scheduleData, setScheduleData] = useState({
    duration: "",  // Will store JUST the number string
    startDate: "",
    endDate: "",
  });

  // Safe cast for internal use
  const p = proposal as ModalProposalData;

  // Sync state with proposal when opened
  useEffect(() => {
    if (p) {
      setScheduleData({
        duration: cleanDuration(p.duration),
        startDate: formatDateForInput(p.startDate),
        endDate: formatDateForInput(p.endDate),
      });
      setIsEditingSchedule(false);
    }
  }, [p, isOpen]);

  if (!isOpen || !proposal) return null;

  // --- CALCULATION HANDLERS ---

  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDuration = e.target.value;
    const months = parseInt(newDuration);

    // Update State (Keep pure number in state)
    const newState = { ...scheduleData, duration: newDuration };

    // If we have a start date and valid duration, calc end date
    if (scheduleData.startDate && !isNaN(months)) {
      const start = new Date(scheduleData.startDate);
      const end = new Date(start);
      end.setMonth(end.getMonth() + months);
      newState.endDate = formatDateForInput(end.toISOString());
    }

    setScheduleData(newState);
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStart = e.target.value;
    const newState = { ...scheduleData, startDate: newStart };

    // If duration exists, calc end date
    if (newStart && scheduleData.duration) {
      const months = parseInt(scheduleData.duration);
      if (!isNaN(months)) {
        const start = new Date(newStart);
        const end = new Date(start);
        end.setMonth(end.getMonth() + months);
        newState.endDate = formatDateForInput(end.toISOString());
      }
    }
    // Else if end date exists, calc duration
    else if (newStart && scheduleData.endDate) {
      const start = new Date(newStart);
      const end = new Date(scheduleData.endDate);

      // Difference in months
      let months = (end.getFullYear() - start.getFullYear()) * 12;
      months -= start.getMonth();
      months += end.getMonth();

      if (months > 0) {
        newState.duration = months.toString();
      }
    }

    setScheduleData(newState);
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEnd = e.target.value;
    const newState = { ...scheduleData, endDate: newEnd };

    // If start date exists, calc duration
    if (scheduleData.startDate && newEnd) {
      const start = new Date(scheduleData.startDate);
      const end = new Date(newEnd);

      let months = (end.getFullYear() - start.getFullYear()) * 12;
      months -= start.getMonth();
      months += end.getMonth();

      if (months >= 0) {
        newState.duration = months.toString();
      }
    }

    setScheduleData(newState);
  };


  // --- HANDLERS ---
  const handleSaveSchedule = () => {
    alert("Schedule updated successfully!");
    setIsEditingSchedule(false);

    // MOCK UPDATE DISPLAY
    const durationNum = scheduleData.duration;
    const durationWithSuffix = durationNum ? `${durationNum} Months` : "";

    // Mutating prop for mock effect
    p.duration = durationWithSuffix;
    p.startDate = scheduleData.startDate;
    p.endDate = scheduleData.endDate;
  };

  const cancelEditSchedule = () => {
    // Revert changes
    setScheduleData({
      duration: cleanDuration(p.duration),
      startDate: formatDateForInput(p.startDate),
      endDate: formatDateForInput(p.endDate),
    });
    setIsEditingSchedule(false);
  };

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

  const mockRevisionDeadline = "November 30, 2025 | 5:00 PM";

  // --- THEME HELPER ---
  const getStatusTheme = (status: string) => {
    const s = (status || "").toLowerCase();

    // Green
    if (["endorsed", "endorsed_for_funding", "endorsed for funding"].includes(s))
      return {
        bg: "bg-green-100",
        border: "border-green-200",
        text: "text-green-800",
        icon: <CheckCircle className="w-4 h-4 text-green-600" />,
        label: "Endorsed for funding",
      };

    // Emerald
    if (["funded", "accepted", "approved"].includes(s))
      return {
        bg: "bg-emerald-100",
        border: "border-emerald-200",
        text: "text-emerald-800",
        icon: <CheckCircle className="w-4 h-4 text-emerald-600" />,
        label: "Project Funded",
      };

    // Red
    if (["rejected", "rejected_rnd", "disapproved", "reject", "rejected proposal"].includes(s))
      return {
        bg: "bg-red-100",
        border: "border-red-200",
        text: "text-red-800",
        icon: <XCircle className="w-4 h-4 text-red-600" />,
        label: "Proposal Rejected",
      };

    // Orange (Pending Review)
    if (["pending", "pending review"].includes(s))
      return {
        bg: "bg-orange-100",
        border: "border-orange-200",
        text: "text-orange-800",
        icon: <Clock className="w-4 h-4 text-orange-600" />,
        label: "Pending Review",
      };

    // Revision (Amber)
    if (["revise", "revision", "revision_rnd", "revision required"].includes(s))
      return {
        bg: "bg-amber-100",
        border: "border-amber-200",
        text: "text-amber-800",
        icon: <RefreshCw className="w-4 h-4 text-amber-600" />,
        label: "Revision Required",
      };

    // Blue
    if (["review_rnd", "r&d evaluation", "under r&d evaluation"].includes(s))
      return {
        bg: "bg-blue-100",
        border: "border-blue-200",
        text: "text-blue-800",
        icon: <Microscope className="w-4 h-4 text-blue-600" />,
        label: "Under R&D Evaluation",
      };

    // Purple
    if (["under_evaluation", "evaluators assessment", "under evaluators assessment"].includes(s))
      return {
        bg: "bg-purple-100",
        border: "border-purple-200",
        text: "text-purple-800",
        icon: <FileText className="w-4 h-4 text-purple-600" />,
        label: "Under Evaluators Assessment",
      };

    // Default/Pending
    return {
      bg: "bg-slate-100",
      border: "border-slate-200",
      text: "text-slate-700",
      icon: <Clock className="w-4 h-4 text-slate-500" />,
      label: "Pending Review",
    };
  };

  const theme = getStatusTheme(p.status);

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

          {/* Status Feedback Blocks */}
          {(p.status === "Revision Required" || p.status === "revision_rnd") && (
            <div className="bg-orange-50 rounded-lg p-5 border border-orange-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-orange-800 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Revision Requirements
                </h3>
              </div>
              <div className="mb-5 bg-white border-l-4 border-red-500 rounded shadow-sm p-4">
                <p className="text-xs font-bold text-red-600 tracking-wider mb-1">
                  Revision Submission Deadline
                </p>
                <div className="flex items-center gap-2 text-slate-900">
                  <Timer className="w-5 h-5 text-red-500" />
                  <span className="font-medium text-base">{mockRevisionDeadline}</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="bg-white p-3 rounded border border-orange-100">
                  <p className="text-xs font-bold text-orange-700 mb-1">Objectives Assessment</p>
                  <p className="text-sm text-slate-700">{mockAssessment.objectives}</p>
                </div>
              </div>
            </div>
          )}

          {/* Documents Section */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#C8102E]" /> Project Documents
              </h3>
            </div>
            <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-200 group hover:border-[#C8102E] transition-colors cursor-pointer" onClick={() => handleDownload(p.projectFile)}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                  <FileCheck className="w-5 h-5 text-[#C8102E]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900 group-hover:text-[#C8102E] transition-colors">
                    {p.projectFile || "Full Project Proposal.pdf"}
                  </p>
                  <p className="text-xs text-slate-500">
                    {p.submittedDate ? `Submitted: ${formatDateForDisplay(p.submittedDate)}` : "Current Version"}
                  </p>
                </div>
              </div>
              <button className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-50 hover:bg-[#C8102E] hover:text-white rounded-md transition-all">
                <Download className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* General Information Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Leader Info */}
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
              <div className="flex items-center gap-1.5 mb-2">
                <User className="w-4 h-4 text-[#C8102E]" />
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Project Leader</h4>
              </div>
              <p className="text-sm font-semibold text-slate-900">{p.proponent}</p>
              <p className="text-xs text-slate-500 mt-1">{p.gender}</p>

              <div className="mt-4 space-y-2">
                <div>
                  <p className="text-xs text-slate-500 flex items-center gap-1"><Mail className="w-3 h-3" /> Email</p>
                  <p className="text-sm text-slate-800">{p.email}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 flex items-center gap-1"><Phone className="w-3 h-3" /> Contact</p>
                  <p className="text-sm text-slate-800">{p.telephone}</p>
                </div>
              </div>
            </div>

            {/* Agency Info */}
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
              <div className="flex items-center gap-1.5 mb-2">
                <Building2 className="w-4 h-4 text-[#C8102E]" />
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Agency</h4>
              </div>
              <p className="text-sm font-semibold text-slate-900">{p.agency}</p>
              <p className="text-xs text-slate-600 mt-1 flex items-start gap-1">
                <MapPin className="w-3 h-3 mt-0.5" /> {p.address}
              </p>
            </div>
          </div>

          {/* Project Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                <Briefcase className="w-4 h-4 text-[#C8102E]" /> Mode of Implementation
              </h4>
              <p className="text-sm font-semibold text-slate-900">{formatString(p.modeOfImplementation)}</p>
            </div>

            <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                <Users className="w-4 h-4 text-[#C8102E]" /> Cooperating Agencies
              </h4>
              <p className="text-sm text-slate-900">{p.cooperatingAgencies || "None"}</p>
            </div>

            <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                <Microscope className="w-4 h-4 text-[#C8102E]" /> R&D Station
              </h4>
              <p className="text-sm text-slate-900">{p.rdStation}</p>
            </div>

            <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                <Tags className="w-4 h-4 text-[#C8102E]" /> Classification
              </h4>
              <p className="text-sm font-semibold text-slate-900">{formatString(p.classification)}</p>
              {p.classificationDetails && <p className="text-xs text-slate-600 mt-1">{p.classificationDetails}</p>}
            </div>
          </div>

          {/* Sites */}
          {p.implementationSites && p.implementationSites.length > 0 && (
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                <Globe className="w-4 h-4 text-[#C8102E]" /> Implementation Sites
              </h4>
              <div className="flex flex-wrap gap-2">
                {p.implementationSites.map((site, i) => (
                  <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 shadow-sm">
                    <MapPin className="w-3.5 h-3.5 text-blue-500" />
                    {site.site}, {site.city}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Schedule Section (With Edit) */}
          <div className={`rounded-xl border p-4 transition-colors ${isEditingSchedule ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-200'}`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#C8102E]" /> Implementing Schedule
              </h3>
              {!isEditingSchedule ? (
                <button onClick={() => setIsEditingSchedule(true)} className="text-xs font-medium text-slate-500 hover:text-[#C8102E] flex items-center gap-1 transition-colors">
                  <Edit2 className="w-3 h-3" /> Edit Schedule
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button onClick={cancelEditSchedule} className="text-xs font-medium text-slate-500 hover:text-slate-800">Cancel</button>
                  <button onClick={handleSaveSchedule} className="text-xs font-bold text-blue-600 hover:text-blue-800">Save</button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-slate-500 mb-1">Duration</p>
                {isEditingSchedule ? (
                  <input
                    type="number" className="w-full px-2 py-1 text-sm border border-blue-300 rounded focus:ring-1 focus:ring-blue-500 outline-none"
                    value={scheduleData.duration} onChange={handleDurationChange} placeholder="Months"
                  />
                ) : (
                  <p className="text-sm font-semibold text-slate-900">{p.duration}</p>
                )}
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Start Date</p>
                {isEditingSchedule ? (
                  <input
                    type="date" className="w-full px-2 py-1 text-sm border border-blue-300 rounded focus:ring-1 focus:ring-blue-500 outline-none"
                    value={scheduleData.startDate} onChange={handleStartDateChange}
                  />
                ) : (
                  <p className="text-sm font-medium text-slate-900">{formatDateForDisplay(p.startDate)}</p>
                )}
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">End Date</p>
                {isEditingSchedule ? (
                  <input
                    type="date" className="w-full px-2 py-1 text-sm border border-blue-300 rounded focus:ring-1 focus:ring-blue-500 outline-none"
                    value={scheduleData.endDate} onChange={handleEndDateChange}
                  />
                ) : (
                  <p className="text-sm font-medium text-slate-900">{formatDateForDisplay(p.endDate)}</p>
                )}
              </div>
            </div>
          </div>

          {/* Budget */}
            {/* Budget */}
            {p.budgetSources && (
               <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
                  <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                     <DollarSign className="w-4 h-4 text-[#C8102E]" /> Budget Requirements
                  </h3>
                   
                  <div className="space-y-6">
                    {p.budgetSources.map((budget: any, index: number) => (
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
                             <div className="space-y-2 pt-2 md:pt-0">
                                <div className="flex justify-between items-center mb-2">
                                    <h5 className="font-bold text-slate-600 uppercase">Personal Services (PS)</h5>
                                    <span className="font-semibold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">{budget.ps}</span>
                                </div>
                                <div className="space-y-1">
                                    {budget.breakdown?.ps && budget.breakdown.ps.length > 0 ? (
                                        budget.breakdown.ps.map((item: any, i:number) => (
                                            <div key={i} className="flex justify-between text-slate-500 hover:bg-slate-50 p-1 rounded">
                                                <span>{item.item}</span>
                                                <span className="font-medium text-slate-700">₱{(item.amount || 0).toLocaleString()}</span>
                                            </div>
                                        ))
                                    ) : <p className="italic text-slate-400">No items</p>}
                                </div>
                             </div>

                             {/* MOOE */}
                             <div className="space-y-2 pt-2 md:pt-0 pl-0 md:pl-4">
                                <div className="flex justify-between items-center mb-2">
                                    <h5 className="font-bold text-slate-600 uppercase">MOOE</h5>
                                    <span className="font-semibold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">{budget.mooe}</span>
                                </div>
                                <div className="space-y-1">
                                    {budget.breakdown?.mooe && budget.breakdown.mooe.length > 0 ? (
                                        budget.breakdown.mooe.map((item: any, i:number) => (
                                            <div key={i} className="flex justify-between text-slate-500 hover:bg-slate-50 p-1 rounded">
                                                <span>{item.item}</span>
                                                <span className="font-medium text-slate-700">₱{(item.amount || 0).toLocaleString()}</span>
                                            </div>
                                        ))
                                    ) : <p className="italic text-slate-400">No items</p>}
                                </div>
                             </div>

                             {/* CO */}
                             <div className="space-y-2 pt-2 md:pt-0 pl-0 md:pl-4">
                                <div className="flex justify-between items-center mb-2">
                                    <h5 className="font-bold text-slate-600 uppercase">Capital Outlay (CO)</h5>
                                    <span className="font-semibold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">{budget.co}</span>
                                </div>
                                <div className="space-y-1">
                                    {budget.breakdown?.co && budget.breakdown.co.length > 0 ? (
                                        budget.breakdown.co.map((item: any, i:number) => (
                                            <div key={i} className="flex justify-between text-slate-500 hover:bg-slate-50 p-1 rounded">
                                                <span>{item.item}</span>
                                                <span className="font-medium text-slate-700">₱{(item.amount || 0).toLocaleString()}</span>
                                            </div>
                                        ))
                                    ) : <p className="italic text-slate-400">No items</p>}
                                </div>
                             </div>
                        </div>
                      </div>
                    ))}
                    
                    {/* Grant Total Footer */}
                    <div className="flex justify-end items-center gap-4 pt-2">
                        <span className="text-sm font-bold text-slate-600 uppercase">Grand Total Requirements</span>
                        <span className="text-xl font-bold text-[#C8102E]">{p.budgetTotal}</span>
                    </div>

                  </div>
               </div>
            )}
        </div>

        {/* Modal Footer with Actions for Pending Reviews */}
        {/* Modal Footer with Actions for Pending Reviews */}
        <div className="p-4 sm:p-6 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-3">
          {onAction && (p.status === 'review_rnd' || p.status === 'pending review' || p.status === 'pending') && (
            <>
               <button
                  onClick={() => onAction('sendToRnd', p.id)}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-2"
               >
                  <Send className="w-4 h-4" />
                  Send to RND
               </button>
               <button
                  onClick={() => onAction('forwardEval', p.id)}
                  className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors shadow-sm flex items-center gap-2"
               >
                  <Users className="w-4 h-4" />
                  Assigned to Evaluator
               </button>
               <button
                  onClick={() => onAction('revision', p.id)}
                  className="px-4 py-2 text-sm font-medium text-orange-700 bg-orange-100 border border-orange-200 rounded-lg hover:bg-orange-200 transition-colors shadow-sm flex items-center gap-2"
               >
                  <RefreshCw className="w-4 h-4" />
                  Revise
               </button>
               <button
                  onClick={() => onAction('reject', p.id)}
                  className="px-4 py-2 text-sm font-medium text-red-700 bg-red-100 border border-red-200 rounded-lg hover:bg-red-200 transition-colors shadow-sm flex items-center gap-2"
               >
                  <XCircle className="w-4 h-4" />
                  Reject
               </button>
            </>
          )}
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