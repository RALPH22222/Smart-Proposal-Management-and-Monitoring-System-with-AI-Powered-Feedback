import { z } from "zod";

export const RoleEnum = z.enum(["lead_proponent", "co_lead_proponent", "rnd", "evaluator", "rdec", "admin"]);

export const signUpSchema = z.object({
  email: z.email("Email is not valid"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  first_name: z.string().min(1, "Name is required"),
  last_name: z.string().min(1, "Name is required"),
  roles: z.array(RoleEnum).min(1, "At least one role is required"), // user must have >= 1 role
});

export type Role = z.infer<typeof RoleEnum>;
export type SignUpInput = z.infer<typeof signUpSchema>;
