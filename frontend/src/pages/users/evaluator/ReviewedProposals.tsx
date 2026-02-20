import { useState, useEffect, useCallback } from "react";
import { getEvaluatorProposals, getEvaluationScoresFromProposal } from "../../../services/proposal.api";
import {
  FileText,
  Eye,
  Search,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  User,
  Tag,
  Filter,
} from "lucide-react";
import ProposalDetailsModal from "../../../components/evaluator-component/ProposalDetailsModal";

export default function ReviewedProposals() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [selectedProposal, setSelectedProposal] = useState<number | null>(null);

  const [proposals, setProposals] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Helper to format currency
  const formatCurrency = (val: number | string) => {
    const num = typeof val === "string" ? parseFloat(val) : val;
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(num || 0);
  };

  const fetchProposals = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch all proposals for this evaluator
      const [data, scores] = await Promise.all([
        getEvaluatorProposals(),
        getEvaluationScoresFromProposal()
      ]);

      const completedStatuses = ['approve', 'revise', 'reject', 'decline'];
      const filtered = data.filter((item: any) => completedStatuses.includes(item.status));

      const scoresMap = new Map(scores.map((s: any) => [s.proposal_id, s]));

      const mapped = filtered.map((item: any) => {
        const p = item.proposal_id || {};
        const evaluationScore = scoresMap.get(p.id);
        const proponent = p.proponent_id || {};
        const agencyAddress = p.agency_address ? [p.agency_address.street, p.agency_address.barangay, p.agency_address.city].filter(Boolean).join(", ") : "N/A";

        // Map budget
        const budgetSourcesMap: Record<string, {
          ps: number; mooe: number; co: number;
          breakdown: { ps: { item: string; amount: number }[], mooe: { item: string; amount: number }[], co: { item: string; amount: number }[] }
        }> = {};

        (p.estimated_budget || []).forEach((b: any) => {
          const src = b.source || 'Unknown';
          if (!budgetSourcesMap[src]) {
            budgetSourcesMap[src] = { ps: 0, mooe: 0, co: 0, breakdown: { ps: [], mooe: [], co: [] } };
          }

          const amount = Number(b.amount) || 0;
          const itemLabel = b.object || b.item || 'Unspecified Item';
          const rawType = (b.budget || '').toLowerCase();

          let cat: 'ps' | 'mooe' | 'co' = 'mooe';
          if (rawType.includes('ps') || rawType.includes('personal')) cat = 'ps';
          else if (rawType.includes('co') || rawType.includes('capital')) cat = 'co';
          else if (rawType.includes('mooe')) cat = 'mooe';

          budgetSourcesMap[src][cat] += amount;
          budgetSourcesMap[src].breakdown[cat].push({ item: itemLabel, amount });
        });

        const budgetSources = Object.entries(budgetSourcesMap).map(([source, amounts]) => ({
          source,
          ps: formatCurrency(amounts.ps),
          mooe: formatCurrency(amounts.mooe),
          co: formatCurrency(amounts.co),
          total: formatCurrency(amounts.ps + amounts.mooe + amounts.co),
          breakdown: amounts.breakdown,
        }));

        const totalBudgetVal = (p.estimated_budget || []).reduce((acc: number, curr: any) => acc + (curr.amount || 0), 0);

        return {
          id: p.id,
          title: p.project_title || "Untitled",
          reviewedDate: evaluationScore?.created_at ? new Date(evaluationScore.created_at).toLocaleDateString() : (item.updated_at ? new Date(item.updated_at).toLocaleDateString() : "N/A"),
          proponent: `${proponent.first_name || ""} ${proponent.last_name || ""}`.trim() || "Unknown",
          projectType: p.sector?.name || "N/A",
          agency: p.agency?.name || "N/A",
          address: agencyAddress,
          implementationSites: (p.implementation_site || []).map((s: any) => ({ site: s.site_name, city: s.city })),
          telephone: p.phone || "N/A",
          email: p.email || "N/A",
          cooperatingAgencies: (p.cooperating_agencies || []).map((ca: any) => ca.agencies?.name).join(", "),
          rdStation: p.rnd_station?.name || "N/A",
          classification: p.classification_type === 'research_class' ? 'Research' : 'Development',
          classificationDetails: p.class_input || p.research_class || p.development_class || "N/A",
          modeOfImplementation: p.implementation_mode === 'multi_agency' ? 'Multi Agency' : 'Single Agency',
          priorityAreas: (p.proposal_priorities || []).map((pp: any) => pp.priorities?.name).join(", "),
          sector: p.sector?.name || "N/A",
          discipline: p.discipline?.name || "N/A",
          duration: p.duration ? `${p.duration} months` : "N/A",
          schoolYear: p.school_year || "N/A",
          startDate: p.plan_start_date || "N/A",
          endDate: p.plan_end_date || "N/A",
          budgetSources,
          budgetTotal: formatCurrency(totalBudgetVal),
          projectFile: p.proposal_version?.[0]?.file_url || null,
          ratings: evaluationScore ? {
            objectives: evaluationScore.objective,
            methodology: evaluationScore.methodology,
            budget: evaluationScore.budget,
            timeline: evaluationScore.timeline
          } : {},
          decision: item.status.charAt(0).toUpperCase() + item.status.slice(1),
          comment: evaluationScore?.comment || item.comments_for_evaluators || "No comment",
          evaluatorId: item.id,
          proponentInfoVisibility: p.proponent_info_visibility,
        };
      });

      // Deduplicate mapped proposals using string ID
      const uniqueProposalsMap = new Map();
      mapped.forEach((p: any) => {
        const key = String(p.id);
        if (!uniqueProposalsMap.has(key)) {
          uniqueProposalsMap.set(key, p);
        }
      });

      const uniqueProposals = Array.from(uniqueProposalsMap.values());

      setProposals(uniqueProposals);

    } catch (err) {
      console.error("Failed to fetch proposals", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProposals();
  }, [fetchProposals]);

  const reviewedProposals = proposals;

  const filtered = reviewedProposals.filter((p) => {
    const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === "All" || p.projectType === typeFilter;
    return matchesSearch && matchesType;
  });

  const sortedFiltered = [...filtered].sort((a, b) => {
    const dateA = new Date(a.reviewedDate).getTime();
    const dateB = new Date(b.reviewedDate).getTime();
    return dateB - dateA;
  });

  const totalPages = Math.ceil(sortedFiltered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProposals = sortedFiltered.slice(
    startIndex,
    startIndex + itemsPerPage
  );

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
      case "Environment":
        return "bg-teal-100 text-teal-700 border-teal-200";
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

  const proposal = reviewedProposals.find((p) => p.id === selectedProposal);

  return (
    <div className="flex flex-col gap-6 p-6 h-full overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#C8102E] leading-tight">
              Reviewed Proposals
            </h1>
            <p className="text-slate-600 mt-2 text-sm leading-relaxed">
              View proposals that have been reviewed and forwarded for final
              decision.
            </p>
          </div>
        </div>
      </header>

      {/* Filter Section */}
      <section className="flex-shrink-0" aria-label="Filter reviewed proposals">
        <div className="bg-white shadow-xl rounded-2xl border border-slate-200 p-4">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <div className="relative flex-1 max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" aria-hidden="true" />
              </div>
              <input
                type="text"
                placeholder="Search proposals..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-[#C8102E] transition-colors"
                aria-label="Search reviewed proposals"
              />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter className="h-4 w-4 text-slate-400" aria-hidden="true" />
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
            Showing {sortedFiltered.length} of {reviewedProposals.length}{" "}
            reviewed proposals
          </div>
        </div>
      </section>

      {/* Main Content Table */}
      <main className="bg-white shadow-xl rounded-2xl border border-slate-200 overflow-hidden flex-1 flex flex-col">
        <div className="p-4 border-b border-slate-200 bg-slate-50">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#C8102E]" />
              Reviewed Proposals
            </h3>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <CheckCircle className="w-4 h-4" />
              <span>{reviewedProposals.length} total reviewed</span>
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
                >
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h2 className="text-base font-semibold text-slate-800 mb-2 line-clamp-2 group-hover:text-[#C8102E] transition-colors duration-200">
                          {proposal.title}
                        </h2>

                        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                          <div className="flex items-center gap-1.5">
                            <User className="w-3 h-3" />
                            <span>{proposal.proponent}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-emerald-600 font-semibold">
                            <CheckCircle className="w-3 h-3" />
                            <span>Reviewed: {proposal.reviewedDate}</span>
                          </div>
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${getProjectTypeColor(
                              proposal.projectType
                            )}`}
                          >
                            <Tag className="w-3 h-3" />
                            {proposal.projectType}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleViewClick(proposal.id)}
                          className="inline-flex items-center justify-center gap-1 px-4 h-8 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 hover:scale-105 transition-all text-xs font-medium cursor-pointer"
                        >
                          <Eye className="w-3 h-3" />
                          View
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
              <h3 className="text-lg font-medium text-slate-900 mb-2">
                No proposals found
              </h3>
              <p className="text-slate-500 max-w-sm mx-auto">
                {search
                  ? "Try adjusting your search criteria."
                  : "No proposals have been reviewed yet."}
              </p>
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex-shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-xs text-slate-600">
            <span>
              Showing {startIndex + 1}-
              {Math.min(startIndex + itemsPerPage, sortedFiltered.length)} of{" "}
              {sortedFiltered.length} proposals
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-300 rounded-lg disabled:opacity-50 cursor-pointer"
              >
                <ChevronLeft className="w-3 h-3" />
                Previous
              </button>
              <span>
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-300 rounded-lg disabled:opacity-50 cursor-pointer"
              >
                Next
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Render the updated modal */}
      {proposal && (
        <ProposalDetailsModal
          proposal={proposal as any}
          isOpen={!!selectedProposal}
          onClose={closeModal}
        />
      )}
    </div>
  );
}