import { useAuthContext } from "../context/AuthContext";
import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { api } from "@utils/axios";
import { broadcastAuthChange } from "@utils/auth-broadcast";
import { useNavigate, useSearchParams } from "react-router-dom";

import { useLogos } from "../context/LogoContext";
import AuthBackground from "../assets/IMAGES/Auth-Background.jpg";
import WmsuFallbackLogo from "../assets/IMAGES/WMSU.png";
import RdecFallbackLogo from "../assets/IMAGES/RDEC.jpg";
import InstantLogo from "../components/shared/InstantLogo";
type LoginResponse = {
  message: string;
  user: {
    id: string;
    email: string;
    role?: string;
    roles?: string[];
    [key: string]: any;
  };
};

export default function Login() {
  const { logos } = useLogos();
  const { setUser } = useAuthContext();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);


  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const verified = searchParams.get("verified");
    if (verified === "success") {
      Swal.fire({
        icon: "success",
        title: "Email Verified",
        text: "Your email has been verified successfully. You can now log in.",
        confirmButtonColor: "#C8102E",
      });
      setSearchParams({}, { replace: true });
    } else if (verified === "already") {
      Swal.fire({
        icon: "info",
        title: "Already Verified",
        text: "Your email was already verified. You can log in.",
        confirmButtonColor: "#C8102E",
      });
      setSearchParams({}, { replace: true });
    }

    // If another tab ended this session (invite completion, logout, or
    // explicit re-login as a different account), show a friendly notice
    // instead of the generic "Unauthorized" error the old flow produced.
    const redirectReason = sessionStorage.getItem("auth_redirect_reason");
    if (redirectReason === "session_ended") {
      sessionStorage.removeItem("auth_redirect_reason");
      Swal.fire({
        icon: "info",
        title: "Signed out",
        text: "Your session ended in another tab. Please sign in again.",
        confirmButtonColor: "#C8102E",
      });
    }
  }, [searchParams, setSearchParams]);

  // Hard navigation after login: full page reload so every module-level
  // cache (proposal.api.ts lookupCache, ProjectMonitoringApi.ts projectCache,
  // React state, any lingering Supabase client session) is wiped. Guarantees
  // the new session starts from a clean slate with zero carry-over from
  // whoever was signed in before.
  const hardNavigate = (path: string) => {
    window.location.href = path;
  };

  const navigateBasedOnRole = async (role: string, passwordChangeRequired?: boolean) => {
    // If password change is required, redirect there first (applies to all roles)
    if (passwordChangeRequired) {
      hardNavigate("/change-password");
      return;
    }

    switch (role.toLowerCase()) {
      case "proponent":
        hardNavigate("/users/Proponent/ProponentMainLayout");
        break;
      case "rnd":
        hardNavigate("/users/rnd/rndMainLayout");
        break;
      case "admin":
        hardNavigate("/users/admin/adminMainLayout");
        break;
      case "evaluator":
        hardNavigate("/users/evaluator/evaluatorMainLayout");
        break;
      default:
        Swal.fire({
          icon: "error",
          title: "Access Denied",
          text: "No dashboard configured for this role.",
        });
    }
  };

  const handleLogin = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!email || !password)
      return Swal.fire({
        icon: "warning",
        title: "Missing fields",
        text: "Please provide email and password.",
      });

    try {
      setLoading(true);
      const res = await api.post<LoginResponse>(
        "/auth/login",
        { email, password },
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true,
        },
      );

      let userRoles: string[] = [];
      if (res.data.user.roles && Array.isArray(res.data.user.roles)) {
        userRoles = res.data.user.roles;
      } else if (res.data.user.role) {
        userRoles = [res.data.user.role];
      }

      const passwordChangeRequired = res.data.user.password_change_required === true;
      const accountType =
        (res.data.user as { account_type?: "internal" | "external" }).account_type ?? "internal";

      const hydratedUser = {
        id: res.data.user.id,
        email: res.data.user.email,
        roles: userRoles,
        password_change_required: passwordChangeRequired,
        account_type: accountType,
      };

      setUser(hydratedUser);
      localStorage.setItem("user", JSON.stringify(hydratedUser));
      broadcastAuthChange();

      await Swal.fire({
        icon: "success",
        title: "Logged in",
        text: res.data.message || "Successfully signed in.",
        timer: 1500,
        showConfirmButton: false,
      });

      setEmail("");
      setPassword("");

      // 3. Logic: Single Role vs Multiple Roles
      if (userRoles.length > 1) {
        // If password change required, skip and go straight
        if (passwordChangeRequired) {
          navigate("/change-password");
        } else {
          // Immediately direct multi-role users to the combined dashboard
          hardNavigate("/users/multi-role/MainLayout");
        }
      } else if (userRoles.length === 1) {
        // If single role, navigate immediately
        await navigateBasedOnRole(userRoles[0], passwordChangeRequired);
      } else {
        throw new Error("No roles assigned to this user.");
      }
    } catch (err: unknown) {
      console.error("Login error:", err);

      // Extract error message from axios response
      let errorMessage = "Login failed. Please try again.";

      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { data?: { message?: string } } };
        console.log("Backend response data:", axiosError.response?.data);
        console.log("Message from backend:", axiosError.response?.data?.message);

        if (axiosError.response?.data?.message) {
          errorMessage = axiosError.response.data.message;
        }
      } else if (err instanceof Error) {
        // Fallback to error message if not from axios
        console.log("Not an axios error, using Error message:", err.message);
        errorMessage = err.message;
      }

      console.log("Final error message to show:", errorMessage);

      Swal.fire({
        icon: "error",
        title: "Login Failed",
        text: errorMessage,
        confirmButtonColor: "#C8102E",
      });
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen flex flex-col md:flex-row relative">
      {/* --- FORM SECTION --- */}
      <div className="order-2 md:order-1 w-full md:w-1/2 flex items-center justify-center bg-white p-8">
        <form onSubmit={handleLogin} className="w-full max-w-md bg-white rounded-xl shadow-lg p-8 space-y-4">
          {/* Back to Home Button - Cool Design */}
          <a
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-gray-600 bg-gray-50 border border-gray-100 transition-all duration-300 hover:bg-red-50 hover:text-[#C8102E] hover:border-red-200 hover:shadow-md hover:-translate-y-0.5 group mb-6"
          >
            <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-sm group-hover:bg-[#C8102E] group-hover:text-white transition-colors duration-300">
              <svg className="w-3 h-3 transition-transform duration-300 group-hover:-translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </div>
            <span>Back to Home</span>
          </a>

          <h2 className="text-2xl font-bold text-gray-900 hover:text-[#C8102E] transition-colors duration-300 cursor-pointer">
            Sign in
          </h2>
          <p className="text-sm text-gray-600">Use your institutional account or continue with Google.</p>

          <label className="block">
            <span className="text-sm font-medium text-gray-700">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              className="mt-1 block w-full rounded-lg border border-gray-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#C8102E]/30 hover:border-gray-300 transition-colors duration-200"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-gray-700">Password</span>
            <div className="relative mt-1">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="block w-full rounded-lg border border-gray-200 pl-4 pr-10 py-2 focus:outline-none focus:ring-2 focus:ring-[#C8102E]/30 hover:border-gray-300 transition-colors duration-200"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
            </div>
          </label>

          <div className="text-right -mt-2">
            <a
              href="/forgot-password"
              className="text-sm font-medium text-gray-600 hover:text-[#C8102E] transition-colors duration-200"
            >
              Forgot password?
            </a>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-[#C8102E] text-white rounded-lg font-semibold shadow-sm disabled:opacity-60 hover:bg-[#A50D26] transition-colors duration-300"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>

            <button
              type="button"
              onClick={() => {
                setEmail("");
                setPassword("");
              }}
              className="inline-flex items-center justify-center px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg shadow-sm hover:bg-gray-50 hover:border-gray-300 hover:text-gray-900 transition-all duration-300"
            >
              Reset
            </button>
          </div>

          <div className="text-sm text-center text-gray-600">
            Don't have an account?{" "}
            <a
              href="/register"
              className="font-semibold hover:text-[#A50D26] transition-colors duration-300"
              style={{ color: "#C8102E" }}
            >
              Create one
            </a>
          </div>
        </form>
      </div>

      {/* --- BANNER SECTION --- */}
      <div
        className="order-1 md:order-2 w-full md:w-1/2 flex items-center justify-center relative p-8 text-white min-h-[40vh] md:min-h-screen"
        style={{
          backgroundImage: `url('${AuthBackground}')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-[#C8102E]/85"></div>
        <div className="relative max-w-md text-center space-y-4 md:space-y-6">
          <div className="flex justify-center items-center gap-3">
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden bg-white/10">
              <InstantLogo
                remoteSrc={logos.wmsu_logo}
                fallbackSrc={WmsuFallbackLogo}
                alt="WMSU Logo"
                className="w-full h-full object-contain rounded-full"
              />
            </div>
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden bg-white/10">
              <InstantLogo
                remoteSrc={logos.rdec_logo}
                fallbackSrc={RdecFallbackLogo}
                alt="RDEC Logo"
                className="w-full h-full object-contain rounded-full"
              />
            </div>
          </div>
          <h1 className="text-2xl md:text-4xl font-extrabold hover:text-gray-200 transition-colors duration-300 cursor-pointer">
            WMSU Project Proposal
          </h1>
          <p className="text-sm opacity-90 px-4 md:px-0 hover:opacity-100 transition-opacity duration-300">
            Create, submit and track project proposals — fast, simple, and secure.
          </p>
        </div>

        {/* Image Attribution */}
        {/* <div className="absolute bottom-4 right-4 text-[10px] text-white/50 hover:text-white/80 transition-colors z-10 text-right max-w-[200px] md:max-w-none">
          <a href="https://commons.wikimedia.org/wiki/File:Western_Mindanao_State_University_College_of_Teacher_Education_(Normal_Road,_Baliwasan,_Zamboanga_City;_10-06-2023).jpg" target="_blank" rel="noopener noreferrer" className="hover:underline">
            via Wikimedia Commons
          </a>, licensed under{" "}
          <a href="https://creativecommons.org/licenses/by-sa/4.0" target="_blank" rel="noopener noreferrer" className="hover:underline">
            CC BY-SA 4.0
          </a>.
        </div> */}
      </div>

      {/* MULTI-ROLE MODAL REMOVED - Users are automatically directed to the new Multi Role Dashboard */}
    </div>
  );
}
