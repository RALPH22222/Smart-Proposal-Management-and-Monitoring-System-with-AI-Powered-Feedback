import axios from "axios";
import { api } from "../utils/axios";
import type { FormData } from "../types/proponent-form";
import type { BudgetSource } from "../types/proponentTypes";

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

// Step 1: Get a presigned S3 upload URL from the backend
export const getProposalUploadUrl = async (filename: string, contentType: string, fileSize: number): Promise<{ uploadUrl: string; fileUrl: string }> => {
  const { data } = await api.get("/proposal/upload-url", {
    params: { filename, contentType, fileSize },
    withCredentials: true,
  });
  return data as { uploadUrl: string; fileUrl: string };
};

// Step 2: Upload the file directly to S3 (bypasses Lambda/API Gateway)
export const uploadFileToS3 = async (uploadUrl: string, file: File): Promise<void> => {
  await axios.put(uploadUrl, file, {
    headers: { "Content-Type": file.type },
  });
};

export const submitProposal = async (formData: FormData, file: File): Promise<CreateProposalResponse> => {
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

  // Step 1: Get presigned URL from backend (backend enforces 10 MB limit)
  const { uploadUrl, fileUrl } = await getProposalUploadUrl(file.name, file.type, file.size);

  // Step 2: Upload file directly to S3 (bypasses Lambda)
  await uploadFileToS3(uploadUrl, file);

  // Step 3: Submit proposal metadata as JSON with the S3 file URL
  const agencies = formData.cooperating_agencies.map((a: any) => (a.created_at ? a.id : a.name));
  const implementationMode = (formData.cooperating_agencies?.length || 0) > 0 ? "multi_agency" : "single_agency";

  const { data } = await api.post<CreateProposalResponse>("/proposal/create", {
    department: String(formData.department ?? ""),
    sector: String(formData.sector ?? ""),
    discipline: String(formData.discipline ?? ""),
    agency: String(formData.agency ?? ""),
    program_title: formData.program_title ?? "",
    project_title: formData.project_title,
    email: formData.email ?? "",
    phone: formData.telephone ?? "",
    class_input: formData.class_input ?? "",
    classification_type: mappedClassificationType,
    priorities_id: formData.priorities_id ?? [],
    plan_start_date: startDate,
    plan_end_date: endDate,
    budget: formData.budgetItems,
    file_url: fileUrl,
    school_year: formData.schoolYear ?? "",
    agency_address: {
      street: formData.agencyAddress.street,
      barangay: formData.agencyAddress.barangay,
      city: formData.agencyAddress.city,
    },
    duration: durationNumber,
    cooperating_agencies: agencies,
    implementation_site: formData.implementation_site,
    implementation_mode: implementationMode,
    tags: formData.tags || [],
  }, {
    withCredentials: true,
  });

  return data;
};

export type SubmitRevisedProposalPayload = {
  projectTitle?: string;
  file: File;
  implementingSchedule?: {
    startDate?: string;
    endDate?: string;
  };
  budgetSources?: BudgetSource[];
  revisionResponse?: string;
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

/**
 * Submit a revised proposal with updated project title, file, schedule, and budget.
 * Uses presigned S3 URL: browser uploads directly to S3, then sends JSON to backend.
 */
export const submitRevisedProposal = async (
  proposalId: number,
  payload: SubmitRevisedProposalPayload,
): Promise<SubmitRevisedProposalResponse> => {
  // Step 1: Get presigned URL from backend (backend enforces 10 MB limit)
  const { uploadUrl, fileUrl } = await getProposalUploadUrl(payload.file.name, payload.file.type, payload.file.size);

  // Step 2: Upload file directly to S3 (bypasses Lambda)
  await uploadFileToS3(uploadUrl, payload.file);

  // Step 3: Build JSON body and POST to backend
  const body: Record<string, unknown> = {
    proposal_id: proposalId,
    file_url: fileUrl,
  };

  if (payload.projectTitle) {
    body.project_title = payload.projectTitle;
  }

  if (payload.implementingSchedule?.startDate) {
    body.plan_start_date = payload.implementingSchedule.startDate;
  }

  if (payload.implementingSchedule?.endDate) {
    body.plan_end_date = payload.implementingSchedule.endDate;
  }

  if (payload.budgetSources && payload.budgetSources.length > 0) {
    body.budget = payload.budgetSources.map((source) => ({
      source: source.source,
      budget: {
        ps: source.breakdown?.ps?.filter(i => i.item?.trim()).map((item) => ({ item: item.item, value: item.amount })) || [],
        mooe: source.breakdown?.mooe?.filter(i => i.item?.trim()).map((item) => ({ item: item.item, value: item.amount })) || [],
        co: source.breakdown?.co?.filter(i => i.item?.trim()).map((item) => ({ item: item.item, value: item.amount })) || [],
      },
    }));
  }

  if (payload.revisionResponse) {
    body.revision_response = payload.revisionResponse;
  }

  const { data } = await api.post<SubmitRevisedProposalResponse>("/proposal/submit-revised", body, {
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

// ========== AI TAG GENERATION API ==========

export const generateTags = async (projectTitle: string, availableTags: string[]): Promise<string[]> => {
  const { data } = await api.post<{ tags: string[] }>("/proposal/generate-tags", {
    project_title: projectTitle,
    available_tags: availableTags,
  }, {
    withCredentials: true,
  });
  return data.tags;
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
  evaluators: { id: string; visibility: string }[];
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

export const getAssignmentTracker = async (proposalId?: number): Promise<AssignmentTrackerItem[]> => {
  const query = proposalId ? `?proposal_id=${proposalId}` : "";
  const { data } = await api.get<AssignmentTrackerItem[]>(`/proposal/assignment-tracker${query}`, {
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
