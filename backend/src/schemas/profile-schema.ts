import { z } from "zod";
import { Sex } from "../types/auth";

const parseJsonIfString = (val: unknown) => {
  if (typeof val === "string") {
    try {
      return JSON.parse(val);
    } catch {
      return val;
    }
  }
  return val;
};

export const updateProfileSchema = z.object({
  first_name: z.string().min(1, "First name is required").max(64, "First name is too long"),
  last_name: z.string().min(1, "Last name is required").max(64, "Last name is too long"),
  middle_ini: z.preprocess(
    (val) => (typeof val === "string" && val.trim() === "" ? undefined : val),
    z.string().max(1, "Middle initial must be 1 character").optional(),
  ),
  birth_date: z.coerce.date().optional(),
  sex: z.preprocess(parseJsonIfString, z.nativeEnum(Sex).optional()),
  department_id: z.string().optional(), // In case they select a department
});

export const changeEmailSchema = z.object({
  email: z.string().email("Invalid email format"),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangeEmailInput = z.infer<typeof changeEmailSchema>;
