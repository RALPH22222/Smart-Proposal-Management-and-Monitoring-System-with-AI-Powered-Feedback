import React, { useState, useCallback, useEffect, useMemo } from "react";

// Component Imports
import BasicInformation from './basicInfo';
import ResearchDetails from './researchDetails';
import BudgetSection from './budgetSection';
import UploadSidebar from './uploadSidebar';
import AIModal from '../../../../components/proponent-component/aiModal';

// Type Imports
import type { FormData, AICheckResult, BudgetItem } from '../../../../types/proponent-form'; // Ensure BudgetItem is imported

// API Service
import { submitProposal } from '../../../../services/proposal.api'; 

const Submission: React.FC = () => {
  // ... (UI State remains the same)
  const [activeSection, setActiveSection] = useState<string>('basic-info');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  
  // ... (AI State remains the same)
  const [isCheckingTemplate, setIsCheckingTemplate] = useState(false);
  const [isCheckingForm, setIsCheckingForm] = useState(false);
  const [aiCheckResult, setAiCheckResult] = useState<AICheckResult | null>(null);

  // ... (Data State remains the same)
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [years, setYears] = useState<string[]>([]);
  
  // --- FIX 1: UPDATE INITIAL STATE STRUCTURE ---
  const [localFormData, setLocalFormData] = useState<FormData>({ // Use FormData type explicitly
    programTitle: '', 
    projectTitle: '', 
    agencyName: '', // Changed from 'agency' to match your interface
    agencyAddress: { street: '', barangay: '', city: '' },
    telephone: '', 
    email: '', 
    tags: [], 
    implementationSite: [],
    cooperatingAgencies: [], 
    researchStation: '', 
    schoolYear: '',
    classificationType: '', 
    researchType: { basic: false, applied: false },
    developmentType: '', 
    implementationMode: { singleAgency: false, multiAgency: false },
    priorityAreas: { 
      stand: false, 
      coconutIndustry: false, 
      exportWinners: false, 
      otherPriorityAreas: false, 
      supportIndustries: false 
    },
    sectorCommodity: '', 
    discipline: '', 
    duration: '', 
    plannedStartDate: null, 
    plannedEndDate: null, 
    // --- THIS WAS CAUSING THE WHITESCREEN ---
    budgetItems: [{ 
      id: 1, 
      source: '', 
      // Initialize with the nested object structure
      budget: { ps: [], mooe: [], co: [] } 
    }],
  });

  // ... (Effects remain the same)
  useEffect(() => {
    if (localFormData.plannedStartDate && localFormData.plannedEndDate) {
      const start = new Date(localFormData.plannedStartDate).getFullYear();
      const end = new Date(localFormData.plannedEndDate).getFullYear();
      const y = [];
      for (let i = start; i <= end; i++) y.push(i.toString());
      setYears(y);
    }
  }, [localFormData.plannedStartDate, localFormData.plannedEndDate]);

  // ... (Validation remains the same)
  const isBudgetValid = useMemo(() => {
    if (localFormData.budgetItems.length === 0) return false;
    return localFormData.budgetItems.every((item: any) => {
      const sourceValid = item.source?.trim() !== '';
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
    if (name.startsWith('agencyAddress.')) {
        const addressField = name.split('.')[1];
        setLocalFormData((prev: any) => ({
            ...prev,
            agencyAddress: { ...prev.agencyAddress, [addressField]: value }
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
          source: '', 
          // Initialize new items with the correct structure
          budget: { ps: [], mooe: [], co: [] } 
        }
      ] 
    }));
  };
  
  const removeBudgetItem = (id: number) => {
    setLocalFormData((prev: any) => ({ 
      ...prev, 
      budgetItems: prev.budgetItems.filter((item: any) => item.id !== id) 
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
            if (field === 'budget') {
                return { ...item, budget: value };
            }
            // If updating 'source'
            if (field === 'source') {
                return { ...item, source: value };
            }
            // Fallback for direct updates
            return { ...item, [field]: value };
        }
        return item;
      }),
    }));
  };

  const toggleExpand = (id: number) => {
    // Optional: Only needed if you have UI expansion state not in the type
    // If not in type, ignore or manage strictly in UI component
  };

  // --- SUBMISSION LOGIC ---

  const handleSubmit = useCallback(async () => {
    if (!selectedFile) {
      alert("Please upload a proposal file (PDF/Word).");
      return;
    }
    if (!localFormData.projectTitle) {
      alert("Project Title is required.");
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Since we are now using the correct structure in State, 
      // we might not need heavy transformation, but let's ensure it matches API.
      // If the API expects the exact same structure as Types, we pass localFormData directly.
      
      const payload: FormData = {
        ...localFormData,
        // Ensure agency is string
        agencyName: String(localFormData.agencyName || ""), 
      };

      const currentUserId = "cb05d6ff-59d4-470d-b407-de4b155adfdb";

      const result = await submitProposal(payload, selectedFile, currentUserId);
      alert("Proposal submitted successfully!");
      console.log("Server Response:", result);

    } catch (error: any) {
      console.error("Submission Error:", error);
      alert(`Submission Failed: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  }, [localFormData, selectedFile]);

  // ... (AI Handlers remain the same)
  const handleAITemplateCheck = useCallback(async () => {
    if (!selectedFile) return;
    setIsCheckingTemplate(true); 
    setShowAIModal(true);
    setTimeout(() => { 
      setIsCheckingTemplate(false); 
      setAiCheckResult({ isValid: true, issues: [], suggestions: [], score: 90, type: 'template', title: 'Check' }); 
    }, 1500);
  }, [selectedFile]);

  const handleAIFormCheck = useCallback(async () => {
    setIsCheckingForm(true); 
    setShowAIModal(true);
    setTimeout(() => { 
      setIsCheckingForm(false); 
      setAiCheckResult({ isValid: true, issues: [], suggestions: [], score: 90, type: 'form', title: 'Check' }); 
    }, 1500);
  }, []);

  // ... (Render Helpers remain the same)
  const renderActiveSection = () => {
    switch (activeSection) {
      case 'basic-info': 
        return <BasicInformation formData={localFormData} onInputChange={handleInputChange} onUpdate={handleDirectUpdate} />;
      case 'research-details': 
        return <ResearchDetails formData={localFormData} onInputChange={handleInputChange} onUpdate={handleDirectUpdate}/>;
      case 'budget': 
        return <BudgetSection formData={localFormData} years={years} onBudgetItemAdd={addBudgetItem} onBudgetItemRemove={removeBudgetItem} onBudgetItemUpdate={updateBudgetItem} onBudgetItemToggle={toggleExpand} />;
      default: return null;
    }
  };

  const getTabClass = (sectionName: string) => `
    p-4 rounded-xl border transition-all duration-200 hover:scale-105 hover:border-[#C8102E] font-medium
    ${activeSection === sectionName ? 'bg-[#C8102E] text-white border-[#C8102E]' : 'bg-white text-gray-600 border-gray-200'}
  `;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <AIModal 
        show={showAIModal} 
        onClose={() => { setShowAIModal(false); setAiCheckResult(null); }} 
        aiCheckResult={aiCheckResult} 
        isChecking={isCheckingTemplate || isCheckingForm} 
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 flex flex-col gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
            <button onClick={() => setActiveSection('basic-info')} className={getTabClass('basic-info')}>Basic Information</button>
            <button onClick={() => setActiveSection('research-details')} className={getTabClass('research-details')}>Research Details</button>
            <button onClick={() => setActiveSection('budget')} className={getTabClass('budget')}>Budget Section</button>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-8 border border-gray-100 min-h-[600px]">
            {renderActiveSection()}
          </div>
        </div>

        <div className="lg:col-span-1">
          <UploadSidebar 
            formData={localFormData} 
            selectedFile={selectedFile} 
            isCheckingTemplate={isCheckingTemplate} 
            isCheckingForm={isCheckingForm} 
            isUploadDisabled={isSubmitting} 
            isBudgetValid={isBudgetValid} 
            onAIFormCheck={handleAIFormCheck} 
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