import React from "react";
import { useSearchParams } from "react-router-dom";
import AdminSidebar from "../../../components/admin-component/sidebar";

import Dashboard from "./dashboard";
import Accounts from "./accounts";
import Contents from "./contents";
import Settings from "./settings";
import Proposals from "./proposals";
import Evaluators from "./evaluator";
import Monitoring from "./monitoring";
import Endorsements from "./endorsement";
import Funding from "./funding";
import Activity from "./activity";
import Lookups from "./lookups";
import { ActivityApi } from "../../../services/admin/ActivityApi";
import { getProposals } from "../../../services/proposal.api";
import type { DashboardStats } from "../../../services/admin/ActivityApi";

type ExtendedDashboardStats = DashboardStats & {
  proposals: DashboardStats['proposals'] & {
    monthly_submissions?: { month: string; count: number }[];
  }
};

const AdminLayout: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get("tab") || "dashboard";

  const [stats, setStats] = React.useState<ExtendedDashboardStats | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchStats = async () => {
    try {
      const [statsData, proposalsData] = await Promise.all([
        ActivityApi.getDashboardStats(),
        getProposals()
      ]);

      const monthCounts: Record<string, number> = {};
      proposalsData.forEach((p: any) => {
        const dateStr = p.created_at || (p.proposal_id && p.proposal_id.created_at);
        if (dateStr) {
          const date = new Date(dateStr);
          const monthYear = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'Asia/Manila' });
          monthCounts[monthYear] = (monthCounts[monthYear] || 0) + 1;
        }
      });

      const monthly_submissions = Object.entries(monthCounts)
        .map(([month, count]) => ({ month, count }))
        .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());

      if (monthly_submissions.length === 0) {
        const today = new Date();
        const monthYear = today.toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'Asia/Manila' });
        monthly_submissions.push({ month: monthYear, count: 0 });
      }

      const statsWithMonthly = {
        ...statsData,
        proposals: { ...statsData.proposals, monthly_submissions }
      };

      setStats(statsWithMonthly as any);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard stats');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchStats();
  }, []);

  const handlePageChange = (page: string) => {
    setSearchParams({ tab: page });
  };

  const renderContent = () => {
    switch (currentTab) {
      case "dashboard":
        return <Dashboard stats={stats} loading={loading} error={error} onRefresh={fetchStats} />;
      case "accounts":
        return <Accounts />;
      case "proposals":
        return <Proposals />;
      case "evaluators":
        return <Evaluators />;
      case "endorsements":
        return <Endorsements />;
      case "project-funding":
        return <Funding />;
      case "monitoring":
        return <Monitoring />;
      case "lookups":
        return <Lookups />;
      case "contents":
        return <Contents />;
      case "activity":
        return <Activity />;
      case "settings":
        return <Settings />;
      default:
        return <Dashboard stats={stats} loading={loading} error={error} onRefresh={fetchStats} />;
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 to-slate-100 overflow-hidden">
      {/* Sidebar - Controlled by props */}
      <AdminSidebar currentPage={currentTab} onPageChange={handlePageChange} />

      {/* Main Content Area */}
      <main className="flex-1 h-full overflow-y-auto relative transition-all duration-300">
        {renderContent()}
      </main>
    </div>
  );
};

export default AdminLayout;
