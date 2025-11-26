import React, { useState, useEffect } from 'react';
import { FileText, Calendar, User, Eye, Gavel, Filter, Search, TrendingUp, ChevronLeft, ChevronRight, Tag, Clock, Send, XCircle, RefreshCw, GitBranch } from 'lucide-react';
import {
  type Proposal,
  type Decision,
  type ProposalStatus,
  type Reviewer
} from '../../../types/InterfaceProposal';
import { proposalApi } from '../../../services/RndProposalApi/ProposalApi';
import ProposalModal from '../../../components/rnd-component/RnDProposalModal';
import DetailedProposalModal from '../../../components/rnd-component/RndViewModal';

interface ReviewPageProps {
  filter?: ProposalStatus;
  onStatsUpdate?: () => void;
}

// Extended Status type to include Revised Proposal locally for this view
type ExtendedProposalStatus = ProposalStatus | 'Revised Proposal';

const ReviewPage: React.FC<ReviewPageProps> = ({ filter, onStatsUpdate }) => {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [filteredProposals, setFilteredProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [selectedProposalForView, setSelectedProposalForView] = useState<Proposal | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<ExtendedProposalStatus | 'All'>(filter || 'All');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const currentUser: Reviewer = { name: 'Dr. John Smith' } as Reviewer;

  // Load proposals on component mount
  useEffect(() => {
    loadProposals();
  }, []);

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
      const data = await proposalApi.fetchProposals();
      
      // --- MOCK DATA TRANSFORMATION FOR DEMO PURPOSES ---
      // This forces specific statuses to visualize the UI requirements
      const mockTransformedData = data.map((prop, index) => {
        if (index === 0) return { ...prop, status: 'Revised Proposal' as ProposalStatus }; // Mock Revised
        if (index === 1) return { ...prop, status: 'Revision Required' as ProposalStatus }; // Mock Revision Required
        if (index === 2) return { ...prop, status: 'Sent to Evaluators' as ProposalStatus }; // Mock Sent
        if (index === 3) return { ...prop, status: 'Pending' as ProposalStatus }; // Changed from Rejected to Pending
        return prop; // Others remain pending or original status
      });
      // --------------------------------------------------

      setProposals(mockTransformedData);
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
    setSelectedProposalForView(proposal);
    setIsViewModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProposal(null);
  };

  const handleSubmitDecision = async (decision: Decision) => {
    try {
      await proposalApi.submitDecision(decision);

      const newStatus: ProposalStatus =
        decision.decision === 'Sent to Evaluators'
          ? 'Sent to Evaluators'
          : decision.decision === 'Rejected Proposal'
          ? 'Rejected Proposal'
          : 'Revision Required';

      setProposals((prev) =>
        prev.map((proposal) =>
          proposal.id === decision.proposalId
            ? {
                ...proposal,
                status: newStatus,
                lastModified: new Date().toISOString()
              }
            : proposal
        )
      );

      await proposalApi.updateProposalStatus(decision.proposalId, newStatus);

      if (onStatsUpdate) {
        onStatsUpdate();
      }
    } catch (error) {
      console.error('Error submitting decision:', error);
    }
  };

  const getStatusBadge = (status: ExtendedProposalStatus) => {
    const baseClasses = 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border border-current border-opacity-20';
  
    switch (status) {
      case 'Pending':
        return (
          <span className={`${baseClasses} text-amber-600 bg-amber-50 border-amber-200`}>
            <Clock className="w-3 h-3" />
            {status}
          </span>
        );
      case 'Revised Proposal':
        return (
          <span className={`${baseClasses} text-indigo-600 bg-indigo-50 border-indigo-200`}>
            <GitBranch className="w-3 h-3" />
            Revised Proposal
          </span>
        );
      case 'Sent to Evaluators':
        return (
          <span className={`${baseClasses} text-emerald-600 bg-emerald-50 border-emerald-200`}>
            <Send className="w-3 h-3" />
            {status}
          </span>
        );
      case 'Rejected Proposal':
        return (
          <span className={`${baseClasses} text-red-600 bg-red-50 border-red-200`}>
            <XCircle className="w-3 h-3" />
            {status}
          </span>
        );
      case 'Revision Required':
        return (
          <span className={`${baseClasses} text-orange-600 bg-orange-50 border-orange-200`}>
            <RefreshCw className="w-3 h-3" />
            {status}
          </span>
        );
      default:
        return (
          <span className={`${baseClasses} text-slate-600 bg-slate-50 border-slate-200`}>
            <FileText className="w-3 h-3" />
            {status}
          </span>
        );
    }
  };

  const getStatusCount = (status: ExtendedProposalStatus | 'All') => {
    if (status === 'All') return proposals.length;
    return proposals.filter((p) => p.status === status).length;
  };

  const getProjectTypeColor = (type: string) => {
    switch (type) {
      case 'ICT': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Healthcare': return 'bg-pink-100 text-pink-700 border-pink-200';
      case 'Agriculture': return 'bg-green-100 text-green-700 border-green-200';
      case 'Energy': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'Public Safety': return 'bg-purple-100 text-purple-700 border-purple-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getMockProjectType = (proposalId: string) => {
    const types = ['ICT', 'Energy', 'Healthcare', 'Agriculture', 'Public Safety'];
    return types[proposalId.charCodeAt(proposalId.length - 1) % types.length];
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
    <div className="bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen lg:h-screen flex flex-col lg:flex-row">
      <div className="flex-1 flex flex-col gap-4 sm:gap-6 overflow-hidden">
        {/* Header */}
        <header className="flex-shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#C8102E] leading-tight">
                {filter ? `${filter} Proposals` : 'Research Proposal Review'}
              </h1>
              <p className="text-slate-600 mt-2 text-sm leading-relaxed">
                Review and evaluate research proposals submitted to WMSU
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <TrendingUp className="w-4 h-4" />
              <span>Last updated: Today, 2:30 PM</span>
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
                  className="appearance-none bg-white pl-10 pr-8 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E] transition-colors"
                >
                  <option value="All">All Statuses ({getStatusCount('All')})</option>
                  <option value="Pending">Pending ({getStatusCount('Pending')})</option>
                  <option value="Revised Proposal">Revised Proposal ({getStatusCount('Revised Proposal' as any)})</option>
                  <option value="Revision Required">Revision Required ({getStatusCount('Revision Required')})</option>
                  <option value="Sent to Evaluators">Sent to Evaluators ({getStatusCount('Sent to Evaluators')})</option>
                  <option value="Rejected Proposal">Rejected Proposal ({getStatusCount('Rejected Proposal')})</option>
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* Proposals List */}
        <main className="bg-white shadow-xl rounded-2xl border border-slate-200 overflow-hidden flex-1 flex flex-col">
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

          <div className="flex-1 overflow-y-auto">
            {filteredProposals.length === 0 ? (
              <div className="text-center py-12 px-4">
                <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                  <FileText className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-medium text-slate-900 mb-2">No proposals found</h3>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {paginatedProposals.map((proposal) => (
                  <article
                    key={proposal.id}
                    className="p-4 hover:bg-slate-50 transition-colors duration-200 group"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h2 className="text-base font-semibold text-slate-800 mb-2 line-clamp-2 group-hover:text-[#C8102E] transition-colors duration-200">
                          {proposal.title}
                        </h2>

                        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                          <div className="flex items-center gap-1.5">
                            <User className="w-3 h-3" />
                            <span>{proposal.submittedBy}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3 h-3" />
                            <span>{new Date(proposal.submittedDate).toLocaleDateString()}</span>
                          </div>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${getProjectTypeColor(getMockProjectType(proposal.id))}`}>
                            <Tag className="w-3 h-3" />
                            {getMockProjectType(proposal.id)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 flex-shrink-0">
                       {getStatusBadge(proposal.status as ExtendedProposalStatus)}
                        
                        {/* Eye icon button for detailed view - ALWAYS VISIBLE */}
                        <button
                          onClick={() => handleViewDetails(proposal)}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 cursor-pointer"
                          title="View details"
                        >
                          <Eye className="w-3 h-3" />
                        </button>

                        {/* Action Button - ONLY for Pending or Revised Proposal */}
                        {(proposal.status === 'Pending' || proposal.status === ('Revised Proposal' as ProposalStatus)) && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleViewProposal(proposal)}
                              className="inline-flex items-center gap-1.5 px-3 h-8 rounded-lg bg-[#C8102E] text-white hover:bg-[#A00C24] hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#C8102E] transition-all duration-200 cursor-pointer text-xs font-medium shadow-sm"
                            >
                              <Gavel className="w-3 h-3" />
                              Action
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

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
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
        />
      </div>
    </div>
  );
};

export default ReviewPage;