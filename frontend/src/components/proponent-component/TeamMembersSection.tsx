import React, { useState, useEffect, useCallback } from "react";
import { Users, UserPlus, Trash2, Crown, UserCheck, Clock, ShieldAlert } from "lucide-react";
import Swal from "sweetalert2";
import { fetchProjectMembers, removeMember, type ProjectMemberData } from "../../services/ProjectMemberApi";
import InviteMemberModal from "./InviteMemberModal";
import SecureImage from "../shared/SecureImage";

interface TeamMembersSectionProps {
  fundedProjectId: number;
  isProjectLead: boolean;
  projectLead?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    photo_profile_url?: string | null;
  };
}

const roleBadge = (role: string) => {
  if (role === "lead") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-[#FDECEF] text-[#C8102E] border border-[#F7C6D0]">
        <Crown size={12} /> Lead
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
      <UserCheck size={12} /> Co-Lead
    </span>
  );
};

const statusBadge = (status: string) => {
  switch (status) {
    case "active":
      return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">Active</span>;
    case "pending":
      return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700"><Clock size={10} /> Pending</span>;
    case "suspended":
      return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700"><ShieldAlert size={10} /> Suspended</span>;
    default:
      return null;
  }
};

const getInitials = (firstName?: string, lastName?: string, email?: string) => {
  if (firstName && lastName) return `${firstName[0]}${lastName[0]}`.toUpperCase();
  if (firstName) return firstName[0].toUpperCase();
  if (email) return email[0].toUpperCase();
  return "?";
};

const getAvatarColor = (email?: string) => {
  if (!email) return "bg-gray-100 text-gray-400";
  const colors = [
    "bg-blue-100 text-blue-600 border-blue-200",
    "bg-emerald-100 text-emerald-600 border-emerald-200",
    "bg-violet-100 text-violet-600 border-violet-200",
    "bg-rose-100 text-rose-600 border-rose-200",
    "bg-indigo-100 text-indigo-600 border-indigo-200",
    "bg-cyan-100 text-cyan-600 border-cyan-200",
    "bg-orange-100 text-orange-600 border-orange-200",
  ];
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    hash = email.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

const TeamMembersSection: React.FC<TeamMembersSectionProps> = ({
  fundedProjectId,
  isProjectLead,
  projectLead,
}) => {
  const [members, setMembers] = useState<ProjectMemberData[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);

  const loadMembers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchProjectMembers(fundedProjectId);
      setMembers(data);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [fundedProjectId]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  const handleRemove = async (member: ProjectMemberData) => {
    const confirm = await Swal.fire({
      title: "Remove Member",
      text: `Are you sure you want to remove ${member.user.first_name} ${member.user.last_name}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#C8102E",
      cancelButtonColor: "#6B7280",
      confirmButtonText: "Yes, remove",
    });

    if (!confirm.isConfirmed) return;

    try {
      await removeMember(fundedProjectId, member.id);
      Swal.fire({ icon: "success", title: "Removed", text: "Member has been removed.", timer: 2000, showConfirmButton: false });
      loadMembers();
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to remove member.";
      Swal.fire({ icon: "error", title: "Error", text: msg, confirmButtonColor: "#C8102E" });
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center gap-2">
          <Users size={18} className="text-[#C8102E]" />
          <h3 className="text-sm font-semibold text-gray-900">Team Members</h3>
          <span className="text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">
            {members.length + (projectLead ? 1 : 0)}
          </span>
        </div>
        {isProjectLead && (
          <button
            onClick={() => setInviteOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#C8102E] hover:bg-[#A50D26] rounded-lg transition-colors"
          >
            <UserPlus size={14} />
            Invite Co-Lead
          </button>
        )}
      </div>

      {/* Member List */}
      {loading ? (
        <div className="px-5 py-8 text-center text-sm text-gray-400">Loading members...</div>
      ) : members.length === 0 && !projectLead ? (
        <div className="px-5 py-8 text-center text-sm text-gray-400">No team members yet.</div>
      ) : (
        <>
          {/* --- Project Lead Row (always visible, pinned above the scroll area) --- */}
          {projectLead && (
            <div className="flex items-center justify-between px-5 py-3 bg-[#FFF5F7] border-l-4 border-[#C8102E]">
              <div className="flex items-center gap-3 min-w-0">
                {projectLead.photo_profile_url ? (
                  <SecureImage
                    src={projectLead.photo_profile_url}
                    fallbackSrc={`https://ui-avatars.com/api/?name=${encodeURIComponent(`${projectLead.first_name} ${projectLead.last_name}`)}&background=C8102E&color=fff&size=128`}
                    alt={`${projectLead.first_name} ${projectLead.last_name}`}
                    className="w-9 h-9 rounded-full object-cover shrink-0 shadow-sm border border-gray-200"
                  />
                ) : (
                  <div className={`w-9 h-9 rounded-full border flex items-center justify-center text-sm font-bold shrink-0 ${getAvatarColor(projectLead.email)}`}>
                    {getInitials(projectLead.first_name, projectLead.last_name, projectLead.email)}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {projectLead.first_name || projectLead.last_name 
                        ? `${projectLead.first_name || ""} ${projectLead.last_name || ""}`.trim()
                        : "Unnamed Lead"}
                    </p>
                    <Crown size={12} className="text-[#C8102E] shrink-0" />
                  </div>
                  <p className="text-xs text-gray-500 truncate">{projectLead.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-[#FDECEF] text-[#C8102E] border border-[#F7C6D0]">
                  <Crown size={11} /> Project Lead
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">Active</span>
                <div className="w-[40px] shrink-0" />
              </div>
            </div>
          )}

          {/* --- Co-Lead Rows (scrollable, shows 4 at a time) --- */}
          {members.length > 0 && (
            <div
              className="divide-y divide-gray-100 overflow-y-auto"
              style={{ maxHeight: '240px' }}
            >
              {members.map((member) => (
                <div key={member.id} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    {member.user.photo_profile_url ? (
                      <SecureImage
                        src={member.user.photo_profile_url}
                        fallbackSrc={`https://ui-avatars.com/api/?name=${encodeURIComponent(`${member.user.first_name} ${member.user.last_name}`)}&background=C8102E&color=fff&size=128`}
                        alt={`${member.user.first_name} ${member.user.last_name}`}
                        className="w-9 h-9 rounded-full object-cover shrink-0 shadow-sm border border-gray-200"
                      />
                    ) : (
                      <div className={`w-9 h-9 rounded-full border flex items-center justify-center text-sm font-bold shrink-0 ${getAvatarColor(member.user.email)}`}>
                        {getInitials(member.user.first_name, member.user.last_name, member.user.email)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {member.user.first_name || member.user.last_name
                          ? `${member.user.first_name || ""} ${member.user.last_name || ""}`.trim()
                          : "Unnamed Member"}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{member.user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {roleBadge(member.role)}
                    {statusBadge(member.status)}
                    {isProjectLead && member.role === "co_lead" && (
                      <button
                        onClick={() => handleRemove(member)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Remove member"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}


      {/* Invite Modal */}
      <InviteMemberModal
        fundedProjectId={fundedProjectId}
        isOpen={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onInvited={loadMembers}
      />
    </div>
  );
};

export default TeamMembersSection;
