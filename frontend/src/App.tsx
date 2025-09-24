import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from "./pages/landingpage";
import Register from "./auth/register";
import Login from "./auth/login";

// Admin
import DashboardAdmin from "./pages/users/admin/dashboard";
import Accounts from "./pages/users/admin/accounts";
import Reports from "./pages/users/admin/reports";
import Contents from "./pages/users/admin/contents";
import Reviews from "./pages/users/admin/reviews";
import SettingsAdmin from "./pages/users/admin/settings";

// RDEC
import RdecPage from "./pages/users/rdec/RdecPage";
import DashboardRdec from './pages/users/rdec/Dashboard';
import Proposals from './pages/users/rdec/Proposals';
import Notifications from './pages/users/rdec/Notifications';
import SettingsRdec from './pages/users/rdec/Settings';
import Endorsed from './pages/users/rdec/Endorsed';

//Proponent
import Dashboard from "./pages/users/Proponent/dashboard";
import Profile from "./pages/users/Proponent/Profile";
import Settings from "./pages/users/Proponent/settings";

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
            <Route path="/users/rdec/dashboard" element={<DashboardRdec />} />
            <Route path="/users/rdec/proposals" element={<Proposals />} />
            <Route path="/users/rdec/notifications" element={<Notifications />} />
            <Route path="/users/rdec/settings" element={<SettingsRdec />} />
            <Route path="/users/rdec/endorsed" element={<Endorsed />} />
          </Route>
          <Route path="/users/Proponent/dashboard" element={<Dashboard />} />
          <Route path="/users/Proponent/profile" element={<Profile />} />
          <Route path="/users/Proponent/settings" element={<Settings />} />
        </Routes>
        <LoadingOverlay />
      </LoadingProvider>
    </BrowserRouter>
  );
}

export default App;