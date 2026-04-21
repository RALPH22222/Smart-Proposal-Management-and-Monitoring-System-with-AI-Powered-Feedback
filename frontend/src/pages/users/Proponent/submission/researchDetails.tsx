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
  Lock,
} from 'lucide-react';

import type { FormData } from '../../../../types/proponent-form';
import Tooltip from '../../../../components/Tooltip';
import AutoFillBadge from '../../../../components/shared/AutoFillBadge';

// --- IMPORT LOOKUP CONTEXT ---
import { useLookups } from "../../../../context/LookupContext";
import { useAuthContext } from "../../../../context/AuthContext";


interface ResearchDetailsProps {
  formData: FormData;
  onUpdate: (field: keyof FormData, value: any) => void;
  autoFilledFields?: Set<string>;
  /** Raw text autofill detected for strict lookups that don't match. Keys: "sector" | "discipline" | "priorities". */
  autoFillUnmatched?: Record<string, string>;
  /** Clear one unmatched hint once the proponent picks a real value. */
  onResolveUnmatched?: (key: string) => void;
}

// Fixed: Removed unused 'onInputChange' from destructuring
const ResearchDetails: React.FC<ResearchDetailsProps> = ({
  formData,
  onUpdate,
  autoFilledFields = new Set(),
  autoFillUnmatched = {},
  onResolveUnmatched,
}) => {
  const lookups = useLookups();
  const { user } = useAuthContext();

  // --- Data Source State ---
  const [sectorsList, setSectorsList] = useState<{ id: number; name: string }[]>([]);
  const [disciplinesList, setDisciplinesList] = useState<{ id: number; name: string }[]>([]);
  const [prioritiesList, setPrioritiesList] = useState<{ id: number; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- UI State ---
  const [isSectorOpen, setIsSectorOpen] = useState(false);
  const [isDisciplineOpen, setIsDisciplineOpen] = useState(false);
  const [isPriorityOpen, setIsPriorityOpen] = useState(false);

  // Search term state controls filtering
  const [researchStationSearch, setResearchStationSearch] = useState(formData.researchStation || "");
  const [sectorSearch, setSectorSearch] = useState(formData.sectorCommodity || "");
  const [disciplineSearch, setDisciplineSearch] = useState(formData.disciplineName || "");

  // Local State for Inputs
  const [priorityInput, setPriorityInput] = useState("");
  const [customResearchType, setCustomResearchType] = useState("");
  const [customDevelopmentType, setCustomDevelopmentType] = useState("");

  // --- NEW: Local State for Priority Areas ---
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([]);

  // Filtered Lists State
  const [filteredSectors, setFilteredSectors] = useState<typeof sectorsList>([]);
  const [filteredDisciplines, setFilteredDisciplines] = useState<typeof disciplinesList>([]);
  const [filteredPriorities, setFilteredPriorities] = useState<typeof prioritiesList>([]);

  // --- PSGC Cities ---
  const [psgcCities, setPsgcCities] = useState<{ code: string; name: string; isZamboanga?: boolean }[]>([]);
  const [activeCityDropdownIndex, setActiveCityDropdownIndex] = useState<number | null>(null);

  // --- Local Implementation Sites State (FIXED DEFAULT) ---
  const [implementationSites, setImplementationSites] = useState<{ site: string; city: string }[]>(() => {
    const existingSites = formData.implementation_site;
    // Check if it exists AND has items. If empty array, default to 1 row.
    if (existingSites && existingSites.length > 0) {
      return existingSites;
    }
    return [{ site: "", city: "" }];
  });

  // Track which site rows have an invalid (non-PSGC) city typed
  const [cityErrors, setCityErrors] = useState<boolean[]>([]);

  const researchStationRef = useRef<HTMLDivElement>(null);
  const sectorRef = useRef<HTMLDivElement>(null);
  const disciplineRef = useRef<HTMLDivElement>(null);
  const priorityRef = useRef<HTMLDivElement>(null);



  // --- 1. LOAD LOOKUP DATA FROM CONTEXT ---
  useEffect(() => {
    if (!lookups.loading) {
      if (lookups.sectors.length > 0) setSectorsList(lookups.sectors);
      if (lookups.disciplines.length > 0) setDisciplinesList(lookups.disciplines);
      if (lookups.priorities.length > 0) setPrioritiesList([...lookups.priorities]);
      setIsLoading(false);
    }
  }, [lookups.loading]);

  // --- AUTO-FILL R&D STATION FROM USER'S DEPARTMENT ---
  useEffect(() => {
    if (user?.department_id && user?.department_name) {
      onUpdate("department", user.department_id);
      onUpdate("researchStation", user.department_name);
      setResearchStationSearch(user.department_name);
    }
  }, [user?.department_id, user?.department_name]);

  useEffect(() => {

    // --- LOAD PSGC CITIES ---
    const loadCities = async () => {
      try {
        const response = await fetch("https://psgc.cloud/api/cities-municipalities");
        if (response.ok) {
          const data = await response.json();
          let mapped = data.map((d: any) => {
            let formattedName = d.name.replace(/Ã±/g, "ñ").replace(/Ã‘/g, "Ñ");
            if (formattedName.startsWith("City of ")) {
              formattedName = formattedName.replace("City of ", "") + " City";
            }
            return {
              code: d.code,
              name: formattedName,
              isZamboanga: d.code === "0931700000" || d.name === "City of Zamboanga"
            };
          });

          // Remove duplicates
          const uniqueNames = new Set();
          mapped = mapped.filter((city: any) => {
            if (!uniqueNames.has(city.name)) {
              uniqueNames.add(city.name);
              return true;
            }
            return false;
          });

          mapped.sort((a: any, b: any) => {
            if (a.isZamboanga) return -1;
            if (b.isZamboanga) return 1;
            return a.name.localeCompare(b.name);
          });

          setPsgcCities(mapped);
        }
      } catch (error) {
        console.error("Error fetching PSGC cities:", error);
      }
    };
    loadCities();
  }, []);

  // --- 2. RESTORE DATA FROM FORM DATA ---
  useEffect(() => {
    // A. Restore Priority Areas (stored as array of IDs - convert back to names for display)
    if (formData.priorities_id && Array.isArray(formData.priorities_id) && prioritiesList.length > 0) {
      const names = formData.priorities_id
        .map((id) => {
          // IDs may be numeric (DB match) or string names (no DB match / custom)
          if (typeof id === "number") {
            const priority = prioritiesList.find((p) => p.id === id);
            return priority ? priority.name : null;
          }
          // String fallback — the raw name was stored directly
          return String(id);
        })
        .filter((name): name is string => !!name);

      // Merge with any `priorities_names` set by autofill (for unmatched raw terms)
      const extra: string[] = Array.isArray((formData as any).priorities_names)
        ? (formData as any).priorities_names.filter((n: string) => !names.includes(n))
        : [];

      setSelectedPriorities([...names, ...extra]);
    } else if (Array.isArray((formData as any).priorities_names) && (formData as any).priorities_names.length > 0) {
      // No IDs yet (e.g. no DB match at all) but names were autofilled — show them
      setSelectedPriorities((formData as any).priorities_names);
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
    if (formData.researchStation) setResearchStationSearch(formData.researchStation);
    if (formData.sectorCommodity) setSectorSearch(formData.sectorCommodity);
    if (formData.disciplineName) setDisciplineSearch(formData.disciplineName);
  }, [formData, prioritiesList]);

  // --- 3. FILTERING EFFECTS ---
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

  // --- Handler for Sector ---
  const handleSectorSelect = (sector: { id: number; name: string }) => {
    setSectorSearch(sector.name);
    onUpdate("sectorCommodity", sector.name);
    onUpdate("sector", sector.id);
    setIsSectorOpen(false);
    onResolveUnmatched?.("sector");
  };

  const handleSectorBlur = () => {
    setTimeout(() => {
      setIsSectorOpen(false);
      setSectorSearch(formData.sectorCommodity || "");
    }, 200);
  };

  // --- Handler for Discipline ---
  const handleDisciplineSelect = (discipline: { id: number; name: string }) => {
    setDisciplineSearch(discipline.name);
    onUpdate("disciplineName", discipline.name);
    onUpdate("discipline", discipline.id);
    setIsDisciplineOpen(false);
    onResolveUnmatched?.("discipline");
  };

  const handleDisciplineBlur = () => {
    setTimeout(() => {
      setIsDisciplineOpen(false);
      setDisciplineSearch(formData.disciplineName || "");
    }, 200);
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
    if (selectedPriorities.includes(value)) {
      handleDeletePriority(value);
      return;
    }

    // Priorities is a strict admin-managed multi-select — silently drop any
    // value that doesn't resolve to a known entry. The combobox should only
    // ever surface real priorityList entries so in practice this guards
    // against autofill residue / stale state.
    const priorityEntry = prioritiesList.find((p) => p.name === value);
    if (!priorityEntry) return;

    const newSelected = [...selectedPriorities, value];
    setSelectedPriorities(newSelected);

    const currentIds = (formData.priorities_id || []).filter((id): id is number => typeof id === "number");
    onUpdate("priorities_id", [...currentIds, priorityEntry.id]);
    onResolveUnmatched?.("priorities");
  };

  const handleAddPriority = () => {
    if (!priorityInput.trim()) return;
    const newItem = priorityInput.trim();

    if (!selectedPriorities.includes(newItem)) {
      // Strict enum — only accept typed text that matches an existing priority.
      // Typing a custom priority is no longer allowed; admin owns this taxonomy.
      const priorityEntry = prioritiesList.find((p) => p.name === newItem);
      if (!priorityEntry) {
        setPriorityInput("");
        return;
      }

      const newSelected = [...selectedPriorities, newItem];
      setSelectedPriorities(newSelected);
      const currentIds = (formData.priorities_id || []).filter((id): id is number => typeof id === "number");
      onUpdate("priorities_id", [...currentIds, priorityEntry.id]);
      onResolveUnmatched?.("priorities");
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
      if (sectorRef.current && !sectorRef.current.contains(event.target as Node)) setIsSectorOpen(false);
      if (disciplineRef.current && !disciplineRef.current.contains(event.target as Node)) setIsDisciplineOpen(false);
      if (priorityRef.current && !priorityRef.current.contains(event.target as Node)) setIsPriorityOpen(false);

      const target = event.target as Element;
      if (!target.closest('.city-input-container')) setActiveCityDropdownIndex(null);
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
          <div className="p-2 bg-gradient-to-r from-[#C8102E] to-[#E03A52] rounded-xl">
            <FlaskConical className="text-white w-6 h-6" />
          </div>
          Research Details
        </h2>
        <div className="flex items-center gap-2 text-sm text-green-600 font-medium select-none">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          Required
        </div>
      </div>

      {/* Research & Development Station (Locked to user's department) */}
      <div className="space-y-2" ref={researchStationRef}>
        <label className={`flex items-center gap-2 text-sm font-semibold select-none ${researchStationSearch ? 'text-green-600' : 'text-gray-700'}`}>
          <University className={`${researchStationSearch ? 'text-green-600' : 'text-gray-400'} w-4 h-4`} />
          Research & Development Station <span className="text-red-500">*</span>
          <Tooltip content="This is automatically set based on your profile department and cannot be changed." />
        </label>
        <div className="relative">
          <input
            type="text"
            name="researchStation"
            value={user?.department_name || researchStationSearch}
            readOnly
            disabled
            className="w-full px-4 py-3 pl-10 border border-gray-200 rounded-xl bg-gray-50 text-gray-600 cursor-not-allowed"
          />
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        </div>
        <p className="text-xs text-gray-400 flex items-center gap-1">
          <Lock className="w-3 h-3" />
          Locked to your profile department
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Sector/Commodity */}
        <div className="space-y-2" ref={sectorRef}>
          <label className={`flex items-center gap-2 text-sm font-semibold select-none ${sectorSearch ? 'text-green-600' : 'text-gray-700'}`}>
            <Tag className={`${sectorSearch ? 'text-green-600' : 'text-gray-400'} w-4 h-4`} />
            Sector/Commodity <span className="text-red-500">*</span>
            <Tooltip content="The agricultural or economic sector that the project will address (e.g., Crops, Livestock, Fisheries, Agribusiness)" />
            <AutoFillBadge fieldName="sector" autoFilledFields={autoFilledFields} />
          </label>
          <div className="relative">
            <input
              type="text"
              name="sectorCommodity"
              value={sectorSearch}
              onChange={(e) => setSectorSearch(e.target.value)}
              onFocus={() => setIsSectorOpen(true)}
              onBlur={handleSectorBlur}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8102E]"
              placeholder={isLoading ? "Loading sectors..." : "Search sector..."}
            />
            {isSectorOpen && (
              <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                {filteredSectors.length > 0 ? filteredSectors.map((sector, index) => (
                  <div
                    key={sector.id || index}
                    className="px-4 py-3 cursor-pointer hover:bg-gray-50 border-b border-gray-100 select-none"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSectorSelect(sector)}
                  >
                    <span className="text-sm text-gray-700">{sector.name}</span>
                  </div>
                )) : (
                  <div className="px-4 py-3 text-sm text-gray-400 italic">No matching sectors</div>
                )}
              </div>
            )}
          </div>
          {autoFillUnmatched.sector && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-1">
              <span className="font-semibold">Auto-detected from your file:</span>{' '}
              &ldquo;{autoFillUnmatched.sector}&rdquo; — we couldn't match this to our sector list.
              Please pick the closest option above, or ask admin to add it.
            </p>
          )}
        </div>

        {/* Discipline */}
        <div className="space-y-2" ref={disciplineRef}>
          <label className={`flex items-center gap-2 text-sm font-semibold select-none ${disciplineSearch ? 'text-green-600' : 'text-gray-700'}`}>
            <GraduationCap className={`${disciplineSearch ? 'text-green-600' : 'text-gray-400'} w-4 h-4`} />
            Discipline <span className="text-red-500">*</span>
            <Tooltip content="The scientific or technical field or specialization relevant to the project (e.g., Agricultural Engineering, Biotechnology, Horticulture)" />
            <AutoFillBadge fieldName="discipline" autoFilledFields={autoFilledFields} />
          </label>
          <div className="relative">
            <input
              type="text"
              name="discipline"
              value={disciplineSearch}
              onChange={(e) => setDisciplineSearch(e.target.value)}
              onFocus={() => setIsDisciplineOpen(true)}
              onBlur={handleDisciplineBlur}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8102E]"
              placeholder={isLoading ? "Loading disciplines..." : "Search discipline..."}
            />
            {isDisciplineOpen && (
              <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                {filteredDisciplines.length > 0 ? filteredDisciplines.map((discipline, index) => (
                  <div
                    key={discipline.id || index}
                    className="px-4 py-3 cursor-pointer hover:bg-gray-50 border-b border-gray-100 select-none"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleDisciplineSelect(discipline)}
                  >
                    <span className="text-sm text-gray-700">{discipline.name}</span>
                  </div>
                )) : (
                  <div className="px-4 py-3 text-sm text-gray-400 italic">No matching disciplines</div>
                )}
              </div>
            )}
          </div>
          {autoFillUnmatched.discipline && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-1">
              <span className="font-semibold">Auto-detected from your file:</span>{' '}
              &ldquo;{autoFillUnmatched.discipline}&rdquo; — we couldn't match this to our discipline list.
              Please pick the closest option above, or ask admin to add it.
            </p>
          )}
        </div>
      </div>

      <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
        <div className="flex items-center justify-between">
          <label className={`flex items-center gap-2 text-sm font-semibold select-none ${implementationSites.length > 0 && implementationSites.every(s => s.site?.trim() && s.city?.trim()) ? 'text-green-600' : 'text-gray-700'}`}>
            <MapPin className={`${implementationSites.length > 0 && implementationSites.every(s => s.site?.trim() && s.city?.trim()) ? 'text-green-600' : 'text-gray-400'} w-4 h-4`} />
            Implementation Sites <span className="text-red-500">*</span>
            <Tooltip content="The specific locations or cities where the project will be implemented. Add multiple sites if the project spans different areas." />
            <AutoFillBadge fieldName="implementation_site" autoFilledFields={autoFilledFields} />
          </label>

          {/* Display Current Mode Badge */}
          <span className={`text-xs px-2 py-1 rounded-full transition-all duration-300 ${(formData.cooperating_agencies?.length || 0) > 1 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
            <span className='font-bold'>Mode of Implementation:</span> {(formData.cooperating_agencies?.length || 0) > 1 ? 'Multiple Agency' : 'Single Agency'}
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {implementationSites.map((item, index) => (
          <React.Fragment key={index}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <div className="flex gap-2 city-input-container">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={item.city}
                  onChange={(e) => handleSiteChange(index, "city", e.target.value)}
                  onFocus={() => setActiveCityDropdownIndex(index)}
                  onBlur={() => {
                    setTimeout(() => {
                      const currentVal = (item.city || "").trim().toLowerCase();
                      if (!currentVal) {
                        // Empty is fine — user may still be filling
                        setActiveCityDropdownIndex(null);
                        return;
                      }
                      const isMatch = psgcCities.some(city => city.name.trim().toLowerCase() === currentVal);
                      if (!isMatch) {
                        // Show error but don't clear yet — let user fix it
                        setCityErrors(prev => {
                          const next = [...prev];
                          next[index] = true;
                          return next;
                        });
                        handleSiteChange(index, "city", "");
                      } else {
                        setCityErrors(prev => {
                          const next = [...prev];
                          next[index] = false;
                          return next;
                        });
                      }
                      setActiveCityDropdownIndex(null);
                    }, 200);
                  }}
                  className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 bg-white ${cityErrors[index] ? 'border-red-400 focus:ring-red-200' : 'border-gray-300 focus:ring-[#C8102E]'}`}
                  placeholder={`Type City/Municipality ${index + 1}`}
                />
                <MapPin className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                {activeCityDropdownIndex === index && (
                  <div className="absolute z-30 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-y-auto custom-scrollbar border-t-0 ring-1 ring-black ring-opacity-5 animate-in fade-in zoom-in-95 duration-100">
                    {psgcCities
                      .filter(c => c.name.toLowerCase().includes((item.city || "").toLowerCase()))
                      .map((city) => (
                        <div
                          key={city.code}
                          className={`px-4 py-3 cursor-pointer hover:bg-gray-50 flex items-center justify-between transition-colors ${
                            item.city === city.name ? "bg-[#C8102E]/10" : ""
                          }`}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            handleSiteChange(index, "city", city.name);
                            setActiveCityDropdownIndex(null);
                          }}
                        >
                          <span className={`text-sm ${city.isZamboanga ? 'font-bold text-[#C8102E]' : 'text-gray-700'}`}>{city.name}</span>
                          {city.isZamboanga && <MapPin className="w-3 h-3 text-[#C8102E]" />}
                        </div>
                      ))}
                  </div>
                )}
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
          {cityErrors[index] && (
            <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              City not recognized — please select a city/municipality from the dropdown.
            </p>
          )}
          </React.Fragment>
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
          <label className={`flex items-center gap-2 text-sm font-semibold select-none ${formData.classification_type ? 'text-green-600' : 'text-gray-700'}`}>
            <FolderOpen className={`${formData.classification_type ? 'text-green-600' : 'text-gray-400'} w-4 h-4`} />
            Classification Type <span className="text-red-500">*</span>
            <Tooltip content="Choose whether the project is primarily focused on Research (generating new knowledge) or Development (implementing/commercializing technologies)" />
            <AutoFillBadge fieldName="classification" autoFilledFields={autoFilledFields} />
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
              Research Classification <span className="text-red-500">*</span>
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
              Development Classification <span className="text-red-500">*</span>
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
        <label className={`flex items-center gap-2 text-sm font-semibold select-none ${selectedPriorities.length > 0 ? 'text-green-600' : 'text-gray-700'}`}>
          <Star className={`${selectedPriorities.length > 0 ? 'text-green-600' : 'text-gray-400'} w-4 h-4`} />
          Priority Areas/STAND Classification <span className="text-red-500">*</span>
          <Tooltip content="The Sustainable Development Goals (SDGs) or strategic priority areas that the project contributes to or addresses" />
          <AutoFillBadge fieldName="priorities" autoFilledFields={autoFilledFields} />
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
        <div className="relative">
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
                  className={`px-4 py-3 cursor-pointer hover:bg-gray-50 border-b border-gray-100 select-none ${selectedPriorities.includes(item.name) ? "bg-[#C8102E]/10" : ""}`}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handlePrioritySelect(item.name)}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedPriorities.includes(item.name)}
                      readOnly
                      className="w-4 h-4 text-[#C8102E] rounded pointer-events-none"
                    />
                    <span className="text-sm text-gray-700">{item.name}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <p className="text-xs text-gray-500">Pick one or more priority areas from the list. This taxonomy is managed by admin.</p>
        {autoFillUnmatched.priorities && (
          <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-1">
            <p className="font-semibold mb-1">Auto-detected from your file — couldn't match these to our priority list:</p>
            <ul className="list-disc list-inside space-y-0.5">
              {autoFillUnmatched.priorities.split('\n').map((term, i) => (
                <li key={i}>&ldquo;{term}&rdquo;</li>
              ))}
            </ul>
            <p className="mt-1">Please pick the closest matching priorities above, or ask admin to add them.</p>
          </div>
        )}
      </div>

    </div >
  );
};

export default ResearchDetails;