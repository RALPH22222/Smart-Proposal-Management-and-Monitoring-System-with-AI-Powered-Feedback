// Phase 3 of LIB feature: R&D / admin review modal for budget realignment requests.
//
// Renders the GitHub-style BudgetDiffView between the current baseline and the proposed items,
// shows the proponent's reason + uploaded LIB document download, and offers the three
// decision actions (Approve / Request Revision / Reject).
//
// Used from the new "Realignments" tab on RnDFundingPage. Self-contained — fetches the full
// realignment record (with both versions inlined) on open.

import React, { useEffect, useMemo, useState } from 'react';
import { X, Loader2, AlertTriangle, CheckCircle2, MessageSquareWarning, Download, FileText, Calendar } from 'lucide-react';
import {
  fetchRealignment,
  reviewBudgetRealignment,
  type RealignmentRecord,
} from '../../services/ProjectMonitoringApi';
import BudgetDiffView from './BudgetDiffView';
import { openSignedUrl } from '../../utils/signed-url';
import { formatDate } from '../../utils/date-formatter';

interface RealignmentReviewModalProps {
  realignmentId: number;
  onClose: () => void;
  onReviewed?: () => void;
}

const STATUS_BADGE: Record<string, string> = {
  pending_review: 'bg-amber-100 text-amber-700',
  revision_requested: 'bg-blue-100 text-blue-700',
  approved: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-red-100 text-red-700',
};

export const RealignmentReviewModal: React.FC<RealignmentReviewModalProps> = ({
  realignmentId,
  onClose,
  onReviewed,
}) => {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [record, setRecord] = useState<RealignmentRecord | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [submitting, setSubmitting] = useState<null | 'approve' | 'reject' | 'request_revision'>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    fetchRealignment(realignmentId)
      .then((data) => {
        if (!cancelled) setRecord(data);
      })
      .catch((err: any) => {
        if (cancelled) return;
        const msg = err?.response?.data?.message || err?.message || 'Failed to load realignment.';
        setLoadError(msg);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [realignmentId]);

  const isPending = record?.status === 'pending_review' || record?.status === 'revision_requested';

  const requesterName = useMemo(() => {
    const r = record?.requester;
    if (!r) return 'Unknown proponent';
    return [r.first_name, r.last_name].filter(Boolean).join(' ') || r.email || 'Unknown proponent';
  }, [record]);

  const projectTitle = record?.funded_project?.proposals?.project_title ?? 'Untitled project';

  const handleAction = async (action: 'approve' | 'reject' | 'request_revision') => {
    if (!record) return;
    setSubmitError(null);

    if ((action === 'reject' || action === 'request_revision') && reviewNote.trim().length === 0) {
      setSubmitError('A review note is required for reject and request-revision actions.');
      return;
    }

    setSubmitting(action);
    try {
      await reviewBudgetRealignment({
        realignmentId: record.id,
        action,
        reviewNote: reviewNote.trim() || null,
      });
      onReviewed?.();
      onClose();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to record decision.';
      setSubmitError(msg);
    } finally {
      setSubmitting(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl flex flex-col max-h-[94vh]">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-[#C8102E] to-[#E03A52] text-white">
          <div className="min-w-0">
            <h3 className="font-bold text-lg truncate">Budget Realignment Review</h3>
            <p className="text-xs text-white/80 truncate">{projectTitle}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {loading && (
            <div className="flex items-center justify-center py-10 text-gray-500">
              <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading realignment...
            </div>
          )}

          {loadError && !loading && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" /> {loadError}
            </div>
          )}

          {record && !loading && (
            <>
              {/* Header info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Requested by</p>
                  <p className="font-semibold text-slate-800 mt-1 truncate">{requesterName}</p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Submitted
                  </p>
                  <p className="font-semibold text-slate-800 mt-1">{formatDate(record.created_at)}</p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Status</p>
                  <p className="mt-1">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${STATUS_BADGE[record.status] ?? 'bg-slate-100 text-slate-600'}`}
                    >
                      {record.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </p>
                </div>
              </div>

              {/* Reason + file */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-1">Reason</p>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">{record.reason}</p>
                </div>
                {record.file_url && (
                  <button
                    onClick={() => openSignedUrl(record.file_url!)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#C8102E] hover:underline"
                  >
                    <Download className="w-3 h-3" /> Download revised LIB document
                  </button>
                )}
                {!record.file_url && (
                  <p className="text-xs text-slate-400 italic flex items-center gap-1">
                    <FileText className="w-3 h-3" /> No supporting document attached
                  </p>
                )}
              </div>

              {/* Diff view */}
              <BudgetDiffView
                fromVersion={(record.from_version ?? { items: [], grand_total: 0 }) as any}
                toVersion={record.to_version ?? null}
                proposedItems={record.to_version ? null : (record.proposed_payload?.items ?? null)}
                proposedGrandTotal={record.to_version ? null : (record.proposed_payload?.grand_total ?? null)}
              />

              {/* Existing review note (if revision was previously requested) */}
              {record.review_note && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs">
                  <p className="font-bold text-blue-800 mb-1">Previous review note</p>
                  <p className="text-blue-700 whitespace-pre-wrap">{record.review_note}</p>
                </div>
              )}

              {/* Decision form (only for non-terminal) */}
              {isPending && (
                <div className="border border-gray-200 rounded-lg p-3 space-y-2 bg-white">
                  <label className="block text-xs font-bold uppercase tracking-wide text-gray-600">
                    Review note <span className="text-gray-400">(required for reject / revise)</span>
                  </label>
                  <textarea
                    value={reviewNote}
                    onChange={(e) => setReviewNote(e.target.value)}
                    rows={3}
                    maxLength={2000}
                    placeholder="Notes for the proponent..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#C8102E] outline-none resize-none"
                  />
                  {submitError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-2 text-xs flex items-start gap-2">
                      <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" /> {submitError}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {record && isPending && (
          <div className="border-t border-gray-100 bg-gray-50 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-end gap-2">
            <button
              onClick={() => handleAction('reject')}
              disabled={submitting !== null}
              className="px-4 py-2 bg-white border border-red-300 text-red-700 hover:bg-red-50 rounded-lg text-sm font-medium disabled:opacity-40 flex items-center gap-2"
            >
              {submitting === 'reject' ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />} Reject
            </button>
            <button
              onClick={() => handleAction('request_revision')}
              disabled={submitting !== null}
              className="px-4 py-2 bg-white border border-blue-300 text-blue-700 hover:bg-blue-50 rounded-lg text-sm font-medium disabled:opacity-40 flex items-center gap-2"
            >
              {submitting === 'request_revision' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <MessageSquareWarning className="w-4 h-4" />
              )}{' '}
              Request revision
            </button>
            <button
              onClick={() => handleAction('approve')}
              disabled={submitting !== null}
              className="px-5 py-2 bg-[#C8102E] text-white hover:bg-[#a00d25] rounded-lg text-sm font-medium disabled:opacity-40 flex items-center gap-2"
            >
              {submitting === 'approve' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}{' '}
              Approve
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RealignmentReviewModal;
