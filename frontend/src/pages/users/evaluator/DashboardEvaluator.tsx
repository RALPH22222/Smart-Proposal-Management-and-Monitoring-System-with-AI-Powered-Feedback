import {
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  AlertCircle,
} from "lucide-react";
import { useState, useEffect } from "react";
import { getEvaluatorProposals } from "../../../services/proposal.api";
import { useAuthContext } from "../../../context/AuthContext";

export default function DashboardRdec() {
  const { user } = useAuthContext();
  const [displayedText, setDisplayedText] = useState({ prefix: '', name: '', suffix: '' });

  useEffect(() => {
    if (!user) return;

    const hasVisited = localStorage.getItem('evaluator_welcome_seen');
    const isNewUser = !hasVisited;

    if (isNewUser) {
      localStorage.setItem('evaluator_welcome_seen', 'true');
    }

    const firstName = user.first_name || 'Evaluator';
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

  const [statsData, setStatsData] = useState({
    pending: 0,
    reject: 0,
    approve: 0,
    for_review: 0,
    revise: 0,
    decline: 0
  });
  const [proposals, setProposals] = useState<any[]>([]);

  const [derivedStats, setDerivedStats] = useState({
    reviewedToday: 0,
    underReview: 0,
    pending: 0,
    thisMonth: 0,
    thisWeek: 0,
    today: 0
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // We only need getEvaluatorProposals to calculate everything accurately
        // getEvaluatorProposalStats() might be returning stale or non-deduplicated counts
        const [allProposals] = await Promise.all([
          getEvaluatorProposals()
        ]);

        // 1. Robust Mapping (same as Proposals.tsx)
        const mappedAll = (allProposals || []).map((p: any) => {
          const proposalObj = p.proposal_id || p;

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

          if (displayStatus === 'extend') {
            displayStatus = 'extension_requested';
          }
          // If status is pending but we have a request_deadline_at, it's an extension request
          if (displayStatus === 'pending' && p.request_deadline_at) {
            displayStatus = 'extension_requested';
          }

          return {
            id: proposalObj.id,
            title: proposalObj.project_title || "Untitled",
            proponent: proponentName.trim(),
            status: displayStatus,
            created_at: new Date(p.created_at || proposalObj.created_at),
            updated_at: new Date(p.updated_at || proposalObj.updated_at),
            date: new Date(p.updated_at || proposalObj.updated_at).toLocaleDateString(),
            updatedAt: new Date(p.updated_at || proposalObj.updated_at)
          };
        });

        // 2. Deduplication
        const uniqueProposalsMap = new Map();
        mappedAll.forEach((p: any) => {
          if (!uniqueProposalsMap.has(p.id)) {
            uniqueProposalsMap.set(p.id, p);
          }
        });
        const uniqueProposals = Array.from(uniqueProposalsMap.values());

        // 3. Calculate Stats from Unique Proposals
        const newStats = {
          pending: 0,
          reject: 0,
          approve: 0,
          for_review: 0,
          revise: 0,
          decline: 0
        };

        uniqueProposals.forEach((p: any) => {
          const s = p.status;
          if (s === 'pending') newStats.pending++;
          else if (s === 'accepted' || s === 'approve') newStats.approve++; // normalize 'accepted' to 'approve' bucket
          else if (s === 'rejected' || s === 'reject') newStats.reject++;   // normalize 'rejected' to 'reject' bucket
          else if (s === 'for_review') newStats.for_review++;
          else if (s === 'revise' || s === 'revision') newStats.revise++;
          else if (s === 'decline') newStats.decline++;
          else if (s === 'extension_requested' || s === 'extension_approved' || s === 'extension_rejected') newStats.pending++; // Treat extension flows as pending action
        });

        setStatsData(newStats);

        // 4. Filter for "Recent Reviewed" Table
        // We only want finished reviews: approve, reject, revise, decline, accepted, rejected
        const reviewedStatuses = ['approve', 'reject', 'revise', 'decline', 'accepted', 'rejected'];

        const reviewedProposals = uniqueProposals
          .filter((item: any) => reviewedStatuses.includes(item.status));

        // Sort by review date desc
        reviewedProposals.sort((a: any, b: any) => b.updatedAt.getTime() - a.updatedAt.getTime());
        setProposals(reviewedProposals.slice(0, 5)); // Take top 5 recent reviewed

        // 5. Calculate derived stats (Activity)
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const todayCount = uniqueProposals.filter((p: any) => p.created_at >= startOfDay).length;
        const weekCount = uniqueProposals.filter((p: any) => p.created_at >= startOfWeek).length;
        const monthCount = uniqueProposals.filter((p: any) => p.created_at >= startOfMonth).length;

        const reviewedToday = uniqueProposals.filter((p: any) => reviewedStatuses.includes(p.status) && p.updated_at >= startOfDay).length;
        const underReviewCount = newStats.for_review;
        // statsData.pending accounts for pending + extension_requested roughly, but specifically for the UI text "pending assignment"
        // we can just use the pending count
        const pendingCount = newStats.pending;

        setDerivedStats({
          reviewedToday,
          underReview: underReviewCount,
          pending: pendingCount,
          thisMonth: monthCount, // Note: this calculates new proposals this month based on created_at
          thisWeek: weekCount,
          today: todayCount
        });

      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      }
    };

    fetchData();
  }, []);

  const stats = [
    {
      icon: Clock,
      label: "Pending Proposals",
      value: statsData.pending,
      color: "text-amber-500",
      bgColor: "bg-amber-50",
      borderColor: "border-amber-200",
      description: "Awaiting review"
    },
    {
      icon: XCircle,
      label: "Rejected Proposals",
      value: statsData.reject + statsData.decline,
      color: "text-red-500",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
      description: "Declined or rejected"
    },
    {
      icon: CheckCircle,
      label: "Reviewed Proposals",
      value: statsData.approve + statsData.revise,
      color: "text-emerald-500",
      bgColor: "bg-emerald-50",
      borderColor: "border-emerald-200",
      description: "Approved or revised"
    },
  ];

  return (
    <div className="h-full w-full bg-gradient-to-br from-slate-50 to-slate-100 overflow-y-auto">
      <div className="p-4 sm:p-6">
        {/* Header */}
        <header className="pb-4 sm:pb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#C8102E] leading-tight min-h-[40px]">
                {displayedText.prefix}
                <span className="text-black">{displayedText.name}</span>
                {displayedText.suffix}
              </h1>
              <p className="text-slate-600 mt-2 text-sm leading-relaxed">
                Overview of your assigned proposals.
              </p>
            </div>
          </div>
        </header>

        {/* Stats Section */}
        <section className="mb-4 sm:mb-6" aria-labelledby="stats-heading">
          <h2 id="stats-heading" className="sr-only">
            Proposal Statistics
          </h2>
          <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
            {/* First two stats cards */}
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {stats.slice(0, 2).map((stat, index) => {
                const IconComponent = stat.icon;
                return (
                  <div
                    key={index}
                    className={`${stat.bgColor} ${stat.borderColor} border-2 rounded-2xl p-4 transition-all duration-300 hover:shadow-lg hover:scale-105 group cursor-pointer`}
                    role="button"
                    tabIndex={0}
                    aria-label={`${stat.label}: ${stat.value} proposals`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <IconComponent
                        className={`${stat.color} w-6 h-6 group-hover:scale-110 transition-transform duration-300`}
                      />
                    </div>
                    <h3 className="text-xs font-semibold text-slate-700 mb-2 leading-tight">
                      {stat.label}
                    </h3>
                    <p className="text-xl font-bold text-slate-800 tabular-nums">
                      {stat.value.toLocaleString()}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Third stats card aligned with endorsed proposals status box */}
            <div className="w-full lg:w-80">
              {(() => {
                const stat = stats[2];
                const IconComponent = stat.icon;
                return (
                  <div
                    className={`${stat.bgColor} ${stat.borderColor} border-2 rounded-2xl p-4 transition-all duration-300 hover:shadow-lg hover:scale-105 group cursor-pointer`}
                    role="button"
                    tabIndex={0}
                    aria-label={`${stat.label}: ${stat.value} proposals`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <IconComponent
                        className={`${stat.color} w-6 h-6 group-hover:scale-110 transition-transform duration-300`}
                      />
                    </div>
                    <h3 className="text-xs font-semibold text-slate-700 mb-2 leading-tight">
                      {stat.label}
                    </h3>
                    <p className="text-xl font-bold text-slate-800 tabular-nums">
                      {stat.value.toLocaleString()}
                    </p>
                  </div>
                );
              })()}
            </div>
          </div>
        </section>

        {/* Table Section */}
        <section className="flex flex-col lg:flex-row gap-4 lg:gap-6">
          {/* Recent Proposals Table */}
          <div
            className="bg-white shadow-xl rounded-2xl border border-slate-200 overflow-hidden flex-1 flex flex-col"
            aria-labelledby="proposals-heading"
          >
            <div className="p-4 border-b border-slate-200 bg-slate-50">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h3
                  id="proposals-heading"
                  className="text-lg font-bold text-slate-800 flex items-center gap-2"
                >
                  <FileText className="w-5 h-5 text-[#C8102E]" />
                  Recent Reviewed Proposals
                </h3>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Users className="w-4 h-4" />
                  <span>{proposals.length} total proposals</span>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto flex-1">
              <table
                className="w-full"
                role="table"
                aria-label="Recent proposals table"
              >
                <thead>
                  <tr className="bg-slate-100 text-left text-slate-700 border-b border-slate-200">
                    <th
                      className="p-3 font-semibold text-xs uppercase tracking-wider"
                      scope="col"
                    >
                      #
                    </th>
                    <th
                      className="p-3 font-semibold text-xs uppercase tracking-wider min-w-[200px]"
                      scope="col"
                    >
                      Title
                    </th>
                    <th
                      className="p-3 font-semibold text-xs uppercase tracking-wider hidden sm:table-cell"
                      scope="col"
                    >
                      Proponent
                    </th>
                    <th
                      className="p-3 font-semibold text-xs uppercase tracking-wider hidden lg:table-cell"
                      scope="col"
                    >
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
                      <td
                        className="p-3 text-slate-600 font-medium tabular-nums text-sm"
                        role="cell"
                      >
                        {proposal.id}
                      </td>
                      <td className="p-3" role="cell">
                        <div className="font-semibold text-slate-800 group-hover:text-[#C8102E] transition-colors duration-200 text-pretty text-sm">
                          {proposal.title}
                        </div>
                      </td>
                      <td
                        className="p-3 text-slate-700 hidden sm:table-cell text-sm"
                        role="cell"
                      >
                        {proposal.proponent}
                      </td>
                      <td
                        className="p-3 text-slate-600 text-xs tabular-nums hidden lg:table-cell"
                        role="cell"
                      >
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
                  // Note: In a controlled component setup, you might want to use the onPageChange prop passed down instead of window.location
                  onClick={() =>
                    (window.location.href = "/users/evaluator/Proposals")
                  }
                  className="text-[#C8102E] hover:text-[#A00E26] font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:ring-opacity-50 rounded px-2 py-1 cursor-pointer"
                  aria-label="View all proposals"
                >
                  View All Proposals →
                </button>
              </div>
            </div>

            <div className="p-4 bg-gradient-to-r from-slate-50 to-slate-100 border-t border-slate-200">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-emerald-600">{derivedStats.thisMonth}</div>
                  <div className="text-xs text-slate-600">This Month</div>
                </div>
                <div className="text-center border-x border-slate-300">
                  <div className="text-2xl font-bold text-amber-600">{derivedStats.thisWeek}</div>
                  <div className="text-xs text-slate-600">This Week</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{derivedStats.today}</div>
                  <div className="text-xs text-slate-600">Today</div>
                </div>
              </div>
            </div>
          </div>

          {/* Endorsed Proposals Status Box */}
          <div className="bg-white shadow-xl rounded-2xl border border-slate-200 p-4 sm:p-6 w-full lg:w-80 flex flex-col">
            <h3 className="text-lg font-bold text-slate-800 mb-8 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-[#C8102E]" />
              Review Status
            </h3>

            <div className="space-y-6 flex-1 flex flex-col justify-center">
              {/* Pending */}
              <div className="flex items-center justify-between p-5 bg-amber-50 rounded-xl border border-amber-200 hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center gap-4">
                  <Clock className="w-6 h-6 text-amber-500" />
                  <span className="font-semibold text-amber-700 text-base">
                    Pending
                  </span>
                </div>
                <span className="text-2xl font-bold text-amber-700">{statsData.pending}</span>
              </div>

              {/* Under Review */}
              <div className="flex items-center justify-between p-5 bg-blue-50 rounded-xl border border-blue-200 hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center gap-4">
                  <AlertCircle className="w-6 h-6 text-blue-500" />
                  <span className="font-semibold text-blue-700 text-base">
                    Under Review
                  </span>
                </div>
                <span className="text-2xl font-bold text-blue-700">{statsData.for_review}</span>
              </div>

              {/* Reviewed */}
              <div className="flex items-center justify-between p-5 bg-emerald-50 rounded-xl border border-emerald-200 hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center gap-4">
                  <CheckCircle className="w-6 h-6 text-emerald-500" />
                  <span className="font-semibold text-emerald-700 text-base">
                    Reviewed
                  </span>
                </div>
                <span className="text-2xl font-bold text-emerald-700">{statsData.approve + statsData.revise + statsData.reject + statsData.decline}</span>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-200">
              <h4 className="text-sm font-semibold text-slate-700 mb-3">
                Recent Activity
              </h4>
              <div className="space-y-2 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  <span>{derivedStats.reviewedToday} proposals reviewed today</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <span>{derivedStats.underReview} currently under review</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                  <span>{derivedStats.pending} pending assignment</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}