import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from "./pages/landingpage";
import Register from "./auth/register";
import Login from "./auth/login";

// Admin
import DashboardAdmin from "./pages/users/admin/dashboardAdmin";
import Accounts from "./pages/users/admin/accounts";

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
          <Route path="/users/admin/dashboardAdmin" element={<DashboardAdmin />} />
          <Route path="/users/admin/accounts" element={<Accounts />} />
        </Routes>
        <LoadingOverlay />
      </LoadingProvider>
    </BrowserRouter>
  );
}

export default App;