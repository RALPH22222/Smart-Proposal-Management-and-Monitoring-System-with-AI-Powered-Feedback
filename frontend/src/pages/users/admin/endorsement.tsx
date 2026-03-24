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
  Clock
} from 'lucide-react';
import { 
  type EndorsementProposal, 
  type EvaluatorDecision,
  type BudgetRow
} from '../../../types/evaluator';
import AdminEvaluatorDecisionModal from '../../../components/admin-component/AdminEvaluatorDecisionModal';
import AdminEndorsementDecisionModal from '../../../components/admin-component/AdminEndorsementDecisionModal';
import { endorseProposal, requestRevision, rejectProposal, fetchUsersByRole } from '../../../services/proposal.api';
import { useAuthContext } from '../../../context/AuthContext';
import Swal from 'sweetalert2';
import PageLoader from '../../../components/shared/PageLoader';
import { formatDate } from '../../../utils/date-formatter';

const AdminEndorsementPage: React.FC = () => {
  const { user } = useAuthContext();
  const [endorsementProposals, setEndorsementProposals] = useState<EndorsementProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  
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
  } | null>(null);

  const itemsPerPage = 5;

  useEffect(() => {
    loadEndorsementProposals();
  }, []);

  const loadEndorsementProposals = async () => {
    try {
      setLoading(true);
      
      // 1. Fetch ALL proposals via existing Admin API
      const { adminProposalApi } = await import('../../../services/AdminProposalApi/ProposalApi');
      const { getAllAssignmentTrackers } = await import('../../../services/proposal.api');

      const allProposals = await adminProposalApi.fetchProposals();

      // 2. Fetch all evaluator users once (already deployed endpoint) for email lookup
      const evaluatorUsersMap: Map<string, { email: string; department: string }> = new Map();
      try {
        const evaluatorUsers = await fetchUsersByRole('evaluator');
        evaluatorUsers.forEach((u) => {
          evaluatorUsersMap.set(String(u.id), {
            email: u.email || '',
            department: u.departments?.[0]?.name || ''
          });
        });
      } catch (e) {
        console.warn('Could not fetch evaluator users for email lookup', e);
      }

      // 3. Fetch ALL tracker data in a single call, then group by proposal
      const allTrackerData = await getAllAssignmentTrackers();
      const trackerByProposal = new Map<number, any[]>();
      for (const item of allTrackerData) {
        const pid = (item as any).proposal_id?.id;
        if (!pid) continue;
        if (!trackerByProposal.has(pid)) trackerByProposal.set(pid, []);
        trackerByProposal.get(pid)!.push(item);
      }

      const mappedProposals: EndorsementProposal[] = [];

      for (const p of allProposals) {
        let evaluatorDecisions: EvaluatorDecision[] = [];

        try {
          const trackerData = trackerByProposal.get(Number(p.id)) || [];

          if (trackerData.length > 0) {
            evaluatorDecisions = trackerData.map((d: unknown) => {
              const typedD = d as any;
              let decisionStatus: "Approve" | "Revise" | "Reject" | "Pending" = "Pending";
              
              if (typedD.status === "completed" || typedD.status === "done") {
                decisionStatus = "Approve"; // Simplified for Admin view since scores aren't fully exposed
              } else if (typedD.status === "decline") {
                decisionStatus = "Reject";
              }
              
              const evalId = String(typedD.evaluator_id?.id);
              const userInfo = evaluatorUsersMap.get(evalId);
              return {
                evaluatorId: evalId,
                evaluatorName: `${typedD.evaluator_id?.first_name || ''} ${typedD.evaluator_id?.last_name || ''}`.trim(),
                evaluatorDepartment: userInfo?.department || typedD.evaluator_id?.department_id?.name || "N/A",
                evaluatorEmail: userInfo?.email || typedD.evaluator_id?.email || "N/A",
                decision: decisionStatus,
                comments: typedD.remarks || "No detailed comment available in tracker.",
                submittedDate: typedD.created_at || new Date().toISOString(),
                ratings: { title: 0, budget: 0, timeline: 0 }
              };
            });
          }
        } catch (err) {
          console.error(`Failed to fetch tracker for proposal ${p.id}`, err);
        }

        // De-duplicate evaluators just in case tracker returns multiples
        const uniqueEvaluators: EvaluatorDecision[] = [];
        const seen = new Set();
        for (const ev of evaluatorDecisions) {
          if (!seen.has(ev.evaluatorId)) {
            seen.add(ev.evaluatorId);
            uniqueEvaluators.push(ev);
          }
        }

        let readyForEndorsement = true;
        let overallRecommendation: 'Approve' | 'Revise' | 'Reject' | 'Pending' = 'Pending';
        
        if (uniqueEvaluators.length < 2) readyForEndorsement = false;
        if (uniqueEvaluators.some(d => d.decision === 'Pending')) readyForEndorsement = false;

        if (readyForEndorsement) {
           if (uniqueEvaluators.every(d => d.decision === 'Approve')) overallRecommendation = 'Approve';
           else if (uniqueEvaluators.some(d => d.decision === 'Reject')) overallRecommendation = 'Reject';
           else overallRecommendation = 'Revise';
        }

        // Re-map BudgetSource to BudgetRow (just adapting the structure)
        const budgetRows: BudgetRow[] = (p.budgetSources || []).map((bs: unknown) => {
           const typedBs = bs as { source: string; ps: number | string; mooe: number | string; co: number | string; breakdown: unknown };
           const psAmt = parseFloat(String(typedBs.ps).replace(/[^0-9.-]+/g, "")) || 0;
           const mooeAmt = parseFloat(String(typedBs.mooe).replace(/[^0-9.-]+/g, "")) || 0;
           const coAmt = parseFloat(String(typedBs.co).replace(/[^0-9.-]+/g, "")) || 0;
           return {
             source: typedBs.source,
             ps: psAmt,
             mooe: mooeAmt,
             co: coAmt,
             total: psAmt + mooeAmt + coAmt,
             breakdown: typedBs.breakdown as BudgetRow['breakdown']
           };
        });

        // Only include the proposal if there is at least 1 evaluator assigned
        if (evaluatorDecisions.length > 0) {
          mappedProposals.push({
            id: p.id,
            title: p.title,
            submittedBy: p.submittedBy,
            proponentEmail: p.email || '',
            budget: budgetRows,
            evaluatorDecisions: uniqueEvaluators,
            overallRecommendation,
            readyForEndorsement,
            department: p.rdStation || 'N/A'
          });
        }
      }
      
      setEndorsementProposals(mappedProposals);
    } catch (error) {
      console.error('Error loading endorsement proposals:', error);
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
  const handleOpenDecisionModal = (proposalTitle: string, proposalId: string, budgetData?: BudgetRow[], department?: string, email?: string) => {
    setSelectedProposal({ 
      title: proposalTitle, 
      id: proposalId,
      budget: budgetData,
      department: department,
      email: email
    });
    setIsDecisionModalOpen(true);
  };

  const handleCloseDecisionModal = () => {
    setIsDecisionModalOpen(false);
  };

  const handleDecisionSubmit = async (status: "endorsed" | "revised" | "rejected", remarks: string, revisionDeadline?: string) => {
    if (!selectedProposal || !user?.id) return;

    try {
      Swal.fire({
        title: 'Processing Decision...',
        text: 'Please wait...',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });

      const proposalIdNum = parseInt(selectedProposal.id);

      if (status === 'endorsed') {
        await endorseProposal({
          proposal_id: proposalIdNum,
          rnd_id: user.id,
          decision: "endorsed",
          remarks
        });
      } else if (status === 'revised') {
        let days = 14;
        if (revisionDeadline) {
          if (revisionDeadline.includes("1 Week")) days = 7;
          else if (revisionDeadline.includes("3 Weeks")) days = 21;
          else if (revisionDeadline.includes("1 Month")) days = 30;
          else if (revisionDeadline.includes("6 Weeks")) days = 42;
          else if (revisionDeadline.includes("2 Months")) days = 60;
        }
        const deadlineTimestamp = Date.now() + (days * 24 * 60 * 60 * 1000);
        
        await requestRevision({
          proposal_id: proposalIdNum,
          deadline: deadlineTimestamp,
          overall_comment: remarks
        });
      } else if (status === 'rejected') {
        await rejectProposal({
          proposal_id: proposalIdNum,
          comment: remarks
        });
      }

      await Swal.fire('Success', 'Decision processed successfully.', 'success');
      loadEndorsementProposals();
      
    } catch (error: unknown) {
      console.error("Action error:", error);
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
    return (
      <div className="min-h-screen">
        <PageLoader text="Loading admin endorsements..." />
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br p-6 from-slate-50 to-slate-100 min-h-screen lg:h-screen flex flex-col lg:flex-row">
      {/* Admin Evaluator Modal */}
      <AdminEvaluatorDecisionModal
        isOpen={isEvaluatorModalOpen}
        onClose={handleCloseEvaluatorModal}
        decision={selectedDecision!}
        proposalTitle={selectedProposal?.title || ''}
        proposalId={selectedProposal?.id || ''}
      />

      {/* Admin Endorsement Decision Modal */}
      <AdminEndorsementDecisionModal
        isOpen={isDecisionModalOpen}
        onClose={handleCloseDecisionModal}
        proposalTitle={selectedProposal?.title || ""}
        department={selectedProposal?.department}
        email={selectedProposal?.email}
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

        {/* Proposals List - STRICTLY MATCHING R&D LAYOUT */}
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
                          {!proposal.readyForEndorsement && proposal.evaluatorDecisions.filter(d => d.decision === 'Pending').length > 0 && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border border-amber-200 text-amber-600 bg-amber-50 whitespace-nowrap">
                              {proposal.evaluatorDecisions.filter(d => d.decision === 'Pending').length} Pending Evaluator{proposal.evaluatorDecisions.filter(d => d.decision === 'Pending').length !== 1 ? 's' : ''}
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

                      {/* Single Action Button Implementation (MATCHING R&D) */}
                      {proposal.readyForEndorsement && (
                        <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0">
                          <button
                            onClick={() => handleOpenDecisionModal(proposal.title, proposal.id, proposal.budget, proposal.department, proposal.proponentEmail)}
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

export default AdminEndorsementPage;
