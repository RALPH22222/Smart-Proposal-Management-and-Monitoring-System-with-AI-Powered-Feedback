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
  Edit2, 
  Save, 
} from "lucide-react";
import { useState, useEffect } from "react";

// --- INTERFACES ---
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
  agency: string;
  address: string;
  telephone: string;
  fax: string;
  email: string;
  modeOfImplementation: string;
  implementationSites: Site[];
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
  proposal: ViewModalProposal | any | null; 
}

// Mock download handler
const handleDownload = (fileName: string) => {
  alert(`Downloading ${fileName}...`);
};

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

export default function RnDViewModal({
  isOpen,
  onClose,
  proposal,
}: RnDViewModalProps) {
  // --- STATE FOR EDITING SCHEDULE ---
  const [isEditingSchedule, setIsEditingSchedule] = useState(false);
  const [scheduleData, setScheduleData] = useState({
    duration: "",  // Will store JUST the number string
    startDate: "",
    endDate: "",
  });

  // Sync state with proposal when opened
  useEffect(() => {
    if (proposal) {
      setScheduleData({
        duration: cleanDuration(proposal.duration),
        startDate: formatDateForInput(proposal.startDate),
        endDate: formatDateForInput(proposal.endDate),
      });
      setIsEditingSchedule(false);
    }
  }, [proposal, isOpen]);

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
      // Optional: Subtract 1 day to make it exact duration coverage? Usually X months includes the full Xth month.
      // Standard practice varies. keeping simple date + months for now.
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
    // Here you would typically call an API to save the changes
    // For now, we'll just toggle edit mode off and show an alert
    alert("Schedule updated successfully!");
    setIsEditingSchedule(false);
    
    // MOCK UPDATE DISPLAY
    // Ensure " Months" is appended if there's a value
    const durationNum = scheduleData.duration;
    const durationWithSuffix = durationNum ? `${durationNum} Months` : "";

    proposal.duration = durationWithSuffix;
    proposal.startDate = scheduleData.startDate;
    proposal.endDate = scheduleData.endDate;
  };

  const cancelEditSchedule = () => {
    // Revert changes
    setScheduleData({
      duration: cleanDuration(proposal.duration),
      startDate: formatDateForInput(proposal.startDate),
      endDate: formatDateForInput(proposal.endDate),
    });
    setIsEditingSchedule(false);
  };

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
                      Submitted: {formatDateForDisplay(proposal.submittedDate)}
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

            {/* 7. Schedule (EDITABLE SECTION) */}
            <div className={`rounded-lg p-4 border transition-colors ${isEditingSchedule ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className={`text-sm font-bold flex items-center gap-2 ${isEditingSchedule ? 'text-blue-700' : 'text-slate-900'}`}>
                  <Calendar className={`w-4 h-4 ${isEditingSchedule ? 'text-blue-600' : 'text-[#C8102E]'}`} />
                  Implementing Schedule
                </h3>
                
                {!isEditingSchedule ? (
                  <button 
                    onClick={() => setIsEditingSchedule(true)}
                    className="p-1.5 rounded-md hover:bg-slate-200 text-slate-500 hover:text-slate-700 transition-colors"
                    title="Edit Schedule"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button 
                       onClick={cancelEditSchedule}
                       className="p-1.5 rounded-md hover:bg-red-100 text-red-600 transition-colors"
                       title="Cancel"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <button 
                       onClick={handleSaveSchedule}
                       className="p-1.5 rounded-md hover:bg-emerald-100 text-emerald-600 transition-colors"
                       title="Save"
                    >
                      <Save className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs sm:text-sm">
                <div>
                  <span className={`${isEditingSchedule ? 'text-blue-600' : 'text-slate-500'} text-xs tracking-wide`}>
                    Duration (Months)
                  </span>
                  {/* DISPLAY DURATION AS RAW NUMBER + SUFFIX IN VIEW MODE */}
                  {/* EDIT MODE: JUST NUMBER INPUT */}
                  {isEditingSchedule ? (
                     <div className="relative">
                      <input 
                        type="number"
                        min="1"
                        value={scheduleData.duration}
                        onChange={handleDurationChange}
                        className="w-full mt-1 px-2 py-1.5 bg-white border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 pr-12"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 pt-1 text-slate-400 text-xs pointer-events-none">
                        Months
                      </span>
                     </div>
                  ) : (
                    <p className="font-semibold text-slate-900 mt-1">
                      {proposal.duration}
                    </p>
                  )}
                </div>
                <div>
                  <span className={`${isEditingSchedule ? 'text-blue-600' : 'text-slate-500'} text-xs tracking-wide`}>
                    Start Date
                  </span>
                   {isEditingSchedule ? (
                     <input 
                      type="date"
                      value={scheduleData.startDate}
                      onChange={handleStartDateChange}
                      className="w-full mt-1 px-2 py-1.5 bg-white border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                    />
                  ) : (
                    <p className="font-semibold text-slate-900 mt-1">
                      {formatDateForDisplay(proposal.startDate)}
                    </p>
                  )}
                </div>
                <div>
                  <span className={`${isEditingSchedule ? 'text-blue-600' : 'text-slate-500'} text-xs tracking-wide`}>
                    End Date
                  </span>
                   {isEditingSchedule ? (
                     <input 
                      type="date"
                      value={scheduleData.endDate}
                      onChange={handleEndDateChange}
                      className="w-full mt-1 px-2 py-1.5 bg-white border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                    />
                  ) : (
                    <p className="font-semibold text-slate-900 mt-1">
                      {formatDateForDisplay(proposal.endDate)}
                    </p>
                  )}
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