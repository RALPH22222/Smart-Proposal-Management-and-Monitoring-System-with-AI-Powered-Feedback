import { useState, useEffect, useCallback } from "react";
import {
  FileText,
  Eye,
  User,
  Calendar,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  Clock,
  Tag,
  Gavel,
  CalendarClock,
  Users,
} from "lucide-react";
import { decisionEvaluatorToProposal, getEvaluatorProposals } from "../../../services/proposal.api";
import Swal from "sweetalert2";
import ProposalModal from "../../../components/evaluator-component/ProposalViewModal";
import DecisionModal from "../../../components/evaluator-component/DecisionModal";

export default function Proposals() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProposal, setSelectedProposal] = useState<number | null>(null);

  const [decisionModalOpen, setDecisionModalOpen] = useState(false);
  const [proposalToEvaluate, setProposalToEvaluate] = useState<number | null>(null);

  const itemsPerPage = 5;

  const [proposals, setProposals] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchProposals = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getEvaluatorProposals();
      console.log("Evaluator Proposals Raw Data:", data);

      const mapped = (data || []).map((p: any) => {
        // Handle different potential structures effectively
        const proposalObj = p.proposal_id || p;

        // Robust proponent name extraction
        let proponentName = 'Unknown';
        if (proposalObj.proponent_id) {
          if (typeof proposalObj.proponent_id === "object") {
            proponentName = `${proposalObj.proponent_id.first_name || ""} ${proposalObj.proponent_id.last_name || ""}`;
          } else if (typeof proposalObj.proponent_id === "string") {
            proponentName = proposalObj.proponent_id;
          }
        }

        // Handle status normalization
        let displayStatus = p.status || proposalObj.status || "pending";
        // Fix: Backend might return 'extend' or keep it 'pending' with a request date
        if (displayStatus === 'extend') {
          displayStatus = 'extension_requested';
        }
        // If status is pending but we have a request_deadline_at, it's an extension request
        if (displayStatus === 'pending' && p.request_deadline_at) {
          displayStatus = 'extension_requested';
        }

        // Format currency helper
        const formatCurrency = (val: number | string) => {
          const num = typeof val === "string" ? parseFloat(val) : val;
          return new Intl.NumberFormat("en-PH", {
            style: "currency",
            currency: "PHP",
          }).format(num || 0);
        };

        // Map budget
        const budgetSourcesMap: Record<string, { ps: number; mooe: number; co: number }> = {};
        (proposalObj.estimated_budget || []).forEach((b: any) => {
          if (!budgetSourcesMap[b.source]) {
            budgetSourcesMap[b.source] = { ps: 0, mooe: 0, co: 0 };
          }
          if (b.budget === "ps") budgetSourcesMap[b.source].ps += b.amount;
          if (b.budget === "mooe") budgetSourcesMap[b.source].mooe += b.amount;
          if (b.budget === "co") budgetSourcesMap[b.source].co += b.amount;
        });

        const budgetSources = Object.entries(budgetSourcesMap).map(([source, amounts]) => ({
          source,
          ps: formatCurrency(amounts.ps),
          mooe: formatCurrency(amounts.mooe),
          co: formatCurrency(amounts.co),
          total: formatCurrency(amounts.ps + amounts.mooe + amounts.co),
        }));

        const totalBudgetVal = (proposalObj.estimated_budget || []).reduce(
          (acc: number, curr: any) => acc + (curr.amount || 0),
          0,
        );

        // Address formatting
        const agencyAddress = proposalObj.agency_address
          ? [proposalObj.agency_address.street, proposalObj.agency_address.barangay, proposalObj.agency_address.city].filter(Boolean).join(", ")
          : "N/A";

        return {
          id: proposalObj.id,
          title: proposalObj.project_title || "Untitled",
          proponent: proponentName.trim(),
          gender: proposalObj.proponent_id?.sex || "N/A",
          status: displayStatus,
          deadline: p.deadline_at ? new Date(p.deadline_at).toLocaleDateString() : "N/A",
          projectType: proposalObj.sector?.name || "N/A",
          agency: proposalObj.agency?.name || "N/A",
          address: agencyAddress,
          telephone: proposalObj.phone || "N/A",
          email: proposalObj.email || "N/A",
          modeOfImplementation: proposalObj.implementation_mode === "multi_agency" ? "Multi Agency" : "Single Agency",
          implementationSites: (proposalObj.implementation_site || []).map((s: any) => ({ site: s.site_name, city: s.city })),
          priorityAreas: (proposalObj.proposal_priorities || []).map((pp: any) => pp.priorities?.name).join(", "),
          cooperatingAgencies: (proposalObj.cooperating_agencies || []).map((ca: any) => ca.agencies?.name).join(", "),
          rdStation: proposalObj.rnd_station?.name || "N/A",
          classification: proposalObj.classification_type === "research_class" ? "Research" : "Development",
          classificationDetails: proposalObj.research_class || proposalObj.development_class || "N/A",
          sector: proposalObj.sector?.name || "N/A",
          discipline: proposalObj.discipline?.name || "N/A",
          duration: proposalObj.duration ? `${proposalObj.duration} months` : "N/A",
          schoolYear: proposalObj.school_year || "N/A",
          startDate: proposalObj.plan_start_date || "N/A",
          endDate: proposalObj.plan_end_date || "N/A",
          budgetSources,
          budgetTotal: formatCurrency(totalBudgetVal),
          projectFile: proposalObj.proposal_version?.[0]?.file_url || null,
          extensionReason: p.remarks || null,
          proponentInfoVisibility: proposalObj.proponent_info_visibility,
          raw: p
        };
      });

      const uniqueProposalsMap = new Map();
      mapped.forEach((p: any) => {
        if (!uniqueProposalsMap.has(p.id)) {
          uniqueProposalsMap.set(p.id, p);
        }
      });

      const uniqueProposals = Array.from(uniqueProposalsMap.values()).sort((a: any, b: any) => {
        // Sort by raw created_at or updated_at if available
        const dateA = new Date(a.raw?.created_at || a.raw?.updated_at || 0).getTime();
        const dateB = new Date(b.raw?.created_at || b.raw?.updated_at || 0).getTime();
        return dateB - dateA; // Descending
      });

      console.log("Mapped Unique Proposals:", uniqueProposals);
      setProposals(uniqueProposals);
    } catch (error) {
      console.error("Failed to fetch proposals", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProposals();
  }, [fetchProposals]);

  const filtered = proposals.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(search.toLowerCase()) || p.proponent.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "All" || p.status === statusFilter;
    const matchesType = typeFilter === "All" || p.projectType === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const statusOrder: Record<string, number> = {
    pending: 0,
    extension_requested: 1,
    accepted: 2,
    rejected: 3,
    decline: 3, // Group Decline with Rejected
  };

  const sortedFiltered = [...filtered].sort((a, b) => {
    const orderA = statusOrder[a.status] ?? 4;
    const orderB = statusOrder[b.status] ?? 4;
    return orderA - orderB;
  });

  const totalPages = Math.ceil(sortedFiltered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProposals = sortedFiltered.slice(startIndex, startIndex + itemsPerPage);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "accepted":
      case "approve":
      case "extension_approved":
      case "for_review":
        return "text-green-600 bg-green-50 border-green-200";
      default:
        return "text-slate-600 bg-slate-50 border-slate-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "accepted":
      case "extension_approved":
        return <CheckCircle className="w-3 h-3" />;
      case "pending":
        return <Clock className="w-3 h-3" />;
      case "rejected":
      case "extension_rejected":
      case "decline": // Add Decline Icon (XCircle)
        return <XCircle className="w-3 h-3" />;
      case "extension_requested":
      case "extend":
        return <CalendarClock className="w-3 h-3" />;
      case "for_review":
        return <Users className="w-3 h-3" />;
      default:
        return null;
    }
  };

  const formatStatus = (status: string) => {
    if (status === "extension_requested" || status === "extend") return "Extension Requested";
    if (status === "extension_approved") return "Extension Approved";
    if (status === "extension_rejected") return "Extension Rejected";
    if (status === "for_review") return "Under Review";
    if (status === "accepted" || status === "approve") return "Reviewed";
    if (status === "decline") return "Declined"; // Format Decline to "Declined"
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const getProjectTypeColor = (type: string) => {
    switch (type) {
      case "ICT":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "Healthcare":
        return "bg-pink-100 text-pink-700 border-pink-200";
      case "Agriculture":
        return "bg-green-100 text-green-700 border-green-200";
      case "Energy":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "Public Safety":
        return "bg-purple-100 text-purple-700 border-purple-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const handleViewClick = (proposalId: number) => {
    setSelectedProposal(proposalId);
  };

  const closeModal = () => {
    setSelectedProposal(null);
  };

  const handleEvaluateClick = (proposalId: number) => {
    setProposalToEvaluate(proposalId);
    setDecisionModalOpen(true);
  };

  const closeDecisionModal = () => {
    setDecisionModalOpen(false);
    setProposalToEvaluate(null);
  };

  const handleSubmitDecision = async (
    status: "accepted" | "rejected" | "extension",
    remarks: string,
    newDeadline?: string,
  ) => {
    if (!proposalToEvaluate) return;

    // Map status to API expected values
    let apiStatus: "accept" | "decline" | "extend";
    switch (status) {
      case "accepted":
        apiStatus = "accept";
        break;
      case "rejected":
        apiStatus = "decline";
        break;
      case "extension":
        apiStatus = "extend";
        break;
      default:
        console.error("Invalid status");
        return;
    }

    // Format deadline if exists (Use YYYY-MM-DD to match backend expectations)
    const formattedDeadline = newDeadline ? new Date(newDeadline).toISOString().split("T")[0] : undefined;

    const payload = {
      proposal_id: proposalToEvaluate,
      status: apiStatus,
      remarks: remarks || undefined, // Send undefined if empty string
      deadline_at: formattedDeadline,
    };

    try {
      await decisionEvaluatorToProposal(payload);

      Swal.fire({
        icon: "success",
        title: "Success",
        text: "Evaluation submitted successfully.",
      });

      closeDecisionModal();
      fetchProposals();
    } catch (err: any) {
      console.error("Evaluation Submission Error:", err);
      // Log full validation error if available
      if (err.response?.data?.data) {
        console.error("Validation Details:", err.response.data.data);
      }

      Swal.fire({
        icon: "error",
        title: "Error",
        text: err?.response?.data?.message || "Failed to submit evaluation decision.",
      });
    }
  };

  const proposal = proposals.find((p) => p.id === selectedProposal);
  const evaluationProposal = proposals.find((p) => p.id === proposalToEvaluate);

  return (
    <div className="flex flex-col gap-6 p-6 h-full overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#C8102E] leading-tight">Evaluator Proposals</h1>
            <p className="text-slate-600 mt-2 text-sm leading-relaxed">
              Manage and review submitted research proposals. Track status and take actions.
            </p>
          </div>
        </div>
      </header>

      {/* Filter Section */}
      <section className="flex-shrink-0" aria-label="Filter proposals">
        <div className="bg-white shadow-xl rounded-2xl border border-slate-200 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
            <div className="relative flex-1 max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" aria-hidden="true" />
              </div>
              <input
                type="text"
                placeholder="Search proposals or proponents..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-[#C8102E] transition-colors"
                aria-label="Search proposals"
              />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter className="h-4 w-4 text-slate-400" aria-hidden="true" />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none bg-white pl-10 pr-8 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-[#C8102E] transition-colors"
                aria-label="Filter by status"
              >
                <option value="All">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="accepted">Accepted</option>
                <option value="approve">Reviewed</option>
                <option value="rejected">Rejected</option>
                <option value="extension_requested">Extension Requested</option>
              </select>
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Tag className="h-4 w-4 text-slate-400" aria-hidden="true" />
              </div>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="appearance-none bg-white pl-10 pr-8 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-[#C8102E] transition-colors"
                aria-label="Filter by project type"
              >
                <option value="All">All Types</option>
                <option value="ICT">ICT</option>
                <option value="Energy">Energy</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Agriculture">Agriculture</option>
                <option value="Public Safety">Public Safety</option>
                <option value="Environment">Environment</option>
              </select>
            </div>
          </div>

          <div className="mt-4 text-xs text-slate-600">
            Showing {sortedFiltered.length} of {proposals.length} proposals
          </div>
        </div>
      </section>

      {/* Main Content Table */}
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
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C8102E]"></div>
            </div>
          ) : paginatedProposals.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {paginatedProposals.map((proposal) => (
                <article
                  key={proposal.id}
                  className="p-4 hover:bg-slate-50 transition-colors duration-200 group"
                  aria-labelledby={`proposal-title-${proposal.id}`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h2
                        id={`proposal-title-${proposal.id}`}
                        className="text-base font-semibold text-slate-800 mb-2 line-clamp-2 group-hover:text-[#C8102E] transition-colors duration-200"
                      >
                        {proposal.title}
                      </h2>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3 h-3" aria-hidden="true" />
                          <span>{proposal.proponent}</span>
                        </div>
                        {proposal.status === "pending" && (
                          <div className="flex items-center gap-1.5 text-red-600 font-semibold">
                            <Calendar className="w-3 h-3" aria-hidden="true" />
                            <span>Deadline: {proposal.deadline}</span>
                          </div>
                        )}
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${getProjectTypeColor(
                            proposal.projectType,
                          )}`}
                        >
                          <Tag className="w-3 h-3" />
                          {proposal.projectType}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border border-current border-opacity-20 ${getStatusColor(
                          proposal.status,
                        )}`}
                      >
                        {getStatusIcon(proposal.status)}
                        {formatStatus(proposal.status)}
                      </span>

                      <div className="flex items-center gap-2">
                        {(proposal.status === "pending" || proposal.status === "extension_approved" || proposal.status === "extension_rejected") && (
                          <button
                            onClick={() => handleEvaluateClick(proposal.id)}
                            className="inline-flex items-center gap-1.5 px-3 h-8 rounded-lg bg-[#C8102E] text-white hover:bg-[#A00C24] hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:ring-offset-1 transition-all duration-200 cursor-pointer text-xs font-medium shadow-sm"
                            aria-label={`${proposal.title}`}
                            title="Action"
                          >
                            <Gavel className="w-3 h-3" />
                            Action
                          </button>
                        )}

                        <button
                          onClick={() => handleViewClick(proposal.id)}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-all duration-200 cursor-pointer"
                          aria-label={`View details for ${proposal.title}`}
                          title="View details"
                        >
                          <Eye className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 px-4">
              <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <FileText className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-2">No proposals found</h3>
              <p className="text-slate-500 max-w-sm mx-auto">
                {search || statusFilter !== "All"
                  ? "Try adjusting your search or filter criteria."
                  : "No proposals have been submitted yet."}
              </p>
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex-shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-xs text-slate-600">
            <span>
              Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filtered.length)} of {filtered.length}{" "}
              proposals
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
      </main>

      {/* Modals */}
      {selectedProposal && proposal && (
        <ProposalModal isOpen={!!selectedProposal} proposal={proposal} onClose={closeModal} />
      )}

      {decisionModalOpen && evaluationProposal && (
        <DecisionModal
          isOpen={decisionModalOpen}
          onClose={closeDecisionModal}
          proposalTitle={evaluationProposal.title}
          onSubmit={handleSubmitDecision}
        />
      )}
    </div>
  );
}
