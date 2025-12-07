import { useState, useEffect, type ChangeEvent, type FormEvent } from 'react';
import { User, BookOpen, Camera, ChevronRight, ChevronLeft, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

// --- Interfaces ---
interface UserProfileData {
  firstName: string;
  middleInitial: string;
  lastName: string;
  birthdate: string;
  sex: 'Male' | 'Female' | 'Prefer not to say' | '';
  role: 'Lead Proponent' | 'Co-Lead Proponent' | '';
  department: string;
  profilePicture: File | null;
}

// --- Constants ---
const DEPARTMENTS = [
  "College of Computing Studies",
  "College of Engineering",
  "College of Architecture",
  "College of Arts and Sciences",
  "College of Business",
  "College of Education",
  "College of Nursing"
];

const ROLES = ["Lead Proponent", "Co-Lead Proponent"];

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
    firstName: '',
    middleInitial: '',
    lastName: '',
    birthdate: '',
    sex: '',
    role: '',
    department: '',
    profilePicture: null,
  });

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const navigate = useNavigate();

  // --- Effects ---
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
    console.log("Submitting Profile:", formData);

    // TODO: Add your API call here to save 'formData' to the backend
    
    // Simulate Success
    await Swal.fire({
      icon: 'success',
      title: 'Setup Complete!',
      text: 'Your profile has been updated.',
      timer: 1500,
      showConfirmButton: false
    });

    // REDIRECT CHANGE: Go to Main Layout
    navigate("/users/proponent/proponentMainLayout");
  };

  const nextStep = () => {
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
          <div key="step1" className={`space-y-4 relative z-10 ${animationClass}`}>
            <h3 className="text-xl font-semibold text-gray-900 border-b pb-2 border-gray-100">
              Personal Details
            </h3>
            
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="First Name"
                  className="block w-full rounded-lg border border-gray-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#C8102E]/30 hover:border-gray-300 transition-colors duration-200 bg-white/80 backdrop-blur-sm"
                />
              </div>
              <div className="w-24">
                <label className="block text-sm font-medium text-gray-700 mb-1">M.I.</label>
                <input
                type="text"
                name="middleInitial"
                maxLength={2}
                value={formData.middleInitial}
                onChange={handleChange}
                placeholder="M.I." 
                className="block w-full rounded-lg border border-gray-200 px-2 py-2 placeholder:text-xs focus:outline-none focus:ring-2 focus:ring-[#C8102E]/30 hover:border-gray-300 transition-colors duration-200 bg-white/80 backdrop-blur-sm"
            />
            </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Enter your last name"
                className="block w-full rounded-lg border border-gray-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#C8102E]/30 hover:border-gray-300 transition-colors duration-200 bg-white/80 backdrop-blur-sm"
              />
            </div>

            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Birthdate</label>
                <input
                  type="date"
                  name="birthdate"
                  value={formData.birthdate}
                  onChange={handleChange}
                  className="block w-full rounded-lg border border-gray-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#C8102E]/30 hover:border-gray-300 transition-colors duration-200 bg-white/80 backdrop-blur-sm"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Sex</label>
                <select
                  name="sex"
                  value={formData.sex}
                  onChange={handleChange}
                  className="block w-full rounded-lg border border-gray-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#C8102E]/30 hover:border-gray-300 transition-colors duration-200 bg-white/80 backdrop-blur-sm"
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Department / College</label>
              <select
                name="department"
                value={formData.department}
                onChange={handleChange}
                className="block w-full rounded-lg border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#C8102E]/30 hover:border-gray-300 transition-colors duration-200 bg-white/80 backdrop-blur-sm"
              >
                <option value="" disabled>Select Department</option>
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Role in Project</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {ROLES.map((role) => (
                  <label
                    key={role}
                    className={`cursor-pointer relative flex items-center justify-center p-4 rounded-lg border transition-all duration-200 bg-white/80 backdrop-blur-sm
                      ${formData.role === role 
                        ? 'border-[#C8102E] bg-red-50/90 text-[#C8102E] font-medium ring-1 ring-[#C8102E]' 
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50/90'}`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={role}
                      checked={formData.role === role}
                      onChange={handleChange}
                      className="hidden"
                    />
                    <span>{role}</span>
                  </label>
                ))}
              </div>
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
                <div className={`w-40 h-40 rounded-full border-4 shadow-lg overflow-hidden flex items-center justify-center bg-gray-100 
                  ${previewUrl ? 'border-[#C8102E]' : 'border-gray-200'}`}>
                  {previewUrl ? (
                    <img src={previewUrl} alt="Profile Preview" className="w-full h-full object-cover" />
                  ) : (
                    <User size={64} className="text-gray-300" />
                  )}
                </div>
                
                <label htmlFor="profile-upload" className="absolute bottom-0 right-0 bg-[#C8102E] hover:bg-[#A50D26] text-white p-3 rounded-full cursor-pointer shadow-md transition-transform transform hover:scale-105">
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
              <p className="mt-4 text-sm text-gray-500 bg-white/50 px-2 py-1 rounded">
                Click the camera icon to upload. <br/> Allowed formats: JPG, PNG.
              </p>
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
        
        {/* Background Image Layer */}
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
        <div className="relative z-10 w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col h-[600px]">
          
          {/* WATERMARK LOGO */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50 overflow-hidden">
              <img 
                  src="../src/assets/IMAGES/LOGO.png" 
                  alt="Logo Watermark" 
                  className="max-w-[60%] max-h-[60%] object-contain opacity-10" 
              />
          </div>

          {/* Header */}
          <div className="bg-gray-50 border-b border-gray-100 p-6 relative z-20">
              <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Profile Setup</h2>
                  <span className="text-sm font-medium text-[#C8102E] bg-red-50 px-3 py-1 rounded-full">
                      Step {currentStep} of 3
                  </span>
              </div>
              
              <div className="flex justify-between relative">
                  <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 -z-0 transform -translate-y-1/2 rounded-full"></div>
                  <div 
                      className="absolute top-1/2 left-0 h-1 bg-[#C8102E] -z-0 transform -translate-y-1/2 rounded-full transition-all duration-300 ease-in-out"
                      style={{ width: `${((currentStep - 1) / 2) * 100}%` }}
                  ></div>

                  {STEPS.map((step) => {
                      const isActive = step.id === currentStep;
                      const isCompleted = step.id < currentStep;

                      return (
                          <div key={step.id} className="relative z-10 flex flex-col items-center">
                              <div 
                                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300
                                  ${isActive || isCompleted 
                                      ? 'bg-[#C8102E] border-[#C8102E] text-white' 
                                      : 'bg-white border-gray-300 text-gray-400'}`}
                              >
                                  {isCompleted ? <Check size={18} /> : step.icon}
                              </div>
                              <span className={`text-xs mt-2 font-medium ${isActive ? 'text-[#C8102E]' : 'text-gray-400'}`}>
                                  {step.title}
                              </span>
                          </div>
                      );
                  })}
              </div>
          </div>

          {/* Content Body */}
          <div className="flex-1 p-6 md:p-8 overflow-y-auto relative z-10">
              <form id="profile-form" onSubmit={handleSubmit} className="h-full">
                  {renderStepContent()}
              </form>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 p-6 border-t border-gray-100 flex justify-between items-center relative z-20">
              <button
                  type="button"
                  onClick={prevStep}
                  disabled={currentStep === 1}
                  className={`flex items-center px-4 py-2 rounded-lg font-medium transition-all duration-200
                      ${currentStep === 1 
                          ? 'text-gray-300 cursor-not-allowed' 
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'}`}
              >
                  <ChevronLeft size={18} className="mr-1" />
                  Back
              </button>

              {currentStep < 3 ? (
                  <button
                      type="button"
                      onClick={nextStep}
                      className="flex items-center px-6 py-2 bg-[#C8102E] text-white rounded-lg font-semibold shadow-sm hover:bg-[#A50D26] transition-colors duration-300"
                  >
                      Next
                      <ChevronRight size={18} className="ml-1" />
                  </button>
              ) : (
                  <button
                      type="submit"
                      form="profile-form"
                      className="flex items-center px-6 py-2 bg-[#C8102E] text-white rounded-lg font-semibold shadow-sm hover:bg-[#A50D26] transition-colors duration-300"
                  >
                      Complete Setup
                      <Check size={18} className="ml-1" />
                  </button>
              )}
          </div>

        </div>
      </div>
    </>
  );
}