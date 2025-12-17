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

export const fetchPriorities = async (): Promise<LookupItem[]> => {
  const { data } = await api.get<LookupItem[]>("/proposal/view-priority");
  return data;
};

export const fetchStations = async (): Promise<LookupItem[]> => {
  const { data } = await api.get<LookupItem[]>("/proposal/view-station");
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
  const startDate = formData.plannedStartDate 
    ? new Date(formData.plannedStartDate).toISOString().split('T')[0] 
    : "";
  const endDate = formData.plannedEndDate 
    ? new Date(formData.plannedEndDate).toISOString().split('T')[0] 
    : "";
  let researchClass = "";
  if (formData.classificationType === "research") {
    researchClass = Object.keys(formData.researchType).find(
      (key) => formData.researchType[key] === true
    ) || "";
  }
  fd.append("proponent_id", proponentId);
  if (formData.department) {
    fd.append("department", formData.department);
  }
  fd.append("sector", formData.sectorCommodity);
  fd.append("discipline", formData.discipline);
  fd.append("agency", String(formData.agencyName));
  fd.append("program_title", formData.programTitle ?? "");
  fd.append("project_title", formData.projectTitle);
  fd.append("email", formData.email ?? "");
  fd.append("phone", formData.telephone ?? "");
  if (formData.classificationType === "research") {
    fd.append("research_class", researchClass);
  } else {
    fd.append("development_class", formData.developmentType);
  }
  fd.append(
    "implementation_mode",
    formData.implementationMode.singleAgency ? "single_agency" : "multi_agency"
  );
  fd.append(
    "priority_areas",
    JSON.stringify(
      Object.entries(formData.priorityAreas || {})
        .filter(([_, v]) => v === true)
        .map(([k]) => k),
    ),
  );
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
  fd.append("duration", formData.duration ?? "");

  fd.append("cooperating_agencies", JSON.stringify(formData.cooperatingAgencies));
  fd.append("implementation_site", JSON.stringify(formData.implementationSite));
  fd.append("tags", JSON.stringify(formData.tags || []));
  const { data } = await api.post<CreateProposalResponse>("/proposal/create", fd, {
    headers: { "Content-Type": "multipart/form-data" },
    withCredentials: true,
  });

  return data;
};