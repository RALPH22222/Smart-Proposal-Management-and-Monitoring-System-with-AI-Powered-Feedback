import React from "react";
import { useSearchParams } from "react-router-dom";
import AdminSidebar from "../../../components/admin-component/sidebar";
import AdminFloatingNotification from "../../../components/admin-component/AdminFloatingNotification";
import { LookupProvider } from "../../../context/LookupContext";

import Dashboard from "./dashboard";
import Accounts from "./accounts";
import Contents from "./contents";
import Settings from "./settings";
import Proposals from "./proposals";
import Evaluators from "./evaluator";
import EvaluatorPerformance from "./evaluator-performance";
import Monitoring from "./monitoring";
import Endorsements from "./endorsement";
import Funding from "./funding";
import Activity from "./activity";
import Lookups from "./lookups";
import ProponentSubmission from "../Proponent/submission";
import ProponentMonitoring from "../Proponent/monitoring";
import EvaluatorReview from "../evaluator/ReviewProposals";
import EvaluatorReviewed from "../evaluator/ReviewedProposals";
import { ActivityApi } from "../../../services/admin/ActivityApi";
import { getProposals } from "../../../services/proposal.api";
import type { DashboardStats } from "../../../services/admin/ActivityApi";

type ExtendedDashboardStats = DashboardStats & {
  proposals: DashboardStats['proposals'] & {
    daily_submissions?: { date: string; count: number }[];
  }
};

const AdminLayout: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get("tab") || "dashboard";
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const [stats, setStats] = React.useState<ExtendedDashboardStats | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchStats = async () => {
    try {
      const [statsData, proposalsData] = await Promise.all([
        ActivityApi.getDashboardStats(),
        getProposals()
      ]);

      // Calculate daily submissions for the last 14 days
      const dayCounts: Record<string, number> = {};
      const today = new Date();
      
      // Initialize last 14 days with 0 counts
      for (let i = 13; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dateKey = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'Asia/Manila' });
        dayCounts[dateKey] = 0;
      }
      
      proposalsData.forEach((p: any) => {
        const dateStr = p.created_at || (p.proposal_id && p.proposal_id.created_at);
        if (dateStr) {
          const date = new Date(dateStr);
          const dateKey = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'Asia/Manila' });
          // Only count if within last 14 days
          if (dayCounts.hasOwnProperty(dateKey)) {
            dayCounts[dateKey] = (dayCounts[dateKey] || 0) + 1;
          }
        }
      });

      const daily_submissions = Object.entries(dayCounts)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      const statsWithDaily = {
        ...statsData,
        proposals: { ...statsData.proposals, daily_submissions }
      };

      setStats(statsWithDaily as any);
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
      case "proponent-submission":
        return <ProponentSubmission />;
      case "proponent-monitoring":
        return <ProponentMonitoring viewRole="admin" />;
      case "eval-review":
        return <EvaluatorReview />;
      case "eval-reviewed":
        return <EvaluatorReviewed />;
      case "evaluators":
        return <Evaluators />;
      case "evaluator-performance":
        return <EvaluatorPerformance />;
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
    <LookupProvider>
      <div className="flex h-screen bg-gradient-to-br from-slate-50 to-slate-100 overflow-hidden">
        {/* Sidebar - Controlled by props */}
        <AdminSidebar currentPage={currentTab} onPageChange={handlePageChange} isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen} />

        {/* Main Content Area */}
        <div className="flex-1 h-full flex flex-col min-w-0 relative">
          <main
            className="flex-1 overflow-y-auto transition-all duration-300"
            onClick={() => isMobileMenuOpen && setIsMobileMenuOpen(false)}
          >
            {renderContent()}
          </main>
          <AdminFloatingNotification onPageChange={handlePageChange} />
        </div>
      </div>
    </LookupProvider>
  );
};

export default AdminLayout;
