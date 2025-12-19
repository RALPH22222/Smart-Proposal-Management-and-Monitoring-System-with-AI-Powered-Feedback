import React from "react";
import { X, Power } from "lucide-react";
import type { User } from "../../types/admin";

interface DisableAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onConfirm: () => void;
}

const DisableAccountModal: React.FC<DisableAccountModalProps> = ({ isOpen, onClose, user, onConfirm }) => {
  if (!isOpen || !user) return null;

  const getFullName = (user: User) => {
    return `${user.firstName} ${user.middleName ? user.middleName + ' ' : ''}${user.lastName}`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Power className="w-5 h-5 text-[#C8102E]" />
            {user.status === "Active" ? "Disable Account" : "Enable Account"}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-4">
            <img
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(getFullName(user))}&background=C8102E&color=fff&size=128`}
              alt={getFullName(user)}
              className="w-12 h-12 rounded-full"
            />
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-gray-900 truncate">{getFullName(user)}</h3>
              <p className="text-sm text-gray-600 truncate">{user.email}</p>
              <p className="text-sm text-gray-500">{user.role}</p>
            </div>
          </div>

          <p className="text-gray-700 mb-6 text-sm sm:text-base">
            Are you sure you want to {user.status === "Active" ? "disable" : "enable"} this account? 
            {user.status === "Active" ? " The user will no longer be able to access the system." : " The user will regain access to the system."}
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <button onClick={onClose} className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors font-medium">
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className={`flex-1 px-4 py-2 rounded-md transition-colors font-medium ${
                user.status === "Active" 
                  ? "bg-[#C8102E] hover:bg-[#A00D26] text-white"
                  : "bg-green-600 hover:bg-green-700 text-white"
              }`}
            >
              {user.status === "Active" ? "Disable Account" : "Enable Account"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DisableAccountModal;