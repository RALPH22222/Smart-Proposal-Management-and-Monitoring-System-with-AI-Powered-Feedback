import { z } from "zod";

// Enums as Zod schemas
export const projectStatusSchema = z.enum(["on_going", "completed", "on_hold", "blocked"]);

export const quarterlyReportSchema = z.enum(["q1_report", "q2_report", "q3_report", "q4_report"]);

export const reportStatusSchema = z.enum(["submitted", "verified", "overdue"]);

// Get Funded Projects Schema
export const getFundedProjectsSchema = z.object({
  user_id: z.string().uuid().optional(),
  role: z.enum(["proponent", "rnd", "admin"]).optional(),
  status: projectStatusSchema.optional(),
  limit: z.number().int().positive().optional().default(20),
  offset: z.number().int().nonnegative().optional().default(0),
});

export type GetFundedProjectsInput = z.infer<typeof getFundedProjectsSchema>;

// Submit Quarterly Report Schema
// Note: submitted_by_proponent_id is injected by handler from JWT, not from request body
export const submitReportSchema = z.object({
  funded_project_id: z.number().int().positive(),
  quarterly_report: quarterlyReportSchema,
  progress: z.number().int().min(0).max(100),
  comment: z.string().optional(),
  report_file_url: z.array(z.string().url()).optional(),
  liquidations: z
    .array(
      z.object({
        fund_request_item_id: z.number().int().positive(),
        actual_amount: z.number().min(0),
      })
    )
    .optional(),
});

// Full input including server-injected fields
export type SubmitReportInput = z.infer<typeof submitReportSchema> & {
  submitted_by_proponent_id: string;
};

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

// Respond to Invitation Schema
// Note: user_id is injected by handler from JWT, not from request body
export const respondToInvitationSchema = z.object({
  member_id: z.number().int().positive(),
  action: z.enum(["accept", "decline"]),
});

export type RespondToInvitationInput = z.infer<typeof respondToInvitationSchema> & {
  user_id: string;
};

// ===================== FUND REQUESTS =====================

export const fundRequestStatusSchema = z.enum(["pending", "approved", "rejected"]);

export const budgetCategorySchema = z.enum(["ps", "mooe", "co"]);

// Create Fund Request Schema
// Note: requested_by is injected by handler from JWT, not from request body
export const createFundRequestSchema = z.object({
  funded_project_id: z.number().int().positive(),
  quarterly_report: quarterlyReportSchema,
  items: z
    .array(
      z.object({
        item_name: z.string().min(1).max(500),
        amount: z.number().positive(),
        description: z.string().max(1000).optional(),
        category: budgetCategorySchema,
      })
    )
    .min(1, "At least one item is required"),
});

export type CreateFundRequestInput = z.infer<typeof createFundRequestSchema> & {
  requested_by: string;
};

// Get Fund Requests Schema
export const getFundRequestsSchema = z.object({
  funded_project_id: z.coerce.number().int().positive(),
  status: fundRequestStatusSchema.optional(),
});

export type GetFundRequestsInput = z.infer<typeof getFundRequestsSchema>;

// Review (Approve/Reject) Fund Request Schema
// Note: reviewed_by is injected by handler from JWT, not from request body
export const reviewFundRequestSchema = z.object({
  fund_request_id: z.number().int().positive(),
  status: z.enum(["approved", "rejected"]),
  review_note: z.string().max(2000).optional(),
});

export type ReviewFundRequestInput = z.infer<typeof reviewFundRequestSchema> & {
  reviewed_by: string;
};

// Generate Certificate Schema
// Note: issued_by is injected by handler from JWT, not from request body
export const generateCertificateSchema = z.object({
  funded_project_id: z.number().int().positive(),
});

export type GenerateCertificateInput = z.infer<typeof generateCertificateSchema> & {
  issued_by: string;
};

// Request Project Extension Schema
export const requestProjectExtensionSchema = z.object({
  funded_project_id: z.number().int().positive(),
  extension_type: z.enum(["time_only", "with_funding"]),
  new_end_date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date format",
  }),
  reason: z.string().min(10, "Reason must be at least 10 characters long").max(3000),
});

export type RequestProjectExtensionInput = z.infer<typeof requestProjectExtensionSchema> & {
  requested_by: string;
};
