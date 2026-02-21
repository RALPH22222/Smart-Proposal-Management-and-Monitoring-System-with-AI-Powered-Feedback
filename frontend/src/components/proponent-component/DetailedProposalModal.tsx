import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  X,
  Building2,
  Target,
  Calendar,
  DollarSign,
  Phone,
  RefreshCw,
  Mail,
  MapPin,
  FileText,
  User,
  Microscope,
  Tags,
  CheckCheckIcon,
  BookOpen,
  Upload,
  Download,
  Edit,
  Eye,
  FileCheck,
  CheckCircle2,
  Clock,
  XCircle,
  CheckCircle,
  Plus,
  Trash2,
  Play,
  Users,
  ShieldCheck,
  Globe,
  AlertCircle,
  Loader,
} from "lucide-react";
import type { Proposal, BudgetSource } from "../../types/proponentTypes";
import { type LookupItem, fetchAgencyAddresses, type AddressItem, fetchRejectionSummary, fetchRevisionSummary, type RevisionSummary } from "../../services/proposal.api";
import { submitRevisedProposal } from "../../services/submit-revised-proposal";

interface Site {
  site: string;
  city: string;
}

interface DetailedProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  proposal: Proposal | null;
  onUpdateProposal?: (proposal: Proposal) => void;
  onManageMilestones?: () => void;
  agencies?: LookupItem[];
  sectors?: LookupItem[];
  disciplines?: LookupItem[];
  priorities?: LookupItem[];
  stations?: LookupItem[];
  tags?: LookupItem[];
  departments?: LookupItem[];
}

const DetailedProposalModal: React.FC<DetailedProposalModalProps> = ({
  isOpen,
  onClose,
  proposal,
  onUpdateProposal,
  agencies = [],
  sectors = [],
  disciplines = [],
  priorities = [],
  stations = [],
  departments = [],
}) => {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [editedProposal, setEditedProposal] = useState<Proposal | null>(null);
  const [newFile, setNewFile] = useState<File | null>(null);
  const [submittedFiles, setSubmittedFiles] = useState<string[]>([]);
  const [agencyAddresses, setAgencyAddresses] = useState<AddressItem[]>([]);
  const [rejectionComment, setRejectionComment] = useState<string | null>(null);
  const [rejectionDate, setRejectionDate] = useState<string | null>(null);
  const [rejectedBy, setRejectedBy] = useState<string | null>(null); // Store who rejected it
  const [revisionData, setRevisionData] = useState<RevisionSummary | null>(null);
  const [isLoadingRevision, setIsLoadingRevision] = useState(false);
  const [isLoadingRejection, setIsLoadingRejection] = useState(false);
  const [isSubmittingRevision, setIsSubmittingRevision] = useState(false);
  const [revisionError, setRevisionError] = useState<string | null>(null);
  const [submittedRevisionFile, setSubmittedRevisionFile] = useState<string | null>(null);
  const [revisionChanges, setRevisionChanges] = useState<{
    projectTitle?: { old: string; new: string };
    startDate?: { old: string; new: string };
    endDate?: { old: string; new: string };
    budget?: { changed: boolean };
    file?: { old: string; new: string };
  } | null>(null);
  const isInRevisionMode = ['revise', 'revision', 'revision_rnd', 'revision required'].includes((proposal?.status || '').toLowerCase());

  useEffect(() => {
    const fetchRejection = async () => {
      const pStatus = (proposal?.status || '').toLowerCase();
      if (['rejected', 'disapproved', 'reject', 'rejected_rnd', 'rejected proposal'].includes(pStatus)) {
        setIsLoadingRejection(true);
        try {
          // Rejection fetch logic (existing)
          const summary = await fetchRejectionSummary(Number(proposal?.id));
          setRejectionComment(summary?.comment || "No specific comment provided.");
          setRejectionDate(summary?.created_at || null);
          // Use the rejected_by_role field to determine if it's admin or R&D
          setRejectedBy(summary?.rejected_by_role === "admin" ? "Admin" : "R&D");
        } catch (error) {
          console.error("Failed to fetch rejection summary:", error);
          setRejectionComment("Failed to load rejection details.");
          setRejectionDate(null);
          setRejectedBy(null);
        } finally {
          setIsLoadingRejection(false);
        }
      } else {
        setRejectionComment(null);
        setRejectedBy(null);
        setIsLoadingRejection(false);
      }
    };

    const fetchRevision = async () => {
      const pStatus = (proposal?.status || '').toLowerCase();
      if (['revise', 'revision', 'revision_rnd', 'revision required', 'under r&d review'].includes(pStatus)) {
        setIsLoadingRevision(true);
        try {
          const data = await fetchRevisionSummary(Number(proposal?.id));
          setRevisionData(data);
        } catch (error) {
          console.error("Failed to fetch revision summary:", error);
          setRevisionData(null);
        } finally {
          setIsLoadingRevision(false);
        }
      } else {
        setRevisionData(null);
        setIsLoadingRevision(false);
      }
    };

    if (isOpen && proposal) {
      fetchRejection();
      fetchRevision();
    }
  }, [isOpen, proposal?.status, proposal?.id]);

  useEffect(() => {
    if (proposal) {
      setEditedProposal(proposal);
      if (proposal.uploadedFile) {
        setSubmittedFiles([proposal.uploadedFile]);
      }
    }
  }, [proposal]);

  useEffect(() => {
    if (!isOpen) {
      setIsEditing(false);
      setNewFile(null);
    }
  }, [isOpen]);

  useEffect(() => {
    const fetchAddresses = async () => {
      const targetAgencyName = isEditing ? editedProposal?.agency : proposal?.agency;
      if (!targetAgencyName) return;

      const agency = agencies.find(a => a.name === targetAgencyName);
      if (agency) {
        try {
          const addresses = await fetchAgencyAddresses(agency.id);
          setAgencyAddresses(addresses);
        } catch (error) {
          console.error("Failed to fetch agency addresses:", error);
          setAgencyAddresses([]);
        }
      } else {
        setAgencyAddresses([]);
      }
    };

    if (isOpen) {
      fetchAddresses();
    }
  }, [isOpen, isEditing, editedProposal?.agency, proposal?.agency, agencies]);

  const handleAddressSelect = (addressId: string) => {
    if (!editedProposal) return;
    const selectedAddress = agencyAddresses.find(a => String(a.id) === addressId);

    if (selectedAddress) {
      const formattedAddress = [
        selectedAddress.street,
        selectedAddress.barangay,
        selectedAddress.city
      ].filter(Boolean).join(", ");

      setEditedProposal({
        ...editedProposal,
        address: formattedAddress,
        agency_address: [selectedAddress]
      } as Proposal);
    }
  };

  if (!isOpen || !proposal || !editedProposal) {
    return null;
  }

  // --- Helper Functions ---
  const calculateDuration = (start: string, end: string): string => {
    if (!start || !end) return "";
    const startDate = new Date(start);
    const endDate = new Date(end);
    let months = (endDate.getFullYear() - startDate.getFullYear()) * 12;
    months -= startDate.getMonth();
    months += endDate.getMonth();
    if (endDate.getDate() < startDate.getDate()) months--;
    const finalMonths = Math.max(
      0,
      months + (endDate.getDate() >= startDate.getDate() ? 1 : 0)
    );
    return `${finalMonths} months`;
  };

  // Format classification type - remove "_class" suffix first
  const formatClassificationType = (str: string) => {
    if (!str) return "N/A";
    // Remove _class suffix if present
    const cleaned = str.replace(/_class$/i, '');
    return cleaned
      .split(/[_\s]+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  // Format class input - make it human readable
  const formatClassInput = (str: string) => {
    if (!str) return "";
    return str
      .split(/[_\s]+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };


  const getFileName = (url: string) => {
    if (!url) return "Unknown File";
    if (url.startsWith("blob:") && newFile) return newFile.name;
    try {
      const decoded = decodeURIComponent(url);
      const parts = decoded.split(/[/\\]/);
      return parts[parts.length - 1] || "Document.pdf";
    } catch {
      return "Document.pdf";
    }
  };

  // --- Logic Handlers ---
  const handleInputChange = (field: keyof Proposal, value: string) => {
    setEditedProposal({ ...editedProposal, [field]: value });
  };

  const handleDateChange = (field: "startDate" | "endDate", value: string) => {
    if (!editedProposal) return;
    const updatedProposal = { ...editedProposal, [field]: value };
    if (updatedProposal.startDate && updatedProposal.endDate) {
      updatedProposal.duration = calculateDuration(
        updatedProposal.startDate,
        updatedProposal.endDate
      );
    }
    setEditedProposal(updatedProposal);
  };

  const handleSiteChange = (
    index: number,
    field: "site" | "city",
    value: string
  ) => {
    if (!editedProposal) return;
    const currentSites = (editedProposal.implementationSites as Site[]) || [];
    const updatedSites = [...currentSites];
    updatedSites[index] = { ...updatedSites[index], [field]: value };
    setEditedProposal({ ...editedProposal, implementationSites: updatedSites });
  };

  const handleAddSite = () => {
    if (!editedProposal) return;
    const currentSites = (editedProposal.implementationSites as Site[]) || [];
    setEditedProposal({
      ...editedProposal,
      implementationSites: [...currentSites, { site: "", city: "" }],
    });
  };

  const handleRemoveSite = (index: number) => {
    if (!editedProposal) return;
    const currentSites = (editedProposal.implementationSites as Site[]) || [];
    if (currentSites.length <= 1) return;
    const updatedSites = currentSites.filter((_, i) => i !== index);
    setEditedProposal({ ...editedProposal, implementationSites: updatedSites });
  };

  const handleAddBudgetItem = () => {
    if (!editedProposal) return;
    const newSource: BudgetSource = {
      source: "New Funding Source",
      ps: "₱0.00",
      mooe: "₱0.00",
      co: "₱0.00",
      total: "₱0.00",
      breakdown: {
        ps: [],
        mooe: [],
        co: []
      }
    };
    setEditedProposal({
      ...editedProposal,
      budgetSources: [...editedProposal.budgetSources, newSource],
    });
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) setNewFile(file);
  };

  const handleSave = async () => {
    // Check if in revision mode and submit revision
    if (isInRevisionMode && proposal && newFile) {
      setIsSubmittingRevision(true);
      setRevisionError(null);
      try {
        // Track what changed
        const changes: any = {};
        
        if (editedProposal?.title !== proposal.title) {
          changes.projectTitle = { old: proposal.title, new: editedProposal?.title };
        }
        if (editedProposal?.startDate !== proposal.startDate) {
          changes.startDate = { old: proposal.startDate, new: editedProposal?.startDate };
        }
        if (editedProposal?.endDate !== proposal.endDate) {
          changes.endDate = { old: proposal.endDate, new: editedProposal?.endDate };
        }
        // Check if budget changed
        const budgetChanged = JSON.stringify(editedProposal?.budgetSources) !== JSON.stringify(proposal.budgetSources);
        if (budgetChanged) {
          changes.budget = { changed: true };
        }
        changes.file = { old: getFileName(submittedFiles[submittedFiles.length - 1] || ""), new: newFile.name };

        // Prepare revised proposal payload
        const revisedPayload = {
          projectTitle: editedProposal?.title !== proposal.title ? editedProposal?.title : undefined,
          file: newFile,
          implementingSchedule: {
            startDate: editedProposal?.startDate && editedProposal.startDate !== proposal.startDate
              ? editedProposal.startDate
              : undefined,
            endDate: editedProposal?.endDate && editedProposal.endDate !== proposal.endDate
              ? editedProposal.endDate
              : undefined,
          },
          budgetSources: editedProposal?.budgetSources,
        };

        // Submit via the service
        const response = await submitRevisedProposal(Number(proposal.id), revisedPayload);

        if (response.message) {
          // Store the new file URL and changes for display
          setSubmittedRevisionFile(response.data?.file_url || null);
          setRevisionChanges(changes);
          
          // Success - show toast or notification
          alert("Revision submitted successfully! Your proposal has been sent back to R&D for review.");
          setNewFile(null);
          setIsEditing(false);
          // onClose();  // Don't close, show summary
          
          // Optionally refresh the parent component with backend status
          if (onUpdateProposal && proposal) {
            onUpdateProposal({
              ...proposal,
              status: response.data?.status || "review_rnd",
              lastUpdated: new Date().toISOString().split("T")[0],
            });
          }
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "Failed to submit revision. Please try again.";
        setRevisionError(errorMsg);
        console.error("Error submitting revision:", error);
      } finally {
        setIsSubmittingRevision(false);
      }
      return;
    }

    // Existing logic for non-revision edits
    if (onUpdateProposal) {
      const newFileUrl = newFile
        ? URL.createObjectURL(newFile)
        : editedProposal.uploadedFile;
      if (newFileUrl && !submittedFiles.includes(newFileUrl)) {
        setSubmittedFiles((prev) => [...prev, newFileUrl]);
      }
      const updatedProposal: Proposal = {
        ...(editedProposal as Proposal),
        uploadedFile: newFileUrl,
        status: "r&d evaluation",
        lastUpdated: new Date().toISOString().split("T")[0],
      };
      onUpdateProposal(updatedProposal);
      setIsEditing(false);
      setNewFile(null);
    }
  };

  const handleCancel = () => {
    setEditedProposal(proposal);
    setNewFile(null);
    setIsEditing(false);
  };

  const handleStartImplementation = () => {
    if (onUpdateProposal && proposal) {
      const updatedProposal: Proposal = {
        ...proposal,
        status: "r&d evaluation",
      };
      onUpdateProposal(updatedProposal);
      onClose();
      navigate("/users/proponent/ProponentMainLayout?tab=monitoring");
    }
  };

  const currentData = isEditing ? editedProposal : proposal;
  const canEdit = isInRevisionMode && isEditing;
  // Only allow editing of specific fields in revision mode
  const canEditTitle = isInRevisionMode && isEditing;
  const canEditSchedule = isInRevisionMode && isEditing;
  const canEditBudget = isInRevisionMode && isEditing;
  const canEditFile = isInRevisionMode && isEditing;
  // Restrict other fields in revision mode
  const canEditOtherFields = !isInRevisionMode && isEditing;
  const isFunded = proposal.status === "funded";
  const sites = (currentData.implementationSites as Site[]) || [];
  const coProponentsList = proposal.coProponent
    ? proposal.coProponent
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
    : [];

  const getStatusTheme = (status: string | undefined) => {
    const s = (status || "").toLowerCase();
    if (["endorsed"].includes(s))
      return {
        bg: "bg-green-200",
        border: "border-green-200",
        text: "text-green-800",
        icon: <CheckCheckIcon className="w-5 h-5 text-green-600" />,
        label: "Endorsed for funding",
      };
    if (["funded", "accepted", "approved"].includes(s))
      return {
        bg: "bg-emerald-50",
        border: "border-emerald-200",
        text: "text-emerald-800",
        icon: <CheckCircle className="w-5 h-5 text-emerald-600" />,
        label: "Project Funded",
      };

    // Check for Revision statuses
    if (["revise", "revision", "revision_rnd", "revision required"].includes(s)) {
      return {
        bg: "bg-orange-50",
        border: "border-orange-200",
        text: "text-orange-800",
        icon: <RefreshCw className="w-5 h-5 text-orange-600" />,
        label: "Revision Required",
      };
    }

    // Revised proposal submitted (under R&D review after revision)
    if (["review_rnd"].includes(s)) {
      return {
        bg: "bg-yellow-100",
        border: "border-yellow-300",
        text: "text-yellow-900",
        icon: <Edit className="w-5 h-5 text-yellow-700" />,
        label: "Revised Proposal",
      };
    }

    if (["rejected", "disapproved", "reject", "rejected_rnd", "rejected proposal"].includes(s))
      return {
        bg: "bg-red-50",
        border: "border-red-200",
        text: "text-red-800",
        icon: <XCircle className="w-5 h-5 text-red-600" />,
        label: "Proposal Rejected",
      };

    if (["review_rnd", "r&d evaluation"].includes(s))
      return {
        bg: "bg-blue-50",
        border: "border-blue-200",
        text: "text-blue-800",
        icon: <Microscope className="w-5 h-5 text-blue-600" />,
        label: "Under R&D Evaluation",
      };

    if (["evaluators assessment", "under_evaluation"].includes(s))
      return {
        bg: "bg-purple-50",
        border: "border-purple-200",
        text: "text-purple-800",
        icon: <FileCheck className="w-5 h-5 text-purple-600" />,
        label: "Under Evaluators Assessment",
      };

    if (["pending"].includes(s))
      return {
        bg: "bg-orange-100",
        border: "border-orange-200",
        text: "text-orange-800",
        icon: <Clock className="w-5 h-5 text-orange-600" />,
        label: "Pending",
      };

    return {
      bg: "bg-purple-50",
      border: "border-purple-200",
      text: "text-purple-800",
      icon: <FileCheck className="w-5 h-5 text-purple-600" />,
      label: "Under Evaluators Assessment",
    };
  };

  const theme = getStatusTheme(proposal.status);

  const getInputClass = (editable: boolean) => {
    return editable
      ? "bg-white border-slate-300 text-slate-900 focus:border-[#C8102E] focus:ring-1 focus:ring-[#C8102E]"
      : "bg-transparent border-transparent text-slate-900 font-medium px-0";
  };

  const renderFundedField = (content: React.ReactNode) => {
    if (isFunded && !isEditing) {
      return (
        <div className="relative group">
          {content}
          <div className="absolute -right-6 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
        </div>
      );
    }
    return content;
  };

  const activeComments =
    ["revise", "revision", "revision_rnd", "revision required", "under r&d review"].includes((proposal.status || "").toLowerCase())
      ? [
        { section: "Objectives Assessment", comment: revisionData?.objective_comment },
        { section: "Methodology Assessment", comment: revisionData?.methodology_comment },
        { section: "Budget Assessment", comment: revisionData?.budget_comment },
        { section: "Timeline Assessment", comment: revisionData?.timeline_comment },
        { section: "Overall Comments", comment: revisionData?.overall_comment },
      ].filter(item => item.comment)
      : ["rejected", "disapproved", "reject", "rejected_rnd", "rejected proposal"].includes((proposal.status || "").toLowerCase())
        ? [{
          section: "Reason for Rejection",
          comment: rejectionComment || "Loading details..."
        }]
        : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-in fade-in duration-200" >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] flex flex-col overflow-hidden">
        {/* --- HEADER --- */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-6 border-b border-gray-100 bg-white gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${theme.bg} ${theme.border} ${theme.text}`}
              >
                {theme.icon}
                {theme.label}
              </span>
              <span className="text-xs text-slate-500 font-normal">
                DOST Form No. 1B
              </span>
            </div>
            <h2 className="text-xl font-bold text-gray-900 leading-tight truncate pr-4">
              {currentData.title}
            </h2>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            {isInRevisionMode && !revisionChanges && (
              <button
                onClick={() => setIsEditing(!isEditing)}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${isEditing
                  ? "bg-slate-100 text-slate-700 border border-slate-300"
                  : "bg-[#C8102E] text-white hover:bg-[#a00c24]"
                  }`}
              >
                {isEditing ? (
                  <Eye className="w-3 h-3" />
                ) : (
                  <Edit className="w-3 h-3" />
                )}
                {isEditing ? "Preview Mode" : "Edit Proposal"}
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {isInRevisionMode && (
          <>
            <div className="flex items-center gap-2 text-sm font-medium text-orange-800 bg-orange-100/50 px-3 py-2 border border-orange-200">
              <RefreshCw className={`w-4 h-4 ${isLoadingRevision ? "animate-spin" : ""}`} />
              Deadline for Revision: {
                isLoadingRevision ? "Loading..." :
                  (revisionData?.created_at && revisionData?.deadline) ?
                    new Date(new Date(revisionData.created_at).getTime() + revisionData.deadline * 86400000).toLocaleDateString() :
                    (proposal.deadline ? new Date(proposal.deadline).toLocaleDateString() : "No deadline set")
              }
            </div>
          </>
        )}

        {/* --- BODY --- */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-6">
          {isFunded && (
            <div className="bg-green-50 rounded-xl border border-green-200 p-6 relative overflow-hidden group">
              <div className="relative z-10">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-green-900 mb-2 flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />{" "}
                      Project Funding Approved
                    </h3>
                    <p className="text-sm text-green-800 leading-relaxed mb-4">
                      Congratulations! Your project has been fully funded. Below
                      is the confirmed Project Leadership Team as indicated in
                      your proposal. Click start to proceed to the monitoring
                      phase.
                    </p>
                  </div>
                  <div className="w-full md:w-96 bg-white p-5 rounded-lg border border-green-200 flex flex-col justify-between">
                    <div>
                      <div className="mb-4">
                        <label className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase mb-2">
                          <User className="w-3.5 h-3.5" /> Project Leader
                        </label>
                        <div className="bg-slate-50 border border-slate-100 px-3 py-2 rounded-md font-semibold text-slate-800 text-sm">
                          {proposal.proponent}
                        </div>
                      </div>
                      <div className="mb-4">
                        <label className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase mb-2">
                          <ShieldCheck className="w-3.5 h-3.5" /> Co-Leader
                          Proponent(s)
                        </label>
                        {coProponentsList.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {coProponentsList.map((name, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center gap-1 bg-green-100 text-green-800 text-xs font-medium px-2.5 py-1.5 rounded-md border border-green-200"
                              >
                                {name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <div className="text-xs text-slate-400 italic bg-slate-50 p-2 rounded border border-slate-100">
                            No co-lead proponent indicated.
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={handleStartImplementation}
                      className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2 text-sm mt-2"
                    >
                      <Play className="w-4 h-4" /> Start Project Implementation
                    </button>
                  </div>
                </div>
              </div>
              <Users className="absolute -right-6 -bottom-6 w-32 h-32 text-green-200 opacity-40 pointer-events-none" />
            </div>
          )}

          {(['revise', 'revision', 'revision_rnd', 'revision required'].includes(proposal.status?.toLowerCase() || '') || ['rejected', 'disapproved', 'reject', 'rejected_rnd', 'rejected proposal'].includes(proposal.status?.toLowerCase())) && (
            <div
              className={`rounded-xl p-5 border ${theme.bg} ${theme.border}`}
            >
              <h3
                className={`text-sm font-bold ${theme.text} mb-3 flex items-center gap-2`}
              >
                {theme.icon} R&D Staff Feedback
              </h3>
              <div className="grid gap-3">
                {isLoadingRevision ? (
                  <div className="flex flex-col items-center justify-center py-8 text-gray-500 animate-pulse">
                    <RefreshCw className="w-6 h-6 animate-spin mb-2" />
                    <p className="text-sm">Fetching detailed feedback...</p>
                  </div>
                ) : (
                  activeComments.map((c, i) => {
                    const isRevision = ['revise', 'revision', 'revision_rnd', 'revision required'].includes(proposal.status?.toLowerCase() || '');
                    const isOverall = c.section === "Overall Comments";
                    const isRejection = c.section === "Reason for Rejection";
                    const cardBg =
                      isRevision && !isOverall
                        ? "bg-white border-white/50"
                        : "bg-white/60 border-white/50";
                    const textStyle = isRevision && isOverall ? "italic" : "";

                    if (isRejection && isLoadingRejection) {
                      return (
                        <div key={i} className="p-4 rounded-lg border bg-red-50/50 border-red-100 shadow-sm flex flex-col items-center justify-center py-6">
                          <RefreshCw className="w-5 h-5 animate-spin text-red-400 mb-2" />
                          <p className="text-xs text-red-400">Loading rejection details...</p>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={i}
                        className={`p-4 rounded-lg border ${c.section === "Reason for Rejection" ? "bg-red-50/50 border-red-100" : cardBg} shadow-sm`}
                      >
                        <h4
                          className={`text-xs uppercase font-bold tracking-wider mb-2 ${c.section === "Reason for Rejection" ? "text-red-700" : "text-gray-500"
                            } flex items-center gap-2`}
                        >
                          {c.section === "Reason for Rejection" ? (
                            <ShieldCheck className="w-3.5 h-3.5" />
                          ) : (
                            <BookOpen className="w-3.5 h-3.5" />
                          )}
                          {c.section}
                        </h4>
                        <div className={`text-sm leading-relaxed ${textStyle} ${c.section === "Reason for Rejection" ? "text-gray-700 whitespace-pre-wrap" : "text-gray-600"}`}>
                          {c.comment}
                        </div>

                        {c.section === "Reason for Rejection" && (
                          <div className="mt-4 border-t border-red-100 pt-3 flex flex-col sm:flex-row items-center justify-between gap-2">
                            <span className="text-xs text-red-500 font-medium italic flex items-center gap-1">
                              {rejectedBy === "Admin" ? "Admin Feedback" : "R&D Staff Feedback"}
                            </span>
                            {rejectionDate && (
                              <span className="text-xs text-slate-500 italic">
                                Rejected on: {new Date(rejectionDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Manila' })}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}


          {/* 3. File Management */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#C8102E]" /> Project
                Documents
              </h3>
              {submittedFiles.length > 1 && (
                <span className="text-xs bg-slate-200 text-slate-600 px-2 py-1 rounded-full">
                  v{submittedFiles.length}
                </span>
              )}
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-200 group hover:border-[#C8102E] transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                    <FileCheck className="w-5 h-5 text-[#C8102E]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900 truncate max-w-[200px] sm:max-w-xs" title={submittedFiles.length > 0 ? getFileName(submittedFiles[submittedFiles.length - 1]) : "No file uploaded"}>
                      {submittedFiles.length > 0
                        ? getFileName(submittedFiles[submittedFiles.length - 1])
                        : "No file uploaded"}
                    </p>
                    <p className="text-xs text-slate-500">
                      {submittedFiles.length > 0
                        ? "Latest version"
                        : "Pending upload"}
                    </p>
                  </div>
                </div>
                {submittedFiles.length > 0 && (
                  <a
                    href={submittedFiles[submittedFiles.length - 1]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-slate-500 hover:bg-slate-50 rounded-lg transition-colors inline-flex items-center justify-center"
                    title="Open/Download"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                )}
              </div>
              {canEditFile && (
                <div
                  className={`border-2 border-dashed rounded-lg p-4 transition-colors ${newFile
                    ? "border-green-300 bg-green-50"
                    : "border-slate-300 hover:border-[#C8102E] hover:bg-white"
                    }`}
                >
                  {!newFile ? (
                    <label className="flex flex-col items-center justify-center gap-2 cursor-pointer">
                      <Upload className="w-5 h-5 text-slate-400" />
                      <span className="text-sm font-medium text-slate-600">
                        Click to upload revised PDF
                      </span>
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                        <div>
                          <p className="text-sm font-medium text-green-800">
                            Ready to submit
                          </p>
                          <p className="text-xs text-green-600 max-w-[200px] truncate">
                            {newFile.name}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setNewFile(null)}
                        className="text-xs text-red-600 hover:underline font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Revision Summary - Show after submission */}
          {revisionChanges && (
            <div className="bg-green-50 rounded-xl p-6 border border-green-200">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <h3 className="text-lg font-bold text-green-900">Revision Submitted Successfully</h3>
              </div>

              {/* Files Comparison */}
              <div className="mb-6">
                <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#C8102E]" /> Project Documents
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Original File */}
                  <div className="bg-white p-4 rounded-lg border border-slate-200">
                    <p className="text-xs font-bold text-slate-500 uppercase mb-2">Original File</p>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                        <FileCheck className="w-5 h-5 text-slate-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{revisionChanges.file?.old || "N/A"}</p>
                        <p className="text-xs text-slate-500">Previous version</p>
                      </div>
                    </div>
                  </div>

                  {/* New File */}
                  <div className="bg-white p-4 rounded-lg border border-green-200 shadow-md">
                    <p className="text-xs font-bold text-green-600 uppercase mb-2">New File</p>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <FileCheck className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{revisionChanges.file?.new || "N/A"}</p>
                        <p className="text-xs text-green-600">Submitted version</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modified Fields */}
              <div>
                <h4 className="text-sm font-bold text-slate-900 mb-3">Modified Fields</h4>
                <div className="space-y-2">
                  {revisionChanges.projectTitle && (
                    <div className="bg-white p-3 rounded-lg border border-slate-200 text-sm">
                      <p className="font-semibold text-slate-900">Project Title</p>
                      <div className="flex items-center gap-2 mt-1 text-xs">
                        <span className="text-slate-500 line-through">{revisionChanges.projectTitle.old}</span>
                        <span className="text-slate-400">→</span>
                        <span className="text-green-700 font-medium">{revisionChanges.projectTitle.new}</span>
                      </div>
                    </div>
                  )}

                  {revisionChanges.startDate && (
                    <div className="bg-white p-3 rounded-lg border border-slate-200 text-sm">
                      <p className="font-semibold text-slate-900">Start Date</p>
                      <div className="flex items-center gap-2 mt-1 text-xs">
                        <span className="text-slate-500 line-through">{revisionChanges.startDate.old}</span>
                        <span className="text-slate-400">→</span>
                        <span className="text-green-700 font-medium">{revisionChanges.startDate.new}</span>
                      </div>
                    </div>
                  )}

                  {revisionChanges.endDate && (
                    <div className="bg-white p-3 rounded-lg border border-slate-200 text-sm">
                      <p className="font-semibold text-slate-900">End Date</p>
                      <div className="flex items-center gap-2 mt-1 text-xs">
                        <span className="text-slate-500 line-through">{revisionChanges.endDate.old}</span>
                        <span className="text-slate-400">→</span>
                        <span className="text-green-700 font-medium">{revisionChanges.endDate.new}</span>
                      </div>
                    </div>
                  )}

                  {revisionChanges.budget?.changed && (
                    <div className="bg-white p-3 rounded-lg border border-slate-200 text-sm">
                      <p className="font-semibold text-slate-900">Budget by Source</p>
                      <p className="text-xs text-green-700 mt-1">✓ Updated</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Status Badge */}
              <div className="mt-4 p-3 rounded-lg border border-yellow-300 bg-yellow-100">
                <p className="text-xs font-bold text-yellow-900 uppercase">Current Status</p>
                <p className="text-sm font-bold text-yellow-900 mt-1">Revised Proposal</p>
                <p className="text-xs text-yellow-800">Your revision has been submitted and is now under R&D evaluation.</p>
              </div>

              <button
                onClick={onClose}
                className="w-full mt-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          )}

          {/* 3.5. Project Title (Editable in Revision Mode) */}
          {canEditTitle && (
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-4 h-4 text-[#C8102E]" />
                <label className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Project Title
                </label>
              </div>
              <input
                type="text"
                value={editedProposal?.title || ""}
                onChange={(e) => setEditedProposal({ ...editedProposal, title: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-transparent"
                placeholder="Enter project title"
              />
            </div>
          )}

          {/* 4. LEADER & AGENCY (Updated Layout & Gray Background) */}
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-6">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-3 mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-[#C8102E]" /> Leader & Agency
              Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
              {/* Row 1: Leader & Gender */}
              <div>
                <label className="text-xs text-slate-500 font-bold tracking-wider uppercase block mb-1">
                  Leader / Proponent
                </label>
                {canEditOtherFields ? (
                  <input
                    type="text"
                    value={currentData.proponent}
                    onChange={(e) =>
                      handleInputChange("proponent", e.target.value)
                    }
                    className={`w-full px-3 py-2 rounded-lg border ${getInputClass(
                      true
                    )}`}
                  />
                ) : (
                  renderFundedField(
                    <p className="text-sm font-bold text-slate-900">
                      {currentData.proponent}
                    </p>
                  )
                )}
              </div>
              {/* Gender Key Removed */}

              {/* Row 2: Agency & Address */}
              <div>
                <label className="text-xs text-slate-500 font-bold tracking-wider uppercase block mb-1">
                  Agency
                </label>
                {canEditOtherFields ? (
                  <select
                    value={currentData.agency}
                    onChange={(e) => handleInputChange("agency", e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border ${getInputClass(true)}`}
                  >
                    <option value="">Select Agency</option>
                    {agencies.map((agency) => (
                      <option key={agency.id} value={agency.name}>{agency.name}</option>
                    ))}
                  </select>
                ) : (
                  renderFundedField(
                    <div className="flex items-start gap-2">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                      <p className="text-sm font-medium text-slate-900">
                        {currentData.agency}
                      </p>
                    </div>
                  )
                )}
              </div>

              {/* Department (Added) */}
              <div>
                <label className="text-xs text-slate-500 font-bold tracking-wider uppercase block mb-1">
                  Department
                </label>
                {canEditOtherFields ? (
                  <select
                    value={currentData.department || ""}
                    onChange={(e) => handleInputChange("department" as any, e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border ${getInputClass(true)}`}
                  >
                    <option value="">Select Department</option>
                    {departments.map((dep) => (
                      <option key={dep.id} value={dep.name}>{dep.name}</option>
                    ))}
                  </select>
                ) : (
                  renderFundedField(
                    <p className="text-sm font-medium text-slate-900">
                      {(currentData as any).department || "N/A"}
                    </p>
                  )
                )}
              </div>

              <div>
                <label className="text-xs text-slate-500 font-bold tracking-wider uppercase block mb-1">
                  Address
                </label>
                {canEditOtherFields ? (
                  <div className="space-y-2">
                    {agencyAddresses.length > 0 && (
                      <select
                        onChange={(e) => handleAddressSelect(e.target.value)}
                        className={`w-full px-3 py-2 rounded-lg border ${getInputClass(true)}`}
                        defaultValue=""
                      >
                        <option value="" disabled>Select from Agency Addresses</option>
                        {agencyAddresses.map(addr => (
                          <option key={addr.id} value={addr.id}>
                            {[addr.street, addr.barangay, addr.city].filter(Boolean).join(", ")}
                          </option>
                        ))}
                      </select>
                    )}
                    <textarea
                      value={currentData.address}
                      onChange={(e) =>
                        handleInputChange("address", e.target.value)
                      }
                      rows={2}
                      className={`w-full px-3 py-2 rounded-lg border ${getInputClass(
                        true
                      )}`}
                      placeholder="Or enter address manually"
                    />
                  </div>
                ) : (
                  renderFundedField(
                    <div className="flex items-start gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-slate-900">
                        {(() => {
                          const addrString = currentData.address;
                          if (addrString && addrString !== "N/A" && addrString.trim() !== "") {
                            return addrString;
                          }
                          // Fallback to first agency address if available
                          if (agencyAddresses.length > 0) {
                            const a = agencyAddresses[0];
                            const parts = [a.street, a.barangay, a.city].filter(Boolean);
                            return parts.length > 0 ? parts.join(", ") : "N/A";
                          }
                          return "N/A";
                        })()}
                      </p>
                    </div>
                  )
                )}
              </div>

              {/* Row 3: Telephone & Email (SIDE BY SIDE NOW) */}
              <div>
                <label className="text-xs text-slate-500 font-bold tracking-wider uppercase block mb-1">
                  Telephone
                </label>
                {canEditOtherFields ? (
                  <input
                    type="text"
                    value={currentData.telephone}
                    onChange={(e) =>
                      handleInputChange("telephone", e.target.value)
                    }
                    className={`w-full px-3 py-2 rounded-lg border ${getInputClass(
                      true
                    )}`}
                  />
                ) : (
                  renderFundedField(
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <p className="text-sm text-slate-900">
                        {currentData.telephone}
                      </p>
                    </div>
                  )
                )}
              </div>
              <div>
                <label className="text-xs text-slate-500 font-bold tracking-wider uppercase block mb-1">
                  Email
                </label>
                {canEditOtherFields ? (
                  <input
                    type="email"
                    value={currentData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border ${getInputClass(
                      true
                    )}`}
                  />
                ) : (
                  renderFundedField(
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <p className="text-sm text-slate-900">
                        {currentData.email}
                      </p>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>

          {/* 5. IMPLEMENTATION SITES (Gray Background) */}
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4 border-b border-slate-200 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Globe className="w-4 h-4 text-[#C8102E]" /> Implementation
                Sites ({sites.length})
              </h3>
              {canEditOtherFields && (
                <button
                  onClick={handleAddSite}
                  className="flex items-center gap-1 text-xs bg-[#C8102E] text-white px-2 py-1 rounded hover:bg-[#a00c24] transition-colors"
                >
                  <Plus className="w-3 h-3" /> Add Site
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {sites.map((site, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 bg-white border border-slate-200 rounded-lg"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 text-blue-600">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div className="flex-1 space-y-2">
                    {canEditOtherFields ? (
                      <>
                        <input
                          type="text"
                          value={site.site}
                          onChange={(e) =>
                            handleSiteChange(index, "site", e.target.value)
                          }
                          placeholder="Site Name"
                          className={`w-full px-2 py-1 text-xs border rounded ${getInputClass(
                            true
                          )}`}
                        />
                        <input
                          type="text"
                          value={site.city}
                          onChange={(e) =>
                            handleSiteChange(index, "city", e.target.value)
                          }
                          placeholder="City/Municipality"
                          className={`w-full px-2 py-1 text-xs border rounded ${getInputClass(
                            true
                          )}`}
                        />
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-bold text-slate-900 leading-tight">
                          {site.site}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {site.city}
                        </p>
                      </>
                    )}
                  </div>
                  {canEditOtherFields && (
                    <button
                      onClick={() => handleRemoveSite(index)}
                      className="text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 6. INDIVIDUAL DETAIL CARDS GRID (Gray Backgrounds) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Cooperating Agencies */}
            <div className="bg-slate-50 rounded-lg border border-slate-200 p-4">
              <div className="flex items-center gap-1.5 mb-2">
                <Users className="w-4 h-4 text-[#C8102E]" />
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Cooperating Agencies
                </h4>
              </div>
              {canEditOtherFields ? (
                <input
                  type="text"
                  value={currentData.cooperatingAgencies}
                  onChange={(e) =>
                    handleInputChange("cooperatingAgencies", e.target.value)
                  }
                  className={`w-full px-3 py-2 rounded-lg border ${getInputClass(
                    true
                  )}`}
                />
              ) : (
                <p className="text-sm font-medium text-slate-900">
                  {(() => {
                    const ca = currentData.cooperatingAgencies;
                    if (!ca || (Array.isArray(ca) && ca.length === 0)) return "None";
                    if (Array.isArray(ca)) {
                      return ca.map((c: any) => c.name || c).join(", ");
                    }
                    return ca;
                  })()}
                </p>
              )}
            </div>

            {/* Mode of Implementation */}
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
              <div className="flex items-center gap-1.5 mb-2">
                <FileText className="w-4 h-4 text-[#C8102E]" />
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Mode of Implementation
                </h4>
              </div>
              {canEditOtherFields ? (
                <input
                  type="text"
                  value={currentData.modeOfImplementation}
                  onChange={(e) =>
                    handleInputChange("modeOfImplementation", e.target.value)
                  }
                  className={`w-full px-3 py-2 rounded-lg border ${getInputClass(
                    true
                  )}`}
                />
              ) : (
                <p className="text-sm font-medium text-slate-900">
                  {currentData.modeOfImplementation}
                </p>
              )}
            </div>

            {/* Classification */}
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                <Tags className="w-4 h-4 text-[#C8102E]" /> Classification
              </h4>
              {canEditOtherFields ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={currentData.classification}
                    onChange={(e) =>
                      handleInputChange("classification", e.target.value)
                    }
                    placeholder="Type"
                    className={`w-full px-3 py-2 rounded-lg border ${getInputClass(
                      true
                    )}`}
                  />
                  <textarea
                    value={currentData.classificationDetails || ""}
                    onChange={(e) =>
                      handleInputChange("classificationDetails", e.target.value)
                    }
                    placeholder="Details"
                    rows={2}
                    className={`w-full px-3 py-2 rounded-lg border ${getInputClass(
                      true
                    )}`}
                  />
                </div>
              ) : (
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {formatClassificationType(currentData.classification || (currentData as any).classification_type || "")}
                  </p>
                  {(currentData.classificationDetails || (currentData as any).class_input) && (
                    <p className="text-xs text-slate-600 mt-1">
                      {formatClassInput(currentData.classificationDetails || (currentData as any).class_input || "")}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* R&D Station */}
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
              <div className="flex items-center gap-1.5 mb-2">
                <Microscope className="w-4 h-4 text-[#C8102E]" />
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  R&D Station
                </h4>
              </div>
              {canEditOtherFields ? (
                <select
                  value={currentData.rdStation}
                  onChange={(e) => handleInputChange("rdStation", e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border ${getInputClass(true)}`}
                >
                  <option value="">Select Station</option>
                  {stations.map((s) => (
                    <option key={s.id} value={s.name}>{s.name}</option>
                  ))}
                </select>
              ) : (
                <p className="text-sm font-medium text-slate-900">
                  {currentData.rdStation}
                </p>
              )}
            </div>

            {/* Priority Areas */}
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
              <div className="flex items-center gap-1.5 mb-2">
                <Target className="w-4 h-4 text-[#C8102E]" />
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Priority Areas
                </h4>
              </div>
              {canEditOtherFields ? (
                <select
                  value={currentData.priorityAreas}
                  onChange={(e) => handleInputChange("priorityAreas", e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border ${getInputClass(true)}`}
                >
                  <option value="">Select Priority</option>
                  {priorities.map((p) => (
                    <option key={p.id} value={p.name}>{p.name}</option>
                  ))}
                </select>
              ) : (
                <p className="text-sm font-medium text-slate-900">
                  {currentData.priorityAreas}
                </p>
              )}
            </div>

            {/* Discipline */}
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
              <div className="flex items-center gap-1.5 mb-2">
                <BookOpen className="w-4 h-4 text-[#C8102E]" />
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Discipline
                </h4>
              </div>
              {canEditOtherFields ? (
                <select
                  value={currentData.discipline}
                  onChange={(e) => handleInputChange("discipline", e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border ${getInputClass(true)}`}
                >
                  <option value="">Select Discipline</option>
                  {disciplines.map((d) => (
                    <option key={d.id} value={d.name}>{d.name}</option>
                  ))}
                </select>
              ) : (
                <p className="text-sm font-medium text-slate-900">
                  {currentData.discipline}
                </p>
              )}
            </div>
            {/* Sector (Added) */}
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
              <div className="flex items-center gap-1.5 mb-2">
                <Target className="w-4 h-4 text-[#C8102E]" />
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Sector
                </h4>
              </div>
              {canEditOtherFields ? (
                <select
                  value={currentData.sector}
                  onChange={(e) => handleInputChange("sector", e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border ${getInputClass(true)}`}
                >
                  <option value="">Select Sector</option>
                  {sectors.map((s) => (
                    <option key={s.id} value={s.name}>{s.name}</option>
                  ))}
                </select>
              ) : (
                <p className="text-sm font-medium text-slate-900">
                  {currentData.sector}
                </p>
              )}
            </div>
          </div>

          {/* 7. Schedule & Budget (Gray Background) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Implementing Schedule */}
            <div className="lg:col-span-3 bg-slate-50 rounded-xl border border-slate-200 p-4">
              <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#C8102E]" /> Implementing
                Schedule
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-slate-500 mb-1">School Year</p>
                  {canEditOtherFields ? (
                    <input
                      type="text"
                      value={currentData.schoolYear}
                      className="w-full px-2 py-1 text-sm border rounded bg-slate-100 text-slate-600"
                    />
                  ) : (
                    renderFundedField(
                      <p className="text-sm font-semibold text-slate-900">
                        {currentData.schoolYear}
                      </p>
                    )
                  )}
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Duration</p>
                  {canEditOtherFields ? (
                    <input
                      type="text"
                      value={currentData.duration}
                      readOnly
                      className="w-full px-2 py-1 text-sm border rounded bg-slate-100 text-slate-600"
                    />
                  ) : (
                    renderFundedField(
                      <p className="text-sm font-semibold text-slate-900">
                        {currentData.duration}
                      </p>
                    )
                  )}
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Start Date</p>
                  {canEditSchedule ? (
                    <input
                      type="date"
                      value={currentData.startDate}
                      onChange={(e) =>
                        handleDateChange("startDate", e.target.value)
                      }
                      className={`w-full px-2 py-1 text-sm border rounded ${getInputClass(
                        true
                      )}`}
                    />
                  ) : (
                    renderFundedField(
                      <p className="text-sm font-medium text-slate-900">
                        {currentData.startDate}
                      </p>
                    )
                  )}
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">End Date</p>
                  {canEditSchedule ? (
                    <input
                      type="date"
                      value={currentData.endDate}
                      onChange={(e) =>
                        handleDateChange("endDate", e.target.value)
                      }
                      className={`w-full px-2 py-1 text-sm border rounded ${getInputClass(
                        true
                      )}`}
                    />
                  ) : (
                    renderFundedField(
                      <p className="text-sm font-medium text-slate-900">
                        {currentData.endDate}
                      </p>
                    )
                  )}
                </div>
              </div>
            </div>

            {/* Estimated Budget (Fixed Overflow) */}
            <div className="lg:col-span-3 bg-slate-50 rounded-xl border border-slate-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-[#C8102E]" /> Estimated
                  Budget by Source
                </h3>
                {canEditBudget && (
                  <button
                    onClick={handleAddBudgetItem}
                    className="flex items-center gap-1 text-xs bg-[#C8102E] text-white px-2 py-1 rounded hover:bg-[#a00c24] transition-colors"
                  >
                    <Plus className="w-3 h-3" /> Add Item
                  </button>
                )}
              </div>
              <div className="">
                {" "}
                {/* Removed overflow-x-auto to prevent horizontal scrolling */}
                <div className="space-y-6">
                  {currentData.budgetSources.map((budget, index) => (
                    <div key={index} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                      {/* Card Header: Source Name & Total */}
                      <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="bg-blue-100 p-1.5 rounded text-blue-700">
                            <DollarSign className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Source of Funds</p>
                            <h4 className="font-bold text-slate-800 text-sm">{budget.source}</h4>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Subtotal</p>
                          <p className="text-sm font-bold text-[#C8102E]">{budget.total}</p>
                        </div>
                      </div>

                      {/* Card Body: Breakdown Columns */}
                      <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                        {/* PS Column */}
                        <div className="space-y-2 pt-2 md:pt-0">
                          <div className="flex justify-between items-center mb-2">
                            <h5 className="font-bold text-xs text-slate-600 uppercase">Personal Services (PS)</h5>
                            <span className="text-xs font-semibold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">{budget.ps}</span>
                          </div>
                          <div className="space-y-1">
                            {budget.breakdown?.ps && budget.breakdown.ps.length > 0 ? (
                              budget.breakdown.ps.map((item, i) => (
                                <div key={i} className="flex justify-between text-xs text-slate-500 hover:bg-slate-50 p-1 rounded">
                                  <span>{item.item}</span>
                                  <span className="font-medium text-slate-700">₱{item.amount.toLocaleString()}</span>
                                </div>
                              ))
                            ) : (
                              <p className="text-xs italic text-slate-400">No items</p>
                            )}
                          </div>
                        </div>

                        {/* MOOE Column */}
                        <div className="space-y-2 pt-2 md:pt-0 pl-0 md:pl-4">
                          <div className="flex justify-between items-center mb-2">
                            <h5 className="font-bold text-xs text-slate-600 uppercase">MOOE</h5>
                            <span className="text-xs font-semibold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">{budget.mooe}</span>
                          </div>
                          <div className="space-y-1">
                            {budget.breakdown?.mooe && budget.breakdown.mooe.length > 0 ? (
                              budget.breakdown.mooe.map((item, i) => (
                                <div key={i} className="flex justify-between text-xs text-slate-500 hover:bg-slate-50 p-1 rounded">
                                  <span>{item.item}</span>
                                  <span className="font-medium text-slate-700">₱{item.amount.toLocaleString()}</span>
                                </div>
                              ))
                            ) : (
                              <p className="text-xs italic text-slate-400">No items</p>
                            )}
                          </div>
                        </div>

                        {/* CO Column */}
                        <div className="space-y-2 pt-2 md:pt-0 pl-0 md:pl-4">
                          <div className="flex justify-between items-center mb-2">
                            <h5 className="font-bold text-xs text-slate-600 uppercase">Capital Outlay (CO)</h5>
                            <span className="text-xs font-semibold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">{budget.co}</span>
                          </div>
                          <div className="space-y-1">
                            {budget.breakdown?.co && budget.breakdown.co.length > 0 ? (
                              budget.breakdown.co.map((item, i) => (
                                <div key={i} className="flex justify-between text-xs text-slate-500 hover:bg-slate-50 p-1 rounded">
                                  <span>{item.item}</span>
                                  <span className="font-medium text-slate-700">₱{item.amount.toLocaleString()}</span>
                                </div>
                              ))
                            ) : (
                              <p className="text-xs italic text-slate-400">No items</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Grand Total Footer */}
                  <div className="bg-slate-100 rounded-xl p-4 flex justify-between items-center border border-slate-200">
                    <div>
                      <h4 className="font-bold text-slate-700 text-sm uppercase">Total Project Cost</h4>
                      <p className="text-xs text-slate-500">Grand total of all sources</p>
                    </div>
                    <div className="text-xl font-black text-[#C8102E] font-mono">
                      {currentData.budgetTotal}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* --- FOOTER --- */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex flex-col gap-3 flex-shrink-0">
          {revisionError && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 text-xs text-red-700">
                {revisionError}
              </div>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">
              {isEditing ? (isInRevisionMode ? "Revision Edit Mode Active" : "Editing Mode Active") : "Read-Only View"}
            </span>
            <div className="flex gap-3">
              {isEditing ? (
                <>
                  <button
                    onClick={handleCancel}
                    disabled={isSubmittingRevision}
                    className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSubmittingRevision || (isInRevisionMode && !newFile)}
                    className="px-4 py-2 text-sm font-medium text-white bg-[#C8102E] border border-[#C8102E] rounded-lg hover:bg-[#a00c24] transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmittingRevision ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" /> Submitting...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" /> {isInRevisionMode ? "Submit Revision" : "Submit Proposal"}
                      </>
                    )}
                  </button>
                </>
              ) : (
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      </div >
    </div >
  );
};

export default DetailedProposalModal;
