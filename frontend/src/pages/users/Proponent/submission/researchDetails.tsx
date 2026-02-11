import React, { useState, useEffect, useRef } from "react";
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
  Trash2,

} from 'lucide-react';

import type { FormData } from '../../../../types/proponent-form';
import Tooltip from '../../../../components/Tooltip';

// --- IMPORT API SERVICES ---
import { fetchStations, fetchSectors, fetchDisciplines, fetchPriorities } from "../../../../services/proposal.api";


interface ResearchDetailsProps {
  formData: FormData;
  onUpdate: (field: keyof FormData, value: any) => void;
}

// Fixed: Removed unused 'onInputChange' from destructuring
const ResearchDetails: React.FC<ResearchDetailsProps> = ({ formData, onUpdate }) => {
  // --- Data Source State ---
  const [stationsList, setStationsList] = useState<{ id: number; name: string }[]>([]);
  const [sectorsList, setSectorsList] = useState<{ id: number; name: string }[]>([]);
  const [disciplinesList, setDisciplinesList] = useState<{ id: number; name: string }[]>([]);
  const [prioritiesList, setPrioritiesList] = useState<{ id: number; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- UI State ---
  const [isResearchStationOpen, setIsResearchStationOpen] = useState(false);
  const [isSectorOpen, setIsSectorOpen] = useState(false);
  const [isDisciplineOpen, setIsDisciplineOpen] = useState(false);
  const [isPriorityOpen, setIsPriorityOpen] = useState(false);

  // Search term state controls filtering
  const [researchStationSearch, setResearchStationSearch] = useState(formData.researchStation || "");
  const [sectorSearch, setSectorSearch] = useState(formData.sector || "");
  const [disciplineSearch, setDisciplineSearch] = useState(formData.discipline || "");

  // Local State for Inputs
  const [priorityInput, setPriorityInput] = useState("");
  const [customResearchType, setCustomResearchType] = useState("");
  const [customDevelopmentType, setCustomDevelopmentType] = useState("");

  // --- NEW: Local State for Priority Areas ---
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([]);

  // Filtered Lists State
  const [filteredResearchStations, setFilteredResearchStations] = useState<typeof stationsList>([]);
  const [filteredSectors, setFilteredSectors] = useState<typeof sectorsList>([]);
  const [filteredDisciplines, setFilteredDisciplines] = useState<typeof disciplinesList>([]);
  const [filteredPriorities, setFilteredPriorities] = useState<typeof prioritiesList>([]);

  // --- Local Implementation Sites State (FIXED DEFAULT) ---
  const [implementationSites, setImplementationSites] = useState<{ site: string; city: string }[]>(() => {
    const existingSites = formData.implementation_site;
    // Check if it exists AND has items. If empty array, default to 1 row.
    if (existingSites && existingSites.length > 0) {
      return existingSites;
    }
    return [{ site: "", city: "" }];
  });

  const researchStationRef = useRef<HTMLDivElement>(null);
  const sectorRef = useRef<HTMLDivElement>(null);
  const disciplineRef = useRef<HTMLDivElement>(null);
  const priorityRef = useRef<HTMLDivElement>(null);



  // --- 1. FETCH DATA ON MOUNT ---
  useEffect(() => {
    const loadData = async () => {
      // 1. Prepare Static Data (SDGs) immediately
      // const sdgItems = SDG_GOALS.map((name, index) => ({
      //   id: 9000 + index,
      //   name: name,
      // }));

      // Initialize with SDGs so they appear even if API fails
      // setPrioritiesList(sdgItems);

      try {
        // 2. Fetch API Data with Fallbacks
        const [stations, sectors, disciplines, priorities] = await Promise.all([
          fetchStations().catch((err) => {
            console.warn("Stations fetch failed", err);
            return [];
          }),
          fetchSectors().catch((err) => {
            console.warn("Sectors fetch failed", err);
            return [];
          }),
          fetchDisciplines().catch((err) => {
            console.warn("Disciplines fetch failed", err);
            return [];
          }),
          fetchPriorities().catch((err) => {
            console.warn("Priorities fetch failed", err);
            return [];
          }),
        ]);

        if (stations && stations.length > 0) setStationsList(stations);
        if (sectors && sectors.length > 0) setSectorsList(sectors);
        if (disciplines && disciplines.length > 0) setDisciplinesList(disciplines);

        // Merge API priorities with SDG list
        if (priorities && priorities.length > 0) {
          setPrioritiesList([...priorities]);
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
    // A. Restore Priority Areas (stored as array of IDs - convert back to names for display)
    if (formData.priorities_id && Array.isArray(formData.priorities_id) && prioritiesList.length > 0) {
      const names = formData.priorities_id
        .map((id) => {
          const priority = prioritiesList.find((p) => p.id === id);
          return priority ? priority.name : null;
        })
        .filter((name): name is string => name !== null);
      setSelectedPriorities(names);
    }

    // B. Restore "Other" Research Type (if class_input is not basic/applied and classificiation_type is research)
    if (
      formData.classification_type === "research" &&
      formData.class_input &&
      formData.class_input !== "basic" &&
      formData.class_input !== "applied"
    ) {
      setCustomResearchType(formData.class_input);
    }

    // C. Restore "Other" Development Type (if class_input is not pilot_testing/tech_promotion and classificiation_type is development)
    if (
      formData.classification_type === "development" &&
      formData.class_input &&
      formData.class_input !== "pilot_testing" &&
      formData.class_input !== "tech_promotion"
    ) {
      setCustomDevelopmentType(formData.class_input);
    }

    // D. Sync Search State with form Data (using display name fields)
    if (formData.researchStation && !researchStationSearch) setResearchStationSearch(formData.researchStation);
    if (formData.sectorCommodity && !sectorSearch) setSectorSearch(formData.sectorCommodity);
    if (formData.disciplineName && !disciplineSearch) setDisciplineSearch(formData.disciplineName);
  }, [formData, prioritiesList]);

  // --- 3. FILTERING EFFECTS ---
  useEffect(() => {
    setFilteredResearchStations(
      stationsList.filter((s) => s.name.toLowerCase().includes(researchStationSearch.toLowerCase())),
    );
  }, [researchStationSearch, stationsList]);

  useEffect(() => {
    setFilteredSectors(sectorsList.filter((s) => s.name.toLowerCase().includes(String(sectorSearch).toLowerCase())));
  }, [sectorSearch, sectorsList]);

  useEffect(() => {
    setFilteredDisciplines(
      disciplinesList.filter((d) => d.name.toLowerCase().includes(String(disciplineSearch).toLowerCase())),
    );
  }, [disciplineSearch, disciplinesList]);

  useEffect(() => {
    setFilteredPriorities(prioritiesList.filter((p) => p.name.toLowerCase().includes(priorityInput.toLowerCase())));
  }, [priorityInput, prioritiesList]);

  // --- 4. IMPLEMENTATION SITES LOGIC (Updated to Derive Mode) ---

  // Helper to update both sites and the derived mode
  const updateSitesAndMode = (newSites: { site: string; city: string }[]) => {
    setImplementationSites(newSites);
    onUpdate("implementation_site", newSites);

    // Note: implementation_mode is derived in proposal.api.ts based on site count
    // No need to store it separately in formData
  };

  const handleSiteChange = (index: number, field: "site" | "city", value: string) => {
    const newSites = [...implementationSites];
    newSites[index] = { ...newSites[index], [field]: value };
    updateSitesAndMode(newSites);
  };

  const addSiteRow = () => {
    const newSites = [...implementationSites, { site: "", city: "" }];
    updateSitesAndMode(newSites);
  };

  const removeSiteRow = (index: number) => {
    // Prevent deleting the last remaining row
    if (implementationSites.length <= 1) return;

    const newSites = implementationSites.filter((_, i) => i !== index);
    updateSitesAndMode(newSites);
  };

  // --- 5. GENERAL HANDLERS ---

  // --- Handler for Research Station (Department) ---
  const handleStationSelect = (station: { id: number; name: string }) => {
    setResearchStationSearch(station.name);
    onUpdate("researchStation", station.name); // Display name
    onUpdate("department", station.id); // Store ID for backend
    setIsResearchStationOpen(false);
  };

  const handleStationChange = (value: string) => {
    setResearchStationSearch(value);
    onUpdate("researchStation", value);
    // If typing custom, store the name (backend will resolve)
    onUpdate("department", value);
  };

  // --- Handler for Sector ---
  const handleSectorSelect = (sector: { id: number; name: string }) => {
    setSectorSearch(sector.name);
    onUpdate("sectorCommodity", sector.name); // Display name
    onUpdate("sector", sector.id); // Store ID for backend
    setIsSectorOpen(false);
  };

  const handleSectorChange = (value: string) => {
    setSectorSearch(value);
    onUpdate("sectorCommodity", value);
    // If typing custom, store the name (backend will resolve)
    onUpdate("sector", value);
  };

  // --- Handler for Discipline ---
  const handleDisciplineSelect = (discipline: { id: number; name: string }) => {
    setDisciplineSearch(discipline.name);
    onUpdate("disciplineName", discipline.name); // Display name
    onUpdate("discipline", discipline.id); // Store ID for backend
    setIsDisciplineOpen(false);
  };

  const handleDisciplineChange = (value: string) => {
    setDisciplineSearch(value);
    onUpdate("disciplineName", value);
    // If typing custom, store the name (backend will resolve)
    onUpdate("discipline", value);
  };



  const handleResearchTypeChange = (type: "basic" | "applied" | "other", customValue?: string) => {
    let classInput = type;
    if (type === "other") {
      classInput = (customValue || customResearchType) as any;
      if (customValue !== undefined) setCustomResearchType(customValue);
    }
    // Update class_input with the selected research type
    onUpdate("class_input", classInput);
  };

  const handleDevelopmentTypeChange = (type: "pilot_testing" | "tech_promotion" | "other", customValue?: string) => {
    let classInput = type;
    if (type === "other") {
      classInput = (customValue || customDevelopmentType) as any;
      if (customValue !== undefined) setCustomDevelopmentType(customValue);
    }
    // Update class_input with the selected development type
    onUpdate("class_input", classInput);
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
      // Add name to display list
      const newSelected = [...selectedPriorities, newItem];
      setSelectedPriorities(newSelected);

      // Find ID from prioritiesList - backend expects numeric IDs
      const priorityEntry = prioritiesList.find((p) => p.name === newItem);
      const currentIds = (formData.priorities_id || []).filter((id): id is number => typeof id === "number");

      if (priorityEntry) {
        // Add the ID to formData
        const newIds = [...currentIds, priorityEntry.id];
        onUpdate("priorities_id", newIds);
      } else {
        // Custom priority not in list - backend should handle name resolution
        // For now, skip adding to IDs (or backend schema needs to accept strings)
        console.warn(`Priority "${newItem}" not found in list - skipping ID storage`);
      }
    }

    setPriorityInput("");
  };

  const handleDeletePriority = (key: string) => {
    // Remove name from display list
    const newSelected = selectedPriorities.filter((p) => p !== key);
    setSelectedPriorities(newSelected);

    // Find and remove the corresponding ID
    const priorityEntry = prioritiesList.find((p) => p.name === key);
    if (priorityEntry) {
      const currentIds = (formData.priorities_id || []).filter((id): id is number => typeof id === "number");
      const newIds = currentIds.filter((id) => id !== priorityEntry.id);
      onUpdate("priorities_id", newIds);
    }
  };

  // Click Outside Listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (researchStationRef.current && !researchStationRef.current.contains(event.target as Node))
        setIsResearchStationOpen(false);
      if (sectorRef.current && !sectorRef.current.contains(event.target as Node)) setIsSectorOpen(false);
      if (disciplineRef.current && !disciplineRef.current.contains(event.target as Node)) setIsDisciplineOpen(false);
      if (priorityRef.current && !priorityRef.current.contains(event.target as Node)) setIsPriorityOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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
          <Tooltip content="The research institution or facility that will conduct the research or development activities" />
        </label>
        <div className="relative">
          <input
            type="text"
            name="researchStation"
            value={researchStationSearch}
            onChange={(e) => handleStationChange(e.target.value)}
            onFocus={() => setIsResearchStationOpen(true)}
            onBlur={() => setTimeout(() => setIsResearchStationOpen(false), 200)}
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
                  onClick={() => handleStationSelect(station)}
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
            <Tooltip content="The agricultural or economic sector that the project will address (e.g., Crops, Livestock, Fisheries, Agribusiness)" />
          </label>
          <div className="relative">
            <input
              type="text"
              name="sectorCommodity"
              value={sectorSearch}
              onChange={(e) => handleSectorChange(e.target.value)}
              onFocus={() => setIsSectorOpen(true)}
              onBlur={() => setTimeout(() => setIsSectorOpen(false), 200)}
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
                    onClick={() => handleSectorSelect(sector)}
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
            <Tooltip content="The scientific or technical field or specialization relevant to the project (e.g., Agricultural Engineering, Biotechnology, Horticulture)" />
          </label>
          <div className="relative">
            <input
              type="text"
              name="discipline"
              value={disciplineSearch}
              onChange={(e) => handleDisciplineChange(e.target.value)}
              onFocus={() => setIsDisciplineOpen(true)}
              onBlur={() => setTimeout(() => setIsDisciplineOpen(false), 200)}
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
                    onClick={() => handleDisciplineSelect(discipline)}
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
            <Tooltip content="The specific locations or cities where the project will be implemented. Add multiple sites if the project spans different areas." />
          </label>

          {/* Display Current Mode Badge */}
          <span className={`text-xs px-2 py-1 rounded-full ${implementationSites.length > 1 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
            <span className='font-bold'>Mode of Implementation:</span> {implementationSites.length > 1 ? 'Multiple Agency' : 'Single Agency'}
          </span>
        </div>

        {/* Display Current Mode Badge */}
        <span
          className={`text-xs px-2 py-1 rounded-full ${implementationSites.length > 1 ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"}`}
        >
          <span className="font-bold">Mode of Implementation:</span>{" "}
          {implementationSites.length > 1 ? "Multiple Agency" : "Single Agency"}
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
                onChange={(e) => handleSiteChange(index, "site", e.target.value)}
                maxLength={256}
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
                  onChange={(e) => handleSiteChange(index, "city", e.target.value)}
                  maxLength={256}
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


      {/* Classification Type Selection */}
      <div className="space-y-6">
        <div className="space-y-4">
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 select-none">
            <FolderOpen className="text-gray-400 w-4 h-4" />
            Classification Type *
            <Tooltip content="Choose whether the project is primarily focused on Research (generating new knowledge) or Development (implementing/commercializing technologies)" />
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {["research", "development"].map((type) => (
              <div
                key={type}
                className={`flex items-center p-3 border rounded-xl cursor-pointer transition-colors duration-200 select-none ${formData.classification_type === type ? "border-black" : "border-gray-200 hover:border-gray-300"
                  }`}
                onClick={() => {
                  onUpdate("classification_type", type);
                  onUpdate("class_input", ""); // Reset class_input when switching classification type
                }}
              >
                <input
                  type="radio"
                  name="classification_type"
                  checked={formData.classification_type === type}
                  readOnly
                  className="h-5 w-5 text-[#C8102E] pointer-events-none"
                />
                <span className="ml-3 text-sm font-medium text-gray-700 capitalize">{type} Classification</span>
              </div>
            ))}
          </div>
        </div>

        {/* Research Classification */}
        {formData.classification_type === "research" && (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 select-none">
              <Search className="text-gray-400 w-4 h-4" />
              Research Classification *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div
                className={`flex items-center p-3 border rounded-xl cursor-pointer transition-colors duration-200 select-none ${formData.class_input === "basic" ? "border-black" : "border-gray-200 hover:border-gray-300"}`}
                onClick={() => handleResearchTypeChange("basic")}
              >
                <input
                  type="radio"
                  checked={formData.class_input === "basic"}
                  readOnly
                  className="h-5 w-5 text-[#C8102E] pointer-events-none"
                />
                <span className="ml-3 text-sm font-medium text-gray-700">Basic Research</span>
              </div>
              <div
                className={`flex items-center p-3 border rounded-xl cursor-pointer transition-colors duration-200 select-none ${formData.class_input === "applied" ? "border-black" : "border-gray-200 hover:border-gray-300"}`}
                onClick={() => handleResearchTypeChange("applied")}
              >
                <input
                  type="radio"
                  checked={formData.class_input === "applied"}
                  readOnly
                  className="h-5 w-5 text-[#C8102E] pointer-events-none"
                />
                <span className="ml-3 text-sm font-medium text-gray-700">Applied Research</span>
              </div>
              {/* Custom Research Type */}
              <div
                className={`flex flex-col p-3 border rounded-xl cursor-pointer transition-colors duration-200 select-none sm:col-span-2 ${formData.class_input && formData.class_input !== "basic" && formData.class_input !== "applied" ? "border-black" : "border-gray-200 hover:border-gray-300"}`}
                onClick={(e) => {
                  if ((e.target as HTMLElement).tagName !== "INPUT") {
                    handleResearchTypeChange("other", customResearchType || " ");
                  }
                }}
              >
                <div className="flex items-center">
                  <input
                    type="radio"
                    checked={!!(formData.class_input && formData.class_input !== "basic" && formData.class_input !== "applied")}
                    readOnly
                    className="h-5 w-5 text-[#C8102E] pointer-events-none"
                  />
                  <span className="ml-3 text-sm font-medium text-gray-700">Other (Specify)</span>
                </div>
                {formData.class_input && formData.class_input !== "basic" && formData.class_input !== "applied" && (
                  <input
                    type="text"
                    value={customResearchType === " " ? "" : customResearchType}
                    onChange={(e) => handleResearchTypeChange("other", e.target.value || " ")}
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
        {formData.classification_type === "development" && (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 select-none">
              <Rocket className="text-gray-400 w-4 h-4" />
              Development Classification *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div
                className={`flex items-center p-3 border rounded-xl cursor-pointer transition-colors duration-200 select-none ${formData.class_input === "pilot_testing" ? "border-black" : "border-gray-200 hover:border-gray-300"}`}
                onClick={() => handleDevelopmentTypeChange("pilot_testing")}
              >
                <input
                  type="radio"
                  checked={formData.class_input === "pilot_testing"}
                  readOnly
                  className="h-5 w-5 text-[#C8102E] pointer-events-none"
                />
                <span className="ml-3 text-sm font-medium text-gray-700">Pilot Testing</span>
              </div>
              <div
                className={`flex items-center p-3 border rounded-xl cursor-pointer transition-colors duration-200 select-none ${formData.class_input === "tech_promotion" ? "border-black" : "border-gray-200 hover:border-gray-300"}`}
                onClick={() => handleDevelopmentTypeChange("tech_promotion")}
              >
                <input
                  type="radio"
                  checked={formData.class_input === "tech_promotion"}
                  readOnly
                  className="h-5 w-5 text-[#C8102E] pointer-events-none"
                />
                <span className="ml-3 text-sm font-medium text-gray-700">Technology Promotion/Commercialization</span>
              </div>
              {/* Custom Development Type */}
              <div
                className={`flex flex-col p-3 border rounded-xl cursor-pointer transition-colors duration-200 select-none sm:col-span-2 ${formData.class_input && formData.class_input !== "pilot_testing" && formData.class_input !== "tech_promotion"
                  ? "border-black"
                  : "border-gray-200 hover:border-gray-300"
                  }`}
                onClick={(e) => {
                  if ((e.target as HTMLElement).tagName !== "INPUT") {
                    handleDevelopmentTypeChange("other", customDevelopmentType || " ");
                  }
                }}
              >
                <div className="flex items-center">
                  <input
                    type="radio"
                    checked={!!(formData.class_input && formData.class_input !== "pilot_testing" && formData.class_input !== "tech_promotion")}
                    readOnly
                    className="h-5 w-5 text-[#C8102E] pointer-events-none"
                  />
                  <span className="ml-3 text-sm font-medium text-gray-700">Other (Specify)</span>
                </div>
                {formData.class_input && formData.class_input !== "pilot_testing" && formData.class_input !== "tech_promotion" && (
                  <input
                    type="text"
                    value={customDevelopmentType === " " ? "" : customDevelopmentType}
                    onChange={(e) => handleDevelopmentTypeChange("other", e.target.value || " ")}
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
          <Tooltip content="The Sustainable Development Goals (SDGs) or strategic priority areas that the project contributes to or addresses" />
        </label>

        {/* Selected Priority Chips */}
        {selectedPriorities.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {selectedPriorities.map((key) => (
              <div
                key={key}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-sm font-medium"
              >
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
                if (e.key === "Enter") {
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
        <p className="text-xs text-gray-500">Select from the list or type your own custom priority area.</p>
      </div>

    </div >
  );
};

export default ResearchDetails;