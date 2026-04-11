import React from "react";
import { useSearchParams } from "react-router-dom";
import Sidebar from '../../../components/evaluator-component/EvaluatorSide';
import Dashboard from './DashboardEvaluator';
import ReviewPage from './ReviewProposals';
import ReviewedPage from './ReviewedProposals';
import Proposals from './Proposals';
import Notifications from './Notifications';
import Settings from './Settings';
import EvaluatorTopNavbar from '../../../components/evaluator-component/EvaluatorTopNavbar';

const EvaluatorLayout: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const currentTab = searchParams.get("tab") || "dashboard";

  const handlePageChange = (page: string) => {
    setSearchParams({ tab: page });
  };

  const renderContent = () => {
    switch (currentTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'proposals':
        return <Proposals />;
      case 'review':
        return <ReviewPage />;
      case 'reviewed':
        return <ReviewedPage />;
      case 'notifications':
        return <Notifications />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        currentPage={currentTab}
        onPageChange={handlePageChange}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen">
        <EvaluatorTopNavbar onPageChange={handlePageChange} />
        <main className="flex-1 overflow-y-auto relative transition-all duration-300">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default EvaluatorLayout;