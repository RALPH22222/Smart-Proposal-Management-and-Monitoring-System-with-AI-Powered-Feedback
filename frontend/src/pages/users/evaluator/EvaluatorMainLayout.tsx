import React, { useState } from 'react';
import Sidebar from '../../../components/evaluator-component/EvaluatorSide';
import Dashboard from './DashboardEvaluator';
import ReviewPage from './ReviewProposals';  
import ReviewedPage from './ReviewedProposals';
import Proposals from './Proposals';
import Notifications from './Notifications';
import Settings from './Settings';

const EvaluatorLayout: React.FC = () => {
  const [currentPage, setCurrentPage] = useState('dashboard');

  const renderContent = () => {
    switch (currentPage) {
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
        currentPage={currentPage} 
        onPageChange={setCurrentPage}
      />

      {/* Main Content Area */}
      <main className="flex-1 h-full overflow-y-auto relative transition-all duration-300">
        {renderContent()}
      </main>
    </div>
  );
};

export default EvaluatorLayout;