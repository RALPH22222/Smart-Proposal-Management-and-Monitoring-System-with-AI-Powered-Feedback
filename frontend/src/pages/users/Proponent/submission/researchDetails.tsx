import React, { useState, useEffect, useRef } from 'react';
import {
  FlaskConical,
  University,
  Tag,
  GraduationCap,
  Settings,
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

// Predefined options
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

// Default Priority Areas Labels
const defaultPriorities = [
  'Stand',
  'Coconut Industry',
  'Export Winners',
  'Support Industries'
];

const ResearchDetails: React.FC<ResearchDetailsProps> = ({ formData, onInputChange }) => {
  // --- State ---
  const [isResearchStationOpen, setIsResearchStationOpen] = useState(false);
  const [isSectorOpen, setIsSectorOpen] = useState(false);
  const [isDisciplineOpen, setIsDisciplineOpen] = useState(false);

  const [researchStationSearch, setResearchStationSearch] = useState('');
  const [sectorSearch, setSectorSearch] = useState('');
  const [disciplineSearch, setDisciplineSearch] = useState('');

  const [filteredResearchStations, setFilteredResearchStations] = useState(researchStations);
  const [filteredSectors, setFilteredSectors] = useState(sectors);
  const [filteredDisciplines, setFilteredDisciplines] = useState(disciplines);

  // Custom Input States
  const [customResearchType, setCustomResearchType] = useState('');
  const [customDevelopmentType, setCustomDevelopmentType] = useState('');
  const [customPriorityInput, setCustomPriorityInput] = useState('');

  // Refs for click outside
  const researchStationRef = useRef<HTMLDivElement>(null);
  const sectorRef = useRef<HTMLDivElement>(null);
  const disciplineRef = useRef<HTMLDivElement>(null);

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

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (researchStationRef.current && !researchStationRef.current.contains(event.target as Node)) setIsResearchStationOpen(false);
      if (sectorRef.current && !sectorRef.current.contains(event.target as Node)) setIsSectorOpen(false);
      if (disciplineRef.current && !disciplineRef.current.contains(event.target as Node)) setIsDisciplineOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // --- Handlers ---

  // Text Input Handlers (Station, Sector, Discipline)
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

  // Mode of Implementation Handler
  const handleImplementationModeChange = (mode: 'singleAgency' | 'multiAgency') => {
    const newMode = {
      singleAgency: mode === 'singleAgency',
      multiAgency: mode === 'multiAgency'
    };
    
    const fakeEvent = { 
      target: { 
        name: 'implementationMode', 
        value: newMode 
      } 
    } as unknown as React.ChangeEvent<HTMLInputElement>;
    
    onInputChange(fakeEvent);
  };

  // Priority Areas Handlers
  const handlePriorityAreaChange = (key: string, checked: boolean) => {
    const currentPriorities = formData.priorityAreas || {};
    const newPriorityAreas = {
      ...currentPriorities,
      [key]: checked
    };
    
    const fakeEvent = { 
      target: { 
        name: 'priorityAreas', 
        value: newPriorityAreas 
      } 
    } as unknown as React.ChangeEvent<HTMLInputElement>;
    
    onInputChange(fakeEvent);
  };

  const handleAddCustomPriority = () => {
    if (!customPriorityInput.trim()) return;
    
    // Add new priority area initialized to true
    handlePriorityAreaChange(customPriorityInput.trim(), true);
    setCustomPriorityInput('');
  };

  const handleDeletePriority = (key: string) => {
    const newPriorityAreas = { ...(formData.priorityAreas || {}) } as Record<string, boolean>;
    // Explicitly delete key to remove it from the object
    delete newPriorityAreas[key];
    
    const fakeEvent = { 
      target: { 
        name: 'priorityAreas', 
        value: newPriorityAreas 
      } 
    } as unknown as React.ChangeEvent<HTMLInputElement>;
    
    onInputChange(fakeEvent);
  };

  // Helper to safely check if a priority is selected
  const isPrioritySelected = (key: string): boolean => {
    if (!formData.priorityAreas) return false;
    const areas = formData.priorityAreas as Record<string, boolean>;
    return areas[key] === true;
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

      {/* Mode of Implementation */}
      <div className="space-y-4">
        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 select-none">
          <Settings className="text-gray-400 w-4 h-4" />
          Mode of Implementation *
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md">
          <div 
            className={`flex items-center p-3 border rounded-xl cursor-pointer transition-colors duration-200 select-none ${formData.implementationMode?.singleAgency ? 'border-black' : 'border-gray-200 hover:border-gray-300'}`}
            onClick={() => handleImplementationModeChange('singleAgency')}
          >
            <input type="radio" checked={!!formData.implementationMode?.singleAgency} readOnly className="h-5 w-5 text-[#C8102E] pointer-events-none" />
            <span className="ml-3 text-sm font-medium text-gray-700">Single Agency</span>
          </div>
          
          <div 
            className={`flex items-center p-3 border rounded-xl cursor-pointer transition-colors duration-200 select-none ${formData.implementationMode?.multiAgency ? 'border-black' : 'border-gray-200 hover:border-gray-300'}`}
            onClick={() => handleImplementationModeChange('multiAgency')}
          >
            <input type="radio" checked={!!formData.implementationMode?.multiAgency} readOnly className="h-5 w-5 text-[#C8102E] pointer-events-none" />
            <span className="ml-3 text-sm font-medium text-gray-700">Multi Agency</span>
          </div>
        </div>
      </div>

      {/* Priority Areas */}
      <div className="space-y-4">
        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 select-none">
          <Star className="text-gray-400 w-4 h-4" />
          Priority Areas *
        </label>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          {/* Default Options */}
          {defaultPriorities.map((priority) => (
            <div 
              key={priority}
              className={`flex items-center p-3 border rounded-xl cursor-pointer transition-colors duration-200 select-none ${
                isPrioritySelected(priority) ? 'border-black' : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => handlePriorityAreaChange(priority, !isPrioritySelected(priority))}
            >
              <input
                type="checkbox"
                checked={isPrioritySelected(priority)}
                readOnly
                className="h-5 w-5 text-[#C8102E] focus:ring-[#C8102E] border-gray-300 rounded pointer-events-none"
              />
              <span className="ml-3 text-sm font-medium text-gray-700">{priority}</span>
            </div>
          ))}

          {/* Custom Options (Added by user) - ONLY show if true */}
          {formData.priorityAreas && Object.entries(formData.priorityAreas as Record<string, boolean>)
            .filter(([key, value]) => !defaultPriorities.includes(key) && value === true) // Only show if not default AND value is true
            .map(([key]) => (
            <div 
              key={key} 
              className="flex items-center justify-between p-3 border border-black rounded-xl select-none"
            >
              <div className="flex items-center overflow-hidden">
                <input
                  type="checkbox"
                  checked={true}
                  readOnly
                  className="h-5 w-5 text-[#C8102E] focus:ring-[#C8102E] border-gray-300 rounded pointer-events-none flex-shrink-0"
                />
                <span className="ml-3 text-sm font-medium text-gray-700 truncate">{key}</span>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeletePriority(key);
                }}
                className="text-gray-400 hover:text-red-500 transition-colors ml-2"
              >
                <X className="cursor-pointer w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Add Custom Priority Area */}
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Add custom priority area..."
            value={customPriorityInput}
            onChange={(e) => setCustomPriorityInput(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-transparent text-sm"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddCustomPriority();
              }
            }}
          />
          <button
            type="button"
            onClick={handleAddCustomPriority}
            className="px-4 py-2 bg-[#C8102E] text-white rounded-xl hover:bg-[#A00E26] transition-colors flex items-center gap-2 text-sm font-medium"
          >
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>
      </div>

    </div>
  );
};

export default ResearchDetails;