import { useState } from "react"
import {
  FileText,
  Eye,
  Search,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  User,
  Tag,
  X,
  Building2,
  Users,
  Target,
  DollarSign,
  Calendar,
  MessageSquare,
  Filter,
} from "lucide-react"
import Sidebar from "../../../components/EvaluatorSide"

export default function ReviewedProposals() {
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState("All")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5
  const [selectedProposal, setSelectedProposal] = useState<number | null>(null)

  const reviewedProposals = [
    {
      id: 1,
      title: "AI-Powered Educational Assessment System",
      reviewedDate: "Sept 20, 2025",
      description: "Development of AI system for automated assessment and personalized learning recommendations",
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
      budget: "₱1,250,000.00",
      comments: {
        objectives:
          "The objectives are well-defined and align with current educational needs. The focus on personalized learning is particularly relevant.",
        methodology:
          "The proposed methodology is sound and follows established research practices. The use of machine learning algorithms is appropriate for this study.",
        budget:
          "Budget allocation appears reasonable and well-justified. Equipment costs are within acceptable ranges for this type of research.",
        timeline:
          "The 24-month timeline is realistic given the scope of work. Milestones are clearly defined and achievable.",
        overall:
          "This is a strong proposal with clear objectives, solid methodology, and appropriate budget. Recommended for approval with minor revisions to the data collection timeline.",
      },
    },
    {
      id: 2,
      title: "Sustainable Agriculture IoT Network",
      reviewedDate: "Sept 22, 2025",
      description: "IoT-based monitoring system for crop health and soil conditions in rural farming communities",
      proponent: "Michael Chen",
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
      comments: {
        objectives:
          "Objectives are comprehensive and address critical needs in sustainable agriculture. The focus on rural communities is commendable.",
        methodology:
          "The IoT implementation strategy is well-planned. Field testing protocols are thorough and appropriate for agricultural settings.",
        budget:
          "Budget is well-structured with clear allocation for hardware, software, and field operations. Costs are justified and competitive.",
        timeline:
          "The 36-month timeline allows for proper development, testing, and deployment phases. Seasonal considerations are well-integrated.",
        overall:
          "Excellent proposal with strong potential for significant impact on sustainable farming practices. Highly recommended for funding.",
      },
    },
    {
      id: 3,
      title: "Blockchain Healthcare Records System",
      reviewedDate: "Sept 18, 2025",
      description: "Secure blockchain-based system for managing patient medical records across hospitals",
      proponent: "Emily Rodriguez",
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
      comments: {
        objectives:
          "The objectives clearly address data security and interoperability challenges in healthcare. Privacy considerations are well-articulated.",
        methodology:
          "Blockchain implementation approach is technically sound. Security protocols meet healthcare data protection standards.",
        budget:
          "Budget allocation is appropriate for blockchain development and healthcare system integration. Security infrastructure costs are justified.",
        timeline:
          "Timeline accounts for regulatory compliance and pilot testing phases. Implementation schedule is realistic.",
        overall:
          "Strong proposal addressing critical healthcare data management needs. Recommended for approval with emphasis on data privacy compliance.",
      },
    },
  ]

  const filtered = reviewedProposals.filter((p) => {
    const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase())
    const matchesType = typeFilter === "All" || p.projectType === typeFilter
    return matchesSearch && matchesType
  })

  const totalPages = Math.ceil(filtered.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedProposals = filtered.slice(startIndex, startIndex + itemsPerPage)

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
      case "Environment":
        return "bg-teal-100 text-teal-700 border-teal-200"
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

  const proposal = reviewedProposals.find((p) => p.id === selectedProposal)

  return (
    <div className="bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen lg:h-screen flex flex-col lg:flex-row gap-0 lg:gap-6">
      <Sidebar />

      <div className="flex-1 flex flex-col gap-4 sm:gap-6 p-4 sm:p-6 overflow-hidden pt-16 lg:pt-6">
        <header className="flex-shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#C8102E] leading-tight">Reviewed Proposals</h1>
              <p className="text-slate-600 mt-2 text-sm leading-relaxed">
                View proposals that have been reviewed and forwarded for final decision.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <TrendingUp className="w-4 h-4" />
              <span>Last updated: Today, 4:00 PM</span>
            </div>
          </div>
        </header>

        <section className="flex-shrink-0" aria-label="Filter reviewed proposals">
          <div className="bg-white shadow-xl rounded-2xl border border-slate-200 p-4">
            <div className="flex flex-col sm:flex-row gap-4">
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
                  <option value="Healthcare">Healthcare</option>
                  <option value="Agriculture">Agriculture</option>
                  <option value="Energy">Energy</option>
                  <option value="Public Safety">Public Safety</option>
                  <option value="Environment">Environment</option>
                </select>
              </div>
            </div>

            <div className="mt-4 text-xs text-slate-600">
              Showing {filtered.length} of {reviewedProposals.length} reviewed proposals
            </div>
          </div>
        </section>

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
            {paginatedProposals.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {paginatedProposals.map((proposal) => (
                  <article key={proposal.id} className="p-4 hover:bg-slate-50 transition-colors duration-200 group">
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
                            <div className="flex items-center gap-1.5 text-emerald-600 font-semibold">
                              <CheckCircle className="w-3 h-3" />
                              <span>Reviewed: {proposal.reviewedDate}</span>
                            </div>
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
                <h3 className="text-lg font-medium text-slate-900 mb-2">No proposals found</h3>
                <p className="text-slate-500 max-w-sm mx-auto">
                  {search ? "Try adjusting your search criteria." : "No proposals have been reviewed yet."}
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

      {selectedProposal && proposal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-4 sm:p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h2 className="text-xl font-bold text-slate-900">{proposal.title}</h2>
                <p className="text-sm text-slate-600 mt-1">Completed Review</p>
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
                  <div className="grid grid-cols-2 gap-3 text-xs">
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

                <div className="border-t-2 border-slate-300 pt-6 mt-6">
                  <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-[#C8102E]" />
                    Evaluator Comments
                  </h3>

                  <div className="space-y-4">
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                      <label className="block text-sm font-semibold text-slate-900 mb-2">Objectives Assessment</label>
                      <p className="text-sm text-slate-700 leading-relaxed">{proposal.comments.objectives}</p>
                    </div>

                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                      <label className="block text-sm font-semibold text-slate-900 mb-2">Methodology Assessment</label>
                      <p className="text-sm text-slate-700 leading-relaxed">{proposal.comments.methodology}</p>
                    </div>

                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                      <label className="block text-sm font-semibold text-slate-900 mb-2">Budget Assessment</label>
                      <p className="text-sm text-slate-700 leading-relaxed">{proposal.comments.budget}</p>
                    </div>

                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                      <label className="block text-sm font-semibold text-slate-900 mb-2">Timeline Assessment</label>
                      <p className="text-sm text-slate-700 leading-relaxed">{proposal.comments.timeline}</p>
                    </div>

                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                      <label className="block text-sm font-semibold text-slate-900 mb-2">Overall Assessment</label>
                      <p className="text-sm text-slate-700 leading-relaxed">{proposal.comments.overall}</p>
                    </div>
                  </div>
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
