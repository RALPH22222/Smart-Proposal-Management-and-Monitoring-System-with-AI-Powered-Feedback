import { api } from "../utils/axios";
import { getProposalUploadUrl, uploadFileToS3 } from "./proposal.api";
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
