import { Outlet, Navigate } from "react-router-dom";
import { Role } from "../types/auth";
import type { AuthUser } from "../context/AuthContext";

const RedirectAuthenticated: React.FC = () => {
  const _user = localStorage.getItem("user");

  if (_user) {
    const user = JSON.parse(_user) as AuthUser;
    const role = user.roles?.[0];

    if (!role) {
      localStorage.removeItem("user");
      return <Navigate to="/login" replace />;
    }

    // Co-lead only → co-lead dashboard
    if (role === Role.LEAD_PROPONENT && !user.roles?.includes(Role.PROPONENT)) {
      return <Navigate to="/users/co-lead/coLeadMainLayout" replace />;
    }

    // Proponent (may also have lead_proponent) → proponent dashboard
    if (role === Role.PROPONENT || role === Role.LEAD_PROPONENT) {
      return <Navigate to="/users/Proponent/ProponentMainLayout" replace />;
    }

    // Default behavior for other roles
    return <Navigate to={`/users/${role}/${role}MainLayout`} replace />;
  }

  return <Outlet />;
};

export default RedirectAuthenticated;
