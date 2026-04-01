import { z } from "zod";

export const HomeStatSchema = z.object({
  value: z.number(),
  suffix: z.string(),
  label: z.string(),
});

export const HomeGuidelineSchema = z.object({
  title: z.string(),
  description: z.string(),
});

export const HomeCriteriaSchema = z.object({
  title: z.string(),
  description: z.string(),
});

export const HomeProcessStepSchema = z.object({
  title: z.string(),
  description: z.string(),
});

export const HomeInfoSchema = z.object({
  hero: z.object({
    badge: z.string(),
    title_prefix: z.string(),
    title_highlight: z.string(),
    description: z.string(),
    images: z.array(z.string()).length(3),
  }),
  stats: z.array(HomeStatSchema),
  about: z.object({
    badge: z.string(),
    title: z.string(),
    description: z.string(),
    bullets: z.array(z.string()),
    image_url: z.string(),
  }),
  guidelines: z.object({
    badge: z.string(),
    title: z.string(),
    description: z.string(),
    pro_tip: z.string(),
    items: z.array(HomeGuidelineSchema),
  }),
  criteria: z.object({
    badge: z.string(),
    title: z.string(),
    description: z.string(),
    items: z.array(HomeCriteriaSchema),
  }),
  templates: z.object({
    research_url: z.string(),
    project_url: z.string(),
  }),
  process_steps: z.array(HomeProcessStepSchema),
});

export type HomeStat = z.infer<typeof HomeStatSchema>;
export type HomeGuideline = z.infer<typeof HomeGuidelineSchema>;
export type HomeCriteria = z.infer<typeof HomeCriteriaSchema>;
export type HomeProcessStep = z.infer<typeof HomeProcessStepSchema>;
export type HomeInfo = z.infer<typeof HomeInfoSchema>;

export const DEFAULT_HOME_INFO: HomeInfo = {
  hero: {
    badge: "Western Mindanao State University",
    title_prefix: "WMSU",
    title_highlight: "Project Proposal",
    description: "A streamlined admin and monitoring system for project proposals — fast, responsive, and intuitive. Experience seamless navigation and effortless proposal management with our user-centric design.",
    images: ["", "", ""]
  },
  stats: [
    { value: 200, suffix: "+", label: "Research Proposals" },
    { value: 84, suffix: "%", label: "Funding Success Rate" },
    { value: 300, suffix: "+", label: "Total Proponents" },
  ],
  about: {
    badge: "About Our Office",
    title: "Research Development & Evaluation Center",
    description: "The central hub RDEC for research excellence at Western Mindanao State University. We facilitate innovative research projects, provide administrative support, and ensure compliance with academic standards and funding requirements.",
    bullets: ["Proposal Guidance", "Funding Support", "Compliance Monitoring", "Research Ethics"],
    image_url: "",
  },
  guidelines: {
    badge: "Essentials",
    title: "Submission Guidelines & Requirements",
    description: "Your roadmap to a successful proposal submission. Follow these core requirements to ensure a smooth approval process.",
    pro_tip: "Gather your CVs, consent forms, and research instruments before you start to avoid timeouts or errors.",
    items: [
      { title: "Complete Documentation", description: "Incomplete attachments lead to automatic rejection. Ensure every required file is uploaded before you hit submit." },
      { title: "7-Day Revision Window", description: "Feedback received? You have exactly 7 working days to resubmit your revised proposal. Plan your timeline carefully." },
      { title: "Stay Updated", description: "We notify via portal & email. Check your spam folder regularly so you don't miss critical updates about your proposal." },
      { title: "Official Channels Only", description: "All communication happens inside the portal. Avoid direct emails for procedural steps. Keep it official and documented." },
    ],
  },
  criteria: {
    badge: "Our Standards",
    title: "Evaluation Criteria",
    description: "Learn how proposals are judged to ensure your project meets the highest standards for approval and funding.",
    items: [
      { title: "Relevance to Institutional Goals", description: "Proposals must align with WMSU's strategic objectives, addressing key priorities in education, research, and community development that support the university's mission and vision." },
      { title: "Originality and Innovation", description: "Projects should demonstrate creative thinking, novel approaches, and innovative solutions that contribute new knowledge or improve existing practices in their respective fields." },
      { title: "Methodological Soundness", description: "Research designs and implementation plans must be scientifically rigorous, appropriate for the objectives, and demonstrate clear, logical methodology for data collection and analysis." },
      { title: "Feasibility", description: "Projects must be realistically achievable within proposed timelines, budgets, and available resources, with clear implementation plans and capable project teams." },
      { title: "Ethical Compliance", description: "All research must adhere to WMSU's ethical standards, ensuring participant safety, data privacy, intellectual property rights, and responsible conduct of research." },
      { title: "Budget Justification", description: "Budget allocations must be reasonable, well-documented, and directly support project objectives, with clear justification for all expenses and cost-effective resource utilization." },
    ],
  },
  templates: {
    research_url: "",
    project_url: "",
  },
  process_steps: [
    { title: "Download & Submit Documentation", description: "Ensure you have your DOST project proposal template ready and all required fields are properly filled out. Proceed to the Submission page to submit your proposal. Double-check all information before submitting, as it cannot be edited unless the R&D requests a revision." },
    { title: "Admin Checking & Assignment", description: "The proposal you submit first goes to the Admin, where it will be checked for initial review. The Admin will then assign it to the appropriate R&D staff for evaluation, though the Admin also maintains the option to directly review and evaluate the proposal themselves." },
    { title: "R&D Technical Evaluation", description: "Once your proposal is forwarded by the Admin, the Research and Development (R&D) division will review your submitted information and attached documents. They will then evaluate your proposal and may request a revision, reject the submission, or pass it to the evaluators for further review." },
    { title: "Evaluators' Assessment Panel", description: "Once passed by the R&D division, the proposal is forwarded to the evaluators for assessment. Evaluators review the proposal and assign scores based on key aspects such as the title, timeline, and budget to determine feasibility." },
    { title: "Consolidated Review & Endorsement", description: "After receiving all evaluators' scores and feedback, the R&D division reviews and consolidates the results. Based on this evaluation, the R&D may request revisions, reject the submission, or endorse it for funding." },
    { title: "RDEC Funding Deliberation", description: "This step will be reviewed by the Research and Development (R&D) Committee. The committee will meet and discuss the proposal, and based on their evaluation, they will decide whether to approve the project for funding or not." },
    { title: "Implementation & Progress Monitoring", description: "After your project has been funded, you may request the budget for the start of the quarter and for the following quarters. You are required to report your progress percentage, submit reports, and provide the necessary documents until the project is successfully completed." },
  ],
};
