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
  Filter,
  ClipboardEdit,
  CheckCircle,
  XCircle,
  RefreshCw
} from 'lucide-react';
import {
  type Proposal,
  type Decision,
  type DecisionType,
  type StructuredComments,
  type CommentSection,
  type CollaborationSession,
  type Reviewer
} from '../../types/InterfaceProposal';
import { type Evaluator } from '../../types/evaluator';
import { fetchUsersByRole, fetchRevisionSummary, fetchRejectionSummary, type RevisionSummary, type RejectionSummary, getProponentExtensionRequests, reviewProponentExtension, type ProponentExtensionRequest, getProposalUploadUrl } from '../../services/proposal.api';
import Swal from 'sweetalert2';
import { formatDate, formatDateTime } from '../../utils/date-formatter';
import { redactFile } from '../../utils/file-redactor';

// --- HELPER COMPONENT: Evaluator List Modal ---
interface EvaluatorListModalProps {
  evaluators: string[];
  isOpen: boolean;
  onClose: () => void;
}

const EvaluatorListModal: React.FC<EvaluatorListModalProps> = ({
  evaluators,
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 animate-in fade-in">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b bg-slate-50">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-[#C8102E]" />
            <h2 className="font-bold text-slate-800">Assigned Evaluators</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200 transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-3 max-h-[400px] overflow-y-auto">
          {(!evaluators || evaluators.length === 0) ? (
            <div className="text-center py-8">
              <p className="text-sm text-slate-500">No evaluators assigned yet.</p>
            </div>
          ) : (
            evaluators.map((name, index) => (
              <div key={index} className="flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-100 shadow-sm">
                <div className="w-8 h-8 rounded-full bg-[#C8102E] text-white flex items-center justify-center text-xs font-bold">
                  {/* No profile pic in this helper modal data yet, just name. Keeping simple or could pass object.*/}
                  {name.charAt(0)}
                </div>
                <span className="text-sm font-medium text-slate-700">{name}</span>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t bg-slate-50 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-white border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// --- MAIN MODAL COMPONENT ---

interface RnDProposalModalProps {
  proposal: Proposal | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmitDecision: (decision: Decision) => void;
  userRole: 'R&D Staff' | 'Evaluator';
  collaborationSession?: CollaborationSession;
  currentUser: Reviewer;
}

const RnDProposalModal: React.FC<RnDProposalModalProps> = ({
  proposal,
  isOpen,
  onClose,
  onSubmitDecision,
  userRole,
  collaborationSession,
  currentUser
}) => {
  // --- STATE ---
  const [evaluators, setEvaluators] = useState<Partial<Evaluator>[]>([]);
  const [isLoadingEvaluators, setIsLoadingEvaluators] = useState(false);

  const [decision, setDecision] = useState<DecisionType>('Sent to Evaluators');
  const [evaluationDeadline, setEvaluationDeadline] = useState('14');
  const [customRevisionValue, setCustomRevisionValue] = useState(7);
  const [customRevisionUnit, setCustomRevisionUnit] = useState<'days' | 'weeks'>('days');
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
  const [showMatchedOnly, setShowMatchedOnly] = useState(false);
  const [availableEvaluators, setAvailableEvaluators] = useState<Partial<Evaluator>[]>([]);

  // Selection States
  const [checkedAvailableIds, setCheckedAvailableIds] = useState<string[]>([]);
  const [checkedAssignedIds, setCheckedAssignedIds] = useState<string[]>([]);
  const [assignedEvaluators, setAssignedEvaluators] = useState<Partial<Evaluator>[]>([]);

  // Evaluator List Modal State
  const [isEvaluatorModalOpen, setIsEvaluatorModalOpen] = useState(false);

  const [showAnonymitySelection, setShowAnonymitySelection] = useState(false);
  const [showProponentInfo, setShowProponentInfo] = useState<'name' | 'agency' | 'both' | 'none'>('both');

  // File redaction state
  const [isRedacting, setIsRedacting] = useState(false);
  const [redactedFileUrl, setRedactedFileUrl] = useState<string | null>(null);
  const [redactionCount, setRedactionCount] = useState<number>(0);
  const [redactionError, setRedactionError] = useState<string | null>(null);

  const [activeSection, setActiveSection] = useState<string>('title');
  const [typingSection, setTypingSection] = useState<string>('');
  const [revisionSummary, setRevisionSummary] = useState<RevisionSummary | null>(null);
  const [isLoadingRevision, setIsLoadingRevision] = useState(false);
  const [rejectionSummary, setRejectionSummary] = useState<RejectionSummary | null>(null);
  const [isLoadingRejection, setIsLoadingRejection] = useState(false);

  // Extension request state
  const [pendingExtension, setPendingExtension] = useState<ProponentExtensionRequest | null>(null);
  const [extensionDeadlineDays, setExtensionDeadlineDays] = useState(7);
  const [extensionReviewNote, setExtensionReviewNote] = useState('');
  const [isReviewingExtension, setIsReviewingExtension] = useState(false);

  // --- EFFECTS ---

  // Fetch evaluators when modal opens
  // Fetch Revision Summary if applicable
  useEffect(() => {
    if (isOpen && proposal && ['revise', 'revision', 'revision_rnd', 'revision required', 'under r&d review', 'not_submitted'].includes((proposal.status || '').toLowerCase())) {
      setIsLoadingRevision(true);
      fetchRevisionSummary(Number(proposal.id))
        .then(setRevisionSummary)
        .catch(() => setRevisionSummary(null))
        .finally(() => setIsLoadingRevision(false));
    } else {
      setRevisionSummary(null);
      setIsLoadingRevision(false);
    }
  }, [isOpen, proposal]);

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

  // Fetch pending extension requests
  useEffect(() => {
    if (isOpen && proposal && (proposal.status || '').toLowerCase() === 'not_submitted') {
      getProponentExtensionRequests(Number(proposal.id))
        .then((requests) => {
          const pending = requests.find(r => r.status === 'pending') || null;
          setPendingExtension(pending);
        })
        .catch(() => setPendingExtension(null));
    } else {
      setPendingExtension(null);
    }
  }, [isOpen, proposal]);

  // Fetch evaluators when modal opens
  useEffect(() => {
    if (isOpen) {
      const loadEvaluators = async () => {
        try {
          setIsLoadingEvaluators(true);
          const users = await fetchUsersByRole('evaluator');
          console.log("Fetched Evaluators:", users); // DEBUG LOG
          const mappedEvaluators: Partial<Evaluator>[] = users.map(u => ({
            id: u.id,
            name: `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email || 'Unknown',
            email: u.email || '',
            department: u.departments?.[0]?.name || 'N/A',
            agency: 'WMSU',
            availabilityStatus: 'Available',
          }));
          setEvaluators(mappedEvaluators);
        } catch (error) {
          console.error("Failed to load evaluators:", error);
        } finally {
          setIsLoadingEvaluators(false);
        }
      };
      loadEvaluators();
    }
  }, [isOpen]);

  // Reset modal state
  useEffect(() => {
    if (isOpen && proposal) {
      setDecision('Sent to Evaluators');
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
      setShowProponentInfo(proposal.proponentInfoVisibility || 'both');

      // Reset Assignment States
      setEvaluatorSearch('');
      setDepartmentFilter('All');
      setShowMatchedOnly(false);
      setCheckedAvailableIds([]);
      setCheckedAssignedIds([]);
      setAssignedEvaluators([]);
      setIsEvaluatorModalOpen(false);
    }
  }, [isOpen, proposal?.id, currentUser.name]);

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

  // Helper: check if evaluator's department matches the proposal's department
  const isDepartmentMatch = (ev: Partial<Evaluator>) => {
    if (!proposal?.department || !ev.department || ev.department === 'N/A') return false;
    return ev.department === proposal.department;
  };

  // Filter Available Evaluators
  useEffect(() => {
    let filtered = evaluators.filter(ev =>
      // 1. Exclude already assigned
      !assignedEvaluators.some(assigned => assigned.id === ev.id) &&
      // 2. Only show Available
      ev.availabilityStatus === 'Available'
    );

    // Apply Department Filter
    if (departmentFilter !== 'All') {
      filtered = filtered.filter(ev => ev.department === departmentFilter);
    }

    // Apply "Show matched only" filter
    if (showMatchedOnly) {
      filtered = filtered.filter(ev => isDepartmentMatch(ev));
    }

    // Apply Search Filter (Name Only)
    if (evaluatorSearch.trim()) {
      const lowerSearch = evaluatorSearch.toLowerCase();
      filtered = filtered.filter(ev =>
        (ev.name && ev.name.toLowerCase().includes(lowerSearch)) ||
        (ev.agency && ev.agency.toLowerCase().includes(lowerSearch))
      );
    }

    // Sort: matched evaluators first
    filtered.sort((a, b) => {
      const aMatch = isDepartmentMatch(a) ? 0 : 1;
      const bMatch = isDepartmentMatch(b) ? 0 : 1;
      return aMatch - bMatch;
    });

    setAvailableEvaluators(filtered);
  }, [evaluatorSearch, departmentFilter, showMatchedOnly, assignedEvaluators, evaluators, proposal?.department]);

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

  const handleExtensionReview = async (action: "approved" | "rejected") => {
    if (!pendingExtension || !proposal) return;
    const confirmText = action === "approved"
      ? `Approve extension and give ${extensionDeadlineDays} day(s)?`
      : "Reject extension and close this proposal?";
    const result = await Swal.fire({
      title: action === "approved" ? "Approve Extension" : "Reject Extension",
      text: confirmText,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: action === "approved" ? "#16a34a" : "#dc2626",
      confirmButtonText: action === "approved" ? "Approve" : "Reject",
    });
    if (!result.isConfirmed) return;

    setIsReviewingExtension(true);
    try {
      await reviewProponentExtension({
        extension_request_id: pendingExtension.id,
        proposal_id: Number(proposal.id),
        action,
        review_note: extensionReviewNote || undefined,
        new_deadline_days: action === "approved" ? extensionDeadlineDays : undefined,
      });
      await Swal.fire({
        icon: "success",
        title: action === "approved" ? "Extension Approved" : "Extension Rejected",
        text: action === "approved"
          ? `Proponent has been given ${extensionDeadlineDays} day(s) to submit their revision.`
          : "The proposal has been rejected.",
        confirmButtonColor: "#C8102E",
      });
      onClose();
    } catch (error: any) {
      const msg = error?.response?.data?.message || "Failed to process extension review.";
      await Swal.fire({ icon: "error", title: "Error", text: msg, confirmButtonColor: "#C8102E" });
    } finally {
      setIsReviewingExtension(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!proposal) return;

    if (decision === 'Sent to Evaluators') {
      if (assignedEvaluators.length < 2) {
        alert("Please assign at least 2 evaluators.");
        return;
      }
      handleForwardToEvaluators();
      return;
    }

    if (decision === 'Revision Required') {
      const hasComment = Object.values(structuredComments)
        .filter(val => typeof val === 'object' && val.content)
        .some((section: any) => section.content && section.content.trim() !== '');

      if (!hasComment) {
        alert("Please provide at least one comment for revision.");
        return;
      }
    }

    const revisionDays = decision === 'Revision Required' && evaluationDeadline === 'custom'
      ? customRevisionUnit === 'weeks' ? customRevisionValue * 7 : customRevisionValue
      : evaluationDeadline;
    const effectiveDeadline = decision === 'Revision Required' ? String(revisionDays) : evaluationDeadline;

    const decisionData: Decision = {
      proposalId: proposal.id,
      decision: decision as DecisionType,
      structuredComments,
      attachments: [],
      reviewedBy: currentUser.name,
      reviewedDate: new Date().toISOString(),
      evaluationDeadline: effectiveDeadline
    };

    onSubmitDecision(decisionData);
    onClose();
  };

  const handleForwardToEvaluators = () => {
    setRedactedFileUrl(null);
    setRedactionCount(0);
    setRedactionError(null);
    setShowAnonymitySelection(true);
  };

  const handleAutoRedact = async () => {
    if (!proposal) return;

    const fileUrl = proposal.documentUrl || proposal.projectFile;
    if (!fileUrl) {
      setRedactionError("No proposal file found to redact.");
      return;
    }

    // Build targets based on visibility setting
    const targets: string[] = [];
    const shouldHideName = showProponentInfo === 'agency' || showProponentInfo === 'none';
    const shouldHideAgency = showProponentInfo === 'name' || showProponentInfo === 'none';

    if (shouldHideName && proposal.proponent) {
      targets.push(proposal.proponent);
      // Also add individual name parts
      const nameParts = proposal.proponent.split(' ').filter((p: string) => p.length > 2);
      targets.push(...nameParts);
    }
    if (shouldHideAgency && proposal.agency && proposal.agency !== 'N/A') {
      targets.push(proposal.agency);
    }

    if (targets.length === 0) {
      setRedactionError("No redaction targets. Select 'Hide Name', 'Hide Agency', or 'Hide Both'.");
      return;
    }

    setIsRedacting(true);
    setRedactionError(null);

    try {
      // Fetch the original file
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      const fileName = fileUrl.split('/').pop() || 'proposal.pdf';
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

  const submitWithAnonymity = () => {
    if (!proposal) return;

    const decisionData: Decision & {
      proponentInfoVisibility?: 'name' | 'agency' | 'both' | 'none';
      assignedEvaluators?: string[];
      anonymizedFileUrl?: string;
    } = {
      proposalId: proposal.id,
      decision: 'Sent to Evaluators',
      structuredComments,
      attachments: [],
      reviewedBy: currentUser.name,
      reviewedDate: new Date().toISOString(),
      evaluationDeadline: evaluationDeadline,
      proponentInfoVisibility: showProponentInfo,
      assignedEvaluators: assignedEvaluators.map(ev => ev.id!),
      anonymizedFileUrl: redactedFileUrl || undefined,
    };

    onSubmitDecision(decisionData);
    setShowAnonymitySelection(false);
    onClose();
  };



  if (!isOpen || !proposal) return null;

  const sections = [
    { key: 'title', title: 'Title Assessment', data: structuredComments.title },
    { key: 'budget', title: 'Budget Assessment', data: structuredComments.budget },
    { key: 'timeline', title: 'Timeline Assessment', data: structuredComments.timeline },
    { key: 'overall', title: 'Overall Assessment', data: structuredComments.overall }
  ];

  // Derive Departments for Filter
  const departments = ['All', ...new Set(evaluators.map(e => e.department).filter(Boolean))];

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">

          {/* Header */}
          <div className="p-6 border-b border-slate-100 flex-shrink-0 flex justify-between items-start bg-slate-50/50">
            <div>
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <ClipboardEdit className="w-6 h-6 text-[#C8102E]" />
                {userRole === 'R&D Staff' ? 'Review Proposal' : 'Evaluate Proposal'}
              </h3>
              <p className="text-sm text-slate-500 mt-1 font-medium">{proposal.title}</p>

              <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                {proposal.evaluationDeadline && (
                  <div className='flex items-center gap-1'>
                    <Clock className='w-3 h-3' />
                    <span>Deadline: {formatDate(proposal.evaluationDeadline)}</span>
                  </div>
                )}
                {userRole === 'Evaluator' && collaborationSession && (
                  <div className='flex items-center gap-1'>
                    <Users className='w-3 h-3' />
                    <span>{collaborationSession.activeEvaluators.length} evaluators active</span>
                  </div>
                )}
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
            <form id="decision-form" onSubmit={handleSubmit} className="space-y-6">

              {/* Current Rejection Status */}
              {(rejectionSummary || isLoadingRejection) && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-5 animate-in fade-in slide-in-from-top-2 mb-6">
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

              {/* Current Revision Status */}
              {(revisionSummary || isLoadingRevision) && (
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-5 animate-in fade-in slide-in-from-top-2 mb-6">
                  <h4 className="flex items-center gap-2 text-sm font-bold text-orange-800 mb-3">
                    <RefreshCw className={`w-4 h-4 ${isLoadingRevision ? "animate-spin" : ""}`} />
                    Current Revision Request
                  </h4>

                  {isLoadingRevision ? (
                    <div className="flex flex-col items-center justify-center py-6 text-orange-400">
                      <RefreshCw className="w-5 h-5 animate-spin mb-1" />
                      <span className="text-xs">Loading feedback...</span>
                    </div>
                  ) : (
                    revisionSummary && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-xs font-medium text-orange-700 bg-orange-100/50 p-2 rounded-lg border border-orange-200 w-fit">
                          <Clock className="w-3.5 h-3.5" />
                          Deadline: {
                            (revisionSummary.created_at && revisionSummary.deadline) ?
                              formatDateTime(new Date(new Date(revisionSummary.created_at).getTime() + revisionSummary.deadline * 86400000)) :
                              (proposal && proposal.evaluationDeadline ? formatDateTime(proposal.evaluationDeadline) : "No deadline set")
                          }
                        </div>

                        <div className="grid gap-3">
                          {[
                            { title: "Title", content: revisionSummary.title_comment },
                            { title: "Budget", content: revisionSummary.budget_comment },
                            { title: "Timeline", content: revisionSummary.timeline_comment },
                            { title: "Overall", content: revisionSummary.overall_comment }
                          ].map((item, idx) => item.content && (
                            <div key={idx} className="bg-white p-3 rounded-lg border border-orange-100/50 shadow-sm">
                              <h5 className="text-xs font-bold text-orange-800 uppercase mb-1">{item.title}</h5>
                              <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">{item.content}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}

              {/* Extension Request Review Panel (shown when proposal is not_submitted) */}
              {(proposal?.status || '').toLowerCase() === 'not_submitted' && pendingExtension && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 space-y-4">
                  <h4 className="flex items-center gap-2 text-sm font-bold text-amber-800">
                    <Clock className="w-4 h-4" />
                    Proponent Extension Request
                  </h4>
                  <div className="bg-white p-4 rounded-lg border border-amber-100 space-y-3">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>
                        Requested by: <span className="font-semibold text-slate-700">
                          {pendingExtension.proponent?.first_name} {pendingExtension.proponent?.last_name}
                        </span>
                      </span>
                      <span>{formatDateTime(pendingExtension.created_at)}</span>
                    </div>
                    <div className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <span className="text-xs font-bold text-slate-500 uppercase block mb-1">Reason</span>
                      <p className="whitespace-pre-wrap">{pendingExtension.reason}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-amber-700 uppercase mb-1">New Deadline (if approving)</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={1}
                          max={90}
                          value={extensionDeadlineDays}
                          onChange={(e) => setExtensionDeadlineDays(Number(e.target.value))}
                          className="w-20 px-3 py-2 border border-amber-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                        />
                        <span className="text-sm text-slate-600">day(s)</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-amber-700 uppercase mb-1">Review Note (optional)</label>
                      <textarea
                        value={extensionReviewNote}
                        onChange={(e) => setExtensionReviewNote(e.target.value)}
                        placeholder="Add a note for the proponent..."
                        className="w-full border border-amber-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-400 focus:border-transparent resize-none"
                        rows={2}
                        maxLength={2000}
                      />
                    </div>
                    <div className="flex gap-3 pt-1">
                      <button
                        type="button"
                        onClick={() => handleExtensionReview("approved")}
                        disabled={isReviewingExtension || extensionDeadlineDays < 1}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Extend Deadline
                      </button>
                      <button
                        type="button"
                        onClick={() => handleExtensionReview("rejected")}
                        disabled={isReviewingExtension}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
                      >
                        <XCircle className="w-4 h-4" />
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Decision Selection Grid (hidden for not_submitted proposals with pending extension) */}
              {(proposal?.status || '').toLowerCase() !== 'not_submitted' && (<>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-3">
                  Decision <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

                  {/* Sent to Evaluators */}
                  <button
                    type="button"
                    onClick={() => setDecision('Sent to Evaluators')}
                    className={`relative p-3 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all duration-200 ${decision === 'Sent to Evaluators'
                      ? 'border-purple-500 bg-purple-50 text-purple-700 shadow-md transform scale-[1.02]'
                      : 'border-slate-200 hover:border-purple-200 hover:bg-purple-50/30 text-slate-500 hover:text-purple-600'
                      }`}
                  >
                    {decision === 'Sent to Evaluators' && <div className="absolute top-2 right-2"><CheckCircle className="w-4 h-4 text-purple-600" /></div>}
                    <Users className={`w-6 h-6 ${decision === 'Sent to Evaluators' ? 'text-purple-600' : 'text-current'}`} />
                    <span className="font-bold text-xs sm:text-sm text-center leading-tight">Forward to Evaluators</span>
                  </button>

                  {/* Revision Required */}
                  <button
                    type="button"
                    onClick={() => setDecision('Revision Required')}
                    className={`relative p-3 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all duration-200 ${decision === 'Revision Required'
                      ? 'border-amber-500 bg-amber-50 text-amber-700 shadow-md transform scale-[1.02]'
                      : 'border-slate-200 hover:border-amber-200 hover:bg-amber-50/30 text-slate-500 hover:text-amber-600'
                      }`}
                  >
                    {decision === 'Revision Required' && <div className="absolute top-2 right-2"><CheckCircle className="w-4 h-4 text-amber-600" /></div>}
                    <RefreshCw className={`w-6 h-6 ${decision === 'Revision Required' ? 'text-amber-600' : 'text-current'}`} />
                    <span className="font-bold text-xs sm:text-sm text-center leading-tight">Request Revision</span>
                  </button>

                  {/* Reject */}
                  <button
                    type="button"
                    onClick={() => setDecision('Rejected Proposal')}
                    className={`relative p-3 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all duration-200 ${decision === 'Rejected Proposal'
                      ? 'border-red-500 bg-red-50 text-red-700 shadow-md transform scale-[1.02]'
                      : 'border-slate-200 hover:border-red-200 hover:bg-red-50/30 text-slate-500 hover:text-red-600'
                      }`}
                  >
                    {decision === 'Rejected Proposal' && <div className="absolute top-2 right-2"><CheckCircle className="w-4 h-4 text-red-600" /></div>}
                    <XCircle className={`w-6 h-6 ${decision === 'Rejected Proposal' ? 'text-red-600' : 'text-current'}`} />
                    <span className="font-bold text-xs sm:text-sm text-center leading-tight">Reject Proposal</span>
                  </button>

                </div>
              </div>

              {/* Dynamic Content Area */}
              <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">

                {/* Time Limit Section */}
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
                      {decision === 'Sent to Evaluators' ? (
                        <select
                          value={evaluationDeadline}
                          onChange={(e) => setEvaluationDeadline(e.target.value)}
                          className="w-full sm:w-1/2 px-3 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-transparent transition-all shadow-sm"
                        >
                          <option value="7">1 Week</option>
                          <option value="14">2 Weeks</option>
                          <option value="21">3 Weeks</option>
                        </select>
                      ) : (
                        <div className="space-y-3">
                          <select
                            value={evaluationDeadline}
                            onChange={(e) => setEvaluationDeadline(e.target.value)}
                            className="w-full sm:max-w-xs px-3 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-transparent transition-all shadow-sm"
                          >
                            <option value="1">24 Hours</option>
                            <option value="7">1 Week</option>
                            <option value="14">2 Weeks</option>
                            <option value="21">3 Weeks</option>
                            <option value="custom">Custom</option>
                          </select>
                          {evaluationDeadline === 'custom' && (
                            <div className="flex flex-wrap items-center gap-2 pt-1 animate-in fade-in duration-200">
                              <input
                                type="number"
                                min={1}
                                max={365}
                                value={customRevisionValue}
                                onChange={(e) => setCustomRevisionValue(Math.max(1, Math.min(365, parseInt(e.target.value, 10) || 1)))}
                                className="w-20 px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-transparent"
                              />
                              <select
                                value={customRevisionUnit}
                                onChange={(e) => setCustomRevisionUnit(e.target.value as 'days' | 'weeks')}
                                className="px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-transparent"
                              >
                                <option value="days">Days</option>
                                <option value="weeks">Weeks</option>
                              </select>
                              <span className="text-xs text-slate-500">
                                = {customRevisionUnit === 'weeks' ? customRevisionValue * 7 : customRevisionValue} days
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Evaluator Assignment Section */}
                {decision === 'Sent to Evaluators' && (
                  <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 custom-scrollbar">
                    <h4 className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-4">
                      <Users className="w-4 h-4 text-slate-500" />
                      Assign Evaluators
                    </h4>

                    {/* Toolbar */}
                    <div className="flex flex-col gap-3 mb-4">
                      <div className="flex flex-col sm:flex-row gap-3">
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
                            {departments.filter(d => d !== 'All').map(dept => (
                              <option key={dept} value={dept}>{dept}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      {proposal?.department && (
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={showMatchedOnly}
                            onChange={(e) => setShowMatchedOnly(e.target.checked)}
                            className="w-3.5 h-3.5 text-[#C8102E] rounded border-slate-300 focus:ring-[#C8102E]"
                          />
                          <span className="text-xs font-medium text-slate-600">Show matched only</span>
                          <span className="text-[10px] text-slate-400">({proposal.department})</span>
                        </label>
                      )}
                    </div>

                    {/* Available List */}
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold text-slate-500 uppercase">Available</span>
                        <span className="text-xs font-medium text-slate-400">{checkedAvailableIds.length} selected</span>
                      </div>
                      <div className="bg-white border border-slate-200 rounded-lg h-40 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                        {isLoadingEvaluators ? (
                          <div className="h-full flex flex-col items-center justify-center text-slate-400">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current mb-2"></div>
                            <span className="text-xs">Loading...</span>
                          </div>
                        ) : availableEvaluators.length === 0 ? (
                          <div className="h-full flex items-center justify-center text-xs text-slate-400 italic">No evaluators found</div>
                        ) : (
                          availableEvaluators.map(ev => {
                            const matched = isDepartmentMatch(ev);
                            return (
                              <label key={ev.id} className={`flex items-center p-2 rounded-md cursor-pointer group transition-colors ${matched ? 'bg-emerald-50/60 hover:bg-emerald-50' : 'hover:bg-slate-50'}`}>
                                <input
                                  type="checkbox"
                                  checked={checkedAvailableIds.includes(ev.id!)}
                                  onChange={() => handleAvailableCheckboxChange(ev.id!)}
                                  className="w-4 h-4 text-[#C8102E] rounded border-slate-300 focus:ring-[#C8102E]"
                                />
                                <div className="ml-3 flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <p className="text-sm font-medium text-slate-700 group-hover:text-slate-900 truncate">{ev.name}</p>
                                    {matched && (
                                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-700 flex-shrink-0">
                                        <CheckCircle className="w-2.5 h-2.5 mr-0.5" />
                                        Match
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[10px] text-slate-500">{ev.department} • {ev.email}</p>
                                </div>
                              </label>
                            );
                          })
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
                        {assignedEvaluators.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setIsEvaluatorModalOpen(true)}
                            className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                          >
                            <Eye className="w-3 h-3" /> View All
                          </button>
                        )}
                      </div>
                      {/* Condensed View of Assigned */}
                      {assignedEvaluators.length === 0 ? (
                        <div className="text-xs text-slate-400 italic text-center py-4 bg-white border border-dashed border-slate-200 rounded-lg">No evaluators assigned</div>
                      ) : (
                        <div className="space-y-2">
                          <div className="bg-emerald-50/50 border border-emerald-100 rounded-lg h-32 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                            {assignedEvaluators.map(ev => {
                              const matched = isDepartmentMatch(ev);
                              return (
                                <label key={ev.id} className="flex items-center p-2 bg-white border border-emerald-100/50 rounded-md shadow-sm cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={checkedAssignedIds.includes(ev.id!)}
                                    onChange={() => handleAssignedCheckboxChange(ev.id!)}
                                    className="w-4 h-4 text-red-500 rounded border-slate-300 focus:ring-red-500"
                                  />
                                  <div className="ml-3 flex-1 flex justify-between items-center">
                                    <div>
                                      <div className="flex items-center gap-1">
                                        <p className="text-xs font-bold text-slate-700">{ev.name}</p>
                                        {matched && (
                                          <span className="inline-flex items-center px-1 py-0 rounded text-[8px] font-bold bg-emerald-100 text-emerald-700">Match</span>
                                        )}
                                      </div>
                                      <p className="text-[10px] text-slate-500">{ev.department}</p>
                                    </div>
                                    <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-bold">
                                      {ev.name?.charAt(0)}
                                    </div>
                                  </div>
                                </label>
                              );
                            })}
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
              </>)}
            </form>
          </div>

          {/* Footer */}
          {(proposal?.status || '').toLowerCase() !== 'not_submitted' && (
          <div className="p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            {decision === 'Sent to Evaluators' ? (
              <button
                type="button"
                onClick={handleForwardToEvaluators}
                disabled={assignedEvaluators.length < 2}
                className="px-6 py-2.5 text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-lg shadow-purple-200 transition-all transform hover:scale-[1.02] flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:transform-none"
              >
                <Send className="w-4 h-4" />
                Forward to Evaluators
              </button>
            ) : (
              <button
                type="button"
                onClick={(e) => handleSubmit(e as any)}
                className={`px-6 py-2.5 text-sm font-bold text-white rounded-lg shadow-lg transition-all transform hover:scale-[1.02] flex items-center gap-2 ${decision === 'Revision Required'
                  ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-200'
                  : 'bg-red-600 hover:bg-red-700 shadow-red-200'
                  }`}
              >
                {decision === 'Revision Required' ? <RefreshCw className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                {decision === 'Revision Required' ? 'Request Revision' : 'Reject Proposal'}
              </button>
            )}
          </div>
          )}
        </div>
      </div>

      {/* Anonymity Selection Modal */}
      {showAnonymitySelection && (
        <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4 animate-in fade-in'>
          <div className='bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden'>
            <div className='p-6'>
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
                    The proposal file may contain the proponent's name or agency. Auto-redact to black out matching text, or upload a manually redacted version.
                  </p>

                  <div className="flex gap-2 mb-2">
                    <button
                      type="button"
                      onClick={handleAutoRedact}
                      disabled={isRedacting}
                      className="flex-1 px-3 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isRedacting ? 'Redacting...' : 'Auto-Redact File'}
                    </button>
                    <label className="flex-1 px-3 py-2 text-xs font-bold text-amber-700 bg-white border border-amber-300 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer text-center">
                      Upload Redacted File
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
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
                <button onClick={() => setShowAnonymitySelection(false)} className='flex-1 px-4 py-2.5 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors'>Cancel</button>
                <button onClick={submitWithAnonymity} disabled={isRedacting} className='flex-1 px-4 py-2.5 text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-lg shadow-purple-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed'>Confirm & Send</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Evaluator List Modal (Used to View Assigned List Clearly) */}
      <EvaluatorListModal
        evaluators={assignedEvaluators.map(e => e.name!)}
        isOpen={isEvaluatorModalOpen}
        onClose={() => setIsEvaluatorModalOpen(false)}
      />

    </>
  );
};

export default RnDProposalModal;