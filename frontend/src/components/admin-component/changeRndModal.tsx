import React, { useState, useEffect } from 'react';
import { X, UserCog, User, ArrowRight, AlertCircle, Check, Filter } from 'lucide-react';
import { type Proposal } from '../../types/InterfaceProposal';
// import { type Evaluator } from '../../types/evaluator';
import Swal from 'sweetalert2';

interface ChangeRdStaffModalProps {
  proposal: Proposal | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (proposalId: string, newStaffName: string, newStaffId?: string) => void;
}

const ChangeRndModal: React.FC<ChangeRdStaffModalProps> = ({
  proposal,
  isOpen,
  onClose,
  onConfirm,
}) => {
  // --- STATE ---
  const [rndStaffList, setRndStaffList] = useState<any[]>([]);
  const [allDepartments, setAllDepartments] = useState<any[]>([]); // Full list for filter & lookup
  const [loading, setLoading] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [error, setError] = useState('');

  // Fetch R&D Staff & Departments on Open
  useEffect(() => {
    if (isOpen) {
      setLoading(true);

      import('../../services/proposal.api').then(({ fetchUsersByRole, fetchDepartments }) => {
        Promise.all([
          fetchUsersByRole('rnd'),
          fetchDepartments()
        ])
          .then(([usersData, departmentsData]) => {
            setAllDepartments(departmentsData);

            // Map users to a usable format, resolving department if missing
            const mapped = usersData.map(u => {
              let userDepts = u.departments || [];

              // Fallback: If no departments array but has department_id, look it up
              if (userDepts.length === 0 && u.department_id) {
                const found = departmentsData.find(d => d.id === Number(u.department_id));
                if (found) {
                  userDepts = [{ id: found.id, name: found.name }];
                }
              }

              return {
                id: u.id,
                name: `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email,
                email: u.email,
                profile_picture: u.profile_picture,
                departments: userDepts,
                // Mock stats 
                currentWorkload: 0,
              };
            });
            setRndStaffList(mapped);
          })
          .catch(err => console.error("Failed to fetch data:", err))
          .finally(() => setLoading(false));
      });

      setSelectedStaffId('');
      setError('');
      setSelectedDepartment('');
    }
  }, [isOpen]);

  // Use the full fetched list for filter options (names)
  const departmentNames = allDepartments.map(d => d.name).sort();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaffId) {
      setError('Please select a new R&D staff member.');
      return;
    }

    const selectedStaff = rndStaffList.find(s => s.id === selectedStaffId);
    if (selectedStaff && proposal) {
      Swal.fire({
        title: 'Confirm Reassignment',
        text: `Are you sure you want to reassign this proposal to ${selectedStaff.name}?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, reassign',
        cancelButtonText: 'Cancel'
      }).then((result) => {
        if (result.isConfirmed) {
          onConfirm(proposal.id, selectedStaff.name, selectedStaff.id);
          onClose();
          Swal.fire(
            'Reassigned!',
            `Proposal has been reassigned to ${selectedStaff.name}.`,
            'success'
          );
        }
      });
    }
  };

  if (!isOpen || !proposal) return null;

  // Filter staff based on selected department
  const filteredStaff = rndStaffList.filter(staff => {
    // Check if the current proposal's assigned staff string contains this staff's email
    // usage of email is safer than name matching
    const assignedString = proposal.assignedRdStaff || '';
    const isNotCurrentAssignee = !assignedString.includes(staff.email);

    // Fallback name check if email isn't in the string for some reason
    const isNotCurrentAssigneeByName = !assignedString.includes(staff.name);

    const matchesDepartment = selectedDepartment
      ? staff.departments.some((d: any) => d.name === selectedDepartment)
      : true;

    return (isNotCurrentAssignee && isNotCurrentAssigneeByName) && matchesDepartment;
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100">

        {/* Header */}
        <div className="bg-slate-50 p-4 border-b border-slate-200 flex justify-between items-center">
          <div className="flex items-center gap-2 text-slate-800">
            <div className="bg-blue-100 p-1.5 rounded-lg">
              <UserCog className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="font-bold text-lg">Change Assignment</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 hover:bg-slate-200 p-1 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Context: From -> To */}
              <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200 text-sm">
                <div className="flex flex-col">
                  <span className="text-xs text-slate-500 uppercase font-semibold">Current</span>
                  <span className="font-medium text-slate-700 flex items-center gap-1">
                    <User className="w-3 h-3" /> {proposal.assignedRdStaff || 'Unassigned'}
                  </span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
                <div className="flex flex-col text-right">
                  <span className="text-xs text-slate-500 uppercase font-semibold">New</span>
                  <span className="font-medium text-blue-600">
                    {selectedStaffId
                      ? rndStaffList.find(s => s.id === selectedStaffId)?.name
                      : 'Select...'}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                {/* 1. Department Filter */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Filter by Department
                  </label>
                  <div className="relative">
                    <Filter className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <select
                      value={selectedDepartment}
                      onChange={(e) => {
                        setSelectedDepartment(e.target.value);
                        setSelectedStaffId(''); // Reset selection
                      }}
                      className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white appearance-none"
                    >
                      <option value="">-- All Departments --</option>
                      {departmentNames.map((dept) => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 2. Staff Selection List */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Select R&D Staff
                  </label>

                  <div className="border border-slate-300 rounded-lg max-h-60 overflow-y-auto bg-white">
                    {filteredStaff.length === 0 ? (
                      <div className="p-4 text-sm text-slate-500 text-center">
                        No staff found matching criteria
                      </div>
                    ) : (
                      filteredStaff.map((staff) => (
                        <div
                          key={staff.id}
                          onClick={() => {
                            setSelectedStaffId(staff.id);
                            setError('');
                          }}
                          className={`flex items-center gap-3 p-3 cursor-pointer transition-colors border-b last:border-b-0 border-slate-100 ${selectedStaffId === staff.id
                            ? 'bg-blue-50 border-l-4 border-l-blue-600'
                            : 'hover:bg-slate-50 border-l-4 border-l-transparent'
                            }`}
                        >
                          {/* Profile Picture */}
                          <div className="relative shrink-0">
                            {staff.profile_picture ? (
                              <img
                                src={staff.profile_picture}
                                alt={staff.name}
                                className="w-10 h-10 rounded-full object-cover border border-slate-200"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500">
                                <User className="w-5 h-5" />
                              </div>
                            )}
                            {selectedStaffId === staff.id && (
                              <div className="absolute -right-1 -bottom-1 bg-blue-600 text-white rounded-full p-0.5">
                                <Check className="w-3 h-3" />
                              </div>
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-semibold truncate ${selectedStaffId === staff.id ? 'text-blue-900' : 'text-slate-800'}`}>
                              {staff.name}
                            </p>
                            <p className="text-xs text-slate-500 truncate">
                              {staff.email}
                            </p>
                            {staff.departments.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {staff.departments.map((d: any) => (
                                  <span key={d.id} className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                                    {d.name}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="flex items-center gap-2 text-red-600 text-xs bg-red-50 p-2 rounded-lg border border-red-100">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Confirm Change
                </button>
              </div>

            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChangeRndModal;