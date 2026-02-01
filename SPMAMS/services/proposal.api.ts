// app/services/proposal.api.ts
import { api } from "../utils/axios"; // Make sure this points to your mobile axios.ts

export type LookupItem = {
  id: number;
  name: string;
};

// Simplified fetchers for mobile
export const getProposals = async (search?: string, status?: string): Promise<any[]> => {
  const params = new URLSearchParams();
  if (search) params.append("search", search);
  if (status) params.append("status", status);
  
  // Note: We use try/catch to prevent app crashes on network errors
  try {
    const { data } = await api.get<any[]>(`/proposal/view?${params.toString()}`);
    return data;
  } catch (error) {
    console.error("API Error getProposals:", error);
    return [];
  }
};

export const submitRevisedProposal = async (
  proposalId: number, 
  file: any, 
  title: string, 
  remarks?: string
): Promise<any> => {
  const formData = new FormData();
  
  // 1. Append ID
  formData.append('proposal_id', String(proposalId));
  if (file) {
    formData.append('file', {
      uri: file.uri,
      type: file.type || 'application/pdf',
      name: file.name || 'revision.pdf',
    } as any);
  }
  formData.append('project_title', title);
  if (remarks) {
    formData.append('remarks', remarks);
  }
  const { data } = await api.post('/proposal/submit-revision', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return data;
};
export const fetchAgencies = async () => (await api.get<LookupItem[]>("/proposal/view-agency")).data;
export const fetchDepartments = async () => (await api.get<LookupItem[]>("/proposal/view-department")).data;
export const fetchSectors = async () => (await api.get<LookupItem[]>("/proposal/view-sector")).data;
export const fetchDisciplines = async () => (await api.get<LookupItem[]>("/proposal/view-discipline")).data;
export const fetchPriorities = async () => (await api.get<LookupItem[]>("/proposal/view-priority")).data;
export const fetchStations = async () => (await api.get<LookupItem[]>("/proposal/view-department")).data; // Verify backend endpoint
export const fetchTags = async () => (await api.get<LookupItem[]>("/proposal/view-tag")).data;
export const fetchRevisionSummary = async (proposalId: number): Promise<any> => {
  try {
    const { data } = await api.get(`/proposal/revision-summary/${proposalId}`);
    return data;
  } catch (error) {
    console.error("Error fetching revision summary", error);
    return {};
  }
};

// Fetch rejection reason
export const fetchRejectionSummary = async (proposalId: number): Promise<any> => {
  try {
    const { data } = await api.get(`/proposal/rejection-summary/${proposalId}`);
    return data;
  } catch (error) {
    console.error("Error fetching rejection summary", error);
    return {};
  }
};