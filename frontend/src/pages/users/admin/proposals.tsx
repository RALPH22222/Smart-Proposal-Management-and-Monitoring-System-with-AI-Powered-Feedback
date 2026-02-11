import React, { useState, useEffect } from 'react';
import {
  FileText, Calendar, User, Eye, Search,
  ChevronLeft, ChevronRight, Tag, Clock, XCircle,
  RefreshCw, GitBranch, Bot, UserCog, Pen, Users, X, MessageSquare
} from 'lucide-react';
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
type ExtendedProposalStatus = ProposalStatus | 'Revised Proposal' | 'Under R&D Review' | 'Under Evaluators Assessment';

const AdminProposalPage: React.FC<AdminProposalPageProps> = ({ onStatsUpdate }) => {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal States
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [selectedProposalForView, setSelectedProposalForView] = useState<Proposal | null>(null);
  const [selectedProposalForChange, setSelectedProposalForChange] = useState<Proposal | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isChangeRdModalOpen, setIsChangeRdModalOpen] = useState(false);

  // Evaluator List Modal State
  const [isEvaluatorModalOpen, setIsEvaluatorModalOpen] = useState(false);
  const [currentEvaluatorsList, setCurrentEvaluatorsList] = useState<string[]>([]);
  const [currentEvaluatorMessage, setCurrentEvaluatorMessage] = useState<string>('');

  // Filter State
  const [activeTab, setActiveTab] = useState<ExtendedProposalStatus | 'All'>('All');
  const [searchTerm, setSearchTerm] = useState('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Mock Current User
  const currentUser: Reviewer = { name: 'Admin User', role: 'R&D Staff', id: 'admin-1', email: 'admin@wmsu.edu.ph' };

  // Load proposals on component mount
  useEffect(() => {
    loadProposals();
  }, []);

  const loadProposals = async () => {
    try {
      setLoading(true);
      const data = await proposalApi.fetchProposals();
      setProposals(data);
    } catch (error) {
      console.error('Error loading proposals:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter logic
  const filteredProposals = proposals.filter((proposal) => {
    const matchesSearch =
      proposal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proposal.proponent.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proposal.id.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

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
      return s.includes('revised');
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

  // Pagination logic
  const totalPages = Math.ceil(filteredProposals.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProposals = filteredProposals.slice(startIndex, startIndex + itemsPerPage);

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

  const confirmRdChange = async (proposalId: string, newStaffName: string) => {
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
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProposal(null);
  };

  // Handler for the Main Action Modal
  const handleSubmitDecision = async (decision: Decision) => {
    try {
      await proposalApi.submitDecision(decision);

      // Determine new status based on decision
      let newStatus: ProposalStatus;
      let newAssignedEvaluators: string[] | undefined = undefined;
      let instructionMessage = decision.structuredComments?.objectives?.content || "";

      if (decision.decision === 'Sent to Evaluators') {
        newStatus = 'Under Evaluators Assessment';
        newAssignedEvaluators = decision.assignedEvaluators || [];
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
    }
  };

  // --- Helper: Status Normalization ---
  // Matches AdminViewModal logic for consistency
  const getNormalizedStatus = (status: string): ExtendedProposalStatus => {
    const s = status.toLowerCase();

    if (s.includes('revise') || s.includes('revision')) return 'Revision Required';
    if (s.includes('reject')) return 'Rejected Proposal';
    if (s.includes('endorsed') || s.includes('fund')) return 'Endorsed'; // Or 'Funded' / 'Waiting for Funding'

    // R&D Review variations
    if (
      s.includes('r&d') ||
      s.includes('rnd') ||
      s === 'review_rnd' ||
      s.includes('under r&d review')
    ) return 'Under R&D Review';

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
    if (s.includes('revised') || s === 'revised proposal') {
      if (proposal.assignedRdStaff) {
        return <span className={`${baseClasses} text-blue-600 bg-blue-50 border-blue-200`} title={`Assigned to: ${proposal.assignedRdStaff}`}>
          <Bot className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">RnD: {proposal.assignedRdStaff}</span>
        </span>;
      }
      return <span className={`${baseClasses} text-purple-600 bg-purple-50 border-purple-200 cursor-default`}><GitBranch className="w-3 h-3 flex-shrink-0" />Revised Proposal</span>;
    }

    // Revision Required
    if (s.includes('revision') || s.includes('require')) {
      return <span className={`${baseClasses} text-orange-600 bg-orange-50 border-orange-200 cursor-default`}><RefreshCw className="w-3 h-3 flex-shrink-0" />Revision Required</span>;
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
        className={`${baseClasses} text-purple-600 bg-purple-50 border-purple-200`}
        title={evaluators.join(', ')}
      >
        <Users className="w-3 h-3 flex-shrink-0" />
        <span className="truncate">{evaluatorText}</span>
      </button>;
    }

    // Rejected
    if (s.includes('reject')) {
      return <span className={`${baseClasses} text-red-600 bg-red-50 border-red-200 cursor-default`}><XCircle className="w-3 h-3 flex-shrink-0" />Rejected Proposal</span>;
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
    { id: 'Revised Proposal', label: 'Revised', icon: GitBranch },
    { id: 'Revision Required', label: 'To Revise', icon: RefreshCw },
    { id: 'Under Evaluators Assessment', label: 'Evaluators', icon: Users },
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
    <div className="bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen lg:h-screen flex flex-col lg:flex-row">
      <div className="flex-1 flex flex-col p-6 gap-4 sm:gap-6 overflow-hidden">
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
          </div>
        </header>

        {/* Stepper / Tabs */}
        <section className="flex-shrink-0 overflow-x-auto pb-2">
          <div className="flex gap-2">
            {tabs.map(tab => {
              const isActive = activeTab === tab.id;
              const count = getStatusCount(tab.id);
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap border ${isActive
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

        {/* Search Bar */}
        <section className="flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search proposals..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-transparent"
            />
          </div>
        </section>

        {/* Proposals List */}
        <main className="bg-white shadow-xl rounded-2xl border border-slate-200 flex flex-col h-fit overflow-hidden flex-1">
          <div className="p-4 border-b border-slate-200 bg-slate-50">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#C8102E]" />
                {activeTab === 'All' ? 'All Proposals' : `${activeTab} Proposals`}
              </h3>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <User className="w-4 h-4" />
                <span>{filteredProposals.length} total</span>
              </div>
            </div>
          </div>

          <div className="overflow-y-auto custom-scrollbar flex-1">
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
                        <div className="flex flex-col gap-2">
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
                                {new Date(proposal.submittedDate).toLocaleDateString()}
                              </span>
                            </div>


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
                        <div className="flex items-center justify-end gap-3">

                          {/* Status Badge */}
                          {getStatusBadge(proposal)}

                          {/* Eye Button */}
                          <button
                            onClick={() => handleViewDetails(proposal)}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 cursor-pointer"
                            title="View details"
                          >
                            <Eye className="w-3 h-3" />
                          </button>

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
        />

        <DetailedProposalModal
          proposal={selectedProposalForView}
          isOpen={isViewModalOpen}
          onClose={() => {
            setIsViewModalOpen(false);
            setSelectedProposalForView(null);
          }}
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
  );
};

export default AdminProposalPage;
