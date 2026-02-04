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
import { fetchAgencies, fetchTags } from "../../../../services/proposal.api";
import { differenceInMonths, parseISO, isValid, addMonths, format } from "date-fns";
import Tooltip from "../../../../components/Tooltip";
import type { FormData } from "src/types/proponent-form";
import { useAuthContext } from "../../../../context/AuthContext";

interface BasicInformationProps {
  formData: FormData;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onUpdate: (field: string, value: any) => void;
}

const BasicInformation: React.FC<BasicInformationProps> = ({ formData, onInputChange, onUpdate }) => {
  // --- AUTH CONTEXT ---
  const { user } = useAuthContext();

  // --- STATE ---
  const [agenciesList, setAgenciesList] = useState<{ id: number; name: string }[]>([]);
  const [tagsList, setTagsList] = useState<{ id: number; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Dropdown UI States
  const [isAgencyDropdownOpen, setIsAgencyDropdownOpen] = useState(false);
  const [isCooperatingDropdownOpen, setIsCooperatingDropdownOpen] = useState(false);
  const [isTagsDropdownOpen, setIsTagsDropdownOpen] = useState(false);

  // Search Terms
  const [agencySearchTerm, setAgencySearchTerm] = useState("");
  const [cooperatingSearchTerm, setCooperatingSearchTerm] = useState("");
  const [tagsSearchTerm, setTagsSearchTerm] = useState("");

  // Selected Items
  const [selectedAgencies, setSelectedAgencies] = useState<{ id: number; name: string }[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Filtered Lists
  const [filteredAgencies, setFilteredAgencies] = useState<{ id: number; name: string }[]>([]);
  const [filteredCooperatingAgencies, setFilteredCooperatingAgencies] = useState<{ id: number; name: string }[]>([]);
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
        setFilteredAgencies(agenciesData || []);
        setFilteredCooperatingAgencies(agenciesData || []);
        setTagsList(tagsData || []);
        setFilteredTags(tagsData || []);
      } catch (error) {
        console.error("Error loading basic info data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  // --- 2. RESTORE SELECTIONS ---
  useEffect(() => {
    if (!isLoading && agenciesList.length > 0) {
      if (formData.cooperating_agencies && formData.cooperating_agencies.length > 0) {
        setSelectedAgencies(formData.cooperating_agencies);
      }
    }
    // Restore tags
    if (!isLoading && tagsList.length > 0 && formData.tags && formData.tags.length > 0) {
      const tagNames = formData.tags
        .map((id: number) => tagsList.find((t) => t.id === id)?.name)
        .filter((name): name is string => !!name);
      if (tagNames.join(",") !== selectedTags.join(",")) {
        setSelectedTags(tagNames);
      }
    }
    // Restore Agency Search Term
    if (formData.agency && !agencySearchTerm) {
      if (typeof formData.agency === "number") {
        const found = agenciesList.find((a) => a.id === formData.agency);
        if (found) setAgencySearchTerm(found.name);
      } else {
        setAgencySearchTerm(String(formData.agency));
      }
    }
  }, [isLoading, agenciesList, tagsList, formData.cooperating_agencies, formData.tags, formData.agency]);

  // Set default duration to 6 months if empty
  useEffect(() => {
    if (!formData.duration) {
      onUpdate("duration", "6");
    }
  }, []);

  // Auto-populate email from authenticated user
  useEffect(() => {
    if (user?.email && !formData.email) {
      onUpdate("email", user.email);
    }
  }, [user]);

  // Helper function to format duration in readable format
  const formatDuration = (months: number): string => {
    if (months < 12) {
      return `${months} Month${months !== 1 ? 's' : ''}`;
    }
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;

    if (remainingMonths === 0) {
      return `${years} Year${years !== 1 ? 's' : ''}`;
    }
    return `${years} Year${years !== 1 ? 's' : ''}, ${remainingMonths} Month${remainingMonths !== 1 ? 's' : ''}`;
  };

  // --- 3. DURATION LOGIC ---
  const calculateImplementationDates = (startStr: string, durationStr: string = "6") => {
    if (!startStr) return;

    const start = parseISO(startStr);
    if (!isValid(start)) return;

    const effectiveDuration = durationStr || "6";
    const monthsToAdd = parseInt(effectiveDuration, 10);

    if (!isNaN(monthsToAdd) && monthsToAdd > 0) {
      const newEnd = addMonths(start, monthsToAdd);
      onUpdate("plannedEndDate", format(newEnd, "yyyy-MM-dd"));

      if (!formData.duration) {
        onUpdate("duration", effectiveDuration);
      }
    }
  };

  useEffect(() => {
    const startDate = formData.plannedStartDate;
    const endDate = formData.plannedEndDate;

    if (startDate && endDate) {
      try {
        const start = parseISO(startDate);
        const end = parseISO(endDate);

        if (isValid(start) && isValid(end) && end >= start) {
          const months = differenceInMonths(end, start);
          const durationValue = String(months);
          if (months > 0 && formData.duration !== durationValue) {
            // Logic to update duration if needed based on dates
          }
        }
      } catch (e) {
        // ignore
      }
    }
  }, [formData.plannedStartDate, formData.plannedEndDate]);

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
      // When start date changes, recalculate end date based on duration
      calculateImplementationDates(value, formData.duration);
    } else if (name === "plannedEndDate") {
      // When end date changes, calculate duration
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
        } catch (e) {
          console.error("Error calculating duration:", e);
        }
      }
    }
  };

  // --- FILTERING ---
  useEffect(() => {
    if (agenciesList.length > 0) {
      setFilteredAgencies(agenciesList.filter((a) => a.name.toLowerCase().includes(agencySearchTerm.toLowerCase())));
    }
  }, [agencySearchTerm, agenciesList]);

  useEffect(() => {
    if (agenciesList.length > 0) {
      setFilteredCooperatingAgencies(
        agenciesList.filter((a) => a.name.toLowerCase().includes(cooperatingSearchTerm.toLowerCase())),
      );
    }
  }, [cooperatingSearchTerm, agenciesList]);

  useEffect(() => {
    if (tagsList.length > 0) {
      if (!tagsSearchTerm) {
        setFilteredTags(tagsList);
      } else {
        setFilteredTags(tagsList.filter((t) => t.name.toLowerCase().includes(tagsSearchTerm.toLowerCase())));
      }
    }
  }, [tagsSearchTerm, tagsList]);

  // --- HANDLERS ---
  const handleAgencyNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAgencySearchTerm(value);
    onUpdate("agency", value);
  };

  const handleAgencyNameSelect = (agency: { id: number; name: string }) => {
    onUpdate("agency", agency.id);
    setAgencySearchTerm(agency.name);
    setIsAgencyDropdownOpen(false);
  };

  const handleAddressChange = (field: "street" | "barangay" | "city", value: string) => {
    const newAddress = {
      ...formData.agencyAddress,
      [field]: value,
    };
    onUpdate("agencyAddress", newAddress);
  };

  const handleAgencySelect = (agency: { id: number; name: string }) => {
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
    const newAgency = { id: Date.now(), name: cooperatingSearchTerm.trim() };
    setAgenciesList((prev) => [...prev, newAgency]);
    const newSelectedAgencies = [...selectedAgencies, newAgency];
    setSelectedAgencies(newSelectedAgencies);
    onUpdate("cooperating_agencies", newSelectedAgencies);
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

      {/* Fields - Project Details & Dates */}
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
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8102E]"
            placeholder="Enter project title"
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
            School Year *
            <Tooltip content="The academic year in which the project will be executed (e.g., 2024-2025)" />
          </label>
          <input
            type="text"
            name="schoolYear"
            value={formData.schoolYear || ""}
            onChange={onInputChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8102E]"
            placeholder="e.g. 2023-2024"
          />
        </div>

        {/* Planned Start Date */}
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

        {/* Planned End Date */}
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

        {/* Duration (Select Dropdown) */}
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
              <option value="" disabled>
                Select Duration or Calculate
              </option>
              <option value="6">6 Months</option>
              <option value="12">1 Year</option>
              <option value="18">1 Year, 6 Months</option>
              <option value="24">2 Years</option>
              <option value="36">3 Years</option>
              {/* Fallback option if calculated value doesn't match predefined options */}
              {formData.duration && !["6", "12", "18", "24", "36"].includes(formData.duration) && (
                <option value={formData.duration}>{formatDuration(parseInt(formData.duration))}</option>
              )}
            </select>
            {/* Custom Arrow because of appearance-none */}
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
          <Tooltip content="The complete office address where the project will be managed, including street, barangay, and city" />
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Street */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-500">Street</label>
            <input
              type="text"
              name="street"
              value={formData.agencyAddress?.street || ""}
              onChange={(e) => handleAddressChange("street", e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8102E]"
              placeholder="Street Name / # "
            />
          </div>

          {/* Barangay */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-500">Barangay</label>
            <input
              type="text"
              name="barangay"
              value={formData.agencyAddress?.barangay || ""}
              onChange={(e) => handleAddressChange("barangay", e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8102E]"
              placeholder="Barangay Name"
            />
          </div>

          {/* City */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-500">City *</label>
            <input
              type="text"
              name="city"
              value={formData.agencyAddress?.city || ""}
              onChange={(e) => handleAddressChange("city", e.target.value)}
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