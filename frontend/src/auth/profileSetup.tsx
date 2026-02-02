import { useState, useEffect, type ChangeEvent, type FormEvent } from 'react';
import { User, BookOpen, Camera, ChevronRight, ChevronLeft, Check, HelpCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { api } from '../utils/axios';

// --- Interfaces ---
interface UserProfileData {
  birthdate: string;
  sex: 'Male' | 'Female' | 'Prefer not to say' | '';
  rdStation: string;
  profilePicture: File | null;
}

interface ProfileSetupResponse {
  message: string;
  photoUploaded: boolean;
}

// --- Constants ---
const RD_STATIONS = [
  "College of Computing Studies",
  "College of Engineering",
  "College of Architecture",
  "College of Arts and Sciences",
  "College of Business",
  "College of Education",
  "College of Nursing"
];

const STEPS = [
  { id: 1, title: "Personal Info", icon: <User size={18} /> },
  { id: 2, title: "Academic Info", icon: <BookOpen size={18} /> },
  { id: 3, title: "Profile Photo", icon: <Camera size={18} /> },
];

export default function ProfileSetup() {
  // --- State ---
  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');
  const [formData, setFormData] = useState<UserProfileData>({
    birthdate: '',
    sex: '',
    rdStation: '',
    profilePicture: null,
  });

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const navigate = useNavigate();

  // --- Effects ---
  useEffect(() => {
    // TEMPORARILY DISABLED: Static mode
    /*
    const checkProfileStatus = async () => {
      try {
        const response = await api.get<{ isCompleted: boolean }>('/auth/profile-status');
        if (response.data.isCompleted) {
          navigate("/users/proponent/proponentMainLayout", { replace: true });
        }
      } catch (error) {
        console.error("Failed to check profile status", error);
      }
    };
    checkProfileStatus();
    */
  }, [navigate]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  // --- Handlers ---
  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFormData((prev) => ({ ...prev, profilePicture: file }));
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Validate required fields (photo is optional)
    if (!formData.birthdate || !formData.sex || !formData.rdStation) {
      Swal.fire({
        icon: 'error',
        title: 'Missing Required Fields',
        text: 'Please fill in all required fields: Birthdate, Sex, and R&D Station.',
        confirmButtonColor: '#C8102E',
      });
      return;
    }

    try {
      // PREPARE DATA (Simulated)
      /*
      // Prepare form data
      const data = new FormData();
      data.append('birth_date', formData.birthdate);
      data.append('sex', formData.sex);
      data.append('department_id', formData.rdStation);

      if (formData.profilePicture) {
        data.append('photo_profile_url', formData.profilePicture);
      }

      // Make API call using axios (handles cookies automatically via withCredentials)
      const response = await api.post<ProfileSetupResponse>('/auth/profile-setup', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const result = response.data;
      */

      // SIMULATED SUCCESS
      const result = {
        message: 'Profile setup simulated success',
        photoUploaded: !!formData.profilePicture
      };

      const successTitle = result.photoUploaded ? 'Profile Setup Complete! (Simulated)' : 'Profile Saved! (Simulated)';
      const successText = result.photoUploaded
        ? 'Your information and photo have been saved successfully.'
        : 'Your information has been saved. You can add a photo later from your profile.';

      await Swal.fire({
        icon: 'success',
        title: successTitle,
        text: successText,
        timer: 2000,
        showConfirmButton: false
      });

      navigate("/users/proponent/proponentMainLayout");
    } catch (error: any) {
      console.error('Profile setup error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to complete profile setup. Please try again.';
      Swal.fire({
        icon: 'error',
        title: 'Setup Failed',
        text: errorMessage,
        confirmButtonColor: '#C8102E',
      });
    }
  };

  const nextStep = () => {
    // Validate current step before proceeding
    if (currentStep === 1) {
      if (!formData.birthdate || !formData.sex) {
        Swal.fire({
          icon: 'warning',
          title: 'Required Fields',
          text: 'Please fill in your birthdate and sex before proceeding.',
          confirmButtonColor: '#C8102E',
        });
        return;
      }
    } else if (currentStep === 2) {
      if (!formData.rdStation) {
        Swal.fire({
          icon: 'warning',
          title: 'Required Field',
          text: 'Please select your R&D Station before proceeding.',
          confirmButtonColor: '#C8102E',
        });
        return;
      }
    }

    setDirection('forward');
    setCurrentStep((prev) => Math.min(prev + 1, 3));
  };

  const prevStep = () => {
    setDirection('backward');
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  // --- Content Renderers ---
  const renderStepContent = () => {
    const animationClass = direction === 'forward' ? 'animate-slide-in-right' : 'animate-slide-in-left';

    switch (currentStep) {
      case 1:
        return (
          <div key="step1" className={`space-y-6 relative z-10 ${animationClass}`}>
            <h3 className="text-xl font-semibold text-gray-900 border-b pb-2 border-gray-100">
              Personal Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Birthdate</label>
                <input
                  type="date"
                  name="birthdate"
                  value={formData.birthdate}
                  onChange={handleChange}
                  className="block w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20 focus:border-[#C8102E] hover:border-gray-300 transition-all duration-200 bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sex</label>
                <select
                  name="sex"
                  value={formData.sex}
                  onChange={handleChange}
                  className="block w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20 focus:border-[#C8102E] hover:border-gray-300 transition-all duration-200 bg-white"
                >
                  <option value="" disabled>Select Sex</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div key="step2" className={`space-y-6 relative z-10 ${animationClass}`}>
            <h3 className="text-xl font-semibold text-gray-900 border-b pb-2 border-gray-100">
              Academic Information
            </h3>

            <div className="relative">
              {/* Tooltip Label Container */}
              <div className="group w-fit relative flex items-center gap-2 mb-2 cursor-help">
                <label className="block text-sm font-medium text-gray-700 group-hover:text-[#C8102E] transition-colors">
                  Research and Development Station
                </label>
                <HelpCircle size={16} className="text-gray-400 group-hover:text-[#C8102E] transition-colors" />

                {/* Tooltip Popup */}
                <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl z-50 animate-in fade-in zoom-in-95 duration-200">
                  <p className="leading-relaxed">
                    Select the specific college, unit, or center where your research activities are primarily based or affiliated.
                  </p>
                  {/* Tooltip Arrow */}
                  <div className="absolute left-6 top-full w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-gray-900"></div>
                </div>
              </div>

              <select
                name="rdStation"
                value={formData.rdStation}
                onChange={handleChange}
                className="block w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20 focus:border-[#C8102E] hover:border-gray-300 transition-all duration-200 bg-white"
              >
                <option value="" disabled>Select Station / Center</option>
                {RD_STATIONS.map((station) => (
                  <option key={station} value={station}>{station}</option>
                ))}
              </select>
            </div>
          </div>
        );

      case 3:
        return (
          <div key="step3" className={`space-y-6 text-center relative z-10 ${animationClass}`}>
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
                  ? "Looking good! Click 'Finish & Upload' to complete."
                  : "Profile photo is optional. Click 'Complete Setup' to finish."}
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

        {/* Background Image Layer (RESTORED TO ORIGINAL DESIGN) */}
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `url('https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Western_Mindanao_State_University_College_of_Teacher_Education_%28Normal_Road%2C_Baliwasan%2C_Zamboanga_City%3B_10-06-2023%29.jpg/2560px-Western_Mindanao_State_University_College_of_Teacher_Education_%28Normal_Road%2C_Baliwasan%2C_Zamboanga_City%3B_10-06-2023%29.jpg')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="absolute inset-0 bg-[#C8102E]/85"></div>
        </div>

        {/* Stepper Card */}
        <div className="relative z-10 w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[600px] border border-gray-100">

          {/* WATERMARK LOGO */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50 overflow-hidden">
            <img
              src="../src/assets/IMAGES/LOGO.png"
              alt="Logo Watermark"
              className="max-w-[50%] max-h-[50%] object-contain opacity-[0.03]"
            />
          </div>

          {/* Header */}
          <div className="bg-white px-8 pt-8 pb-4 relative z-20">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Profile Setup</h2>
                <p className="text-gray-500 text-sm mt-1">Complete your information to get started.</p>
              </div>
              <span className="text-xs font-bold text-[#C8102E] bg-red-50 border border-red-100 px-3 py-1.5 rounded-full uppercase tracking-wide">
                Step {currentStep} of 3
              </span>
            </div>

            {/* Progress Bar Container */}
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
                        className={`w-11 h-11 rounded-full flex items-center justify-center border-[3px] transition-all duration-300 shadow-sm
                                      ${isActive || isCompleted
                            ? 'bg-[#C8102E] border-[#C8102E] text-white scale-110'
                            : 'bg-white border-gray-200 text-gray-400 group-hover:border-gray-300'}`}
                      >
                        {isCompleted ? <Check size={20} strokeWidth={3} /> : step.icon}
                      </div>
                      <span className={`text-[10px] sm:text-xs mt-3 font-bold uppercase tracking-wider transition-colors duration-300 ${isActive ? 'text-[#C8102E]' : 'text-gray-400'}`}>
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
            <form id="profile-form" onSubmit={handleSubmit} className="h-full">
              {renderStepContent()}
            </form>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-8 py-6 border-t border-gray-100 flex justify-between items-center relative z-20">
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

            {currentStep < 3 ? (
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
                form="profile-form"
                className="flex items-center px-6 py-2.5 rounded-xl font-bold text-sm shadow-md transform hover:-translate-y-0.5 transition-all duration-300 text-white bg-[#C8102E] hover:bg-[#A50D26]"
              >
                {previewUrl ? 'Finish & Upload' : 'Complete Setup'}
                {previewUrl ? <Check size={18} className="ml-2" /> : <ChevronRight size={18} className="ml-2" />}
              </button>
            )}
          </div>

        </div>
      </div>
    </>
  );
}