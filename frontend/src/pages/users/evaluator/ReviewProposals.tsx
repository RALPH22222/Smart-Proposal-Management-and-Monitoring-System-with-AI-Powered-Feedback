import { useState } from "react";
import {
  FileText,
  Eye,
  Search,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  User,
  Clock,
  Tag,
  X,
  Building2,
  Users,
  Target,
  DollarSign,
  Calendar,
  MessageSquare,
  Download,
  Filter,
} from "lucide-react";
import Sidebar from "../../../components/EvaluatorSide";

export default function EndorsedProposals() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [selectedProposal, setSelectedProposal] = useState<number | null>(null);
  const [comments, setComments] = useState({
    objectives: "",
    methodology: "",
    budget: "",
    timeline: "",
    overall: "",
  });

  const endorsedProposals = [
    {
      id: 1,
      title: "AI-Powered Educational Assessment System",
      reviewDeadline: "Oct 25, 2025",
      description:
        "Development of AI system for automated assessment and personalized learning recommendations",
      proponent: "Jasmine Anderson",
      projectType: "ICT",
      agency: "Western Mindanao State University",
      cooperatingAgencies: "DepEd RO9, CHED RO9, DICT RO9",
      rdStation: "College of Computing Studies",
      classification: "Applied Research",
      sector: "Education Technology",
      discipline: "Information and Communication Technology",
      duration: "24 months",
      startDate: "January 2025",
      endDate: "December 2026",
      budgetSources: [
        {
          source: "DOST",
          ps: "₱600,000.00",
          mooe: "₱500,000.00",
          co: "₱150,000.00",
          total: "₱1,250,000.00",
        },
      ],
      budgetTotal: "₱1,250,000.00",
      projectFile: "AI_Educational_Assessment_Proposal.pdf",
    },
    {
      id: 2,
      title: "Smart Grid Energy Management System",
      reviewDeadline: "Oct 28, 2025",
      description:
        "Advanced energy management system for smart grid optimization and efficiency",
      proponent: "Michael Chen",
      projectType: "Energy",
      agency: "Zamboanga State College of Marine Sciences",
      cooperatingAgencies: "DA RO9, DTI RO9, LGU Zamboanga",
      rdStation: "Agricultural Research Center",
      classification: "Development",
      sector: "Agriculture and Fisheries",
      discipline: "Agricultural Engineering",
      duration: "36 months",
      startDate: "March 2025",
      endDate: "February 2028",
      budgetSources: [
        {
          source: "DOST",
          ps: "₱800,000.00",
          mooe: "₱700,000.00",
          co: "₱100,000.00",
          total: "₱1,600,000.00",
        },
        {
          source: "DA RO9",
          ps: "₱300,000.00",
          mooe: "₱200,000.00",
          co: "₱0.00",
          total: "₱500,000.00",
        },
      ],
      budgetTotal: "₱2,100,000.00",
      projectFile: "Agriculture_IoT_Proposal.pdf",
    },
    {
      id: 3,
      title: "Blockchain-Based Energy Trading Platform",
      reviewDeadline: "Oct 22, 2025",
      description:
        "Secure blockchain system for peer-to-peer energy trading and management",
      proponent: "Emily Rodriguez",
      projectType: "Energy",
      agency: "Zamboanga City Medical Center",
      cooperatingAgencies: "DOH RO9, PhilHealth RO9, DICT RO9",
      rdStation: "Medical Informatics Department",
      classification: "Applied Research",
      sector: "Health and Wellness",
      discipline: "Health Information Technology",
      duration: "30 months",
      startDate: "February 2025",
      endDate: "July 2027",
      budgetSources: [
        {
          source: "DOST",
          ps: "₱700,000.00",
          mooe: "₱800,000.00",
          co: "₱300,000.00",
          total: "₱1,800,000.00",
        },
      ],
      budgetTotal: "₱1,800,000.00",
      projectFile: "Blockchain_Healthcare_Proposal.pdf",
    },
    {
      id: 4,
      title: "Renewable Energy Storage Optimization",
      reviewDeadline: "Oct 30, 2025",
      description:
        "Advanced battery management system for solar and wind energy storage facilities",
      proponent: "James Wilson",
      projectType: "Energy",
      agency: "Mindanao State University",
      cooperatingAgencies: "DOE RO9, NEDA RO9, Private Sector Partners",
      rdStation: "Renewable Energy Research Lab",
      classification: "Development",
      sector: "Energy and Power",
      discipline: "Electrical Engineering",
      duration: "24 months",
      startDate: "April 2025",
      endDate: "March 2027",
      budgetSources: [
        {
          source: "DOST",
          ps: "₱1,200,000.00",
          mooe: "₱800,000.00",
          co: "₱300,000.00",
          total: "₱2,300,000.00",
        },
        {
          source: "DOE RO9",
          ps: "₱100,000.00",
          mooe: "₱100,000.00",
          co: "₱0.00",
          total: "₱200,000.00",
        },
      ],
      budgetTotal: "₱2,500,000.00",
      projectFile: "Energy_Storage_Proposal.pdf",
    },
    {
      id: 5,
      title: "IoT Sensor Network for Energy Efficiency",
      reviewDeadline: "Nov 2, 2025",
      description:
        "Distributed IoT network for real-time energy consumption monitoring and optimization",
      proponent: "Maria Santos",
      projectType: "ICT",
      agency: "Western Mindanao State University",
      cooperatingAgencies: "DENR RO9, BFAR RO9, LGU Coastal Areas",
      rdStation: "Marine Biology Research Center",
      classification: "Applied Research",
      sector: "Environment and Natural Resources",
      discipline: "Marine Science",
      duration: "36 months",
      startDate: "January 2025",
      endDate: "December 2027",
      budgetSources: [
        {
          source: "DOST",
          ps: "₱900,000.00",
          mooe: "₱750,000.00",
          co: "₱200,000.00",
          total: "₱1,850,000.00",
        },
        {
          source: "DENR RO9",
          ps: "₱50,000.00",
          mooe: "₱50,000.00",
          co: "₱0.00",
          total: "₱100,000.00",
        },
      ],
      budgetTotal: "₱1,950,000.00",
      projectFile: "Marine_Conservation_Proposal.pdf",
    },
    {
      id: 6,
      title: "AI-Driven Smart Building Systems",
      reviewDeadline: "Oct 20, 2025",
      description:
        "Intelligent building management system using AI for energy optimization",
      proponent: "Robert Kim",
      projectType: "ICT",
      agency: "Ateneo de Zamboanga University",
      cooperatingAgencies: "DILG RO9, LTO RO9, PNP RO9",
      rdStation: "Urban Planning Research Institute",
      classification: "Development",
      sector: "Public Safety and Security",
      discipline: "Civil Engineering and ICT",
      duration: "24 months",
      startDate: "May 2025",
      endDate: "April 2027",
      budgetSources: [
        {
          source: "DOST",
          ps: "₱1,500,000.00",
          mooe: "₱1,200,000.00",
          co: "₱300,000.00",
          total: "₱3,000,000.00",
        },
        {
          source: "DILG RO9",
          ps: "₱100,000.00",
          mooe: "₱100,000.00",
          co: "₱0.00",
          total: "₱200,000.00",
        },
      ],
      budgetTotal: "₱3,200,000.00",
      projectFile: "Smart_Traffic_Proposal.pdf",
    },
    {
      id: 7,
      title: "Microgrid Control System Development",
      reviewDeadline: "Nov 5, 2025",
      description:
        "Advanced control system for autonomous microgrid operations",
      proponent: "Dr. Lisa Martinez",
      projectType: "Energy",
      agency: "Zamboanga Peninsula Medical Center",
      cooperatingAgencies: "DOH RO9, DICT RO9, PhilHealth RO9",
      rdStation: "Telemedicine Research Unit",
      classification: "Development",
      sector: "Health and Wellness",
      discipline: "Medical Technology and ICT",
      duration: "30 months",
      startDate: "March 2025",
      endDate: "August 2027",
      budgetSources: [
        {
          source: "DOST",
          ps: "₱1,200,000.00",
          mooe: "₱1,050,000.00",
          co: "₱300,000.00",
          total: "₱2,550,000.00",
        },
        {
          source: "DOH RO9",
          ps: "₱150,000.00",
          mooe: "₱50,000.00",
          co: "₱0.00",
          total: "₱200,000.00",
        },
      ],
      budgetTotal: "₱2,750,000.00",
      projectFile: "Telemedicine_Proposal.pdf",
    },
    {
      id: 8,
      title: "Machine Learning for Energy Forecasting",
      reviewDeadline: "Oct 18, 2025",
      description:
        "ML-based predictive model for renewable energy generation forecasting",
      proponent: "Prof. Daniel Lee",
      projectType: "ICT",
      agency: "Mindanao State University",
      cooperatingAgencies: "PAGASA RO9, DENR RO9, NEDA RO9",
      rdStation: "Climate Science Research Center",
      classification: "Basic Research",
      sector: "Environment and Climate",
      discipline: "Atmospheric Science and Data Science",
      duration: "36 months",
      startDate: "February 2025",
      endDate: "January 2028",
      budgetSources: [
        {
          source: "DOST",
          ps: "₱1,100,000.00",
          mooe: "₱900,000.00",
          co: "₱200,000.00",
          total: "₱2,200,000.00",
        },
        {
          source: "PAGASA RO9",
          ps: "₱50,000.00",
          mooe: "₱50,000.00",
          co: "₱0.00",
          total: "₱100,000.00",
        },
      ],
      budgetTotal: "₱2,300,000.00",
      projectFile: "Climate_Prediction_Proposal.pdf",
    },
  ];

  const filtered = endorsedProposals.filter((p) => {
    const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === "All" || p.projectType === typeFilter;
    return matchesSearch && matchesType;
  });

  const sortedFiltered = [...filtered].sort((a, b) => {
    const dateA = new Date(a.reviewDeadline).getTime();
    const dateB = new Date(b.reviewDeadline).getTime();
    return dateA - dateB;
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

  const handleReviewClick = (proposalId: number) => {
    setSelectedProposal(proposalId);
  };

  const closeModal = () => {
    setSelectedProposal(null);
    setComments({
      objectives: "",
      methodology: "",
      budget: "",
      timeline: "",
      overall: "",
    });
  };

  const handleSubmitReview = () => {
    console.log(
      "[v0] Submitting review for proposal",
      selectedProposal,
      comments
    );
    closeModal();
  };

  const handleDownload = (fileName: string) => {
    console.log("[v0] Downloading file:", fileName);
    alert(`Downloading ${fileName}`);
  };

  const proposal = endorsedProposals.find((p) => p.id === selectedProposal);

  return (
    <div className="bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen lg:h-screen flex flex-col lg:flex-row gap-0 lg:gap-6">
      <Sidebar />

      <div className="flex-1 flex flex-col gap-4 sm:gap-6 p-4 sm:p-6 overflow-hidden pt-16 lg:pt-6">
        <header className="flex-shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#C8102E] leading-tight">
                Review Proposals
              </h1>
              <p className="text-slate-600 mt-2 text-sm leading-relaxed">
                Track proposals that have been submitted for evaluation review.
              </p>
            </div>
          </div>
        </header>

        <section
          className="flex-shrink-0"
          aria-label="Filter endorsed proposals"
        >
          <div className="bg-white shadow-xl rounded-2xl border border-slate-200 p-4">
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <div className="relative flex-1 max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search
                    className="h-4 w-4 text-slate-400"
                    aria-hidden="true"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Search proposals..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-[#C8102E] transition-colors"
                  aria-label="Search endorsed proposals"
                />
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Filter
                    className="h-4 w-4 text-slate-400"
                    aria-hidden="true"
                  />
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
                </select>
              </div>
            </div>

            <div className="mt-4 text-xs text-slate-600">
              Showing {sortedFiltered.length} of {endorsedProposals.length}{" "}
              proposals for review
            </div>
          </div>
        </section>

        <main className="bg-white shadow-xl rounded-2xl border border-slate-200 overflow-hidden flex-1 flex flex-col">
          <div className="p-4 border-b border-slate-200 bg-slate-50">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#C8102E]" />
                Review Proposals
              </h3>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <CheckCircle className="w-4 h-4" />
                <span>{endorsedProposals.length} total for review</span>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {paginatedProposals.length > 0 ? (
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

                          <p className="text-xs text-slate-600 mb-3 line-clamp-2 leading-relaxed">
                            {proposal.description}
                          </p>

                          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                            <div className="flex items-center gap-1.5">
                              <User className="w-3 h-3" />
                              <span>{proposal.proponent}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-red-600 font-semibold">
                              <Clock className="w-3 h-3" />
                              <span>Review by: {proposal.reviewDeadline}</span>
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
                            onClick={() => handleReviewClick(proposal.id)}
                            className="inline-flex items-center justify-center gap-1 px-4 h-8 rounded-lg bg-[#C8102E] text-white hover:bg-[#A00E26] hover:scale-105 transition-all text-xs font-medium cursor-pointer"
                          >
                            <Eye className="w-3 h-3" />
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
                <h3 className="text-lg font-medium text-slate-900 mb-2">
                  No proposals found
                </h3>
                <p className="text-slate-500 max-w-sm mx-auto">
                  {search
                    ? "Try adjusting your search criteria."
                    : "No proposals are available for review yet."}
                </p>
              </div>
            )}
          </div>

          <div className="p-4 bg-slate-50 border-t border-slate-200 flex-shrink-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-xs text-slate-600">
              <span>
                Showing {startIndex + 1}-
                {Math.min(startIndex + itemsPerPage, filtered.length)} of{" "}
                {filtered.length} proposals
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
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

      {selectedProposal && proposal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-4 sm:p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {proposal.title}
                </h2>
                <p className="text-sm text-slate-600 mt-1">
                  Review and provide feedback
                </p>
              </div>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <div className="space-y-4 sm:space-y-6">
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        Project Proposal Document
                      </p>
                      <p className="text-xs text-slate-600">
                        {proposal.projectFile}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDownload(proposal.projectFile)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                </div>

                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                  <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-[#C8102E]" />
                    Project Information
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-600">Leader:</span>
                      <p className="font-semibold text-slate-900">
                        {proposal.proponent}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-600">Agency:</span>
                      <p className="font-semibold text-slate-900">
                        {proposal.agency}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                  <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#C8102E]" />
                    Cooperating Agencies
                  </h3>
                  <p className="text-xs text-slate-700">
                    {proposal.cooperatingAgencies}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                    <h3 className="text-sm font-bold text-slate-900 mb-2">
                      R&D Station
                    </h3>
                    <p className="text-xs text-slate-700">
                      {proposal.rdStation}
                    </p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                    <h3 className="text-sm font-bold text-slate-900 mb-2">
                      Classification
                    </h3>
                    <p className="text-xs text-slate-700">
                      {proposal.classification}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                    <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                      <Target className="w-4 h-4 text-[#C8102E]" />
                      Sector/Commodity
                    </h3>
                    <p className="text-xs text-slate-700">{proposal.sector}</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                    <h3 className="text-sm font-bold text-slate-900 mb-2">
                      Discipline
                    </h3>
                    <p className="text-xs text-slate-700">
                      {proposal.discipline}
                    </p>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                  <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#C8102E]" />
                    Implementing Schedule
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <span className="text-slate-600">Duration:</span>
                      <p className="font-semibold text-slate-900">
                        {proposal.duration}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-600">Start Date:</span>
                      <p className="font-semibold text-slate-900">
                        {proposal.startDate}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-600">End Date:</span>
                      <p className="font-semibold text-slate-900">
                        {proposal.endDate}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                  <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-[#C8102E]" />
                    Estimated Budget by Source
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-100">
                          <th className="border border-slate-300 px-3 py-2 text-left font-semibold text-slate-700">
                            Source of Funds
                          </th>
                          <th className="border border-slate-300 px-3 py-2 text-right font-semibold text-slate-700">
                            PS
                          </th>
                          <th className="border border-slate-300 px-3 py-2 text-right font-semibold text-slate-700">
                            MOOE
                          </th>
                          <th className="border border-slate-300 px-3 py-2 text-right font-semibold text-slate-700">
                            CO
                          </th>
                          <th className="border border-slate-300 px-3 py-2 text-right font-semibold text-slate-700">
                            TOTAL
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {proposal.budgetSources.map((budget, index) => (
                          <tr key={index} className="hover:bg-slate-50">
                            <td className="border border-slate-300 px-3 py-2 font-medium text-slate-800">
                              {budget.source}
                            </td>
                            <td className="border border-slate-300 px-3 py-2 text-right text-slate-700">
                              {budget.ps}
                            </td>
                            <td className="border border-slate-300 px-3 py-2 text-right text-slate-700">
                              {budget.mooe}
                            </td>
                            <td className="border border-slate-300 px-3 py-2 text-right text-slate-700">
                              {budget.co}
                            </td>
                            <td className="border border-slate-300 px-3 py-2 text-right font-semibold text-slate-800">
                              {budget.total}
                            </td>
                          </tr>
                        ))}
                        <tr className="bg-slate-200 font-bold">
                          <td className="border border-slate-300 px-3 py-2 text-slate-900">
                            TOTAL
                          </td>
                          <td
                            className="border border-slate-300 px-3 py-2 text-right text-slate-900"
                            colSpan={3}
                          >
                            →
                          </td>
                          <td className="border border-slate-300 px-3 py-2 text-right text-[#C8102E] text-sm">
                            {proposal.budgetTotal}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    PS: Personal Services | MOOE: Maintenance and Other
                    Operating Expenses | CO: Capital Outlay
                  </p>
                </div>

                <div className="border-t-2 border-slate-300 pt-6 mt-6">
                  <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-[#C8102E]" />
                    Evaluator Comments
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-900 mb-2">
                        Objectives Assessment
                      </label>
                      <textarea
                        value={comments.objectives}
                        onChange={(e) =>
                          setComments({
                            ...comments,
                            objectives: e.target.value,
                          })
                        }
                        placeholder="Provide feedback on the project objectives..."
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-[#C8102E] resize-none"
                        rows={3}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-900 mb-2">
                        Methodology Assessment
                      </label>
                      <textarea
                        value={comments.methodology}
                        onChange={(e) =>
                          setComments({
                            ...comments,
                            methodology: e.target.value,
                          })
                        }
                        placeholder="Provide feedback on the research methodology..."
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-[#C8102E] resize-none"
                        rows={3}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-900 mb-2">
                        Budget Assessment
                      </label>
                      <textarea
                        value={comments.budget}
                        onChange={(e) =>
                          setComments({ ...comments, budget: e.target.value })
                        }
                        placeholder="Provide feedback on the budget allocation..."
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-[#C8102E] resize-none"
                        rows={3}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-900 mb-2">
                        Timeline Assessment
                      </label>
                      <textarea
                        value={comments.timeline}
                        onChange={(e) =>
                          setComments({ ...comments, timeline: e.target.value })
                        }
                        placeholder="Provide feedback on the project timeline..."
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-[#C8102E] resize-none"
                        rows={3}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-900 mb-2">
                        Overall Assessment
                      </label>
                      <textarea
                        value={comments.overall}
                        onChange={(e) =>
                          setComments({ ...comments, overall: e.target.value })
                        }
                        placeholder="Provide overall feedback and recommendations..."
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-[#C8102E] resize-none"
                        rows={4}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-6 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitReview}
                className="px-4 py-2 text-sm font-medium text-white bg-[#C8102E] rounded-lg hover:bg-[#A00E26] transition-colors"
              >
                Submit Review
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
