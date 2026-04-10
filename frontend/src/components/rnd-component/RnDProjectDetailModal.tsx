import React, { useState, useEffect } from 'react';
import {
  Calendar, User, DollarSign, X, CheckCircle, TrendingUp,
  AlertTriangle, Clock, ChevronDown, ChevronUp,
  FileText, Paperclip, Download,
  Users, CheckSquare, Lock, Loader2, Award
} from 'lucide-react';
import Swal from 'sweetalert2';
import { openSignedUrl } from '../../utils/signed-url';
import { formatDate } from '../../utils/date-formatter';
import { type Project } from '../../types/InterfaceProject';
import { useAuthContext } from '../../context/AuthContext';
import {
  fetchProjectDetail,
  verifyReport,
  fetchFundRequests,
  reviewFundRequest,
  fetchBudgetSummary,
  generateCertificate,
  buildDisplayReports,
  type DisplayReport,
  type ProjectDetailData,
  type ApiFundRequest,
  type ApiBudgetSummary,
  extractFileInfo,
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
  const [verifyingReportId, setVerifyingReportId] = useState<string | null>(null);

  // Fund request state
  const [fundRequests, setFundRequests] = useState<ApiFundRequest[]>([]);
  const [budgetSummary, setBudgetSummary] = useState<ApiBudgetSummary | null>(null);
  const [reviewingFrId, setReviewingFrId] = useState<number | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [showReviewNoteFor, setShowReviewNoteFor] = useState<number | null>(null);

  // Certificate state
  const [issuingCertificate, setIssuingCertificate] = useState(false);

  const loadDetails = async () => {
    if (!project?.backendId) return;
    setDetailLoading(true);
    try {
      const [data, frResponse, bs] = await Promise.all([
        fetchProjectDetail(project.backendId),
        fetchFundRequests(project.backendId),
        fetchBudgetSummary(project.backendId).catch(() => null),
      ]);
      const detailData = buildDisplayReports(data, user?.id || '');
      setDetails(detailData);
      setFundRequests(frResponse.fund_requests);
      setBudgetSummary(frResponse.budget_summary || bs);
    } catch (err) {
      console.error('Error loading project details:', err);
      setDetails({ reports: [], totalBudget: 0 });
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    if (project && isOpen && project.backendId) {
      loadDetails();
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
  const totalBudget = budgetSummary?.total_budget ?? details.totalBudget;
  const isCompleted = project.status === 'Completed';
  const totalUsed = isCompleted
    ? totalBudget
    : budgetSummary?.total_approved ?? details.reports.reduce((acc, r) => acc + r.totalExpense, 0);
  const remainingBudget = budgetSummary?.remaining ?? (totalBudget - totalUsed);
  const totalPending = budgetSummary?.total_pending ?? 0;

  const toggleReport = (id: string) => setExpandedReportId(expandedReportId === id ? null : id);

  const handleVerifyReport = async (report: DisplayReport) => {
    if (!report.backendReportId || !user) return;

    setVerifyingReportId(report.id);
    try {
      await verifyReport(report.backendReportId);
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

  // --- Fund Request Review ---
  const handleReviewFundRequest = async (frId: number, status: 'approved' | 'rejected') => {
    if (!user) return;
    setReviewingFrId(frId);
    try {
      await reviewFundRequest(frId, status, reviewNote || undefined);
      Swal.fire(
        status === 'approved' ? 'Approved' : 'Rejected',
        `Fund request has been ${status}.`,
        status === 'approved' ? 'success' : 'info'
      );
      setReviewNote('');
      setShowReviewNoteFor(null);
      await loadDetails();
    } catch (err) {
      console.error('Error reviewing fund request:', err);
      Swal.fire('Error', 'Failed to review fund request.', 'error');
    } finally {
      setReviewingFrId(null);
    }
  };

  // --- Certificate ---
  const handleGenerateCertificate = async () => {
    if (!project?.backendId || !user) return;
    const result = await Swal.fire({
      title: 'Issue Certificate?',
      text: 'This will mark the project as completed and issue a certificate of completion.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Issue Certificate',
      confirmButtonColor: '#059669',
    });
    if (!result.isConfirmed) return;

    setIssuingCertificate(true);
    try {
      await generateCertificate(project.backendId);
      Swal.fire('Certificate Issued!', 'The project has been marked as completed.', 'success');
      await loadDetails();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to generate certificate.';
      Swal.fire('Error', msg, 'error');
    } finally {
      setIssuingCertificate(false);
    }
  };

  // Check if all 4 quarters are verified
  const allQuartersVerified = details?.reports
    ? details.reports.filter(r => r.status === 'Verified').length === 4
    : false;

  // Pending fund requests
  const pendingFundRequests = fundRequests.filter(fr => fr.status === 'pending');

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
                   {formatDate(project.startDate)} — {formatDate(project.endDate)}
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

  // 2. REPORT LIST ITEM
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
                         {report.proofs.map((file, i) => {
                            const info = extractFileInfo(file);
                            return (
                              <a key={i} href="#" onClick={(e) => { e.preventDefault(); openSignedUrl(file); }} className="flex items-center gap-2 bg-white px-3 py-2.5 rounded-lg border border-slate-200 text-sm text-blue-600 hover:text-blue-800 hover:border-blue-300 cursor-pointer transition-all shadow-sm" title={info.filename}>
                                 <Paperclip className="w-4 h-4 flex-shrink-0"/>
                                 <span className="flex flex-col leading-tight">
                                   {info.label && <span className="text-[10px] font-bold text-slate-400 uppercase">{info.label}</span>}
                                   <span className="font-medium truncate max-w-[200px]">{info.filename}</span>
                                 </span>
                                 <Download className="w-4 h-4 ml-1 opacity-70 flex-shrink-0"/>
                              </a>
                            );
                         })}
                      </div>
                  </div>
               ) : (
                  <div className="text-center p-4 border border-dashed border-slate-300 rounded-xl text-xs text-slate-400">
                      No proof files attached.
                  </div>
               )}

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
                    {/* Pending Fund Requests */}
                    {pendingFundRequests.length > 0 && (
                      <div className="mb-6">
                        <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2 text-lg">
                          <DollarSign className="w-5 h-5 text-amber-600" /> Pending Fund Requests
                          <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">{pendingFundRequests.length}</span>
                        </h3>
                        <div className="space-y-4">
                          {pendingFundRequests.map(fr => {
                            const totalAmount = fr.fund_request_items?.reduce((s, i) => s + i.amount, 0) || 0;
                            const quarterLabel = fr.quarterly_report.replace('_report', '').toUpperCase();
                            const requestedBy = fr.requested_by_user
                              ? `${fr.requested_by_user.first_name} ${fr.requested_by_user.last_name}`
                              : 'Unknown';
                            return (
                              <div key={fr.id} className="bg-white rounded-xl border border-amber-200 overflow-hidden shadow-sm">
                                <div className="bg-amber-50 px-5 py-3 flex justify-between items-center border-b border-amber-200">
                                  <div>
                                    <span className="font-bold text-amber-800">{quarterLabel} Fund Request</span>
                                    <p className="text-xs text-amber-600 mt-0.5">By {requestedBy} &middot; {formatDate(fr.created_at)}</p>
                                  </div>
                                  <span className="text-lg font-bold text-amber-800">₱{totalAmount.toLocaleString()}</span>
                                </div>
                                <div className="p-4 space-y-2">
                                  {fr.fund_request_items?.map(item => (
                                    <div key={item.id} className="flex justify-between text-sm border-b border-slate-100 last:border-0 pb-1">
                                      <span className="text-slate-700">{item.item_name} <span className="text-xs text-slate-400 uppercase">({item.category})</span></span>
                                      <span className="font-mono font-medium text-slate-900">₱{item.amount.toLocaleString()}</span>
                                    </div>
                                  ))}
                                </div>
                                {showReviewNoteFor === fr.id && (
                                  <div className="px-4 pb-2">
                                    <textarea
                                      value={reviewNote}
                                      onChange={(e) => setReviewNote(e.target.value)}
                                      placeholder="Add a note (optional)..."
                                      className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 outline-none resize-none h-16"
                                    />
                                  </div>
                                )}
                                <div className="px-4 pb-4 flex gap-3">
                                  {showReviewNoteFor !== fr.id ? (
                                    <>
                                      <button
                                        onClick={() => handleReviewFundRequest(fr.id, 'approved')}
                                        disabled={reviewingFrId === fr.id}
                                        className="flex-1 bg-emerald-600 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                      >
                                        {reviewingFrId === fr.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                        Approve
                                      </button>
                                      <button
                                        onClick={() => setShowReviewNoteFor(fr.id)}
                                        className="flex-1 bg-red-50 text-red-600 border border-red-200 py-2.5 rounded-xl text-sm font-bold hover:bg-red-100 transition-all flex items-center justify-center gap-2"
                                      >
                                        <AlertTriangle className="w-4 h-4" />
                                        Reject
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      <button
                                        onClick={() => handleReviewFundRequest(fr.id, 'rejected')}
                                        disabled={reviewingFrId === fr.id}
                                        className="flex-1 bg-red-600 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-red-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                      >
                                        {reviewingFrId === fr.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Reject'}
                                      </button>
                                      <button
                                        onClick={() => { setShowReviewNoteFor(null); setReviewNote(''); }}
                                        className="flex-1 bg-slate-100 text-slate-600 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-200 transition-all"
                                      >
                                        Cancel
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Quarterly Reports */}
                    <div>
                       <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2 text-lg">
                          <FileText className="w-5 h-5 text-blue-600"/> Quarterly Reports
                       </h3>
                       <div className="space-y-4">
                          {details.reports.map(renderReportItem)}
                       </div>
                    </div>

                    {/* Certificate Generation Button */}
                    {allQuartersVerified && (
                      <div className="mt-6 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-xl border border-emerald-200 p-6 text-center">
                        <Award className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
                        <h3 className="text-lg font-bold text-emerald-800 mb-2">All Quarters Verified!</h3>
                        <p className="text-sm text-emerald-600 mb-4">All 4 quarterly reports have been verified. You can now issue the certificate of completion.</p>
                        <button
                          onClick={handleGenerateCertificate}
                          disabled={issuingCertificate}
                          className="px-8 py-3 bg-emerald-600 text-white font-bold rounded-xl shadow-lg hover:bg-emerald-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 mx-auto"
                        >
                          {issuingCertificate ? <><Loader2 className="w-5 h-5 animate-spin" /> Issuing...</> : <><Award className="w-5 h-5" /> Issue Certificate of Completion</>}
                        </button>
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

                      {totalPending > 0 && (
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-slate-500 font-medium">Pending</span>
                            <span className="font-bold text-amber-600">₱{totalPending.toLocaleString()}</span>
                          </div>
                          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-400 rounded-full" style={{ width: `${totalBudget > 0 ? (totalPending / totalBudget) * 100 : 0}%` }}></div>
                          </div>
                        </div>
                      )}
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
                       <p className="text-sm font-bold text-slate-800">{formatDate(project.startDate)}</p>
                       </div>
                    </div>
                    <div className="flex items-start gap-3">
                       <div className={`w-2 h-2 mt-1.5 rounded-full ${project.status === 'Completed' ? 'bg-blue-500' : 'bg-red-500'}`}></div>
                       <div>
                       <p className="text-xs text-slate-500 font-medium">Target End</p>
                       <p className="text-sm font-bold text-slate-800">{formatDate(project.endDate)}</p>
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
