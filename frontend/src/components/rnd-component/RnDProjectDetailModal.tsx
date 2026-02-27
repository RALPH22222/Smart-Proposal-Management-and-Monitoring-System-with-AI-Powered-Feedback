import React, { useState, useEffect } from 'react';
import {
  Calendar, User, DollarSign, X, CheckCircle, TrendingUp,
  AlertTriangle, Clock, ChevronDown, ChevronUp,
  FileText, Send, Paperclip, Download,
  Users, MessageSquare, CheckSquare, Lock, Loader2, Award
} from 'lucide-react';
import Swal from 'sweetalert2';
import { type Project } from '../../types/InterfaceProject';
import { useAuthContext } from '../../context/AuthContext';
import {
  fetchProjectDetail,
  verifyReport,
  addReportComment,
  buildDisplayReports,
  type DisplayReport,
  type ProjectDetailData,
} from '../../services/ProjectMonitoringApi';

interface RnDProjectDetailModalProps {
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
}

const RnDProjectDetailModal: React.FC<RnDProjectDetailModalProps> = ({
  project,
  isOpen,
  onClose
}) => {
  const { user } = useAuthContext();
  const [details, setDetails] = useState<ProjectDetailData | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [expandedReportId, setExpandedReportId] = useState<string | null>(null);
  const [chatInputs, setChatInputs] = useState<{[key:string]: string}>({});
  const [verifyingReportId, setVerifyingReportId] = useState<string | null>(null);

  useEffect(() => {
    if (project && isOpen && project.backendId) {
      setDetailLoading(true);
      fetchProjectDetail(project.backendId)
        .then((data) => {
          const detailData = buildDisplayReports(data, user?.id || '');
          setDetails(detailData);
        })
        .catch((err) => {
          console.error('Error loading project details:', err);
          setDetails({ reports: [], totalBudget: 0 });
        })
        .finally(() => setDetailLoading(false));
    }
  }, [project, isOpen, user?.id]);

  if (!isOpen) return null;

  if (!project || detailLoading || !details) {
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
  const totalBudget = details.totalBudget;
  const isCompleted = project.status === 'Completed';
  const totalUsed = isCompleted
    ? totalBudget
    : details.reports.reduce((acc, r) => acc + r.totalExpense, 0);
  const remainingBudget = totalBudget - totalUsed;

  const toggleReport = (id: string) => setExpandedReportId(expandedReportId === id ? null : id);

  const handleChatInput = (reportId: string, val: string) => {
    setChatInputs(prev => ({...prev, [reportId]: val}));
  };

  const handleSendMessage = async (reportId: string) => {
    const text = chatInputs[reportId];
    if (!text?.trim() || !user) return;

    // Find the backend report ID
    const report = details.reports.find(r => r.id === reportId);
    if (!report?.backendReportId) return;

    try {
      await addReportComment(report.backendReportId, user.id, text.trim());
      // Append to local state
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
                    sender: 'R&D' as const,
                    text: text.trim(),
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
    } catch (err) {
      console.error('Error sending comment:', err);
      Swal.fire('Error', 'Failed to send comment.', 'error');
    }
  };

  const handleVerifyReport = async (report: DisplayReport) => {
    if (!report.backendReportId || !user) return;

    setVerifyingReportId(report.id);
    try {
      await verifyReport(report.backendReportId, user.id);
      // Update local state
      setDetails(prev => {
        if (!prev) return null;
        return {
          ...prev,
          reports: prev.reports.map(r => {
            if (r.id === report.id) {
              return { ...r, status: 'Verified' as const };
            }
            return r;
          })
        };
      });
      Swal.fire('Verified', 'Report has been verified successfully.', 'success');
    } catch (err) {
      console.error('Error verifying report:', err);
      Swal.fire('Error', 'Failed to verify report.', 'error');
    } finally {
      setVerifyingReportId(null);
    }
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
                <p className="text-2xl font-bold text-emerald-600">{totalBudget > 0 ? `₱${totalUsed.toLocaleString()}` : 'N/A'}</p>
                {totalBudget > 0 && (
                  <>
                    <div className="w-full h-2 bg-slate-100 rounded-full mt-2 overflow-hidden">
                       <div className="h-full bg-emerald-500 w-full"></div>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 text-right">100% Utilized</p>
                  </>
                )}
             </div>
             <div>
                <p className="text-xs text-slate-500 mb-1">Duration</p>
                <p className="text-2xl font-bold text-slate-800">
                  {project.startDate && project.endDate
                    ? `${Math.round((new Date(project.endDate).getTime() - new Date(project.startDate).getTime()) / (1000 * 60 * 60 * 24 * 30))} Months`
                    : 'N/A'}
                </p>
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
             {details.reports.filter(r => r.backendReportId !== null).map((report) => (
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
  const renderChatSection = (report: DisplayReport) => {
    if (report.status === 'Verified' || report.status === 'Locked') return null;
    if (!report.backendReportId) return null;

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
                    {msg.timestamp && <span className="text-slate-400 font-normal ml-1">• {msg.timestamp}</span>}
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
  const renderReportItem = (report: DisplayReport) => {
    const isExpanded = expandedReportId === report.id;

    let statusColor = "bg-slate-100 text-slate-500 border-slate-200";
    let statusIcon = <Clock className="w-5 h-5"/>;

    if (report.status === 'Verified') {
        statusColor = "bg-emerald-100 text-emerald-700 border-emerald-200";
        statusIcon = <CheckSquare className="w-5 h-5"/>;
    } else if (report.status === 'Submitted') {
        statusColor = "bg-blue-100 text-blue-700 border-blue-200";
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

         {isExpanded && report.status !== 'Locked' && report.status !== 'Due' && (
            <div className="p-5 border-t border-slate-100 bg-slate-50 space-y-5 animate-in slide-in-from-top-2">

               {report.submittedBy && (
                  <div className="flex items-center gap-2 text-xs text-slate-500 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                      <User className="w-4 h-4 text-blue-500"/>
                      <span>Submitted by <span className="font-bold text-slate-700">{report.submittedBy}</span> on {report.dateSubmitted}</span>
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
                            <a key={i} href={file} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-white px-3 py-2.5 rounded-lg border border-slate-200 text-sm text-blue-600 hover:text-blue-800 hover:border-blue-300 cursor-pointer transition-all shadow-sm">
                               <Paperclip className="w-4 h-4"/>
                               <span className="font-medium">File {i + 1}</span>
                               <Download className="w-4 h-4 ml-1 opacity-70 group-hover:opacity-100"/>
                            </a>
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
                      <button
                        onClick={() => handleVerifyReport(report)}
                        disabled={verifyingReportId === report.id}
                        className="w-full bg-emerald-600 text-white py-3 rounded-xl text-sm font-bold hover:bg-emerald-700 shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                         {verifyingReportId === report.id ? (
                           <><Loader2 className="w-5 h-5 animate-spin"/> Verifying...</>
                         ) : (
                           <><CheckCircle className="w-5 h-5"/> Verify & Approve Report</>
                         )}
                      </button>
                  </div>
               )}
            </div>
         )}
         {isExpanded && (report.status === 'Locked' || report.status === 'Due') && (
             <div className="p-5 text-center text-slate-500 text-sm italic bg-slate-50">
                  {report.status === 'Locked'
                    ? 'This report is currently locked and not yet due.'
                    : 'This report is due. Waiting for proponent submission.'}
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
                    <p className="text-2xl font-bold text-slate-900">
                      {totalBudget > 0 ? `₱${totalBudget.toLocaleString()}` : 'N/A'}
                    </p>
                 </div>

                 {totalBudget > 0 && (
                   <div className="space-y-3 pt-2">
                      <div>
                          <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-500 font-medium">Utilized</span>
                          <span className="font-bold text-blue-600">₱{totalUsed.toLocaleString()}</span>
                          </div>
                          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full" style={{ width: `${totalBudget > 0 ? (totalUsed / totalBudget) * 100 : 0}%` }}></div>
                          </div>
                      </div>

                      <div>
                          <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-500 font-medium">Remaining</span>
                          <span className={`font-bold ${remainingBudget === 0 ? 'text-gray-400' : 'text-emerald-600'}`}>₱{remainingBudget.toLocaleString()}</span>
                          </div>
                          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${totalBudget > 0 ? (remainingBudget / totalBudget) * 100 : 0}%` }}></div>
                          </div>
                      </div>
                   </div>
                 )}
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
