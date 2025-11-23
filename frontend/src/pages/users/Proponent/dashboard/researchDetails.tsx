import React from 'react';
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

const ResearchDetails: React.FC<ResearchDetailsProps> = ({ formData, onInputChange }) => {
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

      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
          <FaUniversity className="text-gray-400" />
          Research & Development Station
        </label>
        <input
          type="text"
          name="researchStation"
          value={formData.researchStation}
          onChange={onInputChange}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-transparent transition-all duration-200"
          placeholder="Enter research station"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <FaTag className="text-gray-400" />
            Sector/Commodity
          </label>
          <input
            type="text"
            name="sectorCommodity"
            value={formData.sectorCommodity}
            onChange={onInputChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-transparent transition-all duration-200"
            placeholder="Enter sector/commodity"
          />
        </div>
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <FaGraduationCap className="text-gray-400" />
            Discipline
          </label>
          <input
            type="text"
            name="discipline"
            value={formData.discipline}
            onChange={onInputChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-transparent transition-all duration-200"
            placeholder="Enter discipline"
          />
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

      <div className="space-y-4">
        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
          <FaCog className="text-gray-400" />
          Mode of Implementation *
        </label>
        <div className="flex flex-col sm:flex-row gap-4">
          {Object.entries(formData.implementationMode).map(([key, value]) => (
            <div key={key} className="flex items-center p-3 border border-gray-200 rounded-xl hover:border-[#C8102E] transition-colors duration-200 flex-1">
              <input
                type="checkbox"
                id={`implementationMode.${key}`}
                name={`implementationMode.${key}`}
                checked={value}
                onChange={onInputChange}
                className="h-5 w-5 text-[#C8102E] focus:ring-[#C8102E] border-gray-300 rounded"
              />
              <label htmlFor={`implementationMode.${key}`} className="ml-3 text-sm font-medium text-gray-700 capitalize">
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </label>
            </div>
          ))}
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