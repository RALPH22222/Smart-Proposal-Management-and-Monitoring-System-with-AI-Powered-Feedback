// Auth
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Register from "./auth/register";
import Login from "./auth/login";
import ProfileSetup from "./auth/profileSetup";
// Public
import LandingPage from "./pages/landingpage";
import About from "./pages/aboutpage";
import Contacts from "./pages/contacts";
import FAQ from "./pages/faqs";

// Admin
import AdminMainLayout from "./pages/users/admin/AdminMainLayout";

// R&D
import RnDMainLayout from "./pages/users/rnd/RnDMainLayout";

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
              <Route path="/profile-setup" element={<ProfileSetup />} />
            </Route>

            {/* Admin */}
            <Route element={<ProtectedRoute roles={[Role.ADMIN]} />}>
              <Route path="/users/admin/adminMainLayout" element={<AdminMainLayout />} />
            </Route>

            {/* Evaluator */}
            <Route element={<ProtectedRoute roles={[Role.EVALUATOR]} />}>
              <Route path="/users/evaluator/evaluatorMainLayout" element={<EvaluatorMainLayout />} />
            </Route>

            {/* R&D */}
            <Route element={<ProtectedRoute roles={[Role.RND]} />}>
              <Route path="/users/rnd/rndMainLayout" element={<RnDMainLayout />} />
            </Route>

            {/* Lead Proponent & Co-Lead Proponent */}
            <Route element={<ProtectedRoute roles={[Role.LEAD_PROPONENT, Role.PROPONENT]} />}>
              <Route path="/users/proponent/proponentMainLayout" element={<ProponentMainLayout />} />
            </Route>
          </Routes>
          <LoadingOverlay />
        </LoadingProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
