import React, { useEffect, useState } from "react";
import { Role } from "../types/auth";
import Swal from "sweetalert2";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuthContext } from "../context/AuthContext";
import { api } from "../utils/axios";
import LoaderImage from "../assets/IMAGES/Loader-Image.jpg";

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
    let cancelled = false;

    const verifyAuthentication = async () => {
      const hasVerified = sessionStorage.getItem('auth_verified');

      // Only show loading screen on first verification
      if (!hasVerified) {
        setIsVerifying(true);
      }

      const user = await verifyToken();

      if (cancelled) return;

      if (!user) {
        localStorage.removeItem("user");
        sessionStorage.removeItem('auth_verified');
        navigate("/login");
        return;
      }

      // Password change is the only post-login gate. Profile fields are now collected
      // at registration (or by admin at account creation), so the legacy /profile-setup
      // redirect was removed.
      try {
        const { data } = await api.get<{ isCompleted: boolean; passwordChangeRequired: boolean }>("/auth/profile-status");

        if (cancelled) return;

        if (data.passwordChangeRequired && location.pathname !== "/change-password") {
          navigate("/change-password");
          return;
        }
      } catch (error) {
        console.error("Failed to check profile status", error);
      }

      if (cancelled) return;

      if (roles && roles.length > 0) {
        // Normalize roles - handle both singular "role" and plural "roles" from JWT
        const userRoles = user.roles;

        // does the user have at least one allowed role?
        const hasRequiredRole = roles.some((r) => userRoles.includes(r));

        if (!hasRequiredRole) {
          // user is logged in but not allowed on this route
          if (userRoles.length > 1) {
            navigate("/users/multi-role/MainLayout");
            return;
          }

          // just send them to the first dashboard they have
          const role = userRoles[0];

          switch (role) {
            case Role.PROPONENT:
              navigate("/users/Proponent/ProponentMainLayout");
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
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roles, navigate, verifyToken]);

  // Show loading screen while verifying (only on first load)
  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          {/* Loader Image with subtle animation */}
          <div className="relative flex items-center justify-center mb-6">
            {/* Spinning ring behind loader */}
            <div className="absolute w-32 h-32 rounded-full border-2 border-[#C8102E]/20 animate-spin" style={{ animationDuration: '4s', borderStyle: 'dashed' }}></div>

            <div
              className="relative w-28 h-28 rounded-full overflow-hidden shadow-xl"
              style={{
                animation: 'loader-float 3s ease-in-out infinite',
              }}
            >
              <img
                src={LoaderImage}
                alt="Verifying..."
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          <style>{`
            @keyframes loader-float {
              0%, 100% { transform: translateY(0px) scale(1); }
              50% { transform: translateY(-10px) scale(1.02); }
            }
          `}</style>

          {/* Loading text */}
          <div className="mt-8 space-y-2">
            <h2 className="text-2xl font-semibold text-gray-800 tracking-tight">Verifying Access</h2>
            <p className="text-gray-500 font-small">Please wait a moment...</p>
          </div>

          {/* Animated progress bar instead of dots for a cleaner look */}
          <div className="mt-6 w-48 h-1.5 bg-gray-100 rounded-full mx-auto overflow-hidden">
            <div className="h-full bg-[#C8102E] rounded-full animate-progress-indeterminate"></div>
          </div>

          <style>{`
            @keyframes progress-indeterminate {
              0% { transform: translateX(-100%); width: 30%; }
              50% { transform: translateX(50%); width: 40%; }
              100% { transform: translateX(200%); width: 30%; }
            }
            .animate-progress-indeterminate {
              animation: progress-indeterminate 1.5s ease-in-out infinite;
            }
          `}</style>
        </div>
      </div>
    );
  }

  return <Outlet />;
};

export default ProtectedRoute;

