import { Outlet, Navigate } from "react-router-dom";

const RedirectAuthenticated: React.FC = () => {
  const _user = localStorage.getItem("user");

  //Redirect after login
  if (_user) {
    const user = JSON.parse(_user);
    return <Navigate to={`/users/${user.role}/${user.role}MainLayout`} replace />;
  }

  return <Outlet />;
};

export default RedirectAuthenticated;
