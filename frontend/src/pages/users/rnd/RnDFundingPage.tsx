import React, { useState, useEffect } from 'react';
import {
  CheckCircle,
  FileText,
  DollarSign,
  User,
  Calendar,
  Tag,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  X,
} from 'lucide-react';
import { type Proposal, type ProposalStatus } from '../../../types/InterfaceProposal';
import { proposalApi } from '../../../services/RndProposalApi/ProposalApi';

const FundingPage: React.FC = () => {
  const [fundingProposals, setFundingProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    loadFundingProposals();
  }, []);

  const loadFundingProposals = async () => {
    try {
      setLoading(true);
      const allProposals = await proposalApi.fetchProposals();
      // Filter proposals that are relevant to funding
      const relevantStatuses: ProposalStatus[] = ['Endorsed', 'Funded'];
      const filtered = allProposals.filter(p => relevantStatuses.includes(p.status));
      setFundingProposals(filtered);
    } catch (error) {
      console.error('Error loading funding proposals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (proposalId: string, newStatus: ProposalStatus) => {
    try {
      await proposalApi.updateProposalStatus(proposalId, newStatus);
      // Refresh list
      loadFundingProposals();
    } catch (error) {
      console.error(`Error updating status to ${newStatus}:`, error);
    }
  };

  const getSectorColor = (sector: string) => {
    switch (sector.toLowerCase()) {
      case 'ict':
      case 'information technology':
        return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'public safety':
        return 'bg-purple-50 text-purple-700 border-purple-100';
      case 'energy':
        return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'healthcare':
      case 'health':
        return 'bg-pink-50 text-pink-700 border-pink-100';
      case 'agriculture':
      case 'environment':
        return 'bg-green-50 text-green-700 border-green-100';
      case 'education':
        return 'bg-indigo-50 text-indigo-700 border-indigo-100';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-100';
    }
  };

  const getStatusBadge = (status: ProposalStatus) => {
    const baseClasses = 'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border border-current border-opacity-20';
    switch (status) {
      case 'Endorsed':
        return <span className={`${baseClasses} text-blue-600 bg-blue-50 border-blue-200`}>Endorsed</span>;
      case 'Funded':
        return <span className={`${baseClasses} text-emerald-600 bg-emerald-50 border-emerald-200`}>Funded</span>;
      default:
        return <span className={`${baseClasses} text-slate-600 bg-slate-50 border-slate-200`}>{status}</span>;
    }
  };



  // Pagination
  const totalPages = Math.ceil(fundingProposals.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProposals = fundingProposals.slice(startIndex, startIndex + itemsPerPage);

  const [justificationModal, setJustificationModal] = useState<{ isOpen: boolean; title: string; content: string }>({
    isOpen: false,
    title: '',
    content: ''
  });

  const getRandomEndorser = (id: string) => {
    const names = ["Dr. Michael Chen", "Dr. Sarah Connor", "Dr. James Reid", "Dr. Emily White", "Dr. Robert Kim", "Dr. Angela Rivera", "Dr. Amanda Foster"];
    let sum = 0;
    for (let i = 0; i < id.length; i++) {
      sum += id.charCodeAt(i);
    }
    return names[sum % names.length];
  };

  const handleViewJustification = (proposal: Proposal) => {
    setJustificationModal({
      isOpen: true,
      title: `Endorsement Justification - ${proposal.title}`,
      content: proposal.endorsementJustification || "No justification provided."
    });
  };

  const closeJustificationModal = () => {
    setJustificationModal(prev => ({ ...prev, isOpen: false }));
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C8102E] mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading funding data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br p-6 from-slate-50 to-slate-100 min-h-screen lg:h-screen flex flex-col relative">
      <div className="flex-1 flex flex-col gap-4 sm:gap-6 overflow-hidden">
        {/* Header */}
        <header className="flex-shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#C8102E] leading-tight">
                Project Funding Status
              </h1>
              <p className="text-slate-600 mt-2 text-sm leading-relaxed">
                Track council approval and funding status of endorsed proposals
              </p>
            </div>
          </div>
        </header>

        {/* Stats Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-blue-50 shadow-xl rounded-2xl border border-blue-300 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-700 mb-2">Endorsed (New)</p>
                <p className="text-xl font-bold text-blue-600 tabular-nums">
                  {fundingProposals.filter((p) => p.status === 'Endorsed').length}
                </p>
              </div>
              <FileText className="w-6 h-6 text-blue-500" />
            </div>
          </div>
          <div className="bg-emerald-50 shadow-xl rounded-2xl border border-emerald-300 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-700 mb-2">Funded</p>
                <p className="text-xl font-bold text-emerald-600 tabular-nums">
                  {fundingProposals.filter((p) => p.status === 'Funded').length}
                </p>
              </div>
              <CheckCircle className="w-6 h-6 text-emerald-500" />
            </div>
          </div>
        </section>

        {/* Proposals List */}
        <main className="bg-white shadow-xl rounded-2xl border border-slate-200 overflow-hidden flex-1 flex flex-col">
          <div className="p-4 border-b border-slate-200 bg-slate-50">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-[#C8102E]" />
              Funding Proposals
            </h3>
          </div>

          <div className="flex-1 overflow-y-auto">
            {fundingProposals.length === 0 ? (
              <div className="text-center py-12 px-4 mt-4">
                <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                  <DollarSign className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-medium text-slate-900 mb-2">
                  No funding proposals found
                </h3>
                <p className="text-slate-500 max-w-sm mx-auto">
                  Proposals will appear here once they are endorsed for funding by the R&D department.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {paginatedProposals.map((proposal) => (
                  <article key={proposal.id} className="p-4 hover:bg-slate-50 transition-colors duration-200">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h2 className="text-base font-semibold text-slate-800">{proposal.title}</h2>
                          {getStatusBadge(proposal.status)}
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-2">
                          {/* Submitted By */}
                          <div className="flex items-center gap-1.5 text-slate-500">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            <span>{proposal.submittedBy}</span>
                          </div>

                          {/* Date Submitted */}
                          <div className="flex items-center gap-1.5 text-slate-500">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>Date Submitted: {new Date(proposal.submittedDate).toLocaleDateString()}</span>
                          </div>

                          {/* Endorsed By */}
                          <div className="flex items-center gap-1.5 text-slate-500">
                            <span className="text-slate-400">Endorsed By:</span>
                            <span className="font-medium text-slate-700">{proposal.rdStaffReviewer || getRandomEndorser(proposal.id)}</span>
                          </div>


                          {/* Tags */}
                          {proposal.sector && (
                            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${getSectorColor(proposal.sector)}`}>
                              <Tag className="w-3 h-3" />
                              <span className="font-medium">{proposal.sector}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        {proposal.status === 'Endorsed' && (
                          <button
                            onClick={() => handleStatusChange(proposal.id, 'Funded')}
                            className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            Approve (Council)
                          </button>
                        )}
                        {/* Justification View Button */}
                        <button
                          onClick={() => handleViewJustification(proposal)}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 cursor-pointer"
                          title="View Endorsement Justification"
                        >
                          <MessageSquare className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

          {/* Pagination */}
          {fundingProposals.length > 0 && (
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex-shrink-0">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-xs text-slate-600">
                <span>
                  Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, fundingProposals.length)} of {fundingProposals.length} proposals
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

      {/* Justification Modal */}
      {justificationModal.isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50" onClick={closeJustificationModal}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-blue-500" />
                Endorsement Justification
              </h3>
              <button onClick={closeJustificationModal} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                  {justificationModal.content}
                </p>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={closeJustificationModal}
                  className="px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FundingPage;
