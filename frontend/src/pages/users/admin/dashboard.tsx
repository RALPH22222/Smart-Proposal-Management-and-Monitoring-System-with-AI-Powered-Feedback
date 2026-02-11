import { useState, useEffect } from 'react';
import { useAuthContext } from '../../../context/AuthContext';
import {
  Users,
  FileText,
  CheckCircle,
  Clock,
  BarChart3,
  Cpu,
  Shield,
  Activity,
} from "lucide-react";

export default function DashboardAdmin() {
  const { user } = useAuthContext();
  const [displayedText, setDisplayedText] = useState({ prefix: '', name: '', suffix: '' });

  useEffect(() => {
    if (!user) return;

    const hasVisited = localStorage.getItem('admin_welcome_seen');
    const isNewUser = !hasVisited;

    if (isNewUser) {
      localStorage.setItem('admin_welcome_seen', 'true');
    }

    const firstName = user.first_name || 'Admin';
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

  const stats = [
    {
      icon: Users,
      label: "Total Users",
      value: 1284,
      color: "text-blue-500",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
    },
    {
      icon: FileText,
      label: "Total Proposals",
      value: 1560,
      color: "text-purple-500",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200",
    },
    {
      icon: Cpu,
      label: "System Uptime",
      value: "99.8%",
      color: "text-emerald-500",
      bgColor: "bg-emerald-50",
      borderColor: "border-emerald-200",
    },
  ];

  const systemMetrics = [
    {
      id: 1,
      metric: "Active Sessions",
      value: "284",
      trend: "+12%",
      status: "up",
    },
    {
      id: 2,
      metric: "Avg Response Time",
      value: "2.3 days",
      trend: "-0.5 days",
      status: "up",
    },
    {
      id: 3,
      metric: "Server Load",
      value: "45%",
      trend: "+8%",
      status: "warning",
    },
    {
      id: 4,
      metric: "Database Queries",
      value: "1.2k/min",
      trend: "Stable",
      status: "stable",
    },
    {
      id: 5,
      metric: "API Requests",
      value: "3.4k/min",
      trend: "+15%",
      status: "up",
    },
  ];

  const userActivity = [
    {
      id: 1,
      role: "Proponents",
      active: 450,
      total: 650,
      percentage: "69%",
    },
    {
      id: 2,
      role: "Evaluators",
      active: 38,
      total: 45,
      percentage: "84%",
    },
    {
      id: 3,
      role: "R&D Staff",
      active: 12,
      total: 15,
      percentage: "80%",
    },
    {
      id: 4,
      role: "Administrators",
      active: 3,
      total: 5,
      percentage: "60%",
    },
  ];

  return (
    <div className="flex flex-col gap-4 sm:gap-6 p-4 sm:p-6 h-full overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 pt-10 sm:pt-0 pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#C8102E] leading-tight min-h-[32px]">
              {displayedText.prefix}
              <span className="text-black">{displayedText.name}</span>
              {displayedText.suffix}
            </h1>
            <p className="text-slate-600 mt-2 text-sm leading-relaxed">
              System overview and performance metrics
            </p>
          </div>
        </div>
      </header>

      {/* Stats Section */}
      <section className="flex-shrink-0" aria-labelledby="stats-heading">
        <h2 id="stats-heading" className="sr-only">
          System Statistics
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
                  aria-label={`${stat.label}: ${stat.value}`}
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
                    {stat.value}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Third stats card */}
          <div className="w-full lg:w-80">
            {(() => {
              const stat = stats[2];
              const IconComponent = stat.icon;
              return (
                <div
                  className={`${stat.bgColor} ${stat.borderColor} border-2 rounded-2xl p-4 transition-all duration-300 hover:shadow-lg hover:scale-105 group cursor-pointer`}
                  role="button"
                  tabIndex={0}
                  aria-label={`${stat.label}: ${stat.value}`}
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
                    {stat.value}
                  </p>
                </div>
              );
            })()}
          </div>
        </div>
      </section>

      {/* Main Content Section */}
      <section className="flex flex-col lg:flex-row gap-4 lg:gap-6 flex-1 overflow-hidden">
        {/* System Metrics Table */}
        <div
          className="bg-white shadow-xl rounded-2xl border border-slate-200 overflow-hidden flex-1 flex flex-col"
          aria-labelledby="metrics-heading"
        >
          <div className="p-4 border-b border-slate-200 bg-slate-50">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h3
                id="metrics-heading"
                className="text-lg font-bold text-slate-800 flex items-center gap-2"
              >
                <Activity className="w-5 h-5 text-[#C8102E]" />
                System Performance Metrics
              </h3>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <BarChart3 className="w-4 h-4" />
                <span>Real-time monitoring</span>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto flex-1">
            <table
              className="w-full"
              role="table"
              aria-label="System metrics table"
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
                    Metric
                  </th>
                  <th
                    className="p-3 font-semibold text-xs uppercase tracking-wider hidden sm:table-cell"
                    scope="col"
                  >
                    Current Value
                  </th>
                  <th
                    className="p-3 font-semibold text-xs uppercase tracking-wider hidden lg:table-cell"
                    scope="col"
                  >
                    Trend
                  </th>
                </tr>
              </thead>
              <tbody>
                {systemMetrics.map((metric) => (
                  <tr
                    key={metric.id}
                    className="border-b border-slate-100 hover:bg-slate-50 transition-colors duration-200 group"
                    role="row"
                  >
                    <td
                      className="p-3 text-slate-600 font-medium tabular-nums text-sm"
                      role="cell"
                    >
                      {metric.id}
                    </td>
                    <td className="p-3" role="cell">
                      <div className="font-semibold text-slate-800 group-hover:text-[#C8102E] transition-colors duration-200 text-pretty text-sm">
                        {metric.metric}
                      </div>
                      <div className="text-xs text-slate-500 sm:hidden mt-1">
                        {metric.value} • {metric.trend}
                      </div>
                    </td>
                    <td
                      className="p-3 text-slate-700 hidden sm:table-cell text-sm"
                      role="cell"
                    >
                      {metric.value}
                    </td>
                    <td
                      className="p-3 text-slate-600 text-xs tabular-nums hidden lg:table-cell"
                      role="cell"
                    >
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${metric.status === "up"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : metric.status === "warning"
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-blue-50 text-blue-700 border border-blue-200"
                          }`}
                      >
                        {metric.trend}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Quick Actions */}
          <div className="p-4 bg-slate-50 border-t border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-xs text-slate-600">
              <button
                // Note: In a real app, replace window.location with prop navigation
                onClick={() => (window.location.href = "/users/admin/system")}
                className="text-[#C8102E] hover:text-[#A00E26] font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:ring-opacity-50 rounded px-2 py-1 cursor-pointer"
                aria-label="View system details"
              >
                System Details →
              </button>
            </div>
          </div>

          {/* Performance Summary */}
          <div className="p-4 bg-gradient-to-r from-slate-50 to-slate-100 border-t border-slate-200">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-600">
                  99.8%
                </div>
                <div className="text-xs text-slate-600">Uptime</div>
              </div>
              <div className="text-center border-x border-slate-300">
                <div className="text-2xl font-bold text-amber-600">45%</div>
                <div className="text-xs text-slate-600">Load Avg</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">2.3s</div>
                <div className="text-xs text-slate-600">Response Time</div>
              </div>
            </div>
          </div>
        </div>

        {/* User Activity & System Status Box */}
        <div className="bg-white shadow-xl rounded-2xl border border-slate-200 p-4 sm:p-6 w-full lg:w-80 flex flex-col">
          <h3 className="text-lg font-bold text-slate-800 mb-8 flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#C8102E]" />
            System Status
          </h3>

          <div className="space-y-6 flex-1 flex flex-col justify-center">
            {/* Active Users */}
            <div className="flex items-center justify-between p-5 bg-blue-50 rounded-xl border border-blue-200 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center gap-4">
                <Users className="w-6 h-6 text-blue-500" />
                <span className="font-semibold text-blue-700 text-base">
                  Active Users
                </span>
              </div>
              <span className="text-2xl font-bold text-blue-700">284</span>
            </div>

            {/* System Health */}
            <div className="flex items-center justify-between p-5 bg-emerald-50 rounded-xl border border-emerald-200 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center gap-4">
                <CheckCircle className="w-6 h-6 text-emerald-500" />
                <span className="font-semibold text-emerald-700 text-base">
                  System Health
                </span>
              </div>
              <span className="text-2xl font-bold text-emerald-700">
                99.8%
              </span>
            </div>

            {/* Pending Tasks */}
            <div className="flex items-center justify-between p-5 bg-amber-50 rounded-xl border border-amber-200 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center gap-4">
                <Clock className="w-6 h-6 text-amber-500" />
                <span className="font-semibold text-amber-700 text-base">
                  Pending Tasks
                </span>
              </div>
              <span className="text-2xl font-bold text-amber-700">12</span>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-200">
            <h4 className="text-sm font-semibold text-slate-700 mb-3">
              User Activity by Role
            </h4>
            <div className="space-y-3 text-xs text-slate-600">
              {userActivity.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between"
                >
                  <span>{user.role}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-800">
                      {user.active}/{user.total}
                    </span>
                    <span
                      className={`px-2 py-1 rounded-full ${parseInt(user.percentage) > 80
                        ? "bg-emerald-100 text-emerald-700"
                        : parseInt(user.percentage) > 60
                          ? "bg-amber-100 text-amber-700"
                          : "bg-red-100 text-red-700"
                        }`}
                    >
                      {user.percentage}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}