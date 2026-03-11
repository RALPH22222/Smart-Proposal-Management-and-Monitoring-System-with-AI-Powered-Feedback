import { api } from "../../utils/axios";

export interface LateSubmissionPolicyDisabled {
  enabled: false;
}

export interface LateSubmissionPolicyUntilDate {
  enabled: true;
  type: "until_date";
  deadline: string;
}

export interface LateSubmissionPolicyIndefinite {
  enabled: true;
  type: "indefinite";
}

export type LateSubmissionPolicy =
  | LateSubmissionPolicyDisabled
  | LateSubmissionPolicyUntilDate
  | LateSubmissionPolicyIndefinite;

export const SettingsApi = {
  async getLateSubmissionPolicy(): Promise<LateSubmissionPolicy> {
    const res = await api.get("/admin/late-submission-policy");
    return res.data.data;
  },

  async updateLateSubmissionPolicy(policy: LateSubmissionPolicy): Promise<LateSubmissionPolicy> {
    const res = await api.post("/admin/update-late-submission-policy", policy);
    return res.data.data;
  },
};
