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
import AdminMainLayout from "./pages/users/admin/AdminMainLayout";

// R&D
import RndMainLayout from "./pages/users/rnd/RnDMainLayout";

// Evaluator
import EvaluatorMainLayout from "./pages/users/evaluator/EvaluatorMainLayout";

//Proponent
import ProponentMainLayout from "./pages/users/proponent/ProponentMainLayout";

// Loading animation
import { LoadingProvider, LocationWatcher, LoadingOverlay } from "./contexts/LoadingContext";
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
            {/* Public Routes */}
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
<<<<<<< Updated upstream
              <Route path="/users/admin/AdminMainLayout" element={<AdminMainLayout />} />
=======
              <Route path="/users/admin/dashboard" element={<DashboardAdmin />} />
              <Route path="/users/admin/accounts" element={<Accounts />} />
              <Route path="/users/admin/reports" element={<Reports />} />
              <Route path="/users/admin/contents" element={<Contents />} />
              <Route path="/users/admin/system" element={<System />} />
              <Route path="/users/admin/settings" element={<SettingsAdmin />} />
>>>>>>> Stashed changes
            </Route>

            {/* Evaluator */}
            <Route element={<ProtectedRoute roles={[Role.EVALUATOR]} />}>
<<<<<<< Updated upstream
              <Route path="/users/evaluator/EvaluatorMainLayout" element={<EvaluatorMainLayout />}/>
=======
              <Route path="/users/evaluator/dashboard" element={<DashboardEvaluator />} />
              <Route path="/users/evaluator/proposals" element={<Proposals />} />
              <Route path="/users/evaluator/notifications" element={<Notifications />} />
              <Route path="/users/evaluator/settings" element={<SettingsEvaluator />} />
              <Route path="/users/evaluator/review" element={<ReviewProposals />} />
              <Route path="/users/evaluator/reviewed" element={<ReviewedProposals />} />
>>>>>>> Stashed changes
            </Route>

            {/* R&D */}
            <Route element={<ProtectedRoute roles={[Role.RND]} />}>
<<<<<<< Updated upstream
              <Route path="/users/rnd/RndMainLayout" element={<RndMainLayout />} />
=======
              <Route path="/users/rnd/*" element={<RndMainLayout />} />
>>>>>>> Stashed changes
            </Route>

            {/* Proponent */}
            <Route element={<ProtectedRoute roles={[Role.PROPONENT]} />}>
<<<<<<< Updated upstream
              <Route path="/users/proponent/ProponentMainLayout" element={<ProponentMainLayout />} />
=======
              <Route path="/users/proponent/profile" element={<Profile />} />
              <Route path="/users/proponent/submission" element={<Submission />} />
              <Route path="/users/proponent/settings" element={<Settings />} />
>>>>>>> Stashed changes
            </Route>
          </Routes>
          <LoadingOverlay />
        </LoadingProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
