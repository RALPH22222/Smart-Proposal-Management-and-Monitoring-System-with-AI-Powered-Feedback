import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Clock,
  Send,
  Eye,
  UserPlus,
  UserMinus,
  User,
  Users,
  Search,
  Filter,
  ClipboardEdit,
  CheckCircle,
  XCircle,
  RefreshCw,
  UserCog,
  Microscope
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
import { fetchUsersByRole, fetchDepartments, fetchRejectionSummary, type UserItem, type RejectionSummary, getProposalUploadUrl } from '../../services/proposal.api';
import { getAutoRedactionUnsupportedReason, redactFile } from '../../utils/file-redactor';
import { buildRedactionTargets } from '../../utils/redaction-targets';
import { getSignedFileUrl } from '../../utils/signed-url';
import SecureImage from '../shared/SecureImage';
import { formatDate } from '../../utils/date-formatter';
import PageLoader from '../shared/PageLoader';

interface AdminProposalModalProps {
  proposal: Proposal | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmitDecision: (_decision: Decision) => void;
  currentUser: Reviewer;
  isLoading?: boolean;
}

const AdminProposalModal: React.FC<AdminProposalModalProps> = ({
  proposal,
  isOpen,
  onClose,
  onSubmitDecision,
  currentUser,
  isLoading = false
}) => {
  // --- REAL DATA FETCHING ---
  const [evaluators, setEvaluators] = useState<Partial<Evaluator>[]>([]);
  const [rndStaffList, setRndStaffList] = useState<Partial<Evaluator>[]>([]);
  const [allDepartments, setAllDepartments] = useState<any[]>([]); // Store all departments
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const loadUsers = async () => {
        setLoadingUsers(true);
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
              email: u.email || '',
              agency: 'WMSU', // Default agency
              avatar: u.profile_picture
            };
          };

          setRndStaffList(rndData.map(mapToEvaluator));
          setEvaluators(evalData.map(mapToEvaluator));

        } catch (error) {
          console.error("Failed to load users", error);
        } finally {
          setLoadingUsers(false);
        }
      };
      loadUsers();
    }
  }, [isOpen]);

  // --- STATE ---
  const [decision, setDecision] = useState<DecisionType | 'Assign to RnD'>('Assign to RnD');
  const [evaluationDeadline, setEvaluationDeadline] = useState('14');
  const [structuredComments, setStructuredComments] = useState<StructuredComments>({
    title: { id: '1', title: 'Title', content: '', lastModified: '', author: currentUser.name },
    budget: { id: '2', title: 'Budget', content: '', lastModified: '', author: currentUser.name },
    timeline: { id: '3', title: 'Timeline', content: '', lastModified: '', author: currentUser.name },
    overall: { id: '4', title: 'Overall', content: '', lastModified: '', author: currentUser.name },
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
  const [showProponentInfo, setShowProponentInfo] = useState<'name' | 'agency' | 'both' | 'none'>('both');

  // File redaction state
  const [isRedacting, setIsRedacting] = useState(false);
  const [redactedFileUrl, setRedactedFileUrl] = useState<string | null>(null);
  const [redactionCount, setRedactionCount] = useState<number>(0);
  const [redactionError, setRedactionError] = useState<string | null>(null);
  const proposalFileUrl = proposal?.documentUrl || proposal?.projectFile || null;
  const autoRedactionUnsupportedReason = getAutoRedactionUnsupportedReason(proposalFileUrl);

  const [activeSection, setActiveSection] = useState<string>('title');
  const [typingSection, setTypingSection] = useState<string>('');

  // Rejection Summary State
  const [rejectionSummary, setRejectionSummary] = useState<RejectionSummary | null>(null);
  const [isLoadingRejection, setIsLoadingRejection] = useState(false);

  // --- EFFECTS ---

  // Reset modal state when proposal changes or modal opens
  useEffect(() => {
    if (isOpen && proposal) {
      setDecision('Assign to RnD');
      setEvaluationDeadline('14');
      setStructuredComments({
        title: { id: '1', title: 'Title', content: '', lastModified: '', author: currentUser.name },
        budget: { id: '2', title: 'Budget', content: '', lastModified: '', author: currentUser.name },
        timeline: { id: '3', title: 'Timeline', content: '', lastModified: '', author: currentUser.name },
        overall: { id: '4', title: 'Overall', content: '', lastModified: '', author: currentUser.name },
        additional: []
      });
      setActiveSection('title');
      setShowAnonymitySelection(false);
      setShowProponentInfo('both');

      // Reset Assignment States
      setEvaluatorSearch('');
      setDepartmentFilter('All');
      setCheckedAvailableIds([]);
      setCheckedAssignedIds([]);
      setAssignedEvaluators([]);
      setSelectedRnDStaff(null);
      setSelectedRnDStaff(null);
    }
  }, [isOpen, proposal, currentUser.name]);

  // Fetch Rejection Summary if applicable
  useEffect(() => {
    if (isOpen && proposal && ['rejected', 'disapproved', 'reject', 'rejected_rnd', 'rejected proposal'].includes((proposal.status || '').toLowerCase())) {
      setIsLoadingRejection(true);
      fetchRejectionSummary(Number(proposal.id))
        .then(setRejectionSummary)
        .catch(() => setRejectionSummary(null))
        .finally(() => setIsLoadingRejection(false));
    } else {
      setRejectionSummary(null);
      setIsLoadingRejection(false);
    }
  }, [isOpen, proposal]);

  // Set default comment for reject decision
  useEffect(() => {
    if (decision === 'Rejected Proposal') {
      setStructuredComments((prev) => ({
        ...prev,
        title: {
          ...prev.title,
          content: prev.title.content || 'After careful review of this proposal, we have determined that it does not meet the required standards for approval. The following concerns have been identified:\n\n1. [Specify main concern]\n2. [Additional concerns if any]\n\nWe recommend that the proponent address these issues before resubmission.',
          lastModified: new Date().toISOString()
        }
      }));
    }
  }, [decision]);

  // Filter Available Evaluators
  useEffect(() => {
    let filtered = evaluators.filter(ev =>
      // Exclude already assigned evaluators
      !assignedEvaluators.some(assigned => assigned.id === ev.id)
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
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proposal) return;

    if (decision === 'Sent to Evaluators') {
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
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await onSubmitDecision(decisionData);
          onClose();
          Swal.fire('Submitted!', 'Your decision has been recorded.', 'success');
        } catch (error: any) {
          console.error("Submission failed:", error);
          Swal.fire('Error', error?.message || 'Failed to submit decision. Please try again.', 'error');
        }
      }
    });
  };

  const handleForwardToEvaluators = () => {
    if (assignedEvaluators.length < 2) {
      Swal.fire({
        icon: "warning",
        title: "Minimum Evaluators Required",
        text: "You must have at least 2 evaluators assigned before forwarding this proposal.",
      });
      return;
    }
    setRedactedFileUrl(null);
    setRedactionCount(0);
    setRedactionError(null);
    setShowAnonymitySelection(true);
  };

  const handleAutoRedact = async () => {
    if (!proposal) return;

    const fileUrl = proposalFileUrl;
    if (!fileUrl) {
      setRedactionError("No proposal file found to redact.");
      return;
    }

    if (autoRedactionUnsupportedReason) {
      setRedactionError(autoRedactionUnsupportedReason);
      return;
    }

    const targets = buildRedactionTargets({
      proponent: proposal.proponent,
      email: proposal.email,
      telephone: proposal.telephone,
      fax: proposal.fax,
      agency: proposal.agency,
      address: proposal.address,
      visibility: showProponentInfo,
    });

    if (targets.length === 0) {
      setRedactionError("No redaction targets. Select 'Hide Name', 'Hide Agency', or 'Hide Both'.");
      return;
    }

    setIsRedacting(true);
    setRedactionError(null);

    try {
      // Fetch the original file. The S3 bucket blocks public access, so a raw
      // fetch(fileUrl) returns 403 Forbidden. Route through /files/signed-url
      // to get a time-limited presigned GET URL, and make sure the bucket's
      // CORS rule allows browser GET/HEAD from this frontend origin.
      const signedUrl = await getSignedFileUrl(fileUrl);
      const response = await fetch(signedUrl);
      if (!response.ok) {
        throw new Error(`Could not load the proposal file (HTTP ${response.status}).`);
      }
      const blob = await response.blob();
      const fileName = fileUrl.split('/').pop()?.split('?')[0] || 'proposal.pdf';
      const originalFile = new File([blob], fileName, { type: blob.type });

      // Redact the file
      const result = await redactFile(originalFile, targets);
      setRedactionCount(result.redactionCount);

      // Upload the redacted file to S3
      const redactedFileName = `redacted-${Date.now()}-${fileName}`;
      const contentType = result.type === 'docx'
        ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        : 'application/pdf';

      const { uploadUrl, fileUrl: s3FileUrl } = await getProposalUploadUrl(
        redactedFileName,
        contentType,
        result.blob.size
      );

      await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': contentType },
        body: result.blob,
      });

      setRedactedFileUrl(s3FileUrl);
    } catch (err: any) {
      console.error("Redaction failed:", err);
      setRedactionError(err.message || "Failed to redact file. You can still upload a manually redacted version.");
    } finally {
      setIsRedacting(false);
    }
  };

  const handleOpenRedactedFile = async () => {
    if (!redactedFileUrl) return;

    try {
      const signedUrl = await getSignedFileUrl(redactedFileUrl);
      window.open(signedUrl, '_blank', 'noopener,noreferrer');
    } catch (err: any) {
      setRedactionError(err.message || 'Failed to open the redacted file.');
    }
  };

  const submitWithAnonymity = async () => {
    if (!proposal) return;

    if (showProponentInfo !== 'both' && !redactedFileUrl) {
      setRedactionError('Attach a redacted file before sending the proposal to evaluators.');
      return;
    }

    const deadlineIso = new Date(Date.now() + parseInt(evaluationDeadline, 10) * 24 * 60 * 60 * 1000).toISOString();

    const decisionData: Decision & {
      proponentInfoVisibility?: 'name' | 'agency' | 'both' | 'none';
      anonymizedFileUrl?: string;
    } = {
      proposalId: proposal.id,
      decision: 'Sent to Evaluators',
      structuredComments,
      attachments: [],
      reviewedBy: currentUser.name,
      reviewedDate: new Date().toISOString(),
      evaluationDeadline: deadlineIso,
      proponentInfoVisibility: showProponentInfo,
      assignedEvaluators: assignedEvaluators.map(ev => ({
        id: ev.id!,
        visibility: showProponentInfo
      })),
      anonymizedFileUrl: redactedFileUrl || undefined,
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
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await onSubmitDecision(decisionData);
          setShowAnonymitySelection(false);
          onClose();
          Swal.fire('Forwarded!', 'Proposal has been sent to evaluators.', 'success');
        } catch (error: any) {
          console.error("Submission failed:", error);
          Swal.fire('Error', error?.message || 'Failed to forward proposal to evaluators. Please try again.', 'error');
        }
      }
    });
  };



  if (!isOpen || !proposal) return null;

  const sections = [
    { key: 'title', title: 'Title Assessment', data: structuredComments.title },
    { key: 'budget', title: 'Budget Assessment', data: structuredComments.budget },
    { key: 'timeline', title: 'Timeline Assessment', data: structuredComments.timeline },
    { key: 'overall', title: 'Overall Asessment', data: structuredComments.overall }
  ];

  return createPortal(
    <>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">

          {/* Header */}
          <div className="p-6 border-b border-slate-100 flex-shrink-0 flex justify-between items-start bg-slate-50/50">
            <div>
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <ClipboardEdit className="w-6 h-6 text-[#C8102E]" />
                Admin Proposal Review
              </h3>
              <p className="text-sm text-slate-500 mt-1 font-medium">{proposal.title}</p>

              <div className="flex items-center gap-4 mt-2">
                {proposal.proponentProfilePicture ? (
                  <SecureImage
                    src={proposal.proponentProfilePicture}
                    alt={proposal.submittedBy}
                    className="w-8 h-8 rounded-full object-cover border border-slate-200 shadow-sm"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200">
                    <User className="w-4 h-4" />
                  </div>
                )}
                <div className="flex flex-col">
                  <div className='flex items-center gap-1 text-xs text-slate-500 font-medium'>
                    <Users className='w-3 h-3' />
                    <span>Submitted by: {proposal.submittedBy}</span>
                  </div>
                  {proposal.evaluationDeadline && (
                    <div className='flex items-center gap-1 text-xs text-slate-400'>
                      <Clock className='w-3 h-3' />
                      <span>Deadline: {formatDate(proposal.evaluationDeadline)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
            <form id="admin-decision-form" onSubmit={handleSubmit} className="space-y-6">

              {/* Current Rejection Status Display */}
              {(rejectionSummary || isLoadingRejection) && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-5 animate-in fade-in slide-in-from-top-2">
                  <h4 className="flex items-center gap-2 text-sm font-bold text-red-800 mb-3">
                    <XCircle className={`w-4 h-4 ${isLoadingRejection ? "animate-spin" : ""}`} />
                    Rejection Reason
                  </h4>

                  {isLoadingRejection ? (
                    <div className="flex flex-col items-center justify-center py-6 text-red-400">
                      <RefreshCw className="w-5 h-5 animate-spin mb-1" />
                      <span className="text-xs">Loading rejection details...</span>
                    </div>
                  ) : (
                    rejectionSummary && (
                      <div className="bg-white p-3 rounded-lg border border-red-100/50 shadow-sm">
                        <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">{rejectionSummary.comment}</p>
                        {rejectionSummary.created_at && (
                          <div className="mt-3 text-[10px] text-slate-400 italic text-right">
                            Rejected on: {formatDate(rejectionSummary.created_at)}
                          </div>
                        )}
                      </div>
                    )
                  )}
                </div>
              )}

              {/* Decision Selection Grid */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-3">
                  Decision <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-4 gap-2">

                  {/* Assign to RnD */}
                  <button
                    type="button"
                    onClick={() => setDecision('Assign to RnD')}
                    className={`relative p-2 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all duration-200 h-28 ${decision === 'Assign to RnD'
                      ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-md transform scale-[1.02]'
                      : 'border-slate-200 hover:border-blue-200 hover:bg-blue-50/30 text-slate-500 hover:text-blue-600'
                      }`}
                  >
                    {decision === 'Assign to RnD' && <div className="absolute top-2 right-2"><CheckCircle className="w-4 h-4 text-blue-600" /></div>}
                    <Microscope className={`w-6 h-6 ${decision === 'Assign to RnD' ? 'text-blue-600' : 'text-current'}`} />
                    <span className="font-bold text-xs text-center leading-tight">Assign to R&D</span>
                  </button>

                  {/* Sent to Evaluators */}
                  <button
                    type="button"
                    onClick={() => setDecision('Sent to Evaluators')}
                    className={`relative p-2 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all duration-200 h-28 ${decision === 'Sent to Evaluators'
                      ? 'border-purple-500 bg-purple-50 text-purple-700 shadow-md transform scale-[1.02]'
                      : 'border-slate-200 hover:border-purple-200 hover:bg-purple-50/30 text-slate-500 hover:text-purple-600'
                      }`}
                  >
                    {decision === 'Sent to Evaluators' && <div className="absolute top-2 right-2"><CheckCircle className="w-4 h-4 text-purple-600" /></div>}
                    <Users className={`w-6 h-6 ${decision === 'Sent to Evaluators' ? 'text-purple-600' : 'text-current'}`} />
                    <span className="font-bold text-xs text-center leading-tight">Forward to Evaluators</span>
                  </button>

                  {/* Revision Required */}
                  <button
                    type="button"
                    onClick={() => setDecision('Revision Required')}
                    className={`relative p-2 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all duration-200 h-28 ${decision === 'Revision Required'
                      ? 'border-amber-500 bg-amber-50 text-amber-700 shadow-md transform scale-[1.02]'
                      : 'border-slate-200 hover:border-amber-200 hover:bg-amber-50/30 text-slate-500 hover:text-amber-600'
                      }`}
                  >
                    {decision === 'Revision Required' && <div className="absolute top-2 right-2"><CheckCircle className="w-4 h-4 text-amber-600" /></div>}
                    <RefreshCw className={`w-6 h-6 ${decision === 'Revision Required' ? 'text-amber-600' : 'text-current'}`} />
                    <span className="font-bold text-xs text-center leading-tight">Request Revision</span>
                  </button>

                  {/* Reject */}
                  <button
                    type="button"
                    onClick={() => setDecision('Rejected Proposal')}
                    className={`relative p-2 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all duration-200 h-28 ${decision === 'Rejected Proposal'
                      ? 'border-red-500 bg-red-50 text-red-700 shadow-md transform scale-[1.02]'
                      : 'border-slate-200 hover:border-red-200 hover:bg-red-50/30 text-slate-500 hover:text-red-600'
                      }`}
                  >
                    {decision === 'Rejected Proposal' && <div className="absolute top-2 right-2"><CheckCircle className="w-4 h-4 text-red-600" /></div>}
                    <XCircle className={`w-6 h-6 ${decision === 'Rejected Proposal' ? 'text-red-600' : 'text-current'}`} />
                    <span className="font-bold text-xs text-center leading-tight">Reject Proposal</span>
                  </button>

                </div>
              </div>

              {/* Dynamic Content Area */}
              <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">

                {/* Time Limit Section (Not for R&D Assign) */}
                {(decision === 'Sent to Evaluators' || decision === 'Revision Required') && (
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <h4 className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-3">
                      <Clock className="w-4 h-4 text-slate-500" />
                      {decision === 'Sent to Evaluators' ? 'Evaluation Time Limit' : 'Revision Time Limit'}
                    </h4>
                    <div className="space-y-2">
                      <label className="block text-xs font-medium text-slate-500 uppercase">
                        {decision === 'Sent to Evaluators' ? 'Deadline for evaluators:' : 'Deadline for proponent:'}
                      </label>
                      <select
                        value={evaluationDeadline}
                        onChange={(e) => setEvaluationDeadline(e.target.value)}
                        className="w-full sm:w-1/2 px-3 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-transparent transition-all shadow-sm"
                      >
                        <option value="7">1 Week</option>
                        <option value="14">2 Weeks</option>
                        <option value="21">3 Weeks</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* R&D Staff Assignment */}
                {decision === 'Assign to RnD' && (
                  <div className="bg-blue-50/50 p-5 rounded-xl border border-blue-100 custom-scrollbar">
                    <h4 className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-4">
                      <Microscope className="w-4 h-4 text-blue-600" />
                      Select R&D Staff Member
                    </h4>

                    {/* Toolbar */}
                    <div className="flex flex-col sm:flex-row gap-3 mb-4">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Search R&D staff..."
                          value={evaluatorSearch}
                          onChange={(e) => setEvaluatorSearch(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                      <div className="relative sm:w-1/3">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <select
                          value={departmentFilter}
                          onChange={(e) => setDepartmentFilter(e.target.value)}
                          className="w-full pl-9 pr-8 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none appearance-none bg-white"
                        >
                          <option value="All">All Departments</option>
                          {allDepartments.map(dept => (
                            <option key={dept.id} value={dept.name}>{dept.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* R&D List */}
                    <div className="bg-white border border-blue-200 rounded-lg h-56 overflow-y-auto p-2 space-y-1 custom-scrollbar shadow-sm">
                      {loadingUsers ? (
                        <PageLoader mode="staff-list" className="h-full" />
                      ) : (
                        rndStaffList
                          .filter(staff => {
                            const matchName = !evaluatorSearch || (staff.name && staff.name.toLowerCase().includes(evaluatorSearch.toLowerCase()));
                            const matchDept = departmentFilter === 'All' || staff.department === departmentFilter;
                            return matchName && matchDept;
                          })
                          .map((staff) => (
                            <label key={staff.id} className={`flex items-start p-3 rounded-lg cursor-pointer border transition-all duration-200 group ${selectedRnDStaff?.id === staff.id ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500 shadow-sm' : 'bg-white border-transparent hover:bg-slate-50 hover:border-slate-200'}`}>
                              <input
                                type="radio"
                                name="rndStaff"
                                checked={selectedRnDStaff?.id === staff.id}
                                onChange={() => setSelectedRnDStaff(staff)}
                                className="mt-2 w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                              />
                              <div className="ml-3 flex items-center gap-3 flex-1">
                                <SecureImage
                                  src={staff.avatar}
                                  fallbackSrc={`https://ui-avatars.com/api/?name=${encodeURIComponent(staff.name || '?')}&background=C8102E&color=fff&size=128`}
                                  alt={staff.name}
                                  className="w-10 h-10 rounded-full object-cover border border-slate-200 shadow-sm"
                                />
                                <div>
                                  <p className={`text-sm font-bold ${selectedRnDStaff?.id === staff.id ? 'text-blue-800' : 'text-slate-800'}`}>{staff.name}</p>
                                  <p className="text-xs text-slate-500">{staff.email}</p>
                                  <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-slate-100 text-slate-500 border border-slate-200">
                                    {staff.department}
                                  </span>
                                </div>
                              </div>
                            </label>
                          ))
                      )}
                    </div>
                  </div>
                )}

                {/* Evaluator Assignment Section (Existing Logic, New Style) */}
                {decision === 'Sent to Evaluators' && (
                  <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 custom-scrollbar">
                    <h4 className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-4">
                      <Users className="w-4 h-4 text-slate-500" />
                      Assign Evaluators
                    </h4>

                    {/* Toolbar */}
                    <div className="flex flex-col sm:flex-row gap-3 mb-4">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Search evaluators..."
                          value={evaluatorSearch}
                          onChange={(e) => setEvaluatorSearch(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#C8102E] focus:outline-none"
                        />
                      </div>
                      <div className="relative sm:w-1/3">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <select
                          value={departmentFilter}
                          onChange={(e) => setDepartmentFilter(e.target.value)}
                          className="w-full pl-9 pr-8 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#C8102E] focus:outline-none appearance-none bg-white"
                        >
                          <option value="All">All Departments</option>
                          {allDepartments.map(dept => (
                            <option key={dept.id} value={dept.name}>{dept.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Available List */}
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold text-slate-500 uppercase">Available</span>
                        <span className="text-xs font-medium text-slate-400">{checkedAvailableIds.length} selected</span>
                      </div>
                      <div className="bg-white border border-slate-200 rounded-lg h-40 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                        {availableEvaluators.length === 0 ? (
                          <div className="h-full flex items-center justify-center text-xs text-slate-400 italic">No evaluators found</div>
                        ) : (
                          availableEvaluators.map(ev => (
                            <label key={ev.id} className="flex items-center p-2 hover:bg-slate-50 rounded-md cursor-pointer group transition-colors">
                              <input
                                type="checkbox"
                                checked={checkedAvailableIds.includes(ev.id!)}
                                onChange={() => handleAvailableCheckboxChange(ev.id!)}
                                className="w-4 h-4 text-[#C8102E] rounded border-slate-300 focus:ring-[#C8102E]"
                              />
                              <div className="ml-3">
                                <p className="text-sm font-medium text-slate-700 group-hover:text-slate-900">{ev.name}</p>
                                <p className="text-[10px] text-slate-500">{ev.department} • {ev.email}</p>
                              </div>
                            </label>
                          ))
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={handleAddSelectedEvaluators}
                        disabled={checkedAvailableIds.length === 0}
                        className="mt-2 w-full py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 text-xs font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-blue-200 flex items-center justify-center gap-2"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        Add Selected
                      </button>
                    </div>

                    {/* Assigned List */}
                    <div className="pt-4 border-t border-slate-200">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold text-slate-500 uppercase">Assigned ({assignedEvaluators.length})</span>

                      </div>
                      {assignedEvaluators.length === 0 ? (
                        <div className="text-xs text-slate-400 italic text-center py-4 bg-white border border-dashed border-slate-200 rounded-lg">No evaluators assigned</div>
                      ) : (
                        <div className="space-y-2">
                          <div className="bg-emerald-50/50 border border-emerald-100 rounded-lg h-32 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                            {assignedEvaluators.map(ev => (
                              <label key={ev.id} className="flex items-center p-2 bg-white border border-emerald-100/50 rounded-md shadow-sm cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={checkedAssignedIds.includes(ev.id!)}
                                  onChange={() => handleAssignedCheckboxChange(ev.id!)}
                                  className="w-4 h-4 text-red-500 rounded border-slate-300 focus:ring-red-500"
                                />
                                <div className="ml-3 flex-1 flex justify-between items-center">
                                  <div>
                                    <p className="text-xs font-bold text-slate-700">{ev.name}</p>
                                    <p className="text-[10px] text-slate-500">{ev.department}</p>
                                  </div>
                                  <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-bold">
                                    {ev.name?.charAt(0)}
                                  </div>
                                </div>
                              </label>
                            ))}
                          </div>
                          <button
                            type="button"
                            onClick={handleRemoveSelectedEvaluators}
                            disabled={checkedAssignedIds.length === 0}
                            className="w-full py-2 bg-red-50 text-red-600 hover:bg-red-100 text-xs font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-red-200 flex items-center justify-center gap-2"
                          >
                            <UserMinus className="w-3.5 h-3.5" />
                            Remove Selected
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Structured Comments */}
                {decision === 'Revision Required' && (
                  <div>
                    <div className="flex items-center gap-1 mb-2">
                      {sections.map(s => (
                        <button
                          key={s.key}
                          type="button"
                          onClick={() => setActiveSection(s.key)}
                          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${activeSection === s.key
                            ? 'bg-[#C8102E] text-white shadow-md'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                        >
                          {s.title.split(' ')[0]}
                        </button>
                      ))}
                    </div>
                    {sections.map(s => (
                      <div key={s.key} className={activeSection === s.key ? 'block animate-in fade-in' : 'hidden'}>
                        <label className="block text-sm font-bold text-slate-700 mb-2">{s.title}</label>
                        <textarea
                          value={s.data.content}
                          onChange={(e) => handleCommentChange(s.key as keyof StructuredComments, e.target.value)}
                          className="w-full h-32 p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#C8102E] focus:border-transparent outline-none resize-none text-sm shadow-sm"
                          placeholder={`Enter specific feedback regarding ${s.title.toLowerCase()}...`}
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* Simple TextArea */}
                {(decision === 'Sent to Evaluators' || decision === 'Rejected Proposal') && (
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      {decision === 'Sent to Evaluators' ? 'Instructions for Evaluators' : 'Reason for Rejection'} <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={structuredComments.title.content}
                      onChange={(e) => handleCommentChange('title', e.target.value)}
                      className="w-full h-32 p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#C8102E] focus:border-transparent outline-none resize-none text-sm shadow-sm placeholder:text-slate-400"
                      placeholder={decision === 'Sent to Evaluators' ? 'Add any specific instructions or focus areas for the evaluators...' : 'Please provide a detailed explanation for why this proposal is being rejected...'}
                    />
                  </div>
                )}

              </div>
            </form>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Cancel
            </button>

            {decision === 'Assign to RnD' ? (
              <button
                type="button"
                onClick={(e) => handleSubmit(e as any)}
                disabled={!selectedRnDStaff || isLoading}
                className="px-6 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-lg shadow-blue-200 transition-all transform hover:scale-[1.02] flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:transform-none"
              >
                {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <UserCog className="w-4 h-4" />}
                Confirm Assignment
              </button>
            ) : decision === 'Sent to Evaluators' ? (
              <button
                type="button"
                onClick={handleForwardToEvaluators}
                disabled={assignedEvaluators.length === 0 || isLoading}
                className="px-6 py-2.5 text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-lg shadow-purple-200 transition-all transform hover:scale-[1.02] flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:transform-none"
              >
                {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Forward to Evaluators
              </button>
            ) : (
              <button
                type="button"
                onClick={(e) => handleSubmit(e as any)}
                disabled={isLoading}
                className={`px-6 py-2.5 text-sm font-bold text-white rounded-lg shadow-lg transition-all transform hover:scale-[1.02] flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:transform-none ${decision === 'Revision Required'
                  ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-200'
                  : 'bg-red-600 hover:bg-red-700 shadow-red-200'
                  }`}
              >
                {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : (decision === 'Revision Required' ? <RefreshCw className="w-4 h-4" /> : <XCircle className="w-4 h-4" />)}
                {decision === 'Revision Required' ? 'Request Revision' : 'Reject Proposal'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Anonymity Selection Modal */}
      {showAnonymitySelection && (
        <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-[300] p-4 animate-in fade-in'>
          <div className='bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[85vh] overflow-hidden flex flex-col'>
            <div className='p-6 overflow-y-auto flex-1'>
              <div className='flex items-center gap-3 mb-4'>
                <div className="p-3 bg-purple-100 rounded-full">
                  <Eye className='w-6 h-6 text-purple-600' />
                </div>
                <h3 className='text-lg font-bold text-slate-800'>Visibility Settings</h3>
              </div>
              <p className='text-sm text-slate-600 mb-6 leading-relaxed'>
                Control how much information about the proponent is visible to the assigned evaluators.
              </p>

              <div className='space-y-3 mb-8'>
                {['both', 'name', 'agency', 'none'].map((val) => (
                  <label key={val} className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all ${showProponentInfo === val ? 'border-purple-500 bg-purple-50' : 'border-slate-200 hover:border-purple-200 hover:bg-slate-50'}`}>
                    <input type='radio' name='proponentInfo' value={val} checked={showProponentInfo === val} onChange={() => setShowProponentInfo(val as any)} className='w-4 h-4 text-purple-600 focus:ring-purple-500' />
                    <div className='ml-3'>
                      <span className='text-sm font-bold text-slate-700 capitalize'>
                        {val === 'both' ? 'Show Full Details' :
                          val === 'name' ? 'Hide Agency Only' :
                            val === 'agency' ? 'Hide Name Only' :
                              'Hide Both'}
                      </span>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {val === 'both' ? 'Evaluators see name and agency.' :
                          val === 'name' ? 'Evaluators see name, agency is hidden.' :
                            val === 'agency' ? 'Evaluators see agency, name is hidden.' :
                              'Evaluators see neither name nor agency.'}
                      </p>
                    </div>
                  </label>
                ))}
              </div>

              {/* File Anonymization Section */}
              {showProponentInfo !== 'both' && (
                <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <h4 className="text-sm font-bold text-amber-800 mb-2">File Anonymization</h4>
                  <p className="text-xs text-amber-700 mb-3">
                    Auto-redact scans the current proposal file for the selected proponent details and/or agency details, blacks out matching text, and uploads a new anonymized copy.
                  </p>
                  <p className="text-xs text-amber-700 mb-3">
                    Hiding the name also redacts direct contact details such as email, telephone, and fax when those values are available. Supported auto-redact formats: PDF and DOCX. Use Upload Redacted File for legacy DOC files or when you want to review edits manually before sending.
                  </p>

                  {autoRedactionUnsupportedReason && (
                    <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                      {autoRedactionUnsupportedReason}
                    </p>
                  )}

                  <div className="flex gap-2 mb-2">
                    <button
                      type="button"
                      onClick={handleAutoRedact}
                      disabled={isRedacting || isLoading || Boolean(autoRedactionUnsupportedReason)}
                      title={autoRedactionUnsupportedReason ?? undefined}
                      className="flex-1 px-3 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isRedacting ? 'Redacting...' : 'Auto-Redact File'}
                    </button>
                    <label className={`flex-1 px-3 py-2 text-xs font-bold text-amber-700 bg-white border border-amber-300 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer text-center ${isRedacting || isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      Upload Redacted File
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        disabled={isRedacting || isLoading}
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setIsRedacting(true);
                          setRedactionError(null);
                          try {
                            const contentType = file.type || 'application/pdf';
                            const { uploadUrl, fileUrl: s3FileUrl } = await getProposalUploadUrl(
                              `redacted-${Date.now()}-${file.name}`,
                              contentType,
                              file.size
                            );
                            await fetch(uploadUrl, {
                              method: 'PUT',
                              headers: { 'Content-Type': contentType },
                              body: file,
                            });
                            setRedactedFileUrl(s3FileUrl);
                            setRedactionCount(-1);
                          } catch (err: any) {
                            setRedactionError(err.message || 'Failed to upload file.');
                          } finally {
                            setIsRedacting(false);
                            e.target.value = '';
                          }
                        }}
                      />
                    </label>
                  </div>

                  {redactionError && (
                    <p className="text-xs text-red-600 mt-2">{redactionError}</p>
                  )}

                  {redactedFileUrl && (
                    <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-xs text-green-700 font-bold">
                        {redactionCount >= 0
                          ? `File redacted successfully (${redactionCount} instance${redactionCount !== 1 ? 's' : ''} found).`
                          : 'Manually redacted file uploaded successfully.'}
                      </p>
                      <p className="text-xs text-green-600 mt-1">
                        Evaluators will receive the anonymized version.
                      </p>
                      <button
                        type="button"
                        onClick={handleOpenRedactedFile}
                        className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-green-700 hover:text-green-800 underline underline-offset-2"
                      >
                        <Eye className="w-3 h-3" />
                        Open redacted file
                      </button>
                    </div>
                  )}

                  {!redactedFileUrl && !isRedacting && (
                    <p className="text-xs text-slate-500 mt-1">
                      If you skip this step, evaluators will receive the original file which may contain identifiable information.
                    </p>
                  )}
                </div>
              )}

              <div className='flex gap-3'>
                <button onClick={() => setShowAnonymitySelection(false)} disabled={isLoading} className='flex-1 px-4 py-2.5 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50'>Cancel</button>
                <button onClick={submitWithAnonymity} disabled={isLoading || isRedacting} className='flex-1 px-4 py-2.5 text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-lg shadow-purple-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed'>
                  {isLoading ? 'Sending...' : 'Confirm & Send'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>,
    document.body
  );
};

export default AdminProposalModal;
