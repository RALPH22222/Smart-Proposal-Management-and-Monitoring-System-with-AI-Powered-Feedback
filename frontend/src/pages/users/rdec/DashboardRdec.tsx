"use client"

import { FileText, CheckCircle, XCircle, Clock, TrendingUp, Users, Calendar, ThumbsUp, DollarSign } from "lucide-react"

export default function DashboardRdec() {
  const stats = [
    {
      icon: Clock,
      label: "Pending Proposals",
      value: 100,
      color: "text-amber-500",
      bgColor: "bg-amber-50",
      borderColor: "border-amber-200",
      trend: "+12%",
    },
    {
      icon: XCircle,
      label: "Rejected Proposals",
      value: 12,
      color: "text-red-500",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
      trend: "-3%",
    },
    {
      icon: CheckCircle,
      label: "Endorsed Proposals",
      value: 45,
      color: "text-emerald-500",
      bgColor: "bg-emerald-50",
      borderColor: "border-emerald-200",
      trend: "+8%",
    },
  ]

  const proposals = [
    {
      id: 1,
      title: "AI Research on Education",
      proponent: "John Doe",
      status: "Endorsed",
      statusColor: "text-emerald-600 bg-emerald-50",
      date: "Sept 21, 2025",
      priority: "High",
    },
    {
      id: 2,
      title: "Sustainable Farming Proposal",
      proponent: "Jane Smith",
      status: "Pending",
      statusColor: "text-amber-600 bg-amber-50",
      date: "Sept 19, 2025",
      priority: "Medium",
    },
    {
      id: 3,
      title: "Blockchain in Healthcare",
      proponent: "Michael Lee",
      status: "Rejected",
      statusColor: "text-red-600 bg-red-50",
      date: "Sept 15, 2025",
      priority: "Low",
    },
    {
      id: 4,
      title: "Renewable Energy Infrastructure",
      proponent: "Sarah Wilson",
      status: "Pending",
      statusColor: "text-amber-600 bg-amber-50",
      date: "Sept 12, 2025",
      priority: "High",
    },
    {
      id: 5,
      title: "Digital Transformation Initiative",
      proponent: "David Chen",
      status: "Endorsed",
      statusColor: "text-emerald-600 bg-emerald-50",
      date: "Sept 10, 2025",
      priority: "Medium",
    },
  ]

  return (
    <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      {/* Header */}
      <header className="pb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#C8102E] leading-tight">RDEC Dashboard</h1>
            <p className="text-slate-600 mt-2 text-sm leading-relaxed">
              Welcome back! Here's an overview of your proposals.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Calendar className="w-4 h-4" />
            <span>Last updated: Today, 2:30 PM</span>
          </div>
        </div>
      </header>

      {/* Stats Section */}
      <section className="mb-6" aria-labelledby="stats-heading">
        <h2 id="stats-heading" className="sr-only">
          Proposal Statistics
        </h2>
        <div className="flex gap-6">
          {/* First two stats cards */}
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {stats.slice(0, 2).map((stat, index) => {
              const IconComponent = stat.icon
              return (
                <div
                  key={index}
                  className={`${stat.bgColor} ${stat.borderColor} border-2 rounded-2xl p-4 transition-all duration-300 hover:shadow-lg hover:scale-105 group cursor-pointer`}
                  role="button"
                  tabIndex={0}
                  aria-label={`${stat.label}: ${stat.value} proposals, ${stat.trend} change`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <IconComponent
                      className={`${stat.color} w-6 h-6 group-hover:scale-110 transition-transform duration-300`}
                    />
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 text-slate-400" />
                      <span className="text-xs font-medium text-slate-600">{stat.trend}</span>
                    </div>
                  </div>
                  <h3 className="text-xs font-semibold text-slate-700 mb-2 leading-tight">{stat.label}</h3>
                  <p className="text-xl font-bold text-slate-800 tabular-nums">{stat.value.toLocaleString()}</p>
                </div>
              )
            })}
          </div>

          {/* Third stats card aligned with endorsed proposals status box */}
          <div className="w-80">
            {(() => {
              const stat = stats[2]
              const IconComponent = stat.icon
              return (
                <div
                  className={`${stat.bgColor} ${stat.borderColor} border-2 rounded-2xl p-4 transition-all duration-300 hover:shadow-lg hover:scale-105 group cursor-pointer`}
                  role="button"
                  tabIndex={0}
                  aria-label={`${stat.label}: ${stat.value} proposals, ${stat.trend} change`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <IconComponent
                      className={`${stat.color} w-6 h-6 group-hover:scale-110 transition-transform duration-300`}
                    />
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 text-slate-400" />
                      <span className="text-xs font-medium text-slate-600">{stat.trend}</span>
                    </div>
                  </div>
                  <h3 className="text-xs font-semibold text-slate-700 mb-2 leading-tight">{stat.label}</h3>
                  <p className="text-xl font-bold text-slate-800 tabular-nums">{stat.value.toLocaleString()}</p>
                </div>
              )
            })()}
          </div>
        </div>
      </section>

      {/* Table Section */}
      <section className="flex gap-6">
        {/* Recent Proposals Table */}
        <div
          className="bg-white shadow-xl rounded-2xl border border-slate-200 overflow-hidden flex-1 flex flex-col"
          aria-labelledby="proposals-heading"
        >
          <div className="p-4 border-b border-slate-200 bg-slate-50">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h3 id="proposals-heading" className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#C8102E]" />
                Recent Proposals
              </h3>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Users className="w-4 h-4" />
                <span>{proposals.length} total proposals</span>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full" role="table" aria-label="Recent proposals table">
              <thead>
                <tr className="bg-slate-100 text-left text-slate-700 border-b border-slate-200">
                  <th className="p-3 font-semibold text-xs uppercase tracking-wider" scope="col">
                    #
                  </th>
                  <th className="p-3 font-semibold text-xs uppercase tracking-wider min-w-[200px]" scope="col">
                    Title
                  </th>
                  <th className="p-3 font-semibold text-xs uppercase tracking-wider hidden sm:table-cell" scope="col">
                    Proponent
                  </th>
                  <th className="p-3 font-semibold text-xs uppercase tracking-wider" scope="col">
                    Status
                  </th>
                  <th className="p-3 font-semibold text-xs uppercase tracking-wider hidden lg:table-cell" scope="col">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {proposals.map((proposal) => (
                  <tr
                    key={proposal.id}
                    className="border-b border-slate-100 hover:bg-slate-50 transition-colors duration-200 group"
                    role="row"
                  >
                    <td className="p-3 text-slate-600 font-medium tabular-nums text-sm" role="cell">
                      {proposal.id}
                    </td>
                    <td className="p-3" role="cell">
                      <div className="font-semibold text-slate-800 group-hover:text-[#C8102E] transition-colors duration-200 text-pretty text-sm">
                        {proposal.title}
                      </div>
                      <div className="text-xs text-slate-500 sm:hidden mt-1">by {proposal.proponent}</div>
                    </td>
                    <td className="p-3 text-slate-700 hidden sm:table-cell text-sm" role="cell">
                      {proposal.proponent}
                    </td>
                    <td className="p-3" role="cell">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${proposal.statusColor} border border-current border-opacity-20`}
                        aria-label={`Status: ${proposal.status}`}
                      >
                        {proposal.status}
                      </span>
                    </td>
                    <td className="p-3 text-slate-600 text-xs tabular-nums hidden lg:table-cell" role="cell">
                      {proposal.date}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* View All Proposals Button */}
          <div className="p-4 bg-slate-50 border-t border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-xs text-slate-600">
              <button
                onClick={() => (window.location.href = "/users/rdec/proposals")}
                className="text-[#C8102E] hover:text-[#A00E26] font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:ring-opacity-50 rounded px-2 py-1 cursor-pointer"
                aria-label="View all proposals"
              >
                View All Proposals →
              </button>
            </div>
          </div>
        </div>

        {/* Endorsed Proposals Status Box */}
        <div className="bg-white shadow-xl rounded-2xl border border-slate-200 p-6 w-80 flex flex-col">
          <h3 className="text-lg font-bold text-slate-800 mb-8 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-[#C8102E]" />
            Endorsed Proposals Status
          </h3>

          <div className="space-y-6 flex-1 flex flex-col justify-center">
            {/* Accepted */}
            <div className="flex items-center justify-between p-5 bg-blue-50 rounded-xl border border-blue-200 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center gap-4">
                <ThumbsUp className="w-6 h-6 text-blue-500" />
                <span className="font-semibold text-blue-700 text-base">Accepted</span>
              </div>
              <span className="text-2xl font-bold text-blue-700">8</span>
            </div>

            {/* Funded */}
            <div className="flex items-center justify-between p-5 bg-emerald-50 rounded-xl border border-emerald-200 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center gap-4">
                <DollarSign className="w-6 h-6 text-emerald-500" />
                <span className="font-semibold text-emerald-700 text-base">Funded</span>
              </div>
              <span className="text-2xl font-bold text-emerald-700">12</span>
            </div>

            {/* Rejected */}
            <div className="flex items-center justify-between p-5 bg-red-50 rounded-xl border border-red-200 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center gap-4">
                <XCircle className="w-6 h-6 text-red-500" />
                <span className="font-semibold text-red-700 text-base">Rejected</span>
              </div>
              <span className="text-2xl font-bold text-red-700">4</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
