import React, { useState } from 'react';
import ProponentNavbar from '../../../components/proponent-component/Proponent-navbar';

// Page Components
import Submission from './submission'
import Profile from './Profile';
import Settings from './settings';

const ProponentLayout: React.FC = () => {
  // Controls which page is visible
  const [currentPage, setCurrentPage] = useState('submission');

  const renderContent = () => {
    switch (currentPage) {
      case 'submission':
        return <Submission />;
      case 'profile':
        return <Profile />;
      case 'settings':
        return <Settings />;
      default:
        return <Submission />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* 1. Navbar is rendered ONCE here */}
      <ProponentNavbar 
        currentPage={currentPage} 
        onPageChange={setCurrentPage} 
      />

      {/* 2. Main Content Area */}
      {/* pt-20 ensures content isn't hidden behind the fixed navbar */}
      <main className="flex-1 w-full h-full pt-20">
        {renderContent()}
      </main>
    </div>
  );
};

export default ProponentLayout;