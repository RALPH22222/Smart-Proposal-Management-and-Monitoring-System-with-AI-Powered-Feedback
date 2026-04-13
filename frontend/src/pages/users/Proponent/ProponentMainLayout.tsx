import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import ProponentNavbar from "../../../components/proponent-component/Proponent-sidebar";
import ProponentFloatingNotification from "../../../components/proponent-component/ProponentFloatingNotification";
import { LookupProvider } from "../../../context/LookupContext";

// Import Page Components
import Submission from "./submission";
import Profile from "./Profile";
import Settings from "./settings";
import Monitoring from "./monitoring";

const ProponentMainLayout: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const currentTab = searchParams.get("tab") || "profile";

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
        return <Profile />;
    }
  };

  return (
    <LookupProvider>
      <div className="min-h-screen bg-gray-50 flex">
        <div className="w-auto">
          <ProponentNavbar
            currentPage={currentTab}
            onPageChange={handlePageChange}
            isMobileMenuOpen={isMobileMenuOpen}
            setIsMobileMenuOpen={setIsMobileMenuOpen}
          />
        </div>

        <div className="flex-1 bg-gray-50 flex min-w-0 h-screen relative">
          <main
            className="flex-1 overflow-y-auto pt-14 lg:pt-0"
            onClick={() => isMobileMenuOpen && setIsMobileMenuOpen(false)}
          >
            {renderContent()}
          </main>
          <ProponentFloatingNotification onPageChange={handlePageChange} />
        </div>
      </div>
    </LookupProvider>
  );
};

export default ProponentMainLayout;
