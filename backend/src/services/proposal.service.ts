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
    const { budget, ...proposal } = payload;

    const { data, error } = await this.db
      .from("proposals")
      .insert({ ...proposal, status: Status.REVIEW_RND })
      .select()
      .single();

    return {
      data: data as ProposalRow | null,
      error,
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

  async forwardToEvaluators(input: ForwardToEvaluatorsInput, rnd_id: string) {
    const { proposal_id, evaluator_id, deadline_at, commentsForEvaluators } = input;

    const deadline_number_weeks = new Date();
    deadline_number_weeks.setDate(deadline_number_weeks.getDate() + deadline_at);

    const assignmentsPayload = evaluator_id.map((evaluator) => ({
      proposal_id: proposal_id,
      evaluator_id: evaluator,
      forwarded_by_rnd_id: rnd_id,
      deadline_at: deadline_number_weeks.toISOString(),
      comments_for_evaluators: commentsForEvaluators ?? null,
      status: "pending",
    }));

    const { error: insertError, data: assignments } = await this.db
      .from("proposal_evaluators")
      .insert(assignmentsPayload);

    if (insertError) {
      return { error: insertError, assignments: null };
    }

    const { error: updateError } = await this.db
      .from("proposals")
      .update({
        status: "under_evaluation",
        updated_at: new Date().toISOString(),
        evaluation_deadline_at: deadline_number_weeks.toISOString(),
      })
      .eq("id", proposal_id);

    if (updateError) {
      return { error: updateError, assignments: null };
    }

    return {
      error: null,
      assignments,
    };
  }

  async forwardToRnd(input: ForwardToRndInput) {
    const { proposal_id, rnd_id } = input;

    const assignmentsPayload = rnd_id.map((rnd) => ({
      proposal_id: proposal_id,
      rnd_id: rnd,
    }));

    const { error: insertError, data: assignments } = await this.db.from("proposal_rnd").insert(assignmentsPayload);

    if (insertError) {
      return { error: insertError, assignments: null };
    }

    return {
      error: null,
      assignments,
    };
  }

  async getAll(search?: string, status?: Status) {
    const filters = [];
    let query = this.db.from("proposals").select(`
      *,
      proponent:users(name),
      department:departments(name),
      sector:sectors(name),
      discipline:disciplines(name),
      agency:agencies(name)
    `);

    if (search) {
      filters.push(`project_title.ilike.%${search}%`);
    }

    if (status) {
      filters.push(`status.eq.${status}`);
    }

    if (filters.length > 0) {
      query.or(filters.join(","));
    }

    const { data, error } = await query;

    return { data, error };
  }

  async getProponentProposalStats() {
    try {
      const queries = {
        total: this.db.from("proposals").select("*", { count: "exact", head: true }),

        review_rnd: this.db.from("proposals").select("*", { count: "exact", head: true }).eq("status", "review_rnd"),

        under_evaluation: this.db
          .from("proposals")
          .select("*", { count: "exact", head: true })
          .eq("status", "under_evaluation"),

        revision_rnd: this.db
          .from("proposals")
          .select("*", { count: "exact", head: true })
          .eq("status", "revision_rnd"),

        funded: this.db.from("proposals").select("*", { count: "exact", head: true }).eq("status", "funded"),
      };

      const results = await Promise.all(Object.values(queries));

      const data = {
        total_projects: results[0].count,
        review_rnd: results[1].count,
        under_evaluation: results[2].count,
        revision_rnd: results[3].count,
        funded: results[4].count,
      };

      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  async getRndProposalStats() {
    try {
      const queries = {
        total: this.db.from("proposals").select("*", { count: "exact", head: true }),

        review_rnd: this.db.from("proposals").select("*", { count: "exact", head: true }).eq("status", "review_rnd"),

        revision_rnd: this.db
          .from("proposals")
          .select("*", { count: "exact", head: true })
          .eq("status", "revision_rnd"),

        rejected_rnd: this.db
          .from("proposals")
          .select("*", { count: "exact", head: true })
          .eq("status", "rejected_rnd"),

        under_evaluation: this.db
          .from("proposals")
          .select("*", { count: "exact", head: true })
          .eq("status", "under_evaluation"),

        endorsed_for_funding: this.db
          .from("proposals")
          .select("*", { count: "exact", head: true })
          .eq("status", "endorsed_for_funding"),

        funded: this.db.from("proposals").select("*", { count: "exact", head: true }).eq("status", "funded"),
      };

      const results = await Promise.all(Object.values(queries));

      const data = {
        total_projects: results[0].count,
        review_rnd: results[1].count,
        revision_rnd: results[2].count,
        rejected_rnd: results[3].count,
        under_evaluation: results[4].count,
        endorsed_for_funding: results[5].count,
        funded: results[6].count,
      };

      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  async getEvaluatorProposalStats() {
    try {
      const queries = {
        pending: this.db
          .from("proposal_evaluators")
          .select("*", { count: "exact", head: true })
          .eq("status", "pending"),

        for_review: this.db
          .from("proposal_evaluators")
          .select("*", { count: "exact", head: true })
          .eq("status", "for_review"),

        approve: this.db
          .from("proposal_evaluators")
          .select("*", { count: "exact", head: true })
          .eq("status", "approve"),

        revise: this.db.from("proposal_evaluators").select("*", { count: "exact", head: true }).eq("status", "revise"),

        reject: this.db.from("proposal_evaluators").select("*", { count: "exact", head: true }).eq("status", "reject"),

        decline: this.db
          .from("proposal_evaluators")
          .select("*", { count: "exact", head: true })
          .eq("status", "decline"),
      };

      const results = await Promise.all(Object.values(queries));

      const data = {
        pending: results[0].count,
        for_review: results[1].count,
        approve: results[2].count,
        revise: results[3].count,
        reject: results[4].count,
        decline: results[5].count,
      };

      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  async getEvaluatorProposals(search?: string, status?: Status) {
    let query = this.db.from("proposal_evaluators").select(`
        *,
        evaluator:users(name),
        proposal:proposals!inner(
          *,
          proponent:users(name),
          department:departments(name),
          sector:sectors(name),
          discipline:disciplines(name),
          agency:agencies(name)
        )
      `);

    if (search) {
      // filter on related table column
      query = query.ilike("proposal.project_title", `%${search}%`);
    }

    if (status) {
      // filter on base table column
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    return { data, error };
  }

  async getAgency(search: string) {
    const { data, error } = await this.db.from("agencies").select(`*`).ilike("name", `%${search}%`);

    return { data, error };
  }

  async getCooperatingAgency(search: string) {
    const { data, error } = await this.db.from("cooperating_agencies").select(`*`).ilike("name", `%${search}%`);

    return { data, error };
  }

  async getDepartment(search: string) {
    const { data, error } = await this.db.from("departments").select(`*`).ilike("name", `%${search}%`);

    return { data, error };
  }

  async getDiscipline(search: string) {
    const { data, error } = await this.db.from("disciplines").select(`*`).ilike("name", `%${search}%`);

    return { data, error };
  }

  async getSector(search: string) {
    const { data, error } = await this.db.from("sectors").select(`*`).ilike("name", `%${search}%`);

    return { data, error };
  }

  async getTag(search: string) {
    const { data, error } = await this.db.from("tags").select(`*`).ilike("name", `%${search}%`);

    return { data, error };
  }
}
