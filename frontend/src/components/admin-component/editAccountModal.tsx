import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Edit2, CalendarFold } from "lucide-react";
import type { User } from "../../types/admin";
import { formatDate, formatTime } from "../../utils/date-formatter";

const ROLE_OPTIONS = [
  { label: "Admin", value: "admin" },
  { label: "Evaluator", value: "evaluator" },
  { label: "R&D Staff", value: "rnd" },
  { label: "Proponent", value: "proponent" },
];

interface EditAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onSubmit: (_data: {
    user_id: string;
    first_name: string;
    middle_ini: string;
    last_name: string;
    roles: string[];
  }) => void;
  isSubmitting?: boolean;
}

const EditAccountModal: React.FC<EditAccountModalProps> = ({ isOpen, onClose, user, onSubmit, isSubmitting }) => {
  const [formData, setFormData] = useState({
    first_name: "",
    middle_ini: "",
    last_name: "",
    role: "proponent",
  });

  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || "",
        middle_ini: user.middle_ini || "",
        last_name: user.last_name || "",
        role: user.roles?.[0] || "proponent",
      });
    }
  }, [user]);

  if (!isOpen || !user) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      user_id: user.id,
      first_name: formData.first_name,
      middle_ini: formData.middle_ini,
      last_name: formData.last_name,
      roles: [formData.role],
    });
  };

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">

        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex-shrink-0 flex justify-between items-start bg-slate-50/50">
          <div>
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Edit2 className="w-6 h-6 text-[#C8102E]" />
              Edit User Account
            </h3>
            {user.created_at && (
              <p className="text-sm text-slate-500 mt-1 font-medium flex items-center gap-1">
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
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-transparent shadow-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Middle Initial</label>
              <input
                type="text"
                name="middle_ini"
                value={formData.middle_ini}
                onChange={handleInputChange}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-transparent shadow-sm"
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
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-transparent shadow-sm"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-1">Email</label>
              <input
                type="email"
                value={user.email}
                disabled
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-100 text-slate-500 cursor-not-allowed shadow-sm"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-1">Role <span className="text-red-500">*</span></label>
              <select
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-transparent shadow-sm bg-white"
              >
                {ROLE_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
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
            className="px-6 py-2.5 text-sm font-bold text-white bg-[#C8102E] hover:bg-[#A00D26] rounded-lg shadow-lg shadow-red-200 transition-all transform hover:scale-[1.02] flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:transform-none"
          >
            <Edit2 className="w-4 h-4" />
            {isSubmitting ? "Updating..." : "Update Account"}
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
};

export default EditAccountModal;
