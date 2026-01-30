import React, { useState, useEffect } from 'react';
import { X, XCircle, Loader2 } from 'lucide-react';
import { rejectProposal } from '../../services/proposal.api';
import Swal from 'sweetalert2';

interface RejectModalProps {
  isOpen: boolean;
  onClose: () => void;
  proposalId: number;
  onSuccess: () => void;
}

const RejectModal: React.FC<RejectModalProps> = ({
  isOpen,
  onClose,
  proposalId,
  onSuccess,
}) => {
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setComment('');
  }, [isOpen]);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await rejectProposal({
        proposal_id: proposalId,
        comment: comment || undefined,
      });
      Swal.fire({ icon: 'success', title: 'Proposal Rejected', text: 'The proposal has been rejected.' });
      onSuccess();
      onClose();
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Error', text: err?.response?.data?.message || 'Failed to reject proposal.' });
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b bg-slate-50">
          <div className="flex items-center gap-2">
            <XCircle className="w-5 h-5 text-red-600" />
            <h2 className="font-bold text-slate-800">Reject Proposal</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200 transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">
              This action is final. The proposal will be permanently rejected.
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 mb-1 block">
              Rejection Comment (optional)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              placeholder="Provide a reason for rejection..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-slate-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Reject Proposal
          </button>
        </div>
      </div>
    </div>
  );
};

export default RejectModal;
