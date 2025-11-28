import React, { useState, useEffect } from 'react';
import { 
  X, 
  Search, 
  AlertTriangle, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  Clock, 
  ChevronDown, 
  ChevronUp,
  User as UserIcon
} from 'lucide-react';

// --- INTERFACES ---

interface ExtensionRequest {
  requestedDate: string;
  reason: string;
}

interface EvaluatorOption {
  id: string;
  name: string;
  department: string;
  status: 'Accepts' | 'Rejected' | 'Pending';
  // Optional extension request
  extensionRequest?: ExtensionRequest; 
}

interface RnDEvaluatorPageModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentEvaluators?: EvaluatorOption[];
  onReassign: (newEvaluators: EvaluatorOption[]) => void;
}

const RnDEvaluatorPageModal: React.FC<RnDEvaluatorPageModalProps> = ({
  isOpen,
  onClose,
  currentEvaluators = [],
  onReassign
}) => {
  const departments = [
    'Information Technology',
    'Computer Science',
    'Engineering'
  ];

  // --- MOCK DATA ---
  const mockEvaluators: Record<string, EvaluatorOption[]> = {
    'Information Technology': [
      {
        id: 'e1',
        name: 'Dr. Alice Santos',
        department: 'Information Technology',
        status: 'Pending', // Must be Pending to see request
        extensionRequest: {
            requestedDate: '2025-11-20',
            reason: 'I need an additional week to verify the cryptographic methods proposed in the methodology.'
        }
      },
      {
        id: 'e2',
        name: 'Prof. Ben Reyes',
        department: 'Information Technology',
        status: 'Accepts'
      },
      {
        id: 'e7',
        name: 'Dr. Michael Chen',
        department: 'Information Technology',
        status: 'Pending' 
        // No request here, so no alert will show
      },
      {
        id: 'e8',
        name: 'Prof. Sarah Johnson',
        department: 'Information Technology',
        status: 'Accepts'
      }
    ],
    'Computer Science': [
      { id: 'e3', name: 'Dr. Carla Lim', department: 'Computer Science', status: 'Rejected' },
      { id: 'e4', name: 'Prof. David Tan', department: 'Computer Science', status: 'Pending' },
      { id: 'e9', name: 'Dr. Robert Wilson', department: 'Computer Science', status: 'Accepts' },
      { id: 'e10', name: 'Prof. Lisa Garcia', department: 'Computer Science', status: 'Pending' }
    ],
    Engineering: [
      { id: 'e5', name: 'Dr. John Cruz', department: 'Engineering', status: 'Accepts' },
      { id: 'e6', name: 'Prof. Eva Martinez', department: 'Engineering', status: 'Rejected' },
      { id: 'e11', name: 'Dr. James Brown', department: 'Engineering', status: 'Accepts' },
      { id: 'e12', name: 'Prof. Maria Rodriguez', department: 'Engineering', status: 'Pending' }
    ]
  };

  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [availableEvaluators, setAvailableEvaluators] = useState<EvaluatorOption[]>([]);
  const [filteredEvaluators, setFilteredEvaluators] = useState<EvaluatorOption[]>([]);
  const [selectedEvaluators, setSelectedEvaluators] = useState<EvaluatorOption[]>([]);
  const [currentList, setCurrentList] = useState<EvaluatorOption[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Track expanded request row
  const [expandedRequestId, setExpandedRequestId] = useState<string | null>(null);

  // Initialize Data
  useEffect(() => {
    if (currentEvaluators.length > 0) {
      setCurrentList(currentEvaluators);
    } else {
      // Default Mock if no props passed
      setCurrentList([
        {
          id: 'e1',
          name: 'Dr. Alice Santos',
          department: 'Information Technology',
          status: 'Pending',
          extensionRequest: {
             requestedDate: '2025-11-20',
             reason: 'I need an additional week to verify the cryptographic methods proposed.'
          }
        },
        {
          id: 'e3',
          name: 'Dr. Carla Lim',
          department: 'Computer Science',
          status: 'Accepts'
        },
        {
          id: 'e5',
          name: 'Dr. John Cruz',
          department: 'Engineering',
          status: 'Rejected'
        }
      ]);
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
    setSelectedEvaluators([]);
    setSearchQuery('');
  };

  const handleEvaluatorSelect = (evaluator: EvaluatorOption) => {
    setSelectedEvaluators((prev) =>
      prev.some((ev) => ev.id === evaluator.id)
        ? prev.filter((ev) => ev.id !== evaluator.id)
        : [...prev, evaluator]
    );
  };

  const handleReplaceEvaluator = (id: string) => {
    setCurrentList((prev) => prev.filter((ev) => ev.id !== id));
  };

  const handleRemoveEvaluator = (id: string) => {
    setCurrentList((prev) => prev.filter((ev) => ev.id !== id));
  };

  const handleConfirm = () => {
    const updatedEvaluators = [...currentList, ...selectedEvaluators];
    onReassign(updatedEvaluators);
    onClose();
  };

  // --- DEADLINE EXTENSION LOGIC ---

  const toggleRequestView = (id: string) => {
    setExpandedRequestId(prev => prev === id ? null : id);
  };

  const handleExtensionDecision = (id: string, approved: boolean) => {
    // In a real app, this would make an API call.
    // Here we just remove the extensionRequest object from the state to simulate "Handled".
    setCurrentList(prev => prev.map(ev => {
      if (ev.id === id) {
        const { extensionRequest, ...rest } = ev; 
        return rest; // Return object without the request
      }
      return ev;
    }));
    setExpandedRequestId(null);
    // Optional: alert(`Request ${approved ? 'Accepted' : 'Rejected'}`);
  };

  if (!isOpen) return null;

  return (
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
                <span className="text-xs font-normal text-gray-500 bg-white px-2 py-0.5 rounded border border-gray-200">
                    {currentList.length} Assigned
                </span>
            </h4>
            
            {currentList.length > 0 ? (
              <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                <table className='w-full text-sm'>
                  <thead className='bg-gray-100 border-b border-gray-200'>
                    <tr>
                      <th className='px-4 py-3 text-left text-gray-600 font-semibold'>Name</th>
                      <th className='px-4 py-3 text-left text-gray-600 font-semibold'>Department</th>
                      <th className='px-4 py-3 text-left text-gray-600 font-semibold'>Status</th>
                      <th className='px-4 py-3 text-center text-gray-600 font-semibold'>Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {currentList.map((ev) => {
                      // Logic: Only show extension options if Pending AND has request
                      const hasPendingRequest = ev.status === 'Pending' && ev.extensionRequest;
                      const isExpanded = expandedRequestId === ev.id;

                      return (
                        <React.Fragment key={ev.id}>
                          <tr className={`hover:bg-gray-50 transition-colors ${hasPendingRequest ? 'bg-amber-50/30' : ''}`}>
                            
                            {/* Name Column */}
                            <td className='px-4 py-3 text-gray-800 font-medium'>
                              {ev.name}
                              {hasPendingRequest && (
                                <div className="inline-flex items-center gap-1 ml-2 text-[10px] font-bold text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-200">
                                    <Clock className="w-3 h-3" />
                                    <span>Extension Request</span>
                                </div>
                              )}
                            </td>

                            {/* Department Column */}
                            <td className='px-4 py-3 text-gray-600'>{ev.department}</td>

                            {/* Status Column */}
                            <td className='px-4 py-3'>
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border
                                    ${ev.status === 'Accepts' ? 'bg-green-50 text-green-700 border-green-200' : 
                                      ev.status === 'Rejected' ? 'bg-red-50 text-red-700 border-red-200' : 
                                      'bg-yellow-50 text-yellow-700 border-yellow-200'}`}
                                >
                                    {ev.status}
                                </span>
                            </td>

                            {/* Actions Column */}
                            <td className='px-4 py-3 text-center'>
                                <div className="flex items-center justify-center gap-2">
                                    {hasPendingRequest ? (
                                        // Special Action for Pending Request
                                        <button
                                            onClick={() => toggleRequestView(ev.id)}
                                            className={`flex items-center gap-1 px-3 py-1 text-xs rounded-md font-medium transition-colors border
                                                ${isExpanded 
                                                    ? 'bg-amber-100 text-amber-800 border-amber-300' 
                                                    : 'bg-white text-amber-600 border-amber-200 hover:bg-amber-50'
                                                }`}
                                        >
                                            {isExpanded ? <ChevronUp className="w-3 h-3"/> : <AlertTriangle className="w-3 h-3"/>}
                                            {isExpanded ? 'Hide Details' : 'Review Request'}
                                        </button>
                                    ) : (
                                        // Standard Actions
                                        <>
                                            <button
                                                onClick={() => handleReplaceEvaluator(ev.id)}
                                                className='px-3 py-1 bg-white border border-blue-200 text-blue-600 hover:bg-blue-50 text-xs rounded-md font-medium transition-colors'
                                            >
                                                Replace
                                            </button>
                                            <button
                                                onClick={() => handleRemoveEvaluator(ev.id)}
                                                className='px-3 py-1 bg-white border border-red-200 text-red-600 hover:bg-red-50 text-xs rounded-md font-medium transition-colors'
                                            >
                                                Remove
                                            </button>
                                        </>
                                    )}
                                </div>
                            </td>
                          </tr>

                          {/* --- EXPANDABLE REQUEST DETAILS --- */}
                          {hasPendingRequest && isExpanded && (
                              <tr className="bg-amber-50/50 animate-in fade-in duration-200 border-b border-amber-100">
                                  <td colSpan={4} className="p-4">
                                      <div className="bg-white border border-amber-200 rounded-lg p-4 shadow-sm max-w-2xl mx-auto relative">
                                          {/* Arrow Indicator */}
                                          <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-white border-t border-l border-amber-200 rotate-45"></div>
                                          
                                          <div className="flex items-start gap-3">
                                              <div className="bg-amber-100 p-2 rounded-full flex-shrink-0">
                                                  <Calendar className="w-5 h-5 text-amber-600" />
                                              </div>
                                              <div className="flex-1">
                                                  <div className="flex justify-between items-start mb-2">
                                                      <div>
                                                          <h5 className="text-sm font-bold text-gray-900">Deadline Extension Requested</h5>
                                                          <p className="text-xs text-gray-500">
                                                              Requesting change from <span className="font-medium text-gray-700">Oct 20, 2025</span> to:
                                                          </p>
                                                      </div>
                                                      <div className="bg-amber-100 text-amber-800 px-2 py-1 rounded text-sm font-bold border border-amber-200">
                                                          {new Date(ev.extensionRequest!.requestedDate).toLocaleDateString()}
                                                      </div>
                                                  </div>
                                                  
                                                  <div className="bg-gray-50 p-3 rounded border border-gray-200 text-sm text-gray-700 italic mb-4">
                                                      <span className="font-semibold text-gray-500 not-italic text-xs block mb-1">Reason:</span>
                                                      "{ev.extensionRequest!.reason}"
                                                  </div>

                                                  <div className="flex gap-3 justify-end pt-1 border-t border-amber-100">
                                                      <button 
                                                          onClick={() => handleExtensionDecision(ev.id, false)}
                                                          className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-red-600 bg-white border border-red-200 rounded hover:bg-red-50 transition-colors"
                                                      >
                                                          <XCircle className="w-3.5 h-3.5" /> Reject
                                                      </button>
                                                      <button 
                                                          onClick={() => handleExtensionDecision(ev.id, true)}
                                                          className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 rounded hover:bg-emerald-700 shadow-sm transition-colors"
                                                      >
                                                          <CheckCircle className="w-3.5 h-3.5" /> Accept Extension
                                                      </button>
                                                  </div>
                                              </div>
                                          </div>
                                      </div>
                                  </td>
                              </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
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
                
                {/* Search Input */}
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
                      const isSelected = selectedEvaluators.some((ev) => ev.id === evaluator.id);
                      const isAlreadyAssigned = currentList.some(ev => ev.id === evaluator.id);
                      
                      if (isAlreadyAssigned) return null; // Don't show already assigned

                      return (
                        <label
                            key={evaluator.id}
                            className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-all duration-200
                                ${isSelected 
                                    ? 'bg-red-50 border-red-200 shadow-sm' 
                                    : 'bg-white border-gray-200 hover:border-red-200 hover:shadow-sm'
                                }`}
                        >
                            <div className="relative flex items-center">
                                <input
                                type='checkbox'
                                checked={isSelected}
                                onChange={() => handleEvaluatorSelect(evaluator)}
                                className='peer h-4 w-4 cursor-pointer text-[#C10003] focus:ring-[#C10003] border-gray-300 rounded transition-all'
                                />
                            </div>
                            
                            <div className='flex-1'>
                                <div className="flex justify-between items-center">
                                    <span className={`text-sm font-semibold ${isSelected ? 'text-[#C10003]' : 'text-gray-700'}`}>
                                        {evaluator.name}
                                    </span>
                                    {/* STATUS REMOVED FROM HERE AS REQUESTED */}
                                </div>
                                <span className='text-gray-500 text-xs block mt-0.5'>
                                    {evaluator.department}
                                </span>
                            </div>
                        </label>
                      );
                  })}
                </div>
              )}
              
              {/* Selected Count */}
              {selectedEvaluators.length > 0 && (
                <div className='mt-4 pt-3 border-t border-gray-200 flex justify-between items-center'>
                  <p className='text-sm font-medium text-gray-700'>
                    {selectedEvaluators.length} new evaluator{selectedEvaluators.length !== 1 ? 's' : ''} selected
                  </p>
                  <button 
                    onClick={() => setSelectedEvaluators([])}
                    className="text-xs text-red-600 hover:underline"
                  >
                    Clear selection
                  </button>
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
            onClick={handleConfirm}
            className='px-4 py-2 rounded-md text-white font-medium bg-[#C10003] hover:bg-[#A00002] disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-colors text-sm'
            disabled={selectedEvaluators.length === 0}
          >
            Confirm Reassignment
          </button>
        </div>
      </div>
    </div>
  );
};

export default RnDEvaluatorPageModal;