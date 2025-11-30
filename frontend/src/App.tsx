// Auth
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Register from "./auth/register";
import Login from "./auth/login";

// Public
import LandingPage from "./pages/landingpage";
import About from "./pages/aboutpage";
import Contacts from "./pages/contacts";
import FAQ from "./pages/faqs";

// Admin
import DashboardAdmin from "./pages/users/admin/dashboard";
import Accounts from "./pages/users/admin/accounts";
import Reports from "./pages/users/admin/reports";
import Contents from "./pages/users/admin/contents";
import System from "./pages/users/admin/system";
import SettingsAdmin from "./pages/users/admin/settings";

// R&D
import RndMainLayout from "./pages/users/rnd/RnDMainLayout";

// Evaluator
import EvaluatorMainLayout from "./pages/users/evaluator/MainLayout";

//Proponent
import ProponentMainLayout from "./pages/users/proponent/ProponentMainLayout";
// import Submission from "./pages/users/proponent/submission";
// import Profile from "./pages/users/proponent/Profile";
// import Settings from "./pages/users/proponent/settings";

// Loading animation
import {
  LoadingProvider,
  LocationWatcher,
  LoadingOverlay,
} from "./contexts/LoadingContext";
import ProtectedRoute from "./components/ProtectedRoute";
import { Role } from "./types/auth";
import RedirectAuthenticated from "./components/RedirectAuthenticated";
import { AuthProvider } from "./context/AuthProvider";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <LoadingProvider>
          <LocationWatcher />
          <Routes>
            <Route element={<RedirectAuthenticated />}>
              <Route path="/" element={<LandingPage />} />
              <Route path="/about" element={<About />} />
              <Route path="/contacts" element={<Contacts />} />
              <Route path="/faqs" element={<FAQ />} />
              <Route path="/register" element={<Register />} />
              <Route path="/login" element={<Login />} />
            </Route>

            {/* Admin */}
            <Route element={<ProtectedRoute roles={[Role.ADMIN]} />}>
              <Route
                path="/users/admin/dashboard"
                element={<DashboardAdmin />}
              />
              <Route path="/users/admin/accounts" element={<Accounts />} />
              <Route path="/users/admin/reports" element={<Reports />} />
              <Route path="/users/admin/contents" element={<Contents />} />
              <Route path="/users/admin/system" element={<System />} />
              <Route path="/users/admin/settings" element={<SettingsAdmin />} />
            </Route>

            {/* Evaluator */}
            <Route element={<ProtectedRoute roles={[Role.EVALUATOR]} />}>
              <Route path="/users/evaluator/*" element={<EvaluatorMainLayout />}/>
            </Route>

            {/* R&D */}
            <Route element={<ProtectedRoute roles={[Role.RND]} />}>
              <Route path="/users/rnd/*" element={<RndMainLayout />} />
            </Route>

            {/* Proponent */}
            <Route element={<ProtectedRoute roles={[Role.PROPONENT]} />}>
              <Route path="/users/proponent/ProponentMainLayout" element={<ProponentMainLayout />} />
            </Route>
          </Routes>
          <LoadingOverlay />
        </LoadingProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
