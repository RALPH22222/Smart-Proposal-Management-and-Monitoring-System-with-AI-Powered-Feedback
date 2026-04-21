import { useState, useEffect, useCallback } from "react";
import { getEvaluatorProposals, submitEvaluation } from "../../../services/proposal.api";
import { formatDate } from "../../../utils/date-formatter";
import { getBudgetCategory } from "../../../utils/budget-category";
import { getAssignmentProposalFileUrl, shouldReplaceEvaluatorProposal } from "../../../utils/evaluator-proposal";
import { FileText, Search, ChevronLeft, ChevronRight, CheckCircle, User, Tag, FileClock, ScanSearch, CalendarDays} from "lucide-react";
import ReviewModal from "../../../components/evaluator-component/ReviewModal";
import PageLoader from "../../../components/shared/PageLoader";
import Swal from "sweetalert2";

export default function EndorsedProposals() {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [selectedProposal, setSelectedProposal] = useState<number | null>(null);
  const [yearFilter, setYearFilter] = useState("All");
  const [sortOrder, setSortOrder] = useState("recent-old");

  const [proposals, setProposals] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      const data = await getEvaluatorProposals(undefined, "for_review");

      const mapped = data.map((item: any) => {
        const p = item.proposal_id || {};
        const proponent = p.proponent_id || {};
        const agencyAddress = p.agency_address
          ? [p.agency_address.street, p.agency_address.barangay, p.agency_address.city].filter(Boolean).join(", ")
          : "N/A";

        // Map budget
        const budgetSourcesMap: Record<string, {
          ps: number; mooe: number; co: number;
          breakdown: { ps: any[], mooe: any[], co: any[] }
        }> = {};

        const parseAmount = (val: any) => {
          if (typeof val === "string") return parseFloat(val.replace(/,/g, "")) || 0;
          return Number(val) || 0;
        };

        const rawBudgets =
          (p.proposal_budget_versions?.length > 0 &&
            p.proposal_budget_versions[p.proposal_budget_versions.length - 1]?.proposal_budget_items) ||
          p.estimated_budget ||
          [];

        rawBudgets.forEach((b: any) => {
          const src = b.source || b.funding_agency || 'Unknown';
          if (!budgetSourcesMap[src]) {
            budgetSourcesMap[src] = { ps: 0, mooe: 0, co: 0, breakdown: { ps: [], mooe: [], co: [] } };
          }

          const amount = parseAmount(b.total_amount ?? b.totalAmount ?? b.amount);
          const itemLabel = b.object || b.item || b.itemName || b.item_description || b.item_name || 'Unspecified Item';
          const subcategory = b.subcategory || b.sub_category || (Array.isArray(b.budget_subcategories) ? b.budget_subcategories[0]?.label : b.budget_subcategories?.label) || b.custom_subcategory_label;
          const specifications = b.specifications || b.spec || b.spec_volume || b.volume;
          const quantity = b.quantity || b.qty || b.volume;
          const unit = b.unit;
          const unitPrice = parseAmount(b.unit_price ?? b.unitPrice);

          let cat: 'ps' | 'mooe' | 'co' = 'mooe';
          const normalizedCategory = getBudgetCategory(b);
          if (normalizedCategory) cat = normalizedCategory;

          budgetSourcesMap[src][cat] += amount;
          budgetSourcesMap[src].breakdown[cat].push({ item: itemLabel, amount, subcategory, specifications, quantity, unit, unitPrice });
        });

        const budgetSources = Object.entries(budgetSourcesMap).map(([source, amounts]) => ({
          source,
          ps: formatCurrency(amounts.ps),
          mooe: formatCurrency(amounts.mooe),
          co: formatCurrency(amounts.co),
          total: formatCurrency(amounts.ps + amounts.mooe + amounts.co),
          breakdown: amounts.breakdown,
        }));

        const totalBudgetVal = rawBudgets.reduce((acc: number, curr: any) => {
          return acc + parseAmount(curr.total_amount ?? curr.totalAmount ?? curr.amount);
        }, 0);

        return {
          id: p.id,
          proposalVersionId: item.proposal_version_id ?? null,
          title: p.project_title || "Untitled",
          reviewDeadline: item.deadline_at ? formatDate(item.deadline_at) : "N/A",
          proponent: `${proponent.first_name || ""} ${proponent.last_name || ""}`.trim() || "Unknown",
          tags: (p.proposal_tags || []).map((t: any) => t.tags?.name || t.tag?.name).filter(Boolean),
          agency: p.agency?.name || "N/A",
          address: agencyAddress,
          implementationSites: (p.implementation_site || []).map((s: any) => ({ site: s.site_name, city: s.city })),
          telephone: p.phone || "N/A",
          email: p.email || "N/A",
          cooperatingAgencies: (p.cooperating_agencies || [])
            .map((ca: any) => ca.agencies?.name ?? ca.agency_name_text ?? "")
            .filter((s: string) => s.length > 0)
            .join(", "),
          rdStation: p.rnd_station?.name || "N/A",
          classification: p.classification_type === "research_class" ? "Research" : "Development",
          classificationDetails: p.class_input || p.research_class || p.development_class || "N/A",
          modeOfImplementation: p.implementation_mode === "multi_agency" ? "Multi Agency" : "Single Agency",
          priorityAreas: (p.proposal_priorities || []).map((pp: any) => pp.priorities?.name).join(", "),
          sector: p.sector?.name || "N/A",
          discipline: p.discipline?.name || "N/A",
          duration: p.duration ? `${p.duration} months` : "N/A",
          year: p.year || (p.created_at ? new Date(p.created_at).getFullYear() : "N/A"),
          startDate: p.plan_start_date || "N/A",
          endDate: p.plan_end_date || "N/A",
          submittedDate: p.created_at || null,
          budgetSources,
          budgetTotal: formatCurrency(totalBudgetVal),
          projectFile: getAssignmentProposalFileUrl(p, item.proposal_version_id),
          evaluatorId: item.id,
          proponentInfoVisibility: item.proponent_info_visibility || p.proponent_info_visibility,
          raw: item,
        };
      });

      // Deduplicate mapped proposals using string ID
      const uniqueProposalsMap = new Map();
      mapped.forEach((p: any) => {
        const key = String(p.id);
        const existing = uniqueProposalsMap.get(key);
        if (!existing || shouldReplaceEvaluatorProposal(existing, p)) {
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

  const endorsedProposals = proposals;

  const filtered = endorsedProposals.filter((p) => {
    const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase());
    const proposalYear = p.submittedDate ? new Date(p.submittedDate).getFullYear().toString() : "N/A";
    const matchesYear = yearFilter === "All" || proposalYear === yearFilter;
    return matchesSearch && matchesYear;
  });

  const sortedFiltered = [...filtered].sort((a, b) => {
    if (sortOrder === "a-z") return a.title.localeCompare(b.title);
    if (sortOrder === "z-a") return b.title.localeCompare(a.title);

    const dateA = new Date(a.submittedDate || 0).getTime();
    const dateB = new Date(b.submittedDate || 0).getTime();

    if (sortOrder === "recent-old") return dateB - dateA;
    if (sortOrder === "old-recent") return dateA - dateB;

    return 0;
  });

  const totalPages = Math.ceil(sortedFiltered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProposals = sortedFiltered.slice(startIndex, startIndex + itemsPerPage);

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

  const handleReviewClick = (proposalId: number) => {
    setSelectedProposal(proposalId);
  };

  const closeModal = () => {
    setSelectedProposal(null);
  };

  const handleSubmitReview = async (data: { decision: string; ratings: any; comments: string }) => {
    if (!selectedProposal) return;

    setIsSubmitting(true);
    try {
      await submitEvaluation({
        proposal_id: selectedProposal,
        status: data.decision.toLowerCase(),
        title: data.ratings.title,
        budget: data.ratings.budget,
        timeline: data.ratings.timeline,
        comment: data.comments,
      });

      // Immediately remove from list so UI updates without waiting for refetch
      setProposals((prev) => prev.filter((p) => p.id !== selectedProposal));
      closeModal();

      await Swal.fire({
        icon: 'success',
        title: 'Evaluation Submitted',
        text: 'Your review has been successfully submitted and forwarded for further review.',
        confirmButtonColor: '#C8102E'
      });

      // Sync with server in background
      fetchProposals();
    } catch (error) {
      console.error("Failed to submit review:", error);
      Swal.fire({
        icon: 'error',
        title: 'Submission Failed',
        text: 'Failed to submit review. Please try again.',
        confirmButtonColor: '#C8102E'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const proposal = endorsedProposals.find((p) => p.id === selectedProposal);

  if (loading) return <PageLoader mode="table" />;

  return (
    <>
    <div className="flex flex-col gap-4 lg:gap-6 min-h-screen animate-fade-in px-5 sm:px-8 lg:px-10 xl:px-12 2xl:px-16 py-8 lg:py-10 bg-gradient-to-br from-slate-50 to-slate-100 min-w-0">
      {/* Header */}
      <header className="flex-shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#C8102E] leading-tight">Review Proposals</h1>
            <p className="text-slate-600 mt-2 text-sm leading-relaxed">
              Track proposals that have been submitted for evaluation review.
            </p>
          </div>
        </div>
      </header>

      {/* Search and Filters Section */}
      <section className="flex-shrink-0 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" aria-hidden="true" />
          </div>
          <input
            type="text"
            placeholder="Search proposals..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
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
            {Array.from(new Set(proposals.map(p => p.submittedDate ? new Date(p.submittedDate).getFullYear() : null).filter(Boolean))).sort((a: any, b: any) => b - a).map(year => (
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

      {/* Main Content Table */}
      <main className="relative flex w-full min-w-0 flex-col overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xl">
        <div className="p-4 border-b border-slate-200 bg-slate-50">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <FileClock className="w-5 h-5 text-[#C8102E]" />
              Under Review Proposals
            </h3>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <CheckCircle className="w-4 h-4" />
              <span>{endorsedProposals.length} total for review</span>
            </div>
          </div>
        </div>

        <div className="min-w-0">
          {paginatedProposals.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {paginatedProposals.map((proposal) => (
                <article key={proposal.id} className="p-4 hover:bg-slate-50 transition-colors duration-200 group">
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h2 className="text-base font-semibold text-slate-800 mb-2 line-clamp-2 group-hover:text-[#C8102E] transition-colors duration-200">
                          {proposal.title}
                        </h2>

                        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                          <div className="flex items-center gap-1.5">
                            <User className="w-3 h-3" />
                            <span>{proposal.proponent}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-red-600 font-semibold">
                            <span>Review by: {proposal.reviewDeadline}</span>
                          </div>
                          <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-slate-50 text-[#C8102E] rounded-lg font-bold border border-slate-200">
                            <CalendarDays className="w-3.5 h-3.5 text-[#C8102E]" />
                            {proposal.year !== "N/A" ? proposal.year : (proposal.submittedDate ? new Date(proposal.submittedDate).getFullYear() : new Date().getFullYear())}
                          </span>
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

                      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                        <button
                          onClick={() => handleReviewClick(proposal.id)}
                          className="inline-flex items-center gap-1.5 px-3 h-8 rounded-lg bg-[#C8102E] text-white hover:bg-[#A00E26] hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#C8102E] transition-all duration-200 cursor-pointer text-xs font-medium shadow-sm"
                        >
                          <ScanSearch className="w-3 h-3" />
                          Review
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
                {search ? "Try adjusting your search criteria." : "No proposals have been reviewed yet."}
              </p>
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex-shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-xs text-slate-600">
            <span>
              Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, sortedFiltered.length)} of{" "}
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
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
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
      {/* Review Modal */}
      {proposal && (
        <ReviewModal
          isOpen={!!selectedProposal}
          proposal={proposal as any}
          onClose={closeModal}
          onSubmit={handleSubmitReview}
          isLoading={isSubmitting}
        />
      )}
    </>
  );
}
