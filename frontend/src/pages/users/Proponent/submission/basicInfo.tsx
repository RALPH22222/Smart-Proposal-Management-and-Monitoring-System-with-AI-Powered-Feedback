import React, { useState, useEffect } from 'react';
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
  Calendar
} from 'lucide-react';
import { fetchAgencies, fetchTags } from '../../../../services/proposal.api';
import { differenceInMonths, parseISO, isValid, addMonths, format } from 'date-fns';

// Define a Local Interface that matches the State in Submission.tsx (Dates as strings)
interface LocalFormData {
  programTitle: string;
  projectTitle: string;
  agencyName: string; // Changed back to agencyName to match your previous code
  agencyAddress: { 
    street: string;
    barangay: string;
    city: string;
  };
  schoolYear: string;
  tags: string;
  email: string;
  telephone: string;
  cooperatingAgencies: { id: number; name: string }[];
  plannedStartDate: string; 
  plannedEndDate: string;
  duration: string;
  discipline: string;
}

interface BasicInformationProps {
  formData: any; // Using any here to allow flexibility between strict FormData and Local State
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onUpdate: (field: string, value: any) => void;
}

const BasicInformation: React.FC<BasicInformationProps> = ({ formData, onInputChange, onUpdate }) => {
  // Cast formData to our local type for easier access code suggestions
  const data = formData as LocalFormData;

  // --- STATE ---
  const [agenciesList, setAgenciesList] = useState<{ id: number; name: string }[]>([]);
  const [tagsList, setTagsList] = useState<{ id: number; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Dropdown UI States
  const [isAgencyDropdownOpen, setIsAgencyDropdownOpen] = useState(false);
  const [isCooperatingDropdownOpen, setIsCooperatingDropdownOpen] = useState(false);
  const [isTagsDropdownOpen, setIsTagsDropdownOpen] = useState(false);

  // Search Terms
  const [agencySearchTerm, setAgencySearchTerm] = useState('');
  const [cooperatingSearchTerm, setCooperatingSearchTerm] = useState('');
  const [tagsSearchTerm, setTagsSearchTerm] = useState('');

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
            fetchTags().catch(() => [])
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
      if (data.cooperatingAgencies && data.cooperatingAgencies.length > 0) {
        setSelectedAgencies(data.cooperatingAgencies);
      }
    }
    if (data.discipline) {
      const savedTags = data.discipline.split(', ').filter(t => t.trim() !== '');
      if (savedTags.join(',') !== selectedTags.join(',')) setSelectedTags(savedTags);
    }
    // Restore Agency Search Term if exists
    if (data.agencyName && typeof data.agencyName === 'string' && !agencySearchTerm) {
        setAgencySearchTerm(data.agencyName);
    }
  }, [isLoading, agenciesList, data.cooperatingAgencies, data.discipline, data.agencyName]);

  // Set default duration to 6 months if empty
  useEffect(() => {
    if (!data.duration) {
      onUpdate('duration', '6 months');
    }
  }, []);

  // --- 3. DURATION LOGIC (UPDATED: Helper Function) ---

  const calculateImplementationDates = (startStr: string, durationStr: string = '6 months') => {
      if (!startStr) return;
      
      const start = parseISO(startStr);
      if (!isValid(start)) return;

      let monthsToAdd = 0;
      // Default to 6 months if duration is empty or invalid
      const effectiveDuration = durationStr || '6 months';
      
      if (effectiveDuration.includes('month')) {
          monthsToAdd = parseInt(effectiveDuration.split(' ')[0]);
      } else if (effectiveDuration.includes('year')) {
          const val = parseInt(effectiveDuration.split(' ')[0]);
          monthsToAdd = val * 12;
      }

      if (monthsToAdd > 0) {
          const newEnd = addMonths(start, monthsToAdd);
          onUpdate('plannedEndDate', format(newEnd, 'yyyy-MM-dd'));
          
          // Also update the visible duration field if it was empty
          if (!data.duration) {
              onUpdate('duration', effectiveDuration);
          }
      }
  };

  // Calculate Duration if Dates Change
  useEffect(() => {
    const startDate = data.plannedStartDate;
    const endDate = data.plannedEndDate;

    if (startDate && endDate) {
      try {
        const start = parseISO(startDate);
        const end = parseISO(endDate);

        if (isValid(start) && isValid(end) && end >= start) {
          const months = differenceInMonths(end, start);
          let durationString = `${months} month${months !== 1 ? 's' : ''}`;

          if (months % 12 === 0 && months >= 12) {
            const years = months / 12;
            durationString = `${years} year${years !== 1 ? 's' : ''}`;
          }
          
          // Update duration state visibly
          if (data.duration !== durationString) {
             // We update the duration derived from dates
             // Note: This might conflict if user is selecting duration to drive end date.
             // But the prompt says "When user selects Start Date, automatically display End Date based on Duration".
          }
        }
      } catch (e) {
        // ignore
      }
    }
  }, [data.plannedStartDate, data.plannedEndDate]);

  // Handle Duration Dropdown Change -> Calculate End Date
  const handleDurationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedDuration = e.target.value;
    onUpdate('duration', selectedDuration);
    if (data.plannedStartDate) {
        calculateImplementationDates(data.plannedStartDate, selectedDuration);
    }
  };

  // Handle Date Change
  const handleDateChangeWithCalc = (e: React.ChangeEvent<HTMLInputElement>) => {
      onInputChange(e); 
      
      const { name, value } = e.target;
      if (name === 'plannedStartDate') {
          // When Start Date changes, recalculate End Date based on current Duration (or default 1 year)
          calculateImplementationDates(value, data.duration);
      }
      
      // If End Date changes manually, we could reverse calc duration, but the prompt emphasizes Start+Duration -> End Logic.
      // So detailed reverse logic is kept as is in the useEffect or here if needed.
  };


  // --- FILTERING ---
  useEffect(() => {
    if (agenciesList.length > 0) {
      setFilteredAgencies(agenciesList.filter(a => a.name.toLowerCase().includes(agencySearchTerm.toLowerCase())));
    }
  }, [agencySearchTerm, agenciesList]);

  useEffect(() => {
    if (agenciesList.length > 0) {
      setFilteredCooperatingAgencies(agenciesList.filter(a => a.name.toLowerCase().includes(cooperatingSearchTerm.toLowerCase())));
    }
  }, [cooperatingSearchTerm, agenciesList]);

  useEffect(() => {
    // FIX: Show all tags if search is empty, otherwise filter
    if (tagsList.length > 0) {
      if (!tagsSearchTerm) {
          setFilteredTags(tagsList);
      } else {
          setFilteredTags(tagsList.filter(t => t.name.toLowerCase().includes(tagsSearchTerm.toLowerCase())));
      }
    }
  }, [tagsSearchTerm, tagsList]);


  // --- HANDLERS ---

  // --- 1. Agency Handlers ---
  const handleAgencyNameSelect = (agency: { id: number; name: string }) => {
    onUpdate('agencyName', agency.name);
    setAgencySearchTerm(agency.name);
    setIsAgencyDropdownOpen(false);
  };

  const handleAgencyNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setAgencySearchTerm(newName);
    onUpdate('agencyName', newName);
  };

  // --- 2. Address Handlers ---
  const handleAddressChange = (field: 'street' | 'barangay' | 'city', value: string) => {
    const newAddress = { 
        ...data.agencyAddress, 
        [field]: value 
    };
    onUpdate('agencyAddress', newAddress);
  };

  // --- 3. Cooperating Agencies Handlers ---
  const handleAgencySelect = (agency: { id: number; name: string }) => {
    const isSelected = selectedAgencies.some(a => a.id === agency.id);
    let newSelectedAgencies;
    if (isSelected) newSelectedAgencies = selectedAgencies.filter(a => a.id !== agency.id);
    else newSelectedAgencies = [...selectedAgencies, agency];

    setSelectedAgencies(newSelectedAgencies);
    onUpdate('cooperatingAgencies', newSelectedAgencies);
  };

  const handleCreateAgency = () => {
    if (!cooperatingSearchTerm.trim()) return;
    if (selectedAgencies.some(a => a.name.toLowerCase() === cooperatingSearchTerm.trim().toLowerCase())) {
      setCooperatingSearchTerm('');
      return;
    }
    const newAgency = { id: Date.now(), name: cooperatingSearchTerm.trim() };
    setAgenciesList(prev => [...prev, newAgency]);
    const newSelectedAgencies = [...selectedAgencies, newAgency];
    setSelectedAgencies(newSelectedAgencies);
    onUpdate('cooperatingAgencies', newSelectedAgencies);
    setCooperatingSearchTerm('');
    setIsCooperatingDropdownOpen(false);
  };

  const handleAgencyRemove = (agencyId: number) => {
    const newSelectedAgencies = selectedAgencies.filter(a => a.id !== agencyId);
    setSelectedAgencies(newSelectedAgencies);
    onUpdate('cooperatingAgencies', newSelectedAgencies);
  };

  // --- 4. Tag Handlers ---
  const handleTagSelect = (tag: { id: number; name: string }) => {
    if (!selectedTags.includes(tag.name)) {
      const newSelectedTags = [...selectedTags, tag.name];
      setSelectedTags(newSelectedTags);
      onUpdate('discipline', newSelectedTags.join(', '));
    }
    setTagsSearchTerm('');
    setIsTagsDropdownOpen(false);
  };

  const handleTagRemove = (tagName: string) => {
    const newSelectedTags = selectedTags.filter(t => t !== tagName);
    setSelectedTags(newSelectedTags);
    onUpdate('discipline', newSelectedTags.join(', '));
  };

  // Click Outside Listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.agency-name-dropdown-container')) setIsAgencyDropdownOpen(false);
      if (!target.closest('.cooperating-agency-dropdown-container')) setIsCooperatingDropdownOpen(false);
      if (!target.closest('.tags-dropdown-container')) setIsTagsDropdownOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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
          <label className="block text-sm font-semibold text-gray-700">Program Title *</label>
          <input type="text" name="programTitle" value={data.programTitle} onChange={onInputChange} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8102E]" placeholder="Enter program title" />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">Project Title *</label>
          <input type="text" name="projectTitle" value={data.projectTitle} onChange={onInputChange} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8102E]" placeholder="Enter project title" />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">School Year *</label>
          <input type="text" name="schoolYear" value={data.schoolYear || ''} onChange={onInputChange} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8102E]" placeholder="e.g. 2023-2024" />
        </div>

        {/* Planned Start Date */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700"><Calendar className="text-gray-400 w-4 h-4" /> Planned Start Date *</label>
          <input
            type="date"
            name="plannedStartDate"
            value={data.plannedStartDate || ''}
            onChange={handleDateChangeWithCalc}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8102E]"
          />
        </div>

        {/* Planned End Date */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700"><Calendar className="text-gray-400 w-4 h-4" /> Planned End Date *</label>
          <input
            type="date"
            name="plannedEndDate"
            value={data.plannedEndDate || ''}
            onChange={handleDateChangeWithCalc}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8102E]"
          />
        </div>

        {/* Duration (Select Dropdown) */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700"><Clock className="text-gray-400 w-4 h-4" /> Duration</label>
          <div className="relative">
            <select
                name="duration"
                value={data.duration || '6 months'}
                onChange={handleDurationChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8102E] appearance-none bg-white"
            >
                <option value="" disabled>Select Duration or Calculate</option>
                <option value="6 months">6 Months</option>
                <option value="12 months">12 Months</option>
                <option value="1 year">1 Year</option>
                <option value="18 months">18 Months</option>
                <option value="2 years">2 Years</option>
                <option value="3 years">3 Years</option>
                {/* Fallback option if calculated value doesn't match predefined options */}
                {data.duration && !['6 months', '12 months', '1 year', '18 months', '2 years', '3 years'].includes(data.duration) && (
                    <option value={data.duration}>{data.duration}</option>
                )}
            </select>
            {/* Custom Arrow because of appearance-none */}
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
            </div>
          </div>
        </div>
      </div>

      {/* AGENCY & ADDRESS */}
      <div className="space-y-4">
        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700"><Building2 className="text-gray-400 w-4 h-4" /> Agency & Address *</label>

        {/* Agency Name */}
        <div className="space-y-2 agency-name-dropdown-container">
          <div className="relative">
            <input
              type="text"
              name="agencyName" 
              value={agencySearchTerm || data.agencyName || ''} 
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
                    className={`px-4 py-3 cursor-pointer hover:bg-gray-50 ${data.agencyName === agency.name ? 'bg-[#C8102E]/10' : ''}`}
                    onClick={() => handleAgencyNameSelect(agency)}
                  >
                    <span className="text-sm text-gray-700">{agency.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Address Fields */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
          {/* Street */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-500">Street</label>
            <input
              type="text"
              name="street"
              value={data.agencyAddress?.street || ''}
              onChange={(e) => handleAddressChange('street', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8102E]"
              placeholder="Street/Purok/Subdivision"
            />
          </div>

          {/* Barangay */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-500">Barangay</label>
            <input
              type="text"
              name="barangay"
              value={data.agencyAddress?.barangay || ''}
              onChange={(e) => handleAddressChange('barangay', e.target.value)}
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
              value={data.agencyAddress?.city || ''}
              onChange={(e) => handleAddressChange('city', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8102E]"
              placeholder="City / Municipality"
            />
          </div>
        </div>
      </div>

      {/* Telephone & Email */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700"><Phone className="text-gray-400 w-4 h-4" /> Telephone *</label>
          <input type="tel" name="telephone" value={data.telephone} onChange={onInputChange} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8102E]" placeholder="Enter telephone number" />
        </div>
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700"><Mail className="text-gray-400 w-4 h-4" /> Email *</label>
          <input type="email" name="email" value={data.email} onChange={onInputChange} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8102E]" placeholder="Enter email address" />
        </div>
      </div>

      {/* COOPERATING AGENCIES */}
      <div className="space-y-2 cooperating-agency-dropdown-container">
        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700"><Users className="text-gray-400 w-4 h-4" /> Cooperating Agencies</label>

        {/* Selected Pills */}
        {selectedAgencies.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
            {selectedAgencies.map((agency) => (
              <div key={agency.id} className="flex items-center gap-2 bg-[#C8102E]/10 text-[#C8102E] px-3 py-2 rounded-lg text-sm">
                <span>{agency.name}</span>
                <button type="button" onClick={() => handleAgencyRemove(agency.id)} className="hover:text-[#C8102E]/70 transition-colors duration-200"><X className="w-3 h-3" /></button>
              </div>
            ))}
          </div>
        )}

        <div className="relative">
          <input
            type="text"
            placeholder={isLoading ? "Loading..." : "Search or type new cooperating agency..."}
            value={cooperatingSearchTerm}
            onChange={(e) => setCooperatingSearchTerm(e.target.value)}
            onFocus={() => setIsCooperatingDropdownOpen(true)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleCreateAgency(); } }}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8102E]"
          />

          {isCooperatingDropdownOpen && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-xl shadow-lg max-h-60 overflow-y-auto">
              {filteredCooperatingAgencies.map((agency) => (
                <div key={agency.id} className={`px-4 py-3 cursor-pointer hover:bg-gray-50 ${selectedAgencies.some(a => a.id === agency.id) ? 'bg-[#C8102E]/10' : ''}`} onClick={() => { handleAgencySelect(agency); setCooperatingSearchTerm(''); setIsCooperatingDropdownOpen(false); }}>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" checked={selectedAgencies.some(a => a.id === agency.id)} readOnly className="w-4 h-4 text-[#C8102E] rounded" />
                    <span className="text-sm text-gray-700">{agency.name}</span>
                  </div>
                </div>
              ))}
              {cooperatingSearchTerm && !filteredCooperatingAgencies.some(a => a.name.toLowerCase() === cooperatingSearchTerm.toLowerCase()) && (
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
        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700"><Tags className="text-gray-400 w-4 h-4" /> Tags</label>
        {selectedTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
            {selectedTags.map((tag, index) => (
              <div key={index} className="flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-2 rounded-lg text-sm"><span>{tag}</span><button type="button" onClick={() => handleTagRemove(tag)} className="hover:text-blue-600"><X className="w-3 h-3" /></button></div>
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
                  <div key={tag.id} className="px-4 py-3 cursor-pointer hover:bg-gray-50" onClick={() => handleTagSelect(tag)}>
                    <div className="flex items-center gap-3"><Tags className="w-4 h-4 text-gray-400" /><span className="text-sm text-gray-700">{tag.name}</span></div>
                  </div>
                ))
              ) : (
                <div className="px-4 py-3 text-gray-500 text-sm">
                  No matching tags found. Tags cannot be created manually.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BasicInformation;