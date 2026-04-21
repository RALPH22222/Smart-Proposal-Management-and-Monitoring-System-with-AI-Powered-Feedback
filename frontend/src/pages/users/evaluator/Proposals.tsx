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
  RefreshCw,
  RotateCcw,
  AlertCircle,
  CalendarDays,
} from "lucide-react";
import { decisionEvaluatorToProposal, getEvaluatorProposals } from "../../../services/proposal.api";
import { formatDate } from "../../../utils/date-formatter";
import Swal from "sweetalert2";
import ProposalModal from "../../../components/evaluator-component/ProposalViewModal";
import DecisionModal from "../../../components/evaluator-component/DecisionModal";
import PageLoader from "../../../components/shared/PageLoader";

export default function Proposals() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProposal, setSelectedProposal] = useState<number | null>(null);
  const [yearFilter, setYearFilter] = useState("All");
  const [sortOrder, setSortOrder] = useState("recent-old");

  const [decisionModalOpen, setDecisionModalOpen] = useState(false);
  const [proposalToEvaluate, setProposalToEvaluate] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

        // Map budget — group by source and category, include breakdown items
        const budgetSourcesMap: Record<string, { ps: { items: any[], total: number }; mooe: { items: any[], total: number }; co: { items: any[], total: number } }> = {};
        (proposalObj.estimated_budget || []).forEach((b: any) => {
          const src = b.source || "Unknown Source";
          const amt = typeof b.amount === 'string' ? parseFloat(b.amount.replace(/,/g, '')) || 0 : Number(b.amount) || 0;
          const itm = b.item || b.item_description || b.item_name || "Unspecified Item";
          const subcategory = b.subcategory || b.sub_category;
          const specifications = b.specifications || b.spec_volume;
          const quantity = b.quantity || b.qty;
          const unit = b.unit;
          const unitPrice = b.unit_price || b.unitPrice;
          const type = (b.budget || b.item_type || "").toLowerCase();

          if (!budgetSourcesMap[src]) {
            budgetSourcesMap[src] = {
              ps: { items: [], total: 0 },
              mooe: { items: [], total: 0 },
              co: { items: [], total: 0 },
            };
          }

          let cat: "ps" | "mooe" | "co" = "mooe"; // default
          if (type.includes("ps") || type.includes("personal")) cat = "ps";
          else if (type.includes("co") || type.includes("capital")) cat = "co";
          else if (type.includes("mooe")) cat = "mooe";

          budgetSourcesMap[src][cat].total += amt;
          budgetSourcesMap[src][cat].items.push({ item: itm, amount: amt, subcategory, specifications, quantity, unit, unitPrice });
        });

        const budgetSources = Object.entries(budgetSourcesMap).map(([source, data]) => ({
          source,
          ps: formatCurrency(data.ps.total),
          mooe: formatCurrency(data.mooe.total),
          co: formatCurrency(data.co.total),
          total: formatCurrency(data.ps.total + data.mooe.total + data.co.total),
          breakdown: {
            ps: data.ps.items,
            mooe: data.mooe.items,
            co: data.co.items,
          },
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
          deadline: p.deadline_at ? formatDate(p.deadline_at) : "N/A",
          projectType: proposalObj.sector?.name || "N/A",
          agency: proposalObj.agency?.name || "N/A",
          address: agencyAddress,
          telephone: proposalObj.phone || "N/A",
          email: proposalObj.email || "N/A",
          modeOfImplementation: proposalObj.implementation_mode === "multi_agency" ? "Multi Agency" : "Single Agency",
          implementationSites: (proposalObj.implementation_site || []).map((s: any) => ({ site: s.site_name, city: s.city })),
          priorityAreas: (proposalObj.proposal_priorities || []).map((pp: any) => pp.priorities?.name).join(", "),
          cooperatingAgencies: (proposalObj.cooperating_agencies || [])
            .map((ca: any) => ca.agencies?.name ?? ca.agency_name_text ?? "")
            .filter((s: string) => s.length > 0)
            .join(", "),
          rdStation: proposalObj.rnd_station?.name || "N/A",
          classification: proposalObj.classification_type === "research_class" ? "Research" : "Development",
          classificationDetails: proposalObj.class_input || "N/A",
          sector: proposalObj.sector?.name || "N/A",
          discipline: proposalObj.discipline?.name || "N/A",
          duration: proposalObj.duration ? `${proposalObj.duration} months` : "N/A",
          year: proposalObj.year || "N/A",
          startDate: proposalObj.plan_start_date || "N/A",
          endDate: proposalObj.plan_end_date || "N/A",
          budgetSources,
          budgetTotal: formatCurrency(totalBudgetVal),
          projectFile: (proposalObj.proposal_version && proposalObj.proposal_version.length > 0)
            ? proposalObj.proposal_version[proposalObj.proposal_version.length - 1].file_url
            : (proposalObj.file_url || null),
          extensionReason: p.remarks || null,
          proponentInfoVisibility: proposalObj.proponent_info_visibility,
          tags: (proposalObj.proposal_tags || []).map((t: any) => t.tags?.name || t.tag?.name).filter(Boolean),
          raw: p,
          assignedDate: p.date_forwarded || p.created_at || proposalObj.created_at || null,
          evaluatedDate: (['decline', 'rejected', 'accepted', 'approved', 'approve', 'revise', 'reject'].includes(p.status)) ? p.updated_at || proposalObj.updated_at : null,
          remarks: p.remarks || null
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

  // Map each filter tab to all backend status aliases it should capture
  const STATUS_GROUPS: Record<string, string[]> = {
    pending:             ["pending"],
    accepted:            ["accepted", "accept", "approve", "approved", "funded"],
    for_review:          ["for_review", "under_evaluation"],
    decline:             ["reject", "rejected", "disapproved"],
    declined:            ["decline"],
    revise:              ["revise", "revision"],
    extension_approved:  ["extension_approved"],
    extension_requested: ["extension_requested", "extend"],
    extension_rejected:  ["extension_rejected"],
  };

  const filtered = proposals.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(search.toLowerCase()) || p.proponent.toLowerCase().includes(search.toLowerCase());
    const s = (p.status || "").toLowerCase();
    const matchesStatus =
      statusFilter === "All" ||
      (STATUS_GROUPS[statusFilter] ?? [statusFilter]).includes(s);
    const proposalYear = p.assignedDate ? new Date(p.assignedDate).getFullYear().toString() : "N/A";
    const matchesYear = yearFilter === "All" || proposalYear === yearFilter;
    return matchesSearch && matchesStatus && matchesYear;
  });

  // Sort logic
  const sortedFiltered = [...filtered].sort((a, b) => {
    if (sortOrder === "a-z") return a.title.localeCompare(b.title);
    if (sortOrder === "z-a") return b.title.localeCompare(a.title);

    const dateA = new Date(a.assignedDate || 0).getTime();
    const dateB = new Date(b.assignedDate || 0).getTime();

    if (sortOrder === "recent-old") return dateB - dateA;
    if (sortOrder === "old-recent") return dateA - dateB;

    return 0;
  });

  const totalPages = Math.ceil(sortedFiltered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProposals = sortedFiltered.slice(startIndex, startIndex + itemsPerPage);

  const getStatusTheme = (status: string) => {
    const s = (status || "").toLowerCase();

    if (["accepted", "accept", "approve", "approved", "funded"].includes(s))
      return {
        bg: "bg-emerald-100", border: "border-emerald-200", text: "text-emerald-800",
        icon: <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />,
        label: "Proposal Approved",
      };

    if (s === "extension_approved")
      return {
        bg: "bg-emerald-100", border: "border-emerald-200", text: "text-emerald-800",
        icon: <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />,
        label: "Extension Approved",
      };

    if (["reject", "rejected", "disapproved"].includes(s))
      return {
        bg: "bg-red-100", border: "border-red-200", text: "text-red-800",
        icon: <XCircle className="w-3.5 h-3.5 text-red-600" />,
        label: "Proposal Reject",
      };

    if (s === "decline")
      return {
        bg: "bg-slate-100", border: "border-slate-200", text: "text-slate-700",
        icon: <XCircle className="w-3.5 h-3.5 text-slate-500" />,
        label: "Declined",
      };

    if (["revise", "revision"].includes(s))
      return {
        bg: "bg-amber-100", border: "border-amber-200", text: "text-amber-800",
        icon: <RotateCcw className="w-3.5 h-3.5 text-amber-600" />,
        label: "Proposal Revise",
      };

    if (s === "extension_rejected")
      return {
        bg: "bg-red-100", border: "border-red-200", text: "text-red-800",
        icon: <XCircle className="w-3.5 h-3.5 text-red-600" />,
        label: "Extension Declined",
      };

    if (["extension_requested", "extend"].includes(s))
      return {
        bg: "bg-blue-100", border: "border-blue-200", text: "text-blue-800",
        icon: <CalendarClock className="w-3.5 h-3.5 text-blue-600" />,
        label: "Extension Requested",
      };

    if (s === "pending")
      return {
        bg: "bg-amber-100", border: "border-amber-200", text: "text-amber-800",
        icon: <Clock className="w-3.5 h-3.5 text-amber-600" />,
        label: "Pending Review",
      };

    if (["for_review", "under_evaluation"].includes(s))
      return {
        bg: "bg-cyan-100", border: "border-cyan-200", text: "text-cyan-800",
        icon: <RefreshCw className="w-3.5 h-3.5 text-cyan-600" />,
        label: "Under Review",
      };

    return {
      bg: "bg-slate-100", border: "border-slate-200", text: "text-slate-700",
      icon: <AlertCircle className="w-3.5 h-3.5 text-slate-500" />,
      label: status.charAt(0).toUpperCase() + status.slice(1),
    };
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

    // Use YYYY-MM-DD string directly — avoid new Date().toISOString() timezone shift
    const formattedDeadline = newDeadline || undefined;

    const payload = {
      proposal_id: proposalToEvaluate,
      status: apiStatus,
      remarks: remarks || undefined, // Send undefined if empty string
      deadline_at: formattedDeadline,
    };

    setIsSubmitting(true);
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
    } finally {
      setIsSubmitting(false);
    }
  };

  const proposal = proposals.find((p) => p.id === selectedProposal);
  const evaluationProposal = proposals.find((p) => p.id === proposalToEvaluate);

  if (loading) return <PageLoader mode="table" />;

  return (
    <>
    <div className="flex flex-col gap-4 lg:gap-6 min-h-screen animate-fade-in px-5 sm:px-8 lg:px-10 xl:px-12 2xl:px-16 py-8 lg:py-10 bg-gradient-to-br from-slate-50 to-slate-100 min-w-0">
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

      {/* Tabs Section */}
      <section className="flex-shrink-0 overflow-x-auto pb-2">
        <div className="flex flex-wrap gap-2">
          {[
            { id: "All", label: "All", icon: Filter },
            { id: "pending", label: "Pending Review", icon: Clock },
            { id: "accepted", label: "Proposal Approved", icon: CheckCircle },
            { id: "for_review", label: "Under Review", icon: RefreshCw },
            { id: "decline", label: "Proposal Reject", icon: XCircle },
            { id: "declined", label: "Declined", icon: XCircle },
            { id: "revise", label: "Proposal Revise", icon: RotateCcw },
            { id: "extension_approved", label: "Extension Approved", icon: CheckCircle },
            { id: "extension_requested", label: "Extension Requested", icon: CalendarClock },
            { id: "extension_rejected", label: "Extension Declined", icon: XCircle },
          ].map((tab) => {
            const isActive = statusFilter === tab.id;
            const count = tab.id === "All"
              ? proposals.length
              : proposals.filter(p => (STATUS_GROUPS[tab.id] ?? [tab.id]).includes((p.status || "").toLowerCase())).length;
            return (
              <button
                key={tab.id}
                onClick={() => { setStatusFilter(tab.id); setCurrentPage(1); }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
                  isActive
                    ? "bg-[#C8102E] text-white border-[#C8102E] shadow-sm"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                <tab.icon className={`w-4 h-4 flex-shrink-0 ${isActive ? "text-white" : "text-slate-400"}`} />
                <span>{tab.label}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  isActive ? "bg-white/25 text-white" : "bg-slate-100 text-slate-500"
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </section>

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
            {Array.from(new Set(proposals.map(p => p.assignedDate ? new Date(p.assignedDate).getFullYear() : null).filter(Boolean))).sort((a: any, b: any) => b - a).map(year => (
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
              <FileText className="w-5 h-5 text-[#C8102E]" />
              Research Proposals
            </h3>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <User className="w-4 h-4" />
              <span>{proposals.length} total proposals</span>
            </div>
          </div>
        </div>

        <div className="min-w-0">
          {paginatedProposals.length > 0 ? (
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
                          <div className="flex items-center gap-1.5 text-red-600">
                            <Calendar className="w-3 h-3" aria-hidden="true" />
                            <span className="font-semibold">Deadline: {proposal.deadline}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <CalendarClock className="w-3 h-3" aria-hidden="true" />
                          <span className="font-semibold">Forwarded: {proposal.assignedDate ? formatDate(proposal.assignedDate) : "N/A"}</span>
                        </div>
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-slate-50 text-[#C8102E] rounded-lg font-bold border border-slate-200">
                          <CalendarDays className="w-3.5 h-3.5 text-[#C8102E]" />
                          {new Date(proposal.assignedDate || Date.now()).getFullYear()}
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
                      {(() => {
                        const theme = getStatusTheme(proposal.status);
                        return (
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${theme.bg} ${theme.border} ${theme.text} flex-shrink-0`}>
                            {theme.icon}
                            {theme.label}
                          </span>
                        );
                      })()}

                      {(proposal.status === "pending" || proposal.status === "extension_approved" || proposal.status === "extension_rejected") && (
                        <button
                          onClick={() => handleEvaluateClick(proposal.id)}
                          className="inline-flex items-center gap-1.5 px-3 h-8 rounded-lg bg-[#C8102E] text-white hover:bg-[#A00C24] hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#C8102E] transition-all duration-200 cursor-pointer text-xs font-medium shadow-sm"
                          aria-label={`${proposal.title}`}
                          title="Action"
                        >
                          <Gavel className="w-3 h-3" />
                          Action
                        </button>
                      )}

                      <button
                        onClick={() => handleViewClick(proposal.id)}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 cursor-pointer"
                        aria-label={`View details for ${proposal.title}`}
                        title="View details"
                      >
                        <Eye className="w-3 h-3" />
                      </button>
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

    </div>
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
          isLoading={isSubmitting}
        />
      )}
    </>
  );
}