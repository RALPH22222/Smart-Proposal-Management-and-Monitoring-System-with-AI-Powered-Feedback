import React, { useState } from "react";
import { X, Mail } from "lucide-react";

const ROLE_OPTIONS = [
  { label: "R&D Staff", value: "rnd" },
  { label: "Evaluator", value: "evaluator" },
];

interface AddAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { email: string; roles: string[] }) => void;
  isSubmitting?: boolean;
}

const AddAccountModal: React.FC<AddAccountModalProps> = ({ isOpen, onClose, onSubmit, isSubmitting }) => {
  const [email, setEmail] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

  if (!isOpen) return null;

  const handleRoleToggle = (roleValue: string) => {
    setSelectedRoles(prev =>
      prev.includes(roleValue) ? prev.filter(r => r !== roleValue) : [...prev, roleValue]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedRoles.length === 0) return;
    onSubmit({ email, roles: selectedRoles });
    setEmail("");
    setSelectedRoles([]);
  };

  return (
    <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[95vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Mail className="w-5 h-5 text-[#C8102E]" />
            Invite User
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-transparent"
              placeholder="Enter email address"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Role(s) *</label>
            <p className="text-xs text-gray-500 mb-2">Select one or both roles for the invited user.</p>
            <div className="space-y-2">
              {ROLE_OPTIONS.map(role => (
                <label
                  key={role.value}
                  className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedRoles.includes(role.value)
                      ? "border-[#C8102E] bg-red-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedRoles.includes(role.value)}
                    onChange={() => handleRoleToggle(role.value)}
                    className="w-4 h-4 text-[#C8102E] border-gray-300 rounded focus:ring-[#C8102E]"
                  />
                  <span className="text-sm font-medium text-gray-700">{role.label}</span>
                </label>
              ))}
            </div>
            {selectedRoles.length === 0 && (
              <p className="text-xs text-red-500 mt-1">Please select at least one role.</p>
            )}
          </div>

          <div className="bg-blue-50 text-blue-700 px-4 py-3 rounded-lg text-sm border border-blue-100">
            An invitation email will be sent. The user will set their own password and complete their profile.
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors font-medium">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || selectedRoles.length === 0}
              className="flex-1 px-4 py-2 bg-[#C8102E] hover:bg-[#A00D26] text-white rounded-md transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Mail className="w-4 h-4" />
              {isSubmitting ? "Sending..." : "Send Invitation"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddAccountModal;
