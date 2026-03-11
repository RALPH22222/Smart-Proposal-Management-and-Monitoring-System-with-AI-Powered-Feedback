import { z } from "zod";

// Late Submission Policy Schema
export const lateSubmissionPolicySchema = z.discriminatedUnion("type", [
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
