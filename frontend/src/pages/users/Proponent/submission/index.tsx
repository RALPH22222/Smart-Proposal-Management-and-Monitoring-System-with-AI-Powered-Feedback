import React, { useRef, useState, useCallback, useEffect } from "react";
import ProponentNavbar from "../../../../components/proponent-component/Proponent-navbar";
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
    programTitle: '', 
    projectTitle: '', 
    leaderGender: '', 
    agencyName: '',
    agencyAddress: '', 
    telephone: '',
    tags: '',
    email: '',
    cooperatingAgencies: '', 
    researchStation: '',
    classificationType: '',
    researchType: { basic: false, applied: false },
    developmentType: '',
    implementationMode: { singleAgency: false, multiAgency: false },
    priorityAreas: { stand: false, coconutIndustry: false, exportWinners: false, otherPriorityAreas: false, supportIndustries: false },
    sectorCommodity: '', 
    discipline: '', 
    duration: '', 
    plannedStartDate: '', 
    plannedEndDate: '', 
    budgetItems: [
      { id: 1, source: '', ps: 0, mooe: 0, co: 0, total: 0, isExpanded: false, year: '' },
    ],
  });

  const isFormComplete = useCallback(() => {
    const requiredFields = [
      formData.programTitle, formData.projectTitle, formData.leaderGender,
      formData.agencyName, formData.agencyAddress, formData.tags, 
      formData.email, formData.telephone, formData.plannedStartDate,
      formData.plannedEndDate, formData.duration
    ];
    
    const hasValidClassification = formData.classificationType !== '' && 
      ((formData.classificationType === 'research' && (formData.researchType.basic || formData.researchType.applied)) ||
       (formData.classificationType === 'development' && formData.developmentType !== ''));
    
    const hasImplementationMode = Object.values(formData.implementationMode).some(value => value);
    const hasPriorityArea = Object.values(formData.priorityAreas).some(value => value);
    const hasValidBudgetItems = formData.budgetItems.every(item => item.source.trim() !== '' && item.year !== '');
    
    return requiredFields.every(field => field.trim() !== '') && hasValidClassification && hasImplementationMode && hasPriorityArea && hasValidBudgetItems;
  }, [formData]);

  const handleButtonClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleSubmit = useCallback(() => {
    if (!selectedFile) return;
    alert('Research proposal submitted successfully!');
  }, [selectedFile, formData]);

  const handleAITemplateCheck = useCallback(async () => {
    if (!selectedFile) { alert('Please select a file first'); return; }
    setIsCheckingTemplate(true); setShowAIModal(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      const mockResult: AICheckResult = {
        isValid: Math.random() > 0.3, 
        issues: [
          'Missing executive summary section',
          'Budget justification needs more detail', 
          'References format inconsistent'
        ],
        suggestions: [
          'Add a 200-word executive summary highlighting key objectives',
          'Use APA 7th edition formatting for all references'
        ],
        score: Math.floor(Math.random() * 40) + 60, 
        type: 'template', 
        title: 'Document Template Analysis'
      };
      setAiCheckResult(mockResult);
    } catch (error) {
      console.error('AI check failed:', error); 
      alert('AI template check failed. Please try again.');
    } finally { setIsCheckingTemplate(false); }
  }, [selectedFile]);

  const handleAIFormCheck = useCallback(async () => {
    setIsCheckingForm(true); 
    setShowAIModal(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const issues: string[] = []; 
      const suggestions: string[] = [];
      
      if (!formData.programTitle || formData.programTitle.length < 10) {
        issues.push('Program title is too short or missing');
        suggestions.push('Make program title more descriptive');
      }
      if (!formData.projectTitle) issues.push('Project title is missing');
      if (!formData.agencyName) issues.push('Agency name missing');
      
      if (!formData.classificationType) {
        issues.push('No classification type selected');
        suggestions.push('Select Research or Development');
      }
      
      const totalBudget = formData.budgetItems.reduce((sum, item) => sum + item.total, 0);
      if (totalBudget === 0) {
        issues.push('Budget amounts not specified');
        suggestions.push('Add budget amounts');
      }
      
      const isValid = issues.length === 0;
      const score = Math.max(0, 100 - (issues.length * 15));
      
      const formCheckResult: AICheckResult = { 
        isValid, 
        issues, 
        suggestions, 
        score, 
        type: 'form', 
        title: 'Form Completion Analysis' 
      };
      
      setAiCheckResult(formCheckResult);
    } catch (error) {
      console.error('AI form check failed:', error); 
      alert('AI form check failed. Please try again.');
    } finally { setIsCheckingForm(false); }
  }, [formData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    if (name === 'classificationType') {
        setFormData(prev => ({ ...prev, classificationType: value as any, researchType: { basic: false, applied: false }, developmentType: '' }));
      } else if (name === 'researchType.basic') {
        setFormData(prev => ({ ...prev, researchType: { basic: true, applied: false } }));
      } else if (name === 'researchType.applied') {
        setFormData(prev => ({ ...prev, researchType: { basic: false, applied: true } }));
      } else if (name === 'developmentType') {
        setFormData(prev => ({ ...prev, developmentType: value as any }));
      } else if (name === 'implementationMode') {
         const val = value as any;
         setFormData(prev => ({ ...prev, implementationMode: val }));
      } else if (name.includes('.')) {
        const [parent, child] = name.split('.');
        setFormData(prev => ({ ...prev, [parent]: { ...prev[parent as keyof typeof prev] as any, [child]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value } }));
      } else {
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value }));
      }
  };

  const addBudgetItem = () => {
    const newItem: BudgetItem = { id: Date.now(), source: '', ps: 0, mooe: 0, co: 0, total: 0, isExpanded: false, year: years[0] || '' };
    setFormData(prev => ({ ...prev, budgetItems: [...prev.budgetItems, newItem] }));
  };
  const removeBudgetItem = (id: number) => setFormData(prev => ({ ...prev, budgetItems: prev.budgetItems.filter(item => item.id !== id) }));
  const updateBudgetItem = (id: number, field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev, budgetItems: prev.budgetItems.map(item => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          if (['ps', 'mooe', 'co'].includes(field)) updated.total = (Number(updated.ps)||0) + (Number(updated.mooe)||0) + (Number(updated.co)||0);
          return updated;
        }
        return item;
      })
    }));
  };
  const toggleExpand = (id: number) => setFormData(prev => ({ ...prev, budgetItems: prev.budgetItems.map(item => item.id === id ? { ...item, isExpanded: !item.isExpanded } : item) }));

  useEffect(() => {
    if (formData.plannedStartDate && formData.plannedEndDate) {
      const startYear = new Date(formData.plannedStartDate).getFullYear();
      const endYear = new Date(formData.plannedEndDate).getFullYear();
      const yearsArray = [];
      for (let year = startYear; year <= endYear; year++) yearsArray.push(year.toString());
      setYears(yearsArray);
    }
  }, [formData.plannedStartDate, formData.plannedEndDate]);

  const formSections = [
    { id: 'basic-info', label: 'Basic Info', icon: <FaFileAlt /> }, // Shortened label for better mobile fit
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
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900">
      <ProponentNavbar />
      
      <AIModal
        show={showAIModal}
        onClose={() => { setShowAIModal(false); setAiCheckResult(null); }}
        aiCheckResult={aiCheckResult}
        isChecking={isCheckingTemplate || isCheckingForm}
        checkType={isCheckingTemplate ? 'template' : 'form'}
      />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 lg:pb-8 pt-24">
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Main Form Content */}
          <div className="lg:col-span-3 flex flex-col gap-6">
            
            {/* Top Navigation Buttons (Fixed: Horizontal on Mobile) */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
              {formSections.map((section) => {
                const isActive = activeSection === section.id;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`
                      flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-3 
                      px-2 py-3 sm:px-6 sm:py-4 
                      rounded-xl sm:rounded-full 
                      font-bold text-[10px] sm:text-sm 
                      transition-all duration-300 shadow-sm border cursor-pointer
                      ${isActive 
                        ? 'bg-[#C8102E] text-white border-[#C8102E] shadow-md transform scale-105 z-10' 
                        : 'bg-white text-gray-600 hover:text-[#C8102E] hover:border-[#C8102E] border-gray-200 hover:shadow-md'
                      }
                    `}
                  >
                    <span className="text-base sm:text-lg">{section.icon}</span>
                    <span className="text-center">{section.label}</span>
                  </button>
                )
              })}
            </div>

            {/* Form Container */}
            <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-8 border border-gray-100 min-h-[600px]">
              {renderActiveSection()}
            </div>
          </div>

          {/* Upload Sidebar */}
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
      </main>
    </div>
  );
};

export default Submission;