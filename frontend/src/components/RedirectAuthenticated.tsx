import { Outlet, Navigate } from "react-router-dom";
import { Role } from "../types/auth";

const RedirectAuthenticated: React.FC = () => {
  const _user = localStorage.getItem("user");

  if (_user) {
    const user = JSON.parse(_user) as { roles?: Role[] };
    const role = user.roles?.[0];

    if (!role) {
      localStorage.removeItem("user");
      return <Navigate to="/login" replace />;
    }

    // Handle Proponents ( Lead + Co-Lead )
    if (role === Role.LEAD_PROPONENT || role === Role.PROPONENT) {
      return <Navigate to="/users/proponent/proponentMainLayout" replace />;
    }

    // Default behavior for other roles
    return <Navigate to={`/users/${role}/${role}MainLayout`} replace />;
  }

  return <Outlet />;
};

export default RedirectAuthenticated;
