import { api } from "../utils/axios";

export interface ProjectMemberData {
  id: number;
  funded_project_id: number;
  user_id: string;
  role: "lead" | "co_lead";
  status: "pending" | "active" | "suspended" | "removed";
  invited_by: string;
  invited_at: string;
  accepted_at: string | null;
  created_at: string;
  updated_at: string;
  user: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    profile_photo_url?: string | null;
  };
}

export const fetchProjectMembers = async (fundedProjectId: number): Promise<ProjectMemberData[]> => {
  const { data } = await api.get<{ data: ProjectMemberData[] }>("/project/members", {
    params: { funded_project_id: fundedProjectId },
    withCredentials: true,
  });
  return data.data;
};

export const inviteMember = async (
  fundedProjectId: number,
  email: string
): Promise<ProjectMemberData> => {
  const { data } = await api.post<{ data: ProjectMemberData }>(
    "/project/invite-member",
    { funded_project_id: fundedProjectId, email },
    { withCredentials: true }
  );
  return data.data;
};

export const removeMember = async (
  fundedProjectId: number,
  memberId: number
): Promise<void> => {
  await api.post(
    "/project/remove-member",
    { funded_project_id: fundedProjectId, member_id: memberId },
    { withCredentials: true }
  );
};

export interface PendingInvitation {
  id: number;
  funded_project_id: number;
  invited_at: string;
  funded_project: {
    id: number;
    proposal: { project_title: string } | null;
  } | null;
  inviter: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  } | null;
}

export const fetchPendingInvitations = async (): Promise<PendingInvitation[]> => {
  const { data } = await api.get<{ data: PendingInvitation[] }>(
    "/project/pending-invitations",
    { withCredentials: true }
  );
  return data.data;
};

export const respondToInvitation = async (
  memberId: number,
  action: "accept" | "decline"
): Promise<void> => {
  await api.post(
    "/project/respond-to-invitation",
    { member_id: memberId, action },
    { withCredentials: true }
  );
};
