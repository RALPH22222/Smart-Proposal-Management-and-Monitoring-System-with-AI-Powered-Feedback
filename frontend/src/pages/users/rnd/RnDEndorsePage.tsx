import React, { useState, useEffect } from 'react';
import {
  CheckCircle,
  XCircle,
  RotateCcw,
  FileText,
  User,
  Clock,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Gavel,
  Building2
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
  fetchDepartments
} from '../../../services/proposal.api';
import Swal from 'sweetalert2';
import { useAuthContext } from '../../../context/AuthContext';

const EndorsePage: React.FC = () => {
  const { user } = useAuthContext();

  const [endorsementProposals, setEndorsementProposals] = useState<EndorsementProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

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
  } | null>(null);

  // --- Budget transformer: raw estimated_budget items → grouped BudgetRow[] with breakdowns ---
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

  const itemsPerPage = 5;

  useEffect(() => {
    loadEndorsementProposals();
  }, []);

  const loadEndorsementProposals = async () => {
    try {
      setLoading(true);
      const [data, depts] = await Promise.all([
        getProposalsForEndorsement(),
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
          budget: transformEstimatedBudget(p.estimated_budget || []),
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
              objectives: d.ratings.objective || 0,
              methodology: d.ratings.methodology || 0,
              budget: d.ratings.budget || 0,
              timeline: d.ratings.timeline || 0
            } : undefined
          })),
          overallRecommendation: p.overallRecommendation,
          readyForEndorsement: p.readyForEndorsement,
          department: deptName || "N/A"
        };
      });

      setEndorsementProposals(mapped);
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
  const handleOpenDecisionModal = (proposalTitle: string, proposalId: string, budgetData?: BudgetRow[]) => {
    setSelectedProposal({
      title: proposalTitle,
      id: proposalId,
      budget: budgetData
    });
    setIsDecisionModalOpen(true);
  };

  const handleCloseDecisionModal = () => {
    setIsDecisionModalOpen(false);
  };

  const handleDecisionSubmit = (status: "endorsed" | "revised" | "rejected", remarks: string, revisionDeadline?: string) => {
    if (!selectedProposal) return; // Should not happen

    // Route to logic based on status
    if (status === 'endorsed') {
      handleEndorseProposal(selectedProposal.id, remarks);
    } else if (status === 'revised') {
      handleReturnForRevision(selectedProposal.id, remarks, revisionDeadline);
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

  const handleReturnForRevision = async (proposalId: string, remarks: string, deadlineStr?: string) => {
    try {
      Swal.fire({
        title: 'Sending for Revision...',
        text: 'Please wait...',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      // 1. Calculate Deadline Timestamp
      let days = 14; // Default 2 weeks
      if (deadlineStr) {
        if (deadlineStr.includes("1 Week")) days = 7;
        else if (deadlineStr.includes("3 Weeks")) days = 21;
        else if (deadlineStr.includes("1 Month")) days = 30;
        else if (deadlineStr.includes("6 Weeks")) days = 42;
        else if (deadlineStr.includes("2 Months")) days = 60;
      }
      const deadlineTimestamp = Date.now() + (days * 24 * 60 * 60 * 1000);

      // 2. Parse Structured Remarks
      let objective_comment: string | undefined,
        methodology_comment: string | undefined,
        budget_comment: string | undefined,
        timeline_comment: string | undefined,
        overall_comment: string | undefined;

      const parts = remarks.split(/\n\n(?=\[)/);
      parts.forEach(part => {
        if (part.startsWith("[Objectives Assessment]:")) objective_comment = part.replace("[Objectives Assessment]:\n", "").trim();
        else if (part.startsWith("[Methodology Assessment]:")) methodology_comment = part.replace("[Methodology Assessment]:\n", "").trim();
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
        deadline: deadlineTimestamp,
        objective_comment,
        methodology_comment,
        budget_comment,
        timeline_comment,
        overall_comment,
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
    switch (decision) {
      case 'Approve':
        return <CheckCircle className='w-4 h-4 text-emerald-600' />;
      case 'Revise':
        return <RotateCcw className='w-4 h-4 text-amber-600' />;
      case 'Reject':
        return <XCircle className='w-4 h-4 text-red-600' />;
      case 'Pending':
        return <Clock className='w-4 h-4 text-yellow-600' />;
      default:
        return <FileText className='w-4 h-4 text-slate-600' />;
    }
  };

  const getDecisionColor = (decision: string) => {
    switch (decision) {
      case 'Approve':
        return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      case 'Revise':
        return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'Reject':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'Pending':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default:
        return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  const getOverallRecommendationBadge = (recommendation: string) => {
    const baseClasses = 'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border border-current border-opacity-20';

    switch (recommendation) {
      case 'Approve':
        return `${baseClasses} text-emerald-600 bg-emerald-50 border-emerald-200`;
      case 'Revise':
        return `${baseClasses} text-amber-600 bg-amber-50 border-amber-200`;
      case 'Reject':
        return `${baseClasses} text-red-600 bg-red-50 border-red-200`;
      default:
        return `${baseClasses} text-slate-600 bg-slate-50 border-slate-200`;
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
    return (
      <div className="bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C8102E] mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading endorsement proposals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br p-6 from-slate-50 to-slate-100 min-h-screen lg:h-screen flex flex-col lg:flex-row">
      {/* Existing Evaluator Modal */}
      <EvaluatorDecisionModal
        isOpen={isEvaluatorModalOpen}
        onClose={handleCloseEvaluatorModal}
        decision={selectedDecision!}
        proposalTitle={selectedProposal?.title || ''}
        proposalId={selectedProposal?.id || ''}
      />

      {/* New Endorsement Decision Modal */}
      <DecisionModal
        isOpen={isDecisionModalOpen}
        onClose={handleCloseDecisionModal}
        proposalTitle={selectedProposal?.title || ''}
        budgetData={selectedProposal?.budget}
        onSubmit={handleDecisionSubmit}
      />

      <div className="flex-1 flex flex-col gap-4 sm:gap-6 overflow-hidden">
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

        {/* Stats Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-blue-50 shadow-xl rounded-2xl border border-blue-300 p-4 transition-all duration-300 hover:shadow-lg hover:scale-105 group cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-700 mb-2">Ready for Endorsement</p>
                <p className="text-xl font-bold text-blue-600 tabular-nums">
                  {endorsementProposals.filter((p) => p.readyForEndorsement).length}
                </p>
              </div>
              <CheckCircle className="w-6 h-6 text-blue-500 group-hover:scale-110 transition-transform duration-300" />
            </div>
          </div>

          <div className="bg-amber-50 shadow-xl rounded-2xl border border-amber-300 p-4 transition-all duration-300 hover:shadow-lg hover:scale-105 group cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-700 mb-2">Pending Evaluators</p>
                <p className="text-xl font-bold text-amber-600 tabular-nums">
                  {endorsementProposals.filter((p) => !p.readyForEndorsement).length}
                </p>
              </div>
              <User className="w-6 h-6 text-amber-500 group-hover:scale-110 transition-transform duration-300" />
            </div>
          </div>

          <div className="bg-emerald-50 shadow-xl rounded-2xl border border-emerald-300 p-4 transition-all duration-300 hover:shadow-lg hover:scale-105 group cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-700 mb-2">Approved</p>
                <p className="text-xl font-bold text-emerald-600 tabular-nums">
                  {endorsementProposals.filter((p) => p.overallRecommendation === 'Approve').length}
                </p>
              </div>
              <CheckCircle className="w-6 h-6 text-emerald-500 group-hover:scale-110 transition-transform duration-300" />
            </div>
          </div>

          <div className="bg-orange-50 shadow-xl rounded-2xl border border-orange-300 p-4 transition-all duration-300 hover:shadow-lg hover:scale-105 group cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-700 mb-2">Need Revision</p>
                <p className="text-xl font-bold text-orange-600 tabular-nums">
                  {endorsementProposals.filter((p) => p.overallRecommendation === 'Revise').length}
                </p>
              </div>
              <RotateCcw className="w-6 h-6 text-orange-500 group-hover:scale-110 transition-transform duration-300" />
            </div>
          </div>
        </section>

        {/* Proposals List */}
        <main className="bg-white shadow-xl rounded-2xl border border-slate-200 overflow-hidden flex-1 flex flex-col">
          <div className="p-4 border-b border-slate-200 bg-slate-50">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#C8102E]" />
                Endorsement Proposals
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
                  <Gavel className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-medium text-slate-900 mb-2">
                  No proposals ready for endorsement
                </h3>
                <p className="text-slate-500 max-w-sm mx-auto">
                  Proposals will appear here once evaluators complete their reviews.
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
                          <span className={getOverallRecommendationBadge(proposal.overallRecommendation)}>
                            {proposal.overallRecommendation}
                          </span>
                          {!proposal.readyForEndorsement && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border border-amber-200 text-amber-600 bg-amber-50">
                              Pending Evaluators
                            </span>
                          )}
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

                        {/* Evaluator Decisions */}
                        <div className="space-y-3">
                          <h4 className="text-sm font-semibold text-slate-800">
                            Evaluator Decisions
                          </h4>
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                            {proposal.evaluatorDecisions.map((decision, index) => (
                              <div
                                key={`${decision.evaluatorId}-${index}`}
                                className={`border rounded-lg p-3 ${getDecisionColor(decision.decision)} cursor-pointer hover:shadow-md transition-all duration-200`}
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
                                    {new Date(decision.submittedDate).toLocaleDateString()}
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

                            {/* Show missing evaluators */}
                            {proposal.evaluatorDecisions.length < 2 && (
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

                      {/* Single Action Button Implementation */}
                      {proposal.readyForEndorsement && (
                        <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0">
                          <button
                            onClick={() => handleOpenDecisionModal(proposal.title, proposal.id, proposal.budget)}
                            className="inline-flex items-center gap-1.5 px-3 h-8 rounded-lg bg-[#C8102E] text-white hover:bg-[#A00C24] hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:ring-offset-1 transition-all duration-200 cursor-pointer text-xs font-medium shadow-sm"
                          >
                            <Gavel className="w-3 h-3" />
                            Action
                          </button>
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
  );
};

export default EndorsePage;