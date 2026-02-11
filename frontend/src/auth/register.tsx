import { api } from "@utils/axios";
import { useState, useEffect, type ChangeEvent } from "react";
import Swal from "sweetalert2";
import { User, BookOpen, Camera, ChevronRight, ChevronLeft, Check, HelpCircle } from "lucide-react";

const BACKGROUND_IMAGE_URL =
  "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Western_Mindanao_State_University_College_of_Teacher_Education_%28Normal_Road%2C_Baliwasan%2C_Zamboanga_City%3B_10-06-2023%29.jpg/2560px-Western_Mindanao_State_University_College_of_Teacher_Education_%28Normal_Road%2C_Baliwasan%2C_Zamboanga_City%3B_10-06-2023%29.jpg";

interface Department {
  id: number;
  name: string;
}

const STEPS = [
  { id: 1, title: "Account Info", icon: <User size={18} /> },
  { id: 2, title: "Personal Info", icon: <BookOpen size={18} /> },
  { id: 3, title: "Profile Photo", icon: <Camera size={18} /> },
];

const validateAge = (birthdate: string): boolean => {
  const birth = new Date(birthdate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age >= 18;
};

export default function Register() {
  // Step 1 fields
  const [first_name, setFirstName] = useState("");
  const [middle_ini, setMiddleInitial] = useState("");
  const [last_name, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Step 2 fields
  const [birthdate, setBirthdate] = useState("");
  const [sex, setSex] = useState("");
  const [rdStation, setRdStation] = useState("");
  const [birthdateError, setBirthdateError] = useState("");

  // Step 3 fields
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Stepper state
  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState<"forward" | "backward">("forward");
  const [loading, setLoading] = useState(false);

  // Departments
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loadingDepartments, setLoadingDepartments] = useState(true);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        setLoadingDepartments(true);
        const response = await api.get<Department[]>("/auth/departments");
        setDepartments(response.data || []);
      } catch (error) {
        console.error("Failed to fetch departments", error);
      } finally {
        setLoadingDepartments(false);
      }
    };
    fetchDepartments();
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfilePicture(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleBirthdateBlur = () => {
    if (birthdate && !validateAge(birthdate)) {
      setBirthdateError("You must be at least 18 years old to register.");
    } else {
      setBirthdateError("");
    }
  };

  const nextStep = () => {
    if (currentStep === 1) {
      if (!first_name || !last_name || !email || !password) {
        Swal.fire({
          icon: "warning",
          title: "Missing Fields",
          text: "Please fill in all required fields before proceeding.",
          confirmButtonColor: "#C8102E",
        });
        return;
      }
      if (password.length < 6) {
        Swal.fire({
          icon: "warning",
          title: "Password Too Short",
          text: "Password must be at least 6 characters.",
          confirmButtonColor: "#C8102E",
        });
        return;
      }
    } else if (currentStep === 2) {
      if (!birthdate || !sex || !rdStation) {
        Swal.fire({
          icon: "warning",
          title: "Missing Fields",
          text: "Please fill in your birthdate, sex, and R&D station before proceeding.",
          confirmButtonColor: "#C8102E",
        });
        return;
      }
      if (!validateAge(birthdate)) {
        setBirthdateError("You must be at least 18 years old to register.");
        Swal.fire({
          icon: "error",
          title: "Age Requirement",
          text: "You must be at least 18 years old to create an account.",
          confirmButtonColor: "#C8102E",
        });
        return;
      }
    }
    setDirection("forward");
    setCurrentStep((prev) => Math.min(prev + 1, 3));
  };

  const prevStep = () => {
    setDirection("backward");
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    // Final validation
    if (!first_name || !last_name || !email || !password || !birthdate || !sex || !rdStation) {
      Swal.fire({
        icon: "error",
        title: "Missing Required Fields",
        text: "Please complete all required fields.",
        confirmButtonColor: "#C8102E",
      });
      return;
    }

    try {
      setLoading(true);

      const data = new FormData();
      data.append("first_name", first_name);
      data.append("last_name", last_name);
      if (middle_ini) data.append("middle_ini", middle_ini);
      data.append("email", email);
      data.append("password", password);
      data.append("roles", JSON.stringify(["proponent"]));
      data.append("birth_date", birthdate);
      data.append("sex", sex);
      data.append("department_id", rdStation);

      if (profilePicture) {
        data.append("photo_profile_url", profilePicture);
      }

      await api.post("/auth/sign-up", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

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

      // Reset form
      setFirstName("");
      setMiddleInitial("");
      setLastName("");
      setEmail("");
      setPassword("");
      setBirthdate("");
      setSex("");
      setRdStation("");
      setProfilePicture(null);
      setPreviewUrl(null);
      setCurrentStep(1);
    } catch (err) {
      console.error("Registration error:", err);

      let errorMessage = "An error occurred during registration. Please try again.";
      if (err && typeof err === "object" && "response" in err) {
        const axiosError = err as { response?: { data?: { message?: string } } };
        if (axiosError.response?.data?.message) {
          errorMessage = axiosError.response.data.message;
        }
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }

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

  const renderStepContent = () => {
    const animationClass = direction === "forward" ? "animate-slide-in-right" : "animate-slide-in-left";

    switch (currentStep) {
      case 1:
        return (
          <div key="step1" className={`space-y-4 ${animationClass}`}>
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 border-gray-100">Account Information</h3>

            {/* Name Fields */}
            <div className="flex flex-col md:flex-row gap-3">
              <label className="flex-1">
                <span className="text-sm font-medium text-gray-700">
                  First Name <span className="text-red-500">*</span>
                </span>
                <input
                  type="text"
                  value={first_name}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="First Name"
                  className="mt-1 block w-full rounded-xl border border-gray-200 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20 focus:border-[#C8102E] hover:border-gray-300 transition-all duration-200"
                />
              </label>

              <label className="w-full md:w-20">
                <span className="text-sm font-medium text-gray-700">M.I.</span>
                <input
                  type="text"
                  value={middle_ini}
                  onChange={(e) => setMiddleInitial(e.target.value.toUpperCase().slice(0, 1))}
                  placeholder="-"
                  maxLength={1}
                  className="mt-1 block w-full text-center rounded-xl border border-gray-200 px-2 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20 focus:border-[#C8102E] hover:border-gray-300 transition-all duration-200"
                />
              </label>

              <label className="flex-1">
                <span className="text-sm font-medium text-gray-700">
                  Last Name <span className="text-red-500">*</span>
                </span>
                <input
                  type="text"
                  value={last_name}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Last Name"
                  className="mt-1 block w-full rounded-xl border border-gray-200 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20 focus:border-[#C8102E] hover:border-gray-300 transition-all duration-200"
                />
              </label>
            </div>

            <label className="block">
              <span className="text-sm font-medium text-gray-700">
                Email <span className="text-red-500">*</span>
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                className="mt-1 block w-full rounded-xl border border-gray-200 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20 focus:border-[#C8102E] hover:border-gray-300 transition-all duration-200"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-gray-700">
                Password <span className="text-red-500">*</span>
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password (min. 6 characters)"
                className="mt-1 block w-full rounded-xl border border-gray-200 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20 focus:border-[#C8102E] hover:border-gray-300 transition-all duration-200"
              />
            </label>
          </div>
        );

      case 2:
        return (
          <div key="step2" className={`space-y-5 ${animationClass}`}>
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 border-gray-100">Personal & Academic Info</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Birthdate <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={birthdate}
                  onChange={(e) => {
                    setBirthdate(e.target.value);
                    if (birthdateError) setBirthdateError("");
                  }}
                  onBlur={handleBirthdateBlur}
                  className={`block w-full rounded-xl border px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20 focus:border-[#C8102E] hover:border-gray-300 transition-all duration-200 bg-white ${
                    birthdateError ? "border-red-400" : "border-gray-200"
                  }`}
                />
                {birthdateError && <p className="mt-1.5 text-sm text-red-500">{birthdateError}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Sex <span className="text-red-500">*</span>
                </label>
                <select
                  value={sex}
                  onChange={(e) => setSex(e.target.value)}
                  className="block w-full rounded-xl border border-gray-200 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20 focus:border-[#C8102E] hover:border-gray-300 transition-all duration-200 bg-white"
                >
                  <option value="" disabled>
                    Select Sex
                  </option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="prefer_not_to_say">Prefer not to say</option>
                </select>
              </div>
            </div>

            <div className="relative">
              <div className="group w-fit relative flex items-center gap-2 mb-1.5 cursor-help">
                <label className="block text-sm font-medium text-gray-700 group-hover:text-[#C8102E] transition-colors">
                  Research and Development Station <span className="text-red-500">*</span>
                </label>
                <HelpCircle size={16} className="text-gray-400 group-hover:text-[#C8102E] transition-colors" />
                <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl z-50">
                  <p className="leading-relaxed">
                    Select the specific college, unit, or center where your research activities are primarily based or affiliated.
                  </p>
                  <div className="absolute left-6 top-full w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-gray-900"></div>
                </div>
              </div>
              <select
                value={rdStation}
                onChange={(e) => setRdStation(e.target.value)}
                disabled={loadingDepartments}
                className="block w-full rounded-xl border border-gray-200 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20 focus:border-[#C8102E] hover:border-gray-300 transition-all duration-200 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="" disabled>
                  {loadingDepartments ? "Loading departments..." : "Select Department / Center"}
                </option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id.toString()}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        );

      case 3:
        return (
          <div key="step3" className={`space-y-5 text-center ${animationClass}`}>
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 border-gray-100">Upload Profile Picture</h3>

            <div className="flex flex-col items-center justify-center pt-2">
              <div className="relative group">
                <div
                  className={`w-36 h-36 rounded-full border-[6px] shadow-lg overflow-hidden flex items-center justify-center bg-gray-50 ${
                    previewUrl ? "border-[#C8102E]" : "border-white ring-1 ring-gray-200"
                  }`}
                >
                  {previewUrl ? (
                    <img src={previewUrl} alt="Profile Preview" className="w-full h-full object-cover" />
                  ) : (
                    <User size={56} className="text-gray-300" />
                  )}
                </div>

                <label
                  htmlFor="profile-upload"
                  className="absolute bottom-1 right-1 bg-[#C8102E] hover:bg-[#A50D26] text-white p-2.5 rounded-full cursor-pointer shadow-lg transition-transform transform hover:scale-110 active:scale-95 border-4 border-white"
                >
                  <Camera size={18} />
                </label>
                <input id="profile-upload" type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              </div>
              <div className="mt-5 bg-blue-50 text-blue-700 px-4 py-2 rounded-lg text-sm inline-block font-medium">
                {previewUrl ? "Looking good! Click 'Create Account' to complete." : "Profile photo is optional. Click 'Create Account' to finish."}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <style>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-slide-in-right {
          animation: slideInRight 0.4s ease-out forwards;
        }
        .animate-slide-in-left {
          animation: slideInLeft 0.4s ease-out forwards;
        }
      `}</style>

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
            <img src="/LOGO.png" alt="Logo" className="mx-auto w-24 h-24 md:w-40 md:h-40 object-contain rounded-lg" />
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
          <div className="w-full max-w-[580px] bg-white rounded-xl shadow-lg overflow-hidden flex flex-col" style={{ minHeight: "620px" }}>
            {/* Header with Stepper */}
            <div className="px-6 pt-6 pb-4">
              {/* Back to Home */}
              <a
                href="/"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-gray-600 bg-gray-50 border border-gray-100 transition-all duration-300 hover:bg-red-50 hover:text-[#C8102E] hover:border-red-200 hover:shadow-md hover:-translate-y-0.5 group mb-4"
              >
                <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-sm group-hover:bg-[#C8102E] group-hover:text-white transition-colors duration-300">
                  <svg className="w-3 h-3 transition-transform duration-300 group-hover:-translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </div>
                <span>Back to Home</span>
              </a>

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-5 gap-3">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Sign up</h2>
                  <p className="text-gray-500 text-sm mt-1">Complete all steps to create your account.</p>
                </div>
                <span className="text-xs font-bold text-[#C8102E] bg-red-50 border border-red-100 px-3 py-1.5 rounded-full uppercase tracking-wide">
                  Step {currentStep} of 3
                </span>
              </div>

              {/* Progress Bar */}
              <div className="relative px-4">
                <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-100 -z-0 transform -translate-y-1/2 rounded-full"></div>
                <div
                  className="absolute top-1/2 left-0 h-1 bg-[#C8102E] -z-0 transform -translate-y-1/2 rounded-full transition-all duration-500 ease-in-out"
                  style={{ width: `${((currentStep - 1) / 2) * 100}%` }}
                ></div>

                <div className="flex justify-between relative w-full">
                  {STEPS.map((step) => {
                    const isActive = step.id === currentStep;
                    const isCompleted = step.id < currentStep;

                    return (
                      <div key={step.id} className="relative z-10 flex flex-col items-center group cursor-default">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center border-[3px] transition-all duration-300 shadow-sm ${
                            isActive || isCompleted
                              ? "bg-[#C8102E] border-[#C8102E] text-white scale-110"
                              : "bg-white border-gray-200 text-gray-400 group-hover:border-gray-300"
                          }`}
                        >
                          {isCompleted ? <Check size={18} strokeWidth={3} /> : step.icon}
                        </div>
                        <span
                          className={`text-[10px] sm:text-xs mt-2 font-bold uppercase tracking-wider transition-colors duration-300 ${
                            isActive ? "text-[#C8102E]" : "text-gray-400"
                          }`}
                        >
                          {step.title}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Step Content */}
            <div className="flex-1 px-6 py-4 overflow-y-auto">{renderStepContent()}</div>

            {/* Footer Navigation */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex justify-between items-center">
              <button
                type="button"
                onClick={prevStep}
                disabled={currentStep === 1}
                className={`flex items-center px-4 py-2 rounded-xl font-semibold text-sm transition-all duration-200 ${
                  currentStep === 1
                    ? "text-gray-300 cursor-not-allowed"
                    : "text-gray-600 hover:text-gray-900 hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-200"
                }`}
              >
                <ChevronLeft size={18} className="mr-1.5" />
                Back
              </button>

              {currentStep < 3 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="flex items-center px-5 py-2 bg-[#C8102E] text-white rounded-xl font-bold text-sm shadow-md hover:bg-[#A50D26] hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300"
                >
                  Next Step
                  <ChevronRight size={18} className="ml-1.5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex items-center px-5 py-2 rounded-xl font-bold text-sm shadow-md transform hover:-translate-y-0.5 transition-all duration-300 text-white bg-[#C8102E] hover:bg-[#A50D26] disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {loading ? "Processing..." : previewUrl ? "Create Account" : "Create Account"}
                  {!loading && <Check size={18} className="ml-2" />}
                </button>
              )}
            </div>

            {/* Sign in link */}
            <div className="text-sm text-center text-gray-600 pb-5">
              Already have an account?{" "}
              <a
                href="/login"
                className="font-semibold text-[#C8102E] hover:text-[#A50D26] transition-colors duration-300"
              >
                Sign in
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
