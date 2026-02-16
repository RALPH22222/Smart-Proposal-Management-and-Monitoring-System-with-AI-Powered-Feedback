import { useAuthContext } from "../context/AuthContext";
import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { api } from "@utils/axios";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Shield, User, FileText, CheckSquare, X } from "lucide-react"; // Icons for the modal
import RdecLogo from "../assets/IMAGES/RDEC-WMSU.png";
import WmsuLogo from "../assets/IMAGES/WMSU.png";
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
  const { setUser } = useAuthContext();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [showRoleModal, setShowRoleModal] = useState(false);
  const [availableRoles, setAvailableRoles] = useState<string[]>([]);

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
  }, [searchParams, setSearchParams]);

  const navigateBasedOnRole = async (role: string, passwordChangeRequired?: boolean) => {
    // If password change is required, redirect there first (applies to all roles)
    if (passwordChangeRequired) {
      navigate("/change-password");
      return;
    }

    // Check profile status for all roles
    try {
      const response = await api.get<{ isCompleted: boolean; passwordChangeRequired: boolean }>('/auth/profile-status');
      if (response.data.passwordChangeRequired) {
        navigate("/change-password");
        return;
      }
      if (!response.data.isCompleted) {
        navigate("/profile-setup");
        return;
      }
    } catch (error) {
      console.error("Failed to check profile status", error);
      // Default to profile setup if check fails
      navigate("/profile-setup");
      return;
    }

    switch (role.toLowerCase()) {
      case "proponent":
        navigate("/users/proponent/proponentMainLayout");
        break;
      case "rnd":
        navigate("/users/rnd/rndMainLayout");
        break;
      case "admin":
        navigate("/users/admin/adminMainLayout");
        break;
      case "evaluator":
        navigate("/users/evaluator/evaluatorMainLayout");
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

      const hydratedUser = {
        id: res.data.user.id,
        email: res.data.user.email,
        roles: userRoles,
        password_change_required: passwordChangeRequired,
      };

      setUser(hydratedUser);
      localStorage.setItem("user", JSON.stringify(hydratedUser));

      Swal.fire({
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
        // If password change required, skip the role modal and go straight
        if (passwordChangeRequired) {
          navigate("/change-password");
        } else {
          setAvailableRoles(userRoles);
          setShowRoleModal(true);
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

  // Helper to get nice labels/icons for the modal
  const getRoleDisplay = (role: string) => {
    switch (role.toLowerCase()) {
      case "admin":
        return { label: "Administrator", icon: <Shield className="w-6 h-6" />, color: "bg-slate-800" };
      case "rnd":
        return { label: "R&D Staff", icon: <FileText className="w-6 h-6" />, color: "bg-blue-600" };
      case "evaluator":
        return { label: "Evaluator", icon: <CheckSquare className="w-6 h-6" />, color: "bg-green-600" };
      default:
        return { label: "Proponent", icon: <User className="w-6 h-6" />, color: "bg-[#C8102E]" };
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

          <h2 className="text-2xl font-semibold text-gray-900 hover:text-[#C8102E] transition-colors duration-300 cursor-pointer">
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
          backgroundImage: `url('https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Western_Mindanao_State_University_College_of_Teacher_Education_%28Normal_Road%2C_Baliwasan%2C_Zamboanga_City%3B_10-06-2023%29.jpg/2560px-Western_Mindanao_State_University_College_of_Teacher_Education_%28Normal_Road%2C_Baliwasan%2C_Zamboanga_City%3B_10-06-2023%29.jpg')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-[#C8102E]/85"></div>
        <div className="relative max-w-md text-center space-y-4 md:space-y-6">
          <div className="flex justify-center items-center gap-3">
            <img src={WmsuLogo} alt="WMSU Logo" className="w-24 h-24 md:w-32 md:h-32 object-contain" />
            <img src={RdecLogo} alt="RDEC Logo" className="w-24 h-24 md:w-32 md:h-32 object-contain" />
          </div>
          <h1 className="text-2xl md:text-4xl font-extrabold hover:text-gray-200 transition-colors duration-300 cursor-pointer">
            Project Proposal
          </h1>
          <p className="text-sm opacity-90 px-4 md:px-0 hover:opacity-100 transition-opacity duration-300">
            Create, submit and track project proposals — fast, simple, and secure.
          </p>
        </div>
      </div>

      {/* --- MULTI-ROLE SELECTION MODAL --- */}
      {showRoleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-[#C8102E] px-6 py-4 flex justify-between items-center text-white">
              <h3 className="text-lg font-bold">Select Dashboard</h3>
              <button
                onClick={() => setShowRoleModal(false)}
                className="hover:bg-white/20 rounded-full p-1 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <p className="text-gray-600 mb-6 text-center">
                Your account is associated with multiple roles. Please select which dashboard you would like to access.
              </p>

              <div className="grid gap-3">
                {availableRoles.map((role) => {
                  const details = getRoleDisplay(role);
                  return (
                    <button
                      key={role}
                      onClick={async () => await navigateBasedOnRole(role)}
                      className="flex items-center gap-4 w-full p-4 rounded-xl border border-gray-200 hover:border-[#C8102E] hover:bg-red-50 transition-all duration-200 group text-left"
                    >
                      <div
                        className={`p-3 rounded-full text-white ${details.color} shadow-sm group-hover:scale-110 transition-transform`}
                      >
                        {details.icon}
                      </div>
                      <div>
                        <span className="block font-bold text-gray-800 group-hover:text-[#C8102E] text-lg">
                          {details.label}
                        </span>
                        <span className="text-xs text-gray-500 uppercase tracking-wider">Enter as {role}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
