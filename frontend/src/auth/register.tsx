import { api } from "@utils/axios";
import React, { useState } from "react";
// Removed unused import: import { useNavigate } from "react-router-dom"; 
import Swal from "sweetalert2";

const BACKGROUND_IMAGE_URL =
  "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Western_Mindanao_State_University_College_of_Teacher_Education_%28Normal_Road%2C_Baliwasan%2C_Zamboanga_City%3B_10-06-2023%29.jpg/2560px-Western_Mindanao_State_University_College_of_Teacher_Education_%28Normal_Road%2C_Baliwasan%2C_Zamboanga_City%3B_10-06-2023%29.jpg";

type SignUpResponse = {
  message: string;
};

export default function Register() {
  const [email, setEmail] = useState("");
  const [first_name, setFirstName] = useState("");
  const [middle_ini, setMiddleInitial] = useState("");
  const [last_name, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!first_name || !last_name || !password || !email) {
      return Swal.fire({
        icon: "warning",
        title: "Missing fields",
        text: "Please provide your first name, last name, email, and password.",
        confirmButtonColor: "#C8102E",
      });
    }

    try {
      setLoading(true);
      await api.post<SignUpResponse>(
        "/auth/sign-up",
        { first_name, middle_ini, last_name, email, password, roles: ["proponent"] },
        {
          headers: { "Content-Type": "application/json" },
        },
      );

      // --- SUCCESS MODAL ---
      await Swal.fire({
        icon: "success",
        title: "Verify Your Email",
        html: `
          <div style="text-align: center; color: #545454;">
            <p>Your account has been successfully created.</p>
            <br/>
            <p>We have sent a verification link to <strong>${email}</strong>.</p>
            <p style="font-size: 0.9em; margin-top: 10px;">
              Please check your inbox (and spam folder) to activate your account.
              You will not be able to log in until your email is verified.
            </p>
          </div>
        `,
        confirmButtonText: "OK, I understand",
        confirmButtonColor: "#C8102E",
        allowOutsideClick: false,
        iconColor: "#C8102E",
      });

      // Clear the form fields
      setFirstName("");
      setMiddleInitial("");
      setLastName("");
      setEmail("");
      setPassword("");

    } catch (err) {
      console.error("Registration error:", err);

      // Extract error message from axios response
      let errorMessage = "An error occurred during registration. Please try again.";

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
        title: "Registration Failed",
        text: errorMessage,
        confirmButtonColor: "#C8102E",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Image/Banner Section */}
      <div
        className="order-1 md:order-1 w-full md:w-1/2 flex items-center justify-center relative p-8 text-white min-h-[40vh] md:min-h-screen"
        style={{
          backgroundImage: `url('${BACKGROUND_IMAGE_URL}')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-[#C8102E]/85"></div>
        <div className="relative max-w-md text-center space-y-4 md:space-y-6">
          <img
            src="/LOGO.png"
            alt="Logo"
            className="mx-auto w-24 h-24 md:w-40 md:h-40 object-contain rounded-lg"
          />
          <h1 className="text-2xl md:text-4xl font-extrabold hover:text-gray-200 transition-colors duration-300 cursor-pointer">
            Project Proposal
          </h1>
          <p className="text-sm opacity-90 px-4 md:px-0 hover:opacity-100 transition-opacity duration-300">
            Create, submit and track project proposals — fast, simple, and secure.
          </p>
        </div>
      </div>

      {/* Form Section */}
      <div className="order-2 md:order-2 w-full md:w-1/2 flex items-center justify-center bg-white p-6 md:p-8">
        <form
          onSubmit={handleRegister}
          className="w-full max-w-[550px] bg-white rounded-xl shadow-lg p-6 md:p-8 space-y-4 md:space-y-6"
        >
          <h2 className="text-xl md:text-2xl font-semibold text-gray-900 hover:text-[#C8102E] transition-colors duration-300 cursor-pointer text-center md:text-left">
            Sign up
          </h2>
          <p className="text-sm text-gray-600 text-center md:text-left">
            Input all the field to create an account and get started.
          </p>

          {/* Name Fields Container */}
          <div className="flex flex-col md:flex-row gap-3">
            <label className="flex-1">
              <span className="text-sm font-medium text-gray-700">First Name</span>
              <input
                type="text"
                value={first_name}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First Name"
                className="mt-1 block w-full rounded-lg border border-gray-200 px-4 py-3 md:py-2 focus:outline-none focus:ring-2 focus:ring-[#C8102E]/30 hover:border-gray-300 transition-colors duration-200"
              />
            </label>

            <label className="w-full md:w-20">
              <span className="text-sm font-medium text-gray-700">M.I.</span>
              <input
                type="text"
                value={middle_ini}
                onChange={(e) => setMiddleInitial(e.target.value.toUpperCase().slice(0, 1))}
                placeholder="-"
                maxLength={2}
                className="mt-1 block w-full text-center rounded-lg border border-gray-200 px-2 py-3 md:py-2 focus:outline-none focus:ring-2 focus:ring-[#C8102E]/30 hover:border-gray-300 transition-colors duration-200"
              />
            </label>

            <label className="flex-1">
              <span className="text-sm font-medium text-gray-700">Last Name</span>
              <input
                type="text"
                value={last_name}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last Name"
                className="mt-1 block w-full rounded-lg border border-gray-200 px-4 py-3 md:py-2 focus:outline-none focus:ring-2 focus:ring-[#C8102E]/30 hover:border-gray-300 transition-colors duration-200"
              />
            </label>
          </div>

          <label className="block">
            <span className="text-sm font-medium text-gray-700">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              className="mt-1 block w-full rounded-lg border border-gray-200 px-4 py-3 md:py-2 focus:outline-none focus:ring-2 focus:ring-[#C8102E]/30 hover:border-gray-300 transition-colors duration-200"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-gray-700">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="mt-1 block w-full rounded-lg border border-gray-200 px-4 py-3 md:py-2 focus:outline-none focus:ring-2 focus:ring-[#C8102E]/30 hover:border-gray-300 transition-colors duration-200"
            />
          </label>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 inline-flex items-center justify-center px-4 py-3 md:py-2 bg-[#C8102E] text-white rounded-lg font-semibold shadow-sm disabled:opacity-60 hover:bg-[#A50D26] transition-colors duration-300"
            >
              {loading ? "Processing..." : "Create Account"}
            </button>

            <button
              type="button"
              onClick={() => {
                setFirstName("");
                setMiddleInitial("");
                setLastName("");
                setEmail("");
                setPassword("");
              }}
              className="inline-flex items-center justify-center px-4 py-3 md:py-2 bg-white border border-gray-200 text-gray-700 rounded-lg shadow-sm hover:bg-gray-50 hover:border-gray-300 hover:text-gray-900 transition-all duration-300"
            >
              Reset
            </button>
          </div>

          <div className="text-sm text-center text-gray-600">
            Already have an account?{" "}
            <a
              href="/login"
              className="font-semibold hover:text-[#A50D26] transition-colors duration-300"
              style={{ color: "#C8102E" }}
              onMouseOver={(e) => (e.currentTarget.style.color = "#A50D26")}
              onMouseOut={(e) => (e.currentTarget.style.color = "#C8102E")}
            >
              Sign in
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}