import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import MultiSidebar from "../../../components/shared/MultiSidebar";
import MultiRoleFloatingNotification from "../../../components/shared/MultiRoleFloatingNotification";
import { LookupProvider } from "../../../context/LookupContext";
import { useAuthContext } from "../../../context/AuthContext";

// Proponent Pages
import ProponentSubmission from "../Proponent/submission";
import ProponentProfile from "../Proponent/Profile";
import ProponentMonitoring from "../Proponent/monitoring";
import MultiRoleSettings from "./MultiRoleSettings";

// Evaluator Pages
import EvaluatorDashboard from "../evaluator/DashboardEvaluator";
import EvaluatorProposals from "../evaluator/Proposals";
import EvaluatorReview from "../evaluator/ReviewProposals";
import EvaluatorReviewed from "../evaluator/ReviewedProposals";
// R&D Pages
import RndDashboard from "../rnd/RndDashboard";
import RndProposals from "../rnd/RndProposalPage";
import RndEvaluators from "../rnd/RnDEvaluatorPage";
import RndEndorsements from "../rnd/RnDEndorsePage";
import RndFunding from "../rnd/RnDFundingPage";
import RndMonitoring from "../rnd/RnDMonitoringPage";

// R&D Dashboard Data Helper
import { type Statistics, type Activity } from "../../../types/InterfaceProposal";
import { proposalApi } from "../../../services/RndProposalApi/ProposalApi";
import { getProposalsForEndorsement } from '../../../services/proposal.api';
import { fetchFundedProjects } from '../../../services/ProjectMonitoringApi';

export interface RnDAttention {
  readyForEndorsement: number;
  overdueReports: number;
  pendingFundRequests: number;
}

const MultiRoleMainLayout: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user } = useAuthContext();
  
  // R&D Shared State for Dashboard & Monitoring
  const [rndStatistics, setRndStatistics] = useState<Statistics>({
    totalProposals: 0,
    pendingProposals: 0,
    acceptedProposals: 0,
    rejectedProposals: 0,
    revisionRequiredProposals: 0,
    monthlySubmissions: []
  });
  const [rndRecentActivity, setRndRecentActivity] = useState<Activity[]>([]);
  const [isLoadingRndDashboard, setIsLoadingRndDashboard] = useState(true);
  const [rndAttention, setRndAttention] = useState<RnDAttention>({
    readyForEndorsement: 0,
    overdueReports: 0,
    pendingFundRequests: 0,
  });

  // Default to Proponent Profile, or Dashboard if RND/Evaluator based on roles
  const userRoles = (user as any)?.roles || [];
  const defaultRoleGroup = userRoles.includes("proponent") ? "proponent" 
                         : userRoles.includes("rnd") ? "rnd" 
                         : userRoles.includes("evaluator") ? "evaluator" 
                         : "proponent";

  const defaultTab = defaultRoleGroup === "proponent" ? "profile" : "dashboard";

  const currentRoleGroup = searchParams.get("role") || defaultRoleGroup;
  const currentTab = searchParams.get("tab") || defaultTab;

  useEffect(() => {
    if (currentRoleGroup === "rnd") {
      loadRndData();
    }
  }, [currentRoleGroup]);

  const loadRndData = async () => {
    setIsLoadingRndDashboard(true);
    try {
      const [{ statistics: statsData, recentActivity: activityData }, endorsementList, projects] =
        await Promise.all([
          proposalApi.fetchDashboardData(),
          getProposalsForEndorsement('active').catch(() => []),
          fetchFundedProjects('rnd').catch(() => []),
        ]);
      setRndStatistics(statsData);
      setRndRecentActivity(activityData);
      setRndAttention({
        readyForEndorsement: (endorsementList || []).filter((p: any) => p.readyForEndorsement).length,
        overdueReports: (projects || []).reduce(
          (sum: number, p: any) => sum + (p.overdue_reports_count || 0),
          0,
        ),
        pendingFundRequests: (projects || []).reduce(
          (sum: number, p: any) => sum + (p.pending_fund_requests_count || 0),
          0,
        ),
      });
    } catch (error) {
      console.error('Error loading RND data:', error);
    } finally {
      setIsLoadingRndDashboard(false);
    }
  };

  const handlePageChange = (roleGroup: string, page: string) => {
    // Determine target role group if only page is passed (like from floating notifications)
    // Floating notifications usually send just string paths, so we default to keeping the same roleGroup
    const targetRoleGroup = roleGroup === 'system' ? currentRoleGroup : roleGroup;
    setSearchParams({ role: targetRoleGroup, tab: page });
  };

  // Helper single string wrapper for floating notifications
  const stringHandlePageChange = (page: string) => {
    setSearchParams({ role: currentRoleGroup, tab: page });
  };

  const renderContent = () => {
    if (currentTab === "settings") {
      return <MultiRoleSettings />;
    }

    if (currentRoleGroup === "proponent") {
      switch (currentTab) {
        case "submission": return <ProponentSubmission />;
        case "profile": return <ProponentProfile />;
        case "monitoring": return <ProponentMonitoring />;
        default: return <ProponentProfile />;
      }
    } else if (currentRoleGroup === "evaluator") {
      switch (currentTab) {
        case "dashboard": return <EvaluatorDashboard />;
        case "proposals": return <EvaluatorProposals />;
        case "review": return <EvaluatorReview />;
        case "reviewed": return <EvaluatorReviewed />;
        default: return <EvaluatorDashboard />;
      }
    } else if (currentRoleGroup === "rnd") {
      switch (currentTab) {
        case "dashboard": return (
          <RndDashboard 
            statistics={rndStatistics} 
            recentActivity={rndRecentActivity} 
            onRefresh={loadRndData} 
            isLoading={isLoadingRndDashboard}
            attention={rndAttention}
            onPageChange={(page) => handlePageChange('rnd', page)}
          />
        );
        case "proposals": return <RndProposals />;
        case "evaluators": return <RndEvaluators />;
        case "endorsements": return <RndEndorsements />;
        case "funding": return <RndFunding />;
        case "monitoring": return <RndMonitoring onStatsUpdate={loadRndData} />;
        default: return (
          <RndDashboard 
            statistics={rndStatistics} 
            recentActivity={rndRecentActivity} 
            onRefresh={loadRndData} 
            isLoading={isLoadingRndDashboard}
            attention={rndAttention}
            onPageChange={(page) => handlePageChange('rnd', page)}
          />
        );
      }
    }

    // Fallback
    return <ProponentProfile />;
  };



  return (
    <LookupProvider>
      <div className="min-h-screen bg-gray-50 flex">
        <div className="w-auto">
          <MultiSidebar
            currentRoleGroup={currentRoleGroup}
            currentPage={currentTab}
            onPageChange={handlePageChange}
            isMobileMenuOpen={isMobileMenuOpen}
            setIsMobileMenuOpen={setIsMobileMenuOpen}
          />
        </div>

        <div className="flex-1 bg-gray-50 flex min-w-0 h-screen relative">
          <main
            className="flex-1 overflow-y-auto"
            onClick={() => isMobileMenuOpen && setIsMobileMenuOpen(false)}
          >
            {renderContent()}
          </main>
          <MultiRoleFloatingNotification onPageChange={stringHandlePageChange} />
        </div>
      </div>
    </LookupProvider>
  );
};

export default MultiRoleMainLayout;
