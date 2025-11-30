import React, { useState } from "react";
import Swal from "sweetalert2";
// import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import { api } from "@utils/axios";
import { useNavigate } from "react-router-dom";

type LoginResponse = {
  message: string;
};

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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
          headers: {
            "Content-Type": "application/json",
          },
          withCredentials: true,
        },
      );

      Swal.fire({
        icon: "success",
        title: "Logged in",
        text: res.data.message || "Successfully signed in.",
      });
      setEmail("");
      setPassword("");
      navigate("/users/proponent/ProponentMainLayout");
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

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <div className="order-2 md:order-1 w-full md:w-1/2 flex items-center justify-center bg-white p-8">
        <form
          onSubmit={handleLogin}
          className="w-full max-w-md bg-white rounded-xl shadow-lg p-8 space-y-4"
        >
          <h2 className="text-2xl font-semibold text-gray-900 hover:text-[#C8102E] transition-colors duration-300 cursor-pointer">
            Sign in
          </h2>
          <p className="text-sm text-gray-600">
            Use your institutional account or continue with Google.
          </p>

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
              onMouseOver={(e) => (e.currentTarget.style.color = "#A50D26")}
              onMouseOut={(e) => (e.currentTarget.style.color = "#C8102E")}
            >
              Create one
            </a>
          </div>
        </form>
      </div>

      {/* Image/Banner Section - Below form on mobile, right for desktop/tablet */}
      <div
        className="order-1 md:order-2 w-full md:w-1/2 flex items-center justify-center relative p-8 text-white min-h-[40vh] md:min-h-screen"
        style={{
          backgroundImage: `url('https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Western_Mindanao_State_University_College_of_Teacher_Education_%28Normal_Road%2C_Baliwasan%2C_Zamboanga_City%3B_10-06-2023%29.jpg/2560px-Western_Mindanao_State_University_College_of_Teacher_Education_%28Normal_Road%2C_Baliwasan%2C_Zamboanga_City%3B_10-06-2023%29.jpg')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* Red Overlay */}
        <div className="absolute inset-0 bg-[#C8102E]/85"></div>

        {/* Content */}
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
            Create, submit and track project proposals — fast, simple, and
            secure.
          </p>
        </div>
      </div>
    </div>
  );
}
