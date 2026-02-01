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

  // ... (Validation remains the same)
  const isBudgetValid = useMemo(() => {
    if (localFormData.budgetItems.length === 0) return false;
    return localFormData.budgetItems.every((item: any) => {
      const sourceValid = item.source?.trim() !== "";
      // Simple check: does it have at least one item in any category?
      const hasBudget = item.budget.ps.length > 0 || item.budget.mooe.length > 0 || item.budget.co.length > 0;
      return sourceValid && hasBudget; // Adjusted validation logic
    });
  }, [localFormData.budgetItems]);

  // ... (Form Update Handlers remain the same)
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

  // --- FIX 2: UPDATE BUDGET HANDLERS ---

  const addBudgetItem = () => {
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

      await Swal.fire({
        icon: "success",
        title: "Submitted!",
        text: "Proposal submitted successfully!",
        timer: 2000,
        showConfirmButton: false,
      });

      console.log("Server Response:", result);

      // Redirect to profile
      navigate("/users/proponent/proponentMainLayout?tab=profile");
    } catch (error) {
      console.error("Submission Error:", error);
      const errorMessage = error instanceof Error ? error.message : "An error occurred during submission.";
      Swal.fire({
        icon: "error",
        title: "Submission Failed",
        text: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [localFormData, selectedFile, user, navigate]);

  // AI Template Check - Updated to use real AI
  const handleAITemplateCheck = useCallback(async () => {
    if (!selectedFile) {
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
      const result = await analyzeProposalWithAI(selectedFile);

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
          setAiCheckResult(null);
        }}
        aiCheckResult={aiCheckResult}
        isChecking={isCheckingTemplate}
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 flex flex-col gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
            <button onClick={() => setActiveSection("basic-info")} className={getTabClass("basic-info")}>
              Basic Information
            </button>
            <button onClick={() => setActiveSection("research-details")} className={getTabClass("research-details")}>
              Research Details
            </button>
            <button onClick={() => setActiveSection("budget")} className={getTabClass("budget")}>
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
              <ResearchDetails formData={localFormData} onUpdate={handleDirectUpdate} />
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
            onFileSelect={setSelectedFile}
            onAITemplateCheck={handleAITemplateCheck}
            onSubmit={handleSubmit}
          />
        </div>
      </div>
    </div>
  );
};

export default Submission;
