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

  // Verify token and authorization
  // 1. Check if user is authenticated -> call veriyToken API
  // 2. Check if user has required roles (if roles prop is provided)
  // 3. If not authenticated or not authorized, redirect to login pageas
  useEffect(() => {
    const verifyAuthentication = async () => {
      const user = await verifyToken();

      if (user) {
        // Check for roles if provided
        if (roles && !roles.includes(user.role)) {
          switch (user.role) {
            case Role.PROPONENT:
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
      } else {
        console.log("User not authenticated");
      }
    };

    verifyAuthentication();
  }, []);

  // Show loading spinner while checking authentication
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

  // User is authenticated, render the protected content
  return <Outlet />;
};

export default ProtectedRoute;
