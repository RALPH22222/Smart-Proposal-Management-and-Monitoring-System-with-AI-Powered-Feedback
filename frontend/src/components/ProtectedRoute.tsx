import React, { useEffect, useState } from "react";
import { Role } from "../types/auth";
import Swal from "sweetalert2";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuthContext } from "../context/AuthContext";
import { api } from "../utils/axios";
import RdecLogo from "../assets/IMAGES/RDEC.jpg";

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          {/* 3D RDEC Logo */}
          <div className="relative flex items-center justify-center mb-6" style={{ perspective: '600px' }}>
            {/* Outer glow ring */}
            <div className="absolute w-32 h-32 rounded-full bg-gradient-to-r from-[#C8102E]/20 via-red-300/10 to-[#C8102E]/20 blur-xl animate-pulse"></div>
            {/* Spinning ring behind logo */}
            <div className="absolute w-28 h-28 rounded-full border-2 border-[#C8102E]/30 animate-spin" style={{ animationDuration: '3s', borderStyle: 'dashed' }}></div>

            {/* Logo container with 3D float + tilt */}
            <div
              className="relative w-24 h-24 rounded-full overflow-hidden shadow-[0_20px_40px_rgba(200,16,46,0.35),0_8px_16px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.4)]"
              style={{
                animation: 'rdec3d 3s ease-in-out infinite',
                transformStyle: 'preserve-3d',
              }}
            >
              {/* The logo */}
              <img
                src={RdecLogo}
                alt="RDEC"
                className="w-full h-full object-cover"
              />
              {/* Red transparent overlay — matches login banner style */}
              <div className="absolute inset-0 bg-[#C8102E]/75 pointer-events-none rounded-full"></div>
            </div>

            {/* Shadow below */}
            <div className="absolute bottom-0 w-16 h-3 bg-[#C8102E]/20 rounded-full blur-md" style={{ animation: 'rdec3d-shadow 3s ease-in-out infinite' }}></div>
          </div>

          <style>{`
            @keyframes rdec3d {
              0%, 100% { transform: rotateY(-15deg) rotateX(8deg) translateY(0px); }
              50% { transform: rotateY(15deg) rotateX(-8deg) translateY(-8px); }
            }
            @keyframes rdec3d-shadow {
              0%, 100% { transform: scaleX(1); opacity: 0.4; }
              50% { transform: scaleX(0.7); opacity: 0.2; }
            }
          `}</style>

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

