import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import {
  FaChartLine
} from 'react-icons/fa';
import {
  Search, Target, Clock, CheckCircle2, Play,
  FileText, Calendar, AlertTriangle,
  X, Banknote, ArrowLeft, CalendarClock, History, PieChart,
  Plus, Trash2, Award, Download,
  Users, CalendarCheck, ChevronLeft, ChevronRight, UserCheck,
  ChevronUp, ChevronDown, DollarSign, Lock, Loader2, Mail, Check
} from 'lucide-react';
import Swal from 'sweetalert2';
import { openSignedUrl } from '../../../utils/signed-url';
import TeamMembersSection from '../../../components/proponent-component/TeamMembersSection';
import { useAuthContext, isExternalAccount } from '../../../context/AuthContext';
import { supabase as supabaseClient } from '../../../config/supabaseClient';
import {
  fetchFundedProjects,
  fetchProjectDetail,
  fetchFundRequests,
  fetchBudgetSummary,
  createFundRequest,
  submitQuarterlyReport,
  transformToProject,
  buildDisplayReports,
  uploadReportFile,
  validateReportFile,
  REPORT_ALLOWED_EXTENSIONS,
  fetchRealignments,
  fetchActiveBudgetVersion,
  requestProjectExtension,
  type ApiFundedProject,
  type ApiFundRequest,
  type ApiBudgetSummary,
  type RealignmentRecord,
  type BudgetItemDto,
  groupProofFiles,
} from '../../../services/ProjectMonitoringApi';
import { RealignmentFormModal } from '../../../components/proponent-component/RealignmentFormModal';
import TerminalReportSection from '../../../components/proponent-component/TerminalReportSection';
import FinancialReportModal from '../../../components/proponent-component/FinancialReportModal';
import {
  fetchPendingInvitations,
  respondToInvitation,
  type PendingInvitation,
} from '../../../services/ProjectMemberApi';
import { type Project } from '../../../types/InterfaceProject';
import { formatDate } from "../../../utils/date-formatter";
import { generateCertificatePDF } from "../../../utils/certificate-generator";
import PageLoader from "../../../components/shared/PageLoader";
import SkeletonPulse from "../../../components/shared/SkeletonPulse";



// --- Types ---
type ReportStatus = 'fund_request' | 'due' | 'submitted' | 'approved' | 'overdue' | 'locked';

interface FundRequestItem {
  id: string;
  // Phase 4 of LIB feature: links the fund-request line to a specific budget line. Set
  // by the dropdown picker. Category + description are derived from the linked item
  // (and the server re-derives them on save so the client copy is informational only).
  budget_item_id: number | null;
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
  expenses: { id: string; description: string; amount: number; approvedAmount: number | null }[];
}



const ALL_QUARTERS = ['q1_report', 'q2_report', 'q3_report', 'q4_report'];
const QUARTER_LABELS: Record<string, string> = {
  q1_report: 'Q1', q2_report: 'Q2', q3_report: 'Q3', q4_report: 'Q4',
};

const MonitoringPage: React.FC = () => {
  const { user } = useAuthContext();

  const location = useLocation();
  const incomingProposalId = (location.state as any)?.proposalId as string | undefined;

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
  const [budgetSummary, setBudgetSummary] = useState<ApiBudgetSummary | null>(null);
  const [quarters, setQuarters] = useState<QuarterData[]>([]);
  const [totalBudget, setTotalBudget] = useState(0);
  const [certificateInfo, setCertificateInfo] = useState<{ issuedAt: string | null; issuedByName: string | null }>({ issuedAt: null, issuedByName: null });
  const [rawProjectDetail, setRawProjectDetail] = useState<any>(null);

  // Fund request form
  const [breakdownItems, setBreakdownItems] = useState<FundRequestItem[]>([]);
  const [submittingFundRequest, setSubmittingFundRequest] = useState(false);

  // Report form
  const [submittingReport, setSubmittingReport] = useState(false);
  const [reportFile, setReportFile] = useState<File | null>(null);
  const [terminalReportFile, setTerminalReportFile] = useState<File | null>(null);
  const [receiptFiles, setReceiptFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);

  // Liquidation draft state
  interface LiquidationDraft {
    fund_request_item_id: number;
    item_name: string;
    category: string;
    approved_amount: number;
    selected: boolean;
    actual_amount: string;
  }
  const [liquidationDraft, setLiquidationDraft] = useState<LiquidationDraft[]>([]);

  // Extension & additional fund modals
  const [isExtensionModalOpen, setIsExtensionModalOpen] = useState(false);
  const [extensionReason, setExtensionReason] = useState('');
  const [extensionDate, setExtensionDate] = useState('');
  const [extensionType, setExtensionType] = useState<'time_only' | 'with_funding'>('time_only');

  // Financial report modal
  const [showFinancialReport, setShowFinancialReport] = useState(false);

  // Pending co-lead invitations
  const [pendingInvitations, setPendingInvitations] = useState<PendingInvitation[]>([]);
  const [respondingInvitationId, setRespondingInvitationId] = useState<number | null>(null);

  // Phase 3 of LIB feature: budget realignment state
  const [showRealignmentModal, setShowRealignmentModal] = useState(false);
  const [activeRealignment, setActiveRealignment] = useState<RealignmentRecord | null>(null);
  const [realignmentHistory, setRealignmentHistory] = useState<RealignmentRecord[]>([]);
  const [showBudgetHistory, setShowBudgetHistory] = useState(false);

  // Phase 4 of LIB feature: active budget items for the fund-request dropdown
  const [budgetItemsForProject, setBudgetItemsForProject] = useState<BudgetItemDto[]>([]);

  // External-collaborator email binding: when an external co-lead wants to upgrade to a
  // full internal account, they enter their new @wmsu.edu.ph email here. Supabase sends a
  // verification link; after they click it and log back in, the authorizer auto-upgrades
  // their account_type.
  const isExternalUser = isExternalAccount(user);
  const [showLinkEmailModal, setShowLinkEmailModal] = useState(false);
  const [linkEmailInput, setLinkEmailInput] = useState('');
  const [linkEmailSubmitting, setLinkEmailSubmitting] = useState(false);

  // --- Load Projects ---
  useEffect(() => {
    loadProjects();
    loadPendingInvitations();
  }, []);

  const loadPendingInvitations = async () => {
    try {
      const invitations = await fetchPendingInvitations();
      setPendingInvitations(invitations);
    } catch (error) {
      console.error('Error loading pending invitations:', error);
    }
  };

  const handleRespondToInvitation = async (
    invitation: PendingInvitation,
    action: 'accept' | 'decline'
  ) => {
    if (action === 'decline') {
      const confirm = await Swal.fire({
        icon: 'warning',
        title: 'Decline invitation?',
        text: 'You will not be added as a co-lead. The project lead can re-invite you later if this was a mistake.',
        showCancelButton: true,
        confirmButtonText: 'Decline',
        cancelButtonText: 'Cancel',
        confirmButtonColor: '#C8102E',
      });
      if (!confirm.isConfirmed) return;
    }

    // If the user holds an R&D / evaluator / admin role, warn them that
    // accepting locks them out of approval/verification/certification
    // actions for this project (separation of duties).
    if (action === 'accept') {
      const staffRoles = ['rnd', 'evaluator', 'admin'];
      const userStaffRoles = (user?.roles || []).filter((r) => staffRoles.includes(r));
      if (userStaffRoles.length > 0) {
        const confirm = await Swal.fire({
          icon: 'warning',
          title: 'Heads up — conflict of interest',
          html: `Because you hold the <b>${userStaffRoles.join(', ')}</b> role, accepting this invitation means:<br/><br/>
            <ul style="text-align:left;display:inline-block;margin:0;padding-left:1.2em;">
              <li>You <b>cannot</b> approve or reject fund requests for this project</li>
              <li>You <b>cannot</b> verify quarterly reports for this project</li>
              <li>You <b>cannot</b> issue the completion certificate</li>
              <li>You <b>cannot</b> change this project's status</li>
            </ul>
            <br/>Another R&D officer or admin will need to handle those actions. Continue?`,
          showCancelButton: true,
          confirmButtonText: 'Accept anyway',
          cancelButtonText: 'Cancel',
          confirmButtonColor: '#C8102E',
        });
        if (!confirm.isConfirmed) return;
      }
    }

    try {
      setRespondingInvitationId(invitation.id);
      await respondToInvitation(invitation.id, action);

      setPendingInvitations((prev) => prev.filter((inv) => inv.id !== invitation.id));

      if (action === 'accept') {
        await loadProjects();
        setActiveProjectId(String(invitation.funded_project_id));
        setShowMobileDetail(true);
        await Swal.fire({
          icon: 'success',
          title: 'Invitation accepted',
          text: 'You are now a co-lead on this project.',
          timer: 2000,
          showConfirmButton: false,
        });
      } else {
        await Swal.fire({
          icon: 'success',
          title: 'Invitation declined',
          timer: 1500,
          showConfirmButton: false,
        });
      }
    } catch (error: any) {
      const msg = error.response?.data?.message || error.message || 'Failed to respond to invitation.';
      Swal.fire({ icon: 'error', title: 'Error', text: msg, confirmButtonColor: '#C8102E' });
    } finally {
      setRespondingInvitationId(null);
    }
  };

  const loadProjects = async () => {
    try {
      setLoading(true);
      const data = await fetchFundedProjects('proponent');
      setBackendProjects(data);
      const mapped = data.map(transformToProject);
      setProjects(mapped);

      // If navigated from DetailedProposalModal with a proposalId, auto-select that project
      if (incomingProposalId) {
        const match = data.find(fp => String(fp.proposal_id) === String(incomingProposalId));
        if (match) {
          setActiveProjectId(String(match.id));
          setShowMobileDetail(true);
          return;
        }
      }

      // Default: select first project
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
        fetchFundRequests(activeBackend.id).catch((err) => {
          console.error('Error loading fund requests:', err);
          return { fund_requests: [] as ApiFundRequest[], budget_summary: null };
        }),
        fetchBudgetSummary(activeBackend.id).catch(() => null),
      ]);
      setBudgetSummary(frResponse.budget_summary || bs);

      // Build quarters from detail + fund requests
      const displayData = buildDisplayReports(detail, user?.id || '');
      setTotalBudget(displayData.totalBudget);
      setCertificateInfo({ issuedAt: displayData.certificateIssuedAt, issuedByName: displayData.certificateIssuedByName });
      setRawProjectDetail(detail);

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
          else if (fr.status === 'pending') status = 'fund_request'; // waiting for approval
          else if (fr.status === 'rejected') status = 'fund_request'; // need to re-request
          else status = 'overdue';
        } else {
          // "Due" status
          if (!fr) status = 'fund_request';
          else if (fr.status === 'approved') status = 'due';
          else if (fr.status === 'pending') status = 'fund_request'; // keeping it as fund_request so isEditable is false, but we can detect isFundRequestPending
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
        };
      });

      setQuarters(builtQuarters);

      // Auto-navigate to the first actionable quarter
      const firstActionable = builtQuarters.findIndex(
        q => q.status === 'fund_request' || q.status === 'due' || q.status === 'overdue' || q.status === 'submitted'
      );
      setCurrentReportIndex(firstActionable >= 0 ? firstActionable : 0);
    } catch (error: any) {
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

  // Phase 3 of LIB feature: load any pending realignment for the active project so the UI
  // can show a banner + lock the Request Realignment button. Also keeps the full history
  // list in sync for the Budget History panel (Phase 4).
  const loadActiveRealignment = useCallback(async () => {
    if (!activeBackend) {
      setActiveRealignment(null);
      setRealignmentHistory([]);
      return;
    }
    try {
      const all = await fetchRealignments({ fundedProjectId: activeBackend.id });
      setRealignmentHistory(all);
      const pending =
        all.find((r) => r.status === 'pending_review' || r.status === 'revision_requested') ??
        null;
      setActiveRealignment(pending);
    } catch (err) {
      console.error('Failed to load realignment status', err);
      setActiveRealignment(null);
      setRealignmentHistory([]);
    }
  }, [activeBackend?.id]);

  useEffect(() => {
    loadActiveRealignment();
  }, [loadActiveRealignment]);

  // Phase 4 of LIB feature: load the active budget items so the fund-request form can
  // drive its dropdown. This is a separate request from the budget summary (which only
  // has totals) — we want per-item metadata for the picker.
  const loadBudgetItems = useCallback(async () => {
    if (!activeBackend) {
      setBudgetItemsForProject([]);
      return;
    }
    try {
      const res = await fetchActiveBudgetVersion(activeBackend.id);
      setBudgetItemsForProject(res.version.items ?? []);
    } catch (err) {
      console.error('Failed to load active budget items', err);
      setBudgetItemsForProject([]);
    }
  }, [activeBackend?.id]);

  useEffect(() => {
    loadBudgetItems();
  }, [loadBudgetItems]);

  // External-collaborator → WMSU email binding. Calls Supabase's built-in email change
  // endpoint (sends a verification link to the new address). Once confirmed and the user
  // logs back in, the backend authorizer auto-upgrades account_type from external → internal.
  const handleLinkWmsuEmail = async () => {
    const raw = linkEmailInput.trim().toLowerCase();
    if (!raw) {
      Swal.fire({ icon: 'warning', title: 'Email required', text: 'Enter your WMSU email address.' });
      return;
    }
    if (!raw.endsWith('@wmsu.edu.ph')) {
      Swal.fire({
        icon: 'warning',
        title: 'WMSU email required',
        text: 'The new email must end with @wmsu.edu.ph. That domain is how the system recognizes WMSU employees and students.',
      });
      return;
    }

    const confirm = await Swal.fire({
      icon: 'question',
      title: 'Link this email?',
      html: `<p>We'll send a verification link to <strong>${raw}</strong>. After you click it, log back in with the new email to unlock the full proponent UI.</p>`,
      showCancelButton: true,
      confirmButtonText: 'Send verification link',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#C8102E',
      reverseButtons: true,
    });
    if (!confirm.isConfirmed) return;

    setLinkEmailSubmitting(true);
    try {
      const { error } = await supabaseClient.auth.updateUser({ email: raw });
      if (error) {
        Swal.fire({
          icon: 'error',
          title: 'Could not link email',
          text:
            error.message ||
            'Supabase rejected the email change. If this email already has an SPMAMS account, contact admin for help.',
        });
        return;
      }
      setShowLinkEmailModal(false);
      setLinkEmailInput('');
      Swal.fire({
        icon: 'success',
        title: 'Check your WMSU inbox',
        html:
          '<p>We sent a verification link to your new email.</p>' +
          '<p style="margin-top:8px;">Click the link, then log back in with your WMSU email to unlock full proponent access.</p>',
        confirmButtonColor: '#C8102E',
      });
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Unexpected error', text: err?.message || 'Try again later.' });
    } finally {
      setLinkEmailSubmitting(false);
    }
  };

  // Phase 4 of LIB feature: refetch realignment + budget items when the tab regains focus so
  // a proponent who had the page open while R&D approved/revised their request sees the fresh
  // state without needing a hard refresh. Keeps the fund-request dropdown in sync with any
  // version flip that happened in the background.
  useEffect(() => {
    if (!activeBackend) return;
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return;
      loadActiveRealignment();
      loadBudgetItems();
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
    };
  }, [activeBackend, loadActiveRealignment, loadBudgetItems]);

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
  const totalApproved = budgetSummary?.total_approved ?? 0;
  const totalPending = budgetSummary?.total_pending ?? 0;
  const remaining = budgetSummary?.remaining ?? (totalBudget - totalApproved);
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
      const items = breakdownItems.map((item) => ({
        budget_item_id: item.budget_item_id,
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

  // Reset file state and initialize liquidation draft when quarter changes
  useEffect(() => {
    setReportFile(null);
    setTerminalReportFile(null);
    setReceiptFiles([]);
    setUploadProgress(null);

    // Initialize liquidation draft from approved fund request items
    const report = quarters[currentReportIndex];
    if (report?.fundRequest?.status === 'approved' && report.fundRequest.fund_request_items) {
      setLiquidationDraft(
        report.fundRequest.fund_request_items.map((item) => ({
          fund_request_item_id: item.id,
          item_name: item.item_name,
          category: item.category,
          approved_amount: item.amount,
          selected: true,
          actual_amount: String(item.amount),
        }))
      );
    } else {
      setLiquidationDraft([]);
    }
  }, [currentReportIndex, quarters]);

  const handleSubmitReport = async () => {
    if (!activeBackend || !currentReport || !user) return;

    if (localProgress <= prevReportProgress && localProgress !== 100) {
      Swal.fire('Update Progress', 'Please update the progress percentage.', 'warning');
      return;
    }

    // Validate liquidation entries
    const selectedItems = liquidationDraft.filter(i => i.selected);
    for (const item of selectedItems) {
      const actual = parseFloat(item.actual_amount);
      if (isNaN(actual) || actual < 0) {
        Swal.fire('Invalid Amount', `Please enter a valid amount for "${item.item_name}".`, 'warning');
        return;
      }
      if (actual > item.approved_amount) {
        Swal.fire('Amount Exceeded', `Actual amount for "${item.item_name}" cannot exceed the approved amount of ${formatCurrency(item.approved_amount)}.`, 'warning');
        return;
      }
    }

    try {
      setSubmittingReport(true);

      // Upload files to S3 first, tagged with type prefixes for identification
      const fileUrls: string[] = [];

      if (reportFile) {
        setUploadProgress('Uploading quarterly report...');
        const tagged = new File([reportFile], `QR__${reportFile.name}`, { type: reportFile.type });
        const url = await uploadReportFile(tagged);
        fileUrls.push(url);
      }

      if (terminalReportFile) {
        setUploadProgress('Uploading terminal report...');
        const tagged = new File([terminalReportFile], `TR__${terminalReportFile.name}`, { type: terminalReportFile.type });
        const url = await uploadReportFile(tagged);
        fileUrls.push(url);
      }

      for (let i = 0; i < receiptFiles.length; i++) {
        setUploadProgress(`Uploading receipt ${i + 1} of ${receiptFiles.length}...`);
        const tagged = new File([receiptFiles[i]], `RC${i + 1}__${receiptFiles[i].name}`, { type: receiptFiles[i].type });
        const url = await uploadReportFile(tagged);
        fileUrls.push(url);
      }

      setUploadProgress('Submitting report...');

      // Build liquidation payload from draft
      const liquidations = liquidationDraft
        .filter(i => i.selected)
        .map(i => ({
          fund_request_item_id: i.fund_request_item_id,
          actual_amount: parseFloat(i.actual_amount),
        }));

      await submitQuarterlyReport(
        activeBackend.id,
        currentReport.quarter,
        localProgress,
        undefined,
        fileUrls.length > 0 ? fileUrls : undefined,
        liquidations
      );

      // Reset file state
      setReportFile(null);
      setTerminalReportFile(null);
      setReceiptFiles([]);
      setUploadProgress(null);
      setLiquidationDraft([]);

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

  // --- Breakdown item handlers ---
  const addBreakdownItem = () => {
    setBreakdownItems((prev) => [
      ...prev,
      { id: Date.now().toString(), budget_item_id: null, description: '', amount: 0, category: 'mooe' },
    ]);
  };
  const updateBreakdownItem = (itemId: string, field: keyof FundRequestItem, value: any) => {
    setBreakdownItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, [field]: value } : item)),
    );
  };
  // Phase 4 of LIB feature: linking a fund-request row to a budget item pulls its
  // category + display label from the selected item, so the proponent doesn't have to
  // type anything except the amount.
  const linkBreakdownItemToBudgetLine = (rowId: string, budgetItemId: number | null) => {
    const budgetItem = budgetItemId != null ? budgetItemsForProject.find((it) => it.id === budgetItemId) : null;
    setBreakdownItems((prev) =>
      prev.map((row) => {
        if (row.id !== rowId) return row;
        if (!budgetItem) {
          return { ...row, budget_item_id: null };
        }
        const label = budgetItem.item_name + (budgetItem.spec ? ` (${budgetItem.spec})` : '');
        return {
          ...row,
          budget_item_id: budgetItem.id ?? null,
          description: label,
          category: budgetItem.category,
        };
      }),
    );
  };
  const removeBreakdownItem = (itemId: string) => {
    setBreakdownItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  const handleDownloadCertificate = async () => {
    if (!activeProject) return;
    try {
      await generateCertificatePDF({
        projectTitle: activeProject.title,
        programTitle: rawProjectDetail?.proposal?.program_title || undefined,
        projectLeader: activeProject.principalInvestigator,
        department: activeProject.department,
        startDate: activeProject.startDate,
        endDate: activeProject.endDate,
        totalBudget: totalBudget,
        issuedAt: certificateInfo.issuedAt || new Date().toISOString(),
        issuedByName: certificateInfo.issuedByName || 'R&D Office',
      });
    } catch (err) {
      console.error('Failed to generate certificate PDF:', err);
      Swal.fire('Error', 'Failed to generate certificate PDF.', 'error');
    }
  };

  // --- Filtered projects ---
  const filteredProjects = projects.filter(p =>
    (filterStatus === 'all' || p.status.toLowerCase() === filterStatus) &&
    p.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- Loading ---


  if (loading && projects.length === 0) {
    return <PageLoader mode="proponent-monitoring" />;
  }

  return (
    <div className="min-h-screen px-5 sm:px-8 lg:px-10 xl:px-12 2xl:px-16 py-8 lg:py-10 bg-gradient-to-br from-slate-50 to-slate-100 animate-fade-in">

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
          <div className="bg-emerald-50 shadow-xl rounded-2xl border border-emerald-300 p-4 transition-all duration-300 hover:shadow-lg hover:scale-105 group cursor-pointer flex justify-between items-center">
            <div><p className="text-xs font-semibold text-slate-700 mb-2">Active Projects</p><p className="text-3xl font-bold text-emerald-600 tabular-nums">{projects.filter(p => p.status === 'Active').length}</p></div>
            <Play className="w-8 h-8 text-emerald-500 group-hover:scale-110 transition-transform duration-300" />
          </div>
          <div className="bg-amber-50 shadow-xl rounded-2xl border border-amber-300 p-4 transition-all duration-300 hover:shadow-lg hover:scale-105 group cursor-pointer flex justify-between items-center">
            <div><p className="text-xs font-semibold text-slate-700 mb-2">Delayed</p><p className="text-3xl font-bold text-amber-600 tabular-nums">{projects.filter(p => p.status === 'Delayed').length}</p></div>
            <AlertTriangle className="w-8 h-8 text-amber-500 group-hover:scale-110 transition-transform duration-300" />
          </div>
          <div className="bg-blue-50 shadow-xl rounded-2xl border border-blue-300 p-4 transition-all duration-300 hover:shadow-lg hover:scale-105 group cursor-pointer flex justify-between items-center">
            <div><p className="text-xs font-semibold text-slate-700 mb-2">Completed</p><p className="text-3xl font-bold text-blue-600 tabular-nums">{projects.filter(p => p.status === 'Completed').length}</p></div>
            <CheckCircle2 className="w-8 h-8 text-blue-500 group-hover:scale-110 transition-transform duration-300" />
          </div>
        </div>
      </header>

      {/* --- PENDING CO-LEAD INVITATIONS --- */}
      {pendingInvitations.length > 0 && (
        <section className="mb-8">
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-amber-200 bg-amber-100/50">
              <div className="p-2 bg-amber-500 rounded-lg shadow-sm">
                <Mail className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-amber-900 text-sm">
                  {pendingInvitations.length} Pending Co-Lead Invitation{pendingInvitations.length === 1 ? '' : 's'}
                </h3>
                <p className="text-xs text-amber-700">Review and respond to project invitations from other proponents.</p>
              </div>
            </div>
            <ul className="divide-y divide-amber-100">
              {pendingInvitations.map((invitation) => {
                const inviterName = invitation.inviter
                  ? `${invitation.inviter.first_name} ${invitation.inviter.last_name}`.trim() || invitation.inviter.email
                  : 'A project lead';
                const projectTitle = invitation.funded_project?.proposal?.project_title || 'Untitled project';
                const isResponding = respondingInvitationId === invitation.id;
                return (
                  <li key={invitation.id} className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 line-clamp-1">{projectTitle}</p>
                      <p className="text-xs text-gray-600 mt-0.5">
                        Invited by <span className="font-medium text-gray-800">{inviterName}</span>
                        <span className="text-gray-400"> · {formatDate(invitation.invited_at)}</span>
                      </p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => handleRespondToInvitation(invitation, 'accept')}
                        disabled={isResponding}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isResponding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                        Accept
                      </button>
                      <button
                        onClick={() => handleRespondToInvitation(invitation, 'decline')}
                        disabled={isResponding}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 text-xs font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <X className="w-3.5 h-3.5" />
                        Decline
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      )}

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
          <div className="flex-1 overflow-y-auto p-3 space-y-2 relative">
            {/* If not loading and no projects found */}
            {!loading && filteredProjects.length === 0 && (
              <p className="text-center text-sm text-gray-400 py-8">No projects found.</p>
            )}

            {loading ? (
              [1, 2, 3, 4, 5, 6].map((idx) => (
                <div key={idx} className="w-full p-4 rounded-xl border border-slate-100 bg-white space-y-2 shadow-sm">
                  <SkeletonPulse className="h-4 w-3/4 rounded" />
                  <SkeletonPulse className="h-3 w-1/2 rounded opacity-50" />
                </div>
              ))
            ) : filteredProjects.map((project) => (
              <button
                key={project.id}
                onClick={() => {
                  setActiveProjectId(project.id);
                  setShowMobileDetail(true);
                }}
                className={`w-full text-left p-4 rounded-xl border transition-all flex items-center justify-between group ${activeProjectId === project.id ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-200 shadow-sm' : 'bg-white border-transparent hover:bg-gray-50 hover:border-gray-200'}`}
              >
                <div className="min-w-0">
                  <h4 className={`text-sm font-bold line-clamp-1 ${activeProjectId === project.id ? 'text-blue-800' : 'text-gray-700'}`}>{project.title}</h4>
                  <p className="text-xs text-gray-400 mt-1">{project.department}</p>
                </div>
                {project.status === 'Delayed' && <AlertTriangle className="w-4 h-4 text-amber-500 translate-x-0 group-hover:scale-110 transition-transform" />}
                {project.status === 'Active' && <Play className="w-4 h-4 text-emerald-500 translate-x-0 group-hover:scale-110 transition-transform" />}
                {project.status === 'Completed' && <CheckCircle2 className="w-4 h-4 text-blue-500 translate-x-0 group-hover:scale-110 transition-transform" />}
              </button>
            ))}
          </div>
        </div>

        {/* --- RIGHT PANEL (Detail View) --- */}
          <div className={`w-full lg:w-2/3 flex flex-col ${showMobileDetail ? 'flex' : 'hidden lg:flex'} transition-all duration-500`}>
            <div className="lg:hidden mb-4">
              <button onClick={() => setShowMobileDetail(false)} className="flex items-center gap-2 text-gray-600 font-semibold hover:text-[#C8102E]"><ArrowLeft className="w-5 h-5" /> Back to Projects</button>
            </div>

            {(detailLoading || loading) ? (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden h-full flex-1">
                <PageLoader mode="proponent-monitoring" className="bg-transparent" />
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
                        {formatDate(activeProject.startDate)} to {formatDate(activeProject.endDate)}
                      </span>
                    </div>
                    {certificateInfo.issuedAt && (
                      <div className="flex flex-wrap justify-center gap-3 mt-4">
                        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/10 text-sm text-blue-100">
                          <Calendar className="w-4 h-4 text-yellow-400" />
                          <span>Certificate issued: {formatDate(certificateInfo.issuedAt)}</span>
                        </div>
                        {certificateInfo.issuedByName && (
                          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/10 text-sm text-blue-100">
                            <Users className="w-4 h-4 text-yellow-400" />
                            <span>Issued by: {certificateInfo.issuedByName}</span>
                          </div>
                        )}
                        <button
                          onClick={handleDownloadCertificate}
                          className="inline-flex items-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-yellow-900 font-bold rounded-lg px-5 py-2 text-sm transition-colors shadow-lg"
                        >
                          <Download className="w-4 h-4" />
                          Download Certificate
                        </button>
                      </div>
                    )}
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
                        <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> Ends: {formatDate(activeProject.endDate)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isExternalUser && (
                        <button
                          onClick={() => setShowLinkEmailModal(true)}
                          className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors text-xs font-bold"
                          title="Link your @wmsu.edu.ph email to unlock full proponent access"
                        >
                          <Mail className="w-4 h-4" /> Link WMSU Email
                        </button>
                      )}
                      {/* Phase 3 of LIB feature: the button doubles as "Revise realignment"
                          when R&D has sent one back — the modal seeds from the existing row
                          and the backend UPDATEs it in place. pending_review is still locked. */}
                      <button
                        onClick={() => setShowRealignmentModal(true)}
                        disabled={activeRealignment?.status === 'pending_review'}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed ${
                          activeRealignment?.status === 'revision_requested'
                            ? 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                            : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                        }`}
                        title={
                          activeRealignment?.status === 'pending_review'
                            ? 'A realignment request is already pending R&D review'
                            : activeRealignment?.status === 'revision_requested'
                              ? "R&D asked for changes — click to revise and resubmit"
                              : 'Request a budget realignment for this project'
                        }
                      >
                        <Banknote className="w-4 h-4" />
                        {activeRealignment?.status === 'revision_requested'
                          ? 'Revise Realignment'
                          : 'Realign Budget'}
                      </button>
                      <button
                        onClick={() => setIsExtensionModalOpen(true)}
                        className="flex p-2 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100 transition-colors"
                        title="Request Extension"
                      >
                        <CalendarClock className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {activeRealignment && (
                    <div
                      className={`mb-4 border rounded-lg p-3 text-xs flex items-start gap-2 ${
                        activeRealignment.status === 'pending_review'
                          ? 'bg-indigo-50 border-indigo-200 text-indigo-800'
                          : 'bg-blue-50 border-blue-200 text-blue-800'
                      }`}
                    >
                      <Clock className="w-4 h-4 mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-bold">
                          Budget realignment{' '}
                          {activeRealignment.status === 'pending_review'
                            ? 'under R&D review'
                            : 'needs your revision'}
                        </div>
                        <div className="opacity-80 mt-0.5">
                          Submitted {formatDate(activeRealignment.created_at)}.{' '}
                          {activeRealignment.status === 'pending_review'
                            ? 'R&D will review the proposed changes on the Project Funding page.'
                            : 'Click "Revise Realignment" above to update your submission based on their feedback.'}
                        </div>
                        {activeRealignment.status === 'revision_requested' && activeRealignment.review_note && (
                          <div className="mt-2 pt-2 border-t border-blue-200/60">
                            <span className="font-bold">R&D note:</span> {activeRealignment.review_note}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

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

                  {/* Phase 4 of LIB feature: Budget History panel. Surfaces past realignment
                      decisions for this project so the proponent has context on how the budget
                      has evolved. Collapsed by default. */}
                  {realignmentHistory.length > 0 && (
                    <div className="mt-3 border border-slate-200 rounded-xl bg-white">
                      <button
                        onClick={() => setShowBudgetHistory((v) => !v)}
                        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <History className="w-4 h-4 text-slate-500" />
                          <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                            Budget History ({realignmentHistory.length})
                          </span>
                        </div>
                        {showBudgetHistory ? (
                          <ChevronUp className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        )}
                      </button>
                      {showBudgetHistory && (
                        <div className="border-t border-slate-100 divide-y divide-slate-100">
                          {realignmentHistory.map((r) => {
                            const statusStyle =
                              r.status === 'approved'
                                ? 'bg-emerald-50 text-emerald-700'
                                : r.status === 'rejected'
                                  ? 'bg-red-50 text-red-700'
                                  : r.status === 'revision_requested'
                                    ? 'bg-blue-50 text-blue-700'
                                    : 'bg-amber-50 text-amber-700';
                            const fromTotal = Number(r.from_version?.grand_total) || 0;
                            const toTotal =
                              Number(r.to_version?.grand_total) ||
                              Number(r.proposed_payload?.grand_total) ||
                              0;
                            const delta = toTotal - fromTotal;
                            const reviewerName = [r.reviewer?.first_name, r.reviewer?.last_name]
                              .filter(Boolean)
                              .join(' ');
                            return (
                              <div key={r.id} className="px-4 py-3 text-xs">
                                <div className="flex flex-wrap items-start justify-between gap-2">
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span
                                        className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${statusStyle}`}
                                      >
                                        {r.status.replace('_', ' ')}
                                      </span>
                                      <span className="text-slate-500">{formatDate(r.created_at)}</span>
                                    </div>
                                    <p className="text-slate-700 italic line-clamp-2">"{r.reason}"</p>
                                    {r.reviewed_at && reviewerName && (
                                      <p className="text-[10px] text-slate-400 mt-1">
                                        Reviewed by {reviewerName} on {formatDate(r.reviewed_at)}
                                      </p>
                                    )}
                                  </div>
                                  <div className="text-right font-mono shrink-0">
                                    <div className="text-slate-500">{formatCurrency(fromTotal)}</div>
                                    <div
                                      className={`font-bold ${
                                        delta < 0
                                          ? 'text-emerald-600'
                                          : delta > 0
                                            ? 'text-red-600'
                                            : 'text-slate-700'
                                      }`}
                                    >
                                      → {formatCurrency(toTotal)}
                                    </div>
                                    {delta !== 0 && (
                                      <div className="text-[10px] text-slate-400">
                                        Δ {delta >= 0 ? '+' : ''}
                                        {formatCurrency(delta)}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* --- TEAM MEMBERS --- */}
              {activeBackend && (
                <div className="mb-6">
                  <TeamMembersSection 
                    fundedProjectId={activeBackend.id} 
                    isProjectLead={activeBackend.project_lead_id === user?.id} 
                  />
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
                          {currentReport.fundRequest.fund_request_items?.map((item, _i) => (
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
                              {/* Phase 4 of LIB feature: pick from existing budget lines instead
                                  of free-typing. Category is derived from the picked item. */}
                              {budgetItemsForProject.length === 0 && (
                                <div className="text-[11px] text-amber-600 bg-amber-50 border border-amber-200 rounded p-2">
                                  Budget items for this project haven't loaded yet — the dropdown may be empty. Refresh if this persists.
                                </div>
                              )}
                              {breakdownItems.map((item) => (
                                <div key={item.id} className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                                  <select
                                    value={item.budget_item_id ?? ''}
                                    onChange={(e) => {
                                      const val = e.target.value ? Number(e.target.value) : null;
                                      linkBreakdownItemToBudgetLine(item.id, val);
                                    }}
                                    className="w-full sm:flex-1 p-2 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none bg-white"
                                  >
                                    <option value="">— Pick a budget line —</option>
                                    {(['ps', 'mooe', 'co'] as const).map((cat) => {
                                      const catItems = budgetItemsForProject.filter((bi) => bi.category === cat);
                                      if (catItems.length === 0) return null;
                                      return (
                                        <optgroup key={cat} label={cat.toUpperCase()}>
                                          {catItems.map((bi) => {
                                            const label = bi.item_name + (bi.spec ? ` (${bi.spec})` : '');
                                            return (
                                              <option key={bi.id} value={bi.id ?? undefined}>
                                                {label} — {formatCurrency(Number(bi.total_amount) || 0)} allocated
                                              </option>
                                            );
                                          })}
                                        </optgroup>
                                      );
                                    })}
                                  </select>
                                  <div className="flex w-full sm:w-auto gap-2 items-center">
                                    <span className="text-[10px] font-bold text-gray-500 uppercase px-2 py-1 bg-gray-100 rounded">
                                      {item.category}
                                    </span>
                                    <input
                                      type="number"
                                      inputMode="decimal"
                                      value={item.amount || ''}
                                      onChange={(e) => updateBreakdownItem(item.id, 'amount', parseFloat(e.target.value) || 0)}
                                      className="flex-1 sm:w-28 p-2 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
                        {/* Budget Item Liquidation */}
                        <div className="bg-white border border-gray-200 rounded-xl p-4">
                          <div className="flex items-center gap-2 mb-1">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                            <h5 className="font-bold text-gray-800">Budget Item Liquidation</h5>
                          </div>
                          <p className="text-xs text-gray-500 mb-4">Select the items you actually spent on this quarter and enter the actual amount spent.</p>

                          <div className="space-y-3">
                            {liquidationDraft.map((item, idx) => (
                              <div key={item.fund_request_item_id} className={`rounded-lg border p-3 transition-colors ${item.selected ? 'border-blue-200 bg-blue-50/50' : 'border-gray-200 bg-gray-50'}`}>
                                <label className="flex items-start gap-3 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={item.selected}
                                    onChange={(e) => {
                                      const updated = [...liquidationDraft];
                                      updated[idx] = { ...updated[idx], selected: e.target.checked };
                                      if (!e.target.checked) updated[idx].actual_amount = '';
                                      else updated[idx].actual_amount = String(item.approved_amount);
                                      setLiquidationDraft(updated);
                                    }}
                                    className="mt-1 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-center">
                                      <span className="text-sm font-semibold text-gray-800">{item.item_name}</span>
                                      <span className="text-[10px] font-bold uppercase text-gray-400 bg-gray-200 px-2 py-0.5 rounded-full">{item.category}</span>
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">Approved: <span className="font-mono font-semibold text-emerald-700">{formatCurrency(item.approved_amount)}</span></div>
                                    {item.selected && (
                                      <div className="mt-2 flex items-center gap-2">
                                        <label className="text-xs text-gray-600 font-medium whitespace-nowrap">Actual Spent:</label>
                                        <div className="relative flex-1">
                                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">PHP</span>
                                          <input
                                            type="number"
                                            min={0}
                                            max={item.approved_amount}
                                            step="0.01"
                                            value={item.actual_amount}
                                            onChange={(e) => {
                                              const updated = [...liquidationDraft];
                                              updated[idx] = { ...updated[idx], actual_amount: e.target.value };
                                              setLiquidationDraft(updated);
                                            }}
                                            className="w-full pl-10 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
                                          />
                                        </div>
                                        {item.actual_amount && parseFloat(item.actual_amount) < item.approved_amount && (
                                          <span className="text-xs text-amber-600 font-medium whitespace-nowrap">
                                            Unspent: {formatCurrency(item.approved_amount - parseFloat(item.actual_amount))}
                                          </span>
                                        )}
                                      </div>
                                    )}
                                    {!item.selected && (
                                      <div className="mt-1 text-xs text-amber-600">For return: {formatCurrency(item.approved_amount)}</div>
                                    )}
                                  </div>
                                </label>
                              </div>
                            ))}
                          </div>

                          {/* Summary */}
                          {liquidationDraft.length > 0 && (
                            <div className="mt-4 pt-3 border-t border-gray-200 grid grid-cols-2 gap-3">
                              <div className="bg-blue-50 rounded-lg p-3 text-center">
                                <p className="text-[10px] text-blue-500 uppercase font-bold">Total Spent</p>
                                <p className="text-lg font-bold text-blue-700">
                                  {formatCurrency(
                                    liquidationDraft.filter(i => i.selected).reduce((sum, i) => sum + (parseFloat(i.actual_amount) || 0), 0)
                                  )}
                                </p>
                              </div>
                              <div className="bg-amber-50 rounded-lg p-3 text-center">
                                <p className="text-[10px] text-amber-500 uppercase font-bold">For Return</p>
                                <p className="text-lg font-bold text-amber-700">
                                  {formatCurrency(
                                    liquidationDraft.reduce((sum, i) => {
                                      if (!i.selected) return sum + i.approved_amount;
                                      const actual = parseFloat(i.actual_amount) || 0;
                                      return sum + (i.approved_amount - actual);
                                    }, 0)
                                  )}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Progress Stepper */}
                        <div className="bg-white p-4 rounded-xl border border-gray-200">
                          <label className="text-xs font-bold text-gray-600 uppercase mb-3 flex justify-between items-center">
                            <span>Update Progress (Min {prevReportProgress}%)</span>
                            <span className="text-sm font-bold text-blue-600">{localProgress}%</span>
                          </label>
                          <div className="flex items-center gap-3">
                            <input
                              type="range"
                              min={prevReportProgress}
                              max={100}
                              step={5}
                              value={localProgress}
                              onChange={(e) => setLocalProgress(Number(e.target.value))}
                              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                            />
                            <div className="flex items-center gap-1">
                              <button onClick={() => handleProgressStep('down')} disabled={localProgress <= prevReportProgress} className="p-1 bg-gray-200 rounded-lg hover:bg-red-100 text-gray-600 disabled:opacity-30 transition-colors"><ChevronDown className="w-4 h-4" /></button>
                              <div className="w-12 p-2 border border-gray-300 rounded-lg text-sm bg-gray-50 text-gray-800 font-semibold text-center select-none">
                                {localProgress}%
                              </div>
                              <button onClick={() => handleProgressStep('up')} disabled={localProgress >= 100} className="p-1 bg-gray-200 rounded-lg hover:bg-blue-100 text-gray-600 disabled:opacity-30 transition-colors"><ChevronUp className="w-4 h-4" /></button>
                            </div>
                          </div>
                          <div className="mt-3">
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                              <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${localProgress}%` }}></div>
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
                                  <span className="text-gray-400">({reportFile.size < 1024 * 1024 ? `${(reportFile.size / 1024).toFixed(0)} KB` : `${(reportFile.size / 1024 / 1024).toFixed(1)} MB`})</span>
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
                                  <span className="text-gray-400">({terminalReportFile.size < 1024 * 1024 ? `${(terminalReportFile.size / 1024).toFixed(0)} KB` : `${(terminalReportFile.size / 1024 / 1024).toFixed(1)} MB`})</span>
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
                                    <span className="text-gray-400">({file.size < 1024 * 1024 ? `${(file.size / 1024).toFixed(0)} KB` : `${(file.size / 1024 / 1024).toFixed(1)} MB`})</span>
                                    <button onClick={() => removeReceiptFile(i)} className="ml-auto text-gray-400 hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

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
                          <div className="space-y-3">
                            <p className="text-xs font-bold text-gray-500 uppercase">Proof of Accomplishment</p>
                            {groupProofFiles(currentReport.proofFiles).map((group) => (
                              <div key={group.category}>
                                <p className="text-[11px] font-bold text-gray-500 mb-1.5">{group.category}</p>
                                <div className="space-y-1.5">
                                  {group.files.map((file, i) => (
                                    <a key={i} href="#" onClick={(e) => { e.preventDefault(); openSignedUrl(file.url); }} className="flex items-center gap-1.5 text-xs text-blue-600 bg-blue-50 px-2.5 py-1.5 rounded-lg hover:bg-blue-100 border border-blue-100" title={file.filename}>
                                      <FileText className="w-3.5 h-3.5 flex-shrink-0" />
                                      <span className="truncate max-w-[180px]">{file.filename}</span>
                                    </a>
                                  ))}
                                </div>
                              </div>
                            ))}
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

              {/* --- TERMINAL REPORT --- */}
              {activeBackend && (
                <div className="mt-6">
                  <TerminalReportSection
                    fundedProjectId={activeBackend.id}
                    allQuartersVerified={quarters.length === 4 && quarters.every(q => q.status === 'approved')}
                  />
                </div>
              )}

              {/* --- FINANCIAL REPORT BUTTON --- */}
              {activeBackend && activeProject && (
                <div className="mt-4">
                  <button
                    onClick={() => setShowFinancialReport(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold rounded-xl border border-emerald-200 text-sm transition-colors"
                  >
                    <PieChart className="w-4 h-4" />
                    View Financial Report
                  </button>
                </div>
              )}

            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 flex-1 flex flex-col items-center justify-center text-center animate-pulse min-h-[400px]">
              <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                <Target className="w-12 h-12 text-gray-200" />
              </div>
              <h3 className="text-xl font-bold text-gray-300 mb-2">Select a Project</h3>
              <p className="text-gray-200 text-sm max-w-xs">Complete project monitoring by selecting a funded project from the list on the left.</p>
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
                onClick={async () => {
                  if (!activeBackend) return;
                  try {
                    await requestProjectExtension(
                      activeBackend.id,
                      extensionType,
                      extensionDate,
                      extensionReason
                    );
                    Swal.fire('Submitted', 'Extension request submitted successfully.', 'success');
                    setIsExtensionModalOpen(false);
                    setExtensionDate('');
                    setExtensionReason('');
                    setExtensionType('time_only');
                  } catch (err: any) {
                    const msg = err?.response?.data?.message || 'Failed to submit extension request.';
                    Swal.fire('Error', msg, 'error');
                  }
                }}
                disabled={!extensionDate || !extensionReason.trim()}
                className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Submit Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Phase 3 of LIB feature: budget realignment modal. Pass existingRealignment when
          R&D has sent it back for revision so the modal seeds from the previous attempt. */}
      {showRealignmentModal && activeBackend && (
        <RealignmentFormModal
          fundedProjectId={activeBackend.id}
          existingRealignment={
            activeRealignment?.status === 'revision_requested' ? activeRealignment : null
          }
          onClose={() => setShowRealignmentModal(false)}
          onSubmitted={() => {
            loadActiveRealignment();
            loadBudgetItems();
          }}
        />
      )}

      {/* External → internal upgrade: enter new WMSU email, Supabase sends verification
          link, authorizer auto-upgrades account_type on next login */}
      {showLinkEmailModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-t-2xl">
              <div>
                <h3 className="font-bold text-lg">Link your WMSU email</h3>
                <p className="text-xs text-white/80">Unlock full proponent access after verification.</p>
              </div>
              <button
                onClick={() => setShowLinkEmailModal(false)}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-3 text-sm text-gray-700">
              <p>
                If you're now employed at or studying at WMSU and have an{' '}
                <strong>@wmsu.edu.ph</strong> email, enter it below. We'll send a
                verification link to that address. Once you click it and log back in,
                you'll see the full proponent UI instead of just the monitoring page.
              </p>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wide text-gray-600 mb-1">
                  WMSU Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={linkEmailInput}
                  onChange={(e) => setLinkEmailInput(e.target.value)}
                  placeholder="yourname@wmsu.edu.ph"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  disabled={linkEmailSubmitting}
                />
              </div>
              <p className="text-[11px] text-gray-400">
                Note: if that email already has an SPMAMS account, the link will fail
                and you'll need to contact admin for an account merge.
              </p>
            </div>
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-2 rounded-b-2xl">
              <button
                onClick={() => setShowLinkEmailModal(false)}
                disabled={linkEmailSubmitting}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleLinkWmsuEmail}
                disabled={linkEmailSubmitting || !linkEmailInput.trim()}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium disabled:opacity-40 flex items-center gap-2"
              >
                {linkEmailSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Sending...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4" /> Send verification link
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- FINANCIAL REPORT MODAL --- */}
      {showFinancialReport && activeBackend && activeProject && (
        <FinancialReportModal
          fundedProjectId={activeBackend.id}
          projectTitle={activeProject.title}
          onClose={() => setShowFinancialReport(false)}
        />
      )}
    </div>
  );
};

export default MonitoringPage;
