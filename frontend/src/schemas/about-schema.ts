import { z } from "zod";

export const HeroSectionSchema = z.object({
  badge: z.string().min(1, "Badge text is required"),
  title_prefix: z.string().min(1, "Title prefix is required"),
  title_highlight: z.string().min(1, "Title highlight is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
});

export const StorySectionSchema = z.object({
  badge: z.string().min(1, "Badge text is required"),
  title: z.string().min(1, "Title is required"),
  paragraphs: z.array(z.string()).min(1, "At least one paragraph is required"),
  image_url: z.string().url("Must be a valid URL").optional(),
});

export const MissionVisionSchema = z.object({
  mission: z.string().min(10, "Mission statement is required"),
  vision: z.string().min(10, "Vision statement is required"),
});

export const StatsSectionSchema = z.object({
  badge: z.string().min(1, "Badge text is required"),
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  approval_rate: z.number().min(0).max(100),
  projects_funded: z.number().min(0),
  funding_secured_text: z.string().min(1, "Funding text is required"),
  client_satisfaction: z.number().min(0).max(100),
});

export const ProcessStepSchema = z.object({
  title: z.string().min(1, "Step title is required"),
  description: z.string().min(1, "Step description is required"),
});

export const ProcessSectionSchema = z.object({
  title: z.string().min(1, "Process section title is required"),
  steps: z.array(ProcessStepSchema).min(1, "At least one process step is required"),
});

export const ValuePropositionSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  button_text: z.string().min(1, "Button text is required"),
});

export const ValuePropsSectionSchema = z.object({
  proposition_1: ValuePropositionSchema,
  proposition_2: ValuePropositionSchema,
});

export const AboutInfoSchema = z.object({
  hero: HeroSectionSchema,
  story: StorySectionSchema,
  mission_vision: MissionVisionSchema,
  stats: StatsSectionSchema,
  process: ProcessSectionSchema,
  value_props: ValuePropsSectionSchema,
});

export type HeroSection = z.infer<typeof HeroSectionSchema>;
export type StorySection = z.infer<typeof StorySectionSchema>;
export type MissionVision = z.infer<typeof MissionVisionSchema>;
export type StatsSection = z.infer<typeof StatsSectionSchema>;
export type ProcessStep = z.infer<typeof ProcessStepSchema>;
export type ProcessSection = z.infer<typeof ProcessSectionSchema>;
export type ValueProposition = z.infer<typeof ValuePropositionSchema>;
export type ValuePropsSection = z.infer<typeof ValuePropsSectionSchema>;
export type AboutInfo = z.infer<typeof AboutInfoSchema>;

export const DEFAULT_ABOUT_INFO: AboutInfo = {
  hero: {
    badge: "About Our Service",
    title_prefix: "About",
    title_highlight: "Smart Project Proposal",
    description: "Empowering students and faculty with professionally crafted project proposals that secure funding and drive innovation at Western Mindanao State University."
  },
  story: {
    badge: "Our Story",
    title: "Transforming Ideas into Funded Projects",
    paragraphs: [
      "Founded by dedicated professionals with extensive experience in academic research and project development, Smart Project Proposal was born from a simple observation: many brilliant ideas at our university never see the light of day due to inadequate proposal writing.",
      "We recognized the gap between innovative concepts and successful funding approvals. Our mission became clear: to bridge this gap by providing expert proposal writing services tailored specifically for WMSU's unique academic environment.",
      "Today, we're proud to have helped numerous students and faculty members transform their visions into funded, impactful projects that contribute to WMSU's legacy of excellence."
    ],
    image_url: "https://upload.wikimedia.org/wikipedia/en/c/c8/Western_Mindanao_State_University_Gym_%28RT_Lim_Boulevard%2C_Zamboanga_City%3B_10-06-2023%29.jpg"
  },
  mission_vision: {
    mission: "To empower WMSU students and faculty with professionally crafted project proposals that secure funding, drive innovation, and contribute to the university's academic excellence and community impact.",
    vision: "To become the leading project proposal consultancy at Western Mindanao State University, recognized for transforming innovative ideas into funded projects that create lasting positive change in academia and society."
  },
  stats: {
    badge: "Our Distinct Approach",
    title: "The WMSU Lead",
    description: "Experience a partnership built on academic excellence, tailored specifically for the Western Mindanao State University community.",
    approval_rate: 89,
    projects_funded: 50,
    funding_secured_text: "₱2.3M+",
    client_satisfaction: 100
  },
  process: {
    title: "Our Streamlined Process",
    steps: [
      { title: "Team Formation & Proposal Preparation", description: "Assemble your research team and develop your initial proposal concept with our guidance" },
      { title: "Proposal Submission", description: "Submit your completed proposal through our streamlined online portal for initial review" },
      { title: "R&D Staff & Evaluator Review", description: "Our research and development team and expert evaluators conduct comprehensive assessment" },
      { title: "RDEC Endorsement", description: "Successful proposals receive official endorsement from the Research and Development Ethics Committee" },
      { title: "Funding Approval & Implementation", description: "Your proposal is declared fundable and ready for project implementation and execution" }
    ]
  },
  value_props: {
    proposition_1: {
      title: "Response Guarantee",
      description: "Get feedback within 48 hours and complete proposals in as little as 2 weeks, ensuring you never miss important deadlines.",
      button_text: "Get Feedback"
    },
    proposition_2: {
      title: "Budget-Conscious Solutions",
      description: "Special student and faculty rates with flexible payment options, because great research shouldn't be limited by budget constraints.",
      button_text: "Affordable Excellence"
    }
  }
};
