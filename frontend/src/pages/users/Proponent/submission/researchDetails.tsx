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

// --- SDG CONSTANT LIST ---
const SDG_GOALS = [
  "SDG 1: No Poverty",
  "SDG 2: Zero Hunger",
  "SDG 3: Good Health and Well-being",
  "SDG 4: Quality Education",
  "SDG 5: Gender Equality",
  "SDG 6: Clean Water and Sanitation",
  "SDG 7: Affordable and Clean Energy",
  "SDG 8: Decent Work and Economic Growth",
  "SDG 9: Industry, Innovation and Infrastructure",
  "SDG 10: Reduced Inequalities",
  "SDG 11: Sustainable Cities and Communities",
  "SDG 12: Responsible Consumption and Production",
  "SDG 13: Climate Action",
  "SDG 14: Life Below Water",
  "SDG 15: Life on Land",
  "SDG 16: Peace, Justice and Strong Institutions",
  "SDG 17: Partnerships for the Goals"
];

interface ResearchDetailsProps {
  formData: FormData;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onUpdate: (field: keyof FormData, value: any) => void;
}

const ResearchDetails: React.FC<ResearchDetailsProps> = ({ formData, onInputChange, onUpdate }) => {
  // --- Data Source State ---
  const [stationsList, setStationsList] = useState<{ id: number, name: string }[]>([]);
  const [sectorsList, setSectorsList] = useState<{ id: number, name: string }[]>([]);
  const [disciplinesList, setDisciplinesList] = useState<{ id: number, name: string }[]>([]);
  const [prioritiesList, setPrioritiesList] = useState<{ id: number, name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- UI State ---
  const [isResearchStationOpen, setIsResearchStationOpen] = useState(false);
  const [isSectorOpen, setIsSectorOpen] = useState(false);
  const [isDisciplineOpen, setIsDisciplineOpen] = useState(false);
  const [isPriorityOpen, setIsPriorityOpen] = useState(false);

  // Search term state controls filtering
  const [researchStationSearch, setResearchStationSearch] = useState(formData.researchStation || '');
  const [sectorSearch, setSectorSearch] = useState(formData.sectorCommodity || '');
  const [disciplineSearch, setDisciplineSearch] = useState(formData.discipline || '');
  
  // Local State for Inputs
  const [priorityInput, setPriorityInput] = useState('');
  const [customResearchType, setCustomResearchType] = useState('');
  const [customDevelopmentType, setCustomDevelopmentType] = useState('');

  // --- NEW: Local State for Priority Areas ---
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([]);

  // Filtered Lists State
  const [filteredResearchStations, setFilteredResearchStations] = useState<typeof stationsList>([]);
  const [filteredSectors, setFilteredSectors] = useState<typeof sectorsList>([]);
  const [filteredDisciplines, setFilteredDisciplines] = useState<typeof disciplinesList>([]);
  const [filteredPriorities, setFilteredPriorities] = useState<typeof prioritiesList>([]);

  // --- Local Implementation Sites State (FIXED DEFAULT) ---
  const [implementationSites, setImplementationSites] = useState<{ site: string; city: string }[]>(() => {
    const existingSites = (formData as any).implementationSite;
    // Check if it exists AND has items. If empty array, default to 1 row.
    if (existingSites && existingSites.length > 0) {
      return existingSites;
    }
    return [{ site: '', city: '' }];
  });

  const researchStationRef = useRef<HTMLDivElement>(null);
  const sectorRef = useRef<HTMLDivElement>(null);
  const disciplineRef = useRef<HTMLDivElement>(null);
  const priorityRef = useRef<HTMLDivElement>(null);

  // --- 1. FETCH DATA ON MOUNT ---
  useEffect(() => {
    const loadData = async () => {
      // 1. Prepare Static Data (SDGs) immediately
      const sdgItems = SDG_GOALS.map((name, index) => ({ 
          id: 9000 + index, 
          name: name 
      }));
      
      // Initialize with SDGs so they appear even if API fails
      setPrioritiesList(sdgItems);

      try {
        // 2. Fetch API Data with Fallbacks
        const [stations, sectors, disciplines, priorities] = await Promise.all([
          fetchStations().catch(err => { console.warn("Stations fetch failed", err); return []; }),
          fetchSectors().catch(err => { console.warn("Sectors fetch failed", err); return []; }),
          fetchDisciplines().catch(err => { console.warn("Disciplines fetch failed", err); return []; }),
          fetchPriorities().catch(err => { console.warn("Priorities fetch failed", err); return []; })
        ]);

        if (stations && stations.length > 0) setStationsList(stations);
        if (sectors && sectors.length > 0) setSectorsList(sectors);
        if (disciplines && disciplines.length > 0) setDisciplinesList(disciplines);
        
        // Merge API priorities with SDG list
        if (priorities && priorities.length > 0) {
           setPrioritiesList([...priorities, ...sdgItems]);
        } else {
           setPrioritiesList(sdgItems);
        }

      } catch (error) {
        console.error("Critical error loading research details options", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  // --- 2. RESTORE DATA FROM FORM DATA ---
  useEffect(() => {
    // A. Restore Priority Areas
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
    
    // D. Sync Search State with form Data
    if (formData.researchStation && !researchStationSearch) setResearchStationSearch(formData.researchStation);
    if (formData.sectorCommodity && !sectorSearch) setSectorSearch(formData.sectorCommodity);
    if (formData.discipline && !disciplineSearch) setDisciplineSearch(formData.discipline);

  }, [formData]);


  // --- 3. FILTERING EFFECTS ---
  useEffect(() => {
    setFilteredResearchStations(stationsList.filter(s => s.name.toLowerCase().includes(researchStationSearch.toLowerCase())));
  }, [researchStationSearch, stationsList]);

  useEffect(() => {
    setFilteredSectors(sectorsList.filter(s => s.name.toLowerCase().includes(sectorSearch.toLowerCase())));
  }, [sectorSearch, sectorsList]);

  useEffect(() => {
    setFilteredDisciplines(disciplinesList.filter(d => d.name.toLowerCase().includes(disciplineSearch.toLowerCase())));
  }, [disciplineSearch, disciplinesList]);

  useEffect(() => {
    setFilteredPriorities(prioritiesList.filter(p => p.name.toLowerCase().includes(priorityInput.toLowerCase())));
  }, [priorityInput, prioritiesList]);


  // --- 4. IMPLEMENTATION SITES LOGIC (Updated to Derive Mode) ---
  
  // Helper to update both sites and the derived mode
  const updateSitesAndMode = (newSites: { site: string; city: string }[]) => {
    setImplementationSites(newSites);
    onUpdate('implementationSite' as keyof FormData, newSites); 

    // Automatically determine mode based on number of sites
    const isMulti = newSites.length > 1;
    const newMode = {
        singleAgency: !isMulti,
        multiAgency: isMulti
    };
    onUpdate('implementationMode', newMode);
  };

  const handleSiteChange = (index: number, field: 'site' | 'city', value: string) => {
    const newSites = [...implementationSites];
    newSites[index] = { ...newSites[index], [field]: value };
    updateSitesAndMode(newSites);
  };

  const addSiteRow = () => {
    const newSites = [...implementationSites, { site: '', city: '' }];
    updateSitesAndMode(newSites);
  };

  const removeSiteRow = (index: number) => {
    // Prevent deleting the last remaining row
    if (implementationSites.length <= 1) return;
    
    const newSites = implementationSites.filter((_, i) => i !== index);
    updateSitesAndMode(newSites);
  };


  // --- 5. GENERAL HANDLERS ---

  const handleTextSelect = (name: keyof FormData, value: string, setSearch: (s: string) => void, setOpen: (b: boolean) => void) => {
    onUpdate(name, value);
    setSearch(value);
    setOpen(false);
  };

  const handleTextChange = (name: keyof FormData, value: string, setSearch: (s: string) => void) => {
    setSearch(value);
    onUpdate(name, value);
  };

  const handleTextBlur = (name: keyof FormData, value: string, setOpen: (b: boolean) => void) => {
    onUpdate(name, value.trim());
    setTimeout(() => setOpen(false), 200); 
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

  // --- PRIORITY HANDLERS ---
  const handlePrioritySelect = (value: string) => {
    setPriorityInput(value);
    setIsPriorityOpen(false);
  };

  const handleAddPriority = () => {
    if (!priorityInput.trim()) return;
    const newItem = priorityInput.trim();

    if (!selectedPriorities.includes(newItem)) {
        const newSelected = [...selectedPriorities, newItem];
        setSelectedPriorities(newSelected);

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
    const newSelected = selectedPriorities.filter(p => p !== key);
    setSelectedPriorities(newSelected);

    const newPriorityAreas = { ...(formData.priorityAreas || {}) } as Record<string, boolean>;
    delete newPriorityAreas[key];
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
            value={researchStationSearch}
            onChange={(e) => handleTextChange('researchStation', e.target.value, setResearchStationSearch)}
            onFocus={() => setIsResearchStationOpen(true)}
            onBlur={(e) => handleTextBlur('researchStation', e.target.value, setIsResearchStationOpen)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8102E] transition-all duration-200"
            placeholder={isLoading ? "Loading stations..." : "Search or type research station"}
          />
          {isResearchStationOpen && filteredResearchStations.length > 0 && (
            <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-xl shadow-lg max-h-60 overflow-y-auto">
              {filteredResearchStations.map((station, index) => (
                <div
                  key={station.id || index}
                  className="px-4 py-3 cursor-pointer hover:bg-gray-50 border-b border-gray-100 select-none"
                  onMouseDown={(e) => e.preventDefault()} 
                  onClick={() => handleTextSelect('researchStation', station.name, setResearchStationSearch, setIsResearchStationOpen)}
                >
                  <span className="text-sm text-gray-700">{station.name}</span>
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
              value={sectorSearch}
              onChange={(e) => handleTextChange('sectorCommodity', e.target.value, setSectorSearch)}
              onFocus={() => setIsSectorOpen(true)}
              onBlur={(e) => handleTextBlur('sectorCommodity', e.target.value, setIsSectorOpen)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8102E]"
              placeholder={isLoading ? "Loading sectors..." : "Search or type sector"}
            />
            {isSectorOpen && filteredSectors.length > 0 && (
              <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                {filteredSectors.map((sector, index) => (
                  <div
                    key={sector.id || index}
                    className="px-4 py-3 cursor-pointer hover:bg-gray-50 border-b border-gray-100 select-none"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleTextSelect('sectorCommodity', sector.name, setSectorSearch, setIsSectorOpen)}
                  >
                    <span className="text-sm text-gray-700">{sector.name}</span>
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
              value={disciplineSearch}
              onChange={(e) => handleTextChange('discipline', e.target.value, setDisciplineSearch)}
              onFocus={() => setIsDisciplineOpen(true)}
              onBlur={(e) => handleTextBlur('discipline', e.target.value, setIsDisciplineOpen)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8102E]"
              placeholder={isLoading ? "Loading disciplines..." : "Search or type discipline"}
            />
            {isDisciplineOpen && filteredDisciplines.length > 0 && (
              <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                {filteredDisciplines.map((discipline, index) => (
                  <div
                    key={discipline.id || index}
                    className="px-4 py-3 cursor-pointer hover:bg-gray-50 border-b border-gray-100 select-none"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleTextSelect('discipline', discipline.name, setDisciplineSearch, setIsDisciplineOpen)}
                  >
                    <span className="text-sm text-gray-700">{discipline.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- IMPLEMENTATION SITES (Derived Mode Logic) --- */}
      <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
         <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 select-none">
                <MapPin className="text-gray-400 w-4 h-4" />
                Implementation Sites *
            </label>
            
            {/* Display Current Mode Badge */}
            <span className={`text-xs px-2 py-1 rounded-full ${implementationSites.length > 1 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                <span className='font-bold'>Mode of Implementation:</span> {implementationSites.length > 1 ? 'Multiple Agency' : 'Single Agency'}
            </span>
         </div>

         <div className="space-y-4">
            {implementationSites.map((item, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {/* Site Name Input */}
                 <div className="relative">
                    <input
                      type="text"
                      value={item.site}
                      onChange={(e) => handleSiteChange(index, 'site', e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8102E] transition-all duration-200"
                      placeholder={`Site Name ${index + 1}`}
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
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8102E] transition-all duration-200"
                          placeholder={`City/Municipality ${index + 1}`}
                        />
                        <MapPin className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                    </div>
                    {/* Remove Button (Only if > 1 site) */}
                    {implementationSites.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeSiteRow(index)}
                        className="p-3 text-red-500 hover:bg-red-50 rounded-xl border border-red-100 hover:border-red-200 transition-colors"
                        title="Remove Site"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                 </div>
              </div>
            ))}

            {/* Always visible Add Button */}
            <button
              type="button"
              onClick={addSiteRow}
              className="flex items-center gap-2 text-sm text-[#C8102E] font-medium hover:underline px-1 mt-2"
            >
              <Plus className="w-4 h-4" />
              Add another site
            </button>
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

        {/* Selected Priority Chips */}
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
              placeholder={isLoading ? "Loading priorities..." : "Select or type a priority area (e.g. SDG 1)..."}
              value={priorityInput}
              onChange={(e) => setPriorityInput(e.target.value)}
              onFocus={() => setIsPriorityOpen(true)}
              onBlur={() => setTimeout(() => setIsPriorityOpen(false), 200)}
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
                    key={item.id || index}
                    className="px-4 py-3 cursor-pointer hover:bg-gray-50 border-b border-gray-100 select-none"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handlePrioritySelect(item.name)}
                  >
                    <span className="text-sm text-gray-700">{item.name}</span>
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