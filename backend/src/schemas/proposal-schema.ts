import { z } from "zod";
import {
  ResearchClass,
  DevelopmentClass,
  ImplementationMode,
  PriorityArea,
  Status,
} from "../types/proposal";

export const proposalSchema = z.object({
  proponent_id: z.number(),
  department_id: z.number(),
  sector_id: z.number(),
  discipline_id: z.number(),
  agency_id: z.number(),
  program_title: z.string(),
  project_title: z.string(),
  email: z.string().optional(),
  phone: z.string().optional(),
  research_class: z.enum(ResearchClass),
  development_class: z.enum(DevelopmentClass),
  implementation_mode: z.enum(ImplementationMode),
  priority_areas: z.array(z.enum(PriorityArea)),
  plan_start_date: z.coerce.date(),
  plan_end_date: z.coerce.date(),
  budget: z
    .array(
      z.object({
        source: z.string(),
        ps: z.float64(),
        mooe: z.float64(),
        co: z.float64(),
      }),
    )
    .min(1),
});

export const proposalStatusSchema = z.enum(Status);

export type ProposalInput = z.infer<typeof proposalSchema>;
