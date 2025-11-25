import React, { useState, useEffect } from 'react';
import {
  FaFlask,
  FaUniversity,
  FaTag,
  FaGraduationCap,
  FaCog,
  FaStar,
  FaSearch,
  FaRocket,
  FaFolderOpen
} from 'react-icons/fa';
import type { FormData } from '../../../../types/proponent-form';

interface ResearchDetailsProps {
  formData: FormData;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
}

// Predefined options for dropdowns
const researchStations = [
  'College of Computing Studies',
  'Agricultural Research Center',
  'Medical Informatics Department',
  'Computer Science Research Lab',
  'Renewable Energy Research Lab',
  'AI Research Center',
  'Urban Planning Research Institute',
  'Medical AI Research Unit'
];

const sectors = [
  'Education Technology',
  'Agriculture and Fisheries',
  'Health and Wellness',
  'Information Technology',
  'Energy and Power',
  'Artificial Intelligence',
  'Public Safety and Security',
  'Environmental Technology'
];

const disciplines = [
  'Information and Communication Technology',
  'Agricultural Engineering',
  'Health Information Technology',
  'Computer Science',
  'Electrical Engineering',
  'Computer Science and Mathematics',
  'Civil Engineering and ICT',
  'Medical Technology and ICT'
];

const ResearchDetails: React.FC<ResearchDetailsProps> = ({ formData, onInputChange }) => {
  // State for dropdowns
  const [isResearchStationOpen, setIsResearchStationOpen] = useState(false);
  const [isSectorOpen, setIsSectorOpen] = useState(false);
  const [isDisciplineOpen, setIsDisciplineOpen] = useState(false);
  
  const [researchStationSearch, setResearchStationSearch] = useState('');
  const [sectorSearch, setSectorSearch] = useState('');
  const [disciplineSearch, setDisciplineSearch] = useState('');
  
  const [filteredResearchStations, setFilteredResearchStations] = useState(researchStations);
  const [filteredSectors, setFilteredSectors] = useState(sectors);
  const [filteredDisciplines, setFilteredDisciplines] = useState(disciplines);

  // Filter research stations based on search
  useEffect(() => {
    const filtered = researchStations.filter(station =>
      station.toLowerCase().includes(researchStationSearch.toLowerCase())
    );
    setFilteredResearchStations(filtered);
  }, [researchStationSearch]);

  // Filter sectors based on search
  useEffect(() => {
    const filtered = sectors.filter(sector =>
      sector.toLowerCase().includes(sectorSearch.toLowerCase())
    );
    setFilteredSectors(filtered);
  }, [sectorSearch]);

  // Filter disciplines based on search
  useEffect(() => {
    const filtered = disciplines.filter(discipline =>
      discipline.toLowerCase().includes(disciplineSearch.toLowerCase())
    );
    setFilteredDisciplines(filtered);
  }, [disciplineSearch]);

  // Handle research station selection
  const handleResearchStationSelect = (station: string) => {
    const fakeEvent = {
      target: {
        name: 'researchStation',
        value: station
      }
    } as React.ChangeEvent<HTMLInputElement>;
    
    onInputChange(fakeEvent);
    setResearchStationSearch(station);
    setIsResearchStationOpen(false);
  };

  // Handle sector selection
  const handleSectorSelect = (sector: string) => {
    const fakeEvent = {
      target: {
        name: 'sectorCommodity',
        value: sector
      }
    } as React.ChangeEvent<HTMLInputElement>;
    
    onInputChange(fakeEvent);
    setSectorSearch(sector);
    setIsSectorOpen(false);
  };

  // Handle discipline selection
  const handleDisciplineSelect = (discipline: string) => {
    const fakeEvent = {
      target: {
        name: 'discipline',
        value: discipline
      }
    } as React.ChangeEvent<HTMLInputElement>;
    
    onInputChange(fakeEvent);
    setDisciplineSearch(discipline);
    setIsDisciplineOpen(false);
  };

  // Handle custom input for research station
  const handleResearchStationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setResearchStationSearch(e.target.value);
    
    const fakeEvent = {
      target: {
        name: 'researchStation',
        value: e.target.value
      }
    } as React.ChangeEvent<HTMLInputElement>;
    
    onInputChange(fakeEvent);
  };

  // Handle custom input for sector
  const handleSectorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSectorSearch(e.target.value);
    
    const fakeEvent = {
      target: {
        name: 'sectorCommodity',
        value: e.target.value
      }
    } as React.ChangeEvent<HTMLInputElement>;
    
    onInputChange(fakeEvent);
  };

  // Handle custom input for discipline
  const handleDisciplineChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDisciplineSearch(e.target.value);
    
    const fakeEvent = {
      target: {
        name: 'discipline',
        value: e.target.value
      }
    } as React.ChangeEvent<HTMLInputElement>;
    
    onInputChange(fakeEvent);
  };

  // Handle Mode of Implementation as single select (only Single Agency and Multi Agency)
  const handleImplementationModeChange = (mode: 'singleAgency' | 'multiAgency') => {
    // Create a new object with both modes set to false, then set the selected one to true
    const newImplementationMode = {
      singleAgency: mode === 'singleAgency',
      multiAgency: mode === 'multiAgency'
    };
    
    const fakeEvent = {
      target: {
        name: 'implementationMode',
        value: newImplementationMode
      }
    } as any;
    
    onInputChange(fakeEvent);
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      
      if (!target.closest('.research-station-dropdown')) {
        setIsResearchStationOpen(false);
      }
      
      if (!target.closest('.sector-dropdown')) {
        setIsSectorOpen(false);
      }
      
      if (!target.closest('.discipline-dropdown')) {
        setIsDisciplineOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="space-y-8">
      <div className="max-w-5xl w-full mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <FaFlask className="text-[#C8102E] text-xl" />
          </div>
          Research Details
        </h2>
        <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          Required
        </div>
      </div>

      {/* Research & Development Station with Dropdown */}
      <div className="space-y-2 research-station-dropdown">
        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
          <FaUniversity className="text-gray-400" />
          Research & Development Station
        </label>
        <div className="relative">
          <input
            type="text"
            name="researchStation"
            value={formData.researchStation}
            onChange={handleResearchStationChange}
            onFocus={() => setIsResearchStationOpen(true)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-transparent transition-all duration-200"
            placeholder="Search or type research station"
          />
          
          {/* Research Station Dropdown */}
          {isResearchStationOpen && (
            <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-xl shadow-lg max-h-60 overflow-y-auto">
              {filteredResearchStations.length > 0 ? (
                filteredResearchStations.map((station, index) => (
                  <div
                    key={index}
                    className="px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors duration-200 border-b border-gray-100 last:border-b-0"
                    onClick={() => handleResearchStationSelect(station)}
                  >
                    <span className="text-sm text-gray-700">{station}</span>
                  </div>
                ))
              ) : (
                <div className="px-4 py-3 text-sm text-gray-500 text-center">
                  No stations found. You can type a custom research station.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Sector/Commodity with Dropdown */}
        <div className="space-y-2 sector-dropdown">
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <FaTag className="text-gray-400" />
            Sector/Commodity
          </label>
          <div className="relative">
            <input
              type="text"
              name="sectorCommodity"
              value={formData.sectorCommodity}
              onChange={handleSectorChange}
              onFocus={() => setIsSectorOpen(true)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-transparent transition-all duration-200"
              placeholder="Search or type sector/commodity"
            />
            
            {/* Sector Dropdown */}
            {isSectorOpen && (
              <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                {filteredSectors.length > 0 ? (
                  filteredSectors.map((sector, index) => (
                    <div
                      key={index}
                      className="px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors duration-200 border-b border-gray-100 last:border-b-0"
                      onClick={() => handleSectorSelect(sector)}
                    >
                      <span className="text-sm text-gray-700">{sector}</span>
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-3 text-sm text-gray-500 text-center">
                    No sectors found. You can type a custom sector.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Discipline with Dropdown */}
        <div className="space-y-2 discipline-dropdown">
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <FaGraduationCap className="text-gray-400" />
            Discipline
          </label>
          <div className="relative">
            <input
              type="text"
              name="discipline"
              value={formData.discipline}
              onChange={handleDisciplineChange}
              onFocus={() => setIsDisciplineOpen(true)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-transparent transition-all duration-200"
              placeholder="Search or type discipline"
            />
            
            {/* Discipline Dropdown */}
            {isDisciplineOpen && (
              <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                {filteredDisciplines.length > 0 ? (
                  filteredDisciplines.map((discipline, index) => (
                    <div
                      key={index}
                      className="px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors duration-200 border-b border-gray-100 last:border-b-0"
                      onClick={() => handleDisciplineSelect(discipline)}
                    >
                      <span className="text-sm text-gray-700">{discipline}</span>
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-3 text-sm text-gray-500 text-center">
                    No disciplines found. You can type a custom discipline.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Classification Type Selection */}
      <div className="space-y-6">
        <div className="space-y-4">
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <FaFolderOpen className="text-gray-400" />
            Classification Type *
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center p-3 border border-gray-200 rounded-xl hover:border-[#C8102E] transition-colors duration-200">
              <input
                type="radio"
                id="classificationType.research"
                name="classificationType"
                checked={formData.classificationType === 'research'}
                onChange={() => onInputChange({
                  target: {
                    name: 'classificationType',
                    value: 'research'
                  }
                } as React.ChangeEvent<HTMLInputElement>)}
                className="h-5 w-5 text-[#C8102E] focus:ring-[#C8102E] border-gray-300"
              />
              <label htmlFor="classificationType.research" className="ml-3 text-sm font-medium text-gray-700">
                Research Classification
              </label>
            </div>
            <div className="flex items-center p-3 border border-gray-200 rounded-xl hover:border-[#C8102E] transition-colors duration-200">
              <input
                type="radio"
                id="classificationType.development"
                name="classificationType"
                checked={formData.classificationType === 'development'}
                onChange={() => onInputChange({
                  target: {
                    name: 'classificationType',
                    value: 'development'
                  }
                } as React.ChangeEvent<HTMLInputElement>)}
                className="h-5 w-5 text-[#C8102E] focus:ring-[#C8102E] border-gray-300"
              />
              <label htmlFor="classificationType.development" className="ml-3 text-sm font-medium text-gray-700">
                Development Classification
              </label>
            </div>
          </div>
        </div>

        {/* Research Classification - Only shows when Research is selected */}
        {formData.classificationType === 'research' && (
          <div className="space-y-4">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <FaSearch className="text-gray-400" />
              Research Classification *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center p-3 border border-gray-200 rounded-xl hover:border-[#C8102E] transition-colors duration-200">
                <input
                  type="radio"
                  id="researchType.basic"
                  name="researchType"
                  checked={formData.researchType.basic}
                  onChange={() => onInputChange({
                    target: {
                      name: 'researchType.basic',
                      checked: true
                    }
                  } as React.ChangeEvent<HTMLInputElement>)}
                  className="h-5 w-5 text-[#C8102E] focus:ring-[#C8102E] border-gray-300"
                />
                <label htmlFor="researchType.basic" className="ml-3 text-sm font-medium text-gray-700">
                  Basic Research
                </label>
              </div>
              <div className="flex items-center p-3 border border-gray-200 rounded-xl hover:border-[#C8102E] transition-colors duration-200">
                <input
                  type="radio"
                  id="researchType.applied"
                  name="researchType"
                  checked={formData.researchType.applied}
                  onChange={() => onInputChange({
                    target: {
                      name: 'researchType.applied',
                      checked: true
                    }
                  } as React.ChangeEvent<HTMLInputElement>)}
                  className="h-5 w-5 text-[#C8102E] focus:ring-[#C8102E] border-gray-300"
                />
                <label htmlFor="researchType.applied" className="ml-3 text-sm font-medium text-gray-700">
                  Applied Research
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Development Classification - Only shows when Development is selected */}
        {formData.classificationType === 'development' && (
          <div className="space-y-4">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <FaRocket className="text-gray-400" /> 
              Development Classification *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center p-3 border border-gray-200 rounded-xl hover:border-[#C8102E] transition-colors duration-200">
                <input
                  type="radio"
                  id="developmentType.coconutIndustry"
                  name="developmentType"
                  checked={formData.developmentType === 'coconutIndustry'}
                  onChange={() => onInputChange({
                    target: {
                      name: 'developmentType',
                      value: 'coconutIndustry'
                    }
                  } as React.ChangeEvent<HTMLInputElement>)}
                  className="h-5 w-5 text-[#C8102E] focus:ring-[#C8102E] border-gray-300"
                />
                <label htmlFor="developmentType.coconutIndustry" className="ml-3 text-sm font-medium text-gray-700">
                  Coconut Industry
                </label>
              </div>
              <div className="flex items-center p-3 border border-gray-200 rounded-xl hover:border-[#C8102E] transition-colors duration-200">
                <input
                  type="radio"
                  id="developmentType.otherPriorityAreas"
                  name="developmentType"
                  checked={formData.developmentType === 'otherPriorityAreas'}
                  onChange={() => onInputChange({
                    target: {
                      name: 'developmentType',
                      value: 'otherPriorityAreas'
                    }
                  } as React.ChangeEvent<HTMLInputElement>)}
                  className="h-5 w-5 text-[#C8102E] focus:ring-[#C8102E] border-gray-300"
                />
                <label htmlFor="developmentType.otherPriorityAreas" className="ml-3 text-sm font-medium text-gray-700">
                  Other Priority Areas (Public Safety, SDG5)
                </label>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mode of Implementation - Only Single Agency and Multi Agency */}
      <div className="space-y-4">
        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
          <FaCog className="text-gray-400" />
          Mode of Implementation *
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md">
          {/* Single Agency Option */}
          <div className="flex items-center p-3 border border-gray-200 rounded-xl hover:border-[#C8102E] transition-colors duration-200">
            <input
              type="radio"
              id="implementationMode.singleAgency"
              name="implementationMode"
              checked={formData.implementationMode.singleAgency}
              onChange={() => handleImplementationModeChange('singleAgency')}
              className="h-5 w-5 text-[#C8102E] focus:ring-[#C8102E] border-gray-300"
            />
            <label htmlFor="implementationMode.singleAgency" className="ml-3 text-sm font-medium text-gray-700">
              Single Agency
            </label>
          </div>
          
          {/* Multi Agency Option */}
          <div className="flex items-center p-3 border border-gray-200 rounded-xl hover:border-[#C8102E] transition-colors duration-200">
            <input
              type="radio"
              id="implementationMode.multiAgency"
              name="implementationMode"
              checked={formData.implementationMode.multiAgency}
              onChange={() => handleImplementationModeChange('multiAgency')}
              className="h-5 w-5 text-[#C8102E] focus:ring-[#C8102E] border-gray-300"
            />
            <label htmlFor="implementationMode.multiAgency" className="ml-3 text-sm font-medium text-gray-700">
              Multi Agency
            </label>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
          <FaStar className="text-gray-400" />
          Priority Areas *
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Object.entries(formData.priorityAreas).map(([key, value]) => (
            <div key={key} className="flex items-center p-3 border border-gray-200 rounded-xl hover:border-[#C8102E] transition-colors duration-200">
              <input
                type="checkbox"
                id={`priorityAreas.${key}`}
                name={`priorityAreas.${key}`}
                checked={value}
                onChange={onInputChange}
                className="h-5 w-5 text-[#C8102E] focus:ring-[#C8102E] border-gray-300 rounded"
              />
              <label htmlFor={`priorityAreas.${key}`} className="ml-3 text-sm font-medium text-gray-700 capitalize">
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ResearchDetails;