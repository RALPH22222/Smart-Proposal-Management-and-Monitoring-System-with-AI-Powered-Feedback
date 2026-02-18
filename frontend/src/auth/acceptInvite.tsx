import { useState, useEffect, type ChangeEvent, type FormEvent } from 'react';
import { UserCheck, User, BookOpen, Camera, ChevronRight, ChevronLeft, Check, HelpCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { supabase } from '../config/supabaseClient';
import { api } from '../utils/axios';
import RdecLogo from '../assets/IMAGES/RDEC-WMSU.png';

interface Department {
  id: number;
  name: string;
}

const STEPS = [
  { id: 1, title: "Account", icon: <UserCheck size={18} /> },
  { id: 2, title: "Personal Info", icon: <User size={18} /> },
  { id: 3, title: "Academic Info", icon: <BookOpen size={18} /> },
  { id: 4, title: "Profile Photo", icon: <Camera size={18} /> },
];

const validateAge = (dateString: string) => {
  const birth = new Date(dateString);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age >= 18;
};

const getMaxDate = () => {
  const today = new Date();
  today.setFullYear(today.getFullYear() - 18);
  return today.toISOString().split('T')[0];
};

export default function AcceptInvite() {
  // Account fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [middleIni, setMiddleIni] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Profile fields
  const [birthdate, setBirthdate] = useState('');
  const [sex, setSex] = useState('');
  const [rdStation, setRdStation] = useState('');
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // UI state
  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');
  const [loading, setLoading] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loadingDepartments, setLoadingDepartments] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    const establishSession = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (error || !data.session) {
        setErrorMessage('Invalid or expired invitation link. Please ask the admin to send a new invitation.');
        return;
      }

      setSessionReady(true);
    };

    establishSession();
  }, []);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        setLoadingDepartments(true);
        const response = await api.get<Department[]>('/auth/departments');
        setDepartments(response.data || []);
      } catch (error) {
        console.error("Failed to fetch departments", error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to load departments. Please refresh the page.',
          confirmButtonColor: '#C8102E',
        });
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

  const nextStep = () => {
    if (currentStep === 1) {
      if (!firstName || !lastName || !password || !confirmPassword) {
        Swal.fire({ icon: 'warning', title: 'Missing Fields', text: 'Please fill in all required fields.', confirmButtonColor: '#C8102E' });
        return;
      }
      if (password.length < 6) {
        Swal.fire({ icon: 'warning', title: 'Password Too Short', text: 'Password must be at least 6 characters.', confirmButtonColor: '#C8102E' });
        return;
      }
      if (password !== confirmPassword) {
        Swal.fire({ icon: 'error', title: 'Passwords Do Not Match', text: 'Please make sure both passwords match.', confirmButtonColor: '#C8102E' });
        return;
      }
    } else if (currentStep === 2) {
      if (!birthdate || !sex) {
        Swal.fire({ icon: 'warning', title: 'Required Fields', text: 'Please fill in your birthdate and sex before proceeding.', confirmButtonColor: '#C8102E' });
        return;
      }
      if (!validateAge(birthdate)) {
        Swal.fire({ icon: 'error', title: 'Age Restriction', text: 'You must be at least 18 years old to proceed.', confirmButtonColor: '#C8102E' });
        return;
      }
    } else if (currentStep === 3) {
      if (!rdStation) {
        Swal.fire({ icon: 'warning', title: 'Required Field', text: 'Please select your R&D Station before proceeding.', confirmButtonColor: '#C8102E' });
        return;
      }
    }

    setDirection('forward');
    setCurrentStep((prev) => Math.min(prev + 1, 4));
  };

  const prevStep = () => {
    setDirection('backward');
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (currentStep < 4) {
      nextStep();
      return;
    }

    // Final validation
    if (!firstName || !lastName || !password || !birthdate || !sex || !rdStation) {
      Swal.fire({ icon: 'error', title: 'Missing Required Fields', text: 'Please complete all required fields.', confirmButtonColor: '#C8102E' });
      return;
    }

    try {
      setLoading(true);

      // 1. Set password via Supabase Auth
      const { error: pwError } = await supabase.auth.updateUser({ password });
      if (pwError) throw new Error(pwError.message);

      // 2. Save profile via backend API with multipart form data
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      const formData = new FormData();
      formData.append('first_name', firstName);
      formData.append('last_name', lastName);
      if (middleIni) formData.append('middle_ini', middleIni);
      formData.append('birth_date', birthdate);
      formData.append('sex', sex);
      formData.append('department_id', rdStation);
      if (profilePicture) {
        formData.append('photo_profile_url', profilePicture);
      }

      await api.post('/auth/complete-invite', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      // 3. Sign out so user logs in fresh (cookie-based session)
      await supabase.auth.signOut();

      await Swal.fire({
        icon: 'success',
        title: 'Account Setup Complete',
        text: 'You can now log in with your email and password.',
        timer: 2500,
        showConfirmButton: false,
      });

      navigate('/login', { replace: true });
    } catch (error: any) {
      const msg = error.response?.data?.message || error.message || 'Failed to complete registration.';
      Swal.fire({ icon: 'error', title: 'Error', text: msg, confirmButtonColor: '#C8102E' });
    } finally {
      setLoading(false);
    }
  };

  if (errorMessage) {
    return (
      <div className="min-h-screen relative flex items-center justify-center p-4">
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `url('https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Western_Mindanao_State_University_College_of_Teacher_Education_%28Normal_Road%2C_Baliwasan%2C_Zamboanga_City%3B_10-06-2023%29.jpg/2560px-Western_Mindanao_State_University_College_of_Teacher_Education_%28Normal_Road%2C_Baliwasan%2C_Zamboanga_City%3B_10-06-2023%29.jpg')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="absolute inset-0 bg-[#C8102E]/85"></div>
        </div>
        <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100 p-8 text-center">
          <img src={RdecLogo} alt="RDEC Logo" className="w-20 h-20 object-contain mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Invalid Invitation</h2>
          <p className="text-gray-600 text-sm mb-6">{errorMessage}</p>
          <button
            onClick={() => navigate('/login', { replace: true })}
            className="px-6 py-2 bg-[#C8102E] text-white rounded-xl font-medium text-sm hover:bg-[#A50D26] transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (!sessionReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500 text-sm">Verifying invitation...</div>
      </div>
    );
  }

  const renderStepContent = () => {
    const animationClass = direction === 'forward' ? 'animate-slide-in-right' : 'animate-slide-in-left';

    switch (currentStep) {
      case 1:
        return (
          <div key="step1" className={`space-y-4 relative z-10 ${animationClass}`}>
            <h3 className="text-xl font-semibold text-gray-900 border-b pb-2 border-gray-100">
              Account Details
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="First name"
                  required
                  className="block w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20 focus:border-[#C8102E] hover:border-gray-300 transition-all duration-200 bg-white text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Last name"
                  required
                  className="block w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20 focus:border-[#C8102E] hover:border-gray-300 transition-all duration-200 bg-white text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Middle Initial</label>
              <input
                type="text"
                value={middleIni}
                onChange={(e) => setMiddleIni(e.target.value)}
                placeholder="Optional"
                className="block w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20 focus:border-[#C8102E] hover:border-gray-300 transition-all duration-200 bg-white text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  required
                  className="block w-full rounded-xl border border-gray-200 px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20 focus:border-[#C8102E] hover:border-gray-300 transition-all duration-200 bg-white text-sm"
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password *</label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                required
                className="block w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20 focus:border-[#C8102E] hover:border-gray-300 transition-all duration-200 bg-white text-sm"
              />
            </div>

            {password && (
              <div className="text-xs text-gray-500 space-y-1">
                <p className={password.length >= 6 ? 'text-green-600' : 'text-red-500'}>
                  {password.length >= 6 ? '\u2713' : '\u2717'} At least 6 characters
                </p>
                <p className={password === confirmPassword && confirmPassword ? 'text-green-600' : 'text-red-500'}>
                  {password === confirmPassword && confirmPassword ? '\u2713' : '\u2717'} Passwords match
                </p>
              </div>
            )}
          </div>
        );

      case 2:
        return (
          <div key="step2" className={`space-y-6 relative z-10 ${animationClass}`}>
            <h3 className="text-xl font-semibold text-gray-900 border-b pb-2 border-gray-100">
              Personal Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Birthdate *</label>
                <input
                  type="date"
                  value={birthdate}
                  onChange={(e) => setBirthdate(e.target.value)}
                  max={getMaxDate()}
                  className="block w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20 focus:border-[#C8102E] hover:border-gray-300 transition-all duration-200 bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sex *</label>
                <select
                  value={sex}
                  onChange={(e) => setSex(e.target.value)}
                  className="block w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20 focus:border-[#C8102E] hover:border-gray-300 transition-all duration-200 bg-white"
                >
                  <option value="" disabled>Select Sex</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="prefer_not_to_say">Prefer not to say</option>
                </select>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div key="step3" className={`space-y-6 relative z-10 ${animationClass}`}>
            <h3 className="text-xl font-semibold text-gray-900 border-b pb-2 border-gray-100">
              Academic Information
            </h3>

            <div className="relative">
              <div className="group w-fit relative flex items-center gap-2 mb-2 cursor-help">
                <label className="block text-sm font-medium text-gray-700 group-hover:text-[#C8102E] transition-colors">
                  Research and Development Station *
                </label>
                <HelpCircle size={16} className="text-gray-400 group-hover:text-[#C8102E] transition-colors" />

                <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl z-50 animate-in fade-in zoom-in-95 duration-200">
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
                className="block w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20 focus:border-[#C8102E] hover:border-gray-300 transition-all duration-200 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="" disabled>
                  {loadingDepartments ? 'Loading departments...' : 'Select Department / Center'}
                </option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id.toString()}>{dept.name}</option>
                ))}
              </select>
            </div>
          </div>
        );

      case 4:
        return (
          <div key="step4" className={`space-y-6 text-center relative z-10 ${animationClass}`}>
            <h3 className="text-xl font-semibold text-gray-900 border-b pb-2 border-gray-100">
              Upload Profile Picture
            </h3>

            <div className="flex flex-col items-center justify-center pt-4">
              <div className="relative group">
                <div className={`w-40 h-40 rounded-full border-[6px] shadow-lg overflow-hidden flex items-center justify-center bg-gray-50
                  ${previewUrl ? 'border-[#C8102E]' : 'border-white ring-1 ring-gray-200'}`}>
                  {previewUrl ? (
                    <img src={previewUrl} alt="Profile Preview" className="w-full h-full object-cover" />
                  ) : (
                    <User size={64} className="text-gray-300" />
                  )}
                </div>

                <label htmlFor="profile-upload" className="absolute bottom-1 right-1 bg-[#C8102E] hover:bg-[#A50D26] text-white p-3 rounded-full cursor-pointer shadow-lg transition-transform transform hover:scale-110 active:scale-95 border-4 border-white">
                  <Camera size={20} />
                </label>
                <input
                  id="profile-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
              <div className="mt-6 bg-blue-50 text-blue-700 px-4 py-2 rounded-lg text-sm inline-block font-medium">
                {previewUrl
                  ? "Looking good! Click 'Complete Registration' to finish."
                  : "Profile photo is optional. Click 'Complete Registration' to finish."}
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

      <div className="min-h-screen relative flex items-center justify-center p-4">
        {/* Background */}
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `url('https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Western_Mindanao_State_University_College_of_Teacher_Education_%28Normal_Road%2C_Baliwasan%2C_Zamboanga_City%3B_10-06-2023%29.jpg/2560px-Western_Mindanao_State_University_College_of_Teacher_Education_%28Normal_Road%2C_Baliwasan%2C_Zamboanga_City%3B_10-06-2023%29.jpg')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="absolute inset-0 bg-[#C8102E]/85"></div>
        </div>

        {/* Stepper Card */}
        <div className="relative z-10 w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[640px] border border-gray-100">
          {/* Watermark */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50 overflow-hidden">
            <img
              src="../src/assets/IMAGES/WMSU-LOGO.png"
              alt="Logo Watermark"
              className="max-w-[50%] max-h-[50%] object-contain opacity-[0.03]"
            />
          </div>

          {/* Header */}
          <div className="bg-white px-8 pt-6 pb-4 relative z-20">
            <div className="flex items-center gap-3 mb-1">
              <img src={RdecLogo} alt="RDEC Logo" className="w-12 h-12 object-contain" />
              <div>
                <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Complete Registration</h2>
                <p className="text-gray-500 text-sm mt-0.5">Set up your account and profile to get started.</p>
              </div>
            </div>

            <div className="flex justify-end mb-4">
              <span className="text-xs font-bold text-[#C8102E] bg-red-50 border border-red-100 px-3 py-1.5 rounded-full uppercase tracking-wide">
                Step {currentStep} of 4
              </span>
            </div>

            {/* Progress Bar */}
            <div className="relative px-4">
              <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-100 -z-0 transform -translate-y-1/2 rounded-full"></div>
              <div
                className="absolute top-1/2 left-0 h-1 bg-[#C8102E] -z-0 transform -translate-y-1/2 rounded-full transition-all duration-500 ease-in-out"
                style={{ width: `${((currentStep - 1) / 3) * 100}%` }}
              ></div>

              <div className="flex justify-between relative w-full">
                {STEPS.map((step) => {
                  const isActive = step.id === currentStep;
                  const isCompleted = step.id < currentStep;

                  return (
                    <div key={step.id} className="relative z-10 flex flex-col items-center group cursor-default">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center border-[3px] transition-all duration-300 shadow-sm
                          ${isActive || isCompleted
                            ? 'bg-[#C8102E] border-[#C8102E] text-white scale-110'
                            : 'bg-white border-gray-200 text-gray-400 group-hover:border-gray-300'}`}
                      >
                        {isCompleted ? <Check size={18} strokeWidth={3} /> : step.icon}
                      </div>
                      <span className={`text-[10px] sm:text-xs mt-2 font-bold uppercase tracking-wider transition-colors duration-300 ${isActive ? 'text-[#C8102E]' : 'text-gray-400'}`}>
                        {step.title}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Content Body */}
          <div className="flex-1 px-8 py-6 overflow-y-auto relative z-10 custom-scrollbar">
            <form id="invite-form" onSubmit={handleSubmit} className="h-full">
              {renderStepContent()}
            </form>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-8 py-4 border-t border-gray-100 flex justify-between items-center relative z-20">
            <button
              type="button"
              onClick={prevStep}
              disabled={currentStep === 1}
              className={`flex items-center px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200
                ${currentStep === 1
                  ? 'text-gray-300 cursor-not-allowed'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-200'}`}
            >
              <ChevronLeft size={18} className="mr-1.5" />
              Back
            </button>

            {currentStep < 4 ? (
              <button
                type="button"
                onClick={nextStep}
                className="flex items-center px-6 py-2.5 bg-[#C8102E] text-white rounded-xl font-bold text-sm shadow-md hover:bg-[#A50D26] hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300"
              >
                Next Step
                <ChevronRight size={18} className="ml-1.5" />
              </button>
            ) : (
              <button
                type="submit"
                form="invite-form"
                disabled={loading}
                className="flex items-center px-6 py-2.5 rounded-xl font-bold text-sm shadow-md transform hover:-translate-y-0.5 transition-all duration-300 text-white bg-[#C8102E] hover:bg-[#A50D26] disabled:opacity-60 disabled:hover:translate-y-0"
              >
                {loading ? 'Setting up...' : 'Complete Registration'}
                {!loading && <Check size={18} className="ml-2" />}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
