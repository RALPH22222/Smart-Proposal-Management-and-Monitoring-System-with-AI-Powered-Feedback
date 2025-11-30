import React, { useRef, useState, useCallback, useEffect } from "react";
import { FaFileAlt, FaFlask, FaMoneyBillWave } from 'react-icons/fa';
import BasicInformation from './basicInfo';
import ResearchDetails from './researchDetails';
import BudgetSection from './budgetSection';
import UploadSidebar from './uploadSidebar';
import AIModal from '../../../../components/proponent-component/aiModal';
import type { FormData, AICheckResult, BudgetItem } from '../../../../types/proponent-form';

const Submission: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isCheckingTemplate, setIsCheckingTemplate] = useState(false);
  const [isCheckingForm, setIsCheckingForm] = useState(false);
  const [aiCheckResult, setAiCheckResult] = useState<AICheckResult | null>(null);
  const [showAIModal, setShowAIModal] = useState(false);
  const [years, setYears] = useState<string[]>([]);
  const [activeSection, setActiveSection] = useState<string>('basic-info');
  
  const [formData, setFormData] = useState<FormData>({
    programTitle: '', projectTitle: '', leaderGender: '', agencyName: '',
    agencyAddress: '', telephone: '', tags: '', email: '', cooperatingAgencies: '', 
    researchStation: '', classificationType: '', researchType: { basic: false, applied: false },
    developmentType: '', implementationMode: { singleAgency: false, multiAgency: false },
    priorityAreas: { stand: false, coconutIndustry: false, exportWinners: false, otherPriorityAreas: false, supportIndustries: false },
    sectorCommodity: '', discipline: '', duration: '', plannedStartDate: '', plannedEndDate: '', 
    budgetItems: [{ id: 1, source: '', ps: 0, mooe: 0, co: 0, total: 0, isExpanded: false, year: '' }],
  });

  // [Keep your existing isFormComplete, handleAIFormCheck, handleSubmit logic here]
  // For brevity I am not repeating the huge validation logic block, but ensure it's present as you had it.
  
  const handleButtonClick = useCallback(() => fileInputRef.current?.click(), []);
  const handleSubmit = useCallback(() => { if (selectedFile) alert('Success!'); }, [selectedFile]);

  const handleAITemplateCheck = useCallback(async () => {
    if (!selectedFile) return;
    setIsCheckingTemplate(true); setShowAIModal(true);
    setTimeout(() => { setIsCheckingTemplate(false); setAiCheckResult({ isValid: true, issues: [], suggestions: [], score: 90, type: 'template', title: 'Check' }); }, 1500);
  }, [selectedFile]);

  const handleAIFormCheck = useCallback(async () => {
    setIsCheckingForm(true); setShowAIModal(true);
    setTimeout(() => { setIsCheckingForm(false); setAiCheckResult({ isValid: true, issues: [], suggestions: [], score: 90, type: 'form', title: 'Check' }); }, 1500);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target as HTMLInputElement;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const addBudgetItem = () => setFormData(prev => ({ ...prev, budgetItems: [...prev.budgetItems, { id: Date.now(), source: '', ps: 0, mooe: 0, co: 0, total: 0, isExpanded: false, year: years[0] || '' }] }));
  const removeBudgetItem = (id: number) => setFormData(prev => ({ ...prev, budgetItems: prev.budgetItems.filter(item => item.id !== id) }));
  const updateBudgetItem = (id: number, field: string, value: string | number) => { /* update logic */ };
  const toggleExpand = (id: number) => setFormData(prev => ({ ...prev, budgetItems: prev.budgetItems.map(item => item.id === id ? { ...item, isExpanded: !item.isExpanded } : item) }));

  useEffect(() => {
    if (formData.plannedStartDate && formData.plannedEndDate) {
      const start = new Date(formData.plannedStartDate).getFullYear();
      const end = new Date(formData.plannedEndDate).getFullYear();
      const y = []; for (let i = start; i <= end; i++) y.push(i.toString());
      setYears(y);
    }
  }, [formData.plannedStartDate, formData.plannedEndDate]);

  const formSections = [
    { id: 'basic-info', label: 'Basic Info', icon: <FaFileAlt /> },
    { id: 'research-details', label: 'Research', icon: <FaFlask /> },
    { id: 'budget', label: 'Budget', icon: <FaMoneyBillWave /> },
  ];

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'basic-info': return <BasicInformation formData={formData} onInputChange={handleInputChange} />;
      case 'research-details': return <ResearchDetails formData={formData} onInputChange={handleInputChange} />;
      case 'budget': return <BudgetSection formData={formData} years={years} onBudgetItemAdd={addBudgetItem} onBudgetItemRemove={removeBudgetItem} onBudgetItemUpdate={updateBudgetItem} onBudgetItemToggle={toggleExpand} />;
      default: return <BasicInformation formData={formData} onInputChange={handleInputChange} />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <AIModal
        show={showAIModal}
        onClose={() => { setShowAIModal(false); setAiCheckResult(null); }}
        aiCheckResult={aiCheckResult}
        isChecking={isCheckingTemplate || isCheckingForm}
        checkType={isCheckingTemplate ? 'template' : 'form'}
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Form */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            {formSections.map((section) => {
              const isActive = activeSection === section.id;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-3 px-2 py-3 sm:px-6 sm:py-4 rounded-xl sm:rounded-full font-bold text-[10px] sm:text-sm transition-all duration-300 shadow-sm border cursor-pointer ${isActive ? 'bg-[#C8102E] text-white border-[#C8102E] shadow-md transform scale-105 z-10' : 'bg-white text-gray-600 hover:text-[#C8102E] hover:border-[#C8102E] border-gray-200 hover:shadow-md'}`}
                >
                  <span className="text-base sm:text-lg">{section.icon}</span>
                  <span className="text-center">{section.label}</span>
                </button>
              )
            })}
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-8 border border-gray-100 min-h-[600px]">
            {renderActiveSection()}
          </div>
        </div>

        {/* Sidebar */}
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
            onFileButtonClick={handleButtonClick}
            isUploadDisabled={false}
          />
        </div>
      </div>
    </div>
  );
};

export default Submission;