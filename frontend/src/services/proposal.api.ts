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

// --- Cache: avoids re-fetching data on every page navigation ---
const LOOKUP_CACHE_TTL = 5 * 60 * 1000; // 5 minutes (static lookups)
const DATA_CACHE_TTL = 30 * 1000; // 30 seconds (proposal data)
const lookupCache: Record<string, { data: any; timestamp: number }> = {};

function getCached<T>(key: string): T | null {
  const entry = lookupCache[key];
  if (entry && Date.now() - entry.timestamp < LOOKUP_CACHE_TTL) {
    return entry.data as T;
  }
  return null;
}

function setCache(key: string, data: any): void {
  lookupCache[key] = { data, timestamp: Date.now() };
}

function getCachedWithTtl<T>(key: string, ttl: number): T | null {
  const entry = lookupCache[key];
  if (entry && Date.now() - entry.timestamp < ttl) {
    return entry.data as T;
  }
  return null;
}

/** Clear cached proposal data (call after mutations like status updates, forwarding, etc.) */
export function invalidateProposalCache(): void {
  for (const key of Object.keys(lookupCache)) {
    if (key.startsWith("proposals:") || key.startsWith("tracker:")) {
      delete lookupCache[key];
    }
  }
}

// --- Batch lookup: fetches all lookup types in a single API call ---
export type AllLookups = {
  agencies: AgencyItem[];
  departments: LookupItem[];
  disciplines: LookupItem[];
  sectors: LookupItem[];
  tags: LookupItem[];
  priorities: LookupItem[];
  stations: LookupItem[];
};

export const fetchAllLookups = async (): Promise<AllLookups> => {
  const cached = getCached<AllLookups>("all-lookups");
  if (cached) return cached;
  const { data } = await api.get<AllLookups>("/proposal/lookup");
  setCache("all-lookups", data);
  // Also populate individual caches so existing fetch* calls won't re-fetch
  setCache("agencies", data.agencies);
  setCache("departments", data.departments);
  setCache("disciplines", data.disciplines);
  setCache("sectors", data.sectors);
  setCache("tags", data.tags);
  setCache("priorities", data.priorities);
  setCache("stations", data.stations);
  return data;
};

export const fetchAgencies = async (): Promise<AgencyItem[]> => {
  const cached = getCached<AgencyItem[]>('agencies');
  if (cached) return cached;
  const { data } = await api.get<AgencyItem[]>("/proposal/lookup/agency");
  setCache('agencies', data);
  return data;
};

export const fetchAgencyAddresses = async (agencyId: number): Promise<AddressItem[]> => {
  const key = `agency-addresses-${agencyId}`;
  const cached = getCached<AddressItem[]>(key);
  if (cached) return cached;
  const { data } = await api.get<AddressItem[]>(`/proposal/lookup/agency-addresses?agency_id=${agencyId}`);
  setCache(key, data);
  return data;
};

export const fetchCooperatingAgencies = async (): Promise<AgencyItem[]> => {
  const cached = getCached<AgencyItem[]>('cooperating-agencies');
  if (cached) return cached;
  const { data } = await api.get<AgencyItem[]>("/proposal/lookup/cooperating-agency");
  setCache('cooperating-agencies', data);
  return data;
};

export const fetchDepartments = async (): Promise<LookupItem[]> => {
  const cached = getCached<LookupItem[]>('departments');
  if (cached) return cached;
  const { data } = await api.get<LookupItem[]>("/proposal/lookup/department");
  setCache('departments', data);
  return data;
};

export const getDepartmentById = async (id: number): Promise<LookupItem | undefined> => {
  const departments = await fetchDepartments();
  return departments.find((d) => d.id === id);
};

export const fetchDisciplines = async (): Promise<LookupItem[]> => {
  const cached = getCached<LookupItem[]>('disciplines');
  if (cached) return cached;
  const { data } = await api.get<LookupItem[]>("/proposal/lookup/discipline");
  setCache('disciplines', data);
  return data;
};

export const fetchSectors = async (): Promise<LookupItem[]> => {
  const cached = getCached<LookupItem[]>('sectors');
  if (cached) return cached;
  const { data } = await api.get<LookupItem[]>("/proposal/lookup/sector");
  setCache('sectors', data);
  return data;
};

export const fetchTags = async (): Promise<LookupItem[]> => {
  const cached = getCached<LookupItem[]>('tags');
  if (cached) return cached;
  const { data } = await api.get<LookupItem[]>("/proposal/lookup/tag");
  setCache('tags', data);
  return data;
};

export const fetchPriorities = async (): Promise<LookupItem[]> => {
  const cached = getCached<LookupItem[]>('priorities');
  if (cached) return cached;
  const { data } = await api.get<LookupItem[]>("/proposal/lookup/priority");
  setCache('priorities', data);
  return data;
};

export const fetchStations = async (): Promise<LookupItem[]> => {
  const cached = getCached<LookupItem[]>('stations');
  if (cached) return cached;
  const { data } = await api.get<LookupItem[]>("/proposal/lookup/station");
  setCache('stations', data);
  return data;
};

export const fetchCommodities = async (): Promise<LookupItem[]> => {
  const cached = getCached<LookupItem[]>('commodities');
  if (cached) return cached;
  const { data } = await api.get<LookupItem[]>("/proposal/lookup/commodity");
  setCache('commodities', data);
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

export const submitProposal = async (formData: FormData, file: File, workPlanFile?: File | null): Promise<CreateProposalResponse> => {
  // Use the YYYY-MM-DD string directly — converting via new Date().toISOString()
  // can shift the date back by one day in UTC+8 (Philippines) timezone.
  const startDate = formData.plannedStartDate || "";
  const endDate = formData.plannedEndDate || "";

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

  // Step 2b: Upload Work & Financial Plan (Form 3) if provided
  let workPlanFileUrl: string | undefined;
  if (workPlanFile) {
    const { uploadUrl: wpUploadUrl, fileUrl: wpFileUrl } = await getProposalUploadUrl(
      workPlanFile.name, workPlanFile.type, workPlanFile.size,
    );
    await uploadFileToS3(wpUploadUrl, workPlanFile);
    workPlanFileUrl = wpFileUrl;
  }

  // Step 3: Submit proposal metadata as JSON with the S3 file URL(s)
  const agencies = formData.cooperating_agencies.map((a: any) => (a.created_at ? a.id : a.name));
  const implementationMode = (formData.cooperating_agencies?.length || 0) > 1 ? "multi_agency" : "single_agency";

  const { data } = await api.post<CreateProposalResponse>("/proposal/create", {
    department: formData.department ?? "",
    sector: formData.sector ?? "",
    discipline: formData.discipline ?? "",
    agency: formData.agency ?? "",
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
    ...(workPlanFileUrl ? { work_plan_file_url: workPlanFileUrl } : {}),
    year: formData.year ?? new Date().getFullYear(),
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
    // Phase 1 of LIB feature: backend now expects line items with itemName/quantity/unitPrice/totalAmount.
    // The revision form still uses the legacy {item, amount} shape, so we adapt: qty=1, unitPrice=amount,
    // totalAmount=amount. The new submission form (BudgetBreakdownModal) writes the structured shape
    // directly. The revision form will be migrated to the structured shape in a later phase.
    const adaptLine = (item: { item: string; amount: number }) => ({
      itemName: item.item,
      quantity: 1,
      unitPrice: Number(item.amount) || 0,
      totalAmount: Number(item.amount) || 0,
    });

    body.budget = payload.budgetSources.map((source) => ({
      source: source.source,
      budget: {
        ps: source.breakdown?.ps?.filter(i => i.item?.trim()).map(adaptLine) || [],
        mooe: source.breakdown?.mooe?.filter(i => i.item?.trim()).map(adaptLine) || [],
        co: source.breakdown?.co?.filter(i => i.item?.trim()).map(adaptLine) || [],
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
  title_comment: string | null;
  budget_comment: string | null;
  timeline_comment: string | null;
  overall_comment: string | null;
  deadline: number | null;
  created_at: string;
  evaluator_comments?: { label: string; comment: string }[];
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

export type FormExtractedFields = {
  program_title?: string;
  project_title?: string;
  agency_name?: string;
  agency_city?: string;
  agency_barangay?: string;
  agency_street?: string;
  telephone?: string;
  email?: string;
  cooperating_agency_names?: string[];
  research_station?: string;
  classification_type?: string;
  class_input?: string;
  sector?: string;
  discipline?: string;
  duration?: number;
  planned_start_month?: string;
  planned_start_year?: string;
  planned_end_month?: string;
  planned_end_year?: string;
  budget_sources?: { source: string; ps: number; mooe: number; co: number; total: number }[];
};

export type AIAnalysisResponse = {
  title: string;
  score: number;
  isValid: boolean;
  noveltyScore: number;
  keywords: string[];
  similarPapers: { title: string; year: string }[];
  issues: string[];
  suggestions: string[];
  formFields?: FormExtractedFields;
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
  const cacheKey = `proposals:view:${search || ""}:${status || ""}`;
  const cached = getCachedWithTtl<any[]>(cacheKey, DATA_CACHE_TTL);
  if (cached) return cached;

  const params = new URLSearchParams();
  if (search) params.append("search", search);
  if (status) params.append("status", status);
  const { data } = await api.get<any[]>(`/proposal/view?${params.toString()}`, {
    withCredentials: true,
  });
  setCache(cacheKey, data);
  return data;
};

export const getRndProposals = async (): Promise<any[]> => {
  const cached = getCachedWithTtl<any[]>("proposals:rnd", DATA_CACHE_TTL);
  if (cached) return cached;

  const { data } = await api.get<any[]>(`/proposal/view-rnd`, {
    withCredentials: true,
  });
  setCache("proposals:rnd", data);
  return data;
};

export const getEvaluatorProposals = async (search?: string, status?: string): Promise<any[]> => {
  const cacheKey = `proposals:evaluator:${search || ""}:${status || ""}`;
  const cached = getCachedWithTtl<any[]>(cacheKey, DATA_CACHE_TTL);
  if (cached) return cached;

  const params = new URLSearchParams();
  if (search) params.append("search", search);
  if (status) params.append("status", status);

  const { data } = await api.get<any[]>(`/proposal/view-evaluator?${params.toString()}`, {
    withCredentials: true,
  });
  setCache(cacheKey, data);
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
  invalidateProposalCache();
  return data;
};

export type SubmitEvaluationInput = {
  proposal_id: number;
  status: string;
  title: number;
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

// New API for R&D to getting proposals ready for endorsement (with all scores).
// `filter` selects which tab to load: "active" (default), "revised", or "rejected".
export type EndorsementFilter = "active" | "revised" | "rejected";

export const getProposalsForEndorsement = async (filter: EndorsementFilter = "active"): Promise<any[]> => {
  const { data } = await api.get<any[]>(`/proposal/view-for-endorsement?filter=${filter}`, {
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
  /** Presigned / public profile image URL (from `photo_profile_url` on user) */
  profile_picture?: string;
  photo_profile_url?: string | null;
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
  invalidateProposalCache();
  return data;
};

/**
 * Auto-distribute pending proposals to R&D staff evenly per department.
 * If proposalIds is provided, only those are distributed. Otherwise all pending.
 */
export const autoDistributeProposals = async (proposalIds?: number[]): Promise<any> => {
  const { data } = await api.post(
    "/proposal/auto-distribute",
    proposalIds ? { proposal_ids: proposalIds } : {},
    { withCredentials: true },
  );
  invalidateProposalCache();
  return data;
};

export type ForwardToEvaluatorsPayload = {
  proposal_id: number;
  evaluators: { id: string; visibility: string }[];
  deadline_at: number;
  commentsForEvaluators?: string;
  anonymized_file_url?: string;
};

export const forwardProposalToEvaluators = async (input: ForwardToEvaluatorsPayload): Promise<any> => {
  const { data } = await api.post("/proposal/forward-proposal-to-evaluators", input, {
    withCredentials: true,
  });
  invalidateProposalCache();
  return data;
};

export type RequestRevisionPayload = {
  proposal_id: number;
  title_comment?: string;
  budget_comment?: string;
  timeline_comment?: string;
  overall_comment?: string;
  deadline: number;
  included_evaluator_ids?: string[];
};

export const requestRevision = async (input: RequestRevisionPayload): Promise<any> => {
  const { data } = await api.post("/proposal/revision-proposal-to-proponent", input, {
    withCredentials: true,
  });
  invalidateProposalCache();
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
  invalidateProposalCache();
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
  invalidateProposalCache();
  return data;
};

export type AssignmentTrackerItem = {
  id: number;
  proposal_id: {
    id: number;
    project_title: string;
    status?: string;
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
    email: string;
    photo_profile_url?: string | null;
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
  const cacheKey = `tracker:${proposalId || "all"}`;
  const cached = getCachedWithTtl<AssignmentTrackerItem[]>(cacheKey, DATA_CACHE_TTL);
  if (cached) return cached;

  const query = proposalId ? `?proposal_id=${proposalId}` : "";
  const { data } = await api.get<AssignmentTrackerItem[]>(`/proposal/assignment-tracker${query}`, {
    withCredentials: true,
  });
  setCache(cacheKey, data);
  return data;
};

/** Fetch ALL assignment tracker data in a single API call (no N+1) */
export const getAllAssignmentTrackers = async (): Promise<AssignmentTrackerItem[]> => {
  const cacheKey = "tracker:bulk";
  const cached = getCachedWithTtl<AssignmentTrackerItem[]>(cacheKey, DATA_CACHE_TTL);
  if (cached) return cached;

  const { data } = await api.get<AssignmentTrackerItem[]>("/proposal/assignment-tracker", {
    withCredentials: true,
  });
  setCache(cacheKey, data);
  return data;
};

// --- Assignment History ---
export type AssignmentHistoryItem = {
  id: number;
  action: string;
  performedBy: string;
  performedById: string;
  evaluatorName: string | null;
  evaluatorId: string | null;
  remarks: string | null;
  decision: string | null;
  timestamp: string;
};

export const getAssignmentHistory = async (proposalId: number): Promise<AssignmentHistoryItem[]> => {
  const { data } = await api.get<AssignmentHistoryItem[]>(`/proposal/assignment-history?proposal_id=${proposalId}`, {
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
  invalidateProposalCache();
  return data;
};

export const removeEvaluator = async (proposalId: number, evaluatorId: string): Promise<any> => {
  const { data } = await api.delete("/proposal/evaluator", {
    // @ts-ignore
    data: { proposal_id: proposalId, evaluator_id: evaluatorId },
    withCredentials: true,
  });
  invalidateProposalCache();
  return data;
};

// --- Proponent Extension Requests ---

export type ProponentExtensionRequest = {
  id: number;
  proposal_id: number;
  proponent_id: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  reviewed_by: string | null;
  review_note: string | null;
  new_deadline_days: number | null;
  created_at: string;
  reviewed_at: string | null;
  proponent?: { id: string; first_name: string; last_name: string; email: string };
  proposal?: { id: number; project_title: string; status: string };
};

export const requestProponentExtension = async (
  proposalId: number,
  reason: string,
): Promise<any> => {
  const { data } = await api.post(
    "/proposal/request-proponent-extension",
    { proposal_id: proposalId, reason },
    { withCredentials: true },
  );
  invalidateProposalCache();
  return data;
};

export const reviewProponentExtension = async (input: {
  extension_request_id: number;
  proposal_id: number;
  action: "approved" | "rejected";
  review_note?: string;
  new_deadline_days?: number;
}): Promise<any> => {
  const { data } = await api.post("/proposal/review-proponent-extension", input, {
    withCredentials: true,
  });
  invalidateProposalCache();
  return data;
};

export const getProponentExtensionRequests = async (
  proposalId?: number,
): Promise<ProponentExtensionRequest[]> => {
  const query = proposalId ? `?proposal_id=${proposalId}` : "";
  const { data } = await api.get(`/proposal/proponent-extension-requests${query}`, {
    withCredentials: true,
  });
  return (data as any).data ?? data;
};

// ============================================================
// Phase 1 of LIB feature: budget subcategories
// ============================================================

export type BudgetSubcategoryDto = {
  id: number;
  category: "ps" | "mooe" | "co";
  code: string;
  label: string;
  sort_order: number;
  active: boolean;
};

// Cached for the lookup TTL — the subcategory list is static admin data, no need to refetch
// on every modal open.
export const fetchBudgetSubcategories = async (
  category?: "ps" | "mooe" | "co",
): Promise<BudgetSubcategoryDto[]> => {
  const cacheKey = `budget-subcategories:${category ?? "all"}`;
  const cached = getCached<BudgetSubcategoryDto[]>(cacheKey);
  if (cached) return cached;
  const params = category ? `?category=${category}` : "";
  const { data } = await api.get<BudgetSubcategoryDto[]>(`/proposal/budget-subcategories${params}`, {
    withCredentials: true,
  });
  setCache(cacheKey, data);
  return data;
};

// ============================================================
// Phase 2 of LIB feature: parse uploaded LIB .docx
// ============================================================

export type LibParseConfidence = "high" | "medium" | "low";
export type LibCategory = "ps" | "mooe" | "co";

export interface ParsedLibItemDto {
  category: LibCategory;
  subcategoryLabel: string | null;
  itemName: string;
  spec: string | null;
  quantity: number;
  unit: string | null;
  unitPrice: number;
  totalAmount: number;
  confidence: LibParseConfidence;
  warning: string | null;
  rawRow: string;
}

export interface ParseLibResultDto {
  items: ParsedLibItemDto[];
  warnings: string[];
  detected: {
    categories: Record<LibCategory, boolean>;
    grandTotal: number | null;
    tableCount: number;
  };
}

export const parseLibDocument = async (file: File): Promise<ParseLibResultDto> => {
  const fd = new FormData();
  fd.append("file", file);

  const { data } = await api.post<ParseLibResultDto>("/proposal/parse-lib", fd, {
    headers: { "Content-Type": "multipart/form-data" },
    withCredentials: true,
  });

  return data;
};

// ── Feature 3: Proposal Timeline ──────────────────────────────────────────

export interface TimelineEvent {
  id: number;
  action: string;
  actor: string;
  details: Record<string, any>;
  timestamp: string;
}

export const getProposalTimeline = async (proposalId: number | string): Promise<TimelineEvent[]> => {
  const { data } = await api.get<TimelineEvent[]>("/proposal/timeline", {
    params: { proposal_id: proposalId },
    withCredentials: true,
  });
  return data;
};

// ── Feature 4: Proposal Revision Context ──────────────────────────────────

export interface RevisionContextVersion {
  id: number;
  file_url: string | string[];
  created_at: string;
}

export interface RevisionContextSummary {
  id: number;
  proposal_id: number;
  rnd_id: string;
  rnd_name: string;
  remarks: string;
  included_evaluator_ids: string[] | null;
  created_at: string;
}

export interface RevisionContextBudgetItem {
  id: number;
  source: string;
  category: string;
  item_name: string;
  spec: string | null;
  quantity: number;
  unit: string;
  unit_price: number;
  total_amount: number;
  display_order: number;
}

export interface RevisionContextBudgetVersion {
  id: number;
  version_number: number;
  grand_total: number;
  created_at: string;
  proposal_budget_items: RevisionContextBudgetItem[];
}

export interface RevisionContext {
  versions: RevisionContextVersion[];
  revision_summaries: RevisionContextSummary[];
  budget_versions: RevisionContextBudgetVersion[];
}

export const getProposalRevisionContext = async (proposalId: number | string): Promise<RevisionContext> => {
  const { data } = await api.get<RevisionContext>("/proposal/revision-context", {
    params: { proposal_id: proposalId },
    withCredentials: true,
  });
  return data;
};
