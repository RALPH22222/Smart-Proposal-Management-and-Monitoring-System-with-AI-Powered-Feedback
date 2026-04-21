import React, { useState, useEffect, useRef } from "react";
import {
  FileText,
  Building2,
  Phone,
  Mail,
  Users,
  Tags,
  X,
  Clock,
  Briefcase,
  Plus,
  Calendar,
  Calendar1,
  MapPin,
  Sparkles,
  Loader2,
  FolderPen,
  FolderOpenDot,
} from "lucide-react";

import { generateTags } from "../../../../services/proposal.api";
import type { AgencyItem } from "../../../../services/proposal.api";
import { useLookups } from "../../../../context/LookupContext";
import { differenceInMonths, parseISO, isValid, addMonths, format } from "date-fns";
import Tooltip from "../../../../components/Tooltip";
import AutoFillBadge from "../../../../components/shared/AutoFillBadge";
import type { FormData } from "../../../../types/proponent-form";
import { useAuthContext } from "../../../../context/AuthContext";
import Swal from "sweetalert2";

interface BasicInformationProps {
  formData: FormData;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onUpdate: (field: string, value: any) => void;
  autoFilledFields?: Set<string>;
  /** Raw text autofill detected for strict lookups that don't match. Keys: "agency" (funding agency). */
  autoFillUnmatched?: Record<string, string>;
  /** Clear one unmatched hint once the proponent picks a real value. */
  onResolveUnmatched?: (key: string) => void;
}

const BasicInformation: React.FC<BasicInformationProps> = ({
  formData,
  onInputChange,
  onUpdate,
  autoFilledFields = new Set(),
  autoFillUnmatched = {},
  onResolveUnmatched,
}) => {
  const YEAR_REGEX = /^\d+$/;
  const { user } = useAuthContext();
  const lookups = useLookups();

  // --- STATE ---
  const [agenciesList, setAgenciesList] = useState<AgencyItem[]>([]);
  const [tagsList, setTagsList] = useState<{ id: number; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Dropdown UI States
  const [isAgencyDropdownOpen, setIsAgencyDropdownOpen] = useState(false);
  const [isCooperatingDropdownOpen, setIsCooperatingDropdownOpen] = useState(false);
  const [isTagsDropdownOpen, setIsTagsDropdownOpen] = useState(false);

  // Address Selection State
  const [availableAddresses, setAvailableAddresses] = useState<{ id: string; street: string | null; barangay: string | null; city: string }[]>([]);

  // Search Terms
  const [agencySearchTerm, setAgencySearchTerm] = useState("");
  const [cooperatingSearchTerm, setCooperatingSearchTerm] = useState("");
  const [tagsSearchTerm, setTagsSearchTerm] = useState("");

  // Selected Items
  const [selectedAgencies, setSelectedAgencies] = useState<{ id: number; name: string }[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Filtered Lists
  const [filteredAgencies, setFilteredAgencies] = useState<AgencyItem[]>([]);
  const [filteredCooperatingAgencies, setFilteredCooperatingAgencies] = useState<AgencyItem[]>([]);
  const [filteredTags, setFilteredTags] = useState<{ id: number; name: string }[]>([]);

  // PSGC autocomplete (same as researchDetails)
  const [psgcCities, setPsgcCities] = useState<{ code: string; name: string; isZamboanga?: boolean }[]>([]);
  const [psgcBarangays, setPsgcBarangays] = useState<{ code: string; name: string }[]>([]);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [showBarangayDropdown, setShowBarangayDropdown] = useState(false);
  const [isBarangayLoading, setIsBarangayLoading] = useState(false);

  // Focus refs for automated flow
  const cityInputRef = useRef<HTMLInputElement>(null);
  const barangayInputRef = useRef<HTMLInputElement>(null);
  const streetInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!lookups.loading) {
      setAgenciesList(lookups.agencies);
      setTagsList(lookups.tags);
      setIsLoading(false);
    }
  }, [lookups.loading]);

  // Load PSGC cities (same approach as researchDetails.tsx)
  useEffect(() => {
    const loadCities = async () => {
      try {
        const response = await fetch("https://psgc.cloud/api/cities-municipalities");
        if (response.ok) {
          const data = await response.json();
          let mapped = data.map((d: any) => {
            let formattedName = d.name.replace(/Ã±/g, "ñ").replace(/Ã'/g, "Ñ");
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
          const uniqueNames = new Set<string>();
          mapped = mapped.filter((city: any) => {
            if (!uniqueNames.has(city.name)) { uniqueNames.add(city.name); return true; }
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

  // Fetch Barangays when city is selected/changed
  useEffect(() => {
    const fetchBarangays = async () => {
      const cityInput = formData.agencyAddress?.city || "";
      const selectedCity = psgcCities.find((c) => c.name.toLowerCase() === cityInput.toLowerCase());

      if (selectedCity) {
        setIsBarangayLoading(true);
        try {
          const response = await fetch(`https://psgc.cloud/api/cities-municipalities/${selectedCity.code}/barangays`);
          if (response.ok) {
            const data = await response.json();
            const mapped = data.map((b: any) => ({
              code: b.code,
              name: b.name.replace(/Ã±/g, "ñ").replace(/Ã'/g, "Ñ")
            })).sort((a: any, b: any) => a.name.localeCompare(b.name));
            
            setPsgcBarangays(mapped);

            // AUTO-SUGGEST ENFORCEMENT:
            // If there's a barangay currently set (e.g. from autofill),
            // verify it exists in this new list. If not, clear it.
            const currentBrgy = formData.agencyAddress?.barangay || "";
            if (currentBrgy) {
              const isMatch = mapped.some((b: any) => b.name.toLowerCase() === currentBrgy.toLowerCase());
              if (!isMatch) {
                // If it doesn't match exactly, don't input it
                onUpdate("agencyAddress", { ...formData.agencyAddress, barangay: "" });
              } else {
                // To be safe, set it to the official casing from the list
                const officialBrgy = mapped.find((b: any) => b.name.toLowerCase() === currentBrgy.toLowerCase())?.name;
                if (officialBrgy) onUpdate("agencyAddress", { ...formData.agencyAddress, barangay: officialBrgy });
              }
            }
          }
        } catch (error) {
          console.error("Error fetching barangays:", error);
        } finally {
          setIsBarangayLoading(false);
        }
      } else {
        setPsgcBarangays([]);
        // If city is invalid/empty, also ensure barangay is empty (strict enforcement)
        if (formData.agencyAddress?.barangay) {
          onUpdate("agencyAddress", { ...formData.agencyAddress, barangay: "" });
        }
      }
    };

    if (psgcCities.length > 0) {
      fetchBarangays();
    }
  }, [formData.agencyAddress?.city, psgcCities]);


  // --- FILTERING ---
  useEffect(() => {
    if (agenciesList.length > 0) {
      setFilteredAgencies(agenciesList.filter((a) => a.name.toLowerCase().includes(agencySearchTerm.toLowerCase())));
      setFilteredCooperatingAgencies(
        agenciesList.filter((a) => a.name.toLowerCase().includes(cooperatingSearchTerm.toLowerCase())),
      );
    }
  }, [agencySearchTerm, cooperatingSearchTerm, agenciesList]);

  useEffect(() => {
    if (tagsList.length > 0) {
      if (!tagsSearchTerm) {
        setFilteredTags(tagsList);
      } else {
        setFilteredTags(tagsList.filter((t) => t.name.toLowerCase().includes(tagsSearchTerm.toLowerCase())));
      }
    }
  }, [tagsSearchTerm, tagsList]);

  // --- 2. RESTORE SELECTIONS & DEFAULTS ---
  useEffect(() => {
    if (!isLoading) {
      // Restore Cooperating Agencies
      if (formData.cooperating_agencies && formData.cooperating_agencies.length > 0) {
        // If they are saved as IDs or objects, handle accordingly. Assuming objects based on previous code.
        setSelectedAgencies(formData.cooperating_agencies);
      }

      // Restore Tags
      if (tagsList.length > 0 && formData.tags && formData.tags.length > 0) {
        const tagNames = formData.tags
          .map((id: number) => tagsList.find((t) => t.id === id)?.name)
          .filter((name): name is string => !!name);
        if (tagNames.join(",") !== selectedTags.join(",")) {
          setSelectedTags(tagNames);
        }
      }

      // Restore Agency
      if (formData.agency && !agencySearchTerm) {
        if (typeof formData.agency === "number") {
          const found = agenciesList.find((a) => a.id === formData.agency);
          if (found) {
            setAgencySearchTerm(found.name);
            if (found.agency_address) setAvailableAddresses(found.agency_address);
          }
        } else {
          setAgencySearchTerm(String(formData.agency));
        }
      }

      // Restore City and fetch its barangays if needed
    }
  }, [isLoading, agenciesList, tagsList, formData.cooperating_agencies, formData.tags, formData.agency]);

  // Default Email — always locked to the logged-in user's email
  useEffect(() => {
    if (user?.email) {
      onUpdate("email", user.email);
    }
  }, [user?.email]);

  // Default Duration
  useEffect(() => {
    if (!formData.duration) {
      onUpdate("duration", "6");
    }
  }, []);

  // Default Year
  useEffect(() => {
    if (!formData.year) {
      const currentYear = new Date().getFullYear();
      onUpdate("year", currentYear);
    }
  }, []);


  // --- 3. DURATION LOGIC ---
  const calculateImplementationDates = (startStr: string, durationStr: string = "6") => {
    if (!startStr) return;
    const start = parseISO(startStr);
    if (!isValid(start)) return;

    const effectiveDuration = parseInt(durationStr || "6", 10);
    if (!isNaN(effectiveDuration) && effectiveDuration > 0) {
      const newEnd = addMonths(start, effectiveDuration);
      onUpdate("plannedEndDate", format(newEnd, "yyyy-MM-dd"));
    }
  };

  const handleDurationChange = (totalMonths: number) => {
    if (totalMonths <= 0) return;
    onUpdate("duration", String(totalMonths));
    if (formData.plannedStartDate) {
      calculateImplementationDates(formData.plannedStartDate, String(totalMonths));
    }
  };

  // Phase 2A — multi-year enabled. 1..120 months (0..10 years).
  const MAX_DURATION_MONTHS = 120;

  const handleDurationYearsChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const years = parseInt(e.target.value, 10);
    const currentMonths = parseInt(formData.duration || "6", 10);
    const remainingMonths = currentMonths % 12;
    const total = Math.min(MAX_DURATION_MONTHS, Math.max(1, years * 12 + remainingMonths));
    handleDurationChange(total);
  };

  const handleDurationMonthsChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const months = parseInt(e.target.value, 10);
    const currentMonths = parseInt(formData.duration || "6", 10);
    const years = Math.floor(currentMonths / 12);
    const total = Math.min(MAX_DURATION_MONTHS, Math.max(1, years * 12 + months));
    handleDurationChange(total);
  };

  const handleDateChangeWithCalc = (e: React.ChangeEvent<HTMLInputElement>) => {
    onInputChange(e);
    const { name, value } = e.target;

    if (name === "plannedStartDate") {
      calculateImplementationDates(value, formData.duration);
    } else if (name === "plannedEndDate") {
      if (formData.plannedStartDate && value) {
        try {
          const start = parseISO(formData.plannedStartDate);
          const end = parseISO(value);
          if (isValid(start) && isValid(end) && end >= start) {
            const months = differenceInMonths(end, start);
            if (months >= 0) {
              onUpdate("duration", String(months));
            }
          }
        } catch (e) { console.error(e); }
      }
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    // Allow empty string or just the + sign during typing
    if (value === "" || value === "+") {
      onUpdate("telephone", value);
      return;
    }

    // Only allow digits and leading +
    if (!/^[+]?[0-9]*$/.test(value)) return;

    // Logic for starting with +
    if (value.startsWith("+")) {
      // Must follow +639 pattern eventually
      // Enforce: +6... +63... +639...
      const prefix = "+639";

      // If length is small, ensure it matches prefix
      if (value.length <= 4) {
        if (!prefix.startsWith(value)) return;
      } else {
        // Length > 4, must start with +639 fully
        if (!value.startsWith("+639")) return;
      }

      // Max length 13 (+639 + 9 digits)
      if (value.length > 13) return;

    } else {
      // Logic for starting with 0
      // Must start with 09 eventually
      if (value.length >= 1 && !value.startsWith("0")) return; // Must start with 0

      if (value.length >= 2) {
        if (!value.startsWith("09")) return; // Must start with 09
      }

      // Max length 11 (09 + 9 digits)
      if (value.length > 11) return;
    }

    onUpdate("telephone", value);
  };

  // --- HANDLERS ---
  // Typing in the agency field filters the dropdown. We clear the FK while the
  // user is typing so the validator forces a fresh selection — previously we
  // let raw text sit in formData.agency, which meant the form looked valid but
  // the backend got a string where an id was expected.
  const handleAgencyNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAgencySearchTerm(value);
    onUpdate("agency", "");
    setAvailableAddresses([]);
  };

  const handleAgencyNameSelect = async (agency: AgencyItem) => {
    onUpdate("agency", agency.id);
    setAgencySearchTerm(agency.name);
    setIsAgencyDropdownOpen(false);
    onResolveUnmatched?.("agency");

    // Helper to find best PSGC match
    const findCityMatch = (name: string) => {
      if (!name) return "";
      const exact = psgcCities.find(c => c.name.toLowerCase() === name.toLowerCase());
      if (exact) return exact.name;
      const fuzzy = psgcCities.find(c => c.name.toLowerCase().includes(name.toLowerCase()) || name.toLowerCase().includes(c.name.toLowerCase()));
      return fuzzy ? fuzzy.name : "";
    };

    // Auto-fill address from existing agency data
    const addresses = agency.agency_address || [];
    if (addresses.length === 1) {
      // Single address — auto-fill immediately
      const addr = addresses[0];
      const officialCity = findCityMatch(addr.city || "");
      
      onUpdate("agencyAddress", {
        id: String(addr.id),
        street: addr.street || "",
        barangay: addr.barangay || "", // We can't easily match barangay without first loading by city code, so we'll fill and let validator handle it or ignore Match
        city: officialCity,
      });
      setAvailableAddresses([]);
    } else if (addresses.length > 1) {
      // Multiple addresses — let user pick
      setAvailableAddresses(addresses);
    } else {
      // No stored addresses — user types manually
      setAvailableAddresses([]);
    }
  };



  const handleAddressChange = (field: "street" | "barangay" | "city", value: string) => {
    // If city is changed, reset barangay
    let newAddress = { ...formData.agencyAddress, [field]: value };
    if (field === "city" && value !== (formData.agencyAddress?.city || "")) {
      newAddress.barangay = "";
    }
    
    if (newAddress.id) delete newAddress.id;
    onUpdate("agencyAddress", newAddress);

    if (field === "city") {
      setShowCityDropdown(true);
    }
    if (field === "barangay") {
      setShowBarangayDropdown(true);
    }
  };

  const validateAddressField = (field: "city" | "barangay") => {
    const list = field === "city" ? psgcCities : psgcBarangays;
    const currentVal = (formData.agencyAddress?.[field] || "").trim().toLowerCase();
    
    // If it's an exact match, fine. If not, clear it.
    const isMatch = list.some(item => item.name.trim().toLowerCase() === currentVal);
    
    if (currentVal && !isMatch) {
      handleAddressChange(field, "");
      if (field === "city") setPsgcBarangays([]); // Clear barangays too
    }
  };


  const handleAgencySelect = (agency: AgencyItem) => {
    const isSelected = selectedAgencies.some((a) => a.id === agency.id);
    let newSelectedAgencies;
    if (isSelected) newSelectedAgencies = selectedAgencies.filter((a) => a.id !== agency.id);
    else newSelectedAgencies = [...selectedAgencies, agency];

    setSelectedAgencies(newSelectedAgencies);
    onUpdate("cooperating_agencies", newSelectedAgencies);
  };

  const handleCreateAgency = () => {
    if (!cooperatingSearchTerm.trim()) return;
    const name = cooperatingSearchTerm.trim();
    if (selectedAgencies.some((a) => a.name.toLowerCase() === name.toLowerCase())) {
      setCooperatingSearchTerm("");
      return;
    }
    // Free-text chip — NO fake id. The backend splits these into the
    // agency_name_text column on cooperating_agencies so we don't pollute
    // the admin-managed funding-agency lookup with one-off partners.
    const newAgency: AgencyItem & { free_text?: boolean } = {
      id: 0 as any, // sentinel; the backend ignores this when free_text is true
      name,
      agency_address: [],
      free_text: true,
    };
    const newSelected = [...selectedAgencies, newAgency];
    setSelectedAgencies(newSelected);
    onUpdate("cooperating_agencies", newSelected);
    setCooperatingSearchTerm("");
    setIsCooperatingDropdownOpen(false);
  };

  // Free-text cooperating agencies share the sentinel `id: 0`, so filtering
  // only by id would remove every free-text chip at once. Key removal by
  // name when the chip is free_text, by id otherwise.
  const handleAgencyRemove = (target: AgencyItem & { free_text?: boolean }) => {
    const newSelectedAgencies = selectedAgencies.filter((a) => {
      const isSameFreeText = (a as any).free_text && (target as any).free_text && a.name === target.name;
      const isSameFk = !(a as any).free_text && !(target as any).free_text && a.id === target.id;
      return !(isSameFreeText || isSameFk);
    });
    setSelectedAgencies(newSelectedAgencies);
    onUpdate("cooperating_agencies", newSelectedAgencies);
  };

  const handleTagSelect = (tag: { id: number; name: string }) => {
    if (selectedTags.includes(tag.name)) {
      handleTagRemove(tag.name);
      return;
    }

    if (selectedTags.length >= 4) {
      Swal.fire({
        title: "Maximum Tags Reached",
        text: "You can only select up to 4 tags for your project.",
        icon: "warning",
        confirmButtonColor: "#C8102E",
      });
      return;
    }

    const newSelectedTags = [...selectedTags, tag.name];
    setSelectedTags(newSelectedTags);
    const currentTagIds = formData.tags || [];
    const newTagIds = [...currentTagIds, tag.id];
    onUpdate("tags", newTagIds);
  };

  const handleTagRemove = (tagName: string) => {
    const tagToRemove = tagsList.find((t) => t.name === tagName);
    const newSelectedTags = selectedTags.filter((t) => t !== tagName);
    setSelectedTags(newSelectedTags);
    if (tagToRemove) {
      const currentTagIds = formData.tags || [];
      const newTagIds = currentTagIds.filter((id: number) => id !== tagToRemove.id);
      onUpdate("tags", newTagIds);
    }
  };

  // --- AI TAG GENERATION ---
  const [isGeneratingTags, setIsGeneratingTags] = useState(false);

  const autoGenerateTags = async () => {
    if (!formData.project_title || formData.project_title.trim().length === 0) {
      alert("Please enter a Project Title first.");
      return;
    }

    setIsGeneratingTags(true);
    try {
      const availableTagNames = tagsList.map(t => t.name);
      const generatedTagNames = await generateTags(formData.project_title, availableTagNames);

      const newSelectedTags: string[] = [];
      const newTagIds: number[] = [];

      for (const tg of generatedTagNames) {
        if (newSelectedTags.length >= 4) break;
        const matchedTag = tagsList.find(t => t.name.toLowerCase() === tg.toLowerCase());
        if (matchedTag && !newSelectedTags.includes(matchedTag.name)) {
          newSelectedTags.push(matchedTag.name);
          newTagIds.push(matchedTag.id);
        }
      }

      if (newSelectedTags.length === 0) {
        let otherTag = tagsList.find(t => t.name.toLowerCase() === "other");
        if (!otherTag) {
          otherTag = { id: Date.now(), name: "Other" };
          setTagsList(prev => {
            if (!prev.find(p => p.name === "Other")) {
              return [...prev, otherTag as { id: number; name: string }];
            }
            return prev;
          });
        }
        if (otherTag && !newSelectedTags.includes(otherTag.name)) {
          newSelectedTags.push(otherTag.name);
          newTagIds.push(otherTag.id);
        }
      }

      setSelectedTags(newSelectedTags);
      onUpdate("tags", newTagIds);

    } catch (error: any) {
      console.error("Error auto generating tags:", error);

      const status = error?.response?.status;
      if (status === 429) {
        Swal.fire({
          title: "API Limit Reached",
          text: "Too many requests to the AI service. The tag 'Other' has been automatically selected instead.",
          icon: "info",
          confirmButtonColor: "#C8102E",
        });
      } else {
        Swal.fire({
          title: "AI Generation Failed",
          text: "There was a problem contacting the AI service. The tag 'Other' has been automatically selected instead.",
          icon: "warning",
          confirmButtonColor: "#C8102E",
        });
      }

      // Fallback to "Other"
      let otherTag = tagsList.find(t => t.name.toLowerCase() === "other");
      if (!otherTag) {
        otherTag = { id: Date.now(), name: "Other" };
        setTagsList(prev => {
          if (!prev.find(p => p.name === "Other")) return [...prev, otherTag as { id: number; name: string }];
          return prev;
        });
      }
      setSelectedTags([otherTag.name]);
      onUpdate("tags", [otherTag.id]);

    } finally {
      setIsGeneratingTags(false);
    }
  };


  // Click Outside Listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest(".agency-name-dropdown-container")) setIsAgencyDropdownOpen(false);
      if (!target.closest(".cooperating-agency-dropdown-container")) setIsCooperatingDropdownOpen(false);
      if (!target.closest(".tags-dropdown-container")) setIsTagsDropdownOpen(false);
      if (!target.closest(".city-input-container")) setShowCityDropdown(false);
      if (!target.closest(".barangay-input-container")) setShowBarangayDropdown(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);




  // --- DATE CONSTRAINTS ---
  // Start date: must be at least next month (1st day of next month)
  const getMinStartDate = () => {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return format(nextMonth, 'yyyy-MM-dd');
  };

  // End date: maximum 10 years from today
  const getMaxEndDate = () => {
    const now = new Date();
    const max = new Date(now.getFullYear() + 10, now.getMonth(), now.getDate());
    return format(max, 'yyyy-MM-dd');
  };

  const minStartDate = getMinStartDate();
  const maxEndDate = getMaxEndDate();
  // End date minimum: must be after the selected start date (or next month if none selected)
  const minEndDate = formData.plannedStartDate || minStartDate;

  const isBasicInfoComplete = Boolean(
    formData.project_title?.trim() &&
    YEAR_REGEX.test(String(formData.year ?? "")) &&
    formData.plannedStartDate &&
    formData.plannedEndDate &&
    formData.duration &&
    formData.agency &&
    formData.agencyAddress?.city?.trim() &&
    formData.telephone?.trim() &&
    formData.email &&
    formData.tags && formData.tags.length > 0
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-[#C8102E] to-[#E03A52] rounded-xl">
            <FileText className="text-white w-6 h-6" />
          </div>
          Basic Information
        </h2>
        <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          Required
        </div>
      </div>

      {/* Program, Project, Year */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className={`block text-sm font-semibold flex items-center gap-2 ${formData.program_title ? 'text-green-600' : 'text-gray-700'}`}>
            <FolderOpenDot className={`${formData.program_title ? 'text-green-600' : 'text-gray-400'} w-4 h-4`} />
            Program Title <span className="text-gray-400 text-[10px] font-normal uppercase tracking-wider bg-gray-100 px-1.5 py-0.5 rounded ml-1">Optional</span>
            <Tooltip content="Only fill if this project is part of a larger program. If this is a standalone project, you may leave this field empty." />
            <AutoFillBadge fieldName="program_title" autoFilledFields={autoFilledFields} showNeedsInput={false} />
          </label>
          <input
            type="text"
            name="program_title"
            value={formData.program_title || ""}
            onChange={onInputChange}
            maxLength={256}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8102E]"
            placeholder="e.g., Science for Change Program"
          />
        </div>
        <div className="space-y-2">
          <label className={`block text-sm font-semibold flex items-center gap-2 ${formData.project_title ? 'text-green-600' : 'text-gray-700'}`}>
            <FolderPen className={`${formData.project_title ? 'text-green-600' : 'text-gray-400'} w-4 h-4`} />
            Project Title <span className="text-red-500">*</span>
            <Tooltip content="A specific and concise title for your research or development project" />
            <AutoFillBadge fieldName="project_title" autoFilledFields={autoFilledFields} />
          </label>
          <input
            type="text"
            name="project_title"
            value={formData.project_title || ""}
            onChange={onInputChange}
            maxLength={256}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8102E]"
            placeholder="Enter project title"
          />
        </div>
        <div className="space-y-2">
          <label className={`block text-sm font-semibold flex items-center gap-2 ${YEAR_REGEX.test(String(formData.year ?? "")) ? 'text-green-600' : 'text-gray-700'}`}>
            <Calendar1 className={`${YEAR_REGEX.test(String(formData.year ?? "")) ? 'text-green-600' : 'text-gray-400'} w-4 h-4`} />
             Year <span className="text-red-500">*</span>
            <Tooltip content="Please enter the year (e.g., 2026)" />

          </label>
          <input
            type="number"
            min={1000}
            max={9999}
            value={formData.year ?? ""}
            readOnly
            className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-600 cursor-not-allowed text-center"
            placeholder="YYYY"
          />
        </div>

        {/* Dates & Duration */}
        <div className="space-y-2">
          <label className={`flex items-center gap-2 text-sm font-semibold ${formData.plannedStartDate ? 'text-green-600' : 'text-gray-700'}`}>
            <Calendar className={`${formData.plannedStartDate ? 'text-green-600' : 'text-gray-400'} w-4 h-4`} />
            Planned Start Date <span className="text-red-500">*</span>
            <Tooltip content="The expected date when the project implementation will begin" />
            <AutoFillBadge fieldName="plannedStartDate" autoFilledFields={autoFilledFields} />
          </label>
          <input
            type="date"
            name="plannedStartDate"
            value={formData.plannedStartDate || ""}
            onChange={handleDateChangeWithCalc}
            min={minStartDate}
            max={maxEndDate}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8102E]"
          />
        </div>

        <div className="space-y-2">
          <label className={`flex items-center gap-2 text-sm font-semibold ${formData.plannedEndDate ? 'text-green-600' : 'text-gray-700'}`}>
            <Calendar className={`${formData.plannedEndDate ? 'text-green-600' : 'text-gray-400'} w-4 h-4`} />
            Planned End Date <span className="text-red-500">*</span>
            <Tooltip content="The expected date when the project implementation will be completed" />
            <AutoFillBadge fieldName="plannedEndDate" autoFilledFields={autoFilledFields} />
          </label>
          <input
            type="date"
            name="plannedEndDate"
            value={formData.plannedEndDate || ""}
            onChange={handleDateChangeWithCalc}
            min={minEndDate}
            max={maxEndDate}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8102E]"
          />
        </div>

        <div className="space-y-2">
          <label className={`flex items-center gap-2 text-sm font-semibold ${formData.duration ? 'text-green-600' : 'text-gray-700'}`}>
            <Clock className={`${formData.duration ? 'text-green-600' : 'text-gray-400'} w-4 h-4`} />
            Duration <span className="text-red-500">*</span>
            <Tooltip content="Project length. Quarterly reporting repeats every year — a 24-month project has 8 quarterly reports." />
            <AutoFillBadge fieldName="duration" autoFilledFields={autoFilledFields} />
          </label>
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <select
                value={Math.floor(parseInt(formData.duration || "6", 10) / 12)}
                onChange={handleDurationYearsChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8102E] appearance-none bg-white"
              >
                {Array.from({ length: 11 }, (_, i) => (
                  <option key={i} value={i}>{i} {i === 1 ? 'Year' : 'Years'}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                </svg>
              </div>
            </div>
            <div className="relative flex-1">
              <select
                value={parseInt(formData.duration || "6", 10) % 12}
                onChange={handleDurationMonthsChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8102E] appearance-none bg-white"
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i} value={i}>{i} {i === 1 ? 'Month' : 'Months'}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                </svg>
              </div>
            </div>
          </div>
          {formData.plannedStartDate && formData.plannedEndDate && (() => {
            const start = parseISO(formData.plannedStartDate);
            const end = parseISO(formData.plannedEndDate);
            if (isValid(start) && isValid(end) && end >= start) {
              const diffTime = end.getTime() - start.getTime();
              const totalDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
              return (
                <p className="text-xs text-slate-400 mt-1">
                  Total: {totalDays.toLocaleString()} {totalDays === 1 ? 'day' : 'days'}
                </p>
              );
            }
            return null;
          })()}
          {!formData.plannedStartDate && formData.duration && (
            <p className="text-xs text-slate-500 mt-1">
              ≈ {(parseInt(formData.duration, 10) * 30).toLocaleString()} days
            </p>
          )}
        </div>
      </div>

      {/* AGENCY */}
      <div className="space-y-2 agency-name-dropdown-container">
        <label className={`flex items-center gap-2 text-sm font-semibold ${formData.agency ? 'text-green-600' : 'text-gray-700'}`}>
          <Building2 className={`${formData.agency ? 'text-green-600' : 'text-gray-400'} w-4 h-4`} />
          Agency <span className="text-red-500">*</span>
          <Tooltip content="The government agency, institution, or organization implementing the project" />
          <AutoFillBadge fieldName="agency" autoFilledFields={autoFilledFields} />
        </label>
        <div className="relative">
          <input
            type="text"
            value={agencySearchTerm}
            onChange={handleAgencyNameChange}
            onFocus={() => setIsAgencyDropdownOpen(true)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8102E]"
            placeholder={isLoading ? "Loading agencies..." : "Search or type your agency name"}
          />
          <Briefcase className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
          {isAgencyDropdownOpen && filteredAgencies.length > 0 && (
            <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-xl shadow-lg max-h-60 overflow-y-auto">
              {filteredAgencies.map((agency) => (
                <div
                  key={agency.id}
                  className={`px-4 py-3 cursor-pointer hover:bg-gray-50 ${agencySearchTerm === agency.name ? "bg-[#C8102E]/10" : ""}`}
                  onClick={() => handleAgencyNameSelect(agency)}
                >
                  <span className="text-sm text-gray-700">{agency.name}</span>
                  {agency.agency_address && agency.agency_address.length > 0 && (
                    <span className="ml-2 text-xs text-gray-400">({agency.agency_address.length} addresses)</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        {autoFillUnmatched.agency && (
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-1">
            <span className="font-semibold">Auto-detected from your file:</span>{' '}
            &ldquo;{autoFillUnmatched.agency}&rdquo; — we couldn't match this to our agency list.
            Please pick the closest option above, or ask admin to add it.
          </p>
        )}
      </div>

      {/* ADDRESS */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className={`flex items-center gap-2 text-sm font-semibold ${formData.agencyAddress?.city ? 'text-green-600' : 'text-gray-700'}`}>
            <MapPin className={`${formData.agencyAddress?.city ? 'text-green-600' : 'text-gray-400'} w-4 h-4`} />
            Agency Address
            <Tooltip content="The complete office address where the project will be managed" />
            <AutoFillBadge fieldName="agencyAddress" autoFilledFields={autoFilledFields} />
          </label>
        </div>

        {availableAddresses.length > 0 && (
          <div className="animate-in fade-in slide-in-from-top-2 duration-500 mb-6">
            <div className="flex items-center gap-2 mb-3 px-1">
              <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-gray-200"></div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5 whitespace-nowrap">
                <Sparkles className="w-3 h-3 text-[#C8102E]" />
                Select a saved address for {agencySearchTerm}
              </p>
              <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-gray-200"></div>
            </div>
            <div className="flex flex-wrap gap-3">
              {availableAddresses.map((addr) => (
                <button
                  key={addr.id}
                  type="button"
                  onClick={() => {
                    const findCityMatch = (name: string) => {
                      if (!name) return "";
                      const exact = psgcCities.find(c => c.name.toLowerCase() === name.toLowerCase());
                      if (exact) return exact.name;
                      const fuzzy = psgcCities.find(c => c.name.toLowerCase().includes(name.toLowerCase()) || name.toLowerCase().includes(c.name.toLowerCase()));
                      return fuzzy ? fuzzy.name : "";
                    };
                    const officialCity = findCityMatch(addr.city || "");
                    
                    const updates = {
                      street: addr.street || "",
                      barangay: addr.barangay || "",
                      city: officialCity
                    };
                    onUpdate("agencyAddress", { id: String(addr.id), ...updates });
                  }}
                  className="group flex flex-col items-start px-4 py-3 bg-white border border-gray-200 rounded-2xl hover:border-[#C8102E] hover:bg-[#C8102E]/5 hover:shadow-md transition-all text-left active:scale-[0.98] duration-300"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin className="w-3 h-3 text-gray-400 group-hover:text-[#C8102E] transition-colors" />
                    <span className="text-xs font-bold text-gray-700 group-hover:text-[#C8102E] transition-colors">
                      {addr.city}
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-400 leading-tight">
                    {addr.barangay ? `${addr.barangay}, ` : ""}{addr.street || ""}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}


        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2 relative city-input-container font-sans">
            <label className="block text-sm font-medium text-gray-800 font-semibold">City / Municipality <span className="text-red-500">*</span></label>
            <div className="relative">
              <input
                ref={cityInputRef}
                type="text"
                value={formData.agencyAddress?.city || ""}
                onChange={(e) => handleAddressChange("city", e.target.value)}
                onFocus={() => setShowCityDropdown(true)}
                onBlur={() => {
                  setTimeout(() => {
                    validateAddressField("city");
                    setShowCityDropdown(false)
                  }, 200);
                }}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8102E] transition-all bg-white"
                placeholder="Type City / Municipality"
              />
              <MapPin className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
              {showCityDropdown && (
                <div className="absolute z-30 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-y-auto custom-scrollbar border-t-0 ring-1 ring-black ring-opacity-5 animate-in fade-in zoom-in-95 duration-100">
                  {psgcCities
                    .filter(c => c.name.toLowerCase().includes((formData.agencyAddress?.city || "").toLowerCase()))
                    .map((city) => (
                      <div
                        key={city.code}
                        className={`px-4 py-3 cursor-pointer hover:bg-gray-50 flex items-center justify-between transition-colors ${
                          formData.agencyAddress?.city === city.name ? "bg-[#C8102E]/10" : ""
                        }`}
                        onMouseDown={() => {
                          handleAddressChange("city", city.name);
                          setShowCityDropdown(false);
                          // Auto-focus next field
                          setTimeout(() => barangayInputRef.current?.focus(), 100);
                        }}
                      >
                        <span className={`text-sm ${city.isZamboanga ? "font-bold text-[#C8102E]" : "text-gray-700"}`}>
                          {city.name}
                        </span>
                        {city.isZamboanga && <MapPin className="w-3 h-3 text-[#C8102E]" />}
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2 relative barangay-input-container font-sans">
            <label className="block text-sm font-medium text-gray-500 font-semibold">Barangay</label>
            <div className="relative">
              <input
                ref={barangayInputRef}
                type="text"
                value={formData.agencyAddress?.barangay || ""}
                onChange={(e) => handleAddressChange("barangay", e.target.value)}
                onFocus={() => setShowBarangayDropdown(true)}
                onBlur={() => {
                  setTimeout(() => {
                    validateAddressField("barangay");
                    setShowBarangayDropdown(false)
                  }, 200);
                }}
                maxLength={256}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8102E] transition-all bg-white disabled:bg-gray-50"
                placeholder={isBarangayLoading ? "Loading barangays..." : formData.agencyAddress?.city ? "Type Barangay" : "Select city first"}
                disabled={!formData.agencyAddress?.city}
              />
              <Building2 className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
              {showBarangayDropdown && (
                <div className="absolute z-30 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-y-auto custom-scrollbar border-t-0 ring-1 ring-black ring-opacity-5 animate-in fade-in zoom-in-95 duration-100">
                  {psgcBarangays.length > 0 ? (
                    psgcBarangays
                      .filter(b => b.name.toLowerCase().includes((formData.agencyAddress?.barangay || "").toLowerCase()))
                      .map((brgy) => (
                        <div
                          key={brgy.code}
                          className={`px-4 py-3 cursor-pointer hover:bg-gray-50 flex items-center justify-between transition-colors ${
                            formData.agencyAddress?.barangay === brgy.name ? "bg-[#C8102E]/10" : ""
                          }`}
                          onMouseDown={() => {
                            handleAddressChange("barangay", brgy.name);
                            setShowBarangayDropdown(false);
                            // Auto-focus next field
                            setTimeout(() => streetInputRef.current?.focus(), 100);
                          }}
                        >
                          <span className="text-sm text-gray-700">{brgy.name}</span>
                        </div>
                      ))
                  ) : (
                    <div className="px-4 py-3 text-sm text-gray-400 italic">No barangays found</div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-500 font-semibold">Street</label>
            <input
              ref={streetInputRef}
              type="text"
              name="street"
              value={formData.agencyAddress?.street || ""}
              onChange={(e) => handleAddressChange("street", e.target.value)}
              maxLength={256}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8102E]"
              placeholder="Street Name / #"
            />
          </div>
        </div>
      </div>

      {/* Telephone & Email */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className={`flex items-center gap-2 text-sm font-semibold ${formData.telephone ? 'text-green-600' : 'text-gray-700'}`}>
            <Phone className={`${formData.telephone ? 'text-green-600' : 'text-gray-400'} w-4 h-4`} />
            Telephone <span className="text-red-500">*</span>
            <Tooltip content="The contact phone number of the project implementing agency or principal proposer" />
            <AutoFillBadge fieldName="telephone" autoFilledFields={autoFilledFields} />
          </label>
          <input
            type="tel"
            name="telephone"
            value={formData.telephone || ""}
            onChange={handlePhoneChange}
            title="Please enter a valid PH mobile number (e.g. 09123456789 or +639123456789)"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8102E]"
            placeholder="Enter telephone number"
          />
        </div>
        <div className="space-y-2">
          <label className={`flex items-center gap-2 text-sm font-semibold ${formData.email ? 'text-green-600' : 'text-gray-700'}`}>
            <Mail className={`${formData.email ? 'text-green-600' : 'text-gray-400'} w-4 h-4`} />
            Email <span className="text-red-500">*</span>
            <Tooltip content="Your registered email address (from your account)" />

          </label>
          <input
            type="email"
            name="email"
            value={formData.email || ""}
            readOnly
            className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-600 cursor-not-allowed"
            placeholder="Email from your account"
          />
        </div>
      </div>

      <div className="space-y-2 cooperating-agency-dropdown-container">
        <div className="flex items-center justify-between">
          <label className={`flex items-center gap-2 text-sm font-semibold ${(isBasicInfoComplete || selectedAgencies.length > 0 || cooperatingSearchTerm.trim()) ? 'text-green-600' : 'text-gray-700'}`}>
            <Users className={`${(isBasicInfoComplete || selectedAgencies.length > 0 || cooperatingSearchTerm.trim()) ? 'text-green-600' : 'text-gray-400'} w-4 h-4`} />
            Cooperating Agencies <span className={`${(isBasicInfoComplete || selectedAgencies.length > 0 || cooperatingSearchTerm.trim()) ? 'text-green-600/60' : 'text-gray-400'} font-normal italic text-xs ml-1`}>(Leave blank if 'None')</span>
            <Tooltip content="Other government agencies, institutions, or organizations partnering with the lead agency to implement the project" />
            <AutoFillBadge fieldName="cooperating_agencies" autoFilledFields={autoFilledFields} />
          </label>

          {/* Display Current Mode Badge */}
          <span className={`text-xs px-2 py-1 rounded-full transition-all duration-300 ${(formData.cooperating_agencies?.length || 0) > 1 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
            <span className='font-bold'>Mode of Implementation:</span> {(formData.cooperating_agencies?.length || 0) > 1 ? 'Multiple Agency' : 'Single Agency'}
          </span>
        </div>

        {selectedAgencies.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {selectedAgencies.map((agency) => {
              const isFreeText = (agency as any).free_text === true;
              const key = isFreeText ? `text-${agency.name}` : `fk-${agency.id}`;
              return (
                <span
                  key={key}
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    isFreeText
                      ? 'bg-amber-50 text-amber-800 border border-dashed border-amber-300'
                      : 'bg-blue-100 text-blue-800'
                  }`}
                  title={isFreeText ? 'External partner — not in the admin-managed agency list' : undefined}
                >
                  {agency.name}
                  {isFreeText && <span className="ml-1.5 text-[10px] uppercase tracking-wider opacity-70">external</span>}
                  <button
                    type="button"
                    onClick={() => handleAgencyRemove(agency as AgencyItem & { free_text?: boolean })}
                    className="ml-2 inline-flex items-center justify-center w-4 h-4 rounded-full transition-colors hover:text-red-500 focus:outline-none"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              );
            })}
          </div>
        )}
        <div className="relative">
          <input
            type="text"
            placeholder={isLoading ? "Loading agencies..." : "Search cooperating agencies"}
            value={cooperatingSearchTerm}
            onChange={(e) => setCooperatingSearchTerm(e.target.value)}
            onFocus={() => setIsCooperatingDropdownOpen(true)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8102E]"
          />
          {isCooperatingDropdownOpen && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-xl shadow-lg max-h-60 overflow-y-auto">
              {filteredCooperatingAgencies.map((agency) => (
                <div
                  key={agency.id}
                  className={`px-4 py-3 cursor-pointer hover:bg-gray-50 ${selectedAgencies.some((a) => a.id === agency.id) ? "bg-[#C8102E]/10" : ""}`}
                  onClick={() => {
                    handleAgencySelect(agency);
                  }}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedAgencies.some((a) => a.id === agency.id)}
                      readOnly
                      className="w-4 h-4 text-[#C8102E] rounded"
                    />
                    <span className="text-sm text-gray-700">{agency.name}</span>
                  </div>
                </div>
              ))}
              {cooperatingSearchTerm &&
                !filteredCooperatingAgencies.some(
                  (a) => a.name.toLowerCase() === cooperatingSearchTerm.toLowerCase(),
                ) && (
                  <div
                    className="px-4 py-3 cursor-pointer hover:bg-blue-50 border-t border-gray-100 text-[#C8102E] font-medium flex items-center gap-2"
                    onClick={handleCreateAgency}
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create "{cooperatingSearchTerm}"</span>
                  </div>
                )}
            </div>
          )}
        </div>
      </div>

      {/* Tags Input */}
      <div className="space-y-2 tags-dropdown-container">
        <div className="flex items-center justify-between">
          <label className={`flex items-center gap-2 text-sm font-semibold ${formData.tags && formData.tags.length > 0 ? 'text-green-600' : 'text-gray-700'}`}>
            <Tags className={`${formData.tags && formData.tags.length > 0 ? 'text-green-600' : 'text-gray-400'} w-4 h-4`} />
            Tags <span className="text-red-500">*</span>
            <Tooltip content="Disciplines or specializations related to the project (e.g., Agricultural Engineering, Biotechnology)" />
            <AutoFillBadge fieldName="tags" autoFilledFields={autoFilledFields} />
          </label>
          <button
            type="button"
            onClick={autoGenerateTags}
            disabled={isGeneratingTags || !formData.project_title}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${isGeneratingTags || !formData.project_title
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-[#C8102E]/10 text-[#C8102E] hover:bg-[#C8102E]/20'
              }`}
          >
            {isGeneratingTags ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            Auto-generate
          </button>
        </div>
        {selectedTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
            {selectedTags.map((tag, index) => (
              <div
                key={index}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-sm font-medium"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => handleTagRemove(tag)}
                  className="hover:text-red-500 transition-colors focus:outline-none"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="relative">
          <input
            type="text"
            placeholder={isLoading ? "Loading tags..." : "Search tags or select from options"}
            value={tagsSearchTerm}
            onChange={(e) => setTagsSearchTerm(e.target.value)}
            onFocus={() => setIsTagsDropdownOpen(true)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8102E]"
          />
          {isTagsDropdownOpen && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-xl shadow-lg max-h-60 overflow-y-auto">
              {filteredTags.length > 0 ? (
                filteredTags.map((tag) => (
                  <div
                    key={tag.id}
                    className={`px-4 py-3 cursor-pointer hover:bg-gray-50 ${selectedTags.includes(tag.name) ? "bg-[#C8102E]/10" : ""}`}
                    onClick={() => handleTagSelect(tag)}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedTags.includes(tag.name)}
                        readOnly
                        className="w-4 h-4 text-[#C8102E] rounded pointer-events-none"
                      />
                      <span className="text-sm text-gray-700">{tag.name}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-4 py-3 text-sm text-gray-500">No tags found</div>
              )}
            </div>
          )}
        </div>
      </div>

    </div >
  );
};

export default BasicInformation;