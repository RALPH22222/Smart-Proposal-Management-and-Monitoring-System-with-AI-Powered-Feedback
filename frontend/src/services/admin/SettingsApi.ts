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

export interface NotificationChannel {
  proposal_endorsed: boolean;
  proposal_revision: boolean;
  fund_request_reviewed: boolean;
  certificate_issued: boolean;
  evaluator_assigned: boolean;
}

export interface NotificationPreferences {
  email: NotificationChannel;
  in_app: NotificationChannel;
}

export interface EvaluationDeadline {
  days: number;
}

export const NOTIFICATION_LABELS: Record<keyof NotificationChannel, string> = {
  proposal_endorsed: "Proposal endorsed for funding",
  proposal_revision: "Proposal revision requested",
  fund_request_reviewed: "Fund request approved/rejected",
  certificate_issued: "Completion certificate issued",
  evaluator_assigned: "Evaluator assignment",
};

export const SettingsApi = {
  // Late Submission Policy
  async getLateSubmissionPolicy(): Promise<LateSubmissionPolicy> {
    const res = await api.get<{ data: LateSubmissionPolicy }>("/admin/late-submission-policy");
    return res.data.data;
  },

  async updateLateSubmissionPolicy(policy: LateSubmissionPolicy): Promise<LateSubmissionPolicy> {
    const res = await api.post<{ data: LateSubmissionPolicy }>("/admin/update-late-submission-policy", policy);
    return res.data.data;
  },

  // Notification Preferences
  async getNotificationPreferences(): Promise<NotificationPreferences> {
    const res = await api.get<{ data: NotificationPreferences }>("/admin/notification-preferences");
    return res.data.data;
  },

  async updateNotificationPreferences(prefs: NotificationPreferences): Promise<NotificationPreferences> {
    const res = await api.post<{ data: NotificationPreferences }>("/admin/update-notification-preferences", prefs);
    return res.data.data;
  },

  // Evaluator Availability
  async updateAvailability(is_available: boolean): Promise<{ is_available: boolean }> {
    const res = await api.post<{ data: { is_available: boolean } }>("/admin/update-availability", { is_available });
    return res.data.data;
  },

  // Evaluation Deadline
  async getEvaluationDeadline(): Promise<EvaluationDeadline> {
    const res = await api.get<{ data: EvaluationDeadline }>("/admin/evaluation-deadline");
    return res.data.data;
  },

  async updateEvaluationDeadline(days: number): Promise<EvaluationDeadline> {
    const res = await api.post<{ data: EvaluationDeadline }>("/admin/update-evaluation-deadline", { days });
    return res.data.data;
  },
};
