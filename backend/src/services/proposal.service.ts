import { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import { ProposalRow, Status } from "../types/proposal";
import {
  ForwardToEvaluatorsInput,
  ForwardToRndInput,
  ProposalInput,
  ProposalVersionInput,
} from "../schemas/proposal-schema";

export class ProposalService {
  constructor(private db: SupabaseClient) {}

  async create(payload: Omit<ProposalInput, "proposal_file">): Promise<{
    data: ProposalRow | null;
    error: PostgrestError | null;
  }> {
    const { 
      budgetItems, 
      cooperatingAgencies, 
      projectTitle, 
      programTitle,
      proponentId,
      researchType,
      developmentType,
      implementationMode,
      priorityAreas,
      implementationSite,
      plannedStartDate,
      plannedEndDate,
      email,
      telephone 
    } = payload;

    // 2. Insert Main Proposal (Mapping camelCase -> snake_case)
    const { data: proposal, error: proposalError } = await this.db
      .from("proposals")
      .insert({
        project_title: projectTitle,
        program_title: programTitle,
        proponent_id: proponentId,
        status: Status.REVIEW_RND,
        research_class: researchType,
        development_class: developmentType,
        implementation_mode: implementationMode,
        priority_areas: priorityAreas,
        implementation_site: implementationSite,
        plan_start_date: plannedStartDate,
        plan_end_date: plannedEndDate,
        email: email,
        phone: telephone,
        school_year: new Date().getFullYear().toString(),
      })
      .select()
      .single();

    if (proposalError) {
      return { data: null, error: proposalError };
    }

    const proposalId = proposal.id;

    // 3. Insert Budget Items
    if (budgetItems && budgetItems.length > 0) {
      const formattedBudget = budgetItems.map((item) => ({
        proposal_id: proposalId,
        source: item.source,
        ps: item.ps,
        mooe: item.mooe,
        co: item.co,
      }));

      const { error: budgetError } = await this.db
        .from("estimated_budget")
        .insert(formattedBudget);

      if (budgetError) console.error("Budget Insert Error:", budgetError);
    }

    // 4. Insert Cooperating Agencies
    if (cooperatingAgencies && cooperatingAgencies.length > 0) {
      const formattedAgencies = cooperatingAgencies.map((agencyId) => ({
        proposal_id: proposalId,
        agency_id: agencyId,
      }));

      const { error: agencyError } = await this.db
        .from("cooperating_agencies")
        .insert(formattedAgencies);

      if (agencyError) console.error("Agency Insert Error:", agencyError);
    }

    return {
      data: proposal as ProposalRow,
      error: null,
    };
  }

  async createVersion(payload: ProposalVersionInput) {
    const { data, error } = await this.db
      .from("proposal_version")
      .insert({
        proposal_id: payload.proposal_id,
        file_url: payload.file_url,
      })
      .select()
      .single();

    return { data, error };
  }

  async getAgency(search: string) {
    const { data, error } = await this.db
      .from("agencies")
      .select("*")
      .ilike("name", `%${search}%`);
    return { data, error };
  }

  // ... (Add your other Getters, ForwardToEvaluators, and Stats methods here)
}