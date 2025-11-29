import React from 'react';
import {
  FaUpload,
  FaCheck,
  FaCircle,
  FaTimes,
  FaRobot,
  FaSpinner,
  FaFileAlt,
  FaPaperPlane
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
  onFileButtonClick: () => void;
  isUploadDisabled: boolean;
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
  onFileButtonClick,
  isUploadDisabled
}) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 sticky top-24 border border-gray-100 flex flex-col h-fit">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Upload Section</h2>
        <p className="text-gray-600 mt-2">Upload your proposal document</p>
      </div>
      
      {/* --- File Upload Area --- */}
      <input
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
        onClick={isUploadDisabled ? undefined : onFileButtonClick}
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
              onClick={onFileButtonClick}
              disabled={isUploadDisabled}
              className="w-full py-2 text-sm text-gray-600 hover:text-[#C8102E] transition-colors flex items-center justify-center gap-2 font-medium cursor-pointer"
            >
              <FaTimes className="w-3 h-3" />
              Choose different file
            </button>
          </>
        ) : (
          <button
            onClick={onFileButtonClick}
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
          Data Checklist (Optional)
        </h4>
        <div className="space-y-2.5 text-sm">
          <div className={`flex items-center ${formData.programTitle ? 'text-green-700 font-medium' : 'text-gray-500'}`}>
            {formData.programTitle ? <FaCheck className="w-3 h-3 mr-2" /> : <FaCircle className="w-2 h-2 mr-2 opacity-50" />}
            <span>Program Title</span>
          </div>
          <div className={`flex items-center ${formData.projectTitle ? 'text-green-700 font-medium' : 'text-gray-500'}`}>
            {formData.projectTitle ? <FaCheck className="w-3 h-3 mr-2" /> : <FaCircle className="w-2 h-2 mr-2 opacity-50" />}
            <span>Project Title</span>
          </div>
          <div className={`flex items-center ${Object.values(formData.researchType).some(v => v) ? 'text-green-700 font-medium' : 'text-gray-500'}`}>
            {Object.values(formData.researchType).some(v => v) ? <FaCheck className="w-3 h-3 mr-2" /> : <FaCircle className="w-2 h-2 mr-2 opacity-50" />}
            <span>Research Type</span>
          </div>
          <div className={`flex items-center ${formData.budgetItems.every(item => item.source) ? 'text-green-700 font-medium' : 'text-gray-500'}`}>
            {formData.budgetItems.every(item => item.source) ? <FaCheck className="w-3 h-3 mr-2" /> : <FaCircle className="w-2 h-2 mr-2 opacity-50" />}
            <span>Budget Items</span>
          </div>
        </div>
      </div>

      {/* --- Action Buttons (AI Assistant & Submit) --- */}
      <div className="mt-auto space-y-3">
        {/* AI Form Assistant (Restored to colored gradient style) */}
        <div className="relative group w-full rounded-xl overflow-hidden p-[2px]">
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
        </div>

        {/* Submit Button */}
        <button
          onClick={onSubmit}
          className="w-full py-3.5 rounded-xl font-bold transition-all duration-200 flex items-center justify-center gap-2 bg-[#C8102E] text-white hover:bg-[#9d0d24] shadow-lg hover:shadow-xl transform hover:scale-[1.02] cursor-pointer"
        >
          <FaPaperPlane className="w-4 h-4" />
          Submit Proposal
        </button>
      </div>
    </div>
  );
};

export default UploadSidebar;