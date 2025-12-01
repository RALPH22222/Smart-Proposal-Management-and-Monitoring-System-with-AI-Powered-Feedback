import React, { useEffect } from "react";
import { useSearchParams } from "react-router-dom"; // Import useSearchParams
import ProponentNavbar from "../../../components/proponent-component/Proponent-navbar";

// Import Page Components
import Submission from "./submission";
import Profile from "./Profile";
import Settings from "./settings";
import Monitoring from "./monitoring";

const ProponentMainLayout: React.FC = () => {
  // Use search params to control the "page" state without changing routes in App.tsx
  const [searchParams, setSearchParams] = useSearchParams();

  // Get current tab from URL, default to 'submission'
  const currentTab = searchParams.get("tab") || "submission";

  const handlePageChange = (page: string) => {
    setSearchParams({ tab: page });
  };

  const renderContent = () => {
    switch (currentTab) {
      case "submission":
        return <Submission />;
      case "profile":
        return <Profile />;
      case "settings":
        return <Settings />;
      case "monitoring":
        return <Monitoring />;
      default:
        return <Submission />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Navbar controls the URL params */}
      <ProponentNavbar currentPage={currentTab} onPageChange={handlePageChange} />

      {/* Main Content Area */}
      <main className="flex-1 w-full h-full pt-20">{renderContent()}</main>
    </div>
  );
};

export default ProponentMainLayout;
