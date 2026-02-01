<<<<<<< Updated upstream
import React, { useState, useEffect, useCallback } from "react";
import {
  FileText,
  Calendar,
  User,
  Eye,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
  Tag,
  Clock,
  XCircle,
  RefreshCw,
  Users,
  Microscope,
} from "lucide-react";
import { getProposals } from "../../../services/proposal.api";
import DetailedProposalModal from "../../../components/admin-component/AdminViewModal";
import { transformProposalForModal } from "../../../utils/proposal-transform";
import SendToRndModal from "../../../components/admin-component/SendToRndModal";
import ForwardToEvaluatorsModal from "../../../components/shared/ForwardToEvaluatorsModal";
import RevisionModal from "../../../components/shared/RevisionModal";
import RejectModal from "../../../components/shared/RejectModal";

// Backend status values
type BackendStatus =
  | "review_rnd"
  | "under_evaluation"
  | "revision_rnd"
  | "rejected_rnd"
  | "endorsed_for_funding"
  | "funded"
  | "pending";
=======
import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText, Calendar, User, Eye, Filter, Search,
  ChevronLeft, ChevronRight, Tag, Clock, XCircle,
  RefreshCw, Users, Send
} from 'lucide-react';
import { getProposals } from '../../../services/proposal.api';
import DetailedProposalModal from '../../../components/admin-component/AdminViewModal';
import SendToRndModal from '../../../components/admin-component/SendToRndModal';
import ForwardToEvaluatorsModal from '../../../components/shared/ForwardToEvaluatorsModal';
import RevisionModal from '../../../components/shared/RevisionModal';
import RejectModal from '../../../components/shared/RejectModal';

// Backend status values
type BackendStatus = 'review_rnd' | 'under_evaluation' | 'revision_rnd' | 'rejected_rnd' | 'endorsed_for_funding' | 'funded';
>>>>>>> Stashed changes

interface MappedProposal {
  id: number;
  title: string;
  submittedBy: string;
  submittedDate: string;
  status: BackendStatus;
  department: string;
  sector: string;
  raw: any; // full backend row for the view modal
}

const statusLabels: Record<BackendStatus, string> = {
<<<<<<< Updated upstream
  pending: "Pending Review",
  review_rnd: "Under R&D Evaluation",
  under_evaluation: "Under Evaluators Assessment",
  revision_rnd: "Revision Required",
  rejected_rnd: "Rejected",
  endorsed_for_funding: "Endorsed",
  funded: "Funded",
=======
  review_rnd: 'Pending Review',
  under_evaluation: 'Under Evaluation',
  revision_rnd: 'Revision Required',
  rejected_rnd: 'Rejected',
  endorsed_for_funding: 'Endorsed',
  funded: 'Funded',
>>>>>>> Stashed changes
};

interface AdminProposalPageProps {
  filter?: BackendStatus;
  onStatsUpdate?: () => void;
}

<<<<<<< Updated upstream
const getRandomColorClass = (text: string) => {
  const colors = [
    "bg-red-100 text-red-800 border-red-200",
    "bg-orange-100 text-orange-800 border-orange-200",
    "bg-amber-100 text-amber-800 border-amber-200",
    "bg-yellow-100 text-yellow-800 border-yellow-200",
    "bg-lime-100 text-lime-800 border-lime-200",
    "bg-green-100 text-green-800 border-green-200",
    "bg-emerald-100 text-emerald-800 border-emerald-200",
    "bg-teal-100 text-teal-800 border-teal-200",
    "bg-cyan-100 text-cyan-800 border-cyan-200",
    "bg-sky-100 text-sky-800 border-sky-200",
    "bg-blue-100 text-blue-800 border-blue-200",
    "bg-indigo-100 text-indigo-800 border-indigo-200",
    "bg-violet-100 text-violet-800 border-violet-200",
    "bg-purple-100 text-purple-800 border-purple-200",
    "bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200",
    "bg-pink-100 text-pink-800 border-pink-200",
    "bg-rose-100 text-rose-800 border-rose-200",
  ];

  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
};

=======
>>>>>>> Stashed changes
const AdminProposalPage: React.FC<AdminProposalPageProps> = ({ filter, onStatsUpdate }) => {
  const [proposals, setProposals] = useState<MappedProposal[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
<<<<<<< Updated upstream
  const [statusFilter, setStatusFilter] = useState<BackendStatus | "all">(filter || "all");
  const [searchTerm, setSearchTerm] = useState("");
=======
  const [statusFilter, setStatusFilter] = useState<BackendStatus | 'all'>(filter || 'all');
  const [searchTerm, setSearchTerm] = useState('');
>>>>>>> Stashed changes

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // View modal
  const [viewProposal, setViewProposal] = useState<any>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);

  // Action modals
  const [actionProposalId, setActionProposalId] = useState<number>(0);
  const [isSendToRndOpen, setIsSendToRndOpen] = useState(false);
  const [isForwardEvalOpen, setIsForwardEvalOpen] = useState(false);
  const [isRevisionOpen, setIsRevisionOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);

  const loadProposals = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getProposals();
      const mapped: MappedProposal[] = (data || []).map((p: any) => {
<<<<<<< Updated upstream
        const proponent =
          p.proponent_id && typeof p.proponent_id === "object"
            ? `${p.proponent_id.first_name || ""} ${p.proponent_id.last_name || ""}`.trim()
            : "Unknown";
        return {
          id: p.id,
          title: p.project_title || "Untitled",
          submittedBy: proponent,
          submittedDate: p.created_at,
          status: p.status as BackendStatus,
          department: p.rnd_station?.name || "N/A",
          sector: p.sector?.name || "N/A",
=======
        const proponent = p.proponent_id && typeof p.proponent_id === 'object'
          ? `${p.proponent_id.first_name || ''} ${p.proponent_id.last_name || ''}`.trim()
          : 'Unknown';
        return {
          id: p.id,
          title: p.project_title || 'Untitled',
          submittedBy: proponent,
          submittedDate: p.created_at,
          status: p.status as BackendStatus,
          department: p.rnd_station?.name || 'N/A',
          sector: p.sector?.name || 'N/A',
>>>>>>> Stashed changes
          raw: p,
        };
      });
      setProposals(mapped);
    } catch (error) {
      console.error("Error loading proposals:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProposals();
  }, [loadProposals]);

  // Filtered list
  const filteredProposals = React.useMemo(() => {
    let list = proposals;
<<<<<<< Updated upstream
    if (statusFilter !== "all") {
      list = list.filter((p) => p.status === statusFilter);
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      list = list.filter((p) => p.title.toLowerCase().includes(term) || p.submittedBy.toLowerCase().includes(term));
    }
=======
    if (statusFilter !== 'all') {
      list = list.filter((p) => p.status === statusFilter);
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(term) ||
          p.submittedBy.toLowerCase().includes(term),
      );
    }
>>>>>>> Stashed changes
    return list;
  }, [proposals, statusFilter, searchTerm]);

  // Reset page on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchTerm]);

  const totalPages = Math.ceil(filteredProposals.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProposals = filteredProposals.slice(startIndex, startIndex + itemsPerPage);

  const handleActionSuccess = () => {
    loadProposals();
    if (onStatsUpdate) onStatsUpdate();
  };

<<<<<<< Updated upstream
  const openAction = (id: number, action: "sendToRnd" | "forwardEval" | "revision" | "reject") => {
    setActionProposalId(id);
    if (action === "sendToRnd") setIsSendToRndOpen(true);
    else if (action === "forwardEval") setIsForwardEvalOpen(true);
    else if (action === "revision") setIsRevisionOpen(true);
    else if (action === "reject") setIsRejectOpen(true);
  };

  const getStatusBadge = (status: BackendStatus) => {
    const base = "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border";
    switch (status) {
      case "review_rnd":
        return (
          <span className={`${base} text-blue-600 bg-blue-50 border-blue-200`}>
            <Microscope className="w-3 h-3" />
            Under R&D Evaluation
          </span>
        );
      case "under_evaluation":
        return (
          <span className={`${base} text-purple-600 bg-purple-50 border-purple-200`}>
            <Users className="w-3 h-3" />
            Under Evaluators Assessment
          </span>
        );
      case "revision_rnd":
        return (
          <span className={`${base} text-orange-600 bg-orange-50 border-orange-200`}>
            <RefreshCw className="w-3 h-3" />
            Revision Required
          </span>
        );
      case "rejected_rnd":
        return (
          <span className={`${base} text-red-600 bg-red-50 border-red-200`}>
            <XCircle className="w-3 h-3" />
            Rejected
          </span>
        );
      case "endorsed_for_funding":
        return (
          <span className={`${base} text-blue-600 bg-blue-50 border-blue-200`}>
            <FileText className="w-3 h-3" />
            Endorsed
          </span>
        );
      case "funded":
        return (
          <span className={`${base} text-green-600 bg-green-50 border-green-200`}>
            <FileText className="w-3 h-3" />
            Funded
          </span>
        );
      case "pending":
        return (
          <span className={`${base} text-orange-600 bg-orange-50 border-orange-200`}>
            <Clock className="w-3 h-3" />
            Pending Review
          </span>
        );
      default:
        return (
          <span className={`${base} text-slate-600 bg-slate-50 border-slate-200`}>
            <FileText className="w-3 h-3" />
            {status}
          </span>
        );
    }
  };

  const getStatusCount = (status: BackendStatus | "all") => {
    if (status === "all") return proposals.length;
=======
  const openAction = (id: number, action: 'sendToRnd' | 'forwardEval' | 'revision' | 'reject') => {
    setActionProposalId(id);
    if (action === 'sendToRnd') setIsSendToRndOpen(true);
    else if (action === 'forwardEval') setIsForwardEvalOpen(true);
    else if (action === 'revision') setIsRevisionOpen(true);
    else if (action === 'reject') setIsRejectOpen(true);
  };

  const getStatusBadge = (status: BackendStatus) => {
    const base = 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border';
    switch (status) {
      case 'review_rnd':
        return <span className={`${base} text-amber-600 bg-amber-50 border-amber-200`}><Clock className="w-3 h-3" />Pending Review</span>;
      case 'under_evaluation':
        return <span className={`${base} text-emerald-600 bg-emerald-50 border-emerald-200`}><Users className="w-3 h-3" />Under Evaluation</span>;
      case 'revision_rnd':
        return <span className={`${base} text-orange-600 bg-orange-50 border-orange-200`}><RefreshCw className="w-3 h-3" />Revision Required</span>;
      case 'rejected_rnd':
        return <span className={`${base} text-red-600 bg-red-50 border-red-200`}><XCircle className="w-3 h-3" />Rejected</span>;
      case 'endorsed_for_funding':
        return <span className={`${base} text-blue-600 bg-blue-50 border-blue-200`}><FileText className="w-3 h-3" />Endorsed</span>;
      case 'funded':
        return <span className={`${base} text-green-600 bg-green-50 border-green-200`}><FileText className="w-3 h-3" />Funded</span>;
      default:
        return <span className={`${base} text-slate-600 bg-slate-50 border-slate-200`}><FileText className="w-3 h-3" />{status}</span>;
    }
  };

  const getStatusCount = (status: BackendStatus | 'all') => {
    if (status === 'all') return proposals.length;
>>>>>>> Stashed changes
    return proposals.filter((p) => p.status === status).length;
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
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#C8102E] leading-tight">
<<<<<<< Updated upstream
              {filter ? `${statusLabels[filter]} Proposals` : "Research Proposal Review"}
=======
              {filter ? `${statusLabels[filter]} Proposals` : 'Research Proposal Review'}
>>>>>>> Stashed changes
            </h1>
            <p className="text-slate-600 mt-2 text-sm leading-relaxed">
              Review and manage all research proposals submitted to WMSU
            </p>
          </div>
        </header>

        {/* Filters */}
        <section className="flex-shrink-0">
          <div className="bg-white shadow-xl rounded-2xl border border-slate-200 p-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <div className="relative flex-1 max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-slate-400" />
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
                  <Filter className="h-4 w-4 text-slate-400" />
                </div>
                <select
                  value={statusFilter}
<<<<<<< Updated upstream
                  onChange={(e) => setStatusFilter(e.target.value as BackendStatus | "all")}
                  className="appearance-none bg-white pl-10 pr-8 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E] transition-colors cursor-pointer"
                >
                  <option value="all">All Statuses ({getStatusCount("all")})</option>
                  <option value="review_rnd">Pending Review ({getStatusCount("review_rnd")})</option>
                  <option value="under_evaluation">Under Evaluation ({getStatusCount("under_evaluation")})</option>
                  <option value="revision_rnd">Revision Required ({getStatusCount("revision_rnd")})</option>
                  <option value="rejected_rnd">Rejected ({getStatusCount("rejected_rnd")})</option>
                  <option value="endorsed_for_funding">Endorsed ({getStatusCount("endorsed_for_funding")})</option>
                  <option value="funded">Funded ({getStatusCount("funded")})</option>
=======
                  onChange={(e) => setStatusFilter(e.target.value as BackendStatus | 'all')}
                  className="appearance-none bg-white pl-10 pr-8 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E] transition-colors cursor-pointer"
                >
                  <option value="all">All Statuses ({getStatusCount('all')})</option>
                  <option value="review_rnd">Pending Review ({getStatusCount('review_rnd')})</option>
                  <option value="under_evaluation">Under Evaluation ({getStatusCount('under_evaluation')})</option>
                  <option value="revision_rnd">Revision Required ({getStatusCount('revision_rnd')})</option>
                  <option value="rejected_rnd">Rejected ({getStatusCount('rejected_rnd')})</option>
                  <option value="endorsed_for_funding">Endorsed ({getStatusCount('endorsed_for_funding')})</option>
                  <option value="funded">Funded ({getStatusCount('funded')})</option>
>>>>>>> Stashed changes
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* Proposals List */}
        <main className="bg-white shadow-xl rounded-2xl border border-slate-200 overflow-hidden flex-1 flex flex-col">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex-shrink-0">
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
<<<<<<< Updated upstream
              paginatedProposals.map((proposal) => (
                <article
                  key={proposal.id}
                  className="p-4 hover:bg-slate-50 transition-colors duration-200 border-b border-slate-100"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1">
                      <span className="text-base font-semibold text-slate-800 mb-2 block group-hover:text-[#C8102E] transition-colors">
                        {proposal.title}
                      </span>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>{proposal.submittedBy}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{new Date(proposal.submittedDate).toLocaleDateString()}</span>
=======
              <table className="min-w-full text-left align-middle">
                <tbody className="divide-y divide-slate-100 bg-white">
                  {paginatedProposals.map((proposal) => (
                    <tr key={proposal.id} className="hover:bg-slate-50 transition-colors duration-200 group">
                      {/* Details */}
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
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              <span>
                                {new Date(proposal.submittedDate).toLocaleDateString()}
                              </span>
                            </div>
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border bg-slate-100 text-slate-700 border-slate-200">
                              <Tag className="w-3 h-3" />
                              {proposal.department}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2 flex-wrap">
                          {getStatusBadge(proposal.status)}

                          {/* Send to RND - only for review_rnd status */}
                          {proposal.status === 'review_rnd' && (
                            <button
                              onClick={() => openAction(proposal.id, 'sendToRnd')}
                              className="inline-flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs font-medium shadow-sm bg-blue-600 text-white hover:bg-blue-700 transition-colors cursor-pointer"
                              title="Assign to R&D Staff"
                            >
                              <Send className="w-3 h-3" />
                              Send to RND
                            </button>
                          )}

                          {/* Forward to Evaluators - for review_rnd */}
                          {proposal.status === 'review_rnd' && (
                            <button
                              onClick={() => openAction(proposal.id, 'forwardEval')}
                              className="inline-flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs font-medium shadow-sm bg-emerald-600 text-white hover:bg-emerald-700 transition-colors cursor-pointer"
                              title="Forward to Evaluators"
                            >
                              <Users className="w-3 h-3" />
                              Evaluators
                            </button>
                          )}

                          {/* Request Revision - for review_rnd or under_evaluation */}
                          {(proposal.status === 'review_rnd' || proposal.status === 'under_evaluation') && (
                            <button
                              onClick={() => openAction(proposal.id, 'revision')}
                              className="inline-flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs font-medium shadow-sm bg-orange-100 text-orange-700 border border-orange-200 hover:bg-orange-200 transition-colors cursor-pointer"
                              title="Request Revision"
                            >
                              <RefreshCw className="w-3 h-3" />
                              Revise
                            </button>
                          )}

                          {/* Reject - for review_rnd */}
                          {proposal.status === 'review_rnd' && (
                            <button
                              onClick={() => openAction(proposal.id, 'reject')}
                              className="inline-flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs font-medium shadow-sm bg-red-100 text-red-700 border border-red-200 hover:bg-red-200 transition-colors cursor-pointer"
                              title="Reject Proposal"
                            >
                              <XCircle className="w-3 h-3" />
                              Reject
                            </button>
                          )}

                          {/* View */}
                          <button
                            onClick={() => { setViewProposal(proposal.raw); setIsViewOpen(true); }}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all cursor-pointer"
                            title="View details"
                          >
                            <Eye className="w-3 h-3" />
                          </button>
>>>>>>> Stashed changes
                        </div>
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${getRandomColorClass(proposal.department)}`}
                        >
                          <Tag className="w-3 h-3" />
                          {proposal.department}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                      {getStatusBadge(proposal.status)}

                      <div className="flex items-center gap-2 flex-wrap">
                        {/* View */}
                        <button
                          onClick={() => {
                            setViewProposal(transformProposalForModal(proposal.raw));
                            setIsViewOpen(true);
                          }}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all cursor-pointer"
                          title="View details"
                        >
                          <Eye className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>

          {/* Pagination */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex-shrink-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-xs text-slate-600">
              <span>
                Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredProposals.length)} of{" "}
                {filteredProposals.length} proposals
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
                  Page {currentPage} of {totalPages || 1}
                </span>
<<<<<<< Updated upstream
                <button
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  Next
                  <ChevronRight className="w-3 h-3" />
                </button>
=======
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
                    Page {currentPage} of {totalPages || 1}
                  </span>
                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages || totalPages === 0}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    Next
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
>>>>>>> Stashed changes
              </div>
            </div>
          </div>
        </main>
<<<<<<< Updated upstream
      </div>{" "}
      {/* View Modal */}
      <DetailedProposalModal
        proposal={viewProposal}
        isOpen={isViewOpen}
        onClose={() => {
          setIsViewOpen(false);
          setViewProposal(null);
        }}
        onAction={(action: any, id: any) => {
          // Close view modal before opening action modal if desired, or keep both?
          // Usually better to act directly. The user might want to act from the view.
          // setIsViewOpen(false); // Kept open as per user request
          openAction(Number(id), action);
        }}
      />
      {/* Action Modals */}
      <SendToRndModal
        isOpen={isSendToRndOpen}
        onClose={() => setIsSendToRndOpen(false)}
        proposalId={actionProposalId}
        onSuccess={handleActionSuccess}
      />
      <ForwardToEvaluatorsModal
        isOpen={isForwardEvalOpen}
        onClose={() => setIsForwardEvalOpen(false)}
        proposalId={actionProposalId}
        onSuccess={handleActionSuccess}
      />
      <RevisionModal
        isOpen={isRevisionOpen}
        onClose={() => setIsRevisionOpen(false)}
        proposalId={actionProposalId}
        onSuccess={handleActionSuccess}
      />
      <RejectModal
        isOpen={isRejectOpen}
        onClose={() => setIsRejectOpen(false)}
        proposalId={actionProposalId}
        onSuccess={handleActionSuccess}
      />
=======

        {/* View Modal */}
        <DetailedProposalModal
          proposal={viewProposal}
          isOpen={isViewOpen}
          onClose={() => { setIsViewOpen(false); setViewProposal(null); }}
        />

        {/* Action Modals */}
        <SendToRndModal
          isOpen={isSendToRndOpen}
          onClose={() => setIsSendToRndOpen(false)}
          proposalId={actionProposalId}
          onSuccess={handleActionSuccess}
        />

        <ForwardToEvaluatorsModal
          isOpen={isForwardEvalOpen}
          onClose={() => setIsForwardEvalOpen(false)}
          proposalId={actionProposalId}
          onSuccess={handleActionSuccess}
        />

        <RevisionModal
          isOpen={isRevisionOpen}
          onClose={() => setIsRevisionOpen(false)}
          proposalId={actionProposalId}
          onSuccess={handleActionSuccess}
        />

        <RejectModal
          isOpen={isRejectOpen}
          onClose={() => setIsRejectOpen(false)}
          proposalId={actionProposalId}
          onSuccess={handleActionSuccess}
        />
      </div>
>>>>>>> Stashed changes
    </div>
  );
};

export default AdminProposalPage;
