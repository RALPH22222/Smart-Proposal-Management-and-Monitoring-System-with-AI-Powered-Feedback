import React, { useEffect, useState } from 'react';
import { X, CheckCircle, AlertTriangle, AlertCircle } from 'lucide-react';
import Swal from 'sweetalert2';

export type FundingDecision = 'Approve' | 'Revise' | 'Reject';

export interface FundingActionSubmitData {
  decision: FundingDecision;
}

interface FundingActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: FundingActionSubmitData) => Promise<boolean>;
  proposalTitle: string;
}

const FundingActionModal: React.FC<FundingActionModalProps> = ({ isOpen, onClose, onSubmit, proposalTitle }) => {
  const [decision, setDecision] = useState<FundingDecision | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setDecision(null);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!decision) {
      Swal.fire({ icon: 'warning', title: 'Action Required', text: 'Please select a decision.' });
      return;
    }

    let shouldClose = false;
    setIsSubmitting(true);
    try {
      shouldClose = await onSubmit({ decision });
      if (shouldClose) onClose();
    } catch (error: any) {
      Swal.fire({ icon: 'error', title: 'Submission Failed', text: error?.response?.data?.message || 'Something went wrong.' });
    } finally {
      if (!shouldClose) setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-slate-100 flex-shrink-0 flex justify-between items-start bg-slate-50/50">
          <div>
            <h3 className="text-xl font-bold text-slate-800">Funding Decision</h3>
            <p className="text-sm text-slate-500 mt-1 font-medium">{proposalTitle}</p>
          </div>
          <button onClick={onClose} disabled={isSubmitting} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <form id="funding-action-form" onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-3">
                Action to take <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setDecision('Approve')}
                  className={`relative p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${decision === 'Approve' ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm' : 'border-slate-200 hover:border-emerald-200 hover:bg-emerald-50/30 text-slate-500'}`}
                >
                  <CheckCircle className="w-6 h-6 mb-1" />
                  <span className="font-bold text-sm">Approve</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDecision('Revise')}
                  className={`relative p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${decision === 'Revise' ? 'border-amber-500 bg-amber-50 text-amber-700 shadow-sm' : 'border-slate-200 hover:border-amber-200 hover:bg-amber-50/30 text-slate-500'}`}
                >
                  <AlertTriangle className="w-6 h-6 mb-1" />
                  <span className="font-bold text-sm">Revise</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDecision('Reject')}
                  className={`relative p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${decision === 'Reject' ? 'border-red-500 bg-red-50 text-red-700 shadow-sm' : 'border-slate-200 hover:border-red-200 hover:bg-red-50/30 text-slate-500'}`}
                >
                  <AlertCircle className="w-6 h-6 mb-1" />
                  <span className="font-bold text-sm">Reject</span>
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              Funding decisions update the proposal status only. No reviewer files are attached or shown to the proponent in this flow.
            </div>
          </form>
        </div>

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
            className={`px-6 py-2.5 text-sm font-bold text-white rounded-xl transition-all shadow-md ${!decision ? 'bg-slate-300 cursor-not-allowed' :
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
