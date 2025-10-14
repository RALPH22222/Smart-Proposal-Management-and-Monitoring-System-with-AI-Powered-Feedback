import React, { useRef, useState, useCallback, useEffect } from "react";
import ProponentNavbar from "../../../components/Proponent-navbar";

// Import icons
import { 
  FaFileAlt, 
  FaFlask, 
  FaMoneyBillWave, 
  FaUpload, 
  FaCheck, 
  FaCircle,
  FaArrowUp,
  FaArrowDown,
  FaTimes,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaPhone,
  FaUniversity,
  FaCog,
  FaStar,
  FaTag,
  FaGraduationCap,
  FaPlus,
  FaTrash
} from 'react-icons/fa';

interface BudgetItem {
  id: number;
  source: string;
  mooe: number;
  co: number;
  total: number;
  isExpanded: boolean;
  year: string;
}

interface FormData {
  programTitle: string;
  projectTitle: string;
  leaderGender: string;
  agencyAddress: string;
  telephoneFaxEmail: string;
  cooperatingAgencies: string;
  researchStation: string;
  researchType: {
    basic: boolean;
    applied: boolean;
    development: boolean;
    pilotTesting: boolean;
    techPromotion: boolean;
  };
  implementationMode: {
    singleAgency: boolean;
    multiAgency: boolean;
  };
  priorityAreas: {
    stand: boolean;
    coconutIndustry: boolean;
    exportWinners: boolean;
    otherPriorityAreas: boolean;
    supportIndustries: boolean;
  };
  sectorCommodity: string;
  discipline: string;
  duration: string;
  plannedStartDate: string;
  plannedEndDate: string;
  budgetItems: BudgetItem[];
}

const Dashboard: React.FC = () => {
  // File upload state and handlers
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formData, setFormData] = useState<FormData>({
    programTitle: '',
    projectTitle: '',
    leaderGender: '',
    agencyAddress: '',
    telephoneFaxEmail: '',
    cooperatingAgencies: '',
    researchStation: '',
    researchType: {
      basic: false,
      applied: false,
      development: false,
      pilotTesting: false,
      techPromotion: false,
    },
    implementationMode: {
      singleAgency: false,
      multiAgency: false,
    },
    priorityAreas: {
      stand: false,
      coconutIndustry: false,
      exportWinners: false,
      otherPriorityAreas: false,
      supportIndustries: false,
    },
    sectorCommodity: '',
    discipline: '',
    duration: '',
    plannedStartDate: '',
    plannedEndDate: '',
    budgetItems: [
      { id: 1, source: '', mooe: 0, co: 0, total: 0, isExpanded: false, year: '' },
    ],
  });

  const [years, setYears] = useState<string[]>([]);
  const [activeSection, setActiveSection] = useState<string>('basic-info');

  // Check if all required fields are filled - wrapped in useCallback
  const isFormComplete = useCallback(() => {
    const requiredFields = [
      formData.programTitle,
      formData.projectTitle,
      formData.leaderGender,
      formData.agencyAddress,
      formData.telephoneFaxEmail,
      formData.plannedStartDate,
      formData.plannedEndDate,
      formData.duration
    ];

    // Check if at least one research type is selected
    const hasResearchType = Object.values(formData.researchType).some(value => value);
    
    // Check if at least one implementation mode is selected
    const hasImplementationMode = Object.values(formData.implementationMode).some(value => value);
    
    // Check if at least one priority area is selected
    const hasPriorityArea = Object.values(formData.priorityAreas).some(value => value);
    
    // Check if all budget items have source and year
    const hasValidBudgetItems = formData.budgetItems.every(item => 
      item.source.trim() !== '' && item.year !== ''
    );

    return requiredFields.every(field => field.trim() !== '') && 
           hasResearchType && 
           hasImplementationMode && 
           hasPriorityArea &&
           hasValidBudgetItems;
  }, [formData]);

  const handleButtonClick = useCallback(() => {
    if (isFormComplete()) {
      fileInputRef.current?.click();
    }
  }, [isFormComplete]);

  const handleSubmit = useCallback(() => {
    if (!selectedFile || !isFormComplete()) return;
    // TODO: Replace with API call to upload the file and form data
    console.log('Submitting file:', selectedFile.name);
    console.log('Form data:', formData);
    alert('Research proposal submitted successfully!');
  }, [selectedFile, formData, isFormComplete]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof typeof prev] as Record<string, unknown>,
          [child]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
      }));
    }
  };

  const addBudgetItem = () => {
    const newItem: BudgetItem = {
      id: formData.budgetItems.length + 1,
      source: '',
      mooe: 0,
      co: 0,
      total: 0,
      isExpanded: false,
      year: years[0] || ''
    };
    setFormData(prev => ({
      ...prev,
      budgetItems: [...prev.budgetItems, newItem]
    }));
  };

  const removeBudgetItem = (id: number) => {
    if (formData.budgetItems.length > 1) {
      setFormData(prev => ({
        ...prev,
        budgetItems: prev.budgetItems.filter(item => item.id !== id)
      }));
    }
  };

  const updateBudgetItem = (id: number, field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      budgetItems: prev.budgetItems.map(item => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value };
          // Calculate total when mooe or co changes
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
      ...prev,
      budgetItems: prev.budgetItems.map(item => 
        item.id === id ? { ...item, isExpanded: !item.isExpanded } : item
      )
    }));
  };

  // Calculate totals for the budget table
  const calculateTotal = (field: 'mooe' | 'co' | 'total') => {
    return formData.budgetItems.reduce((sum, item) => sum + (Number(item[field]) || 0), 0);
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  // Generate years based on start and end dates
  useEffect(() => {
    if (formData.plannedStartDate && formData.plannedEndDate) {
      const startYear = new Date(formData.plannedStartDate).getFullYear();
      const endYear = new Date(formData.plannedEndDate).getFullYear();
      const yearsArray: string[] = [];
      for (let year = startYear; year <= endYear; year++) {
        yearsArray.push(year.toString());
      }
      setYears(yearsArray);
      
      // Update budget items with years
      if (yearsArray.length > 0) {
        setFormData(prev => ({
          ...prev,
          budgetItems: prev.budgetItems.map(item => ({
            ...item,
            year: yearsArray[0] 
          }))
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
      <main className="flex-1 max-w-7xl mx-auto px-4 lg:px-6 py-4 pb-20">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
          {/* Left sidebar - Navigation */}
          <div className="xl:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-4 sticky top-4">
              <h3 className="font-semibold text-gray-800 mb-4 text-lg">Research Proposal</h3>
              <nav className="space-y-2">
                {formSections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center space-x-3 ${
                      activeSection === section.id
                        ? 'bg-[#C8102E] text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {section.icon}
                    <span className="font-medium">{section.label}</span>
                  </button>
                ))}
              </nav>
              
              {/* Progress indicator */}
              <div className="mt-6 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Completion</span>
                  <span className={`text-sm font-medium ${
                    isFormComplete() ? 'text-green-600' : 'text-orange-600'
                  }`}>
                    {isFormComplete() ? 'Ready' : 'In Progress'}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      isFormComplete() ? 'bg-green-500' : 'bg-orange-500'
                    }`}
                    style={{ width: isFormComplete() ? '100%' : '65%' }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Middle - Form Content */}
          <div className="xl:col-span-2">
            <div className="bg-white rounded-xl shadow-sm p-6">
              {/* Basic Information Section */}
              {activeSection === 'basic-info' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                      <FaFileAlt className="text-[#C8102E]" />
                      Basic Information
                    </h2>
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Program Title *</label>
                      <input
                        type="text"
                        name="programTitle"
                        value={formData.programTitle}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-transparent"
                        placeholder="Enter program title"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Project Title *</label>
                      <input
                        type="text"
                        name="projectTitle"
                        value={formData.projectTitle}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-transparent"
                        placeholder="Enter project title"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Leader Gender *</label>
                      <select
                        name="leaderGender"
                        value={formData.leaderGender}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-transparent"
                      >
                        <option value="">Select Gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Duration (months) *</label>
                      <input
                        type="number"
                        name="duration"
                        value={formData.duration}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-transparent"
                        placeholder="Enter duration"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                        <FaMapMarkerAlt className="text-gray-400" />
                        Agency Address *
                      </label>
                      <input
                        type="text"
                        name="agencyAddress"
                        value={formData.agencyAddress}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-transparent"
                        placeholder="Enter agency address"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                        <FaPhone className="text-gray-400" />
                        Telephone/Fax/Email *
                      </label>
                      <input
                        type="text"
                        name="telephoneFaxEmail"
                        value={formData.telephoneFaxEmail}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-transparent"
                        placeholder="Enter contact information"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                        <FaCalendarAlt className="text-gray-400" />
                        Planned Start Date *
                      </label>
                      <input
                        type="date"
                        name="plannedStartDate"
                        value={formData.plannedStartDate}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                        <FaCalendarAlt className="text-gray-400" />
                        Planned End Date *
                      </label>
                      <input
                        type="date"
                        name="plannedEndDate"
                        value={formData.plannedEndDate}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                      <FaUniversity className="text-gray-400" />
                      Cooperating Agencies
                    </label>
                    <textarea
                      name="cooperatingAgencies"
                      value={formData.cooperatingAgencies}
                      onChange={handleInputChange}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-transparent"
                      placeholder="List cooperating agencies..."
                    />
                  </div>
                </div>
              )}

              {/* Research Details Section */}
              {activeSection === 'research-details' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                      <FaFlask className="text-[#C8102E]" />
                      Research Details
                    </h2>
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                      <FaUniversity className="text-gray-400" />
                      Research & Development Station
                    </label>
                    <input
                      type="text"
                      name="researchStation"
                      value={formData.researchStation}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-transparent"
                      placeholder="Enter research station"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                        <FaTag className="text-gray-400" />
                        Sector/Commodity
                      </label>
                      <input
                        type="text"
                        name="sectorCommodity"
                        value={formData.sectorCommodity}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-transparent"
                        placeholder="Enter sector/commodity"
                      />
                    </div>
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                        <FaGraduationCap className="text-gray-400" />
                        Discipline
                      </label>
                      <input
                        type="text"
                        name="discipline"
                        value={formData.discipline}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-transparent"
                        placeholder="Enter discipline"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                      <FaCog className="text-gray-400" />
                      Research Classification *
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {Object.entries(formData.researchType).map(([key, value]) => (
                        <div key={key} className="flex items-center">
                          <input
                            type="checkbox"
                            id={`researchType.${key}`}
                            name={`researchType.${key}`}
                            checked={value}
                            onChange={handleInputChange}
                            className="h-4 w-4 text-[#C8102E] focus:ring-[#C8102E] border-gray-300 rounded"
                          />
                          <label htmlFor={`researchType.${key}`} className="ml-2 text-sm text-gray-700 capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                      <FaCog className="text-gray-400" />
                      Mode of Implementation *
                    </label>
                    <div className="flex gap-6">
                      {Object.entries(formData.implementationMode).map(([key, value]) => (
                        <div key={key} className="flex items-center">
                          <input
                            type="checkbox"
                            id={`implementationMode.${key}`}
                            name={`implementationMode.${key}`}
                            checked={value}
                            onChange={handleInputChange}
                            className="h-4 w-4 text-[#C8102E] focus:ring-[#C8102E] border-gray-300 rounded"
                          />
                          <label htmlFor={`implementationMode.${key}`} className="ml-2 text-sm text-gray-700 capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                      <FaStar className="text-gray-400" />
                      Priority Areas *
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {Object.entries(formData.priorityAreas).map(([key, value]) => (
                        <div key={key} className="flex items-center">
                          <input
                            type="checkbox"
                            id={`priorityAreas.${key}`}
                            name={`priorityAreas.${key}`}
                            checked={value}
                            onChange={handleInputChange}
                            className="h-4 w-4 text-[#C8102E] focus:ring-[#C8102E] border-gray-300 rounded"
                          />
                          <label htmlFor={`priorityAreas.${key}`} className="ml-2 text-sm text-gray-700 capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Budget Section */}
              {activeSection === 'budget' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                      <FaMoneyBillWave className="text-[#C8102E]" />
                      Budget Requirements
                    </h2>
                    <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></div>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <p className="text-sm text-gray-600">Add budget items for each funding source</p>
                    <button
                      type="button"
                      onClick={addBudgetItem}
                      className="px-6 py-3 text-base font-medium text-white rounded-lg hover:bg-[#9d0d24] transition-colors flex items-center gap-2 whitespace-nowrap"
                      style={{ backgroundColor: '#C8102E' }}
                    >
                      <FaPlus className="w-4 h-4" />
                      Add Budget Item
                    </button>
                  </div>

                  {/* Desktop Table */}
                  <div className="hidden lg:block overflow-x-auto border border-gray-200 rounded-lg bg-white">
                    <table className="w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-8 py-5 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider bg-gray-100 w-2/5">Source of Funds</th>
                          <th className="px-6 py-5 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider bg-gray-100 w-1/6">Year</th>
                          <th className="px-6 py-5 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider bg-gray-100 w-1/6">MOOE</th>
                          <th className="px-6 py-5 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider bg-gray-100 w-1/6">CO</th>
                          <th className="px-6 py-5 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider bg-gray-100 w-1/6">TOTAL</th>
                          <th className="px-6 py-5 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider bg-gray-100 w-1/12">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {formData.budgetItems.map((item) => (
                          <React.Fragment key={item.id}>
                            <tr className="hover:bg-gray-50 transition-colors duration-150">
                              <td className="px-8 py-5 w-2/5">
                                <input
                                  type="text"
                                  value={item.source}
                                  onChange={(e) => updateBudgetItem(item.id, 'source', e.target.value)}
                                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-transparent text-base"
                                  placeholder="Enter funding source"
                                />
                              </td>
                              <td className="px-6 py-5 w-1/6">
                                <select
                                  value={item.year}
                                  onChange={(e) => updateBudgetItem(item.id, 'year', e.target.value)}
                                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-transparent text-base"
                                >
                                  <option value="">Select Year</option>
                                  {years.map(year => (
                                    <option key={year} value={year}>{year}</option>
                                  ))}
                                </select>
                              </td>
                              <td className="px-6 py-5 w-1/6">
                                <input
                                  type="number"
                                  value={item.mooe}
                                  onChange={(e) => updateBudgetItem(item.id, 'mooe', parseFloat(e.target.value) || 0)}
                                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-transparent text-base"
                                  placeholder="0.00"
                                  min="0"
                                  step="0.01"
                                />
                              </td>
                              <td className="px-6 py-5 w-1/6">
                                <input
                                  type="number"
                                  value={item.co}
                                  onChange={(e) => updateBudgetItem(item.id, 'co', parseFloat(e.target.value) || 0)}
                                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-transparent text-base"
                                  placeholder="0.00"
                                  min="0"
                                  step="0.01"
                                />
                              </td>
                              <td className="px-6 py-5 w-1/6">
                                <input
                                  type="text"
                                  value={formatCurrency(item.total)}
                                  readOnly
                                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-base font-medium text-gray-700 text-center"
                                />
                              </td>
                              <td className="px-6 py-5 w-1/12">
                                <div className="flex items-center gap-3">
                                  <button
                                    type="button"
                                    onClick={() => toggleExpand(item.id)}
                                    className="p-2 text-[#C8102E] hover:text-[#9d0d24] hover:bg-red-50 rounded-lg transition-colors"
                                    title={item.isExpanded ? "Collapse details" : "Expand details"}
                                  >
                                    {item.isExpanded ? <FaArrowUp className="w-5 h-5" /> : <FaArrowDown className="w-5 h-5" />}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => removeBudgetItem(item.id)}
                                    className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Remove item"
                                    disabled={formData.budgetItems.length <= 1}
                                  >
                                    <FaTrash className="w-5 h-5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                            {item.isExpanded && (
                              <tr>
                                <td colSpan={6} className="px-8 py-5 bg-gray-50 border-t border-gray-200">
                                  <div className="text-base text-gray-600">
                                    <label className="block text-sm font-medium text-gray-700 mb-3">
                                      Additional Details for {item.source || 'Budget Item'}
                                    </label>
                                    <textarea
                                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-transparent text-base"
                                      rows={3}
                                      placeholder="Enter additional budget details, justification, or notes..."
                                    />
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        ))}
                        {/* Total Row */}
                        <tr className="bg-gray-100 font-bold border-t-2 border-gray-300">
                          <td className="px-8 py-5 text-base uppercase text-gray-700 w-2/5">Grand Total</td>
                          <td className="px-6 py-5 w-1/6"></td>
                          <td className="px-6 py-5 text-base text-gray-700 text-center w-1/6">{formatCurrency(calculateTotal('mooe'))}</td>
                          <td className="px-6 py-5 text-base text-gray-700 text-center w-1/6">{formatCurrency(calculateTotal('co'))}</td>
                          <td className="px-6 py-5 text-base text-[#C8102E] font-semibold text-center w-1/6">{formatCurrency(calculateTotal('total'))}</td>
                          <td className="px-6 py-5 w-1/12"></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Cards */}
                  <div className="lg:hidden space-y-4">
                    {formData.budgetItems.map((item) => (
                      <div key={item.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                        <div className="space-y-4">
                          {/* Source and Year */}
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Source</label>
                              <input
                                type="text"
                                value={item.source}
                                onChange={(e) => updateBudgetItem(item.id, 'source', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base"
                                placeholder="Enter source"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
                              <select
                                value={item.year}
                                onChange={(e) => updateBudgetItem(item.id, 'year', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base"
                              >
                                <option value="">Select Year</option>
                                {years.map(year => (
                                  <option key={year} value={year}>{year}</option>
                                ))}
                              </select>
                            </div>
                          </div>

                          {/* Budget Amounts */}
                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">MOOE</label>
                              <input
                                type="number"
                                value={item.mooe}
                                onChange={(e) => updateBudgetItem(item.id, 'mooe', parseFloat(e.target.value) || 0)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base"
                                placeholder="0"
                                min="0"
                                step="0.01"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">CO</label>
                              <input
                                type="number"
                                value={item.co}
                                onChange={(e) => updateBudgetItem(item.id, 'co', parseFloat(e.target.value) || 0)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base"
                                placeholder="0"
                                min="0"
                                step="0.01"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">TOTAL</label>
                              <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-base font-medium text-center">
                                {formatCurrency(item.total)}
                              </div>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                            <button
                              type="button"
                              onClick={() => toggleExpand(item.id)}
                              className="flex items-center gap-2 text-sm text-[#C8102E] hover:text-[#9d0d24] font-medium"
                            >
                              {item.isExpanded ? <FaArrowUp className="w-4 h-4" /> : <FaArrowDown className="w-4 h-4" />}
                              {item.isExpanded ? 'Less Details' : 'More Details'}
                            </button>
                            <button
                              type="button"
                              onClick={() => removeBudgetItem(item.id)}
                              className="flex items-center gap-2 text-sm text-red-600 hover:text-red-800 font-medium"
                              disabled={formData.budgetItems.length <= 1}
                            >
                              <FaTrash className="w-4 h-4" />
                              Remove
                            </button>
                          </div>

                          {/* Expandable Details */}
                          {item.isExpanded && (
                            <div className="pt-4 border-t border-gray-200">
                              <label className="block text-sm font-medium text-gray-700 mb-3">
                                Additional Details
                              </label>
                              <textarea
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base"
                                rows={3}
                                placeholder="Enter additional details..."
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}

                    {/* Mobile Total Card */}
                    <div className="bg-gray-100 border border-gray-300 rounded-lg p-4 font-semibold">
                      <div className="grid grid-cols-3 gap-4 text-base">
                        <div className="text-center">
                          <div className="text-sm text-gray-600 uppercase mb-1">MOOE Total</div>
                          <div className="text-gray-800">{formatCurrency(calculateTotal('mooe'))}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm text-gray-600 uppercase mb-1">CO Total</div>
                          <div className="text-gray-800">{formatCurrency(calculateTotal('co'))}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm text-gray-600 uppercase mb-1">Grand Total</div>
                          <div className="text-[#C8102E]">{formatCurrency(calculateTotal('total'))}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right - Upload Section */}
          <div className="xl:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-4">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-[#C8102E] rounded-full flex items-center justify-center mx-auto mb-3">
                  <FaUpload className="text-2xl text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-800">Upload Research</h2>
                <p className="text-sm text-gray-600 mt-1">Complete the form to enable upload</p>
              </div>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files && e.target.files[0] ? e.target.files[0] : null;
                  setSelectedFile(file);
                }}
                disabled={isUploadDisabled}
              />
              
              {/* Upload Area */}
              <div
                className={`border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200 mb-4 ${
                  isUploadDisabled 
                    ? 'border-gray-300 bg-gray-100 cursor-not-allowed' 
                    : selectedFile
                    ? 'border-green-400 bg-green-50'
                    : 'border-gray-300 bg-gray-50 hover:border-[#C8102E] hover:bg-red-50 cursor-pointer'
                }`}
                onClick={isUploadDisabled ? undefined : handleButtonClick}
                onDrop={(e) => {
                  e.preventDefault();
                  if (isFormComplete()) {
                    const file = e.dataTransfer.files && e.dataTransfer.files[0] ? e.dataTransfer.files[0] : null;
                    setSelectedFile(file);
                  }
                }}
                onDragOver={(e) => e.preventDefault()}
              >
                {selectedFile ? (
                  <div className="text-green-700">
                    <FaCheck className="text-3xl mb-2 mx-auto" />
                    <p className="font-medium">File Ready</p>
                    <p className="text-sm mt-1 truncate">{selectedFile.name}</p>
                  </div>
                ) : (
                  <div>
                    <FaFileAlt className="text-3xl text-gray-400 mb-2 mx-auto" />
                    <p className="text-gray-600 font-medium">Drop file here</p>
                    <p className="text-gray-500 text-sm mt-1">or click to browse</p>
                  </div>
                )}
              </div>

              <button
                onClick={selectedFile ? handleSubmit : handleButtonClick}
                disabled={isUploadDisabled && !selectedFile}
                className={`w-full py-3 rounded-xl font-medium transition-colors duration-200 mb-3 flex items-center justify-center gap-2 ${
                  isUploadDisabled && !selectedFile
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-[#C8102E] text-white hover:bg-[#9d0d24] cursor-pointer'
                }`}
              >
                <FaUpload className="w-4 h-4" />
                {selectedFile ? "Submit Proposal" : "Select File"}
              </button>

              {selectedFile && (
                <button
                  onClick={handleButtonClick}
                  disabled={isUploadDisabled}
                  className="w-full py-2 text-sm text-gray-600 hover:text-[#C8102E] transition-colors flex items-center justify-center gap-2"
                >
                  <FaTimes className="w-3 h-3" />
                  Choose different file
                </button>
              )}

              {/* Requirements Checklist */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-800 text-sm mb-3 flex items-center gap-2">
                  <FaCheck className="w-3 h-3" />
                  Requirements Checklist
                </h4>
                <div className="space-y-2 text-xs">
                  <div className={`flex items-center ${formData.programTitle ? 'text-green-600' : 'text-gray-500'}`}>
                    {formData.programTitle ? <FaCheck className="w-3 h-3 mr-2" /> : <FaCircle className="w-2 h-2 mr-2" />}
                    <span>Program Title</span>
                  </div>
                  <div className={`flex items-center ${formData.projectTitle ? 'text-green-600' : 'text-gray-500'}`}>
                    {formData.projectTitle ? <FaCheck className="w-3 h-3 mr-2" /> : <FaCircle className="w-2 h-2 mr-2" />}
                    <span>Project Title</span>
                  </div>
                  <div className={`flex items-center ${Object.values(formData.researchType).some(v => v) ? 'text-green-600' : 'text-gray-500'}`}>
                    {Object.values(formData.researchType).some(v => v) ? <FaCheck className="w-3 h-3 mr-2" /> : <FaCircle className="w-2 h-2 mr-2" />}
                    <span>Research Type</span>
                  </div>
                  <div className={`flex items-center ${formData.budgetItems.every(item => item.source) ? 'text-green-600' : 'text-gray-500'}`}>
                    {formData.budgetItems.every(item => item.source) ? <FaCheck className="w-3 h-3 mr-2" /> : <FaCircle className="w-2 h-2 mr-2" />}
                    <span>Budget Items</span>
                  </div>
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