import { z } from "zod";

export const ContactInfoSchema = z.object({
  hero: z.object({
    badge: z.string().min(1, "Badge text is required"),
    title: z.string().min(1, "Page title is required"),
    description: z.string().min(1, "Description is required"),
  }),
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

export const DEFAULT_CONTACT_INFO: ContactInfo = {
  hero: {
    badge: "Connect With Us",
    title: "Research Support Center",
    description: "Direct access to our research committee and support staff. Get comprehensive assistance for your project proposals and research initiatives at Western Mindanao State University.",
  },
  location: {
    officeName: "Research & Development Center",
    university: "Western Mindanao State University",
    address: "Normal Road, Baliwasan, Zamboanga City",
    details: "2nd Floor, Admin Building",
  },
  phones: {
    main: "+63 (62) 991-4567",
    researchDesk: "+63 (62) 991-4568",
    proposalHotline: "+63 (62) 991-4569",
  },
  emails: {
    research: "research@wmsu.edu.ph",
    proposals: "proposals@wmsu.edu.ph",
    support: "research.support@wmsu.edu.ph",
  },
  officeHours: {
    weekdays: "8:00 AM - 5:00 PM",
    saturday: "9:00 AM - 12:00 PM",
    sunday: "Closed",
  },
  emergency: {
    line: "+63 (62) 991-4570",
    availability: "Available 24/7 for urgent matters",
  },
};
