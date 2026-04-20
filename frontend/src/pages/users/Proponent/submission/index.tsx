import React, { useState, useCallback, useMemo, useEffect } from "react";
import { CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";

// Component Imports
import BasicInformation from "./basicInfo";
import ResearchDetails from "./researchDetails";
import BudgetSection, { BudgetBreakdownModal, LibImportModal } from "./budgetSection";
import UploadSidebar from "./uploadSidebar";
import AIModal from "../../../../components/proponent-component/aiModal";
import TemplateViewModal from "../../../../components/proponent-component/TemplateViewModal";

// Type Imports
import type { FormData } from "../../../../types/proponent-form";
import type { AIAnalysisResult } from "../../../../components/proponent-component/aiModal";

// API Service
import { submitProposal, analyzeProposalWithAI, type FormExtractedFields } from "../../../../services/proposal.api";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { isValidationError, parseValidationErrors } from "../../../../utils/validationErrors";

// Lookup Context for matching extracted names to IDs
import { useLookups } from "../../../../context/LookupContext";

// Auth Context
import { useAuthContext } from "../../../../context/AuthContext";
import PageLoader from "../../../../components/shared/PageLoader";

// Phase 1 of LIB feature: hybrid draft autosave (localStorage + remote)
import { useFormAutosave } from "../../../../hooks/useFormAutosave";

const MONTH_MAP: Record<string, number> = {
  january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
  july: 6, august: 7, september: 8, october: 9, november: 10, december: 11,
};

const createEmptyRow = (categoryId: string) => ({
  uid: `row_${categoryId}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
  subcategoryId: null,
  customSubcategoryLabel: null,
  itemName: '',
  spec: '',
  quantity: 1,
  unit: 'pcs',
  unitPrice: 0,
  totalAmount: 0,
});

const Submission: React.FC = () => {
  const YEAR_REGEX = /^\d+$/;
  // Auth Context
  const { user } = useAuthContext();
  const lookups = useLookups();
  const navigate = useNavigate();

  // ... (UI State remains the same)
  const [activeSection, setActiveSection] = useState<string>("basic-info");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);

  // AI State
  const [isCheckingTemplate, setIsCheckingTemplate] = useState(false);
  const [aiCheckResult, setAiCheckResult] = useState<AIAnalysisResult | null>(null);

  // Lifted Modal States
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [activeBudgetModal, setActiveBudgetModal] = useState<{ itemId: number, category: 'ps' | 'mooe' | 'co' } | null>(null);
  const [isLibImportModalOpen, setIsLibImportModalOpen] = useState(false);

  // ... (Data State remains the same)
  // ... (Data State remains the same)
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [workPlanFile, setWorkPlanFile] = useState<File | null>(null);

  // Track which fields were auto-filled from the uploaded document
  const [autoFilledFields, setAutoFilledFields] = useState<Set<string>>(new Set());
  const sectionOrder = ["basic-info", "research-details", "budget"] as const;

  // --- FIX 1: UPDATE INITIAL STATE STRUCTURE ---
  const [localFormData, setLocalFormData] = useState<FormData>({
    // Use FormData type explicitly
    program_title: "",
    project_title: "",
    department: "", // ID will be stored here
    agency: "",
    agencyAddress: { street: "", barangay: "", city: "" },
    telephone: "",
    email: "",
    tags: [], // Array of tag IDs
    cooperating_agencies: [],
    researchStation: "", // Display name for UI
    sectorCommodity: "", // Display name for UI
    year: null,
    classification_type: "",
    class_input: "",
    implementation_site: [{ site: "", city: "" }],
    priorities_id: [],
    sector: "", // ID will be stored here
    discipline: "", // ID will be stored here
    disciplineName: "", // Display name for UI
    duration: "",
    plannedStartDate: null,
    plannedEndDate: null,
    budgetItems: [
      {
        id: 1,
        source: "",
        budget: { 
          ps: [createEmptyRow('ps'), createEmptyRow('ps')], 
          mooe: [createEmptyRow('mooe'), createEmptyRow('mooe')], 
          co: [createEmptyRow('co'), createEmptyRow('co')] 
        },
      },
    ],
  });

  // ... (Effects remain the same)

  // Phase 1 of LIB feature: localStorage-only draft autosave. Debounced ~500ms so a browser
  // crash or power-off costs at most the last half-second of typing. On mount, if a draft
  // is found, the hook surfaces it via `pendingDraft` so we can offer to resume.
  const draftStorageKey = useMemo(
    () => `pms_draft:${user?.id ?? "anon"}:proposal_submission`,
    [user?.id],
  );
  const autosave = useFormAutosave({
    storageKey: draftStorageKey,
    value: localFormData,
    enabled: !!user?.id && !isSubmitting,
  });

  // Offer to resume the draft once on mount, after the hook finishes hydrating.
  const [draftPromptShown, setDraftPromptShown] = useState(false);
  useEffect(() => {
    if (autosave.isHydrating || draftPromptShown || !autosave.pendingDraft) return;
    setDraftPromptShown(true);

    const draft = autosave.pendingDraft;
    const updated = new Date(draft.updatedAt);
    Swal.fire({
      icon: "info",
      title: "Resume your draft?",
      html: `<p>You have an unsaved proposal from <strong>${updated.toLocaleString()}</strong> saved on this device.</p><p style="margin-top:8px;">Restore it to continue where you left off?</p>`,
      showCancelButton: true,
      confirmButtonText: "Resume draft",
      cancelButtonText: "Start fresh",
      confirmButtonColor: "#C8102E",
      reverseButtons: true,
    }).then((res) => {
      if (res.isConfirmed) {
        setLocalFormData(draft.payload as FormData);
        autosave.acceptDraft();
      } else {
        autosave.dismissDraft();
      }
    });
  }, [autosave, draftPromptShown]);

  // --- RESTORED HANDLERS ---
  // Phase 1 of LIB feature: line items now use itemName/quantity/unitPrice/totalAmount
  // instead of {item, value}. Validation requires a non-empty name AND positive total.
  const isBudgetValid = useMemo(() => {
    if (localFormData.budgetItems.length === 0) return false;
    return localFormData.budgetItems.every((item: any) => {
      if (!item.source?.trim()) return false;

      const ps = item.budget.ps || [];
      const mooe = item.budget.mooe || [];
      const co = item.budget.co || [];

      const allExpenses = [...ps, ...mooe, ...co];
      const hasInvalidLine = allExpenses.some((ex: any) => {
        if (!ex.itemName?.trim()) return true;
        const qty = Number(ex.quantity) || 0;
        const unitPrice = Number(ex.unitPrice) || 0;
        if (qty <= 0) return true;
        if (unitPrice < 0) return true;
        return false;
      });
      if (hasInvalidLine) return false;

      if (ps.length === 0) return false;
      if (mooe.length === 0) return false;

      return true;
    });
  }, [localFormData.budgetItems]);



  const handleDirectUpdate = (field: keyof FormData | string, value: any) => {
    setLocalFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name.startsWith("agencyAddress.")) {
      const addressField = name.split(".")[1];
      setLocalFormData((prev: any) => ({
        ...prev,
        agencyAddress: { ...prev.agencyAddress, [addressField]: value },
      }));
    } else {
      setLocalFormData((prev: any) => ({ ...prev, [name]: value }));
    }
  };

  // --- VALIDATION LOGIC ---

  const validateBasicInfo = (): boolean => {
    const {
      program_title,
      project_title,
      year,
      plannedStartDate,
      plannedEndDate,
      duration,
      agency,
      agencyAddress,
      telephone,
      email,
      tags
    } = localFormData;

    const missingFields: string[] = [];
    if (!program_title?.trim()) missingFields.push("Program Title");
    if (!project_title?.trim()) missingFields.push("Project Title");
    if (!YEAR_REGEX.test(String(year ?? ""))) missingFields.push("Year (digits only)");
    if (!plannedStartDate) missingFields.push("Planned Start Date");
    if (!plannedEndDate) missingFields.push("Planned End Date");
    if (!duration) missingFields.push("Duration");
    if (!agency) missingFields.push("Agency");
    // Street and Barangay are now optional
    if (!agencyAddress?.city?.trim()) missingFields.push("City");
    if (!telephone?.trim()) missingFields.push("Telephone");
    if (!email?.trim()) missingFields.push("Email");
    if (!tags || tags.length === 0) missingFields.push("Tags");

    if (missingFields.length > 0) {
      Swal.fire({
        icon: "warning",
        title: "Missing Basic Information",
        html: `<p>Please fill in the following required fields before proceeding:</p>
               <ul style="text-align:left;margin-top:8px;display:inline-block;">
                 ${missingFields.map((f) => `<li>• ${f}</li>`).join("")}
               </ul>`,
        confirmButtonColor: "#C8102E",
      });
      return false;
    }
    return true;
  };

  const validateResearchDetails = (): boolean => {
    const {
      researchStation,
      sectorCommodity,
      disciplineName,
      priorities_id,
      classification_type,
      class_input
    } = localFormData;

    const missingFields: string[] = [];

    if (!researchStation?.trim()) missingFields.push("Research Station");
    if (!sectorCommodity?.trim()) missingFields.push("Sector/Commodity");
    if (!disciplineName?.trim()) missingFields.push("Discipline");
    if (!priorities_id || priorities_id.length === 0) missingFields.push("Priority Areas");
    if (!classification_type) missingFields.push("Classification Type");
    if (!class_input?.trim()) missingFields.push("Specific Classification (Research/Development Type)");

    // Check implementation sites
    const sites = localFormData.implementation_site || [];
    const hasValidSite = sites.some((s: { site: string; city: string }) => s.site?.trim() && s.city?.trim());
    if (!hasValidSite) missingFields.push("At least one valid Implementation Site");

    // Check specific invalid sites if array exists
    if (sites.length > 0) {
      const invalidSites = sites.some((s: { site: string; city: string }) => !s.site?.trim() || !s.city?.trim());
      if (invalidSites && hasValidSite) missingFields.push("All Implementation Sites must have both Name and City");
    }

    if (missingFields.length > 0) {
      Swal.fire({
        icon: "warning",
        title: "Missing Research Details",
        html: `<p>Please complete the following required fields:</p>
               <ul style="text-align:left;margin-top:8px;display:inline-block;">
                 ${missingFields.map((f) => `<li>• ${f}</li>`).join("")}
               </ul>`,
        confirmButtonColor: "#C8102E",
      });
      return false;
    }
    return true;
  };

  const validateBudgetSection = (): boolean => {
    // Check if there are any budget items
    if (localFormData.budgetItems.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "No Budget Items",
        text: "Please add at least one funding source.",
        confirmButtonColor: "#C8102E",
      });
      return false;
    }

    // Check each budget item for valid source and content
    for (let i = 0; i < localFormData.budgetItems.length; i++) {
      const item = localFormData.budgetItems[i];

      if (!item.source?.trim()) {
        Swal.fire({
          icon: "warning",
          title: "Invalid Funding Source",
          text: `Funding source #${i + 1} Name is empty.`,
          confirmButtonColor: "#C8102E",
        });
        return false;
      }

      const ps = item.budget.ps || [];
      const mooe = item.budget.mooe || [];
      const co = item.budget.co || [];

      // Check for empty / invalid line items. Field names match the Phase 1 LIB shape
      // (itemName / quantity / unitPrice / totalAmount) — the older {item, value} shape
      // is dead. An item is valid when it has a name, positive quantity, and
      // non-negative unit price (totalAmount is derived = quantity * unitPrice).
      const allExpenses = [...ps, ...mooe, ...co];
      const invalidLine = allExpenses.find((ex: any) => {
        if (!ex.itemName?.trim()) return true;
        const qty = Number(ex.quantity) || 0;
        const unitPrice = Number(ex.unitPrice) || 0;
        if (qty <= 0) return true;
        if (unitPrice < 0) return true;
        return false;
      });

      if (invalidLine) {
        Swal.fire({
          icon: "warning",
          title: "Incomplete Line Items",
          text: `Funding source "${item.source}" has items with a missing name, a zero quantity, or an invalid unit price.`,
          confirmButtonColor: "#C8102E",
        });
        return false;
      }

      // Check if PS and MOOE have at least one item
      if (ps.length === 0) {
        Swal.fire({
          icon: "warning",
          title: "Missing PS Items",
          text: `Funding source "${item.source}" must have at least one Personnel Services (PS) item.`,
          confirmButtonColor: "#C8102E",
        });
        return false;
      }

      if (mooe.length === 0) {
        Swal.fire({
          icon: "warning",
          title: "Missing MOOE Items",
          text: `Funding source "${item.source}" must have at least one Maintenance & Other Operating Expenses (MOOE) item.`,
          confirmButtonColor: "#C8102E",
        });
        return false;
      }
    }
    return true;
  };

  const handleSectionChange = (nextSection: string) => {
    setActiveSection(nextSection);
  };

  const currentSectionIndex = sectionOrder.indexOf(activeSection as (typeof sectionOrder)[number]);
  const canGoNextFromBasicInfo = useMemo(() => {
    const {
      program_title,
      project_title,
      year,
      plannedStartDate,
      plannedEndDate,
      duration,
      agency,
      agencyAddress,
      telephone,
      email,
      tags,
    } = localFormData;

    return !!(
      program_title?.trim() &&
      project_title?.trim() &&
      YEAR_REGEX.test(String(year ?? "")) &&
      plannedStartDate &&
      plannedEndDate &&
      duration &&
      agency &&
      agencyAddress?.city?.trim() &&
      telephone?.trim() &&
      email?.trim() &&
      tags?.length
    );
  }, [localFormData]);

  const canGoNextFromResearchDetails = useMemo(() => {
    const {
      researchStation,
      sectorCommodity,
      disciplineName,
      priorities_id,
      classification_type,
      class_input,
      implementation_site,
    } = localFormData;

    const sites = implementation_site || [];
    const hasValidSite = sites.some((s: { site: string; city: string }) => s.site?.trim() && s.city?.trim());
    const hasInvalidSite = sites.some((s: { site: string; city: string }) => !s.site?.trim() || !s.city?.trim());

    return !!(
      researchStation?.trim() &&
      sectorCommodity?.trim() &&
      disciplineName?.trim() &&
      priorities_id?.length &&
      classification_type &&
      class_input?.trim() &&
      hasValidSite &&
      !hasInvalidSite
    );
  }, [localFormData]);

  const isBasicInfoComplete = canGoNextFromBasicInfo;
  const isResearchDetailsComplete = canGoNextFromResearchDetails;
  const isBudgetComplete = isBudgetValid;

  const handleNextSection = () => {
    const nextIndex = currentSectionIndex + 1;
    if (nextIndex >= sectionOrder.length) return;
    setActiveSection(sectionOrder[nextIndex]);
  };

  const handlePreviousSection = () => {
    const previousIndex = currentSectionIndex - 1;
    if (previousIndex < 0) return;
    setActiveSection(sectionOrder[previousIndex]);
  };

  // --- FIX 2: UPDATE BUDGET HANDLERS ---

  const addBudgetItem = () => {
    // Validate existing items before adding new one
    if (!validateBudgetSection()) return;

    setLocalFormData((prev: any) => ({
      ...prev,
      budgetItems: [
        ...prev.budgetItems,
        {
          id: Date.now(),
          source: "",
          // Initialize new items with the correct structure
          budget: { 
            ps: [createEmptyRow('ps'), createEmptyRow('ps')], 
            mooe: [createEmptyRow('mooe'), createEmptyRow('mooe')], 
            co: [createEmptyRow('co'), createEmptyRow('co')] 
          },
        },
      ],
    }));
  };


  const removeBudgetItem = (id: number) => {
    setLocalFormData((prev: any) => ({
      ...prev,
      budgetItems: prev.budgetItems.filter((item: any) => item.id !== id),
    }));
  };

  // Generic updater. Logic is now handled inside BudgetSection,
  // this just saves the value to the specific path.
  const updateBudgetItem = (id: number, field: string, value: any) => {
    setLocalFormData((prev: any) => ({
      ...prev,
      budgetItems: prev.budgetItems.map((item: any) => {
        if (item.id === id) {
          // Check if we are updating the 'budget' object (arrays) or the 'source' string
          if (field === "budget") {
            return { ...item, budget: value };
          }
          // If updating 'source'
          if (field === "source") {
            return { ...item, source: value };
          }
          // Fallback for direct updates
          return { ...item, [field]: value };
        }
        return item;
      }),
    }));
  };

  // Phase 2 of LIB feature: import parsed LIB items into the form.
  // If the proponent hasn't filled in any budget yet (default empty first source),
  // we replace that placeholder. Otherwise we append the imported budget as a new source
  // so existing manual entries aren't clobbered.
  const handleLibImport = (
    grouped: { ps: any[]; mooe: any[]; co: any[] },
    sourceName: string,
  ) => {
    setLocalFormData((prev: any) => {
      const first = prev.budgetItems[0];
      const firstIsEmpty =
        first &&
        !first.source?.trim() &&
        (first.budget?.ps?.length ?? 0) === 0 &&
        (first.budget?.mooe?.length ?? 0) === 0 &&
        (first.budget?.co?.length ?? 0) === 0;

      if (firstIsEmpty) {
        return {
          ...prev,
          budgetItems: [
            { id: first.id, source: sourceName, budget: grouped },
            ...prev.budgetItems.slice(1),
          ],
        };
      }

      return {
        ...prev,
        budgetItems: [
          ...prev.budgetItems,
          { id: Date.now(), source: sourceName, budget: grouped },
        ],
      };
    });

    Swal.fire({
      icon: "success",
      title: "LIB imported",
      text: `Imported ${grouped.ps.length + grouped.mooe.length + grouped.co.length} line items into "${sourceName}". Click any category icon to review and edit.`,
      confirmButtonColor: "#C8102E",
      timer: 4000,
      timerProgressBar: true,
    });
  };

  // --- SUBMISSION LOGIC ---

  const handleSubmit = useCallback(async () => {
    // 1. Run Comprehensive Form Validations
    if (!validateBasicInfo()) return;
    if (!validateResearchDetails()) return;
    if (!validateBudgetSection()) return;

    // 2. File Check
    if (!selectedFile) {
      Swal.fire({
        icon: "warning",
        title: "Missing File",
        text: "Please upload a proposal file (PDF/Word) using the Upload block.",
        confirmButtonColor: "#C8102E",
      });
      return;
    }

    // 3. Auth Check
    if (!user?.id) {
      Swal.fire({
        icon: "error",
        title: "Auth Error",
        text: "User not authenticated. Please log in again.",
        confirmButtonColor: "#C8102E",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      // Show loading alert
      Swal.fire({
        title: "Submitting Proposal...",
        text: "Please wait while we process your submission.",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      // Since we are now using the correct structure in State,
      // we might not need heavy transformation, but let's ensure it matches API.
      // If the API expects the exact same structure as Types, we pass localFormData directly.

      const payload: FormData = {
        ...localFormData,
        // Security hardening: always enforce current year on submit.
        year: new Date().getFullYear(),
        // Ensure agency is string
        agency: String(localFormData.agency || ""),
      };

      const result = await submitProposal(payload, selectedFile, workPlanFile);
      console.log("Server Response:", result);

      // Phase 1 of LIB feature: clear the local draft so the form starts fresh next time.
      autosave.clear();
      setWorkPlanFile(null);

      Swal.fire({
        icon: "success",
        title: "Proposal Submitted!",
        text: "Your proposal has been submitted successfully.",
        confirmButtonColor: "#C8102E",
      }).then(() => {
        navigate("/users/Proponent/ProponentMainLayout?tab=profile");
      });
    } catch (error: any) {
      console.error("Submission Error:", error);

      if (isValidationError(error)) {
        const fieldErrors = parseValidationErrors(error.response.data.data);
        Swal.fire({
          icon: "error",
          title: "Validation Error",
          html: `<p>Please fix the following issues:</p><ul style="text-align:left;margin-top:8px;">${fieldErrors.map((e) => `<li>• ${e}</li>`).join("")}</ul>`,
        });
      } else {
        const errorMessage =
          error?.response?.data?.message ||
          error?.message ||
          "An error occurred during submission.";
        Swal.fire({
          icon: "error",
          title: "Submission Failed",
          text: errorMessage,
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [localFormData, selectedFile, user, navigate, autosave]);

  // Auto-fill form fields from extracted DOST template data
  const applyAutoFill = useCallback((fields: FormExtractedFields) => {
    // "year" is always auto-populated (from document or defaults to current year)
    const filled = new Set<string>(["year"]);

    setLocalFormData((prev: any) => {
      const updated = { ...prev };

      // --- (1) Basic Info ---
      if (fields.program_title) { updated.program_title = fields.program_title; filled.add("program_title"); }
      if (fields.project_title) { updated.project_title = fields.project_title; filled.add("project_title"); }
      if (fields.telephone) { updated.telephone = fields.telephone; filled.add("telephone"); }
      if (fields.email) { updated.email = fields.email; filled.add("email"); }

      // Agency: fuzzy-match name to existing lookup
      if (fields.agency_name) {
        const lower = fields.agency_name.toLowerCase();
        const match = lookups.agencies.find(a => a.name.toLowerCase() === lower);
        if (match) {
          updated.agency = match.id;
        } else {
          updated.agency = fields.agency_name;
        }
        filled.add("agency");
      }

      // Agency address
      if (fields.agency_city || fields.agency_barangay || fields.agency_street) {
        updated.agencyAddress = {
          ...updated.agencyAddress,
          ...(fields.agency_city && { city: fields.agency_city }),
          ...(fields.agency_barangay && { barangay: fields.agency_barangay }),
          ...(fields.agency_street && { street: fields.agency_street }),
        };
        filled.add("agencyAddress");
      }

      // --- (2) Cooperating Agencies ---
      if (fields.cooperating_agency_names && fields.cooperating_agency_names.length > 0) {
        const matched = fields.cooperating_agency_names.map(name => {
          const lower = name.toLowerCase();
          const found = lookups.agencies.find(a => a.name.toLowerCase() === lower);
          return found ? { id: found.id, name: found.name } : { id: Date.now() + Math.random(), name };
        });
        updated.cooperating_agencies = matched;
        filled.add("cooperating_agencies");
      }

      // --- (3) R&D Station / Department ---
      // Skipped: R&D Station is now locked to the user's profile department.
      // The department is auto-filled from AuthContext in researchDetails.tsx.

      // --- (4) Classification ---
      if (fields.classification_type) { updated.classification_type = fields.classification_type; filled.add("classification"); }
      if (fields.class_input) { updated.class_input = fields.class_input; filled.add("classification"); }

      // --- (6) Priority Areas / STAND Classification ---
      if (fields.priority_areas) {
        console.log("[AutoFill] priority_areas from AI:", fields.priority_areas);
        console.log("[AutoFill] lookups.priorities count:", lookups.priorities.length, lookups.priorities.slice(0, 5));
        // The extracted value may be a comma-separated list like "Support Industries, STAND"
        const extractedTerms = fields.priority_areas.split(",").map(t => t.trim()).filter(Boolean);
        const matchedIds: number[] = [];
        const matchedNames: string[] = [];

        for (const term of extractedTerms) {
          const lower = term.toLowerCase();
          // Fuzzy match: the priority name includes the extracted term OR vice versa
          const match = lookups.priorities.find(
            p => p.name.toLowerCase().includes(lower) || lower.includes(p.name.toLowerCase())
          );
          console.log("[AutoFill] term:", term, "→ match:", match);
          if (match) {
            if (!matchedIds.includes(match.id)) matchedIds.push(match.id);
            if (!matchedNames.includes(match.name)) matchedNames.push(match.name);
          } else {
            // No DB match — store the raw text so the user can see it was detected
            if (!matchedNames.includes(term)) matchedNames.push(term);
          }
        }

        console.log("[AutoFill] matchedIds:", matchedIds, "matchedNames:", matchedNames);
        if (matchedIds.length > 0) updated.priorities_id = matchedIds;
        // priorities_names is used by researchDetails.tsx to pre-select the pill UI
        if (matchedNames.length > 0) updated.priorities_names = matchedNames;
        filled.add("priorities");
      }

      // --- (7) Sector ---
      if (fields.sector) {
        const lower = fields.sector.toLowerCase();
        const match = lookups.sectors.find(s => s.name.toLowerCase().includes(lower) || lower.includes(s.name.toLowerCase()));
        if (match) {
          updated.sector = match.id;
          updated.sectorCommodity = match.name;
        } else {
          updated.sectorCommodity = fields.sector;
        }
        filled.add("sector");
      }

      // --- (8) Discipline ---
      if (fields.discipline) {
        const lower = fields.discipline.toLowerCase();
        const match = lookups.disciplines.find(d => d.name.toLowerCase().includes(lower) || lower.includes(d.name.toLowerCase()));
        if (match) {
          updated.discipline = match.id;
          updated.disciplineName = match.name;
        } else {
          updated.disciplineName = fields.discipline;
        }
        filled.add("discipline");
      }

      // --- (15) Duration & Dates ---
      if (fields.duration) { updated.duration = String(fields.duration); filled.add("duration"); }

      if (fields.planned_start_month && fields.planned_start_year) {
        const m = MONTH_MAP[fields.planned_start_month.toLowerCase()];
        if (m !== undefined) {
          const d = new Date(parseInt(fields.planned_start_year), m, 1);
          updated.plannedStartDate = d.toISOString().split("T")[0];
          filled.add("plannedStartDate");
        }
      }

      if (fields.planned_end_month && fields.planned_end_year) {
        const m = MONTH_MAP[fields.planned_end_month.toLowerCase()];
        if (m !== undefined) {
          const d = new Date(parseInt(fields.planned_end_year), m + 1, 0);
          updated.plannedEndDate = d.toISOString().split("T")[0];
          filled.add("plannedEndDate");
        }
      }

      // --- (16) Budget ---
      // Auto-fill from Form 1B only knows category totals — it can't extract individual line
      // items. We populate a single placeholder line per category so the proponent has a starting
      // point and can break it down into proper line items afterwards.
      if (fields.budget_sources && fields.budget_sources.length > 0) {
        const placeholder = (label: string, total: number) => ({
          uid: `auto_${label}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          subcategoryId: null,
          customSubcategoryLabel: null,
          itemName: label,
          spec: null,
          quantity: 1,
          unit: null,
          unitPrice: total,
          totalAmount: total,
        });

        updated.budgetItems = fields.budget_sources.map((src, idx) => ({
          id: idx + 1,
          source: src.source,
          budget: {
            ps: src.ps > 0 ? [placeholder("Personnel Services (auto-filled — please itemize)", src.ps)] : [],
            mooe: src.mooe > 0 ? [placeholder("Maintenance and Other Operating Expenses (auto-filled — please itemize)", src.mooe)] : [],
            co: src.co > 0 ? [placeholder("Capital Outlay (auto-filled — please itemize)", src.co)] : [],
          },
        }));
        filled.add("budget");
      }

      return updated;
    });

    setAutoFilledFields(filled);
  }, [lookups]);

  // AI Template Check - Updated to use real AI
  // Modified to accept an optional file argument for immediate checking after selection
  const handleAITemplateCheck = useCallback(async (fileToAnalyze?: File) => {
    // Use the passed file OR the one in state
    const targetFile = fileToAnalyze || selectedFile;

    if (!targetFile) {
      Swal.fire({
        icon: "warning",
        title: "No File Selected",
        text: "Please upload a proposal file first.",
      });
      return;
    }

    try {
      setIsCheckingTemplate(true);

      // Show loading alert
      Swal.fire({
        title: "Analyzing Proposal...",
        text: "Our AI is reviewing your document. This may take a few moments.",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      // Call the AI analysis API
      const result = await analyzeProposalWithAI(targetFile);
      
      // Add a small artificial delay for the "AI thinking" effect 
      // since the backend is now so fast we want it to feel substantial
      await new Promise(resolve => setTimeout(resolve, 2500));

      // Auto-fill form fields from extracted data
      if (result.formFields) {
        applyAutoFill(result.formFields);
      }

      // Close loading alert
      Swal.close();

      // Store the result and show the modal
      setAiCheckResult(result);
      setShowAIModal(true);
    } catch (error) {
      console.error("AI Analysis Error:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to analyze the proposal. Please try again.";

      Swal.fire({
        icon: "error",
        title: "Analysis Failed",
        text: errorMessage,
      });
    } finally {
      setIsCheckingTemplate(false);
    }
  }, [selectedFile, applyAutoFill]);

  // Wrapper to handle file selection AND trigger AI check immediately
  const handleFileSelect = (file: File | null) => {
    setSelectedFile(file);
    if (file) {
      // Auto-trigger AI check
      handleAITemplateCheck(file);
    } else {
      // Clear previous results if file is removed
      setAiCheckResult(null);
    }
  };

  // ... (Render Helpers remain the same)

  const getTabClass = (sectionName: string) => `
    p-4 rounded-xl border transition-all duration-200 hover:scale-105 hover:border-[#C8102E] font-bold
    ${activeSection === sectionName ? "bg-[#C8102E] text-white border-[#C8102E]" : "bg-white text-gray-600 border-gray-200"}
  `;

  if (lookups.loading || !user) {
    return <PageLoader mode="proponent-submission" />;
  }

  return (
    <>
      <div className="min-h-screen px-5 sm:px-8 lg:px-10 xl:px-12 2xl:px-16 py-8 lg:py-10 bg-gradient-to-br from-slate-50 to-slate-100 animate-fade-in">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3 flex flex-col gap-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
              <button
                onClick={() => handleSectionChange("basic-info")}
                className={getTabClass("basic-info") + " group relative overflow-hidden"}
              >
                <span className="flex items-center gap-2 justify-center w-full text-center">
                  Basic Information
                </span>
                {isBasicInfoComplete ? (
                  <span className="absolute top-2 right-2 z-10">
                    <CheckCircle2 className={`w-4 h-4 ${activeSection === "basic-info" ? "text-white" : "text-[#C8102E]"}`} />
                  </span>
                ) : activeSection === "basic-info" ? (
                  <span className="absolute top-2 right-2 flex h-3.5 w-3.5 z-10">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-slate-100 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-slate-100"></span>
                  </span>
                ) : null}
              </button>
              <button
                onClick={() => handleSectionChange("research-details")}
                className={getTabClass("research-details") + " group relative overflow-hidden"}
              >
                <span className="flex items-center gap-2 justify-center w-full text-center">
                  Research Details
                </span>
                {isResearchDetailsComplete ? (
                  <span className="absolute top-2 right-2 z-10">
                    <CheckCircle2 className={`w-4 h-4 ${activeSection === "research-details" ? "text-white" : "text-[#C8102E]"}`} />
                  </span>
                ) : activeSection === "research-details" ? (
                  <span className="absolute top-2 right-2 flex h-3.5 w-3.5 z-10">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-slate-100 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-slate-100"></span>
                  </span>
                ) : null}
              </button>
              <button
                onClick={() => handleSectionChange("budget")}
                className={getTabClass("budget") + " group relative overflow-hidden"}
              >
                <span className="flex items-center gap-2 justify-center w-full text-center">
                  Budget Section
                </span>
                {isBudgetComplete ? (
                  <span className="absolute top-2 right-2 z-10">
                    <CheckCircle2 className={`w-4 h-4 ${activeSection === "budget" ? "text-white" : "text-[#C8102E]"}`} />
                  </span>
                ) : activeSection === "budget" ? (
                  <span className="absolute top-2 right-2 flex h-3.5 w-3.5 z-10">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-slate-100 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-slate-100"></span>
                  </span>
                ) : null}
              </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-8 border border-gray-100 min-h-[600px]">
              {activeSection === "basic-info" && (
                <BasicInformation
                  formData={localFormData}
                  onInputChange={handleInputChange}
                  onUpdate={handleDirectUpdate}
                  autoFilledFields={autoFilledFields}
                />
              )}
              {activeSection === "research-details" && (
                <ResearchDetails
                  formData={localFormData}
                  onUpdate={handleDirectUpdate}
                  autoFilledFields={autoFilledFields}
                />
              )}
              {activeSection === "budget" && (
                <BudgetSection
                  formData={localFormData}
                  onBudgetItemAdd={addBudgetItem}
                  onBudgetItemRemove={removeBudgetItem}
                  onBudgetItemUpdate={updateBudgetItem}
                  autoFilledFields={autoFilledFields}
                  onOpenBudgetModal={(itemId: number, category: 'ps' | 'mooe' | 'co') => setActiveBudgetModal({ itemId, category })}
                  onLibImport={handleLibImport}
                  onOpenLibImport={() => setIsLibImportModalOpen(true)}
                />
              )}

              <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between">
                {currentSectionIndex > 0 ? (
                  <button
                    type="button"
                    onClick={handlePreviousSection}
                    className="px-5 py-2.5 rounded-lg border border-gray-300 text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 inline-flex items-center gap-1.5"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </button>
                ) : <div />}

                {activeSection !== "budget" ? (
                  <button
                    type="button"
                    onClick={handleNextSection}
                    className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-[#C8102E] hover:bg-[#a00c24] inline-flex items-center gap-1.5"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : <div />}
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <UploadSidebar
              formData={localFormData}
              selectedFile={selectedFile}
              workPlanFile={workPlanFile}
              aiCheckResult={aiCheckResult}
              isCheckingTemplate={isCheckingTemplate}
              isUploadDisabled={isSubmitting}
              isBudgetValid={isBudgetValid}
              onFileSelect={handleFileSelect}
              onWorkPlanFileSelect={setWorkPlanFile}
              onAITemplateCheck={() => handleAITemplateCheck()}
              onShowAIModal={() => setShowAIModal(true)}
              onSubmit={handleSubmit}
              onViewTemplate={() => setIsTemplateModalOpen(true)}
            />
          </div>
        </div>
      </div>

      {/* --- Modals (Outside animate-fade-in container to fix z-index) --- */}
      <AIModal
        show={showAIModal}
        onClose={() => setShowAIModal(false)}
        aiCheckResult={aiCheckResult}
        isChecking={isCheckingTemplate}
      />

      <TemplateViewModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
      />

      {activeBudgetModal && (
        <BudgetBreakdownModal
          formData={localFormData}
          activeModal={activeBudgetModal}
          onClose={() => setActiveBudgetModal(null)}
          onBudgetItemUpdate={updateBudgetItem}
        />
      )}

      {isLibImportModalOpen && (
        <LibImportModal
          onClose={() => setIsLibImportModalOpen(false)}
          onImport={(grouped, sourceName) => {
            handleLibImport(grouped, sourceName);
            setIsLibImportModalOpen(false);
          }}
        />
      )}
    </>
  );
};

export default Submission;
