import { useState } from "react"
import {
  FileText,
  Eye,
  User,
  Calendar,
  Search,
  Filter,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  Clock,
  Tag,
  X,
  Building2,
  Users,
  Target,
  DollarSign,
} from "lucide-react"
import Sidebar from "../../../components/EvaluatorSide"

export default function Proposals() {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("All")
  const [typeFilter, setTypeFilter] = useState("All")
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedProposal, setSelectedProposal] = useState<number | null>(null)
  const itemsPerPage = 5

  const proposals = [
    {
      id: 1,
      title: "AI Research on Education",
      proponent: "John Doe",
      status: "accepted",
      deadline: "Oct 15, 2025",
      description: "Comprehensive study on AI applications in educational systems",
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
      budget: "₱1,250,000.00",
    },
    {
      id: 2,
      title: "Sustainable Farming Proposal",
      proponent: "Jane Smith",
      status: "pending",
      deadline: "Oct 20, 2025",
      description: "Initiative for implementing eco-friendly farming practices",
      projectType: "Agriculture",
      agency: "Zamboanga State College of Marine Sciences",
      cooperatingAgencies: "DA RO9, DTI RO9, LGU Zamboanga",
      rdStation: "Agricultural Research Center",
      classification: "Development",
      sector: "Agriculture and Fisheries",
      discipline: "Agricultural Engineering",
      duration: "36 months",
      startDate: "March 2025",
      endDate: "February 2028",
      budget: "₱2,100,000.00",
    },
    {
      id: 3,
      title: "Blockchain in Healthcare",
      proponent: "Michael Lee",
      status: "rejected",
      deadline: "Oct 10, 2025",
      description: "Proposal for blockchain integration in healthcare data management",
      projectType: "Healthcare",
      agency: "Zamboanga City Medical Center",
      cooperatingAgencies: "DOH RO9, PhilHealth RO9, DICT RO9",
      rdStation: "Medical Informatics Department",
      classification: "Applied Research",
      sector: "Health and Wellness",
      discipline: "Health Information Technology",
      duration: "30 months",
      startDate: "February 2025",
      endDate: "July 2027",
      budget: "₱1,800,000.00",
    },
    {
      id: 4,
      title: "Quantum Computing Research",
      proponent: "Dr. Sarah Chen",
      status: "pending",
      deadline: "Oct 25, 2025",
      description: "Advanced quantum computing algorithms for cryptography",
      projectType: "ICT",
      agency: "Mindanao State University",
      cooperatingAgencies: "DOST RO9, DICT RO9, Private Sector",
      rdStation: "Computer Science Research Lab",
      classification: "Basic Research",
      sector: "Information Technology",
      discipline: "Computer Science",
      duration: "24 months",
      startDate: "April 2025",
      endDate: "March 2027",
      budget: "₱2,500,000.00",
    },
    {
      id: 5,
      title: "Renewable Energy Storage",
      proponent: "David Wilson",
      status: "accepted",
      deadline: "Oct 18, 2025",
      description: "Next-generation battery technology for renewable energy",
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
      budget: "₱2,500,000.00",
    },
    {
      id: 6,
      title: "Neural Network Optimization",
      proponent: "Lisa Park",
      status: "pending",
      deadline: "Oct 22, 2025",
      description: "Optimization techniques for deep neural networks",
      projectType: "ICT",
      agency: "Ateneo de Zamboanga University",
      cooperatingAgencies: "DOST RO9, DICT RO9",
      rdStation: "AI Research Center",
      classification: "Applied Research",
      sector: "Artificial Intelligence",
      discipline: "Computer Science and Mathematics",
      duration: "18 months",
      startDate: "May 2025",
      endDate: "October 2026",
      budget: "₱1,500,000.00",
    },
    {
      id: 7,
      title: "Smart City Infrastructure",
      proponent: "Alex Johnson",
      status: "pending",
      deadline: "Oct 28, 2025",
      description: "IoT-based infrastructure for smart city development",
      projectType: "Public Safety",
      agency: "Ateneo de Zamboanga University",
      cooperatingAgencies: "DILG RO9, LTO RO9, PNP RO9",
      rdStation: "Urban Planning Research Institute",
      classification: "Development",
      sector: "Public Safety and Security",
      discipline: "Civil Engineering and ICT",
      duration: "24 months",
      startDate: "May 2025",
      endDate: "April 2027",
      budget: "₱3,200,000.00",
    },
    {
      id: 8,
      title: "Medical AI Diagnostics",
      proponent: "Dr. Emma White",
      status: "rejected",
      deadline: "Oct 12, 2025",
      description: "AI-powered diagnostic system for early disease detection",
      projectType: "Healthcare",
      agency: "Zamboanga Peninsula Medical Center",
      cooperatingAgencies: "DOH RO9, DICT RO9, PhilHealth RO9",
      rdStation: "Medical AI Research Unit",
      classification: "Applied Research",
      sector: "Health and Wellness",
      discipline: "Medical Technology and ICT",
      duration: "30 months",
      startDate: "March 2025",
      endDate: "August 2027",
      budget: "₱2,750,000.00",
    },
  ]

  const filtered = proposals.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(search.toLowerCase()) || p.proponent.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === "All" || p.status === statusFilter
    const matchesType = typeFilter === "All" || p.projectType === typeFilter
    return matchesSearch && matchesStatus && matchesType
  })

  const totalPages = Math.ceil(filtered.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedProposals = filtered.slice(startIndex, startIndex + itemsPerPage)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "accepted":
        return "text-emerald-600 bg-emerald-50 border-emerald-200"
      case "pending":
        return "text-amber-600 bg-amber-50 border-amber-200"
      case "rejected":
        return "text-red-600 bg-red-50 border-red-200"
      default:
        return "text-slate-600 bg-slate-50 border-slate-200"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "accepted":
        return <CheckCircle className="w-3 h-3" />
      case "pending":
        return <Clock className="w-3 h-3" />
      case "rejected":
        return <XCircle className="w-3 h-3" />
      default:
        return null
    }
  }

  const getProjectTypeColor = (type: string) => {
    switch (type) {
      case "ICT":
        return "bg-blue-100 text-blue-700 border-blue-200"
      case "Healthcare":
        return "bg-pink-100 text-pink-700 border-pink-200"
      case "Agriculture":
        return "bg-green-100 text-green-700 border-green-200"
      case "Energy":
        return "bg-yellow-100 text-yellow-700 border-yellow-200"
      case "Public Safety":
        return "bg-purple-100 text-purple-700 border-purple-200"
      default:
        return "bg-slate-100 text-slate-700 border-slate-200"
    }
  }

  const handleViewClick = (proposalId: number) => {
    setSelectedProposal(proposalId)
  }

  const closeModal = () => {
    setSelectedProposal(null)
  }

  const proposal = proposals.find((p) => p.id === selectedProposal)

  return (
    <div className="bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen lg:h-screen flex flex-col lg:flex-row gap-0 lg:gap-6">
      <Sidebar />

      <div className="flex-1 flex flex-col gap-4 sm:gap-6 p-4 sm:p-6 overflow-hidden pt-16 lg:pt-6">
        <header className="flex-shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#C8102E] leading-tight">Evaluator Proposals</h1>
              <p className="text-slate-600 mt-2 text-sm leading-relaxed">
                Manage and review submitted research proposals. Track status and take actions.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <TrendingUp className="w-4 h-4" />
              <span>Last updated: Today, 2:30 PM</span>
            </div>
          </div>
        </header>

        <section className="flex-shrink-0" aria-label="Filter proposals">
          <div className="bg-white shadow-xl rounded-2xl border border-slate-200 p-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
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
                  <option value="rejected">Rejected</option>
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
                  <option value="Healthcare">Healthcare</option>
                  <option value="Agriculture">Agriculture</option>
                  <option value="Energy">Energy</option>
                  <option value="Public Safety">Public Safety</option>
                  <option value="Environment">Environment</option>
                </select>
              </div>
            </div>

            <div className="mt-4 text-xs text-slate-600">
              Showing {filtered.length} of {proposals.length} proposals
            </div>
          </div>
        </section>

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

                        <p className="text-xs text-slate-600 mb-3 line-clamp-2 leading-relaxed">
                          {proposal.description}
                        </p>

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
                          {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
                        </span>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleViewClick(proposal.id)}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-all duration-200 cursor-pointer"
                            aria-label={`View details for ${proposal.title}`}
                            title="View details"
                          >
                            <Eye className="w-3 h-3" />
                          </button>

                          {proposal.status === "pending" && (
                            <>
                              <button
                                className="inline-flex items-center justify-center px-3 h-8 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1 transition-all duration-200 cursor-pointer text-xs font-medium"
                                aria-label={`Accept ${proposal.title}`}
                                title="Accept proposal"
                              >
                                Accept
                              </button>
                              <button
                                className="inline-flex items-center justify-center px-3 h-8 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 transition-all duration-200 cursor-pointer text-xs font-medium"
                                aria-label={`Reject ${proposal.title}`}
                                title="Reject proposal"
                              >
                                Reject
                              </button>
                            </>
                          )}
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

      {selectedProposal && proposal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-4 sm:p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h2 className="text-xl font-bold text-slate-900">{proposal.title}</h2>
                <p className="text-sm text-slate-600 mt-1">Proposal Details</p>
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
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                  <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-[#C8102E]" />
                    Project Information
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-600">Leader:</span>
                      <p className="font-semibold text-slate-900">{proposal.proponent}</p>
                    </div>
                    <div>
                      <span className="text-slate-600">Agency:</span>
                      <p className="font-semibold text-slate-900">{proposal.agency}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                  <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#C8102E]" />
                    Cooperating Agencies
                  </h3>
                  <p className="text-xs text-slate-700">{proposal.cooperatingAgencies}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                    <h3 className="text-sm font-bold text-slate-900 mb-2">R&D Station</h3>
                    <p className="text-xs text-slate-700">{proposal.rdStation}</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                    <h3 className="text-sm font-bold text-slate-900 mb-2">Classification</h3>
                    <p className="text-xs text-slate-700">{proposal.classification}</p>
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
                    <h3 className="text-sm font-bold text-slate-900 mb-2">Discipline</h3>
                    <p className="text-xs text-slate-700">{proposal.discipline}</p>
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
                      <p className="font-semibold text-slate-900">{proposal.duration}</p>
                    </div>
                    <div>
                      <span className="text-slate-600">Start Date:</span>
                      <p className="font-semibold text-slate-900">{proposal.startDate}</p>
                    </div>
                    <div>
                      <span className="text-slate-600">End Date:</span>
                      <p className="font-semibold text-slate-900">{proposal.endDate}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                  <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-[#C8102E]" />
                    Estimated Budget
                  </h3>
                  <p className="text-lg font-bold text-[#C8102E]">{proposal.budget}</p>
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-6 border-t border-slate-200 bg-slate-50 flex items-center justify-end">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
