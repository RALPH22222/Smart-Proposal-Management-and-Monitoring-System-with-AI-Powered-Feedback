import { z } from "zod";
import {
  EvaluatorStatus,
  ResearchClass,
  DevelopmentClass,
  ImplementationMode,
  PriorityArea,
  Status,
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

export const proposalSchema = z.object({
  // --- CHANGED: Matches Frontend camelCase ---
  proponent_id: z.string().uuid(),
  department: z.union([z.coerce.number(), z.string()]), // Optional if not always sent
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
  phone: z.coerce.number(),

  // --- CHANGED: Use nativeEnum for TS Enums ---
  // FIX: Added 'val: unknown' to fix the TS error
  research_class: z.preprocess(parseJsonIfString, z.nativeEnum(ResearchClass)),
  development_class: z.preprocess(parseJsonIfString, z.nativeEnum(DevelopmentClass)),
  implementation_mode: z.preprocess(parseJsonIfString, z.nativeEnum(ImplementationMode)),

  // --- CHANGED: Matches Frontend names ---
  plan_start_date: z.string().date(), // Changed from plan_start_date
  plan_end_date: z.string().date(), // Changed from plan_end_date
  duration: z.coerce.number(),

  // --- CHANGED: Priority Areas (JSON Parse) ---
  priority_areas: z.preprocess(parseJsonIfString, z.array(z.nativeEnum(PriorityArea))),

  // --- NEW: Implementation Site (Missing in your old schema) ---
  implementation_site: z.preprocess(
    parseJsonIfString,
    z.array(
      z.object({
        site_name: z.string(),
        city: z.string(),
      }),
    ),
  ),

  budget: z.preprocess(parseJsonIfString, budgetsSchema),

  // --- NEW: Cooperating Agencies (Missing in your old schema) ---
  cooperating_agencies: z.preprocess(parseJsonIfString, z.array(z.union([z.coerce.number(), z.string()]))),

  tags: z.preprocess(parseJsonIfString, z.array(z.coerce.number())),

  file_url: fileSchema,
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
  rnd_id: z.string().uuid(),
  objective_comment: z.string().max(2000, "Comments are too long").optional(),
  methodology_comment: z.string().max(2000, "Comments are too long").optional(),
  budget_comment: z.string().max(2000, "Comments are too long").optional(),
  timeline_comment: z.string().max(2000, "Comments are too long").optional(),
  overall_comment: z.string().max(2000, "Comments are too long").optional(),
  deadline: z.coerce.number(),
});

export const rejectProposalToProponentSchema = z.object({
  proposal_id: z.coerce.number(),
  rnd_id: z.string().uuid(),
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

export type ProposalInput = z.infer<typeof proposalSchema>;
export type ForwardToEvaluatorsInput = z.infer<typeof forwardToEvaluatorsSchema>;
export type ForwardToRndInput = z.infer<typeof forwardToRndSchema>;
export type ProposalVersionInput = z.infer<typeof proposalVersionSchema>;
export type revisionProposalToProponentInput = z.infer<typeof revisionProposalToProponentSchema>;
export type rejectProposalToProponentInput = z.infer<typeof rejectProposalToProponentSchema>;
