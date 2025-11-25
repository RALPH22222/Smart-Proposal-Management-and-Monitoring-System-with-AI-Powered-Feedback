import React, { useState, useEffect } from 'react';
import {
  FaFileAlt,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaBuilding,
  FaPhone,
  FaEnvelope,
  FaUniversity,
  FaTags,
  FaTimes
} from 'react-icons/fa';
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
  { id: 15, name: 'Other' },
];

const BasicInformation: React.FC<BasicInformationProps> = ({ formData, onInputChange }) => {
  const [isAgencyDropdownOpen, setIsAgencyDropdownOpen] = useState(false);
  const [isCooperatingDropdownOpen, setIsCooperatingDropdownOpen] = useState(false);
  const [isTagsDropdownOpen, setIsTagsDropdownOpen] = useState(false);
  const [agencySearchTerm, setAgencySearchTerm] = useState('');
  const [cooperatingSearchTerm, setCooperatingSearchTerm] = useState('');
  const [tagsSearchTerm, setTagsSearchTerm] = useState('');
  const [selectedAgencies, setSelectedAgencies] = useState<{ id: number; name: string }[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [filteredAgencies, setFilteredAgencies] = useState(agenciesList);
  const [filteredCooperatingAgencies, setFilteredCooperatingAgencies] = useState(agenciesList);
  const [filteredTags, setFilteredTags] = useState(tagsOptions);

  // Filter agencies based on search term for Agency Name
  useEffect(() => {
    const filtered = agenciesList.filter(agency =>
      agency.name.toLowerCase().includes(agencySearchTerm.toLowerCase())
    );
    setFilteredAgencies(filtered);
  }, [agencySearchTerm]);

  // Filter agencies based on search term for Cooperating Agencies
  useEffect(() => {
    const filtered = agenciesList.filter(agency =>
      agency.name.toLowerCase().includes(cooperatingSearchTerm.toLowerCase())
    );
    setFilteredCooperatingAgencies(filtered);
  }, [cooperatingSearchTerm]);

  // Filter tags based on search term
  useEffect(() => {
    const filtered = tagsOptions.filter(tag =>
      tag.name.toLowerCase().includes(tagsSearchTerm.toLowerCase())
    );
    setFilteredTags(filtered);
  }, [tagsSearchTerm]);

  // Handle agency selection for Cooperating Agencies
  const handleAgencySelect = (agency: { id: number; name: string }) => {
    const isSelected = selectedAgencies.some(a => a.id === agency.id);
    
    let newSelectedAgencies;
    if (isSelected) {
      newSelectedAgencies = selectedAgencies.filter(a => a.id !== agency.id);
    } else {
      newSelectedAgencies = [...selectedAgencies, agency];
    }
    
    setSelectedAgencies(newSelectedAgencies);
    
    // Update form data with comma-separated agency names
    const agencyNames = newSelectedAgencies.map(a => a.name).join(', ');
    const fakeEvent = {
      target: {
        name: 'cooperatingAgencies',
        value: agencyNames
      }
    } as React.ChangeEvent<HTMLTextAreaElement>;
    
    onInputChange(fakeEvent);
  };

  // Handle agency removal from Cooperating Agencies
  const handleAgencyRemove = (agencyId: number) => {
    const newSelectedAgencies = selectedAgencies.filter(a => a.id !== agencyId);
    setSelectedAgencies(newSelectedAgencies);
    
    // Update form data
    const agencyNames = newSelectedAgencies.map(a => a.name).join(', ');
    const fakeEvent = {
      target: {
        name: 'cooperatingAgencies',
        value: agencyNames
      }
    } as React.ChangeEvent<HTMLTextAreaElement>;
    
    onInputChange(fakeEvent);
  };

  // Handle Agency Name selection
  const handleAgencyNameSelect = (agency: { id: number; name: string }) => {
    const fakeEvent = {
      target: {
        name: 'agencyName',
        value: agency.name
      }
    } as React.ChangeEvent<HTMLInputElement>;
    
    onInputChange(fakeEvent);
    setAgencySearchTerm(agency.name);
    setIsAgencyDropdownOpen(false);
  };

  // Handle Agency Name input change (for custom typing)
  const handleAgencyNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAgencySearchTerm(e.target.value);
    
    const fakeEvent = {
      target: {
        name: 'agencyName',
        value: e.target.value
      }
    } as React.ChangeEvent<HTMLInputElement>;
    
    onInputChange(fakeEvent);
  };

  // Handle tag selection
  const handleTagSelect = (tag: { id: number; name: string }) => {
    const isSelected = selectedTags.includes(tag.name);
    
    let newSelectedTags;
    if (isSelected) {
      newSelectedTags = selectedTags.filter(t => t !== tag.name);
    } else {
      newSelectedTags = [...selectedTags, tag.name];
    }
    
    setSelectedTags(newSelectedTags);
    
    // Update form data with comma-separated tag names
    const tagNames = newSelectedTags.join(', ');
    const fakeEvent = {
      target: {
        name: 'discipline', // or whatever field name you want to use
        value: tagNames
      }
    } as React.ChangeEvent<HTMLTextAreaElement>;
    
    onInputChange(fakeEvent);
    setTagsSearchTerm('');
    setIsTagsDropdownOpen(false);
  };

  // Handle tag removal
  const handleTagRemove = (tagName: string) => {
    const newSelectedTags = selectedTags.filter(t => t !== tagName);
    setSelectedTags(newSelectedTags);
    
    // Update form data
    const tagNames = newSelectedTags.join(', ');
    const fakeEvent = {
      target: {
        name: 'discipline', // or whatever field name you want to use
        value: tagNames
      }
    } as React.ChangeEvent<HTMLTextAreaElement>;
    
    onInputChange(fakeEvent);
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      
      if (!target.closest('.agency-name-dropdown-container')) {
        setIsAgencyDropdownOpen(false);
      }
      
      if (!target.closest('.cooperating-agency-dropdown-container')) {
        setIsCooperatingDropdownOpen(false);
      }
      
      if (!target.closest('.tags-dropdown-container')) {
        setIsTagsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <FaFileAlt className="text-[#C8102E] text-xl" />
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
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">Select Sex *</label>
          <select
            name="leaderGender"
            value={formData.leaderGender}
            onChange={onInputChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-transparent transition-all duration-200"
          >
            <option value="">Select Sex</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Prefer not to say</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">Duration (months) *</label>
          <input
            type="number"
            name="duration"
            value={formData.duration}
            onChange={onInputChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-transparent transition-all duration-200"
            placeholder="Enter duration"
          />
        </div>
        
        {/* Updated Agency Name Field with Dropdown */}
        <div className="md:col-span-2 space-y-2">
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <FaBuilding className="text-gray-400" />
            Agency/Address *
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 agency-name-dropdown-container">
              <div className="relative">
                <input
                  type="text"
                  name="agencyName"
                  value={formData.agencyName}
                  onChange={handleAgencyNameChange}
                  onFocus={() => setIsAgencyDropdownOpen(true)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-transparent transition-all duration-200"
                  placeholder="Search or type agency name"
                />
                
                {/* Agency Name Dropdown */}
                {isAgencyDropdownOpen && (
                  <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                    {filteredAgencies.length > 0 ? (
                      filteredAgencies.map((agency) => (
                        <div
                          key={agency.id}
                          className="px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors duration-200 border-b border-gray-100 last:border-b-0"
                          onClick={() => handleAgencyNameSelect(agency)}
                        >
                          <span className="text-sm text-gray-700">{agency.name}</span>
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-sm text-gray-500 text-center">
                        No agencies found. You can type a custom agency name.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="flex-1">
              <input
                type="text"
                name="agencyAddress"
                value={formData.agencyAddress}
                onChange={onInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-transparent transition-all duration-200"
                placeholder="Agency address"
              />
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <FaPhone className="text-gray-400" />
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
              <FaEnvelope className="text-gray-400" />
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

      {/* Updated Cooperating Agencies Section */}
      <div className="space-y-2 cooperating-agency-dropdown-container">
        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
          <FaUniversity className="text-gray-400" />
          Cooperating Agencies
        </label>
        
        {/* Selected Agencies Display */}
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
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
        
        <div className="relative">
          {/* Search Input for Cooperating Agencies */}
          <input
            type="text"
            placeholder="Search cooperating agencies or type custom names"
            value={cooperatingSearchTerm}
            onChange={(e) => setCooperatingSearchTerm(e.target.value)}
            onFocus={() => setIsCooperatingDropdownOpen(true)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-transparent transition-all duration-200"
          />
          
          {/* Add Custom Agency Button */}
          {cooperatingSearchTerm && !filteredCooperatingAgencies.some(agency => 
            agency.name.toLowerCase() === cooperatingSearchTerm.toLowerCase()
          ) && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-xl shadow-lg z-10">
              <button
                type="button"
                onClick={() => {
                  const customAgency = { 
                    id: Date.now(), // Temporary ID for custom agency
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
          
          {/* Cooperating Agencies Dropdown Menu */}
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
          <FaTags className="text-gray-400" />
          Tags
        </label>
        
        {/* Selected Tags Display */}
        {selectedTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
            {selectedTags.map((tag, index) => (
              <div
                key={index}
                className="flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-2 rounded-lg text-sm"
              >
                <FaTags className="w-3 h-3" />
                <span>{tag}</span>
                <button
                  type="button"
                  onClick={() => handleTagRemove(tag)}
                  className="hover:text-blue-600 transition-colors duration-200 text-base font-semibold"
                >
                  <FaTimes className="w-3 h-3" />
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
          
          {/* Tags Dropdown Menu */}
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
                    <FaTags className="w-4 h-4 text-gray-400" />
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <FaCalendarAlt className="text-gray-400" />
            Planned Start Date *
          </label>
          <input
            type="date"
            name="plannedStartDate"
            value={formData.plannedStartDate}
            onChange={onInputChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-transparent transition-all duration-200"
          />
        </div>
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <FaCalendarAlt className="text-gray-400" />
            Planned End Date *
          </label>
          <input
            type="date"
            name="plannedEndDate"
            value={formData.plannedEndDate}
            onChange={onInputChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-transparent transition-all duration-200"
          />
        </div>
      </div>
    </div>
  );
};

export default BasicInformation;