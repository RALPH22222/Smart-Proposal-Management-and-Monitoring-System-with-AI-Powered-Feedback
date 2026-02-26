import { z } from "zod";

// Enums as Zod schemas
export const projectStatusSchema = z.enum(["on_going", "completed", "on_hold", "blocked"]);

export const quarterlyReportSchema = z.enum(["q1_report", "q2_report", "q3_report", "q4_report"]);

export const reportStatusSchema = z.enum(["submitted", "verified", "overdue"]);

// Get Funded Projects Schema
export const getFundedProjectsSchema = z.object({
  user_id: z.string().uuid().optional(),
  role: z.enum(["proponent", "rnd", "admin", "lead_proponent"]).optional(),
  status: projectStatusSchema.optional(),
  limit: z.number().int().positive().optional().default(20),
  offset: z.number().int().nonnegative().optional().default(0),
});

export type GetFundedProjectsInput = z.infer<typeof getFundedProjectsSchema>;

// Submit Quarterly Report Schema
export const submitReportSchema = z.object({
  funded_project_id: z.number().int().positive(),
  quarterly_report: quarterlyReportSchema,
  progress: z.number().int().min(0).max(100),
  comment: z.string().optional(),
  report_file_url: z.array(z.string().url()).optional(),
  submitted_by_proponent_id: z.string().uuid(),
});

export type SubmitReportInput = z.infer<typeof submitReportSchema>;

// Get Project Reports Schema
export const getProjectReportsSchema = z.object({
  funded_project_id: z.number().int().positive(),
  status: reportStatusSchema.optional(),
});

export type GetProjectReportsInput = z.infer<typeof getProjectReportsSchema>;

// Verify Project Report Schema
export const verifyReportSchema = z.object({
  report_id: z.number().int().positive(),
  verified_by_id: z.string().uuid(),
});

export type VerifyReportInput = z.infer<typeof verifyReportSchema>;

// Add Comment Schema
export const addCommentSchema = z.object({
  project_reports_id: z.number().int().positive(),
  users_id: z.string().uuid(),
  comments: z.string().min(1).max(2000),
});

export type AddCommentInput = z.infer<typeof addCommentSchema>;

// Get Report Comments Schema
export const getReportCommentsSchema = z.object({
  project_reports_id: z.number().int().positive(),
});

export type GetReportCommentsInput = z.infer<typeof getReportCommentsSchema>;

// Add Expense Schema
export const addExpenseSchema = z.object({
  project_reports_id: z.number().int().positive(),
  expenses: z.number().positive(),
  desription: z.string().min(1).max(500), // Note: matches DB typo
});

export type AddExpenseInput = z.infer<typeof addExpenseSchema>;

// Get Project Expenses Schema
export const getProjectExpensesSchema = z.object({
  project_reports_id: z.number().int().positive(),
});

export type GetProjectExpensesInput = z.infer<typeof getProjectExpensesSchema>;

// Update Project Status Schema
export const updateProjectStatusSchema = z.object({
  project_id: z.number().int().positive(),
  status: projectStatusSchema,
  updated_by_id: z.string().uuid(),
});

export type UpdateProjectStatusInput = z.infer<typeof updateProjectStatusSchema>;

// Get Single Project Schema
export const getProjectSchema = z.object({
  project_id: z.number().int().positive(),
});

export type GetProjectInput = z.infer<typeof getProjectSchema>;

// Invite Member Schema
export const inviteMemberSchema = z.object({
  funded_project_id: z.number().int().positive(),
  email: z.string().email(),
  invited_by: z.string().uuid(),
});

export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;

// Remove Member Schema
export const removeMemberSchema = z.object({
  funded_project_id: z.number().int().positive(),
  member_id: z.number().int().positive(),
  removed_by: z.string().uuid(),
});

export type RemoveMemberInput = z.infer<typeof removeMemberSchema>;

// Get Project Members Schema
export const getProjectMembersSchema = z.object({
  funded_project_id: z.coerce.number().int().positive(),
});

export type GetProjectMembersInput = z.infer<typeof getProjectMembersSchema>;
