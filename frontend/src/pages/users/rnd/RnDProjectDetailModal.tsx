import React, { useState, useEffect } from 'react';
import {
  Calendar, User, DollarSign, X, CheckCircle, TrendingUp,
  AlertTriangle, Clock, ChevronDown, ChevronUp, 
  FileText, Send, ShieldAlert, Paperclip, Download, Eye,
  Banknote, CalendarClock, Users, MessageSquare, CheckSquare, XCircle, Lock, Loader2, Award
} from 'lucide-react';
import { type Project } from '../../../types/InterfaceProject';

// --- Extended Types ---
interface ExpenseBreakdown {
  id: string;
  description: string;
  amount: number;
}

interface Message {
  id: string;
  sender: 'R&D' | 'Proponent';
  text: string;
  timestamp: string;
}

interface ExtendedReport {
  id: string;
  quarter: string;
  dueDate: string;
  status: 'Locked' | 'Due' | 'Submitted' | 'Verified' | 'Overdue';
  progress: number;
  expenses: ExpenseBreakdown[];
  totalExpense: number;
  proofs: string[];
  submittedBy?: string;
  submittedRole?: 'Leader' | 'Co-Proponent';
  dateSubmitted?: string;
  messages: Message[];
}

interface ExtensionRequest {
  id: string;
  currentDate: string;
  requestedDate: string;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
}

interface FundRequest {
  id: string;
  amount: number;
  breakdown: ExpenseBreakdown[];
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
}

interface DetailsData {
  reports: ExtendedReport[];
  extensionRequests: ExtensionRequest[];
  fundRequests: FundRequest[];
}

interface RnDProjectDetailModalProps {
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
}

// --- MOCK DATA GENERATOR ---
const generateMockDetails = (project: Project): DetailsData => {
  // Base reports
  let reports: ExtendedReport[] = [
    {
      id: 'q1',
      quarter: 'Q1 Report',
      dueDate: '2025-03-31',
      status: 'Verified',
      progress: 25,
      expenses: [
        { id: 'e1', description: 'Equipment Purchase (High-end GPU)', amount: 150000 },
        { id: 'e2', description: 'Field Survey Transportation', amount: 20000 }
      ],
      totalExpense: 170000,
      proofs: ['Receipts_Batch1.pdf', 'Site_Photos.zip'],
      submittedBy: project.principalInvestigator,
      submittedRole: 'Leader',
      dateSubmitted: '2025-03-28',
      messages: []
    },
    {
      id: 'q2',
      quarter: 'Q2 Report',
      dueDate: '2025-06-30',
      status: 'Submitted',
      progress: 50,
      expenses: [
        { id: 'e3', description: 'Lab Testing Fees', amount: 50000 },
        { id: 'e4', description: 'Research Assistant Stipend', amount: 30000 }
      ],
      totalExpense: 80000,
      proofs: ['Lab_Results.pdf'],
      submittedBy: project.coProponent || "Engr. Co-Lead", 
      submittedRole: 'Co-Proponent',
      dateSubmitted: '2025-06-29',
      messages: [
          { id: 'm_q2_1', sender: 'Proponent', text: 'We have uploaded the lab results as requested.', timestamp: '2025-06-29' }
      ]
    },
    {
      id: 'q3',
      quarter: 'Q3 Report',
      dueDate: '2025-09-30',
      status: 'Overdue',
      progress: 50,
      expenses: [],
      totalExpense: 0,
      proofs: [],
      messages: [
        { id: 'm1', sender: 'R&D', text: 'This report is 15 days late. Please submit update immediately or request extension.', timestamp: 'May 16, 2025' },
        { id: 'm2', sender: 'Proponent', text: 'Apologies, we are finalizing the data. Will submit by Friday.', timestamp: 'May 17, 2025' }
      ]
    },
    {
      id: 'q4',
      quarter: 'Q4 Report',
      dueDate: '2025-12-31',
      status: 'Locked',
      progress: 0,
      expenses: [],
      totalExpense: 0,
      proofs: [],
      messages: []
    }
  ];

  // --- LOGIC TO HANDLE COMPLETED PROJECTS ---
  // If completed, we must ensure all reports are verified and total expenses == budget
  if (project.status === 'Completed') {
    const currentUsed = reports.reduce((acc, r) => acc + r.totalExpense, 0);
    const remainingToFill = project.budget - currentUsed;

    reports = reports.map(report => {
        // 1. Mark everything as Verified and 100% for earlier reports
        let updatedReport = { ...report, status: 'Verified' as const, progress: 100 };
        
        // 2. If this is the final report (Q4), dump the remaining budget here
        if (report.id === 'q4') {
            updatedReport = {
                ...updatedReport,
                submittedBy: project.principalInvestigator,
                submittedRole: 'Leader',
                dateSubmitted: '2025-12-20',
                totalExpense: remainingToFill,
                expenses: [
                    { id: 'final_1', description: 'Final Data Analysis & Publication', amount: remainingToFill * 0.3 },
                    { id: 'final_2', description: 'Final Liquidation / Budget Utilization', amount: remainingToFill * 0.7 }
                ],
                proofs: ['Final_Paper.pdf', 'Audited_Financials.pdf']
            };
        } 
        // 3. Clean up Q3 if it was empty in mock data
        else if (report.id === 'q3' && report.totalExpense === 0) {
             updatedReport = {
                ...updatedReport,
                totalExpense: 0,
                expenses: [{ id: 'q3_nil', description: 'No expenses incurred this period', amount: 0 }],
                messages: [] // Clear overdue messages
             }
        }

        return updatedReport;
    });
  }

  const extensionRequests: ExtensionRequest[] = [
    { id: 'ext1', currentDate: '2025-09-30', requestedDate: '2025-10-15', reason: 'Unforeseen weather delays affecting data collection.', status: 'Pending' }
  ];

  const fundRequests: FundRequest[] = [
    { 
      id: 'fund1', 
      amount: 50000, 
      reason: 'Additional hardware requirements', 
      breakdown: [{ id: 'f1', description: 'Server Rack', amount: 20000 }, { id: 'f2', description: 'Cooling System', amount: 30000 }],
      status: 'Pending' 
    }
  ];

  return { reports, extensionRequests, fundRequests };
};

const RnDProjectDetailModal: React.FC<RnDProjectDetailModalProps> = ({
  project,
  isOpen,
  onClose
}) => {
  const [details, setDetails] = useState<DetailsData | null>(() => 
    (project && isOpen) ? generateMockDetails(project) : null
  );

  const [expandedReportId, setExpandedReportId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [activeRejectId, setActiveRejectId] = useState<string | null>(null);
  const [chatInputs, setChatInputs] = useState<{[key:string]: string}>({});

  useEffect(() => {
    if (project && isOpen) {
      setDetails(generateMockDetails(project));
    }
  }, [project, isOpen]);

  if (!isOpen) return null;

  if (!project || !details) {
    return (
      <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white p-6 rounded-xl shadow-xl flex items-center gap-3">
          <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
          <span className="text-slate-700 font-medium">Loading details...</span>
        </div>
      </div>
    );
  }

  // --- CALCULATE FINANCIALS ---
  // If Completed, force totalUsed to equal budget to avoid floating point errors
  const isCompleted = project.status === 'Completed';
  const totalUsed = isCompleted 
    ? project.budget 
    : details.reports.reduce((acc, r) => acc + r.totalExpense, 0);
    
  const remainingBudget = project.budget - totalUsed;

  const toggleReport = (id: string) => setExpandedReportId(expandedReportId === id ? null : id);

  const handleChatInput = (reportId: string, val: string) => {
    setChatInputs(prev => ({...prev, [reportId]: val}));
  };

  const handleSendMessage = (reportId: string) => {
    const text = chatInputs[reportId];
    if (!text?.trim()) return;

    setDetails(prev => {
      if (!prev) return null;
      return {
        ...prev,
        reports: prev.reports.map(r => {
          if (r.id === reportId) {
            return {
              ...r,
              messages: [
                ...r.messages,
                { 
                  id: Date.now().toString(), 
                  sender: 'R&D', 
                  text: text, 
                  timestamp: 'Just now' 
                }
              ]
            };
          }
          return r;
        })
      };
    });
    setChatInputs(prev => ({...prev, [reportId]: ''}));
  };

  // --- RENDERERS ---

  // 1. COMPLETED VIEW
  const renderCompletedView = () => (
    <div className="space-y-6">
       
       {/* Success Banner */}
       <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
          <div className="relative z-10 flex items-center gap-4">
             <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
                <CheckCircle className="w-8 h-8 text-white" />
             </div>
             <div>
                <h3 className="text-2xl font-bold">Project Successfully Completed</h3>
                <p className="text-blue-100 opacity-90 text-sm">All reports have been verified. Budget fully utilized.</p>
             </div>
          </div>
          <Award className="absolute -right-6 -bottom-6 w-32 h-32 text-white opacity-10" />
       </div>

       {/* Leadership Summary */}
       <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h4 className="text-xs font-bold text-slate-400 uppercase mb-4 flex items-center gap-2">
             <Users className="w-4 h-4" /> Project Leadership Team
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {/* Leader */}
             <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                   <User className="w-5 h-5" />
                </div>
                <div>
                   <p className="text-sm font-bold text-slate-800">{project.principalInvestigator}</p>
                   <p className="text-xs text-slate-500">Project Leader</p>
                </div>
             </div>
             
             {/* Co-Proponent */}
             {project.coProponent ? (
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                   <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                      <Users className="w-5 h-5" />
                   </div>
                   <div>
                      <p className="text-sm font-bold text-slate-800">{project.coProponent}</p>
                      <p className="text-xs text-slate-500">Co-Proponent</p>
                   </div>
                </div>
             ) : (
                <div className="flex items-center justify-center p-3 bg-slate-50 rounded-lg border border-slate-100 border-dashed text-slate-400 text-sm italic">
                   No Co-Proponent Assigned
                </div>
             )}
          </div>
       </div>

       {/* Final Stats */}
       <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h4 className="text-xs font-bold text-slate-400 uppercase mb-4 flex items-center gap-2">
             <TrendingUp className="w-4 h-4" /> Final Performance Metrics
          </h4>
          <div className="grid grid-cols-2 gap-6">
             <div>
                <p className="text-xs text-slate-500 mb-1">Total Budget Utilized</p>
                <p className="text-2xl font-bold text-emerald-600">₱{totalUsed.toLocaleString()}</p>
                <div className="w-full h-2 bg-slate-100 rounded-full mt-2 overflow-hidden">
                   <div className="h-full bg-emerald-500 w-full"></div>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 text-right">100% Utilized</p>
             </div>
             <div>
                <p className="text-xs text-slate-500 mb-1">Duration</p>
                <p className="text-2xl font-bold text-slate-800">12 Months</p>
                <p className="text-xs text-slate-400 mt-1">
                   {new Date(project.startDate).toLocaleDateString()} — {new Date(project.endDate).toLocaleDateString()}
                </p>
             </div>
          </div>
       </div>
       
       {/* List of Reports in Completed View for Reference */}
       <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h4 className="text-xs font-bold text-slate-400 uppercase mb-4 flex items-center gap-2">
             <FileText className="w-4 h-4" /> Report Archive
          </h4>
          <div className="space-y-2">
             {details.reports.map((report) => (
                <div key={report.id} className="flex justify-between items-center text-sm p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="font-medium text-slate-700">{report.quarter}</span>
                    <span className="font-mono text-slate-600">₱{report.totalExpense.toLocaleString()}</span>
                </div>
             ))}
             <div className="flex justify-between items-center text-sm p-3 bg-slate-100 rounded-lg border border-slate-200 font-bold">
                <span className="text-slate-800">TOTAL</span>
                <span className="text-emerald-700">₱{totalUsed.toLocaleString()}</span>
             </div>
          </div>
       </div>
    </div>
  );

  // 2. CHAT SECTION
  const renderChatSection = (report: ExtendedReport) => {
    if (report.status === 'Verified' || report.status === 'Locked') return null;

    return (
      <div className="mt-6 border-t border-slate-200 pt-4">
        <h5 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-blue-500" /> 
          {report.status === 'Overdue' ? 'Delay Notices & Communication' : 'R&D Feedback'}
        </h5>
        
        <div className="space-y-4 mb-4 max-h-60 overflow-y-auto pr-2">
          {report.messages.length === 0 && (
             <p className="text-xs text-slate-400 italic">No comments yet.</p>
          )}
          {report.messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.sender === 'R&D' ? 'justify-end' : 'justify-start'}`}>
              
              {msg.sender === 'Proponent' && (
                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center mr-2 flex-shrink-0">
                  <User className="w-4 h-4 text-slate-600" />
                </div>
              )}

              <div className={`max-w-[85%]`}>
                <div className={`text-[10px] font-bold mb-1 ${msg.sender === 'R&D' ? 'text-right text-blue-600' : 'text-left text-slate-600'}`}>
                    {msg.sender === 'R&D' ? 'You (R&D Officer)' : 'Proponent'} 
                    <span className="text-slate-400 font-normal ml-1">• {msg.timestamp}</span>
                </div>

                <div className={`px-4 py-3 rounded-2xl text-sm shadow-sm leading-relaxed ${
                    msg.sender === 'R&D' 
                    ? 'bg-blue-600 text-white rounded-tr-none' 
                    : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none'
                }`}>
                  <p>{msg.text}</p>
                </div>
              </div>

              {msg.sender === 'R&D' && (
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center ml-2 flex-shrink-0 border border-blue-200">
                  <User className="w-4 h-4 text-blue-600" />
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex gap-2 items-center bg-slate-100 p-2 rounded-xl">
          <input
            type="text"
            placeholder={report.status === 'Overdue' ? "Send notice..." : "Write a comment..."}
            className="flex-1 text-sm bg-transparent border-none focus:ring-0 px-2 py-1 text-slate-700 placeholder-slate-400 outline-none"
            value={chatInputs[report.id] || ''}
            onChange={(e) => handleChatInput(report.id, e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(report.id)}
          />
          <button 
            onClick={() => handleSendMessage(report.id)}
            disabled={!chatInputs[report.id]}
            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // 3. REPORT LIST ITEM
  const renderReportItem = (report: ExtendedReport) => {
    const isExpanded = expandedReportId === report.id;
    
    let statusColor = "bg-slate-100 text-slate-500 border-slate-200";
    let statusIcon = <Clock className="w-5 h-5"/>;

    if (report.status === 'Verified') {
        statusColor = "bg-emerald-100 text-emerald-700 border-emerald-200";
        statusIcon = <CheckSquare className="w-5 h-5"/>;
    } else if (report.status === 'Submitted') {
        statusColor = "bg-blue-100 text-blue-700 border-blue-200"; // Blue
        statusIcon = <FileText className="w-5 h-5"/>;
    } else if (report.status === 'Overdue') {
        statusColor = "bg-red-100 text-red-700 border-red-200";
        statusIcon = <AlertTriangle className="w-5 h-5"/>;
    } else if (report.status === 'Locked') {
        statusColor = "bg-gray-50 text-gray-400 border-gray-200";
        statusIcon = <Lock className="w-5 h-5"/>;
    }

    return (
      <div key={report.id} className={`border rounded-xl transition-all duration-200 overflow-hidden ${isExpanded ? 'ring-1 ring-blue-300 shadow-md bg-white' : 'bg-white hover:border-blue-300'}`}>
         
         <div className={`p-4 flex items-center justify-between cursor-pointer ${report.status === 'Locked' ? 'opacity-70 bg-gray-50' : ''}`} onClick={() => toggleReport(report.id)}>
            <div className="flex items-center gap-4">
               <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${statusColor}`}>
                  {statusIcon}
               </div>
               <div>
                  <h4 className={`font-bold ${report.status === 'Locked' ? 'text-gray-500' : 'text-slate-800'}`}>{report.quarter}</h4>
                  <p className="text-xs text-slate-500">Due: {report.dueDate}</p>
               </div>
            </div>
            <div className="text-right">
               <span className={`text-xs font-bold px-2 py-1 rounded border ${statusColor}`}>{report.status}</span>
               {isExpanded ? <ChevronUp className="w-4 h-4 mx-auto mt-1 text-slate-400"/> : <ChevronDown className="w-4 h-4 mx-auto mt-1 text-slate-400"/>}
            </div>
         </div>

         {isExpanded && report.status !== 'Locked' && (
            <div className="p-5 border-t border-slate-100 bg-slate-50 space-y-5 animate-in slide-in-from-top-2">
               
               {report.submittedBy && (
                  <div className="flex items-center gap-2 text-xs text-slate-500 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                      <User className="w-4 h-4 text-blue-500"/>
                      <span>Submitted by <span className="font-bold text-slate-700">{report.submittedBy}</span> ({report.submittedRole}) on {report.dateSubmitted}</span>
                  </div>
               )}

               <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                      <p className="text-xs text-slate-400 uppercase font-bold">Completion</p>
                      <div className="flex items-center gap-2 mt-2">
                         <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full" style={{width: `${report.progress}%`}}></div>
                         </div>
                         <span className="text-sm font-bold text-slate-700">{report.progress}%</span>
                      </div>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                      <p className="text-xs text-slate-400 uppercase font-bold">Total Spent</p>
                      <p className="text-xl font-bold text-slate-800 mt-1">₱{report.totalExpense.toLocaleString()}</p>
                  </div>
               </div>

               {report.expenses.length > 0 ? (
                  <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                      <div className="bg-slate-50 px-4 py-3 text-xs font-bold text-slate-600 uppercase border-b border-slate-200">Expense Breakdown</div>
                      {report.expenses.map((exp, idx) => (
                         <div key={exp.id} className="flex justify-between px-4 py-3 text-sm border-b border-slate-100 last:border-0">
                            <span className="text-slate-700">{idx+1}. {exp.description}</span>
                            <span className="font-mono font-medium text-slate-900">₱{exp.amount.toLocaleString()}</span>
                         </div>
                      ))}
                  </div>
               ) : (
                  <div className="text-center p-4 border border-dashed border-slate-300 rounded-xl text-xs text-slate-400">
                      No expenses recorded for this period.
                  </div>
               )}

               {report.proofs.length > 0 ? (
                  <div>
                      <p className="text-xs font-bold text-slate-500 uppercase mb-2">Proof of Accomplishment</p>
                      <div className="flex flex-wrap gap-2">
                         {report.proofs.map((file, i) => (
                            <div key={i} className="flex items-center gap-2 bg-white px-3 py-2.5 rounded-lg border border-slate-200 text-sm text-blue-600 hover:text-blue-800 hover:border-blue-300 cursor-pointer transition-all shadow-sm">
                               <Paperclip className="w-4 h-4"/>
                               <span className="font-medium">{file}</span>
                               <Download className="w-4 h-4 ml-1 opacity-70 group-hover:opacity-100"/>
                            </div>
                         ))}
                      </div>
                  </div>
               ) : (
                  <div className="text-center p-4 border border-dashed border-slate-300 rounded-xl text-xs text-slate-400">
                      No proof files attached.
                  </div>
               )}

               {renderChatSection(report)}

               {report.status === 'Submitted' && (
                  <div className="flex gap-3 pt-4 border-t border-slate-200">
                      <button className="w-full bg-emerald-600 text-white py-3 rounded-xl text-sm font-bold hover:bg-emerald-700 shadow-md transition-all flex items-center justify-center gap-2">
                         <CheckCircle className="w-5 h-5"/> Verify & Approve Report
                      </button>
                  </div>
               )}
            </div>
         )}
         {isExpanded && report.status === 'Locked' && (
             <div className="p-5 text-center text-slate-500 text-sm italic bg-slate-50">
                  This report is currently locked and not yet due.
             </div>
         )}
      </div>
    );
  };

  const renderRequestItem = (
      title: string, 
      type: 'Fund' | 'Extension', 
      details: any, 
      reqId: string, 
      status: string
  ) => {
      const isRejecting = activeRejectId === reqId;

      let statusBadgeClass = 'bg-slate-50 text-slate-600 border-slate-200';
      if (status === 'Pending') statusBadgeClass = 'bg-yellow-50 text-yellow-700 border-yellow-200';
      else if (status === 'Approved') statusBadgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      else if (status === 'Rejected') statusBadgeClass = 'bg-red-50 text-red-700 border-red-200';

      return (
         <div key={reqId} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm relative overflow-hidden">
            <div className="flex justify-between items-start mb-3">
               <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-lg ${type === 'Fund' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                     {type === 'Fund' ? <Banknote className="w-5 h-5"/> : <CalendarClock className="w-5 h-5"/>}
                  </div>
                  <div>
                     <h4 className="font-bold text-slate-800 text-sm">{title}</h4>
                     <p className="text-xs text-slate-500 mt-0.5">{details.subText}</p>
                  </div>
               </div>
               <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${statusBadgeClass}`}>
                  {status}
               </span>
            </div>

            <div className="bg-slate-50 rounded-lg p-3 mb-3 text-sm text-slate-700 border border-slate-100">
               <p className="mb-2"><span className="font-bold text-slate-500 text-xs uppercase block mb-1">Reason:</span> {details.reason}</p>
               
               {type === 'Fund' && details.breakdown && (
                  <div className="mt-3 pt-3 border-t border-slate-200">
                     <span className="font-bold text-slate-500 text-xs uppercase block mb-2">Utilization Breakdown:</span>
                     <ul className="space-y-1">
                        {details.breakdown.map((item: any) => (
                           <li key={item.id} className="text-xs flex justify-between items-center bg-white p-2 rounded border border-slate-100">
                              <span>{item.description}</span>
                              <span className="font-mono font-medium">₱{item.amount.toLocaleString()}</span>
                           </li>
                        ))}
                     </ul>
                  </div>
               )}
            </div>

            {status === 'Pending' && (
               <div>
                  {!isRejecting ? (
                     <div className="flex gap-2">
                        <button className="flex-1 bg-emerald-600 text-white py-2 rounded-lg text-xs font-bold hover:bg-emerald-700 flex items-center justify-center gap-1 transition-colors shadow-sm">
                           <CheckCircle className="w-4 h-4"/> Accept
                        </button>
                        <button 
                           onClick={() => setActiveRejectId(reqId)}
                           className="flex-1 bg-white border border-red-200 text-red-600 py-2 rounded-lg text-xs font-bold hover:bg-red-50 flex items-center justify-center gap-1 transition-colors"
                        >
                           <XCircle className="w-4 h-4"/> Reject
                        </button>
                     </div>
                  ) : (
                     <div className="animate-in slide-in-from-bottom-2 fade-in bg-red-50 p-3 rounded-lg border border-red-100">
                        <textarea 
                           placeholder="Enter reason for rejection..." 
                           className="w-full text-xs p-3 border border-red-200 rounded-lg mb-2 focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400 bg-white"
                           rows={2}
                           value={rejectReason}
                           onChange={(e) => setRejectReason(e.target.value)}
                        />
                        <div className="flex gap-2">
                           <button className="flex-1 bg-red-600 text-white py-2 rounded-lg text-xs font-bold hover:bg-red-700 transition-colors shadow-sm">Confirm Reject</button>
                           <button onClick={() => {setActiveRejectId(null); setRejectReason("");}} className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">Cancel</button>
                        </div>
                     </div>
                  )}
               </div>
            )}
         </div>
      );
  };

  // --- MAIN LAYOUT ---
  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl flex flex-col my-auto animate-in fade-in zoom-in-95 duration-200 max-h-[90vh]">
        
        <div className="p-6 border-b border-slate-200 flex justify-between items-start bg-white rounded-t-2xl sticky top-0 z-10">
           <div>
              <div className="flex items-center gap-2 mb-2">
                 <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border 
                    ${project.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                      project.status === 'Delayed' ? 'bg-amber-50 text-amber-700 border-amber-200' : 
                      project.status === 'Completed' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
                      'bg-slate-50 text-slate-700 border-slate-200'}`}>
                    {project.status}
                 </span>
                 <span className="text-xs text-slate-400 font-mono">ID: {project.projectId}</span>
              </div>
              <h2 className="text-2xl font-bold text-slate-900">{project.title}</h2>
           </div>
           <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600">
              <X className="w-6 h-6"/>
           </button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row bg-slate-50">
           
           {/* LEFT COLUMN */}
           <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
              
              {project.status === 'Completed' ? renderCompletedView() : (
                 <>
                    <div>
                       <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2 text-lg">
                          <FileText className="w-5 h-5 text-blue-600"/> Quarterly Reports
                       </h3>
                       <div className="space-y-4">
                          {details.reports.map(renderReportItem)}
                       </div>
                    </div>

                    {(details.extensionRequests.length > 0 || details.fundRequests.length > 0) && (
                       <div>
                          <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2 text-lg pt-6 border-t border-slate-200">
                             <ShieldAlert className="w-5 h-5 text-amber-600"/> Action Requests
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             {details.extensionRequests.map(req => renderRequestItem(
                                "Extension Request", 'Extension', 
                                { subText: `${req.currentDate} → ${req.requestedDate}`, reason: req.reason }, 
                                req.id, req.status
                             ))}
                             {details.fundRequests.map(req => renderRequestItem(
                                "Fund Request", 'Fund', 
                                { subText: `Amount: ₱${req.amount.toLocaleString()}`, reason: req.reason, breakdown: req.breakdown }, 
                                req.id, req.status
                             ))}
                          </div>
                       </div>
                    )}
                 </>
              )}
           </div>

           {/* RIGHT COLUMN */}
           <div className="lg:w-80 bg-white border-l border-slate-200 p-6 overflow-y-auto space-y-6 shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.05)]">
              
              <div className="space-y-4">
                 <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <DollarSign className="w-4 h-4"/> Financial Overview
                 </h4>
                 <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-xs text-slate-500 mb-1">Total Budget</p>
                    <p className="text-2xl font-bold text-slate-900">₱{project.budget.toLocaleString()}</p>
                 </div>
                 
                 <div className="space-y-3 pt-2">
                    <div>
                        <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-500 font-medium">Utilized</span>
                        <span className="font-bold text-blue-600">₱{totalUsed.toLocaleString()}</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(totalUsed / project.budget) * 100}%` }}></div>
                        </div>
                    </div>
                    
                    <div>
                        <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-500 font-medium">Remaining</span>
                        <span className={`font-bold ${remainingBudget === 0 ? 'text-gray-400' : 'text-emerald-600'}`}>₱{remainingBudget.toLocaleString()}</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(remainingBudget / project.budget) * 100}%` }}></div>
                        </div>
                    </div>
                 </div>
              </div>

              <div className="h-px bg-slate-100"></div>

              <div className="space-y-4">
                 <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <Users className="w-4 h-4"/> Leadership
                 </h4>
                 <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shadow-sm">
                       <User className="w-5 h-5"/>
                    </div>
                    <div>
                       <p className="text-sm font-bold text-slate-800">{project.principalInvestigator}</p>
                       <p className="text-xs text-slate-500 font-medium">Project Leader</p>
                    </div>
                 </div>
                 {project.coProponent && (
                    <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                       <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm">
                          <Users className="w-5 h-5"/>
                       </div>
                       <div>
                          <p className="text-sm font-bold text-slate-800">{project.coProponent}</p>
                          <p className="text-xs text-slate-500 font-medium">Co-Proponent</p>
                       </div>
                    </div>
                 )}
              </div>

              <div className="h-px bg-slate-100"></div>

              <div className="space-y-4">
                 <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <Calendar className="w-4 h-4"/> Timeline
                 </h4>
                 <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                    <div className="flex items-start gap-3">
                       <div className="w-2 h-2 mt-1.5 rounded-full bg-emerald-500"></div>
                       <div>
                       <p className="text-xs text-slate-500 font-medium">Start Date</p>
                       <p className="text-sm font-bold text-slate-800">{new Date(project.startDate).toLocaleDateString()}</p>
                       </div>
                    </div>
                    <div className="flex items-start gap-3">
                       <div className={`w-2 h-2 mt-1.5 rounded-full ${project.status === 'Completed' ? 'bg-blue-500' : 'bg-red-500'}`}></div>
                       <div>
                       <p className="text-xs text-slate-500 font-medium">Target End</p>
                       <p className="text-sm font-bold text-slate-800">{new Date(project.endDate).toLocaleDateString()}</p>
                       </div>
                    </div>
                 </div>
              </div>

           </div>
        </div>
      </div>
    </div>
  );
};

export default RnDProjectDetailModal;