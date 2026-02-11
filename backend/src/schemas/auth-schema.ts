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

const MAX_PROFILE_PHOTO_BYTES = 2 * 1024 * 1024; // 2MB

const ALLOWED_PROFILE_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

const photoProfileSchema = z.object({
  filename: z.string().min(1, "Filename is required"),
  contentType: z
    .string()
    .refine(
      (t): t is (typeof ALLOWED_PROFILE_PHOTO_TYPES)[number] =>
        (ALLOWED_PROFILE_PHOTO_TYPES as readonly string[]).includes(t),
      { message: "Only JPEG, PNG, or WEBP images are allowed" },
    ),
  content: z
    .custom<Buffer>((val) => Buffer.isBuffer(val), {
      message: "Invalid file content (expected binary buffer)",
    })
    .refine((buf) => buf.byteLength <= MAX_PROFILE_PHOTO_BYTES, {
      message: "Profile photo must be 2MB or less",
    }),
});

export const RoleEnum = z.enum(["proponent", "rnd", "evaluator", "rdec", "admin", "lead_proponent"]);

export const signUpSchema = z.object({
  email: z.string().email("Email is not valid"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  first_name: z.string().min(1, "First name is required").max(64, "Response is too long"),
  last_name: z.string().min(1, "Last name is required").max(64, "Response is too long"),
  middle_ini: z.preprocess(
    (val) => (typeof val === "string" && val.trim() === "" ? undefined : val),
    z.string().max(1, "Middle initial must be 1 character").optional(),
  ),
  roles: z.array(RoleEnum).min(1, "At least one role is required"),
});

export const profileSetupSchema = z.object({
  birth_date: z.coerce.date(), // keep as-is if you already store string; otherwise switch to z.coerce.date()
  sex: z.preprocess(parseJsonIfString, z.nativeEnum(Sex)),
  department_id: z.string(),
  photo_profile_url: photoProfileSchema.optional(), // Photo is optional
});

export const signUpWithProfileSchema = z.object({
  // Account fields
  email: z.string().email("Email is not valid"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  first_name: z.string().min(1, "First name is required").max(64, "Response is too long"),
  last_name: z.string().min(1, "Last name is required").max(64, "Response is too long"),
  middle_ini: z.preprocess(
    (val) => (typeof val === "string" && val.trim() === "" ? undefined : val),
    z.string().max(1, "Middle initial must be 1 character").optional(),
  ),
  roles: z.preprocess(parseJsonIfString, z.array(RoleEnum).min(1, "At least one role is required")),
  // Profile fields
  birth_date: z.coerce.date(),
  sex: z.preprocess(parseJsonIfString, z.nativeEnum(Sex)),
  department_id: z.string().min(1, "Department is required"),
  photo_profile_url: photoProfileSchema.optional(),
});

export type Role = z.infer<typeof RoleEnum>;
export type SignUpInput = z.infer<typeof signUpSchema>;
export type ProfileSetup = z.infer<typeof profileSetupSchema>;
export type SignUpWithProfileInput = z.infer<typeof signUpWithProfileSchema>;
