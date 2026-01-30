import React, { useState, useEffect } from 'react';
import { X, Users, Loader2 } from 'lucide-react';
import { fetchUsersByRole, fetchDepartments, forwardProposalToRnd } from '../../services/proposal.api';
import type { UserItem, LookupItem } from '../../services/proposal.api';
import Swal from 'sweetalert2';

interface SendToRndModalProps {
  isOpen: boolean;
  onClose: () => void;
  proposalId: number;
  onSuccess: () => void;
}

const SendToRndModal: React.FC<SendToRndModalProps> = ({
  isOpen,
  onClose,
  proposalId,
  onSuccess,
}) => {
  const [departments, setDepartments] = useState<LookupItem[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<number | ''>('');
  const [rndStaff, setRndStaff] = useState<UserItem[]>([]);
  const [selectedRndId, setSelectedRndId] = useState<string>('');
  const [loadingDepts, setLoadingDepts] = useState(false);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setSelectedDepartment('');
    setRndStaff([]);
    setSelectedRndId('');
    loadDepartments();
  }, [isOpen]);

  useEffect(() => {
    if (!selectedDepartment) {
      setRndStaff([]);
      setSelectedRndId('');
      return;
    }
    loadRndStaff(selectedDepartment);
  }, [selectedDepartment]);

  const loadDepartments = async () => {
    setLoadingDepts(true);
    try {
      const data = await fetchDepartments();
      setDepartments(data);
    } catch (err) {
      console.error('Failed to load departments:', err);
    } finally {
      setLoadingDepts(false);
    }
  };

  const loadRndStaff = async (deptId: number) => {
    setLoadingStaff(true);
    setSelectedRndId('');
    try {
      const data = await fetchUsersByRole('rnd', deptId);
      setRndStaff(data);
    } catch (err) {
      console.error('Failed to load RND staff:', err);
    } finally {
      setLoadingStaff(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedRndId) {
      Swal.fire({ icon: 'warning', title: 'No R&D staff selected', text: 'Please select an R&D staff member.' });
      return;
    }
    setSubmitting(true);
    try {
      await forwardProposalToRnd(proposalId, [selectedRndId]);
      Swal.fire({ icon: 'success', title: 'Success', text: 'Proposal assigned to R&D staff.' });
      onSuccess();
      onClose();
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Error', text: err?.response?.data?.message || 'Failed to assign proposal.' });
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const getUserName = (u: UserItem) =>
    `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email || 'Unknown';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b bg-slate-50">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <h2 className="font-bold text-slate-800">Send to R&D Staff</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200 transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Step 1: Department */}
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1 block">
              Step 1: Select Department
            </label>
            {loadingDepts ? (
              <div className="flex items-center gap-2 py-2 text-sm text-slate-500">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading departments...
              </div>
            ) : (
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Select a department --</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            )}
          </div>

          {/* Step 2: RND Staff */}
          {selectedDepartment && (
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">
                Step 2: Select R&D Staff
              </label>
              {loadingStaff ? (
                <div className="flex items-center gap-2 py-2 text-sm text-slate-500">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading R&D staff...
                </div>
              ) : rndStaff.length === 0 ? (
                <div className="text-sm text-slate-500 py-2">
                  No R&D staff found for this department.
                </div>
              ) : (
                <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 max-h-48 overflow-y-auto">
                  {rndStaff.map((staff) => (
                    <label
                      key={staff.id}
                      className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors ${
                        selectedRndId === staff.id ? 'bg-blue-50' : ''
                      }`}
                    >
                      <input
                        type="radio"
                        name="rnd_staff"
                        checked={selectedRndId === staff.id}
                        onChange={() => setSelectedRndId(staff.id)}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-slate-800">{getUserName(staff)}</div>
                        <div className="text-xs text-slate-500">{staff.email}</div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
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
            disabled={submitting || !selectedRndId}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Assign to R&D
          </button>
        </div>
      </div>
    </div>
  );
};

export default SendToRndModal;
