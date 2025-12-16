import React, { useState } from "react";
import Swal from "sweetalert2";
import { api } from "@utils/axios";
import { useNavigate } from "react-router-dom";
import { Shield, User, FileText, CheckSquare, X } from "lucide-react"; // Icons for the modal

// 1. Updated Type Definition
// We now expect 'roles' (array) or 'role' (string) to handle single or multiple roles
type LoginResponse = {
  message: string;
  user: {
    id: string;
    email: string;
    role?: string;   // Legacy/Single role support
    roles?: string[]; // Multiple role support
    [key: string]: any;
  };
};

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  
  // State for Multiple Role Selection Modal
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [availableRoles, setAvailableRoles] = useState<string[]>([]);
  
  const navigate = useNavigate();

  // 2. Helper function to handle routing based on role
  const navigateBasedOnRole = (role: string) => {
    switch (role.toLowerCase()) {
      case "proponent":
        navigate("/profile-setup");
        break;
      case "rnd":
        // Make sure your Route definition matches this path
        navigate("/rnd"); 
        break;
      case "admin":
        // Make sure your Route definition matches this path
        navigate("/admin");
        break;
      case "evaluator":
        // Make sure your Route definition matches this path
        navigate("/evaluator");
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

      // Extract roles from response (handle both array and single string format)
      let userRoles: string[] = [];
      if (res.data.user.roles && Array.isArray(res.data.user.roles)) {
        userRoles = res.data.user.roles;
      } else if (res.data.user.role) {
        userRoles = [res.data.user.role];
      }

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
        // If multiple roles, open the modal
        setAvailableRoles(userRoles);
        setShowRoleModal(true);
      } else if (userRoles.length === 1) {
        // If single role, navigate immediately
        navigateBasedOnRole(userRoles[0]);
      } else {
        throw new Error("No roles assigned to this user.");
      }

    } catch (err: unknown) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err instanceof Error ? err.message : "Login failed",
      });
    } finally {
      setLoading(false);
    }
  };

  // Helper to get nice labels/icons for the modal
  const getRoleDisplay = (role: string) => {
    switch(role.toLowerCase()) {
      case 'admin': return { label: 'Administrator', icon: <Shield className="w-6 h-6"/>, color: 'bg-slate-800' };
      case 'rnd': return { label: 'R&D Staff', icon: <FileText className="w-6 h-6"/>, color: 'bg-blue-600' };
      case 'evaluator': return { label: 'Evaluator', icon: <CheckSquare className="w-6 h-6"/>, color: 'bg-green-600' };
      default: return { label: 'Proponent', icon: <User className="w-6 h-6"/>, color: 'bg-[#C8102E]' };
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row relative">
      
      {/* --- FORM SECTION --- */}
      <div className="order-2 md:order-1 w-full md:w-1/2 flex items-center justify-center bg-white p-8">
        <form onSubmit={handleLogin} className="w-full max-w-md bg-white rounded-xl shadow-lg p-8 space-y-4">
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
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="mt-1 block w-full rounded-lg border border-gray-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#C8102E]/30 hover:border-gray-300 transition-colors duration-200"
            />
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
          <img
            src="../src/assets/IMAGES/LOGO.png"
            alt="Logo"
            className="mx-auto w-24 h-24 md:w-40 md:h-40 object-contain rounded-lg shadow-lg bg-white/10 p-2 hover:scale-105 transition-transform duration-300 cursor-pointer"
          />
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
                      onClick={() => navigateBasedOnRole(role)}
                      className="flex items-center gap-4 w-full p-4 rounded-xl border border-gray-200 hover:border-[#C8102E] hover:bg-red-50 transition-all duration-200 group text-left"
                    >
                      <div className={`p-3 rounded-full text-white ${details.color} shadow-sm group-hover:scale-110 transition-transform`}>
                        {details.icon}
                      </div>
                      <div>
                        <span className="block font-bold text-gray-800 group-hover:text-[#C8102E] text-lg">
                          {details.label}
                        </span>
                        <span className="text-xs text-gray-500 uppercase tracking-wider">
                          Enter as {role}
                        </span>
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