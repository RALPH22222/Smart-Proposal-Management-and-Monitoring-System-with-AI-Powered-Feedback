import React, { useState, useEffect, useMemo } from 'react';
import { X, Users, Search, Clock, MessageSquare, Loader2 } from 'lucide-react';
import { fetchUsersByRole, fetchDepartments, forwardProposalToEvaluators } from '../../services/proposal.api';
import type { UserItem, LookupItem } from '../../services/proposal.api';
import Swal from 'sweetalert2';

interface ForwardToEvaluatorsModalProps {
  isOpen: boolean;
  onClose: () => void;
  proposalId: number;
  onSuccess: () => void;
}

const ForwardToEvaluatorsModal: React.FC<ForwardToEvaluatorsModalProps> = ({
  isOpen,
  onClose,
  proposalId,
  onSuccess,
}) => {
  const [evaluators, setEvaluators] = useState<UserItem[]>([]);
  const [departments, setDepartments] = useState<LookupItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [departmentFilter, setDepartmentFilter] = useState<number | ''>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [deadline, setDeadline] = useState(14);
  const [comments, setComments] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setSelectedIds(new Set());
    setSearchTerm('');
    setDepartmentFilter('');
    setComments('');
    setDeadline(14);
    loadData();
  }, [isOpen]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [evalData, deptData] = await Promise.all([
        fetchUsersByRole('evaluator'),
        fetchDepartments(),
      ]);
      setEvaluators(evalData);
      setDepartments(deptData);
    } catch (err) {
      console.error('Failed to load evaluators:', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    let list = evaluators;
    if (departmentFilter) {
      list = list.filter((e) =>
        e.departments.some((d) => d.id === departmentFilter),
      );
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      list = list.filter(
        (e) =>
          (e.first_name || '').toLowerCase().includes(term) ||
          (e.last_name || '').toLowerCase().includes(term) ||
          (e.email || '').toLowerCase().includes(term),
      );
    }
    return list;
  }, [evaluators, departmentFilter, searchTerm]);

  const toggleEvaluator = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSubmit = async () => {
    if (selectedIds.size === 0) {
      Swal.fire({ icon: 'warning', title: 'No evaluators selected', text: 'Please select at least one evaluator.' });
      return;
    }
    setSubmitting(true);
    try {
      await forwardProposalToEvaluators({
        proposal_id: proposalId,
        evaluator_id: Array.from(selectedIds),
        deadline_at: deadline,
        commentsForEvaluators: comments || undefined,
      });
      Swal.fire({ icon: 'success', title: 'Success', text: 'Proposal forwarded to evaluators.' });
      onSuccess();
      onClose();
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Error', text: err?.response?.data?.message || 'Failed to forward proposal.' });
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const getUserName = (u: UserItem) =>
    `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email || 'Unknown';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b bg-slate-50">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-600" />
            <h2 className="font-bold text-slate-800">Forward to Evaluators</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200 transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
            </div>
          ) : (
            <>
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search evaluators..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value ? Number(e.target.value) : '')}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">All Departments</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              {/* Selected count */}
              {selectedIds.size > 0 && (
                <div className="text-sm text-purple-700 font-medium">
                  {selectedIds.size} evaluator{selectedIds.size > 1 ? 's' : ''} selected
                </div>
              )}

              {/* Evaluator list */}
              <div className="border border-slate-200 rounded-lg max-h-60 overflow-y-auto divide-y divide-slate-100">
                {filtered.length === 0 ? (
                  <div className="text-center py-6 text-sm text-slate-500">No evaluators found.</div>
                ) : (
                  filtered.map((ev) => (
                    <label
                      key={ev.id}
                      className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors ${selectedIds.has(ev.id) ? 'bg-purple-50' : ''
                        }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedIds.has(ev.id)}
                        onChange={() => toggleEvaluator(ev.id)}
                        className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-slate-800 truncate">{getUserName(ev)}</div>
                        <div className="text-xs text-slate-500 truncate">{ev.email}</div>
                      </div>
                      {ev.departments.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {ev.departments.map((d) => (
                            <span key={d.id} className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                              {d.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </label>
                  ))
                )}
              </div>

              {/* Deadline */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1">
                  <Clock className="w-4 h-4" />
                  Evaluation Deadline
                </label>
                <select
                  value={deadline}
                  onChange={(e) => setDeadline(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value={7}>7 days</option>
                  <option value={14}>14 days</option>
                  <option value={21}>21 days</option>
                  <option value={30}>30 days</option>
                </select>
              </div>

              {/* Comments */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1">
                  <MessageSquare className="w-4 h-4" />
                  Comments for Evaluators (optional)
                </label>
                <textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  rows={3}
                  placeholder="Add instructions or notes for evaluators..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                />
              </div>
            </>
          )}
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
            disabled={submitting || selectedIds.size === 0}
            className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Forward to Evaluators
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForwardToEvaluatorsModal;
