import { z } from "zod";
import {
  EvaluatorFinalDecision,
  EvaluatorStatus,
  ResearchClass,
  DevelopmentClass,
  ImplementationMode,
  PriorityArea,
  Status,
  AssignmentTracker,
  EndorsementDecision,
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

const budgetLineSchema = z.object({
  item: z.string().min(1),
  value: z.coerce.number().min(0),
});

const budgetCategorySchema = z.object({
  ps: z.array(budgetLineSchema).default([]),
  mooe: z.array(budgetLineSchema).default([]),
  co: z.array(budgetLineSchema).default([]),
});

const budgetsSchema = z
  .array(
    z.object({
      source: z.string().min(1),
      budget: budgetCategorySchema,
    }),
  )
  .min(1, "At least one budget source is required");

// Helper to convert camelCase priority keys to snake_case enum values
const normalizePriorityAreas = (val: unknown): string[] => {
  const parsed = parseJsonIfString(val);
  if (!Array.isArray(parsed)) return [];

  const keyMap: Record<string, string> = {
    stand: "stand",
    coconutIndustry: "coconut_industry",
    coconut_industry: "coconut_industry",
    exportWinners: "export_winners",
    export_winners: "export_winners",
    supportIndustries: "support_industries",
    support_industries: "support_industries",
    otherPriorityAreas: "other_priority_areas",
    other_priority_areas: "other_priority_areas",
  };

  return parsed.map((k: string) => keyMap[k] || k);
};

// Helper to normalize development_class (camelCase to snake_case)
const normalizeDevelopmentClass = (val: unknown): string | undefined => {
  const parsed = parseJsonIfString(val);
  if (!parsed || parsed === "") return undefined;

  const keyMap: Record<string, string> = {
    pilotTesting: "pilot_testing",
    pilot_testing: "pilot_testing",
    techPromotion: "tech_promotion",
    tech_promotion: "tech_promotion",
  };

  return keyMap[String(parsed)] || String(parsed);
};

// Helper to normalize implementation_site (site -> site_name)
const normalizeImplementationSite = (val: unknown) => {
  const parsed = parseJsonIfString(val);
  if (!Array.isArray(parsed)) return [];

  return parsed.map((item: any) => ({
    site_name: item.site_name || item.site || "",
    city: item.city || "",
  }));
};

// Helper to extract IDs from cooperating agencies (handles {id, name} objects)
const normalizeCooperatingAgencies = (val: unknown) => {
  const parsed = parseJsonIfString(val);
  if (!Array.isArray(parsed)) return [];

  return parsed.map((item: any) => {
    if (typeof item === "object" && item !== null && "id" in item) {
      return item.id;
    }
    return item;
  });
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
      street: z.string().min(1, "Street is required"),
      barangay: z.string().min(1, "Barangay is required"),
      city: z.string().min(1, "City is required"),
    }),
  ),
  school_year: z.string(),
  program_title: z.string(), // Changed from program_title
  project_title: z.string().min(1, "Project title is required"), // Changed from project_title

  email: z.string().or(z.literal("")),
  phone: z.coerce.number().optional().default(0), // Made optional with default for empty string

  // --- CHANGED: Use nativeEnum for TS Enums ---
  // research_class and development_class are mutually exclusive - only one is sent
  research_class: z.preprocess(parseJsonIfString, z.nativeEnum(ResearchClass).optional().nullable()),
  development_class: z.preprocess(normalizeDevelopmentClass, z.nativeEnum(DevelopmentClass).optional().nullable()),
  implementation_mode: z.preprocess(parseJsonIfString, z.nativeEnum(ImplementationMode)),

  // --- CHANGED: Matches Frontend names ---
  plan_start_date: z.string().date(), // Changed from plan_start_date
  plan_end_date: z.string().date(), // Changed from plan_end_date
  duration: z.coerce.number(),

  // --- CHANGED: Priority Areas with camelCase to snake_case conversion ---
  priority_areas: z.preprocess(normalizePriorityAreas, z.array(z.nativeEnum(PriorityArea))),

  // --- NEW: Implementation Site with flexible field names (site or site_name) ---
  implementation_site: z.preprocess(
    normalizeImplementationSite,
    z.array(
      z.object({
        site_name: z.string(),
        city: z.string(),
      }),
    ),
  ),

  budget: z.preprocess(parseJsonIfString, budgetsSchema),

  // --- NEW: Cooperating Agencies - handles both {id, name} objects and primitives ---
  cooperating_agencies: z.preprocess(normalizeCooperatingAgencies, z.array(z.union([z.coerce.number(), z.string()]))),

  tags: z.preprocess(parseJsonIfString, z.array(z.coerce.number())),

  file_url: fileSchema,
});

export const decisionEvaluatorToProposalSchema = z.object({
  proposal_id: z.number(),
  status: z.preprocess(parseJsonIfString, z.nativeEnum(AssignmentTracker)),
  remarks: z.string().optional(),
  deadline_at: z.string().date(),
});

// --- Keep the rest the same ---
export const forwardToEvaluatorsSchema = z.object({
  proposal_id: z.number().min(1, "Proposal ID is required"),
  evaluator_id: z.array(z.string().uuid()),
  deadline_at: z.number().int().positive().max(90, "Deadline cannot be more than 90 days"),
  commentsForEvaluators: z.string().max(2000, "Comments are too long").optional(),
});

export const revisionProposalToProponentSchema = z.object({
  proposal_id: z.coerce.number(),
  objective_comment: z.string().max(2000, "Comments are too long").optional(),
  methodology_comment: z.string().max(2000, "Comments are too long").optional(),
  budget_comment: z.string().max(2000, "Comments are too long").optional(),
  timeline_comment: z.string().max(2000, "Comments are too long").optional(),
  overall_comment: z.string().max(2000, "Comments are too long").optional(),
  deadline: z.coerce.number(),
});

export const rejectProposalToProponentSchema = z.object({
  proposal_id: z.coerce.number(),
  comment: z.string().max(2000, "Comments are too long").optional(),
});

export const createEvaluationScoresToProposaltSchema = z.object({
  proposal_id: z.number(),
  status: z.preprocess(parseJsonIfString, z.nativeEnum(EvaluatorFinalDecision)),
  objective: z.number(),
  methodology: z.number(),
  budget: z.number(),
  timeline: z.number(),
  comment: z.string().optional(),
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
  file_url: fileSchema,
  // Optional metadata updates
  project_title: z.string().min(1).optional(),
  revision_response: z.string().max(2000, "Response is too long").optional(),
});

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
