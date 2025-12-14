export enum Status {
  REVIEW_RND = "review_rnd",
  REVISION_RND = "revision_rnd",
  REJECTED_RND = "rejected_rnd",
  UNDER_EVALUATION = "under_evaluation",
  ENDORSED_FOR_FUNDING = "endorsed_for_funding",
  FUNDED = "funded",
}

export enum ResearchClass {
  BASIC = "basic",
  APPLIED = "applied",
}

export enum DevelopmentClass {
  PILOT_TESTING = "pilot_testing",
  TECH_PROMOTION = "tech_promotion",
}

export enum ImplementationMode {
  SINGLE_AGENCY = "single_agency",
  MULTI_AGENCY = "multi_agency",
}

export enum PriorityArea {
  STAND = "stand",
  EXPORT_WINNERS = "export_winners",
  SUPPORT_INDUSTRIES = "support_industries",
  COCONUT_INDUSTRY = "coconut_industry",
  OTHER_PRIORITY_AREAS = "other_priority_areas",
}

export enum EvaluatorStatus {
  PENDING = "pending",
  FOR_REVIEW = "for_review",
  APPROVE = "approve",
  REVISE = "revise",
  REJECT = "reject",
  DECLINE = "decline",
}

export interface ImplementationSite {
  site_name: string;
  city: string;
}

export interface Proposal {
  id?: number;
  created_at?: string;
  
  // Basic Info
  project_title: string;
  program_title?: string;
  school_year?: string;
  
  // Relationships
  proponent_id: string; // UUID
  
  // Classification
  status?: Status;
  research_class?: ResearchClass;
  development_class?: DevelopmentClass;
  implementation_mode?: ImplementationMode;
  priority_areas?: PriorityArea[];
  
  // Details
  plan_start_date?: string;
  plan_end_date?: string;
  implementation_site?: ImplementationSite[];
  
  // Contact
  email?: string;
  phone?: string;
}

export interface EstimatedBudget {
  id?: number;
  proposal_id?: number;
  source: string;
  ps: number;
  mooe: number;
  co: number;
  created_at?: string;
}

export interface CooperatingAgency {
  id?: number;
  proposal_id?: number;
  agency_id: number;
}

export type ProposalRow = Proposal;