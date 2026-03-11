import React, { useState, useEffect, useCallback } from 'react';
import {
  FaChartLine
} from 'react-icons/fa';
import {
  Search, Target, Clock, CheckCircle2, Play, Send,
  FileText, Calendar, AlertTriangle, UploadCloud,
  X, Banknote, ArrowLeft, CalendarClock, History, PieChart,
  Plus, Trash2, MessageSquare, User, ShieldAlert, Award,
  Users, CalendarCheck, ChevronLeft, ChevronRight, UserCheck,
  CornerDownRight, ChevronUp, ChevronDown, DollarSign, Lock, Loader2
} from 'lucide-react';
import Swal from 'sweetalert2';
import TeamMembersSection from '../../../components/proponent-component/TeamMembersSection';
import { useAuthContext } from '../../../context/AuthContext';
import {
  fetchFundedProjects,
  fetchProjectDetail,
  fetchFundRequests,
  fetchBudgetSummary,
  createFundRequest,
  submitQuarterlyReport,
  addReportComment,
  transformToProject,
  buildDisplayReports,
  uploadReportFile,
  validateReportFile,
  REPORT_ALLOWED_EXTENSIONS,
  REPORT_MAX_FILE_SIZE,
  type ApiFundedProject,
  type ApiFundRequest,
  type ApiBudgetSummary,
  type ApiProjectDetail,
  type DisplayReport,
} from '../../../services/ProjectMonitoringApi';
import { type Project } from '../../../types/InterfaceProject';

// --- Types ---
type ReportStatus = 'fund_request' | 'due' | 'submitted' | 'approved' | 'overdue' | 'locked';

interface FundRequestItem {
  id: string;
  description: string;
  amount: number;
  category: 'ps' | 'mooe' | 'co';
}

// Unified quarter data combining display report + fund request info
interface QuarterData {
  quarter: string; // q1_report, q2_report, etc.
  quarterLabel: string; // Q1, Q2, etc.
  dueDate: string;
  startDate: string;
  status: ReportStatus;
  progressPercentage: number;
  fundRequest: ApiFundRequest | null;
  backendReportId: number | null;
  proofFiles: string[];
  submittedBy?: string;
  dateSubmitted?: string;
  expenses: { id: string; description: string; amount: number }[];
  messages: { id: string; sender: 'R&D' | 'Proponent'; text: string; timestamp: string }[];
}

interface ProjectData {
  project: Project;
  backendProject: ApiFundedProject;
  quarters: QuarterData[];
  totalBudget: number;
  budgetSummary: ApiBudgetSummary | null;
}

const ALL_QUARTERS = ['q1_report', 'q2_report', 'q3_report', 'q4_report'];
const QUARTER_LABELS: Record<string, string> = {
  q1_report: 'Q1', q2_report: 'Q2', q3_report: 'Q3', q4_report: 'Q4',
};

const MonitoringPage: React.FC = () => {
  const { user } = useAuthContext();

  // --- State ---
  const [projects, setProjects] = useState<Project[]>([]);
  const [backendProjects, setBackendProjects] = useState<ApiFundedProject[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [showMobileDetail, setShowMobileDetail] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);

  // Quarter navigation
  const [currentReportIndex, setCurrentReportIndex] = useState(0);

  // Project detail data
  const [projectDetail, setProjectDetail] = useState<ApiProjectDetail | null>(null);
  const [fundRequests, setFundRequests] = useState<ApiFundRequest[]>([]);
  const [budgetSummary, setBudgetSummary] = useState<ApiBudgetSummary | null>(null);
  const [quarters, setQuarters] = useState<QuarterData[]>([]);
  const [totalBudget, setTotalBudget] = useState(0);

  // Fund request form
  const [breakdownItems, setBreakdownItems] = useState<FundRequestItem[]>([]);
  const [submittingFundRequest, setSubmittingFundRequest] = useState(false);

  // Report form
  const [submittingReport, setSubmittingReport] = useState(false);
  const [reportFile, setReportFile] = useState<File | null>(null);
  const [terminalReportFile, setTerminalReportFile] = useState<File | null>(null);
  const [receiptFiles, setReceiptFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);

  // Extension & additional fund modals
  const [isExtensionModalOpen, setIsExtensionModalOpen] = useState(false);
  const [extensionReason, setExtensionReason] = useState('');
  const [extensionDate, setExtensionDate] = useState('');
  const [extensionType, setExtensionType] = useState<'time_only' | 'with_funding'>('time_only');

  // Chat
  const [replyText, setReplyText] = useState('');

  // --- Load Projects ---
  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const data = await fetchFundedProjects('proponent');
      setBackendProjects(data);
      const mapped = data.map(transformToProject);
      setProjects(mapped);
      if (mapped.length > 0 && !activeProjectId) {
        setActiveProjectId(mapped[0].id);
      }
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setLoading(false);
    }
  };

  // --- Load Project Detail when active project changes ---
  const activeProject = projects.find(p => p.id === activeProjectId);
  const activeBackend = backendProjects.find(p => String(p.id) === activeProjectId);

  const loadProjectDetail = useCallback(async () => {
    if (!activeBackend) return;
    try {
      setDetailLoading(true);
      const [detail, frResponse, bs] = await Promise.all([
        fetchProjectDetail(activeBackend.id),
        fetchFundRequests(activeBackend.id),
        fetchBudgetSummary(activeBackend.id).catch(() => null),
      ]);
      setProjectDetail(detail);
      setFundRequests(frResponse.fund_requests);
      setBudgetSummary(frResponse.budget_summary || bs);

      // Build quarters from detail + fund requests
      const displayData = buildDisplayReports(detail, user?.id || '');
      setTotalBudget(displayData.totalBudget);

      const frByQuarter = new Map<string, ApiFundRequest>();
      for (const fr of frResponse.fund_requests) {
        frByQuarter.set(fr.quarterly_report, fr);
      }

      const builtQuarters: QuarterData[] = displayData.reports.map((dr, i) => {
        const qKey = ALL_QUARTERS[i];
        const fr = frByQuarter.get(qKey) || null;

        // Determine status considering fund request flow
        let status: ReportStatus;
        if (dr.status === 'Locked') {
          status = 'locked';
        } else if (dr.status === 'Verified') {
          status = 'approved';
        } else if (dr.status === 'Submitted') {
          status = 'submitted';
        } else if (dr.status === 'Overdue') {
          // Even if overdue, check if fund request exists
          if (!fr) status = 'fund_request';
          else if (fr.status === 'approved') status = 'overdue';
          else if (fr.status === 'pending') status = 'due'; // waiting for approval
          else if (fr.status === 'rejected') status = 'fund_request'; // need to re-request
          else status = 'overdue';
        } else {
          // "Due" status
          if (!fr) status = 'fund_request';
          else if (fr.status === 'approved') status = 'due';
          else if (fr.status === 'pending') status = 'due'; // waiting for approval, show as due
          else if (fr.status === 'rejected') status = 'fund_request'; // re-request
          else status = 'fund_request';
        }

        // Calculate start date
        const startDate = detail.proposal?.plan_start_date
          ? new Date(detail.proposal.plan_start_date)
          : new Date(detail.funded_date || detail.created_at);
        const qStartDate = new Date(startDate);
        qStartDate.setMonth(qStartDate.getMonth() + i * 3);

        return {
          quarter: qKey,
          quarterLabel: QUARTER_LABELS[qKey],
          dueDate: dr.dueDate,
          startDate: qStartDate.toISOString().split('T')[0],
          status,
          progressPercentage: dr.progress,
          fundRequest: fr,
          backendReportId: dr.backendReportId,
          proofFiles: dr.proofs,
          submittedBy: dr.submittedBy,
          dateSubmitted: dr.dateSubmitted,
          expenses: dr.expenses,
          messages: dr.messages,
        };
      });

      setQuarters(builtQuarters);

      // Auto-navigate to the first actionable quarter
      const firstActionable = builtQuarters.findIndex(
        q => q.status === 'fund_request' || q.status === 'due' || q.status === 'overdue' || q.status === 'submitted'
      );
      setCurrentReportIndex(firstActionable >= 0 ? firstActionable : 0);
    } catch (error) {
      console.error('Error loading project detail:', error);
    } finally {
      setDetailLoading(false);
    }
  }, [activeBackend, user?.id]);

  useEffect(() => {
    if (activeBackend) {
      loadProjectDetail();
    }
  }, [activeBackend?.id]);

  // --- Helpers ---
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount);

  const currentReport = quarters[currentReportIndex] || null;
  const isLocked = currentReport?.status === 'locked';
  const isFundRequestNeeded = currentReport?.status === 'fund_request';
  const isFundRequestPending = currentReport?.fundRequest?.status === 'pending';
  const isFundRequestRejected = currentReport?.fundRequest?.status === 'rejected';
  const isEditable = currentReport?.status === 'due' || currentReport?.status === 'overdue';
  const isOverdue = currentReport?.status === 'overdue';
  const prevReportProgress = currentReportIndex > 0 ? (quarters[currentReportIndex - 1]?.progressPercentage || 0) : 0;
  const [localProgress, setLocalProgress] = useState(0);

  // Sync local progress when quarter changes
  useEffect(() => {
    if (currentReport) {
      setLocalProgress(Math.max(currentReport.progressPercentage, prevReportProgress));
    }
  }, [currentReportIndex, currentReport?.progressPercentage, prevReportProgress]);

  // Budget calculations from budget summary
  const totalApproved = budgetSummary?.total_approved || 0;
  const totalPending = budgetSummary?.total_pending || 0;
  const remaining = budgetSummary?.remaining || (totalBudget - totalApproved);
  const budgetProgress = totalBudget > 0 ? (totalApproved / totalBudget) * 100 : 0;

  // --- Handlers ---
  const handlePrevReport = () => {
    if (currentReportIndex > 0) setCurrentReportIndex(prev => prev - 1);
  };
  const handleNextReport = () => {
    if (currentReportIndex < quarters.length - 1) setCurrentReportIndex(prev => prev + 1);
  };

  const handleProgressStep = (direction: 'up' | 'down') => {
    let newValue = localProgress;
    if (direction === 'up') {
      newValue = Math.min(100, localProgress + 5);
    } else {
      newValue = Math.max(prevReportProgress, localProgress - 5);
    }
    setLocalProgress(newValue);
  };

  // --- Fund Request Submission ---
  const handleSubmitFundRequest = async () => {
    if (!activeBackend || !currentReport || !user) return;
    if (breakdownItems.length === 0) return;

    const hasEmpty = breakdownItems.some(item => !item.description.trim() || !item.amount);
    if (hasEmpty) {
      Swal.fire('Incomplete', 'Please fill in all item descriptions and amounts.', 'warning');
      return;
    }

    const totalAmount = breakdownItems.reduce((sum, item) => sum + item.amount, 0);
    const confirmation = await Swal.fire({
      title: 'Submit Fund Request?',
      html: `You are requesting <strong>₱${totalAmount.toLocaleString()}</strong> across <strong>${breakdownItems.length}</strong> item(s) for <strong>${currentReport.quarter.replace('_', ' ').toUpperCase()}</strong>.<br/><br/>This will be sent to R&D for review.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Submit',
      cancelButtonText: 'Cancel',
    });
    if (!confirmation.isConfirmed) return;

    try {
      setSubmittingFundRequest(true);
      const items = breakdownItems.map(item => ({
        item_name: item.description,
        amount: item.amount,
        category: item.category,
      }));

      await createFundRequest(activeBackend.id, currentReport.quarter, items);
      setBreakdownItems([]);
      Swal.fire('Submitted', 'Fund request submitted for R&D review!', 'success');
      await loadProjectDetail(); // Refresh
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'Failed to submit fund request.';
      Swal.fire('Error', msg, 'error');
    } finally {
      setSubmittingFundRequest(false);
    }
  };

  // --- Report Submission ---
  // --- File Handlers ---
  const handleFileSelect = (file: File | null, setter: (f: File | null) => void) => {
    if (!file) return;
    const error = validateReportFile(file);
    if (error) {
      Swal.fire('File Error', error, 'error');
      return;
    }
    setter(file);
  };

  const handleReceiptFiles = (files: FileList | null) => {
    if (!files) return;
    const newFiles: File[] = [];
    for (const file of Array.from(files)) {
      const error = validateReportFile(file);
      if (error) {
        Swal.fire('File Error', error, 'error');
        return;
      }
      newFiles.push(file);
    }
    setReceiptFiles(prev => [...prev, ...newFiles]);
  };

  const removeReceiptFile = (index: number) => {
    setReceiptFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Reset file state when quarter changes
  useEffect(() => {
    setReportFile(null);
    setTerminalReportFile(null);
    setReceiptFiles([]);
    setUploadProgress(null);
  }, [currentReportIndex]);

  const handleSubmitReport = async () => {
    if (!activeBackend || !currentReport || !user) return;

    if (localProgress <= prevReportProgress && localProgress !== 100) {
      Swal.fire('Update Progress', 'Please update the progress percentage.', 'warning');
      return;
    }

    try {
      setSubmittingReport(true);

      // Upload files to S3 first
      const fileUrls: string[] = [];

      if (reportFile) {
        setUploadProgress('Uploading quarterly report...');
        const url = await uploadReportFile(reportFile);
        fileUrls.push(url);
      }

      if (terminalReportFile) {
        setUploadProgress('Uploading terminal report...');
        const url = await uploadReportFile(terminalReportFile);
        fileUrls.push(url);
      }

      for (let i = 0; i < receiptFiles.length; i++) {
        setUploadProgress(`Uploading receipt ${i + 1} of ${receiptFiles.length}...`);
        const url = await uploadReportFile(receiptFiles[i]);
        fileUrls.push(url);
      }

      setUploadProgress('Submitting report...');
      await submitQuarterlyReport(
        activeBackend.id,
        currentReport.quarter,
        localProgress,
        undefined,
        fileUrls.length > 0 ? fileUrls : undefined
      );

      // Reset file state
      setReportFile(null);
      setTerminalReportFile(null);
      setReceiptFiles([]);
      setUploadProgress(null);

      Swal.fire('Submitted', 'Report submitted for verification!', 'success');
      await loadProjectDetail();
    } catch (error: any) {
      const msg = error?.message || error?.response?.data?.message || 'Failed to submit report.';
      Swal.fire('Error', msg, 'error');
    } finally {
      setSubmittingReport(false);
      setUploadProgress(null);
    }
  };

  // --- Chat ---
  const postReply = async () => {
    if (!replyText.trim() || !currentReport?.backendReportId || !user) return;
    try {
      await addReportComment(currentReport.backendReportId, replyText.trim());
      setReplyText('');
      await loadProjectDetail();
    } catch (error) {
      console.error('Error posting reply:', error);
    }
  };

  // --- Breakdown item handlers ---
  const addBreakdownItem = () => {
    setBreakdownItems(prev => [...prev, { id: Date.now().toString(), description: '', amount: 0, category: 'mooe' }]);
  };
  const updateBreakdownItem = (itemId: string, field: keyof FundRequestItem, value: any) => {
    setBreakdownItems(prev => prev.map(item => item.id === itemId ? { ...item, [field]: value } : item));
  };
  const removeBreakdownItem = (itemId: string) => {
    setBreakdownItems(prev => prev.filter(item => item.id !== itemId));
  };

  // --- Filtered projects ---
  const filteredProjects = projects.filter(p =>
    (filterStatus === 'all' || p.status.toLowerCase() === filterStatus) &&
    p.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- Chat Section Renderer ---
  const renderChatSection = () => {
    if (!currentReport) return null;
    if (currentReport.status === 'locked' && currentReport.messages.length === 0) return null;

    return (
      <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden shadow-inner mt-6">
        <div className="bg-slate-100 px-4 py-3 flex items-center gap-2 border-b border-slate-200">
          <MessageSquare className="w-4 h-4 text-slate-500" />
          <h5 className="text-xs font-bold text-slate-700 uppercase">Feedback & Communication</h5>
        </div>

        <div className="p-4 bg-slate-50/50 max-h-64 overflow-y-auto space-y-4">
          {currentReport.messages.length === 0 && (
            <p className="text-center text-xs text-slate-400 italic py-2">No messages yet.</p>
          )}
          {currentReport.messages.map(msg => {
            const isRD = msg.sender === 'R&D';
            return (
              <div key={msg.id} className={`flex gap-3 ${isRD ? 'justify-start' : 'justify-end'}`}>
                {isRD && (
                  <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 border border-amber-200 shadow-sm">
                    <User className="w-4 h-4 text-amber-700" />
                  </div>
                )}
                <div className="max-w-[85%]">
                  <div className={`flex items-center gap-2 mb-1 ${isRD ? 'justify-start' : 'justify-end'}`}>
                    <span className={`text-[10px] font-bold ${isRD ? 'text-amber-700' : 'text-blue-700'}`}>
                      {isRD ? 'R&D Officer' : 'You (Proponent)'}
                    </span>
                    {msg.timestamp && <span className="text-[10px] text-gray-400">{msg.timestamp}</span>}
                  </div>
                  <div className={`p-3 rounded-2xl text-xs leading-relaxed shadow-sm ${
                    isRD
                      ? 'bg-white border border-amber-200 text-slate-700 rounded-tl-none'
                      : 'bg-blue-600 text-white rounded-tr-none'
                  }`}>
                    <p>{msg.text}</p>
                  </div>
                </div>
                {!isRD && (
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 border border-blue-200 shadow-sm">
                    <UserCheck className="w-4 h-4 text-blue-700" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {(isEditable || currentReport.status === 'submitted') && currentReport.backendReportId && (
          <div className="p-3 bg-white border-t border-slate-200 flex gap-2 items-center">
            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-400 flex-shrink-0">
              <CornerDownRight className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Type your reply to R&D..."
              className="flex-1 text-xs p-2.5 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:border-blue-400 focus:ring-1 focus:ring-blue-400 outline-none transition-all"
              onKeyDown={(e) => e.key === 'Enter' && postReply()}
            />
            <button
              onClick={postReply}
              disabled={!replyText.trim()}
              className="p-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    );
  };

  // --- Loading ---
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 font-sans bg-gray-50 min-h-screen">

      {/* --- HEADER --- */}
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-gradient-to-r from-[#C8102E] to-[#E03A52] rounded-xl shadow-lg">
            <FaChartLine className="text-white text-xl lg:text-2xl" />
          </div>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">Project Monitoring</h1>
            <p className="text-gray-600 text-sm">Quarterly fund requests and progress tracking</p>
          </div>
        </div>

        {/* --- STATS CARDS --- */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex justify-between items-center shadow-sm hover:shadow-md transition-all">
            <div><p className="text-xs font-bold text-gray-500">Active Projects</p><p className="text-3xl font-bold text-emerald-600">{projects.filter(p => p.status === 'Active').length}</p></div>
            <Play className="w-8 h-8 text-emerald-500" />
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex justify-between items-center shadow-sm hover:shadow-md transition-all">
            <div><p className="text-xs font-bold text-gray-500">Delayed</p><p className="text-3xl font-bold text-amber-600">{projects.filter(p => p.status === 'Delayed').length}</p></div>
            <AlertTriangle className="w-8 h-8 text-amber-500" />
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex justify-between items-center shadow-sm hover:shadow-md transition-all">
            <div><p className="text-xs font-bold text-gray-500">Completed</p><p className="text-3xl font-bold text-blue-600">{projects.filter(p => p.status === 'Completed').length}</p></div>
            <CheckCircle2 className="w-8 h-8 text-blue-500" />
          </div>
        </div>
      </header>

      {/* --- MAIN CONTENT --- */}
      <section className="flex flex-col lg:flex-row gap-6">

        {/* --- LEFT SIDEBAR (Projects List) --- */}
        <div className="w-full lg:w-1/3 bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col h-auto lg:h-[calc(100vh-140px)]">
          <div className="p-5 border-b border-gray-100">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Target className="w-4 h-4 text-[#C8102E]" /> Select Project</h3>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input type="text" placeholder="Find project..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20" />
            </div>
            <div className="flex gap-2 flex-wrap">
              {['all', 'active', 'delayed', 'completed'].map((status) => (
                <button key={status} onClick={() => setFilterStatus(status)} className={`px-3 py-1 rounded-full text-xs font-bold capitalize transition-colors ${filterStatus === status ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>{status}</button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {filteredProjects.length === 0 && (
              <p className="text-center text-sm text-gray-400 py-8">No projects found.</p>
            )}
            {filteredProjects.map((project) => (
              <button key={project.id} onClick={() => { setActiveProjectId(project.id); setShowMobileDetail(true); }} className={`w-full text-left p-4 rounded-xl border transition-all flex items-center justify-between group ${activeProjectId === project.id ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-200' : 'bg-white border-transparent hover:bg-gray-50 hover:border-gray-200'}`}>
                <div className="min-w-0">
                  <h4 className={`text-sm font-bold line-clamp-1 ${activeProjectId === project.id ? 'text-blue-800' : 'text-gray-700'}`}>{project.title}</h4>
                  <p className="text-xs text-gray-400 mt-1">{project.department}</p>
                </div>
                {project.status === 'Delayed' && <AlertTriangle className="w-4 h-4 text-amber-500" />}
                {project.status === 'Active' && <Play className="w-4 h-4 text-emerald-500" />}
                {project.status === 'Completed' && <CheckCircle2 className="w-4 h-4 text-blue-500" />}
              </button>
            ))}
          </div>
        </div>

        {/* --- RIGHT PANEL (Detail View) --- */}
        <div className={`w-full lg:w-2/3 flex flex-col ${showMobileDetail ? 'flex' : 'hidden lg:flex'}`}>
          <div className="lg:hidden mb-4">
            <button onClick={() => setShowMobileDetail(false)} className="flex items-center gap-2 text-gray-600 font-semibold hover:text-[#C8102E]"><ArrowLeft className="w-5 h-5" /> Back to Projects</button>
          </div>

          {detailLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
          ) : activeProject && quarters.length > 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6 lg:p-8 flex-1 flex flex-col">

              {/* --- COMPLETED PROJECT --- */}
              {activeProject.status === 'Completed' ? (
                <div className="mb-8 relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-900 via-indigo-900 to-blue-800 text-white p-6 sm:p-8 text-center shadow-xl">
                  <Award className="absolute top-0 right-0 w-64 h-64 text-white opacity-5 transform translate-x-10 -translate-y-10 rotate-12" />
                  <div className="relative z-10">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-yellow-400 text-yellow-900 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-yellow-500/20">
                      <Award className="w-8 h-8 sm:w-10 sm:h-10" />
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold mb-2 tracking-tight">Congratulations!</h1>
                    <p className="text-blue-100 text-base sm:text-lg mb-8">Project Successfully Completed & Verified</p>
                    <h2 className="text-xl sm:text-2xl font-bold text-white mb-6 border-b border-blue-700 pb-4 inline-block px-8">{activeProject.title}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 text-left max-w-2xl mx-auto mb-8">
                      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                        <div className="flex items-center gap-2 mb-2 text-blue-200 text-xs font-bold uppercase"><Users className="w-4 h-4" /> Project Leader</div>
                        <p className="font-semibold text-white">{activeProject.principalInvestigator}</p>
                      </div>
                      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                        <div className="flex items-center gap-2 mb-2 text-blue-200 text-xs font-bold uppercase"><Banknote className="w-4 h-4" /> Total Budget</div>
                        <p className="font-semibold text-white text-xl">{formatCurrency(totalBudget)}</p>
                      </div>
                    </div>
                    <div className="inline-flex items-center gap-3 bg-blue-950/50 rounded-full px-6 py-2 border border-blue-500/30">
                      <CalendarCheck className="w-5 h-5 text-yellow-400" />
                      <span className="font-medium text-blue-100 text-sm">
                        {new Date(activeProject.startDate).toLocaleDateString()} to {new Date(activeProject.endDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                /* --- ACTIVE/DELAYED HEADER --- */
                <div className="mb-8">
                  <div className="flex flex-col sm:flex-row justify-between items-start mb-4 gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${activeProject.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                          {activeProject.status}
                        </span>
                      </div>
                      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">{activeProject.title}</h2>
                      <div className="flex gap-4 mt-2 text-sm text-gray-500">
                        <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> Ends: {new Date(activeProject.endDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsExtensionModalOpen(true)}
                      className="flex p-2 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100 transition-colors"
                      title="Request Extension"
                    >
                      <CalendarClock className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Budget Overview */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 relative overflow-hidden">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-2 relative z-10">
                      <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Total Budget</p>
                        <p className="text-xl font-bold text-slate-800">{formatCurrency(totalBudget)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs font-bold text-blue-600 uppercase tracking-wide">Approved Funds</p>
                        <p className="text-xl font-bold text-blue-700">{formatCurrency(totalApproved)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-emerald-600 uppercase tracking-wide">Remaining</p>
                        <p className="text-2xl font-black text-emerald-700">{formatCurrency(remaining)}</p>
                      </div>
                    </div>
                    <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden mb-1">
                      <div className={`h-full transition-all duration-1000 ${budgetProgress > 90 ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(budgetProgress, 100)}%` }}></div>
                    </div>
                    <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase">
                      <span>0%</span>
                      <span>{budgetProgress.toFixed(1)}% Allocated</span>
                    </div>
                    {totalPending > 0 && (
                      <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {formatCurrency(totalPending)} pending approval
                      </p>
                    )}
                    <PieChart className="absolute -right-6 -bottom-6 w-32 h-32 text-slate-200 opacity-50 z-0" />
                  </div>
                </div>
              )}

              {/* --- TEAM MEMBERS --- */}
              {activeBackend && (
                <div className="mb-6">
                  <TeamMembersSection fundedProjectId={activeBackend.id} isProjectLead={true} />
                </div>
              )}

              {/* --- CAROUSEL REPORTS VIEW --- */}
              {currentReport && (
                <div className="flex-1 flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2"><History className="w-5 h-5 text-gray-500" /> Quarterly Reports</h3>
                    <div className="flex items-center bg-gray-100 rounded-lg p-1 gap-1">
                      <button onClick={handlePrevReport} disabled={currentReportIndex === 0} className="p-1 rounded-md hover:bg-white hover:shadow-sm disabled:opacity-30 transition-all"><ChevronLeft className="w-5 h-5 text-gray-600" /></button>
                      <span className="text-xs font-bold text-gray-600 px-2 min-w-[60px] text-center">{currentReport.quarterLabel}</span>
                      <button onClick={handleNextReport} disabled={currentReportIndex === quarters.length - 1} className="p-1 rounded-md hover:bg-white hover:shadow-sm disabled:opacity-30 transition-all"><ChevronRight className="w-5 h-5 text-gray-600" /></button>
                    </div>
                  </div>

                  <div className={`relative rounded-2xl border transition-all ${
                    isLocked ? 'bg-gray-50 border-gray-300 p-4 sm:p-6' :
                    isFundRequestNeeded ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-100 p-4 sm:p-6' :
                    isEditable ? 'bg-white shadow-lg border-blue-200 ring-1 ring-blue-100 p-4 sm:p-6' :
                    'bg-white border-gray-200 p-4 sm:p-6'
                  }`}>
                    {/* Status Badges */}
                    <div className="absolute top-4 right-4 flex gap-2">
                      {isLocked && <span className="bg-gray-100 text-gray-600 text-[10px] font-bold px-2 py-1 rounded uppercase flex items-center gap-1"><Lock className="w-3 h-3" /> Locked</span>}
                      {isFundRequestNeeded && <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-1 rounded uppercase flex items-center gap-1"><DollarSign className="w-3 h-3" /> Fund Request</span>}
                      {isFundRequestPending && <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-1 rounded uppercase flex items-center gap-1"><Clock className="w-3 h-3" /> Awaiting R&D Approval</span>}
                      {isOverdue && <span className="bg-red-100 text-red-600 text-[10px] font-bold px-2 py-1 rounded uppercase">Overdue</span>}
                      {currentReport.status === 'submitted' && <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-1 rounded uppercase flex items-center gap-1"><FileText className="w-3 h-3" /> Submitted</span>}
                      {currentReport.status === 'approved' && <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-1 rounded uppercase flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Verified</span>}
                    </div>

                    <div className="mb-6 pr-20">
                      <h4 className="font-bold text-gray-800 text-xl mb-1">{currentReport.quarterLabel} Report</h4>
                      <p className="text-xs text-gray-500 flex items-center gap-1"><Clock className="w-3 h-3" /> Due: {currentReport.dueDate}</p>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-1"><Calendar className="w-3 h-3" /> Quarter: {currentReport.startDate} - {currentReport.dueDate}</p>
                    </div>

                    {/* LOCKED STATE */}
                    {isLocked && (
                      <div className="text-center py-8">
                        <Lock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h4 className="text-lg font-bold text-gray-700 mb-2">Quarter Locked</h4>
                        <p className="text-gray-500 mb-4">Complete the previous quarter first to unlock this one.</p>
                      </div>
                    )}

                    {/* FUND REQUEST PENDING - show pending status */}
                    {isFundRequestPending && currentReport.fundRequest && (
                      <div className="border border-amber-200 rounded-xl p-5 bg-amber-50 mt-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Clock className="w-5 h-5 text-amber-600" />
                          <h4 className="font-bold text-amber-800">Fund Request Pending R&D Review</h4>
                        </div>
                        <p className="text-sm text-amber-600 mb-4">
                          Your fund request has been submitted. Waiting for R&D to approve it before you can submit a report.
                        </p>
                        <div className="space-y-2">
                          {currentReport.fundRequest.fund_request_items?.map((item, i) => (
                            <div key={item.id} className="flex justify-between text-sm bg-white border border-amber-200 rounded-lg px-3 py-2">
                              <span className="text-gray-700">{item.item_name} <span className="text-xs text-gray-400 uppercase">({item.category})</span></span>
                              <span className="font-mono font-medium">{formatCurrency(item.amount)}</span>
                            </div>
                          ))}
                        </div>
                        <div className="mt-3 text-right text-sm font-bold text-amber-700">
                          Total: {formatCurrency(currentReport.fundRequest.fund_request_items?.reduce((s, i) => s + i.amount, 0) || 0)}
                        </div>
                      </div>
                    )}

                    {/* FUND REQUEST REJECTED - show rejection + allow re-request */}
                    {isFundRequestRejected && currentReport.fundRequest && (
                      <div className="border border-red-200 rounded-xl p-4 bg-red-50 mt-4 mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle className="w-5 h-5 text-red-600" />
                          <h4 className="font-bold text-red-800">Fund Request Rejected</h4>
                        </div>
                        {currentReport.fundRequest.review_note && (
                          <p className="text-sm text-red-700 mb-2">Reason: {currentReport.fundRequest.review_note}</p>
                        )}
                        <p className="text-sm text-red-600">Please submit a new fund request below.</p>
                      </div>
                    )}

                    {/* FUND REQUEST FORM STATE */}
                    {(isFundRequestNeeded || isFundRequestRejected) && !isFundRequestPending && (
                      <div className="border border-blue-200 rounded-xl p-5 bg-blue-50 mt-4">
                        <div className="flex items-center gap-2 mb-3">
                          <DollarSign className="w-5 h-5 text-blue-600" />
                          <h4 className="font-bold text-blue-800">Request Quarter Funds</h4>
                        </div>
                        <p className="text-sm text-blue-600 mb-4">
                          Before starting this quarter, request funds from the available budget.
                          {remaining > 0 && <span className="font-bold"> Available: {formatCurrency(remaining)}</span>}
                        </p>

                        <div className="space-y-3">
                          <div className="border border-gray-200 rounded-xl overflow-hidden">
                            <div className="bg-gray-50 px-4 py-3 flex justify-between items-center border-b border-gray-200">
                              <span className="text-xs font-bold text-gray-600 uppercase">Utilization Breakdown</span>
                              <button onClick={addBreakdownItem} className="text-xs flex items-center gap-1 text-blue-600 font-bold hover:underline">
                                <Plus className="w-3 h-3" /> Add Item
                              </button>
                            </div>
                            <div className="p-4 space-y-3 bg-white">
                              {breakdownItems.length === 0 && (
                                <p className="text-sm text-gray-400 text-center py-4 italic">No items added yet. Add planned expenditures.</p>
                              )}
                              {breakdownItems.map((item) => (
                                <div key={item.id} className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                                  <input
                                    type="text"
                                    value={item.description}
                                    onChange={(e) => updateBreakdownItem(item.id, 'description', e.target.value)}
                                    className="w-full sm:flex-1 p-2 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                                    placeholder="Description (e.g., Equipment, Travel)"
                                  />
                                  <div className="flex w-full sm:w-auto gap-2">
                                    <select
                                      value={item.category}
                                      onChange={(e) => updateBreakdownItem(item.id, 'category', e.target.value)}
                                      className="p-2 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none bg-white"
                                    >
                                      <option value="ps">PS</option>
                                      <option value="mooe">MOOE</option>
                                      <option value="co">CO</option>
                                    </select>
                                    <input
                                      type="number"
                                      value={item.amount || ''}
                                      onChange={(e) => updateBreakdownItem(item.id, 'amount', parseFloat(e.target.value) || 0)}
                                      className="flex-1 sm:w-28 p-2 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none text-right"
                                      placeholder="Amount"
                                    />
                                    <button onClick={() => removeBreakdownItem(item.id)} className="text-gray-400 hover:text-red-500 p-2">
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {breakdownItems.length > 0 && (
                            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-bold text-blue-700">Total Requested:</span>
                                <span className="text-lg font-bold text-blue-800">
                                  {formatCurrency(breakdownItems.reduce((sum, item) => sum + (item.amount || 0), 0))}
                                </span>
                              </div>
                              {breakdownItems.reduce((sum, item) => sum + (item.amount || 0), 0) > remaining && (
                                <p className="text-xs text-red-600 mt-1 font-bold">Exceeds remaining budget!</p>
                              )}
                            </div>
                          )}

                          <button
                            onClick={handleSubmitFundRequest}
                            disabled={breakdownItems.length === 0 || breakdownItems.some(item => !item.description || !item.amount) || submittingFundRequest}
                            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                          >
                            {submittingFundRequest ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</> : 'Submit Fund Request for R&D Review'}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* EDITABLE CONTENT (due / overdue + fund request approved) */}
                    {isEditable && currentReport.fundRequest?.status === 'approved' && (
                      <div className="space-y-6">
                        {/* Approved Fund Request Display */}
                        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                          <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                              <h5 className="font-bold text-emerald-800">Approved Fund Request</h5>
                            </div>
                            <span className="text-lg font-bold text-emerald-700">
                              {formatCurrency(currentReport.fundRequest.fund_request_items?.reduce((s, i) => s + i.amount, 0) || 0)}
                            </span>
                          </div>
                          <div className="space-y-1 mt-2">
                            {currentReport.fundRequest.fund_request_items?.map(item => (
                              <div key={item.id} className="flex justify-between text-sm">
                                <span className="text-emerald-700">{item.item_name} <span className="text-xs text-gray-400">({item.category.toUpperCase()})</span></span>
                                <span className="font-mono text-emerald-800">{formatCurrency(item.amount)}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Progress Stepper */}
                        <div className="bg-white p-4 rounded-xl border border-gray-200">
                          <label className="text-xs font-bold text-gray-600 uppercase mb-3 flex justify-between items-center">
                            <span>Update Progress (Min {prevReportProgress}%)</span>
                            <span className="text-sm font-bold text-blue-600">{localProgress}%</span>
                          </label>
                          <div className="flex items-center gap-3">
                            <div className="flex-1 w-full p-3 border border-gray-300 rounded-lg text-sm bg-gray-50 text-gray-800 font-semibold text-center select-none">
                              {localProgress}%
                            </div>
                            <div className="flex flex-col gap-1">
                              <button onClick={() => handleProgressStep('up')} disabled={localProgress >= 100} className="p-1 bg-gray-200 rounded-lg hover:bg-blue-100 text-gray-600 disabled:opacity-30 transition-colors"><ChevronUp className="w-4 h-4" /></button>
                              <button onClick={() => handleProgressStep('down')} disabled={localProgress <= prevReportProgress} className="p-1 bg-gray-200 rounded-lg hover:bg-red-100 text-gray-600 disabled:opacity-30 transition-colors"><ChevronDown className="w-4 h-4" /></button>
                            </div>
                          </div>
                          <div className="mt-4">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{ width: `${localProgress}%` }}></div>
                            </div>
                          </div>
                        </div>

                        {/* File Upload Section */}
                        <div className="bg-white p-4 rounded-xl border border-gray-200 space-y-4">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold text-gray-600 uppercase">Attachments</span>
                            <span className="text-[10px] text-gray-400">Max 5 MB per file &middot; PDF, DOC, PNG, JPG</span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="text-xs font-bold text-gray-600 uppercase">Quarterly Accomplishment Report</label>
                              <input
                                type="file"
                                accept={REPORT_ALLOWED_EXTENSIONS}
                                onChange={(e) => handleFileSelect(e.target.files?.[0] || null, setReportFile)}
                                className="block w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                              />
                              {reportFile && (
                                <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 px-2 py-1 rounded">
                                  <FileText className="w-3 h-3" />
                                  <span className="truncate">{reportFile.name}</span>
                                  <span className="text-gray-400">({(reportFile.size / 1024 / 1024).toFixed(1)} MB)</span>
                                  <button onClick={() => setReportFile(null)} className="ml-auto text-gray-400 hover:text-red-500"><X className="w-3 h-3" /></button>
                                </div>
                              )}
                            </div>
                            <div className="space-y-2">
                              <label className="text-xs font-bold text-gray-600 uppercase">Terminal Report (Expected Outputs)</label>
                              <input
                                type="file"
                                accept={REPORT_ALLOWED_EXTENSIONS}
                                onChange={(e) => handleFileSelect(e.target.files?.[0] || null, setTerminalReportFile)}
                                className="block w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                              />
                              {terminalReportFile && (
                                <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 px-2 py-1 rounded">
                                  <FileText className="w-3 h-3" />
                                  <span className="truncate">{terminalReportFile.name}</span>
                                  <span className="text-gray-400">({(terminalReportFile.size / 1024 / 1024).toFixed(1)} MB)</span>
                                  <button onClick={() => setTerminalReportFile(null)} className="ml-auto text-gray-400 hover:text-red-500"><X className="w-3 h-3" /></button>
                                </div>
                              )}
                            </div>
                          </div>
                          <div>
                            <label className="text-xs font-bold text-gray-600 uppercase">Additional Proofs / Receipts (Optional)</label>
                            <input
                              type="file"
                              multiple
                              accept={REPORT_ALLOWED_EXTENSIONS}
                              onChange={(e) => { handleReceiptFiles(e.target.files); e.target.value = ''; }}
                              className="block w-full text-xs text-gray-500 mt-1 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                            />
                            {receiptFiles.length > 0 && (
                              <div className="mt-2 space-y-1">
                                {receiptFiles.map((file, i) => (
                                  <div key={i} className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded border border-gray-200">
                                    <FileText className="w-3 h-3 text-blue-500" />
                                    <span className="truncate">{file.name}</span>
                                    <span className="text-gray-400">({(file.size / 1024 / 1024).toFixed(1)} MB)</span>
                                    <button onClick={() => removeReceiptFile(i)} className="ml-auto text-gray-400 hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Chat */}
                        {(currentReport.messages.length > 0 || isOverdue) && renderChatSection()}

                        {/* Submit Report Button */}
                        <button
                          onClick={handleSubmitReport}
                          disabled={submittingReport}
                          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {submittingReport ? <><Loader2 className="w-4 h-4 animate-spin" /> {uploadProgress || 'Submitting...'}</> : 'Submit Report for Verification'}
                        </button>
                      </div>
                    )}

                    {/* SUBMITTED - Read-only waiting for verification */}
                    {currentReport.status === 'submitted' && (
                      <div className="border-t border-gray-100 pt-4 space-y-4">
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
                          <FileText className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                          <h4 className="font-bold text-blue-800">Report Submitted</h4>
                          <p className="text-sm text-blue-600">Waiting for R&D verification.</p>
                        </div>
                        {currentReport.fundRequest && (
                          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-emerald-800 flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Approved Funds</span>
                              <span className="font-bold text-emerald-700">{formatCurrency(currentReport.fundRequest.fund_request_items?.reduce((s, i) => s + i.amount, 0) || 0)}</span>
                            </div>
                          </div>
                        )}
                        <div className="bg-white p-4 rounded-xl border border-gray-200">
                          <p className="text-xs font-bold text-gray-500 uppercase mb-2">Progress</p>
                          <div className="flex items-center gap-3">
                            <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-blue-500 rounded-full" style={{ width: `${currentReport.progressPercentage}%` }}></div>
                            </div>
                            <span className="text-sm font-bold text-gray-700">{currentReport.progressPercentage}%</span>
                          </div>
                        </div>
                        {renderChatSection()}
                      </div>
                    )}

                    {/* VERIFIED (approved) - Read-only */}
                    {currentReport.status === 'approved' && (
                      <div className="border-t border-gray-100 pt-4 space-y-4">
                        {currentReport.fundRequest && (
                          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-bold text-emerald-800 flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> Approved Fund Request</span>
                              <span className="text-lg font-bold text-emerald-700">{formatCurrency(currentReport.fundRequest.fund_request_items?.reduce((s, i) => s + i.amount, 0) || 0)}</span>
                            </div>
                            <div className="space-y-1">
                              {currentReport.fundRequest.fund_request_items?.map(item => (
                                <div key={item.id} className="flex justify-between text-sm">
                                  <span className="text-emerald-700">{item.item_name}</span>
                                  <span className="font-mono">{formatCurrency(item.amount)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {currentReport.expenses.length > 0 && (
                          <div>
                            <p className="text-xs font-bold text-gray-500 uppercase mb-2">Expense Breakdown</p>
                            <div className="bg-gray-50 rounded-xl p-3 space-y-1">
                              {currentReport.expenses.map(exp => (
                                <div key={exp.id} className="flex justify-between text-xs text-gray-600 border-b border-gray-200 last:border-0 pb-1">
                                  <span>{exp.description}</span>
                                  <span className="font-mono">{formatCurrency(exp.amount)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {currentReport.proofFiles.length > 0 && (
                          <div>
                            <p className="text-xs font-bold text-gray-500 uppercase mb-2">Proof of Accomplishment</p>
                            <div className="flex flex-wrap gap-2">
                              {currentReport.proofFiles.map((file, i) => (
                                <a key={i} href={file} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded hover:bg-blue-100">
                                  <FileText className="w-3 h-3" /> File {i + 1}
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                        {currentReport.submittedBy && (
                          <div className="flex items-center justify-end text-xs text-gray-500">
                            <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
                              <UserCheck className="w-3 h-3 text-emerald-600" />
                              <span>Submitted: {currentReport.dateSubmitted}</span>
                            </div>
                          </div>
                        )}
                        {currentReport.messages.length > 0 && renderChatSection()}
                      </div>
                    )}
                  </div>

                  {/* Pagination Dots */}
                  <div className="flex justify-center gap-2 mt-4 pb-6 lg:pb-0">
                    {quarters.map((_, idx) => (
                      <button key={idx} onClick={() => setCurrentReportIndex(idx)} className={`w-2 h-2 rounded-full transition-all ${idx === currentReportIndex ? 'bg-blue-600 w-4' : 'bg-gray-300 hover:bg-gray-400'}`}></button>
                    ))}
                  </div>
                </div>
              )}

            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400">
              {projects.length === 0 ? 'No funded projects yet.' : 'Select a project'}
            </div>
          )}
        </div>
      </section>

      {/* --- EXTENSION MODAL --- */}
      {isExtensionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setIsExtensionModalOpen(false)} className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-3"><CalendarClock className="w-6 h-6" /></div>
              <h3 className="text-xl font-bold text-gray-800">Request Extension</h3>
            </div>
            <div className="space-y-4">
              <div className="flex gap-4 p-1 bg-gray-100 rounded-lg">
                <button onClick={() => setExtensionType('time_only')} className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${extensionType === 'time_only' ? 'bg-white shadow text-amber-600' : 'text-gray-500'}`}>Time Only</button>
                <button onClick={() => setExtensionType('with_funding')} className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${extensionType === 'with_funding' ? 'bg-white shadow text-amber-600' : 'text-gray-500'}`}>With Funding</button>
              </div>
              {extensionType === 'with_funding' && (
                <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg text-xs text-blue-700 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <p>Note: Additional funding requires a new proposal justification.</p>
                </div>
              )}
              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">New End Date</label>
                <input type="date" value={extensionDate} onChange={(e) => setExtensionDate(e.target.value)} className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Reason</label>
                <textarea value={extensionReason} onChange={(e) => setExtensionReason(e.target.value)} placeholder="Reason for delay..." className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none text-sm h-24 resize-none" />
              </div>
              <button
                onClick={() => { Swal.fire('Submitted', 'Extension request submitted.', 'success'); setIsExtensionModalOpen(false); setExtensionDate(''); setExtensionReason(''); }}
                disabled={!extensionDate || !extensionReason.trim()}
                className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Submit Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MonitoringPage;
