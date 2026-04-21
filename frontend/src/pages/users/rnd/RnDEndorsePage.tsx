import React, { useState, useEffect } from 'react';
import {
  CheckCircle,
  XCircle,
  RotateCcw,
  Search,
  FileText,
  Users,
  User,
  Clock,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Gavel,
  Building2,
  Signature,
  Archive,
  BarChart2,
  Download,
} from 'lucide-react';
import {
  type EndorsementProposal,
  type EvaluatorDecision,
  type BudgetRow
} from '../../../types/evaluator';
import EvaluatorDecisionModal from '../../../components/rnd-component/RnDEvaluatorDecision';
import DecisionModal from '../../../components/rnd-component/EndorsementDecisionModal';
import {
  getProposalsForEndorsement,
  endorseProposal,
  requestRevision,
  rejectProposal,
  fetchDepartments,
  type EndorsementFilter
} from '../../../services/proposal.api';
import Swal from 'sweetalert2';
import { useAuthContext } from '../../../context/AuthContext';
import PageLoader from '../../../components/shared/PageLoader';
import { formatDate, formatDateTime } from '../../../utils/date-formatter';
import { exportToCsv } from '../../../utils/csv-export';

const EndorsePage: React.FC = () => {
  const { user } = useAuthContext();

  const [proposalsCache, setProposalsCache] = useState<Record<string, EndorsementProposal[]>>({});
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState<EndorsementFilter>('active');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('recent-old');

  // State for Evaluator Modal
  const [selectedDecision, setSelectedDecision] = useState<EvaluatorDecision | null>(null);
  const [isEvaluatorModalOpen, setIsEvaluatorModalOpen] = useState(false);

  // State for Endorsement Decision Modal
  const [isDecisionModalOpen, setIsDecisionModalOpen] = useState(false);

  // Shared state for selected proposal (used by both modals)
  const [selectedProposal, setSelectedProposal] = useState<{
    title: string;
    id: string;
    budget?: BudgetRow[];
    department?: string;
    email?: string;
    evaluatorDecisions?: EvaluatorDecision[];
  } | null>(null);

  // --- Budget transformer: raw estimated_budget items → grouped BudgetRow[] with breakdowns ---
  const transformEstimatedBudget = (items: any[]): BudgetRow[] => {
    if (!Array.isArray(items) || items.length === 0) return [];
    const map: Record<string, {
      ps: { items: any[]; total: number };
      mooe: { items: any[]; total: number };
      co: { items: any[]; total: number };
    }> = {};

    items.forEach((b: any) => {
      const src = b.source || 'Unknown';
      const amount = Number(b.amount || b.total_amount) || 0;
      const itemLabel = b.item || b.item_name || 'Unspecified Item';
      const rawType = (b.budget || b.category || '').toLowerCase();

      let cat: 'ps' | 'mooe' | 'co' = 'mooe';
      if (rawType.includes('ps') || rawType.includes('personal')) cat = 'ps';
      else if (rawType.includes('co') || rawType.includes('capital')) cat = 'co';
      else if (rawType.includes('mooe')) cat = 'mooe';

      if (!map[src]) map[src] = {
        ps: { items: [], total: 0 },
        mooe: { items: [], total: 0 },
        co: { items: [], total: 0 },
      };

      map[src][cat].total += amount;
      map[src][cat].items.push({ 
        item: itemLabel, 
        amount: Number(b.amount || b.total_amount || 0),
        subcategory: b.subcategory || (Array.isArray(b.budget_subcategories) ? b.budget_subcategories[0]?.label : b.budget_subcategories?.label) || b.custom_subcategory_label,
        specifications: b.specifications || b.spec,
        quantity: b.quantity,
        unit: b.unit,
        unitPrice: Number(b.unitPrice || b.unit_price || 0)
      });
    });

    return Object.entries(map).map(([source, data]) => ({
      source,
      ps: data.ps.total,
      mooe: data.mooe.total,
      co: data.co.total,
      total: data.ps.total + data.mooe.total + data.co.total,
      breakdown: {
        ps: data.ps.items,
        mooe: data.mooe.items,
        co: data.co.items,
      },
    }));
  };

  const itemsPerPage = 2;

  useEffect(() => {
    loadEndorsementProposals();
    setCurrentPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const loadEndorsementProposals = async () => {
    try {
      if (!proposalsCache[activeTab]) setLoading(true);
      const [data, depts] = await Promise.all([
        getProposalsForEndorsement(activeTab),
        fetchDepartments()
      ]);
      console.log('Fetched endorsement proposals:', data);

      const mapped: EndorsementProposal[] = data.map((p: any) => {
        let deptName = "";
        if (p.department?.name) {
          deptName = p.department.name;
        } else if (p.department) {
          deptName = typeof p.department === 'string' ? p.department : String(p.department);
        } else if (p.department_id) {
          deptName = depts.find((d: any) => Number(d.id) === Number(p.department_id))?.name || "";
        }

        return {
          id: p.id,
          title: p.title,
          submittedBy: p.submittedBy,
          budget: transformEstimatedBudget(
            (p.proposal_budget_versions?.sort((a: any, b: any) => b.version_number - a.version_number)[0]?.proposal_budget_items) || 
            p.estimated_budget || 
            []
          ),
          evaluatorDecisions: Object.values(
            p.evaluatorDecisions.reduce((acc: Record<string, any>, d: any) => {
              if (!acc[d.evaluatorId] || (acc[d.evaluatorId].decision === 'Pending' && d.decision !== 'Pending')) {
                acc[d.evaluatorId] = d;
              }
              return acc;
            }, {})
          ).map((d: any) => ({
            evaluatorId: String(d.evaluatorId),
            evaluatorName: d.evaluatorName,
            evaluatorDepartment: d.evaluatorDepartment, // Assuming API provides this
            evaluatorEmail: d.evaluatorEmail, // Assuming API provides this
            decision: d.decision,
            comments: d.comment || "No comment provided",
            submittedDate: d.submittedDate,
            ratings: d.ratings ? {
              title: d.ratings.title || 0,
              budget: d.ratings.budget || 0,
              timeline: d.ratings.timeline || 0
            } : undefined
          })),
          overallRecommendation: p.overallRecommendation,
          averageScores: p.averageScores || null,
          readyForEndorsement: p.readyForEndorsement,
          department: deptName || p.proponent_id?.department?.name || "N/A",
          proponentEmail: p.email || p.proponentEmail || p.proponent_id?.email || '',
          status: p.status,
          actionDate: p.actionDate || p.created_at,
          submittedDate: p.created_at || p.actionDate,
          versionNumber: p.versionNumber,
          totalVersions: p.totalVersions,
        };
      });

      const sorted = mapped.sort((a, b) => Number(b.id) - Number(a.id));
      setProposalsCache(prev => ({ ...prev, [activeTab]: sorted }));
    } catch (error) {
      console.error('Error loading endorsement proposals:', error);
      Swal.fire('Error', 'Failed to load endorsement proposals', 'error');
    } finally {
      setLoading(false);
    }
  };

  // --- Handlers for Evaluator Modal ---
  const handleOpenEvaluatorModal = (decision: EvaluatorDecision, proposalTitle: string, proposalId: string) => {
    setSelectedDecision(decision);
    setSelectedProposal({ title: proposalTitle, id: proposalId });
    setIsEvaluatorModalOpen(true);
  };

  const handleCloseEvaluatorModal = () => {
    setIsEvaluatorModalOpen(false);
    setSelectedDecision(null);
  };

  // --- Handlers for Decision Modal ---
  const handleOpenDecisionModal = (
    proposalTitle: string,
    proposalId: string,
    budgetData?: BudgetRow[],
    department?: string,
    email?: string,
    evaluatorDecisions?: EvaluatorDecision[],
  ) => {
    setSelectedProposal({
      title: proposalTitle,
      id: proposalId,
      budget: budgetData,
      department: department,
      email: email,
      evaluatorDecisions,
    });
    setIsDecisionModalOpen(true);
  };

  const handleCloseDecisionModal = () => {
    setIsDecisionModalOpen(false);
  };

  const handleDecisionSubmit = (
    status: "endorsed" | "revised" | "rejected",
    remarks: string,
    revisionDeadline?: string,
    includedEvaluatorIds?: string[],
  ) => {
    if (!selectedProposal) return; // Should not happen

    // Route to logic based on status
    if (status === 'endorsed') {
      handleEndorseProposal(selectedProposal.id, remarks);
    } else if (status === 'revised') {
      handleReturnForRevision(selectedProposal.id, remarks, revisionDeadline, includedEvaluatorIds);
    } else if (status === 'rejected') {
      handleRejectForClarification(selectedProposal.id, remarks);
    }

    handleCloseDecisionModal();
  };

  // --- Action Logic ---
  const handleEndorseProposal = async (proposalId: string, remarks: string) => {
    if (!user?.id) {
      Swal.fire('Error', 'User session not found. Please log in again.', 'error');
      return;
    }

    try {
      Swal.fire({
        title: 'Endorsing Proposal...',
        text: 'Please wait while we process the endorsement.',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      await endorseProposal({
        proposal_id: parseInt(proposalId),
        rnd_id: user.id,
        decision: "endorsed",
        remarks
      });

      await Swal.fire({
        icon: 'success',
        title: 'Endorsed!',
        text: 'The proposal has been successfully endorsed for funding.',
        timer: 2000,
        showConfirmButton: false
      });

      // Refresh list
      loadEndorsementProposals();

    } catch (error: any) {
      console.error('Error endorsing proposal:', error);
      Swal.fire('Error', error.response?.data?.message || 'Failed to endorse proposal.', 'error');
    }
  };

  const handleReturnForRevision = async (
    proposalId: string,
    remarks: string,
    deadlineStr?: string,
    includedEvaluatorIds?: string[],
  ) => {
    try {
      Swal.fire({
        title: 'Sending for Revision...',
        text: 'Please wait...',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      // 1. Calculate deadline in DAYS. The proponent-side view reconstructs the
      // absolute deadline as `created_at + deadline * 86400000`, so `deadline`
      // must be a day count, not an absolute timestamp.
      let days = 14; // Default 2 weeks
      if (deadlineStr) {
        if (deadlineStr.includes("1 Week")) days = 7;
        else if (deadlineStr.includes("3 Weeks")) days = 21;
        else if (deadlineStr.includes("1 Month")) days = 30;
        else if (deadlineStr.includes("6 Weeks")) days = 42;
        else if (deadlineStr.includes("2 Months")) days = 60;
      }

      // 2. Parse Structured Remarks
      let title_comment: string | undefined,
        budget_comment: string | undefined,
        timeline_comment: string | undefined,
        overall_comment: string | undefined;

      const parts = remarks.split(/\n\n(?=\[)/);
      parts.forEach(part => {
        if (part.startsWith("[Title Assessment]:")) title_comment = part.replace("[Title Assessment]:\n", "").trim();
        else if (part.startsWith("[Budget Assessment]:")) budget_comment = part.replace("[Budget Assessment]:\n", "").trim();
        else if (part.startsWith("[Timeline Assessment]:")) timeline_comment = part.replace("[Timeline Assessment]:\n", "").trim();
        else if (part.startsWith("[Overall Assessment]:")) overall_comment = part.replace("[Overall Assessment]:\n", "").trim();
        else {
          // Fallback for custom sections or if parsing fails, append to overall
          const cleanPart = part.replace(/^\[.*?\]:\n/, "").trim();
          overall_comment = overall_comment ? `${overall_comment}\n\n${cleanPart}` : cleanPart;
        }
      });

      await requestRevision({
        proposal_id: parseInt(proposalId),
        deadline: days,
        title_comment,
        budget_comment,
        timeline_comment,
        overall_comment,
        included_evaluator_ids: includedEvaluatorIds && includedEvaluatorIds.length > 0 ? includedEvaluatorIds : undefined,
      });

      await Swal.fire({
        icon: 'success',
        title: 'Sent for Revision',
        text: 'The proponent has been notified.',
        timer: 2000,
        showConfirmButton: false
      });

      loadEndorsementProposals();

    } catch (error: any) {
      console.error('Error returning proposal for revision:', error);
      Swal.fire('Error', error.response?.data?.message || 'Failed to send for revision.', 'error');
    }
  };

  const handleRejectForClarification = async (proposalId: string, remarks: string) => {
    try {
      Swal.fire({
        title: 'Rejecting Proposal...',
        text: 'Please wait...',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      await rejectProposal({
        proposal_id: parseInt(proposalId),
        comment: remarks
      });

      await Swal.fire({
        icon: 'success',
        title: 'Rejected',
        text: 'The proposal has been rejected.',
        timer: 2000,
        showConfirmButton: false
      });

      loadEndorsementProposals();

    } catch (error: any) {
      console.error('Error rejecting proposal:', error);
      Swal.fire('Error', error.response?.data?.message || 'Failed to reject proposal.', 'error');
    }
  };

  // --- UI Helpers ---
  const getDecisionIcon = (decision: string) => {
    switch (decision?.trim().toLowerCase()) {
      case 'approve':
      case 'approved':
        return <CheckCircle className='w-4 h-4 text-emerald-600' />;
      case 'revise':
      case 'revised':
        return <RotateCcw className='w-4 h-4 text-amber-600' />;
      case 'reject':
      case 'rejected':
        return <XCircle className='w-4 h-4 text-red-600' />;
      case 'declined':
        return <XCircle className='w-4 h-4 text-rose-500' />;
      case 'in review':
        return <FileText className='w-4 h-4 text-cyan-600' />;
      case 'extension requested':
        return <Clock className='w-4 h-4 text-orange-600' />;
      case 'pending':
        return <Clock className='w-4 h-4 text-yellow-600' />;
      default:
        return <FileText className='w-4 h-4 text-slate-600' />;
    }
  };

  const getDecisionColor = (decision: string) => {
    switch (decision?.trim().toLowerCase()) {
      case 'approve':
      case 'approved':
        return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      case 'revise':
      case 'revised':
        return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'reject':
      case 'rejected':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'declined':
        return 'text-rose-500 bg-rose-50 border-rose-200';
      case 'in review':
        return 'text-cyan-600 bg-cyan-50 border-cyan-200';
      case 'extension requested':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'pending':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default:
        return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  // Derived proposals & Filtering
  const endorsementProposals = proposalsCache[activeTab] || [];
  
  const filteredProposals = endorsementProposals.filter((p) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = p.title.toLowerCase().includes(term) ||
           p.submittedBy.toLowerCase().includes(term) ||
           String(p.id).toLowerCase().includes(term);
    
    return matchesSearch;
  });

  const sortedFiltered = [...filteredProposals].sort((a, b) => {
    // 1. Primary Sort: Ready for Endorsement first
    if (a.readyForEndorsement && !b.readyForEndorsement) return -1;
    if (!a.readyForEndorsement && b.readyForEndorsement) return 1;

    // 2. Secondary Sort: User-selected order
    if (sortOrder === "a-z") return a.title.localeCompare(b.title);
    if (sortOrder === "z-a") return b.title.localeCompare(a.title);

    const dateA = new Date(a.submittedDate || 0).getTime();
    const dateB = new Date(b.submittedDate || 0).getTime();

    if (sortOrder === "recent-old") return dateB - dateA;
    if (sortOrder === "old-recent") return dateA - dateB;

    return 0;
  });

  // Pagination
  const totalPages = Math.ceil(sortedFiltered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProposals = sortedFiltered.slice(startIndex, startIndex + itemsPerPage);

  // Helper for Random Department Colors
  const getDepartmentColor = (departmentName: string) => {
    let hash = 0;
    for (let i = 0; i < departmentName.length; i++) {
      hash = departmentName.charCodeAt(i) + ((hash << 5) - hash);
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


  if (loading && activeTab === 'active') return <PageLoader mode="table" />;


  return (
    <>
      {/* Existing Evaluator Modal */}
      <EvaluatorDecisionModal
        isOpen={isEvaluatorModalOpen}
        onClose={handleCloseEvaluatorModal}
        decision={selectedDecision!}
        proposalTitle={selectedProposal?.title || ''}
      />

      {/* New Endorsement Decision Modal */}
      <DecisionModal
        isOpen={isDecisionModalOpen}
        onClose={handleCloseDecisionModal}
        proposalTitle={selectedProposal?.title || ''}
        department={selectedProposal?.department}
        email={selectedProposal?.email}
        budgetData={selectedProposal?.budget}
        evaluatorDecisions={selectedProposal?.evaluatorDecisions}
        onSubmit={handleDecisionSubmit}
      />
    <div className="min-h-screen w-full px-5 sm:px-8 lg:px-10 xl:px-12 2xl:px-16 py-8 lg:py-10 bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col lg:flex-row animate-fade-in">
      <div className="flex w-full min-w-0 flex-col gap-3 lg:gap-4">
        {/* Header */}
        <header className="flex-shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#C8102E] leading-tight">
                Proposal Endorsement
              </h1>
              <p className="text-slate-600 mt-2 text-sm leading-relaxed">
                Review evaluator decisions and endorse proposals for final approval
              </p>
            </div>
            <button
              onClick={() =>
                exportToCsv(`endorsement-${activeTab}`, endorsementProposals, [
                  { header: 'ID', accessor: (p) => p.id },
                  { header: 'Title', accessor: (p) => p.title },
                  { header: 'Submitted By', accessor: (p) => p.submittedBy },
                  { header: 'Department', accessor: (p) => p.department || '' },
                  { header: 'Status', accessor: (p) => p.status || '' },
                  { header: 'Version', accessor: (p) => p.versionNumber ?? 1 },
                  { header: 'Ready for Endorsement', accessor: (p) => (p.readyForEndorsement ? 'yes' : 'no') },
                  { header: 'Overall Recommendation', accessor: (p) => p.overallRecommendation || '' },
                  { header: 'Avg Score', accessor: (p) => (p.averageScores ? p.averageScores.overall.toFixed(2) : '') },
                  { header: 'Action Date', accessor: (p) => p.actionDate || '' },
                ])
              }
              disabled={endorsementProposals.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold shadow-sm bg-white text-[#C8102E] border border-[#C8102E]/30 hover:bg-[#C8102E]/5 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              title={endorsementProposals.length === 0 ? 'No rows to export' : 'Export visible rows to CSV'}
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </header>

        {/* Stats Cards — always calculate from active queue */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {(() => {
            const activeProposalsForStats = proposalsCache['active'] || [];
            return (
              <>
          <div className="bg-blue-50 shadow-xl rounded-2xl border border-blue-400 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-700 mb-2">Ready for Endorsement</p>
                <p className="text-xl font-bold text-blue-800 tabular-nums">
                  {activeProposalsForStats.filter((p) => p.readyForEndorsement).length}
                </p>
              </div>
              <Signature className="w-6 h-6 text-blue-800" />
            </div>
          </div>

          <div className="bg-amber-50 shadow-xl rounded-2xl border border-amber-300 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-700 mb-2">Pending Evaluators</p>
                <p className="text-xl font-bold text-amber-600 tabular-nums">
                  {activeProposalsForStats.filter((p) => !p.readyForEndorsement).length}
                </p>
              </div>
              <Users className="w-6 h-6 text-amber-500" />
            </div>
          </div>

          <div className="bg-emerald-50 shadow-xl rounded-2xl border border-emerald-300 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-700 mb-2">Approved</p>
                <p className="text-xl font-bold text-emerald-600 tabular-nums">
                  {activeProposalsForStats.filter((p) => p.overallRecommendation === 'Approve').length}
                </p>
              </div>
              <CheckCircle className="w-6 h-6 text-emerald-500" />
            </div>
          </div>

          <div className="bg-orange-50 shadow-xl rounded-2xl border border-orange-300 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-700 mb-2">Need Revision</p>
                <p className="text-xl font-bold text-orange-600 tabular-nums">
                  {activeProposalsForStats.filter((p) => p.overallRecommendation === 'Revise').length}
                </p>
              </div>
              <RotateCcw className="w-6 h-6 text-orange-500" />
            </div>
          </div>
              </>
            );
          })()}
        </section>

        {/* Stepper / Tabs */}
        <section className="flex-shrink-0 overflow-x-auto">
          <div className="flex flex-col gap-3">
            <div className="flex gap-1">
              <button
                onClick={() => setActiveTab('active')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap border ${
                  activeTab === 'active'
                    ? 'bg-[#C8102E] text-white border-[#C8102E] shadow-sm'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Gavel className={`w-4 h-4 ${activeTab === 'active' ? 'text-white' : 'text-slate-400'}`} />
                <span>Active</span>
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  activeTab === 'active' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                }`}>
                  {proposalsCache['active'] ? proposalsCache['active']!.length : (activeTab === 'active' ? endorsementProposals.length : 0)}
                </span>
              </button>

              <button
                onClick={() => {
                  if (activeTab !== 'archive' && activeTab !== 'revised' && activeTab !== 'rejected') {
                    setActiveTab('archive');
                  }
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap border ${
                  ['archive', 'revised', 'rejected'].includes(activeTab)
                    ? 'bg-[#C8102E] text-white border-[#C8102E] shadow-sm'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Archive className={`w-4 h-4 ${['archive', 'revised', 'rejected'].includes(activeTab) ? 'text-white' : 'text-slate-400'}`} />
                <span>Archive</span>
              </button>
            </div>

            {/* Sub Tabs for Archive */}
            {['archive', 'revised', 'rejected'].includes(activeTab) && (
              <div className="flex gap-4">
                {([
                  { key: 'archive', label: 'Endorsed for Funding', icon: Signature, colorClass: 'blue' },
                  { key: 'revised', label: 'Revised', icon: RotateCcw, colorClass: 'orange' },
                  { key: 'rejected', label: 'Rejected', icon: XCircle, colorClass: 'red' },
                ] as { key: EndorsementFilter; label: string; icon: any; colorClass: string }[]).map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.key;
                  const count = proposalsCache[tab.key] ? proposalsCache[tab.key]!.length : (isActive ? endorsementProposals.length : 0);
                  
                  let activeBg = '';
                  let activeText = '';
                  let activeBorder = '';
                  let activeBadgeBg = '';
                  let activeBadgeText = '';

                  if (tab.colorClass === 'blue') {
                    activeBg = 'bg-blue-50';
                    activeText = 'text-blue-800';
                    activeBorder = 'border-blue-400';
                    activeBadgeBg = 'bg-blue-100';
                    activeBadgeText = 'text-blue-800';
                  } else if (tab.colorClass === 'emerald') {
                    activeBg = 'bg-emerald-50';
                    activeText = 'text-emerald-700';
                    activeBorder = 'border-emerald-300';
                    activeBadgeBg = 'bg-emerald-100';
                    activeBadgeText = 'text-emerald-700';
                  } else if (tab.colorClass === 'orange') {
                    activeBg = 'bg-orange-50';
                    activeText = 'text-orange-700';
                    activeBorder = 'border-orange-300';
                    activeBadgeBg = 'bg-orange-100';
                    activeBadgeText = 'text-orange-700';
                  } else if (tab.colorClass === 'red') {
                    activeBg = 'bg-rose-50';
                    activeText = 'text-rose-700';
                    activeBorder = 'border-rose-300';
                    activeBadgeBg = 'bg-rose-100';
                    activeBadgeText = 'text-rose-700';
                  }

                  return (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap border ${
                        isActive
                          ? `${activeBg} ${activeText} ${activeBorder} shadow-sm`
                          : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:text-slate-700'
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 ${isActive ? activeText : 'text-slate-400'}`} />
                      <span>{tab.label}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                        isActive ? activeBadgeBg + ' ' + activeBadgeText : 'bg-slate-100 text-slate-500'
                      }`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Search and Filters Section */}
        <section className="flex-shrink-0 flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search proposals..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-transparent bg-white shadow-sm"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={sortOrder}
              onChange={(e) => { setSortOrder(e.target.value); setCurrentPage(1); }}
              className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-transparent bg-white shadow-sm cursor-pointer"
            >
              <option value="recent-old">Recent to Old</option>
              <option value="old-recent">Old to Recent</option>
              <option value="a-z">Title (A-Z)</option>
              <option value="z-a">Title (Z-A)</option>
            </select>
          </div>
        </section>

        {/* Proposals list — natural document flow so browser zoom does not trap/clip rows in a tiny scroll region */}
        <main className="relative flex flex-1 w-full min-w-0 flex-col overflow-auto rounded-2xl border border-slate-200 bg-white shadow-xl">

          {/* Skeleton loader — covers table only when on archive tabs */}
          {loading && ['archive', 'revised', 'rejected'].includes(activeTab) && (
            <div className="p-0">
              <PageLoader mode="endorsement-archive" />
            </div>
          )}

          <div className="flex-shrink-0 border-b border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#C8102E]" />
                {activeTab === 'active'
                  ? 'Endorsement Proposals'
                  : activeTab === 'revised'
                  ? 'Revised Proposals'
                  : activeTab === 'rejected'
                  ? 'Rejected Proposals'
                  : 'Endorsed for Funding'}
              </h3>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <User className="w-4 h-4" />
                <span>{filteredProposals.length} total proposals</span>
              </div>
            </div>
          </div>

          {!loading && <div className="w-full min-w-0">
            {filteredProposals.length === 0 ? (
              <div className="text-center py-12 px-4 mt-4">
                <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                  {activeTab === 'active' ? (
                    <Gavel className="w-8 h-8 text-slate-400" />
                  ) : (
                    <Archive className="w-8 h-8 text-slate-400" />
                  )}
                </div>
                <h3 className="text-lg font-medium text-slate-900 mb-2">
                  {activeTab === 'active'
                    ? 'No proposals ready for endorsement'
                    : activeTab === 'revised'
                    ? 'No proposals sent for revision yet'
                    : activeTab === 'rejected'
                    ? 'No rejected proposals yet'
                    : 'No archived proposals yet'}
                </h3>
                <p className="text-slate-500 max-w-sm mx-auto">
                  {activeTab === 'active'
                    ? 'Proposals will appear here once evaluators complete their reviews.'
                    : activeTab === 'revised'
                    ? 'Proposals you send back for revision will appear here.'
                    : activeTab === 'rejected'
                    ? 'Proposals you reject will appear here.'
                    : 'Endorsed and funded proposals live here for audit.'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {paginatedProposals.map((proposal) => (
                  <article
                    key={proposal.id}
                    className="p-4 sm:p-5 hover:bg-slate-50 transition-colors duration-200 group w-full min-w-0"
                    aria-labelledby={`proposal-title-${proposal.id}`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-start gap-4 w-full min-w-0 lg:justify-between">
                      <div className="flex-1 min-w-0 w-full lg:max-w-none">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <h2
                              id={`proposal-title-${proposal.id}`}
                              className="break-words text-base font-semibold leading-snug text-slate-800 transition-colors duration-200 group-hover:text-[#C8102E]"
                            >
                              {proposal.title}
                            </h2>
                            {/* Version badge — any version > 1 signals a revision */}
                            {proposal.versionNumber && proposal.versionNumber > 1 && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border border-indigo-200 text-indigo-700 bg-indigo-50 flex-shrink-0"
                                title={`Currently showing v${proposal.versionNumber}${proposal.totalVersions ? ` of ${proposal.totalVersions}` : ''}. Earlier versions' scores remain in history.`}
                              >
                                v{proposal.versionNumber}
                              </span>
                            )}
                          </div>
                          {/* Action Button — right beside title */}
                          {activeTab === 'active' && proposal.readyForEndorsement && (
                            <button
                              onClick={() => handleOpenDecisionModal(proposal.title, proposal.id, proposal.budget, proposal.department, proposal.proponentEmail, proposal.evaluatorDecisions)}
                              className="inline-flex items-center gap-1.5 px-3 h-8 rounded-lg bg-[#C8102E] text-white hover:bg-[#A00C24] hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:ring-offset-1 transition-all duration-200 cursor-pointer text-xs font-medium shadow-sm flex-shrink-0"
                            >
                              <Gavel className="w-3 h-3" />
                              Action
                            </button>
                          )}
                          {!proposal.readyForEndorsement && (() => {
                            const pending = proposal.evaluatorDecisions.filter(d => d.decision === 'Pending').length;
                            const declined = proposal.evaluatorDecisions.filter(d => d.decision === 'Declined').length;
                            const inReview = proposal.evaluatorDecisions.filter(d => d.decision === 'In Review').length;
                            const extReq = proposal.evaluatorDecisions.filter(d => d.decision === 'Extension Requested').length;
                            return (
                              <>
                                {pending > 0 && (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border border-amber-200 text-amber-600 bg-amber-50 flex-shrink-0">
                                    {pending} Pending
                                  </span>
                                )}
                                {declined > 0 && (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border border-rose-200 text-rose-500 bg-rose-50 flex-shrink-0">
                                    {declined} Declined
                                  </span>
                                )}
                                {inReview > 0 && (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border border-cyan-200 text-cyan-600 bg-cyan-50 flex-shrink-0">
                                    {inReview} In Review
                                  </span>
                                )}
                                {extReq > 0 && (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border border-orange-200 text-orange-600 bg-orange-50 flex-shrink-0">
                                    {extReq} Extension Requested
                                  </span>
                                )}
                              </>
                            );
                          })()}
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mb-3">
                          <div className="flex items-center gap-1.5">
                            <User className="w-3 h-3" aria-hidden="true" />
                            <span>By: {proposal.submittedBy}</span>
                          </div>

                          {/* Department Badge */}
                          {proposal.department && proposal.department !== "N/A" && (
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${getDepartmentColor(proposal.department)}`}>
                              <Building2 className="w-3 h-3" />
                              {proposal.department}
                            </span>
                          )}
                        </div>

                        {/* Feasibility Assessment Design */}
                        {proposal.averageScores && (
                          <div className="mt-6 p-4 sm:p-5 bg-gradient-to-br from-slate-50/50 via-slate-50/30 to-white border border-indigo-100 rounded-2xl shadow-sm">
                            <div className="flex items-center justify-between mb-5">
                              <div className="flex items-center gap-2.5">
                                  <BarChart2 className="w-5 h-5 text-red-600" />
                                <div>
                                  <h4 className="text-sm font-bold text-slate-800">Feasibility Assessment</h4>
                                  <p className="text-[10px] text-slate-500 font-medium">Consolidated evaluator ratings</p>
                                </div>
                              </div>
                              <div className={`px-3 py-1 rounded-full text-xs font-black border shadow-sm ${
                                proposal.averageScores.overall >= 4
                                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                  : proposal.averageScores.overall >= 3
                                  ? 'bg-amber-50 border-amber-200 text-amber-700'
                                  : 'bg-red-50 border-red-200 text-red-700'
                              }`}>
                                {proposal.averageScores.overall.toFixed(1)} <span className="opacity-50">/ 5.0</span>
                              </div>
                            </div>

                            {/* Sliding Scale Score Bars */}
                            <div className="space-y-4 mt-3">
                              {[
                                { label: 'Title', value: proposal.averageScores.title },
                                { label: 'Budget', value: proposal.averageScores.budget },
                                { label: 'Timeline', value: proposal.averageScores.timeline },
                              ].map((item) => {
                                const percentage = (item.value / 5) * 100;
                                const colorClass = item.value >= 4 ? 'bg-emerald-500' : item.value >= 3 ? 'bg-amber-400' : 'bg-red-500';
                                const textClass = item.value >= 4 ? 'text-emerald-600' : item.value >= 3 ? 'text-amber-600' : 'text-red-500';
                                return (
                                  <div key={item.label} className="relative">
                                    <div className="flex items-center justify-between mb-1.5">
                                      <span className="text-[11px] font-medium text-slate-600">{item.label}</span>
                                      <span className={`text-sm font-bold ${textClass}`}>{item.value.toFixed(1)}</span>
                                    </div>
                                    <div className="relative h-2 bg-slate-200 rounded-full">
                                      <div
                                        className={`absolute top-0 left-0 h-full rounded-full ${colorClass} transition-all duration-500`}
                                        style={{ width: `${percentage}%` }}
                                      />
                                      {/* Tick marks */}
                                      <div className="absolute top-0 left-0 w-full h-full flex justify-between px-0.5">
                                        {[0, 1, 2, 3, 4].map((tick) => (
                                          <div key={tick} className="w-0.5 h-full bg-white/60" />
                                        ))}
                                      </div>
                                      {/* Score marker */}
                                      <div
                                        className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-white shadow-md ${colorClass}`}
                                        style={{ left: `calc(${percentage}% - 6px)` }}
                                      />
                                    </div>
                                    <div className="flex justify-between mt-0.5">
                                      {[1, 2, 3, 4, 5].map((num) => (
                                        <span key={num} className="text-[9px] text-slate-400 w-4 text-center">{num}</span>
                                      ))}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                            <p className="text-[10px] text-slate-400 mt-2 text-right">
                              Based on {proposal.averageScores.evaluatorCount} evaluator{proposal.averageScores.evaluatorCount > 1 ? 's' : ''}
                            </p>
                          </div>
                        )}

                        {/* Evaluator Decisions */}
                        <div className="space-y-4 mt-6">
                          <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                            <Users className="w-4 h-4 text-[#C8102E]" />
                            Evaluator Decisions
                          </h4>
                          <div 
                            className="grid w-full min-w-0 gap-3"
                            style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))' }}
                          >
                            {proposal.evaluatorDecisions.map((decision, index) => (
                              <div
                                key={`${decision.evaluatorId}-${index}`}
                                className={`min-w-0 w-full border rounded-lg p-3 ${getDecisionColor(decision.decision)} cursor-pointer hover:shadow-md transition-all duration-200`}
                                onClick={() => handleOpenEvaluatorModal(decision, proposal.title, proposal.id)}
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center">
                                    {getDecisionIcon(decision.decision)}
                                    <span className="ml-2 text-sm font-medium">
                                      {decision.evaluatorName}
                                    </span>
                                  </div>
                                  <span className="text-xs text-slate-500">
                                    {formatDate(decision.submittedDate)}
                                  </span>
                                </div>

                                <div className="flex items-center mb-2">
                                  <span className="text-xs font-medium">
                                    Decision: {decision.decision}
                                  </span>
                                </div>

                                <div className="bg-white bg-opacity-50 rounded p-2">
                                  <div className="flex items-start">
                                    <MessageSquare className="w-3 h-3 mt-0.5 mr-2 text-slate-500" />
                                    <p className="text-xs text-slate-700 line-clamp-2">
                                      {decision.comments}
                                    </p>
                                  </div>
                                </div>
                                <div className="mt-2 text-xs text-blue-600 font-medium">
                                  Click to view full assessment →
                                </div>
                              </div>
                            ))}

                            {/* Show missing evaluators — active queue only */}
                            {activeTab === 'active' && proposal.evaluatorDecisions.length < 2 && (
                              <div className="min-w-0 w-full border-2 border-dashed border-slate-300 rounded-lg p-4 flex items-center justify-center sm:min-h-[120px]">
                                <div className="text-center text-slate-500 max-w-md mx-auto px-2">
                                  <User className="w-6 h-6 mx-auto mb-2 opacity-50" />
                                  <p className="text-xs font-medium">Waiting for additional evaluator</p>
                                  <p className="text-xs">
                                    Cannot endorse until all evaluators complete review
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* History tab — show when this R&D took the action */}
                      {activeTab !== 'active' && proposal.actionDate && (
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-semibold border ${
                            activeTab === 'revised'
                              ? 'bg-amber-50 border-amber-200 text-amber-700'
                              : activeTab === 'rejected'
                              ? 'bg-red-50 border-red-200 text-red-700'
                              : 'bg-blue-50 border-blue-200 text-blue-700'
                          }`}>
                            {activeTab === 'revised' ? <RotateCcw className="w-3 h-3" /> :
                             activeTab === 'rejected' ? <XCircle className="w-3 h-3" /> :
                             <CheckCircle className="w-3 h-3" />}
                            {activeTab === 'revised' ? 'Revision Sent' :
                             activeTab === 'rejected' ? 'Rejected' :
                             'Endorsed for Funding'}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            {formatDateTime(proposal.actionDate)}
                          </span>
                        </div>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>}

          {/* Pagination */}
          {filteredProposals.length > 0 && (
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex-shrink-0">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-xs text-slate-600">
                <span>
                  Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredProposals.length)} of {filteredProposals.length} proposals
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#C8102E] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#C8102E] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    Next
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
    </>
  );
};

export default EndorsePage;
