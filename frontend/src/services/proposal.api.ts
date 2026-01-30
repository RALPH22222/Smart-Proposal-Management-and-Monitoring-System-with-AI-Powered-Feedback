import { api } from "../utils/axios";
import type { FormData } from "../types/proponent-form";

export type LookupItem = {
  id: number;
  name: string;
};

export type CreateProposalResponse = {
  message: string;
  proposalId?: string;
};

export const fetchAgencies = async (): Promise<LookupItem[]> => {
  const { data } = await api.get<LookupItem[]>("/proposal/view-agency");
  return data;
};

export const fetchCooperatingAgencies = async (): Promise<LookupItem[]> => {
  const { data } = await api.get<LookupItem[]>("/proposal/view-agency");
  return data;
};

export const fetchDepartments = async (): Promise<LookupItem[]> => {
  const { data } = await api.get<LookupItem[]>("/proposal/view-department");
  return data;
};

export const fetchDisciplines = async (): Promise<LookupItem[]> => {
  const { data } = await api.get<LookupItem[]>("/proposal/view-discipline");
  return data;
};

export const fetchSectors = async (): Promise<LookupItem[]> => {
  const { data } = await api.get<LookupItem[]>("/proposal/view-sector");
  return data;
};

export const fetchTags = async (): Promise<LookupItem[]> => {
  const { data } = await api.get<LookupItem[]>("/proposal/view-tag");
  return data;
};

export const fetchPriorities = async (): Promise<LookupItem[]> => {
  const { data } = await api.get<LookupItem[]>("/proposal/view-priority");
  return data;
};

export const fetchStations = async (): Promise<LookupItem[]> => {
  const { data } = await api.get<LookupItem[]>("/proposal/view-department");
  return data;
};

export const fetchCommodities = async (): Promise<LookupItem[]> => {
  const { data } = await api.get<LookupItem[]>("/proposal/view-commodity");
  return data;
};

export const submitProposal = async (
  formData: FormData,
  file: File,
  proponentId: string,
): Promise<CreateProposalResponse> => {
  const fd = new FormData();
  const startDate = formData.plannedStartDate ? new Date(formData.plannedStartDate).toISOString().split("T")[0] : "";
  const endDate = formData.plannedEndDate ? new Date(formData.plannedEndDate).toISOString().split("T")[0] : "";

  // Map classification_type: "research" -> "research_class", "development" -> "development_class"
  const classificationTypeMap: Record<string, string> = {
    research: "research_class",
    development: "development_class",
  };
  const classType = formData.classification_type ?? "";
  const mappedClassificationType = classificationTypeMap[classType] || classType;

  // Duration is stored as numeric string (months), e.g., "6", "12", "18"
  const durationNumber = parseInt(formData.duration || "0", 10) || 0;

  fd.append("proponent_id", proponentId);
  fd.append("department", String(formData.department ?? ""));
  fd.append("sector", String(formData.sector ?? ""));
  fd.append("discipline", String(formData.discipline ?? ""));
  fd.append("agency", String(formData.agency ?? ""));
  fd.append("program_title", formData.program_title ?? "");
  fd.append("project_title", formData.project_title);
  fd.append("email", formData.email ?? "");
  fd.append("phone", formData.telephone ?? "");
  fd.append("class_input", formData.class_input ?? "");
  fd.append("classification_type", mappedClassificationType);
  fd.append("priorities_id", JSON.stringify(formData.priorities_id ?? []));
  fd.append("plan_start_date", startDate);
  fd.append("plan_end_date", endDate);
  fd.append("budget", JSON.stringify(formData.budgetItems));
  fd.append("file_url", file);
  fd.append("school_year", formData.schoolYear ?? "");
  fd.append(
    "agency_address",
    JSON.stringify({
      street: formData.agencyAddress.street,
      barangay: formData.agencyAddress.barangay,
      city: formData.agencyAddress.city,
    }),
  );
  fd.append("duration", String(durationNumber));
  fd.append("cooperating_agencies", JSON.stringify(formData.cooperating_agencies));
  fd.append("implementation_site", JSON.stringify(formData.implementation_site));
  const implementationMode = formData.implementation_site.length > 1 ? "multi_agency" : "single_agency";
  fd.append("implementation_mode", implementationMode);
  fd.append("tags", JSON.stringify(formData.tags || []));
  const { data } = await api.post<CreateProposalResponse>("/proposal/create", fd, {
    withCredentials: true,
  });

  return data;
};

export type SubmitRevisedProposalResponse = {
  message: string;
  data?: {
    proposal_id: number;
    version_number: number;
    version_id: number;
    file_url: string;
    status: string;
  };
};

export const submitRevisedProposal = async (
  proposalId: number,
  proponentId: string,
  file: File,
  projectTitle?: string,
  revisionResponse?: string,
): Promise<SubmitRevisedProposalResponse> => {
  const fd = new FormData();

  fd.append("proposal_id", String(proposalId));
  fd.append("proponent_id", proponentId);
  fd.append("file_url", file);

  if (projectTitle) {
    fd.append("project_title", projectTitle);
  }

  if (revisionResponse) {
    fd.append("revision_response", revisionResponse);
  }

  const { data } = await api.post<SubmitRevisedProposalResponse>("/proposal/submit-revised", fd, {
    withCredentials: true,
  });

  return data;
};

// ========== PROPONENT FEEDBACK APIs ==========

export type RevisionSummary = {
  proposal_id: number;
  rnd_id: string;
  rnd_name: string;
  objective_comment: string | null;
  methodology_comment: string | null;
  budget_comment: string | null;
  timeline_comment: string | null;
  overall_comment: string | null;
  deadline: number | null;
  created_at: string;
};

export type RejectionSummary = {
  proposal_id: number;
  rnd_id: string;
  rnd_name: string;
  comment: string | null;
  created_at: string;
};

export type ProposalVersion = {
  id: number;
  file_url: string;
  created_at: string;
};

export type ProposalVersionsResponse = {
  proposal_id: number;
  versions: ProposalVersion[];
};

export const fetchRevisionSummary = async (proposalId: number): Promise<RevisionSummary> => {
  const { data } = await api.get<RevisionSummary>(`/proposal/revision-summary?proposal_id=${proposalId}`, {
    withCredentials: true,
  });
  return data;
};

export const fetchRejectionSummary = async (proposalId: number): Promise<RejectionSummary> => {
  const { data } = await api.get<RejectionSummary>(`/proposal/rejection-summary?proposal_id=${proposalId}`, {
    withCredentials: true,
  });
  return data;
};

export const fetchProposalVersions = async (proposalId: number): Promise<ProposalVersionsResponse> => {
  const { data } = await api.get<ProposalVersionsResponse>(`/proposal/versions?proposal_id=${proposalId}`, {
    withCredentials: true,
  });
  return data;
};

export const getProposals = async (search?: string, status?: string): Promise<any[]> => {
  const params = new URLSearchParams();
  if (search) params.append("search", search);
  if (status) params.append("status", status);
  const { data } = await api.get<any[]>(`/proposal/view?${params.toString()}`);
  return data;
};

export type DecisionEvaluatorInput = {
  proposal_id: number;
  status: "pending" | "accept" | "decline" | "extend";
  deadline_at?: string;
};

export const decisionEvaluatorToProposal = async (input: DecisionEvaluatorInput): Promise<any> => {
  const { data } = await api.post("/proposal/decision-evaluator-to-proposal", input);
  return data;
};
