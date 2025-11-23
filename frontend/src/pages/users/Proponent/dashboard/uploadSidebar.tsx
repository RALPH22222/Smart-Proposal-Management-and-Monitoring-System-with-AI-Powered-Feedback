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
// Assuming types are in a relative path or shared file. 
// Since I cannot see the types file, I will keep the import but ensure the code is self-contained if possible or assume the path is correct.
// For this generation, I'll keep the import as provided by the user.
import type { FormData } from '../../../../types/proponent-form';

interface UploadSidebarProps {
  formData: FormData;
  selectedFile: File | null;
  isFormComplete: boolean;
  isCheckingTemplate: boolean;
  onFileSelect: (file: File | null) => void;
  onAITemplateCheck: () => void;
  onSubmit: () => void;
  onFileButtonClick: () => void;
  isUploadDisabled: boolean;
}

const UploadSidebar: React.FC<UploadSidebarProps> = ({
  formData,
  selectedFile,
  // isFormComplete,
  isCheckingTemplate,
  onFileSelect,
  onAITemplateCheck,
  onSubmit,
  onFileButtonClick,
  isUploadDisabled
}) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 sticky top-24 border border-gray-100 flex flex-col">
      <div className="text-center mb-6">
        <div className="w-20 h-20 bg-gradient-to-br from-[#C8102E] to-[#E03A52] rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
          <FaUpload className="text-2xl text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800">Upload Research</h2>
        <p className="text-gray-600 mt-2">Upload your proposal document</p>
      </div>

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
        className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all duration-200 mb-4 ${
          isUploadDisabled
            ? 'border-gray-300 bg-gray-100 cursor-not-allowed'
            : selectedFile
            ? 'border-green-400 bg-green-50'
            : 'border-gray-300 bg-gray-50 hover:border-[#C8102E] hover:bg-red-50 cursor-pointer'
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
            <FaCheck className="text-3xl mb-2 mx-auto" />
            <p className="font-semibold">File Ready</p>
            <p className="text-sm mt-1 truncate">{selectedFile.name}</p>
          </div>
        ) : (
          <div>
            <FaFileAlt className="text-3xl text-gray-400 mb-2 mx-auto" />
            <p className="text-gray-600 font-semibold">Drop file here</p>
            <p className="text-gray-500 text-sm mt-1">or click to browse</p>
          </div>
        )}
      </div>

      {selectedFile && (
        <button
          onClick={onAITemplateCheck}
          disabled={isCheckingTemplate}
          className={`w-full py-3 rounded-xl font-semibold transition-all duration-200 mb-3 flex items-center justify-center gap-2 ${
            isCheckingTemplate
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
          }`}
        >
          {isCheckingTemplate ? (
            <>
              <FaSpinner className="w-4 h-4 animate-spin" />
              Checking Template...
            </>
          ) : (
            <>
              <FaRobot className="w-4 h-4" />
              AI Template Check
            </>
          )}
        </button>
      )}

      {/* Only show Select File button if no file is selected. The Submit button is now at the bottom. */}
      {!selectedFile && (
        <button
          onClick={onFileButtonClick}
          disabled={isUploadDisabled}
          className={`w-full py-3 rounded-xl font-semibold transition-all duration-200 mb-3 flex items-center justify-center gap-2 ${
            isUploadDisabled
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-[#C8102E] to-[#E03A52] text-white hover:from-[#9d0d24] hover:to-[#C8102E] shadow-lg hover:shadow-xl transform hover:scale-105 cursor-pointer'
          }`}
        >
          <FaUpload className="w-4 h-4" />
          Select File
        </button>
      )}

      {selectedFile && (
        <button
          onClick={onFileButtonClick}
          disabled={isUploadDisabled}
          className="w-full py-2 text-sm text-gray-600 hover:text-[#C8102E] transition-colors flex items-center justify-center gap-2 font-medium mb-4"
        >
          <FaTimes className="w-3 h-3" />
          Choose different file
        </button>
      )}

      <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200 mb-6">
        <h4 className="font-bold text-blue-800 text-sm mb-3 flex items-center gap-2">
          <FaCheck className="w-3 h-3" />
          Data Checklist (Optional)
        </h4>
        <div className="space-y-2 text-xs">
          <div className={`flex items-center ${formData.programTitle ? 'text-green-600' : 'text-gray-500'}`}>
            {formData.programTitle ? <FaCheck className="w-3 h-3 mr-2" /> : <FaCircle className="w-2 h-2 mr-2" />}
            <span className="font-medium">Program Title</span>
          </div>
          <div className={`flex items-center ${formData.projectTitle ? 'text-green-600' : 'text-gray-500'}`}>
            {formData.projectTitle ? <FaCheck className="w-3 h-3 mr-2" /> : <FaCircle className="w-2 h-2 mr-2" />}
            <span className="font-medium">Project Title</span>
          </div>
          <div className={`flex items-center ${Object.values(formData.researchType).some(v => v) ? 'text-green-600' : 'text-gray-500'}`}>
            {Object.values(formData.researchType).some(v => v) ? <FaCheck className="w-3 h-3 mr-2" /> : <FaCircle className="w-2 h-2 mr-2" />}
            <span className="font-medium">Research Type</span>
          </div>
          <div className={`flex items-center ${formData.budgetItems.every(item => item.source) ? 'text-green-600' : 'text-gray-500'}`}>
            {formData.budgetItems.every(item => item.source) ? <FaCheck className="w-3 h-3 mr-2" /> : <FaCircle className="w-2 h-2 mr-2" />}
            <span className="font-medium">Budget Items</span>
          </div>
        </div>
      </div>

      {/* Submit Button*/}
      <button
        onClick={onSubmit}
        className="w-full py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 bg-gradient-to-r from-[#C8102E] to-[#E03A52] text-white hover:from-[#9d0d24] hover:to-[#C8102E] shadow-lg hover:shadow-xl transform hover:scale-105 cursor-pointer"
      >
        <FaPaperPlane className="w-4 h-4" />
        Submit Proposal
      </button>
    </div>
  );
};

export default UploadSidebar;