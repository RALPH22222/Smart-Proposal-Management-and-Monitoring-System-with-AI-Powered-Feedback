import React, { useState, useEffect } from 'react';
import {
  Calendar, User, DollarSign, X, CheckCircle, TrendingUp,
  AlertTriangle, Clock, ChevronDown, ChevronUp,
  FileText, Paperclip, Download,
  Users, CheckSquare, Lock, Loader2, Award,
  CalendarClock, Banknote, ArrowRight, FileCheck,
  ShieldCheck, XCircle,
} from 'lucide-react';
import Swal from 'sweetalert2';
import { Link } from 'react-router-dom';
import { openSignedUrl } from '../../utils/signed-url';
import { getFileActionMeta } from '../shared/FileActionButton';
import { formatDate } from '../../utils/date-formatter';
import { type Project } from '../../types/InterfaceProject';
import { useAuthContext } from '../../context/AuthContext';
import {
  fetchProjectDetail,
  verifyReport,
  rejectReport,
  fetchFundRequests,
  reviewFundRequest,
  fetchBudgetSummary,
  generateCertificate,
  buildDisplayReports,
  fetchTerminalReport,
  verifyTerminalReport,
  rejectTerminalReport,
  fetchProjectExtensionRequests,
  reviewProjectExtension,
  fetchRealignments,
  verifyProjectDocument,
  rejectProjectDocument,
  invalidateProjectCache,
  type DisplayReport,
  type ProjectDetailData,
  type ApiFundRequest,
  type ApiBudgetSummary,
  type ApiTerminalReport,
  type ApiProjectExtensionRequest,
  type RealignmentRecord,
  type ComplianceDocStatus,
  groupProofFiles,
} from '../../services/ProjectMonitoringApi';
import FinancialReportModal from '../proponent-component/FinancialReportModal';
import { generateCertificatePDF } from '../../utils/certificate-generator';
import PageLoader from '../shared/PageLoader';
import SecureImage from '../shared/SecureImage';

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
  const [rawDetail, setRawDetail] = useState<any>(null);
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

  // Terminal report + financial report state
  const [terminalReport, setTerminalReport] = useState<ApiTerminalReport | null>(null);
  const [verifyingTerminal, setVerifyingTerminal] = useState(false);
  const [showFinancialReport, setShowFinancialReport] = useState(false);

  // Extension requests (funded-project level)
  const [extensionRequests, setExtensionRequests] = useState<ApiProjectExtensionRequest[]>([]);
  const [reviewingExtId, setReviewingExtId] = useState<number | null>(null);
  const [extReviewNote, setExtReviewNote] = useState('');
  const [showExtRejectFor, setShowExtRejectFor] = useState<number | null>(null);

  // Realignments awareness
  const [realignments, setRealignments] = useState<RealignmentRecord[]>([]);

  // Collapse state for history
  const [showFundRequestHistory, setShowFundRequestHistory] = useState(false);

  // Reject-report flow state. Inline textarea on the expanded report card — the reject
  // button reveals a required-reason input next to the verify button, mirroring how fund
  // request rejection works a few panels up. Separate per-report id so two cards don't
  // share one note.
  const [rejectingReportId, setRejectingReportId] = useState<string | null>(null);
  const [reportRejectNote, setReportRejectNote] = useState('');
  const [submittingReportReject, setSubmittingReportReject] = useState<string | null>(null);

  // Terminal-report reject flow (only ever one per project so a single flag is enough).
  const [rejectingTerminal, setRejectingTerminal] = useState(false);
  const [terminalRejectNote, setTerminalRejectNote] = useState('');
  const [submittingTerminalReject, setSubmittingTerminalReject] = useState(false);

  // Compliance-doc (MOA / Agency Cert) Verify/Reject in-flight tracker. Keyed by
  // `${docKey}:${action}` so only the clicked button spins while the paired button
  // on the same doc (and buttons on the other doc) are disabled to prevent double-submit.
  const [complianceDocAction, setComplianceDocAction] = useState<string | null>(null);

  const loadDetails = async () => {
    if (!project?.backendId) return;
    setDetailLoading(true);
    // Reviewers need post-submission data the moment the proponent saves.
    // The 30s module cache can serve a pre-liquidation snapshot and hide the expense rows.
    invalidateProjectCache();
    try {
      const [data, frResponse, bs, extReqs, realigns] = await Promise.all([
        fetchProjectDetail(project.backendId),
        fetchFundRequests(project.backendId).catch((err) => {
          console.error('Error loading fund requests:', err);
          return { fund_requests: [], budget_summary: null } as { fund_requests: ApiFundRequest[]; budget_summary: ApiBudgetSummary | null };
        }),
        fetchBudgetSummary(project.backendId).catch(() => null),
        fetchProjectExtensionRequests(project.backendId).catch((err) => {
          console.error('Error loading extension requests:', err);
          return [] as ApiProjectExtensionRequest[];
        }),
        fetchRealignments({ fundedProjectId: project.backendId }).catch((err) => {
          console.error('Error loading realignments:', err);
          return [] as RealignmentRecord[];
        }),
      ]);
      const detailData = buildDisplayReports(data, user?.id || '');
      setDetails(detailData);
      setRawDetail(data);
      setFundRequests(frResponse.fund_requests);
      setBudgetSummary(frResponse.budget_summary || bs);
      setExtensionRequests(extReqs);
      setRealignments(realigns);

      // Load terminal report
      fetchTerminalReport(project.backendId).then(setTerminalReport).catch(() => setTerminalReport(null));
    } catch (err) {
      console.error('Error loading project details:', err);
      setDetails({ reports: [], totalBudget: 0, certificateIssuedAt: null, certificateIssuedByName: null });
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

  // --- CALCULATE FINANCIALS ---
  // totalUsed = actual spent (sum of project_expenses.expenses from verified reports).
  // totalApproved = drawn via approved fund requests (money released to proponent).
  // Previously both were collapsed into a single number, which is why "100% Utilized"
  // showed the moment the FR was approved even with zero liquidations.
  const totalBudget = budgetSummary?.total_budget ?? details?.totalBudget ?? project?.budget ?? 0;
  const totalUsed =
    budgetSummary?.total_actual_spent ??
    (details?.reports?.reduce((acc, r) => acc + r.totalExpense, 0) ?? 0);
  const totalApproved = budgetSummary?.total_approved ?? 0;
  const remainingBudget = budgetSummary?.remaining ?? (totalBudget - totalUsed);
  const totalPending = budgetSummary?.total_pending ?? 0;
  const utilizationPct = totalBudget > 0 ? Math.min(100, Math.round((totalUsed / totalBudget) * 100)) : 0;

  const toggleReport = (id: string) => setExpandedReportId(expandedReportId === id ? null : id);

  const handleVerifyReport = async (report: DisplayReport) => {
    if (!report.backendReportId || !user) return;

    setVerifyingReportId(report.id);
    Swal.fire({
      title: 'Verifying report...',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });
    try {
      await verifyReport(report.backendReportId);
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

  const handleRejectReport = async (report: DisplayReport) => {
    if (!report.backendReportId || !user) return;
    if (!reportRejectNote.trim()) {
      Swal.fire('Reason required', 'Please enter the reason for returning this report.', 'warning');
      return;
    }
    setSubmittingReportReject(report.id);
    try {
      await rejectReport(report.backendReportId, reportRejectNote.trim());
      Swal.fire('Returned to Proponent', 'The report has been returned with your note. The proponent will be notified.', 'success');
      setReportRejectNote('');
      setRejectingReportId(null);
      await loadDetails();
    } catch (err: any) {
      Swal.fire('Error', err?.response?.data?.message || 'Failed to return the report.', 'error');
    } finally {
      setSubmittingReportReject(null);
    }
  };

  const handleRejectTerminal = async () => {
    if (!terminalReport || !user) return;
    if (!terminalRejectNote.trim()) {
      Swal.fire('Reason required', 'Please enter the reason for returning this terminal report.', 'warning');
      return;
    }
    setSubmittingTerminalReject(true);
    try {
      const updated = await rejectTerminalReport(terminalReport.id, terminalRejectNote.trim());
      setTerminalReport(updated);
      Swal.fire('Returned to Proponent', 'The terminal report has been returned with your note.', 'success');
      setTerminalRejectNote('');
      setRejectingTerminal(false);
    } catch (err: any) {
      Swal.fire('Error', err?.response?.data?.message || 'Failed to return the terminal report.', 'error');
    } finally {
      setSubmittingTerminalReject(false);
    }
  };

  const handleReviewFundRequest = async (frId: number, status: 'approved' | 'rejected') => {
    if (!user) return;
    setReviewingFrId(frId);
    Swal.fire({
      title: status === 'approved' ? 'Approving fund request...' : 'Rejecting fund request...',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });
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
    Swal.fire({
      title: 'Issuing certificate...',
      text: 'Marking project as completed.',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });
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

  const handleDownloadCertificate = async () => {
    if (!project || !details) return;
    try {
      await generateCertificatePDF({
        projectTitle: project.title,
        programTitle: rawDetail?.proposal?.program_title || undefined,
        projectLeader: project.principalInvestigator,
        department: project.department,
        startDate: project.startDate,
        endDate: project.endDate,
        totalBudget: totalBudget,
        issuedAt: details.certificateIssuedAt || new Date().toISOString(),
        issuedByName: details.certificateIssuedByName || 'R&D Office',
      });
    } catch (err) {
      console.error('Failed to generate certificate PDF:', err);
      Swal.fire('Error', 'Failed to generate certificate PDF.', 'error');
    }
  };

  const handleReviewExtension = async (extId: number, status: 'approved' | 'rejected') => {
    if (!user) return;
    if (status === 'rejected' && !extReviewNote.trim()) {
      Swal.fire('Reason required', 'Please enter a reason when rejecting an extension.', 'warning');
      return;
    }
    setReviewingExtId(extId);
    Swal.fire({
      title: status === 'approved' ? 'Approving extension...' : 'Rejecting extension...',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });
    try {
      await reviewProjectExtension(extId, status, extReviewNote || undefined);
      Swal.fire(
        status === 'approved' ? 'Approved' : 'Rejected',
        `Extension request has been ${status}.`,
        status === 'approved' ? 'success' : 'info'
      );
      setExtReviewNote('');
      setShowExtRejectFor(null);
      await loadDetails();
    } catch (err: any) {
      console.error('Error reviewing extension:', err);
      const msg = err?.response?.data?.message || 'Failed to review extension.';
      Swal.fire('Error', msg, 'error');
    } finally {
      setReviewingExtId(null);
    }
  };

  const allQuartersVerified = details?.reports
    ? details.reports.filter(r => r.status === 'Verified').length === 4
    : false;

  const pendingFundRequests = fundRequests.filter(fr => fr.status === 'pending');
  const reviewedFundRequests = fundRequests.filter(fr => fr.status !== 'pending');
  const pendingExtensionRequests = extensionRequests.filter(ex => ex.status === 'pending');
  const reviewedExtensionRequests = extensionRequests.filter(ex => ex.status !== 'pending');
  const activeRealignment = realignments.find(
    r => r.status === 'pending_review' || r.status === 'revision_requested'
  );

  const moaFileUrl: string | null = rawDetail?.moa_file_url ?? null;
  const agencyCertFileUrl: string | null = rawDetail?.agency_certification_file_url ?? null;
  const workPlanFileUrl: string | null = rawDetail?.proposal?.work_plan_file_url ?? null;
  const isMultiYearProject = details?.reports?.some((r) => r.year_number > 1) ?? false;

  const getPeriodDisplayLabel = (yearNumber: number | null | undefined, quarterKey: string) => {
    const qShort = quarterKey.replace('_report', '').toUpperCase();
    return isMultiYearProject ? `Y${yearNumber ?? 1} ${qShort}` : qShort;
  };

  const getFundRequestForReport = (report: DisplayReport) =>
    fundRequests.find(
      (fr) => fr.year_number === report.year_number && fr.quarterly_report === report.quarterKey,
    ) ?? null;

  // --- RENDERERS ---

  const renderCompletedView = () => {
    if (!project || !details) return null;
    return (
      <div className="space-y-6">
        {/* Success Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
          <div className="relative z-10 flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold">Project Successfully Completed</h3>
              <p className="text-blue-100 opacity-90 text-sm">All quarterly reports have been verified and certificate has been issued.</p>
            </div>
          </div>
          {details?.certificateIssuedAt && (
            <div className="relative z-10 mt-4 flex flex-wrap items-center gap-4 text-sm text-blue-100">
              <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-1.5">
                <Calendar className="w-4 h-4" />
                <span>Issued: {formatDate(details.certificateIssuedAt)}</span>
              </div>
              {details.certificateIssuedByName && (
                <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-1.5">
                  <User className="w-4 h-4" />
                  <span>Issued by: {details.certificateIssuedByName}</span>
                </div>
              )}
              <button
                onClick={handleDownloadCertificate}
                className="flex items-center gap-2 bg-white/20 hover:bg-white/30 rounded-lg px-4 py-1.5 text-white font-medium transition-colors"
              >
                <Download className="w-4 h-4" />
                Download Certificate
              </button>
            </div>
          )}
          <Award className="absolute -right-6 -bottom-6 w-32 h-32 text-white opacity-10" />
        </div>

        {/* Leadership Summary */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h4 className="text-xs font-bold text-slate-400 uppercase mb-4 flex items-center gap-2">
            <Users className="w-4 h-4" /> Project Leadership Team
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 overflow-hidden border-2 border-white shadow-sm">
                {project.proponentProfilePicture ? (
                  <SecureImage 
                    src={project.proponentProfilePicture} 
                    alt={project.principalInvestigator}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-5 h-5" />
                )}
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">{project.principalInvestigator}</p>
                <p className="text-xs text-slate-500">Project Leader</p>
              </div>
            </div>
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
                    <div
                      className="h-full bg-emerald-500 transition-all"
                      style={{ width: `${utilizationPct}%` }}
                    ></div>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 text-right">{utilizationPct}% Utilized · ₱{totalApproved.toLocaleString()} drawn</p>
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

        {/* Report Archive */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h4 className="text-xs font-bold text-slate-400 uppercase mb-4 flex items-center gap-2">
            <FileText className="w-4 h-4" /> Report Archive
          </h4>
          <div className="space-y-2">
            {details?.reports.filter(r => r.backendReportId !== null).map((report) => (
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
  };

  const renderReportItem = (report: DisplayReport) => {
    const isExpanded = expandedReportId === report.id;
    const reportFR = getFundRequestForReport(report);
    const hasReportDetails = report.status !== 'Locked' && report.status !== 'Due';
    const hasQuarterFundRequest = !!reportFR;
    let statusColor = "bg-slate-100 text-slate-500 border-slate-200";
    let statusIcon = <Clock className="w-5 h-5" />;

    if (report.status === 'Verified') {
      statusColor = "bg-emerald-100 text-emerald-700 border-emerald-200";
      statusIcon = <CheckSquare className="w-5 h-5" />;
    } else if (report.status === 'Submitted') {
      statusColor = "bg-blue-100 text-blue-700 border-blue-200";
      statusIcon = <FileText className="w-5 h-5" />;
    } else if (report.status === 'Rejected') {
      statusColor = "bg-red-100 text-red-700 border-red-200";
      statusIcon = <XCircle className="w-5 h-5" />;
    } else if (report.status === 'Overdue') {
      statusColor = "bg-red-100 text-red-700 border-red-200";
      statusIcon = <AlertTriangle className="w-5 h-5" />;
    } else if (report.status === 'Locked') {
      statusColor = "bg-gray-50 text-gray-400 border-gray-200";
      statusIcon = <Lock className="w-5 h-5" />;
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
              {!hasReportDetails && reportFR && (
                <p className={`text-xs mt-1 ${
                  reportFR.status === 'approved'
                    ? 'text-emerald-600'
                    : reportFR.status === 'pending'
                      ? 'text-amber-600'
                      : 'text-red-600'
                }`}>
                  {reportFR.status === 'approved'
                    ? `${getPeriodDisplayLabel(reportFR.year_number, reportFR.quarterly_report)} fund request approved`
                    : reportFR.status === 'pending'
                      ? `${getPeriodDisplayLabel(reportFR.year_number, reportFR.quarterly_report)} fund request pending R&D review`
                      : `${getPeriodDisplayLabel(reportFR.year_number, reportFR.quarterly_report)} fund request was rejected`}
                </p>
              )}
            </div>
          </div>
          <div className="text-right">
            <span className={`text-xs font-bold px-2 py-1 rounded border ${statusColor}`}>{report.status}</span>
            {isExpanded ? <ChevronUp className="w-4 h-4 mx-auto mt-1 text-slate-400" /> : <ChevronDown className="w-4 h-4 mx-auto mt-1 text-slate-400" />}
          </div>
        </div>

        {isExpanded && hasReportDetails && (
          <div className="p-5 border-t border-slate-100 bg-slate-50 space-y-5 animate-in slide-in-from-top-2">
            {report.submittedBy && (
              <div className="flex items-center gap-2 text-xs text-slate-500 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                <User className="w-4 h-4 text-blue-500" />
                <span>Submitted by <span className="font-bold text-slate-700">{report.submittedBy}</span> on {report.dateSubmitted}</span>
              </div>
            )}
            {/* Previously-returned context: shown on resubmitted reports (status Submitted
                + non-null reviewNote). The note is the reason R&D gave last time so they
                can check whether the proponent actually addressed it before verifying. */}
            {report.status === 'Submitted' && report.reviewNote && (
              <div className="flex items-start gap-2 text-xs bg-amber-50 p-3 rounded-xl border border-amber-200">
                <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-amber-800">Previously returned — resubmitted with revisions</p>
                  <p className="text-amber-700 italic mt-0.5">"{report.reviewNote}"</p>
                </div>
              </div>
            )}
            {(() => {
              if (!reportFR || reportFR.status !== 'approved' || !(reportFR.fund_request_items && reportFR.fund_request_items.length > 0)) return null;
              const frTotal = reportFR.fund_request_items.reduce((s, i) => s + Number(i.amount || 0), 0);
              return (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-emerald-800 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5" /> Approved Fund Request
                    </span>
                    <span className="text-lg font-bold text-emerald-700">₱{frTotal.toLocaleString()}</span>
                  </div>
                  <div className="space-y-1">
                    {reportFR.fund_request_items.map(item => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className="text-emerald-700">{item.item_name}</span>
                        <span className="font-mono">₱{Number(item.amount || 0).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <p className="text-xs text-slate-400 uppercase font-bold">Completion</p>
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${report.progress}%` }}></div>
                  </div>
                  <span className="text-sm font-bold text-slate-700">{report.progress}%</span>
                </div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <p className="text-xs text-slate-400 uppercase font-bold">Approved</p>
                <p className="text-xl font-bold text-slate-800 mt-1">₱{report.totalApproved.toLocaleString()}</p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <p className="text-xs text-slate-400 uppercase font-bold">Actual Spent</p>
                <p className="text-xl font-bold text-blue-700 mt-1">₱{report.totalExpense.toLocaleString()}</p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <p className="text-xs text-slate-400 uppercase font-bold">For Return</p>
                <p className={`text-xl font-bold mt-1 ${(report.totalApproved - report.totalExpense) > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                  ₱{(report.totalApproved - report.totalExpense).toLocaleString()}
                </p>
              </div>
            </div>

            {report.expenses.length > 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="bg-slate-50 px-4 py-3 text-xs font-bold text-slate-600 uppercase border-b border-slate-200">Expense Breakdown</div>
                <div className="grid grid-cols-4 gap-2 px-4 py-2 text-[10px] font-bold text-slate-400 uppercase border-b border-slate-200 bg-slate-50/50">
                  <span className="col-span-1">Item</span>
                  <span className="text-right">Approved</span>
                  <span className="text-right">Actual</span>
                  <span className="text-right">Unspent</span>
                </div>
                {report.expenses.map((exp, idx) => {
                  const approved = exp.approvedAmount ?? exp.amount;
                  const unspent = approved - exp.amount;
                  return (
                    <div key={exp.id} className="grid grid-cols-4 gap-2 px-4 py-3 text-sm border-b border-slate-100 last:border-0">
                      <span className="text-slate-700 col-span-1 truncate">{idx + 1}. {exp.description}</span>
                      <span className="font-mono text-right text-slate-500">₱{approved.toLocaleString()}</span>
                      <span className="font-mono text-right font-medium text-blue-700">₱{exp.amount.toLocaleString()}</span>
                      <span className={`font-mono text-right font-medium ${unspent > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                        ₱{unspent.toLocaleString()}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center p-4 border border-dashed border-slate-300 rounded-xl text-xs text-slate-500">
                Proponent submitted this report without a liquidation breakdown. Review the proof files below for actual spend details.
              </div>
            )}

            {report.proofs.length > 0 ? (
              <div className="space-y-3">
                <p className="text-xs font-bold text-slate-500 uppercase">Proof of Accomplishment</p>
                {groupProofFiles(report.proofs).map((group) => (
                  <div key={group.category}>
                    <p className="text-[11px] font-bold text-slate-500 mb-1.5">{group.category}</p>
                    <div className="space-y-1.5">
                      {group.files.map((file, i) => {
                        const meta = getFileActionMeta(file.url);
                        const ActionIcon = meta.Icon;
                        return (
                          <a key={i} href="#" onClick={(e) => { e.preventDefault(); openSignedUrl(file.url); }} title={meta.title} className="flex items-center gap-2 bg-white px-3 py-2.5 rounded-lg border border-slate-200 text-sm text-blue-600 hover:text-blue-800 hover:border-blue-300 cursor-pointer transition-all shadow-sm">
                            <Paperclip className="w-4 h-4 flex-shrink-0" />
                            <span className="font-medium truncate max-w-[200px]">{file.filename}</span>
                            <ActionIcon className="w-4 h-4 ml-auto opacity-70 flex-shrink-0" />
                          </a>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center p-4 border border-dashed border-slate-300 rounded-xl text-xs text-slate-400">No proof files attached.</div>
            )}

            {report.status === 'Submitted' && (
              <div className="pt-4 border-t border-slate-200 space-y-3">
                {/* Inline reject textarea — only visible after clicking Reject */}
                {rejectingReportId === report.id && (
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                      Reason for returning (required)
                    </label>
                    <textarea
                      value={reportRejectNote}
                      onChange={(e) => setReportRejectNote(e.target.value)}
                      placeholder="Explain what needs revision (this message is sent to the proponent)"
                      className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-1 focus:ring-red-500 outline-none resize-none h-20"
                    />
                  </div>
                )}
                <div className="flex gap-3">
                  {rejectingReportId !== report.id ? (
                    <>
                      <button
                        onClick={() => handleVerifyReport(report)}
                        disabled={verifyingReportId === report.id}
                        className="flex-1 bg-emerald-600 text-white py-3 rounded-xl text-sm font-bold hover:bg-emerald-700 shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {verifyingReportId === report.id ? <><Loader2 className="w-5 h-5 animate-spin" /> Verifying...</> : <><CheckCircle className="w-5 h-5" /> Verify & Approve</>}
                      </button>
                      <button
                        onClick={() => { setRejectingReportId(report.id); setReportRejectNote(''); }}
                        className="flex-1 bg-red-50 text-red-600 border border-red-200 py-3 rounded-xl text-sm font-bold hover:bg-red-100 transition-all flex items-center justify-center gap-2"
                      >
                        <AlertTriangle className="w-5 h-5" /> Return for Revision
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleRejectReport(report)}
                        disabled={submittingReportReject === report.id || !reportRejectNote.trim()}
                        className="flex-1 bg-red-600 text-white py-3 rounded-xl text-sm font-bold hover:bg-red-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {submittingReportReject === report.id ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirm Return'}
                      </button>
                      <button
                        onClick={() => { setRejectingReportId(null); setReportRejectNote(''); }}
                        className="flex-1 bg-slate-100 text-slate-600 py-3 rounded-xl text-sm font-bold hover:bg-slate-200 transition-all"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
        {isExpanded && !hasReportDetails && (
          <div className="p-5 border-t border-slate-100 bg-slate-50 space-y-4 animate-in slide-in-from-top-2">
            {hasQuarterFundRequest && reportFR ? (
              <div className={`rounded-xl border p-4 ${
                reportFR.status === 'approved'
                  ? 'bg-emerald-50 border-emerald-200'
                  : reportFR.status === 'pending'
                    ? 'bg-amber-50 border-amber-200'
                    : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex justify-between items-start gap-4 mb-3">
                  <div>
                    <p className={`font-bold ${
                      reportFR.status === 'approved'
                        ? 'text-emerald-800'
                        : reportFR.status === 'pending'
                          ? 'text-amber-800'
                          : 'text-red-800'
                    }`}>
                      {getPeriodDisplayLabel(reportFR.year_number, reportFR.quarterly_report)} Fund Request
                    </p>
                    <p className={`text-xs mt-1 ${
                      reportFR.status === 'approved'
                        ? 'text-emerald-600'
                        : reportFR.status === 'pending'
                          ? 'text-amber-600'
                          : 'text-red-600'
                    }`}>
                      {reportFR.status === 'approved'
                        ? 'Approved. Waiting for the proponent to submit the quarterly report.'
                        : reportFR.status === 'pending'
                          ? 'Pending R&D review before the quarterly report can be submitted.'
                          : 'Rejected. The proponent must revise and resubmit the fund request before this quarter can proceed.'}
                    </p>
                    {reportFR.review_note && (
                      <p className={`text-xs mt-2 italic ${
                        reportFR.status === 'approved'
                          ? 'text-emerald-700'
                          : reportFR.status === 'pending'
                            ? 'text-amber-700'
                            : 'text-red-700'
                      }`}>
                        "{reportFR.review_note}"
                      </p>
                    )}
                  </div>
                  <span className={`text-lg font-bold shrink-0 ${
                    reportFR.status === 'approved'
                      ? 'text-emerald-700'
                      : reportFR.status === 'pending'
                        ? 'text-amber-700'
                        : 'text-red-700'
                  }`}>
                    ₱{(reportFR.fund_request_items?.reduce((s, i) => s + Number(i.amount || 0), 0) || 0).toLocaleString()}
                  </span>
                </div>
                {reportFR.fund_request_items && reportFR.fund_request_items.length > 0 ? (
                  <div className="space-y-1.5">
                    {reportFR.fund_request_items.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm bg-white/80 rounded-lg px-3 py-2 border border-white/70">
                        <span className="text-slate-700">{item.item_name} <span className="text-xs text-slate-400 uppercase">({item.category})</span></span>
                        <span className="font-mono text-slate-900">₱{Number(item.amount || 0).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">No line items were saved on this fund request.</p>
                )}
              </div>
            ) : (
              <div className="text-center text-slate-500 text-sm italic">
                {report.status === 'Locked'
                  ? 'This report is currently locked and not yet due.'
                  : 'This report is due. Waiting for the proponent to submit a fund request first.'}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // --- MAIN LAYOUT ---
  return (
    <>
      <style>{`
        @keyframes scrollTitle {
           0%, 15% { transform: translateX(0); }
          75%, 85% { transform: translateX(min(0px, calc(100cqw - 100%))); }
          95%, 100% { transform: translateX(0); }
        }
      `}</style>
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-300">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col transform transition-all animate-in zoom-in-95 duration-300">
          {/* --- HEADER --- */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-6 border-b border-gray-100 bg-white gap-4 sticky top-0 z-10">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border
                    ${project?.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                    project?.status === 'Delayed' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                      project?.status === 'Completed' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                        'bg-slate-50 text-slate-700 border-slate-200'}`}>
                  {project?.status}
                </span>
              </div>
              <div className="overflow-hidden" style={{ containerType: 'inline-size' }}>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight whitespace-nowrap inline-block animate-[scrollTitle_8s_ease-in-out_infinite]">
                  {project?.title}
                </h2>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600 self-start sm:self-center">
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* --- BODY --- */}
          <div className="flex-1 overflow-hidden flex flex-col lg:flex-row bg-slate-50">
            {detailLoading || !details ? (
              <PageLoader mode="project-detail" />
            ) : (
              <>
                {/* LEFT COLUMN */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                  {project?.status === 'Completed' ? renderCompletedView() : (
                    <>
                      {/* Realignment Awareness */}
                      {activeRealignment && (
                        <div className={`rounded-xl border p-4 flex items-start gap-3 ${activeRealignment.status === 'pending_review' ? 'bg-indigo-50 border-indigo-200' : 'bg-blue-50 border-blue-200'}`}>
                          <Banknote className={`w-5 h-5 mt-0.5 shrink-0 ${activeRealignment.status === 'pending_review' ? 'text-indigo-600' : 'text-blue-600'}`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${activeRealignment.status === 'pending_review' ? 'bg-indigo-100 text-indigo-700' : 'bg-blue-100 text-blue-700'}`}>
                                {activeRealignment.status === 'pending_review' ? 'Realignment Pending Review' : 'Awaiting Proponent Revision'}
                              </span>
                              <span className="text-xs text-slate-500">Submitted {formatDate(activeRealignment.created_at)}</span>
                            </div>
                            <p className="text-sm text-slate-700 mt-1 italic line-clamp-2">"{activeRealignment.reason}"</p>
                          </div>
                          <Link to="/users/rnd/rndMainLayout?tab=funding" className="shrink-0 inline-flex items-center gap-1 text-xs font-bold text-indigo-700 hover:text-indigo-900 bg-white border border-indigo-200 rounded-lg px-3 py-1.5">
                            Review <ArrowRight className="w-3 h-3" />
                          </Link>
                        </div>
                      )}

                      {/* Pending Fund Requests */}
                      {pendingFundRequests.length > 0 && (
                        <div>
                          <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2 text-lg">
                            <DollarSign className="w-5 h-5 text-amber-600" /> Pending Fund Requests
                            <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">{pendingFundRequests.length}</span>
                          </h3>
                          <div className="space-y-4">
                            {pendingFundRequests.map(fr => (
                              <div key={fr.id} className="bg-white rounded-xl border border-amber-200 overflow-hidden shadow-sm">
                                <div className="bg-amber-50 px-5 py-3 flex justify-between items-center border-b border-amber-200">
                                  <div>
                                    <span className="font-bold text-amber-800">{getPeriodDisplayLabel(fr.year_number, fr.quarterly_report)} Fund Request</span>
                                    <p className="text-xs text-amber-600 mt-0.5">Submitted {formatDate(fr.updated_at || fr.created_at)}</p>
                                    {fr.review_note && (
                                      <p className="text-[11px] text-amber-700 mt-1 italic">Previously returned: "{fr.review_note}"</p>
                                    )}
                                  </div>
                                  <span className="text-lg font-bold text-amber-800">₱{(fr.fund_request_items?.reduce((s, i) => s + i.amount, 0) || 0).toLocaleString()}</span>
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
                                    <textarea value={reviewNote} onChange={(e) => setReviewNote(e.target.value)} placeholder="Add a note (optional)..." className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 outline-none resize-none h-16" />
                                  </div>
                                )}
                                <div className="px-4 pb-4 flex gap-3">
                                  {showReviewNoteFor !== fr.id ? (
                                    <>
                                      <button onClick={() => handleReviewFundRequest(fr.id, 'approved')} disabled={reviewingFrId === fr.id} className="flex-1 bg-emerald-600 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                                        {reviewingFrId === fr.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />} Approve
                                      </button>
                                      <button onClick={() => setShowReviewNoteFor(fr.id)} className="flex-1 bg-red-50 text-red-600 border border-red-200 py-2.5 rounded-xl text-sm font-bold hover:bg-red-100 transition-all flex items-center justify-center gap-2">
                                        <AlertTriangle className="w-4 h-4" /> Reject
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      <button onClick={() => handleReviewFundRequest(fr.id, 'rejected')} disabled={reviewingFrId === fr.id} className="flex-1 bg-red-600 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-red-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                                        {reviewingFrId === fr.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Reject'}
                                      </button>
                                      <button onClick={() => { setShowReviewNoteFor(null); setReviewNote(''); }} className="flex-1 bg-slate-100 text-slate-600 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-200 transition-all">Cancel</button>
                                    </>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Pending Extension Requests */}
                      {pendingExtensionRequests.length > 0 && (
                        <div>
                          <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2 text-lg">
                            <CalendarClock className="w-5 h-5 text-amber-600" /> Pending Extension Requests
                            <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">{pendingExtensionRequests.length}</span>
                          </h3>
                          <div className="space-y-4">
                            {pendingExtensionRequests.map(ext => (
                              <div key={ext.id} className="bg-white rounded-xl border border-amber-200 overflow-hidden shadow-sm">
                                <div className="bg-amber-50 px-5 py-3 flex justify-between items-start border-b border-amber-200 gap-3">
                                  <div className="min-w-0">
                                    <span className="font-bold text-amber-800">Extension Request ({ext.extension_type === 'with_funding' ? 'Time + Funding' : 'Time Only'})</span>
                                    <p className="text-xs text-amber-600 mt-0.5">Submitted {formatDate(ext.created_at)}</p>
                                  </div>
                                  <div className="text-right shrink-0">
                                    <p className="text-[10px] font-bold text-amber-600 uppercase">New end date</p>
                                    <p className="text-sm font-bold text-amber-800">{formatDate(ext.new_end_date)}</p>
                                  </div>
                                </div>
                                <div className="p-4 space-y-2">
                                  <p className="text-[10px] font-bold uppercase text-slate-500">Reason</p>
                                  <p className="text-sm text-slate-700 whitespace-pre-wrap bg-slate-50 border border-slate-100 rounded-lg p-3">{ext.reason || 'No reason provided.'}</p>
                                </div>
                                {showExtRejectFor === ext.id && (
                                  <div className="px-4 pb-2">
                                    <textarea value={extReviewNote} onChange={(e) => setExtReviewNote(e.target.value)} placeholder="Reason for rejection (required)..." className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-1 focus:ring-red-500 outline-none resize-none h-16" />
                                  </div>
                                )}
                                <div className="px-4 pb-4 flex gap-3">
                                  {showExtRejectFor !== ext.id ? (
                                    <>
                                      <button onClick={() => handleReviewExtension(ext.id, 'approved')} disabled={reviewingExtId === ext.id} className="flex-1 bg-emerald-600 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                                        {reviewingExtId === ext.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />} Approve
                                      </button>
                                      <button onClick={() => { setShowExtRejectFor(ext.id); setExtReviewNote(''); }} className="flex-1 bg-red-50 text-red-600 border border-red-200 py-2.5 rounded-xl text-sm font-bold hover:bg-red-100 transition-all flex items-center justify-center gap-2">Reject</button>
                                    </>
                                  ) : (
                                    <>
                                      <button onClick={() => handleReviewExtension(ext.id, 'rejected')} disabled={reviewingExtId === ext.id || !extReviewNote.trim()} className="flex-1 bg-red-600 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-red-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50">Confirm Reject</button>
                                      <button onClick={() => { setShowExtRejectFor(null); setExtReviewNote(''); }} className="flex-1 bg-slate-100 text-slate-600 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-200 transition-all">Cancel</button>
                                    </>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* History Disclosure */}
                      <div className="space-y-4">
                        {(reviewedFundRequests.length > 0 || reviewedExtensionRequests.length > 0) && (
                          <div className="border border-slate-200 rounded-xl bg-white overflow-hidden shadow-sm">
                            <button onClick={() => setShowFundRequestHistory(!showFundRequestHistory)} className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors">
                              <span className="text-xs font-bold uppercase text-slate-700">Review History</span>
                              {showFundRequestHistory ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                            {showFundRequestHistory && (
                              <div className="border-t divide-y">
                                {reviewedExtensionRequests.map(ext => (
                                  <div key={ext.id} className="p-3 text-xs flex justify-between">
                                    <div><span className={`font-bold uppercase ${ext.status === 'approved' ? 'text-emerald-600' : 'text-red-600'}`}>{ext.status} Extension</span> &middot; {formatDate(ext.reviewed_at || ext.created_at)}</div>
                                    <p className="text-slate-500">New end: {formatDate(ext.new_end_date)}</p>
                                  </div>
                                ))}
                                {reviewedFundRequests.map(fr => (
                                  <div key={fr.id} className="p-3 text-xs flex justify-between">
                                    <div><span className={`font-bold uppercase ${fr.status === 'approved' ? 'text-emerald-600' : 'text-red-600'}`}>{fr.status} Fund</span> &middot; {getPeriodDisplayLabel(fr.year_number, fr.quarterly_report)}</div>
                                    <span className="font-mono">₱{(fr.fund_request_items?.reduce((s, i) => s + i.amount, 0) || 0).toLocaleString()}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Compliance Documents */}
                      <div>
                        <h3 className="font-bold text-slate-700 mb-3 flex items-center gap-2 text-lg">
                          <FileCheck className="w-5 h-5 text-blue-600" /> Compliance Documents
                        </h3>
                        <div className="space-y-3">
                          {[
                            {
                              docKey: 'moa' as const,
                              label: 'Memorandum of Agreement',
                              form: 'DOST Form 5',
                              url: moaFileUrl,
                              status: (rawDetail?.moa_status ?? 'not_uploaded') as ComplianceDocStatus,
                              reviewNote: rawDetail?.moa_review_note ?? null,
                              verifiedAt: rawDetail?.moa_verified_at ?? null,
                            },
                            {
                              docKey: 'agency_certification' as const,
                              label: 'Agency Certification',
                              form: 'DOST Form 4',
                              url: agencyCertFileUrl,
                              status: (rawDetail?.agency_cert_status ?? 'not_uploaded') as ComplianceDocStatus,
                              reviewNote: rawDetail?.agency_cert_review_note ?? null,
                              verifiedAt: rawDetail?.agency_cert_verified_at ?? null,
                            },
                          ].map(doc => {
                            const statusConfig: Record<ComplianceDocStatus, { bg: string; text: string; label: string }> = {
                              not_uploaded: { bg: 'bg-slate-100', text: 'text-slate-500', label: 'Not uploaded' },
                              pending_verification: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Pending your verification' },
                              verified: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Verified' },
                              rejected: { bg: 'bg-red-100', text: 'text-red-700', label: 'Rejected' },
                            };
                            const cfg = statusConfig[doc.status];
                            return (
                              <div
                                key={doc.label}
                                className={`border rounded-xl p-3 ${
                                  doc.status === 'pending_verification' ? 'bg-amber-50 border-amber-200' :
                                  doc.status === 'verified' ? 'bg-emerald-50/50 border-emerald-200' :
                                  doc.status === 'rejected' ? 'bg-red-50 border-red-200' :
                                  doc.url ? 'bg-white' : 'bg-slate-50 border-dashed'
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${doc.url ? 'bg-blue-50 text-blue-600' : 'text-slate-400'}`}>
                                    <FileText className="w-5 h-5" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">{doc.form}</p>
                                    <p className="text-sm font-bold truncate">{doc.label}</p>
                                    <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${cfg.bg} ${cfg.text}`}>
                                      {cfg.label}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    {doc.url && (() => {
                                      const meta = getFileActionMeta(doc.url);
                                      const ActionIcon = meta.Icon;
                                      return (
                                        <button
                                          onClick={() => openSignedUrl(doc.url!)}
                                          className="text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 inline-flex items-center gap-1"
                                          title={meta.title}
                                        >
                                          <ActionIcon className="w-3 h-3" /> {meta.label}
                                        </button>
                                      );
                                    })()}
                                    {doc.status === 'pending_verification' && (() => {
                                      const verifyKey = `${doc.docKey}:verify`;
                                      const rejectKey = `${doc.docKey}:reject`;
                                      const isVerifying = complianceDocAction === verifyKey;
                                      const isRejecting = complianceDocAction === rejectKey;
                                      const anyInFlight = complianceDocAction !== null;
                                      return (
                                        <>
                                          <button
                                            disabled={anyInFlight}
                                            onClick={async () => {
                                              const confirm = await Swal.fire({
                                                title: 'Verify this document?',
                                                text: `Mark ${doc.label} as verified. The proponent will be able to submit fund requests against it.`,
                                                icon: 'question',
                                                showCancelButton: true,
                                                confirmButtonText: 'Verify',
                                                confirmButtonColor: '#059669',
                                              });
                                              if (!confirm.isConfirmed) return;
                                              setComplianceDocAction(verifyKey);
                                              try {
                                                await verifyProjectDocument(rawDetail!.id, doc.docKey);
                                                await loadDetails();
                                                Swal.fire({ icon: 'success', title: 'Verified', timer: 1500, showConfirmButton: false });
                                              } catch (err: any) {
                                                Swal.fire('Error', err?.response?.data?.message || 'Failed to verify document.', 'error');
                                              } finally {
                                                setComplianceDocAction(null);
                                              }
                                            }}
                                            className="text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 rounded-lg inline-flex items-center gap-1 disabled:opacity-60 disabled:cursor-not-allowed"
                                          >
                                            {isVerifying ? <Loader2 className="w-3 h-3 animate-spin" /> : <ShieldCheck className="w-3 h-3" />}
                                            {isVerifying ? 'Verifying…' : 'Verify'}
                                          </button>
                                          <button
                                            disabled={anyInFlight}
                                            onClick={async () => {
                                              const { value: note } = await Swal.fire({
                                                title: 'Reject this document',
                                                text: `Explain what's wrong so the proponent can fix and re-upload.`,
                                                input: 'textarea',
                                                inputLabel: 'Reason (min. 10 characters)',
                                                inputPlaceholder: 'e.g., "Signature page missing" or "Uploaded file is blank"',
                                                showCancelButton: true,
                                                confirmButtonText: 'Reject',
                                                confirmButtonColor: '#dc2626',
                                                inputValidator: (value) => {
                                                  if (!value || value.trim().length < 10) return 'Please provide at least 10 characters.';
                                                  return null;
                                                },
                                              });
                                              if (!note) return;
                                              setComplianceDocAction(rejectKey);
                                              try {
                                                await rejectProjectDocument(rawDetail!.id, doc.docKey, note.trim());
                                                await loadDetails();
                                                Swal.fire({ icon: 'success', title: 'Rejected', text: 'Proponent has been notified.', timer: 1800, showConfirmButton: false });
                                              } catch (err: any) {
                                                Swal.fire('Error', err?.response?.data?.message || 'Failed to reject document.', 'error');
                                              } finally {
                                                setComplianceDocAction(null);
                                              }
                                            }}
                                            className="text-xs font-bold text-white bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded-lg inline-flex items-center gap-1 disabled:opacity-60 disabled:cursor-not-allowed"
                                          >
                                            {isRejecting ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />}
                                            {isRejecting ? 'Rejecting…' : 'Reject'}
                                          </button>
                                        </>
                                      );
                                    })()}
                                  </div>
                                </div>
                                {doc.status === 'verified' && doc.verifiedAt && (
                                  <p className="text-[11px] text-emerald-700 mt-2 font-medium">
                                    Verified on {new Date(doc.verifiedAt).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })}
                                  </p>
                                )}
                                {doc.status === 'rejected' && doc.reviewNote && (
                                  <div className="mt-3 p-2.5 bg-white border border-red-200 rounded-md">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-red-700 mb-1">
                                      Your rejection note
                                    </p>
                                    <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">{doc.reviewNote}</p>
                                  </div>
                                )}
                              </div>
                            );
                          })}

                          {/* Form 3 Work & Financial Plan — read-only reference, no verification flow. */}
                          {workPlanFileUrl && (
                            <div className="border rounded-xl p-3 flex items-center gap-3 bg-white">
                              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-blue-50 text-blue-600 flex-shrink-0">
                                <FileText className="w-5 h-5" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-[10px] font-bold text-slate-400 uppercase">DOST Form 3</p>
                                <p className="text-sm font-bold truncate">Work & Financial Plan</p>
                                <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600">
                                  Reference only
                                </span>
                              </div>
                              {(() => {
                                const meta = getFileActionMeta(workPlanFileUrl);
                                const ActionIcon = meta.Icon;
                                return (
                                  <button onClick={() => openSignedUrl(workPlanFileUrl)} title={meta.title} className="text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 inline-flex items-center gap-1">
                                    <ActionIcon className="w-3 h-3" /> {meta.label}
                                  </button>
                                );
                              })()}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Quarterly Reports */}
                      <div>
                        <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2 text-lg">
                          <FileText className="w-5 h-5 text-blue-600" /> Quarterly Reports
                        </h3>
                        <div className="space-y-4">{details.reports.map(renderReportItem)}</div>
                      </div>

                      {/* Terminal Report */}
                      {allQuartersVerified && terminalReport && (
                        <div className={`rounded-xl border p-5 ${terminalReport.status === 'verified' ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
                          <div className="flex justify-between items-center mb-3">
                            <h3 className="font-bold text-slate-700 flex items-center gap-2"><FileText className="w-5 h-5" /> Terminal Report</h3>
                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${terminalReport.status === 'verified' ? 'bg-green-200 text-green-800' : 'bg-amber-200 text-amber-800'}`}>{terminalReport.status === 'verified' ? 'Verified' : 'Pending Verification'}</span>
                          </div>
                          <div className="space-y-2 text-sm">
                            {terminalReport.actual_start_date && <p><span className="font-medium">Duration:</span> {terminalReport.actual_start_date} to {terminalReport.actual_end_date}</p>}
                            <p className="whitespace-pre-wrap text-xs bg-white/60 p-2 rounded-lg max-h-32 overflow-y-auto">{terminalReport.accomplishments}</p>
                          </div>
                          {/* Previously-returned context on a resubmitted terminal report. */}
                          {terminalReport.status === 'submitted' && terminalReport.review_note && (
                            <div className="mt-3 flex items-start gap-2 text-xs bg-amber-50 p-3 rounded-lg border border-amber-200">
                              <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-amber-800">Previously returned — resubmitted with revisions</p>
                                <p className="text-amber-700 italic mt-0.5">"{terminalReport.review_note}"</p>
                              </div>
                            </div>
                          )}
                          {terminalReport.status === 'submitted' && (
                            <div className="mt-4 space-y-3">
                              {rejectingTerminal && (
                                <div>
                                  <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                                    Reason for returning (required)
                                  </label>
                                  <textarea
                                    value={terminalRejectNote}
                                    onChange={(e) => setTerminalRejectNote(e.target.value)}
                                    placeholder="Explain what needs revision (this message is sent to the proponent)"
                                    className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-1 focus:ring-red-500 outline-none resize-none h-20"
                                  />
                                </div>
                              )}
                              <div className="flex gap-2">
                                {!rejectingTerminal ? (
                                  <>
                                    <button
                                      onClick={async () => { setVerifyingTerminal(true); try { const updated = await verifyTerminalReport(terminalReport.id); setTerminalReport(updated); Swal.fire('Verified', 'Success', 'success'); } catch { Swal.fire('Error', 'Failed', 'error'); } finally { setVerifyingTerminal(false); } }}
                                      disabled={verifyingTerminal}
                                      className="flex-1 py-2.5 bg-blue-600 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-md hover:bg-blue-700 transition-all disabled:opacity-50"
                                    >
                                      {verifyingTerminal ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle className="w-4 h-4" /> Verify Terminal Report</>}
                                    </button>
                                    <button
                                      onClick={() => { setRejectingTerminal(true); setTerminalRejectNote(''); }}
                                      className="flex-1 py-2.5 bg-red-50 text-red-600 border border-red-200 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-red-100 transition-all"
                                    >
                                      <AlertTriangle className="w-4 h-4" /> Return for Revision
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      onClick={handleRejectTerminal}
                                      disabled={submittingTerminalReject || !terminalRejectNote.trim()}
                                      className="flex-1 py-2.5 bg-red-600 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 hover:bg-red-700 transition-all disabled:opacity-50"
                                    >
                                      {submittingTerminalReject ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Return'}
                                    </button>
                                    <button
                                      onClick={() => { setRejectingTerminal(false); setTerminalRejectNote(''); }}
                                      className="flex-1 py-2.5 bg-slate-100 text-slate-600 font-bold rounded-xl text-sm hover:bg-slate-200 transition-all"
                                    >
                                      Cancel
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          )}
                          {terminalReport.status === 'rejected' && (
                            <div className="mt-3 border border-red-200 bg-red-50 rounded-lg p-3 text-xs">
                              <p className="font-bold text-red-800 mb-1 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" /> Returned to proponent
                              </p>
                              {terminalReport.review_note && (
                                <p className="text-red-700 italic">"{terminalReport.review_note}"</p>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {allQuartersVerified && !terminalReport && (
                        <div className="rounded-xl border bg-gray-50 p-5 text-center text-sm text-gray-500 italic">Waiting for terminal report submission.</div>
                      )}

                      {/* Financial Report Button */}
                      <button onClick={() => setShowFinancialReport(true)} className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 font-semibold rounded-xl border border-emerald-200 text-xs hover:bg-emerald-100 transition-colors"><DollarSign className="w-4 h-4" /> View Detailed Financial Statement</button>

                      {/* Certificate Generation */}
                      {allQuartersVerified && terminalReport?.status === 'verified' && (
                        <div className="bg-gradient-to-r from-emerald-50 to-blue-50 rounded-xl border border-emerald-200 p-6 text-center shadow-sm">
                          <Award className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
                          <h3 className="text-lg font-bold text-emerald-800">Ready for Certificate</h3>
                          <p className="text-sm text-emerald-600 mb-4">You can now issue the certificate of completion.</p>
                          <button onClick={handleGenerateCertificate} disabled={issuingCertificate} className="px-8 py-3 bg-emerald-600 text-white font-bold rounded-xl shadow-lg hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 mx-auto">{issuingCertificate ? 'Issuing...' : 'Issue Certificate of Completion'}</button>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* RIGHT COLUMN */}
                <div className="lg:w-80 bg-white border-l border-slate-200 p-6 overflow-y-auto space-y-6 shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.05)]">
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2"><DollarSign className="w-4 h-4" /> Financial Overview</h4>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <p className="text-xs text-slate-500 mb-1">Total Budget</p>
                      <p className="text-2xl font-bold text-slate-900">₱{totalBudget.toLocaleString()}</p>
                    </div>
                    {totalBudget > 0 && (
                      <div className="space-y-3 pt-2">
                        <div>
                          <div className="flex justify-between text-xs mb-1"><span className="text-slate-500">Utilized</span><span className="font-bold text-blue-600">₱{totalUsed.toLocaleString()}</span></div>
                          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-blue-500" style={{ width: `${(totalUsed / totalBudget) * 100}%` }}></div></div>
                        </div>
                        <div>
                          <div className="flex justify-between text-xs mb-1"><span className="text-slate-500">Remaining</span><span className={`font-bold ${remainingBudget === 0 ? 'text-gray-400' : 'text-emerald-600'}`}>₱{remainingBudget.toLocaleString()}</span></div>
                          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-emerald-500" style={{ width: `${(remainingBudget / totalBudget) * 100}%` }}></div></div>
                        </div>
                        {totalPending > 0 && (
                          <div>
                            <div className="flex justify-between text-xs mb-1"><span className="text-slate-500">Pending</span><span className="font-bold text-amber-600">₱{totalPending.toLocaleString()}</span></div>
                            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-amber-400" style={{ width: `${(totalPending / totalBudget) * 100}%` }}></div></div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="h-px bg-slate-100"></div>
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2"><Users className="w-4 h-4" /> Leadership</h4>
                    <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 overflow-hidden border border-blue-100">
                        {project?.proponentProfilePicture ? (
                          <SecureImage 
                            src={project.proponentProfilePicture} 
                            alt={project.principalInvestigator}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-5 h-5" />
                        )}
                      </div>
                      <div><p className="text-sm font-bold text-slate-800">{project?.principalInvestigator}</p><p className="text-xs text-slate-500">Project Leader</p></div>
                    </div>
                  </div>
                  <div className="h-px bg-slate-100"></div>
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2"><Calendar className="w-4 h-4" /> Timeline</h4>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                      <div className="flex items-start gap-3"><div className="w-2 h-2 mt-1.5 rounded-full bg-emerald-500"></div><div><p className="text-xs text-slate-500">Start Date</p><p className="text-sm font-bold">{formatDate(project?.startDate)}</p></div></div>
                      <div className="flex items-start gap-3"><div className={`w-2 h-2 mt-1.5 rounded-full ${project?.status === 'Completed' ? 'bg-blue-500' : 'bg-red-500'}`}></div><div><p className="text-xs text-slate-500">Target End</p><p className="text-sm font-bold">{formatDate(project?.endDate)}</p></div></div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* --- FOOTER --- */}
          <div className="p-4 sm:p-6 border-t border-slate-200 bg-slate-50 flex justify-end">
            <button onClick={onClose} className="px-6 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 shadow-sm transition-all">Close</button>
          </div>

          {showFinancialReport && project && (
            <FinancialReportModal
              fundedProjectId={project.backendId!}
              projectTitle={project.title}
              onClose={() => setShowFinancialReport(false)}
            />
          )}
        </div>
      </div>
    </>
  );
};

export default RnDProjectDetailModal;
