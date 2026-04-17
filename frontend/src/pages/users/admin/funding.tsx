import React, { useState, useEffect } from 'react';
import {
  CheckCircle,
  DollarSign,
  User,
  Calendar,
  Tag,
  ChevronLeft,
  ChevronRight,
  Gavel,
  AlertTriangle,
  XCircle,
  Signature,
  Download,
} from 'lucide-react';
import { exportToCsv } from '../../../utils/csv-export';
import { type Proposal, type ProposalStatus } from '../../../types/InterfaceProposal';
import { getProposalUploadUrl, uploadFileToS3 } from '../../../services/proposal.api';
import { adminProposalApi } from '../../../services/AdminProposalApi/ProposalApi';
import { api } from '../../../utils/axios';
import { formatDate } from '../../../utils/date-formatter';
import FundingActionModal from '../../../components/shared/FundingActionModal';
import type { FundingActionSubmitData } from '../../../components/shared/FundingActionModal';
import PageLoader from '../../../components/shared/PageLoader';

const AdminFundingPage: React.FC = () => {
  const [fundingProposals, setFundingProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [activeProposal, setActiveProposal] = useState<Proposal | null>(null);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);

  useEffect(() => {
    loadFundingProposals();
  }, []);

  const loadFundingProposals = async () => {
    try {
      setLoading(true);
      const allProposals = await adminProposalApi.fetchProposals();
      // Filter proposals that are relevant to funding
      const relevantStatuses: ProposalStatus[] = ['Endorsed', 'Funded', 'Funding Rejected', 'Funding Revision'];
      const filtered = allProposals.filter(p => relevantStatuses.includes(p.status));
      setFundingProposals(filtered);
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
      throw error;
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
        return <span className={`${baseClasses} text-blue-800 bg-blue-50 border-blue-400`}><Signature className="w-3.5 h-3.5" /> Endorsed</span>;
      case 'Funded':
        return <span className={`${baseClasses} text-emerald-600 bg-emerald-50 border-emerald-200`}>Funded</span>;
      case 'Funding Rejected':
        return <span className={`${baseClasses} text-red-600 bg-red-50 border-red-200`}>Funding Rejected</span>;
      case 'Funding Revision':
        return <span className={`${baseClasses} text-amber-600 bg-amber-50 border-amber-200`}>Funding Revision</span>;
      default:
        return <span className={`${baseClasses} text-slate-600 bg-slate-50 border-slate-200`}>{status}</span>;
    }
  };

   // Pagination
   const totalPages = Math.ceil(fundingProposals.length / itemsPerPage);
   const startIndex = (currentPage - 1) * itemsPerPage;
   const paginatedProposals = fundingProposals.slice(startIndex, startIndex + itemsPerPage);

  if (loading) {
    return <PageLoader mode="table" />;
  }

  return (
    <>
      <div className="min-h-screen lg:h-screen px-5 sm:px-8 lg:px-10 xl:px-12 2xl:px-16 py-8 lg:py-10 bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col relative animate-fade-in">
      <div className="flex-1 flex flex-col gap-4 lg:gap-6 overflow-hidden min-w-0">
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
            <button
              onClick={() =>
                exportToCsv('funding-proposals', fundingProposals, [
                  { header: 'ID', accessor: (p) => p.id },
                  { header: 'Title', accessor: (p) => p.title },
                  { header: 'Submitted By', accessor: (p) => p.submittedBy },
                  { header: 'Department', accessor: (p) => (p as any).rdStation || '' },
                  { header: 'Status', accessor: (p) => p.status },
                  { header: 'Submitted Date', accessor: (p) => p.submittedDate },
                  { header: 'Budget Total', accessor: (p) => p.budgetTotal || '' },
                ])
              }
              disabled={fundingProposals.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold shadow-sm bg-white text-[#C8102E] border border-[#C8102E]/30 hover:bg-[#C8102E]/5 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              title={fundingProposals.length === 0 ? 'No rows to export' : 'Export visible rows to CSV'}
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </header>

        {/* Stats Cards */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
           <div className="bg-blue-50 shadow-xl rounded-2xl border border-blue-300 p-4">
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
        <main className="bg-white shadow-xl rounded-2xl border border-slate-200 overflow-hidden flex-1 flex flex-col">
          <div className="p-4 border-b border-slate-200 bg-slate-50">
             <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-[#C8102E]" />
                Funding Proposals
             </h3>
          </div>

          <div className="flex-1 overflow-y-auto">
             {fundingProposals.length === 0 ? (
               <div className="text-center py-12 px-4">
                 <p className="text-slate-500">No proposals found in funding stages.</p>
               </div>
             ) : (
                <div className="divide-y divide-slate-100">
                  {paginatedProposals.map((proposal) => (
                    <article key={proposal.id} className="p-4 hover:bg-slate-50 transition-colors duration-200">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                         <div className="flex-1 min-w-0">
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
                                <Calendar className="w-3.5 h-3.5"/>
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
                            <button
                                onClick={() => { setActiveProposal(proposal); setIsActionModalOpen(true); }}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[#C8102E] rounded-xl hover:bg-[#a00d25] transition-colors shadow-sm"
                            >
                                <Gavel className="w-3.5 h-3.5" />
                                Action
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

      <FundingActionModal
        isOpen={isActionModalOpen}
        onClose={() => setIsActionModalOpen(false)}
        onSubmit={handleActionSubmit}
        proposalTitle={activeProposal?.title || ''}
      />
      </div>
    </>
  );
};

export default AdminFundingPage;
