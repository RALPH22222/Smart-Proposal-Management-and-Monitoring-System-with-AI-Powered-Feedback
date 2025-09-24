import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from "./pages/landingpage";
import Register from "./auth/register";
import Login from "./auth/login";

// Admin
import DashboardAdmin from "./pages/users/admin/dashboard";
import Accounts from "./pages/users/admin/accounts";
import Reports from "./pages/users/admin/reports";
import Contents from "./pages/users/admin/contents";

// RDEC
import RdecPage from "./pages/users/rdec/RdecPage";
import Dashboard from './pages/users/rdec/Dashboard';
import Proposals from './pages/users/rdec/Proposals';
import Notifications from './pages/users/rdec/Notifications';
import Settings from './pages/users/rdec/Settings';
import Endorsed from './pages/users/rdec/Endorsed';

// Loading animation
import { LoadingProvider, LocationWatcher, LoadingOverlay } from "./contexts/LoadingContext";

function App() {
  return (
   <BrowserRouter>
      <LoadingProvider>
        <LocationWatcher />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/users/admin/dashboard" element={<DashboardAdmin />} />
          <Route path="/users/admin/accounts" element={<Accounts />} />
          <Route path="/users/admin/reports" element={<Reports />} />
          <Route path="/users/admin/contents" element={<Contents />} />
          // RDEC
          <Route element={<RdecPage />}>
            <Route path="/users/rdec/dashboard" element={<Dashboard />} />
            <Route path="/users/rdec/proposals" element={<Proposals />} />
            <Route path="/users/rdec/notifications" element={<Notifications />} />
            <Route path="/users/rdec/settings" element={<Settings />} />
            <Route path="/users/rdec/endorsed" element={<Endorsed />} />
          </Route>
        </Routes>
        <LoadingOverlay />
      </LoadingProvider>
    </BrowserRouter>
  );
}

export default App;