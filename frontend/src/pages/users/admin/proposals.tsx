import React, { useState, useEffect } from 'react';
import {
  FileText, Calendar, User, Eye, Search,
  ChevronLeft, ChevronRight, Tag, Clock, XCircle,
  RefreshCw, Bot, UserCog, Pen, Users, X, MessageSquare, CheckCircle,
  Send, Download, Edit, Signature, AlertCircle, CalendarX2, CalendarDays
} from 'lucide-react';
import { exportToCsv } from '../../../utils/csv-export';
import Swal from 'sweetalert2';
import {
  type Proposal,
  type Decision,
  type ProposalStatus,
  type Reviewer
} from '../../../types/InterfaceProposal';
import { adminProposalApi as proposalApi } from '../../../services/AdminProposalApi/ProposalApi';
import ProposalModal from '../../../components/admin-component/AdminProposalModal';
import DetailedProposalModal from '../../../components/admin-component/AdminViewModal';
import ChangeRndModal from '../../../components/admin-component/changeRndModal';
import { forwardProposalToRnd, autoDistributeProposals, fetchAgencies, type LookupItem } from '../../../services/proposal.api';
import PageLoader from '../../../components/shared/PageLoader';
import { formatDate } from '../../../utils/date-formatter';

// --- HELPER COMPONENT: Evaluator List Modal ---
interface EvaluatorListModalProps {
  evaluators: string[];
  message?: string;
  isOpen: boolean;
  onClose: () => void;
}

const EvaluatorListModal: React.FC<EvaluatorListModalProps> = ({
  evaluators,
  message,
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 animate-in fade-in">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b bg-slate-50">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-[#C8102E]" />
            <h2 className="font-bold text-slate-800">Assigned Evaluators</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200 transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 max-h-[500px] overflow-y-auto">
          {/* List */}
          <div className="space-y-3">
            {(!evaluators || evaluators.length === 0) ? (
              <div className="text-center py-4">
                <p className="text-sm text-slate-500">No evaluators assigned yet.</p>
              </div>
            ) : (
              evaluators.map((name, index) => (
                <div key={index} className="flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-100 shadow-sm">
                  <div className="w-8 h-8 rounded-full bg-[#C8102E] text-white flex items-center justify-center text-xs font-bold">
                    {name.charAt(0)}
                  </div>
                  <span className="text-sm font-medium text-slate-700">{name}</span>
                </div>
              ))
            )}
          </div>

          {/* Message Section */}
          {message && (
            <div className="mt-6 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="w-4 h-4 text-slate-400" />
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Instruction / Message</h3>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-sm text-slate-700 italic">
                "{message}"
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t bg-slate-50 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-white border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// --- MAIN PAGE COMPONENT ---

interface AdminProposalPageProps {
  filter?: ProposalStatus;
  onStatsUpdate?: () => void;
}

// Extended Status type for the filter dropdown
type ExtendedProposalStatus = ProposalStatus | 'Revised Proposal' | 'Under R&D Review' | 'Under Evaluators Assessment' | 'Funded' | 'Not Submitted' | 'Endorsed';

const AdminProposalPage: React.FC<AdminProposalPageProps> = ({ onStatsUpdate }) => {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);

  // Bulk selection — a Set of proposal.id strings. Cleared when proposals
  // reload or when the user changes tab/filter (selection would otherwise
  // reference rows that are no longer visible).
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Modal States
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [selectedProposalForView, setSelectedProposalForView] = useState<Proposal | null>(null);
  const [selectedProposalForChange, setSelectedProposalForChange] = useState<Proposal | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isChangeRdModalOpen, setIsChangeRdModalOpen] = useState(false);
  const [isModalSubmitting, setIsModalSubmitting] = useState(false);

  // Evaluator List Modal State
  const [isEvaluatorModalOpen, setIsEvaluatorModalOpen] = useState(false);
  const [currentEvaluatorsList, setCurrentEvaluatorsList] = useState<string[]>([]);
  const [currentEvaluatorMessage, setCurrentEvaluatorMessage] = useState<string>('');

  // Filter State
  const [activeTab, setActiveTab] = useState<ExtendedProposalStatus | 'All'>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [yearFilter, setYearFilter] = useState('All');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [sortOrder, setSortOrder] = useState('recent-old');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Clear the bulk-selection whenever the visible set changes (tab,
  // search, or reload) so selectedIds can't reference rows that are
  // no longer shown.
  useEffect(() => {
    setSelectedIds(new Set());
  }, [activeTab, searchTerm, yearFilter, departmentFilter, sortOrder]);

  // Mock Current User
  const currentUser: Reviewer = { name: 'Admin User', role: 'R&D Staff', id: 'admin-1', email: 'admin@wmsu.edu.ph' };

  // Lookup data
  const [agencies, setAgencies] = useState<LookupItem[]>([]);

  // Load proposals and lookup data on component mount
  useEffect(() => {
    loadProposals();
    loadLookupData();
  }, []);

  const loadProposals = async () => {
    try {
      setLoading(true);
      const data = await proposalApi.fetchProposals();
      const sortedData = data.sort((a, b) => {
        const isAPending = (a.status || '').toLowerCase() === 'pending';
        const isBPending = (b.status || '').toLowerCase() === 'pending';
        if (isAPending && !isBPending) return -1;
        if (!isAPending && isBPending) return 1;
        return new Date(b.submittedDate).getTime() - new Date(a.submittedDate).getTime();
      });
      setProposals(sortedData);
    } catch (error) {
      console.error('Error loading proposals:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLookupData = async () => {
    try {
      const [agenciesData] = await Promise.all([
        fetchAgencies()
      ]);
      setAgencies(agenciesData);
    } catch (error) {
      console.error('Error loading lookup data:', error);
    }
  };

  // Filter logic
  const filteredProposals = proposals.filter((proposal) => {
    const matchesSearch =
      proposal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proposal.proponent.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (proposal.proponentUsername && proposal.proponentUsername.toLowerCase().includes(searchTerm.toLowerCase())) ||
      proposal.id.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    // Year Filter
    const proposalYear = proposal.submittedDate ? new Date(proposal.submittedDate).getFullYear().toString() : "N/A";
    const matchesYear = yearFilter === "All" || proposalYear === yearFilter;
    if (!matchesYear) return false;

    // Department Filter
    const proposalDept = (proposal as any).rdStation || 'Unknown';
    const matchesDept = departmentFilter === "All" || proposalDept === departmentFilter;
    if (!matchesDept) return false;

    // Helper to check flexible status
    const s = proposal.status.toLowerCase();

    if (activeTab === 'All') return true;



    if (activeTab === 'Under R&D Review') {
      return s.includes('r&d') || s.includes('rnd') || s === 'review_rnd';
    }

    if (activeTab === 'Pending') {
      return s.includes('pending');
    }

    if (activeTab === 'Revised Proposal') {
      return s.includes('revised') || s === 'revised_proposal';
    }

    if (activeTab === 'Revision Required') {
      return s.includes('revision') || s.includes('require');
    }

    if (activeTab === 'Under Evaluators Assessment') {
      return s.includes('evaluator') || s.includes('assessment') || s === 'under_evaluation';
    }

    if (activeTab === 'Rejected Proposal') {
      return s.includes('reject');
    }

    return proposal.status === activeTab;
  });

  // Sort logic
  const sortedFilteredProposals = [...filteredProposals].sort((a, b) => {
    // 1. Prioritize Pending status
    const isAPending = (a.status || '').toLowerCase() === 'pending';
    const isBPending = (b.status || '').toLowerCase() === 'pending';
    if (isAPending && !isBPending) return -1;
    if (!isAPending && isBPending) return 1;

    // 2. Then apply user-selected sort
    if (sortOrder === "a-z") return a.title.localeCompare(b.title);
    if (sortOrder === "z-a") return b.title.localeCompare(a.title);

    const dateA = new Date(a.submittedDate || 0).getTime();
    const dateB = new Date(b.submittedDate || 0).getTime();

    if (sortOrder === "recent-old") return dateB - dateA;
    if (sortOrder === "old-recent") return dateA - dateB;

    return 0;
  });

  // Pagination logic
  const totalPages = Math.ceil(sortedFilteredProposals.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProposals = sortedFilteredProposals.slice(startIndex, startIndex + itemsPerPage);

  // --- Handlers ---

  const handleViewProposal = (proposal: Proposal) => {
    setSelectedProposal(proposal);
    setIsModalOpen(true);
  };

  const handleViewDetails = (proposal: Proposal) => {
    setSelectedProposalForView(proposal);
    setIsViewModalOpen(true);
  };

  const handleChangeRdStaff = (proposal: Proposal) => {
    setSelectedProposalForChange(proposal);
    setIsChangeRdModalOpen(true);
  }

  const confirmRdChange = async (proposalId: string, newStaffName: string, newStaffId?: string) => {
    try {
      if (!newStaffId) throw new Error("No staff ID provided for reassignment.");

      // Backend Update
      await forwardProposalToRnd(Number(proposalId), [newStaffId]);

      // Optimistic UI Update after Success
      setProposals(prev => prev.map(p =>
        p.id === proposalId
          ? {
            ...p,
            assignedRdStaff: newStaffName,
            status: 'Under R&D Review' as ProposalStatus,
            lastModified: new Date().toISOString()
          }
          : p
      ));

      setIsChangeRdModalOpen(false);
      await loadProposals();
      // Success alert is handled by the modal component for better UX flow
    } catch (error) {
      console.error("Failed to reassign R&D staff:", error);
      // Show error here only
      Swal.fire("Error", "Failed to clear previous assignment or update new assignment.", "error");
    }
  };

  // ── Bulk selection helpers ─────────────────────────────────────────
  // Only Pending proposals without an assigned R&D are eligible targets
  // for bulk auto-distribute. Selection is allowed on any row, but the
  // bulk button filters to just the eligible ones before dispatching.
  const isEligibleForAutoDistribute = (p: Proposal) =>
    p.status === 'Pending' && !p.assignedRdStaff;

  const toggleRowSelected = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // "Select all on current page". Click toggles based on whether every
  // visible row is already selected. Kept page-scoped because selecting
  // across all pages would be surprising and hard to un-do.
  const toggleSelectAllOnPage = (pageRows: Proposal[]) => {
    setSelectedIds((prev) => {
      const allOnPageSelected = pageRows.length > 0 && pageRows.every((p) => prev.has(p.id));
      const next = new Set(prev);
      if (allOnPageSelected) {
        pageRows.forEach((p) => next.delete(p.id));
      } else {
        pageRows.forEach((p) => next.add(p.id));
      }
      return next;
    });
  };

  const handleBulkDistribute = async () => {
    const eligible = proposals.filter(
      (p) => selectedIds.has(p.id) && isEligibleForAutoDistribute(p),
    );
    if (eligible.length === 0) {
      Swal.fire('Nothing to distribute', 'None of the selected proposals are Pending and unassigned.', 'info');
      return;
    }
    const ids = eligible.map((p) => parseInt(p.id));
    await handleAutoDistribute(ids);
    setSelectedIds(new Set());
  };

  // Auto-distribute: single proposal or all pending
  const handleAutoDistribute = async (proposalIds?: number[]) => {
    const isBatch = !proposalIds;
    const pendingCount = proposals.filter(p => p.status === 'Pending').length;

    if (isBatch && pendingCount === 0) {
      Swal.fire("No Pending Proposals", "There are no pending proposals to distribute.", "info");
      return;
    }

    const confirmResult = await Swal.fire({
      title: isBatch ? "Auto Distribute All?" : "Auto Distribute?",
      text: isBatch
        ? `This will distribute ${pendingCount} pending proposal(s) evenly to R&D staff by department.`
        : "This will assign this proposal to the least-loaded R&D staff in the matching department.",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#991B1B",
      confirmButtonText: isBatch ? "Distribute All" : "Distribute",
    });

    if (!confirmResult.isConfirmed) return;

    Swal.fire({
      title: isBatch ? 'Distributing proposals...' : 'Distributing proposal...',
      text: 'Matching proposals to least-loaded R&D staff.',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    try {
      const result = await autoDistributeProposals(proposalIds);

      const distributed = result.distributed || 0;
      const errors = result.errors || [];

      let message = `${distributed} proposal(s) distributed to R&D successfully.`;
      if (errors.length > 0) {
        message += `\n${errors.length} proposal(s) could not be distributed (no eligible R&D staff in department).`;
      }

      await Swal.fire({
        title: distributed > 0 ? "Distributed!" : "No Proposals Distributed",
        text: message,
        icon: distributed > 0 ? "success" : "warning",
      });

      await loadProposals();
      if (onStatsUpdate) onStatsUpdate();
    } catch (error) {
      console.error("Auto-distribute failed:", error);
      Swal.fire("Error", "Failed to auto-distribute proposals.", "error");
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProposal(null);
  };

  // Handler for the Main Action Modal
  const handleSubmitDecision = async (decision: Decision) => {
    setIsModalSubmitting(true);
    try {
      await proposalApi.submitDecision(decision);

      // Determine new status based on decision
      let newStatus: ProposalStatus;
      let newAssignedEvaluators: string[] | undefined = undefined;
      const instructionMessage = decision.structuredComments?.title?.content || "";

      if (decision.decision === 'Sent to Evaluators') {
        newStatus = 'Under Evaluators Assessment';
        newAssignedEvaluators = (decision.assignedEvaluators || []).map((e) =>
          typeof e === 'string' ? e : e.id
        );
      } else if (decision.decision === 'Rejected Proposal') {
        newStatus = 'Rejected Proposal';
      } else if (decision.decision === 'Revision Required') {
        newStatus = 'Revision Required';
      } else {
        newStatus = 'Under R&D Review';
      }

      setProposals((prev) =>
        prev.map((proposal) =>
          proposal.id === decision.proposalId
            ? {
              ...proposal,
              status: newStatus,
              assignedRdStaff: proposal.assignedRdStaff || (decision.assignedRdStaffId ? 'Assigned' : 'Unassigned'),
              assignedEvaluators: newAssignedEvaluators,
              evaluatorInstruction: instructionMessage,
              lastModified: new Date().toISOString()
            } as Proposal
            : proposal
        )
      );

      if (onStatsUpdate) {
        onStatsUpdate();
      }

      await loadProposals();

    } catch (error) {
      console.error('Error submitting decision:', error);
      // Re-throw so the modal's catch block can show a proper error alert
      // instead of falsely showing a "Forwarded!" / "Submitted!" success dialog.
      throw error;
    } finally {
      setIsModalSubmitting(false);
    }
  };

  // --- Helper: Status Normalization ---
  // Matches AdminViewModal logic for consistency
  const getNormalizedStatus = (status: string): ExtendedProposalStatus => {
    const s = status.toLowerCase();

    if (s.includes('revise') || s.includes('revision')) return 'Revision Required';
    if (s.includes('reject')) return 'Rejected Proposal';
    if (s.includes('endorsed')) return 'Endorsed';
    if (s.includes('funded')) return 'Funded';
    if (s.includes('not_submitted') || s.includes('not submitted')) return 'Not Submitted';

    // R&D Review variations
    if (
      s.includes('r&d') ||
      s.includes('rnd') ||
      s === 'review_rnd' ||
      s.includes('under r&d review')
    ) return 'Under R&D Review';

    if (s.includes('revised_proposal') || s.includes('revised proposal')) {
      return 'Revised Proposal';
    }

    // Evaluator variations
    if (
      s.includes('evaluator') ||
      s.includes('assessment') ||
      s === 'under_evaluation'
    ) return 'Under Evaluators Assessment';

    if (s.includes('assign') && !s.includes('unassigned')) return 'Assigned to RnD'; // Or similar

    return 'Pending'; // Default fallback
  };

  // --- Helper: Status Badge Logic ---
  const getStatusBadge = (proposal: Proposal) => {
    const baseClasses = 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border border-current border-opacity-20 max-w-[200px] truncate cursor-pointer hover:opacity-80 transition-opacity';

    // Normalize status for display logic
    const status = proposal.status;
    const s = status.toLowerCase();

    // R&D Review
    if (s.includes('r&d') || s.includes('rnd') || s === 'review_rnd' || s.includes('under r&d review')) {
      return <span className={`${baseClasses} text-blue-600 bg-blue-50 border-blue-200 cursor-default`}>
        <Search className="w-3 h-3 flex-shrink-0" />
        Under R&D Review
      </span>;
    }

    // Pending
    if (s === 'pending' || s.includes('pending')) {
      return <span className={`${baseClasses} text-amber-600 bg-amber-50 border-amber-200 cursor-default`}><Clock className="w-3 h-3 flex-shrink-0" />Pending</span>;
    }

    // Revised Proposal
    if (s.includes('revised') || s === 'revised proposal' || s === 'revised_proposal') {
      if (proposal.assignedRdStaff) {
        return <span className={`${baseClasses} text-blue-600 bg-blue-50 border-blue-200`} title={`Assigned to: ${proposal.assignedRdStaff}`}>
          <Bot className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">RnD: {proposal.assignedRdStaff}</span>
        </span>;
      }
      return <span className={`${baseClasses} text-amber-600 bg-amber-50 border-amber-200 cursor-default`}><Edit className="w-3 h-3 flex-shrink-0 text-amber-600" />Revised Proposal</span>;
    }

    // Revision Required
    if (s.includes('revision') || s.includes('require')) {
      return <span className={`${baseClasses} text-amber-800 bg-amber-100 border-amber-200 cursor-default`}><RefreshCw className="w-3 h-3 flex-shrink-0 text-amber-600" />Revision Required</span>;
    }

    // Under Evaluators Assessment
    if (s.includes('evaluator') || s.includes('assessment') || s === 'under_evaluation') {
      const evaluators = (proposal as any).assignedEvaluators || [];
      const message = (proposal as any).evaluatorInstruction || "";
      const evaluatorText = 'Under Evaluators Assessment';

      return <button
        onClick={(e) => {
          e.stopPropagation();
          if (evaluators.length > 0) {
            setCurrentEvaluatorsList(evaluators);
            setCurrentEvaluatorMessage(message);
            setIsEvaluatorModalOpen(true);
          }
        }}
        className={`${baseClasses} text-purple-800 bg-purple-100 border-purple-200`}
        title={evaluators.join(', ')}
      >
        <Users className="w-3 h-3 flex-shrink-0 text-purple-600" />
        <span className="truncate">{evaluatorText}</span>
      </button>;
    }

    // Rejected
    if (s.includes('reject')) {
      return <span className={`${baseClasses} text-red-800 bg-red-100 border-red-200 cursor-default`}><XCircle className="w-3 h-3 flex-shrink-0 text-red-600" />Rejected Proposal</span>;
    }

    // Endorsed
    if (s.includes('endorsed')) {
      return <span className={`${baseClasses} text-blue-800 bg-blue-100 border-blue-200 cursor-default`}><Signature className="w-3 h-3 flex-shrink-0" />Endorsed for Funding</span>;
    }

    // Funded
    if (s.includes('funded')) {
      return <span className={`${baseClasses} text-emerald-800 bg-emerald-100 border-emerald-200 cursor-default`}><CheckCircle className="w-3 h-3 flex-shrink-0 text-emerald-600" />Project Funded</span>;
    }

    // Not Submitted / Extension Requests
    if (s.includes('not_submitted') || s.includes('not submitted')) {
      return <span className={`${baseClasses} text-red-900 bg-red-100 border-red-300 cursor-default`}>
        <CalendarX2 className="w-3 h-3 flex-shrink-0 text-red-800" />
        Not Submitted
      </span>;
    }

    // Default / Unhandled
    return <span className={`${baseClasses} text-slate-600 bg-slate-50 border-slate-200 cursor-default`}>{status}</span>;
  };

  const getStatusCount = (status: ExtendedProposalStatus | 'All') => {
    if (status === 'All') return proposals.length;



    // For other tabs, use normalized status
    return proposals.filter((p) => getNormalizedStatus(p.status) === status).length;
  };

  const tabs: { id: ExtendedProposalStatus | 'All'; label: string; icon: any }[] = [
    { id: 'All', label: 'All', icon: FileText },
    { id: 'Under R&D Review', label: 'R&D Review', icon: Search },
    { id: 'Pending', label: 'Pending', icon: Clock },
    { id: 'Revised Proposal', label: 'Revised', icon: Edit },
    { id: 'Revision Required', label: 'To Revise', icon: RefreshCw },
    { id: 'Not Submitted', label: 'Extension Requests', icon: AlertCircle },
    { id: 'Under Evaluators Assessment', label: 'Evaluators', icon: Users },
    { id: 'Endorsed', label: 'Endorsed', icon: Signature },
    { id: 'Funded', label: 'Funded', icon: CheckCircle },
    { id: 'Rejected Proposal', label: 'Rejected', icon: XCircle },
  ];

  // Helper for Random Tag Colors (Matches RndProposalPage)
  const getTagColor = (tag: string) => {
    let hash = 0;
    for (let i = 0; i < tag.length; i++) {
      hash = tag.charCodeAt(i) + ((hash << 5) - hash);
    }

    const colors = [
      "bg-blue-50 text-blue-700 border-blue-200",
      "bg-green-50 text-green-700 border-green-200",
      "bg-yellow-50 text-yellow-700 border-yellow-200",
      "bg-rose-50 text-rose-700 border-rose-200",
      "bg-purple-50 text-purple-700 border-purple-200",
      "bg-indigo-50 text-indigo-700 border-indigo-200",
      "bg-orange-50 text-orange-700 border-orange-200",
      "bg-cyan-50 text-cyan-700 border-cyan-200",
      "bg-teal-50 text-teal-700 border-teal-200",
    ];

    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  if (loading) {
    return <PageLoader mode="table" />;
  }

  return (
    <>
      <div className="min-h-screen px-5 sm:px-8 lg:px-10 xl:px-12 2xl:px-16 py-8 lg:py-10 bg-gradient-to-br from-slate-50 to-slate-100 animate-fade-in">
        <div className="flex w-full min-w-0 flex-col gap-4 lg:gap-6">
          {/* Header */}
          <header className="flex-shrink-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-[#C8102E] leading-tight">
                  Research Proposal Review
                </h1>
                <p className="text-slate-600 mt-2 text-sm leading-relaxed">
                  Review and evaluate research proposals submitted to WMSU
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    exportToCsv('proposals', filteredProposals, [
                      { header: 'ID', accessor: (p) => p.id },
                      { header: 'Title', accessor: (p) => p.title },
                      { header: 'Submitted By', accessor: (p) => p.submittedBy },
                      { header: 'Submitted Date', accessor: (p) => p.submittedDate },
                      { header: 'Department', accessor: (p) => (p as any).rdStation || '' },
                      { header: 'Status', accessor: (p) => p.status },
                      { header: 'Assigned R&D', accessor: (p) => p.assignedRdStaff || '' },
                      { header: 'Assigned Evaluators', accessor: (p) => (p.assignedEvaluators || []).join('; ') },
                    ])
                  }
                  disabled={filteredProposals.length === 0}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold shadow-sm bg-white text-[#C8102E] border border-[#C8102E]/30 hover:bg-[#C8102E]/5 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  title={filteredProposals.length === 0 ? 'No rows to export' : 'Export visible rows to CSV'}
                >
                  <Download className="w-4 h-4" />
                  Export CSV
                </button>
                {/* Auto Distribute All button */}
                {proposals.filter(p => p.status === 'Pending').length > 0 && (
                  <button
                    onClick={() => handleAutoDistribute()}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold shadow-sm bg-[#991B1B] text-white hover:bg-[#7a1616] transition-all duration-200 cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    Auto Distribute ({proposals.filter(p => p.status === 'Pending').length})
                  </button>
                )}
              </div>
            </div>
          </header>

          {/* Stepper / Tabs */}
          <section className="flex-shrink-0">
            <div className="flex flex-wrap gap-2">
              {tabs.map(tab => {
                const isActive = activeTab === tab.id;
                const count = getStatusCount(tab.id);
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all border ${isActive
                      ? 'bg-[#C8102E] text-white border-[#C8102E] shadow-sm'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                  >
                    <tab.icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{tab.label}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-100 text-slate-500'
                      }`}>
                      {count}
                    </span>
                  </button>
                )
              })}
            </div>
          </section>

          {/* Search and Filters */}
          <section className="flex-shrink-0 flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search proposals or username..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-transparent bg-white"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={yearFilter}
                onChange={(e) => { setYearFilter(e.target.value); setCurrentPage(1); }}
                className="px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-transparent bg-white cursor-pointer"
              >
                <option value="All">All Years</option>
                {Array.from(new Set(proposals.map(p => p.submittedDate ? new Date(p.submittedDate).getFullYear() : null).filter(Boolean))).sort((a: any, b: any) => b - a).map(year => (
                  <option key={year} value={String(year)}>{year}</option>
                ))}
              </select>
              <select
                value={departmentFilter}
                onChange={(e) => { setDepartmentFilter(e.target.value); setCurrentPage(1); }}
                className="px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-transparent bg-white cursor-pointer max-w-[150px] truncate"
              >
                <option value="All">All Departments</option>
                {Array.from(new Set(proposals.map(p => (p as any).rdStation || 'Unknown'))).filter(d => d !== 'Unknown').sort().map(dept => (
                  <option key={dept as string} value={dept as string}>{dept as string}</option>
                ))}
              </select>
              <select
                value={sortOrder}
                onChange={(e) => { setSortOrder(e.target.value); setCurrentPage(1); }}
                className="px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-transparent bg-white cursor-pointer"
              >
                <option value="recent-old">Recent to Old</option>
                <option value="old-recent">Old to Recent</option>
                <option value="a-z">Title (A-Z)</option>
                <option value="z-a">Title (Z-A)</option>
              </select>
            </div>
          </section>

          {/* Proposals List */}
          <main className="relative flex w-full min-w-0 flex-col overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xl">
            <div className="p-4 border-b border-slate-200 bg-slate-50">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#C8102E]" />
                  {activeTab === 'All' ? 'Research Proposals' : `${activeTab} Proposals`}
                </h3>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <User className="w-4 h-4" />
                  <span>{filteredProposals.length} total</span>
                </div>
              </div>
            </div>

            {/* Bulk-action bar. Only shown when there's a selection. The
              "distribute" count reflects how many of the selected rows are
              actually eligible (Pending + no assigned R&D). */}
            {selectedIds.size > 0 && (() => {
              const eligibleCount = proposals.filter(
                (p) => selectedIds.has(p.id) && isEligibleForAutoDistribute(p),
              ).length;
              return (
                <div className="px-4 py-2.5 bg-[#C8102E]/5 border-b border-[#C8102E]/20 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                  <span className="text-sm text-slate-700">
                    <strong className="text-[#C8102E]">{selectedIds.size}</strong> selected
                    {eligibleCount !== selectedIds.size && (
                      <span className="text-xs text-slate-500 ml-2">
                        ({eligibleCount} eligible for distribution)
                      </span>
                    )}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleBulkDistribute}
                      disabled={eligibleCount === 0}
                      className="inline-flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs font-semibold shadow-sm bg-[#991B1B] text-white hover:bg-[#7a1616] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title={eligibleCount === 0 ? 'Only Pending + unassigned proposals can be distributed' : undefined}
                    >
                      <Send className="w-3 h-3" />
                      Auto Distribute Selected ({eligibleCount})
                    </button>
                    <button
                      onClick={() => setSelectedIds(new Set())}
                      className="text-xs text-slate-500 hover:text-slate-800 transition-colors px-2"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              );
            })()}

            <div className="min-w-0">
              {paginatedProposals.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                    <FileText className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-medium text-slate-900 mb-2">No proposals found</h3>
                </div>
              ) : (
                <table className="min-w-full text-left align-middle">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50">
                      <th className="pl-4 pr-2 py-2 min-w-[100px]">
                        <div className="flex flex-col items-center justify-center gap-1">
                          <input
                            type="checkbox"
                            aria-label="Select all proposals on this page"
                            checked={paginatedProposals.length > 0 && paginatedProposals.every((p) => selectedIds.has(p.id))}
                            ref={(el) => {
                              if (el) {
                                const someSelected = paginatedProposals.some((p) => selectedIds.has(p.id));
                                const allSelected = paginatedProposals.length > 0 && paginatedProposals.every((p) => selectedIds.has(p.id));
                                el.indeterminate = someSelected && !allSelected;
                              }
                            }}
                            onChange={() => toggleSelectAllOnPage(paginatedProposals)}
                            className="w-5 h-5 rounded border-slate-300 text-[#C8102E] focus:ring-[#C8102E]/20 cursor-pointer transition-transform hover:scale-110"
                          />
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Select All</span>
                        </div>
                      </th>
                      <th className="px-6 py-2" colSpan={2} />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {paginatedProposals.map((proposal) => (
                      <tr
                        key={proposal.id}
                        className={`hover:bg-slate-50 transition-colors duration-200 group ${selectedIds.has(proposal.id) ? 'bg-[#C8102E]/5' : ''}`}
                      >
                        {/* --- COL 0: SELECTION CHECKBOX --- */}
                        <td className="px-2 py-5 text-center">
                          {isEligibleForAutoDistribute(proposal) && (
                            <div className="flex justify-center">
                              <input
                                type="checkbox"
                                aria-label={`Select proposal ${proposal.id}`}
                                checked={selectedIds.has(proposal.id)}
                                onChange={() => toggleRowSelected(proposal.id)}
                                className="w-5 h-5 rounded border-slate-300 text-[#C8102E] focus:ring-[#C8102E]/20 cursor-pointer transition-transform hover:scale-110"
                              />
                            </div>
                          )}
                        </td>
                        {/* --- COL 1: DETAILS --- */}
                        <td className="pl-2 pr-6 py-5">
                          <div className="flex flex-col gap-2">
                            <span className="text-base font-medium text-slate-800 group-hover:text-[#C8102E] transition-colors">
                              {proposal.title}
                            </span>

                            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
                              <div className="flex items-center gap-1.5">
                                <User className="w-3.5 h-3.5 text-slate-400" />
                                <span>{proposal.submittedBy}</span>
                              </div>
                              <div className={'flex items-center gap-1.5 font-semibold'}>
                                <Calendar className={'w-3.5 h-3.5'} />
                                <span>
                                  Submitted: {formatDate(proposal.submittedDate)}
                                </span>
                              </div>

                              {/* Year Badge */}
                              <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-slate-50 text-[#C8102E] rounded-lg font-bold border border-slate-200">
                                <CalendarDays className="w-3.5 h-3.5 text-[#C8102E]" />
                                {new Date(proposal.submittedDate).getFullYear()}
                              </span>


                              {/* Tags */}
                              {proposal.tags && proposal.tags.map((tag, idx) => (
                                <span
                                  key={idx}
                                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${getTagColor(tag)}`}
                                >
                                  <Tag className="w-3 h-3" />
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        </td>

                        {/* --- COL 2: ACTIONS (Admin Power) --- */}
                        <td className="px-6 py-5 text-right whitespace-nowrap">
                          <div className="flex items-center gap-3 w-full min-w-0">
                            <div className="flex flex-1 min-w-0 items-center justify-end gap-3 flex-wrap">
                              {/* Status Badge */}
                              {getStatusBadge(proposal)}

                              {/* Auto Distribute single proposal */}
                              {proposal.status === 'Pending' && !proposal.assignedRdStaff && (
                                <button
                                  onClick={() => handleAutoDistribute([parseInt(proposal.id)])}
                                  className="inline-flex items-center gap-1.5 px-3 h-8 rounded-lg transition-all duration-200 cursor-pointer text-xs font-medium shadow-sm bg-[#991B1B] text-white hover:bg-[#7a1616]"
                                  title="Auto-distribute to least-loaded R&D staff"
                                >
                                  <Send className="w-3 h-3" />
                                  Distribute
                                </button>
                              )}

                              {/* Action Button */}
                              {!proposal.assignedRdStaff && (proposal.status === "Pending" || proposal.status === "Revised Proposal") && (
                                <button
                                  onClick={() => handleViewProposal(proposal)}
                                  className="inline-flex items-center gap-1.5 px-3 h-8 rounded-lg transition-all duration-200 cursor-pointer text-xs font-medium shadow-sm bg-[#C8102E] text-white hover:bg-[#A00C24]"
                                >
                                  <Pen className="w-3 h-3" />
                                  Action
                                </button>
                              )}

                              {/* Change R&D */}
                              {(proposal.status === 'Under R&D Review' || (proposal.assignedRdStaff && (proposal.status === 'Pending' || proposal.status === 'Revised Proposal'))) && (
                                <button
                                  onClick={() => handleChangeRdStaff(proposal)}
                                  className="inline-flex items-center gap-1.5 px-3 h-8 rounded-lg transition-all duration-200 cursor-pointer text-xs font-medium shadow-sm bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100"
                                >
                                  <UserCog className="w-3 h-3" />
                                  Change R&D
                                </button>
                              )}
                            </div>

                            {/* Eye — always rightmost */}
                            <button
                              type="button"
                              onClick={() => handleViewDetails(proposal)}
                              className="inline-flex shrink-0 items-center justify-center w-8 h-8 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 cursor-pointer"
                              title="View details"
                            >
                              <Eye className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination */}
            {filteredProposals.length > 0 && (
              <div className="p-4 bg-slate-50 border-t border-slate-200 mt-auto">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-xs text-slate-600">
                  <span>
                    Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredProposals.length)} of {filteredProposals.length} proposals
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <ChevronLeft className="w-3 h-3" />
                      Previous
                    </button>
                    <span className="px-3 py-1.5 text-xs font-medium text-slate-600">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      Next
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </main>

          {/* Modals */}
          <ProposalModal
            proposal={selectedProposal}
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            onSubmitDecision={handleSubmitDecision}
            currentUser={currentUser}
            isLoading={isModalSubmitting}
          />

          <DetailedProposalModal
            proposal={selectedProposalForView}
            isOpen={isViewModalOpen}
            onClose={() => {
              setIsViewModalOpen(false);
              setSelectedProposalForView(null);
            }}
            agencies={agencies}
            sectors={[]}
            priorityAreas={[]}
          />

          {/* New Change R&D Modal */}
          <ChangeRndModal
            proposal={selectedProposalForChange}
            isOpen={isChangeRdModalOpen}
            onClose={() => {
              setIsChangeRdModalOpen(false);
              setSelectedProposalForChange(null);
            }}
            onConfirm={confirmRdChange}
          />

          {/* Evaluator List Modal */}
          <EvaluatorListModal
            evaluators={currentEvaluatorsList}
            message={currentEvaluatorMessage}
            isOpen={isEvaluatorModalOpen}
            onClose={() => {
              setIsEvaluatorModalOpen(false);
              setCurrentEvaluatorsList([]);
              setCurrentEvaluatorMessage('');
            }}
          />
        </div>
      </div>
    </>
  );
};

export default AdminProposalPage;
