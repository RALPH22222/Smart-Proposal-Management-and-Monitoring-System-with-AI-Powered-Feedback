import React, { useState } from "react";
import { X, Mail, UserPlus } from "lucide-react";
import Swal from "sweetalert2";
import { inviteMember } from "../../services/ProjectMemberApi";

interface InviteMemberModalProps {
  fundedProjectId: number;
  isOpen: boolean;
  onClose: () => void;
  onInvited: () => void;
}

const InviteMemberModal: React.FC<InviteMemberModalProps> = ({
  fundedProjectId,
  isOpen,
  onClose,
  onInvited,
}) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      Swal.fire({ icon: "warning", title: "Required", text: "Please enter an email address.", confirmButtonColor: "#C8102E" });
      return;
    }

    try {
      setLoading(true);
      await inviteMember(fundedProjectId, email.trim());

      Swal.fire({
        icon: "success",
        title: "Invited!",
        text: `Co-lead invitation sent to ${email}.`,
        timer: 2500,
        showConfirmButton: false,
      });

      setEmail("");
      onInvited();
      onClose();
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to send invitation.";
      Swal.fire({ icon: "error", title: "Error", text: msg, confirmButtonColor: "#C8102E" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center gap-2">
            <UserPlus size={20} className="text-[#C8102E]" />
            <h3 className="text-lg font-semibold text-gray-900">Invite Co-Lead</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleInvite} className="p-6 space-y-4">
          <p className="text-sm text-gray-600">
            Enter the email address of the person you'd like to invite as a co-lead.
            They will be able to submit quarterly reports for this project.
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="colleague@example.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20 focus:border-[#C8102E] text-sm"
                disabled={loading}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-sm font-semibold text-white bg-[#C8102E] hover:bg-[#A50D26] rounded-xl transition-colors disabled:opacity-60"
            >
              {loading ? "Sending..." : "Send Invite"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InviteMemberModal;
