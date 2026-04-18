import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  X,
  Building2,
  Target,
  Calendar,
  HandCoins,
  Phone,
  RefreshCw,
  Mail,
  MapPin,
  FileText,
  User,
  Microscope,
  Tags,
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
  CalendarX2,
  CalendarSync,
  AlertCircle,
  Loader,
  Loader2,
  AlertTriangle,
  Signature,
  MessageSquare,
} from "lucide-react";
import { differenceInMonths, parseISO, isValid, addMonths, format } from "date-fns";
import Swal from "sweetalert2";
import { openProposalFile } from "../../utils/signed-url";
import { api } from "../../utils/axios";
import type { Proposal, BudgetSource } from "../../types/proponentTypes";
import { type LookupItem, fetchAgencyAddresses, type AddressItem, fetchRejectionSummary, fetchRevisionSummary, type RevisionSummary, submitRevisedProposal, requestProponentExtension, getProponentExtensionRequests, type ProponentExtensionRequest } from "../../services/proposal.api";
import { SettingsApi, type LateSubmissionPolicy } from "../../services/admin/SettingsApi";
import { formatDate, formatDateTime } from "../../utils/date-formatter";
import InviteMemberModal from "./InviteMemberModal";
import { useAuthContext } from "../../context/AuthContext";
import { fetchFundedProjects } from "../../services/ProjectMonitoringApi";
import { fetchProjectMembers, type ProjectMemberData } from "../../services/ProjectMemberApi";
import { ProposalInsightButtons } from "../shared/ProposalInsightsPanel";

const extractS3Key = (url: string): string | null => {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    let path = parsed.pathname.replace(/^\//, '');
    const pathStyleMatch = parsed.hostname.match(/^s3[.-]/);
    if (pathStyleMatch) {
      const segments = path.split('/');
      segments.shift();
      path = segments.join('/');
    }
    return decodeURIComponent(path) || null;
  } catch {
    return null;
  }
};

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

const ScrollKeyframes = () => (
  <style>{`
    @keyframes banner-marquee-bounce {
      0%, 15% { transform: translateX(0); }
      85%, 100% { transform: translateX(var(--scroll-amount)); }
    }
    .animate-banner-marquee {
      animation: banner-marquee-bounce 8s alternate infinite ease-in-out;
    }
  `}</style>
);

const ScrollingBannerText: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "" }) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const textRef = React.useRef<HTMLDivElement>(null);
  const [shouldAnimate, setShouldAnimate] = React.useState(false);
  const [scrollAmount, setScrollAmount] = React.useState(0);

  React.useEffect(() => {
    const checkOverflow = () => {
      if (containerRef.current && textRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        const textWidth = textRef.current.scrollWidth;
        if (textWidth > containerWidth) {
          setShouldAnimate(true);
          setScrollAmount(textWidth - containerWidth + 24); // 24px extra buffer padding
        } else {
          setShouldAnimate(false);
          setScrollAmount(0);
        }
      }
    };
    checkOverflow();
    setTimeout(checkOverflow, 100);
    window.addEventListener('resize', checkOverflow);
    return () => window.removeEventListener('resize', checkOverflow);
  }, [children]);

  return (
    <div ref={containerRef} className={`overflow-hidden flex-1 ${className}`}>
      <div
        ref={textRef}
        className={`whitespace-nowrap inline-block ${shouldAnimate ? 'animate-banner-marquee' : ''}`}
        style={shouldAnimate ? { ['--scroll-amount' as any]: `-${scrollAmount}px` } : undefined}
      >
        {children}
      </div>
    </div>
  );
};

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
  const { user } = useAuthContext();
  const [isEditing, setIsEditing] = useState(false);
  const [editedProposal, setEditedProposal] = useState<Proposal | null>(null);
  const [newFile, setNewFile] = useState<File | null>(null);
  const [submittedFiles, setSubmittedFiles] = useState<string[]>([]);
  const [agencyAddresses, setAgencyAddresses] = useState<AddressItem[]>([]);
  const [rejectionComment, setRejectionComment] = useState<string | null>(null);
  const [rejectionDate, setRejectionDate] = useState<string | null>(null);
  const [revisionData, setRevisionData] = useState<RevisionSummary | null>(null);
  const [isLoadingRevision, setIsLoadingRevision] = useState(false);
  const [isLoadingRejection, setIsLoadingRejection] = useState(false);
  const [isSubmittingRevision, setIsSubmittingRevision] = useState(false);
  const [revisionError, setRevisionError] = useState<string | null>(null);

  // Inline funding document viewer state
  const [fundingSignedUrl, setFundingSignedUrl] = useState<string | null>(null);
  const [isLoadingFundingUrl, setIsLoadingFundingUrl] = useState(false);
  const [fundingUrlError, setFundingUrlError] = useState<string | null>(null);

  // Resolved funded project data (fetched independently so it works even if getAll doesn't return it)
  const [resolvedFundedProjectId, setResolvedFundedProjectId] = useState<number | null>(null);
  const [resolvedProjectLeadId, setResolvedProjectLeadId] = useState<string | null>(null);
  const [projectMembers, setProjectMembers] = useState<ProjectMemberData[]>([]);
  const [isLoadingProjectMembers, setIsLoadingProjectMembers] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);

  // Extension request state
  const [extensionRequest, setExtensionRequest] = useState<ProponentExtensionRequest | null>(null);
  const [showExtensionForm, setShowExtensionForm] = useState(false);
  const [extensionReason, setExtensionReason] = useState("");
  const [isSubmittingExtension, setIsSubmittingExtension] = useState(false);
  const [lateSubmissionPolicy, setLateSubmissionPolicy] = useState<LateSubmissionPolicy | null>(null);

  const [revisionChanges, setRevisionChanges] = useState<{
    projectTitle?: { old: string; new: string };
    startDate?: { old: string; new: string };
    endDate?: { old: string; new: string };
    budget?: { changed: boolean };
    file?: { old: string; new: string };
  } | null>(null);
  const normalizedStatus = (proposal?.status || '').toLowerCase().trim();
  const isInRevisionMode = ['revise', 'revision', 'revision_rnd', 'revision required', 'not_submitted', 'not submitted'].includes(normalizedStatus);
  const isNotSubmittedMode = ['not_submitted', 'not submitted'].includes(normalizedStatus);
  const isRejectedMode = ['rejected', 'disapproved', 'reject', 'rejected_rnd', 'rejected proposal'].includes(normalizedStatus);

  const getOrdinal = (n: number) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  // Fetch signed URL for inline funding document
  const isFundedForEffect = (proposal?.status || '').toLowerCase().trim() === 'funded';
  useEffect(() => {
    if (!isOpen || !isFundedForEffect || !proposal?.fundingDocumentUrl) {
      setFundingSignedUrl(null);
      setFundingUrlError(null);
      return;
    }
    const fetchSignedUrl = async () => {
      setIsLoadingFundingUrl(true);
      setFundingUrlError(null);
      try {
        const key = extractS3Key(proposal.fundingDocumentUrl!);
        if (!key) {
          setFundingSignedUrl(null);
          setFundingUrlError('Invalid document URL.');
          return;
        }
        const { data } = await api.get<{ url: string }>('/files/signed-url', {
          params: { key, bucket: 'proposals' },
          withCredentials: true,
        });
        setFundingSignedUrl(data.url);
      } catch (err: any) {
        const status = err?.response?.status;
        if (status === 404) {
          setFundingSignedUrl(null);
          setFundingUrlError('The funding approval document is no longer available in storage. It may have been removed or was not uploaded successfully.');
        } else {
          setFundingSignedUrl(null);
          setFundingUrlError('Could not generate a secure preview link.');
        }
      } finally {
        setIsLoadingFundingUrl(false);
      }
    };
    fetchSignedUrl();
  }, [isOpen, isFundedForEffect, proposal?.fundingDocumentUrl]);

  // Resolve funded project ID + lead — uses prop if available, otherwise fetches from /project/funded
  useEffect(() => {
    if (!isOpen || !isFundedForEffect || !proposal) {
      setResolvedFundedProjectId(null);
      setResolvedProjectLeadId(null);
      setProjectMembers([]);
      return;
    }
    // If already passed from parent (backend includes id in getAll), use it directly
    if (proposal.fundedProjectId) {
      setResolvedFundedProjectId(proposal.fundedProjectId);
      setResolvedProjectLeadId(proposal.fundedProjectLeadId || null);
      return;
    }
    // Otherwise fetch funded projects and match by proposal_id
    const resolve = async () => {
      try {
        const projects = await fetchFundedProjects();
        const match = projects.find(p => String(p.proposal_id) === String(proposal.id));
        if (match) {
          setResolvedFundedProjectId(match.id);
          setResolvedProjectLeadId(match.project_lead_id);
        }
      } catch {
        // silently fail — co-leads section just won't show
      }
    };
    resolve();
  }, [isOpen, isFundedForEffect, proposal?.id, proposal?.fundedProjectId]);

  useEffect(() => {
    if (!isOpen || !resolvedFundedProjectId) {
      setProjectMembers([]);
      setIsLoadingProjectMembers(false);
      return;
    }

    const loadMembers = async () => {
      setIsLoadingProjectMembers(true);
      try {
        const members = await fetchProjectMembers(resolvedFundedProjectId);
        setProjectMembers(members);
      } catch {
        setProjectMembers([]);
      } finally {
        setIsLoadingProjectMembers(false);
      }
    };

    loadMembers();
  }, [isOpen, resolvedFundedProjectId]);

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

        } catch (error) {
          console.error("Failed to fetch rejection summary:", error);
          setRejectionComment("Failed to load rejection details.");
          setRejectionDate(null);

        } finally {
          setIsLoadingRejection(false);
        }
      } else {
        setRejectionComment(null);

        setIsLoadingRejection(false);
      }
    };

    const fetchRevision = async () => {
      const pStatus = (proposal?.status || '').toLowerCase();
      setRevisionData(null);
      setIsLoadingRevision(true);
      if (['revise', 'revision', 'revision_rnd', 'revision required', 'under r&d review', 'not_submitted'].includes(pStatus)) {
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
        setIsLoadingRevision(false);
      }
    };

    const fetchExtensionRequest = async () => {
      if (!proposal?.id) return;
      try {
        const requests = await getProponentExtensionRequests(Number(proposal.id));
        // Get the most recent extension request
        const latest = requests.length > 0 ? requests[0] : null;
        setExtensionRequest(latest);
      } catch (error) {
        console.error("Failed to fetch extension requests:", error);
        setExtensionRequest(null);
      }
    };

    if (isOpen && proposal) {
      fetchRejection();
      fetchRevision();
      fetchExtensionRequest();

      const fetchPolicy = async () => {
        try {
          const policy = await SettingsApi.getLateSubmissionPolicy();
          setLateSubmissionPolicy(policy);
        } catch (error) {
          console.error("Failed to load late submission policy", error);
          setLateSubmissionPolicy(null);
        }
      };
      fetchPolicy();
    } else if (!isOpen) {
      setRevisionData(null);
      setExtensionRequest(null);
      setShowExtensionForm(false);
      setLateSubmissionPolicy(null);
      setIsLoadingRevision(false);
      setIsLoadingRejection(false);
    }
  }, [isOpen, proposal?.status, proposal?.id]);

  useEffect(() => {
    if (proposal) {
      setEditedProposal(proposal);
      if (proposal.versions && proposal.versions.length > 0) {
        setSubmittedFiles(proposal.versions);
      } else if (proposal.uploadedFile) {
        setSubmittedFiles([proposal.uploadedFile]);
      } else {
        setSubmittedFiles([]);
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
  // --- DURATION LOGIC ---
  const calculateImplementationDates = (startStr: string, durationStr: string = "6") => {
    if (!startStr || !editedProposal) return;
    const start = parseISO(startStr);
    if (!isValid(start)) return;

    const effectiveDuration = parseInt(durationStr || "6", 10);
    if (!isNaN(effectiveDuration) && effectiveDuration > 0) {
      const newEnd = addMonths(start, effectiveDuration);
      setEditedProposal({
        ...editedProposal,
        startDate: startStr,
        endDate: format(newEnd, "yyyy-MM-dd"),
        duration: String(effectiveDuration)
      });
    }
  };

  const handleDurationChange = (totalMonths: number) => {
    if (totalMonths <= 0 || !editedProposal) return;
    const updated = { ...editedProposal, duration: String(totalMonths) };
    if (updated.startDate) {
      const start = parseISO(updated.startDate);
      if (isValid(start)) {
        const newEnd = addMonths(start, totalMonths);
        updated.endDate = format(newEnd, "yyyy-MM-dd");
      }
    }
    setEditedProposal(updated);
  };

  const handleDurationYearsChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const years = parseInt(e.target.value, 10);
    const currentMonths = parseInt(editedProposal?.duration || "6", 10);
    const remainingMonths = currentMonths % 12;
    handleDurationChange(years * 12 + remainingMonths);
  };

  const handleDurationMonthsChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const months = parseInt(e.target.value, 10);
    const currentMonths = parseInt(editedProposal?.duration || "6", 10);
    const years = Math.floor(currentMonths / 12);
    const total = years * 12 + months;
    handleDurationChange(total > 0 ? total : 1);
  };

  const handleDateChangeWithCalc = (field: "startDate" | "endDate", value: string) => {
    if (!editedProposal) return;

    if (field === "startDate") {
      calculateImplementationDates(value, editedProposal.duration);
    } else if (field === "endDate") {
      if (editedProposal.startDate && value) {
        try {
          const start = parseISO(editedProposal.startDate);
          const end = parseISO(value);
          if (isValid(start) && isValid(end) && end >= start) {
            const months = differenceInMonths(end, start);
            if (months >= 0) {
              setEditedProposal({
                ...editedProposal,
                endDate: value,
                duration: String(months)
              });
            }
          } else {
            setEditedProposal({ ...editedProposal, [field]: value });
          }
        } catch (e) { console.error(e); }
      } else {
        setEditedProposal({ ...editedProposal, [field]: value });
      }
    }
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

  const handleBudgetSourceChange = (index: number, value: string) => {
    if (!editedProposal) return;
    const newSources = [...editedProposal.budgetSources];
    newSources[index] = { ...newSources[index], source: value };
    setEditedProposal({ ...editedProposal, budgetSources: newSources });
  };

  const handleRemoveBudgetItem = (index: number) => {
    if (!editedProposal) return;
    const newSources = editedProposal.budgetSources.filter((_, i) => i !== index);
    setEditedProposal({ ...editedProposal, budgetSources: newSources });
  };

  const handleBudgetBreakdownChange = (
    sourceIndex: number,
    category: "ps" | "mooe" | "co",
    itemIndex: number,
    field: "item" | "amount",
    value: string | number
  ) => {
    if (!editedProposal) return;
    const newSources = [...editedProposal.budgetSources];
    const source = { ...newSources[sourceIndex] };
    const breakdown = { ...source.breakdown };
    const categoryItems = [...breakdown[category]];

    categoryItems[itemIndex] = { ...categoryItems[itemIndex], [field]: value };
    breakdown[category] = categoryItems;
    source.breakdown = breakdown;

    const catTotal = categoryItems.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
    source[category] = `₱${catTotal.toLocaleString()}`;

    const total =
      breakdown.ps.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0) +
      breakdown.mooe.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0) +
      breakdown.co.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
    source.total = `₱${total.toLocaleString()}`;

    newSources[sourceIndex] = source;
    setEditedProposal({ ...editedProposal, budgetSources: newSources });
  };

  const handleAddBudgetBreakdownItem = (sourceIndex: number, category: "ps" | "mooe" | "co") => {
    if (!editedProposal) return;
    const newSources = [...editedProposal.budgetSources];
    const source = { ...newSources[sourceIndex] };
    const breakdown = { ...source.breakdown };
    const categoryItems = [...breakdown[category]];

    categoryItems.push({ item: "", amount: 0 });
    breakdown[category] = categoryItems;
    source.breakdown = breakdown;
    newSources[sourceIndex] = source;
    setEditedProposal({ ...editedProposal, budgetSources: newSources });
  };

  const handleRemoveBudgetBreakdownItem = (sourceIndex: number, category: "ps" | "mooe" | "co", itemIndex: number) => {
    if (!editedProposal) return;
    const newSources = [...editedProposal.budgetSources];
    const source = { ...newSources[sourceIndex] };
    const breakdown = { ...source.breakdown };
    const categoryItems = breakdown[category].filter((_, i) => i !== itemIndex);

    breakdown[category] = categoryItems;
    source.breakdown = breakdown;

    const catTotal = categoryItems.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
    source[category] = `₱${catTotal.toLocaleString()}`;

    const total =
      breakdown.ps.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0) +
      breakdown.mooe.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0) +
      breakdown.co.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
    source.total = `₱${total.toLocaleString()}`;

    newSources[sourceIndex] = source;
    setEditedProposal({ ...editedProposal, budgetSources: newSources });
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        Swal.fire({ icon: "error", title: "File too large", text: "Maximum file size is 10 MB." });
        event.target.value = "";
        return;
      }
      setNewFile(file);
    }
  };

  const handleSave = async () => {
    // Check if in revision mode and submit revision
    if (isInRevisionMode && proposal && newFile) {
      // Frontend guard: prevent submissions when the revision deadline (or approved extension) has expired.
      // Backend already enforces this, but this avoids confusing attempts that will be rejected.
      if (!canSubmitRevision) {
        await Swal.fire({
          icon: "error",
          title: "Revision deadline expired",
          text: "Your revision deadline has already expired. Please request an extension from R&D if you still need to submit changes.",
          confirmButtonColor: "#C8102E",
        });
        return;
      }
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
          if (response.data?.file_url && !submittedFiles.includes(response.data.file_url)) {
            setSubmittedFiles((prev) => [...prev, response.data!.file_url]);
          }
          setRevisionChanges(changes);

          // Success - show toast or notification
          Swal.fire({
            title: 'Success!',
            text: 'Revision submitted successfully! Your proposal has been sent back to R&D for review.',
            icon: 'success',
            confirmButtonColor: '#C8102E'
          });
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
      } catch (error: any) {
        const errorMsg = error?.response?.data?.message || error?.response?.data?.error || (error instanceof Error ? error.message : "Failed to submit revision. Please try again.");
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
      navigate("/users/Proponent/ProponentMainLayout?tab=monitoring", {
        state: { proposalId: proposal.id },
      });
    }
  };

  const currentData = isEditing ? editedProposal : proposal;
  // Only allow editing of specific fields in revision mode
  const canEditTitle = isInRevisionMode && isEditing;
  const canEditSchedule = isInRevisionMode && isEditing;
  const canEditBudget = isInRevisionMode && isEditing;
  const canEditFile = isInRevisionMode && isEditing;
  // Restrict other fields in revision mode
  const canEditOtherFields = !isInRevisionMode && isEditing;
  const isFunded = normalizedStatus === 'funded';

  // Deadline expiry computation
  const deadlineDate = (revisionData?.created_at && revisionData?.deadline)
    ? new Date(new Date(revisionData.created_at).getTime() + revisionData.deadline * 86400000)
    : null;
  const isDeadlineExpired = deadlineDate ? new Date() > deadlineDate : false;

  // Check if extension was approved (proponent can edit again with new deadline)
  const hasApprovedExtension = extensionRequest?.status === "approved";
  const extendedDeadlineDate = (hasApprovedExtension && extensionRequest?.reviewed_at && extensionRequest?.new_deadline_days)
    ? new Date(new Date(extensionRequest.reviewed_at).getTime() + extensionRequest.new_deadline_days * 86400000)
    : null;
  const isExtendedDeadlineExpired = extendedDeadlineDate ? new Date() > extendedDeadlineDate : false;

  // Can the proponent currently edit? (in revision mode AND deadline not expired, OR extension approved and within new deadline)
  const canSubmitRevision = isInRevisionMode && !isNotSubmittedMode && (
    !isDeadlineExpired || (hasApprovedExtension && !isExtendedDeadlineExpired)
  );

  const extensionPolicyMessage = (() => {
    if (!lateSubmissionPolicy) return null;
    if (lateSubmissionPolicy.enabled === false) {
      return "Extension requests are not allowed because late submission policy is disabled.";
    }
    if (lateSubmissionPolicy.type === "until_date" && lateSubmissionPolicy.deadline) {
      if (new Date() > new Date(lateSubmissionPolicy.deadline)) {
        return "Extension requests are no longer accepted. The late submission window has closed.";
      }
    }
    if (revisionData?.created_at && revisionData.deadline) {
      const deadlineMs = new Date(revisionData.created_at).getTime() + revisionData.deadline * 86400000;
      if (Date.now() <= deadlineMs) {
        return "Your revision deadline has not expired yet. Please submit your revision directly.";
      }
    }
    return null;
  })();

  const handleRequestExtension = async () => {
    if (!proposal?.id || extensionReason.trim().length < 10) return;
    if (extensionPolicyMessage) {
      await Swal.fire({
        icon: "error",
        title: "Cannot Request Extension",
        text: extensionPolicyMessage,
        confirmButtonColor: "#C8102E",
      });
      return;
    }

    setIsSubmittingExtension(true);
    try {
      await requestProponentExtension(Number(proposal.id), extensionReason.trim());
      await Swal.fire({
        icon: "success",
        title: "Extension Requested",
        text: "Your extension request has been submitted. R&D will review it shortly.",
        confirmButtonColor: "#C8102E",
      });
      setShowExtensionForm(false);
      setExtensionReason("");
      // Refresh extension request status
      const requests = await getProponentExtensionRequests(Number(proposal.id));
      setExtensionRequest(requests.length > 0 ? requests[0] : null);
    } catch (error: any) {
      const msg = error?.response?.data?.message || "Failed to submit extension request.";
      await Swal.fire({ icon: "error", title: "Error", text: msg, confirmButtonColor: "#C8102E" });
    } finally {
      setIsSubmittingExtension(false);
    }
  };

  const sites = (currentData.implementationSites as Site[]) || [];
  const coProponentsList = proposal.coProponent
    ? proposal.coProponent
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
    : [];
  const activeCoLeads = projectMembers.filter(
    (member) => member.role === "co_lead" && member.status === "active"
  );
  const pendingCoLeads = projectMembers.filter(
    (member) => member.role === "co_lead" && member.status === "pending"
  );

  const getStatusTheme = (status: string | undefined) => {
    const s = (status || "").toLowerCase();
    if (["endorsed_for_funding", "endorsed"].includes(s))
      return {
        bg: "bg-blue-50",
        border: "border-blue-200",
        text: "text-blue-800",
        icon: <Signature className="w-5 h-5 text-blue-600" />,
        label: "Endorsed",
      };
    if (["funded", "accepted", "approved"].includes(s))
      return {
        bg: "bg-emerald-50",
        border: "border-emerald-200",
        text: "text-emerald-800",
        icon: <CheckCircle className="w-5 h-5 text-emerald-600" />,
        label: "Funded",
      };

    if (["revise", "revision", "revision_rnd", "revision required"].includes(s)) {
      return {
        bg: "bg-orange-50",
        border: "border-orange-200",
        text: "text-orange-800",
        icon: <RefreshCw className="w-5 h-5 text-orange-600" />,
        label: "Revision Required",
      };
    }

    if (["revised_proposal"].includes(s)) {
      return {
        bg: "bg-amber-100",
        border: "border-amber-300",
        text: "text-amber-900",
        icon: <Edit className="w-5 h-5 text-amber-700" />,
        label: "Revised Proposal",
      };
    }



    if (["rejected", "disapproved", "reject", "rejected_rnd", "rejected proposal"].includes(s))
      return {
        bg: "bg-red-50",
        border: "border-red-200",
        text: "text-red-800",
        icon: <XCircle className="w-5 h-5 text-red-600" />,
        label: "Rejected",
      };

    if (s === "not_submitted")
      return {
        bg: "bg-red-100",
        border: "border-red-300",
        text: "text-red-800",
        icon: <XCircle className="w-5 h-5 text-red-600" />,
        label: "Not Submitted",
      };

    if (["review_rnd", "r&d evaluation"].includes(s))
      return {
        bg: "bg-blue-50",
        border: "border-blue-200",
        text: "text-blue-800",
        icon: <Microscope className="w-5 h-5 text-blue-600" />,
        label: "R&D Evaluation",
      };

    if (["evaluators assessment", "under_evaluation"].includes(s))
      return {
        bg: "bg-purple-50",
        border: "border-purple-200",
        text: "text-purple-800",
        icon: <FileCheck className="w-5 h-5 text-purple-600" />,
        label: "Evaluators Assessment",
      };

    if (["pending"].includes(s))
      return {
        bg: "bg-yellow-100",
        border: "border-yellow-200",
        text: "text-yellow-800",
        icon: <Clock className="w-5 h-5 text-yellow-600" />,
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
    ["revise", "revision", "revision_rnd", "revision required", "under r&d review", "not_submitted"].includes((proposal.status || "").toLowerCase())
      ? [
        { section: "Title Assessment", comment: revisionData?.title_comment },
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
    <>
      <style>{`
        @keyframes scrollTitle {
           0%, 15% { transform: translateX(0); }
          75%, 85% { transform: translateX(min(0px, calc(100cqw - 100%))); }
          95%, 100% { transform: translateX(0); }
        }
      `}</style>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-in fade-in duration-200" >
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] flex flex-col overflow-hidden">
          {/* --- HEADER --- */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-6 border-b border-gray-100 bg-white gap-4">
            <div className="flex-1 min-w-0 pr-4">
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
              <div className="overflow-hidden" style={{ containerType: 'inline-size' }}>
                <h2 className="text-xl font-bold text-gray-900 leading-tight whitespace-nowrap inline-block animate-[scrollTitle_8s_ease-in-out_infinite]">
                  {currentData.title}
                </h2>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              {proposal && (
                <ProposalInsightButtons
                  proposalId={proposal.id}
                  proposalTitle={currentData.title}
                />
              )}
              {isInRevisionMode && !revisionChanges && !isLoadingRevision && canSubmitRevision && (
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
              <ScrollKeyframes />
              {/* Late Submission badge */}
              {(proposal as any).is_late_submission && (
                <div className="flex items-center gap-2 text-xs text-amber-800 bg-amber-50 px-3 py-1.5 border border-amber-200 w-full overflow-hidden">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <ScrollingBannerText>
                    <span className="font-semibold">Late Submission</span>
                    <span> — This revision was submitted after the original deadline via an approved extension.</span>
                  </ScrollingBannerText>
                </div>
              )}

              {/* Skeleton loading state for revision banners */}
              {isLoadingRevision && (
                <div className="flex items-center gap-2 px-3 py-2 border border-slate-100 bg-slate-50 rounded-lg w-full overflow-hidden">
                  <div className="w-4 h-4 bg-slate-200 rounded-full shrink-0 animate-pulse" />
                  <ScrollingBannerText>
                    <div className="flex items-center gap-2 w-[550px] animate-pulse">
                      <div className="h-3 w-32 bg-slate-200 rounded shrink-0" />
                      <div className="h-3 w-64 bg-slate-200 rounded opacity-60 shrink-0" />
                    </div>
                  </ScrollingBannerText>
                </div>
              )}

              {/* Deadline expired + Extension request pending - Only show when not loading */}
              {!isLoadingRevision && extensionRequest?.status === "pending" && (
                <div className="flex items-center gap-2 text-sm text-yellow-800 bg-yellow-50 px-3 py-2 border border-yellow-200 w-full overflow-hidden">
                  <Clock className="w-4 h-4 shrink-0" />
                  <ScrollingBannerText>
                    <span>Extension request is <span className="font-bold">pending review</span> by R&D. Submitted on {formatDate(extensionRequest.created_at)}.</span>
                  </ScrollingBannerText>
                </div>
              )}

              {/* Deadline expired message */}
              {isInRevisionMode && isDeadlineExpired && (!extensionRequest || extensionRequest.status === "rejected") && (
                <div className="flex flex-col gap-2 rounded-lg border border-red-200 bg-red-50 p-2 text-sm text-red-800 w-full overflow-hidden">
                  <div className="flex items-center justify-between gap-3 w-full">
                    <div className="flex items-center gap-2 overflow-hidden flex-1">
                      <CalendarX2 className="w-4 h-4 shrink-0" />
                      <ScrollingBannerText>
                        <span>
                          The revision deadline has <span className="font-bold">expired</span>.
                          {deadlineDate && (
                            <> (was {formatDateTime(deadlineDate)})</>
                          )}
                        </span>
                      </ScrollingBannerText>
                    </div>
                    {!extensionPolicyMessage && (
                      <button
                        onClick={() => setShowExtensionForm(true)}
                        className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#C8102E] rounded-lg hover:bg-[#a00c24] transition-colors"
                      >
                        <RefreshCw className="w-3 h-3" />
                        Request Extension
                      </button>
                    )}
                  </div>
                  {extensionPolicyMessage && (
                    <div className="text-xs text-red-700 bg-red-100 border border-red-200 rounded px-2 py-1 w-full overflow-hidden">
                      <ScrollingBannerText>{extensionPolicyMessage}</ScrollingBannerText>
                    </div>
                  )}
                  {extensionRequest?.status === "rejected" && extensionRequest.review_note && (
                    <div className="text-xs text-red-700 bg-red-100 border border-red-200 rounded px-2 py-1 w-full overflow-hidden">
                      <ScrollingBannerText>
                        <span className="font-semibold">Previous request rejected:</span> {extensionRequest.review_note}
                      </ScrollingBannerText>
                    </div>
                  )}
                </div>
              )}


              {/* Extension approved → Show new deadline */}
              {!isLoadingRevision && hasApprovedExtension && extendedDeadlineDate && !isNotSubmittedMode && (
                <div className="flex items-center gap-2 text-sm text-green-800 bg-green-50 px-3 py-2 border border-green-200 w-full overflow-hidden">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <ScrollingBannerText>
                    <span>Extension Approved — New Deadline: <span className="font-bold">{formatDateTime(extendedDeadlineDate)}</span></span>
                  </ScrollingBannerText>
                </div>
              )}

              {/* Normal deadline banner (only while deadline is still active and no extension context) */}
              {!isLoadingRevision && !isNotSubmittedMode && !hasApprovedExtension && canSubmitRevision && (
                <div className="flex items-center gap-2 text-sm text-orange-800 bg-orange-100/50 px-3 py-2 border border-orange-200 w-full overflow-hidden">
                  <CalendarSync className="w-4 h-4 shrink-0" />
                  <ScrollingBannerText>
                    <span>Deadline for Revision: <span className="font-bold">
                      {isLoadingRevision ? "Loading..." :
                        (revisionData?.created_at && revisionData?.deadline) ?
                          formatDateTime(new Date(new Date(revisionData.created_at).getTime() + revisionData.deadline * 86400000)) :
                          (proposal.deadline ? formatDateTime(proposal.deadline) : "No deadline set")}
                    </span></span>
                  </ScrollingBannerText>
                </div>
              )}
            </>
          )}

          {isRejectedMode && (
            <div className="w-full">
              {isLoadingRejection ? (
                <div className="flex items-center gap-2 px-3 py-2 border border-red-200 bg-red-100/50 rounded-lg w-full overflow-hidden">
                  <div className="w-4 h-4 bg-red-200 rounded-full shrink-0 animate-pulse" />
                  <ScrollingBannerText>
                    <div className="flex items-center gap-2 w-[400px] animate-pulse">
                      <div className="h-3 w-20 bg-red-200 rounded shrink-0" />
                      <div className="h-3 w-36 bg-red-200 rounded opacity-60 shrink-0" />
                    </div>
                  </ScrollingBannerText>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-red-800 bg-red-100/50 px-3 py-2 border border-red-200 w-full overflow-hidden rounded-lg">
                  <CalendarX2 className="w-4 h-4 shrink-0" />
                  <ScrollingBannerText>
                    <span>Rejected on: <span className="font-bold">{rejectionDate ? formatDateTime(rejectionDate as string) : "Date not available"}</span></span>
                  </ScrollingBannerText>
                </div>
              )}
            </div>
          )}

          {/* --- BODY --- */}
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-6">
            {isFunded && (
              <div className="space-y-4">

                {/* Project Funding Approved card — with inline approval file inside */}
                <div className="bg-green-50 rounded-xl border border-green-200 overflow-hidden relative">
                  <div className="p-6 relative z-10">
                    {/* Header */}
                    <h3 className="text-lg font-bold text-green-900 mb-1 flex items-center gap-2">
                      Project Funding Approved
                    </h3>
                    {proposal.lastUpdated && (
                      <p className="flex items-center gap-1.5 text-xs text-green-700 mb-3">
                        <Calendar className="w-3 h-3" />
                        Funded on <span className="font-semibold">{formatDate(proposal.lastUpdated || '')}</span>
                      </p>
                    )}
                    <p className="text-sm text-green-800 leading-relaxed mb-5">
                      Congratulations! Your project has been fully funded. Below
                      is the confirmed Project Leadership Team as indicated in
                      your proposal. Click start to proceed to the monitoring
                      phase.
                    </p>
                    {/* Leader + co-leader + start button row */}
                    <div className="flex flex-col gap-5 mb-5">
                      <div className="space-y-4">
                        <div>
                          <label className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase mb-1.5">
                            <User className="w-3.5 h-3.5" /> Project Leader
                          </label>
                          <div className="bg-white border border-green-100 px-3 py-2 rounded-md font-semibold text-slate-800 text-sm w-full">
                            {proposal.proponent}
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase">
                              <ShieldCheck className="w-3.5 h-3.5" /> Co-Leader Proponent(s)
                            </label>
                            {resolvedFundedProjectId && !!user && user.id === resolvedProjectLeadId && (
                              <button
                                onClick={() => setInviteOpen(true)}
                                className="inline-flex items-center gap-1 px-2 py-1 text-[12px] font-bold text-white bg-[#C8102E] hover:bg-[#A50D26] rounded-md transition-all shadow-sm"
                              >
                                <Plus className="w-4 h-4" /> Invite
                              </button>
                            )}
                          </div>
                          {isLoadingProjectMembers ? (
                            <div className="bg-white border border-green-100 px-3 py-3 rounded-md text-sm text-slate-500 flex items-center justify-center gap-2">
                              <Loader2 className="w-4 h-4 animate-spin text-[#C8102E]" />
                              Loading co-lead members...
                            </div>
                          ) : (activeCoLeads.length > 0 || pendingCoLeads.length > 0 || coProponentsList.length > 0) ? (
                            <div className="flex flex-wrap gap-2">
                              {activeCoLeads.length > 0 ? activeCoLeads.map((member) => (
                                <div key={member.id} className="inline-flex flex-col bg-green-100 text-green-800 text-xs font-medium px-2.5 py-1.5 rounded-md border border-green-200">
                                  <span>{member.user.first_name} {member.user.last_name}</span>
                                  <span className="text-[10px] text-green-700/90">{member.user.email}</span>
                                </div>
                              )) : coProponentsList.map((name, index) => (
                                <span key={index} className="inline-flex items-center gap-1 bg-green-100 text-green-800 text-xs font-medium px-2.5 py-1.5 rounded-md border border-green-200">
                                  {name}
                                </span>
                              ))}
                              {pendingCoLeads.map((member) => (
                                <div
                                  key={`pending-${member.id}`}
                                  className="inline-flex flex-col bg-amber-100 text-amber-800 text-xs font-medium px-2.5 py-1.5 rounded-md border border-amber-200"
                                >
                                  <span>{member.user.first_name} {member.user.last_name} (Invited)</span>
                                  <span className="text-[10px] text-amber-700/90">{member.user.email}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-xs text-slate-400 italic bg-white p-2 rounded border border-green-100 w-full text-center py-4">
                              No co-lead proponent indicated.
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex justify-center pt-2">
                        <button
                          onClick={handleStartImplementation}
                          className="px-12 py-4 bg-emerald-600 hover:bg-emerald-800 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-sm shadow-xl shadow-emerald-100/50 hover:scale-[1.02] active:scale-[0.98]"
                        >
                          <Play className="w-5 h-5" /> Start Project Implementation
                        </button>
                      </div>
                    </div>
                  </div>
                  <Users className="absolute -right-6 -bottom-6 w-32 h-32 text-green-200 opacity-30 pointer-events-none z-0" />
                </div>

                {/* Funding Approval Document */}
                {proposal.fundingDocumentUrl ? (
                  <div className="rounded-lg border border-slate-200 overflow-hidden">
                    <div className="bg-slate-100 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-red-600" />
                        <span className="text-sm font-bold text-slate-800">Funding Approval Document</span>
                      </div>
                      {fundingSignedUrl && (
                        <button
                          onClick={() => window.open(fundingSignedUrl, '_blank', 'noopener')}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#C8102E] hover:bg-[#A50D26] rounded-lg transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Open Document
                        </button>
                      )}
                    </div>
                    {isLoadingFundingUrl ? (
                      <div className="flex flex-col items-center justify-center gap-3 py-12 bg-slate-50">
                        <Loader2 className="w-8 h-8 animate-spin text-[#C8102E]" />
                        <p className="text-sm text-slate-500">Preparing document…</p>
                      </div>
                    ) : fundingSignedUrl ? (
                      (() => {
                        const isPdf = (proposal.fundingDocumentUrl || '').toLowerCase().includes('.pdf');
                        return isPdf ? (
                          <div className="w-full bg-slate-100 relative" style={{ height: '50vh', minHeight: 320 }}>
                            <iframe src={fundingSignedUrl} className="w-full h-full" title="Funding Approval Document" />
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center gap-3 py-10 bg-slate-50">
                            <FileCheck className="w-10 h-10 text-emerald-500" />
                            <p className="text-sm text-slate-600 font-medium">Document ready</p>
                            <p className="text-xs text-slate-400">Click "Open Document" above to view or download.</p>
                          </div>
                        );
                      })()
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-3 py-10 bg-slate-50">
                        <AlertTriangle className="w-8 h-8 text-amber-400" />
                        <p className="text-sm text-slate-500 text-center px-4">
                          {fundingUrlError || 'Unable to load the approval document.'}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-green-300 bg-green-100/30 p-4 flex items-center gap-3 text-sm text-green-700">
                    <FileText className="w-5 h-5 text-green-500 flex-shrink-0" />
                    No approval document was attached by the R&D staff.
                  </div>
                )}


                {/* Total Funded Amount + funded date — outside the card */}
                <div className="rounded-xl bg-emerald-600 p-5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg shadow-emerald-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-emerald-100 tracking-wider">Total Funded Amount</p>
                      <p className="text-sm text-emerald-50">Grand Total Budget Requirements</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-extrabold text-white tracking-tight">{proposal.budgetTotal}</p>
                    <p className="text-xs text-emerald-100 mt-0.5">Officially approved and funded</p>
                  </div>
                </div>

              </div>
            )}

            {(proposal.status?.toLowerCase() === 'pending') && (
              <div className="bg-slate-50 border border-yellow-200 rounded-xl p-5 md:p-6 relative overflow-hidden">
                <div className="relative z-10 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                  <div>
                    <h3 className="text-lg font-bold text-yellow-600 mb-1 flex items-center gap-2">
                      Proposal is awaiting Admin assignment
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      Your proposal has been successfully submitted and is now in the Admin's queue. The Admin will review and assign it to a specific R&D staff for evaluation. Please wait for the next decision.
                    </p>
                    {proposal.lastUpdated && (
                      <p className="flex items-center gap-1.5 text-xs text-yellow-600 mt-3">
                        <Calendar className="w-3 h-3" />
                        Status changed on <span className="font-semibold">{formatDate(proposal.lastUpdated || '')}</span>
                      </p>
                    )}
                  </div>
                </div>
                <Clock className="absolute -right-6 -bottom-6 w-32 h-32 text-amber-200 opacity-40 z-0 pointer-events-none" />
              </div>
            )}

            {(['endorsed_for_funding', 'endorsed'].includes(proposal.status?.toLowerCase() || '')) && (
              <div className="bg-slate-50 border border-blue-300 rounded-xl p-5 md:p-6 relative overflow-hidden">
                <div className="relative z-10 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                  <div>
                    <h3 className="text-lg font-bold text-blue-800 mb-1 flex items-center gap-2">
                      Awaiting Committee Decision
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      Your project proposal has been successfully endorsed for funding. It is now awaiting the final funding approval decision from the RDEC Committee.
                    </p>
                    {proposal.lastUpdated && (
                      <p className="flex items-center gap-1.5 text-xs text-blue-500 mt-3">
                        <Calendar className="w-3 h-3" />
                        Endorsed on <span className="font-semibold">{formatDate(proposal.lastUpdated || '')}</span>
                      </p>
                    )}
                  </div>
                </div>
                <Signature className="absolute -right-6 -bottom-6 w-32 h-32 text-blue-200 opacity-50 z-0" />
              </div>
            )}

            {(['review_rnd', 'r&d evaluation'].includes(proposal.status?.toLowerCase() || '')) && (
              <div className="bg-slate-50 border border-blue-200 rounded-xl p-5 md:p-6 relative overflow-hidden">
                <div className="relative z-10 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                  <div>
                    <h3 className="text-lg font-bold text-blue-800 mb-1 flex items-center gap-2">
                      Proposal is undergoing R&D evaluation
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      Your proposal is currently being reviewed by the R&D staff. They are assessing the project title, timeline, budget, and overall feasibility of your project. The evaluation may take some time, so please wait for the next decision.
                    </p>
                    {proposal.lastUpdated && (
                      <p className="flex items-center gap-1.5 text-xs text-blue-400 mt-3">
                        <Calendar className="w-3 h-3" />
                        Assigned for review on <span className="font-semibold">{formatDate(proposal.lastUpdated || '')}</span>
                      </p>
                    )}
                  </div>
                </div>
                <Microscope className="absolute -right-6 -bottom-6 w-32 h-32 text-blue-200 opacity-40 z-0 pointer-events-none" />
              </div>
            )}

            {(['under_evaluation', 'evaluators assessment'].includes(proposal.status?.toLowerCase() || '')) && (
              <div className="bg-slate-50 border border-purple-200 rounded-xl p-5 md:p-6 relative overflow-hidden">
                <div className="relative z-10 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                  <div>
                    <h3 className="text-lg font-bold text-purple-800 mb-1 flex items-center gap-2">
                      Proposal is currently being assessed by the Evaluators
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      Your proposal has passed the R&D review and is now being assessed by a panel of Evaluators. They will provide scores and feedback based on defined evaluation criteria. Please wait for the evaluators' decision, which will be reviewed by the R&D staff.
                    </p>
                    {proposal.lastUpdated && (
                      <p className="flex items-center gap-1.5 text-xs text-purple-400 mt-3">
                        <Calendar className="w-3 h-3" />
                        Sent for evaluation on <span className="font-semibold">{formatDate(proposal.lastUpdated || '')}</span>
                      </p>
                    )}
                  </div>
                </div>
                <FileCheck className="absolute -right-6 -bottom-6 w-32 h-32 text-purple-200 opacity-40 z-0 pointer-events-none" />
              </div>
            )}

            {(['revised_proposal'].includes(proposal.status?.toLowerCase() || '')) && (() => {
              const revisionCount = Math.max(1, (submittedFiles.length || 2) - 1);
              return (
                <div className="bg-slate-50 border border-amber-200 rounded-xl p-5 md:p-6 relative overflow-hidden">
                  <div className="relative z-10">
                    <h3 className="text-lg font-bold text-amber-700 mb-1 flex items-center gap-2">
                      Revised Proposal Submitted
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed mt-2">
                      This is your <span className="font-bold text-amber-700">{getOrdinal(revisionCount)}</span> revised version.
                      Your revised proposal has been sent back to the R&D staff for re-evaluation. Please wait while they review the changes you have made.
                    </p>
                    {proposal.lastUpdated && (
                      <p className="flex items-center gap-1.5 text-xs text-amber-500 mt-3">
                        <Calendar className="w-3 h-3" />
                        Revision submitted on <span className="font-semibold">{formatDate(proposal.lastUpdated || '')}</span>
                      </p>
                    )}
                  </div>
                  <Edit className="absolute -right-6 -bottom-6 w-32 h-32 text-amber-200 opacity-40 z-0 pointer-events-none" />
                </div>
              );
            })()}

            {['revise', 'revision', 'revision_rnd', 'revision required'].includes(proposal.status?.toLowerCase() || '') && (
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-5 md:p-6 relative overflow-hidden">
                <div className="relative z-10">
                  <h3 className="text-lg font-bold text-orange-800 mb-2 flex items-center gap-2">
                    <RefreshCw className="w-5 h-5 text-orange-600" /> R&D Staff Feedback
                  </h3>

                  {isLoadingRevision ? (
                    <div className="animate-pulse grid gap-3 mt-4">
                      <div className="bg-white/100 p-5 rounded-lg border border-orange-100 shadow-sm space-y-3">
                        <div className="h-3 w-32 bg-orange-200 rounded opacity-60" />
                        <div className="space-y-2">
                          <div className="h-3 w-full bg-orange-100 rounded" />
                          <div className="h-3 w-5/6 bg-orange-100 rounded opacity-70" />
                          <div className="h-3 w-4/6 bg-orange-100 rounded opacity-50" />
                        </div>
                      </div>
                      <div className="bg-white/100 p-5 rounded-lg border border-orange-100 shadow-sm space-y-3">
                        <div className="h-3 w-40 bg-orange-200 rounded opacity-60" />
                        <div className="space-y-2">
                          <div className="h-3 w-full bg-orange-100 rounded" />
                          <div className="h-3 w-3/4 bg-orange-100 rounded opacity-70" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid gap-3 mt-4">
                      {revisionData?.evaluator_comments && revisionData.evaluator_comments.length > 0 && (
                        <div className="bg-white/100 p-5 rounded-lg border border-amber-200 shadow-sm">
                          <h4 className="text-sm font-bold tracking-wider text-amber-800 mb-3 flex items-center gap-2">
                            <MessageSquare className="w-4 h-4" />
                            Evaluator Comments
                          </h4>
                          <div className="space-y-3">
                            {revisionData.evaluator_comments.map((ec, i) => (
                              <div key={i} className="bg-amber-50/70 p-3 rounded-md border border-amber-100">
                                <p className="text-xs font-bold uppercase tracking-wider text-amber-700 mb-1">
                                  {ec.label}
                                </p>
                                <p className="text-sm leading-relaxed text-gray-700 whitespace-pre-wrap">
                                  {ec.comment}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {activeComments.map((c, i) => {
                        const isOverall = c.section === "Overall Comments";
                        const textStyle = isOverall ? "italic" : "";
                        return (
                          <div key={i} className="bg-white/100 p-5 rounded-lg border border-orange-100 shadow-sm">
                            <h4 className="text-sm font-bold tracking-wider text-orange-700 mb-2 flex items-center gap-2">
                              {c.section}:
                            </h4>
                            <div className={`text-sm leading-relaxed ${textStyle} text-gray-700 whitespace-pre-wrap`}>
                              {c.comment}
                            </div>
                          </div>
                        );
                      })}

                      <div className="bg-orange-100 p-4 rounded-lg border border-orange-200 shadow-sm flex items-start gap-3 mt-1">
                        <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                        <div className="text-xs text-orange-800 leading-relaxed">
                          <span className="font-bold">Recommendation:</span> Please consider submitting your revised project proposal <span className="font-semibold underline">at least 3-5 days earlier</span> than the set deadline. This gives the R&D staff ample time to review your modifications and provide follow-up feedback if there are still areas needing improvement.
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <RefreshCw className="absolute -right-6 -bottom-6 w-32 h-32 text-orange-200 opacity-40 z-0 pointer-events-none" />
              </div>
            )}

            {['rejected', 'disapproved', 'reject', 'rejected_rnd', 'rejected proposal'].includes(proposal.status?.toLowerCase() || '') && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-5 md:p-6 relative overflow-hidden">
                <div className="relative z-10">
                  <h3 className="text-lg font-bold text-red-800 mb-2 flex items-center gap-2">
                    <XCircle className="w-5 h-5 text-red-600" /> R&D Staff Feedback
                  </h3>

                  {isLoadingRejection ? (
                    <div className="animate-pulse bg-white/100 p-5 rounded-lg border border-red-100 shadow-sm mt-4 space-y-3">
                      <div className="h-3 w-36 bg-red-200 rounded opacity-60" />
                      <div className="space-y-2 pt-1">
                        <div className="h-3 w-full bg-red-100 rounded" />
                        <div className="h-3 w-5/6 bg-red-100 rounded opacity-70" />
                        <div className="h-3 w-2/3 bg-red-100 rounded opacity-50" />
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white/100 p-5 rounded-lg border border-red-100 shadow-sm mt-4">
                      <h4 className="text-xs font-bold tracking-wider text-red-700 mb-2 flex items-center gap-2">
                        Reason for Rejection:
                      </h4>
                      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {rejectionComment || "Loading details..."}
                      </p>
                    </div>
                  )}
                </div>
                <XCircle className="absolute -right-6 -bottom-6 w-32 h-32 text-red-200 opacity-40 z-0 pointer-events-none" />
              </div>
            )}


            {/* 3. File Management */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#C8102E]" /> Project
                  Documents
                  {submittedFiles.length > 1 && (
                    <span className="text-xs bg-blue-100 text-blue-700 border border-blue-200 px-2 py-1 rounded-full font-semibold">
                      v{submittedFiles.length}
                    </span>
                  )}
                </h3>
              </div>
              <div className="flex flex-col gap-3">

                {submittedFiles.length > 0 ? (
                  <div className="flex flex-col gap-3 max-h-[260px] overflow-y-auto pr-1">
                    {[...submittedFiles].reverse().map((fileUrl, reversedIndex) => {
                      const isLatest = reversedIndex === 0;
                      const originalIndex = submittedFiles.length - 1 - reversedIndex;
                      return (
                        <div key={originalIndex} className={`flex items-center justify-between bg-white p-3 rounded-lg border shrink-0 ${isLatest && submittedFiles.length > 1 ? 'border-green-200' : 'border-slate-200'} group hover:border-[#C8102E] transition-colors`}>
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 ${isLatest && submittedFiles.length > 1 ? 'bg-green-100' : 'bg-slate-100'} rounded-lg flex items-center justify-center`}>
                              <FileCheck className={`w-5 h-5 ${isLatest && submittedFiles.length > 1 ? 'text-green-600' : 'text-[#C8102E]'}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-900 truncate max-w-[200px] sm:max-w-xs" title={getFileName(fileUrl)}>
                                {getFileName(fileUrl)}
                              </p>
                              <p className={`text-xs ${isLatest && submittedFiles.length > 1 ? 'text-green-600 font-medium' : 'text-slate-500'}`}>
                                {isLatest ? 'Latest version' : `Version ${originalIndex + 1}`}
                              </p>
                            </div>
                          </div>
                          <a
                            href="#"
                            onClick={(e) => { e.preventDefault(); openProposalFile(fileUrl); }}
                            className="p-2 text-slate-500 hover:bg-slate-50 rounded-lg transition-colors inline-flex items-center justify-center"
                            title="Open/Download"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-200">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                        <FileCheck className="w-5 h-5 text-slate-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-400">No file uploaded</p>
                      </div>
                    </div>
                  </div>
                )}
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
                  <label className="text-sm font-bold text-slate-900">
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
            {!isEditing && (<>
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
                      Priority Areas/STAND Classification
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
                      Sector/Commodity
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
            </>) /* end !isEditing */}

            {/* 7. Schedule & Budget (Gray Background) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Implementing Schedule */}
              <div className="lg:col-span-3 bg-slate-50 rounded-xl border border-slate-200 p-4">
                <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#C8102E]" /> Implementing
                  Schedule
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Duration</p>
                    {canEditSchedule ? (
                      <div className="flex items-center gap-2">
                        <select
                          value={Math.floor(parseInt(currentData.duration || "6", 10) / 12)}
                          onChange={handleDurationYearsChange}
                          className="w-full px-2 py-1 text-sm border rounded bg-white focus:outline-none focus:ring-2 focus:ring-[#C8102E]"
                        >
                          {Array.from({ length: 11 }, (_, i) => (
                            <option key={i} value={i}>{i} {i === 1 ? 'yr' : 'yrs'}</option>
                          ))}
                        </select>
                        <select
                          value={parseInt(currentData.duration || "6", 10) % 12}
                          onChange={handleDurationMonthsChange}
                          className="w-full px-2 py-1 text-sm border rounded bg-white focus:outline-none focus:ring-2 focus:ring-[#C8102E]"
                        >
                          {Array.from({ length: 12 }, (_, i) => (
                            <option key={i} value={i}>{i} {i === 1 ? 'mo' : 'mos'}</option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      renderFundedField(
                        <p className="text-sm font-semibold text-slate-900">
                          {currentData.duration} months
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
                          handleDateChangeWithCalc("startDate", e.target.value)
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
                          handleDateChangeWithCalc("endDate", e.target.value)
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
                    <HandCoins className="w-4 h-4 text-[#C8102E]" /> Budget Requirements
                  </h3>
                  {canEditBudget && (
                    <button
                      onClick={handleAddBudgetItem}
                      className="flex items-center gap-1 text-xs bg-[#C8102E] text-white px-2 py-1 rounded hover:bg-[#a00c24] transition-colors"
                    >
                      <Plus className="w-3 h-3" /> Add Source of Funds
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
                              <HandCoins className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Source of Funds</p>
                              {canEditBudget ? (
                                <input
                                  value={budget.source}
                                  onChange={(e) => handleBudgetSourceChange(index, e.target.value)}
                                  className={`font-bold text-slate-800 text-sm ${getInputClass(true)}`}
                                />
                              ) : (
                                <h4 className="font-bold text-slate-800 text-sm">{budget.source}</h4>
                              )}
                            </div>
                          </div>
                          <div className="text-right flex items-center gap-4">
                            <div>
                              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Subtotal</p>
                              <p className="text-sm font-bold text-[#C8102E]">{budget.total}</p>
                            </div>
                            {canEditBudget && (
                              <button onClick={() => handleRemoveBudgetItem(index)} className="text-red-500 hover:text-red-700 p-1 bg-white rounded border border-red-200 shadow-sm transition-colors">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Card Body: Breakdown Columns */}
                        <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                          {/* PS Column */}
                          <div className="space-y-2 pt-2 md:pt-0">
                            <div className="flex justify-between items-center mb-2">
                              <h5 className="font-bold text-xs text-slate-600 uppercase">Personal Services (PS)</h5>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">{budget.ps}</span>
                                {canEditBudget && (
                                  <button onClick={() => handleAddBudgetBreakdownItem(index, "ps")} className="text-white bg-[#C8102E] hover:bg-[#a00c24] rounded px-1.5 py-0.5">
                                    <Plus className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            </div>
                            <div className="space-y-1">
                              {budget.breakdown?.ps && budget.breakdown.ps.length > 0 ? (
                                budget.breakdown.ps.map((item, i) => (
                                  <div key={i} className="flex gap-2 items-center text-xs text-slate-500 hover:bg-slate-50 p-1 rounded">
                                    {canEditBudget ? (
                                      <>
                                        <input value={item.item} onChange={e => handleBudgetBreakdownChange(index, "ps", i, "item", e.target.value)} className={`w-full flex-1 border px-1 py-0.5 rounded ${getInputClass(true)}`} placeholder="Item" />
                                        <input type="number" value={item.amount || ''} onChange={e => handleBudgetBreakdownChange(index, "ps", i, "amount", e.target.value)} className={`w-20 border px-1 py-0.5 rounded text-right ${getInputClass(true)}`} placeholder="Amount" />
                                        <button onClick={() => handleRemoveBudgetBreakdownItem(index, "ps", i)} className="text-red-500 hover:bg-red-50 p-0.5 rounded"><Trash2 className="w-3 h-3" /></button>
                                      </>
                                    ) : (
                                      <>
                                        <span>{item.item}</span>
                                        <span className="font-medium text-slate-700">₱{Number(item.amount).toLocaleString()}</span>
                                      </>
                                    )}
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
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">{budget.mooe}</span>
                                {canEditBudget && (
                                  <button onClick={() => handleAddBudgetBreakdownItem(index, "mooe")} className="text-white bg-[#C8102E] hover:bg-[#a00c24] rounded px-1.5 py-0.5">
                                    <Plus className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            </div>
                            <div className="space-y-1">
                              {budget.breakdown?.mooe && budget.breakdown.mooe.length > 0 ? (
                                budget.breakdown.mooe.map((item, i) => (
                                  <div key={i} className="flex gap-2 items-center text-xs text-slate-500 hover:bg-slate-50 p-1 rounded">
                                    {canEditBudget ? (
                                      <>
                                        <input value={item.item} onChange={e => handleBudgetBreakdownChange(index, "mooe", i, "item", e.target.value)} className={`w-full flex-1 border px-1 py-0.5 rounded ${getInputClass(true)}`} placeholder="Item" />
                                        <input type="number" value={item.amount || ''} onChange={e => handleBudgetBreakdownChange(index, "mooe", i, "amount", e.target.value)} className={`w-20 border px-1 py-0.5 rounded text-right ${getInputClass(true)}`} placeholder="Amount" />
                                        <button onClick={() => handleRemoveBudgetBreakdownItem(index, "mooe", i)} className="text-red-500 hover:bg-red-50 p-0.5 rounded"><Trash2 className="w-3 h-3" /></button>
                                      </>
                                    ) : (
                                      <>
                                        <span>{item.item}</span>
                                        <span className="font-medium text-slate-700">₱{Number(item.amount).toLocaleString()}</span>
                                      </>
                                    )}
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
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">{budget.co}</span>
                                {canEditBudget && (
                                  <button onClick={() => handleAddBudgetBreakdownItem(index, "co")} className="text-white bg-[#C8102E] hover:bg-[#a00c24] rounded px-1.5 py-0.5">
                                    <Plus className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            </div>
                            <div className="space-y-1">
                              {budget.breakdown?.co && budget.breakdown.co.length > 0 ? (
                                budget.breakdown.co.map((item, i) => (
                                  <div key={i} className="flex gap-2 items-center text-xs text-slate-500 hover:bg-slate-50 p-1 rounded">
                                    {canEditBudget ? (
                                      <>
                                        <input value={item.item} onChange={e => handleBudgetBreakdownChange(index, "co", i, "item", e.target.value)} className={`w-full flex-1 border px-1 py-0.5 rounded ${getInputClass(true)}`} placeholder="Item" />
                                        <input type="number" value={item.amount || ''} onChange={e => handleBudgetBreakdownChange(index, "co", i, "amount", e.target.value)} className={`w-20 border px-1 py-0.5 rounded text-right ${getInputClass(true)}`} placeholder="Amount" />
                                        <button onClick={() => handleRemoveBudgetBreakdownItem(index, "co", i)} className="text-red-500 hover:bg-red-50 p-0.5 rounded"><Trash2 className="w-3 h-3" /></button>
                                      </>
                                    ) : (
                                      <>
                                        <span>{item.item}</span>
                                        <span className="font-medium text-slate-700">₱{Number(item.amount).toLocaleString()}</span>
                                      </>
                                    )}
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
                      disabled={isSubmittingRevision || (isInRevisionMode && (!newFile || !canSubmitRevision))}
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
        </div>
      </div>

      {/* Mini modal for Request Extension */}
      {isInRevisionMode && !isLoadingRevision && !canSubmitRevision && showExtensionForm && (!extensionRequest || extensionRequest.status === "rejected") && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40">
          <div className="bg-white w-full max-w-md mx-4 rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-[#C8102E]" />
                <h2 className="text-sm font-bold text-slate-800">Request Deadline Extension</h2>
              </div>
              <button
                onClick={() => { setShowExtensionForm(false); setExtensionReason(""); }}
                className="p-1 rounded-full hover:bg-slate-200 transition-colors"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>
            <div className="px-5 py-4 space-y-3">
              <p className="text-xs text-slate-600">
                Explain why you need more time to submit your revised proposal. This message will be sent to the R&amp;D staff for review.
              </p>
              <textarea
                value={extensionReason}
                onChange={(e) => setExtensionReason(e.target.value)}
                placeholder="Provide a clear and detailed reason (min 10 characters)..."
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E] resize-none"
                rows={4}
                maxLength={2000}
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">{extensionReason.length}/2000 characters</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setShowExtensionForm(false); setExtensionReason(""); }}
                    className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRequestExtension}
                    disabled={isSubmittingExtension || extensionReason.trim().length < 10}
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-[#C8102E] rounded-lg hover:bg-[#a00c24] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                  >
                    {isSubmittingExtension && <Loader className="w-3 h-3 animate-spin" />}
                    Submit Request
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {resolvedFundedProjectId && (
        <InviteMemberModal
          fundedProjectId={resolvedFundedProjectId}
          isOpen={inviteOpen}
          onClose={() => setInviteOpen(false)}
          onInvited={() => {
            if (!resolvedFundedProjectId) return;
            setIsLoadingProjectMembers(true);
            fetchProjectMembers(resolvedFundedProjectId)
              .then((members) => setProjectMembers(members))
              .catch(() => setProjectMembers([]))
              .finally(() => setIsLoadingProjectMembers(false));
          }}
        />
      )}
      {/* ── Extension Request Mini Modal ── */}
      {showExtensionForm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b bg-orange-50">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-orange-500" />
                <h3 className="text-sm font-bold text-slate-800">Request Deadline Extension</h3>
              </div>
              <button
                onClick={() => { setShowExtensionForm(false); setExtensionReason(""); }}
                className="p-1 rounded-full hover:bg-slate-200 transition-colors"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4">
              {extensionPolicyMessage ? (
                <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl p-3">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{extensionPolicyMessage}</span>
                </div>
              ) : (
                <p className="text-xs text-slate-500">
                  Explain why you need more time. R&amp;D will review your request and notify you of their decision.
                </p>
              )}
              <div>
                <label className="block text-xs font-semibold text-slate-600 tracking-wider mb-1.5">
                  Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={extensionReason}
                  onChange={(e) => setExtensionReason(e.target.value)}
                  placeholder="Explain why you need more time to submit your revised proposal (min 10 characters)..."
                  className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-[#C8102E] resize-none transition-all"
                  rows={4}
                  maxLength={2000}
                  autoFocus
                />
                <p className="text-xs text-slate-400 mt-1 text-right">{extensionReason.length}/2000</p>
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t bg-slate-50 flex items-center justify-end gap-2">
              <button
                onClick={() => { setShowExtensionForm(false); setExtensionReason(""); }}
                className="px-4 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRequestExtension}
                disabled={isSubmittingExtension || extensionReason.trim().length < 10 || !!extensionPolicyMessage}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#C8102E] rounded-lg hover:bg-[#a00c24] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmittingExtension && <Loader className="w-3 h-3 animate-spin" />}
                Submit Request
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DetailedProposalModal;