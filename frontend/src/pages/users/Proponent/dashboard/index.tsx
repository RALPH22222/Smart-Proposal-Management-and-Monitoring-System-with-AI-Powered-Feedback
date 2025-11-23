import React, { useRef, useState, useCallback, useEffect } from "react";
import ProponentNavbar from "../../../../components/proponent-component/Proponent-navbar";
import { FaFileAlt, FaFlask, FaMoneyBillWave, FaRobot, FaSpinner } from 'react-icons/fa';
import BasicInformation from './basicInfo';
import ResearchDetails from './researchDetails';
import BudgetSection from './budgetSection';
import UploadSidebar from './uploadSidebar';
import AIModal from '../../../../components/proponent-component/aiModal';
import type { FormData, AICheckResult, BudgetItem } from '../../../../types/proponent-form';

const Dashboard: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isCheckingTemplate, setIsCheckingTemplate] = useState(false);
  const [isCheckingForm, setIsCheckingForm] = useState(false);
  const [aiCheckResult, setAiCheckResult] = useState<AICheckResult | null>(null);
  const [showAIModal, setShowAIModal] = useState(false);
  const [years, setYears] = useState<string[]>([]);
  const [activeSection, setActiveSection] = useState<string>('basic-info');
  
  const [formData, setFormData] = useState<FormData>({
    programTitle: '', projectTitle: '', leaderGender: '', agencyAddress: '', 
    telephoneFaxEmail: '', cooperatingAgencies: '', researchStation: '',
    researchType: { basic: false, applied: false, development: false, 
      pilotTesting: false, techPromotion: false },
    implementationMode: { singleAgency: false, multiAgency: false },
    priorityAreas: { stand: false, coconutIndustry: false, exportWinners: false, 
      otherPriorityAreas: false, supportIndustries: false },
    sectorCommodity: '', discipline: '', duration: '', plannedStartDate: '', 
    plannedEndDate: '', budgetItems: [
      { id: 1, source: '', mooe: 0, co: 0, total: 0, isExpanded: false, year: '' },
    ],
  });

  const isFormComplete = useCallback(() => {
    const requiredFields = [formData.programTitle, formData.projectTitle, formData.leaderGender,
      formData.agencyAddress, formData.telephoneFaxEmail, formData.plannedStartDate,
      formData.plannedEndDate, formData.duration];
    const hasResearchType = Object.values(formData.researchType).some(value => value);
    const hasImplementationMode = Object.values(formData.implementationMode).some(value => value);
    const hasPriorityArea = Object.values(formData.priorityAreas).some(value => value);
    const hasValidBudgetItems = formData.budgetItems.every(item => 
      item.source.trim() !== '' && item.year !== ''
    );
    return requiredFields.every(field => field.trim() !== '') && hasResearchType && 
           hasImplementationMode && hasPriorityArea && hasValidBudgetItems;
  }, [formData]);

  const handleButtonClick = useCallback(() => {
    if (isFormComplete()) fileInputRef.current?.click();
  }, [isFormComplete]);

  const handleSubmit = useCallback(() => {
    if (!selectedFile || !isFormComplete()) return;
    console.log('Submitting file:', selectedFile.name);
    console.log('Form data:', formData);
    alert('Research proposal submitted successfully!');
  }, [selectedFile, formData, isFormComplete]);

  const handleAITemplateCheck = useCallback(async () => {
    if (!selectedFile) { alert('Please select a file first'); return; }
    setIsCheckingTemplate(true); setShowAIModal(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      const mockResult: AICheckResult = {
        isValid: Math.random() > 0.3, issues: ['Missing executive summary section',
          'Budget justification needs more detail', 'References format inconsistent',
          'Methodology section could be more detailed', 'Timeline visualization missing'],
        suggestions: ['Add a 200-word executive summary highlighting key objectives',
          'Include detailed budget breakdown per quarter with justifications',
          'Use APA 7th edition formatting for all references',
          'Expand methodology to include data collection procedures',
          'Add a Gantt chart for better timeline visualization'],
        score: Math.floor(Math.random() * 40) + 60, type: 'template', title: 'Document Template Analysis'
      };
      setAiCheckResult(mockResult);
    } catch (error) {
      console.error('AI check failed:', error); alert('AI template check failed. Please try again.');
    } finally { setIsCheckingTemplate(false); }
  }, [selectedFile]);

  const handleAIFormCheck = useCallback(async () => {
    setIsCheckingForm(true); setShowAIModal(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      const issues: string[] = []; const suggestions: string[] = [];
      if (!formData.programTitle || formData.programTitle.length < 10) {
        issues.push('Program title is too short or missing');
        suggestions.push('Make program title more descriptive (minimum 10 characters)');
      }
      if (!formData.projectTitle || formData.projectTitle.length < 10) {
        issues.push('Project title is too short or missing');
        suggestions.push('Ensure project title clearly describes the research focus');
      }
      if (!formData.plannedStartDate || !formData.plannedEndDate) {
        issues.push('Project timeline not fully defined');
        suggestions.push('Set clear start and end dates for the research period');
      }
      if (!formData.agencyAddress) {
        issues.push('Agency address missing');
        suggestions.push('Provide complete agency address for correspondence');
      }
      const selectedResearchTypes = Object.values(formData.researchType).filter(v => v).length;
      if (selectedResearchTypes === 0) {
        issues.push('No research classification selected');
        suggestions.push('Select at least one research classification type');
      }
      if (selectedResearchTypes > 2) {
        issues.push('Too many research classifications selected');
        suggestions.push('Focus on 1-2 primary research classifications for clarity');
      }
      const selectedPriorityAreas = Object.values(formData.priorityAreas).filter(v => v).length;
      if (selectedPriorityAreas === 0) {
        issues.push('No priority areas selected');
        suggestions.push('Select relevant priority areas for better alignment');
      }
      const totalBudget = formData.budgetItems.reduce((sum, item) => sum + item.total, 0);
      if (totalBudget === 0) {
        issues.push('Budget amounts not specified');
        suggestions.push('Add budget amounts for MOOE and CO categories');
      }
      if (formData.budgetItems.some(item => !item.source)) {
        issues.push('Some budget items missing funding source');
        suggestions.push('Specify funding source for all budget items');
      }
      if (formData.budgetItems.some(item => !item.year)) {
        issues.push('Some budget items missing year allocation');
        suggestions.push('Assign year for all budget items');
      }
      const isValid = issues.length === 0;
      const score = Math.max(0, 100 - (issues.length * 15));
      const formCheckResult: AICheckResult = { isValid, issues, suggestions, score, 
        type: 'form', title: 'Form Completion Analysis' };
      setAiCheckResult(formCheckResult);
    } catch (error) {
      console.error('AI form check failed:', error); alert('AI form check failed. Please try again.');
    } finally { setIsCheckingForm(false); }
  }, [formData, activeSection]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev, [parent]: { ...prev[parent as keyof typeof prev] as Record<string, unknown>, 
          [child]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? 
        (e.target as HTMLInputElement).checked : value }));
    }
  };

  const addBudgetItem = () => {
    const newItem: BudgetItem = { id: formData.budgetItems.length + 1, source: '', mooe: 0, 
      co: 0, total: 0, isExpanded: false, year: years[0] || '' };
    setFormData(prev => ({ ...prev, budgetItems: [...prev.budgetItems, newItem] }));
  };

  const removeBudgetItem = (id: number) => {
    if (formData.budgetItems.length > 1) {
      setFormData(prev => ({ ...prev, budgetItems: prev.budgetItems.filter(item => item.id !== id) }));
    }
  };

  const updateBudgetItem = (id: number, field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev, budgetItems: prev.budgetItems.map(item => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value };
          if (field === 'mooe' || field === 'co') {
            updatedItem.total = (Number(updatedItem.mooe) || 0) + (Number(updatedItem.co) || 0);
          }
          return updatedItem;
        }
        return item;
      })
    }));
  };

  const toggleExpand = (id: number) => {
    setFormData(prev => ({
      ...prev, budgetItems: prev.budgetItems.map(item => 
        item.id === id ? { ...item, isExpanded: !item.isExpanded } : item
      )
    }));
  };

  useEffect(() => {
    if (formData.plannedStartDate && formData.plannedEndDate) {
      const startYear = new Date(formData.plannedStartDate).getFullYear();
      const endYear = new Date(formData.plannedEndDate).getFullYear();
      const yearsArray: string[] = [];
      for (let year = startYear; year <= endYear; year++) yearsArray.push(year.toString());
      setYears(yearsArray);
      if (yearsArray.length > 0) {
        setFormData(prev => ({
          ...prev, budgetItems: prev.budgetItems.map(item => ({ ...item, year: yearsArray[0] }))
        }));
      }
    }
  }, [formData.plannedStartDate, formData.plannedEndDate]);

  const isUploadDisabled = !isFormComplete();
  const formSections = [
    { id: 'basic-info', label: 'Basic Information', icon: <FaFileAlt className="w-4 h-4" /> },
    { id: 'research-details', label: 'Research Details', icon: <FaFlask className="w-4 h-4" /> },
    { id: 'budget', label: 'Budget', icon: <FaMoneyBillWave className="w-4 h-4" /> },
  ];

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'basic-info':
        return <BasicInformation formData={formData} onInputChange={handleInputChange} />;
      case 'research-details':
        return <ResearchDetails formData={formData} onInputChange={handleInputChange} />;
      case 'budget':
        return (
          <BudgetSection
            formData={formData}
            years={years}
            onBudgetItemAdd={addBudgetItem}
            onBudgetItemRemove={removeBudgetItem}
            onBudgetItemUpdate={updateBudgetItem}
            onBudgetItemToggle={toggleExpand}
          />
        );
      default:
        return <BasicInformation formData={formData} onInputChange={handleInputChange} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900 mt-4">
      <ProponentNavbar />
      
      <AIModal
        show={showAIModal}
        onClose={() => { setShowAIModal(false); setAiCheckResult(null); }}
        aiCheckResult={aiCheckResult}
        isChecking={isCheckingTemplate || isCheckingForm}
        checkType={isCheckingTemplate ? 'template' : 'form'}
      />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 lg:pb-8 mt-16">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <div className="xl:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm p-6 sticky top-24 border border-gray-100">
              <h3 className="font-bold text-gray-800 mb-6 text-lg flex items-center gap-2">
                <FaFileAlt className="text-[#C8102E]" />Research Proposal
              </h3>
              <nav className="space-y-3">
                {formSections.map((section) => (
                  <button 
                    key={section.id} 
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 flex items-center space-x-3 group ${
                      activeSection === section.id 
                        ? 'bg-gradient-to-r from-[#C8102E] to-[#E03A52] text-white shadow-lg' 
                        : 'text-gray-600 hover:bg-gray-50 hover:shadow-md border border-transparent hover:border-gray-200'
                    }`}
                  >
                    <div className={`transition-transform duration-200 ${activeSection === section.id ? 'scale-110' : 'group-hover:scale-105'}`}>
                      {section.icon}
                    </div>
                    <span className="font-semibold">{section.label}</span>
                  </button>
                ))}
              </nav>
              
              {/* Completion Status */}
              <div className="mt-8 p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-gray-700">Completion Status</span>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                    isFormComplete() ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                  }`}>
                    {isFormComplete() ? 'Ready to Upload' : 'In Progress'}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                  <div 
                    className={`h-3 rounded-full transition-all duration-500 ease-out ${
                      isFormComplete() ? 'bg-green-500' : 'bg-orange-500'
                    }`} 
                    style={{ width: isFormComplete() ? '100%' : '65%' }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 text-center">
                  {isFormComplete() ? 'All requirements completed!' : 'Complete all sections to enable upload'}
                </p>
              </div>

          {/* AI Assistant Button Wrapper */}
          <div className="relative group w-full mt-6 rounded-xl overflow-hidden p-[2px]">
          
            {!isCheckingForm && (
              <div className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2E8F0_0%,#393BB2_50%,#E2E8F0_100%)]" 
                   style={{ backgroundImage: 'conic-gradient(from 90deg at 50% 50%, #313deaff 40%, #efefefff 60%, #f51111 100%)' }} 
              />
            )}
    
            <button
              onClick={handleAIFormCheck}
              disabled={isCheckingForm}
              className={`relative h-full w-full py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                isCheckingForm 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-red-600 to-blue-800 hover:from-red-500 hover:to-blue-700 text-white'
              }`}
            >
              {isCheckingForm ? (
                <>
                  <FaSpinner className="w-4 h-4 animate-spin" />
                  Analyzing Form...
                </>
              ) : (
                <>
                  <FaRobot className="w-4 h-4" />
                  AI Form Assistant
                </>
              )}
            </button>
          </div>
            </div>
          </div>

          {/* Main Form Content */}
          <div className="xl:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm p-6 lg:p-8 border border-gray-100">
              {renderActiveSection()}
            </div>
          </div>

          {/* Upload Sidebar */}
          <div className="xl:col-span-1">
            <UploadSidebar
              formData={formData}
              selectedFile={selectedFile}
              isFormComplete={isFormComplete()}
              isCheckingTemplate={isCheckingTemplate}
              onFileSelect={setSelectedFile}
              onAITemplateCheck={handleAITemplateCheck}
              onSubmit={handleSubmit}
              onFileButtonClick={handleButtonClick}
              isUploadDisabled={isUploadDisabled}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;