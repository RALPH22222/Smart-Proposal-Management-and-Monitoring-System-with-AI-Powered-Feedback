import React, { useState, useEffect } from "react";
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
  MapPin,
} from "lucide-react";

import { fetchAgencies, fetchTags, fetchAgencyAddresses } from "../../../../services/proposal.api";
import type { AgencyItem } from "../../../../services/proposal.api";
import { differenceInMonths, parseISO, isValid, addMonths, format } from "date-fns";
import Tooltip from "../../../../components/Tooltip";
import type { FormData } from "../../../../types/proponent-form";
import { useAuthContext } from "../../../../context/AuthContext";

interface BasicInformationProps {
  formData: FormData;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onUpdate: (field: string, value: any) => void;
}

const BasicInformation: React.FC<BasicInformationProps> = ({ formData, onInputChange, onUpdate }) => {
  const { user } = useAuthContext();

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



  // --- 1. FETCH DATA ---
  useEffect(() => {
    const loadData = async () => {
      try {
        const [agenciesData, tagsData] = await Promise.all([
          fetchAgencies().catch(() => []),
          fetchTags().catch(() => []),
        ]);
        setAgenciesList(agenciesData || []);
        setTagsList(tagsData || []);
      } catch (error) {
        console.error("Error loading basic info data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

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
    }
  }, [isLoading, agenciesList, tagsList, formData.cooperating_agencies, formData.tags, formData.agency]);

  // Default Email
  useEffect(() => {
    if (user?.email && !formData.email) {
      onUpdate("email", user.email);
    }
  }, [user]);

  // Default Duration
  useEffect(() => {
    if (!formData.duration) {
      onUpdate("duration", "6");
    }
  }, []);

  // Default School Year
  useEffect(() => {
    if (!formData.schoolYear) {
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth();
      const startYear = currentMonth >= 5 ? currentYear : currentYear - 1;
      const endYear = startYear + 1;
      onUpdate("schoolYear", `${startYear}-${endYear}`);
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

  const handleDurationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedDuration = e.target.value;
    onUpdate("duration", selectedDuration);
    if (formData.plannedStartDate) {
      calculateImplementationDates(formData.plannedStartDate, selectedDuration);
    }
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

  const formatDuration = (months: number): string => {
    if (months < 12) return `${months} Month${months !== 1 ? 's' : ''}`;
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    if (remainingMonths === 0) return `${years} Year${years !== 1 ? 's' : ''}`;
    return `${years} Year${years !== 1 ? 's' : ''}, ${remainingMonths} Month${remainingMonths !== 1 ? 's' : ''}`;
  };


  // --- HANDLERS ---
  const handleAgencyNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAgencySearchTerm(value);
    onUpdate("agency", value);
    setAvailableAddresses([]);
  };

  const handleAgencyNameSelect = async (agency: AgencyItem) => {
    onUpdate("agency", agency.id);
    setAgencySearchTerm(agency.name);
    setIsAgencyDropdownOpen(false);
    setAvailableAddresses([]);

    try {
      const addresses = await fetchAgencyAddresses(agency.id);
      setAvailableAddresses(addresses || []);
    } catch (error) {
      console.error("Error fetching agency addresses:", error);
      if (agency.agency_address) {
        setAvailableAddresses(agency.agency_address);
      }
    }
  };

  const handleAddressSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    if (!selectedId) return;
    const selectedAddr = availableAddresses.find(a => String(a.id) === selectedId);
    if (selectedAddr) {
      onUpdate("agencyAddress", {
        id: String(selectedAddr.id),
        street: selectedAddr.street || "",
        barangay: selectedAddr.barangay || "",
        city: selectedAddr.city || ""
      });
    }
  };

  const handleAddressChange = (field: "street" | "barangay" | "city", value: string) => {
    const newAddress = { ...formData.agencyAddress, [field]: value };
    if (newAddress.id) delete newAddress.id;
    onUpdate("agencyAddress", newAddress);
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
    if (selectedAgencies.some((a) => a.name.toLowerCase() === cooperatingSearchTerm.trim().toLowerCase())) {
      setCooperatingSearchTerm("");
      return;
    }
    const newAgency: AgencyItem = { id: Date.now(), name: cooperatingSearchTerm.trim(), agency_address: [] };
    setAgenciesList((prev) => [...prev, newAgency]);
    handleAgencySelect(newAgency);
    setCooperatingSearchTerm("");
    setIsCooperatingDropdownOpen(false);
  };

  const handleAgencyRemove = (agencyId: number) => {
    const newSelectedAgencies = selectedAgencies.filter((a) => a.id !== agencyId);
    setSelectedAgencies(newSelectedAgencies);
    onUpdate("cooperating_agencies", newSelectedAgencies);
  };

  const handleTagSelect = (tag: { id: number; name: string }) => {
    if (!selectedTags.includes(tag.name)) {
      const newSelectedTags = [...selectedTags, tag.name];
      setSelectedTags(newSelectedTags);
      const currentTagIds = formData.tags || [];
      const newTagIds = [...currentTagIds, tag.id];
      onUpdate("tags", newTagIds);
    }
    setTagsSearchTerm("");
    setIsTagsDropdownOpen(false);
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

  // Click Outside Listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest(".agency-name-dropdown-container")) setIsAgencyDropdownOpen(false);
      if (!target.closest(".cooperating-agency-dropdown-container")) setIsCooperatingDropdownOpen(false);
      if (!target.closest(".tags-dropdown-container")) setIsTagsDropdownOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);




  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <FileText className="text-[#C8102E] w-5 h-5" />
          </div>
          Basic Information
        </h2>
        <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          Required
        </div>
      </div>

      {/* Program, Project, School Year */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
            Program Title *
            <Tooltip content="The name of the program or strategic initiative that this project falls under" />
          </label>
          <input
            type="text"
            name="program_title"
            value={formData.program_title || ""}
            onChange={onInputChange}
            maxLength={256}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8102E]"
            placeholder="Enter program title"
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
            Project Title *
            <Tooltip content="A specific and concise title for your research or development project" />
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
          <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
            School Year *
            <Tooltip content="Please enter the academic year (e.g., 2025 - 2026)" />
          </label>
          <div className="flex items-center gap-3">
            <input
              type="text"
              maxLength={4}
              value={(formData.schoolYear || "").split("-")[0] || ""}
              onChange={(e) => {
                const start = e.target.value.replace(/\D/g, "");
                const end = (formData.schoolYear || "").split("-")[1] || "";
                onUpdate("schoolYear", `${start}-${end}`);
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8102E] text-center"
              placeholder="YYYY"
            />
            <span className="text-gray-400 font-bold text-xl">–</span>
            <input
              type="text"
              maxLength={4}
              value={(formData.schoolYear || "").split("-")[1] || ""}
              onChange={(e) => {
                const start = (formData.schoolYear || "").split("-")[0] || "";
                const end = e.target.value.replace(/\D/g, "");
                onUpdate("schoolYear", `${start}-${end}`);
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8102E] text-center"
              placeholder="YYYY"
            />
          </div>
        </div>

        {/* Dates & Duration */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <Calendar className="text-gray-400 w-4 h-4" />
            Planned Start Date *
            <Tooltip content="The expected date when the project implementation will begin" />
          </label>
          <input
            type="date"
            name="plannedStartDate"
            value={formData.plannedStartDate || ""}
            onChange={handleDateChangeWithCalc}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8102E]"
          />
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <Calendar className="text-gray-400 w-4 h-4" />
            Planned End Date *
            <Tooltip content="The expected date when the project implementation will be completed" />
          </label>
          <input
            type="date"
            name="plannedEndDate"
            value={formData.plannedEndDate || ""}
            onChange={handleDateChangeWithCalc}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8102E]"
          />
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <Clock className="text-gray-400 w-4 h-4" />
            Duration
            <Tooltip content="The total length of the project implementation period in months or years" />
          </label>
          <div className="relative">
            <select
              name="duration"
              value={formData.duration || ""}
              onChange={handleDurationChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8102E] appearance-none bg-white"
            >
              <option value="" disabled>Select Duration or Calculate</option>
              <option value="6">6 Months</option>
              <option value="12">1 Year</option>
              <option value="18">1 Year, 6 Months</option>
              <option value="24">2 Years</option>
              <option value="36">3 Years</option>
              {formData.duration && !["6", "12", "18", "24", "36"].includes(formData.duration) && (
                <option value={formData.duration}>{formatDuration(parseInt(formData.duration))}</option>
              )}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
              <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* AGENCY */}
      <div className="space-y-2 agency-name-dropdown-container">
        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
          <Building2 className="text-gray-400 w-4 h-4" />
          Agency *
          <Tooltip content="The government agency, institution, or organization implementing the project" />
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
      </div>

      {/* ADDRESS */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
          <MapPin className="text-gray-400 w-4 h-4" />
          Agency Address *
          <Tooltip content="The complete office address where the project will be managed" />
        </label>

        {availableAddresses.length > 0 && (
          <div className="mb-3">
            <select
              className="w-full px-4 py-2 border border-blue-200 bg-blue-50 rounded-lg text-sm text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onChange={handleAddressSelect}
              value={formData.agencyAddress?.id ? String(formData.agencyAddress.id) : ""}
            >
              <option value="" disabled>-- Select a known address (Optional) --</option>
              {availableAddresses.map(addr => (
                <option key={addr.id} value={addr.id}>
                  {addr.street || ""}, {addr.barangay || ""}, {addr.city}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-500">Street</label>
            <input
              type="text"
              name="street"
              value={formData.agencyAddress?.street || ""}
              onChange={(e) => handleAddressChange("street", e.target.value)}
              maxLength={256}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8102E]"
              placeholder="Street Name / # "
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-500">Barangay</label>
            <input
              type="text"
              name="barangay"
              value={formData.agencyAddress?.barangay || ""}
              onChange={(e) => handleAddressChange("barangay", e.target.value)}
              maxLength={256}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8102E]"
              placeholder="Barangay Name"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-800 font-semibold">City *</label>
            <input
              type="text"
              name="city"
              value={formData.agencyAddress?.city || ""}
              onChange={(e) => handleAddressChange("city", e.target.value)}
              maxLength={256}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8102E]"
              placeholder="City / Municipality"
            />
          </div>
        </div>
      </div>

      {/* Telephone & Email */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <Phone className="text-gray-400 w-4 h-4" />
            Telephone *
            <Tooltip content="The contact phone number of the project implementing agency or principal proposer" />
          </label>
          <input
            type="tel"
            name="telephone"
            value={formData.telephone || ""}
            onChange={onInputChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8102E]"
            placeholder="Enter telephone number"
          />
        </div>
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <Mail className="text-gray-400 w-4 h-4" />
            Email *
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

      {/* COOPERATING AGENCIES */}
      <div className="space-y-2 cooperating-agency-dropdown-container">
        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
          <Users className="text-gray-400 w-4 h-4" />
          Cooperating Agencies
          <Tooltip content="Other government agencies, institutions, or organizations partnering with the lead agency to implement the project" />
        </label>
        {selectedAgencies.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {selectedAgencies.map((agency) => (
              <span key={agency.id} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                {agency.name}
                <button
                  type="button"
                  onClick={() => handleAgencyRemove(agency.id)}
                  className="ml-2 inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-blue-200 focus:outline-none"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
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
                    setCooperatingSearchTerm("");
                    setIsCooperatingDropdownOpen(false);
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
        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
          <Tags className="text-gray-400 w-4 h-4" />
          Tags
          <Tooltip content="Disciplines or specializations related to the project (e.g., Agricultural Engineering, Biotechnology)" />
        </label>
        {selectedTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
            {selectedTags.map((tag, index) => (
              <div
                key={index}
                className="flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-2 rounded-lg text-sm"
              >
                <span>{tag}</span>
                <button type="button" onClick={() => handleTagRemove(tag)} className="hover:text-blue-600">
                  <X className="w-3 h-3" />
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
                    className="px-4 py-3 cursor-pointer hover:bg-gray-50"
                    onClick={() => handleTagSelect(tag)}
                  >
                    <span className="text-sm text-gray-700">{tag.name}</span>
                  </div>
                ))
              ) : (
                <div className="px-4 py-3 text-sm text-gray-500">No tags found</div>
              )}
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default BasicInformation;