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
  first_name: z.string().min(1, "Name is required"),
  last_name: z.string().min(1, "Name is required"),
  roles: z.array(RoleEnum).min(1, "At least one role is required"),
});

export const profileSetupSchema = z.object({
  birth_date: z.coerce.date(), // keep as-is if you already store string; otherwise switch to z.coerce.date()
  sex: z.preprocess(parseJsonIfString, z.nativeEnum(Sex)),
  department_id: z.string(),
  photo_profile_url: photoProfileSchema,
});

export type Role = z.infer<typeof RoleEnum>;
export type SignUpInput = z.infer<typeof signUpSchema>;
export type ProfileSetup = z.infer<typeof profileSetupSchema>;
