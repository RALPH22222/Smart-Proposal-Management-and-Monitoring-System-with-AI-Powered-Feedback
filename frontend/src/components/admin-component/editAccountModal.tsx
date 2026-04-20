import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, UserRoundPen, CalendarFold, ShieldCheck, Microscope, Users, FlaskConical } from "lucide-react";
import Swal from "sweetalert2";
import type { User } from "../../types/admin";
import { formatDate, formatTime } from "../../utils/date-formatter";
import type { LookupItem } from "../../services/proposal.api";

const ROLE_OPTIONS = [
  { label: "Admin", value: "admin", icon: ShieldCheck },
  { label: "Evaluator", value: "evaluator", icon: Users },
  { label: "R&D Staff", value: "rnd", icon: Microscope },
  { label: "Proponent", value: "proponent", icon: FlaskConical },
];

interface EditAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  departments: LookupItem[];
  onSubmit: (_data: {
    user_id: string;
    first_name: string;
    middle_ini: string;
    last_name: string;
    roles: string[];
    department_id: string;
  }) => void;
  isSubmitting?: boolean;
}

const EditAccountModal: React.FC<EditAccountModalProps> = ({ isOpen, onClose, user, departments, onSubmit, isSubmitting }) => {
  const [formData, setFormData] = useState({
    first_name: "",
    middle_ini: "",
    last_name: "",
    roles: [] as string[],
    department_id: "",
  });

  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || "",
        middle_ini: user.middle_ini || "",
        last_name: user.last_name || "",
        roles: user.roles || ["proponent"],
        department_id: String(user.department_id || ""),
      });
    }
  }, [user]);

  if (!isOpen || !user) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRoleToggle = (roleValue: string) => {
    setFormData(prev => {
      if (roleValue === "admin") {
        return { ...prev, roles: prev.roles.includes("admin") ? [] : ["admin"] };
      }
      
      if (prev.roles.includes("admin")) {
        return { ...prev, roles: [roleValue] };
      }

      const newRoles = prev.roles.includes(roleValue)
        ? prev.roles.filter(r => r !== roleValue)
        : [...prev.roles, roleValue];
      return { ...prev, roles: newRoles };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.roles.length === 0) {
      Swal.fire("Warning", "Please select at least one role.", "warning");
      return;
    }

    const result = await Swal.fire({
      title: "Confirm Changes",
      text: "Are you sure you want to update this user account?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#C8102E",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Yes, update it!"
    });

    if (result.isConfirmed) {
      onSubmit({
        user_id: user.id,
        first_name: formData.first_name,
        middle_ini: formData.middle_ini,
        last_name: formData.last_name,
        roles: formData.roles,
        department_id: formData.department_id,
      });
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">

        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex-shrink-0 flex justify-between items-start bg-slate-50/50">
          <div>
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-1">
              <UserRoundPen className="w-5 h-5 text-[#C8102E]" />
              Edit User Account
            </h3>
            {user.created_at && (
              <p className="text-sm text-slate-500 mt-2 font-medium flex items-center gap-1">
                <CalendarFold className="w-3.5 h-3.5" />
                Account Created:{" "}
                <span className="text-red-700">{formatDate(user.created_at)}</span>
                {" "}at{" "}
                <span className="text-red-700">{formatTime(user.created_at)}</span>
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form id="edit-account-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">First Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Middle Initial</label>
              <input
                type="text"
                name="middle_ini"
                value={formData.middle_ini}
                onChange={handleInputChange}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-transparent"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-1">Last Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-transparent"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-1">Email</label>
              <input
                type="email"
                value={user.email}
                disabled
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-100 text-slate-500 cursor-not-allowed"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-1">Department <span className="text-red-500">*</span></label>
              <select
                name="department_id"
                value={formData.department_id}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-transparent bg-white"
              >
                <option value="">Select Department</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-2">Roles <span className="text-red-500">*</span></label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {ROLE_OPTIONS.map(role => {
                  const isActive = formData.roles.includes(role.value);
                  const Icon = role.icon;
                  return (
                    <button
                      key={role.value}
                      type="button"
                      onClick={() => handleRoleToggle(role.value)}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all gap-2 group ${
                        isActive 
                          ? 'border-[#C8102E] bg-red-50 text-[#C8102E]' 
                          : 'border-slate-100 bg-white text-slate-500 hover:border-slate-300'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${isActive ? 'text-[#C8102E]' : 'text-slate-400 group-hover:text-slate-600'}`} />
                      <span className="text-xs font-bold">{role.label}</span>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        isActive ? 'bg-[#C8102E] border-[#C8102E]' : 'border-slate-300'
                      }`}>
                        {isActive && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-xs text-slate-500 italic">
                * Select one or more roles. Note: The Admin role cannot be combined with other roles.
              </p>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="edit-account-form"
            disabled={isSubmitting}
            className="px-6 py-2.5 text-sm font-bold text-white bg-[#C8102E] hover:bg-[#A00D26] rounded-lg transition-all flex items-center gap-2"
          >
            <UserRoundPen className="w-4 h-4" />
            {isSubmitting ? "Updating..." : "Update Account"}
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
};

export default EditAccountModal;
