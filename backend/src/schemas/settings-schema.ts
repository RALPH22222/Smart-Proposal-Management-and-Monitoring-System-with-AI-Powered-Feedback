import { z } from "zod";

// Late Submission Policy Schema
export const lateSubmissionPolicySchema = z.union([
  z.object({
    enabled: z.literal(true),
    type: z.literal("until_date"),
    deadline: z.string().datetime({ message: "Must be a valid ISO 8601 date" }),
  }),
  z.object({
    enabled: z.literal(true),
    type: z.literal("indefinite"),
  }),
  z.object({
    enabled: z.literal(false),
  }),
]);

export type LateSubmissionPolicy = z.infer<typeof lateSubmissionPolicySchema>;

// Update Late Submission Schema (wraps the policy for handler validation)
export const updateLateSubmissionSchema = lateSubmissionPolicySchema;

export type UpdateLateSubmissionInput = LateSubmissionPolicy;

// Notification Preferences Schema
export const notificationChannelSchema = z.object({
  proposal_endorsed: z.boolean(),
  proposal_revision: z.boolean(),
  fund_request_reviewed: z.boolean(),
  certificate_issued: z.boolean(),
  evaluator_assigned: z.boolean(),
});

export const notificationPreferencesSchema = z.object({
  email: notificationChannelSchema,
  in_app: notificationChannelSchema,
});

export type NotificationPreferences = z.infer<typeof notificationPreferencesSchema>;

// Default Evaluation Deadline Schema
export const evaluationDeadlineSchema = z.object({
  days: z.number().int().min(1).max(90),
});

export type EvaluationDeadlineInput = z.infer<typeof evaluationDeadlineSchema>;
