import React, { useState, useCallback, useEffect, useMemo } from "react";

// Component Imports
import BasicInformation from './basicInfo';
import ResearchDetails from './researchDetails';
import BudgetSection from './budgetSection';
import UploadSidebar from './uploadSidebar';
import AIModal from '../../../../components/proponent-component/aiModal';

// Type Imports
import type { FormData, AICheckResult, BudgetItem as ApiBudgetItem } from '../../../../types/proponent-form';

// API Service
import { submitProposal } from '../../../../services/proposal.api'; 

const Submission: React.FC = () => {
  // --- STATE MANAGEMENT ---
  
  // UI State
  const [activeSection, setActiveSection] = useState<string>('basic-info');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  
  // AI Analysis State
  const [isCheckingTemplate, setIsCheckingTemplate] = useState(false);
  const [isCheckingForm, setIsCheckingForm] = useState(false);
  const [aiCheckResult, setAiCheckResult] = useState<AICheckResult | null>(null);

  // Data State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [years, setYears] = useState<string[]>([]);
  
  // Form Data
  const [localFormData, setLocalFormData] = useState<any>({
    programTitle: '', 
    projectTitle: '', 
    agency: '', 
    agencyName: '',
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
    // Initial Budget Item
    budgetItems: [{ 
      id: 1, source: '', ps: 0, mooe: 0, co: 0, total: 0, isExpanded: false, year: '' 
    }],
  });

  // --- EFFECTS ---

  // Calculate Years array based on start/end dates
  useEffect(() => {
    if (localFormData.plannedStartDate && localFormData.plannedEndDate) {
      const start = new Date(localFormData.plannedStartDate).getFullYear();
      const end = new Date(localFormData.plannedEndDate).getFullYear();
      const y = [];
      for (let i = start; i <= end; i++) y.push(i.toString());
      setYears(y);
    }
  }, [localFormData.plannedStartDate, localFormData.plannedEndDate]);

  // --- VALIDATION ---

  const isBudgetValid = useMemo(() => {
    if (localFormData.budgetItems.length === 0) return false;
    return localFormData.budgetItems.every((item: any) => {
      const sourceValid = item.source?.trim() !== '';
      const costsValid = (Number(item.ps) || 0) > 0 || (Number(item.mooe) || 0) > 0 || (Number(item.co) || 0) > 0;
      return sourceValid && costsValid;
    });
  }, [localFormData.budgetItems]);

  // --- HANDLERS: FORM UPDATES ---

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

  // --- HANDLERS: BUDGET ---

  const addBudgetItem = () => {
    setLocalFormData((prev: any) => ({ 
      ...prev, 
      budgetItems: [
        ...prev.budgetItems, 
        { 
          id: Date.now(), 
          source: '', 
          ps: 0, mooe: 0, co: 0, total: 0, 
          isExpanded: false, 
          year: years[0] || '' 
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

  const updateBudgetItem = (id: number, field: string, value: string | number) => {
    setLocalFormData((prev: any) => ({
      ...prev,
      budgetItems: prev.budgetItems.map((item: any) => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value };
          // Recalculate row total
          updatedItem.total = (Number(updatedItem.ps)||0) + (Number(updatedItem.mooe)||0) + (Number(updatedItem.co)||0);
          return updatedItem;
        }
        return item;
      }),
    }));
  };

  const toggleExpand = (id: number) => {
    setLocalFormData((prev: any) => ({ 
      ...prev, 
      budgetItems: prev.budgetItems.map((item: any) => 
        item.id === id ? { ...item, isExpanded: !item.isExpanded } : item
      ) 
    }));
  };

  // --- HANDLERS: SUBMISSION ---

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
      
      // 1. Transform Frontend Budget to Backend Structure
      const transformedBudget: ApiBudgetItem[] = localFormData.budgetItems.map((item: any) => ({
        source: item.source,
        budget: {
          ps: item.ps > 0 ? [{ item: "Estimated Cost", value: Number(item.ps) }] : [],
          mooe: item.mooe > 0 ? [{ item: "Estimated Cost", value: Number(item.mooe) }] : [],
          co: item.co > 0 ? [{ item: "Estimated Cost", value: Number(item.co) }] : []
        }
      }));

      // 2. Prepare Payload
      const payload: FormData = {
        ...localFormData,
        budgetItems: transformedBudget,
        agency: String(localFormData.agency || localFormData.agencyName || ""), 
      };

      // 3. Auth Context (Replace with actual User Context)
      const currentUserId = "cb05d6ff-59d4-470d-b407-de4b155adfdb";

      // 4. Submit
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

  // --- HANDLERS: AI ---

  const handleAITemplateCheck = useCallback(async () => {
    if (!selectedFile) return;
    setIsCheckingTemplate(true); 
    setShowAIModal(true);
    // Mock Delay
    setTimeout(() => { 
      setIsCheckingTemplate(false); 
      setAiCheckResult({ isValid: true, issues: [], suggestions: [], score: 90, type: 'template', title: 'Check' }); 
    }, 1500);
  }, [selectedFile]);

  const handleAIFormCheck = useCallback(async () => {
    setIsCheckingForm(true); 
    setShowAIModal(true);
    // Mock Delay
    setTimeout(() => { 
      setIsCheckingForm(false); 
      setAiCheckResult({ isValid: true, issues: [], suggestions: [], score: 90, type: 'form', title: 'Check' }); 
    }, 1500);
  }, []);

  // --- RENDER HELPERS ---

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
      {/* AI Modal - FIXED: Removed checkType prop */}
      <AIModal 
        show={showAIModal} 
        onClose={() => { setShowAIModal(false); setAiCheckResult(null); }} 
        aiCheckResult={aiCheckResult} 
        isChecking={isCheckingTemplate || isCheckingForm} 
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Main Content Area (Left 3 Columns) */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          
          {/* Navigation Tabs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
            <button onClick={() => setActiveSection('basic-info')} className={getTabClass('basic-info')}>
              Basic Information
            </button>
            <button onClick={() => setActiveSection('research-details')} className={getTabClass('research-details')}>
              Research Details
            </button>
            <button onClick={() => setActiveSection('budget')} className={getTabClass('budget')}>
              Budget Section
            </button>
          </div>

          {/* Form Content Container */}
          <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-8 border border-gray-100 min-h-[600px]">
            {renderActiveSection()}
          </div>
        </div>

        {/* Sidebar (Right 1 Column) */}
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