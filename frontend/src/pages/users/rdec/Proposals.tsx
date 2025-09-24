"use client"

import { useState } from "react"
import {
  FileText,
  Eye,
  Trash2,
  User,
  Calendar,
  Search,
  Filter,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"

export default function Proposals() {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("All")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 3

  const proposals = [
    {
      id: 1,
      title: "AI Research on Education",
      proponent: "John Doe",
      status: "Endorsed",
      date: "Sept 21, 2025",
      description: "Comprehensive study on AI applications in educational systems",
    },
    {
      id: 2,
      title: "Sustainable Farming Proposal",
      proponent: "Jane Smith",
      status: "Pending",
      date: "Sept 19, 2025",
      description: "Initiative for implementing eco-friendly farming practices",
    },
    {
      id: 3,
      title: "Blockchain in Healthcare",
      proponent: "Michael Lee",
      status: "Rejected",
      date: "Sept 15, 2025",
      description: "Proposal for blockchain integration in healthcare data management",
    },
    {
      id: 4,
      title: "Quantum Computing Research",
      proponent: "Dr. Sarah Chen",
      status: "Pending",
      date: "Sept 12, 2025",
      description: "Advanced quantum computing algorithms for cryptography",
    },
    {
      id: 5,
      title: "Renewable Energy Storage",
      proponent: "David Wilson",
      status: "Endorsed",
      date: "Sept 10, 2025",
      description: "Next-generation battery technology for renewable energy",
    },
    {
      id: 6,
      title: "Neural Network Optimization",
      proponent: "Lisa Park",
      status: "Pending",
      date: "Sept 8, 2025",
      description: "Optimization techniques for deep neural networks",
    },
  ]

  // Filter logic
  const filtered = proposals.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(search.toLowerCase()) || p.proponent.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === "All" || p.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const totalPages = Math.ceil(filtered.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedProposals = filtered.slice(startIndex, startIndex + itemsPerPage)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Endorsed":
        return "text-emerald-600 bg-emerald-50 border-emerald-200"
      case "Pending":
        return "text-amber-600 bg-amber-50 border-amber-200"
      case "Rejected":
        return "text-red-600 bg-red-50 border-red-200"
      default:
        return "text-slate-600 bg-slate-50 border-slate-200"
    }
  }

  return (
    <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-6 h-full flex flex-col">
      {/* Header */}
      <header className="pb-6 flex-shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#C8102E] leading-tight">RDEC Proposals</h1>
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

      {/* Filters Section */}
      <section className="mb-6 flex-shrink-0" aria-label="Filter proposals">
        <div className="bg-white shadow-xl rounded-2xl border border-slate-200 p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search Input */}
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

            {/* Status Filter */}
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
                <option value="Pending">Pending</option>
                <option value="Endorsed">Endorsed</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
          </div>

          {/* Results Count */}
          <div className="mt-4 text-xs text-slate-600">
            Showing {filtered.length} of {proposals.length} proposals
          </div>
        </div>
      </section>

      {/* Proposals List */}
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

        <div className="flex-1">
          {paginatedProposals.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {paginatedProposals.map((proposal) => (
                <article
                  key={proposal.id}
                  className="p-4 hover:bg-slate-50 transition-colors duration-200 group"
                  aria-labelledby={`proposal-title-${proposal.id}`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Proposal Info */}
                    <div className="flex-1 min-w-0">
                      <h2
                        id={`proposal-title-${proposal.id}`}
                        className="text-base font-semibold text-slate-800 mb-2 line-clamp-2 group-hover:text-[#C8102E] transition-colors duration-200"
                      >
                        {proposal.title}
                      </h2>

                      <p className="text-xs text-slate-600 mb-3 line-clamp-2 leading-relaxed">{proposal.description}</p>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3 h-3" aria-hidden="true" />
                          <span>
                            <span className="sr-only">Proponent: </span>
                            {proposal.proponent}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3 h-3" aria-hidden="true" />
                          <span>
                            <span className="sr-only">Date: </span>
                            {proposal.date}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Status and Actions */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {/* Status Badge */}
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border border-current border-opacity-20 ${getStatusColor(proposal.status)}`}
                        aria-label={`Status: ${proposal.status}`}
                      >
                        {proposal.status}
                      </span>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2">
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
  )
}
