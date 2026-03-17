import { z } from "zod";

export const FaqItemSchema = z.object({
  id: z.string(),
  question: z.string(),
  answer: z.string(),
});

export const FaqCategorySchema = z.object({
  id: z.string(),
  name: z.string(),
  icon: z.enum(["general", "submission", "funding", "technical"]),
  items: z.array(FaqItemSchema),
});

export const FaqInfoSchema = z.object({
  hero: z.object({
    badge: z.string(),
    titlePrefix: z.string(),
    titleHighlight: z.string(),
    description: z.string(),
  }),
  categories: z.array(FaqCategorySchema),
  support: z.object({
    title: z.string(),
    description: z.string(),
    email: z.string(),
    phone: z.string(),
  })
});

export type FaqItem = z.infer<typeof FaqItemSchema>;
export type FaqCategory = z.infer<typeof FaqCategorySchema>;
export type FaqInfo = z.infer<typeof FaqInfoSchema>;

export const DEFAULT_FAQ_INFO: FaqInfo = {
  hero: {
    badge: "Support Center",
    titlePrefix: "Frequently Asked",
    titleHighlight: "Questions",
    description: "Find quick answers to questions about proposals, submission, funding, and technical help."
  },
  categories: [
    {
      id: "general",
      name: "General Questions",
      icon: "general",
      items: [
        {
          id: "q_gen_1",
          question: "What are the proposal submission deadlines?",
          answer: "Proposal deadlines vary by funding source. Regular internal reviews occur monthly on the last Friday of each month, while external funding opportunities have specific timelines announced on our portal."
        },
        {
          id: "q_gen_2",
          question: "How long does the proposal review process take?",
          answer: "Standard review takes 2-3 weeks. Complex proposals or those requiring ethics clearance may take 4-6 weeks."
        },
        {
          id: "q_gen_3",
          question: "Who can submit research proposals?",
          answer: "All WMSU faculty members, graduate students, and research staff are eligible to submit proposals."
        }
      ]
    },
    {
      id: "submission",
      name: "Submission Process",
      icon: "submission",
      items: [
        {
          id: "q_sub_1",
          question: "What documents are required for proposal submission?",
          answer: "Required documents include: completed DOST Form 1B, project timeline, budget breakdown, and endorsement from department head."
        },
        {
          id: "q_sub_2",
          question: "Can I submit proposals electronically?",
          answer: "Yes! All proposals must be submitted through our online portal. The system accepts PDF documents and provides confirmation."
        }
      ]
    },
    {
      id: "funding",
      name: "Funding & Budget",
      icon: "funding",
      items: [
        {
          id: "q_fund_1",
          question: "What funding sources are available through WMSU?",
          answer: "We support funding avenues including internal WMSU grants, DOST, CHED, and international collaborations."
        },
        {
          id: "q_fund_2",
          question: "Can I get help with budget preparation?",
          answer: "Yes! Our research support team provides budget consultation to align with funding requirements."
        }
      ]
    },
    {
      id: "technical",
      name: "Technical Support",
      icon: "technical",
      items: [
        {
          id: "q_tech_1",
          question: "What if I encounter technical issues with the portal?",
          answer: "For technical support, email research.support@wmsu.edu.ph or call +63 (62) 991-4569."
        }
      ]
    }
  ],
  support: {
    title: "Still have questions?",
    description: "Please reach out to our support team for further help.",
    email: "research@wmsu.edu.ph",
    phone: "+63629914569"
  }
};
