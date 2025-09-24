"use client"

import { useState } from "react"
import {
  FileText,
  Eye,
  Trash2,
  Calendar,
  Search,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  User,
  ThumbsUp,
  DollarSign,
  XCircle,
} from "lucide-react"

export default function EndorsedProposals() {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 3

  const endorsedProposals = [
    {
      id: 1,
      title: "AI-Powered Educational Assessment System",
      endorsedDate: "Sept 18, 2025",
      description: "Development of AI system for automated assessment and personalized learning recommendations",
      fundingStatus: "accepted",
      proponent: "Jasmine Anderson",
    },
    {
      id: 2,
      title: "Sustainable Agriculture IoT Network",
      endorsedDate: "Sept 15, 2025",
      description: "IoT-based monitoring system for crop health and soil conditions in rural farming communities",
      fundingStatus: "funded",
      proponent: "Michael Chen",
    },
    {
      id: 3,
      title: "Blockchain Healthcare Records System",
      endorsedDate: "Sept 12, 2025",
      description: "Secure blockchain-based system for managing patient medical records across hospitals",
      fundingStatus: "rejected",
      proponent: "Emily Rodriguez",
    },
    {
      id: 4,
      title: "Renewable Energy Storage Optimization",
      endorsedDate: "Sept 10, 2025",
      description: "Advanced battery management system for solar and wind energy storage facilities",
      fundingStatus: "accepted",
      proponent: "James Wilson",
    },
    {
      id: 5,
      title: "Marine Biodiversity Conservation Platform",
      endorsedDate: "Sept 8, 2025",
      description: "Digital platform for monitoring and protecting marine ecosystems in Philippine waters",
      fundingStatus: "funded",
      proponent: "Maria Santos",
    },
    {
      id: 6,
      title: "Smart Traffic Management System",
      endorsedDate: "Sept 5, 2025",
      description: "AI-driven traffic optimization system for major urban centers",
      fundingStatus: "rejected",
      proponent: "Robert Kim",
    },
  ]

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "accepted":
        return "text-blue-600 bg-blue-50 border-blue-200"
      case "funded":
        return "text-emerald-600 bg-emerald-50 border-emerald-200"
      case "rejected":
        return "text-red-600 bg-red-50 border-red-200"
      default:
        return "text-slate-600 bg-slate-50 border-slate-200"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "accepted":
        return <ThumbsUp className="w-4 h-4" />
      case "funded":
        return <DollarSign className="w-4 h-4" />
      case "rejected":
        return <XCircle className="w-4 h-4" />
      default:
        return null
    }
  }

  const filtered = endorsedProposals.filter((p) => {
    const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === "all" || p.fundingStatus === statusFilter
    return matchesSearch && matchesStatus
  })

  const totalPages = Math.ceil(filtered.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedProposals = filtered.slice(startIndex, startIndex + itemsPerPage)

  return (
    <div className="bg-gradient-to-br from-slate-50 to-slate-100 h-full flex flex-col gap-6 p-6">
      {/* Header */}
      <header className="flex-shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#C8102E] leading-tight">Endorsed Proposals</h1>
            <p className="text-slate-600 mt-2 text-sm leading-relaxed">
              Track RDEC-endorsed proposals that have been approved for implementation.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <TrendingUp className="w-4 h-4" />
            <span>Last updated: Today, 3:15 PM</span>
          </div>
        </div>
      </header>

      <section className="flex-shrink-0" aria-label="Filter endorsed proposals">
        <div className="bg-white shadow-xl rounded-2xl border border-slate-200 p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search Input */}
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
                aria-label="Search endorsed proposals"
              />
            </div>

            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none bg-white border border-slate-300 rounded-lg px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-[#C8102E] transition-colors cursor-pointer"
                aria-label="Filter by funding status"
              >
                <option value="all">All Status</option>
                <option value="accepted">Accepted</option>
                <option value="funded">Funded</option>
                <option value="rejected">Rejected</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </div>
            </div>
          </div>

          {/* Results Count */}
          <div className="mt-4 text-xs text-slate-600">
            Showing {filtered.length} of {endorsedProposals.length} endorsed proposals
          </div>
        </div>
      </section>

      {/* Endorsed Proposals List */}
      <main className="bg-white shadow-xl rounded-2xl border border-slate-200 overflow-hidden flex-1 flex flex-col">
        <div className="p-4 border-b border-slate-200 bg-slate-50">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#C8102E]" />
              RDEC Endorsed Proposals
            </h3>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <CheckCircle className="w-4 h-4" />
              <span>{endorsedProposals.length} total endorsed</span>
            </div>
          </div>
        </div>

        <div className="flex-1">
          {paginatedProposals.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {paginatedProposals.map((proposal) => (
                <article
                  key={proposal.id}
                  className="p-4 hover:bg-slate-50 transition-colors duration-200 group"
                  aria-labelledby={`proposal-title-${proposal.id}`}
                >
                  <div className="flex flex-col gap-4">
                    {/* Main Proposal Info */}
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
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
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3 h-3" aria-hidden="true" />
                            <span>
                              <span className="sr-only">Endorsed: </span>
                              {proposal.endorsedDate}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-all duration-200 cursor-pointer"
                          aria-label={`View details for ${proposal.title}`}
                          title="View details"
                        >
                          <Eye className="w-3 h-3" aria-hidden="true" />
                        </button>
                        <button
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 transition-all duration-200 cursor-pointer"
                          aria-label={`Delete ${proposal.title}`}
                          title="Delete proposal"
                        >
                          <Trash2 className="w-3 h-3" aria-hidden="true" />
                        </button>
                      </div>
                    </div>

                    {/* Funding Status */}
                    <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                      <div className="flex items-center gap-2 text-xs">
                        <CheckCircle className="w-3 h-3 text-emerald-500" />
                        <div>
                          <span className="text-slate-500">Funding Status:</span>
                          <div
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border border-current border-opacity-20 ml-2 ${getStatusStyle(proposal.fundingStatus)}`}
                          >
                            {getStatusIcon(proposal.fundingStatus)}
                            {proposal.fundingStatus.charAt(0).toUpperCase() + proposal.fundingStatus.slice(1)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            /* Empty State */
            <div className="text-center py-12 px-4">
              <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <FileText className="w-8 h-8 text-slate-400" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-2">No endorsed proposals found</h3>
              <p className="text-slate-500 max-w-sm mx-auto">
                {search ? "Try adjusting your search criteria." : "No proposals have been endorsed yet."}
              </p>
            </div>
          )}
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 flex-shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-xs text-slate-600">
            <span>
              Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filtered.length)} of {filtered.length}{" "}
              endorsed proposals
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
  )
}
