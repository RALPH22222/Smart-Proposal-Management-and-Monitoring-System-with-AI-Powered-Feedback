import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  User as UserIcon,
  ChevronDown,
  RefreshCw,
  Trash2,
  Check,
  Search,
  MessageSquare,
  Calendar
} from 'lucide-react';
import Swal from 'sweetalert2';
import { fetchDepartments, fetchUsersByRole, type UserItem } from '../../services/proposal.api';

// --- UPDATED INTERFACE TO INCLUDE HISTORY DETAILS ---
export interface EvaluatorOption {
  id: string;
  name: string;
  department: string;
  status: 'Accepts' | 'Rejected' | 'Pending' | 'Extension Requested' | 'Extension Approved' | 'Extension Rejected' | 'Completed';
  // Merged History Data
  comment?: string;
  extensionDate?: string;
  extensionReason?: string;
}

interface RnDEvaluatorPageModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentEvaluators?: EvaluatorOption[];
  onReassign: (newEvaluators: EvaluatorOption[]) => void;
  // New prop to handle extension logic directly inside this modal
  onExtensionAction?: (evaluatorId: string, action: 'Accept' | 'Reject') => void;
  proposalTitle: string;
  isLoading?: boolean;
}

const RnDEvaluatorPageModal: React.FC<RnDEvaluatorPageModalProps> = ({
  isOpen,
  onClose,
  currentEvaluators = [],
  onReassign,
  onExtensionAction,
  proposalTitle = "Untitled Project",
  isLoading = false,
}) => {
  const [departments, setDepartments] = useState<string[]>([]);
  const [allEvaluators, setAllEvaluators] = useState<UserItem[]>([]);

  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [availableEvaluators, setAvailableEvaluators] = useState<EvaluatorOption[]>([]);
  const [filteredEvaluators, setFilteredEvaluators] = useState<EvaluatorOption[]>([]);

  const [currentList, setCurrentList] = useState<EvaluatorOption[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const [replacingId, setReplacingId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const loadData = async () => {
        try {
          const [deptData, usersData] = await Promise.all([
            fetchDepartments(),
            fetchUsersByRole("evaluator"),
          ]);
          setDepartments(deptData.map((d) => d.name));
          setAllEvaluators(usersData);
        } catch (error) {
          console.error("Failed to load modal data", error);
        }
      };
      loadData();
    }
  }, [isOpen]);

  useEffect(() => {
    if (currentEvaluators.length > 0) {
      setCurrentList(currentEvaluators);
    } else {
      setCurrentList([]);
    }
  }, [currentEvaluators]);

  // Filter Logic
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredEvaluators(availableEvaluators);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = availableEvaluators.filter(evaluator =>
        evaluator.name.toLowerCase().includes(query) ||
        evaluator.department.toLowerCase().includes(query)
      );
      setFilteredEvaluators(filtered);
    }
  }, [availableEvaluators, searchQuery]);

  const handleDepartmentChange = (dept: string) => {
    setSelectedDepartment(dept);
    if (!dept) {
      setAvailableEvaluators([]);
      setFilteredEvaluators([]);
      return;
    }

    // Filter evaluators by the selected department name
    // Note: The API returns UserItem with departments: {id, name}[].
    // We check if the user belongs to the selected department name.
    const filteredByDept = allEvaluators.filter(user =>
      user.departments.some(d => d.name === dept)
    ).map(user => ({
      id: user.id,
      name: `${user.first_name} ${user.last_name}`,
      department: user.departments.find(d => d.name === dept)?.name || dept, // Should exist
      status: 'Pending' as const
    }));

    setAvailableEvaluators(filteredByDept);
    setFilteredEvaluators(filteredByDept);
    setSearchQuery('');
  };

  const handleAddEvaluator = (evaluator: EvaluatorOption) => {
    if (currentList.some(ev => ev.id === evaluator.id)) return;
    const newEvaluator: EvaluatorOption = { ...evaluator, status: 'Pending' };
    setCurrentList(prev => [...prev, newEvaluator]);
  };

  const initiateRemove = async (evaluator: EvaluatorOption) => {
    const result = await Swal.fire({
      title: 'Remove Evaluator?',
      html: `Are you sure you want to remove <strong>${evaluator.name}</strong> from this assignment?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#DC2626',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Yes, Remove',
      cancelButtonText: 'Cancel',
      reverseButtons: true,
    });

    if (result.isConfirmed) {
      setCurrentList(prev => prev.filter(ev => ev.id !== evaluator.id));
      Swal.fire({
        title: 'Removed!',
        text: `${evaluator.name} has been removed from the assignment.`,
        icon: 'success',
        timer: 2000,
        showConfirmButton: false,
      });
    }
  };

  const initiateReplace = (id: string) => {
    setReplacingId(id);
  };

  const cancelReplace = () => {
    setReplacingId(null);
  };

  const confirmReplace = async (originalId: string, newEvaluatorId: string) => {
    if (!newEvaluatorId) return;

    // Find the new evaluator from the FULL list of evaluators
    const newEvaluatorUser = allEvaluators.find(user => user.id === newEvaluatorId);
    const originalEvaluator = currentList.find(ev => ev.id === originalId);

    if (newEvaluatorUser && originalEvaluator) {
      const result = await Swal.fire({
        title: 'Replace Evaluator?',
        html: `Replace <strong>${originalEvaluator.name}</strong> with <strong>${newEvaluatorUser.first_name} ${newEvaluatorUser.last_name}</strong>?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#C8102E',
        cancelButtonColor: '#6B7280',
        confirmButtonText: 'Yes, Replace',
        cancelButtonText: 'Cancel',
        reverseButtons: true,
      });

      if (result.isConfirmed) {
        const newEvaluatorObj: EvaluatorOption = {
          id: newEvaluatorUser.id,
          name: `${newEvaluatorUser.first_name} ${newEvaluatorUser.last_name}`.trim(),
          department: newEvaluatorUser.departments[0]?.name || "Unknown Dept",
          status: 'Pending'
        };

        setCurrentList(prev => prev.map(ev => {
          if (ev.id === originalId) {
            return newEvaluatorObj;
          }
          return ev;
        }));

        Swal.fire({
          title: 'Replaced!',
          text: 'Evaluator has been successfully replaced.',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false,
        });
      }
    }
    setReplacingId(null);
  };

  const handleSaveClick = async () => {
    const result = await Swal.fire({
      title: 'Confirm Assignment',
      html: `
        <p class="mb-3">Are you sure you want to assign the following evaluators to <strong>${proposalTitle}</strong>?</p>
        <div class="bg-gray-50 border border-gray-200 rounded-lg p-3 max-h-40 overflow-y-auto text-left">
          <ul class="space-y-2">
            ${currentList.map(ev => `
              <li class="flex items-center gap-2 text-sm">
                <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                </svg>
                <span class="font-medium">${ev.name}</span>
                <span class="text-xs text-gray-500">(${ev.department})</span>
              </li>
            `).join('')}
          </ul>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#C8102E',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Yes, Assign',
      cancelButtonText: 'Cancel',
      reverseButtons: true,
      customClass: {
        htmlContainer: 'text-left'
      }
    });

    if (result.isConfirmed) {
      onReassign(currentList);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 bg-black/50 bg-opacity-50 flex justify-center items-center z-50 p-4 animate-in fade-in duration-200'>
      <div className='bg-white rounded-lg w-full max-w-5xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]'>

        {/* Header */}
        <div className='bg-gray-100 border-b border-slate-200 text-gray-800 px-6 py-4 flex justify-between items-center'>
          <h3 className='text-lg font-bold'>Evaluator Management & History</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-black hover:bg-gray-200 p-2 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className='p-6 overflow-y-auto flex-1 space-y-6 custom-scrollbar'>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[200px]">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C8102E]"></div>
              <p className="mt-4 text-slate-500 font-medium animate-pulse">Loading evaluator details...</p>
            </div>
          ) : (
            <>
              {/* --- SECTION 1: CURRENT EVALUATORS (MERGED VIEW) --- */}
              <div className='bg-gray-50 p-5 rounded-md border border-gray-200'>
                <h4 className='font-semibold text-gray-800 mb-4 flex items-center gap-2'>
                  Assigned Evaluators
                  <span className="text-xs font-bold text-white bg-[#C10003] px-2 py-0.5 rounded-full shadow-sm">
                    {currentList.length}
                  </span>
                </h4>

                {currentList.length > 0 ? (
                  <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
                    <table className='w-full text-sm'>
                      <thead className='bg-gray-100 border-b border-gray-200'>
                        <tr>
                          <th className='px-4 py-3 text-left text-gray-600 font-semibold w-1/4'>Evaluator Details</th>
                          {/* "Status" header removed, replaced with Feedback/Requests */}
                          <th className='px-4 py-3 text-left text-gray-600 font-semibold w-1/2'>Feedback / Requests</th>
                          <th className='px-4 py-3 text-center text-gray-600 font-semibold w-1/4'>Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {currentList.map((ev) => (
                          <tr key={ev.id} className="hover:bg-gray-50 transition-colors">
                            {/* COL 1: Name & Dept */}
                            <td className='px-4 py-3 align-top'>
                              <div className="font-medium text-gray-800">{ev.name}</div>
                              <div className="text-xs text-gray-500 mt-0.5">{ev.department}</div>
                            </td>

                            {/* COL 2: Merged Status/History/Extension */}
                            <td className='px-4 py-3 align-top'>
                              {ev.status === 'Extension Requested' ? (
                                // --- EXTENSION REQUEST UI (BLUE THEME) ---
                                <div className="bg-blue-50 border border-blue-200 rounded-md p-3 relative">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="bg-blue-600 text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded-sm">
                                      Extension Requested
                                    </span>
                                  </div>
                                  <div className="text-sm text-blue-900 mb-2">
                                    <div className="flex items-start gap-2">
                                      <MessageSquare className="w-3 h-3 mt-1 text-blue-500 shrink-0" />
                                      <span className="italic">"{ev.extensionReason}"</span>
                                    </div>
                                    <div className="flex items-center gap-2 mt-1 ml-5 font-semibold text-xs">
                                      <Calendar className="w-3 h-3 text-blue-500" />
                                      Requested Date: {ev.extensionDate}
                                    </div>
                                  </div>

                                  {/* Extension Actions */}
                                  {onExtensionAction && (
                                    <div className="flex gap-2 mt-3 pt-2 border-t border-blue-200/50">
                                      <button
                                        onClick={() => onExtensionAction(ev.id, 'Accept')}
                                        className="flex items-center gap-1 px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                                      >
                                        <Check className="w-3 h-3" /> Approve
                                      </button>
                                      <button
                                        onClick={() => onExtensionAction(ev.id, 'Reject')}
                                        className="flex items-center gap-1 px-2 py-1 bg-white border border-blue-300 text-blue-700 text-xs rounded hover:bg-blue-50 transition-colors"
                                      >
                                        <X className="w-3 h-3" /> Reject
                                      </button>
                                    </div>
                                  )}
                                </div>
                              ) : ['Accepts', 'Rejected', 'Extension Approved', 'Extension Rejected', 'Completed'].includes(ev.status) ? (
                                // --- DECISION / STATUS UI ---
                                <div>
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border mb-1.5
                                          ${ev.status === 'Accepts' || ev.status === 'Extension Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                      ev.status === 'Completed' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                        'bg-red-50 text-red-700 border-red-200'}`}
                                  >
                                    {ev.status}
                                  </span>
                                  {ev.comment && (
                                    <div className="text-gray-600 text-sm flex items-start gap-2">
                                      <MessageSquare className="w-3 h-3 mt-1 text-gray-400 shrink-0" />
                                      <span>"{ev.comment}"</span>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                // --- PENDING UI ---
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border bg-amber-50 text-amber-700 border-amber-200">
                                  Pending Evaluation
                                </span>
                              )}
                            </td>

                            {/* COL 3: Actions */}
                            <td className='px-4 py-3 align-middle text-center'>
                              {replacingId === ev.id ? (
                                <div className="flex flex-col gap-2 animate-in fade-in duration-200">
                                  <select
                                    className="w-full text-xs border border-gray-300 rounded px-2 py-1.5 focus:ring-1 focus:ring-[#C10003] outline-none"
                                    onChange={(e) => confirmReplace(ev.id, e.target.value)}
                                    defaultValue=""
                                    autoFocus
                                  >
                                    <option value="" disabled>Select Replacement</option>
                                    {allEvaluators
                                      .map(user => ({
                                        id: user.id,
                                        name: `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim(),
                                        department: user.departments[0]?.name || "Unknown"
                                      }))
                                      .filter(c => !currentList.some(curr => curr.id === c.id))
                                      .map(c => (
                                        <option key={c.id} value={c.id}>{c.name} ({c.department})</option>
                                      ))
                                    }
                                  </select>
                                  <button
                                    onClick={cancelReplace}
                                    className="w-full py-1 text-xs border border-gray-300 rounded hover:bg-gray-100 text-gray-600"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    onClick={() => initiateReplace(ev.id)}
                                    className='flex items-center gap-1 px-3 py-1 bg-white border border-blue-200 text-blue-600 hover:bg-blue-50 text-xs rounded-md font-medium transition-colors'
                                  >
                                    <RefreshCw className="w-3 h-3" /> Replace
                                  </button>
                                  <button
                                    onClick={() => initiateRemove(ev)}
                                    className='flex items-center gap-1 px-3 py-1 bg-white border border-red-200 text-red-600 hover:bg-red-50 text-xs rounded-md font-medium transition-colors'
                                  >
                                    <Trash2 className="w-3 h-3" /> Remove
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className='text-gray-500 italic'>No evaluators currently assigned.</p>
                )}
              </div>

              {/* --- SECTION 2: ADD NEW EVALUATORS --- */}
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>Select Department</label>
                <div className="relative">
                  <select
                    value={selectedDepartment}
                    onChange={(e) => handleDepartmentChange(e.target.value)}
                    className='w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-[#C10003] focus:outline-none bg-white appearance-none cursor-pointer'
                  >
                    <option value=''>-- Choose Department --</option>
                    {departments.map((dept) => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {selectedDepartment && (
                <div className='bg-gray-50 p-5 rounded-md border border-gray-200 animate-in slide-in-from-bottom-2 duration-300'>
                  <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4'>
                    <h4 className='font-semibold text-gray-800'>Available Evaluators</h4>
                    <div className='relative w-full sm:w-64'>
                      <input
                        type='text'
                        placeholder='Search evaluators...'
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className='w-full border border-gray-300 rounded-md pl-9 pr-8 py-2 text-sm focus:ring-2 focus:ring-[#C10003] focus:outline-none'
                      />
                      <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery('')}
                          className='absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1'
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  {filteredEvaluators.length === 0 ? (
                    <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
                      <UserIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className='text-gray-500 italic text-sm'>
                        {searchQuery ? 'No evaluators found matching your search.' : 'No evaluators available for this department.'}
                      </p>
                    </div>
                  ) : (
                    <div className='space-y-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar'>
                      {filteredEvaluators.map((evaluator) => {
                        const isAlreadyAssigned = currentList.some(ev => ev.id === evaluator.id);
                        if (isAlreadyAssigned) return null;

                        return (
                          <div
                            key={evaluator.id}
                            onClick={() => handleAddEvaluator(evaluator)}
                            className="group flex items-center space-x-3 p-3 rounded-lg border bg-white border-gray-200 hover:border-[#C10003] hover:shadow-md cursor-pointer transition-all duration-200"
                          >
                            <div className="flex-shrink-0">
                              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-[#C10003]/10 transition-colors">
                                <Plus className="w-5 h-5 text-gray-400 group-hover:text-[#C10003]" />
                              </div>
                            </div>

                            <div className='flex-1'>
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-semibold text-gray-700 group-hover:text-[#C10003]">
                                  {evaluator.name}
                                </span>
                              </div>
                              <span className='text-gray-500 text-xs block mt-0.5'>
                                {evaluator.department}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className='p-4 border-t border-slate-200 bg-gray-50 flex justify-end gap-3'>
          <button
            onClick={onClose}
            className='px-4 py-2 rounded-md bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium transition-colors text-sm'
          >
            Cancel
          </button>
          <button
            onClick={handleSaveClick}
            className='px-4 py-2 rounded-md text-white font-medium bg-[#C10003] hover:bg-[#A00002] shadow-sm transition-colors text-sm'
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default RnDEvaluatorPageModal;