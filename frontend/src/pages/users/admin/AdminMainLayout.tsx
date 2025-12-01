import React, { useState } from "react";
import AdminSidebar from "../../../components/admin-component/sidebar";

// Import Pages
import Dashboard from "./dashboard";
import Accounts from "./accounts";
import Contents from "./contents";
import Reports from "./reports";
import Settings from "./settings";
import System from "./system";

const AdminLayout: React.FC = () => {
  const [currentPage, setCurrentPage] = useState("dashboard");

  const renderContent = () => {
    switch (currentPage) {
      case "dashboard":
        return <Dashboard />;
      case "accounts":
        return <Accounts />;
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
      {/* 1. Sidebar - Controlled by props */}
      <AdminSidebar currentPage={currentPage} onPageChange={setCurrentPage} />

      {/* 2. Main Content Area */}
      <main className="flex-1 h-full overflow-y-auto relative transition-all duration-300">{renderContent()}</main>
    </div>
  );
};

export default AdminLayout;
