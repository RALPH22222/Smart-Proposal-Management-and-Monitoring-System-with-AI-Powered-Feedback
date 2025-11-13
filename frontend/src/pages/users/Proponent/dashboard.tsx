import React, { useRef, useState, useCallback, useEffect } from "react";
import ProponentNavbar from "../../../components/Proponent-navbar";
import { 
  FaFileAlt, FaFlask, FaMoneyBillWave, FaUpload, FaCheck, FaCircle,
  FaArrowUp, FaArrowDown, FaTimes, FaCalendarAlt, FaMapMarkerAlt,
  FaPhone, FaUniversity, FaCog, FaStar, FaTag, FaGraduationCap,
  FaPlus, FaTrash, FaRobot, FaMagic, FaExclamationTriangle, FaSpinner
} from 'react-icons/fa';

interface BudgetItem {
  id: number; source: string; mooe: number; co: number; total: number; 
  isExpanded: boolean; year: string;
}

interface FormData {
  programTitle: string; projectTitle: string; leaderGender: string; 
  agencyAddress: string; telephoneFaxEmail: string; cooperatingAgencies: string; 
  researchStation: string;
  researchType: { basic: boolean; applied: boolean; development: boolean; 
    pilotTesting: boolean; techPromotion: boolean };
  implementationMode: { singleAgency: boolean; multiAgency: boolean };
  priorityAreas: { stand: boolean; coconutIndustry: boolean; exportWinners: boolean; 
    otherPriorityAreas: boolean; supportIndustries: boolean };
  sectorCommodity: string; discipline: string; duration: string;
  plannedStartDate: string; plannedEndDate: string; budgetItems: BudgetItem[];
}

interface AICheckResult {
  isValid: boolean; issues: string[]; suggestions: string[]; 
  score: number; type: 'template' | 'form'; title: string;
}

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

  const calculateTotal = (field: 'mooe' | 'co' | 'total') => {
    return formData.budgetItems.reduce((sum, item) => sum + (Number(item[field]) || 0), 0);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', 
      minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
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

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900">
      <ProponentNavbar />
      
      {showAIModal && (
        <div className="fixed inset-0 bg-black bg-opacity-2 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-red-500 to-red-700 rounded-lg">
                    <FaRobot className="text-white text-xl" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">{aiCheckResult?.title || 'AI Analysis'}</h2>
                    <p className="text-gray-600 text-sm">
                      {aiCheckResult?.type === 'form' ? 'Form completion insights and recommendations' : 'Document template analysis and suggestions'}
                    </p>
                  </div>
                </div>
                <button onClick={() => { setShowAIModal(false); setAiCheckResult(null); }} 
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <FaTimes className="text-gray-400 hover:text-gray-600" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {!aiCheckResult ? (
                <div className="text-center py-12">
                  <FaSpinner className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
                  <p className="text-gray-600 font-medium">AI is analyzing your {isCheckingForm ? 'form' : 'document'}...</p>
                  <p className="text-gray-500 text-sm mt-2">This may take a few moments</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className={`p-4 rounded-xl border-2 ${aiCheckResult.isValid ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${aiCheckResult.isValid ? 'bg-green-100' : 'bg-orange-100'}`}>
                          {aiCheckResult.isValid ? <FaCheck className="text-green-600 text-xl" /> : <FaExclamationTriangle className="text-orange-600 text-xl" />}
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-800 text-lg">{aiCheckResult.isValid ? 'All Set!' : 'Needs Improvement'}</h3>
                          <p className="text-gray-600 text-sm">
                            {aiCheckResult.isValid ? 'Your ' + (aiCheckResult.type === 'form' ? 'form looks great!' : 'template meets requirements!') : 'Some areas need attention before submission'}
                          </p>
                        </div>
                      </div>
                      <div className={`px-4 py-2 rounded-full text-lg font-bold ${
                        aiCheckResult.score >= 80 ? 'bg-green-100 text-green-700' : aiCheckResult.score >= 60 ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'
                      }`}>{aiCheckResult.score}%</div>
                    </div>
                  </div>

                  {aiCheckResult.issues.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2"><FaExclamationTriangle className="text-orange-500 text-lg" /><h3 className="font-bold text-gray-800 text-lg">Areas for Improvement</h3></div>
                      <div className="bg-orange-50 rounded-xl p-4 border border-orange-200">
                        <ul className="space-y-3">{aiCheckResult.issues.map((issue, index) => (
                          <li key={index} className="flex items-start gap-3"><div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div><span className="text-gray-700">{issue}</span></li>
                        ))}</ul>
                      </div>
                    </div>
                  )}

                  {aiCheckResult.suggestions.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2"><FaMagic className="text-blue-500 text-lg" /><h3 className="font-bold text-gray-800 text-lg">AI Recommendations</h3></div>
                      <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                        <ul className="space-y-3">{aiCheckResult.suggestions.map((suggestion, index) => (
                          <li key={index} className="flex items-start gap-3"><div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div><span className="text-gray-700">{suggestion}</span></li>
                        ))}</ul>
                      </div>
                    </div>
                  )}

                  {aiCheckResult.isValid && aiCheckResult.issues.length === 0 && (
                    <div className="text-center py-6">
                      <FaCheck className="w-12 h-12 text-green-500 mx-auto mb-4" />
                      <h3 className="text-xl font-bold text-green-700 mb-2">Excellent!</h3>
                      <p className="text-gray-600">Your {aiCheckResult.type === 'form' ? 'form is complete' : 'document template meets all requirements'} and is ready for submission.</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex gap-3">
                <button onClick={() => { setShowAIModal(false); setAiCheckResult(null); }} 
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-100 transition-colors">Close</button>
                {aiCheckResult && !aiCheckResult.isValid && (
                  <button onClick={() => setShowAIModal(false)}
                    className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors">Review Issues</button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 max-w-7xl mx-auto px-4 lg:px-6 py-4 pb-24 lg:pb-8 mt-16">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          <div className="xl:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm p-6 sticky top-24 border border-gray-100">
              <h3 className="font-bold text-gray-800 mb-6 text-lg flex items-center gap-2"><FaFileAlt className="text-[#C8102E]" />Research Proposal</h3>
              <nav className="space-y-3">{formSections.map((section) => (
                <button key={section.id} onClick={() => setActiveSection(section.id)}
                  className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 flex items-center space-x-3 group ${
                    activeSection === section.id ? 'bg-gradient-to-r from-[#C8102E] to-[#E03A52] text-white shadow-lg' : 'text-gray-600 hover:bg-gray-50 hover:shadow-md border border-transparent hover:border-gray-200'
                  }`}>
                  <div className={`transition-transform duration-200 ${activeSection === section.id ? 'scale-110' : 'group-hover:scale-105'}`}>{section.icon}</div>
                  <span className="font-semibold">{section.label}</span>
                </button>
              ))}</nav>
              
              <div className="mt-8 p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-gray-700">Completion Status</span>
                  <span className={`text-sm font-bold px-2 py-1 rounded-full ${isFormComplete() ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                    {isFormComplete() ? 'Ready to Upload' : 'In Progress'}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                  <div className={`h-3 rounded-full transition-all duration-500 ease-out ${isFormComplete() ? 'bg-green-500' : 'bg-orange-500'}`} 
                    style={{ width: isFormComplete() ? '100%' : '65%' }}></div>
                </div>
                <p className="text-xs text-gray-500 text-center">{isFormComplete() ? 'All requirements completed!' : 'Complete all sections to enable upload'}</p>
              </div>

              <button onClick={handleAIFormCheck} disabled={isCheckingForm}
                className={`w-full mt-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                  isCheckingForm ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900 text-white shadow-lg hover:shadow-xs'
                }`}>
                {isCheckingForm ? <><FaSpinner className="w-4 h-4 animate-spin" />Analyzing Form...</> : <><FaRobot className="w-4 h-4" />AI Form Assistant</>}
              </button>
            </div>
          </div>

          <div className="xl:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm p-6 lg:p-8 border border-gray-100">
              {activeSection === 'basic-info' && (
                <div className="space-y-8">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg"><FaFileAlt className="text-[#C8102E] text-xl" /></div>Basic Information
                    </h2>
                    <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>Required
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1"><label className="block text-sm font-semibold text-gray-700">Program Title *</label>
                      <input type="text" name="programTitle" value={formData.programTitle} onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-transparent transition-all duration-200" placeholder="Enter program title" />
                    </div>
                    <div className="space-y-1"><label className="block text-sm font-semibold text-gray-700">Project Title *</label>
                      <input type="text" name="projectTitle" value={formData.projectTitle} onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-transparent transition-all duration-200" placeholder="Enter project title" />
                    </div>
                    <div className="space-y-1"><label className="block text-sm font-semibold text-gray-700">Select Sex *</label>
                      <select name="leaderGender" value={formData.leaderGender} onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-transparent transition-all duration-200">
                        <option value="">Select Sex</option><option value="male">Male</option><option value="female">Female</option>
                      </select>
                    </div>
                    <div className="space-y-1"><label className="block text-sm font-semibold text-gray-700">Duration (months) *</label>
                      <input type="number" name="duration" value={formData.duration} onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-transparent transition-all duration-200" placeholder="Enter duration" />
                    </div>
                    <div className="md:col-span-2 space-y-1">
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700"><FaMapMarkerAlt className="text-gray-400" />Agency Address *</label>
                      <input type="text" name="agencyAddress" value={formData.agencyAddress} onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-transparent transition-all duration-200" placeholder="Enter agency address" />
                    </div>
                    <div className="md:col-span-2 space-y-1">
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700"><FaPhone className="text-gray-400" />Telephone/Fax/Email *</label>
                      <input type="text" name="telephoneFaxEmail" value={formData.telephoneFaxEmail} onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-transparent transition-all duration-200" placeholder="Enter contact information" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700"><FaCalendarAlt className="text-gray-400" />Planned Start Date *</label>
                      <input type="date" name="plannedStartDate" value={formData.plannedStartDate} onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-transparent transition-all duration-200" />
                    </div>
                    <div className="space-y-1">
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700"><FaCalendarAlt className="text-gray-400" />Planned End Date *</label>
                      <input type="date" name="plannedEndDate" value={formData.plannedEndDate} onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-transparent transition-all duration-200" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700"><FaUniversity className="text-gray-400" />Cooperating Agencies</label>
                    <textarea name="cooperatingAgencies" value={formData.cooperatingAgencies} onChange={handleInputChange} rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-transparent transition-all duration-200" placeholder="List cooperating agencies..." />
                  </div>
                </div>
              )}

              {activeSection === 'research-details' && (
                <div className="space-y-8">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                      <div className="p-2 bg-purple-100 rounded-lg"><FaFlask className="text-[#C8102E] text-xl" /></div>Research Details
                    </h2>
                    <div className="flex items-center gap-2 text-sm text-blue-600 font-medium">
                      <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>Required
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700"><FaUniversity className="text-gray-400" />Research & Development Station</label>
                    <input type="text" name="researchStation" value={formData.researchStation} onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-transparent transition-all duration-200" placeholder="Enter research station" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700"><FaTag className="text-gray-400" />Sector/Commodity</label>
                      <input type="text" name="sectorCommodity" value={formData.sectorCommodity} onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-transparent transition-all duration-200" placeholder="Enter sector/commodity" />
                    </div>
                    <div className="space-y-1">
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700"><FaGraduationCap className="text-gray-400" />Discipline</label>
                      <input type="text" name="discipline" value={formData.discipline} onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-transparent transition-all duration-200" placeholder="Enter discipline" />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700"><FaCog className="text-gray-400" />Research Classification *</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {Object.entries(formData.researchType).map(([key, value]) => (
                        <div key={key} className="flex items-center p-3 border border-gray-200 rounded-xl hover:border-[#C8102E] transition-colors duration-200">
                          <input type="checkbox" id={`researchType.${key}`} name={`researchType.${key}`} checked={value} onChange={handleInputChange}
                            className="h-5 w-5 text-[#C8102E] focus:ring-[#C8102E] border-gray-300 rounded" />
                          <label htmlFor={`researchType.${key}`} className="ml-3 text-sm font-medium text-gray-700 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700"><FaCog className="text-gray-400" />Mode of Implementation *</label>
                    <div className="flex gap-6">{Object.entries(formData.implementationMode).map(([key, value]) => (
                      <div key={key} className="flex items-center p-3 border border-gray-200 rounded-xl hover:border-[#C8102E] transition-colors duration-200">
                        <input type="checkbox" id={`implementationMode.${key}`} name={`implementationMode.${key}`} checked={value} onChange={handleInputChange}
                          className="h-5 w-5 text-[#C8102E] focus:ring-[#C8102E] border-gray-300 rounded" />
                        <label htmlFor={`implementationMode.${key}`} className="ml-3 text-sm font-medium text-gray-700 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</label>
                      </div>
                    ))}</div>
                  </div>

                  <div className="space-y-4">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700"><FaStar className="text-gray-400" />Priority Areas *</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{Object.entries(formData.priorityAreas).map(([key, value]) => (
                      <div key={key} className="flex items-center p-3 border border-gray-200 rounded-xl hover:border-[#C8102E] transition-colors duration-200">
                        <input type="checkbox" id={`priorityAreas.${key}`} name={`priorityAreas.${key}`} checked={value} onChange={handleInputChange}
                          className="h-5 w-5 text-[#C8102E] focus:ring-[#C8102E] border-gray-300 rounded" />
                        <label htmlFor={`priorityAreas.${key}`} className="ml-3 text-sm font-medium text-gray-700 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</label>
                      </div>
                    ))}</div>
                  </div>
                </div>
              )}

              {activeSection === 'budget' && (
                <div className="space-y-8">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg"><FaMoneyBillWave className="text-[#C8102E] text-xl" /></div>Budget Requirements
                    </h2>
                    <div className="flex items-center gap-2 text-sm text-purple-600 font-medium">
                      <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></div>Required
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
                    <div><p className="text-sm font-semibold text-blue-800">Add budget items for each funding source</p>
                      <p className="text-xs text-blue-600 mt-1">Ensure all budget items have valid sources and years</p></div>
                    <button type="button" onClick={addBudgetItem}
                      className="px-6 py-3 text-base font-medium text-white rounded-xl hover:bg-[#9d0d24] transition-all duration-200 flex items-center gap-2 whitespace-nowrap shadow-lg hover:shadow-xl transform hover:scale-105"
                      style={{ backgroundColor: '#C8102E' }}><FaPlus className="w-4 h-4" />Add Budget Item</button>
                  </div>

                  <div className="hidden lg:block overflow-x-auto border border-gray-200 rounded-2xl bg-white shadow-sm">
                    <table className="w-full divide-y divide-gray-200">
                      <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                        <tr>
                          <th className="px-8 py-5 text-left text-sm font-bold text-gray-700 uppercase tracking-wider w-2/5">Source of Funds</th>
                          <th className="px-6 py-5 text-left text-sm font-bold text-gray-700 uppercase tracking-wider w-1/6">Year</th>
                          <th className="px-6 py-5 text-left text-sm font-bold text-gray-700 uppercase tracking-wider w-1/6">MOOE</th>
                          <th className="px-6 py-5 text-left text-sm font-bold text-gray-700 uppercase tracking-wider w-1/6">CO</th>
                          <th className="px-6 py-5 text-left text-sm font-bold text-gray-700 uppercase tracking-wider w-1/6">TOTAL</th>
                          <th className="px-6 py-5 text-left text-sm font-bold text-gray-700 uppercase tracking-wider w-1/12">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {formData.budgetItems.map((item) => (<React.Fragment key={item.id}>
                          <tr className="hover:bg-gray-50 transition-colors duration-150">
                            <td className="px-8 py-5 w-2/5"><input type="text" value={item.source} onChange={(e) => updateBudgetItem(item.id, 'source', e.target.value)}
                              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-transparent text-base transition-all duration-200" placeholder="Enter funding source" /></td>
                            <td className="px-6 py-5 w-1/6"><select value={item.year} onChange={(e) => updateBudgetItem(item.id, 'year', e.target.value)}
                              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-transparent text-base transition-all duration-200">
                              <option value="">Select Year</option>{years.map(year => <option key={year} value={year}>{year}</option>)}
                            </select></td>
                            <td className="px-6 py-5 w-1/6"><input type="number" value={item.mooe} onChange={(e) => updateBudgetItem(item.id, 'mooe', parseFloat(e.target.value) || 0)}
                              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-transparent text-base transition-all duration-200" placeholder="0.00" min="0" step="0.01" /></td>
                            <td className="px-6 py-5 w-1/6"><input type="number" value={item.co} onChange={(e) => updateBudgetItem(item.id, 'co', parseFloat(e.target.value) || 0)}
                              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-transparent text-base transition-all duration-200" placeholder="0.00" min="0" step="0.01" /></td>
                            <td className="px-6 py-5 w-1/6"><input type="text" value={formatCurrency(item.total)} readOnly
                              className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 text-base font-semibold text-gray-700 text-center" /></td>
                            <td className="px-6 py-5 w-1/12">
                              <div className="flex items-center gap-2">
                                <button type="button" onClick={() => toggleExpand(item.id)} className="p-2 text-[#C8102E] hover:text-[#9d0d24] hover:bg-red-50 rounded-lg transition-colors duration-200"
                                  title={item.isExpanded ? "Collapse details" : "Expand details"}>{item.isExpanded ? <FaArrowUp className="w-5 h-5" /> : <FaArrowDown className="w-5 h-5" />}</button>
                                <button type="button" onClick={() => removeBudgetItem(item.id)} className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors duration-200"
                                  title="Remove item" disabled={formData.budgetItems.length <= 1}><FaTrash className="w-5 h-5" /></button>
                              </div>
                            </td>
                          </tr>
                          {item.isExpanded && (<tr><td colSpan={6} className="px-8 py-5 bg-gray-50 border-t border-gray-200">
                            <div className="text-base text-gray-600"><label className="block text-sm font-semibold text-gray-700 mb-3">Additional Details for {item.source || 'Budget Item'}</label>
                              <textarea className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-transparent text-base transition-all duration-200" rows={3} placeholder="Enter additional budget details, justification, or notes..." /></div>
                          </td></tr>)}
                        </React.Fragment>))}
                        <tr className="bg-gradient-to-r from-gray-100 to-gray-200 font-bold border-t-2 border-gray-300">
                          <td className="px-8 py-5 text-base uppercase text-gray-700 w-2/5">Grand Total</td><td className="px-6 py-5 w-1/6"></td>
                          <td className="px-6 py-5 text-base text-gray-700 text-center w-1/6">{formatCurrency(calculateTotal('mooe'))}</td>
                          <td className="px-6 py-5 text-base text-gray-700 text-center w-1/6">{formatCurrency(calculateTotal('co'))}</td>
                          <td className="px-6 py-5 text-base text-[#C8102E] font-bold text-center w-1/6">{formatCurrency(calculateTotal('total'))}</td>
                          <td className="px-6 py-5 w-1/12"></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="lg:hidden space-y-4">
                    {formData.budgetItems.map((item) => (<div key={item.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow duration-200">
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1"><label className="block text-sm font-semibold text-gray-700">Source</label>
                            <input type="text" value={item.source} onChange={(e) => updateBudgetItem(item.id, 'source', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base" placeholder="Enter source" /></div>
                          <div className="space-y-1"><label className="block text-sm font-semibold text-gray-700">Year</label>
                            <select value={item.year} onChange={(e) => updateBudgetItem(item.id, 'year', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base">
                              <option value="">Select Year</option>{years.map(year => <option key={year} value={year}>{year}</option>)}
                            </select></div>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          <div className="space-y-1"><label className="block text-sm font-semibold text-gray-700">MOOE</label>
                            <input type="number" value={item.mooe} onChange={(e) => updateBudgetItem(item.id, 'mooe', parseFloat(e.target.value) || 0)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base" placeholder="0" min="0" step="0.01" /></div>
                          <div className="space-y-1"><label className="block text-sm font-semibold text-gray-700">CO</label>
                            <input type="number" value={item.co} onChange={(e) => updateBudgetItem(item.id, 'co', parseFloat(e.target.value) || 0)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base" placeholder="0" min="0" step="0.01" /></div>
                          <div className="space-y-1"><label className="block text-sm font-semibold text-gray-700">TOTAL</label>
                            <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-base font-semibold text-center">{formatCurrency(item.total)}</div></div>
                        </div>
                        <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                          <button type="button" onClick={() => toggleExpand(item.id)} className="flex items-center gap-2 text-sm text-[#C8102E] hover:text-[#9d0d24] font-semibold">
                            {item.isExpanded ? <FaArrowUp className="w-4 h-4" /> : <FaArrowDown className="w-4 h-4" />}{item.isExpanded ? 'Less Details' : 'More Details'}</button>
                          <button type="button" onClick={() => removeBudgetItem(item.id)} className="flex items-center gap-2 text-sm text-red-600 hover:text-red-800 font-semibold" disabled={formData.budgetItems.length <= 1}>
                            <FaTrash className="w-4 h-4" />Remove</button>
                        </div>
                        {item.isExpanded && (<div className="pt-4 border-t border-gray-200">
                          <label className="block text-sm font-semibold text-gray-700 mb-3">Additional Details</label>
                          <textarea className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base" rows={3} placeholder="Enter additional details..." />
                        </div>)}
                      </div>
                    </div>))}
                    <div className="bg-gradient-to-r from-gray-100 to-gray-200 border border-gray-300 rounded-xl p-4 font-bold">
                      <div className="grid grid-cols-3 gap-4 text-base">
                        <div className="text-center"><div className="text-sm text-gray-600 uppercase mb-1">MOOE Total</div><div className="text-gray-800">{formatCurrency(calculateTotal('mooe'))}</div></div>
                        <div className="text-center"><div className="text-sm text-gray-600 uppercase mb-1">CO Total</div><div className="text-gray-800">{formatCurrency(calculateTotal('co'))}</div></div>
                        <div className="text-center"><div className="text-sm text-gray-600 uppercase mb-1">Grand Total</div><div className="text-[#C8102E]">{formatCurrency(calculateTotal('total'))}</div></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="xl:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm p-6 sticky top-24 border border-gray-100">
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-[#C8102E] to-[#E03A52] rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <FaUpload className="text-2xl text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Upload Research</h2>
                <p className="text-gray-600 mt-2">Complete the form to enable upload</p>
              </div>

              <input ref={fileInputRef} type="file" className="hidden" onChange={(e) => {
                const file = e.target.files && e.target.files[0] ? e.target.files[0] : null; setSelectedFile(file);
              }} disabled={isUploadDisabled} />
              
              <div className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all duration-200 mb-4 ${
                isUploadDisabled ? 'border-gray-300 bg-gray-100 cursor-not-allowed' : selectedFile ? 'border-green-400 bg-green-50' : 'border-gray-300 bg-gray-50 hover:border-[#C8102E] hover:bg-red-50 cursor-pointer'
              }`} onClick={isUploadDisabled ? undefined : handleButtonClick} onDrop={(e) => {
                e.preventDefault(); if (isFormComplete()) { const file = e.dataTransfer.files && e.dataTransfer.files[0] ? e.dataTransfer.files[0] : null; setSelectedFile(file); }
              }} onDragOver={(e) => e.preventDefault()}>
                {selectedFile ? (<div className="text-green-700"><FaCheck className="text-3xl mb-2 mx-auto" />
                  <p className="font-semibold">File Ready</p><p className="text-sm mt-1 truncate">{selectedFile.name}</p></div>) : 
                  (<div><FaFileAlt className="text-3xl text-gray-400 mb-2 mx-auto" /><p className="text-gray-600 font-semibold">Drop file here</p>
                  <p className="text-gray-500 text-sm mt-1">or click to browse</p></div>)}
              </div>

              {selectedFile && (<button onClick={handleAITemplateCheck} disabled={isCheckingTemplate}
                className={`w-full py-3 rounded-xl font-semibold transition-all duration-200 mb-3 flex items-center justify-center gap-2 ${
                  isCheckingTemplate ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                }`}>{isCheckingTemplate ? <><FaSpinner className="w-4 h-4 animate-spin" />Checking Template...</> : 
                <><FaRobot className="w-4 h-4" />AI Template Check</>}</button>)}

              <button onClick={selectedFile ? handleSubmit : handleButtonClick} disabled={isUploadDisabled && !selectedFile}
                className={`w-full py-3 rounded-xl font-semibold transition-all duration-200 mb-3 flex items-center justify-center gap-2 ${
                  isUploadDisabled && !selectedFile ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 
                  'bg-gradient-to-r from-[#C8102E] to-[#E03A52] text-white hover:from-[#9d0d24] hover:to-[#C8102E] shadow-lg hover:shadow-xl transform hover:scale-105 cursor-pointer'
                }`}><FaUpload className="w-4 h-4" />{selectedFile ? "Submit Proposal" : "Select File"}</button>

              {selectedFile && (<button onClick={handleButtonClick} disabled={isUploadDisabled}
                className="w-full py-2 text-sm text-gray-600 hover:text-[#C8102E] transition-colors flex items-center justify-center gap-2 font-medium">
                <FaTimes className="w-3 h-3" />Choose different file</button>)}

              <div className="mt-6 p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                <h4 className="font-bold text-blue-800 text-sm mb-3 flex items-center gap-2"><FaCheck className="w-3 h-3" />Requirements Checklist</h4>
                <div className="space-y-2 text-xs">
                  <div className={`flex items-center ${formData.programTitle ? 'text-green-600' : 'text-gray-500'}`}>
                    {formData.programTitle ? <FaCheck className="w-3 h-3 mr-2" /> : <FaCircle className="w-2 h-2 mr-2" />}<span className="font-medium">Program Title</span></div>
                  <div className={`flex items-center ${formData.projectTitle ? 'text-green-600' : 'text-gray-500'}`}>
                    {formData.projectTitle ? <FaCheck className="w-3 h-3 mr-2" /> : <FaCircle className="w-2 h-2 mr-2" />}<span className="font-medium">Project Title</span></div>
                  <div className={`flex items-center ${Object.values(formData.researchType).some(v => v) ? 'text-green-600' : 'text-gray-500'}`}>
                    {Object.values(formData.researchType).some(v => v) ? <FaCheck className="w-3 h-3 mr-2" /> : <FaCircle className="w-2 h-2 mr-2" />}<span className="font-medium">Research Type</span></div>
                  <div className={`flex items-center ${formData.budgetItems.every(item => item.source) ? 'text-green-600' : 'text-gray-500'}`}>
                    {formData.budgetItems.every(item => item.source) ? <FaCheck className="w-3 h-3 mr-2" /> : <FaCircle className="w-2 h-2 mr-2" />}<span className="font-medium">Budget Items</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;