import React, { useState, useEffect } from "react";
import { X, Power } from "lucide-react";
import type { User } from "../../types/admin";
import SecureImage from "../shared/SecureImage";

interface DisableAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onConfirm: () => void;
  isSubmitting?: boolean;
}

const DisableAccountModal: React.FC<DisableAccountModalProps> = ({ isOpen, onClose, user, onConfirm, isSubmitting }) => {
  const [confirmText, setConfirmText] = useState("");

  // Reset the confirmation input whenever the modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setConfirmText("");
    }
  }, [isOpen]);

  if (!isOpen || !user) return null;

  const getFullName = (user: User) => {
    return `${user.first_name} ${user.middle_ini ? user.middle_ini + ' ' : ''}${user.last_name}`;
  };

  const isCurrentlyActive = !user.is_disabled;

  const roleLabel = (user.roles || []).map((r: string) => {
    const map: Record<string, string> = { admin: "Admin", evaluator: "Evaluator", rnd: "R&D Staff", proponent: "Proponent" };
    return map[r] || r;
  }).join(", ");

  const isConfirmed = confirmText.toLowerCase() === "confirm";

  const handleClose = () => {
    setConfirmText("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">

        {/* Header — matches AdminProposalModal style */}
        <div className="p-6 border-b border-slate-100 flex-shrink-0 flex justify-between items-start bg-slate-50/50">
          <div>
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Power className="w-6 h-6 text-[#C8102E]" />
              Disable User Account
            </h3>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* User info */}
          <div className="flex items-center gap-3">
            <SecureImage
              src={user.photo_profile_url}
              fallbackSrc={`https://ui-avatars.com/api/?name=${encodeURIComponent(getFullName(user))}&background=C8102E&color=fff&size=128`}
              alt={getFullName(user)}
              className="w-12 h-12 rounded-full object-cover border border-slate-200 shadow-sm"
            />
            <div className="min-w-0 flex-1">
              <h4 className="font-bold text-slate-800 truncate">{getFullName(user)}</h4>
              <p className="text-sm text-slate-500 truncate">{user.email}</p>
              <p className="text-xs text-slate-400 mt-0.5">{roleLabel}</p>
            </div>
          </div>

          {/* Warning message */}
          <p className="text-sm text-slate-600 leading-relaxed">
            Are you sure you want to{" "}
            <span className="font-semibold text-slate-800">
              {isCurrentlyActive ? "disable" : "enable"}
            </span>{" "}
            this account?
            {isCurrentlyActive
              ? " The user will no longer be able to access the system."
              : " The user will regain access to the system."}
          </p>

          {/* Confirmation input */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">
              Type{" "}
              <span className="font-semibold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                confirm
              </span>{" "}
              to proceed
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Type confirm here..."
              className={`w-full px-3 py-2.5 border rounded-lg text-sm transition-colors focus:outline-none focus:ring-2 shadow-sm ${
                isConfirmed
                  ? "border-green-400 focus:ring-green-300 bg-green-50/30"
                  : "border-slate-300 focus:ring-[#C8102E]/30 bg-white"
              }`}
            />
          </div>
        </div>

        {/* Footer — matches AdminProposalModal style */}
        <div className="p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3 flex-shrink-0">
          <button
            type="button"
            onClick={handleClose}
            className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting || !isConfirmed}
            className={`px-6 py-2.5 text-sm font-bold text-white rounded-lg shadow-lg transition-all transform hover:scale-[1.02] flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:transform-none ${
              isCurrentlyActive
                ? "bg-[#C8102E] hover:bg-[#A00D26] shadow-red-200"
                : "bg-green-700 hover:bg-green-800 shadow-green-200"
            }`}
          >
            <Power className="w-4 h-4" />
            {isSubmitting ? "Processing..." : isCurrentlyActive ? "Disable Account" : "Enable Account"}
          </button>
        </div>

      </div>
    </div>
  );
};

export default DisableAccountModal;
