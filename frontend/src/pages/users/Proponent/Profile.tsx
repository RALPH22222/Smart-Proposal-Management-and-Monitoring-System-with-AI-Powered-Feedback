import React, { useState } from "react";
import ShareModal from "../../../components/proponent-component/ShareModal";
import NotificationsDropdown from "../../../components/proponent-component/NotificationsDropdown";
import DetailedProposalModal from "../../../components/proponent-component/DetailedProposalModal";
import { FaListAlt, FaUsers, FaBell, FaTablet, FaShareAlt } from "react-icons/fa";
import { Microscope, FileText, ClipboardCheck, RefreshCw, Award, Search, Filter, Tag, Clock } from "lucide-react";

import type { Project, Proposal, Notification } from "../../../types/proponentTypes";
import { initialNotifications, getStatusFromIndex } from "../../../types/mockData";
import {
  getStatusColorByIndex,
  getStageIcon,
  getProgressPercentageByIndex,
  getStatusLabelByIndex,
} from "../../../types/helpers";
import {
  getProposals,
  fetchAgencies,
  fetchSectors,
  fetchDisciplines,
  fetchPriorities,
  fetchStations,
  fetchTags,
  fetchDepartments,
  type LookupItem,
} from "../../../services/proposal.api";

import { useAuthContext } from "../../../context/AuthContext";

const Loader3D = () => (
  <div className="flex flex-col items-center justify-center py-12 w-full">
    <div className="relative w-24 h-24" style={{ perspective: "1000px" }}>
      <div className="relative w-full h-full transform-style-3d animate-spin-file">
        <style>{`
          .transform-style-3d { transform-style: preserve-3d; }
          .animate-spin-file { animation: spin-file 3s infinite ease-in-out; }
          @keyframes spin-file {
            0% { transform: rotateY(0deg); }
            50% { transform: rotateY(180deg); }
            100% { transform: rotateY(360deg); }
          }
        `}</style>

        {/* Document Body - Front */}
        <div className="absolute inset-0 bg-white border-2 border-gray-200 rounded-lg shadow-lg flex flex-col p-3 gap-2"
          style={{ width: '60px', height: '80px', margin: 'auto', transform: "translateZ(1px)", backfaceVisibility: "hidden" }}>
          <div className="w-3/4 h-2 bg-gray-200 rounded animate-pulse"></div>
          <div className="w-full h-1.5 bg-gray-100 rounded animate-pulse delay-75"></div>
          <div className="w-full h-1.5 bg-gray-100 rounded animate-pulse delay-100"></div>
          <div className="w-5/6 h-1.5 bg-gray-100 rounded animate-pulse delay-150"></div>
          <div className="mt-auto self-end w-6 h-6 rounded-full bg-[#C8102E]/10 flex items-center justify-center">
            <div className="w-3 h-3 bg-[#C8102E] rounded-sm transform rotate-45"></div>
          </div>
        </div>

        {/* Document Body - Back */}
        <div className="absolute inset-0 bg-[#C8102E] border-2 border-[#C8102E] rounded-lg shadow-lg flex items-center justify-center p-4"
          style={{ width: '60px', height: '80px', margin: 'auto', transform: "rotateY(180deg) translateZ(1px)", backfaceVisibility: "hidden" }}>
          <div className="w-10 h-10 border-2 border-white/30 rounded-full flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
          </div>
        </div>

        {/* Floating particles/elements */}
        <div className="absolute top-0 right-0 w-3 h-3 bg-blue-400 rounded-full opacity-60 animate-bounce" style={{ animationDelay: '0.2s', transform: 'translateZ(20px)' }}></div>
        <div className="absolute bottom-0 left-0 w-2 h-2 bg-yellow-400 rounded-full opacity-60 animate-bounce" style={{ animationDelay: '0.5s', transform: 'translateZ(-10px)' }}></div>
      </div>
    </div>
    <div className="mt-4 flex flex-col items-center gap-1">
      <span className="text-[#C8102E] font-bold text-lg tracking-[0.2em] animate-pulse">LOADING</span>
      <span className="text-gray-400 text-xs uppercase tracking-widest font-medium">Fetching Proposals</span>
    </div>
  </div>
);

const Profile: React.FC = () => {
  const { user } = useAuthContext();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [projectTab, setProjectTab] = useState<"all" | "budget">("all");
  const [detailedModalOpen, setDetailedModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Proposal | null>(null);

  // Search and Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");

  // Modal states
  const [shareOpen, setShareOpen] = useState(false);
  const [shareProject, setShareProject] = useState<Project | null>(null);
  const [shareEmail, setShareEmail] = useState("");
  const [copied, setCopied] = useState(false);

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);

  const [proposals, setProposals] = useState<Project[]>([]);
  const [rawProposals, setRawProposals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Lookup Data States
  const [agencies, setAgencies] = useState<LookupItem[]>([]);
  const [sectors, setSectors] = useState<LookupItem[]>([]);
  const [disciplines, setDisciplines] = useState<LookupItem[]>([]);
  const [priorities, setPriorities] = useState<LookupItem[]>([]);
  const [stations, setStations] = useState<LookupItem[]>([]);
  const [tags, setTags] = useState<LookupItem[]>([]);
  const [departments, setDepartments] = useState<LookupItem[]>([]);

  const notifRef = React.useRef<HTMLDivElement | null>(null);

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

            // Fallback to ID descending if dates are equal (assuming auto-increment ID)
            return (Number(b.id) || 0) - (Number(a.id) || 0);
          });

        setRawProposals(myProposals);

        // Map backend proposals to frontend Project type
        const mappedProposals: Project[] = myProposals.map((p: any) => {
          let index = 1;
          switch (p.status) {
            case "endorsed_for_funding":
              index = 0;
              break;
            case "review_rnd":
              index = 1;
              break;
            case "under_evaluation":
              index = 1;
              break; // Mapped to R&D Evaluation as requested
            case "revision_rnd":
              index = 3;
              break;
            case "funded":
              index = 4;
              break;
            case "rejected_rnd":
              index = 5;
              break;
            default:
              index = 1;
          }

          // Calculate budget
          const budgetTotal = p.estimated_budget?.reduce((sum: number, item: any) => sum + (item.amount || 0), 0) || 0;
          const budgetStr = `₱${budgetTotal.toLocaleString()}`;

          return {
            id: String(p.id),
            title: p.project_title,
            currentIndex: index,
            rawStatus: p.status, // IMPORTANT: Store raw status
            submissionDate: new Date(p.created_at).toISOString().split("T")[0],
            lastUpdated: new Date(p.updated_at || p.created_at).toISOString().split("T")[0],
            budget: budgetStr,
            duration: p.duration || "N/A",
            priority: "medium",
            evaluators: p.proposal_evaluators?.length || 0,
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

  // Fetch Lookups
  React.useEffect(() => {
    const loadLookups = async () => {
      try {
        const [agenciesData, sectorsData, disciplinesData, prioritiesData, stationsData, tagsData, departmentsData] =
          await Promise.all([
            fetchAgencies(),
            fetchSectors(),
            fetchDisciplines(),
            fetchPriorities(),
            fetchStations(),
            fetchTags(),
            fetchDepartments(),
          ]);

        setAgencies(agenciesData);
        setSectors(sectorsData);
        setDisciplines(disciplinesData);
        setPriorities(prioritiesData);
        setStations(stationsData);
        setTags(tagsData);
        setDepartments(departmentsData);
      } catch (error) {
        console.error("Failed to fetch lookup data:", error);
      }
    };
    loadLookups();
  }, []);

  // Close notifications when clicking outside
  React.useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!notifRef.current) return;
      if (!notifRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false);
      }
    };

    if (notificationsOpen) {
      document.addEventListener("mousedown", onDocClick);
    }

    return () => document.removeEventListener("mousedown", onDocClick);
  }, [notificationsOpen]);

  // Compute counts based on rawStatus for accuracy
  const pendingCount = proposals.filter((p) => (p as any).rawStatus === "pending").length;
  const rdEvalCount = proposals.filter((p) => ["review_rnd", "r&d evaluation"].includes((p as any).rawStatus || "")).length;
  const evaluatorsAssessmentCount = proposals.filter((p) => ["under_evaluation", "evaluators assessment"].includes((p as any).rawStatus || "")).length;
  const revisionCount = proposals.filter((p) => ["revision_rnd", "revise", "revision"].includes((p as any).rawStatus || "")).length;
  const fundedCount = proposals.filter((p) => (p as any).rawStatus === "endorsed_for_funding").length;


  // Helper to generate tags based on raw data
  const getProjectTags = (id: string | number) => {
    // Find raw proposal
    const raw = rawProposals.find((p) => String(p.id) === String(id));
    if (!raw) return [];

    const tags: string[] = [];

    // 1. Classification - REMOVED per user request (only show actual tags)
    // if (raw.classification_type === 'research_class' && raw.research_class) {
    //   tags.push(raw.research_class);
    // } else if (raw.classification_type === 'development_class' && raw.development_class) {
    //   tags.push(raw.development_class);
    // }

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

  // Local Helpers for Status Display
  const getLocalStatusLabel = (project: any) => {
    const s = ((project as any).rawStatus || "").toLowerCase();
    if (s === "pending") return "Pending";
    if (["revise", "revision", "revision_rnd"].includes(s)) return "Revision Required";
    if (["review_rnd", "r&d evaluation"].includes(s)) return "Under R&D Evaluation";
    if (["under_evaluation", "evaluators assessment"].includes(s)) return "Under Evaluators Assessment";
    return getStatusLabelByIndex(project.currentIndex);
  };

  const getLocalStatusColor = (project: any) => {
    const s = ((project as any).rawStatus || "").toLowerCase();
    if (s === "pending") return "bg-orange-100 text-orange-800 border border-orange-300";
    if (["revise", "revision", "revision_rnd"].includes(s)) return "bg-orange-50 text-orange-800 border border-orange-200";
    if (["review_rnd", "r&d evaluation"].includes(s)) return "bg-blue-100 text-blue-800 border border-blue-300";
    if (["under_evaluation", "evaluators assessment"].includes(s)) return "bg-purple-100 text-purple-800 border border-purple-300";
    return getStatusColorByIndex(project.currentIndex);
  };

  const getLocalProgress = (project: any) => {
    const s = ((project as any).rawStatus || "").toLowerCase();
    // Match the modal: if pending or revise, progress is 0% (or stalled)
    if (s === "pending") return 0;
    if (["revise", "revision", "revision_rnd"].includes(s)) return 0;
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
    const targetSuffix = !isNewUser ? '!' : '';

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
  const openShare = (project: Project) => {
    setShareProject(project);
    setShareOpen(true);
    setCopied(false);
    setShareEmail("");
  };

  const closeShare = () => {
    setShareOpen(false);
    setShareProject(null);
    setShareEmail("");
    setCopied(false);
  };

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
      schoolYear: val(raw.school_year),
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
      duration: val(raw.duration) ? `${raw.duration} months` : "", // Appending 'months' as likely usually stored as num
      startDate: val(raw.plan_start_date),
      endDate: val(raw.plan_end_date),
      budgetSources: budgetSources,
      budgetTotal: project.budget,
      uploadedFile:
        Array.isArray(raw.proposal_version) && raw.proposal_version.length > 0
          ? raw.proposal_version[raw.proposal_version.length - 1].file_url
          : "",
      lastUpdated: val(raw.updated_at) || val(raw.created_at),
      deadline: getStatusFromIndex(project.currentIndex) === "revise" ? val(raw.evaluation_deadline_at) : undefined,
    };

    setSelectedProject(proposal);
    setDetailedModalOpen(true);
  };

  const handleUpdateProposal = (updatedProposal: Proposal) => {
    console.log("Updated proposal:", updatedProposal);
    setDetailedModalOpen(false);
  };

  const toggleNotifications = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setNotificationsOpen((v) => !v);
  };

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const copyLink = async () => {
    if (!shareProject) return;
    const url = `${window.location.origin}/projects/${shareProject.id}`;

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      // ignore
    }
  };

  const inviteEmail = () => {
    if (!shareEmail || !shareProject) return;
    setShareEmail("");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Filtering Logic
  const fundedProjects = proposals.filter((p) => (p as any).rawStatus === "endorsed_for_funding");
  const baseProjects = projectTab === "all" ? proposals : fundedProjects;

  const filteredProjects = baseProjects.filter((project: Project) => {
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase());
    const status = getLocalStatusLabel(project);
    const matchesStatus = typeFilter === "All" || status === typeFilter;

    return matchesSearch && matchesStatus;
  });

  // Project Portfolio rendering functions
  const renderGridView = () => (
    <div className="p-4 lg:p-6">
      {loading ? (
        <Loader3D />
      ) : filteredProjects.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>No projects found matching your criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
          {filteredProjects.map((project) => {
            const progress = getLocalProgress(project);
            const statusLabel = getLocalStatusLabel(project);
            const tags = getProjectTags(project.id);

            return (
              <div
                key={project.id}
                className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-4 lg:p-6 border-2 border-gray-200 hover:border-[#C8102E] hover:shadow-lg transition-all duration-300 cursor-pointer group flex flex-col"
                onClick={() => handleCardClick(project)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-gray-800 text-sm lg:text-base group-hover:text-[#C8102E] transition-colors line-clamp-2">
                      {project.title}
                    </h4>
                  </div>
                  {/* Removed Priority Badge */}
                </div>

                {/* --- TAGS SECTION (Above Budget) --- */}
                <div className="flex flex-wrap gap-2 mb-3">
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

                <div className="mb-3">
                  <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                    <span>Progress</span>
                    <span className="text-xs text-gray-600 font-medium hidden sm:inline">{progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-[#C8102E] h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getLocalStatusColor(project)}`}
                    >
                      {statusLabel}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openShare(project);
                      }}
                      className="flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-gray-200 text-gray-700 hover:bg-[#fff5f6] hover:border-[#C8102E] transition-colors text-xs"
                      title="Share project"
                    >
                      <FaShareAlt className="text-sm text-gray-600" />
                    </button>
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
            {projectTab === "budget" && (
              <th className="text-left font-semibold text-gray-700 px-4 lg:px-6 py-3 text-sm">Approved Amount</th>
            )}
            <th className="text-left font-semibold text-gray-700 px-4 lg:px-6 py-3 text-sm">Progress</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {loading ? (
            <tr>
              <td colSpan={6} className="px-6 py-12">
                <Loader3D />
              </td>
            </tr>
          ) : filteredProjects.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                No projects found.
              </td>
            </tr>
          ) : (
            filteredProjects.map((project) => {
              const progress = getProgressPercentageByIndex(project.currentIndex);
              const statusLabel = getStatusLabelByIndex(project.currentIndex);
              const tags = getProjectTags(project.id);

              return (
                <tr
                  key={project.id}
                  className="hover:bg-gray-50 transition-colors cursor-pointer group"
                  onClick={() => handleCardClick(project)}
                >
                  <td className="px-4 lg:px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-[#C8102E] group-hover:text-white transition-colors">
                        {getStageIcon(project.currentIndex)}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-800 group-hover:text-[#C8102E] transition-colors text-sm lg:text-base">
                          {project.title}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          {/* Removed Priority Badge from List View */}
                          {/* Tags in List View */}
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
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColorByIndex(project.currentIndex)}`}
                    >
                      {statusLabel}
                    </span>
                  </td>
                  <td className="px-4 lg:px-6 py-4 text-gray-600 font-medium hidden lg:table-cell">{project.budget}</td>
                  <td className="px-4 lg:px-6 py-4 text-gray-600 text-sm hidden md:table-cell">{project.duration}</td>
                  {projectTab === "budget" && (
                    <td className="px-4 lg:px-6 py-4 text-green-700 font-semibold">{project.budget}</td>
                  )}
                  <td className="px-4 lg:px-6 py-4">
                    <div className="flex items-center gap-2 justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-16 lg:w-20 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-[#C8102E] h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                        <span className="font-semibold">{progress}%</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openShare(project);
                          }}
                          className="flex items-center gap-2 px-2 py-1 rounded-md bg-white border border-gray-200 text-gray-700 hover:bg-[#fff5f6] hover:border-[#C8102E] transition-colors text-xs"
                          title="Share project"
                        >
                          <FaShareAlt className="text-sm text-gray-600" />
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
      {/* Header Section */}
      <header className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-[#C8102E] to-[#E03A52] flex items-center justify-center shadow-lg">
              <FaUsers className="text-white text-2xl" />
            </div>

            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-[#C8102E] mb-1 min-h-[40px]">
                {displayedText.prefix}
                <span className="text-black">{displayedText.name}</span>
                {displayedText.suffix}
              </h1>
              <p className="text-gray-600 text-sm lg:text-base">
                Monitor your research proposals through the entire lifecycle
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Notification bell */}
            <div className="relative z-40" ref={notifRef}>
              <button
                onClick={toggleNotifications}
                className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-700"
                title="Notifications"
              >
                <FaBell className="text-lg" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-medium leading-none text-white bg-red-600 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </button>

              <NotificationsDropdown
                isOpen={notificationsOpen}
                notifications={notifications}
                unreadCount={unreadCount}
                onClose={() => setNotificationsOpen(false)}
                onMarkAllRead={markAllRead}
                onMarkRead={markRead}
                onViewAll={() => setNotificationsOpen(false)}
              />
            </div>

            {/* View Mode Toggle */}
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
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3 lg:gap-4">
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
          <div className="bg-orange-50 shadow-xl rounded-2xl border border-orange-300 p-4 transition-all duration-300 hover:shadow-lg hover:scale-105 group cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-700 mb-2">Pending</p>
                <p className="text-xl font-bold text-orange-600 tabular-nums">{pendingCount}</p>
              </div>
              <Clock className="w-6 h-6 text-orange-500 group-hover:scale-110 transition-transform duration-300" />
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

          {/* R&D Evaluation Card */}
          {/* Duplicate removed */}

          {/* Evaluators Assessment Card */}
          <div className="bg-purple-50 shadow-xl rounded-2xl border border-purple-300 p-4 transition-all duration-300 hover:shadow-lg hover:scale-105 group cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-700 mb-2">Evaluators Assessment</p>
                <p className="text-xl font-bold text-purple-600 tabular-nums">{evaluatorsAssessmentCount}</p>
              </div>
              <ClipboardCheck className="w-6 h-6 text-purple-500 group-hover:scale-110 transition-transform duration-300" />
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
              <Award className="w-6 h-6 text-green-500 group-hover:scale-110 transition-transform duration-300" />
            </div>
          </div>
        </div>
      </header>

      {/* All Projects Section */}
      <section>
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 lg:px-6 py-4 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="text-lg lg:text-xl font-bold text-gray-800 flex items-center gap-2">
                  <FaListAlt className="text-[#C8102E]" />
                  Project Portfolio
                </h3>
                <p className="text-sm text-gray-600 mt-1">Complete overview of all your research proposals</p>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Funded</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span>In Progress</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs & Search Filter Row */}
          <div className="px-4 lg:px-6 py-3 border-b border-gray-100 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setProjectTab("all")}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${projectTab === "all" ? "bg-[#C8102E] text-white" : "text-gray-700 hover:bg-gray-50"
                  }`}
              >
                All Projects
              </button>
              <button
                onClick={() => setProjectTab("budget")}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${projectTab === "budget" ? "bg-[#C8102E] text-white" : "text-gray-700 hover:bg-gray-50"
                  }`}
              >
                Funded Project ({fundedProjects.length})
              </button>
            </div>

            {/* SEARCH & FILTER CONTROLS */}
            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E] transition-colors"
                />
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                  <Filter className="h-3 w-3 text-slate-400" />
                </div>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="appearance-none bg-white pl-8 pr-8 py-1.5 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E] cursor-pointer"
                >
                  <option value="All">All Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="Under R&D Evaluation">Under R&D Evaluation</option>
                  <option value="Under Evaluators Assessment">Under Evaluators Assessment</option>
                  <option value="Revision Required">Revision Required</option>
                  <option value="Endorsed for Funding">Endorsed for Funding</option>
                  <option value="Funded">Funded</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
            </div>
          </div>

          {/* Project Portfolio View */}
          {viewMode === "grid" ? renderGridView() : renderListView()}
        </div>
      </section>

      {/* Modals */}
      <ShareModal
        isOpen={shareOpen}
        project={shareProject}
        shareEmail={shareEmail}
        copied={copied}
        onClose={closeShare}
        onEmailChange={setShareEmail}
        onCopyLink={copyLink}
        onInviteEmail={inviteEmail}
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
    </div>
  );
};

export default Profile;
