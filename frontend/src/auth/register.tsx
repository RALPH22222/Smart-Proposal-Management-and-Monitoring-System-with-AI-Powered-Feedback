import React, { useState } from "react";
import Swal from "sweetalert2";
import { sendOtp, verifyOtp } from "../services/auth/authService";
import { GoogleLogin } from "@react-oauth/google";

export default function Register() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);

  const handleSendOtp = async () => {
    if (!email) {
      return Swal.fire({ icon: "warning", title: "Email required", text: "Please enter your email." });
    }
    try {
      setLoading(true);
      await sendOtp(email);
      setOtpSent(true);
      Swal.fire({ icon: "success", title: "OTP sent", text: "Check your email for the verification code." });
    } catch (err) {
      Swal.fire({ icon: "error", title: "Send failed", text: "Failed to send OTP. Try again." });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp) return Swal.fire({ icon: "warning", title: "OTP required", text: "Please enter the OTP." });
    try {
      setLoading(true);
      const res = await verifyOtp(email, otp);
      if ((res as any)?.data?.success === false) {
        throw new Error("Invalid");
      }
      setOtpVerified(true);
      Swal.fire({ icon: "success", title: "Verified", text: "Email verified — you can complete your registration now." });
    } catch (err) {
      Swal.fire({ icon: "error", title: "Verification failed", text: "Invalid or expired OTP." });
    } finally {
      setLoading(false);
    }
  };
  const handleGoogleSuccess = async (credentialResponse: any) => {
    const token = credentialResponse?.credential;
    if (!token) {
      return Swal.fire({ icon: "error", title: "Google login failed", text: "No credential returned." });
    }

    try {
      setLoading(true);
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, role: "Proponent" }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.message || "Google authentication failed");
      }
      const data = await res.json().catch(() => ({}));
      Swal.fire({ icon: "success", title: "Signed in", text: data.message || "Signed in with Google." });
      setName(""); setEmail(""); setPassword(""); setOtp(""); setOtpSent(false); setOtpVerified(false);
    } catch (err: any) {
      Swal.fire({ icon: "error", title: "Error", text: err.message || "Google sign-in failed" });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    Swal.fire({ icon: "error", title: "Google login failed", text: "Unable to sign in with Google." });
  };

  const handleRegister = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!otpVerified) return Swal.fire({ icon: "warning", title: "Verify email", text: "Please verify your email first." });
    if (!name || !password) return Swal.fire({ icon: "warning", title: "Missing fields", text: "Please provide name and password." });

    try {
      setLoading(true);
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role: "Proponent" }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.message || "Registration failed");
      }
      Swal.fire({ icon: "success", title: "Registered", text: "Account created successfully." });
      setName(""); setEmail(""); setPassword(""); setOtp(""); setOtpSent(false); setOtpVerified(false);
    } catch (err: any) {
      Swal.fire({ icon: "error", title: "Error", text: err.message || "Registration failed" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <div className="w-full md:w-1/2 flex items-center justify-center bg-[#C8102E] text-white p-8">
        <div className="max-w-md text-center space-y-6">
          <img src="../src/assets/IMAGES/LOGO.png" alt="Logo" className="mx-auto w-40 h-40 object-contain rounded-lg shadow-lg bg-white/10 p-2" />
          <h1 className="text-4xl font-extrabold">Project Proposal</h1>
          <p className="text-sm opacity-90">
            Create, submit and track project proposals — fast, simple, and secure.
          </p>
        </div>
      </div>

      <div className="w-full md:w-1/2 flex items-center justify-center bg-white p-8">
        <form onSubmit={handleRegister} className="w-full max-w-md bg-white rounded-xl shadow-lg p-8 space-y-4">
          <h2 className="text-2xl font-semibold text-gray-900">Sign up</h2>
          <p className="text-sm text-gray-600">Start by verifying your institutional email. Other fields will be unlocked after verification.</p>
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              className="mt-1 block w-full rounded-lg border border-gray-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#C8102E]/30"
              disabled={otpVerified}
            />
          </label>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleSendOtp}
              disabled={loading || otpVerified}
              className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-[#C8102E] text-white rounded-lg font-semibold shadow-sm hover:brightness-95 disabled:opacity-60"
            >
              {otpSent ? "Resend OTP" : "Send OTP"}
            </button>

            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="Enter OTP"
              className={`inline-block w-40 rounded-lg border border-gray-200 px-4 py-2 focus:outline-none ${!otpSent ? "opacity-60 pointer-events-none" : ""}`}
              disabled={!otpSent || otpVerified}
            />

            <button
              type="button"
              onClick={handleVerifyOtp}
              disabled={!otpSent || loading || otpVerified}
              className="inline-flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-800 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-60"
            >
              Verify
            </button>
          </div>

          <hr className="my-2" />

          <label className="block">
            <span className="text-sm font-medium text-gray-700">Full name</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
              className="mt-1 block w-full rounded-lg border border-gray-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#C8102E]/30"
              disabled={!otpVerified}
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-gray-700">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="mt-1 block w-full rounded-lg border border-gray-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#C8102E]/30"
              disabled={!otpVerified}
            />
          </label>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={!otpVerified || loading}
              className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-[#C8102E] text-white rounded-lg font-semibold shadow-sm disabled:opacity-60"
            >
              {loading ? "Processing..." : "Create Account"}
            </button>

            <button
              type="button"
              onClick={() => {
                setEmail(""); setOtp(""); setName(""); setPassword(""); setOtpSent(false); setOtpVerified(false);
              }}
              className="inline-flex items-center justify-center px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg shadow-sm"
            >
              Reset
            </button>
          </div>

          <div className="flex flex-col items-center gap-3">
            <div className="text-xs text-gray-400">or continue with email verification</div>
            <GoogleLogin onSuccess={handleGoogleSuccess} onError={handleGoogleError} />
          </div>
        </form>
      </div>
    </div>
  );
}
