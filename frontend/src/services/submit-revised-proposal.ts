import { api } from "../utils/axios";
import type { BudgetSource } from "../types/proponentTypes";

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
 * Submit a revised proposal with updated project title, file, schedule, and budget
 * Only the fields that were editable by proponent should be included
 */
export const submitRevisedProposal = async (
  proposalId: number,
  payload: SubmitRevisedProposalPayload,
): Promise<SubmitRevisedProposalResponse> => {
  const fd = new FormData();

  // Required fields
  fd.append("proposal_id", String(proposalId));
  fd.append("file_url", payload.file);

  // Optional fields
  if (payload.projectTitle) {
    fd.append("project_title", payload.projectTitle);
  }

  if (payload.implementingSchedule?.startDate) {
    fd.append("plan_start_date", payload.implementingSchedule.startDate);
  }

  if (payload.implementingSchedule?.endDate) {
    fd.append("plan_end_date", payload.implementingSchedule.endDate);
  }

  // Format budget for backend if provided
  if (payload.budgetSources && payload.budgetSources.length > 0) {
    const formattedBudget = payload.budgetSources.map((source) => ({
      source: source.source,
      budget: {
        ps: source.breakdown?.ps?.map((item) => ({ item: item.item, value: item.amount })) || [],
        mooe: source.breakdown?.mooe?.map((item) => ({ item: item.item, value: item.amount })) || [],
        co: source.breakdown?.co?.map((item) => ({ item: item.item, value: item.amount })) || [],
      },
    }));
    fd.append("budget", JSON.stringify(formattedBudget));
  }

  if (payload.revisionResponse) {
    fd.append("revision_response", payload.revisionResponse);
  }

  const { data } = await api.post<SubmitRevisedProposalResponse>("/proposal/submit-revised", fd, {
    headers: { "Content-Type": "multipart/form-data" },
    withCredentials: true,
  });

  return data;
};
