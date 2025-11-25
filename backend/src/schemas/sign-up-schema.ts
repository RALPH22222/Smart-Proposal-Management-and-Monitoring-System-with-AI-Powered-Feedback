import { z } from "zod";

export const signUpSchema = z.object({
  email: z.email("Email is not valid"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters"),
  name: z
    .string()
    .min(1, "Name is required"),
  role: z.enum(["proponent", "rnd", "evaluator", "rdec", "admin"]),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
