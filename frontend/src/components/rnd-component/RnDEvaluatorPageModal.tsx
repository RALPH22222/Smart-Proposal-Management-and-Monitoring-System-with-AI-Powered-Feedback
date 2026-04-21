import React, { useState, useEffect } from 'react';
import {
  X,
  Check,
  Search,
  MessageSquare,
  Calendar,
  Users,
  NotebookPen,
  Trash2,
  Mail,
  UserPlus,
  History,
  ChevronDown,
  ChevronRight,
  UserMinus,
  UserCheck,
  UserX,
  ClockArrowUp,
  CheckCircle,
  XCircle,
  FileCheck,
  Send,
  Loader2,
} from 'lucide-react';
import Swal from 'sweetalert2';
import { fetchDepartments, fetchUsersByRole, getAssignmentHistory, type UserItem, type AssignmentHistoryItem } from '../../services/proposal.api';
import { formatDate } from '../../utils/date-formatter';
import SecureImage from '../shared/SecureImage';

export interface EvaluatorOption {
  id: string;
  name: string;
  department: string;
  status: 'Accepts' | 'Rejected' | 'Pending' | 'Extension Requested' | 'Extension Approved' | 'Extension Rejected' | 'Completed';
  comment?: string;
  extensionDate?: string;
  extensionReason?: string;
  /** Profile image URL (matches users.photo_profile_url from API) */
  photo_profile_url?: string | null;
}

interface RnDEvaluatorPageModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentEvaluators?: EvaluatorOption[];
  onReassign: (newEvaluators: EvaluatorOption[]) => Promise<void> | void;
  onExtensionAction?: (evaluatorId: string, action: 'Accept' | 'Reject') => void;
  proposalTitle: string;
  proposalId?: number | null;
  proposalStatus?: string;
  isLoading?: boolean;
}

const RnDEvaluatorPageModal: React.FC<RnDEvaluatorPageModalProps> = ({
  isOpen,
  onClose,
  currentEvaluators = [],
  onReassign,
  onExtensionAction,
  proposalTitle = "Untitled Project",
  proposalId = null,
  proposalStatus = "",
  isLoading = false,
}) => {
  // Check if the proposal status allows evaluator modifications
  const isEditable = ["under_evaluation", "review_rnd", "pending", "revised_proposal"].includes(proposalStatus);

  const getProposalStatusLabel = (status: string) => {
    switch (status) {
      case "under_evaluation": return "Under Evaluators Assessment";
      case "endorsed_for_funding": return "Endorsed";
      case "funded": return "Funded";
      case "review_rnd": return "Pending Review";
      case "revision_rnd": return "Revision Required";
      case "rejected_rnd": return "Rejected";
      case "revised_proposal": return "Revised";
      case "rejected_funding": return "Rejected (Funding)";
      case "revision_funding": return "Revision (Funding)";
      default: return status;
    }
  };

  /** Header status pill — Endorsed = dark blue on light blue (matches RnDFundingPage text-blue-800/bg-blue-50); Funded = emerald; under evaluation = purple; editable = blue; default amber */
  const getProposalStatusBadgeClass = (status: string) => {
    switch (status) {
      case "funded":
        return "bg-emerald-50 text-emerald-800 border-emerald-200";
      case "endorsed_for_funding":
        return "bg-blue-50 text-blue-800 border-blue-200";
      case "under_evaluation":
        return "bg-purple-50 text-purple-800 border-purple-200";
      case "review_rnd":
      case "pending":
      case "revised_proposal":
        return "bg-blue-50 text-blue-700 border-blue-200";
      default:
        return "bg-amber-50 text-amber-800 border-amber-200";
    }
  };
  const [departments, setDepartments] = useState<string[]>([]);
  const [allEvaluators, setAllEvaluators] = useState<UserItem[]>([]);
  const [isInternalLoading, setIsInternalLoading] = useState(true);

  const [currentList, setCurrentList] = useState<EvaluatorOption[]>([]);
  const [originalList, setOriginalList] = useState<EvaluatorOption[]>([]);

  // Assigned Evaluators Filters
  const [assignedSearch, setAssignedSearch] = useState('');
  const [assignedDeptFilter, setAssignedDeptFilter] = useState('All');
  const [assignedStatusFilter, setAssignedStatusFilter] = useState('All');

  // Replace Modal States
  const [replacementTargetId, setReplacementTargetId] = useState<string | null>(null);
  const [replaceSearch, setReplaceSearch] = useState('');
  const [replaceDeptFilter, setReplaceDeptFilter] = useState('All');

  // Add Evaluator Panel States
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [addSearch, setAddSearch] = useState('');
  const [addDeptFilter, setAddDeptFilter] = useState('All');
  const [isSaving, setIsSaving] = useState(false);

  // Assignment History States
  const [historyItems, setHistoryItems] = useState<AssignmentHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

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

      // Fetch assignment history
      if (proposalId) {
        setHistoryLoading(true);
        getAssignmentHistory(proposalId)
          .then((data) => setHistoryItems(data))
          .catch((err) => console.error("Failed to load assignment history", err))
          .finally(() => setHistoryLoading(false));
      }
    } else {
      // Reset history state when modal closes
      setHistoryItems([]);
      setHistoryOpen(false);
    }
  }, [isOpen, proposalId]);

  useEffect(() => {
    const list = currentEvaluators.length > 0 ? currentEvaluators : [];
    setCurrentList(list);
    setOriginalList(list);
  }, [currentEvaluators]);

  const initiateRemove = async (evaluator: EvaluatorOption) => {
    const result = await Swal.fire({
      title: 'Remove Evaluator?',
      html: `Mark <strong>${evaluator.name}</strong> for removal? The change will be applied when you click <strong>Save Changes</strong>.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#DC2626',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Mark for Removal',
      cancelButtonText: 'Cancel',
      reverseButtons: true,
    });
    if (result.isConfirmed) {
      setCurrentList(prev => prev.filter(ev => ev.id !== evaluator.id));
      Swal.fire({
        title: 'Marked for removal',
        text: `${evaluator.name} will be removed when you click Save Changes.`,
        icon: 'info',
        timer: 2500,
        showConfirmButton: false,
      });
    }
  };

  const confirmReplace = async (originalId: string, newEvaluatorId: string) => {
    if (!newEvaluatorId) return;
    const newEvaluatorUser = allEvaluators.find(user => user.id === newEvaluatorId);
    const originalEvaluator = currentList.find(ev => ev.id === originalId);
    if (newEvaluatorUser && originalEvaluator) {
      const result = await Swal.fire({
        title: 'Replace Evaluator?',
        html: `Mark <strong>${originalEvaluator.name}</strong> for replacement with <strong>${newEvaluatorUser.first_name} ${newEvaluatorUser.last_name}</strong>? The change will be applied when you click <strong>Save Changes</strong>.`,
        icon: 'question', showCancelButton: true,
        confirmButtonColor: '#C8102E', cancelButtonColor: '#6B7280',
        confirmButtonText: 'Mark for Replacement', cancelButtonText: 'Cancel', reverseButtons: true,
      });
      if (result.isConfirmed) {
        setCurrentList(prev => prev.map(ev => ev.id === originalId ? {
          id: newEvaluatorUser.id,
          name: `${newEvaluatorUser.first_name} ${newEvaluatorUser.last_name}`.trim(),
          department: newEvaluatorUser.departments[0]?.name || "Unknown Dept",
          status: 'Pending',
          photo_profile_url: newEvaluatorUser.photo_profile_url ?? newEvaluatorUser.profile_picture ?? null,
        } : ev));
        Swal.fire({
          title: 'Marked for replacement',
          text: 'The change will be applied when you click Save Changes.',
          icon: 'info',
          timer: 2500,
          showConfirmButton: false,
        });
        setReplacementTargetId(null);
        setReplaceSearch('');
      }
    }
  };

  const confirmAdd = async (newEvaluatorId: string) => {
    const newEvaluatorUser = allEvaluators.find(user => user.id === newEvaluatorId);
    if (!newEvaluatorUser) return;

    const result = await Swal.fire({
      title: 'Add Evaluator?',
      html: `Mark <strong>${newEvaluatorUser.first_name} ${newEvaluatorUser.last_name}</strong> for addition to this assignment? The change will be applied when you click <strong>Save Changes</strong>.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#C8102E',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Mark for Addition',
      cancelButtonText: 'Cancel',
      reverseButtons: true,
    });
    if (result.isConfirmed) {
      setCurrentList(prev => [
        ...prev,
        {
          id: newEvaluatorUser.id,
          name: `${newEvaluatorUser.first_name} ${newEvaluatorUser.last_name}`.trim(),
          department: newEvaluatorUser.departments[0]?.name || "Unknown Dept",
          status: 'Pending',
          photo_profile_url: newEvaluatorUser.photo_profile_url ?? newEvaluatorUser.profile_picture ?? null,
        },
      ]);
      Swal.fire({
        title: 'Marked for addition',
        text: `${newEvaluatorUser.first_name} ${newEvaluatorUser.last_name} will be added when you click Save Changes.`,
        icon: 'info',
        timer: 2500,
        showConfirmButton: false,
      });
      setShowAddPanel(false);
      setAddSearch('');
    }
  };

  // Close with a warning when the user has pending (unsaved) mark-for-
  // add/remove/replace actions. Stops the "I clicked Remove but nothing
  // happened" confusion where the user never clicked Save Changes.
  const handleRequestClose = async () => {
    if (!hasChanges || isSaving) {
      onClose();
      return;
    }
    const result = await Swal.fire({
      title: 'Discard changes?',
      text: 'You have unsaved evaluator changes. Close anyway?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#DC2626',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Discard',
      cancelButtonText: 'Keep editing',
      reverseButtons: true,
    });
    if (result.isConfirmed) onClose();
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
    if (result.isConfirmed) {
      setIsSaving(true);
      try {
        await onReassign(currentList);
      } finally {
        setIsSaving(false);
      }
    }
  };

  if (!isOpen) return null;

  const evaluatorPhotoFallback = (displayName: string) =>
    `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName || "?")}&background=7c3aed&color=fff&size=128`;

  const resolveEvaluatorPhoto = (ev: EvaluatorOption): string | undefined => {
    if (ev.photo_profile_url) return ev.photo_profile_url;
    const u = allEvaluators.find((x) => x.id === ev.id);
    return (u?.photo_profile_url ?? u?.profile_picture) || undefined;
  };

  const resolveUserPhoto = (u: UserItem): string | undefined =>
    (u.photo_profile_url ?? u.profile_picture) || undefined;

  const getHistoryDisplay = (action: string): { icon: React.ReactNode; color: string; label: string } => {
    switch (action) {
      case 'evaluator_assigned':
      case 'proposal_forwarded_to_evaluators':
        return { icon: <Send className="w-3.5 h-3.5 text-white" />, color: 'bg-blue-500', label: 'Evaluator Assigned' };
      case 'evaluator_accepted':
        return { icon: <UserCheck className="w-3.5 h-3.5 text-white" />, color: 'bg-emerald-500', label: 'Assignment Accepted' };
      case 'evaluator_declined':
        return { icon: <UserX className="w-3.5 h-3.5 text-white" />, color: 'bg-rose-500', label: 'Assignment Declined' };
      case 'evaluator_removed':
        return { icon: <UserMinus className="w-3.5 h-3.5 text-white" />, color: 'bg-red-600', label: 'Evaluator Removed' };
      case 'evaluator_extension_requested':
        return { icon: <ClockArrowUp className="w-3.5 h-3.5 text-white" />, color: 'bg-orange-500', label: 'Extension Requested' };
      case 'evaluator_extension_approved':
        return { icon: <CheckCircle className="w-3.5 h-3.5 text-white" />, color: 'bg-emerald-600', label: 'Extension Approved' };
      case 'evaluator_extension_denied':
        return { icon: <XCircle className="w-3.5 h-3.5 text-white" />, color: 'bg-red-500', label: 'Extension Denied' };
      case 'evaluation_scores_submitted':
        return { icon: <FileCheck className="w-3.5 h-3.5 text-white" />, color: 'bg-purple-500', label: 'Evaluation Submitted' };
      default:
        return { icon: <History className="w-3.5 h-3.5 text-white" />, color: 'bg-slate-400', label: action.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) };
    }
  };

  const getStatusStyle = (status: EvaluatorOption['status']) => {
    switch (status) {
      case 'Accepts': case 'Extension Approved': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Completed': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Rejected': case 'Extension Rejected': return 'bg-red-50 text-red-700 border-red-200';
      case 'Extension Requested': return 'bg-blue-50 text-blue-700 border-blue-200';
      default: return 'bg-amber-50 text-amber-700 border-amber-200';
    }
  };

  // Detect changes: different number of evaluators, or any ID changed
  const hasChanges = (() => {
    if (currentList.length !== originalList.length) return true;
    const originalIds = new Set(originalList.map(e => e.id));
    return currentList.some(e => !originalIds.has(e.id));
  })();

  const filteredAssignedEvaluators = currentList.filter(ev => {
    const matchSearch = ev.name.toLowerCase().includes(assignedSearch.toLowerCase()) || 
                        ev.department.toLowerCase().includes(assignedSearch.toLowerCase());
    const matchDept = assignedDeptFilter === 'All' || ev.department === assignedDeptFilter;
    const matchStatus = assignedStatusFilter === 'All' || ev.status === assignedStatusFilter;
    return matchSearch && matchDept && matchStatus;
  });

  // Evaluators not already assigned (shared base for replace & add)
  const availableEvaluators = allEvaluators.filter(user => !currentList.some(curr => curr.id === user.id));

  const replaceCandidates = availableEvaluators
    .filter(user => {
      const name = `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim();
      const email = user.email || '';
      const dept = user.departments[0]?.name || 'Unknown';

      const matchSearch = name.toLowerCase().includes(replaceSearch.toLowerCase()) ||
                          email.toLowerCase().includes(replaceSearch.toLowerCase()) ||
                          dept.toLowerCase().includes(replaceSearch.toLowerCase());
      const matchDept = replaceDeptFilter === 'All' || dept === replaceDeptFilter;

      return matchSearch && matchDept;
    });

  const addCandidates = availableEvaluators
    .filter(user => {
      const name = `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim();
      const email = user.email || '';
      const dept = user.departments[0]?.name || 'Unknown';

      const matchSearch = name.toLowerCase().includes(addSearch.toLowerCase()) ||
                          email.toLowerCase().includes(addSearch.toLowerCase()) ||
                          dept.toLowerCase().includes(addSearch.toLowerCase());
      const matchDept = addDeptFilter === 'All' || dept === addDeptFilter;

      return matchSearch && matchDept;
    });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-2 sm:p-4 animate-in fade-in duration-200">
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
              {proposalStatus && (
                <span
                  className={`inline-flex items-center mt-1.5 px-2 py-0.5 rounded-full text-[12px] font-semibold border ${getProposalStatusBadgeClass(proposalStatus)}`}
                >
                  {getProposalStatusLabel(proposalStatus)}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={handleRequestClose}
            className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-6 relative">

          {/* Read-only banner when proposal is past evaluation */}
          {!isEditable && proposalStatus && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center gap-3">
              <div className="p-1.5 bg-slate-100 rounded-lg">
                <Users className="w-4 h-4 text-red-700" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">View Only</p>
                <p className="text-xs text-slate-700">
                  This proposal is <strong>{getProposalStatusLabel(proposalStatus).toLowerCase()}</strong>. Evaluator assignments can no longer be modified.
                </p>
              </div>
            </div>
          )}

          {/* Mini Replace Modal Overlay */}
          {replacementTargetId && (
            <div className="fixed inset-0 z-[70] flex flex-col items-center justify-center p-4 bg-black/50 animate-in fade-in duration-200">
              <div className="bg-white rounded-2xl shadow-[0_10px_40px_-10px_rgba(107,33,168,0.25)] ring-1 ring-purple-100 w-full max-w-xl overflow-hidden flex flex-col pointer-events-auto animate-in zoom-in-95 duration-200">
                <div className="p-4 border-b border-purple-100 bg-purple-50 flex items-center justify-between">
                  <h3 className="font-bold text-purple-900 flex items-center gap-2">
                    <Users className="w-5 h-5 text-purple-600" />
                    Select Replacement
                  </h3>
                  <button onClick={() => setReplacementTargetId(null)} className="p-1 hover:bg-purple-200 text-purple-400 hover:text-purple-600 rounded-lg transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                {/* Filters */}
                <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-3 bg-white">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-300" />
                    <input
                      type="text"
                      placeholder="Search name, email, or dept..."
                      value={replaceSearch}
                      onChange={(e) => setReplaceSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-purple-50/30 border border-purple-100 rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all"
                    />
                  </div>
                  <select
                    value={replaceDeptFilter}
                    onChange={(e) => setReplaceDeptFilter(e.target.value)}
                    className="w-full sm:w-48 p-2 bg-purple-50/30 border border-purple-100 rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-400 transition-all text-purple-900"
                  >
                    <option value="All">All Departments</option>
                    {departments.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                
                {/* List */}
                <div className="flex-1 overflow-y-auto max-h-64 p-3 space-y-2 custom-scrollbar bg-slate-50">
                  {replaceCandidates.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-sm">No evaluators found matching your criteria.</div>
                  ) : (
                    replaceCandidates.map((user) => (
                      <div key={user.id} className="group relative flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl hover:border-purple-300 hover:shadow-md transition-all">
                        <div className="flex items-center gap-3 w-full">
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-purple-100 flex-shrink-0 ring-1 ring-purple-100 flex items-center justify-center">
                            <SecureImage
                              src={resolveUserPhoto(user)}
                              fallbackSrc={evaluatorPhotoFallback(`${user.first_name ?? ""} ${user.last_name ?? ""}`.trim())}
                              alt={`${user.first_name ?? ""} ${user.last_name ?? ""}`.trim() || "Evaluator"}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-slate-800 text-sm truncate">{user.first_name} {user.last_name}</div>
                            <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                              <span className="truncate flex items-center gap-1"><NotebookPen className="w-3 h-3"/> {user.departments[0]?.name || 'Unknown'}</span>
                              {user.email && (
                                <span className="truncate flex items-center gap-1"><Mail className="w-3 h-3"/> {user.email}</span>
                              )}
                            </div>
                          </div>
                          <button 
                            onClick={() => confirmReplace(replacementTargetId, user.id)}
                            className="bg-purple-100 hover:bg-purple-600 text-purple-700 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                          >
                            Replace
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Add Evaluator Overlay — purple theme (matches Replace mini modal) */}
          {showAddPanel && (
            <div className="fixed inset-0 z-[70] flex flex-col items-center justify-center p-4 bg-black/50 animate-in fade-in duration-200">
              <div className="bg-white rounded-2xl shadow-[0_10px_40px_-10px_rgba(107,33,168,0.25)] ring-1 ring-purple-100 w-full max-w-xl overflow-hidden flex flex-col pointer-events-auto animate-in zoom-in-95 duration-200">
                <div className="p-4 border-b border-purple-100 bg-purple-50 flex items-center justify-between">
                  <h3 className="font-bold text-purple-900 flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-purple-600" />
                    Add Evaluator
                  </h3>
                  <button onClick={() => { setShowAddPanel(false); setAddSearch(''); setAddDeptFilter('All'); }} className="p-1 hover:bg-purple-200 text-purple-400 hover:text-purple-600 rounded-lg transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                {/* Filters */}
                <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-3 bg-white">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-300" />
                    <input
                      type="text"
                      placeholder="Search name, email, or dept..."
                      value={addSearch}
                      onChange={(e) => setAddSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-purple-50/30 border border-purple-100 rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all"
                    />
                  </div>
                  <select
                    value={addDeptFilter}
                    onChange={(e) => setAddDeptFilter(e.target.value)}
                    className="w-full sm:w-48 p-2 bg-purple-50/30 border border-purple-100 rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-400 transition-all text-purple-900"
                  >
                    <option value="All">All Departments</option>
                    {departments.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                {/* List */}
                <div className="flex-1 overflow-y-auto max-h-64 p-3 space-y-2 custom-scrollbar bg-slate-50">
                  {addCandidates.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-sm">No evaluators found matching your criteria.</div>
                  ) : (
                    addCandidates.map((user) => (
                      <div key={user.id} className="group relative flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl hover:border-purple-300 hover:shadow-md transition-all">
                        <div className="flex items-center gap-3 w-full">
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-purple-100 flex-shrink-0 ring-1 ring-purple-100 flex items-center justify-center">
                            <SecureImage
                              src={resolveUserPhoto(user)}
                              fallbackSrc={evaluatorPhotoFallback(`${user.first_name ?? ""} ${user.last_name ?? ""}`.trim())}
                              alt={`${user.first_name ?? ""} ${user.last_name ?? ""}`.trim() || "Evaluator"}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-slate-800 text-sm truncate">{user.first_name} {user.last_name}</div>
                            <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                              <span className="truncate flex items-center gap-1"><NotebookPen className="w-3 h-3"/> {user.departments[0]?.name || 'Unknown'}</span>
                              {user.email && (
                                <span className="truncate flex items-center gap-1"><Mail className="w-3 h-3"/> {user.email}</span>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => confirmAdd(user.id)}
                            className="bg-purple-100 hover:bg-purple-600 text-purple-700 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Section 1: Current Evaluators */}
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-6">
            <div className="border-b border-slate-200 pb-4 mb-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#C8102E]" />
                  Assigned Evaluators
                  <span className="text-xs font-bold text-white bg-[#C8102E] px-2 py-0.5 rounded-full">
                    {filteredAssignedEvaluators.length}
                  </span>
                </h3>
                {isEditable && (
                  <button
                    onClick={() => setShowAddPanel(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#C8102E] text-white text-xs rounded-lg font-semibold hover:bg-[#A00E26] transition-colors shadow-sm"
                  >
                    <UserPlus className="w-3.5 h-3.5" /> Add Evaluator
                  </button>
                )}
              </div>
              
              {/* filters matching request */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search evaluators..."
                    value={assignedSearch}
                    onChange={(e) => setAssignedSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-[#C8102E] focus:border-transparent outline-none"
                  />
                </div>
                <select
                  value={assignedDeptFilter}
                  onChange={(e) => setAssignedDeptFilter(e.target.value)}
                  className="sm:w-48 bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#C8102E] outline-none"
                >
                  <option value="All">All Departments</option>
                  {departments.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
                <select
                  value={assignedStatusFilter}
                  onChange={(e) => setAssignedStatusFilter(e.target.value)}
                  className="sm:w-40 bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#C8102E] outline-none"
                >
                  <option value="All">All Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="Accepts">Accepts</option>
                  <option value="Extension Requested">Extension Requested</option>
                  <option value="Extension Approved">Extension Approved</option>
                  <option value="Extension Rejected">Extension Rejected</option>
                  <option value="Completed">Completed</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
            </div>

            {isLoading || isInternalLoading ? (
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm animate-fade-in">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-slate-300 font-semibold text-xs uppercase tracking-wider w-1/4">Evaluator</th>
                      <th className="px-4 py-3 text-left text-slate-300 font-semibold text-xs uppercase tracking-wider w-1/2">Feedback / Status</th>
                      <th className="px-4 py-3 text-center text-slate-300 font-semibold text-xs uppercase tracking-wider w-1/4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {[1, 2, 3].map((i) => (
                      <tr key={i} className="animate-pulse bg-white">
                        <td className="px-4 py-3 align-top">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-slate-200 shrink-0"></div>
                            <div className="w-full">
                              <div className="h-4 bg-slate-200 rounded w-2/3 max-w-[120px]"></div>
                              <div className="h-3 bg-slate-100 rounded w-1/2 max-w-[90px] mt-1.5"></div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 align-top">
                          <div>
                            <div className="h-5 bg-slate-200 rounded-md w-24"></div>
                            <div className="flex items-center gap-2 mt-2">
                              <div className="w-3 h-3 bg-slate-200 rounded-full shrink-0"></div>
                              <div className="h-3 bg-slate-100 rounded w-full max-w-[200px]"></div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 align-middle text-center">
                          <div className="flex flex-row items-center justify-center gap-2">
                             <div className="h-[30px] w-20 bg-slate-200 rounded-lg"></div>
                             <div className="h-[30px] w-20 bg-slate-200 rounded-lg"></div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : filteredAssignedEvaluators.length > 0 ? (
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm animate-fade-in">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-slate-600 font-semibold text-xs uppercase tracking-wider w-1/4">Evaluator</th>
                        <th className="px-4 py-3 text-left text-slate-600 font-semibold text-xs uppercase tracking-wider w-1/2">Feedback / Status</th>
                        <th className="px-4 py-3 text-center text-slate-600 font-semibold text-xs uppercase tracking-wider w-1/4">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredAssignedEvaluators.map((ev) => (
                        <tr key={ev.id} className="hover:bg-slate-50 transition-colors">
                          {/* Name & Department */}
                          <td className="px-4 py-3 align-top">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full overflow-hidden bg-purple-100 flex-shrink-0 ring-1 ring-purple-100 flex items-center justify-center">
                                <SecureImage
                                  src={resolveEvaluatorPhoto(ev)}
                                  fallbackSrc={evaluatorPhotoFallback(ev.name)}
                                  alt={ev.name}
                                  className="w-full h-full object-cover"
                                />
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
                                {onExtensionAction && isEditable && (
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
                            {isEditable ? (
                              <div className="flex flex-row items-center justify-center gap-2">
                                {ev.status !== 'Accepts' && (
                                  <button
                                    onClick={() => setReplacementTargetId(ev.id)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 text-xs rounded-lg font-bold transition-all shadow-sm"
                                  >
                                    <Users className="w-3.5 h-3.5" /> Replace
                                  </button>
                                )}
                                {ev.status !== 'Accepts' && (
                                  <button onClick={() => initiateRemove(ev)} className="flex items-center gap-1 px-3 py-1.5 bg-white border border-red-200 text-red-600 hover:bg-red-50 text-xs rounded-lg font-medium transition-colors">
                                    <Trash2 className="w-3 h-3" /> Remove
                                  </button>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400 italic">View only</span>
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
                <p className="text-slate-500 text-sm italic">No evaluators found.</p>
              </div>
            )}
          </div>

          {/* Section 2: Assignment History */}
          <div className="bg-slate-50 rounded-xl border border-slate-200">
            <button
              onClick={() => setHistoryOpen(!historyOpen)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-100 transition-colors rounded-xl"
            >
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <History className="w-4 h-4 text-[#C8102E]" />
                Assignment History
                {historyItems.length > 0 && (
                  <span className="text-xs font-bold text-white bg-slate-500 px-2 py-0.5 rounded-full">
                    {historyItems.length}
                  </span>
                )}
              </h3>
              {historyOpen ? (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {historyOpen && (
              <div className="px-6 pb-6">
                {historyLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex gap-3 animate-pulse">
                        <div className="w-8 h-8 bg-slate-200 rounded-full shrink-0" />
                        <div className="flex-1">
                          <div className="h-4 bg-slate-200 rounded w-3/4" />
                          <div className="h-3 bg-slate-100 rounded w-1/2 mt-1.5" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : historyItems.length === 0 ? (
                  <div className="text-center py-6 text-slate-400 text-sm">
                    <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No assignment history found for this proposal.</p>
                    <p className="text-xs mt-1">History will appear here as evaluators are assigned and respond.</p>
                  </div>
                ) : (
                  <div className="relative">
                    {/* Timeline line */}
                    <div className="absolute left-4 top-4 bottom-4 w-px bg-slate-200" />

                    <div className="space-y-4">
                      {historyItems.map((item, idx) => {
                        const { icon, color, label } = getHistoryDisplay(item.action);
                        return (
                          <div key={item.id || idx} className="flex gap-3 relative">
                            {/* Timeline dot */}
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 border-2 border-white shadow-sm ${color}`}>
                              {icon}
                            </div>
                            {/* Content */}
                            <div className="flex-1 min-w-0 pt-0.5">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <span className="text-sm font-semibold text-slate-800">{label}</span>
                                  {item.evaluatorName && (
                                    <span className="text-sm text-slate-600"> — {item.evaluatorName}</span>
                                  )}
                                </div>
                                <span className="text-[10px] text-slate-400 whitespace-nowrap shrink-0 mt-0.5">
                                  {formatDate(item.timestamp)}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 mt-0.5">
                                by {item.performedBy}
                              </p>
                              {item.remarks && (
                                <div className="mt-1.5 bg-white border border-slate-200 rounded-lg px-3 py-2">
                                  <div className="flex items-start gap-1.5">
                                    <MessageSquare className="w-3 h-3 mt-0.5 text-slate-400 shrink-0" />
                                    <p className="text-xs text-slate-600 italic">"{item.remarks}"</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3 z-10">
          <button
            onClick={handleRequestClose}
            className="px-4 py-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium transition-colors text-sm"
          >
            {isEditable ? 'Cancel' : 'Close'}
          </button>
          {isEditable && (
            <button
              onClick={handleSaveClick}
              disabled={!hasChanges || isSaving}
              className={`px-4 py-2 rounded-lg text-white font-medium shadow-sm transition-colors flex items-center justify-center gap-2 text-sm ${
                hasChanges && !isSaving
                  ? 'bg-[#C8102E] hover:bg-[#A00E26] cursor-pointer'
                  : 'bg-slate-400 cursor-not-allowed opacity-80'
              }`}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default RnDEvaluatorPageModal;