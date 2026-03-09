import { z } from "zod";

export const ContactInfoSchema = z.object({
  location: z.object({
    officeName: z.string().min(1, "Office name is required"),
    university: z.string().min(1, "University name is required"),
    address: z.string().min(1, "Address is required"),
    details: z.string().min(1, "Additional details (e.g. Floor) are required"),
  }),
  phones: z.object({
    main: z.string().min(1, "Main phone is required"),
    researchDesk: z.string().min(1, "Research desk phone is required"),
    proposalHotline: z.string().min(1, "Proposal hotline is required"),
  }),
  emails: z.object({
    research: z.string().email("Invalid email for Research"),
    proposals: z.string().email("Invalid email for Proposals"),
    support: z.string().email("Invalid email for Support"),
  }),
  officeHours: z.object({
    weekdays: z.string().min(1, "Weekday hours are required"),
    saturday: z.string().min(1, "Saturday hours are required"),
    sunday: z.string().min(1, "Sunday hours are required"),
  }),
  emergency: z.object({
    line: z.string().min(1, "Emergency line is required"),
    availability: z.string().min(1, "Emergency availability text is required"),
  }),
});

export type ContactInfo = z.infer<typeof ContactInfoSchema>;
