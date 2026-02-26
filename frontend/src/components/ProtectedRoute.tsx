import React, { useEffect, useState } from "react";
import { Role } from "../types/auth";
import Swal from "sweetalert2";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuthContext } from "../context/AuthContext";
import { api } from "../utils/axios";

type ProtectedRouteProps = {
  roles?: (typeof Role)[keyof typeof Role][];
};

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ roles }) => {
  const { verifyToken } = useAuthContext();
  const navigate = useNavigate();
  const location = useLocation();
  const [isVerifying, setIsVerifying] = useState(() => {
    // Only show loading if this is the first verification in this session
    return !sessionStorage.getItem('auth_verified');
  });

  useEffect(() => {
    const verifyAuthentication = async () => {
      const hasVerified = sessionStorage.getItem('auth_verified');

      // Only show loading screen on first verification
      if (!hasVerified) {
        setIsVerifying(true);
      }

      const user = await verifyToken();

      if (!user) {
        localStorage.removeItem("user");
        sessionStorage.removeItem('auth_verified');
        navigate("/login");
        return;
      }

      // Check profile status and password change requirement
      try {
        const { data } = await api.get<{ isCompleted: boolean; passwordChangeRequired: boolean }>("/auth/profile-status");

        if (data.passwordChangeRequired && location.pathname !== "/change-password") {
          navigate("/change-password");
          return;
        }

        if (!data.isCompleted && location.pathname !== "/profile-setup" && location.pathname !== "/change-password") {
          navigate("/profile-setup");
          return;
        }
      } catch (error) {
        console.error("Failed to check profile status", error);
      }

      if (roles && roles.length > 0) {
        // Normalize roles - handle both singular "role" and plural "roles" from JWT
        const userRoles = user.roles;

        // does the user have at least one allowed role?
        const hasRequiredRole = roles.some((r) => userRoles.includes(r));

        if (!hasRequiredRole) {
          // user is logged in but not allowed on this route
          // just send them to the first dashboard they have
          const role = userRoles[0];

          switch (role) {
            case Role.LEAD_PROPONENT:
              // If user also has PROPONENT role, go to proponent dashboard
              // Otherwise go to co-lead restricted dashboard
              if (userRoles.includes(Role.PROPONENT)) {
                navigate("/users/proponent/proponentMainLayout");
              } else {
                navigate("/users/co-lead/coLeadMainLayout");
              }
              break;
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
              sessionStorage.removeItem('auth_verified');
              navigate("/login");
              break;
            }
          }
          return;
        }
      }

      // Mark as verified for this session
      sessionStorage.setItem('auth_verified', 'true');
      setIsVerifying(false);
    };

    verifyAuthentication();
  }, [roles, navigate, verifyToken, location]);

  // Show loading screen while verifying (only on first load)
  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          {/* Spinner */}
          <div className="relative inline-flex">
            <div className="w-16 h-16 border-4 border-slate-200 border-t-[#C8102E] rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 bg-[#C8102E] rounded-full opacity-20 animate-pulse"></div>
            </div>
          </div>

          {/* Loading text */}
          <div className="mt-6 space-y-2">
            <h2 className="text-xl font-semibold text-slate-700">Verifying Access</h2>
            <p className="text-sm text-slate-500">Please wait...</p>
          </div>

          {/* Animated dots */}
          <div className="flex justify-center gap-1 mt-4">
            <div className="w-2 h-2 bg-[#C8102E] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-[#C8102E] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-[#C8102E] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </div>
    );
  }

  return <Outlet />;
};

export default ProtectedRoute;

