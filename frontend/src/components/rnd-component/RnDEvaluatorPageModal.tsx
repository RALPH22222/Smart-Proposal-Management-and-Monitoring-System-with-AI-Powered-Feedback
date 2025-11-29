import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  User as UserIcon,
  ChevronDown,
  AlertCircle,
  RefreshCw,
  Trash2,
  Check,
  XCircle,
  Search
} from 'lucide-react';

// --- Export this interface so the parent page can use it ---
export interface EvaluatorOption {
  id: string;
  name: string;
  department: string;
  status: 'Accepts' | 'Rejected' | 'Pending';
}

interface RnDEvaluatorPageModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentEvaluators?: EvaluatorOption[];
  onReassign: (newEvaluators: EvaluatorOption[]) => void;
  proposalTitle: string; 
}

const RnDEvaluatorPageModal: React.FC<RnDEvaluatorPageModalProps> = ({
  isOpen,
  onClose,
  currentEvaluators = [],
  onReassign,
  proposalTitle = "Untitled Project"
}) => {
  const departments = [
    'Information Technology',
    'Computer Science',
    'Engineering'
  ];

  // --- MOCK DATA FOR AVAILABLE EVALUATORS ---
  const mockEvaluators: Record<string, EvaluatorOption[]> = {
    'Information Technology': [
      { id: 'e1', name: 'Dr. Alice Santos', department: 'Information Technology', status: 'Pending' },
      { id: 'e2', name: 'Prof. Ben Reyes', department: 'Information Technology', status: 'Accepts' },
      { id: 'e7', name: 'Dr. Michael Chen', department: 'Information Technology', status: 'Pending' },
      { id: 'e8', name: 'Prof. Sarah Johnson', department: 'Information Technology', status: 'Accepts' },
      { id: 'e13', name: 'Dr. Emily White', department: 'Information Technology', status: 'Pending' }
    ],
    'Computer Science': [
      { id: 'e3', name: 'Dr. Carla Lim', department: 'Computer Science', status: 'Rejected' },
      { id: 'e4', name: 'Prof. David Tan', department: 'Computer Science', status: 'Pending' },
      { id: 'e9', name: 'Dr. Robert Wilson', department: 'Computer Science', status: 'Accepts' },
      { id: 'e10', name: 'Prof. Lisa Garcia', department: 'Computer Science', status: 'Pending' }
    ],
    'Engineering': [
      { id: 'e5', name: 'Dr. John Cruz', department: 'Engineering', status: 'Accepts' },
      { id: 'e6', name: 'Prof. Eva Martinez', department: 'Engineering', status: 'Rejected' },
      { id: 'e11', name: 'Dr. James Brown', department: 'Engineering', status: 'Accepts' },
      { id: 'e12', name: 'Prof. Maria Rodriguez', department: 'Engineering', status: 'Pending' }
    ]
  };

  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [availableEvaluators, setAvailableEvaluators] = useState<EvaluatorOption[]>([]);
  const [filteredEvaluators, setFilteredEvaluators] = useState<EvaluatorOption[]>([]);
  
  // Single source of truth for assigned evaluators
  const [currentList, setCurrentList] = useState<EvaluatorOption[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // --- STATES FOR MODALS & ACTIONS ---
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);
  const [evaluatorToRemove, setEvaluatorToRemove] = useState<EvaluatorOption | null>(null); // For Remove Modal
  const [replacingId, setReplacingId] = useState<string | null>(null); // Track which row is in "Replace Mode"

  // Initialize Data
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
    const evaluators = mockEvaluators[dept] || [];
    setAvailableEvaluators(evaluators);
    setFilteredEvaluators(evaluators);
    setSearchQuery('');
  };

  // --- ADD LOGIC ---
  const handleAddEvaluator = (evaluator: EvaluatorOption) => {
    if (currentList.some(ev => ev.id === evaluator.id)) return;
    const newEvaluator: EvaluatorOption = { ...evaluator, status: 'Pending' };
    setCurrentList(prev => [...prev, newEvaluator]);
  };

  // --- REMOVE LOGIC (With Confirmation) ---
  const initiateRemove = (evaluator: EvaluatorOption) => {
    setEvaluatorToRemove(evaluator); // Opens the confirmation modal
  };

  const confirmRemove = () => {
    if (evaluatorToRemove) {
      setCurrentList(prev => prev.filter(ev => ev.id !== evaluatorToRemove.id));
      setEvaluatorToRemove(null); // Close modal
    }
  };

  // --- REPLACE LOGIC (Dropdown) ---
  const initiateReplace = (id: string) => {
    setReplacingId(id); // Turns the row into edit mode
  };

  const cancelReplace = () => {
    setReplacingId(null);
  };

  const confirmReplace = (originalId: string, newEvaluatorId: string, department: string) => {
    if (!newEvaluatorId) return;

    // Find the new evaluator object from the full mock list
    const candidates = mockEvaluators[department] || [];
    const newEvaluatorObj = candidates.find(c => c.id === newEvaluatorId);

    if (newEvaluatorObj) {
      // Swap in the list
      setCurrentList(prev => prev.map(ev => {
        if (ev.id === originalId) {
          // Replace old with new, reset status to Pending
          return { ...newEvaluatorObj, status: 'Pending' }; 
        }
        return ev;
      }));
    }
    setReplacingId(null); // Exit edit mode
  };

  // --- SAVE FLOW ---
  const handleSaveClick = () => setShowSaveConfirmation(true);
  
  const handleFinalConfirmSave = () => {
    onReassign(currentList);
    setShowSaveConfirmation(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className='fixed inset-0 bg-black/50 bg-opacity-50 flex justify-center items-center z-50 p-4 animate-in fade-in duration-200'>
        <div className='bg-white rounded-lg w-full max-w-4xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]'>
          
          {/* Header */}
          <div className='bg-gray-100 border-b border-slate-200 text-gray-800 px-6 py-4 flex justify-between items-center'>
            <h3 className='text-lg font-semibold'>Evaluator Management</h3>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-black hover:bg-gray-200 p-2 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className='p-6 overflow-y-auto flex-1 space-y-6 custom-scrollbar'>
            
            {/* --- SECTION 1: CURRENT EVALUATORS --- */}
            <div className='bg-gray-50 p-5 rounded-md border border-gray-200'>
              <h4 className='font-semibold text-gray-800 mb-4 flex items-center gap-2'>
                  Current Evaluators
                  <span className="text-xs font-bold text-white bg-[#C10003] px-2 py-0.5 rounded-full shadow-sm">
                      {currentList.length} Assigned
                  </span>
              </h4>
              
              {currentList.length > 0 ? (
                <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
                  <table className='w-full text-sm'>
                    <thead className='bg-gray-100 border-b border-gray-200'>
                      <tr>
                        <th className='px-4 py-3 text-left text-gray-600 font-semibold'>Name</th>
                        <th className='px-4 py-3 text-left text-gray-600 font-semibold'>Department</th>
                        <th className='px-4 py-3 text-left text-gray-600 font-semibold'>Status</th>
                        <th className='px-4 py-3 text-center text-gray-600 font-semibold w-48'>Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {currentList.map((ev) => (
                        <tr key={ev.id} className="hover:bg-gray-50 transition-colors">
                          <td className='px-4 py-3 text-gray-800 font-medium'>
                            {ev.name}
                          </td>
                          <td className='px-4 py-3 text-gray-600'>{ev.department}</td>
                          <td className='px-4 py-3'>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border
                                  ${ev.status === 'Accepts' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                                    ev.status === 'Rejected' ? 'bg-red-50 text-red-700 border-red-200' : 
                                    'bg-amber-50 text-amber-700 border-amber-200'}`}
                              >
                                      {ev.status}
                              </span>
                          </td>
                          <td className='px-4 py-3 text-center'>
                              {ev.status === 'Accepts' ? (
                                <span className="text-xs text-gray-400 italic flex items-center justify-center gap-1">
                                  <Check className="w-3 h-3" /> Confirmed
                                </span>
                              ) : replacingId === ev.id ? (
                                // --- REPLACE MODE (Dropdown) ---
                                <div className="flex items-center gap-2 animate-in fade-in duration-200">
                                  <select 
                                    className="w-full text-xs border border-gray-300 rounded px-2 py-1.5 focus:ring-1 focus:ring-[#C10003] outline-none"
                                    onChange={(e) => confirmReplace(ev.id, e.target.value, ev.department)}
                                    defaultValue=""
                                    autoFocus
                                  >
                                    <option value="" disabled>Select Replacement</option>
                                    {(mockEvaluators[ev.department] || [])
                                      .filter(c => !currentList.some(curr => curr.id === c.id))
                                      .map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                      ))
                                    }
                                  </select>
                                  <button 
                                    onClick={cancelReplace}
                                    className="p-1.5 hover:bg-gray-200 rounded text-gray-500"
                                    title="Cancel"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              ) : (
                                // --- NORMAL ACTION BUTTONS ---
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

      {/* --- SAVE CONFIRMATION MODAL --- */}
      {showSaveConfirmation && (
        <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md overflow-hidden transform scale-100 transition-transform">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-red-100 p-2 rounded-full">
                  <AlertCircle className="w-6 h-6 text-[#C10003]" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Confirm Assignments</h3>
              </div>
              
              <p className="text-gray-600 mb-4 leading-relaxed">
                Are you sure you want to assign the following evaluators to the <span className="font-bold text-gray-900">{proposalTitle}</span> project?
              </p>

              <div className="bg-gray-50 border border-gray-200 rounded-md p-3 max-h-40 overflow-y-auto mb-6 custom-scrollbar">
                <ul className="space-y-2">
                  {currentList.map((ev) => (
                    <li key={ev.id} className="flex items-center gap-2 text-sm text-gray-700">
                      <UserIcon className="w-4 h-4 text-gray-400" />
                      <span className="font-medium">{ev.name}</span>
                      <span className="text-xs text-gray-500">({ev.department})</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowSaveConfirmation(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleFinalConfirmSave}
                  className="px-4 py-2 text-sm font-bold text-white bg-[#C10003] rounded-lg hover:bg-[#A00002] shadow-sm transition-colors"
                >
                  Yes, Assign
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- REMOVE CONFIRMATION MODAL --- */}
      {evaluatorToRemove && (
        <div className="fixed inset-0 z-[70] bg-black/60 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-sm overflow-hidden transform scale-100 transition-transform">
            <div className="p-6 text-center">
              <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Remove Evaluator?</h3>
              <p className="text-sm text-gray-600 mb-6">
                Are you sure to remove <span className="font-bold text-gray-900">{evaluatorToRemove.name}</span> for evaluating?
              </p>
              
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => setEvaluatorToRemove(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmRemove}
                  className="px-4 py-2 text-sm font-bold text-white bg-red-600 rounded-lg hover:bg-red-700 shadow-sm transition-colors"
                >
                  Yes, Remove
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default RnDEvaluatorPageModal;