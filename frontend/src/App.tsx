// Auth
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Register from "./auth/register";
import Login from "./auth/login";

// Public
import LandingPage from "./pages/landingpage";
import About from "./pages/aboutpage";
import Contacts from "./pages/contacts";
// import Services from "./pages/services";
import FAQ from "./pages/faqs";

// Admin
import DashboardAdmin from "./pages/users/admin/dashboard";
import Accounts from "./pages/users/admin/accounts";
import Reports from "./pages/users/admin/reports";
import Contents from "./pages/users/admin/contents";
import System from "./pages/users/admin/system";
import SettingsAdmin from "./pages/users/admin/settings";

// R&D
import RndMainLayout from './pages/users/rnd/RnDMainLayout';

// Evaluator
import DashboardEvaluator from "./pages/users/evaluator/DashboardEvaluator";
import Proposals from "./pages/users/evaluator/Proposals";
import Notifications from "./pages/users/evaluator/Notifications";
import SettingsEvaluator from "./pages/users/evaluator/Settings";
import ReviewProposals from "./pages/users/evaluator/ReviewProposals";
import ReviewedProposals from "./pages/users/evaluator/ReviewedProposals";

//Proponent
import Dashboard from "./pages/users/proponent/dashboard"
import Profile from "./pages/users/proponent/Profile";
import Settings from "./pages/users/proponent/settings";

// Loading animation
import {
  LoadingProvider,
  LocationWatcher,
  LoadingOverlay,
} from "./contexts/LoadingContext";

function App() {
  return (
    <BrowserRouter>
      <LoadingProvider>
        <LocationWatcher />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/about" element={<About />} />
          <Route path="/contacts" element={<Contacts />} />
          {/* <Route path="/services" element={<Services />} /> */}
          <Route path="/faqs" element={<FAQ />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />

          {/* Admin */}
          <Route path="/users/admin/dashboard" element={<DashboardAdmin />} />
          <Route path="/users/admin/accounts" element={<Accounts />} />
          <Route path="/users/admin/reports" element={<Reports />} />
          <Route path="/users/admin/contents" element={<Contents />} />
          <Route path="/users/admin/system" element={<System />} />
          <Route path="/users/admin/settings" element={<SettingsAdmin />} />

          {/* Evaluator */}
          <Route path="/users/evaluator/dashboard" element={<DashboardEvaluator />} />
          <Route path="/users/evaluator/proposals" element={<Proposals />} />
          <Route path="/users/evaluator/notifications" element={<Notifications />} />
          <Route path="/users/evaluator/settings" element={<SettingsEvaluator />} />
          <Route path="/users/evaluator/review" element={<ReviewProposals />} />
					<Route path="/users/evaluator/reviewed" element={<ReviewedProposals />} />

          {/* R&D */}
          <Route path="/users/rnd/*" element={<RndMainLayout />} />

          {/* Proponent */}
          <Route path="/users/proponent/dashboard" element={<Dashboard />} />
          <Route path="/users/proponent/profile" element={<Profile />} />
          <Route path="/users/proponent/settings" element={<Settings />} />
        </Routes>
        <LoadingOverlay />
      </LoadingProvider>
    </BrowserRouter>
  );
}

export default App;
