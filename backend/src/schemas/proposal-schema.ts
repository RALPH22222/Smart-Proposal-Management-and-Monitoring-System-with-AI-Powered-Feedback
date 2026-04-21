import { z } from "zod";
import {
  ClassificationType,
  EvaluatorFinalDecision,
  EvaluatorStatus,
  ExtensionDecision,
  ImplementationMode,
  Status,
  AssignmentTracker,
  EndorsementDecision,
  ProponentExtensionStatus,
} from "../types/proposal";

const parseJsonIfString = (val: unknown) => {
  if (typeof val === "string") {
    try {
      return JSON.parse(val);
    } catch {
      return val; // let Zod throw a useful error
    }
  }
  return val;
};

const fileSchema = z.object({
  fieldname: z.string().optional(),
  contentType: z.enum([
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ]),
  filename: z.string(),
});

// Phase 1 of LIB feature: each line item now carries item_name, spec/volume, quantity,
// unit, unit_price, and total. The server re-derives total = quantity * unit_price and
// rejects mismatches. subcategoryId / customSubcategoryLabel are optional to keep legacy
// paths (auto-fill from Form 1B, draft resume) working without forcing manual classification.
const budgetLineSchema = z
  .object({
    subcategoryId: z.coerce.number().int().positive().nullable().optional(),
    customSubcategoryLabel: z.string().max(120, "Subcategory label is too long").nullable().optional(),
    itemName: z.string().min(1, "Item name is required").max(200, "Item name is too long"),
    spec: z.string().max(200, "Spec is too long").nullable().optional(),
    quantity: z.coerce.number().positive("Quantity must be greater than 0"),
    unit: z.string().max(40, "Unit is too long").nullable().optional(),
    unitPrice: z.coerce.number().nonnegative("Unit price cannot be negative"),
    totalAmount: z.coerce.number().nonnegative(),
  })
  .superRefine((data, ctx) => {
    const computed = Math.round(data.quantity * data.unitPrice * 100) / 100;
    const provided = Math.round(data.totalAmount * 100) / 100;
    if (Math.abs(computed - provided) > 0.01) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Total (${provided}) must equal quantity × unit price (${computed})`,
        path: ["totalAmount"],
      });
    }
  });

const budgetCategorySchema = z
  .object({
    ps: z.array(budgetLineSchema).default([]),
    mooe: z.array(budgetLineSchema).default([]),
    co: z.array(budgetLineSchema).default([]),
  })
  .refine(
    (data) => data.ps.length > 0 || data.mooe.length > 0 || data.co.length > 0,
    { message: "At least one budget item (PS, MOOE, or CO) is required per funding source" },
  );

const budgetsSchema = z
  .array(
    z.object({
      source: z.string().min(1).max(100, "Funding source name is too long"),
      budget: budgetCategorySchema,
    }),
  )
  .min(1, "At least one budget source is required");

// // Helper to normalize development_class (camelCase to snake_case)
// const normalizeDevelopmentClass = (val: unknown): string | undefined => {
//   const parsed = parseJsonIfString(val);
//   if (!parsed || parsed === "") return undefined;

//   const keyMap: Record<string, string> = {
//     pilotTesting: "pilot_testing",
//     pilot_testing: "pilot_testing",
//     techPromotion: "tech_promotion",
//     tech_promotion: "tech_promotion",
//   };

//   return keyMap[String(parsed)] || String(parsed);
// };

// Helper to normalize implementation_site (site -> site_name)
const normalizeImplementationSite = (val: unknown) => {
  const parsed = parseJsonIfString(val);
  if (!Array.isArray(parsed)) return [];

  return parsed.map((item: any) => ({
    site_name: item.site_name || item.site || "",
    city: item.city || "",
  }));
};

// Helper to normalize cooperating agencies.
// Frontend sends a mixed array: numeric ids for existing agencies, name strings for new ones.
// e.g. [29, 33, "Test Subject #3"]
// resolveLookupId handles both: numbers used as-is, strings looked up or created.
const normalizeCooperatingAgencies = (val: unknown) => {
  const parsed = parseJsonIfString(val);
  if (!Array.isArray(parsed)) return [];
  return parsed;
};

export const proposalSchema = z.object({
  // --- CHANGED: Matches Frontend camelCase ---
  proponent_id: z.string().uuid(),
  department: z.union([z.coerce.number(), z.string()]).optional(), // Made optional - not always sent
  sector: z.union([z.coerce.number(), z.string()]),
  discipline: z.union([z.coerce.number(), z.string()]),
  agency: z.union([z.coerce.number(), z.string()]),
  agency_address: z.preprocess(
    parseJsonIfString,
    z.object({
      id: z.string().uuid().optional(), // Existing address UUID
      street: z.string().max(256).nullish(), // Optional
      barangay: z.string().max(256).nullish(), // Optional
      city: z.string().min(1, "City is required").max(256, "City name is too long"),
    }),
  ),
  year: z.coerce
    .string()
    .regex(/^\d+$/, "Year must contain digits only")
    .transform((value) => Number(value)),
  // Optional: DOST Form 1B treats program as conditional ("if the project is part of
  // a program..."). Standalone projects can leave this blank or use "N/A". A successful
  // proposal may later become a program umbrella for other proposals, which is the
  // forward-looking reason we keep this field captured.
  program_title: z.string().max(256, "program title is too long").optional().nullable(),
  project_title: z.string().min(1, "Project title is required").max(256, "project title is too long"), // Changed from project_title

  email: z.string().or(z.literal("")),
  phone: z.coerce.number().optional().default(0), // Made optional with default for empty string

  // --- CHANGED: Use nativeEnum for TS Enums ---
  // research_class and development_class are mutually exclusive - only one is sent
  class_input: z.string(),
  classification_type: z.preprocess(parseJsonIfString, z.nativeEnum(ClassificationType)),
  implementation_mode: z.preprocess(parseJsonIfString, z.nativeEnum(ImplementationMode)),

  // --- CHANGED: Matches Frontend names ---
  plan_start_date: z.string().date(), // Changed from plan_start_date
  plan_end_date: z.string().date(), // Changed from plan_end_date
  // Multi-year enabled (Phase 2A, 2026-04-20). 1–120 months covers 1 month up to
  // 10 years, matching the reporting lifecycle's 40-period (Y1Q1..Y10Q4) envelope.
  duration: z.coerce.number().int().min(1, "Duration must be at least 1 month").max(120, "Duration cannot exceed 10 years (120 months)."),

  // Priority area IDs - array of numbers referencing the priorities table
  priorities_id: z.preprocess(parseJsonIfString, z.array(z.coerce.number())),

  // --- NEW: Implementation Site with flexible field names (site or site_name) ---
  implementation_site: z.preprocess(
    normalizeImplementationSite,
    z.array(
      z.object({
        site_name: z.string().max(256, "site name is too long"),
        city: z.string().max(256, "city name is too long"),
      }),
    ),
  ),

  budget: z.preprocess(parseJsonIfString, budgetsSchema),

  // --- NEW: Cooperating Agencies - handles both {id, name} objects and primitives ---
  cooperating_agencies: z
    .preprocess(normalizeCooperatingAgencies, z.array(z.union([z.coerce.number(), z.string()])))
    .optional(),

  tags: z.preprocess(parseJsonIfString, z.array(z.coerce.number())),

  file_url: z.string().url("Invalid file URL"),
  work_plan_file_url: z.string().url("Invalid work plan file URL").optional(),
});

export const decisionEvaluatorToProposalSchema = z.object({
  proposal_id: z.number(),
  status: z.preprocess(parseJsonIfString, z.nativeEnum(AssignmentTracker)),
  remarks: z.string().max(2000, "Comments are too long").optional(),
  deadline_at: z.string().date().optional(),
});

export const forwardToEvaluatorsSchema = z.object({
  proposal_id: z.number().min(1, "Proposal ID is required"),
  evaluators: z.array(
    z.object({
      id: z.string().uuid(),
      visibility: z.enum(["name", "agency", "both", "none"]).optional().default("both"),
    })
  ),
  deadline_at: z.number().int().positive().max(90, "Deadline cannot be more than 90 days"),
  commentsForEvaluators: z.string().max(2000, "Comments are too long").optional(),
  anonymized_file_url: z.string().url("Invalid anonymized file URL").optional(),
});

export const revisionProposalToProponentSchema = z.object({
  proposal_id: z.coerce.number(),
  title_comment: z.string().max(2000, "Comments are too long").optional(),
  budget_comment: z.string().max(2000, "Comments are too long").optional(),
  timeline_comment: z.string().max(2000, "Comments are too long").optional(),
  overall_comment: z.string().max(2000, "Comments are too long").optional(),
  deadline: z.coerce.number(),
  included_evaluator_ids: z.array(z.string().uuid()).optional(),
});

export const rejectProposalToProponentSchema = z.object({
  proposal_id: z.coerce.number(),
  comment: z.string().max(2000, "Comments are too long").optional(),
});

export const createEvaluationScoresToProposaltSchema = z.object({
  proposal_id: z.number(),
  status: z.preprocess(parseJsonIfString, z.nativeEnum(EvaluatorFinalDecision)),
  title: z.number(),
  budget: z.number(),
  timeline: z.number(),
  comment: z.string().max(2000, "Comments are too long").optional(),
});

export const forwardToRndSchema = z.object({
  proposal_id: z.number().min(1, "Proposal ID is required"),
  rnd_id: z.array(z.string().min(1)).nonempty("At least one R&D is required"),
});

export const proposalVersionSchema = z.object({
  proposal_id: z.number().min(1),
  file_url: z.string().url(),
});

export const proposalStatusSchema = z.nativeEnum(Status);
export const proposalEvaluatorStatusSchema = z.nativeEnum(EvaluatorStatus);

export const endorseForFundingSchema = z.object({
  proposal_id: z.coerce.number().min(1, "Proposal ID is required"),
  rnd_id: z.string().uuid("Invalid RND user ID"),
  decision: z.nativeEnum(EndorsementDecision),
  remarks: z.string().max(2000, "Remarks are too long").optional(),
});

export const submitRevisedProposalSchema = z.object({
  proposal_id: z.coerce.number().min(1, "Proposal ID is required"),
  proponent_id: z.string().uuid("Invalid proponent ID"),
  file_url: z.string().url("Invalid file URL"),
  // Optional metadata updates
  project_title: z.string().min(1).max(256, "project title is too long").optional(),
  revision_response: z.string().max(2000, "Response is too long").optional(),
  plan_start_date: z.string().date().optional(),
  plan_end_date: z.string().date().optional(),
  budget: z.preprocess(parseJsonIfString, budgetsSchema).optional(),
  // Optional Form 3 replacement. When present, overwrites proposals.work_plan_file_url
  // and stamps audit columns. Absent = keep existing Form 3 (or keep absent).
  work_plan_file_url: z.string().url("Invalid work plan file URL").optional(),
  // Optional classification / priority / discipline / sector updates for revision
  classification: z.string().max(100).optional(),
  classification_details: z.string().max(500).optional(),
  priority_areas: z.string().max(200).optional(),
  discipline: z.string().max(100).optional(),
  sector: z.string().max(100).optional(),
});

export const handleExtensionRequestSchema = z.object({
  proposal_id: z.number(),
  evaluator_id: z.string().uuid(),
  action: z.nativeEnum(ExtensionDecision),
  remarks: z.string().max(2000, "Remarks are too long").optional(),
});

export type HandleExtensionRequestInput = z.infer<typeof handleExtensionRequestSchema>;
export type ProposalInput = z.infer<typeof proposalSchema>;
export type ForwardToEvaluatorsInput = z.infer<typeof forwardToEvaluatorsSchema>;
export type ForwardToRndInput = z.infer<typeof forwardToRndSchema>;
export type ProposalVersionInput = z.infer<typeof proposalVersionSchema>;
export type revisionProposalToProponentInput = z.infer<typeof revisionProposalToProponentSchema>;
export type rejectProposalToProponentInput = z.infer<typeof rejectProposalToProponentSchema>;
export type decisionEvaluatorToProposalInput = z.infer<typeof decisionEvaluatorToProposalSchema>;
export type createEvaluationScoresToProposaltInput = z.infer<typeof createEvaluationScoresToProposaltSchema>;
export type EndorseForFundingInput = z.infer<typeof endorseForFundingSchema>;
export type SubmitRevisedProposalInput = z.infer<typeof submitRevisedProposalSchema>;

export enum FundingDecisionType {
  FUNDED = "funded",
  REVISION_FUNDING = "revision_funding",
  REJECTED_FUNDING = "rejected_funding",
}

export const fundingDecisionSchema = z.object({
  proposal_id: z.coerce.number().min(1),
  decision: z.nativeEnum(FundingDecisionType),
  file_url: z.string().url().optional(),
  remarks: z.string().max(2000).optional(),
}).refine(
  (data) => !(data.decision === FundingDecisionType.FUNDED && !data.file_url),
  { message: "Funding document URL is required when approving", path: ["file_url"] },
);

export type FundingDecisionInput = z.infer<typeof fundingDecisionSchema>;

export const removeEvaluatorSchema = z.object({
  proposal_id: z.number(),
  evaluator_id: z.string(),
});

export type RemoveEvaluatorInput = z.infer<typeof removeEvaluatorSchema>;

// --- Proponent Extension Request Schemas ---

export const requestProponentExtensionSchema = z.object({
  proposal_id: z.coerce.number().min(1, "Proposal ID is required"),
  reason: z.string().min(10, "Please provide a detailed reason (at least 10 characters)").max(2000, "Reason is too long"),
});

export const reviewProponentExtensionSchema = z.object({
  extension_request_id: z.coerce.number().min(1),
  proposal_id: z.coerce.number().min(1),
  action: z.enum(["approved", "rejected"]),
  review_note: z.string().max(2000, "Note is too long").optional(),
  new_deadline_days: z.coerce.number().int().positive().max(90, "Deadline cannot exceed 90 days").optional(),
}).refine(
  (data) => !(data.action === "approved" && !data.new_deadline_days),
  { message: "New deadline (days) is required when approving", path: ["new_deadline_days"] },
);

export type RequestProponentExtensionInput = z.infer<typeof requestProponentExtensionSchema>;
export type ReviewProponentExtensionInput = z.infer<typeof reviewProponentExtensionSchema>;

// --- RND Transfer Schemas ---

export const requestRndTransferSchema = z.object({
  proposal_id: z.coerce.number().min(1, "Proposal ID is required"),
  to_rnd_id: z.string().uuid("Invalid target RND user ID"),
  reason: z.string().min(1, "Reason is required").max(2000, "Reason is too long"),
});

export const respondRndTransferSchema = z.object({
  transfer_id: z.coerce.number().min(1, "Transfer ID is required"),
  status: z.enum(["accepted", "declined"]),
});

export const approveRndTransferSchema = z.object({
  transfer_id: z.coerce.number().min(1, "Transfer ID is required"),
  status: z.enum(["accepted", "declined"]),
  review_note: z.string().max(2000, "Note is too long").optional(),
});

export type RequestRndTransferInput = z.infer<typeof requestRndTransferSchema>;
export type RespondRndTransferInput = z.infer<typeof respondRndTransferSchema>;
export type ApproveRndTransferInput = z.infer<typeof approveRndTransferSchema>;
