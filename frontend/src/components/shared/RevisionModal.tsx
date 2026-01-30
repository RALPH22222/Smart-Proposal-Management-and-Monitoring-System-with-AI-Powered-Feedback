import React, { useState, useEffect } from 'react';
import { X, RefreshCw, Clock, Loader2 } from 'lucide-react';
import { requestRevision } from '../../services/proposal.api';
import Swal from 'sweetalert2';

interface RevisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  proposalId: number;
  onSuccess: () => void;
}

const tabs = [
  { key: 'objective', label: 'Objectives' },
  { key: 'methodology', label: 'Methodology' },
  { key: 'budget', label: 'Budget' },
  { key: 'timeline', label: 'Timeline' },
  { key: 'overall', label: 'Overall' },
] as const;

type TabKey = (typeof tabs)[number]['key'];

const RevisionModal: React.FC<RevisionModalProps> = ({
  isOpen,
  onClose,
  proposalId,
  onSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<TabKey>('objective');
  const [comments, setComments] = useState<Record<TabKey, string>>({
    objective: '',
    methodology: '',
    budget: '',
    timeline: '',
    overall: '',
  });
  const [deadline, setDeadline] = useState(14);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setActiveTab('objective');
    setComments({ objective: '', methodology: '', budget: '', timeline: '', overall: '' });
    setDeadline(14);
  }, [isOpen]);

  const handleCommentChange = (tab: TabKey, value: string) => {
    setComments((prev) => ({ ...prev, [tab]: value }));
  };

  const hasAnyComment = Object.values(comments).some((c) => c.trim().length > 0);

  const handleSubmit = async () => {
    if (!hasAnyComment) {
      Swal.fire({ icon: 'warning', title: 'No comments', text: 'Please provide at least one revision comment.' });
      return;
    }
    setSubmitting(true);
    try {
      await requestRevision({
        proposal_id: proposalId,
        objective_comment: comments.objective || undefined,
        methodology_comment: comments.methodology || undefined,
        budget_comment: comments.budget || undefined,
        timeline_comment: comments.timeline || undefined,
        overall_comment: comments.overall || undefined,
        deadline,
      });
      Swal.fire({ icon: 'success', title: 'Success', text: 'Revision request sent to proponent.' });
      onSuccess();
      onClose();
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Error', text: err?.response?.data?.message || 'Failed to request revision.' });
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b bg-slate-50">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-orange-600" />
            <h2 className="font-bold text-slate-800">Request Revision</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200 transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {/* Tabs */}
          <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  activeTab === tab.key
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab.label}
                {comments[tab.key].trim() && (
                  <span className="ml-1 w-1.5 h-1.5 rounded-full bg-orange-500 inline-block" />
                )}
              </button>
            ))}
          </div>

          {/* Active tab textarea */}
          <textarea
            value={comments[activeTab]}
            onChange={(e) => handleCommentChange(activeTab, e.target.value)}
            rows={5}
            placeholder={`Add revision comments for ${tabs.find((t) => t.key === activeTab)?.label}...`}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
          />

          {/* Deadline */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1">
              <Clock className="w-4 h-4" />
              Revision Deadline
            </label>
            <select
              value={deadline}
              onChange={(e) => setDeadline(Number(e.target.value))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value={7}>7 days</option>
              <option value={14}>14 days</option>
              <option value={21}>21 days</option>
              <option value={30}>30 days</option>
            </select>
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
            disabled={submitting || !hasAnyComment}
            className="px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Request Revision
          </button>
        </div>
      </div>
    </div>
  );
};

export default RevisionModal;
