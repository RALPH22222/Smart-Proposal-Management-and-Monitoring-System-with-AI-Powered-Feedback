import { useEffect, useRef, useState, type FormEvent } from "react";
import { Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { supabase } from "../config/supabaseClient";
import AuthBackground from "../assets/IMAGES/Auth-Background.jpg";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const readyRef = useRef(false);

  const markReady = () => {
    readyRef.current = true;
    setReady(true);
  };

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes("error")) {
      const params = new URLSearchParams(hash.replace(/^#/, ""));
      const desc = params.get("error_description") || "Invalid or expired reset link.";
      setLinkError(desc.replace(/\+/g, " "));
      return;
    }

    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") markReady();
    });

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) markReady();
    });

    const timeout = window.setTimeout(() => {
      if (!readyRef.current) {
        setLinkError("This reset link is invalid or has expired. Please request a new one.");
      }
    }, 2500);

    return () => {
      sub.subscription.unsubscribe();
      window.clearTimeout(timeout);
    };
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!newPassword || !confirmPassword) {
      return Swal.fire({
        icon: "warning",
        title: "Missing fields",
        text: "Please fill in both password fields.",
        confirmButtonColor: "#C8102E",
      });
    }

    if (newPassword.length < 6) {
      return Swal.fire({
        icon: "warning",
        title: "Password too short",
        text: "Password must be at least 6 characters.",
        confirmButtonColor: "#C8102E",
      });
    }

    if (newPassword !== confirmPassword) {
      return Swal.fire({
        icon: "error",
        title: "Passwords do not match",
        text: "Please make sure both passwords match.",
        confirmButtonColor: "#C8102E",
      });
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      // Sign out of the recovery session so we don't leave a stray Supabase
      // session in the browser — the app's real auth uses backend JWT cookies.
      await supabase.auth.signOut();

      await Swal.fire({
        icon: "success",
        title: "Password updated",
        text: "You can now sign in with your new password.",
        timer: 2000,
        showConfirmButton: false,
      });
      navigate("/login", { replace: true });
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to update password. Please try again.";
      Swal.fire({
        icon: "error",
        title: "Error",
        text: msg,
        confirmButtonColor: "#C8102E",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4">
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url('${AuthBackground}')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-[#C8102E]/85"></div>
      </div>

      <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
        <div className="px-8 pt-8 pb-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-full bg-red-50 text-[#C8102E]">
              <Lock size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Reset Password</h2>
              <p className="text-gray-500 text-sm mt-0.5">Choose a new password for your account.</p>
            </div>
          </div>
        </div>

        {linkError ? (
          <div className="px-8 pb-8 pt-2">
            <div className="bg-red-50 text-red-800 px-4 py-3 rounded-lg text-sm border border-red-100 mb-4">
              {linkError}
            </div>
            <button
              onClick={() => navigate("/forgot-password", { replace: true })}
              className="w-full py-3 bg-[#C8102E] text-white rounded-xl font-bold text-sm shadow-md hover:bg-[#A50D26] transition-all duration-300"
            >
              Request a new link
            </button>
          </div>
        ) : !ready ? (
          <div className="px-8 pb-8 pt-2 text-center text-sm text-gray-500">
            Verifying your reset link...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-8 pb-4 pt-2 space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="block w-full rounded-xl border border-gray-200 px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20 focus:border-[#C8102E] hover:border-gray-300 transition-all duration-200 bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
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
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="block w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20 focus:border-[#C8102E] hover:border-gray-300 transition-all duration-200 bg-white"
              />
            </div>

            {newPassword && (
              <div className="text-xs text-gray-500 space-y-1">
                <p className={newPassword.length >= 6 ? "text-green-600" : "text-red-500"}>
                  {newPassword.length >= 6 ? "\u2713" : "\u2717"} At least 6 characters
                </p>
                <p
                  className={
                    newPassword === confirmPassword && confirmPassword
                      ? "text-green-600"
                      : "text-red-500"
                  }
                >
                  {newPassword === confirmPassword && confirmPassword ? "\u2713" : "\u2717"}{" "}
                  Passwords match
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#C8102E] text-white rounded-xl font-bold text-sm shadow-md hover:bg-[#A50D26] hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-60 disabled:hover:translate-y-0"
            >
              {loading ? "Updating..." : "Update Password"}
            </button>
          </form>
        )}

        <div className="bg-gray-50 px-8 py-4 border-t border-gray-100">
          <p className="text-xs text-gray-400 text-center">
            After updating, you'll be redirected to sign in with your new password.
          </p>
        </div>
      </div>
    </div>
  );
}
