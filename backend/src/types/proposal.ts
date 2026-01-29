export enum Status {
  REVIEW_RND = "review_rnd",
  REVISION_RND = "revision_rnd",
  REJECTED_RND = "rejected_rnd",
  UNDER_EVALUATION = "under_evaluation",
  ENDORSED_FOR_FUNDING = "endorsed_for_funding",
  FUNDED = "funded",
  PENDING = "pending",
}

export enum ResearchClass {
  BASIC = "basic",
  APPLIED = "applied",
}

export enum DevelopmentClass {
  PILOT_TESTING = "pilot_testing",
  TECH_PROMOTION = "tech_promotion",
}

export enum ClassificationType {
  RESEARCH_CLASS = "research_class",
  DEVELOPMENT_CLASS = "development_class",
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
  ACCEPT = "accept",
  FOR_REVIEW = "for_review",
  APPROVE = "approve",
  REVISE = "revise",
  REJECT = "reject",
  DECLINE = "decline",
}

export enum EvaluatorFinalDecision {
  APPROVE = "approve",
  REVISE = "revise",
  REJECT = "reject",
}

export enum Table {
  DEPARTMENTS = "departments",
  SECTORS = "sectors",
  DISCIPLINES = "disciplines",
  AGENCIES = "agencies",
}

export enum Budget {
  PS = "ps",
  MOOE = "mooe",
  CO = "co",
}

export enum AssignmentTracker {
  PENDING = "pending",
  ACCEPT = "accept",
  DECLINE = "decline",
  EXTEND = "extend",
}

export enum ProjectsStatus {
  ON_GOING = "on_going",
  COMPLETED = "completed",
  ON_HOLD = "on_hold",
  BLOCKED = "blocked",
}

export enum EndorsementDecision {
  ENDORSED = "endorsed",
  REVISED = "revised",
  REJECTED = "rejected",
}

export type IdOrName = number | string | null | undefined;

// For the 'implementation_site' JSONB column
export interface ImplementationSite {
  site_name: string;
  city: string;
}

export interface AgencyAddress {
  street: string;
  barangay: string;
  city: string;
}

// Matches 'public.proposals' table
export interface Proposal {
  id?: number;
  created_at?: string;
  project_title: string;
  program_title?: string;
  school_year?: string;
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
  email?: string;
  phone?: string;
}

// Matches 'public.estimated_budget' table
export interface EstimatedBudget {
  id?: number;
  proposal_id?: number;
  source: string;
  ps: number;
  mooe: number;
  co: number;
  created_at?: string;
}

// Matches 'public.cooperating_agencies' table
export interface CooperatingAgency {
  id?: number;
  proposal_id?: number;
  agency_id: number;
}

export type ProposalRow = Proposal; // Alias for compatibility
