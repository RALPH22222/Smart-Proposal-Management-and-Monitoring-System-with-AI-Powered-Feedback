import React, { useEffect } from "react";
import { Role } from "../types/auth";
import Swal from "sweetalert2";
import { Outlet, useNavigate } from "react-router";
import { useAuthContext } from "../context/AuthContext";

type ProtectedRouteProps = {
  roles?: (typeof Role)[keyof typeof Role][];
};

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ roles }) => {
  const { verifyToken, loading } = useAuthContext();
  const navigate = useNavigate();

  useEffect(() => {
    const verifyAuthentication = async () => {
      const user = await verifyToken();

      if (!user) {
        localStorage.removeItem("user");
        navigate("/login");
        return;
      }

      if (roles && roles.length > 0) {
        // does the user have at least one allowed role?
        const hasRequiredRole = roles.some((r) => user.roles.includes(r));

        if (!hasRequiredRole) {
          // user is logged in but not allowed on this route
          // just send them to the first dashboard they have
          const role = user.roles[0];

          switch (role) {
            case Role.LEAD_PROPONENT || Role.PROPONENT:
              navigate("/users/proponent/proponentMainLayout");
              break;
            case Role.EVALUATOR:
              navigate("/users/evaluator/evaluatorMainLayout");
              break;
            case Role.RND:
              navigate("/users/rnd/rndMainLayout");
              break;
            case Role.ADMIN:
              navigate("/users/admin/adminMainLayout");
              break;
            default: {
              Swal.fire({
                icon: "error",
                title: "Error",
                text: "You do not have permission to access this page.",
              });
              localStorage.removeItem("user");
              navigate("/login");
              break;
            }
          }
        }
      }
    };

    verifyAuthentication();
  }, [roles, navigate, verifyToken]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-wmsu-red mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return <Outlet />;
};

export default ProtectedRoute;
