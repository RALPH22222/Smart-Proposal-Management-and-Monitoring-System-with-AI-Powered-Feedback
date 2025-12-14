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
  X,
  Settings,
  MapPin,
  Building2,
  Trash2
} from 'lucide-react';
import type { FormData } from '../../../../types/proponent-form';

// --- IMPORT API SERVICES ---
import { 
  fetchStations, 
  fetchSectors, 
  fetchDisciplines, 
  fetchPriorities 
} from '../../../../services/proposal.api';

interface ResearchDetailsProps {
  formData: FormData;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onUpdate: (field: keyof FormData, value: any) => void;
}

const ResearchDetails: React.FC<ResearchDetailsProps> = ({ formData, onInputChange, onUpdate }) => {
  // --- Data Source State ---
  const [stationsList, setStationsList] = useState<string[]>([]);
  const [sectorsList, setSectorsList] = useState<string[]>([]);
  const [disciplinesList, setDisciplinesList] = useState<string[]>([]);
  const [prioritiesList, setPrioritiesList] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- UI State ---
  const [isResearchStationOpen, setIsResearchStationOpen] = useState(false);
  const [isSectorOpen, setIsSectorOpen] = useState(false);
  const [isDisciplineOpen, setIsDisciplineOpen] = useState(false);
  const [isPriorityOpen, setIsPriorityOpen] = useState(false);

  const [researchStationSearch, setResearchStationSearch] = useState('');
  const [sectorSearch, setSectorSearch] = useState('');
  const [disciplineSearch, setDisciplineSearch] = useState('');
  
  // Local State for Inputs
  const [priorityInput, setPriorityInput] = useState('');
  const [customResearchType, setCustomResearchType] = useState('');
  const [customDevelopmentType, setCustomDevelopmentType] = useState('');

  // --- NEW: Local State for Priority Areas (Fixes persistence issue) ---
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([]);

  // Filtered Lists State
  const [filteredResearchStations, setFilteredResearchStations] = useState<string[]>([]);
  const [filteredSectors, setFilteredSectors] = useState<string[]>([]);
  const [filteredDisciplines, setFilteredDisciplines] = useState<string[]>([]);
  const [filteredPriorities, setFilteredPriorities] = useState<string[]>([]);

  // Local Implementation Sites State
  const [implementationSites, setImplementationSites] = useState<{ site: string; city: string }[]>(
    (formData as any).implementationSite || [{ site: '', city: '' }] 
  );

  const researchStationRef = useRef<HTMLDivElement>(null);
  const sectorRef = useRef<HTMLDivElement>(null);
  const disciplineRef = useRef<HTMLDivElement>(null);
  const priorityRef = useRef<HTMLDivElement>(null);

  // --- 1. FETCH DATA ON MOUNT ---
  useEffect(() => {
    const loadData = async () => {
      try {
        const [stations, sectors, disciplines, priorities] = await Promise.all([
          fetchStations(),
          fetchSectors(),
          fetchDisciplines(),
          fetchPriorities()
        ]);

        setStationsList(stations.map((i: any) => i.name));
        setSectorsList(sectors.map((i: any) => i.name));
        setDisciplinesList(disciplines.map((i: any) => i.name));
        setPrioritiesList(priorities.map((i: any) => i.name));

      } catch (error) {
        console.error("Failed to load research details options", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  // --- 2. RESTORE DATA FROM FORM DATA ---
  useEffect(() => {
    // A. Restore Priority Areas (Convert Object to Array for Local State)
    if (formData.priorityAreas) {
      const activePriorities = Object.entries(formData.priorityAreas as Record<string, boolean>)
        .filter(([_, value]) => value === true)
        .map(([key]) => key);
      
      setSelectedPriorities(activePriorities);
    }

    // B. Restore "Other" Research Type
    if (formData.researchType?.other) {
        setCustomResearchType(formData.researchType.other);
    }

    // C. Restore "Other" Development Type
    if (formData.developmentType && 
        formData.developmentType !== 'pilotTesting' && 
        formData.developmentType !== 'techPromotion') {
        setCustomDevelopmentType(formData.developmentType);
    }
  }, [formData.priorityAreas, formData.researchType, formData.developmentType]);


  // --- 3. FILTERING EFFECTS ---
  useEffect(() => {
    setFilteredResearchStations(stationsList.filter(s => s.toLowerCase().includes(researchStationSearch.toLowerCase())));
  }, [researchStationSearch, stationsList]);

  useEffect(() => {
    setFilteredSectors(sectorsList.filter(s => s.toLowerCase().includes(sectorSearch.toLowerCase())));
  }, [sectorSearch, sectorsList]);

  useEffect(() => {
    setFilteredDisciplines(disciplinesList.filter(d => d.toLowerCase().includes(disciplineSearch.toLowerCase())));
  }, [disciplineSearch, disciplinesList]);

  useEffect(() => {
    setFilteredPriorities(prioritiesList.filter(p => p.toLowerCase().includes(priorityInput.toLowerCase())));
  }, [priorityInput, prioritiesList]);


  // --- 4. IMPLEMENTATION SITES LOGIC ---
  const handleModeChange = (mode: 'single' | 'multi') => {
    const newMode = {
      singleAgency: mode === 'single',
      multiAgency: mode === 'multi'
    };
    onUpdate('implementationMode', newMode);

    if (mode === 'multi' && implementationSites.length < 2) {
        const newSites = [...implementationSites];
        while(newSites.length < 2) newSites.push({ site: '', city: '' });
        setImplementationSites(newSites);
        onUpdate('implementationSite' as keyof FormData, newSites); 
    } else if (mode === 'single') {
        const singleSite = [implementationSites[0] || { site: '', city: '' }];
        setImplementationSites(singleSite);
        onUpdate('implementationSite' as keyof FormData, singleSite); 
    }
  };

  const handleSiteChange = (index: number, field: 'site' | 'city', value: string) => {
    const newSites = [...implementationSites];
    newSites[index] = { ...newSites[index], [field]: value };
    setImplementationSites(newSites);
    onUpdate('implementationSite' as keyof FormData, newSites); 
  };

  const addSiteRow = () => {
    const newSites = [...implementationSites, { site: '', city: '' }];
    setImplementationSites(newSites);
    onUpdate('implementationSite' as keyof FormData, newSites);
  };

  const removeSiteRow = (index: number) => {
    if (formData.implementationMode?.multiAgency && implementationSites.length <= 2) return;
    const newSites = implementationSites.filter((_, i) => i !== index);
    setImplementationSites(newSites);
    onUpdate('implementationSite' as keyof FormData, newSites);
  };


  // --- 5. GENERAL HANDLERS ---
  const handleTextSelect = (name: keyof FormData, value: string, setSearch: (s: string) => void, setOpen: (b: boolean) => void) => {
    onUpdate(name, value);
    setSearch(value);
    setOpen(false);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>, setSearch: (s: string) => void) => {
    setSearch(e.target.value);
    onInputChange(e);
  };

  const handleResearchTypeChange = (type: 'basic' | 'applied' | 'other', customValue?: string) => {
    const newResearchType = {
      basic: type === 'basic',
      applied: type === 'applied',
      other: type === 'other' ? (customValue || customResearchType) : undefined
    };

    if (type === 'other' && customValue !== undefined) {
      setCustomResearchType(customValue);
    }
    onUpdate('researchType', newResearchType);
  };

  const handleDevelopmentTypeChange = (type: 'pilotTesting' | 'techPromotion' | 'other', customValue?: string) => {
    let valueToSend = type;
    if (type === 'other') {
      valueToSend = (customValue || customDevelopmentType) as any; 
      if (customValue !== undefined) setCustomDevelopmentType(customValue);
    }
    onUpdate('developmentType', valueToSend);
  };

  // --- PRIORITY HANDLERS (UPDATED) ---
  const handlePrioritySelect = (value: string) => {
    setPriorityInput(value);
    setIsPriorityOpen(false);
  };

  const handleAddPriority = () => {
    if (!priorityInput.trim()) return;
    const newItem = priorityInput.trim();

    // 1. Update Local State (Array)
    if (!selectedPriorities.includes(newItem)) {
        const newSelected = [...selectedPriorities, newItem];
        setSelectedPriorities(newSelected);

        // 2. Update Form Data (Object)
        const currentPriorities = formData.priorityAreas || {};
        const newPriorityAreas = {
            ...currentPriorities,
            [newItem]: true
        };
        onUpdate('priorityAreas', newPriorityAreas);
    }
    
    setPriorityInput(''); 
  };

  const handleDeletePriority = (key: string) => {
    // 1. Update Local State
    const newSelected = selectedPriorities.filter(p => p !== key);
    setSelectedPriorities(newSelected);

    // 2. Update Form Data
    const newPriorityAreas = { ...(formData.priorityAreas || {}) } as Record<string, boolean>;
    delete newPriorityAreas[key]; // Remove the key entirely
    onUpdate('priorityAreas', newPriorityAreas);
  };

  // Click Outside Listener
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

  if (!formData) return <div className="p-4 text-gray-500">Loading...</div>;

  const isMulti = formData.implementationMode?.multiAgency;

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
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8102E] transition-all duration-200"
            placeholder={isLoading ? "Loading stations..." : "Search or type research station"}
          />
          {isResearchStationOpen && filteredResearchStations.length > 0 && (
            <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-xl shadow-lg max-h-60 overflow-y-auto">
              {filteredResearchStations.map((station, index) => (
                <div
                  key={index}
                  className="px-4 py-3 cursor-pointer hover:bg-gray-50 border-b border-gray-100 select-none"
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
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8102E]"
              placeholder={isLoading ? "Loading sectors..." : "Search or type sector"}
            />
            {isSectorOpen && filteredSectors.length > 0 && (
              <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                {filteredSectors.map((sector, index) => (
                  <div
                    key={index}
                    className="px-4 py-3 cursor-pointer hover:bg-gray-50 border-b border-gray-100 select-none"
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
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8102E]"
              placeholder={isLoading ? "Loading disciplines..." : "Search or type discipline"}
            />
            {isDisciplineOpen && filteredDisciplines.length > 0 && (
              <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                {filteredDisciplines.map((discipline, index) => (
                  <div
                    key={index}
                    className="px-4 py-3 cursor-pointer hover:bg-gray-50 border-b border-gray-100 select-none"
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

      {/* Mode of Implementation */}
      <div className="space-y-4">
        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 select-none">
          <Settings className="text-gray-400 w-4 h-4" />
          Mode of Implementation *
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md">
          <div 
            className={`flex items-center p-3 border rounded-xl cursor-pointer transition-colors duration-200 select-none ${!isMulti ? 'border-black bg-slate-50' : 'border-gray-200 hover:border-gray-300'}`}
            onClick={() => handleModeChange('single')}
          >
            <input type="radio" checked={!isMulti} readOnly className="h-5 w-5 text-[#C8102E] pointer-events-none" />
            <span className="ml-3 text-sm font-medium text-gray-700">Single Agency</span>
          </div>
          
          <div 
            className={`flex items-center p-3 border rounded-xl cursor-pointer transition-colors duration-200 select-none ${isMulti ? 'border-black bg-slate-50' : 'border-gray-200 hover:border-gray-300'}`}
            onClick={() => handleModeChange('multi')}
          >
            <input type="radio" checked={!!isMulti} readOnly className="h-5 w-5 text-[#C8102E] pointer-events-none" />
            <span className="ml-3 text-sm font-medium text-gray-700">Multiple Agency</span>
          </div>
        </div>
      </div>

      {/* --- IMPLEMENTATION SITES --- */}
      <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
         <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 select-none">
            <MapPin className="text-gray-400 w-4 h-4" />
            {isMulti ? 'Implementation Sites' : 'Implementation Site'} *
         </label>

         <div className="space-y-4">
            {implementationSites.map((item, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {/* Site Name Input */}
                 <div className="relative">
                    <input
                      type="text"
                      value={item.site}
                      onChange={(e) => handleSiteChange(index, 'site', e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8102E]"
                      placeholder={isMulti ? `Site Name ${index + 1}` : "Enter Site Name"}
                    />
                    <Building2 className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                 </div>

                 {/* City Input */}
                 <div className="flex gap-2">
                    <div className="relative flex-1">
                        <input
                          type="text"
                          value={item.city}
                          onChange={(e) => handleSiteChange(index, 'city', e.target.value)}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8102E]"
                          placeholder={isMulti ? `City/Municipality ${index + 1}` : "Enter City/Municipality"}
                        />
                        <MapPin className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                    </div>
                    {/* Remove Button */}
                    {isMulti && implementationSites.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeSiteRow(index)}
                        className="p-3 text-red-500 hover:bg-red-50 rounded-xl border border-red-100 hover:border-red-200 transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                 </div>
              </div>
            ))}

            {/* Add Button for Multi Mode */}
            {isMulti && (
              <button
                type="button"
                onClick={addSiteRow}
                className="flex items-center gap-2 text-sm text-[#C8102E] font-medium hover:underline px-1 mt-2"
              >
                <Plus className="w-4 h-4" />
                Add another site
              </button>
            )}
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
                onClick={() => onUpdate('classificationType', type)}
              >
                <input
                  type="radio"
                  name="classificationType"
                  checked={formData.classificationType === type}
                  readOnly
                  className="h-5 w-5 text-[#C8102E] pointer-events-none"
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

        {/* Selected Priority Chips (Using Local State for Persistence Check) */}
        {selectedPriorities.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {selectedPriorities.map((key) => (
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
              placeholder={isLoading ? "Loading priorities..." : "Select or type a priority area..."}
              value={priorityInput}
              onChange={(e) => setPriorityInput(e.target.value)}
              onFocus={() => setIsPriorityOpen(true)}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8102E] text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddPriority();
                }
              }}
            />
            {isPriorityOpen && filteredPriorities.length > 0 && (
              <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                {filteredPriorities.map((item, index) => (
                  <div
                    key={index}
                    className="px-4 py-3 cursor-pointer hover:bg-gray-50 border-b border-gray-100 select-none"
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
      </div>
    </div>
  );
};

export default ResearchDetails;