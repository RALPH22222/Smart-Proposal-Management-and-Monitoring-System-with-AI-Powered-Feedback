import { useState, useEffect, useCallback } from "react";
import { getEvaluatorProposals, getEvaluationScoresFromProposal } from "../../../services/proposal.api";
import { formatDate } from "../../../utils/date-formatter";
import {
  FileText,
  Eye,
  Search,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  User,
  FileCheck,
  Tag,
} from "lucide-react";
import ProposalDetailsModal from "../../../components/evaluator-component/ProposalDetailsModal";
import PageLoader from "../../../components/shared/PageLoader";

export default function ReviewedProposals() {
  const [search, setSearch] = useState("");
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

      // Scores are now version-scoped — match by (proposal_id, proposal_version_id)
      // so v1 scores don't attach to a v2 review entry of the same proposal.
      const scoreKey = (proposalId: any, versionId: any) => `${proposalId}::${versionId ?? 'null'}`;
      const scoresMap = new Map(
        scores.map((s: any) => [scoreKey(s.proposal_id, s.proposal_version_id), s]),
      );

      // Per-proposal version numbering: oldest proposal_version row = v1.
      // This runs against each proposal's own proposal_version list and lets us
      // render "Project Foo (v1)", "(v2)", etc. for repeat reviews of the same title.
      const versionRankByProposal = new Map<any, Map<any, number>>();
      filtered.forEach((item: any) => {
        const p = item.proposal_id || {};
        if (versionRankByProposal.has(p.id)) return;
        const versions = (p.proposal_version || [])
          .slice()
          .sort((a: any, b: any) => {
            const at = new Date(a.created_at || 0).getTime();
            const bt = new Date(b.created_at || 0).getTime();
            if (at !== bt) return at - bt;
            return (a.id || 0) - (b.id || 0);
          });
        const rankMap = new Map<any, number>();
        versions.forEach((v: any, idx: number) => rankMap.set(v.id, idx + 1));
        versionRankByProposal.set(p.id, rankMap);
      });

      const mapped = filtered.map((item: any) => {
        const p = item.proposal_id || {};
        const evaluationScore = scoresMap.get(scoreKey(p.id, item.proposal_version_id));
        const versionNumber = versionRankByProposal.get(p.id)?.get(item.proposal_version_id) ?? 1;
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
          proposalVersionId: item.proposal_version_id,
          versionNumber,
          title: p.project_title || "Untitled",
          reviewedDate: evaluationScore?.created_at ? formatDate(evaluationScore.created_at) : (item.updated_at ? formatDate(item.updated_at) : "N/A"),
          proponent: `${proponent.first_name || ""} ${proponent.last_name || ""}`.trim() || "Unknown",
          tags: (p.proposal_tags || []).map((t: any) => t.tags?.name || t.tag?.name).filter(Boolean),
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
          year: p.year || "N/A",
          startDate: p.plan_start_date || "N/A",
          endDate: p.plan_end_date || "N/A",
          budgetSources,
          budgetTotal: formatCurrency(totalBudgetVal),
          projectFile: p.proposal_version?.[0]?.file_url || null,
          ratings: evaluationScore ? {
            title: evaluationScore.title,
            budget: evaluationScore.budget,
            timeline: evaluationScore.timeline
          } : {},
          decision: item.status.charAt(0).toUpperCase() + item.status.slice(1),
          comment: evaluationScore?.comment || item.comments_for_evaluators || "No comment",
          evaluatorId: item.id,
          proponentInfoVisibility: p.proponent_info_visibility,
        };
      });

      // Dedupe by (proposal.id, proposal_version_id). Earlier code keyed by
      // proposal.id alone, which would hide an older version when the same
      // evaluator reviewed both v1 and v2 of the same title. With version
      // scoping, each version is a legitimate separate completed review.
      const uniqueProposalsMap = new Map();
      mapped.forEach((p: any) => {
        const key = `${p.id}::${p.proposalVersionId ?? 'null'}`;
        if (!uniqueProposalsMap.has(key)) {
          uniqueProposalsMap.set(key, p);
        }
      });

      const uniqueProposals = Array.from(uniqueProposalsMap.values())
        .sort((a: any, b: any) => (a.versionNumber || 0) - (b.versionNumber || 0))
        .sort((a: any, b: any) => String(a.title).localeCompare(String(b.title)));

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
    return matchesSearch;
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
      "bg-pink-50 text-pink-700 border-pink-200",
      "bg-orange-50 text-orange-700 border-orange-200",
      "bg-emerald-50 text-emerald-700 border-emerald-200",
      "bg-cyan-50 text-cyan-700 border-cyan-200",
      "bg-teal-50 text-teal-700 border-teal-200",
    ];
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  const handleViewClick = (proposalId: number) => {
    setSelectedProposal(proposalId);
  };

  const closeModal = () => {
    setSelectedProposal(null);
  };

  const proposal = reviewedProposals.find((p) => p.id === selectedProposal);

  if (loading) return <PageLoader mode="table" />;

  return (
    <>
    <div className="flex flex-col gap-4 lg:gap-6 h-full min-h-screen overflow-hidden animate-fade-in px-5 sm:px-8 lg:px-10 xl:px-12 2xl:px-16 py-8 lg:py-10 bg-gradient-to-br from-slate-50 to-slate-100">
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
              <FileCheck className="w-5 h-5 text-[#C8102E]" />
              Completed Reviews Proposal
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
                  key={`${proposal.id}-${proposal.proposalVersionId ?? 'null'}`}
                  className="p-4 hover:bg-slate-50 transition-colors duration-200 group"
                >
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h2 className="text-base font-semibold text-slate-800 mb-2 line-clamp-2 group-hover:text-[#C8102E] transition-colors duration-200 flex items-center gap-2 flex-wrap">
                          <span>{proposal.title}</span>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border border-slate-200 bg-slate-50 text-slate-600">
                            v{proposal.versionNumber}
                          </span>
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
                          {proposal.tags && proposal.tags.length > 0 && proposal.tags.map((tag: string, i: number) => (
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
    </div>

      {/* Render the updated modal */}
      {proposal && (
        <ProposalDetailsModal
          proposal={proposal as any}
          isOpen={!!selectedProposal}
          onClose={closeModal}
        />
      )}
    </>
  );
}