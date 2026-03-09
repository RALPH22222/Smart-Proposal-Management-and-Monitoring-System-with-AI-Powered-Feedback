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
  Calendar,
  Users,
  NotebookPen,
} from 'lucide-react';
import Swal from 'sweetalert2';
import { fetchDepartments, fetchUsersByRole, type UserItem } from '../../services/proposal.api';
import PageLoader from '../shared/PageLoader';

// --- UPDATED INTERFACE TO INCLUDE HISTORY DETAILS ---
export interface EvaluatorOption {
  id: string;
  name: string;
  department: string;
  status: 'Accepts' | 'Rejected' | 'Pending' | 'Extension Requested' | 'Extension Approved' | 'Extension Rejected' | 'Completed';
  comment?: string;
  extensionDate?: string;
  extensionReason?: string;
}

interface RnDEvaluatorPageModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentEvaluators?: EvaluatorOption[];
  onReassign: (newEvaluators: EvaluatorOption[]) => void;
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
  const [isInternalLoading, setIsInternalLoading] = useState(true);

  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [availableEvaluators, setAvailableEvaluators] = useState<EvaluatorOption[]>([]);
  const [filteredEvaluators, setFilteredEvaluators] = useState<EvaluatorOption[]>([]);

  const [currentList, setCurrentList] = useState<EvaluatorOption[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [replacingId, setReplacingId] = useState<string | null>(null);

  // Department search
  const [deptSearch, setDeptSearch] = useState('');
  const [deptDropdownOpen, setDeptDropdownOpen] = useState(false);
  const filteredDepartments = departments.filter(d =>
    d.toLowerCase().includes(deptSearch.toLowerCase())
  );

  // Replace search
  const [replaceSearch, setReplaceSearch] = useState('');
  const replaceCandidates = allEvaluators
    .map(user => ({ id: user.id, name: `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim(), department: user.departments[0]?.name || 'Unknown' }))
    .filter(c => !currentList.some(curr => curr.id === c.id))
    .filter(c => c.name.toLowerCase().includes(replaceSearch.toLowerCase()) || c.department.toLowerCase().includes(replaceSearch.toLowerCase()));

  useEffect(() => {
    if (isOpen) {
      const loadData = async () => {
        setIsInternalLoading(true);
        try {
          const [deptData, usersData] = await Promise.all([
            fetchDepartments(),
            fetchUsersByRole("evaluator"),
          ]);
          setDepartments(deptData.map((d) => d.name));
          setAllEvaluators(usersData);
        } catch (error) {
          console.error("Failed to load modal data", error);
        } finally {
          setIsInternalLoading(false);
        }
      };
      loadData();
    }
  }, [isOpen]);

  useEffect(() => {
    setCurrentList(currentEvaluators.length > 0 ? currentEvaluators : []);
  }, [currentEvaluators]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredEvaluators(availableEvaluators);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredEvaluators(availableEvaluators.filter(e =>
        e.name.toLowerCase().includes(query) || e.department.toLowerCase().includes(query)
      ));
    }
  }, [availableEvaluators, searchQuery]);

  const handleDepartmentChange = (dept: string) => {
    setSelectedDepartment(dept);
    if (!dept) { setAvailableEvaluators([]); setFilteredEvaluators([]); return; }
    const filtered = allEvaluators
      .filter(user => user.departments.some(d => d.name === dept))
      .map(user => ({
        id: user.id,
        name: `${user.first_name} ${user.last_name}`,
        department: user.departments.find(d => d.name === dept)?.name || dept,
        status: 'Pending' as const
      }));
    setAvailableEvaluators(filtered);
    setFilteredEvaluators(filtered);
    setSearchQuery('');
  };

  const handleAddEvaluator = (evaluator: EvaluatorOption) => {
    if (currentList.some(ev => ev.id === evaluator.id)) return;
    setCurrentList(prev => [...prev, { ...evaluator, status: 'Pending' }]);
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
      Swal.fire({ title: 'Removed!', text: `${evaluator.name} has been removed.`, icon: 'success', timer: 2000, showConfirmButton: false });
    }
  };

  const initiateReplace = (id: string) => { setReplacingId(id); setReplaceSearch(''); };
  const cancelReplace = () => { setReplacingId(null); setReplaceSearch(''); };

  const confirmReplace = async (originalId: string, newEvaluatorId: string) => {
    if (!newEvaluatorId) return;
    const newEvaluatorUser = allEvaluators.find(user => user.id === newEvaluatorId);
    const originalEvaluator = currentList.find(ev => ev.id === originalId);
    if (newEvaluatorUser && originalEvaluator) {
      const result = await Swal.fire({
        title: 'Replace Evaluator?',
        html: `Replace <strong>${originalEvaluator.name}</strong> with <strong>${newEvaluatorUser.first_name} ${newEvaluatorUser.last_name}</strong>?`,
        icon: 'question', showCancelButton: true,
        confirmButtonColor: '#C8102E', cancelButtonColor: '#6B7280',
        confirmButtonText: 'Yes, Replace', cancelButtonText: 'Cancel', reverseButtons: true,
      });
      if (result.isConfirmed) {
        setCurrentList(prev => prev.map(ev => ev.id === originalId ? {
          id: newEvaluatorUser.id,
          name: `${newEvaluatorUser.first_name} ${newEvaluatorUser.last_name}`.trim(),
          department: newEvaluatorUser.departments[0]?.name || "Unknown Dept",
          status: 'Pending'
        } : ev));
        Swal.fire({ title: 'Replaced!', text: 'Evaluator successfully replaced.', icon: 'success', timer: 2000, showConfirmButton: false });
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
      icon: 'question', showCancelButton: true,
      confirmButtonColor: '#C8102E', cancelButtonColor: '#6B7280',
      confirmButtonText: 'Yes, Assign', cancelButtonText: 'Cancel', reverseButtons: true,
      customClass: { htmlContainer: 'text-left' }
    });
    if (result.isConfirmed) onReassign(currentList);
  };

  if (!isOpen) return null;

  const getStatusStyle = (status: EvaluatorOption['status']) => {
    switch (status) {
      case 'Accepts': case 'Extension Approved': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Completed': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Rejected': case 'Extension Rejected': return 'bg-red-50 text-red-700 border-red-200';
      case 'Extension Requested': return 'bg-blue-50 text-blue-700 border-blue-200';
      default: return 'bg-amber-50 text-amber-700 border-amber-200';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-5xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">

        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-100 bg-white gap-4">
          <div className="flex items-start gap-2 flex-1 min-w-0">
            <div className="p-2 rounded-lg flex-shrink-0 mt-0.5">
              <NotebookPen className="w-7 h-7 text-[#C8102E]" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xl font-bold text-gray-900 leading-tight">Evaluator Assignment Status</h2>
              <p className="text-sm text-slate-500 mt-1 leading-snug line-clamp-2">{proposalTitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-6">
          <>
            {/* Section 1: Current Evaluators */}
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-6">
              <h3 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-3 mb-4 flex items-center gap-2">
                <Users className="w-4 h-4 text-[#C8102E]" />
                Assigned Evaluators
                <span className="text-xs font-bold text-white bg-[#C8102E] px-2 py-0.5 rounded-full">
                  {currentList.length}
                </span>
              </h3>

              {isLoading || isInternalLoading ? (
                <div className="min-h-[220px] rounded-xl bg-white border border-slate-200 flex items-center justify-center">
                  <PageLoader text="Loading evaluator data..." className="w-full h-full bg-transparent" />
                </div>
              ) : currentList.length > 0 ? (
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="px-4 py-3 text-left text-slate-600 font-semibold text-xs uppercase tracking-wider w-1/4">Evaluator</th>
                          <th className="px-4 py-3 text-left text-slate-600 font-semibold text-xs uppercase tracking-wider w-1/2">Feedback / Status</th>
                          <th className="px-4 py-3 text-center text-slate-600 font-semibold text-xs uppercase tracking-wider w-1/4">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {currentList.map((ev) => (
                          <tr key={ev.id} className="hover:bg-slate-50 transition-colors">
                            {/* Name & Department */}
                            <td className="px-4 py-3 align-top">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                                  <UserIcon className="w-4 h-4 text-purple-600" />
                                </div>
                                <div>
                                  <div className="font-semibold text-slate-800 text-sm">{ev.name}</div>
                                  <div className="text-xs text-slate-500 mt-0.5">{ev.department}</div>
                                </div>
                              </div>
                            </td>

                            {/* Feedback / Status */}
                            <td className="px-4 py-3 align-top">
                              {ev.status === 'Extension Requested' ? (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                  <span className="bg-blue-600 text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded-sm block mb-2 w-fit">
                                    Extension Requested
                                  </span>
                                  <div className="text-sm text-blue-900 space-y-1">
                                    <div className="flex items-start gap-2">
                                      <MessageSquare className="w-3 h-3 mt-1 text-blue-500 shrink-0" />
                                      <span className="italic text-xs">"{ev.extensionReason}"</span>
                                    </div>
                                    <div className="flex items-center gap-2 ml-5 text-xs font-semibold">
                                      <Calendar className="w-3 h-3 text-blue-500" />
                                      Requested: {ev.extensionDate}
                                    </div>
                                  </div>
                                  {onExtensionAction && (
                                    <div className="flex gap-2 mt-3 pt-2 border-t border-blue-200/50">
                                      <button onClick={() => onExtensionAction(ev.id, 'Accept')} className="flex items-center gap-1 px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors">
                                        <Check className="w-3 h-3" /> Approve
                                      </button>
                                      <button onClick={() => onExtensionAction(ev.id, 'Reject')} className="flex items-center gap-1 px-2 py-1 bg-white border border-blue-300 text-blue-700 text-xs rounded hover:bg-blue-50 transition-colors">
                                        <X className="w-3 h-3" /> Reject
                                      </button>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div>
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getStatusStyle(ev.status)}`}>
                                    {ev.status}
                                  </span>
                                  {ev.comment && (
                                    <div className="text-slate-600 text-xs flex items-start gap-2 mt-1.5">
                                      <MessageSquare className="w-3 h-3 mt-0.5 text-slate-400 shrink-0" />
                                      <span className="italic">"{ev.comment}"</span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </td>

                            {/* Actions */}
                            <td className="px-4 py-3 align-middle text-center">
                              {replacingId === ev.id ? (
                                <div className="flex flex-col gap-2 animate-in fade-in duration-200 min-w-[200px]">
                                  {/* Replace search box */}
                                  <div className="relative">
                                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                    <input
                                      autoFocus
                                      type="text"
                                      placeholder="Search replacement..."
                                      value={replaceSearch}
                                      onChange={e => setReplaceSearch(e.target.value)}
                                      className="w-full text-xs border border-slate-300 rounded-lg pl-8 pr-3 py-1.5 focus:ring-1 focus:ring-[#C8102E] outline-none"
                                    />
                                    {replaceSearch && (
                                      <button onClick={() => setReplaceSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                        <X className="w-3 h-3" />
                                      </button>
                                    )}
                                  </div>
                                  {/* Filtered replacement list */}
                                  <div className="max-h-40 overflow-y-auto space-y-1 rounded-lg border border-slate-200 bg-white p-1 custom-scrollbar">
                                    {replaceCandidates.length === 0 ? (
                                      <p className="text-xs text-slate-400 italic text-center py-3">No evaluators found</p>
                                    ) : (
                                      replaceCandidates.map(c => (
                                        <button
                                          key={c.id}
                                          onClick={() => confirmReplace(ev.id, c.id)}
                                          className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-slate-50 transition-colors text-left"
                                        >
                                          <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                                            <UserIcon className="w-3 h-3 text-purple-600" />
                                          </div>
                                          <div className="min-w-0">
                                            <div className="text-xs font-semibold text-slate-700 truncate">{c.name}</div>
                                            <div className="text-[10px] text-slate-400 truncate">{c.department}</div>
                                          </div>
                                        </button>
                                      ))
                                    )}
                                  </div>
                                  <button onClick={cancelReplace} className="w-full py-1 text-xs border border-slate-300 rounded-lg hover:bg-slate-100 text-slate-600">
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center justify-center gap-2">
                                  {ev.status !== 'Accepts' && (
                                    <button onClick={() => initiateReplace(ev.id)} className="flex items-center gap-1 px-3 py-1.5 bg-white border border-blue-200 text-blue-600 hover:bg-blue-50 text-xs rounded-lg font-medium transition-colors">
                                      <RefreshCw className="w-3 h-3" /> Replace
                                    </button>
                                  )}
                                  {ev.status !== 'Accepts' && (
                                    <button onClick={() => initiateRemove(ev)} className="flex items-center gap-1 px-3 py-1.5 bg-white border border-red-200 text-red-600 hover:bg-red-50 text-xs rounded-lg font-medium transition-colors">
                                      <Trash2 className="w-3 h-3" /> Remove
                                    </button>
                                  )}
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 bg-white border border-dashed border-slate-200 rounded-xl">
                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Users className="w-6 h-6 text-slate-400" />
                    </div>
                    <p className="text-slate-500 text-sm italic">No evaluators currently assigned.</p>
                  </div>
                )}
              </div>

              {/* Section 2: Add New Evaluators */}
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-6">
                <h3 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-3 mb-4 flex items-center gap-2">
                  <Plus className="w-4 h-4 text-[#C8102E]" />
                  Add Evaluators
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 tracking-wider uppercase block mb-2">Select Department</label>
                    {/* Custom department picker */}
                    <div className="relative">
                      {/* Trigger button */}
                      <button
                        type="button"
                        onClick={() => { setDeptDropdownOpen(o => !o); setDeptSearch(''); }}
                        className="w-full flex items-center justify-between border border-slate-300 rounded-lg px-4 py-2.5 bg-white hover:border-[#C8102E] transition-colors focus:outline-none focus:ring-2 focus:ring-[#C8102E]"
                      >
                        <span className={`text-sm font-bold ${selectedDepartment ? 'text-slate-800' : 'text-slate-500'}`}>
                          {selectedDepartment || 'Choose Department'}
                        </span>
                        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${deptDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>

                      {/* Dropdown panel */}
                      {deptDropdownOpen && (
                        <div className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
                          {/* Inline search */}
                          <div className="p-2 border-b border-slate-100">
                            <div className="relative">
                              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                              <input
                                autoFocus
                                type="text"
                                placeholder="Search department..."
                                value={deptSearch}
                                onChange={e => setDeptSearch(e.target.value)}
                                className="w-full border border-slate-200 rounded-lg pl-9 pr-8 py-1.5 text-sm focus:ring-2 focus:ring-[#C8102E] focus:outline-none"
                              />
                              {deptSearch && (
                                <button onClick={() => setDeptSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                          {/* Department list */}
                          <div className="max-h-48 overflow-y-auto custom-scrollbar">
                            {filteredDepartments.length === 0 ? (
                              <p className="text-xs text-slate-400 italic text-center py-4">No departments found</p>
                            ) : (
                              filteredDepartments.map(dept => (
                                <button
                                  key={dept}
                                  type="button"
                                  onClick={() => { handleDepartmentChange(dept); setDeptDropdownOpen(false); setDeptSearch(''); }}
                                  className={`w-full text-left px-4 py-2.5 text-sm font-semibold hover:bg-slate-50 transition-colors ${
                                    selectedDepartment === dept ? 'bg-red-50 text-[#C8102E]' : 'text-slate-700'
                                  }`}
                                >
                                  {dept}
                                </button>
                              ))
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {selectedDepartment && (
                    <div className="animate-in slide-in-from-bottom-2 duration-300">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Available Evaluators</p>
                        <div className="relative w-full sm:w-64">
                          <input
                            type="text"
                            placeholder="Search evaluators..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full border border-slate-300 rounded-lg pl-9 pr-8 py-2 text-sm focus:ring-2 focus:ring-[#C8102E] focus:outline-none"
                          />
                          <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                          {searchQuery && (
                            <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1">
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>

                      {filteredEvaluators.length === 0 ? (
                        <div className="bg-white border border-slate-200 rounded-xl p-6 text-center">
                          <UserIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                          <p className="text-slate-500 italic text-sm">
                            {searchQuery ? 'No evaluators match your search.' : 'No evaluators available for this department.'}
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                          {filteredEvaluators.map((evaluator) => {
                            if (currentList.some(ev => ev.id === evaluator.id)) return null;
                            return (
                              <div
                                key={evaluator.id}
                                onClick={() => handleAddEvaluator(evaluator)}
                                className="group flex items-center gap-3 p-3 rounded-xl border bg-white border-slate-200 hover:border-[#C8102E] hover:shadow-md cursor-pointer transition-all duration-200"
                              >
                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-[#C8102E]/10 transition-colors flex-shrink-0">
                                  <Plus className="w-5 h-5 text-slate-400 group-hover:text-[#C8102E]" />
                                </div>
                                <div className="flex-1">
                                  <span className="text-sm font-semibold text-slate-700 group-hover:text-[#C8102E]">{evaluator.name}</span>
                                  <span className="text-xs text-slate-500 block mt-0.5">{evaluator.department}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
          </>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium transition-colors text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveClick}
            className="px-4 py-2 rounded-lg text-white font-medium bg-[#C8102E] hover:bg-[#A00E26] shadow-sm transition-colors text-sm"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default RnDEvaluatorPageModal;