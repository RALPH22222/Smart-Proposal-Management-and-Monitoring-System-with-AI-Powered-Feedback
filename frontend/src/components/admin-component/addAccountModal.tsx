import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Mail } from "lucide-react";

const ROLE_OPTIONS = [
  { label: "R&D Staff", value: "rnd" },
  { label: "Evaluator", value: "evaluator" },
];

interface AddAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (_data: { emails: string[]; roles: string[] }) => Promise<void> | void;
  isSubmitting?: boolean;
}

const AddAccountModal: React.FC<AddAccountModalProps> = ({ isOpen, onClose, onSubmit, isSubmitting }) => {
  const [emailInput, setEmailInput] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      setEmailInput("");
      setSelectedRole("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole || !emailInput.trim()) return;

    // Parse emails: split by space, comma, newline and keep valid entries
    const parsedEmails = emailInput
      .split(/[\s,]+/)
      .map(email => email.trim())
      .filter(email => email !== "");

    if (parsedEmails.length === 0) return;

    onSubmit({ emails: parsedEmails, roles: [selectedRole] });
  };

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">

        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex-shrink-0 flex justify-between items-start bg-slate-50/50">
          <div>
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Mail className="w-6 h-6 text-[#C8102E]" />
              Invite User
            </h3>
            <p className="text-sm text-slate-500 mt-1 font-medium">
              Send an invitation to a new team member
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form id="add-account-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">
              Email Addresses <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-slate-500 mb-2">You can invite multiple users by separating emails with commas or spaces.</p>
            <textarea
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              required
              rows={3}
              placeholder="e.g. user1@wmsu.edu.ph, user2@wmsu.edu.ph"
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-transparent shadow-sm custom-scrollbar resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">
              Role <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-slate-500 mb-2">Select a role for the invited user.</p>
            <div className="space-y-2">
              {ROLE_OPTIONS.map(role => (
                <label
                  key={role.value}
                  className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedRole === role.value
                      ? "border-[#C8102E] bg-red-50"
                      : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="invite-role"
                    checked={selectedRole === role.value}
                    onChange={() => setSelectedRole(role.value)}
                    className="w-4 h-4 text-[#C8102E] border-slate-300 focus:ring-[#C8102E]"
                  />
                  <span className="text-sm font-medium text-slate-700">{role.label}</span>
                </label>
              ))}
            </div>
            {!selectedRole && (
              <p className="text-xs text-red-500 mt-1">Please select a role.</p>
            )}
          </div>

          <div className="bg-blue-50 text-blue-700 px-4 py-3 rounded-lg text-sm border border-blue-100">
            An invitation email will be sent. The user will set their own password and complete their profile.
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
            form="add-account-form"
            disabled={isSubmitting || !selectedRole}
            className="px-6 py-2.5 text-sm font-bold text-white bg-[#C8102E] hover:bg-[#A00D26] rounded-lg shadow-lg shadow-red-200 transition-all transform hover:scale-[1.02] flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:transform-none"
          >
            <Mail className="w-4 h-4" />
            {isSubmitting ? "Sending..." : "Send Invitation"}
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
};

export default AddAccountModal;
