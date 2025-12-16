import { api } from "../utils/axios";
import type { FormData } from "../types/proponent-form";

/* ===========================
 * Shared Types
 * =========================== */

export type LookupItem = {
  id: number;
  name: string;
};

export type CreateProposalResponse = {
  message: string;
  proposalId?: string;
};

/* ===========================
 * LOOKUP ENDPOINTS (Axios only)
 * =========================== */

export const fetchAgencies = async (): Promise<LookupItem[]> => {
  const { data } = await api.get<LookupItem[]>("/proposal/view-agency");
  return data;
};

export const fetchCooperatingAgencies = async (): Promise<LookupItem[]> => {
  const { data } = await api.get<LookupItem[]>("/proposal/view-cooperating-agency");
  return data;
};

export const fetchDepartments = async (): Promise<LookupItem[]> => {
  const { data } = await api.get<LookupItem[]>("/proposal/department");
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

/* ===========================
 * SUBMIT PROPOSAL
 * =========================== */

export const submitProposal = async (
  formData: FormData,
  file: File,
  proponentId: string,
): Promise<CreateProposalResponse> => {
  const fd = new FormData();

  /* ---- Core fields ---- */
  fd.append("proponent_id", proponentId);
  fd.append("program_title", formData.programTitle ?? "");
  fd.append("project_title", formData.projectTitle);
  fd.append("email", formData.email ?? "");
  fd.append("phone", formData.telephone ?? "");
  fd.append("school_year", formData.schoolYear ?? "");

  /* ---- Dates ---- */
  fd.append("planned_start_date", formData.plannedStartDate ?? "");
  fd.append("planned_end_date", formData.plannedEndDate ?? "");
  fd.append("duration", formData.duration ?? "");

  /* ---- Agency ---- */
  fd.append("agency", formData.agency);

  fd.append(
    "agencyAddress",
    JSON.stringify({
      street: formData.agencyAddress.street,
      barangay: formData.agencyAddress.barangay,
      city: formData.agencyAddress.city,
    }),
  );

  /* ---- Research / Development ---- */
  fd.append("classificationType", formData.classificationType);

  if (formData.classificationType === "research") {
    fd.append("researchType", JSON.stringify(formData.researchType));
  } else {
    fd.append("developmentType", formData.developmentType);
  }

  /* ---- Implementation ---- */
  fd.append("implementationMode", formData.implementationMode.singleAgency ? "single" : "multi");

  fd.append("implementationSite", JSON.stringify(formData.implementationSite));

  /* ---- Lookups ---- */
  fd.append("researchStation", formData.researchStation);
  fd.append("sectorCommodity", formData.sectorCommodity);
  fd.append("discipline", formData.discipline);

  /* ---- Cooperating agencies
   * Existing: { id, name }
   * New: { name }
   * Backend infers behavior
   */
  fd.append("cooperatingAgencies", JSON.stringify(formData.cooperatingAgencies));

  /* ---- Priority areas ---- */
  fd.append(
    "priorityAreas",
    JSON.stringify(
      Object.entries(formData.priorityAreas || {})
        .filter(([_, v]) => v === true)
        .map(([k]) => k),
    ),
  );

  /* ---- Budget ---- */
  fd.append("budgetItems", JSON.stringify(formData.budgetItems));

  /* ---- File ---- */
  fd.append("file", file);

  const { data } = await api.post<CreateProposalResponse>("/proposal/create", fd, {
    headers: { "Content-Type": "multipart/form-data" },
    withCredentials: true,
  });

  return data;
};
