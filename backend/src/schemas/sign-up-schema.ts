import { z } from "zod";

export const RoleEnum = z.enum(["proponent", "rnd", "evaluator", "rdec", "admin", "lead_proponent"]);

export const signUpSchema = z.object({
  email: z.string().email("Email is not valid"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  first_name: z.string().min(1, "Name is required"),
  last_name: z.string().min(1, "Name is required"),
  middle_ini: z.string().min(1, "Middle initial is required").max(1, "Middle initial must be at 1 max character"),
  roles: z.array(RoleEnum).min(1, "At least one role is required"), // user must have >= 1 role
});

export type Role = z.infer<typeof RoleEnum>;
export type SignUpInput = z.infer<typeof signUpSchema>;
