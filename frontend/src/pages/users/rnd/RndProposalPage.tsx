import React, { useState, useEffect } from 'react';
import {
  FileText, Calendar, User, Eye, Gavel, Filter, Search,
  ChevronLeft, ChevronRight, Tag, XCircle,
  GitBranch, Users, X, MessageSquare, AlertTriangle
} from 'lucide-react';
import Swal from 'sweetalert2';
import {
  type Proposal,
  type Decision,
  type ProposalStatus,
  type Reviewer
} from '../../../types/InterfaceProposal';
import {
  getRndProposals,
  forwardProposalToEvaluators,
  requestRevision,
  rejectProposal,
  fetchAgencies,
  fetchSectors,
  fetchPriorities,
  type LookupItem
} from '../../../services/proposal.api';
import ProposalModal from '../../../components/rnd-component/RnDProposalModal';
import DetailedProposalModal, { type ModalProposalData } from '../../../components/rnd-component/RndViewModal';
import { transformProposalForModal } from "../../../utils/proposal-transform";

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

interface RndProposalPageProps {
  filter?: ProposalStatus;
  onStatsUpdate?: () => void;
}

// Extended Status type to include Revised Proposal locally for this view
type ExtendedProposalStatus = ProposalStatus | 'Revised Proposal';

const backendToFrontendStatus = (status: string): ExtendedProposalStatus => {
  switch (status) {
    case 'review_rnd': return 'Pending';
    case 'under_evaluation': return 'Sent to Evaluators';
    case 'revision_rnd': return 'Revision Required'; // Or possibly 'Revised Proposal' depending on context, using Revision Required for general bucket
    case 'rejected_rnd': return 'Rejected Proposal';
    case 'endorsed_for_funding': return 'Endorsed';
    case 'funded': return 'Funded';
    default: return 'Pending';
  }
};

const RndProposalPage: React.FC<RndProposalPageProps> = ({ filter, onStatsUpdate }) => {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [filteredProposals, setFilteredProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal States
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [selectedProposalForView, setSelectedProposalForView] = useState<ModalProposalData | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  // Evaluator List Modal State
  const [isEvaluatorModalOpen, setIsEvaluatorModalOpen] = useState(false);
  const [currentEvaluatorsList, setCurrentEvaluatorsList] = useState<string[]>([]);
  const [currentEvaluatorMessage, setCurrentEvaluatorMessage] = useState<string>('');

  // Filters
  const [statusFilter, setStatusFilter] = useState<ExtendedProposalStatus | 'All'>(filter || 'All');
  const [searchTerm, setSearchTerm] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const currentUser: Reviewer = { id: 'current-user', name: 'Dr. John Smith', role: 'R&D Staff', email: 'john@example.com' };

  const [agencies, setAgencies] = useState<LookupItem[]>([]);
  const [sectors, setSectors] = useState<LookupItem[]>([]);
  const [priorityAreas, setPriorityAreas] = useState<LookupItem[]>([]);

  // Load proposals on component mount
  useEffect(() => {
    loadProposals();
    loadLookups();
  }, []);

  const loadLookups = async () => {
    try {
      const [agencyData, sectorData, priorityData] = await Promise.all([
        fetchAgencies(),
        fetchSectors(),
        fetchPriorities(),
      ]);
      setAgencies(agencyData);
      setSectors(sectorData);
      setPriorityAreas(priorityData);
    } catch (err) {
      console.error("Failed to load agencies:", err);
    }
  };

  // Filter proposals based on status and search term
  useEffect(() => {
    let filtered = proposals;

    // Apply status filter
    if (statusFilter !== 'All') {
      filtered = filtered.filter(
        (proposal) => proposal.status === statusFilter
      );
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (proposal) =>
          proposal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          proposal.submittedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
          proposal.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredProposals(filtered);
    setCurrentPage(1);
  }, [proposals, statusFilter, searchTerm]);

  const loadProposals = async () => {
    try {
      setLoading(true);
      const data = await getRndProposals();
      console.log("RND Proposals Data:", data); // DEBUG LOG

      // Transform logic
      // Transform logic
      const mappedProposals: Proposal[] = data.map((p: any) => {
        // Normalize raw data: Check if p is a wrapper or the data itself
        const hasNestedProposal = p.proposal_id && typeof p.proposal_id === 'object' && (p.proposal_id.project_title || p.proposal_id.title);
        const raw = hasNestedProposal ? p.proposal_id : p;

        console.log(`Processing Proposal [${raw.id}]:`, raw);

        // Extract evaluator names for the list view
        // Check for common field names for evaluators
        const rawEvaluators = raw.proposal_evaluator || raw.evaluators || raw.assigned_evaluators || [];

        const evaluatorNames = rawEvaluators.map((e: any) => {
          const name = `${e.evaluator_id?.first_name || ''} ${e.evaluator_id?.last_name || ''}`.trim() || 'Unknown';
          const email = e.evaluator_id?.email || '';
          return email ? `${name} (${email})` : name;
        });

        // Construct basic Proposal object
        const transformed: Proposal = {
          id: raw.id,
          title: raw.project_title || "Untitled",
          documentUrl: raw.file_url || "",
          status: backendToFrontendStatus(raw.status),
          submittedBy: raw.proponent_id ? `${raw.proponent_id.first_name} ${raw.proponent_id.last_name}` : "Unknown",
          submittedDate: raw.created_at,
          lastModified: raw.updated_at || raw.created_at,
          proponent: raw.proponent_id ? `${raw.proponent_id.first_name} ${raw.proponent_id.last_name}` : "Unknown",
          gender: raw.proponent_id?.sex || "N/A",
          agency: raw.agency?.name || raw.agency || "WMSU",
          address: "N/A",
          telephone: raw.phone || raw.telephone || "N/A",
          fax: "N/A",
          email: raw.email || "",
          projectType: raw.sector?.name || "N/A",
          classification: raw.classification_type || "Research",
          classificationDetails: raw.class_input || "",
          duration: raw.duration || "0",
          startDate: raw.plan_start_date || "",
          endDate: raw.plan_end_date || "",
          budgetTotal: raw.total_budget || "0",
          budgetSources: [],
          modeOfImplementation: raw.implementation_mode || "Single Agency",
          implementationSites: raw.implementation_site || [],
          priorityAreas: raw.priorities_id ? JSON.stringify(raw.priorities_id) : "",
          sector: raw.sector?.name || "N/A",
          discipline: raw.discipline?.name || "N/A",
          cooperatingAgencies: raw.cooperating_agencies ? JSON.stringify(raw.cooperating_agencies) : "",
          rdStation: raw.rnd_station?.name || "N/A",
          assignedEvaluators: evaluatorNames,
          evaluatorInstruction: raw.evaluator_instruction || p.evaluator_instruction || "",
          projectFile: raw.file_url,
          tags: raw.proposal_tags?.map((t: any) => t.tags?.name) || [],
          raw: raw
        } as any;
        return transformed;
      });

      setProposals(mappedProposals);
    } catch (error) {
      console.error('Error loading proposals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewProposal = (proposal: Proposal) => {
    setSelectedProposal(proposal);
    setIsModalOpen(true);
  };

  const handleViewDetails = (proposal: Proposal) => {
    // Transform with raw data for the detailed view logic
    const detailedData = transformProposalForModal((proposal as any).raw);
    setSelectedProposalForView(detailedData);
    setIsViewModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProposal(null);
  };

  // --- SUBMIT DECISION (Calls Real API) ---
  const handleSubmitDecision = async (decision: Decision) => {
    try {
      const proposalIdNumber = Number(decision.proposalId); // API usually expects number

      if (decision.decision === 'Sent to Evaluators') {
        await forwardProposalToEvaluators({
          proposal_id: proposalIdNumber,
          evaluator_id: decision.assignedEvaluators || [],
          deadline_at: decision.evaluationDeadline ? parseInt(decision.evaluationDeadline, 10) : 14,
          commentsForEvaluators: decision.structuredComments?.objectives?.content // Use available comment field
        });
      } else if (decision.decision === 'Revision Required') {
        await requestRevision({
          proposal_id: proposalIdNumber,
          deadline: decision.evaluationDeadline ? new Date(decision.evaluationDeadline).getTime() : Date.now() + 14 * 24 * 60 * 60 * 1000,
          // Map comments
          objective_comment: decision.structuredComments?.objectives?.content,
          methodology_comment: decision.structuredComments?.methodology?.content,
          budget_comment: decision.structuredComments?.budget?.content,
          timeline_comment: decision.structuredComments?.timeline?.content,
          overall_comment: decision.structuredComments?.overall?.content,
        });
      } else if (decision.decision === 'Rejected Proposal') {
        await rejectProposal({
          proposal_id: proposalIdNumber,
          // FIX: Read from objectives.content because RndProposalModal binds it there for Rejection
          comment: decision.structuredComments?.objectives?.content || decision.structuredComments?.overall?.content || "No comment provided."
        });
      }

      // Success Alert
      Swal.fire({
        title: 'Success!',
        text: `Proposal has been ${decision.decision === 'Sent to Evaluators' ? 'forwarded' : decision.decision === 'Revision Required' ? 'returned for revision' : 'rejected'}.`,
        icon: 'success',
        confirmButtonColor: '#C8102E'
      });

      // Refresh list to update status
      await loadProposals();

      if (onStatsUpdate) {
        onStatsUpdate();
      }
    } catch (error: any) {
      console.error('Error submitting decision:', error);
      Swal.fire({
        title: 'Error!',
        text: error?.response?.data?.message || 'Something went wrong. Please try again.',
        icon: 'error',
        confirmButtonColor: '#C8102E'
      });
    }
  };

  // --- Helper: Status Badge Logic (Updated with Clickable Evaluators) ---
  const getStatusBadge = (status: ExtendedProposalStatus, proposal: Proposal) => {
    const baseClasses = 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border border-current border-opacity-20 max-w-[200px] truncate cursor-pointer hover:opacity-80 transition-opacity';

    switch (status) {
      case 'Pending':
        return (
          <span className={`${baseClasses} text-blue-600 bg-blue-50 border-blue-200 cursor-default`}>
            <Search className="w-3 h-3 flex-shrink-0" />
            Under R&D Review
          </span>
        );
      case 'Revised Proposal':
        return (
          <span className={`${baseClasses} text-purple-600 bg-purple-50 border-purple-200 cursor-default`}>
            <GitBranch className="w-3 h-3 flex-shrink-0" />
            Revised Proposal
          </span>
        );
      case 'Sent to Evaluators':
        const evaluators = (proposal as any).assignedEvaluators || [];
        const evaluatorText = 'Under Evaluators Assessment';
        return (
          <span
            className={`${baseClasses} text-purple-600 bg-purple-50 border-purple-200 cursor-default`}
            title={evaluators.join(', ')}
          >
            <Users className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{evaluatorText}</span>
          </span>
        );

      case 'Rejected Proposal':
        return (
          <span className={`${baseClasses} text-red-600 bg-red-50 border-red-200 cursor-default`}>
            <XCircle className="w-3 h-3 flex-shrink-0" />
            {status}
          </span>
        );
      case 'Revision Required':
        return (
          <span className={`${baseClasses} text-orange-600 bg-orange-50 border-orange-200 cursor-default`}>
            <AlertTriangle className="w-3 h-3 flex-shrink-0" />
            {status}
          </span>
        );
      default:
        return (
          <span className={`${baseClasses} text-slate-600 bg-slate-50 border-slate-200 cursor-default`}>
            <FileText className="w-3 h-3 flex-shrink-0" />
            {status}
          </span>
        );
    }
  };

  const getStatusCount = (status: ExtendedProposalStatus | 'All') => {
    if (status === 'All') return proposals.length;
    return proposals.filter((p) => p.status === status).length;
  };

  // Helper for Random Tag Colors (Matches Profile.tsx)
  const getTagColor = (tag: string) => {
    // Simple hash function to get consistent color for same tag
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

  // Pagination logic
  const totalPages = Math.ceil(filteredProposals.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProposals = filteredProposals.slice(startIndex, startIndex + itemsPerPage);

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C8102E] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading proposals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br p-6 from-slate-50 to-slate-100 min-h-screen lg:h-screen flex flex-col lg:flex-row">
      <div className="flex-1 flex flex-col gap-4 sm:gap-6 overflow-hidden">
        {/* Header */}
        <header className="flex-shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#C8102E] leading-tight">
                {filter ? `${filter} Proposals` : 'R&D Proposal Review'}
              </h1>
              <p className="text-slate-600 mt-2 text-sm leading-relaxed">
                Review and evaluate research proposals submitted to WMSU
              </p>
            </div>
          </div>
        </header>

        {/* Filters and Search */}
        <section className="flex-shrink-0" aria-label="Filter proposals">
          <div className="bg-white shadow-xl rounded-2xl border border-slate-200 p-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <div className="relative flex-1 max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-slate-400" aria-hidden="true" />
                </div>
                <input
                  type="text"
                  placeholder="Search proposals..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#C8102E] transition-colors"
                />
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Filter className="h-4 w-4 text-slate-400" aria-hidden="true" />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as ExtendedProposalStatus | 'All')}
                  className="appearance-none bg-white pl-10 pr-8 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E] transition-colors cursor-pointer"
                >
                  <option value="All">All Statuses ({getStatusCount('All')})</option>
                  <option value="Pending">Pending ({getStatusCount('Pending')})</option>
                  {/* <option value="Revised Proposal">Revised Proposal ({getStatusCount('Revised Proposal' as any)})</option> */}
                  <option value="Revision Required">Revision Required ({getStatusCount('Revision Required')})</option>
                  <option value="Sent to Evaluators">Sent to Evaluators ({getStatusCount('Sent to Evaluators')})</option>
                  <option value="Rejected Proposal">Rejected Proposal ({getStatusCount('Rejected Proposal')})</option>
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* Proposals List */}
        <main className="bg-white shadow-xl rounded-2xl border border-slate-200 flex flex-col h-fit">
          <div className="p-4 border-b border-slate-200 bg-slate-50">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#C8102E]" />
                Research Proposals
              </h3>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <User className="w-4 h-4" />
                <span>{proposals.length} total proposals</span>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto custom-scrollbar">
            {filteredProposals.length === 0 ? (
              <div className="text-center py-12 px-4">
                <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                  <FileText className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-medium text-slate-900 mb-2">No proposals found</h3>
              </div>
            ) : (
              <table className="min-w-full text-left align-middle">
                <tbody className="divide-y divide-slate-100 bg-white">
                  {paginatedProposals.map((proposal) => (
                    <tr
                      key={proposal.id}
                      className="hover:bg-slate-50 transition-colors duration-200 group"
                    >
                      {/* --- COL 1: DETAILS --- */}
                      <td className="px-6 py-5">
                        <div className="flex flex-col gap-1.5">
                          <span className="text-base font-medium text-slate-800 group-hover:text-[#C8102E] transition-colors">
                            {proposal.title}
                          </span>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
                            <div className="flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-slate-400" />
                              <span>{proposal.submittedBy}</span>
                            </div>
                            <div className={'flex items-center gap-1.5'}>
                              <Calendar className={'w-3.5 h-3.5 text-slate-400'} />
                              <span>
                                Date Submitted: {new Date(proposal.submittedDate).toLocaleDateString()}
                              </span>
                            </div>


                            {/* Render Additional Tags */}
                            {proposal.tags && proposal.tags.length > 0 && proposal.tags.map((tag, i) => (
                              <span
                                key={i}
                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${getTagColor(tag)}`}
                              >
                                <Tag className="w-3 h-3" />
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </td>

                      {/* --- COL 2: STATUS & ACTIONS --- */}
                      <td className="px-6 py-5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-3">

                          {/* Status Badge (Clickable for Evaluators) */}
                          {getStatusBadge(proposal.status as ExtendedProposalStatus, proposal)}

                          {/* Action Button */}
                          {(proposal.status === "Pending" || proposal.status === ("Revised Proposal" as ProposalStatus)) && (
                            <button
                              onClick={() => handleViewProposal(proposal)}
                              className="inline-flex items-center gap-1.5 px-3 h-8 rounded-lg bg-[#C8102E] text-white hover:bg-[#A00C24] hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#C8102E] transition-all duration-200 cursor-pointer text-xs font-medium shadow-sm"
                            >
                              <Gavel className="w-3 h-3" />
                              Action
                            </button>
                          )}

                          {/* Eye Button */}
                          <button
                            onClick={() => handleViewDetails(proposal)}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 cursor-pointer"
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
            <div className="p-4 bg-slate-50 border-t border-slate-200">
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
          userRole='R&D Staff'
          currentUser={currentUser}
        />

        <DetailedProposalModal
          proposal={selectedProposalForView}
          isOpen={isViewModalOpen}
          onClose={() => {
            setIsViewModalOpen(false);
            setSelectedProposalForView(null);
          }}
          agencies={agencies}
          sectors={sectors}
          priorityAreas={priorityAreas}
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
  );
};

export default RndProposalPage;
