import { z } from "zod";
import {
  EvaluatorStatus,
  ResearchClass,
  DevelopmentClass,
  ImplementationMode,
  PriorityArea,
  Status,
} from "../types/proposal";

// Relaxed file schema to avoid browser mimetype issues
const fileSchema = z.object({
  fieldname: z.string().optional(),
  contentType: z.string().optional(),
  filename: z.string(),
  content: z.any().optional(),
});

export const proposalSchema = z.object({
  // --- CHANGED: Matches Frontend camelCase ---
  proponentId: z.string().uuid().optional(), 
  department_id: z.coerce.number().optional(), // Optional if not always sent
  sector_id: z.coerce.number().optional(),
  discipline_id: z.coerce.number().optional(),
  agency_id: z.coerce.number().optional(),
  
  programTitle: z.string().optional(), // Changed from program_title
  projectTitle: z.string().min(1, "Project title is required"), // Changed from project_title
  
  email: z.string().optional().or(z.literal('')),
  telephone: z.string().optional(),

  // --- CHANGED: Use nativeEnum for TS Enums ---
  // FIX: Added 'val: unknown' to fix the TS error
  researchType: z.preprocess(
    (val: unknown) => (val === 'null' ? null : val), 
    z.nativeEnum(ResearchClass).optional()
  ),
  developmentType: z.preprocess(
    (val: unknown) => (val === 'null' ? null : val), 
    z.nativeEnum(DevelopmentClass).optional()
  ),
  implementationMode: z.preprocess(
    (val: unknown) => (val === 'null' ? null : val), 
    z.nativeEnum(ImplementationMode).optional()
  ),

  // --- CHANGED: Matches Frontend names ---
  plannedStartDate: z.string().optional(), // Changed from plan_start_date
  plannedEndDate: z.string().optional(),   // Changed from plan_end_date

  // --- CHANGED: Priority Areas (JSON Parse) ---
  priorityAreas: z.preprocess(
    (val: unknown) => {
      if (typeof val === "string") {
        try { return JSON.parse(val); } catch { return val; }
      }
      return val;
    },
    z.array(z.nativeEnum(PriorityArea))
  ),

  // --- NEW: Implementation Site (Missing in your old schema) ---
  implementationSite: z.preprocess(
    (val: unknown) => {
      if (typeof val === "string") {
        try { return JSON.parse(val); } catch { return val; }
      }
      return val;
    },
    z.array(z.object({
      site: z.string(),
      province: z.string().optional()
    })).optional()
  ),

  // --- CHANGED: Renamed 'budget' to 'budgetItems' ---
  budgetItems: z.preprocess(
    (val: unknown) => {
      if (typeof val === "string") {
        try { return JSON.parse(val); } catch { return val; }
      }
      return val;
    },
    z.array(
      z.object({
        source: z.string(),
        ps: z.coerce.number(),
        mooe: z.coerce.number(),
        co: z.coerce.number(),
      })
    ).min(1, "At least one budget item is required")
  ),

  // --- NEW: Cooperating Agencies (Missing in your old schema) ---
  cooperatingAgencies: z.preprocess(
    (val: unknown) => {
      if (typeof val === "string") {
        try { return JSON.parse(val); } catch { return val; }
      }
      return val;
    },
    z.array(z.coerce.number()).optional()
  ),

  proposal_file: fileSchema,
});

// --- Keep the rest the same ---
export const forwardToEvaluatorsSchema = z.object({
  proposal_id: z.number().min(1, "Proposal ID is required"),
  evaluator_id: z.array(z.string().min(1)).nonempty("At least one evaluator is required"),
  deadline_at: z.number().int().positive().max(90, "Deadline cannot be more than 90 days"),
  commentsForEvaluators: z.string().max(2000, "Comments are too long").optional(),
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