import { Outlet, Navigate } from "react-router-dom";

const RedirectAuthenticated: React.FC = () => {
  const _user = localStorage.getItem("user");

  if (_user) {
    const user = JSON.parse(_user);
    return <Navigate to={`/users/${user.role}/dashboard`} replace />;
  }

  return <Outlet />;
};

export default RedirectAuthenticated;
