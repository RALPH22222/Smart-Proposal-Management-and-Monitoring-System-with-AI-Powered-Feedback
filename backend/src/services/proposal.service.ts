import { SupabaseClient } from "@supabase/supabase-js";
import { AgencyAddress, IdOrName, Status, Table } from "../types/proposal";
import {
  ForwardToEvaluatorsInput,
  ForwardToRndInput,
  ProposalInput,
  ProposalVersionInput,
  revisionProposalToProponentInput,
} from "../schemas/proposal-schema";

function isId(v: IdOrName): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

function cleanName(v: IdOrName): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim();
  return s.length ? s : null;
}

export class ProposalService {
  constructor(private db: SupabaseClient) {}

  private async resolveLookupId(args: {
    table: Table;
    value: IdOrName;
    nameColumn?: string; // defaults to "name"
  }): Promise<number | null> {
    const { table, value } = args;
    const nameColumn = args.nameColumn ?? "name";

    // already an id -> use directly
    if (isId(value)) return value;

    // string -> treat as new/existing name
    const name = cleanName(value);
    if (!name) return null;

    // 1) try to find existing
    const existing = await this.db.from(table).select("id").eq(nameColumn, name).maybeSingle();

    if (existing.data?.id) return existing.data.id;

    // 2) insert new and return id
    const inserted = await this.db
      .from(table)
      .insert({ [nameColumn]: name })
      .select("id")
      .single();

    if (inserted.error) throw inserted.error;
    return inserted.data.id as number;
  }

  private async ensureAgencyAddressColumns(agency_id: number | null, agency_address?: AgencyAddress): Promise<void> {
    if (!agency_id || !agency_address) return;

    const existing_address = await this.db
      .from("agencies")
      .select("street, barangay, city")
      .eq("id", agency_id)
      .maybeSingle();

    if (existing_address.error) {
      throw new Error(`Fetch agency address failed: ${existing_address.error.message}`);
    }

    if (!existing_address.data) {
      throw new Error(`Agency not found for id=${agency_id}`);
    }

    const hasAddress =
      !!existing_address.data?.street && !!existing_address.data?.barangay && !!existing_address.data?.city;

    if (hasAddress) return;

    const upd = await this.db
      .from("agencies")
      .update({
        street: agency_address.street,
        barangay: agency_address.barangay,
        city: agency_address.city,
      })
      .eq("id", agency_id);

    if (upd.error) {
      throw new Error(`Update agency address failed: ${upd.error.message}`);
    }
  }

  async create(payload: Omit<ProposalInput, "file_url">) {
    const {
      agency,
      sector,
      discipline,
      department,
      budget,
      implementation_site,
      agency_address,
      cooperating_agencies,
      tags,
      ...proposal
    } = payload;

    const department_id = await this.resolveLookupId({
      table: Table.DEPARTMENTS,
      value: department,
    });

    const sector_id = await this.resolveLookupId({
      table: Table.SECTORS,
      value: sector,
    });

    const discipline_id = await this.resolveLookupId({
      table: Table.DISCIPLINES,
      value: discipline,
    });

    const agency_id = await this.resolveLookupId({
      table: Table.AGENCIES,
      value: agency,
    });

    await this.ensureAgencyAddressColumns(agency_id, agency_address);

    const insertDbPayload = {
      ...proposal,
      department_id,
      sector_id,
      discipline_id,
      agency_id,
      status: Status.REVIEW_RND,
    };

    const insertRes = await this.db.from("proposals").insert(insertDbPayload).select().single();

    if (insertRes.error) {
      throw new Error(`Insert proposals failed: ${insertRes.error.message}`);
    }
    if (!insertRes.data) {
      throw new Error("Insert proposals returned no data");
    }

    const proposal_id = insertRes.data.id as number;

    // JOIN TABLES
    // TAGS JOIN
    if (Array.isArray(tags) && tags.length > 0) {
      const tagIds = Array.from(new Set(tags));
      const tagRows = tagIds.map((tagId) => ({ proposal_id, tag_id: tagId }));

      const tagJoin = await this.db.from("proposal_tags").insert(tagRows);

      if (tagJoin.error) throw new Error(`proposal_tags upsert failed: ${tagJoin.error.message}`);
    }

    // 1) resolve all cooperating agencies (string|number) into ids
    const coopResolved = await Promise.all(
      (cooperating_agencies ?? []).map((v) => this.resolveLookupId({ table: Table.AGENCIES, value: v })),
    );

    // 2) remove nulls, remove duplicates, exclude the main agency_id
    const cooperating_agencies_id = Array.from(
      new Set(
        coopResolved
          .filter((id): id is number => typeof id === "number" && Number.isFinite(id))
          .filter((id) => (agency_id ? id !== agency_id : true)),
      ),
    );

    // 3) insert join rows
    if (cooperating_agencies_id.length > 0) {
      const coopRows = cooperating_agencies_id.map((agencyId) => ({
        proposal_id,
        agency_id: agencyId,
      }));

      const coopJoin = await this.db.from("cooperating_agencies").insert(coopRows);

      if (coopJoin.error) throw new Error(`cooperating_agencies upsert failed: ${coopJoin.error.message}`);
    }

    // IMPLEMENTATION SITE JOIN
    if (implementation_site.length > 0) {
      const implement_rows = implementation_site.map((implementation_site) => ({
        proposal_id,
        site_name: implementation_site.site_name,
        city: implementation_site.city,
      }));

      const implementation_join = await this.db.from("implementation_site").insert(implement_rows);

      if (implementation_join.error)
        throw new Error(`implementation_site insert failed: ${implementation_join.error.message}`);
    }

    // BUDGET JOIN
    if (budget.length > 0) {
      const budget_rows = budget.map((budget) => ({
        proposal_id,
        source: budget.source,
        ps: budget.ps,
        mooe: budget.mooe,
        co: budget.co,
      }));

      const budget_join = await this.db.from("estimated_budget").insert(budget_rows);

      if (budget_join.error) throw new Error(`estimated_budget insert failed: ${budget_join.error.message}`);
    }

    return { data: insertRes.data, error: insertRes.error };
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

  async revisionProposalToProponent(input: revisionProposalToProponentInput) {
    const { data, error } = await this.db.from("proposal_revision_summary").insert(input);

    return {
      data,
      error,
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
