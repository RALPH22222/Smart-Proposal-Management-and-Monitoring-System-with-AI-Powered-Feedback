import React, { useState, useCallback, useMemo } from "react";

// Component Imports
import BasicInformation from "./basicInfo";
import ResearchDetails from "./researchDetails";
import BudgetSection from "./budgetSection";
import UploadSidebar from "./uploadSidebar";
import AIModal from "../../../../components/proponent-component/aiModal";

// Type Imports
import type { FormData } from "../../../../types/proponent-form";
import type { AIAnalysisResult } from "../../../../components/proponent-component/aiModal";

// API Service
import { submitProposal, analyzeProposalWithAI } from "../../../../services/proposal.api";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { isValidationError, parseValidationErrors } from "../../../../utils/validationErrors";

// Auth Context
import { useAuthContext } from "../../../../context/AuthContext";

const Submission: React.FC = () => {
  // Auth Context
  const { user } = useAuthContext();
  const navigate = useNavigate();

  // ... (UI State remains the same)
  const [activeSection, setActiveSection] = useState<string>("basic-info");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);

  // ... (AI State remains the same)
  const [isCheckingTemplate, setIsCheckingTemplate] = useState(false);
  const [aiCheckResult, setAiCheckResult] = useState<AIAnalysisResult | null>(null);

  // ... (Data State remains the same)
  // ... (Data State remains the same)
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

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
    schoolYear: "",
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
        budget: { ps: [], mooe: [], co: [] },
      },
    ],
  });

  // ... (Effects remain the same)

  // --- RESTORED HANDLERS ---
  const isBudgetValid = useMemo(() => {
    if (localFormData.budgetItems.length === 0) return false;
    return localFormData.budgetItems.every((item: any) => {
      // Check Source
      if (!item.source?.trim()) return false;

      const ps = item.budget.ps || [];
      const mooe = item.budget.mooe || [];
      const co = item.budget.co || [];

      // Check for empty line items
      const allExpenses = [...ps, ...mooe, ...co];
      const hasEmptyLineItem = allExpenses.some((ex: any) => !ex.item?.trim() || !(ex.value > 0));
      if (hasEmptyLineItem) return false;

      // Check mandatory categories (PS & MOOE required per source)
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
      schoolYear,
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
    if (!schoolYear?.trim() || schoolYear.length < 9) missingFields.push("School Year (YYYY-YYYY)");
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
      class_input,
      implementation_site
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

      // Check for empty line items (Description or Amount)
      const allExpenses = [...ps, ...mooe, ...co];
      const hasEmptyLineItem = allExpenses.some((ex: any) => !ex.item?.trim() || !(ex.value > 0));

      if (hasEmptyLineItem) {
        Swal.fire({
          icon: "warning",
          title: "Incomplete Line Items",
          text: `Funding source "${item.source}" has items without a description or amount.`,
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
    // Navigation Guard Logic:
    // 1. To enter Research Details, Basic Info must be valid.
    if (nextSection === "research-details") {
      if (!validateBasicInfo()) return;
    }

    // 2. To enter Budget, both Basic Info and Research Details must be valid.
    if (nextSection === "budget") {
      // Check Basic Info first
      if (!validateBasicInfo()) return;

      // Then Check Research Details
      if (!validateResearchDetails()) return;
    }

    // 3. Going to Basic Info is always allowed (backward navigation).

    setActiveSection(nextSection);
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
          budget: { ps: [], mooe: [], co: [] },
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

  // --- SUBMISSION LOGIC ---

  const handleSubmit = useCallback(async () => {
    if (!selectedFile) {
      Swal.fire({
        icon: "warning",
        title: "Missing File",
        text: "Please upload a proposal file (PDF/Word).",
      });
      return;
    }
    if (!localFormData.project_title) {
      Swal.fire({
        icon: "warning",
        title: "Missing Title",
        text: "Project Title is required.",
      });
      return;
    }
    if (!user?.id) {
      Swal.fire({
        icon: "error",
        title: "Auth Error",
        text: "User not authenticated. Please log in again.",
      });
      return;
    }

    // Pre-submit validation for fields the backend requires
    const missingFields: string[] = [];
    if (!localFormData.agency) missingFields.push("Agency");
    if (!localFormData.agencyAddress?.city?.trim()) missingFields.push("Agency City");
    if (!localFormData.sector) missingFields.push("Sector/Commodity");
    if (!localFormData.discipline) missingFields.push("Discipline");
    if (!localFormData.plannedStartDate) missingFields.push("Planned Start Date");
    if (!localFormData.plannedEndDate) missingFields.push("Planned End Date");
    if (!localFormData.schoolYear?.trim()) missingFields.push("School Year");

    if (missingFields.length > 0) {
      Swal.fire({
        icon: "warning",
        title: "Missing Required Fields",
        html: `<p>Please fill in the following fields:</p><ul style="text-align:left;margin-top:8px;">${missingFields.map((f) => `<li>• ${f}</li>`).join("")}</ul>`,
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
        // Ensure agency is string
        agency: String(localFormData.agency || ""),
      };

      const result = await submitProposal(payload, selectedFile);
      console.log("Server Response:", result);

      Swal.fire({
        icon: "success",
        title: "Proposal Submitted!",
        text: "Your proposal has been submitted successfully.",
        confirmButtonColor: "#C8102E",
      }).then(() => {
        navigate("/users/proponent/proponentMainLayout?tab=profile");
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
  }, [localFormData, selectedFile, user, navigate]);

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
  }, [selectedFile]);

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
    p-4 rounded-xl border transition-all duration-200 hover:scale-105 hover:border-[#C8102E] font-medium
    ${activeSection === sectionName ? "bg-[#C8102E] text-white border-[#C8102E]" : "bg-white text-gray-600 border-gray-200"}
  `;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <AIModal
        show={showAIModal}
        onClose={() => {
          setShowAIModal(false);
          // Don't clear result immediately so user can view it again if they want? 
          // Actually usually better to keep it until new file. 
          // But close clears modal.
        }}
        aiCheckResult={aiCheckResult}
        isChecking={isCheckingTemplate}
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 flex flex-col gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
            <button onClick={() => handleSectionChange("basic-info")} className={getTabClass("basic-info")}>
              Basic Information
            </button>
            <button onClick={() => handleSectionChange("research-details")} className={getTabClass("research-details")}>
              Research Details
            </button>
            <button onClick={() => handleSectionChange("budget")} className={getTabClass("budget")}>
              Budget Section
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-8 border border-gray-100 min-h-[600px]">
            {activeSection === "basic-info" && (
              <BasicInformation
                formData={localFormData}
                onInputChange={handleInputChange}
                onUpdate={handleDirectUpdate}
              />
            )}
            {activeSection === "research-details" && (
              <ResearchDetails
                formData={localFormData}
                onUpdate={handleDirectUpdate}
              />
            )}
            {activeSection === "budget" && (
              <BudgetSection
                formData={localFormData}
                onBudgetItemAdd={addBudgetItem}
                onBudgetItemRemove={removeBudgetItem}
                onBudgetItemUpdate={updateBudgetItem}
              />
            )}
          </div>
        </div>

        <div className="lg:col-span-1">
          <UploadSidebar
            formData={localFormData}
            selectedFile={selectedFile}
            isCheckingTemplate={isCheckingTemplate}
            isUploadDisabled={isSubmitting}
            isBudgetValid={isBudgetValid}
            onFileSelect={handleFileSelect}
            onAITemplateCheck={() => handleAITemplateCheck()}
            onSubmit={handleSubmit}
          />
        </div>
      </div>
    </div>
  );
};

export default Submission;
