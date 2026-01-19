import React, { useState, useEffect } from "react";
import { X, Edit2 } from "lucide-react";
import { AGENCIES, ROLES } from "../../types/constants";
import type { User } from "../../types/admin";

interface EditAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onSubmit: (data: any) => void;
}

const EditAccountModal: React.FC<EditAccountModalProps> = ({ isOpen, onClose, user, onSubmit }) => {
  const [formData, setFormData] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    role: "Proponent",
    agency: "",
    status: "Active" as "Active" | "Inactive" | "Blocked"
  });

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName,
        middleName: user.middleName || "",
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        agency: user.agency || "",
        status: user.status
      });
    }
  }, [user]);

  if (!isOpen || !user) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    setFormData(prev => {
      const newData = { ...prev, [name]: value };

      // LOGIC: Specific Role behaviors
      if (name === "role") {
        // 1. If R&D Staff is chosen, automatically set Agency to R&D Office
        if (value === "R&D Staff") {
          newData.agency = "R&D Office";
        }
        // 2. If Proponent is chosen, set Agency to empty (displays as N/A)
        if (value === "Proponent") {
          newData.agency = ""; 
        }
      }
      return newData;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const modalScrollStyles = {
    scrollbarWidth: 'none' as const,
    msOverflowStyle: 'none' as const,
    '&::-webkit-scrollbar': { display: 'none' }
  };

  // Helper to determine if Agency should be disabled
  const isAgencyDisabled = formData.role === "R&D Staff" || formData.role === "Proponent";

  return (
    <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[95vh] overflow-y-auto" style={modalScrollStyles}>
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Edit2 className="w-5 h-5 text-[#C8102E]" />
            Edit Account
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
              <input type="text" name="firstName" value={formData.firstName} onChange={handleInputChange} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Middle Name</label>
              <input type="text" name="middleName" value={formData.middleName} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-transparent" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
              <input type="text" name="lastName" value={formData.lastName} onChange={handleInputChange} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-transparent" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
              <input type="email" name="email" value={formData.email} onChange={handleInputChange} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-transparent" />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
              <select name="role" value={formData.role} onChange={handleInputChange} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-transparent">
                {ROLES.map(role => <option key={role} value={role}>{role}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Agency / Department {isAgencyDisabled ? "(Locked)" : "*"}
              </label>
              <select 
                name="agency" 
                value={formData.agency} 
                onChange={handleInputChange} 
                required={!isAgencyDisabled}
                disabled={isAgencyDisabled}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-transparent ${isAgencyDisabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}
              >
                <option value="">{formData.role === "Proponent" ? "N/A" : "Select Agency"}</option>
                {AGENCIES.map(agency => <option key={agency} value={agency}>{agency}</option>)}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select name="status" value={formData.status} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-transparent">
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors font-medium">Cancel</button>
            <button type="submit" className="flex-1 px-4 py-2 bg-[#C8102E] hover:bg-[#A00D26] text-white rounded-md transition-colors font-medium">Update Account</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditAccountModal;