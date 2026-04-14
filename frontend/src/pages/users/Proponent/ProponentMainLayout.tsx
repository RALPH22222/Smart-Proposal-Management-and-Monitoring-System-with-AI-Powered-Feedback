import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import ProponentNavbar from "../../../components/proponent-component/Proponent-sidebar";
import ProponentFloatingNotification from "../../../components/proponent-component/ProponentFloatingNotification";
import { LookupProvider } from "../../../context/LookupContext";
import { useAuthContext } from "../../../context/AuthContext";
import { isExternalAccount } from "../../../context/AuthContext";

// Import Page Components
import Submission from "./submission";
import Profile from "./Profile";
import Settings from "./settings";
import Monitoring from "./monitoring";

const ProponentMainLayout: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user } = useAuthContext();
  const isExternal = isExternalAccount(user);

  // External collaborators land on monitoring by default and cannot access the
  // submission tab. If they navigate there directly via URL, we rewrite the query
  // param so they land on monitoring instead.
  const rawTab = searchParams.get("tab") || (isExternal ? "monitoring" : "profile");
  const currentTab = isExternal && rawTab === "submission" ? "monitoring" : rawTab;

  useEffect(() => {
    if (isExternal && searchParams.get("tab") === "submission") {
      setSearchParams({ tab: "monitoring" });
    }
  }, [isExternal, searchParams, setSearchParams]);

  const handlePageChange = (page: string) => {
    // Defensive: don't let the sidebar route external users into submission even if the
    // button is somehow rendered. Sidebar also hides it — this is belt-and-suspenders.
    if (isExternal && page === "submission") {
      setSearchParams({ tab: "monitoring" });
      return;
    }
    setSearchParams({ tab: page });
  };

  const renderContent = () => {
    switch (currentTab) {
      case "submission":
        return isExternal ? <Monitoring /> : <Submission />;
      case "profile":
        return <Profile />;
      case "settings":
        return <Settings />;
      case "monitoring":
        return <Monitoring />;
      default:
        return isExternal ? <Monitoring /> : <Profile />;
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
