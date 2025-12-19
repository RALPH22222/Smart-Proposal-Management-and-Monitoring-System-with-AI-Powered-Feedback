import React, { useState, useEffect } from 'react';
import { X, UserCog, User, ArrowRight, AlertCircle, Check, Filter } from 'lucide-react';
import { type Proposal } from '../../types/InterfaceProposal';
import { type Evaluator } from '../../types/evaluator';

interface ChangeRdStaffModalProps {
  proposal: Proposal | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (proposalId: string, newStaffName: string) => void;
}

const ChangeRndModal: React.FC<ChangeRdStaffModalProps> = ({
  proposal,
  isOpen,
  onClose,
  onConfirm,
}) => {
  // --- MOCK DATA: R&D Staff List ---
  const rndStaffList: Evaluator[] = [
    { 
      id: 'rnd-1', 
      name: 'Dr. R&D Lead', 
      department: 'R&D', 
      specialty: ['Public Safety', 'Environment'], 
      availabilityStatus: 'Available', 
      currentWorkload: 3, 
      maxWorkload: 10, 
      rating: 5.0, 
      completedReviews: 50, 
      email: 'rnd.lead@wmsu.edu.ph', 
      agency: 'WMSU - R&D Center' 
    },
    { 
      id: 'rnd-2', 
      name: 'Ms. R&D Specialist', 
      department: 'R&D', 
      specialty: ['ICT'],
      availabilityStatus: 'Available', 
      currentWorkload: 1, 
      maxWorkload: 5, 
      rating: 4.7, 
      completedReviews: 12, 
      email: 'rnd.spec@wmsu.edu.ph', 
      agency: 'WMSU - R&D Center' 
    },
    { 
      id: 'rnd-3', 
      name: 'Dr. Alice Santos', 
      department: 'R&D', 
      specialty: ['ICT', 'Energy'],
      availabilityStatus: 'Busy', 
      currentWorkload: 5, 
      maxWorkload: 5, 
      rating: 4.8, 
      completedReviews: 20, 
      email: 'alice.santos@wmsu.edu.ph', 
      agency: 'WMSU - R&D Center' 
    },
    { 
      id: 'rnd-4', 
      name: 'Prof. Juan Agri', 
      department: 'R&D', 
      specialty: ['Agriculture', 'Environment'],
      availabilityStatus: 'Available', 
      currentWorkload: 2, 
      maxWorkload: 5, 
      rating: 4.9, 
      completedReviews: 15, 
      email: 'juan.agri@wmsu.edu.ph', 
      agency: 'WMSU - R&D Center' 
    },
    { 
      id: 'rnd-5', 
      name: 'Dr. Maria Health', 
      department: 'R&D', 
      specialty: ['Healthcare'], 
      availabilityStatus: 'Available', 
      currentWorkload: 0, 
      maxWorkload: 5, 
      rating: 4.9, 
      completedReviews: 30, 
      email: 'maria.health@wmsu.edu.ph', 
      agency: 'WMSU - R&D Center' 
    },
    { 
      id: 'rnd-6', 
      name: 'Engr. Power', 
      department: 'R&D', 
      specialty: ['Energy', 'Public Safety'],
      availabilityStatus: 'Available', 
      currentWorkload: 1, 
      maxWorkload: 5, 
      rating: 4.6, 
      completedReviews: 8, 
      email: 'engr.power@wmsu.edu.ph', 
      agency: 'WMSU - R&D Center' 
    }
  ];

  const specializations = [
    'Agriculture',
    'Energy',
    'Environment',
    'Healthcare',
    'ICT',
    'Public Safety'
  ];

  const [selectedSpecialization, setSelectedSpecialization] = useState<string>('');
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && proposal) {
      setSelectedStaffId('');
      setError('');

      // Auto-select specialization
      const autoSelectedSpec = specializations.find(spec => {
        const specLower = spec.toLowerCase();
        
        // Helper to check fields safely
        const checkField = (field?: string) => field?.toLowerCase().includes(specLower);

        // Check explicit fields
        if (checkField(proposal.projectType)) return true;
        if (checkField(proposal.priorityAreas)) return true;
        if (checkField(proposal.sector)) return true;
        if (checkField(proposal.discipline)) return true;

        // Fallback to title
        if (checkField(proposal.title)) return true;

        return false;
      });

      if (autoSelectedSpec) {
        setSelectedSpecialization(autoSelectedSpec);
      } else {
        setSelectedSpecialization(''); 
      }
    }
  }, [isOpen, proposal]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaffId) {
      setError('Please select a new R&D staff member.');
      return;
    }

    const selectedStaff = rndStaffList.find(s => s.id === selectedStaffId);
    if (selectedStaff && proposal) {
      onConfirm(proposal.id, selectedStaff.name);
      onClose();
    }
  };

  if (!isOpen || !proposal) return null;

  // Filter staff based on selected specialization
  const filteredStaff = rndStaffList.filter(staff => {
    const isNotCurrentAssignee = staff.name !== proposal.assignedRdStaff;
    const matchesSpecialization = selectedSpecialization 
      ? staff.specialty.includes(selectedSpecialization) 
      : true;
    return isNotCurrentAssignee && matchesSpecialization;
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
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Context: From -> To */}
            <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200 text-sm">
              <div className="flex flex-col">
                <span className="text-xs text-slate-500 uppercase font-semibold">Current</span>
                <span className="font-medium text-slate-700 flex items-center gap-1">
                  <User className="w-3 h-3" /> {proposal.assignedRdStaff}
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
                {/* 1. Specialization Filter */}
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                        Filter by Specialization
                    </label>
                    <div className="relative">
                        <Filter className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <select
                            value={selectedSpecialization}
                            onChange={(e) => {
                                setSelectedSpecialization(e.target.value);
                                setSelectedStaffId(''); // Reset selection
                            }}
                            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white appearance-none"
                        >
                            <option value="">-- All Specializations --</option>
                            {specializations.map((spec) => (
                                <option key={spec} value={spec}>
                                    {spec}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* 2. Staff Selection */}
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                        Select R&D Staff
                    </label>
                    <select
                        value={selectedStaffId}
                        onChange={(e) => {
                            setSelectedStaffId(e.target.value);
                            setError('');
                        }}
                        disabled={filteredStaff.length === 0}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:bg-slate-100 disabled:text-slate-400"
                    >
                        <option value="">
                            {filteredStaff.length === 0 ? 'No staff found for this tag' : '-- Choose Staff Member --'}
                        </option>
                        {filteredStaff.map((staff) => (
                            <option key={staff.id} value={staff.id}>
                                {staff.name} — {staff.currentWorkload} active tasks
                            </option>
                        ))}
                    </select>
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
        </div>
      </div>
    </div>
  );
};

export default ChangeRndModal;