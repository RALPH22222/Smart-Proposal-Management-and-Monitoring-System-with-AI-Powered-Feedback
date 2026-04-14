import React, { useState, useEffect } from 'react';
import {
  CheckCircle,
  DollarSign,
  User,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Gavel,
  AlertTriangle,
  XCircle,
  Tag,
  Signature,
  Eye
} from 'lucide-react';
import { type Proposal, type ProposalStatus } from '../../../types/InterfaceProposal';
import { getProposalUploadUrl, uploadFileToS3 } from '../../../services/proposal.api';
import { api } from '../../../utils/axios';
import FundingActionModal from '../../../components/shared/FundingActionModal';
import type { FundingActionSubmitData } from '../../../components/shared/FundingActionModal';
import DocumentViewerModal from '../../../components/shared/DocumentViewerModal';
import PageLoader from '../../../components/shared/PageLoader';
import { formatDate } from '../../../utils/date-formatter';
import { transformProposalForModal } from '../../../utils/proposal-transform';

const FundingPage: React.FC = () => {
  const [fundingProposals, setFundingProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'archived'>('pending');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [activeProposal, setActiveProposal] = useState<Proposal | null>(null);
  const [activeProposalRaw, setActiveProposalRaw] = useState<any>(null);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [viewingDocumentUrl, setViewingDocumentUrl] = useState<string | null>(null);

  useEffect(() => {
    loadFundingProposals();
  }, []);

  const loadFundingProposals = async () => {
    try {
      setLoading(true);
      const rawData = await (await import('../../../services/proposal.api')).getRndProposals();

      // Store raw data on each proposal for later use in DocumentViewerModal
      const { proposalApi: pApi } = await import('../../../services/RndProposalApi/ProposalApi');
      const allMapped = await pApi.fetchProposals();
      const relevantFrontendStatuses: ProposalStatus[] = ['Endorsed', 'Funded', 'Funding Rejected', 'Funding Revision'];
      const mappedFiltered = allMapped.filter(p => relevantFrontendStatuses.includes(p.status as ProposalStatus));

      // Attach raw data to each proposal
      const withRaw = mappedFiltered.map(proposal => {
        const rawMatch = rawData.find((r: any) => {
          const rp = (r.proposal_id && (r.proposal_id.project_title || r.proposal_id.title)) ? r.proposal_id : r;
          return String(rp.id) === String(proposal.id);
        });
        const rawProposal = rawMatch
          ? ((rawMatch.proposal_id && (rawMatch.proposal_id.project_title || rawMatch.proposal_id.title)) ? rawMatch.proposal_id : rawMatch)
          : null;
        return { ...proposal, _raw: rawProposal };
      });

      const sorted = withRaw.sort((a, b) => Number(b.id) - Number(a.id));
      setFundingProposals(sorted as any);
    } catch (error) {
      console.error('Error loading funding proposals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleActionSubmit = async (data: FundingActionSubmitData) => {
    if (!activeProposal) return;
    try {
      let fileUrl: string | undefined;

      // Upload file if provided
      if (data.file) {
        const { uploadUrl, fileUrl: s3FileUrl } = await getProposalUploadUrl(data.file.name, data.file.type, data.file.size);
        await uploadFileToS3(uploadUrl, data.file);
        fileUrl = s3FileUrl;
      }

      // Map frontend decisions to backend enum values
      const decisionMap: Record<string, string> = {
        Approve: 'funded',
        Revise: 'revision_funding',
        Reject: 'rejected_funding',
      };

      await api.post('/proposal/endorse-for-funding', {
        proposal_id: activeProposal.id,
        decision: decisionMap[data.decision],
        file_url: fileUrl,
      });

      setIsActionModalOpen(false);
      setActiveProposal(null);
      loadFundingProposals();
    } catch (error) {
      console.error(`Error processing ${data.decision} action:`, error);
      throw error; // Re-throw to be caught by the modal
    }
  };

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

  const getStatusBadge = (status: ProposalStatus) => {
    const baseClasses = 'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border border-current border-opacity-20';
    switch (status) {
      case 'Endorsed':
        return <span className={`${baseClasses} text-blue-800 bg-blue-50 border-blue-200`}><Signature className="w-3.5 h-3.5" /> Endorsed</span>;
      case 'Funded':
        return <span className={`${baseClasses} text-emerald-800 bg-emerald-100 border-emerald-200`}><CheckCircle className="w-3.5 h-3.5" /> Funded</span>;
      case 'Funding Rejected':
        return <span className={`${baseClasses} text-red-600 bg-red-50 border-red-200`}>Funding Rejected</span>;
      case 'Funding Revision':
        return <span className={`${baseClasses} text-amber-600 bg-amber-50 border-amber-200`}>Funding Revision</span>;
      default:
        return <span className={`${baseClasses} text-slate-600 bg-slate-50 border-slate-200`}>{status}</span>;
    }
  };



  // Pagination & Filtering
  const pendingStatuses = ['Endorsed', 'Funding Revision'];
  const archivedStatuses = ['Funded', 'Funding Rejected'];

  const displayedProposals = fundingProposals.filter(p =>
    activeTab === 'pending'
      ? pendingStatuses.includes(p.status)
      : archivedStatuses.includes(p.status)
  );

  const totalPages = Math.ceil(displayedProposals.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProposals = displayedProposals.slice(startIndex, startIndex + itemsPerPage);



  if (loading) return <PageLoader mode="table" />;

  return (
    <>
    <div className="min-h-screen lg:h-screen px-5 sm:px-8 lg:px-10 xl:px-12 2xl:px-16 py-8 lg:py-10 bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col relative animate-fade-in">
      <div className="flex-1 flex flex-col gap-4 lg:gap-6 overflow-hidden">
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
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-blue-50 shadow-xl rounded-2xl border border-blue-400 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-700 mb-2">Endorsed for Funding</p>
                <p className="text-xl font-bold text-blue-800 tabular-nums">
                  {fundingProposals.filter((p) => p.status === 'Endorsed').length}
                </p>
              </div>
              <Signature className="w-6 h-6 text-blue-800" />
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
          <div className="bg-amber-50 shadow-xl rounded-2xl border border-amber-300 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-700 mb-2">Funding Revision</p>
                <p className="text-xl font-bold text-amber-600 tabular-nums">
                  {fundingProposals.filter((p) => p.status === 'Funding Revision').length}
                </p>
              </div>
              <AlertTriangle className="w-6 h-6 text-amber-500" />
            </div>
          </div>
          <div className="bg-red-50 shadow-xl rounded-2xl border border-red-300 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-700 mb-2">Funding Rejected</p>
                <p className="text-xl font-bold text-red-600 tabular-nums">
                  {fundingProposals.filter((p) => p.status === 'Funding Rejected').length}
                </p>
              </div>
              <XCircle className="w-6 h-6 text-red-500" />
            </div>
          </div>
        </section>

        {/* Proposals List */}
        <main className="relative bg-white shadow-xl rounded-2xl border border-slate-200 overflow-hidden flex-1 flex flex-col">

          <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-[#C8102E]" />
              {activeTab === 'pending' ? 'Funding Proposals' : 'Funding Archive'}
            </h3>
            <div className="flex items-center gap-1 bg-slate-200/50 p-1 rounded-lg">
              <button
                onClick={() => { setActiveTab('pending'); setCurrentPage(1); }}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'pending' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
              >
                Pending
              </button>
              <button
                onClick={() => { setActiveTab('archived'); setCurrentPage(1); }}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'archived' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
              >
                Archive
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {displayedProposals.length === 0 ? (
              <div className="text-center py-12 px-4 mt-4">
                <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                  <DollarSign className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-medium text-slate-900 mb-2">
                  {activeTab === 'pending' ? 'No pending proposals' : 'No archived proposals'}
                </h3>
                <p className="text-slate-500 max-w-sm mx-auto">
                  {activeTab === 'pending'
                    ? 'Proposals will appear here once they are endorsed for funding by the R&D department.'
                    : 'Projects that have been approved or rejected for funding will appear here.'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {paginatedProposals.map((proposal) => (
                  <article
                    key={proposal.id}
                    className={`p-4 transition-colors duration-200 ${proposal.status === 'Funded' ? 'bg-emerald-50/30 hover:bg-emerald-50' : 'hover:bg-slate-50'}`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h2 className="text-base font-semibold text-slate-800">{proposal.title}</h2>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-2">
                          {/* Submitted By */}
                          <div className="flex items-center gap-1.5 text-slate-500">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            <span>{proposal.submittedBy}</span>
                          </div>

                          {/* Date Submitted */}
                          <div className="flex items-center gap-1.5 font-semibold">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>Submitted: {formatDate(proposal.submittedDate)}</span>
                          </div>

                          {/* Tags */}
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

                      {/* Actions */}
                      <div className="flex items-center gap-3">
                        {getStatusBadge(proposal.status)}
                        {activeTab === 'pending' ? (
                          <button
                            onClick={() => { setActiveProposal(proposal); setIsActionModalOpen(true); }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[#C8102E] rounded-xl hover:bg-[#a00d25] transition-colors shadow-sm"
                          >
                            <Gavel className="w-3.5 h-3.5" />
                            Action
                          </button>
                        ) : proposal.status === 'Funded' && (proposal as any).fundingDocumentUrl ? (
                          <button
                            onClick={() => {
                              setActiveProposal(proposal);
                              setActiveProposalRaw((proposal as any)._raw);
                              setViewingDocumentUrl((proposal as any).fundingDocumentUrl!);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 h-8 rounded-lg bg-[#C8102E] text-white hover:bg-[#A00C24] hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#C8102E] transition-all duration-200 cursor-pointer text-xs font-medium shadow-sm"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            View File
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

          {/* Pagination */}
          {displayedProposals.length > 0 && (
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex-shrink-0">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-xs text-slate-600">
                <span>
                  Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, displayedProposals.length)} of {displayedProposals.length} proposals
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

      <FundingActionModal
        isOpen={isActionModalOpen}
        onClose={() => setIsActionModalOpen(false)}
        onSubmit={handleActionSubmit}
        proposalTitle={activeProposal?.title || ''}
      />

      <DocumentViewerModal
        isOpen={!!viewingDocumentUrl}
        onClose={() => { setViewingDocumentUrl(null); setActiveProposalRaw(null); }}
        documentUrl={viewingDocumentUrl || ''}
        title="Funding Approval Document"
        proposal={activeProposalRaw ? transformProposalForModal(activeProposalRaw) : activeProposal}
      />
    </>
  );
};

export default FundingPage;

