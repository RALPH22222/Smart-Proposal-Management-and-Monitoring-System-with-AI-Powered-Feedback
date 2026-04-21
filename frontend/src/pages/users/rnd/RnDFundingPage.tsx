import React, { useState, useEffect, useCallback } from 'react';
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
  Eye,
  Banknote,
  Clock,
  Archive,
  Search,
  CalendarDays,
  Download,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { type Proposal, type ProposalStatus } from '../../../types/InterfaceProposal';
import { getProposalUploadUrl, uploadFileToS3 } from '../../../services/proposal.api';
import { api } from '../../../utils/axios';
import FundingActionModal from '../../../components/shared/FundingActionModal';
import type { FundingActionSubmitData } from '../../../components/shared/FundingActionModal';
import DocumentViewerModal from '../../../components/shared/DocumentViewerModal';
import RealignmentReviewModal from '../../../components/shared/RealignmentReviewModal';
import ProjectBudgetViewerModal from '../../../components/shared/ProjectBudgetViewerModal';
import PageLoader from '../../../components/shared/PageLoader';
import { formatDate } from '../../../utils/date-formatter';
import { transformProposalForModal } from '../../../utils/proposal-transform';
import {
  fetchRealignments,
  type RealignmentRecord,
} from '../../../services/ProjectMonitoringApi';
import { useAuthContext } from '../../../context/AuthContext';
import { exportToCsv } from '../../../utils/csv-export';

const FundingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const [fundingProposals, setFundingProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  // Phase 3 of LIB feature: third tab for budget realignment requests
  const [activeTab, setActiveTab] = useState<'pending' | 'archived' | 'realignments'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [yearFilter, setYearFilter] = useState('All');
  const [sortOrder, setSortOrder] = useState('recent-old');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
 
  const [activeProposal, setActiveProposal] = useState<Proposal | null>(null);
  const [activeProposalRaw, setActiveProposalRaw] = useState<any>(null);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [viewingDocumentUrl, setViewingDocumentUrl] = useState<string | null>(null);
 
  // Phase 3 of LIB feature: realignment list state
  const [realignments, setRealignments] = useState<RealignmentRecord[]>([]);
  const [realignmentsLoading, setRealignmentsLoading] = useState(false);
  const [activeRealignmentId, setActiveRealignmentId] = useState<number | null>(null);
 
  // Phase 4 follow-up: budget money tracker modal (for Funded projects)
  const [budgetViewerProject, setBudgetViewerProject] = useState<{
    fundedProjectId: number;
    title: string;
  } | null>(null);

  useEffect(() => {
    loadFundingProposals();
  }, []);

  const loadRealignments = useCallback(async () => {
    setRealignmentsLoading(true);
    try {
      const data = await fetchRealignments();
      setRealignments(data);
    } catch (err) {
      console.error('Failed to load realignments', err);
    } finally {
      setRealignmentsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'realignments') {
      loadRealignments();
    }
  }, [activeTab, loadRealignments]);

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

  const displayedProposals = fundingProposals.filter(p => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = p.title.toLowerCase().includes(term) ||
           p.submittedBy.toLowerCase().includes(term) ||
           String(p.id).toLowerCase().includes(term);

    if (!matchesSearch) return false;

    const proposalYear = p.submittedDate ? new Date(p.submittedDate).getFullYear().toString() : "N/A";
    const matchesYear = yearFilter === "All" || proposalYear === yearFilter;
    if (!matchesYear) return false;

    return activeTab === 'pending'
      ? pendingStatuses.includes(p.status)
      : archivedStatuses.includes(p.status)
  });

  const sortedFilteredProposals = [...displayedProposals].sort((a, b) => {
    if (sortOrder === "a-z") return a.title.localeCompare(b.title);
    if (sortOrder === "z-a") return b.title.localeCompare(a.title);

    const dateA = new Date(a.submittedDate || 0).getTime();
    const dateB = new Date(b.submittedDate || 0).getTime();

    if (sortOrder === "recent-old") return dateB - dateA;
    if (sortOrder === "old-recent") return dateA - dateB;

    return 0;
  });

  const displayedRealignments = realignments.filter(r => {
    const term = searchTerm.toLowerCase();
    const projectTitle = r.funded_project?.proposals?.project_title ?? 'Untitled project';
    const requesterName = [r.requester?.first_name, r.requester?.last_name]
      .filter(Boolean)
      .join(' ') || r.requester?.email || 'Unknown';
    return projectTitle.toLowerCase().includes(term) || requesterName.toLowerCase().includes(term);
  });

  const totalPages = Math.ceil(sortedFilteredProposals.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProposals = sortedFilteredProposals.slice(startIndex, startIndex + itemsPerPage);



  if (loading) return <PageLoader mode="table" />;

  return (
    <>
    <div className="min-h-screen w-full px-5 sm:px-8 lg:px-10 xl:px-12 2xl:px-16 py-8 lg:py-10 bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col lg:flex-row animate-fade-in">
      <div className="flex w-full min-w-0 flex-col gap-3 lg:gap-4">
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

        {/* Stepper / Tabs */}
        <section className="flex-shrink-0 overflow-x-auto pb-2">
          <div className="flex gap-2">
            {[
              { id: 'pending', label: 'Pending', icon: Clock, count: fundingProposals.filter(p => pendingStatuses.includes(p.status)).length },
              { id: 'realignments', label: 'Realignments', icon: Banknote, count: realignments.length },
              { id: 'archived', label: 'Archive', icon: Archive, count: fundingProposals.filter(p => archivedStatuses.includes(p.status)).length },
            ].map(tab => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id as any); setCurrentPage(1); }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap border ${isActive
                    ? 'bg-[#C8102E] text-white border-[#C8102E] shadow-sm'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-100 text-slate-500'
                    }`}>
                    {tab.count}
                  </span>
                </button>
              )
            })}
          </div>
        </section>

        {/* Search and Filters Section */}
        <section className="flex-shrink-0 flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder={activeTab === 'realignments' ? "Search realignments..." : "Search proposals..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-transparent bg-white shadow-sm"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={yearFilter}
              onChange={(e) => { setYearFilter(e.target.value); setCurrentPage(1); }}
              className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-transparent bg-white shadow-sm cursor-pointer"
            >
              <option value="All">All Years</option>
              {Array.from(new Set(fundingProposals.map(p => p.submittedDate ? new Date(p.submittedDate).getFullYear() : null).filter(Boolean))).sort((a: any, b: any) => b - a).map(year => (
                <option key={year} value={String(year)}>{year}</option>
              ))}
            </select>
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

        {/* Proposals List */}
        <main className="relative flex w-full min-w-0 flex-col overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xl">

          <div className="flex-shrink-0 border-b border-slate-200 bg-slate-50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-[#C8102E]" />
              {activeTab === 'pending'
                ? 'Funding Proposals'
                : activeTab === 'archived'
                  ? 'Funded Archive'
                  : 'Realignment Requests'}
            </h3>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <User className="w-4 h-4" />
              <span>{activeTab === 'realignments' ? displayedRealignments.length : displayedProposals.length} total items</span>
            </div>
          </div>

            <div className="min-w-0">
            {activeTab === 'realignments' ? (
              realignmentsLoading ? (
                <PageLoader mode="realignment-list" />
              ) : displayedRealignments.length === 0 ? (
                <div className="text-center py-12 px-4 mt-4">
                  <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                    <Banknote className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-medium text-slate-900 mb-2">No realignment requests</h3>
                  <p className="text-slate-500 max-w-sm mx-auto">
                    Realignment requests submitted by proponents will appear here for your review.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {displayedRealignments.map((r) => {
                    const projectTitle = r.funded_project?.proposals?.project_title ?? 'Untitled project';
                    const requesterName = [r.requester?.first_name, r.requester?.last_name]
                      .filter(Boolean)
                      .join(' ') || r.requester?.email || 'Unknown';
                    const statusStyle =
                      r.status === 'pending_review'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : r.status === 'revision_requested'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : r.status === 'approved'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-red-50 text-red-700 border-red-200';
                    return (
                      <article
                        key={r.id}
                        className="p-4 hover:bg-slate-50 transition-colors cursor-pointer"
                        onClick={() => setActiveRealignmentId(r.id)}
                      >
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <h2 className="text-base font-semibold text-slate-800 line-clamp-2">
                              {projectTitle}
                            </h2>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500 mt-1">
                              <span className="flex items-center gap-1">
                                <User className="w-3 h-3" /> {requesterName}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" /> {formatDate(r.created_at)}
                              </span>
                              <span className="text-slate-400 italic line-clamp-1 max-w-xs sm:max-w-sm md:max-w-md">
                                "{r.reason.length > 100 ? r.reason.slice(0, 97) + '...' : r.reason}"
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                            <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full border ${statusStyle}`}>
                              {r.status === 'pending_review' && <Clock className="w-3 h-3 inline mr-1" />}
                              {r.status.replace('_', ' ')}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveRealignmentId(r.id);
                              }}
                              className="inline-flex items-center gap-1.5 px-3 h-8 rounded-lg bg-[#C8102E] text-white hover:bg-[#a00d25] hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#C8102E] transition-all duration-200 cursor-pointer text-xs font-medium shadow-sm"
                            >
                              <Eye className="w-3 h-3" /> Review
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )
            ) : displayedProposals.length === 0 ? (
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
                            <Calendar className="w-3.5 h-3.5" />
                            <span>Submitted: {formatDate(proposal.submittedDate)}</span>
                          </div>

                          {/* Year Badge */}
                          <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-slate-50 text-[#C8102E] rounded-lg font-bold border border-slate-200">
                            <CalendarDays className="w-3.5 h-3.5 text-[#C8102E]" />
                            {new Date(proposal.submittedDate).getFullYear()}
                          </span>

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
                      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                         {getStatusBadge(proposal.status)}
                         {activeTab === 'pending' ? (
                           <button
                             onClick={() => { setActiveProposal(proposal); setIsActionModalOpen(true); }}
                             className="inline-flex items-center gap-1.5 px-3 h-8 rounded-lg bg-[#C8102E] text-white hover:bg-[#a00d25] hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#C8102E] transition-all duration-200 cursor-pointer text-xs font-medium shadow-sm"
                           >
                             <Gavel className="w-3.5 h-3.5" />
                             Action
                           </button>
                        ) : proposal.status === 'Funded' ? (
                          <div className="flex items-center gap-2">
                            {(proposal as any).fundedProjectId && (
                              <button
                                onClick={() => {
                                  setBudgetViewerProject({
                                    fundedProjectId: (proposal as any).fundedProjectId,
                                    title: proposal.title,
                                  });
                                }}
                                className="inline-flex items-center gap-1.5 px-3 h-8 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all duration-200 cursor-pointer text-xs font-medium shadow-sm"
                                title="View line-item budget and utilization"
                              >
                                <Banknote className="w-3.5 h-3.5" />
                                Budget Tracker
                              </button>
                            )}
                            {(proposal as any).fundingDocumentUrl && (
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
                            )}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

          {/* Pagination — only for the proposal tabs, not realignments */}
          {activeTab !== 'realignments' && sortedFilteredProposals.length > 0 && (
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex-shrink-0">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-xs text-slate-600">
                <span>
                  Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, sortedFilteredProposals.length)} of {sortedFilteredProposals.length} proposals
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
        onOpenDetails={(p) => {
          const isMultiRole = ((user as any)?.roles?.length || 0) > 1;
          const targetPath = isMultiRole 
            ? '/users/multi-role/MainLayout?role=rnd&tab=proposals' 
            : '/users/rnd/rndMainLayout?tab=proposals';
          navigate(targetPath, { 
            state: { openProposalId: p.id } 
          });
        }}
      />

      {activeRealignmentId != null && (
        <RealignmentReviewModal
          realignmentId={activeRealignmentId}
          onClose={() => setActiveRealignmentId(null)}
          onReviewed={() => {
            loadRealignments();
            loadFundingProposals();
          }}
        />
      )}

      {budgetViewerProject && (
        <ProjectBudgetViewerModal
          fundedProjectId={budgetViewerProject.fundedProjectId}
          projectTitle={budgetViewerProject.title}
          onClose={() => setBudgetViewerProject(null)}
        />
      )}
    </>
  );
};

export default FundingPage;
