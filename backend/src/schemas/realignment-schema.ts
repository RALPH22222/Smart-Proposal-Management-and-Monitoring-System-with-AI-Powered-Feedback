// Phase 3 of LIB feature: Zod schemas for budget realignment.
//
// Identity (requested_by / reviewed_by) is injected from the JWT — never trusted from the body.
// All amounts are validated server-side; the UI's "live total" is convenience, not security.

import { z } from "zod";

// Same line-item shape as proposal-schema.ts but redeclared here to keep the realignment
// flow decoupled (different validation rules, different error paths). Categories use the
// budget_category enum string values.
const realignmentLineSchema = z
  .object({
    subcategoryId: z.coerce.number().int().positive().nullable().optional(),
    customSubcategoryLabel: z.string().max(120, "Subcategory label is too long").nullable().optional(),
    source: z.string().min(1, "Source is required").max(100, "Source is too long"),
    category: z.enum(["ps", "mooe", "co"]),
    itemName: z.string().min(1, "Item name is required").max(200, "Item name is too long"),
    spec: z.string().max(200, "Spec is too long").nullable().optional(),
    quantity: z.coerce.number().positive("Quantity must be greater than 0"),
    unit: z.string().max(40, "Unit is too long").nullable().optional(),
    unitPrice: z.coerce.number().nonnegative("Unit price cannot be negative"),
    totalAmount: z.coerce.number().nonnegative(),
    displayOrder: z.coerce.number().int().nonnegative().optional(),
    notes: z.string().max(500).nullable().optional(),
  })
  .superRefine((data, ctx) => {
    const computed = Math.round(data.quantity * data.unitPrice * 100) / 100;
    const provided = Math.round(data.totalAmount * 100) / 100;
    if (Math.abs(computed - provided) > 0.01) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Total (${provided}) must equal quantity × unit price (${computed})`,
        path: ["totalAmount"],
      });
    }
  });

export const requestRealignmentSchema = z.object({
  funded_project_id: z.coerce.number().int().positive(),
  reason: z
    .string()
    .min(10, "Please describe why the realignment is needed (at least 10 characters)")
    .max(2000, "Reason is too long"),
  // Required: R&D and higher-ups need the supporting document to verify the proposed
  // changes against the revised LIB. In revise-mode resubmissions the frontend passes
  // the previously-uploaded file_url through (so the proponent isn't forced to re-upload
  // an unchanged file).
  file_url: z.string().url("A revised LIB document is required"),
  items: z
    .array(realignmentLineSchema)
    .min(1, "At least one budget line item is required")
    .max(500, "Too many line items"),
});

export const reviewRealignmentSchema = z
  .object({
    realignment_id: z.coerce.number().int().positive(),
    action: z.enum(["approve", "reject", "request_revision"]),
    review_note: z.string().max(2000, "Review note is too long").nullable().optional(),
  })
  .refine((data) => data.action !== "request_revision" || !!data.review_note?.trim(), {
    message: "A review note is required when requesting revision",
    path: ["review_note"],
  })
  .refine((data) => data.action !== "reject" || !!data.review_note?.trim(), {
    message: "A review note is required when rejecting",
    path: ["review_note"],
  });

export type RequestRealignmentInput = z.infer<typeof requestRealignmentSchema>;
export type ReviewRealignmentInput = z.infer<typeof reviewRealignmentSchema>;
export type RealignmentLineInput = z.infer<typeof realignmentLineSchema>;
