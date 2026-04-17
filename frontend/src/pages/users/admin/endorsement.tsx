import React, { useState, useEffect } from 'react';
import {
  CheckCircle,
  XCircle,
  RotateCcw,
  FileText,
  User,
  Users,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Gavel,
  Building2,
  Signature,
  Clock,
  Archive,
  BarChart2,
} from 'lucide-react';
import {
  type EndorsementProposal,
  type EvaluatorDecision,
  type BudgetRow,
} from '../../../types/evaluator';
import AdminEvaluatorDecisionModal from '../../../components/admin-component/AdminEvaluatorDecisionModal';
import AdminEndorsementDecisionModal from '../../../components/admin-component/AdminEndorsementDecisionModal';
import {
  endorseProposal,
  requestRevision,
  rejectProposal,
  getProposalsForEndorsement,
  fetchDepartments,
  type EndorsementFilter,
} from '../../../services/proposal.api';
import { useAuthContext } from '../../../context/AuthContext';
import Swal from 'sweetalert2';
import PageLoader from '../../../components/shared/PageLoader';
import { formatDate, formatDateTime } from '../../../utils/date-formatter';

const AdminEndorsementPage: React.FC = () => {
  const { user } = useAuthContext();
  const [endorsementProposals, setEndorsementProposals] = useState<EndorsementProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState<EndorsementFilter>('active');

  // State for Evaluator Modal
  const [selectedDecision, setSelectedDecision] = useState<EvaluatorDecision | null>(null);
  const [isEvaluatorModalOpen, setIsEvaluatorModalOpen] = useState(false);

  // State for Decision Modal
  const [isDecisionModalOpen, setIsDecisionModalOpen] = useState(false);

  // Shared state for selected proposal (used by both modals)
  const [selectedProposal, setSelectedProposal] = useState<{
    title: string;
    id: string;
    budget?: BudgetRow[];
    department?: string;
    email?: string;
    submittedBy?: string;
    evaluatorDecisions?: EvaluatorDecision[];
  } | null>(null);

  const itemsPerPage = 5;

  // Raw estimated_budget items → grouped BudgetRow[] (kept in sync with RnD page).
  const transformEstimatedBudget = (items: any[]): BudgetRow[] => {
    if (!Array.isArray(items) || items.length === 0) return [];
    const map: Record<string, {
      ps: { items: { item: string; amount: number }[]; total: number };
      mooe: { items: { item: string; amount: number }[]; total: number };
      co: { items: { item: string; amount: number }[]; total: number };
    }> = {};

    items.forEach((b: any) => {
      const src = b.source || 'Unknown';
      const amount = Number(b.amount) || 0;
      const itemLabel = b.item || 'Unspecified Item';
      const rawType = (b.budget || '').toLowerCase();

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
      map[src][cat].items.push({ item: itemLabel, amount });
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

  useEffect(() => {
    loadEndorsementProposals();
    setCurrentPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const loadEndorsementProposals = async () => {
    try {
      setLoading(true);
      const [data, depts] = await Promise.all([
        getProposalsForEndorsement(activeTab),
        fetchDepartments(),
      ]);

      const mapped: EndorsementProposal[] = data.map((p: any) => {
        let deptName = '';
        if (p.department?.name) deptName = p.department.name;
        else if (p.department) deptName = typeof p.department === 'string' ? p.department : String(p.department);
        else if (p.department_id) {
          deptName = depts.find((d: any) => Number(d.id) === Number(p.department_id))?.name || '';
        }

        return {
          id: p.id,
          title: p.title,
          submittedBy: p.submittedBy,
          budget: transformEstimatedBudget(p.estimated_budget || []),
          evaluatorDecisions: Object.values(
            p.evaluatorDecisions.reduce((acc: Record<string, any>, d: any) => {
              if (!acc[d.evaluatorId] || (acc[d.evaluatorId].decision === 'Pending' && d.decision !== 'Pending')) {
                acc[d.evaluatorId] = d;
              }
              return acc;
            }, {}),
          ).map((d: any) => ({
            evaluatorId: String(d.evaluatorId),
            evaluatorName: d.evaluatorName,
            evaluatorDepartment: d.evaluatorDepartment,
            evaluatorEmail: d.evaluatorEmail,
            decision: d.decision,
            comments: d.comment || 'No comment provided',
            submittedDate: d.submittedDate,
            ratings: d.ratings
              ? {
                  title: d.ratings.title || 0,
                  budget: d.ratings.budget || 0,
                  timeline: d.ratings.timeline || 0,
                }
              : undefined,
          })),
          overallRecommendation: p.overallRecommendation,
          averageScores: p.averageScores || null,
          readyForEndorsement: p.readyForEndorsement,
          department: deptName || p.proponent_id?.department?.name || 'N/A',
          proponentEmail: p.email || p.proponentEmail || p.proponent_id?.email || '',
          status: p.status,
          actionDate: p.actionDate,
          versionNumber: p.versionNumber,
          totalVersions: p.totalVersions,
        };
      });

      const sorted = mapped.sort((a, b) => Number(b.id) - Number(a.id));
      setEndorsementProposals(sorted);
    } catch (error) {
      console.error('Error loading endorsement proposals:', error);
      Swal.fire('Error', 'Failed to load endorsement proposals', 'error');
    } finally {
      setLoading(false);
    }
  };

  // --- Handlers for Evaluator Modal ---
  const handleOpenEvaluatorModal = (decision: EvaluatorDecision, proposalTitle: string, proposalId: string, department?: string, email?: string, submittedBy?: string) => {
    setSelectedDecision(decision);
    setSelectedProposal({ 
      title: proposalTitle, 
      id: proposalId, 
      department: department, 
      email: email, 
      submittedBy: submittedBy 
    });
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

  const handleDecisionSubmit = async (
    status: 'endorsed' | 'revised' | 'rejected',
    remarks: string,
    revisionDeadline?: string,
    includedEvaluatorIds?: string[],
  ) => {
    if (!selectedProposal || !user?.id) return;

    try {
      Swal.fire({
        title: 'Processing Decision...',
        text: 'Please wait...',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      const proposalIdNum = parseInt(selectedProposal.id);

      if (status === 'endorsed') {
        await endorseProposal({
          proposal_id: proposalIdNum,
          rnd_id: user.id,
          decision: 'endorsed',
          remarks,
        });
      } else if (status === 'revised') {
        // Deadline contract: DAYS (<=90), not an absolute timestamp.
        // Backend reconstructs the absolute deadline as created_at + deadline * 86400000.
        let days = 14;
        if (revisionDeadline) {
          if (revisionDeadline.includes('1 Week')) days = 7;
          else if (revisionDeadline.includes('3 Weeks')) days = 21;
          else if (revisionDeadline.includes('1 Month')) days = 30;
          else if (revisionDeadline.includes('6 Weeks')) days = 42;
          else if (revisionDeadline.includes('2 Months')) days = 60;
        }

        // Parse structured remarks into per-section comments (matches RnD flow).
        let title_comment: string | undefined;
        let budget_comment: string | undefined;
        let timeline_comment: string | undefined;
        let overall_comment: string | undefined;

        const parts = remarks.split(/\n\n(?=\[)/);
        parts.forEach((part) => {
          if (part.startsWith('[Title Assessment]:')) title_comment = part.replace('[Title Assessment]:\n', '').trim();
          else if (part.startsWith('[Budget Assessment]:')) budget_comment = part.replace('[Budget Assessment]:\n', '').trim();
          else if (part.startsWith('[Timeline Assessment]:')) timeline_comment = part.replace('[Timeline Assessment]:\n', '').trim();
          else if (part.startsWith('[Overall Assessment]:')) overall_comment = part.replace('[Overall Assessment]:\n', '').trim();
          else {
            const cleanPart = part.replace(/^\[.*?\]:\n/, '').trim();
            overall_comment = overall_comment ? `${overall_comment}\n\n${cleanPart}` : cleanPart;
          }
        });

        await requestRevision({
          proposal_id: proposalIdNum,
          deadline: days,
          title_comment,
          budget_comment,
          timeline_comment,
          overall_comment,
          included_evaluator_ids:
            includedEvaluatorIds && includedEvaluatorIds.length > 0
              ? includedEvaluatorIds
              : undefined,
        });
      } else if (status === 'rejected') {
        await rejectProposal({
          proposal_id: proposalIdNum,
          comment: remarks,
        });
      }

      await Swal.fire('Success', 'Decision processed successfully.', 'success');
      loadEndorsementProposals();
    } catch (error: unknown) {
      console.error('Action error:', error);
      const err = error as { response?: { data?: { message?: string } } };
      Swal.fire('Error', err.response?.data?.message || 'Failed to process decision.', 'error');
    }

    handleCloseDecisionModal();
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
  // Pagination
  const totalPages = Math.ceil(endorsementProposals.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProposals = endorsementProposals.slice(startIndex, startIndex + itemsPerPage);

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

  if (loading) {
    return <PageLoader mode="endorsement" />;
  }

  return (
    <>
      {/* Admin Evaluator Modal - Moved outside to preserve stacking context */}
      <AdminEvaluatorDecisionModal
        isOpen={isEvaluatorModalOpen}
        onClose={handleCloseEvaluatorModal}
        decision={selectedDecision!}
        proposalTitle={selectedProposal?.title || ''}
        proposalId={selectedProposal?.id || ''}
      />

      {/* Admin Endorsement Decision Modal - Moved outside to preserve stacking context */}
      <AdminEndorsementDecisionModal
        isOpen={isDecisionModalOpen}
        onClose={handleCloseDecisionModal}
        proposalTitle={selectedProposal?.title || ""}
        department={selectedProposal?.department}
        email={selectedProposal?.email}
        budgetData={selectedProposal?.budget}
        evaluatorDecisions={selectedProposal?.evaluatorDecisions}
        onSubmit={handleDecisionSubmit}
      />

      <div className="min-h-screen lg:h-screen px-5 sm:px-8 lg:px-10 xl:px-12 2xl:px-16 py-8 lg:py-10 bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col lg:flex-row animate-fade-in">

      <div className="flex-1 flex flex-col gap-4 lg:gap-6 overflow-hidden min-w-0">
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
          </div>
        </header>

        {/* Stats Cards — only meaningful on the active queue */}
        {activeTab === 'active' && (
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-blue-50 shadow-xl rounded-2xl border border-blue-400 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-700 mb-2">Ready for Endorsement</p>
                <p className="text-xl font-bold text-blue-800 tabular-nums">
                  {endorsementProposals.filter((p) => p.readyForEndorsement).length}
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
                  {endorsementProposals.filter((p) => !p.readyForEndorsement).length}
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
                  {endorsementProposals.filter((p) => p.overallRecommendation === 'Approve').length}
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
                  {endorsementProposals.filter((p) => p.overallRecommendation === 'Revise').length}
                </p>
              </div>
              <RotateCcw className="w-6 h-6 text-orange-500" />
            </div>
          </div>
        </section>
        )}

        {/* Tab bar — active queue + history views */}
        <section className="flex-shrink-0">
          <div className="inline-flex bg-white rounded-xl border border-slate-200 p-1 shadow-sm">
            {([
              { key: 'active', label: 'Active', icon: Gavel },
              { key: 'revised', label: 'Revised', icon: RotateCcw },
              { key: 'rejected', label: 'Rejected', icon: XCircle },
              { key: 'archive', label: 'Archive', icon: Archive },
            ] as { key: EndorsementFilter; label: string; icon: typeof Gavel }[]).map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              const activeColor =
                tab.key === 'active' ? 'bg-[#C8102E] text-white' :
                tab.key === 'revised' ? 'bg-amber-500 text-white' :
                tab.key === 'rejected' ? 'bg-red-600 text-white' :
                'bg-emerald-600 text-white';
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                    isActive ? activeColor : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                  {isActive && (
                    <span className="ml-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold bg-white/20 rounded-full">
                      {endorsementProposals.length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* Proposals List */}
        <main className="bg-white shadow-xl rounded-2xl border border-slate-200 overflow-hidden flex-1 flex flex-col">
          <div className="p-4 border-b border-slate-200 bg-slate-50">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#C8102E]" />
                {activeTab === 'active'
                  ? 'Endorsement Proposals'
                  : activeTab === 'revised'
                  ? 'Revised Proposals (History)'
                  : activeTab === 'rejected'
                  ? 'Rejected Proposals (History)'
                  : 'Archived Proposals (Endorsed / Funded)'}
              </h3>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <User className="w-4 h-4" />
                <span>{endorsementProposals.length} total proposals</span>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {endorsementProposals.length === 0 ? (
              <div className="text-center py-12 px-4">
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
                    ? 'Proposals sent back for revision will appear here.'
                    : activeTab === 'rejected'
                    ? 'Rejected proposals will appear here.'
                    : 'Endorsed and funded proposals live here for audit.'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {paginatedProposals.map((proposal) => (
                  <article
                    key={proposal.id}
                    className="p-4 hover:bg-slate-50 transition-colors duration-200 group"
                    aria-labelledby={`proposal-title-${proposal.id}`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-3 mb-3">
                          <h2
                            id={`proposal-title-${proposal.id}`}
                            className="text-base font-semibold text-slate-800 line-clamp-2 group-hover:text-[#C8102E] transition-colors duration-200"
                          >
                            {proposal.title}
                          </h2>
                          {/* Version badge — any version > 1 signals a revision */}
                          {proposal.versionNumber && proposal.versionNumber > 1 && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border border-indigo-200 text-indigo-700 bg-indigo-50 whitespace-nowrap"
                              title={`Currently showing v${proposal.versionNumber}${proposal.totalVersions ? ` of ${proposal.totalVersions}` : ''}. Earlier versions' scores remain in history.`}
                            >
                              v{proposal.versionNumber}
                            </span>
                          )}
                          {!proposal.readyForEndorsement && (() => {
                            const pending = proposal.evaluatorDecisions.filter(d => d.decision === 'Pending').length;
                            const declined = proposal.evaluatorDecisions.filter(d => d.decision === 'Declined').length;
                            const inReview = proposal.evaluatorDecisions.filter(d => d.decision === 'In Review').length;
                            const extReq = proposal.evaluatorDecisions.filter(d => d.decision === 'Extension Requested').length;
                            return (
                              <>
                                {pending > 0 && (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border border-amber-200 text-amber-600 bg-amber-50 whitespace-nowrap">
                                    {pending} Pending
                                  </span>
                                )}
                                {declined > 0 && (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border border-rose-200 text-rose-500 bg-rose-50 whitespace-nowrap">
                                    {declined} Declined
                                  </span>
                                )}
                                {inReview > 0 && (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border border-cyan-200 text-cyan-600 bg-cyan-50 whitespace-nowrap">
                                    {inReview} In Review
                                  </span>
                                )}
                                {extReq > 0 && (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border border-orange-200 text-orange-600 bg-orange-50 whitespace-nowrap">
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
                          <div className="flex items-center gap-1.5">
                            <FileText className="w-3 h-3" aria-hidden="true" />
                            <span>ID: {proposal.id}</span>
                          </div>
                          {/* Department Badge */}
                          {proposal.department && proposal.department !== "N/A" && (
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${getDepartmentColor(proposal.department)}`}>
                              <Building2 className="w-3 h-3" />
                              {proposal.department}
                            </span>
                          )}
                        </div>

                        {/* Feasibility Score — show whenever evaluators have scored (all tabs) */}
                        {proposal.averageScores && (
                          <div className="mb-3 p-3 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                                <BarChart2 className="w-4 h-4 text-indigo-600" />
                                Feasibility Score
                              </h4>
                              <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                                proposal.averageScores.overall >= 4
                                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                  : proposal.averageScores.overall >= 3
                                  ? 'bg-amber-50 border-amber-200 text-amber-700'
                                  : 'bg-red-50 border-red-200 text-red-700'
                              }`}>
                                {proposal.averageScores.overall.toFixed(1)} / 5.0
                              </span>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              {[
                                { label: 'Title', value: proposal.averageScores.title },
                                { label: 'Budget', value: proposal.averageScores.budget },
                                { label: 'Timeline', value: proposal.averageScores.timeline },
                              ].map((item) => (
                                <div key={item.label} className="text-center">
                                  <div className="text-[10px] font-medium text-slate-500 mb-0.5">{item.label}</div>
                                  <div className="text-sm font-bold text-slate-800">{item.value.toFixed(1)}</div>
                                  <div className="w-full h-1.5 bg-white rounded-full mt-1 overflow-hidden">
                                    <div
                                      className={`h-full rounded-full transition-all ${
                                        item.value >= 4 ? 'bg-emerald-500' : item.value >= 3 ? 'bg-amber-400' : 'bg-red-400'
                                      }`}
                                      style={{ width: `${(item.value / 5) * 100}%` }}
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                            <p className="text-[10px] text-slate-400 mt-2 text-right">
                              Based on {proposal.averageScores.evaluatorCount} evaluator{proposal.averageScores.evaluatorCount > 1 ? 's' : ''}
                            </p>
                          </div>
                        )}

                        {/* Evaluator Decisions */}
                        <div className="space-y-3">
                          <h4 className="text-sm font-semibold text-slate-800">
                            Evaluator Decisions
                          </h4>
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                            {proposal.evaluatorDecisions.map((decision) => (
                              <div
                                key={decision.evaluatorId}
                                className={`border rounded-lg p-3 ${getDecisionColor(decision.decision)} cursor-pointer hover:shadow-md transition-all duration-200`}
                                onClick={() => handleOpenEvaluatorModal(decision, proposal.title, proposal.id, proposal.department, proposal.proponentEmail, proposal.submittedBy)}
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
                              <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 flex items-center justify-center">
                                <div className="text-center text-slate-500">
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

                      {/* Action Button — active tab only */}
                      {activeTab === 'active' && proposal.readyForEndorsement && (
                        <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0">
                          <button
                            onClick={() => handleOpenDecisionModal(proposal.title, proposal.id, proposal.budget, proposal.department, proposal.proponentEmail, proposal.evaluatorDecisions)}
                            className="inline-flex items-center gap-1.5 px-3 h-8 rounded-lg bg-[#C8102E] text-white hover:bg-[#A00C24] hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:ring-offset-1 transition-all duration-200 cursor-pointer text-xs font-medium shadow-sm"
                          >
                            <Gavel className="w-3 h-3" />
                            Action
                          </button>
                        </div>
                      )}

                      {/* History tab — action pill + timestamp */}
                      {activeTab !== 'active' && proposal.actionDate && (
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border ${
                            activeTab === 'revised'
                              ? 'bg-amber-50 border-amber-200 text-amber-700'
                              : activeTab === 'rejected'
                              ? 'bg-red-50 border-red-200 text-red-700'
                              : 'bg-emerald-50 border-emerald-200 text-emerald-700'
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
          </div>

          {/* Pagination */}
          {endorsementProposals.length > 0 && (
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex-shrink-0">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-xs text-slate-600">
                <span>
                  Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, endorsementProposals.length)} of {endorsementProposals.length} proposals
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

export default AdminEndorsementPage;
