import { useSearchParams } from "react-router-dom";
import AdminSidebar from "../../../components/admin-component/sidebar";

import Dashboard from "./dashboard";
import Accounts from "./accounts";
import Contents from "./contents";
import Reports from "./reports";
import Settings from "./settings";
import System from "./system";
import Proposals from "./proposals"
import Evaluators from "./evaluator"
import Monitoring from "./monitoring"

const AdminLayout: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const currentTab = searchParams.get("tab") || "dashboard";

  const handlePageChange = (page: string) => {
    setSearchParams({ tab: page });
  };

  const renderContent = () => {
    switch (currentTab) {
      case "dashboard":
        return <Dashboard />;
      case "accounts":
        return <Accounts />;
      case "proposals":
        return <Proposals />; 
      case "evaluators":
        return <Evaluators />;    
      case "monitoring":
        return <Monitoring />; 
      case "contents":
        return <Contents />;
      case "reports":
        return <Reports />;
      case "system":
        return <System />;
      case "settings":
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 to-slate-100 overflow-hidden">
      {/* Sidebar - Controlled by props */}
      <AdminSidebar currentPage={currentTab} onPageChange={handlePageChange} />

      {/* Main Content Area */}
      <main className="flex-1 h-full overflow-y-auto relative transition-all duration-300">{renderContent()}</main>
    </div>
  );
};

export default AdminLayout;
