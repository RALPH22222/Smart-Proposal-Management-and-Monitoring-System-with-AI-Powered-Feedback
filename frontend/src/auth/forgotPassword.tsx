import { useState, type FormEvent } from "react";
import { Mail, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import Swal from "sweetalert2";
import { supabase } from "../config/supabaseClient";
import AuthBackground from "../assets/IMAGES/Auth-Background.jpg";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!email) {
      return Swal.fire({
        icon: "warning",
        title: "Missing email",
        text: "Please enter your email address.",
        confirmButtonColor: "#C8102E",
      });
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      setSent(true);
      Swal.fire({
        icon: "success",
        title: "Check your email",
        text: "If an account exists for that email, we've sent a password reset link. The link will expire in 1 hour.",
        confirmButtonColor: "#C8102E",
      });
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to send reset email. Please try again.";
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
          <Link
            to="/login"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-gray-600 bg-gray-50 border border-gray-100 transition-all duration-300 hover:bg-red-50 hover:text-[#C8102E] hover:border-red-200 hover:shadow-md hover:-translate-y-0.5 group mb-4"
          >
            <div className="w-6 h-6 rounded-full bg-gray-100 group-hover:bg-red-100 flex items-center justify-center transition-colors duration-300">
              <ArrowLeft size={14} className="text-gray-500 group-hover:text-[#C8102E] transition-colors duration-300" />
            </div>
            <span>Back to sign in</span>
          </Link>

          <div className="flex flex-col items-center text-center gap-3 mb-2">
            <div className="p-3 rounded-xl bg-red-50 text-[#C8102E]">
              <Mail size={27} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Forgot Password?</h2>
              <p className="text-gray-500 text-sm mt-0.5">
                No worries! Just enter your email below and we'll send you a password reset link.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-8 pb-6 pt-2 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your registered email"
              disabled={loading || sent}
              className="block w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20 focus:border-[#C8102E] hover:border-gray-300 transition-all duration-200 bg-white disabled:bg-gray-50"
            />
          </div>

          <button
            type="submit"
            disabled={loading || sent}
            className="w-full py-3 bg-[#C8102E] text-white rounded-xl font-semibold text-md shadow-md hover:bg-[#A50D26] hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-60 disabled:hover:translate-y-0"
          >
            {loading ? "Sending..." : sent ? "Email sent" : "Send Reset link"}
          </button>
        </form>

        <div className="bg-gray-50 px-8 py-4 border-t border-gray-100">
          <p className="text-sm text-gray-400 text-center">
            Remembered your password?{" "}
            <Link to="/login" className="text-[#C8102E] font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
