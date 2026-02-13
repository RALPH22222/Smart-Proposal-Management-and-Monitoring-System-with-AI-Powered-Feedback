import { z } from "zod";

export const createAccountSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  first_name: z.string().min(1, "First name is required").max(100),
  last_name: z.string().min(1, "Last name is required").max(100),
  middle_ini: z.string().max(50).optional(),
  roles: z.array(z.enum(["admin", "evaluator", "rnd", "proponent"])).min(1, "At least one role is required"),
});

export const updateAccountSchema = z.object({
  user_id: z.string().uuid("Invalid user ID"),
  first_name: z.string().min(1).max(100).optional(),
  last_name: z.string().min(1).max(100).optional(),
  middle_ini: z.string().max(50).optional(),
  roles: z.array(z.enum(["admin", "evaluator", "rnd", "proponent"])).min(1).optional(),
});

export const toggleAccountStatusSchema = z.object({
  user_id: z.string().uuid("Invalid user ID"),
  is_disabled: z.boolean(),
});

export const inviteUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  roles: z
    .array(z.enum(["rnd", "evaluator"]))
    .min(1, "At least one role is required")
    .max(2, "Maximum two roles allowed"),
});

export const completeInviteSchema = z.object({
  first_name: z.string().min(1, "First name is required").max(100),
  last_name: z.string().min(1, "Last name is required").max(100),
  middle_ini: z.string().max(50).optional(),
});

export type CreateAccountInput = z.infer<typeof createAccountSchema>;
export type UpdateAccountInput = z.infer<typeof updateAccountSchema>;
export type ToggleAccountStatusInput = z.infer<typeof toggleAccountStatusSchema>;
export type InviteUserInput = z.infer<typeof inviteUserSchema>;
export type CompleteInviteInput = z.infer<typeof completeInviteSchema>;
