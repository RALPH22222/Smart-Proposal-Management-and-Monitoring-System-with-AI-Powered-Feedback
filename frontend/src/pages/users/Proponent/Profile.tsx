import React, { useState } from "react";
import DetailedProposalModal from "../../../components/proponent-component/DetailedProposalModal";
import HowItWorksModal from "../../../components/proponent-component/HowItWorksModal";
import ProposalLifecycleStepper from "../../../components/shared/ProposalLifecycleStepper";
import { FaListAlt, FaTablet } from "react-icons/fa";
import { Microscope, FileText, RefreshCw, Search, Filter, Tag, Edit, Clock, CheckCircle, XCircle, FileCheck, ChevronLeft, ChevronRight, Signature, ChevronDown, Info, CalendarDays, Table2 } from "lucide-react";
import type { Project, Proposal } from "../../../types/proponentTypes";
import { getStatusFromIndex } from "../../../types/mockData";
import {
  getStatusColorByIndex,
  getStageIcon,
  getProgressPercentageByIndex,
  getStatusLabelByIndex,
} from "../../../types/helpers";
import { getProposals } from "../../../services/proposal.api";
import { useLookups } from "../../../context/LookupContext";
import { useAuthContext } from "../../../context/AuthContext";
import SkeletonPulse from "../../../components/shared/SkeletonPulse";



const Profile: React.FC = () => {
  const formatDurationDisplay = (rawDuration: unknown) => {
    const durationValue = Number(rawDuration);
    if (!Number.isFinite(durationValue) || durationValue <= 0) return "N/A";

    if (durationValue < 1) {
      const days = Math.max(1, Math.round(durationValue * 30));
      return `${days} ${days === 1 ? "day" : "days"}`;
    }

    return `${durationValue} ${durationValue === 1 ? "month" : "months"}`;
  };

  const { user } = useAuthContext();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const [detailedModalOpen, setDetailedModalOpen] = useState(false);
  const [howItWorksOpen, setHowItWorksOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Proposal | null>(null);

  // Search and Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [yearFilter, setYearFilter] = useState("All");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest" | "a-z" | "z-a">("newest");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const cardsPerPage = 12;

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, typeFilter, sortOrder, yearFilter]);

  const [proposals, setProposals] = useState<Project[]>([]);
  const [rawProposals, setRawProposals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Lookup data from context (fetched once at layout level)
  const { agencies, sectors, disciplines, priorities, stations, tags, departments } = useLookups();

  // Fetch proposals on mount
  React.useEffect(() => {
    const fetchProposals = async () => {
      if (!user) return;

      try {
        const data: any[] = await getProposals();

        // Filter by current user
        const myProposals = data
          .filter((p: any) => {
            // Handle case where proponent_id is an object (populated user) or just a value
            const pId = (typeof p.proponent_id === 'object' && p.proponent_id !== null)
              ? p.proponent_id.id
              : p.proponent_id;
            return String(pId) === String(user.id);
          })
          .sort((a: any, b: any) => {
            const dateA = new Date(a.created_at || 0).getTime();
            const dateB = new Date(b.created_at || 0).getTime();

            // Sort by creation date descending
            if (dateB !== dateA) return dateB - dateA;

            // Fallback to ID descending if dates are equal (assuming auto-increment ID or UUID)
            return String(b.id).localeCompare(String(a.id));
          });

        setRawProposals(myProposals);

        // Map backend proposals to frontend Project type
        const mappedProposals: Project[] = myProposals.map((p: any) => {
          let index = 1;
          switch (p.status) {
            case "endorsed_for_funding":
              index = 4; // Endorsed = Funded stage
              break;
            case "funded":
              index = 4;
              break;
            case "review_rnd":
              index = 1;
              break;
            case "under_evaluation":
              index = 2;
              break;
            case "revision_rnd":
              index = 3;
              break;
            case "rejected_rnd":
              index = 5;
              break;
            case "rejected_funding":
              index = 5;
              break;
            case "revision_funding":
              index = 3;
              break;
            default:
              index = 1;
          }

          // Calculate budget
          const budgetTotal = p.estimated_budget?.reduce((sum: number, item: any) => sum + (item.amount || 0), 0) || 0;
          const budgetStr = `₱${budgetTotal.toLocaleString()}`;

          // Compute 1-indexed version number from proposal_version array.
          // Sort by id (auto-increment) so the order matches submission order, then
          // find current_version_id. Falls back to total count if no current pointer.
          const versions = Array.isArray(p.proposal_version) ? [...p.proposal_version] : [];
          versions.sort((a: any, b: any) => Number(a.id) - Number(b.id));
          let versionNumber: number | undefined;
          if (versions.length > 0) {
            const idx = p.current_version_id
              ? versions.findIndex((v: any) => Number(v.id) === Number(p.current_version_id))
              : -1;
            versionNumber = idx >= 0 ? idx + 1 : versions.length;
          }

          return {
            id: String(p.id),
            title: p.project_title,
            currentIndex: index,
            rawStatus: p.status,
            submissionDate: new Date(p.created_at).toISOString().split("T")[0],
            lastUpdated: new Date(p.updated_at || p.created_at).toISOString().split("T")[0],
            rawCreatedAt: p.created_at,
            budget: budgetStr,
            duration: formatDurationDisplay(p.duration),
            priority: "medium",
            evaluators: p.proposal_evaluators?.length || 0,
            versionNumber,
            proponent: (function () {
              const u = p.proponent || (typeof p.proponent_id === 'object' ? p.proponent_id : null);
              if (!u) return "Unknown Proponent";
              return [u.first_name, u.last_name].filter(Boolean).join(" ");
            })()
          };
        });

        setProposals(mappedProposals);
      } catch (error) {
        console.error("Failed to fetch proposals:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProposals();
  }, [user]);


  // Compute counts based on rawStatus for accuracy
  const pendingCount = proposals.filter((p) => (p as any).rawStatus === "pending").length;
  const rdEvalCount = proposals.filter((p) => ["review_rnd", "r&d evaluation"].includes((p as any).rawStatus || "")).length;
  const evaluatorsAssessmentCount = proposals.filter((p) => ["under_evaluation", "evaluators assessment"].includes((p as any).rawStatus || "")).length;
  const revisionCount = proposals.filter((p) => ["revision_rnd", "revise", "revision", "revision_funding"].includes((p as any).rawStatus || "")).length;
  const fundedCount = proposals.filter((p) => (p as any).rawStatus === "endorsed_for_funding" || (p as any).rawStatus === "funded").length;

  const getProgressBarClass = (project: any) => {
    const s = ((project as any).rawStatus || "").toLowerCase();
    return s === "funded" ? "bg-emerald-500" : "bg-[#C8102E]";
  };



  // Helper to generate tags based on raw data
  const getProjectTags = (id: string | number) => {
    // Find raw proposal
    const raw = rawProposals.find((p) => String(p.id) === String(id));
    if (!raw) return [];

    const tags: string[] = [];
    // 2. Proposal Tags
    if (Array.isArray(raw.proposal_tags)) {
      raw.proposal_tags.forEach((pt: any) => {
        if (pt.tags && pt.tags.name && pt.tags.name.trim() !== "") {
          tags.push(pt.tags.name);
        }
      });
    }

    return tags;
  };

  const getProjectYear = (id: string | number) => {
    const raw = rawProposals.find((p) => String(p.id) === String(id));
    if (!raw?.year) return null;
    return String(raw.year);
  };

  const getLocalStatusLabel = (project: any) => {
    const s = ((project as any).rawStatus || "").toLowerCase();
    if (s === "pending") return "Pending";
    if (["revise", "revision", "revision_rnd"].includes(s)) return "Revision Required";
    if (s === "revised_proposal") return "Revised Proposal";
    if (s === "review_rnd" || s === "r&d evaluation") return "Under R&D Evaluation";
    if (["under_evaluation", "evaluators assessment"].includes(s)) return "Under Evaluators Assessment";
    if (s === "endorsed_for_funding") return "Endorsed for Funding";
    if (s === "funded") return "Funded";
    if (s === "rejected_rnd") return "Rejected";
    if (s === "rejected_funding") return "Funding Rejected";
    if (s === "revision_funding") return "Funding Revision";
    if (s === "not_submitted") return "Deadline Expired";
    return getStatusLabelByIndex(project.currentIndex);
  };

  const getLocalStatusColor = (project: any) => {
    const s = ((project as any).rawStatus || "").toLowerCase();
    if (s === "pending") return "bg-amber-100 text-amber-800 border border-amber-300";
    if (["revise", "revision", "revision_rnd"].includes(s)) return "bg-orange-100 text-orange-800 border border-orange-300";
    if (s === "revised_proposal") return "bg-amber-100 text-amber-900 border border-amber-300";
    if (s === "review_rnd" || s === "r&d evaluation") return "bg-blue-100 text-blue-900 border border-blue-300";
    if (["under_evaluation", "evaluators assessment"].includes(s)) return "bg-purple-100 text-purple-800 border border-purple-300";
    if (s === "endorsed_for_funding") return "bg-blue-50 text-blue-800 border border-blue-200";
    if (s === "funded") return "bg-emerald-50 text-emerald-800 border border-emerald-200";
    if (["rejected_rnd", "rejected_funding"].includes(s)) return "bg-red-50 text-red-800 border border-red-200";
    if (s === "revision_funding") return "bg-orange-100 text-orange-800 border border-orange-300";
    if (s === "not_submitted") return "bg-red-100 text-red-800 border border-red-300";
    return getStatusColorByIndex(project.currentIndex);
  };

  const getLocalStatusIcon = (project: any) => {
    const s = ((project as any).rawStatus || "").toLowerCase();
    if (["revise", "revision", "revision_rnd", "revision_funding"].includes(s)) return <RefreshCw className="w-3 h-3" />;
    if (s === "revised_proposal") return <Edit className="w-3 h-3" />;
    if (s === "review_rnd" || s === "r&d evaluation") return <Microscope className="w-3 h-3" />;
    if (s === "endorsed_for_funding") return <Signature className="w-3 h-3" />;
    if (s === "funded") return <CheckCircle className="w-3 h-3" />;
    if (["rejected_rnd", "rejected_funding"].includes(s)) return <XCircle className="w-3 h-3" />;
    if (["under_evaluation", "evaluators assessment"].includes(s)) return <FileCheck className="w-3 h-3" />;
    if (s === "pending") return <Clock className="w-3 h-3" />;
    if (s === "not_submitted") return <XCircle className="w-3 h-3" />;
    return null;
  };

  const getLocalProgress = (project: any) => {
    const s = ((project as any).rawStatus || "").toLowerCase();
    if (s === "pending") return 0;
    if (["revise", "revision", "revision_rnd"].includes(s)) return 0;
    if (s === "revised_proposal") return 10;
    if (s === "endorsed_for_funding") return 75;
    if (s === "funded") return 100;
    // Funding-stage statuses show same progress as endorsed_for_funding
    if (["rejected_funding", "revision_funding"].includes(s)) return 75;
    if (s === "not_submitted") return 0;
    return getProgressPercentageByIndex(project.currentIndex);
  };

  // Helper for Random Tag Colors
  const getTagColor = (tag: string) => {
    // Simple hash function to get consistent color for same tag
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

  const [displayedText, setDisplayedText] = useState({ prefix: '', name: '', suffix: '' });

  React.useEffect(() => {
    if (!user) return;

    const hasVisited = localStorage.getItem('proponent_welcome_seen');
    const isNewUser = !hasVisited;

    if (isNewUser) {
      localStorage.setItem('proponent_welcome_seen', 'true');
    }

    const firstName = user.first_name || 'User';
    const targetPrefix = isNewUser ? 'Welcome to RDEC, ' : 'Welcome back, ';
    const targetName = firstName;
    const targetSuffix = !isNewUser ? '!⁠' : '';

    const totalLength = targetPrefix.length + targetName.length + targetSuffix.length;
    let charIndex = 0;

    // Clear initial
    setDisplayedText({ prefix: '', name: '', suffix: '' });

    const typeInterval = setInterval(() => {
      charIndex++;
      const currentTotal = charIndex;

      const pLen = targetPrefix.length;
      const nLen = targetName.length;

      const p = targetPrefix.slice(0, Math.min(currentTotal, pLen));
      const n = currentTotal > pLen ? targetName.slice(0, Math.min(currentTotal - pLen, nLen)) : '';
      const s = currentTotal > pLen + nLen ? targetSuffix.slice(0, currentTotal - (pLen + nLen)) : '';

      setDisplayedText({ prefix: p, name: n, suffix: s });

      if (currentTotal >= totalLength) {
        clearInterval(typeInterval);
      }
    }, 50);

    return () => clearInterval(typeInterval);
  }, [user?.first_name]);

  // Event handlers
  const handleCardClick = (project: Project) => {
    // Find raw proposal data to get full details
    const raw = rawProposals.find((p) => String(p.id) === project.id);
    if (!raw) return;

    // Helper to handle null -> "nothing" (empty string)
    const val = (v: any) => (v === null ? "" : v);

    // Helper to format currency
    const formatCurrency = (amount: number) => `₱${amount.toLocaleString()}`;

    // Map Budget Sources
    interface DetailedBudgetSource {
      source: string;
      ps: number;
      mooe: number;
      co: number;
      total: number;
      breakdown: {
        ps: any[];
        mooe: any[];
        co: any[];
      };
    }

    const budgetMap = new Map<string, DetailedBudgetSource>();

    if (Array.isArray(raw.estimated_budget)) {
      raw.estimated_budget.forEach((item: any) => {
        const source = val(item.source) || "Unknown Source";
        if (!budgetMap.has(source)) {
          budgetMap.set(source, {
            source,
            ps: 0,
            mooe: 0,
            co: 0,
            total: 0,
            breakdown: { ps: [], mooe: [], co: [] },
          });
        }
        const entry = budgetMap.get(source)!;
        const amount = Number(item.amount) || 0;
        const budgetType = (item.budget || "").toLowerCase() as "ps" | "mooe" | "co";

        if (entry.breakdown[budgetType]) {
          entry.breakdown[budgetType].push({
            id: item.id,
            item: val(item.item),
            amount: amount,
          });
          entry[budgetType] += amount;
          entry.total += amount;
        }
      });
    }

    const budgetSources = Array.from(budgetMap.values()).map((b) => ({
      source: b.source,
      ps: formatCurrency(b.ps),
      mooe: formatCurrency(b.mooe),
      co: formatCurrency(b.co),
      total: formatCurrency(b.total),
      breakdown: b.breakdown,
    }));

    const proposal: Proposal = {
      id: String(raw.id),
      title: val(raw.project_title),
      status: (project as any).rawStatus || getStatusFromIndex(project.currentIndex), // Use raw backend status
      proponent: (function () {
        const u = raw.proponent || (typeof raw.proponent_id === 'object' ? raw.proponent_id : null);
        if (!u) return "Unknown Proponent";
        return [u.first_name, u.last_name].filter(Boolean).join(" ");
      })(),
      gender: val(raw.proponent?.gender) || "",
      agency: raw.agency ? val(raw.agency.name) : "",
      department: raw.department?.name
        ? raw.department.name
        : departments.find((d) => Number(d.id) === Number(raw.department_id))?.name || "",
      year: val(raw.year),
      address: raw.agency_address
        ? [raw.agency_address.street, raw.agency_address.barangay, raw.agency_address.city]
          .map((part) => val(part))
          .filter((part) => part !== "")
          .join(", ")
        : "",
      agency_address: raw.agency_address ? [raw.agency_address] : [],
      telephone: val(raw.phone),
      email: val(raw.email),
      cooperatingAgencies: Array.isArray(raw.cooperating_agencies)
        ? raw.cooperating_agencies
          .map((c: any) => c.agencies?.name)
          .filter(Boolean)
          .join(", ")
        : "",
      rdStation:
        raw.rnd_station?.name || // Check for direct object first
        (Array.isArray(raw.rnd_station) && raw.rnd_station.length > 0 && raw.rnd_station[0].agencies
          ? val(raw.rnd_station[0].agencies.name)
          : "") ||
        "",
      classification: raw.classification_type || "",
      classificationDetails: raw.class_input || "",
      modeOfImplementation: val(raw.implementation_mode)
        .replace(/_/g, " ")
        .toLowerCase()
        .replace(/\b\w/g, (char: string) => char.toUpperCase()),
      implementationSites: Array.isArray(raw.implementation_site)
        ? raw.implementation_site.map((s: any) => ({ site: val(s.site_name), city: val(s.city) }))
        : [],
      priorityAreas: Array.isArray(raw.proposal_priorities)
        ? raw.proposal_priorities.map((pp: any) => pp.priorities?.name).filter(Boolean).join(", ")
        : (Array.isArray(raw.priority_areas) ? raw.priority_areas.join(", ") : ""),
      sector: raw.sector ? val(raw.sector.name) : "",
      discipline: raw.discipline ? val(raw.discipline.name) : "",
      duration: val(raw.duration) ? String(raw.duration) : "",
      startDate: val(raw.plan_start_date),
      endDate: val(raw.plan_end_date),
      budgetSources: budgetSources,
      budgetTotal: project.budget,
      uploadedFile:
        Array.isArray(raw.proposal_version) && raw.proposal_version.length > 0
          ? raw.proposal_version[raw.proposal_version.length - 1].file_url
          : "",
      versions: Array.isArray(raw.proposal_version) ? raw.proposal_version.map((v: any) => v.file_url) : [],
      lastUpdated: val(raw.updated_at) || val(raw.created_at),
      deadline: getStatusFromIndex(project.currentIndex) === "revise" ? val(raw.evaluation_deadline_at) : undefined,
      fundingDocumentUrl: (Array.isArray(raw.funded_projects) && raw.funded_projects.length > 0)
        ? raw.funded_projects[0].funding_document_url
        : (raw.funded_projects?.funding_document_url || ""),
      fundedProjectId: (Array.isArray(raw.funded_projects) && raw.funded_projects.length > 0)
        ? raw.funded_projects[0].id
        : raw.funded_projects?.id,
      fundedProjectLeadId: (Array.isArray(raw.funded_projects) && raw.funded_projects.length > 0)
        ? raw.funded_projects[0].project_lead_id
        : raw.funded_projects?.project_lead_id,
      versionNumber: project.versionNumber,
    };

    setSelectedProject(proposal);
    setDetailedModalOpen(true);
  };

  const handleUpdateProposal = (updatedProposal: Proposal) => {
    console.log("Updated proposal:", updatedProposal);
    setDetailedModalOpen(false);
  };

  const filteredProjects = proposals
    .filter((project: Project) => {
      const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase());
      const status = getLocalStatusLabel(project);
      const matchesStatus = typeFilter === "All" || status === typeFilter;
      const year = getProjectYear(project.id);
      const matchesYear = yearFilter === "All" || year === yearFilter;

      return matchesSearch && matchesStatus && matchesYear;
    })
    .sort((a, b) => {
      if (sortOrder === "a-z") return a.title.localeCompare(b.title);
      if (sortOrder === "z-a") return b.title.localeCompare(a.title);

      const rawA = rawProposals.find((p) => String(p.id) === String(a.id));
      const rawB = rawProposals.find((p) => String(p.id) === String(b.id));

      const dateA = new Date(rawA?.created_at || 0).getTime();
      const dateB = new Date(rawB?.created_at || 0).getTime();

      if (sortOrder === "oldest") {
        if (dateA !== dateB) return dateA - dateB;
        return String(a.id).localeCompare(String(b.id));
      }

      // newest is default
      if (dateA !== dateB) return dateB - dateA;
      return String(b.id).localeCompare(String(a.id));
    });

  const renderGridView = () => (
    <div className="p-4 lg:p-6">
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6 bg-white shrink">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div key={`grid-skeleton-${idx}`} className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-4 lg:p-6 border-2 border-gray-200 flex flex-col h-full">
              <div className="flex items-start justify-between mb-4">
                <SkeletonPulse className="h-5 w-3/4 rounded-md" />
              </div>
              <div className="flex gap-2 mb-4">
                <SkeletonPulse className="h-5 w-16 rounded-full" />
                <SkeletonPulse className="h-5 w-20 rounded-full" />
              </div>
              <div className="space-y-3 mb-5 mt-auto">
                <div className="flex items-center justify-between">
                  <SkeletonPulse className="h-3 w-12" />
                  <SkeletonPulse className="h-3 w-20" />
                </div>
                <div className="flex items-center justify-between">
                  <SkeletonPulse className="h-3 w-14" />
                  <SkeletonPulse className="h-3 w-16" />
                </div>
              </div>
              {/* Stepper Placeholder */}
              <div className="mb-4 pt-3 border-t border-slate-100 flex justify-between items-center px-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <SkeletonPulse key={i} className="w-3 h-3 rounded-full" />
                ))}
              </div>
              <SkeletonPulse className="h-6 w-32 rounded-full" />
            </div>
          ))}
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="text-center py-20 px-4">
          <div className="mx-auto w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
            <FileText className="w-8 h-8 text-slate-300" />
          </div>
          <p className="text-sm font-semibold text-gray-600">No projects found</p>
          <p className="text-xs text-gray-400 mt-1 max-w-[200px] mx-auto">
            {searchTerm || typeFilter !== "All" || yearFilter !== "All"
              ? "Try adjusting your search or filters to find what you're looking for."
              : "You haven't submitted any research proposals yet."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6 bg-white shrink">
          {filteredProjects.slice((currentPage - 1) * cardsPerPage, currentPage * cardsPerPage).map((project: any) => {
            const statusLabel = loading ? "Loading..." : getLocalStatusLabel(project);
            const tags = getProjectTags(project.id);
            const yearTag = getProjectYear(project.id);

            return (
              <div
                key={project.id}
                className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-4 lg:p-6 border-2 border-gray-200 hover:border-[#C8102E] hover:shadow-lg transition-all duration-300 cursor-pointer group flex flex-col"
                onClick={() => !loading && handleCardClick(project as any)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0 overflow-hidden" style={{ containerType: 'inline-size' }}>
                    <h4 className="font-bold text-gray-800 text-sm lg:text-base group-hover:text-[#C8102E] transition-colors whitespace-nowrap inline-block animate-[scrollTitle_8s_ease-in-out_infinite]">
                      {project.title}
                    </h4>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-3">
                  {project.versionNumber && project.versionNumber > 1 && (
                    <span
                      title={`Currently on version ${project.versionNumber} after ${project.versionNumber - 1} revision${project.versionNumber - 1 === 1 ? '' : 's'}`}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border bg-indigo-50 text-indigo-700 border-indigo-300"
                    >
                      <RefreshCw className="w-3 h-3" />
                      v{project.versionNumber}
                    </span>
                  )}
                  {yearTag && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border bg-white text-[#C8102E] border-[#C8102E]/40">
                      <CalendarDays className="w-3 h-3" />
                      {yearTag}
                    </span>
                  )}
                  {tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getTagColor(tag)}`}
                    >
                      <Tag className="w-3 h-3" />
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="space-y-2 mb-4 mt-auto">
                  <div className="flex items-center justify-between text-xs text-gray-600">
                    <span>Budget:</span>
                    <span className="font-semibold">{project.budget}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-600">
                    <span>Duration:</span>
                    <span className="font-semibold">{project.duration}</span>
                  </div>
                </div>

                {/* Lifecycle stepper — visual position in the 5-stage pipeline. */}
                <div className="mb-3 pt-2 border-t border-slate-100">
                  <ProposalLifecycleStepper rawStatus={(project as any).rawStatus || ""} />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${loading ? 'bg-gray-100 text-gray-400' : getLocalStatusColor(project)}`}
                    >
                      {!loading && getLocalStatusIcon(project)}
                      {statusLabel}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderListView = () => (
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="text-left font-semibold text-gray-700 px-4 lg:px-6 py-3 text-sm">Project Title</th>
            <th className="text-left font-semibold text-gray-700 px-4 lg:px-6 py-3 text-sm">Status</th>
            <th className="text-left font-semibold text-gray-700 px-4 lg:px-6 py-3 text-sm hidden lg:table-cell">
              Budget
            </th>
            <th className="text-left font-semibold text-gray-700 px-4 lg:px-6 py-3 text-sm hidden md:table-cell">
              Duration
            </th>
            <th className="text-left font-semibold text-gray-700 px-4 lg:px-6 py-3 text-sm">Progress</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {loading && (
            [1, 2, 3, 4, 5].map((idx) => (
              <tr key={idx}>
                <td className="px-4 lg:px-6 py-4">
                  <div className="flex items-center gap-3">
                    <SkeletonPulse className="w-9 h-9 rounded-lg shrink-0" />
                    <div className="space-y-2 w-full max-w-[420px]">
                      <SkeletonPulse className="h-4 w-3/4 rounded" />
                      <div className="flex gap-2">
                        <SkeletonPulse className="h-3 w-16 rounded-full" />
                        <SkeletonPulse className="h-3 w-12 rounded-full" />
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-4 lg:px-6 py-4">
                  <SkeletonPulse className="h-6 w-28 rounded-full" />
                </td>
                <td className="px-4 lg:px-6 py-4 hidden lg:table-cell">
                  <SkeletonPulse className="h-4 w-20" />
                </td>
                <td className="px-4 lg:px-6 py-4 hidden md:table-cell">
                  <SkeletonPulse className="h-4 w-16" />
                </td>
                <td className="px-4 lg:px-6 py-4">
                  <div className="flex items-center gap-2">
                    <SkeletonPulse className="w-20 h-2 rounded-full" />
                    <SkeletonPulse className="h-3 w-8" />
                  </div>
                </td>
              </tr>
            ))
          )}

          {/* If NOT loading and no data found */}
          {!loading && filteredProjects.length === 0 && (
            <tr>
              <td colSpan={6} className="px-4 py-20 text-center">
                <div className="mx-auto w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
                  <FileText className="w-8 h-8 text-slate-300" />
                </div>
                <p className="text-sm font-semibold text-gray-600">No projects found</p>
                <p className="text-xs text-gray-400 mt-1 max-w-[200px] mx-auto">
                  {searchTerm || typeFilter !== "All" || yearFilter !== "All"
                    ? "Try adjusting your search or filters to find what you're looking for."
                    : "You haven't submitted any research proposals yet."}
                </p>
              </td>
            </tr>
          )}

          {!loading && filteredProjects.slice((currentPage - 1) * cardsPerPage, currentPage * cardsPerPage).map((project: any) => {
            const progress = loading ? 0 : getLocalProgress(project);
            const statusLabel = loading ? "Loading..." : getLocalStatusLabel(project);
            const tags = getProjectTags(project.id);
            const yearTag = getProjectYear(project.id);

            return (
              <tr
                key={project.id}
                className="transition-all duration-500 hover:bg-gray-50 cursor-pointer group"
                onClick={() => !loading && handleCardClick(project as any)}
              >
                <td className="px-4 lg:px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg transition-colors ${loading ? 'bg-gray-100 text-gray-300' : 'bg-gray-100 group-hover:bg-[#C8102E] group-hover:text-white'}`}>
                      {!loading ? getStageIcon(project.currentIndex) : <Clock className="w-5 h-5" />}
                    </div>
                    <div className="min-w-0 max-w-[200px] sm:max-w-[300px] md:max-w-[400px] lg:max-w-[500px]">
                      <div className="overflow-hidden" style={{ containerType: 'inline-size' }}>
                        <div className="font-semibold text-gray-800 group-hover:text-[#C8102E] transition-colors text-sm lg:text-base whitespace-nowrap inline-block animate-[scrollTitle_8s_ease-in-out_infinite]">
                          {project.title}
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        {project.versionNumber && project.versionNumber > 1 && (
                          <span
                            title={`Currently on version ${project.versionNumber} after ${project.versionNumber - 1} revision${project.versionNumber - 1 === 1 ? '' : 's'}`}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border bg-indigo-50 text-indigo-700 border-indigo-300"
                          >
                            <RefreshCw className="w-3 h-3" />
                            v{project.versionNumber}
                          </span>
                        )}
                        {yearTag && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] border bg-[#C8102E]/10 text-[#C8102E] border-[#C8102E]/30">
                            <CalendarDays className="w-3 h-3" />
                            Year {yearTag}
                          </span>
                        )}
                        {tags.slice(0, 1).map((tag, i) => (
                          <span
                            key={i}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] border ${getTagColor(tag)}`}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-4 lg:px-6 py-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit ${loading ? 'bg-gray-100 text-gray-400' : getLocalStatusColor(project)}`}
                  >
                    {!loading && getLocalStatusIcon(project)}
                    {statusLabel}
                  </span>
                </td>
                <td className="px-4 lg:px-6 py-4 text-gray-600 font-medium hidden lg:table-cell">{project.budget}</td>
                <td className="px-4 lg:px-6 py-4 text-gray-600 text-sm hidden md:table-cell">{project.duration}</td>
                <td className="px-4 lg:px-6 py-4">
                  <div className="flex items-center gap-2 justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-16 lg:w-20 bg-gray-200 rounded-full h-2">
                        <div
                          className={`${getProgressBarClass(project)} h-2 rounded-full transition-all duration-300`}
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                      <span className="font-semibold">{progress}%</span>
                    </div>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  return (
    <>
      <style>{`
        @keyframes scrollTitle {
          0%, 15% { transform: translateX(0); }
          75%, 85% { transform: translateX(min(0px, calc(100cqw - 100%))); }
          95%, 100% { transform: translateX(0); }
        }
      `}</style>
      <div className="min-h-screen px-5 sm:px-8 lg:px-10 xl:px-12 2xl:px-16 py-8 lg:py-10 bg-gradient-to-br from-slate-50 to-slate-100 animate-fade-in">

        {/* --- HEADER --- */}
        <header className="mb-8">
          {loading ? (
            <>
              <div className="animate-pulse flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                <div className="space-y-3">
                  <div className="h-8 w-80 max-w-[90vw] bg-gray-200 rounded-lg" />
                  <div className="h-4 w-64 max-w-[75vw] bg-gray-100 rounded" />
                </div>
                <div className="h-10 w-32 bg-gray-100 border border-gray-200 rounded-lg" />
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-3 lg:gap-4 animate-pulse">
                {Array.from({ length: 6 }).map((_, idx) => (
                  <div key={`metric-skeleton-${idx}`} className="bg-white rounded-2xl border border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <div className="h-3 w-20 bg-gray-100 rounded" />
                        <div className="h-6 w-12 bg-gray-200 rounded" />
                      </div>
                      <div className="w-8 h-8 bg-gray-100 rounded-lg" />
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-[#C8102E] to-[#E03A52] rounded-xl shadow-lg flex-shrink-0">
                    <Table2 className="text-white text-xl lg:text-2xl" />
                  </div>
                  <div>
                    <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-1 min-h-[40px]">
                      {displayedText.prefix}
                      <span className="text-[#C8102E]">{displayedText.name}</span>
                      {displayedText.suffix}
                    </h1>
                    <p className="text-gray-600 text-sm lg:text-base">
                      Monitor your research proposals through the entire lifecycle
                    </p>
                  </div>
                </div>

                <div />
              </div>

              {/* Stats Overview */}
              <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-3 lg:gap-4">
            {/* Total Projects Card */}
            <div className="bg-slate-50 shadow-xl rounded-2xl border border-slate-300 p-4 transition-all duration-300 hover:shadow-lg hover:scale-105 group cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-700 mb-2">Total Projects</p>
                  <p className="text-xl font-bold text-slate-800 tabular-nums">{proposals.length}</p>
                </div>
                <FileText className="w-6 h-6 text-slate-600 group-hover:scale-110 transition-transform duration-300" />
              </div>
            </div>

            {/* Pending Card */}
            <div className="bg-amber-50 shadow-xl rounded-2xl border border-amber-300 p-4 transition-all duration-300 hover:shadow-lg hover:scale-105 group cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-700 mb-2">Pending</p>
                  <p className="text-xl font-bold text-amber-600 tabular-nums">{pendingCount}</p>
                </div>
                <Clock className="w-6 h-6 text-amber-500 group-hover:scale-110 transition-transform duration-300" />
              </div>
            </div>

            {/* R&D Evaluation Card */}
            <div className="bg-blue-50 shadow-xl rounded-2xl border border-blue-300 p-4 transition-all duration-300 hover:shadow-lg hover:scale-105 group cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-700 mb-2">R&D Evaluation</p>
                  <p className="text-xl font-bold text-blue-600 tabular-nums">{rdEvalCount}</p>
                </div>
                <Microscope className="w-6 h-6 text-blue-500 group-hover:scale-110 transition-transform duration-300" />
              </div>
            </div>

            {/* Evaluators Assessment Card */}
            <div className="bg-purple-50 shadow-xl rounded-2xl border border-purple-300 p-4 transition-all duration-300 hover:shadow-lg hover:scale-105 group cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-700 mb-2">Evaluators Assessment</p>
                  <p className="text-xl font-bold text-purple-600 tabular-nums">{evaluatorsAssessmentCount}</p>
                </div>
                <FileCheck className="w-6 h-6 text-purple-500 group-hover:scale-110 transition-transform duration-300" />
              </div>
            </div>

            {/* Revision Required Card */}
            <div className="bg-orange-50 shadow-xl rounded-2xl border border-orange-300 p-4 transition-all duration-300 hover:shadow-lg hover:scale-105 group cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-700 mb-2">Revision Required</p>
                  <p className="text-xl font-bold text-orange-600 tabular-nums">{revisionCount}</p>
                </div>
                <RefreshCw className="w-6 h-6 text-orange-500 group-hover:scale-110 transition-transform duration-300" />
              </div>
            </div>

            {/* Funded Card */}
            <div className="bg-green-50 shadow-xl rounded-2xl border border-green-300 p-4 transition-all duration-300 hover:shadow-lg hover:scale-105 group cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-700 mb-2">Funded</p>
                  <p className="text-xl font-bold text-green-600 tabular-nums">{fundedCount}</p>
                </div>
                <CheckCircle className="w-6 h-6 text-green-500 group-hover:scale-110 transition-transform duration-300" />
              </div>
            </div>
              </div>
            </>
          )}
        </header>

        {/* SEARCH & FILTER CONTROLS */}
        <div className={`mb-6 px-4 lg:px-6 py-4 bg-white rounded-2xl border border-gray-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 ${loading ? "animate-pulse" : ""}`}>
          {/* Search Control on Left */}
          {loading ? (
            <div className="flex-1 h-10 bg-gray-100 rounded-xl border border-gray-200" />
          ) : (
            <div className="relative flex-1 group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400 group-focus-within:text-[#C8102E] transition-colors" />
              </div>
              <input
                type="text"
                placeholder="Search projects by title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20 focus:border-[#C8102E] focus:bg-white transition-all"
              />
            </div>
          )}

          {/* Filter Controls on Right */}
          <div className="flex flex-wrap items-center gap-3">
            {loading ? (
              <>
                <div className="h-10 w-40 bg-gray-100 rounded-xl border border-gray-200" />
                <div className="h-10 w-32 bg-gray-100 rounded-xl border border-gray-200" />
                <div className="h-10 w-44 bg-gray-100 rounded-xl border border-gray-200" />
                <div className="h-10 w-24 bg-gray-100 rounded-xl border border-gray-200" />
              </>
            ) : (
              <>
                {/* Year Filter */}
                <div className="relative">
                  <select
                    value={yearFilter}
                    onChange={(e) => setYearFilter(e.target.value)}
                    className="appearance-none bg-white pl-9 pr-10 py-2 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20 focus:border-[#C8102E] cursor-pointer min-w-[120px] hover:border-slate-300 transition-colors"
                  >
                    <option value="All">All Years</option>
                    {Array.from(new Set(rawProposals.map(p => p.year).filter(Boolean))).sort((a: any, b: any) => Number(b) - Number(a)).map(year => (
                      <option key={String(year)} value={String(year)}>{year as React.ReactNode}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
                  </div>
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                  </div>
                </div>

                {/* Status Filter */}
                <div className="relative">
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="appearance-none bg-white pl-9 pr-10 py-2 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20 focus:border-[#C8102E] cursor-pointer min-w-[160px] hover:border-slate-300 transition-colors"
                  >
                    <option value="All">All Statuses</option>
                    <option value="Pending">Pending</option>
                    <option value="Under R&D Evaluation">Under R&D Evaluation</option>
                    <option value="Under Evaluators Assessment">Under Evaluators Assessment</option>
                    <option value="Endorsed for Funding">Endorsed for Funding</option>
                    <option value="Funded">Funded</option>
                    <option value="Revision Required">Revision Required</option>
                    <option value="Rejected">Rejected</option>
                    <option value="Revised Proposal">Revised Proposal</option>
                  </select>
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Filter className="h-3.5 w-3.5 text-slate-400" />
                  </div>
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                  </div>
                </div>

                {/* Sort Order Filter */}
                <div className="relative">
                  <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value as any)}
                    className="appearance-none bg-white pl-9 pr-10 py-2 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20 focus:border-[#C8102E] cursor-pointer min-w-[180px] hover:border-slate-300 transition-colors"
                  >
                    <option value="newest">Newest to Oldest</option>
                    <option value="oldest">Oldest to Newest</option>
                    <option value="a-z">Title: A - Z</option>
                    <option value="z-a">Title: Z - A</option>
                  </select>
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                  </div>
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                  </div>
                </div>

                {/* View Toggle (Segmented Control) */}
                <div className="flex items-center gap-2 bg-white rounded-xl p-1 shadow-sm border border-gray-200">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-2 rounded-lg transition-all duration-200 ${viewMode === "grid" ? "bg-[#C8102E] text-white shadow-md" : "text-gray-500 hover:text-gray-700"
                      }`}
                  >
                    <FaTablet className="text-sm" />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-2 rounded-lg transition-all duration-200 ${viewMode === "list" ? "bg-[#C8102E] text-white shadow-md" : "text-gray-500 hover:text-gray-700"
                      }`}
                  >
                    <FaListAlt className="text-sm" />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* All Projects Section */}
        <section>
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <div className={`bg-gradient-to-r from-gray-50 to-gray-100 px-4 lg:px-6 py-4 border-b border-gray-200 ${loading ? "animate-pulse" : ""}`}>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                {loading ? (
                  <>
                    <div className="h-6 w-48 bg-gray-200 rounded" />
                    <div className="h-9 w-36 bg-gray-100 border border-gray-200 rounded-lg" />
                  </>
                ) : (
                  <>
                    <div>
                      <h3 className="text-lg lg:text-xl font-bold text-gray-800 flex items-center gap-2">
                        <FileText className="text-[#C8102E]" />
                        Project Portfolio
                      </h3>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setHowItWorksOpen(true)}
                        className="relative flex items-center gap-2 px-4 py-2 bg-white text-red-600 hover:text-[#C8102E] hover:border-[#C8102E] rounded-lg transition-all duration-300 text-sm font-bold border border-red-300 shadow-sm hover:shadow group"
                      >
                        <span className="relative inline-flex items-center justify-center">
                          <span className="absolute inline-flex h-7 w-7 rounded-full bg-[#C8102E]/20 animate-pulse"></span>
                          <Info className="relative w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                        </span>
                        Process Guide
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Project Portfolio View */}
            {viewMode === "grid" ? renderGridView() : renderListView()}

            {/* Universal Pagination Footer */}
            {filteredProjects.length > cardsPerPage && (
              <div className="p-4 bg-slate-50 border-t border-slate-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-xs text-slate-600">
                  <span>
                    Showing {(currentPage - 1) * cardsPerPage + 1}-{Math.min(currentPage * cardsPerPage, filteredProjects.length)} of {filteredProjects.length} proposals
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <ChevronLeft className="w-3 h-3" />
                      Previous
                    </button>
                    <span className="px-3 py-1.5 text-xs font-medium text-slate-600">
                      Page {currentPage} of {Math.ceil(filteredProjects.length / cardsPerPage)}
                    </span>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredProjects.length / cardsPerPage), p + 1))}
                      disabled={currentPage === Math.ceil(filteredProjects.length / cardsPerPage)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      Next
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Modals placed outside the animate-fade-in div to fix z-index stacking issues with the navbar */}
      <HowItWorksModal
        isOpen={howItWorksOpen}
        onClose={() => setHowItWorksOpen(false)}
      />

      <DetailedProposalModal
        isOpen={detailedModalOpen}
        onClose={() => setDetailedModalOpen(false)}
        proposal={selectedProject}
        onUpdateProposal={handleUpdateProposal}
        // Pass lookup data
        agencies={agencies}
        sectors={sectors}
        disciplines={disciplines}
        priorities={priorities}
        stations={stations}
        tags={tags}
        departments={departments}
      />
    </>
  );
};

export default Profile;