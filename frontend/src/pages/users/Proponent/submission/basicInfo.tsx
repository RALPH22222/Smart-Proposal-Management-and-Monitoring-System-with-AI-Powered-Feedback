import React, { useState, useEffect } from 'react';
import {
  FileText, Building2, Phone, Mail, Users, Tags, X, Clock, MapPin, Briefcase, Plus
} from 'lucide-react';
import type { FormData } from '../../../../types/proponent-form';
import { fetchAgencies, fetchTags } from '../../../../services/proposal.api';

interface BasicInformationProps {
  formData: FormData;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onUpdate: (field: keyof FormData, value: any) => void;
}

const durationOptions = ['3 months', '6 months', '1 year', '2 years', '3 years'];

const BasicInformation: React.FC<BasicInformationProps> = ({ formData, onInputChange, onUpdate }) => {
  // --- STATE ---
  const [agenciesList, setAgenciesList] = useState<{ id: number; name: string }[]>([]);
  const [tagsList, setTagsList] = useState<{ id: number; name: string }[]>([]); 
  const [isLoading, setIsLoading] = useState(true);

  // Dropdown UI States
  const [isAgencyDropdownOpen, setIsAgencyDropdownOpen] = useState(false);
  const [isCooperatingDropdownOpen, setIsCooperatingDropdownOpen] = useState(false);
  const [isTagsDropdownOpen, setIsTagsDropdownOpen] = useState(false);
  const [isDurationDropdownOpen, setIsDurationDropdownOpen] = useState(false);

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
  const [filteredDurationOptions, setFilteredDurationOptions] = useState(durationOptions);

  // --- 1. FETCH DATA ---
  useEffect(() => {
    const loadData = async () => {
      try {
        const [agenciesData, tagsData] = await Promise.all([fetchAgencies(), fetchTags()]);
        setAgenciesList(agenciesData);
        setFilteredAgencies(agenciesData);
        setFilteredCooperatingAgencies(agenciesData);
        setTagsList(tagsData);
        setFilteredTags(tagsData);
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
      // Because we save full objects now, we can just reload them directly
      if (formData.cooperatingAgencies?.length > 0) {
        setSelectedAgencies(formData.cooperatingAgencies);
      }
    }
    if (formData.discipline) {
      const savedTags = formData.discipline.split(', ').filter(t => t.trim() !== '');
      if (savedTags.join(',') !== selectedTags.join(',')) setSelectedTags(savedTags);
    }
  }, [isLoading, agenciesList, formData.cooperatingAgencies, formData.discipline]);

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
    if (tagsList.length > 0) {
      setFilteredTags(tagsList.filter(t => t.name.toLowerCase().includes(tagsSearchTerm.toLowerCase())));
    }
  }, [tagsSearchTerm, tagsList]);

  useEffect(() => {
    setFilteredDurationOptions(durationOptions.filter(d => d.toLowerCase().includes((formData.duration || '').toLowerCase())));
  }, [formData.duration]);


  // --- HANDLERS ---

  const handleAgencySelect = (agency: { id: number; name: string }) => {
    const isSelected = selectedAgencies.some(a => a.id === agency.id);
    let newSelectedAgencies;
    if (isSelected) newSelectedAgencies = selectedAgencies.filter(a => a.id !== agency.id);
    else newSelectedAgencies = [...selectedAgencies, agency];
    
    setSelectedAgencies(newSelectedAgencies);
    onUpdate('cooperatingAgencies', newSelectedAgencies);
  };

  // --- CREATE CUSTOM AGENCY ---
  const handleCreateAgency = () => {
    if (!cooperatingSearchTerm.trim()) return;

    if (selectedAgencies.some(a => a.name.toLowerCase() === cooperatingSearchTerm.trim().toLowerCase())) {
        setCooperatingSearchTerm('');
        return;
    }

    const newAgency = {
        id: Date.now(), // Generate Temporary ID
        name: cooperatingSearchTerm.trim()
    };

    // 1. Add to Master List (Crucial: Prevents disappearance on re-render)
    setAgenciesList(prev => [...prev, newAgency]);
    
    // 2. Select it
    const newSelectedAgencies = [...selectedAgencies, newAgency];
    setSelectedAgencies(newSelectedAgencies);
    
    // 3. Update Form
    onUpdate('cooperatingAgencies', newSelectedAgencies);
    
    setCooperatingSearchTerm('');
    setIsCooperatingDropdownOpen(false);
  };

  const handleAgencyRemove = (agencyId: number) => {
    const newSelectedAgencies = selectedAgencies.filter(a => a.id !== agencyId);
    setSelectedAgencies(newSelectedAgencies);
    onUpdate('cooperatingAgencies', newSelectedAgencies);
  };

  // const handleAgencyNameSelect = (agency: { id: number; name: string }) => {
  //   onUpdate('agencyName', agency.name); 
  //   setAgencySearchTerm(agency.name);
  //   setIsAgencyDropdownOpen(false);
  // };

  const handleAgencyNameSelect = (agency: { id: number; name: string }) => {
    const fakeEvent = {
      target: { name: 'agency', value: agency.name }
    } as React.ChangeEvent<HTMLInputElement>;
    onInputChange(fakeEvent);
    setAgencySearchTerm(agency.name);
    setIsAgencyDropdownOpen(false);
  };

  const handleAgencyNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAgencySearchTerm(e.target.value);
    onInputChange(e);
  };

  const handleTagSelect = (tag: { id: number; name: string }) => {
    if (!selectedTags.includes(tag.name)) {
        const newSelectedTags = [...selectedTags, tag.name];
        setSelectedTags(newSelectedTags);
        onUpdate('discipline', newSelectedTags.join(', '));
    }
    setTagsSearchTerm('');
    setIsTagsDropdownOpen(false);
  };

  // --- CREATE CUSTOM TAG ---
  const handleCreateTag = () => {
    if (!tagsSearchTerm.trim()) return;
    const newTag = tagsSearchTerm.trim();
    if (!selectedTags.includes(newTag)) {
        const newSelectedTags = [...selectedTags, newTag];
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

  const handleDurationSelect = (value: string) => {
    onUpdate('duration', value);
    setIsDurationDropdownOpen(false);
  };

  // Click Outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.agency-name-dropdown-container')) setIsAgencyDropdownOpen(false);
      if (!target.closest('.cooperating-agency-dropdown-container')) setIsCooperatingDropdownOpen(false);
      if (!target.closest('.tags-dropdown-container')) setIsTagsDropdownOpen(false);
      if (!target.closest('.duration-dropdown-container')) setIsDurationDropdownOpen(false);
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

      {/* Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">Program Title *</label>
          <input type="text" name="programTitle" value={formData.programTitle} onChange={onInputChange} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8102E]" placeholder="Enter program title" />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">Project Title *</label>
          <input type="text" name="projectTitle" value={formData.projectTitle} onChange={onInputChange} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8102E]" placeholder="Enter project title" />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">School Year *</label>
          <input type="text" name="schoolYear" value={formData.schoolYear || ''} onChange={onInputChange} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8102E]" placeholder="e.g. 2023-2024" />
        </div>
        <div className="space-y-2 duration-dropdown-container">
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700"><Clock className="text-gray-400 w-4 h-4" /> Duration *</label>
          <div className="relative">
            <input type="text" name="duration" value={formData.duration} onChange={(e) => { onInputChange(e); setIsDurationDropdownOpen(true); }} onFocus={() => setIsDurationDropdownOpen(true)} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8102E]" placeholder="e.g., 6 months" />
            {isDurationDropdownOpen && (
              <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                {filteredDurationOptions.map((opt) => (
                  <div key={opt} className="px-4 py-3 cursor-pointer hover:bg-gray-50 border-b border-gray-100" onClick={() => handleDurationSelect(opt)}><span className="text-sm text-gray-700">{opt}</span></div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700"><Building2 className="text-gray-400 w-4 h-4" /> Agency & Address *</label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 agency-name-dropdown-container">
            <div className="space-y-2">
                <div className="relative">
                    <input type="text" name="agencyName" value={formData.agencyName || ''} onChange={(e) => { setAgencySearchTerm(e.target.value); onInputChange(e); }} onFocus={() => setIsAgencyDropdownOpen(true)} className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8102E]" placeholder={isLoading ? "Loading agencies..." : "Search or type agency name"} />
                    <Briefcase className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                    {isAgencyDropdownOpen && filteredAgencies.length > 0 && (
                        <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                        {filteredAgencies.map((agency) => (
                            <div key={agency.id} className="px-4 py-3 cursor-pointer hover:bg-gray-50" onClick={() => handleAgencyNameSelect(agency)}>
                                <span className="text-sm text-gray-700">{agency.name}</span>
                            </div>
                        ))}
                        </div>
                    )}
                </div>
            </div>
            <div className="space-y-2">
                <div className="relative">
                    <input type="text" name="agencyAddress" value={formData.agencyAddress || ''} onChange={onInputChange} className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8102E]" placeholder="Enter Address" />
                    <MapPin className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                </div>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700"><Phone className="text-gray-400 w-4 h-4" /> Telephone *</label>
          <input type="tel" name="telephone" value={formData.telephone} onChange={onInputChange} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8102E]" placeholder="Enter telephone number" />
        </div>
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700"><Mail className="text-gray-400 w-4 h-4" /> Email *</label>
          <input type="email" name="email" value={formData.email} onChange={onInputChange} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8102E]" placeholder="Enter email address" />
        </div>
      </div>

      {/* COOPERATING AGENCIES (CREATE ENABLED) */}
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
            // ENTER KEY ENABLED
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleCreateAgency(); }}}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8102E]" 
          />
          
          {isCooperatingDropdownOpen && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-xl shadow-lg max-h-60 overflow-y-auto">
              
              {/* Existing Items */}
              {filteredCooperatingAgencies.map((agency) => (
                <div key={agency.id} className={`px-4 py-3 cursor-pointer hover:bg-gray-50 ${selectedAgencies.some(a => a.id === agency.id) ? 'bg-[#C8102E]/10' : ''}`} onClick={() => { handleAgencySelect(agency); setCooperatingSearchTerm(''); setIsCooperatingDropdownOpen(false); }}>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" checked={selectedAgencies.some(a => a.id === agency.id)} readOnly className="w-4 h-4 text-[#C8102E] rounded" />
                    <span className="text-sm text-gray-700">{agency.name}</span>
                  </div>
                </div>
              ))}

              {/* CREATE OPTION */}
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
        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700"><Tags className="text-gray-400 w-4 h-4" /> Tags / Discipline</label>
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
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleCreateTag(); }}}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8102E]" 
          />
          {isTagsDropdownOpen && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-xl shadow-lg max-h-60 overflow-y-auto">
              {filteredTags.map((tag) => (
                <div key={tag.id} className="px-4 py-3 cursor-pointer hover:bg-gray-50" onClick={() => handleTagSelect(tag)}>
                  <div className="flex items-center gap-3"><Tags className="w-4 h-4 text-gray-400" /><span className="text-sm text-gray-700">{tag.name}</span></div>
                </div>
              ))}
               {tagsSearchTerm && !filteredTags.some(t => t.name.toLowerCase() === tagsSearchTerm.toLowerCase()) && (
                 <div className="px-4 py-3 cursor-pointer hover:bg-blue-50 border-t border-gray-100 text-blue-600 font-medium flex items-center gap-2" onClick={handleCreateTag}>
                    <Plus className="w-4 h-4" /><span>Add "{tagsSearchTerm}"</span>
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