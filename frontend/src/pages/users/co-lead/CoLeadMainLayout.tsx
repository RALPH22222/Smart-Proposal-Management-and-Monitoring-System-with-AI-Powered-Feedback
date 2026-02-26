import { useSearchParams } from "react-router-dom";
import CoLeadNavbar from "../../../components/co-lead-component/CoLeadNavbar";
import Profile from "../Proponent/Profile";
import CoLeadProjects from "./CoLeadProjects";

const CoLeadMainLayout: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get("tab") || "profile";

  const handlePageChange = (page: string) => {
    setSearchParams({ tab: page });
  };

  const renderContent = () => {
    switch (currentTab) {
      case "projects":
        return <CoLeadProjects />;
      case "profile":
      default:
        return <Profile />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <CoLeadNavbar currentPage={currentTab} onPageChange={handlePageChange} />
      <main className="flex-1 w-full h-full pt-20">{renderContent()}</main>
    </div>
  );
};

export default CoLeadMainLayout;
