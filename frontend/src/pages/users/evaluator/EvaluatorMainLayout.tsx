import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Sidebar from '../../../components/evaluator-component/EvaluatorSide';
import Dashboard from './DashboardEvaluator';
import ReviewPage from './ReviewProposals';
import ReviewedPage from './ReviewedProposals';
import Proposals from './Proposals';
import Notifications from './Notifications';
import Settings from './Settings';

const EvaluatorLayout: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);

  const currentTab = searchParams.get("tab") || "dashboard";

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, [currentTab]);

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
      <main className="flex-1 h-full overflow-y-auto relative transition-all duration-300">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C8102E] mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading {currentTab.replace('-', ' ')}...</p>
            </div>
          </div>
        ) : (
          renderContent()
        )}
      </main>
    </div>
  );
};

export default EvaluatorLayout;