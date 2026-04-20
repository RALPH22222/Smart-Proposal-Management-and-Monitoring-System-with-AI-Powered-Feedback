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

export const RubricCriterionSchema = z.object({
  score: z.number(),
  description: z.string(),
});

export const RubricCategorySchema = z.object({
  category: z.string(),
  description: z.string(),
  criteria: z.array(RubricCriterionSchema),
  evaluatorGuide: z.array(z.string()),
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
    lib_template_url: z.string().default(""),
    lib_sample_url: z.string().default(""),
  }),
  resources: z.object({
    guidelines_url: z.string(),
    handbook_url: z.string(),
  }),
  app_config: z.object({
    apk_url: z.string(),
    phone_image_url: z.string().optional(),
  }),
  process_steps: z.array(HomeProcessStepSchema),
  evaluator_rubrics: z.array(RubricCategorySchema).optional(),
});

export type HomeStat = z.infer<typeof HomeStatSchema>;
export type HomeGuideline = z.infer<typeof HomeGuidelineSchema>;
export type HomeCriteria = z.infer<typeof HomeCriteriaSchema>;
export type HomeProcessStep = z.infer<typeof HomeProcessStepSchema>;
export type RubricCriterion = z.infer<typeof RubricCriterionSchema>;
export type RubricCategory = z.infer<typeof RubricCategorySchema>;
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
    lib_template_url: "",
    lib_sample_url: "",
  },
  resources: {
    guidelines_url: "",
    handbook_url: "",
  },
  app_config: {
    apk_url: "",
    phone_image_url: "",
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
  evaluator_rubrics: [
    {
      category: "Title Assessment",
      description: "Evaluate the clarity, relevance, and appropriateness of the project title",
      criteria: [
        { score: 5, description: "Title is concise, highly descriptive, accurately reflects the scope of the project, and is aligned with the research objectives" },
        { score: 4, description: "Title is clear, relevant, and provides a good indication of the project's focus and goals" },
        { score: 3, description: "Title is acceptable but could be more specific or better aligned with the project scope" },
        { score: 2, description: "Title is vague, overly broad, or does not clearly convey the project's purpose" },
        { score: 1, description: "Title is unclear, misleading, or irrelevant to the proposed research" },
      ],
      evaluatorGuide: [
        "Does the title clearly convey the main topic or focus of the research?",
        "Is the title concise yet descriptive enough?",
        "Does the title accurately reflect the scope and objectives of the proposal?",
        "Is the title appropriate for the target audience and research field?",
        "Does the title avoid unnecessary jargon or ambiguity?",
      ],
    },
    {
      category: "Budget Assessment",
      description: "Evaluate the appropriateness, justification, and realistic allocation of budget",
      criteria: [
        { score: 5, description: "Budget is well-justified, realistic, efficiently allocated, with clear cost breakdown and sound financial management plan" },
        { score: 4, description: "Budget is appropriate with minor justification gaps or minor allocation concerns" },
        { score: 3, description: "Budget is acceptable but lacks detailed justification for some line items" },
        { score: 2, description: "Budget appears inflated or inadequately justified with unclear allocation logic" },
        { score: 1, description: "Budget is unrealistic, poorly justified, or raises concerns about cost efficiency" },
      ],
      evaluatorGuide: [
        "Are all line items necessary and directly related to project objectives?",
        "Is the unit cost reasonable and comparable to market rates?",
        "Are personnel costs justified based on roles and time allocation?",
        "Is there clear justification for equipment purchases vs. rentals?",
        "Does the budget reflect efficient use of resources?",
      ],
    },
    {
      category: "Timeline Assessment",
      description: "Evaluate the feasibility and realism of the project schedule",
      criteria: [
        { score: 5, description: "Timeline is realistic, well-structured with clear milestones, deliverables, and contingency buffers" },
        { score: 4, description: "Timeline is reasonable with appropriate milestones and reasonable contingency planning" },
        { score: 3, description: "Timeline is acceptable but somewhat ambitious or lacks detailed milestone descriptions" },
        { score: 2, description: "Timeline appears unrealistic, poorly structured, or lacks clear milestones" },
        { score: 1, description: "Timeline is not feasible, unclear, or unrealistic given the project scope" },
      ],
      evaluatorGuide: [
        "Are the project phases clearly defined with specific durations?",
        "Are key milestones achievable within the stated timeframe?",
        "Has sufficient time been allocated for critical activities?",
        "Are there clear deliverables for each phase?",
        "Is there buffer time for unexpected delays or issues?",
      ],
    },
  ],
};
