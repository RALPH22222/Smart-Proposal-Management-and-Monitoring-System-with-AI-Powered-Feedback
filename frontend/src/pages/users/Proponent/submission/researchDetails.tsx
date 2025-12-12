import React, { useState, useEffect, useRef } from 'react';
import {
  FlaskConical,
  University,
  Tag,
  GraduationCap,
  Star,
  Search,
  Rocket,
  FolderOpen,
  Plus,
  X
} from 'lucide-react';
import type { FormData } from '../../../../types/proponent-form';

interface ResearchDetailsProps {
  formData: FormData;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
}

// --- CONSTANTS ---

const researchStations = [
  'College of Computing Studies',
  'Agricultural Research Center',
  'Medical Informatics Department',
  'Computer Science Research Lab',
  'Renewable Energy Research Lab',
  'AI Research Center',
  'Urban Planning Research Institute',
  'Medical AI Research Unit'
];

const sectors = [
  'Education Technology',
  'Agriculture and Fisheries',
  'Health and Wellness',
  'Information Technology',
  'Energy and Power',
  'Artificial Intelligence',
  'Public Safety and Security',
  'Environmental Technology'
];

const disciplines = [
  'Information and Communication Technology',
  'Agricultural Engineering',
  'Health Information Technology',
  'Computer Science',
  'Electrical Engineering',
  'Computer Science and Mathematics',
  'Civil Engineering and ICT',
  'Medical Technology and ICT'
];

// Combined Built-in Priorities
const builtInPriorities = [
  // Stand & Industries
  'STAND',
  'Public Safety',
  'Coconut Industry',
  'Export Winners',
  'Support Industries',
  // SDGs
  'SDG 1: No Poverty',
  'SDG 2: Zero Hunger',
  'SDG 3: Good Health and Well-being',
  'SDG 4: Quality Education',
  'SDG 5: Gender Equality',
  'SDG 6: Clean Water and Sanitation',
  'SDG 7: Affordable and Clean Energy',
  'SDG 8: Decent Work and Economic Growth',
  'SDG 9: Industry, Innovation and Infrastructure',
  'SDG 10: Reduced Inequalities',
  'SDG 11: Sustainable Cities and Communities',
  'SDG 12: Responsible Consumption and Production',
  'SDG 13: Climate Action',
  'SDG 14: Life Below Water',
  'SDG 15: Life on Land',
  'SDG 16: Peace, Justice and Strong Institutions',
  'SDG 17: Partnerships for the Goals'
];

const ResearchDetails: React.FC<ResearchDetailsProps> = ({ formData, onInputChange }) => {
  // --- State ---
  const [isResearchStationOpen, setIsResearchStationOpen] = useState(false);
  const [isSectorOpen, setIsSectorOpen] = useState(false);
  const [isDisciplineOpen, setIsDisciplineOpen] = useState(false);
  const [isPriorityOpen, setIsPriorityOpen] = useState(false);

  const [researchStationSearch, setResearchStationSearch] = useState('');
  const [sectorSearch, setSectorSearch] = useState('');
  const [disciplineSearch, setDisciplineSearch] = useState('');

  const [filteredResearchStations, setFilteredResearchStations] = useState(researchStations);
  const [filteredSectors, setFilteredSectors] = useState(sectors);
  const [filteredDisciplines, setFilteredDisciplines] = useState(disciplines);
  const [filteredPriorities, setFilteredPriorities] = useState(builtInPriorities);

  // Custom Input States
  const [customResearchType, setCustomResearchType] = useState('');
  const [customDevelopmentType, setCustomDevelopmentType] = useState('');
  
  // Priority Area State
  const [priorityInput, setPriorityInput] = useState('');

  // Refs for click outside
  const researchStationRef = useRef<HTMLDivElement>(null);
  const sectorRef = useRef<HTMLDivElement>(null);
  const disciplineRef = useRef<HTMLDivElement>(null);
  const priorityRef = useRef<HTMLDivElement>(null);

  // --- Effects ---

  // Filtering effects
  useEffect(() => {
    setFilteredResearchStations(researchStations.filter(s => s.toLowerCase().includes(researchStationSearch.toLowerCase())));
  }, [researchStationSearch]);

  useEffect(() => {
    setFilteredSectors(sectors.filter(s => s.toLowerCase().includes(sectorSearch.toLowerCase())));
  }, [sectorSearch]);

  useEffect(() => {
    setFilteredDisciplines(disciplines.filter(d => d.toLowerCase().includes(disciplineSearch.toLowerCase())));
  }, [disciplineSearch]);

  // Priority filtering effect
  useEffect(() => {
    setFilteredPriorities(builtInPriorities.filter(p => p.toLowerCase().includes(priorityInput.toLowerCase())));
  }, [priorityInput]);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (researchStationRef.current && !researchStationRef.current.contains(event.target as Node)) setIsResearchStationOpen(false);
      if (sectorRef.current && !sectorRef.current.contains(event.target as Node)) setIsSectorOpen(false);
      if (disciplineRef.current && !disciplineRef.current.contains(event.target as Node)) setIsDisciplineOpen(false);
      if (priorityRef.current && !priorityRef.current.contains(event.target as Node)) setIsPriorityOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // --- Handlers ---

  const handleTextSelect = (name: string, value: string, setSearch: (s: string) => void, setOpen: (b: boolean) => void) => {
    const fakeEvent = { target: { name, value } } as React.ChangeEvent<HTMLInputElement>;
    onInputChange(fakeEvent);
    setSearch(value);
    setOpen(false);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>, setSearch: (s: string) => void) => {
    setSearch(e.target.value);
    onInputChange(e);
  };

  // Classification Handlers
  const handleResearchTypeChange = (type: 'basic' | 'applied' | 'other', customValue?: string) => {
    const newResearchType = {
      basic: type === 'basic',
      applied: type === 'applied',
      other: type === 'other' ? (customValue || customResearchType) : undefined
    };

    if (type === 'other' && customValue !== undefined) {
      setCustomResearchType(customValue);
    }
    
    const fakeEvent = { 
      target: { 
        name: 'researchType', 
        value: newResearchType 
      } 
    } as unknown as React.ChangeEvent<HTMLInputElement>;
    
    onInputChange(fakeEvent);
  };

  const handleDevelopmentTypeChange = (type: 'pilotTesting' | 'techPromotion' | 'other', customValue?: string) => {
    let valueToSend = type;
    if (type === 'other') {
      valueToSend = (customValue || customDevelopmentType) as any; 
      if (customValue !== undefined) setCustomDevelopmentType(customValue);
    }

    const fakeEvent = { 
      target: { 
        name: 'developmentType', 
        value: valueToSend 
      } 
    } as unknown as React.ChangeEvent<HTMLInputElement>;
    
    onInputChange(fakeEvent);
  };

  // --- Priority Areas Handlers ---

  const handlePrioritySelect = (value: string) => {
    setPriorityInput(value);
    setIsPriorityOpen(false);
  };

  const handleAddPriority = () => {
    if (!priorityInput.trim()) return;
    
    const currentPriorities = formData.priorityAreas || {};
    const newPriorityAreas = {
      ...currentPriorities,
      [priorityInput.trim()]: true
    };
    
    const fakeEvent = { 
      target: { name: 'priorityAreas', value: newPriorityAreas } 
    } as unknown as React.ChangeEvent<HTMLInputElement>;
    
    onInputChange(fakeEvent);
    setPriorityInput(''); 
  };

  const handleDeletePriority = (key: string) => {
    const newPriorityAreas = { ...(formData.priorityAreas || {}) } as Record<string, boolean>;
    delete newPriorityAreas[key];
    
    const fakeEvent = { 
      target: { name: 'priorityAreas', value: newPriorityAreas } 
    } as unknown as React.ChangeEvent<HTMLInputElement>;
    
    onInputChange(fakeEvent);
  };

  if (!formData) return <div className="p-4 text-gray-500">Loading...</div>;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="max-w-5xl w-full mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <FlaskConical className="text-[#C8102E] w-5 h-5" />
          </div>
          Research Details
        </h2>
        <div className="flex items-center gap-2 text-sm text-green-600 font-medium select-none">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          Required
        </div>
      </div>

      {/* Research & Development Station */}
      <div className="space-y-2" ref={researchStationRef}>
        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 select-none">
          <University className="text-gray-400 w-4 h-4" />
          Research & Development Station
        </label>
        <div className="relative">
          <input
            type="text"
            name="researchStation"
            value={formData.researchStation || ''}
            onChange={(e) => handleTextChange(e, setResearchStationSearch)}
            onFocus={() => setIsResearchStationOpen(true)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-transparent transition-all duration-200"
            placeholder="Search or type research station"
          />
          {isResearchStationOpen && filteredResearchStations.length > 0 && (
            <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-xl shadow-lg max-h-60 overflow-y-auto">
              {filteredResearchStations.map((station, index) => (
                <div
                  key={index}
                  className="px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors duration-200 border-b border-gray-100 last:border-b-0 select-none"
                  onClick={() => handleTextSelect('researchStation', station, setResearchStationSearch, setIsResearchStationOpen)}
                >
                  <span className="text-sm text-gray-700">{station}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Sector/Commodity */}
        <div className="space-y-2" ref={sectorRef}>
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 select-none">
            <Tag className="text-gray-400 w-4 h-4" />
            Sector/Commodity
          </label>
          <div className="relative">
            <input
              type="text"
              name="sectorCommodity"
              value={formData.sectorCommodity || ''}
              onChange={(e) => handleTextChange(e, setSectorSearch)}
              onFocus={() => setIsSectorOpen(true)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-transparent transition-all duration-200"
              placeholder="Search or type sector/commodity"
            />
            {isSectorOpen && filteredSectors.length > 0 && (
              <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                {filteredSectors.map((sector, index) => (
                  <div
                    key={index}
                    className="px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors duration-200 border-b border-gray-100 last:border-b-0 select-none"
                    onClick={() => handleTextSelect('sectorCommodity', sector, setSectorSearch, setIsSectorOpen)}
                  >
                    <span className="text-sm text-gray-700">{sector}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Discipline */}
        <div className="space-y-2" ref={disciplineRef}>
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 select-none">
            <GraduationCap className="text-gray-400 w-4 h-4" />
            Discipline
          </label>
          <div className="relative">
            <input
              type="text"
              name="discipline"
              value={formData.discipline || ''}
              onChange={(e) => handleTextChange(e, setDisciplineSearch)}
              onFocus={() => setIsDisciplineOpen(true)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-transparent transition-all duration-200"
              placeholder="Search or type discipline"
            />
            {isDisciplineOpen && filteredDisciplines.length > 0 && (
              <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                {filteredDisciplines.map((discipline, index) => (
                  <div
                    key={index}
                    className="px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors duration-200 border-b border-gray-100 last:border-b-0 select-none"
                    onClick={() => handleTextSelect('discipline', discipline, setDisciplineSearch, setIsDisciplineOpen)}
                  >
                    <span className="text-sm text-gray-700">{discipline}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Classification Type Selection */}
      <div className="space-y-6">
        <div className="space-y-4">
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 select-none">
            <FolderOpen className="text-gray-400 w-4 h-4" />
            Classification Type *
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {['research', 'development'].map((type) => (
              <div
                key={type}
                className={`flex items-center p-3 border rounded-xl cursor-pointer transition-colors duration-200 select-none ${
                  formData.classificationType === type 
                    ? 'border-black' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => onInputChange({ target: { name: 'classificationType', value: type } } as React.ChangeEvent<HTMLInputElement>)}
              >
                <input
                  type="radio"
                  name="classificationType"
                  checked={formData.classificationType === type}
                  readOnly
                  className="h-5 w-5 text-[#C8102E] focus:ring-[#C8102E] border-gray-300 pointer-events-none"
                />
                <span className="ml-3 text-sm font-medium text-gray-700 capitalize">
                  {type} Classification
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Research Classification */}
        {formData.classificationType === 'research' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 select-none">
              <Search className="text-gray-400 w-4 h-4" />
              Research Classification *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div 
                className={`flex items-center p-3 border rounded-xl cursor-pointer transition-colors duration-200 select-none ${formData.researchType?.basic ? 'border-black' : 'border-gray-200 hover:border-gray-300'}`}
                onClick={() => handleResearchTypeChange('basic')}
              >
                <input type="radio" checked={!!formData.researchType?.basic} readOnly className="h-5 w-5 text-[#C8102E] pointer-events-none" />
                <span className="ml-3 text-sm font-medium text-gray-700">Basic Research</span>
              </div>
              <div 
                className={`flex items-center p-3 border rounded-xl cursor-pointer transition-colors duration-200 select-none ${formData.researchType?.applied ? 'border-black' : 'border-gray-200 hover:border-gray-300'}`}
                onClick={() => handleResearchTypeChange('applied')}
              >
                <input type="radio" checked={!!formData.researchType?.applied} readOnly className="h-5 w-5 text-[#C8102E] pointer-events-none" />
                <span className="ml-3 text-sm font-medium text-gray-700">Applied Research</span>
              </div>
              {/* Custom Research Type */}
              <div 
                className={`flex flex-col p-3 border rounded-xl cursor-pointer transition-colors duration-200 select-none sm:col-span-2 ${(formData.researchType as any)?.other ? 'border-black' : 'border-gray-200 hover:border-gray-300'}`}
                onClick={(e) => {
                  if ((e.target as HTMLElement).tagName !== 'INPUT') {
                    handleResearchTypeChange('other', customResearchType || 'Custom Type');
                  }
                }}
              >
                <div className="flex items-center">
                  <input type="radio" checked={!!(formData.researchType as any)?.other} readOnly className="h-5 w-5 text-[#C8102E] pointer-events-none" />
                  <span className="ml-3 text-sm font-medium text-gray-700">Other (Specify)</span>
                </div>
                {(formData.researchType as any)?.other !== undefined && (
                  <input
                    type="text"
                    value={customResearchType}
                    onChange={(e) => handleResearchTypeChange('other', e.target.value)}
                    className="mt-2 ml-8 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1"
                    placeholder="Enter research classification..."
                    autoFocus
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {/* Development Classification */}
        {formData.classificationType === 'development' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 select-none">
              <Rocket className="text-gray-400 w-4 h-4" /> 
              Development Classification *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div 
                className={`flex items-center p-3 border rounded-xl cursor-pointer transition-colors duration-200 select-none ${formData.developmentType === 'pilotTesting' ? 'border-black' : 'border-gray-200 hover:border-gray-300'}`}
                onClick={() => handleDevelopmentTypeChange('pilotTesting')}
              >
                <input type="radio" checked={formData.developmentType === 'pilotTesting'} readOnly className="h-5 w-5 text-[#C8102E] pointer-events-none" />
                <span className="ml-3 text-sm font-medium text-gray-700">Pilot Testing</span>
              </div>
              <div 
                className={`flex items-center p-3 border rounded-xl cursor-pointer transition-colors duration-200 select-none ${formData.developmentType === 'techPromotion' ? 'border-black' : 'border-gray-200 hover:border-gray-300'}`}
                onClick={() => handleDevelopmentTypeChange('techPromotion')}
              >
                <input type="radio" checked={formData.developmentType === 'techPromotion'} readOnly className="h-5 w-5 text-[#C8102E] pointer-events-none" />
                <span className="ml-3 text-sm font-medium text-gray-700">Technology Promotion/Commercialization</span>
              </div>
              {/* Custom Development Type */}
              <div 
                className={`flex flex-col p-3 border rounded-xl cursor-pointer transition-colors duration-200 select-none sm:col-span-2 ${
                  formData.developmentType !== 'pilotTesting' && formData.developmentType !== 'techPromotion' 
                  ? 'border-black' : 'border-gray-200 hover:border-gray-300'}`}
                onClick={(e) => {
                  if ((e.target as HTMLElement).tagName !== 'INPUT') {
                    handleDevelopmentTypeChange('other', customDevelopmentType || 'Custom Type');
                  }
                }}
              >
                <div className="flex items-center">
                  <input type="radio" checked={formData.developmentType !== 'pilotTesting' && formData.developmentType !== 'techPromotion'} readOnly className="h-5 w-5 text-[#C8102E] pointer-events-none" />
                  <span className="ml-3 text-sm font-medium text-gray-700">Other (Specify)</span>
                </div>
                {(formData.developmentType !== 'pilotTesting' && formData.developmentType !== 'techPromotion') && (
                  <input
                    type="text"
                    value={customDevelopmentType}
                    onChange={(e) => handleDevelopmentTypeChange('other', e.target.value)}
                    className="mt-2 ml-8 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1"
                    placeholder="Enter development classification..."
                    autoFocus
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Priority Areas */}
      <div className="space-y-4" ref={priorityRef}>
        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 select-none">
          <Star className="text-gray-400 w-4 h-4" />
          Priority Areas *
        </label>

        {/* Selected Priority Chips */}
        {formData.priorityAreas && Object.keys(formData.priorityAreas).length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {Object.entries(formData.priorityAreas as Record<string, boolean>)
               .filter(([_, value]) => value === true)
               .map(([key]) => (
                <div key={key} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-sm font-medium">
                  {key}
                  <button 
                    type="button" 
                    onClick={() => handleDeletePriority(key)}
                    className="hover:text-red-500 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
            ))}
          </div>
        )}
        
        {/* Input Area (Custom Dropdown + Text Input) */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Select or type a priority area (e.g. SDG 1, Stand)..."
              value={priorityInput}
              onChange={(e) => setPriorityInput(e.target.value)}
              onFocus={() => setIsPriorityOpen(true)}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-transparent text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddPriority();
                }
              }}
            />
            {/* Custom Dropdown */}
            {isPriorityOpen && filteredPriorities.length > 0 && (
              <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                {filteredPriorities.map((item, index) => (
                  <div
                    key={index}
                    className="px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors duration-200 border-b border-gray-100 last:border-b-0 select-none"
                    onClick={() => handlePrioritySelect(item)}
                  >
                    <span className="text-sm text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={handleAddPriority}
            disabled={!priorityInput.trim()}
            className="px-4 py-2 bg-[#C8102E] text-white rounded-xl hover:bg-[#A00E26] transition-colors flex items-center gap-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>
        <p className="text-xs text-gray-500">
           Select from the list or type your own custom priority area.
        </p>
      </div>

    </div>
  );
};

export default ResearchDetails;