import { z } from "zod";

export const requestLeaveSchema = z.object({
  reason: z.string().min(1, "Reason is required").max(2000, "Reason is too long"),
});

export const reviewLeaveSchema = z.object({
  leave_id: z.coerce.number().min(1, "Leave ID is required"),
  status: z.enum(["approved", "denied"]),
  review_note: z.string().max(2000, "Note is too long").optional(),
});

export const endLeaveSchema = z.object({
  leave_id: z.coerce.number().min(1, "Leave ID is required"),
});

export const getLeaveRequestsSchema = z.object({
  status: z.string().optional(),
  user_id: z.string().uuid().optional(),
});

export type RequestLeaveInput = z.infer<typeof requestLeaveSchema>;
export type ReviewLeaveInput = z.infer<typeof reviewLeaveSchema>;
export type EndLeaveInput = z.infer<typeof endLeaveSchema>;
export type GetLeaveRequestsInput = z.infer<typeof getLeaveRequestsSchema>;
