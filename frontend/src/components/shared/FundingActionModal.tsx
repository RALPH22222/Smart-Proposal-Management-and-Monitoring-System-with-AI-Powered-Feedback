import React, { useState, useRef } from 'react';
import { X, Upload, CheckCircle, AlertTriangle, AlertCircle } from 'lucide-react';
import Swal from 'sweetalert2';

export type FundingDecision = 'Approve' | 'Revise' | 'Reject';

export interface FundingActionSubmitData {
  decision: FundingDecision;
  file?: File;
}

interface FundingActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: FundingActionSubmitData) => Promise<void>;
  proposalTitle: string;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const UPLOAD_CONFIG: Record<FundingDecision, { label: string; border: string; bg: string; hover: string; text: string; icon: string }> = {
  Approve: {
    label: 'Upload Funding Document',
    border: 'border-emerald-300',
    bg: 'bg-emerald-50/50',
    hover: 'hover:bg-emerald-50',
    text: 'text-emerald-800',
    icon: 'text-emerald-500',
  },
  Revise: {
    label: 'Upload Revision Document (optional)',
    border: 'border-amber-300',
    bg: 'bg-amber-50/50',
    hover: 'hover:bg-amber-50',
    text: 'text-amber-800',
    icon: 'text-amber-500',
  },
  Reject: {
    label: 'Upload Rejection Document (optional)',
    border: 'border-red-300',
    bg: 'bg-red-50/50',
    hover: 'hover:bg-red-50',
    text: 'text-red-800',
    icon: 'text-red-500',
  },
};

function validateFile(file: File): boolean {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    Swal.fire({
      icon: 'error',
      title: 'Invalid File Type',
      text: 'Only PDF, DOC, and DOCX files are allowed.',
    });
    return false;
  }
  if (file.size > MAX_FILE_SIZE) {
    Swal.fire({
      icon: 'error',
      title: 'File Too Large',
      text: 'File size must not exceed 10MB.',
    });
    return false;
  }
  return true;
}

const FundingActionModal: React.FC<FundingActionModalProps> = ({ isOpen, onClose, onSubmit, proposalTitle }) => {
  const [decision, setDecision] = useState<FundingDecision | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = e.target.files[0];
      if (validateFile(selected)) {
        setFile(selected);
      } else {
        e.target.value = '';
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const dropped = e.dataTransfer.files[0];
      if (validateFile(dropped)) {
        setFile(dropped);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!decision) {
      Swal.fire({ icon: 'warning', title: 'Action Required', text: 'Please select a decision.' });
      return;
    }
    // File is required only for Approve
    if (decision === 'Approve' && !file) {
      Swal.fire({ icon: 'warning', title: 'File Required', text: 'Please upload a funding document to approve.' });
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({ decision, file: file || undefined });
      onClose();
    } catch (error: any) {
      Swal.fire({ icon: 'error', title: 'Submission Failed', text: error?.response?.data?.message || 'Something went wrong.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const uploadConfig = decision ? UPLOAD_CONFIG[decision] : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">

        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex-shrink-0 flex justify-between items-start bg-slate-50/50">
          <div>
            <h3 className="text-xl font-bold text-slate-800">Funding Decision</h3>
            <p className="text-sm text-slate-500 mt-1 font-medium">{proposalTitle}</p>
          </div>
          <button onClick={onClose} disabled={isSubmitting} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <form id="funding-action-form" onSubmit={handleSubmit} className="space-y-6">

            {/* Decision Selection */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-3">
                Action to take <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => { setDecision('Approve'); setFile(null); }}
                  className={`relative p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${decision === 'Approve' ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm' : 'border-slate-200 hover:border-emerald-200 hover:bg-emerald-50/30 text-slate-500'}`}
                >
                  <CheckCircle className="w-6 h-6 mb-1" />
                  <span className="font-bold text-sm">Submit</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setDecision('Revise'); setFile(null); }}
                  className={`relative p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${decision === 'Revise' ? 'border-amber-500 bg-amber-50 text-amber-700 shadow-sm' : 'border-slate-200 hover:border-amber-200 hover:bg-amber-50/30 text-slate-500'}`}
                >
                  <AlertTriangle className="w-6 h-6 mb-1" />
                  <span className="font-bold text-sm">Revise</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setDecision('Reject'); setFile(null); }}
                  className={`relative p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${decision === 'Reject' ? 'border-red-500 bg-red-50 text-red-700 shadow-sm' : 'border-slate-200 hover:border-red-200 hover:bg-red-50/30 text-slate-500'}`}
                >
                  <AlertCircle className="w-6 h-6 mb-1" />
                  <span className="font-bold text-sm">Reject</span>
                </button>
              </div>
            </div>

            {/* File Upload — shown for all decisions */}
            {decision && uploadConfig && (
              <div className="animate-in fade-in slide-in-from-top-2">
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  {uploadConfig.label} {decision === 'Approve' && <span className="text-red-500">*</span>}
                </label>
                <div
                  className={`border-2 border-dashed ${uploadConfig.border} ${uploadConfig.bg} rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer ${uploadConfig.hover} transition-colors`}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                >
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".pdf,.doc,.docx" />
                  <Upload className={`w-8 h-8 ${uploadConfig.icon} mb-3`} />
                  {file ? (
                    <div className={`text-sm font-medium ${uploadConfig.text} break-all`}>{file.name}</div>
                  ) : (
                    <>
                      <p className={`text-sm font-medium ${uploadConfig.text} mb-1`}>Click to upload or drag and drop</p>
                      <p className={`text-xs ${uploadConfig.icon} opacity-70`}>PDF, DOC, DOCX up to 10MB</p>
                    </>
                  )}
                </div>
              </div>
            )}

          </form>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            form="funding-action-form"
            type="submit"
            disabled={!decision || isSubmitting}
            className={`px-6 py-2.5 text-sm font-bold text-white rounded-xl transition-all shadow-md ${
              !decision ? 'bg-slate-300 cursor-not-allowed' :
              decision === 'Approve' ? 'bg-emerald-600 hover:bg-emerald-700 hover:shadow-lg' :
              decision === 'Revise' ? 'bg-amber-600 hover:bg-amber-700 hover:shadow-lg' :
              'bg-red-600 hover:bg-red-700 hover:shadow-lg'
            }`}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Processing...
              </span>
            ) : (
              'Confirm Action'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FundingActionModal;
