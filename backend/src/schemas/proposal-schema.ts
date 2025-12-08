import { z } from "zod";
import {
  EvaluatorStatus,
  ResearchClass,
  DevelopmentClass,
  ImplementationMode,
  PriorityArea,
  Status,
} from "../types/proposal";

const fileSchema = z.object({
  fieldname: z.string(),
  contentType: z.enum([
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ]),
  filename: z.string(),
});

export const proposalSchema = z.object({
  proponent_id: z.string(),
  department_id: z.coerce.number(),
  sector_id: z.coerce.number(),
  discipline_id: z.coerce.number(),
  agency_id: z.coerce.number(),
  program_title: z.string(),
  project_title: z.string(),
  email: z.string().optional(),
  phone: z.string().optional(),
  research_class: z.enum(ResearchClass),
  development_class: z.enum(DevelopmentClass),
  implementation_mode: z.enum(ImplementationMode),
  priority_areas: z.preprocess(
    (val) => {
      if (typeof val === "string") {
        try {
          return JSON.parse(val); // becomes real array
        } catch {
          return val;
        }
      }
      return val;
    },
    z.array(z.enum(PriorityArea)),
  ),
  plan_start_date: z.coerce.date(),
  plan_end_date: z.coerce.date(),
  proposal_file: fileSchema,
  budget: z.preprocess(
    (val) => {
      if (typeof val === "string") {
        try {
          return JSON.parse(val); // becomes real array
        } catch {
          return val;
        }
      }
      return val;
    },
    z
      .array(
        z.object({
          source: z.string(),
          ps: z.float64(),
          mooe: z.float64(),
          co: z.float64(),
        }),
      )
      .min(1),
  ),
});

export const forwardToEvaluatorsSchema = z.object({
  proposal_id: z.number().min(1, "Proposal ID is required"),
  evaluator_id: z.array(z.string().min(1)).nonempty("At least one evaluator is required"),
  deadline_at: z.number().int().positive().max(90, "Deadline cannot be more than 90 days"),
  commentsForEvaluators: z.string().max(2000, "Comments are too long").optional(),
});

export const proposalVersionSchema = z.object({
  proposal_id: z.number().min(1),
  file_url: z.string().url(),
});

export const proposalStatusSchema = z.enum(Status);
export const proposalEvaluatorStatusSchema = z.enum(EvaluatorStatus);

export type ProposalInput = z.infer<typeof proposalSchema>;
export type ForwardToEvaluatorsInput = z.infer<typeof forwardToEvaluatorsSchema>;
export type ProposalVersionInput = z.infer<typeof proposalVersionSchema>;
