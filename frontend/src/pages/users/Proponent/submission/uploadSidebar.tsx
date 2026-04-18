import React from 'react';
import {
  Check,
  Circle,
  X,
  Loader2,
  Bot,
  FileText,
  Send,
  Lock,
  Eye,
  Download
} from 'lucide-react';
import templateDOCX from '../../../../assets/template/DOST_Form_No.1b.docx';
import { useRef } from 'react';
import Swal from 'sweetalert2';
import type { FormData } from '../../../../types/proponent-form';
import type { AIAnalysisResult } from '../../../../components/proponent-component/aiModal';

interface UploadSidebarProps {
  formData: FormData;
  selectedFile: File | null;
  workPlanFile?: File | null;
  aiCheckResult: AIAnalysisResult | null;
  isCheckingTemplate: boolean;
  onFileSelect: (file: File | null) => void;
  onWorkPlanFileSelect?: (file: File | null) => void;
  onAITemplateCheck: () => void;
  onSubmit: () => void;
  onViewTemplate: () => void;
  isUploadDisabled: boolean;
  isBudgetValid: boolean;
}

const UploadSidebar: React.FC<UploadSidebarProps> = ({
  formData,
  selectedFile,
  workPlanFile,
  aiCheckResult,
  isCheckingTemplate,
  onFileSelect,
  onWorkPlanFileSelect,
  onAITemplateCheck,
  onSubmit,
  onViewTemplate,
  isUploadDisabled,
  isBudgetValid
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const workPlanInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // --- VALIDATION LOGIC ---
  const checkFormValidity = () => {
    // 1. Check File
    if (!selectedFile) return false;

    // 2. Check Basic Info (Required Fields)
    if (!formData.program_title?.trim()) return false;
    if (!formData.project_title?.trim()) return false;
    if (!formData.duration?.trim()) return false;
    if (!formData.agencyAddress?.city?.trim()) return false;
    if (!formData.telephone?.trim()) return false;
    if (!formData.email?.trim()) return false;
    if (!formData.agency) return false;
    if (!Number.isInteger(formData.year)) return false;
    if (!formData.tags || formData.tags.length === 0) return false;

    // 3. Check Research Details
    if (!formData.sector) return false;
    if (!formData.discipline) return false;
    if (!formData.plannedStartDate) return false;
    if (!formData.plannedEndDate) return false;
    // Check Classification Type (uses classification_type from FormData)
    if (!formData.classification_type) return false;

    // Check class_input is set (the actual research/development type)
    if (!formData.class_input?.trim()) return false;

    // Check Implementation Sites
    if (!formData.implementation_site || formData.implementation_site.length === 0) return false;
    const hasValidSite = formData.implementation_site.some(s => s.site?.trim() && s.city?.trim());
    if (!hasValidSite) return false;

    // Check Priority Areas (now stored as array of IDs)
    if (!formData.priorities_id || formData.priorities_id.length === 0) return false;

    // 4. Check Budget Validity
    if (!isBudgetValid) return false;

    return true;
  };

  const isFormValid = checkFormValidity();

  const handleInitialSubmit = () => {
    if (isFormValid) {
      Swal.fire({
        title: 'Confirm Submission',
        text: "Are you sure you are ready to submit this proposal? You won't be able to edit this information until the R&D staff requests a revision.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#C8102E',
        cancelButtonColor: '#9ca3af',
        confirmButtonText: 'Yes!',
        cancelButtonText: 'No',
        reverseButtons: true
      }).then((result) => {
        if (result.isConfirmed) {
          onSubmit();
        }
      });
    }
  };

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm p-4 md:p-6 lg:sticky lg:top-24 border border-gray-100 flex flex-col h-fit">
        <div className="text-center mb-5 md:mb-6">
          <h2 className="text-xl md:text-2xl font-bold text-gray-800">Upload Section</h2>
          <p className="text-gray-600 mt-2">Upload required documents</p>
        </div>

        {/* --- Proposal Template Section & File Upload Area --- */}
        <div className="p-4 md:p-5 bg-slate-50 rounded-[24px] border border-slate-200 mb-5 md:mb-6 flex flex-col gap-1 md:gap-2 shadow-sm relative overflow-hidden group">
          <div className="flex flex-col items-center gap-2 relative z-10">
            <h4 className="font-bold text-gray-800 text-base md:text-lg leading-[1.15] tracking-tight text-center">
              DOST Form No.1B Template
            </h4>
            <div className="bg-slate-200 rounded-md px-2.5 py-1.5 flex flex-col items-center justify-center shrink-0">
              <span className="text-[11px] font-semibold text-slate-600 tracking-widest leading-none">Required Format</span>
            </div>
          </div>

          <div className="pt-2">
            <input
              ref={fileInputRef}
              id="file-upload"
              type="file"
              accept=".pdf,.doc,.docx"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files && e.target.files[0] ? e.target.files[0] : null;
                if (file) {
                  const extension = file.name.split('.').pop()?.toLowerCase();
                  if (!['pdf', 'doc', 'docx'].includes(extension || '')) {
                    Swal.fire({ icon: 'error', title: 'Invalid File Type', text: 'Please upload a PDF, DOC, or DOCX document only.' });
                    e.target.value = '';
                    return;
                  }
                  if (file.size > 10 * 1024 * 1024) {
                    Swal.fire({ icon: 'error', title: 'File too large', text: 'Maximum file size is 10 MB.' });
                    e.target.value = '';
                    return;
                  }
                  onFileSelect(file);
                }
              }}
              disabled={isUploadDisabled}
            />

            <div
              className={`border-2 border-dashed rounded-2xl p-5 text-center transition-all duration-200 mb-2 cursor-pointer ${isUploadDisabled
                ? 'border-gray-300 bg-gray-100 cursor-not-allowed'
                : selectedFile
                  ? 'border-green-400 bg-green-50'
                  : 'border-gray-300 bg-white hover:border-[#C8102E] hover:bg-red-50'
                }`}
              onClick={isUploadDisabled ? undefined : handleUploadClick}
              onDrop={(e) => {
                e.preventDefault();
                if (!isUploadDisabled) {
                  const file = e.dataTransfer.files && e.dataTransfer.files[0] ? e.dataTransfer.files[0] : null;
                  if (file) {
                    const extension = file.name.split('.').pop()?.toLowerCase();
                    if (!['pdf', 'doc', 'docx'].includes(extension || '')) {
                      Swal.fire({ icon: 'error', title: 'Invalid File Type', text: 'Please upload a PDF, DOC, or DOCX document only.' });
                      return;
                    }
                    if (file.size > 10 * 1024 * 1024) {
                      Swal.fire({ icon: 'error', title: 'File too large', text: 'Maximum file size is 10 MB.' });
                      return;
                    }
                    onFileSelect(file);
                  }
                }
              }}
              onDragOver={(e) => e.preventDefault()}
            >
              {selectedFile ? (
                <div className="text-green-700">
                  <Check className="text-3xl mb-3 mx-auto" />
                  <p className="font-semibold text-lg">File Ready</p>
                  <p className="text-sm mt-1 truncate max-w-[200px] mx-auto">{selectedFile.name}</p>
                </div>
              ) : (
                <div className="py-2">
                  <FileText className="text-3xl text-gray-400 mb-2 mx-auto" />
                  <p className="text-gray-700 font-bold mb-1 text-md">DOST Form No.1B</p>
                  <p className="text-gray-500 text-xs">Browse or drag file here</p>
                </div>
              )}
            </div>

            {/* Action Buttons for File */}
            {selectedFile && (
              <div className="space-y-3">
                <button
                  onClick={onAITemplateCheck}
                  disabled={isCheckingTemplate}
                  className={`w-full py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${isCheckingTemplate
                    ? 'bg-gray-400 cursor-not-allowed text-white'
                    : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transform hover:scale-[1.02]'
                    }`}
                >
                  {isCheckingTemplate ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Bot className="w-4 h-4" />
                      {aiCheckResult ? 'Re-analyze Proposal' : 'AI Analysis & Feedback'}
                    </>
                  )}
                </button>

                {/* AI Insights Mini Dashboard */}
                {aiCheckResult && !isCheckingTemplate && (
                  <div className="p-3 md:p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl border border-blue-100 shadow-sm animate-in fade-in slide-in-from-top duration-500">
                    <div className="flex items-center gap-2 mb-2 md:mb-3">
                      <Bot className="w-4 h-4 text-blue-600" />
                      <span className="text-xs font-bold text-blue-900 uppercase tracking-wider">AI Insights Dashboard</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {/* Compliance Score */}
                      <div className="bg-white p-3 rounded-xl border border-blue-50 flex flex-col items-center">
                        <span className="text-[10px] font-bold text-gray-500 uppercase">Compliance</span>
                        <span className={`text-xl font-black ${aiCheckResult.score && aiCheckResult.score >= 70 ? 'text-green-600' : 'text-orange-600'}`}>
                          {aiCheckResult.score}%
                        </span>
                      </div>

                      {/* Novelty Score */}
                      <div className="bg-white p-3 rounded-xl border border-blue-50 flex flex-col items-center min-w-[100px]">
                        <span className="text-[10px] font-bold text-gray-500 uppercase">Novelty</span>
                        <span className={`text-xl font-black ${(aiCheckResult.noveltyScore || 0) >= 75 ? 'text-blue-600' : 'text-purple-600'}`}>
                          {aiCheckResult.noveltyScore}%
                        </span>
                        <span className="text-[9px] font-bold text-gray-400 mt-1">
                          {(() => {
                            const sim = 100 - (aiCheckResult.noveltyScore || 0);
                            if (sim <= 20) return "Not Related";
                            if (sim <= 40) return "Slightly Related";
                            if (sim <= 60) return "Moderately Similar";
                            if (sim <= 80) return "Highly Similar";
                            return "Very Similar";
                          })()}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 text-[11px] text-blue-800 leading-tight bg-blue-100/50 p-2 rounded-lg border border-blue-200/50 italic">
                      {(aiCheckResult.noveltyScore || 0) < 40
                        ? "Warning: High similarity detected. Consider clarifying your unique approach."
                        : (aiCheckResult.noveltyScore || 0) < 70
                          ? "Note: Some similar research found. Ensure your methodology is distinct."
                          : "Tip: High novelty detected. This proposal shows a unique research direction."}
                    </div>
                  </div>
                )}

                <button
                  onClick={handleUploadClick}
                  disabled={isUploadDisabled}
                  className="w-full py-2 text-sm text-gray-600 hover:text-[#C8102E] transition-colors flex items-center justify-center gap-2 font-medium cursor-pointer"
                >
                  <X className="w-3 h-3" />
                  Choose different file
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2.5 relative z-10 border-t border-slate-200 pt-4 mt-2">
            <button
              onClick={onViewTemplate}
              className="w-full py-3 px-4 bg-white border border-slate-300 text-slate-900 rounded-[14px] hover:border-slate-400 hover:bg-slate-50 transition-all flex items-center justify-center gap-2.5 active:scale-95"
            >
              <Eye className="w-[15px] h-[15px] shrink-0 text-gray-800" />
              <span className="text-[15px] font-semibold leading-tight">View Template</span>
            </button>
            <a
              href={templateDOCX}
              download="DOST-Project-Proposal-Template.docx"
              className="w-full py-3 px-4 bg-[#C8102E] text-white rounded-[14px] hover:bg-[#a00c24] transition-all flex items-center justify-center gap-2.5 active:scale-95"
            >
              <Download className="w-[15px] h-[15px] shrink-0" />
              <span className="text-[15px] font-semibold leading-tight">Download</span>
            </a>
          </div>
        </div>

        {/* --- Work & Financial Plan (DOST Form 3) --- */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-gray-700">Work & Financial Plan</h3>
            <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded">Optional</span>
          </div>
          <p className="text-xs text-gray-500 mb-3">Upload your project workplan and financial plan document.</p>

          <input
            ref={workPlanInputRef}
            type="file"
            accept=".pdf,.doc,.docx"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0] || null;
              if (file) {
                const ext = file.name.split('.').pop()?.toLowerCase();
                if (!['pdf', 'doc', 'docx'].includes(ext || '')) {
                  Swal.fire({ icon: 'error', title: 'Invalid File Type', text: 'Please upload a PDF, DOC, or DOCX document only.' });
                  e.target.value = '';
                  return;
                }
                if (file.size > 10 * 1024 * 1024) {
                  Swal.fire({ icon: 'error', title: 'File too large', text: 'Maximum file size is 10 MB.' });
                  e.target.value = '';
                  return;
                }
                onWorkPlanFileSelect?.(file);
              }
            }}
            disabled={isUploadDisabled}
          />

          <div
            className={`border-2 border-dashed rounded-xl p-4 text-center transition-all cursor-pointer ${isUploadDisabled ? 'border-gray-300 bg-gray-100 cursor-not-allowed' :
              workPlanFile ? 'border-green-400 bg-green-50' : 'border-gray-300 bg-gray-50 hover:border-[#C8102E] hover:bg-red-50'
              }`}
            onClick={isUploadDisabled ? undefined : () => workPlanInputRef.current?.click()}
          >
            {workPlanFile ? (
              <div className="text-green-700">
                <Check className="w-5 h-5 mx-auto mb-1" />
                <p className="font-semibold text-sm">File Ready</p>
                <p className="text-xs mt-0.5 truncate max-w-[200px] mx-auto">{workPlanFile.name}</p>
              </div>
            ) : (
              <div className="py-2">
                <FileText className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                <p className="text-gray-700 text-sm font-bold">DOST Form 3</p>
                <p className="text-gray-500 text-xs font-small">Browse or drag file here</p>
              </div>
            )}
          </div>

          {workPlanFile && (
            <button
              onClick={() => { onWorkPlanFileSelect?.(null); if (workPlanInputRef.current) workPlanInputRef.current.value = ''; }}
              className="w-full mt-2 py-1.5 text-xs text-gray-500 hover:text-[#C8102E] transition-colors flex items-center justify-center gap-1 font-medium cursor-pointer"
            >
              <X className="w-3 h-3" /> Remove
            </button>
          )}
        </div>

        {/* Checklist */}
        <div className="p-4 md:p-5 bg-blue-50 rounded-xl border border-blue-100 mb-5 md:mb-6">
          <h4 className="font-bold text-blue-900 text-sm mb-3 flex items-center gap-2">
            <Check className="w-3 h-3" />
            Submission Status
          </h4>
          <div className="space-y-2.5 text-sm">
            {/* File Status */}
            <div className={`flex items-center ${selectedFile ? 'text-green-700 font-medium' : 'text-gray-500'}`}>
              {selectedFile ? <Check className="w-3 h-3 mr-2" /> : <Circle className="w-2 h-2 mr-2 opacity-50" />}
              <span>Proposal Document</span>
            </div>

            {/* Basic Info Status */}
            <div className={`flex items-center ${(formData.program_title?.trim() && formData.project_title?.trim() && Number.isInteger(formData.year) && formData.duration?.trim() && formData.agency && formData.agencyAddress?.city?.trim() && formData.telephone?.trim() && formData.email?.trim() && formData.tags?.length > 0) ? 'text-green-700 font-medium' : 'text-gray-500'
              }`}>
              {(formData.program_title?.trim() && formData.project_title?.trim() && Number.isInteger(formData.year) && formData.duration?.trim() && formData.agency && formData.agencyAddress?.city?.trim() && formData.telephone?.trim() && formData.email?.trim() && formData.tags?.length > 0) ? <Check className="w-3 h-3 mr-2" /> : <Circle className="w-2 h-2 mr-2 opacity-50" />}
              <span>Basic Information</span>
            </div>

            {/* Research Details Status */}
            <div className={`flex items-center ${(formData.sector && formData.discipline && formData.plannedStartDate && formData.plannedEndDate && formData.classification_type && formData.class_input?.trim() && formData.implementation_site?.length > 0 && formData.priorities_id?.length > 0) ? 'text-green-700 font-medium' : 'text-gray-500'
              }`}>
              {(formData.sector && formData.discipline && formData.plannedStartDate && formData.plannedEndDate && formData.classification_type && formData.class_input?.trim() && formData.implementation_site?.length > 0 && formData.priorities_id?.length > 0) ? <Check className="w-3 h-3 mr-2" /> : <Circle className="w-2 h-2 mr-2 opacity-50" />}
              <span>Research Details</span>
            </div>

            {/* Budget Status */}
            <div className={`flex items-center ${isBudgetValid ? 'text-green-700 font-medium' : 'text-gray-500'}`}>
              {isBudgetValid ? <Check className="w-3 h-3 mr-2" /> : <Circle className="w-2 h-2 mr-2 opacity-50" />}
              <span>Budget Section</span>
            </div>
          </div>
        </div>

        {/* --- Action Buttons (Submit) --- */}
        <div className="mt-auto space-y-3">
          <div className="relative group">
            <button
              onClick={handleInitialSubmit}
              disabled={!isFormValid}
              className={`w-full py-3.5 rounded-xl font-bold transition-all duration-200 flex items-center justify-center gap-2 shadow-lg transform ${!isFormValid
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none'
                : 'bg-[#C8102E] text-white hover:bg-[#9d0d24] hover:shadow-xl hover:scale-[1.02] cursor-pointer'
                }`}
            >
              {!isFormValid ? <Lock className="w-4 h-4" /> : <Send className="w-4 h-4" />}
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
    </>
  );
};

export default UploadSidebar;