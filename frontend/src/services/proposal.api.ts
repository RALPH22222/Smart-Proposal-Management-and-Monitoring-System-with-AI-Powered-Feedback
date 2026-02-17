import { api } from "../utils/axios";
import type { FormData } from "../types/proponent-form";

export type LookupItem = {
  id: number;
  name: string;
};

export type AddressItem = {
  id: string;
  city: string;
  barangay: string | null;
  street: string | null;
};

export type AgencyItem = {
  id: number;
  name: string;
  agency_address: AddressItem[];
};

export type CreateProposalResponse = {
  message: string;
  proposalId?: string;
  // ... any other fields
};

export const fetchAgencies = async (): Promise<AgencyItem[]> => {
  const { data } = await api.get<AgencyItem[]>("/proposal/lookup/agency");
  return data;
};

export const fetchAgencyAddresses = async (agencyId: number): Promise<AddressItem[]> => {
  const { data } = await api.get<AddressItem[]>(`/proposal/lookup/agency-addresses?agency_id=${agencyId}`);
  return data;
};

export const fetchCooperatingAgencies = async (): Promise<AgencyItem[]> => {
  const { data } = await api.get<AgencyItem[]>("/proposal/lookup/cooperating-agency");
  return data;
};

export const fetchDepartments = async (): Promise<LookupItem[]> => {
  const { data } = await api.get<LookupItem[]>("/proposal/lookup/department");
  return data;
};

export const getDepartmentById = async (id: number): Promise<LookupItem | undefined> => {
  const departments = await fetchDepartments();
  return departments.find((d) => d.id === id);
};

export const fetchDisciplines = async (): Promise<LookupItem[]> => {
  const { data } = await api.get<LookupItem[]>("/proposal/lookup/discipline");
  return data;
};

export const fetchSectors = async (): Promise<LookupItem[]> => {
  const { data } = await api.get<LookupItem[]>("/proposal/lookup/sector");
  return data;
};

export const fetchTags = async (): Promise<LookupItem[]> => {
  const { data } = await api.get<LookupItem[]>("/proposal/lookup/tag");
  return data;
};

export const fetchPriorities = async (): Promise<LookupItem[]> => {
  const { data } = await api.get<LookupItem[]>("/proposal/lookup/priority");
  return data;
};

export const fetchStations = async (): Promise<LookupItem[]> => {
  const { data } = await api.get<LookupItem[]>("/proposal/lookup/station");
  return data;
};

export const fetchCommodities = async (): Promise<LookupItem[]> => {
  const { data } = await api.get<LookupItem[]>("/proposal/lookup/commodity");
  return data;
};

export const submitProposal = async (formData: FormData, file: File): Promise<CreateProposalResponse> => {
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

  // proponent_id is no longer sent — backend extracts it from the JWT
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
  // Existing agencies (from DB) send their numeric id, new ones send just the name string.
  // e.g. [29, 33, "Test Subject #3"]
  const agencies = formData.cooperating_agencies.map((a: any) => (a.created_at ? a.id : a.name));
  fd.append("cooperating_agencies", JSON.stringify(agencies));
  fd.append("implementation_site", JSON.stringify(formData.implementation_site));
  const implementationMode = formData.implementation_site.length > 1 ? "multi_agency" : "single_agency";
  fd.append("implementation_mode", implementationMode);
  fd.append("tags", JSON.stringify(formData.tags || []));
  const { data } = await api.post<CreateProposalResponse>("/proposal/create", fd, {
    headers: { "Content-Type": "multipart/form-data" },
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
  file: File,
  projectTitle?: string,
  revisionResponse?: string,
): Promise<SubmitRevisedProposalResponse> => {
  const fd = new FormData();

  // proponent_id is no longer sent — backend extracts it from the JWT
  fd.append("proposal_id", String(proposalId));
  fd.append("file_url", file);

  if (projectTitle) {
    fd.append("project_title", projectTitle);
  }

  if (revisionResponse) {
    fd.append("revision_response", revisionResponse);
  }

  const { data } = await api.post<SubmitRevisedProposalResponse>("/proposal/submit-revised", fd, {
    headers: { "Content-Type": "multipart/form-data" },
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
  rejected_by_role: string; // Role of person who rejected (admin or rnd)
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

// ========== AI ANALYSIS API ==========

export type AIAnalysisResponse = {
  title: string;
  score: number;
  isValid: boolean;
  noveltyScore: number;
  keywords: string[];
  similarPapers: { title: string; year: string }[];
  issues: string[];
  suggestions: string[];
};

export const analyzeProposalWithAI = async (file: File): Promise<AIAnalysisResponse> => {
  const fd = new FormData();
  fd.append("file", file);

  const { data } = await api.post<AIAnalysisResponse>("/proposal/analyze", fd, {
    headers: { "Content-Type": "multipart/form-data" },
    withCredentials: true,
  });

  return data;
};

export const getProposals = async (search?: string, status?: string): Promise<any[]> => {
  const params = new URLSearchParams();
  if (search) params.append("search", search);
  if (status) params.append("status", status);
  const { data } = await api.get<any[]>(`/proposal/view?${params.toString()}`, {
    withCredentials: true,
  });
  return data;
};

export const getRndProposals = async (): Promise<any[]> => {
  const { data } = await api.get<any[]>(`/proposal/view-rnd`, {
    withCredentials: true,
  });
  return data;
};

export const getEvaluatorProposals = async (search?: string, status?: string): Promise<any[]> => {
  const params = new URLSearchParams();
  if (search) params.append("search", search);
  if (status) params.append("status", status);

  const { data } = await api.get<any[]>(`/proposal/view-evaluator?${params.toString()}`, {
    withCredentials: true,
  });
  return data;
};

export const getEvaluatorProposalStats = async (): Promise<any> => {
  const { data } = await api.get<any>("/proposal/view-evaluator-proposal-stats", {
    withCredentials: true,
  });
  return data;
};

export type DecisionEvaluatorInput = {
  proposal_id: number;
  status: "pending" | "accept" | "decline" | "extend";
  deadline_at?: string;
  remarks?: string;
};

export const decisionEvaluatorToProposal = async (input: DecisionEvaluatorInput): Promise<any> => {
  const { data } = await api.post("/proposal/decision-evaluator-to-proposal", input, {
    withCredentials: true,
  });
  return data;
};

export type SubmitEvaluationInput = {
  proposal_id: number;
  status: string;
  objective: number;
  methodology: number;
  budget: number;
  timeline: number;
  comment?: string;
};

export const submitEvaluation = async (input: SubmitEvaluationInput): Promise<any> => {
  const { data } = await api.post("/proposal/create-evaluation-scores-to-proposal", input, {
    withCredentials: true,
  });
  return data;
};

export const getEvaluationScoresFromProposal = async (): Promise<any[]> => {
  const { data } = await api.get<any[]>("/proposal/get-evaluation-scores-from-proposal", {
    withCredentials: true,
  });
  return data;
};

// New API for R&D to getting proposals ready for endorsement (with all scores)
export const getProposalsForEndorsement = async (): Promise<any[]> => {
  const { data } = await api.get<any[]>("/proposal/view-for-endorsement", {
    withCredentials: true,
  });
  return data;
};

// ========== ADMIN & RND ACTION APIs ==========

export type UserItem = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  profile_picture?: string;
  department_id?: number;
  departments: { id: number; name: string }[];
};

export const fetchUsersByRole = async (role: string, departmentId?: number): Promise<UserItem[]> => {
  const params = new URLSearchParams({ role });
  if (departmentId) params.append("department_id", String(departmentId));
  const { data } = await api.get<UserItem[]>(`/proposal/view-users-by-role?${params.toString()}`, {
    withCredentials: true,
  });
  return data;
};

export const forwardProposalToRnd = async (proposalId: number, rndIds: string[]): Promise<any> => {
  const { data } = await api.post(
    "/proposal/forward-proposal-to-rnd",
    { proposal_id: proposalId, rnd_id: rndIds },
    { withCredentials: true },
  );
  return data;
};

export type ForwardToEvaluatorsPayload = {
  proposal_id: number;
  evaluator_id: string[];
  deadline_at: number;
  commentsForEvaluators?: string;
};

export const forwardProposalToEvaluators = async (input: ForwardToEvaluatorsPayload): Promise<any> => {
  const { data } = await api.post("/proposal/forward-proposal-to-evaluators", input, {
    withCredentials: true,
  });
  return data;
};

export type RequestRevisionPayload = {
  proposal_id: number;
  objective_comment?: string;
  methodology_comment?: string;
  budget_comment?: string;
  timeline_comment?: string;
  overall_comment?: string;
  deadline: number;
};

export const requestRevision = async (input: RequestRevisionPayload): Promise<any> => {
  const { data } = await api.post("/proposal/revision-proposal-to-proponent", input, {
    withCredentials: true,
  });
  return data;
};

export type RejectProposalPayload = {
  proposal_id: number;
  comment?: string;
};

export const rejectProposal = async (input: RejectProposalPayload): Promise<any> => {
  const { data } = await api.post("/proposal/reject-proposal-to-proponent", input, {
    withCredentials: true,
  });
  return data;
};

export type EndorseProposalPayload = {
  proposal_id: number;
  rnd_id: string;
  decision: "endorsed";
  remarks?: string;
};

export const endorseProposal = async (input: EndorseProposalPayload): Promise<any> => {
  const { data } = await api.post("/proposal/endorse-for-funding", input, {
    withCredentials: true,
  });
  return data;
};

export type AssignmentTrackerItem = {
  id: number;
  proposal_id: {
    id: number;
    project_title: string;
    proponent_id: {
      first_name: string;
      last_name: string;
    };
    sector: {
      name: string;
    };
  };
  evaluator_id: {
    id: string;
    first_name: string;
    last_name: string;
    department_id: {
      name: string;
    };
  };
  deadline: number;
  status: string;
  request_deadline_at?: number | null;
  remarks?: string | null;
  date_forwarded: string;
};

export const getAssignmentTracker = async (proposalId: number): Promise<AssignmentTrackerItem[]> => {
  const { data } = await api.get<AssignmentTrackerItem[]>(`/proposal/assignment-tracker?proposal_id=${proposalId}`, {
    withCredentials: true,
  });
  return data;
};

export type HandleExtensionPayload = {
  proposal_id: number;
  evaluator_id: string;
  action: "approved" | "denied";
};

export const handleExtensionRequest = async (input: HandleExtensionPayload): Promise<any> => {
  const { data } = await api.post("/proposal/handle-extension-request", input, {
    withCredentials: true,
  });
  return data;
};

export const removeEvaluator = async (proposalId: number, evaluatorId: string): Promise<any> => {
    const { data } = await api.delete("/proposal/evaluator", {
        // @ts-ignore
        data: { proposal_id: proposalId, evaluator_id: evaluatorId },
        withCredentials: true,
    });
    return data;
};
