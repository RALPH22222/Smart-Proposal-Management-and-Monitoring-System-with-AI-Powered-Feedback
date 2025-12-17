import React, { useState, useRef } from 'react';
import {
  FaUpload,
  FaCheck,
  FaCircle,
  FaTimes,
  FaRobot,
  FaSpinner,
  FaFileAlt,
  FaPaperPlane,
  FaExclamationCircle,
  FaLock
} from 'react-icons/fa';
import type { FormData } from '../../../../types/proponent-form';

interface UploadSidebarProps {
  formData: FormData;
  selectedFile: File | null;
  isCheckingTemplate: boolean;
  isCheckingForm: boolean; 
  onAIFormCheck: () => void;
  onFileSelect: (file: File | null) => void;
  onAITemplateCheck: () => void;
  onSubmit: () => void;
  isUploadDisabled: boolean;
  isBudgetValid: boolean; // <-- NEW PROP
}

const UploadSidebar: React.FC<UploadSidebarProps> = ({
  formData,
  selectedFile,
  isCheckingTemplate,
  isCheckingForm,
  onAIFormCheck,
  onFileSelect,
  onAITemplateCheck,
  onSubmit,
  isUploadDisabled,
  isBudgetValid // <-- Receive new prop
}) => {
  // 2. Create a Local Ref for the file input
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State to control the confirmation modal
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Helper to trigger the file input click
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // --- VALIDATION LOGIC ---
  const checkFormValidity = () => {
    // 1. Check File
    if (!selectedFile) return false;

    // 2. Check Basic Info (Required Fields)
    if (!formData.programTitle?.trim()) return false;
    if (!formData.projectTitle?.trim()) return false;
    // if (!formData.schoolYear?.trim()) return false; // REMOVED: School Year check
    if (!formData.duration?.trim()) return false;
    if (!formData.agencyName?.trim()) return false;
    if (!formData.agencyStreet?.trim()) return false;
    if (!formData.agencyBarangay?.trim()) return false;
    if (!formData.agencyCity?.trim()) return false;
    if (!formData.telephone?.trim()) return false;
    if (!formData.email?.trim()) return false;

    // 3. Check Research Details
    if (!formData.researchStation?.trim()) return false;
    
    // Check Classification Type
    if (!formData.classificationType) return false;
    if (formData.classificationType === 'research') {
        const { basic, applied, other } = formData.researchType || {};
        if (!basic && !applied && !other) return false;
    } else if (formData.classificationType === 'development') {
        if (!formData.developmentType) return false;
    }

    // Check Implementation Mode
    if (!formData.implementationMode?.singleAgency && !formData.implementationMode?.multiAgency) return false;

    // Check Implementation Sites
    if (!formData.implementationSite || formData.implementationSite.length === 0) return false;
    if (formData.implementationSite.some(s => !s.site.trim() || !s.city.trim())) return false;

    // Check Priority Areas (Form validation check is kept here, if required for submission!)
    const hasPriority = formData.priorityAreas && Object.values(formData.priorityAreas).some(v => v === true);
    if (!hasPriority) return false; // <-- KEEPING the actual validation check based on the code provided

    // 4. Check Budget Validity 
    if (!isBudgetValid) return false;

    return true;
  };

  const isFormValid = checkFormValidity();

  const handleInitialSubmit = () => {
    if (isFormValid) {
      setShowConfirmation(true);
    }
  };

  const handleFinalSubmit = () => {
    setShowConfirmation(false);
    onSubmit();
  };

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm p-6 sticky top-24 border border-gray-100 flex flex-col h-fit">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Upload Section</h2>
          <p className="text-gray-600 mt-2">Upload your proposal document</p>
        </div>
        
        {/* --- File Upload Area --- */}
        <input
          ref={fileInputRef} // 3. Attach the Ref here
          id="file-upload"
          type="file"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files && e.target.files[0] ? e.target.files[0] : null;
            onFileSelect(file);
          }}
          disabled={isUploadDisabled}
        />

        <div
          className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-200 mb-6 cursor-pointer ${
            isUploadDisabled
              ? 'border-gray-300 bg-gray-100 cursor-not-allowed'
              : selectedFile
              ? 'border-green-400 bg-green-50'
              : 'border-gray-300 bg-gray-50 hover:border-[#C8102E] hover:bg-red-50'
          }`}
          onClick={isUploadDisabled ? undefined : handleUploadClick} // 4. Use local handler
          onDrop={(e) => {
            e.preventDefault();
            if (!isUploadDisabled) {
              const file = e.dataTransfer.files && e.dataTransfer.files[0] ? e.dataTransfer.files[0] : null;
              onFileSelect(file);
            }
          }}
          onDragOver={(e) => e.preventDefault()}
        >
          {selectedFile ? (
            <div className="text-green-700">
              <FaCheck className="text-3xl mb-3 mx-auto" />
              <p className="font-semibold text-lg">File Ready</p>
              <p className="text-sm mt-1 truncate max-w-[200px] mx-auto">{selectedFile.name}</p>
            </div>
          ) : (
            <div className="py-4">
              <FaFileAlt className="text-4xl text-gray-400 mb-3 mx-auto" />
              <p className="text-gray-700 font-bold mb-1">Drop file here</p>
              <p className="text-gray-500 text-sm">or click to browse</p>
            </div>
          )}
        </div>

        {/* Action Buttons for File */}
        <div className="space-y-3 mb-6">
          {selectedFile ? (
            <>
              <button
                onClick={onAITemplateCheck}
                disabled={isCheckingTemplate}
                className={`w-full py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
                  isCheckingTemplate
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transform hover:scale-[1.02]'
                }`}
              >
                {isCheckingTemplate ? (
                  <>
                    <FaSpinner className="w-4 h-4 animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    <FaRobot className="w-4 h-4" />
                    AI Template Check
                  </>
                )}
              </button>
              
              <button
                onClick={handleUploadClick} // 4. Use local handler
                disabled={isUploadDisabled}
                className="w-full py-2 text-sm text-gray-600 hover:text-[#C8102E] transition-colors flex items-center justify-center gap-2 font-medium cursor-pointer"
              >
                <FaTimes className="w-3 h-3" />
                Choose different file
              </button>
            </>
          ) : (
            <button
              onClick={handleUploadClick} // 4. Use local handler
              disabled={isUploadDisabled}
              className={`w-full py-3 rounded-xl font-bold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
                isUploadDisabled
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-[#C8102E] text-white hover:bg-[#9d0d24] shadow-md hover:shadow-lg transform hover:scale-[1.02]'
              }`}
            >
              <FaUpload className="w-4 h-4" />
              Upload Research
            </button>
          )}
        </div>

        {/* Checklist */}
        <div className="p-5 bg-blue-50 rounded-xl border border-blue-100 mb-6">
          <h4 className="font-bold text-blue-900 text-sm mb-3 flex items-center gap-2">
            <FaCheck className="w-3 h-3" />
            Submission Status
          </h4>
          <div className="space-y-2.5 text-sm">
            {/* File Status */}
            <div className={`flex items-center ${selectedFile ? 'text-green-700 font-medium' : 'text-gray-500'}`}>
              {selectedFile ? <FaCheck className="w-3 h-3 mr-2" /> : <FaCircle className="w-2 h-2 mr-2 opacity-50" />}
              <span>Proposal Document</span>
            </div>

            {/* Basic Info Status */}
            <div className={`flex items-center ${
                (formData.projectTitle && formData.email) ? 'text-green-700 font-medium' : 'text-gray-500'
            }`}>
              {(formData.projectTitle && formData.email) ? <FaCheck className="w-3 h-3 mr-2" /> : <FaCircle className="w-2 h-2 mr-2 opacity-50" />}
              <span>Basic Information</span>
            </div>

            {/* Research Details Status */}
            <div className={`flex items-center ${
                 (formData.researchStation && formData.classificationType) ? 'text-green-700 font-medium' : 'text-gray-500'
            }`}>
              {(formData.researchStation && formData.classificationType) ? <FaCheck className="w-3 h-3 mr-2" /> : <FaCircle className="w-2 h-2 mr-2 opacity-50" />}
              <span>Research Details</span>
            </div>

            {/* NEW: Budget Status */}
            <div className={`flex items-center ${isBudgetValid ? 'text-green-700 font-medium' : 'text-gray-500'}`}>
              {isBudgetValid ? <FaCheck className="w-3 h-3 mr-2" /> : <FaCircle className="w-2 h-2 mr-2 opacity-50" />}
              <span>Budget Section</span>
            </div>
          </div>
        </div>

        {/* --- Action Buttons (AI Assistant & Submit) --- */}
        <div className="mt-auto space-y-3">
          {/* AI Form Assistant */}
{/*           <div className="relative group w-full rounded-xl overflow-hidden p-[2px]">
            {!isCheckingForm && (
              <div className="absolute inset-[-1000%] animate-[spin_4s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2E8F0_0%,#393BB2_50%,#E2E8F0_100%)]" 
                   style={{ backgroundImage: 'conic-gradient(from 90deg at 50% 50%, #313deaff 40%, #efefefff 60%, #f51111 100%)' }} 
              />
            )}
            <button
              onClick={onAIFormCheck}
              disabled={isCheckingForm}
              className={`relative h-full w-full py-3.5 rounded-xl font-bold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
                isCheckingForm 
                  ? 'bg-gray-400 cursor-not-allowed text-white' 
                  : 'bg-gradient-to-r from-red-600 to-blue-800 hover:from-red-500 hover:to-blue-700 text-white shadow-lg'
              }`}
            >
              {isCheckingForm ? (
                <>
                  <FaSpinner className="w-4 h-4 animate-spin" />
                  Analyzing Form...
                </>
              ) : (
                <>
                  <FaRobot className="w-5 h-5" />
                  AI Form Assistant
                </>
              )}
            </button>
          </div> */}

          {/* Submit Button (Triggers Confirmation) - MODIFIED: Disabled if form invalid */}
          <div className="relative group">
            <button
                onClick={handleInitialSubmit}
                disabled={!isFormValid}
                className={`w-full py-3.5 rounded-xl font-bold transition-all duration-200 flex items-center justify-center gap-2 shadow-lg transform ${
                !isFormValid
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none'
                    : 'bg-[#C8102E] text-white hover:bg-[#9d0d24] hover:shadow-xl hover:scale-[1.02] cursor-pointer'
                }`}
            >
                {!isFormValid ? <FaLock className="w-4 h-4" /> : <FaPaperPlane className="w-4 h-4" />}
                Submit Proposal
            </button>
            
            {/* Tooltip for Disabled State */}
            {!isFormValid && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    Please fill all required fields and upload a file.
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-gray-800"></div>
                </div>
            )}
          </div>
        </div>
      </div>

      {/* --- Confirmation Modal --- */}
      {showConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
            <div className="text-center">
              <div className="bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaExclamationCircle className="w-8 h-8 text-[#C8102E]" />
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Confirm Submission
              </h3>
              
              <p className="text-gray-600 mb-6 leading-relaxed">
                Are you sure you are ready to submit this proposal? Please verify that all provided information is accurate and the required documents are attached.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmation(false)}
                  className="flex-1 py-3 px-4 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleFinalSubmit}
                  className="flex-1 py-3 px-4 rounded-xl bg-[#C8102E] text-white font-semibold hover:bg-[#9d0d24] shadow-md transition-all flex items-center justify-center gap-2"
                >
                  Confirm Submission
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default UploadSidebar;