import {
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  AlertCircle,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
} from 'recharts';
import { useState, useEffect } from "react";
import { getEvaluatorProposals } from "../../../services/proposal.api";
import { useAuthContext } from "../../../context/AuthContext";
import PageLoader from "../../../components/shared/PageLoader";

// --- Module-level cache: survives navigation, cleared on page refresh ---
type DashboardCache = {
  statsData: { pending: number; reject: number; approve: number; for_review: number; revise: number; decline: number; total: number };
  proposals: any[];
  derivedStats: { reviewedToday: number; underReview: number; pending: number; thisMonth: number; thisWeek: number; today: number };
  monthlyReviews: { month: string; count: number }[];
} | null;

let dashboardCache: DashboardCache = null;

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

  const [statsData, setStatsData] = useState(dashboardCache?.statsData ?? {
    pending: 0,
    reject: 0,
    approve: 0,
    for_review: 0,
    revise: 0,
    decline: 0,
    total: 0
  });
  const [proposals, setProposals] = useState<any[]>(dashboardCache?.proposals ?? []);

  const [derivedStats, setDerivedStats] = useState(dashboardCache?.derivedStats ?? {
    reviewedToday: 0,
    underReview: 0,
    pending: 0,
    thisMonth: 0,
    thisWeek: 0,
    today: 0
  });

  const [monthlyReviews, setMonthlyReviews] = useState<{ month: string, count: number }[]>(dashboardCache?.monthlyReviews ?? []);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(!dashboardCache); // only show loader on first visit

  const fetchData = async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true);
    else if (!dashboardCache) setIsLoading(true);
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
        decline: 0,
        total: uniqueProposals.length
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
      const reviewedStatuses = ['approve', 'reject', 'revise', 'decline', 'accepted', 'rejected'];

      const reviewedProposals = uniqueProposals
        .filter((item: any) => reviewedStatuses.includes(item.status));

      reviewedProposals.sort((a: any, b: any) => b.updatedAt.getTime() - a.updatedAt.getTime());
      const topProposals = reviewedProposals.slice(0, 5);
      setProposals(topProposals);

      // 4b. Monthly Review Chart logic
      const monthCounts: Record<string, number> = {};
      reviewedProposals.forEach((p: any) => {
        if (p.updated_at) {
          const date = new Date(p.updated_at);
          const monthYear = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
          monthCounts[monthYear] = (monthCounts[monthYear] || 0) + 1;
        }
      });

      const mReviews = Object.entries(monthCounts)
        .map(([month, count]) => ({ month, count }))
        .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());

      if (mReviews.length === 0) {
        const todayDate = new Date();
        const mY = todayDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        mReviews.push({ month: mY, count: 0 });
      }
      setMonthlyReviews(mReviews);

      // 5. Calculate derived stats
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const todayCount = uniqueProposals.filter((p: any) => p.created_at >= startOfDay).length;
      const weekCount = uniqueProposals.filter((p: any) => p.created_at >= startOfWeek).length;
      const monthCount = uniqueProposals.filter((p: any) => p.created_at >= startOfMonth).length;

      const reviewedToday = uniqueProposals.filter((p: any) => reviewedStatuses.includes(p.status) && p.updated_at >= startOfDay).length;
      const underReviewCount = newStats.for_review;
      const pendingCount = newStats.pending;

      const newDerived = {
        reviewedToday,
        underReview: underReviewCount,
        pending: pendingCount,
        thisMonth: monthCount,
        thisWeek: weekCount,
        today: todayCount
      };
      setDerivedStats(newDerived);

      // Save to module-level cache
      dashboardCache = {
        statsData: newStats,
        proposals: topProposals,
        derivedStats: newDerived,
        monthlyReviews: mReviews,
      };

    } catch (error) {
      console.error("Failed to fetch dashboard data", error);
    } finally {
      if (isManualRefresh) setIsRefreshing(false);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = async () => {
    dashboardCache = null; // clear cache on manual refresh
    await fetchData(true);
  };

  if (isLoading) {
    return <PageLoader text="Loading dashboard..." />;
  }

  const stats = [
    {
      icon: FileText,
      label: "Total Proposals",
      value: statsData.total,
      color: "text-slate-600",
      bgColor: "bg-slate-50",
      borderColor: "border-slate-200",
      description: "Total assigned proposals"
    },
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
      icon: CheckCircle,
      label: "Reviewed Proposals",
      value: statsData.approve + statsData.revise,
      color: "text-emerald-500",
      bgColor: "bg-emerald-50",
      borderColor: "border-emerald-200",
      description: "Approved or revised"
    },
    {
      icon: XCircle,
      label: "Declined Proposals",
      value: statsData.reject + statsData.decline,
      color: "text-red-500",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
      description: "Declined or rejected"
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
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:border-[#C8102E] hover:text-[#C8102E] text-slate-700 text-sm font-medium rounded-xl shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Refresh Dashboard Data"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </header>

        {/* Stats Section */}
        <section className="mb-4 sm:mb-6" aria-labelledby="stats-heading">
          <h2 id="stats-heading" className="sr-only">
            Proposal Statistics
          </h2>
          <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
            {/* First three stats cards */}
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {stats.slice(0, 3).map((stat, index) => {
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

            {/* Fourth stats card aligned with endorsed proposals status box */}
            <div className="w-full lg:w-80">
              {(() => {
                const stat = stats[3];
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

        {/* Monthly Reviewed Submissions Section */}
        {monthlyReviews.length > 0 && (
          <section className="flex flex-col xl:flex-row gap-6 mb-4 sm:mb-6">
            <div
              className="bg-white shadow-xl rounded-2xl border border-slate-200 overflow-hidden flex-1 flex flex-col min-w-0"
              aria-labelledby="submissions-heading"
            >
              {/* Header */}
              <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h3 id="submissions-heading" className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-[#C8102E]" />
                    Monthly Reviewed Proposals
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Trends for the last {monthlyReviews.length} months
                  </p>
                </div>

                {/* Legend */}
                <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-slate-50 rounded-full border border-slate-200">
                  <div className="w-2 h-2 rounded-full bg-[#C8102E]"></div>
                  <span className="text-xs font-medium text-slate-600">Volume</span>
                </div>
              </div>

              {/* Chart Area - Responsive Wrapper */}
              <div className="p-4 sm:p-6 flex-1 flex flex-col min-h-[300px]">
                <div className="w-full h-64 sm:h-72 xl:flex-1 relative pt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={monthlyReviews}
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis
                        dataKey="month"
                        tickFormatter={(val) => val.substring(0, 3)}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#64748b', fontSize: 12 }}
                        dy={10}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#64748b', fontSize: 12 }}
                        dx={-10}
                      />
                      <RechartsTooltip
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                        formatter={(value: any) => [`${value} Proposals`, 'Volume']}
                      />
                      <Line
                        type="monotone"
                        dataKey="count"
                        stroke="#C8102E"
                        strokeWidth={3}
                        dot={{ r: 4, fill: '#C8102E', strokeWidth: 2, stroke: '#fff' }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Summary Stats Footer */}
              <div className="px-4 py-4 sm:px-6 sm:py-5 bg-slate-50 border-t border-slate-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-0 md:divide-x divide-slate-200">
                  <div className="flex flex-row md:flex-col items-center justify-between md:justify-center px-2 md:px-4 md:first:pl-0">
                    <p className="text-xs font-semibold text-slate-500 tracking-wider md:mb-1">Total Reviewed</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg sm:text-2xl font-bold text-slate-800">
                        {monthlyReviews.reduce((sum: number, m: any) => sum + m.count, 0)}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-row md:flex-col items-center justify-between md:justify-center px-2 md:px-4">
                    <p className="text-xs font-semibold text-slate-500 tracking-wider md:mb-1">Peak Month</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg sm:text-2xl font-bold text-slate-800">
                        {Math.max(...monthlyReviews.map((m: any) => m.count))}
                      </span>
                      <span className="text-xs text-slate-400">proposals</span>
                    </div>
                  </div>
                  <div className="flex flex-row md:flex-col items-center justify-between md:justify-center px-2 md:px-4">
                    <p className="text-xs font-semibold text-slate-500 tracking-wider md:mb-1">Monthly Average</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg sm:text-2xl font-bold text-slate-800">
                        {Math.round(monthlyReviews.reduce((sum: number, m: any) => sum + m.count, 0) / monthlyReviews.length) || 0}
                      </span>
                      <span className="text-xs text-slate-400">/ mo</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

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