import React, { useState, useEffect } from 'react';
import {
  X,
  Clock,
  Send,
  Eye,
  UserPlus,
  UserMinus,
  Users,
  Search,
  Filter
} from 'lucide-react';
import Swal from 'sweetalert2';
import {
  type Proposal,
  type Decision,
  type DecisionType,
  type StructuredComments,
  type CommentSection,
  type Reviewer
} from '../../types/InterfaceProposal';
import { type Evaluator } from '../../types/evaluator';
import { fetchUsersByRole, fetchDepartments, type UserItem } from '../../services/proposal.api';

interface AdminProposalModalProps {
  proposal: Proposal | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmitDecision: (decision: Decision) => void;
  currentUser: Reviewer;
}

const AdminProposalModal: React.FC<AdminProposalModalProps> = ({
  proposal,
  isOpen,
  onClose,
  onSubmitDecision,
  currentUser
}) => {
  // --- REAL DATA FETCHING ---
  const [evaluators, setEvaluators] = useState<Partial<Evaluator>[]>([]);
  const [rndStaffList, setRndStaffList] = useState<Partial<Evaluator>[]>([]);
  const [allDepartments, setAllDepartments] = useState<any[]>([]); // Store all departments

  useEffect(() => {
    if (isOpen) {
      const loadUsers = async () => {
        try {
          const [rndData, evalData, deptData] = await Promise.all([
            fetchUsersByRole('rnd'),
            fetchUsersByRole('evaluator'),
            fetchDepartments()
          ]);

          setAllDepartments(deptData); // Save for filter

          const mapToEvaluator = (u: UserItem): Partial<Evaluator> => {
            let deptName = 'N/A';

            // Logic aligned with ChangeRndModal
            // 1. Try array
            if (u.departments && u.departments.length > 0) {
              deptName = u.departments[0].name;
            }
            // 2. Try department_id fallback with lookup
            else if (u.department_id) {
              const found = deptData.find(d => d.id === Number(u.department_id));
              if (found) deptName = found.name;
            }

            return {
              id: u.id,
              name: `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email || 'Unknown',
              department: deptName,
              availabilityStatus: 'Available', // Default available for now
              email: u.email || '',
              agency: 'WMSU', // Default agency
              avatar: u.profile_picture
            };
          };

          setRndStaffList(rndData.map(mapToEvaluator));
          setEvaluators(evalData.map(mapToEvaluator));

        } catch (error) {
          console.error("Failed to load users", error);
        }
      };
      loadUsers();
    }
  }, [isOpen]);

  // --- STATE ---
  const [decision, setDecision] = useState<DecisionType | 'Assign to RnD'>('Assign to RnD');
  const [evaluationDeadline, setEvaluationDeadline] = useState('14');
  const [structuredComments, setStructuredComments] = useState<StructuredComments>({
    objectives: { id: '1', title: 'Objectives', content: '', lastModified: '', author: currentUser.name },
    methodology: { id: '2', title: 'Methodology', content: '', lastModified: '', author: currentUser.name },
    budget: { id: '3', title: 'Budget', content: '', lastModified: '', author: currentUser.name },
    timeline: { id: '4', title: 'Timeline', content: '', lastModified: '', author: currentUser.name },
    overall: { id: '5', title: 'Overall', content: '', lastModified: '', author: currentUser.name },
    additional: []
  });

  // Evaluator Assignment State
  const [evaluatorSearch, setEvaluatorSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [availableEvaluators, setAvailableEvaluators] = useState<Partial<Evaluator>[]>([]);

  // Selection States
  const [checkedAvailableIds, setCheckedAvailableIds] = useState<string[]>([]);
  const [checkedAssignedIds, setCheckedAssignedIds] = useState<string[]>([]);
  const [assignedEvaluators, setAssignedEvaluators] = useState<Partial<Evaluator>[]>([]);

  // R&D Staff Assignment State
  const [selectedRnDStaff, setSelectedRnDStaff] = useState<Partial<Evaluator> | null>(null);

  const [showAnonymitySelection, setShowAnonymitySelection] = useState(false);
  const [showProponentInfo, setShowProponentInfo] = useState<'name' | 'agency' | 'both'>('both');

  const [activeSection, setActiveSection] = useState<string>('objectives');
  const [typingSection, setTypingSection] = useState<string>('');

  // --- EFFECTS ---

  // Reset modal state when proposal changes or modal opens
  useEffect(() => {
    if (isOpen && proposal) {
      setDecision('Assign to RnD');
      setEvaluationDeadline('14');
      setStructuredComments({
        objectives: { id: '1', title: 'Objectives', content: '', lastModified: '', author: currentUser.name },
        methodology: { id: '2', title: 'Methodology', content: '', lastModified: '', author: currentUser.name },
        budget: { id: '3', title: 'Budget', content: '', lastModified: '', author: currentUser.name },
        timeline: { id: '4', title: 'Timeline', content: '', lastModified: '', author: currentUser.name },
        overall: { id: '5', title: 'Overall', content: '', lastModified: '', author: currentUser.name },
        additional: []
      });
      setActiveSection('objectives');
      setShowAnonymitySelection(false);
      setShowProponentInfo('both');

      // Reset Assignment States
      setEvaluatorSearch('');
      setDepartmentFilter('All');
      setCheckedAvailableIds([]);
      setCheckedAssignedIds([]);
      setAssignedEvaluators([]);
      setSelectedRnDStaff(null);
    }
  }, [isOpen, proposal, currentUser.name]);

  // Set default comment for reject decision
  useEffect(() => {
    if (decision === 'Rejected Proposal') {
      setStructuredComments((prev) => ({
        ...prev,
        objectives: {
          ...prev.objectives,
          content: prev.objectives.content || 'After careful review of this proposal, we have determined that it does not meet the required standards for approval. The following concerns have been identified:\n\n1. [Specify main concern]\n2. [Additional concerns if any]\n\nWe recommend that the proponent address these issues before resubmission.',
          lastModified: new Date().toISOString()
        }
      }));
    }
  }, [decision]);

  // Filter Available Evaluators
  useEffect(() => {
    let filtered = evaluators.filter(ev =>
      // 1. Exclude already assigned evaluators
      !assignedEvaluators.some(assigned => assigned.id === ev.id) &&
      // 2. Only show AVAILABLE evaluators (Hide Busy)
      ev.availabilityStatus === 'Available'
    );

    // Apply Department Filter
    if (departmentFilter !== 'All') {
      filtered = filtered.filter(ev => ev.department === departmentFilter);
    }

    // Apply Search Filter (Name Only)
    if (evaluatorSearch.trim()) {
      const lowerSearch = evaluatorSearch.toLowerCase();
      filtered = filtered.filter(ev =>
        (ev.name && ev.name.toLowerCase().includes(lowerSearch)) ||
        (ev.agency && ev.agency.toLowerCase().includes(lowerSearch))
      );
    }

    setAvailableEvaluators(filtered);
  }, [evaluatorSearch, departmentFilter, assignedEvaluators, evaluators]);

  // Simulate typing indicators
  useEffect(() => {
    if (typingSection) {
      const timer = setTimeout(() => setTypingSection(''), 2000);
      return () => clearTimeout(timer);
    }
  }, [typingSection]);

  // --- HANDLERS ---

  const handleCommentChange = (sectionKey: keyof StructuredComments, content: string) => {
    setTypingSection(sectionKey);
    setStructuredComments((prev) => {
      if (sectionKey !== 'additional') {
        return {
          ...prev,
          [sectionKey]: { ...(prev[sectionKey] as CommentSection), content, lastModified: new Date().toISOString() }
        };
      }
      return prev;
    });
  };

  // --- ASSIGNMENT LOGIC ---

  const handleAvailableCheckboxChange = (evaluatorId: string) => {
    setCheckedAvailableIds(prev =>
      prev.includes(evaluatorId)
        ? prev.filter(id => id !== evaluatorId)
        : [...prev, evaluatorId]
    );
  };

  const handleAddSelectedEvaluators = () => {
    const toAdd = evaluators.filter(ev =>
      checkedAvailableIds.includes(ev.id!) &&
      !assignedEvaluators.some(ae => ae.id === ev.id)
    );

    setAssignedEvaluators(prev => [...prev, ...toAdd]);
    setCheckedAvailableIds([]);
    setEvaluatorSearch('');
  };

  const handleAssignedCheckboxChange = (evaluatorId: string) => {
    setCheckedAssignedIds(prev =>
      prev.includes(evaluatorId)
        ? prev.filter(id => id !== evaluatorId)
        : [...prev, evaluatorId]
    );
  };

  const handleRemoveSelectedEvaluators = () => {
    setAssignedEvaluators(prev => prev.filter(ev => !checkedAssignedIds.includes(ev.id!)));
    setCheckedAssignedIds([]);
  };

  // --- SUBMISSION HANDLERS ---
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!proposal) return;

    if (decision === 'Sent to Evaluators') {
      if (assignedEvaluators.length === 0) {
        alert("Please assign at least one evaluator.");
        return;
      }
      handleForwardToEvaluators();
      return;
    }

    const decisionData: Decision = {
      proposalId: proposal.id,
      decision: decision,
      structuredComments,
      attachments: [],
      reviewedBy: currentUser.name,
      reviewedDate: new Date().toISOString(),
      evaluationDeadline: (decision === 'Revision Required' || decision === 'Assign to RnD')
        ? new Date(Date.now() + parseInt(evaluationDeadline, 10) * 24 * 60 * 60 * 1000).toISOString()
        : undefined,
      assignedRdStaffId: decision === 'Assign to RnD' ? selectedRnDStaff?.id : undefined
    };

    // Confirmation Dialog
    Swal.fire({
      title: 'Confirm Decision',
      text: `Are you sure you want to proceed with: ${decision}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#C8102E',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Yes, Submit',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        onSubmitDecision(decisionData);
        onClose();
        Swal.fire('Submitted!', 'Your decision has been recorded.', 'success');
      }
    });
  };

  const handleForwardToEvaluators = () => {
    setShowAnonymitySelection(true);
  };

  const submitWithAnonymity = () => {
    if (!proposal) return;

    const deadlineIso = new Date(Date.now() + parseInt(evaluationDeadline, 10) * 24 * 60 * 60 * 1000).toISOString();

    const decisionData: Decision & { proponentInfoVisibility?: 'name' | 'agency' | 'both' } = {
      proposalId: proposal.id,
      decision: 'Sent to Evaluators',
      structuredComments,
      attachments: [],
      reviewedBy: currentUser.name,
      reviewedDate: new Date().toISOString(),
      evaluationDeadline: deadlineIso,
      proponentInfoVisibility: showProponentInfo,
      assignedEvaluators: assignedEvaluators.map(ev => ev.id!)
    };

    // Confirmation Dialog for Evaluators
    Swal.fire({
      title: 'Confirm Assignment',
      text: `Are you sure you want to forward this proposal to ${assignedEvaluators.length} evaluators?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#C8102E',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Yes, Forward',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        onSubmitDecision(decisionData);
        setShowAnonymitySelection(false);
        onClose();
        Swal.fire('Forwarded!', 'Proposal has been sent to evaluators.', 'success');
      }
    });
  };

  const getDecisionButtonText = (decisionType: DecisionType | 'Assign to RnD') => {
    switch (decisionType) {
      case 'Assign to RnD': return 'Assign to R&D Staff';
      case 'Sent to Evaluators': return 'Sent to Evaluators';
      case 'Revision Required': return 'Send back to Proponent with Feedback';
      case 'Rejected Proposal': return 'Reject Proposal with Explanation';
      default: return decisionType;
    }
  };

  if (!isOpen || !proposal) return null;

  const sections = [
    { key: 'objectives', title: 'Objectives Assessment', data: structuredComments.objectives },
    { key: 'methodology', title: 'Methodology Assessment', data: structuredComments.methodology },
    { key: 'budget', title: 'Budget Assessment', data: structuredComments.budget },
    { key: 'timeline', title: 'Timeline Assessment', data: structuredComments.timeline },
    { key: 'overall', title: 'Overall Asessment', data: structuredComments.overall }
  ];



  return (
    <>
      <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4'>
        <div className='bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[100vh] overflow-hidden flex flex-col'>

          {/* Modal Header */}
          <div className='p-4 sm:p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50 flex-shrink-0'>
            <div className='flex-1 text-gray-600'>
              <div className='flex items-center gap-3 mb-1'>
                <h2 className='text-lg font-bold text-black'>Review Proposal</h2>
              </div>
              <h3 className='text-base font-medium opacity-90 line-clamp-2'>{proposal.title}</h3>
              {proposal.evaluationDeadline && (
                <div className='flex items-center gap-1 mt-1 text-xs opacity-80'>
                  <Clock className='w-3 h-3' />
                  <span>Deadline: {new Date(proposal.evaluationDeadline).toLocaleDateString()}</span>
                </div>
              )}
            </div>
            <button onClick={onClose} className='p-1 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors flex-shrink-0 ml-2'>
              <X className='w-5 h-5 text-black' />
            </button>
          </div>

          <div className='flex-1 overflow-y-auto'>
            <form onSubmit={handleSubmit} className='h-full flex flex-col'>

              {/* Decision Options */}
              <div className='p-4 border-b border-gray-200'>
                <h4 className='text-base font-semibold text-gray-800 mb-3'>Make Decision</h4>
                <div className='space-y-2'>
                  {(['Assign to RnD', 'Sent to Evaluators', 'Revision Required', 'Rejected Proposal'] as (DecisionType | 'Assign to RnD')[]).map((option) => (
                    <label key={option} className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${decision === option ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50 border-gray-200'}`}>
                      <input
                        type='radio'
                        name='decision'
                        value={option}
                        checked={decision === option}
                        onChange={(e) => setDecision(e.target.value as DecisionType | 'Assign to RnD')}
                        className='w-4 h-4 text-[#C10003] bg-gray-100 border-gray-300 focus:ring-[#C10003] focus:ring-2'
                      />
                      <div className='ml-3 flex-1'>
                        <span className={`text-sm font-medium ${option === 'Assign to RnD' ? 'text-blue-700' :
                          option === 'Sent to Evaluators' ? 'text-green-700' :
                            option === 'Revision Required' ? 'text-orange-700' : 'text-red-700'
                          }`}>
                          {getDecisionButtonText(option)}
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Time Limit Section */}
              {/* Time Limit Section - Hidden for 'Assign to RnD' as requested */}
              {(decision === 'Sent to Evaluators' || decision === 'Revision Required') && (
                <div className='p-4 border-b border-gray-200'>
                  <h4 className='text-base font-semibold text-gray-800 mb-3'>
                    {decision === 'Sent to Evaluators' ? 'Evaluation Time Limit' : 'Revision Time Limit'}
                  </h4>
                  <div className='space-y-2'>
                    <label className='block text-xs font-medium text-gray-700'>
                      {decision === 'Sent to Evaluators' ? 'Deadline for evaluators to complete review:' : 'Deadline for proponent to submit revision:'}
                    </label>
                    <select
                      value={evaluationDeadline}
                      onChange={(e) => setEvaluationDeadline(e.target.value)}
                      className='w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C10003]'
                    >
                      <option value='7'>1 Week</option>
                      <option value='14'>2 Weeks</option>
                      <option value='21'>3 Weeks</option>
                    </select>
                  </div>
                </div>
              )}

              {/* R&D Staff Assignment (Rich UI with Filter & Avatars) */}
              {decision === 'Assign to RnD' && (
                <div className='p-4 border-b border-gray-200'>
                  <h4 className='text-base font-semibold text-gray-800 mb-3'>R&D Staff Assignment</h4>

                  {/* R&D Filter Toolbar */}
                  <div className='flex flex-col gap-3 mb-4'>
                    <div className='relative'>
                      <Search className='absolute left-3 top-2.5 w-4 h-4 text-gray-400' />
                      <input
                        type='text'
                        placeholder='Search R&D staff...'
                        value={evaluatorSearch}
                        onChange={(e) => setEvaluatorSearch(e.target.value)}
                        className='w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C10003]'
                      />
                    </div>
                    <div className='relative'>
                      <Filter className='absolute left-3 top-2.5 w-3.5 h-3.5 text-gray-400' />
                      <select
                        value={departmentFilter}
                        onChange={(e) => setDepartmentFilter(e.target.value)}
                        className='w-full pl-8 pr-4 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C10003] appearance-none bg-white'
                      >
                        <option value='All'>All Departments</option>
                        {allDepartments.map(dept => (
                          <option key={dept.id} value={dept.name}>{dept.name}</option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                        <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.828l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                      </div>
                    </div>
                  </div>

                  {/* R&D Staff List */}
                  <div className="border border-gray-200 rounded-lg max-h-56 overflow-y-auto bg-gray-50 p-2 space-y-1">
                    {rndStaffList
                      .filter(staff => {
                        const matchName = !evaluatorSearch || (staff.name && staff.name.toLowerCase().includes(evaluatorSearch.toLowerCase()));
                        const matchDept = departmentFilter === 'All' || staff.department === departmentFilter;
                        return matchName && matchDept;
                      })
                      .map((staff) => (
                        <label key={staff.id} className={`flex items-start p-2 rounded cursor-pointer border transition-colors ${selectedRnDStaff?.id === staff.id ? 'bg-blue-50 border-blue-300 ring-1 ring-blue-300' : 'bg-white border-transparent hover:border-gray-200'}`}>
                          <input
                            type="radio"
                            name="rndStaff"
                            checked={selectedRnDStaff?.id === staff.id}
                            onChange={() => setSelectedRnDStaff(staff)}
                            className="mt-2 w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                          />
                          <div className="ml-3 flex items-center gap-3 flex-1">
                            {/* Avatar / Initials */}
                            {staff.avatar ? (
                              <img
                                src={staff.avatar}
                                alt={staff.name}
                                className="w-8 h-8 rounded-full object-cover border border-slate-200"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                                {staff.name?.charAt(0) || '?'}
                              </div>
                            )}

                            <div className="flex-1">
                              <p className="text-sm font-bold text-gray-800">{staff.name}</p>
                              <p className="text-xs text-gray-500">
                                {staff.email}
                              </p>
                              <p className="text-[10px] uppercase font-bold text-gray-400 mt-0.5">{staff.department}</p>
                            </div>
                          </div>
                        </label>
                      ))}
                  </div>
                </div>
              )}

              {/* --- EVALUATOR ASSIGNMENT SECTION (UPDATED) --- */}
              {decision === 'Sent to Evaluators' && (
                <div className='p-4 border-b border-gray-200'>
                  <h4 className='text-base font-semibold text-gray-800 mb-3'>Evaluator Assignment</h4>

                  {/* Filter Toolbar */}
                  <div className='flex flex-col gap-3 mb-4'>
                    <div className='relative'>
                      <Search className='absolute left-3 top-2.5 w-4 h-4 text-gray-400' />
                      <input
                        type='text'
                        placeholder='Search by name...'
                        value={evaluatorSearch}
                        onChange={(e) => setEvaluatorSearch(e.target.value)}
                        className='w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C10003]'
                      />
                    </div>

                    {/* Department Filter */}
                    <div className='relative'>
                      <Filter className='absolute left-3 top-2.5 w-3.5 h-3.5 text-gray-400' />
                      <select
                        value={departmentFilter}
                        onChange={(e) => setDepartmentFilter(e.target.value)}
                        className='w-full pl-8 pr-4 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C10003] appearance-none bg-white'
                      >
                        <option value='All'>All Departments</option>
                        {allDepartments.map(dept => (
                          <option key={dept.id} value={dept.name}>{dept.name}</option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                        <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.828l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                      </div>
                    </div>
                  </div>

                  {/* Available Evaluators List */}
                  <div className='mb-4 animate-in fade-in'>
                    <div className="flex items-center justify-between mb-2">
                      <label className='block text-xs font-bold text-gray-700 uppercase'>Available Evaluators</label>
                      <span className="text-xs text-gray-500">{checkedAvailableIds.length} selected</span>
                    </div>

                    <div className="border border-gray-200 rounded-lg max-h-48 overflow-y-auto bg-gray-50 p-2 space-y-1">
                      {availableEvaluators.length === 0 ? (
                        <div className="text-center py-6">
                          <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                          <p className="text-xs text-gray-400">No available evaluators matching filters.</p>
                        </div>
                      ) : (
                        availableEvaluators.map(ev => (
                          <label key={ev.id} className="flex items-start p-2 hover:bg-white rounded cursor-pointer border border-transparent hover:border-gray-200 transition-colors">
                            <input
                              type="checkbox"
                              checked={checkedAvailableIds.includes(ev.id!)}
                              onChange={() => handleAvailableCheckboxChange(ev.id!)}
                              className="mt-1 w-4 h-4 text-[#C10003] rounded focus:ring-[#C10003] border-gray-300"
                            />
                            <div className="ml-3 flex items-center gap-3 flex-1">
                              {/* Avatar / Initials */}
                              {ev.avatar ? (
                                <img
                                  src={ev.avatar}
                                  alt={ev.name}
                                  className="w-8 h-8 rounded-full object-cover border border-slate-200"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-[#C8102E] text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                                  {ev.name?.charAt(0) || '?'}
                                </div>
                              )}

                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-800">{ev.name}</p>
                                <p className="text-xs text-gray-500 mt-0.5">
                                  {ev.email} • {ev.department}
                                </p>
                              </div>
                            </div>
                          </label>
                        ))
                      )}
                    </div>

                    <button
                      type="button"
                      disabled={checkedAvailableIds.length === 0}
                      onClick={handleAddSelectedEvaluators}
                      className="mt-2 w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-sm"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      Add {checkedAvailableIds.length > 0 ? `(${checkedAvailableIds.length}) ` : ''}Selected Evaluators
                    </button>
                  </div>

                  {/* Assigned List (With Checkboxes & Bulk Remove) */}
                  <div className="mt-6 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                      <label className='block text-xs font-bold text-gray-700 uppercase'>Assigned ({assignedEvaluators.length})</label>
                      {assignedEvaluators.length > 0 && (
                        <span className="text-xs text-gray-500">{checkedAssignedIds.length} selected</span>
                      )}
                    </div>

                    {assignedEvaluators.length === 0 ? (
                      <div className="text-center py-4 bg-gray-50 border border-dashed border-gray-300 rounded-lg">
                        <p className="text-xs text-gray-500">No evaluators assigned yet.</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {/* Assigned Evaluators List */}
                        <div className="border border-green-100 rounded-lg max-h-40 overflow-y-auto bg-green-50/30 p-2 space-y-1">
                          {assignedEvaluators.map(ev => (
                            <label key={ev.id} className="flex items-center p-2 bg-white border border-green-100 rounded-lg shadow-sm hover:border-green-200 cursor-pointer transition-colors">
                              <input
                                type="checkbox"
                                checked={checkedAssignedIds.includes(ev.id!)}
                                onChange={() => handleAssignedCheckboxChange(ev.id!)}
                                className="w-4 h-4 text-red-600 rounded focus:ring-red-500 border-gray-300"
                              />
                              <div className="ml-3 flex-1 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  {/* Avatar / Initials */}
                                  {ev.avatar ? (
                                    <img
                                      src={ev.avatar}
                                      alt={ev.name}
                                      className="w-8 h-8 rounded-full object-cover border border-slate-200"
                                    />
                                  ) : (
                                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-xs">
                                      {ev.name!.charAt(0)}
                                    </div>
                                  )}
                                  <div>
                                    <p className="text-sm font-semibold text-gray-800">{ev.name}</p>
                                    <p className="text-[10px] text-gray-500">{ev.department}</p>
                                  </div>
                                </div>
                              </div>
                            </label>
                          ))}
                        </div>

                        {/* Bulk Remove Button */}
                        <button
                          type="button"
                          onClick={handleRemoveSelectedEvaluators}
                          disabled={checkedAssignedIds.length === 0}
                          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-red-100 text-red-700 text-xs font-semibold rounded-lg hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <UserMinus className="w-3.5 h-3.5" />
                          Remove Selected ({checkedAssignedIds.length})
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Structured Comments */}
              {decision === 'Revision Required' && (
                <div className='flex-1 p-4 border-b border-gray-200'>
                  <div className='flex items-center justify-between mb-3'>
                    <h4 className='text-base font-semibold text-gray-800'>Structured Comments</h4>
                  </div>
                  <div className='flex flex-wrap gap-1 mb-3 border-b border-gray-200'>
                    {sections.map((section) => (
                      <button
                        key={section.key}
                        type='button'
                        onClick={() => setActiveSection(section.key)}
                        className={`px-2 py-1 text-xs font-medium rounded-t-lg transition-colors ${activeSection === section.key ? 'bg-[#C10003] text-white' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                          }`}
                      >
                        {section.title}
                      </button>
                    ))}
                  </div>
                  {sections.map((section) => (
                    <div key={section.key} className={activeSection === section.key ? 'block' : 'hidden'}>
                      <label className='block text-xs font-medium text-gray-700 mb-2'>{section.title}</label>
                      <textarea
                        value={section.data.content}
                        onChange={(e) => handleCommentChange(section.key as keyof StructuredComments, e.target.value)}
                        rows={3}
                        className='w-full px-2 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C10003] resize-none'
                        placeholder={`Enter your comments for ${section.title.toLowerCase()}...`}
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Simple Comments */}
              {(decision === 'Sent to Evaluators' || decision === 'Rejected Proposal') && (
                <div className='flex-1 p-4 border-b border-gray-200'>
                  <h4 className='text-base font-semibold text-gray-800 mb-3'>
                    {decision === 'Sent to Evaluators' ? 'Comments for Evaluators' : 'Rejection Explanation'}
                  </h4>
                  <textarea
                    value={structuredComments.objectives.content}
                    onChange={(e) => handleCommentChange('objectives', e.target.value)}
                    rows={4}
                    className='w-full px-2 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C10003] resize-none'
                    placeholder={decision === 'Sent to Evaluators' ? 'Enter instructions for evaluators...' : 'Provide explanation for rejection...'}
                  />
                </div>
              )}

              {/* Action Buttons */}
              <div className='p-4 bg-gray-50 flex-shrink-0'>
                <div className='flex flex-col gap-2'>
                  <button type='button' onClick={onClose} className='w-full px-3 py-2 text-xs text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium'>
                    Cancel
                  </button>
                  {decision === 'Sent to Evaluators' ? (
                    <button type='button' onClick={handleForwardToEvaluators} disabled={assignedEvaluators.length === 0} className='w-full px-3 py-2 text-xs text-white bg-[#C10003] hover:bg-[#A00002] rounded-lg transition-colors font-medium flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed'>
                      <Send className='w-3 h-3' />
                      <span>Forward to Evaluators</span>
                    </button>
                  ) : (
                    <button type='submit' className='w-full px-3 py-2 text-xs text-white bg-[#C10003] hover:bg-[#A00002] rounded-lg transition-colors font-medium'>
                      {getDecisionButtonText(decision)}
                    </button>
                  )}
                </div>
              </div>

            </form>
          </div>
        </div>
      </div>

      {/* Anonymity Selection Modal */}
      {showAnonymitySelection && (
        <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4'>
          <div className='bg-white rounded-xl shadow-2xl w-full max-w-md'>
            <div className='p-6'>
              <div className='flex items-center gap-3 mb-4'>
                <Eye className='w-6 h-6 text-[#C10003]' />
                <h3 className='text-lg font-semibold text-gray-800'>Proponent Information Visibility</h3>
              </div>
              <p className='text-sm text-gray-600 mb-6'>Choose what information about the proponent will be visible to evaluators:</p>

              <div className='space-y-3 mb-6'>
                {['both', 'name', 'agency'].map((val) => (
                  <label key={val} className='flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50'>
                    <input type='radio' name='proponentInfo' value={val} checked={showProponentInfo === val} onChange={() => setShowProponentInfo(val as any)} className='w-4 h-4 text-[#C10003] focus:ring-[#C10003]' />
                    <div className='ml-3'>
                      <span className='text-sm font-medium text-gray-700'>{val === 'both' ? 'Show Both' : val === 'name' ? 'Show Name Only' : 'Show Agency Only'}</span>
                    </div>
                  </label>
                ))}
              </div>

              <div className='flex gap-3'>
                <button onClick={() => setShowAnonymitySelection(false)} className='flex-1 px-4 py-3 text-gray-600 bg-transparent border border-gray-300 rounded-lg'>Cancel</button>
                <button onClick={submitWithAnonymity} className='flex-1 px-4 py-3 text-white bg-[#C10003] rounded-lg'>Confirm Assignment</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminProposalModal;