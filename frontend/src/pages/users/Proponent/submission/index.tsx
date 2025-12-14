import React, { useRef, useState, useCallback, useEffect } from "react";
import { FaFileAlt, FaFlask, FaMoneyBillWave } from 'react-icons/fa';

// Component Imports
import BasicInformation from './basicInfo';
import ResearchDetails from './researchDetails';
import BudgetSection from './budgetSection';
import UploadSidebar from './uploadSidebar';
import AIModal from '../../../../components/proponent-component/aiModal';

// Type Imports
import type { FormData, AICheckResult } from '../../../../types/proponent-form';

// --- IMPORTANT: Import the Frontend API Service ---
import { submitProposal } from '../../../../services/proposal.api'; 

const Submission: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);  
  // State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false); // Loading state for submission
  
  // AI Modal State
  const [isCheckingTemplate, setIsCheckingTemplate] = useState(false);
  const [isCheckingForm, setIsCheckingForm] = useState(false);
  const [aiCheckResult, setAiCheckResult] = useState<AICheckResult | null>(null);
  const [showAIModal, setShowAIModal] = useState(false);

  // Form Data State
  const [years, setYears] = useState<string[]>([]);
  const [activeSection, setActiveSection] = useState<string>('basic-info');
  
  const [formData, setFormData] = useState<FormData>({
    programTitle: '', 
    projectTitle: '', 
    leaderGender: '', 
    agencyName: '',
    agencyStreet: '', 
    agencyBarangay: '',
    agencyCity: '',
    telephone: '', 
    tags: '', 
    email: '', 
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
    plannedStartDate: '', 
    plannedEndDate: '', 
    budgetItems: [{ id: 1, source: '', ps: 0, mooe: 0, co: 0, total: 0, isExpanded: false, year: '' }],
  });

  // --- Handlers ---

  const handleButtonClick = useCallback(() => fileInputRef.current?.click(), []);

  // --- NEW: Budget Validation Logic ---
  const checkBudgetValidity = useCallback(() => {
    // 1. Check if there is at least one budget item
    if (formData.budgetItems.length === 0) return false;

    // 2. Check if every budget item is complete (Source must be present AND at least one cost must be > 0)
    return formData.budgetItems.every(item => {
      const sourceValid = item.source?.trim() !== '';
      
      // Check if at least one cost field (PS, MOOE, CO) has a non-zero value
      const costsValid = (Number(item.ps) || 0) > 0 || (Number(item.mooe) || 0) > 0 || (Number(item.co) || 0) > 0;

      return sourceValid && costsValid;
    });
  }, [formData.budgetItems]);

  const isBudgetValid = checkBudgetValidity(); // Calculate budget validity status

  // --- NEW: Helper for Direct Updates (Dropdowns/Arrays) ---
  const handleDirectUpdate = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target as HTMLInputElement;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // --- SUBMISSION LOGIC ---
  const handleSubmit = useCallback(async () => {
    // 1. Basic Validation
    if (!selectedFile) {
      alert("Please upload a proposal file (PDF/Word).");
      return;
    }
    if (!formData.projectTitle) {
      alert("Project Title is required.");
      return;
    }

    try {
      setIsSubmitting(true);
      
      // TODO: Replace this with the real user ID from your Authentication Context if not handled in API
      const currentUserId = "REPLACE_WITH_REAL_UUID_FROM_AUTH"; 

      // 2. Call the Frontend Service
      const result = await submitProposal(formData, selectedFile, currentUserId);

      // 3. Success Feedback
      alert("Proposal submitted successfully!");
      console.log("Server Response:", result);
      
      // Optional: Redirect user or clear form here

    } catch (error: any) {
      console.error("Submission Error:", error);
      alert(`Submission Failed: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, selectedFile]);

  // --- AI Checks (Mocked) ---
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

  // --- Budget Logic ---
  const addBudgetItem = () => setFormData(prev => ({ ...prev, budgetItems: [...prev.budgetItems, { id: Date.now(), source: '', ps: 0, mooe: 0, co: 0, total: 0, isExpanded: false, year: years[0] || '' }] }));
  
  const removeBudgetItem = (id: number) => setFormData(prev => ({ ...prev, budgetItems: prev.budgetItems.filter(item => item.id !== id) }));

  const updateBudgetItem = (id: number, field: string, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      budgetItems: prev.budgetItems.map((item) => {
        if (item.id === id) {
          // 1. Update the specific field (keep as string to allow typing "1.")
          const updatedItem = { ...item, [field]: value };
          // 2. Recalculate total
          const ps = Number(updatedItem.ps) || 0;
          const mooe = Number(updatedItem.mooe) || 0;
          const co = Number(updatedItem.co) || 0;
          
          updatedItem.total = ps + mooe + co;

          return updatedItem;
        }
        return item;
      }),
    }));
  };

  const toggleExpand = (id: number) => setFormData(prev => ({ ...prev, budgetItems: prev.budgetItems.map(item => item.id === id ? { ...item, isExpanded: !item.isExpanded } : item) }));

  // --- Effects ---
  useEffect(() => {
    if (formData.plannedStartDate && formData.plannedEndDate) {
      const start = new Date(formData.plannedStartDate).getFullYear();
      const end = new Date(formData.plannedEndDate).getFullYear();
      const y = []; for (let i = start; i <= end; i++) y.push(i.toString());
      setYears(y);
    }
  }, [formData.plannedStartDate, formData.plannedEndDate]);

  // --- Render Logic ---
  const formSections = [
    { id: 'basic-info', label: 'Basic Info', icon: <FaFileAlt /> },
    { id: 'research-details', label: 'Research', icon: <FaFlask /> },
    { id: 'budget', label: 'Budget', icon: <FaMoneyBillWave /> },
  ];

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'basic-info': 
        return (
          <BasicInformation 
            formData={formData} 
            onInputChange={handleInputChange} 
            onUpdate={handleDirectUpdate}
          />
        );
      case 'research-details': return <ResearchDetails formData={formData} onInputChange={handleInputChange} onUpdate={handleDirectUpdate}/>;
      case 'budget': return <BudgetSection formData={formData} years={years} onBudgetItemAdd={addBudgetItem} onBudgetItemRemove={removeBudgetItem} onBudgetItemUpdate={updateBudgetItem} onBudgetItemToggle={toggleExpand} />;
      default: return (
        <BasicInformation 
          formData={formData} 
          onInputChange={handleInputChange}
          onUpdate={handleDirectUpdate}
        />
      );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* AI Modal */}
      <AIModal
        show={showAIModal}
        onClose={() => { setShowAIModal(false); setAiCheckResult(null); }}
        aiCheckResult={aiCheckResult}
        isChecking={isCheckingTemplate || isCheckingForm}
        checkType={isCheckingTemplate ? 'template' : 'form'}
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Content Area */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          {/* Navigation Tabs */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            {formSections.map((section) => {
              const isActive = activeSection === section.id;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-3 px-2 py-3 sm:px-6 sm:py-4 rounded-xl sm:rounded-full font-bold text-[10px] sm:text-sm transition-all duration-300 shadow-sm border cursor-pointer ${
                    isActive 
                      ? 'bg-[#C8102E] text-white border-[#C8102E] shadow-md transform scale-105 z-10' 
                      : 'bg-white text-gray-600 hover:text-[#C8102E] hover:border-[#C8102E] border-gray-200 hover:shadow-md'
                  }`}
                >
                  <span className="text-base sm:text-lg">{section.icon}</span>
                  <span className="text-center">{section.label}</span>
                </button>
              )
            })}
          </div>

          {/* Active Section Form */}
          <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-8 border border-gray-100 min-h-[600px]">
            {renderActiveSection()}
          </div>
        </div>

        {/* Sidebar (File Upload & Actions) */}
        <div className="lg:col-span-1">
          <UploadSidebar
            formData={formData}
            selectedFile={selectedFile}
            isCheckingTemplate={isCheckingTemplate}
            isCheckingForm={isCheckingForm}
            onAIFormCheck={handleAIFormCheck}
            onFileSelect={setSelectedFile}
            onAITemplateCheck={handleAITemplateCheck}
            onSubmit={handleSubmit}
            isUploadDisabled={isSubmitting} // Disable button while loading
            isBudgetValid={isBudgetValid} // Pass budget status
          />
        </div>
        
      </div>
    </div>
  );
};

export default Submission;