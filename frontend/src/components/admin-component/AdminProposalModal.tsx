import React, { useState, useEffect } from 'react';
import {
  X,
  Clock,
  Send,
  Eye,
  Beaker 
} from 'lucide-react';
import {
  type Proposal,
  type Decision,
  type DecisionType,
  type StructuredComments,
  type CommentSection,
  type Reviewer
} from '../../types/InterfaceProposal';
import { type Evaluator } from '../../types/evaluator';

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
  const evaluators: Evaluator[] = [
    {
      id: '1',
      name: 'Dr. Alice Santos',
      department: 'Information Technology',
      specialty: ['AI', 'Systems'],
      availabilityStatus: 'Available',
      currentWorkload: 2,
      maxWorkload: 5,
      rating: 4.8,
      completedReviews: 20,
      email: 'alice@wmsu.edu.ph',
      agency: 'WMSU - College of Computing Studies'
    },
    {
      id: '2',
      name: 'Prof. Ben Reyes',
      department: 'Computer Science',
      specialty: ['Security', 'Networks'],
      availabilityStatus: 'Busy',
      currentWorkload: 4,
      maxWorkload: 5,
      rating: 4.5,
      completedReviews: 15,
      email: 'ben@wmsu.edu.ph',
      agency: 'WMSU - College of Engineering'
    },
    {
      id: '3',
      name: 'Engr. Carla Lim',
      department: 'Information Technology',
      specialty: ['Databases', 'Web Dev'],
      availabilityStatus: 'Available',
      currentWorkload: 1,
      maxWorkload: 4,
      rating: 4.9,
      completedReviews: 30,
      email: 'carla@wmsu.edu.ph',
      agency: 'WMSU - College of Computing Studies'
    }
  ];

  const rndStaffList: Evaluator[] = [
    {
      id: 'rnd-1',
      name: 'Dr. R&D Lead',
      department: 'R&D',
      specialty: ['Research Management'],
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
      specialty: ['Project Monitoring'],
      availabilityStatus: 'Available',
      currentWorkload: 1,
      maxWorkload: 5,
      rating: 4.7,
      completedReviews: 12,
      email: 'rnd.spec@wmsu.edu.ph',
      agency: 'WMSU - R&D Center'
    }
  ];

  // Explicit type definition to support the extra option and avoid TS errors
  const [decision, setDecision] = useState<DecisionType | 'Assign to RnD'>('Assign to RnD');
  const [evaluationDeadline, setEvaluationDeadline] = useState('14');
  const [structuredComments, setStructuredComments] =
    useState<StructuredComments>({
      objectives: {
        id: '1',
        title: 'Objectives',
        content: '',
        lastModified: '',
        author: currentUser.name
      },
      methodology: {
        id: '2',
        title: 'Methodology',
        content: '',
        lastModified: '',
        author: currentUser.name
      },
      budget: {
        id: '3',
        title: 'Budget',
        content: '',
        lastModified: '',
        author: currentUser.name
      },
      timeline: {
        id: '4',
        title: 'Timeline',
        content: '',
        lastModified: '',
        author: currentUser.name
      },
      overall: {
        id: '5',
        title: 'Overall',
        content: '',
        lastModified: '',
        author: currentUser.name
      },
      additional: []
    });
  
  // Evaluator Assignment State
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [availableEvaluators, setAvailableEvaluators] = useState<Evaluator[]>([]);
  const [selectedEvaluator, setSelectedEvaluator] = useState<Evaluator | null>(null);
  const [selectedEvaluators, setSelectedEvaluators] = useState<Evaluator[]>([]);

  // R&D Staff Assignment State
  const [selectedRnDStaff, setSelectedRnDStaff] = useState<Evaluator | null>(null);

  const [showAnonymitySelection, setShowAnonymitySelection] = useState(false);
  const [showProponentInfo, setShowProponentInfo] = useState<'name' | 'agency' | 'both'>('both');

  const [activeSection, setActiveSection] = useState<string>('objectives');
  const [typingSection, setTypingSection] = useState<string>('');

  // Reset modal state when proposal changes or modal opens
  useEffect(() => {
    if (isOpen && proposal) {
      setDecision('Assign to RnD');
      setEvaluationDeadline('14');
      setStructuredComments({
        objectives: {
          id: '1',
          title: 'Objectives',
          content: '',
          lastModified: '',
          author: currentUser.name
        },
        methodology: {
          id: '2',
          title: 'Methodology',
          content: '',
          lastModified: '',
          author: currentUser.name
        },
        budget: {
          id: '3',
          title: 'Budget',
          content: '',
          lastModified: '',
          author: currentUser.name
        },
          timeline: {
          id: '4',
          title: 'Timeline',
          content: '',
          lastModified: '',
          author: currentUser.name
        },
        overall: {
          id: '5',
          title: 'Overall',
          content: '',
          lastModified: '',
          author: currentUser.name
        },
        additional: []
      });
      setActiveSection('objectives');
      setShowAnonymitySelection(false);
      setShowProponentInfo('both');
      setSelectedEvaluators([]);
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
          content:
            prev.objectives.content ||
            'After careful review of this proposal, we have determined that it does not meet the required standards for approval. The following concerns have been identified:\n\n1. [Specify main concern]\n2. [Additional concerns if any]\n\nWe recommend that the proponent address these issues before resubmission.',
          lastModified: new Date().toISOString()
        }
      }));
    }
  }, [decision]);

  // Filter evaluators based on department
  useEffect(() => {
    if (selectedDepartment) {
      const filtered = evaluators.filter((ev) => ev.department === selectedDepartment);
      setAvailableEvaluators(filtered);
    }
  }, [selectedDepartment]);

  // Simulate typing indicators
  useEffect(() => {
    if (typingSection) {
      const timer = setTimeout(() => setTypingSection(''), 2000);
      return () => clearTimeout(timer);
    }
  }, [typingSection]);

  const handleCommentChange = (
    sectionKey: keyof StructuredComments,
    content: string
  ) => {
    setTypingSection(sectionKey);

    setStructuredComments((prev) => {
      // We only handle standard sections now
      if (sectionKey !== 'additional') {
        return {
          ...prev,
          [sectionKey]: {
            ...(prev[sectionKey] as CommentSection),
            content,
            lastModified: new Date().toISOString()
          }
        };
      }
      return prev;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!proposal) return;

    if (decision === 'Sent to Evaluators') {
      handleForwardToEvaluators();
      return;
    }

    const decisionData: Decision = {
      proposalId: proposal.id,
      decision: decision as any,
      structuredComments,
      attachments: [],
      reviewedBy: currentUser.name,
      reviewedDate: new Date().toISOString(),
      evaluationDeadline:
        decision === 'Revision Required' || decision === 'Assign to RnD'
          ? new Date(
              Date.now() + parseInt(evaluationDeadline, 10) * 24 * 60 * 60 * 1000
            ).toISOString()
          : undefined
    };

    onSubmitDecision(decisionData);
    onClose();
  };

  const handleForwardToEvaluators = () => {
    setShowAnonymitySelection(true);
  };

  const submitWithAnonymity = () => {
    if (!proposal) return;

    const deadlineIso = new Date(
      Date.now() + parseInt(evaluationDeadline, 10) * 24 * 60 * 60 * 1000
    ).toISOString();

    const decisionData: Decision & { proponentInfoVisibility?: 'name' | 'agency' | 'both' } = {
      proposalId: proposal.id,
      decision: 'Sent to Evaluators',
      structuredComments,
      attachments: [],
      reviewedBy: currentUser.name,
      reviewedDate: new Date().toISOString(),
      evaluationDeadline: deadlineIso,
      proponentInfoVisibility: showProponentInfo
    };

    onSubmitDecision(decisionData);
    setShowAnonymitySelection(false);
    onClose();
  };

  const getDecisionButtonText = (decisionType: DecisionType | 'Assign to RnD') => {
    switch (decisionType) {
      case 'Assign to RnD':
        return 'Assign to R&D Staff';
      case 'Sent to Evaluators':
        return 'Sent to Evaluators'; // FIXED: Changed from "Approve Proposal" to "Sent to Evaluators"
      case 'Revision Required':
        return 'Send back to Proponent with Feedback';
      case 'Rejected Proposal':
        return 'Reject Proposal with Explanation';
      default:
        return decisionType;
    }
  };

  const shouldShowStructuredComments = () => {
    return decision === 'Revision Required';
  };

  const shouldShowSimpleComments = () => {
    return (
      decision === 'Sent to Evaluators' || decision === 'Rejected Proposal'
    );
  };

  if (!isOpen || !proposal) return null;

  const sections = [
    {
      key: 'objectives',
      title: 'Objectives Assessment',
      data: structuredComments.objectives
    },
    {
      key: 'methodology',
      title: 'Methodology Assessment',
      data: structuredComments.methodology
    },
    {
      key: 'budget',
      title: 'Budget Assessment',
      data: structuredComments.budget
    },
    {
      key: 'timeline',
      title: 'Timeline Assessment',
      data: structuredComments.timeline
    },
    {
      key: 'overall',
      title: 'Overall Asessment',
      data: structuredComments.overall
    }
  ];

  return (
    <>
      {/* Main Modal */}
      <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4'>
        <div className='bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[100vh] overflow-hidden'>
          {/* Modal Header */}
          <div className='p-4 sm:p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50'>
            <div className='flex-1 text-gray-600'>
              <div className='flex items-center gap-3 mb-1'>
                <h2 className='text-lg font-bold text-black'>
                  'Review Proposal'
                </h2>
              </div>
              <h3 className='text-base font-medium opacity-90 line-clamp-2'>
                {proposal.title}
              </h3>
              {proposal.evaluationDeadline && (
                <div className='flex items-center gap-1 mt-1 text-xs opacity-80'>
                  <Clock className='w-3 h-3' />
                  <span>
                    Deadline:{' '}
                    {new Date(proposal.evaluationDeadline).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className='p-1 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors flex-shrink-0 ml-2 text-white'
              aria-label='Close modal'
            >
              <X className='w-5 h-5 text-black' />
            </button>
          </div>

          <div className='flex flex-col lg:flex-row h-full max-h-[calc(90vh-64px)] min-h-[500px]'>
            {/* Review Form Section */}
            <div className='w-full border-t lg:border-t-0 border-gray-200 overflow-y-auto'>
              <form onSubmit={handleSubmit} className='h-full flex flex-col'>
                {/* Decision Options */}
                <div className='p-4 border-b border-gray-200'>
                  <h4 className='text-base font-semibold text-gray-800 mb-3'>
                    Make Decision
                  </h4>
                  <div className='space-y-2'>
                    {(
                      [
                        'Assign to RnD',
                        'Sent to Evaluators',
                        'Revision Required',
                        'Rejected Proposal'
                      ] as (DecisionType | 'Assign to RnD')[]
                    ).map((option) => (
                      <label
                        key={option}
                        className='flex items-center p-2 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors'
                      >
                        <input
                          type='radio'
                          name='decision'
                          value={option}
                          checked={decision === option}
                          onChange={(e) =>
                            setDecision(e.target.value as DecisionType | 'Assign to RnD')
                          }
                          className='w-3 h-3 text-[#C10003] bg-gray-100 border-gray-300 focus:ring-[#C10003] focus:ring-2'
                        />
                        <div className='ml-2 flex-1'>
                          <span
                            className={`text-xs font-medium ${
                              option === 'Assign to RnD'
                                ? 'text-blue-700'
                                : option === 'Sent to Evaluators'
                                ? 'text-green-700'
                                : option === 'Revision Required'
                                ? 'text-orange-700'
                                : 'text-red-700'
                            }`}
                          >
                            {getDecisionButtonText(option)}
                          </span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Time Limit Section */}
                {(decision === 'Sent to Evaluators' || decision === 'Revision Required' || decision === 'Assign to RnD') && (
                  <div className='p-4 border-b border-gray-200'>
                    <h4 className='text-base font-semibold text-gray-800 mb-3'>
                      {decision === 'Sent to Evaluators' ? 'Evaluation Time Limit' : 'Assignment/Revision Time Limit'}
                    </h4>
                    <div className='space-y-2'>
                      <label className='block text-xs font-medium text-gray-700'>
                        {decision === 'Sent to Evaluators'
                          ? 'Deadline for evaluators to complete review:'
                          : decision === 'Assign to RnD'
                          ? 'Deadline for R&D staff to complete task:'
                          : 'Deadline for proponent to submit revision:'}
                      </label>
                      <select
                        value={evaluationDeadline}
                        onChange={(e) => setEvaluationDeadline(e.target.value)}
                        className='w-full px-2 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C10003] focus:border-transparent'
                      >
                        <option value='7'>1 Week</option>
                        <option value='14'>2 Weeks</option>
                        <option value='21'>3 Weeks</option>
                      </select>
                      <p className='text-xs text-gray-500'>
                        {decision === 'Sent to Evaluators'
                          ? 'Evaluators will be notified of this deadline when the proposal is assigned to them.'
                          : decision === 'Assign to RnD'
                          ? 'Assigned R&D staff will be notified of this deadline.'
                          : 'The proponent will be notified of this deadline for their revision.'}
                      </p>
                    </div>
                  </div>
                )}

                {/* R&D Staff Assignment Section - Only show for "Assign to RnD" */}
                {decision === 'Assign to RnD' && (
                  <div className='p-4 border-b border-gray-200'>
                    <h4 className='text-base font-semibold text-gray-800 mb-3'>
                       R&D Staff Assignment
                    </h4>
                    <div className='mb-3'>
                        <label className='block text-xs font-medium text-gray-700 mb-1'>
                          Select R&D Staff
                        </label>
                        <div className='flex items-center gap-2'>
                          <select
                            value={selectedRnDStaff?.id || ''}
                            onChange={(e) => {
                              const selected = rndStaffList.find(
                                (staff) => staff.id === e.target.value
                              );
                              setSelectedRnDStaff(selected || null);
                            }}
                            className='flex-1 px-2 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C10003] focus:border-transparent'
                          >
                            <option value=''>-- Choose Staff --</option>
                            {rndStaffList.map((staff) => (
                              <option key={staff.id} value={staff.id}>
                                {staff.name}
                              </option>
                            ))}
                          </select>
                        </div>
                    </div>
                  </div>
                )}

                {/* Evaluator Assignment Section - Only show for "Forward to Evaluators" */}
                {decision === 'Sent to Evaluators' && (
                  <div className='p-4 border-b border-gray-200'>
                    <h4 className='text-base font-semibold text-gray-800 mb-3'>
                      Evaluator Assignment
                    </h4>

                    <p className='text-xs text-gray-600 mb-3'>
                      Choose a department first, then pick evaluator(s) to assign
                      for this proposal.
                    </p>

                    {/* Step 1: Department Dropdown */}
                    <div className='mb-3'>
                      <label className='block text-xs font-medium text-gray-700 mb-1'>
                        Select Department
                      </label>
                      <select
                        value={selectedDepartment}
                        onChange={(e) => {
                          const dept = e.target.value;
                          setSelectedDepartment(dept);
                          setSelectedEvaluators([]);
                        }}
                        className='block w-full px-2 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C10003] focus:border-transparent'
                      >
                        <option value=''>-- Choose Department --</option>
                        {[...new Set(evaluators.map((e) => e.department))].map(
                          (dept) => (
                            <option key={dept} value={dept}>
                              {dept}
                            </option>
                          )
                        )}
                      </select>
                    </div>

                    {/* Evaluator Dropdown */}
                    {selectedDepartment && (
                      <div className='mb-3'>
                        <label className='block text-xs font-medium text-gray-700 mb-1'>
                          Select Evaluator
                        </label>
                        <div className='flex items-center gap-2'>
                          <select
                            value={selectedEvaluator?.id || ''}
                            onChange={(e) => {
                              const selected = availableEvaluators.find(
                                (ev) => ev.id === e.target.value
                              );
                              setSelectedEvaluator(selected || null);
                            }}
                            className='flex-1 px-2 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C10003] focus:border-transparent'
                          >
                            <option value=''>-- Choose Evaluator --</option>
                            {availableEvaluators.map((ev) => (
                              <option key={ev.id} value={ev.id}>
                                {ev.name} - {ev.agency}
                              </option>
                            ))}
                          </select>

                          <button
                            type='button'
                            disabled={!selectedEvaluator}
                            onClick={() => {
                              if (
                                selectedEvaluator &&
                                !selectedEvaluators.some(
                                  (e) => e.id === selectedEvaluator.id
                                )
                              ) {
                                setSelectedEvaluators([
                                  ...selectedEvaluators,
                                  selectedEvaluator
                                ]);
                                setSelectedEvaluator(null);
                              }
                            }}
                            className={`px-3 py-1 text-xs rounded-md text-white font-medium ${
                              selectedEvaluator
                                ? 'bg-[#C10003] hover:bg-[#A00002]'
                                : 'bg-gray-300 cursor-not-allowed'
                            }`}
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Step 3: Display Added Evaluators */}
                    {selectedEvaluators.length > 0 && (
                      <div className='mt-3'>
                        <h5 className='text-xs font-medium text-gray-800 mb-2'>
                          Assigned Evaluators ({selectedEvaluators.length}):
                        </h5>
                        <div className='space-y-1 max-h-24 overflow-y-auto'>
                          {selectedEvaluators.map((ev) => (
                            <div
                              key={ev.id}
                              className='bg-[#C10003] text-white px-2 py-1 rounded text-xs flex items-center justify-between'
                            >
                              <div className='flex-1 min-w-0'>
                                <p className='font-medium truncate'>{ev.name}</p>
                                <p className='text-[10px] opacity-80 truncate'>{ev.agency}</p>
                              </div>
                              <button
                                type='button'
                                className='text-white hover:text-gray-200 ml-2 flex-shrink-0'
                                onClick={() =>
                                  setSelectedEvaluators(
                                    selectedEvaluators.filter(
                                      (e) => e.id !== ev.id
                                    )
                                  )
                                }
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Structured Comments Section */}
                {shouldShowStructuredComments() && (
                  <div className='flex-1 p-4 border-b border-gray-200'>
                    <div className='flex items-center justify-between mb-3'>
                      <h4 className='text-base font-semibold text-gray-800'>
                        Structured Comments
                      </h4>
                    </div>

                    {/* Section Tabs */}
                    <div className='flex flex-wrap gap-1 mb-3 border-b border-gray-200'>
                      {sections.map((section) => (
                        <button
                          key={section.key}
                          type='button'
                          onClick={() => setActiveSection(section.key)}
                          className={`px-2 py-1 text-xs font-medium rounded-t-lg transition-colors ${
                            activeSection === section.key
                              ? 'bg-[#C10003] text-white'
                              : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                          }`}
                        >
                          {section.title}
                        </button>
                      ))}
                    </div>

                    {/* Active Section Content */}
                    {sections.map((section) => (
                      <div
                        key={section.key}
                        className={
                          activeSection === section.key ? 'block' : 'hidden'
                        }
                      >
                        <div className='flex items-center justify-between mb-2'>
                          <label className='block text-xs font-medium text-gray-700'>
                            {section.title}
                          </label>
                        </div>

                        <textarea
                          value={section.data.content}
                          onChange={(e) => {
                            handleCommentChange(
                              section.key as keyof StructuredComments,
                              e.target.value
                            );
                          }}
                          rows={3}
                          className='w-full px-2 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C10003] focus:border-transparent resize-none'
                          placeholder={`Enter your comments for ${section.title.toLowerCase()}...`}
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* Simple Comments Section */}
                {shouldShowSimpleComments() && (
                  <div className='flex-1 p-4 border-b border-gray-200'>
                    <h4 className='text-base font-semibold text-gray-800 mb-3'>
                      {decision === 'Sent to Evaluators'
                        ? 'Comments for Evaluators'
                        : 'Rejection Explanation'}
                    </h4>
                    <textarea
                      value={structuredComments.objectives.content}
                      onChange={(e) =>
                        handleCommentChange('objectives', e.target.value)
                      }
                      rows={4}
                      className='w-full px-2 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C10003] focus:border-transparent resize-none'
                      placeholder={
                        decision === 'Sent to Evaluators'
                          ? 'Enter any comments or instructions for the evaluators...'
                          : 'Provide a clear explanation for rejecting this proposal...'
                      }
                    />
                  </div>
                )}

                {/* Action Buttons */}
                <div className='p-4'>
                  <div className='flex flex-col gap-2'>
                    <button
                      type='button'
                      onClick={onClose}
                      className='w-full px-3 py-2 text-xs text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium'
                    >
                      Cancel
                    </button>
                    {decision === 'Sent to Evaluators' ? (
                      <button
                        type='button'
                        onClick={handleForwardToEvaluators}
                        className='w-full px-3 py-2 text-xs text-white bg-[#C10003] hover:bg-[#A00002] rounded-lg transition-colors font-medium flex items-center justify-center gap-1'
                      >
                        <Send className='w-3 h-3' />
                        <span>Forward to Evaluators</span>
                      </button>
                    ) : decision === 'Assign to RnD' ? (
                        <button
                          type='submit'
                          className='w-full px-3 py-2 text-xs text-white bg-[#C10003] hover:bg-[#A00002] rounded-lg transition-colors font-medium flex items-center justify-center gap-1'
                        >
                           <Beaker className='w-3 h-3' />
                           <span>Assign to R&D</span>
                        </button>
                    ) : (
                      <button
                        type='submit'
                        className='w-full px-3 py-2 text-xs text-white bg-[#C10003] hover:bg-[#A00002] rounded-lg transition-colors font-medium'
                      >
                        {getDecisionButtonText(decision)}
                      </button>
                    )}
                  </div>
                </div>
              </form>
            </div>
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
                <h3 className='text-lg font-semibold text-gray-800'>
                  Proponent Information Visibility
                </h3>
              </div>
              
              <p className='text-sm text-gray-600 mb-6'>
                Choose what information about the proponent will be visible to evaluators:
              </p>

              <div className='space-y-3 mb-6'>
                <label className='flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors'>
                  <input
                    type='radio'
                    name='proponentInfo'
                    value='both'
                    checked={showProponentInfo === 'both'}
                    onChange={() => setShowProponentInfo('both')}
                    className='w-4 h-4 text-[#C10003] bg-gray-100 border-gray-300 focus:ring-[#C10003] focus:ring-2'
                  />
                  <div className='ml-3 flex-1'>
                    <span className='text-sm font-medium text-gray-700'>Show Both Name and Agency</span>
                    <p className='text-xs text-gray-500 mt-1'>Evaluators will see the proponent's full name and agency</p>
                  </div>
                </label>

                <label className='flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors'>
                  <input
                    type='radio'
                    name='proponentInfo'
                    value='name'
                    checked={showProponentInfo === 'name'}
                    onChange={() => setShowProponentInfo('name')}
                    className='w-4 h-4 text-[#C10003] bg-gray-100 border-gray-300 focus:ring-[#C10003] focus:ring-2'
                  />
                  <div className='ml-3 flex-1'>
                    <span className='text-sm font-medium text-gray-700'>Show Name Only</span>
                    <p className='text-xs text-gray-500 mt-1'>Hide agency information, show only proponent name</p>
                  </div>
                </label>

                <label className='flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors'>
                  <input
                    type='radio'
                    name='proponentInfo'
                    value='agency'
                    checked={showProponentInfo === 'agency'}
                    onChange={() => setShowProponentInfo('agency')}
                    className='w-4 h-4 text-[#C10003] bg-gray-100 border-gray-300 focus:ring-[#C10003] focus:ring-2'
                  />
                  <div className='ml-3 flex-1'>
                    <span className='text-sm font-medium text-gray-700'>Show Agency Only</span>
                    <p className='text-xs text-gray-500 mt-1'>Hide proponent name, show only agency information</p>
                  </div>
                </label>
              </div>

              <div className='flex gap-3'>
                <button
                  onClick={() => setShowAnonymitySelection(false)}
                  className='flex-1 px-4 py-3 text-gray-600 bg-transparent hover:bg-gray-50 rounded-lg transition-colors font-medium border border-gray-300'
                >
                  Cancel
                </button>
                <button
                  onClick={submitWithAnonymity}
                  className='flex-1 px-4 py-3 text-white bg-[#C10003] hover:bg-[#A00002] rounded-lg transition-colors font-medium'
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminProposalModal;