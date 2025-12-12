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
  Settings,
  Plus,
  Trash2,
  MapPin,
  Briefcase
} from 'lucide-react';
import type { FormData } from '../../../../types/proponent-form';

interface BasicInformationProps {
  formData: FormData;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
}

const agenciesList = [
  { id: 1, name: 'Department of the Interior and Local Government (DILG)' },
  { id: 2, name: 'Department of National Defense (DND)' },
  { id: 3, name: 'Philippine National Police (PNP)' },
  { id: 4, name: 'Armed Forces of the Philippines (AFP)' },
  { id: 5, name: 'Department of Justice (DOJ)' },
  { id: 6, name: 'National Bureau of Investigation (NBI)' },
  { id: 7, name: 'Bureau of Jail Management and Penology (BJMP)' },
  { id: 8, name: 'Bureau of Fire Protection (BFP)' },
  { id: 9, name: 'Department of Social Welfare and Development (DSWD)' },
  { id: 10, name: 'Department of Health (DOH)' },
  { id: 11, name: 'Department of Education (DepEd)' },
  { id: 12, name: 'Commission on Higher Education (CHED)' },
  { id: 13, name: 'Technical Education and Skills Development Authority (TESDA)' },
  { id: 14, name: 'Department of Environment and Natural Resources (DENR)' },
  { id: 15, name: 'Department of Public Works and Highways (DPWH)' },
  { id: 16, name: 'Department of Transportation (DOTr)' },
  { id: 17, name: 'Metropolitan Manila Development Authority (MMDA)' },
  { id: 18, name: 'Philippine Drug Enforcement Agency (PDEA)' },
  { id: 19, name: 'National Disaster Risk Reduction and Management Council (NDRRMC)' },
  { id: 20, name: 'Philippine Coast Guard (PCG)' },
  { id: 21, name: 'Bureau of Corrections (BuCor)' },
  { id: 22, name: 'Philippine Ports Authority (PPA)' },
  { id: 23, name: 'Civil Aviation Authority of the Philippines (CAAP)' },
  { id: 24, name: 'Local Government Unit (LGU)' },
];

const tagsOptions = [
  { id: 1, name: 'Agriculture' },
  { id: 2, name: 'Technology' },
  { id: 3, name: 'Education' },
  { id: 4, name: 'Healthcare' },
  { id: 5, name: 'Environment' },
  { id: 6, name: 'Infrastructure' },
  { id: 7, name: 'Security' },
  { id: 8, name: 'Research' },  
  { id: 9, name: 'Development' },
  { id: 10, name: 'Innovation' },
  { id: 11, name: 'Sustainability' },
  { id: 12, name: 'Community' },
  { id: 13, name: 'Digital' },
  { id: 14, name: 'Renewable Energy' },
  { id: 15, name: 'Other' }
];

const durationOptions = [
  '3 months',
  '6 months',
  '1 year',
  '2 years',
  '3 years'
];

const BasicInformation: React.FC<BasicInformationProps> = ({ formData, onInputChange }) => {
  const [isAgencyDropdownOpen, setIsAgencyDropdownOpen] = useState<{ index: number, isOpen: boolean }>({ index: -1, isOpen: false });
  const [isCooperatingDropdownOpen, setIsCooperatingDropdownOpen] = useState(false);
  const [isTagsDropdownOpen, setIsTagsDropdownOpen] = useState(false);
  const [isDurationDropdownOpen, setIsDurationDropdownOpen] = useState(false);

  const [cooperatingSearchTerm, setCooperatingSearchTerm] = useState('');
  const [tagsSearchTerm, setTagsSearchTerm] = useState('');
  
  const [selectedAgencies, setSelectedAgencies] = useState<{ id: number; name: string }[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  
  // Initialize dynamic agency list
  const [agencyList, setAgencyList] = useState<{ name: string; address: string }[]>([
    { name: formData.agencyName || '', address: formData.agencyAddress || '' }
  ]);
  
  const [filteredAgencies, setFilteredAgencies] = useState(agenciesList);
  const [filteredCooperatingAgencies, setFilteredCooperatingAgencies] = useState(agenciesList);
  const [filteredTags, setFilteredTags] = useState(tagsOptions);
  const [filteredDurationOptions, setFilteredDurationOptions] = useState(durationOptions);

  // --- Effects ---

  // Handle Mode Change (Sync formData to local agencyList state)
  useEffect(() => {
    const isMulti = formData.implementationMode?.multiAgency;
    if (isMulti && agencyList.length < 2) {
         // If switching to Multi, ensure at least 2 inputs
         setAgencyList(prev => [...prev, { name: '', address: '' }]);
    } else if (!isMulti && agencyList.length > 1) {
         // If switching to Single, keep only the first one
         setAgencyList(prev => [prev[0]]);
    }
  }, [formData.implementationMode]);

  // Filter agencies for dynamic inputs
  const filterAgenciesByName = (searchTerm: string) => {
    const filtered = agenciesList.filter(agency =>
      agency.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredAgencies(filtered);
  };

  useEffect(() => {
    const filtered = agenciesList.filter(agency =>
      agency.name.toLowerCase().includes(cooperatingSearchTerm.toLowerCase())
    );
    setFilteredCooperatingAgencies(filtered);
  }, [cooperatingSearchTerm]);

  useEffect(() => {
    const filtered = tagsOptions.filter(tag =>
      tag.name.toLowerCase().includes(tagsSearchTerm.toLowerCase())
    );
    setFilteredTags(filtered);
  }, [tagsSearchTerm]);

  useEffect(() => {
    const filtered = durationOptions.filter(d => 
      d.toLowerCase().includes((formData.duration || '').toLowerCase())
    );
    setFilteredDurationOptions(filtered);
  }, [formData.duration]);

  // --- Handlers for Dynamic Agency ---

  const handleModeChange = (mode: 'single' | 'multi') => {
    const newMode = {
      singleAgency: mode === 'single',
      multiAgency: mode === 'multi'
    };
    // Update parent state
    const fakeEvent = { 
        target: { name: 'implementationMode', value: newMode } 
    } as unknown as React.ChangeEvent<HTMLInputElement>;
    onInputChange(fakeEvent);
  };

  const updateParentAgencies = (list: { name: string; address: string }[]) => {
    const joinedAgencies = list.map(a => a.name).join(' || ');
    const joinedAddresses = list.map(a => a.address).join(' || ');

    // Sync with parent state
    onInputChange({ target: { name: 'agency', value: joinedAgencies } } as React.ChangeEvent<HTMLInputElement>);
    onInputChange({ target: { name: 'address', value: joinedAddresses } } as React.ChangeEvent<HTMLInputElement>);
  };

  const handleDynamicChange = (index: number, field: 'name' | 'address', value: string) => {
    const newList = [...agencyList];
    newList[index] = { ...newList[index], [field]: value };
    setAgencyList(newList);
    updateParentAgencies(newList);

    if (field === 'name') {
        filterAgenciesByName(value);
    }
  };

  const handleAgencyNameSelect = (index: number, agencyName: string) => {
    handleDynamicChange(index, 'name', agencyName);
    setIsAgencyDropdownOpen({ index: -1, isOpen: false });
  };

  const addAgencyRow = () => {
    const newList = [...agencyList, { name: '', address: '' }];
    setAgencyList(newList);
    updateParentAgencies(newList);
  };

  const removeAgencyRow = (index: number) => {
    if (agencyList.length <= 2) return;
    const newList = agencyList.filter((_, i) => i !== index);
    setAgencyList(newList);
    updateParentAgencies(newList);
  };

  // --- Handlers for Other Fields ---

  const handleAgencySelect = (agency: { id: number; name: string }) => {
    const isSelected = selectedAgencies.some(a => a.id === agency.id);
    let newSelectedAgencies;
    if (isSelected) {
      newSelectedAgencies = selectedAgencies.filter(a => a.id !== agency.id);
    } else {
      newSelectedAgencies = [...selectedAgencies, agency];
    }
    setSelectedAgencies(newSelectedAgencies);
    
    const agencyNames = newSelectedAgencies.map(a => a.name).join(', ');
    const fakeEvent = {
      target: { name: 'cooperatingAgencies', value: agencyNames }
    } as React.ChangeEvent<HTMLTextAreaElement>;
    onInputChange(fakeEvent);
  };

  const handleAgencyRemove = (agencyId: number) => {
    const newSelectedAgencies = selectedAgencies.filter(a => a.id !== agencyId);
    setSelectedAgencies(newSelectedAgencies);
    const agencyNames = newSelectedAgencies.map(a => a.name).join(', ');
    const fakeEvent = {
      target: { name: 'cooperatingAgencies', value: agencyNames }
    } as React.ChangeEvent<HTMLTextAreaElement>;
    onInputChange(fakeEvent);
  };

  const handleTagSelect = (tag: { id: number; name: string }) => {
    const isSelected = selectedTags.includes(tag.name);
    let newSelectedTags;
    if (isSelected) {
      newSelectedTags = selectedTags.filter(t => t !== tag.name);
    } else {
      newSelectedTags = [...selectedTags, tag.name];
    }
    setSelectedTags(newSelectedTags);
    const tagNames = newSelectedTags.join(', ');
    const fakeEvent = {
      target: { name: 'discipline', value: tagNames }
    } as React.ChangeEvent<HTMLTextAreaElement>;
    onInputChange(fakeEvent);
    setTagsSearchTerm('');
    setIsTagsDropdownOpen(false);
  };

  const handleTagRemove = (tagName: string) => {
    const newSelectedTags = selectedTags.filter(t => t !== tagName);
    setSelectedTags(newSelectedTags);
    const tagNames = newSelectedTags.join(', ');
    const fakeEvent = {
      target: { name: 'discipline', value: tagNames }
    } as React.ChangeEvent<HTMLTextAreaElement>;
    onInputChange(fakeEvent);
  };

  const handleDurationSelect = (value: string) => {
    const fakeEvent = {
      target: { name: 'duration', value: value }
    } as React.ChangeEvent<HTMLInputElement>;
    onInputChange(fakeEvent);
    setIsDurationDropdownOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.agency-name-dropdown-container')) setIsAgencyDropdownOpen({ index: -1, isOpen: false });
      if (!target.closest('.cooperating-agency-dropdown-container')) setIsCooperatingDropdownOpen(false);
      if (!target.closest('.tags-dropdown-container')) setIsTagsDropdownOpen(false);
      if (!target.closest('.duration-dropdown-container')) setIsDurationDropdownOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isMulti = formData.implementationMode?.multiAgency;

  return (
    <div className="space-y-8">
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">Program Title *</label>
          <input
            type="text"
            name="programTitle"
            value={formData.programTitle}
            onChange={onInputChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-transparent transition-all duration-200"
            placeholder="Enter program title"
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">Project Title *</label>
          <input
            type="text"
            name="projectTitle"
            value={formData.projectTitle}
            onChange={onInputChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-transparent transition-all duration-200"
            placeholder="Enter project title"
          />
        </div>

        {/* School Year */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">School Year *</label>
          <input
            type="text"
            name="schoolYear"
            value={(formData as any).schoolYear || ''}
            onChange={onInputChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-transparent transition-all duration-200"
            placeholder="e.g. 2023-2024"
          />
        </div>

        {/* Duration Dropdown Field */}
        <div className="space-y-2 duration-dropdown-container">
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <Clock className="text-gray-400 w-4 h-4" />
            Duration *
          </label>
          <div className="relative">
            <input
              type="text"
              name="duration"
              value={formData.duration}
              onChange={(e) => {
                onInputChange(e);
                setIsDurationDropdownOpen(true);
              }}
              onFocus={() => setIsDurationDropdownOpen(true)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-transparent transition-all duration-200"
              placeholder="e.g., 6 months, 1 year"
            />
            {isDurationDropdownOpen && (
              <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                {filteredDurationOptions.map((opt) => (
                  <div
                    key={opt}
                    className="px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors duration-200 border-b border-gray-100 last:border-b-0"
                    onClick={() => handleDurationSelect(opt)}
                  >
                    <span className="text-sm text-gray-700">{opt}</span>
                  </div>
                ))}
                {formData.duration && !durationOptions.some(opt => opt.toLowerCase() === formData.duration.toLowerCase()) && (
                  <button
                    type="button"
                    onClick={() => handleDurationSelect(formData.duration)}
                    className="w-full px-4 py-3 text-left text-sm text-[#C8102E] hover:bg-gray-50 transition-colors duration-200 flex items-center gap-2 border-t border-gray-100"
                  >
                    <span className="font-medium">+ Add "</span>
                    <span className="font-semibold">{formData.duration}</span>
                    <span className="font-medium">" as duration</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- MODE OF IMPLEMENTATION --- */}
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

      {/* --- DYNAMIC AGENCY & ADDRESS SECTION --- */}
      <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
         <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 select-none">
            <Building2 className="text-gray-400 w-4 h-4" />
            {isMulti ? 'Agencies & Addresses' : 'Agency & Address'} *
         </div>

         <div className="space-y-4">
            {agencyList.map((item, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-6 agency-name-dropdown-container">
                 {/* Agency Name Input */}
                 <div className="space-y-2">
                    <div className="relative">
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => handleDynamicChange(index, 'name', e.target.value)}
                          onFocus={() => {
                            filterAgenciesByName(item.name);
                            setIsAgencyDropdownOpen({ index: index, isOpen: true });
                          }}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-transparent transition-all duration-200"
                          placeholder={isMulti ? `Agency Name ${index + 1}` : "Search or type agency name"}
                        />
                        <Briefcase className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                        
                        {/* Dropdown for this specific index */}
                        {isAgencyDropdownOpen.isOpen && isAgencyDropdownOpen.index === index && filteredAgencies.length > 0 && (
                          <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                            {filteredAgencies.map((agency) => (
                              <div
                                key={agency.id}
                                className="px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors duration-200 border-b border-gray-100 last:border-b-0"
                                onClick={() => handleAgencyNameSelect(index, agency.name)}
                              >
                                <span className="text-sm text-gray-700">{agency.name}</span>
                              </div>
                            ))}
                          </div>
                        )}
                    </div>
                 </div>

                 {/* Address Input */}
                 <div className="space-y-2">
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <input
                              type="text"
                              value={item.address}
                              onChange={(e) => handleDynamicChange(index, 'address', e.target.value)}
                              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-transparent transition-all duration-200"
                              placeholder={isMulti ? `Address ${index + 1}` : "Enter Address"}
                            />
                            <MapPin className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                        </div>
                        {/* Remove Button (Only for Multi & index > 1) */}
                        {isMulti && agencyList.length > 2 && (
                          <button
                            type="button"
                            onClick={() => removeAgencyRow(index)}
                            className="p-3 text-red-500 hover:bg-red-50 rounded-xl border border-red-100 hover:border-red-200 transition-colors"
                            title="Remove"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        )}
                    </div>
                 </div>
              </div>
            ))}

            {/* Add Button for Multi Mode */}
            {isMulti && (
              <button
                type="button"
                onClick={addAgencyRow}
                className="flex items-center gap-2 text-sm text-[#C8102E] font-medium hover:underline px-1 mt-2"
              >
                <Plus className="w-4 h-4" />
                Add another agency
              </button>
            )}
         </div>
      </div>

      {/* Telephone & Email */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <Phone className="text-gray-400 w-4 h-4" />
            Telephone *
          </label>
          <input
            type="tel"
            name="telephone"
            value={formData.telephone}
            onChange={onInputChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-transparent transition-all duration-200"
            placeholder="Enter telephone number"
          />
        </div>
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <Mail className="text-gray-400 w-4 h-4" />
            Email *
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={onInputChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-transparent transition-all duration-200"
            placeholder="Enter email address"
          />
        </div>
      </div>

      {/* Cooperating Agencies Section */}
      <div className="space-y-2 cooperating-agency-dropdown-container">
        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
          <Users className="text-gray-400 w-4 h-4" />
          Cooperating Agencies
        </label>
        
        {selectedAgencies.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
            {selectedAgencies.map((agency) => (
              <div
                key={agency.id}
                className="flex items-center gap-2 bg-[#C8102E]/10 text-[#C8102E] px-3 py-2 rounded-lg text-sm"
              >
                <span>{agency.name}</span>
                <button
                  type="button"
                  onClick={() => handleAgencyRemove(agency.id)}
                  className="hover:text-[#C8102E]/70 transition-colors duration-200 text-base font-semibold"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        
        <div className="relative">
          <input
            type="text"
            placeholder="Search cooperating agencies or type custom names"
            value={cooperatingSearchTerm}
            onChange={(e) => setCooperatingSearchTerm(e.target.value)}
            onFocus={() => setIsCooperatingDropdownOpen(true)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-transparent transition-all duration-200"
          />
          
          {cooperatingSearchTerm && !filteredCooperatingAgencies.some(agency => 
            agency.name.toLowerCase() === cooperatingSearchTerm.toLowerCase()
          ) && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-xl shadow-lg z-10">
              <button
                type="button"
                onClick={() => {
                  const customAgency = { 
                    id: Date.now(),
                    name: cooperatingSearchTerm 
                  };
                  handleAgencySelect(customAgency);
                  setCooperatingSearchTerm('');
                  setIsCooperatingDropdownOpen(false);
                }}
                className="w-full px-4 py-3 text-left text-sm text-[#C8102E] hover:bg-gray-50 transition-colors duration-200 flex items-center gap-2"
              >
                <span className="font-medium">+ Add "</span>
                <span className="font-semibold">{cooperatingSearchTerm}</span>
                <span className="font-medium">" as custom agency</span>
              </button>
            </div>
          )}
          
          {isCooperatingDropdownOpen && filteredCooperatingAgencies.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-xl shadow-lg max-h-60 overflow-y-auto">
              {filteredCooperatingAgencies.map((agency) => (
                <div
                  key={agency.id}
                  className={`px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors duration-200 border-b border-gray-100 last:border-b-0 ${
                    selectedAgencies.some(a => a.id === agency.id) ? 'bg-[#C8102E]/10 border-l-4 border-l-[#C8102E]' : ''
                  }`}
                  onClick={() => {
                    handleAgencySelect(agency);
                    setCooperatingSearchTerm('');
                    setIsCooperatingDropdownOpen(false);
                  }}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedAgencies.some(a => a.id === agency.id)}
                      readOnly
                      className="w-4 h-4 text-[#C8102E] rounded focus:ring-[#C8102E]"
                    />
                    <span className="text-sm text-gray-700">{agency.name}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tags Input Section */}
      <div className="space-y-2 tags-dropdown-container">
        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
          <Tags className="text-gray-400 w-4 h-4" />
          Tags / Discipline
        </label>
        
        {selectedTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
            {selectedTags.map((tag, index) => (
              <div
                key={index}
                className="flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-2 rounded-lg text-sm"
              >
                <Tags className="w-3 h-3" />
                <span>{tag}</span>
                <button
                  type="button"
                  onClick={() => handleTagRemove(tag)}
                  className="hover:text-blue-600 transition-colors duration-200 text-base font-semibold"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        
        <div className="relative">
          <input
            type="text"
            placeholder="Search tags or select from options"
            value={tagsSearchTerm}
            onChange={(e) => setTagsSearchTerm(e.target.value)}
            onFocus={() => setIsTagsDropdownOpen(true)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-transparent transition-all duration-200"
          />
          
          {isTagsDropdownOpen && filteredTags.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-xl shadow-lg max-h-60 overflow-y-auto">
              {filteredTags.map((tag) => (
                <div
                  key={tag.id}
                  className={`px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors duration-200 border-b border-gray-100 last:border-b-0 ${
                    selectedTags.includes(tag.name) ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                  }`}
                  onClick={() => handleTagSelect(tag)}
                >
                  <div className="flex items-center gap-3">
                    <Tags className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-700">{tag.name}</span>
                    {selectedTags.includes(tag.name) && (
                      <div className="ml-auto w-2 h-2 bg-blue-500 rounded-full"></div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BasicInformation;