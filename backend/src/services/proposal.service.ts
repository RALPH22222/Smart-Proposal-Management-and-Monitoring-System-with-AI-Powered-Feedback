import { SupabaseClient } from "@supabase/supabase-js";
import {
  AgencyAddress,
  AssignmentTracker,
  Budget,
  EndorsementDecision,
  EvaluatorFinalDecision,
  EvaluatorStatus,
  ExtensionDecision,
  IdOrName,
  ProjectsStatus,
  Status,
  Table,
} from "../types/proposal";
import {
  decisionEvaluatorToProposalInput,
  EndorseForFundingInput,
  ForwardToEvaluatorsInput,
  ForwardToRndInput,
  HandleExtensionRequestInput,
  ProposalInput,
  ProposalVersionInput,
  rejectProposalToProponentInput,
  revisionProposalToProponentInput,
  createEvaluationScoresToProposaltInput,
  SubmitRevisedProposalInput,
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
  constructor(private db: SupabaseClient) { }

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

  private async ensureAgencyAddress(agency_id: number | null, agency_address?: AgencyAddress): Promise<string | null> {
    if (!agency_id || !agency_address) return null;

    // 1. If existing address ID provided, verify it belongs to this agency
    if (agency_address.id) {
      const { data } = await this.db
        .from("agency_address")
        .select("id")
        .eq("id", agency_address.id)
        .eq("agency_id", agency_id)
        .maybeSingle();
      if (data) return data.id;
    }

    // 2. Check for existing matching address
    let query = this.db.from("agency_address").select("id").eq("agency_id", agency_id).eq("city", agency_address.city);

    // Handle null vs empty for barangay/street
    if (agency_address.barangay) {
      query = query.eq("barangay", agency_address.barangay);
    } else {
      query = query.is("barangay", null);
    }
    if (agency_address.street) {
      query = query.eq("street", agency_address.street);
    } else {
      query = query.is("street", null);
    }

    const { data: existing } = await query.maybeSingle();
    if (existing) return existing.id;

    // 3. Insert new address
    const { data: newAddr, error } = await this.db
      .from("agency_address")
      .insert({
        agency_id,
        city: agency_address.city,
        barangay: agency_address.barangay || null,
        street: agency_address.street || null,
      })
      .select("id")
      .single();

    if (error) throw new Error(`Insert agency address failed: ${error.message}`);
    return newAddr.id;
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
      priorities_id,
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

    const agency_address_id = await this.ensureAgencyAddress(agency_id, agency_address);

    const insertDbPayload = {
      ...proposal,
      department_id,
      sector_id,
      discipline_id,
      agency_id,
      agency_address_id,
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

    // BUDGET JOIN (new payload: [{ source, budget: { ps/mooe/co: [{item,value}] } }])
    if (Array.isArray(budget) && budget.length > 0) {
      const budget_rows = budget.flatMap((entry) => {
        const source = entry.source;

        const toRows = (category: Budget) =>
          entry.budget[category].map((x) => ({
            proposal_id,
            source,
            budget: category,
            item: x.item,
            amount: x.value,
          }));

        return [...toRows(Budget.PS), ...toRows(Budget.MOOE), ...toRows(Budget.CO)];
      });

      if (budget_rows.length > 0) {
        const budget_join = await this.db.from("estimated_budget").insert(budget_rows);
        if (budget_join.error) throw new Error(`estimated_budget insert failed: ${budget_join.error.message}`);
      }
    }

    // PRIORITIES JOIN
    if (Array.isArray(priorities_id) && priorities_id.length > 0) {
      const priorityIds = Array.from(new Set(priorities_id));
      const priorityRows = priorityIds.map((priority_id) => ({ proposal_id, priority_id }));

      const priorityJoin = await this.db.from("proposal_priorities").insert(priorityRows);

      if (priorityJoin.error) throw new Error(`proposal_priorities insert failed: ${priorityJoin.error.message}`);
    }

    return { data: insertRes.data, error: insertRes.error };
  }

  // Saves link from aws S3 to proposal version
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
      forwarded_by_rnd: rnd_id,
      deadline_at: deadline_number_weeks.toISOString(),
      comments_for_evaluators: commentsForEvaluators ?? null,
      status: EvaluatorStatus.PENDING,
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
        status: Status.UNDER_EVALUATION,
        updated_at: new Date().toISOString(),
        evaluation_deadline_at: deadline_number_weeks.toISOString(),
      })
      .eq("id", proposal_id);

    if (updateError) {
      return { error: updateError, assignments: null };
    }

    const assignmentsTrackerPayload = evaluator_id.map((evaluator) => ({
      proposal_id: proposal_id,
      evaluator_id: evaluator,
      deadline_at: deadline_number_weeks.toISOString(),
      status: AssignmentTracker.PENDING,
    }));

    const { error: insertv2Error } = await this.db
      .from("proposal_assignment_tracker")
      .insert(assignmentsTrackerPayload);

    if (insertv2Error) {
      return { error: insertv2Error, assignments: null };
    }

    return {
      error: null,
      assignments,
    };
  }

  async decisionEvaluatorToProposal(
    input: Omit<decisionEvaluatorToProposalInput, "deadline_at">,
    evaluator_id: string,
    deadline_at?: string,
  ) {
    const { data: insertedData, error: insertError } = await this.db
      .from("proposal_assignment_tracker")
      .update({ ...input, evaluator_id })
      .eq("evaluator_id", evaluator_id)
      .eq("proposal_id", input.proposal_id);

    if (insertError) {
      return { error: insertError };
    }

    if (input.status === AssignmentTracker.EXTEND) {
      const { error: insertError } = await this.db
        .from("proposal_assignment_tracker")
        .update({ request_deadline_at: deadline_at })
        .eq("evaluator_id", evaluator_id)
        .eq("proposal_id", input.proposal_id);

      if (insertError) {
        return { error: insertError };
      }
    }

    if (input.status === AssignmentTracker.ACCEPT) {
      const { error: updateError } = await this.db
        .from("proposal_evaluators")
        .update({ status: EvaluatorStatus.FOR_REVIEW })
        .eq("evaluator_id", evaluator_id)
        .eq("proposal_id", input.proposal_id);

      if (updateError) {
        return { error: updateError };
      }
    } else if (input.status === AssignmentTracker.EXTEND) {
      const { error: updateError } = await this.db
        .from("proposal_evaluators")
        .update({ status: EvaluatorStatus.EXTEND })
        .eq("evaluator_id", evaluator_id)
        .eq("proposal_id", input.proposal_id);

      if (updateError) {
        return { error: updateError };
      }
    } else if (input.status === AssignmentTracker.DECLINE) {
      const { error: updateError } = await this.db
        .from("proposal_evaluators")
        .update({ status: EvaluatorStatus.DECLINE })
        .eq("evaluator_id", evaluator_id)
        .eq("proposal_id", input.proposal_id);

      if (updateError) {
        return { error: updateError };
      }
    }
    return { insertedData };
  }

  async forwardToRnd(input: ForwardToRndInput) {
    const { proposal_id, rnd_id } = input;

    const assignmentsPayload = rnd_id.map((rnd) => ({
      proposal_id: proposal_id,
      rnd_id: rnd,
    }));

    // Clear existing assignments first to support "Reassign" behavior
    const { error: deleteError } = await this.db.from("proposal_rnd").delete().eq("proposal_id", proposal_id);

    if (deleteError) {
      return { error: deleteError, assignments: null };
    }

    const { error: insertError, data: assignments } = await this.db.from("proposal_rnd").insert(assignmentsPayload);

    if (insertError) {
      return { error: insertError, assignments: null };
    }

    const { data: rowStatus, error: rowErrorStatus } = await this.db
      .from("proposals")
      .update({ status: Status.REVIEW_RND })
      .eq("id", proposal_id);

    if (rowErrorStatus) {
      return { rosStatus: null, rowErrorStatus };
    }

    return {
      error: null,
      assignments,
    };
  }

  async revisionProposalToProponent(input: revisionProposalToProponentInput, rnd_id: string) {
    // Include rnd_id in the insert payload so we know which RND submitted this revision
    const { data, error: insertError } = await this.db.from("proposal_revision_summary").insert({ ...input, rnd_id });

    if (insertError) return { error: insertError };

    const { error: updateError } = await this.db
      .from("proposals")
      .update({
        status: Status.REVISION_RND,
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.proposal_id);

    if (updateError) return { error: updateError };

    return { data };
  }

  async rejectProposalToProponent(input: rejectProposalToProponentInput, rnd_id: string) {
    console.log("Rejecting proposal:", input.proposal_id, "by RND:", rnd_id);

    // Explicitly construct payload to avoid schema mismatches
    const insertPayload = {
      proposal_id: input.proposal_id,
      comment: input.comment,
      rnd_id: rnd_id,
    };

    const { data, error: insertError } = await this.db.from("proposal_reject_summary").insert(insertPayload);

    if (insertError) {
      console.error("Error inserting into proposal_reject_summary:", insertError);
      return { error: insertError };
    }

    const { error: updateError } = await this.db
      .from("proposals")
      .update({
        status: Status.REJECTED_RND,
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.proposal_id);

    if (updateError) {
      console.error("Error updating proposals status:", updateError);
      return { error: updateError };
    }

    return { data };
  }

  async createEvaluationScoresToProposal(
    input: Omit<createEvaluationScoresToProposaltInput, "status">,
    status: EvaluatorFinalDecision,
    evaluator_id: string,
  ) {
    // Insert evaluation score
    const { data, error } = await this.db.from("evaluation_scores").insert({ ...input, evaluator_id });

    if (error) {
      return { data: null, error };
    }

    // Update proposal_evaluators status to approve/revise/reject
    // Only update if status is one of the final decisions
    if (
      status === EvaluatorFinalDecision.APPROVE ||
      status === EvaluatorFinalDecision.REVISE ||
      status === EvaluatorFinalDecision.REJECT
    ) {
      const { error: updateError } = await this.db
        .from("proposal_evaluators")
        .update({ status: status, updated_at: new Date().toISOString() })
        .eq("proposal_id", input.proposal_id)
        .eq("evaluator_id", evaluator_id);

      if (updateError) {
        return { data: null, error: updateError };
      }
    }

    return { data, error: null };
  }

  async getEvaluationScoresFromProposal(evaluator_id: number) {
    const { data, error } = await this.db
      .from("evaluation_scores")
      .select(`*,users(first_name,last_name)`)
      .eq("evaluator_id", evaluator_id);

    return { data, error };
  }

  async getUsersByRole(role: string, departmentId?: number) {
    // Use users.department_id as the primary department association.
    // This works for all roles (rnd, evaluator, etc.) without needing
    // a separate junction table. The department name is joined via FK.
    let query = this.db
      .from("users")
      .select("id, first_name, last_name, email, photo_profile_url, department_id, departments(id, name)");

    // Filter by role using the roles array column (contains operator)
    query = query.contains("roles", [role]);

    // Filter by department if provided
    if (departmentId) {
      query = query.eq("department_id", departmentId);
    }

    const { data: users, error } = await query;

    if (error) {
      return { data: null, error };
    }

    if (!users || users.length === 0) {
      return { data: [], error: null };
    }

    // Transform: wrap the single department into a departments[] array
    // so the frontend shape stays consistent. Handle both object and array cases safely.
    return {
      data: users.map((u: any) => {
        let depts: any[] = [];

        // Check both 'departments' (standard) and 'department' (potential singular response)
        const rawDept = u.departments || u.department;

        if (rawDept) {
          if (Array.isArray(rawDept)) {
            depts = rawDept;
          } else {
            depts = [rawDept];
          }
        }

        return {
          id: u.id,
          first_name: u.first_name,
          last_name: u.last_name,
          email: u.email,
          profile_picture: u.photo_profile_url, // map to frontend expected key
          department_id: u.department_id, // Pass raw ID for frontend lookup
          departments: depts,
        };
      }),
      error: null,
    };
  }

  async getAll(search?: string, status?: Status, proponent_id?: string, roles?: string[]) {
    let query = this.db.from("proposals").select(`
      *,
      cooperating_agencies(agencies(name)),
      proposal_tags(tags(name)),
      proposal_priorities(priorities(id,name)),
      implementation_site(site_name,city),
      proponent_id(id,first_name,last_name,email,photo_profile_url,department:department_id(name)),
      rnd_station:departments(name),
      sector:sectors(name),
      discipline:disciplines(name),
      agency:agencies(name),
      agency_address(id,city,street,barangay),
      estimated_budget(id,budget,item,amount,source),
      proposal_version(id,file_url),
      proposal_rnd(users(first_name,last_name,email,department:departments(name)))
    `);

    // Filter by proponent_id if provided (security filter for proponent users)
    const isAdmin = roles?.includes("admin");

    if (!isAdmin) {
      query = query.eq("proponent_id", proponent_id);
    }
    if (search) {
      query = query.ilike("project_title", `%${search}%`);
    }

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    return { data, error };
  }

  async getProponentProposalStats(proponent_id: string) {
    try {
      const queries = {
        total: this.db.from("proposals").select("*", { count: "exact", head: true }).eq("proponent_id", proponent_id),

        review_rnd: this.db
          .from("proposals")
          .select("*", { count: "exact", head: true })
          .eq("status", "review_rnd")
          .eq("proponent_id", proponent_id),

        under_evaluation: this.db
          .from("proposals")
          .select("*", { count: "exact", head: true })
          .eq("status", "under_evaluation")
          .eq("proponent_id", proponent_id),

        revision_rnd: this.db
          .from("proposals")
          .select("*", { count: "exact", head: true })
          .eq("status", "revision_rnd")
          .eq("proponent_id", proponent_id),

        funded: this.db
          .from("proposals")
          .select("*", { count: "exact", head: true })
          .eq("status", "funded")
          .eq("proponent_id", proponent_id),
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

  async getRndProposalStats(rnd_id: string) {
    try {
      // Query from proposal_rnd and join with proposals using !inner to get the status
      // proposal_rnd links RND users to proposals, proposals has the status
      const queries = {
        total: this.db
          .from("proposal_rnd")
          .select("proposal:proposals!inner(id)", { count: "exact", head: true })
          .eq("rnd_id", rnd_id),

        review_rnd: this.db
          .from("proposal_rnd")
          .select("proposal:proposals!inner(id, status)", { count: "exact", head: true })
          .eq("rnd_id", rnd_id)
          .eq("proposal.status", "review_rnd"),

        revision_rnd: this.db
          .from("proposal_rnd")
          .select("proposal:proposals!inner(id, status)", { count: "exact", head: true })
          .eq("rnd_id", rnd_id)
          .eq("proposal.status", "revision_rnd"),

        rejected_rnd: this.db
          .from("proposal_rnd")
          .select("proposal:proposals!inner(id, status)", { count: "exact", head: true })
          .eq("rnd_id", rnd_id)
          .eq("proposal.status", "rejected_rnd"),

        under_evaluation: this.db
          .from("proposal_rnd")
          .select("proposal:proposals!inner(id, status)", { count: "exact", head: true })
          .eq("rnd_id", rnd_id)
          .eq("proposal.status", "under_evaluation"),

        endorsed_for_funding: this.db
          .from("proposal_rnd")
          .select("proposal:proposals!inner(id, status)", { count: "exact", head: true })
          .eq("rnd_id", rnd_id)
          .eq("proposal.status", "endorsed_for_funding"),

        funded: this.db
          .from("proposal_rnd")
          .select("proposal:proposals!inner(id, status)", { count: "exact", head: true })
          .eq("rnd_id", rnd_id)
          .eq("proposal.status", "funded"),
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

  async getEvaluatorProposalStats(evaluator_id: string) {
    try {
      // Filter all queries by evaluator_id to get stats for this specific evaluator
      const queries = {
        pending: this.db
          .from("proposal_evaluators")
          .select("*", { count: "exact", head: true })
          .eq("evaluator_id", evaluator_id)
          .eq("status", "pending"),

        for_review: this.db
          .from("proposal_evaluators")
          .select("*", { count: "exact", head: true })
          .eq("evaluator_id", evaluator_id)
          .eq("status", "for_review"),

        approve: this.db
          .from("proposal_evaluators")
          .select("*", { count: "exact", head: true })
          .eq("evaluator_id", evaluator_id)
          .eq("status", "approve"),

        revise: this.db
          .from("proposal_evaluators")
          .select("*", { count: "exact", head: true })
          .eq("evaluator_id", evaluator_id)
          .eq("status", "revise"),

        reject: this.db
          .from("proposal_evaluators")
          .select("*", { count: "exact", head: true })
          .eq("evaluator_id", evaluator_id)
          .eq("status", "reject"),

        decline: this.db
          .from("proposal_evaluators")
          .select("*", { count: "exact", head: true })
          .eq("evaluator_id", evaluator_id)
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

  async getEvaluatorProposals(evaluator_id: string, search?: string, status?: Status) {
    let query = this.db
      .from("proposal_evaluators")
      .select(
        `
        id,
        status,
        deadline_at,
        comments_for_evaluators,
        evaluator_id(first_name,last_name),
        forwarded_by_rnd(first_name,last_name),
        proposal_id(
          *,
          cooperating_agencies(agencies(name)),
          proposal_tags(tags(name)),
          proposal_priorities(priorities(id,name)),
          implementation_site(site_name,city),
          proponent_id(id,first_name,last_name,department:department_id(name)),
          rnd_station:departments(name),
          sector:sectors(name),
          discipline:disciplines(name),
          agency:agencies(name),
          agency_address(id,city,street,barangay),
          estimated_budget(id,budget,item,amount,source),
          proposal_version(id,file_url)
        )
      `,
      )
      .eq("evaluator_id", evaluator_id);

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

  async getRndProposals(rnd_id: string) {
    const { data, error } = await this.db
      .from("proposal_rnd")
      .select(
        `
        id,
        proposal_id(
          *,
          cooperating_agencies(agencies(name)),
          proposal_tags(tags(name)),
          proposal_priorities(priorities(id,name)),
          implementation_site(site_name,city),
          proponent_id(id,first_name,last_name,department:department_id(name)),
          rnd_station:departments(name),
          sector:sectors(name),
          discipline:disciplines(name),
          agency:agencies(name),
          agency_address(id,city,street,barangay),
          estimated_budget(id,budget,item,amount,source),
          proposal_version(id,file_url)
        )
      `,
      )
      .eq("rnd_id", rnd_id);

    if (error) {
      return { data, error };
    }

    return { data, error };
  }

  async getAgency(search: string) {
    const { data, error } = await this.db
      .from("agencies")
      .select(`id, name, agency_address(id, city, barangay, street)`)
      .ilike("name", `%${search}%`);

    return { data, error };
  }

  async getCooperatingAgency(search: string) {
    const { data, error } = await this.db
      .from("agencies")
      .select(`id, name, agency_address(id, city, barangay, street)`)
      .ilike("name", `%${search}%`);

    return { data, error };
  }

  async getAgencyAddresses(agency_id: number) {
    const { data, error } = await this.db
      .from("agency_address")
      .select("id, city, barangay, street")
      .eq("agency_id", agency_id)
      .order("created_at", { ascending: false });

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

  async getProposalsForEndorsement(search?: string, rnd_id?: string) {
    // 1. Get proposals in under_evaluation status assigned to this RND user
    // Use !inner join with proposal_rnd to filter by rnd_id
    let query = this.db
      .from("proposals")
      .select(
        `
        id,
        project_title,
        proponent_id,
        department_id,
        status,
        created_at,
        proposal_rnd!inner(rnd_id),
        proposal_evaluators(
          evaluator_id,
          status,
          deadline_at
        )
      `,
      )
      .eq("status", Status.UNDER_EVALUATION);

    // Filter by RND user - only show proposals assigned to this RND
    if (rnd_id) {
      query = query.eq("proposal_rnd.rnd_id", rnd_id);
    }

    if (search) {
      query = query.ilike("project_title", `%${search}%`);
    }

    const { data: proposals, error } = await query;

    if (error) {
      return { data: null, error };
    }

    if (!proposals || proposals.length === 0) {
      return { data: [], error: null };
    }

    const proposalIds = proposals.map((p) => p.id);

    // 2. Get all unique user IDs (proponents + evaluators) to fetch names
    const proponentIds = proposals.map((p) => p.proponent_id).filter(Boolean);
    const evaluatorIds = proposals
      .flatMap((p) => (p.proposal_evaluators || []).map((ev: any) => ev.evaluator_id))
      .filter(Boolean);
    const allUserIds = [...new Set([...proponentIds, ...evaluatorIds])];

    // 3. Get all unique department IDs
    const departmentIds = [...new Set(proposals.map((p) => p.department_id).filter(Boolean))];

    // 4. Fetch users and departments in parallel
    const [usersResult, departmentsResult, scoresResult, budgetsResult] = await Promise.all([
      allUserIds.length > 0
        ? this.db.from("users").select("id, first_name, last_name").in("id", allUserIds)
        : { data: [], error: null },
      departmentIds.length > 0
        ? this.db.from("departments").select("id, name").in("id", departmentIds)
        : { data: [], error: null },
      // Updated to use new column structure: objective, methodology, budget, timeline, comment
      this.db
        .from("evaluation_scores")
        .select("proposal_id, evaluator_id, objective, methodology, budget, timeline, comment")
        .in("proposal_id", proposalIds),
      this.db.from("estimated_budget").select("proposal_id, source, budget, amount").in("proposal_id", proposalIds),
    ]);

    if (usersResult.error) return { data: null, error: usersResult.error };
    if (departmentsResult.error) return { data: null, error: departmentsResult.error };
    if (scoresResult.error) return { data: null, error: scoresResult.error };
    if (budgetsResult.error) return { data: null, error: budgetsResult.error };

    // Create lookup maps for quick access
    const usersMap = new Map((usersResult.data || []).map((u) => [u.id, u]));
    const departmentsMap = new Map((departmentsResult.data || []).map((d) => [d.id, d]));
    const allScores = scoresResult.data || [];
    const allBudgets = budgetsResult.data || [];

    // 5. Transform data for frontend
    const endorsementProposals = proposals.map((proposal) => {
      const evaluators = proposal.proposal_evaluators || [];

      // Get scores for this proposal grouped by evaluator
      const proposalScores = allScores.filter((s) => s.proposal_id === proposal.id);

      // Build evaluator decisions
      const evaluatorDecisions = evaluators.map((ev: any) => {
        // Find the score record for this evaluator (now one row per evaluator with all scores)
        const evaluatorScore = proposalScores.find((s) => s.evaluator_id === ev.evaluator_id);

        // Build ratings from the new column structure
        const ratings = {
          objective: evaluatorScore?.objective ?? 0,
          methodology: evaluatorScore?.methodology ?? 0,
          budget: evaluatorScore?.budget ?? 0,
          timeline: evaluatorScore?.timeline ?? 0,
        };

        // Map evaluator status to decision
        let decision: "Approve" | "Revise" | "Reject" | "Pending" = "Pending";
        if (ev.status === EvaluatorStatus.APPROVE) decision = "Approve";
        else if (ev.status === EvaluatorStatus.REVISE) decision = "Revise";
        else if (ev.status === EvaluatorStatus.REJECT) decision = "Reject";

        // Get evaluator name from lookup map
        const evaluator = usersMap.get(ev.evaluator_id);

        return {
          evaluatorId: ev.evaluator_id,
          evaluatorName: evaluator
            ? `${evaluator.first_name || ""} ${evaluator.last_name || ""}`.trim() || "Unknown"
            : "Unknown",
          decision,
          status: ev.status,
          submittedDate: ev.deadline_at,
          ratings,
          comment: evaluatorScore?.comment || null,
        };
      });

      // Compute readyForEndorsement: all evaluators must have completed (approve/revise/reject)
      const completedStatuses = [EvaluatorStatus.APPROVE, EvaluatorStatus.REVISE, EvaluatorStatus.REJECT];
      const readyForEndorsement =
        evaluators.length > 0 && evaluators.every((ev: any) => completedStatuses.includes(ev.status));

      // Compute overall recommendation based on majority
      const decisions = evaluatorDecisions.filter((d) => d.decision !== "Pending");
      let overallRecommendation: "Approve" | "Revise" | "Reject" = "Revise";
      if (decisions.length > 0) {
        const approveCount = decisions.filter((d) => d.decision === "Approve").length;
        const rejectCount = decisions.filter((d) => d.decision === "Reject").length;
        if (approveCount > decisions.length / 2) overallRecommendation = "Approve";
        else if (rejectCount > decisions.length / 2) overallRecommendation = "Reject";
      }

      // Get budget for this proposal
      const proposalBudgets = (allBudgets || []).filter((b) => b.proposal_id === proposal.id);
      const budgetBySource: Record<string, { ps: number; mooe: number; co: number; total: number }> = {};
      proposalBudgets.forEach((b) => {
        if (!budgetBySource[b.source]) {
          budgetBySource[b.source] = { ps: 0, mooe: 0, co: 0, total: 0 };
        }
        const cat = b.budget as "ps" | "mooe" | "co";
        if (cat && budgetBySource[b.source][cat] !== undefined) {
          budgetBySource[b.source][cat] += b.amount || 0;
          budgetBySource[b.source].total += b.amount || 0;
        }
      });
      const budget = Object.entries(budgetBySource).map(([source, values]) => ({
        source,
        ...values,
      }));

      // Get proponent and department from lookup maps
      const proponent = usersMap.get(proposal.proponent_id);
      const department = departmentsMap.get(proposal.department_id);

      return {
        id: String(proposal.id),
        title: proposal.project_title,
        submittedBy: proponent
          ? `${proponent.first_name || ""} ${proponent.last_name || ""}`.trim() || "Unknown"
          : "Unknown",
        department: department?.name || "Unknown",
        evaluatorDecisions,
        overallRecommendation,
        readyForEndorsement,
        budget,
      };
    });

    return { data: endorsementProposals, error: null };
  }

  async endorseForFunding(input: EndorseForFundingInput) {
    const { proposal_id, rnd_id, decision, remarks } = input;

    // 1. Get proposal to verify it exists and get proponent_id
    const { data: proposal, error: fetchError } = await this.db
      .from("proposals")
      .select("id, proponent_id, status")
      .eq("id", proposal_id)
      .single();

    if (fetchError || !proposal) {
      return { error: fetchError || new Error("Proposal not found") };
    }

    // 2. Verify proposal is in under_evaluation status
    if (proposal.status !== Status.UNDER_EVALUATION) {
      return { error: new Error(`Proposal must be in 'under_evaluation' status. Current status: ${proposal.status}`) };
    }

    // 3. Handle based on decision type
    if (decision === EndorsementDecision.ENDORSED) {
      // Update proposal status to endorsed_for_funding
      const { error: updateError } = await this.db
        .from("proposals")
        .update({
          status: Status.ENDORSED_FOR_FUNDING,
          updated_at: new Date().toISOString(),
        })
        .eq("id", proposal_id);

      if (updateError) {
        return { error: updateError };
      }

      // Create funded_projects record
      const { data: fundedProject, error: insertError } = await this.db
        .from("funded_projects")
        .insert({
          proposal_id: proposal_id,
          project_lead_id: proposal.proponent_id,
          status: ProjectsStatus.ON_GOING,
          funded_date: new Date().toISOString().split("T")[0], // Date only
        })
        .select()
        .single();

      if (insertError) {
        return { error: insertError };
      }

      // Log the endorsement action
      await this.db.from("proposal_logs").insert({
        proposal_id: proposal_id,
        action: "endorsed_for_funding",
        performed_by: rnd_id,
        remarks: remarks || "Proposal endorsed for funding",
      });

      return { data: { proposal_id, funded_project: fundedProject }, error: null };
    } else if (decision === EndorsementDecision.REVISED) {
      // Use existing revision logic - update status to revision_rnd
      const { error: updateError } = await this.db
        .from("proposals")
        .update({
          status: Status.REVISION_RND,
          updated_at: new Date().toISOString(),
        })
        .eq("id", proposal_id);

      if (updateError) {
        return { error: updateError };
      }

      // Log the revision request
      await this.db.from("proposal_logs").insert({
        proposal_id: proposal_id,
        action: "revision_requested_after_evaluation",
        performed_by: rnd_id,
        remarks: remarks || "Revision requested after evaluation review",
      });

      return { data: { proposal_id, status: Status.REVISION_RND }, error: null };
    } else if (decision === EndorsementDecision.REJECTED) {
      // Use existing rejection logic - update status to rejected_rnd
      const { error: updateError } = await this.db
        .from("proposals")
        .update({
          status: Status.REJECTED_RND,
          updated_at: new Date().toISOString(),
        })
        .eq("id", proposal_id);

      if (updateError) {
        return { error: updateError };
      }

      // Log the rejection
      await this.db.from("proposal_logs").insert({
        proposal_id: proposal_id,
        action: "rejected_after_evaluation",
        performed_by: rnd_id,
        remarks: remarks || "Proposal rejected after evaluation review",
      });

      return { data: { proposal_id, status: Status.REJECTED_RND }, error: null };
    }

    return { error: new Error("Invalid decision type") };
  }

  async submitRevision(input: Omit<SubmitRevisedProposalInput, "file_url">, fileUrl: string) {
    const { proposal_id, proponent_id, project_title, revision_response } = input;

    // 1. Verify proposal exists and belongs to proponent
    const { data: proposal, error: fetchError } = await this.db
      .from("proposals")
      .select("id, proponent_id, status, project_title")
      .eq("id", proposal_id)
      .single();

    if (fetchError || !proposal) {
      return { error: fetchError || new Error("Proposal not found") };
    }

    // 2. Verify ownership
    if (proposal.proponent_id !== proponent_id) {
      return { error: new Error("You do not have permission to revise this proposal") };
    }

    // 3. Verify status is revision_rnd
    if (proposal.status !== Status.REVISION_RND) {
      return {
        error: new Error(
          `Proposal must be in 'revision_rnd' status to submit revision. Current status: ${proposal.status}`,
        ),
      };
    }

    // 4. Get current version count for numbering
    const { count: versionCount, error: countError } = await this.db
      .from("proposal_version")
      .select("*", { count: "exact", head: true })
      .eq("proposal_id", proposal_id);

    if (countError) {
      return { error: countError };
    }

    const newVersionNumber = (versionCount || 0) + 1;

    // 5. Create new proposal_version record
    const { data: versionData, error: versionError } = await this.db
      .from("proposal_version")
      .insert({
        proposal_id: proposal_id,
        file_url: fileUrl,
      })
      .select()
      .single();

    if (versionError) {
      return { error: versionError };
    }

    // 6. Update proposal status to review_rnd and optionally update project_title
    const updatePayload: Record<string, any> = {
      status: Status.REVIEW_RND,
      updated_at: new Date().toISOString(),
    };

    if (project_title) {
      updatePayload.project_title = project_title;
    }

    const { error: updateError } = await this.db.from("proposals").update(updatePayload).eq("id", proposal_id);

    if (updateError) {
      return { error: updateError };
    }

    // 7. Log the action to proposal_logs
    await this.db.from("proposal_logs").insert({
      proposal_id: proposal_id,
      action: "revision_submitted",
      performed_by: proponent_id,
      remarks: revision_response || `Submitted revision (version ${newVersionNumber})`,
    });

    return {
      data: {
        proposal_id,
        version_number: newVersionNumber,
        version_id: versionData.id,
        file_url: fileUrl,
        status: Status.REVIEW_RND,
      },
      error: null,
    };
  }

  async getRevisionSummary(proposal_id: number, proponent_id: string) {
    // 1. Verify access: User must be either the Proponent OR an assigned RND
    const { data: proposal, error: proposalError } = await this.db
      .from("proposals")
      .select("id, proponent_id")
      .eq("id", proposal_id)
      .maybeSingle();

    if (proposalError) {
      return { data: null, error: proposalError };
    }

    if (!proposal) {
      return { data: null, error: new Error("Proposal not found") };
    }

    // Check Proponent
    const isProponent = proposal.proponent_id === proponent_id;

    // Check RND (if not proponent)
    let isRnd = false;
    if (!isProponent) {
      const { data: rndEntry } = await this.db
        .from("proposal_rnd")
        .select("id")
        .eq("proposal_id", proposal_id)
        .eq("rnd_id", proponent_id)
        .maybeSingle();
      isRnd = !!rndEntry;
    }

    if (!isProponent && !isRnd) {
      return { data: null, error: new Error("Proposal not found or you don't have access") };
    }

    // 2. Now fetch the revision summary
    const { data, error } = await this.db
      .from("proposal_revision_summary")
      .select("*")
      .eq("proposal_id", proposal_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      return { data: null, error };
    }

    if (!data) {
      return { data: null, error: null };
    }

    // 3. Fetch RND user name separately
    let rnd_name = "Unknown";
    if (data.rnd_id) {
      const { data: rndUser } = await this.db
        .from("users")
        .select("first_name, last_name")
        .eq("id", data.rnd_id)
        .maybeSingle();

      if (rndUser) {
        rnd_name = `${rndUser.first_name || ""} ${rndUser.last_name || ""}`.trim() || "Unknown";
      }
    }

    return {
      data: {
        proposal_id: data.proposal_id,
        rnd_id: data.rnd_id,
        rnd_name,
        objective_comment: data.objective_comment,
        methodology_comment: data.methodology_comment,
        budget_comment: data.budget_comment,
        timeline_comment: data.timeline_comment,
        overall_comment: data.overall_comment,
        deadline: data.deadline,
        created_at: data.created_at,
      },
      error: null,
    };
  }

  async getRejectionSummary(proposal_id: number, requesting_user_id: string) {
    // 1. Verify access: User must be either the Proponent OR an assigned RND
    const { data: proposal, error: proposalError } = await this.db
      .from("proposals")
      .select("id, proponent_id")
      .eq("id", proposal_id)
      .maybeSingle();

    if (proposalError) {
      return { data: null, error: proposalError };
    }

    if (!proposal) {
      return { data: null, error: new Error("Proposal not found") };
    }

    // Check Proponent
    const isProponent = proposal.proponent_id === requesting_user_id;

    // Check RND (if not proponent)
    let isRnd = false;
    if (!isProponent) {
      const { data: rndEntry } = await this.db
        .from("proposal_rnd")
        .select("id")
        .eq("proposal_id", proposal_id)
        .eq("rnd_id", requesting_user_id)
        .maybeSingle();
      isRnd = !!rndEntry;
    }

    // Check Admin role (if not proponent or RND)
    let isAdmin = false;
    if (!isProponent && !isRnd) {
      const { data: userData } = await this.db
        .from("users")
        .select("role")
        .eq("id", requesting_user_id)
        .maybeSingle();
      isAdmin = userData?.role === "admin";
    }

    if (!isProponent && !isRnd && !isAdmin) {
      return { data: null, error: new Error("Proposal not found or you don't have access") };
    }

    // 2. Now fetch the rejection summary
    const { data, error } = await this.db
      .from("proposal_reject_summary")
      .select("*")
      .eq("proposal_id", proposal_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      return { data: null, error };
    }

    if (!data) {
      return { data: null, error: null };
    }


    // 3. Fetch RND user name and role separately
    let rnd_name = "Unknown";
    let rejected_by_role = "rnd"; // default to rnd
    if (data.rnd_id) {
      const { data: rndUser } = await this.db
        .from("users")
        .select("first_name, last_name, role")
        .eq("id", data.rnd_id)
        .maybeSingle();

      if (rndUser) {
        rnd_name = `${rndUser.first_name || ""} ${rndUser.last_name || ""}`.trim() || "Unknown";
        rejected_by_role = rndUser.role || "rnd";
      }
    }

    return {
      data: {
        proposal_id: data.proposal_id,
        rnd_id: data.rnd_id,
        rnd_name,
        rejected_by_role, // Add role to response
        comment: data.comment,
        created_at: data.created_at,
      },
      error: null,
    };
  }

  async getProposalVersions(proposal_id: number) {
    const { data, error } = await this.db
      .from("proposal_version")
      .select("id, file_url, created_at")
      .eq("proposal_id", proposal_id)
      .order("created_at", { ascending: true });

    if (error) {
      return { data: null, error };
    }

    return {
      data: {
        proposal_id,
        versions: data || [],
      },
      error: null,
    };
  }

  async getAssignmentTracker(proposal_id: number, user_sub: string, roles: string[]) {
    const isAdmin = roles.includes("admin");

    let query = this.db.from("proposal_assignment_tracker").select(
      `
        id,
        proposals:proposals(
          id,
          project_title
        ),
        evaluator_id:users(id, first_name, last_name, middle_ini, department_id:departments(name)),
        deadline_at,
        request_deadline_at,
        remarks,
        status,
        created_at
      `,
    );

    if (proposal_id) {
      query = query.eq("proposal_id", proposal_id);
    }

    const { data: trackerData, error } = await query;

    if (error) {
      return { data: null, error };
    }

    // Admin sees all tracker records; RND only sees evaluators they assigned
    let filtered = trackerData || [];

    // Filter by RND assignments if not admin
    if (!isAdmin) {
      let authQuery = this.db
        .from("proposal_evaluators")
        .select("proposal_id, evaluator_id")
        .eq("forwarded_by_rnd", user_sub);

      if (proposal_id) {
        authQuery = authQuery.eq("proposal_id", proposal_id);
      }

      const { data: allowedAssignments, error: authError } = await authQuery;

      if (!authError && allowedAssignments) {
        const allowedSet = new Set(
          allowedAssignments.map((a: any) => `${a.proposal_id}-${a.evaluator_id}`)
        );

        filtered = filtered.filter((row: any) => {
          const pId = row.proposals?.id;
          const eId = row.evaluator_id?.id;

          if (!pId || !eId) return false;
          return allowedSet.has(`${pId}-${eId}`);
        });
      }
    }

    const result = filtered.map((row: any) => {
      const cleanProposal = {
        id: row.proposals?.id,
        project_title: row.proposals?.project_title,
      };

      return {
        ...row,
        proposal_id: cleanProposal,
      };
    });

    return { data: result, error: null };
  }

  async handleExtensionRequest(input: HandleExtensionRequestInput, rnd_id: string) {
    const { proposal_id, evaluator_id, action, remarks } = input;

    // Fetch the tracker record to get the requested deadline
    const { data: tracker, error: fetchError } = await this.db
      .from("proposal_assignment_tracker")
      .select("id, deadline_at, request_deadline_at, status")
      .eq("proposal_id", proposal_id)
      .eq("evaluator_id", evaluator_id)
      .single();

    if (fetchError || !tracker) {
      return { error: fetchError || new Error("Extension request not found") };
    }

    if (tracker.status !== AssignmentTracker.EXTEND) {
      return { error: new Error("No pending extension request for this evaluator and proposal") };
    }

    if (action === ExtensionDecision.APPROVED) {
      const newDeadline = tracker.request_deadline_at;

      // 1. Update tracker: status to accept, deadline_at to the requested date
      const { error: trackerError } = await this.db
        .from("proposal_assignment_tracker")
        .update({ status: AssignmentTracker.ACCEPT, deadline_at: newDeadline })
        .eq("proposal_id", proposal_id)
        .eq("evaluator_id", evaluator_id);

      if (trackerError) return { error: trackerError };

      // 2. Update proposal_evaluators: status to for_review, deadline_at to the requested date
      const { error: evalError } = await this.db
        .from("proposal_evaluators")
        .update({
          status: EvaluatorStatus.FOR_REVIEW,
          deadline_at: newDeadline,
        })
        .eq("proposal_id", proposal_id)
        .eq("evaluator_id", evaluator_id);

      if (evalError) return { error: evalError };

      // 3. Insert notification
      await this.db.from("notifications").insert({
        user_id: evaluator_id,
        message: `Your extension request for proposal #${proposal_id} has been approved.`,
      });

      // 4. Insert proposal log
      await this.db.from("proposal_logs").insert({
        proposal_id,
        action: "extension_approved",
        performed_by: rnd_id,
        remarks: remarks || "Extension request approved",
      });

      return { data: { proposal_id, evaluator_id, action }, error: null };
    } else if (action === ExtensionDecision.DENIED) {
      // 1. Reset tracker status to pending, clear request_deadline_at
      const { error: trackerError } = await this.db
        .from("proposal_assignment_tracker")
        .update({ status: AssignmentTracker.PENDING, request_deadline_at: null })
        .eq("proposal_id", proposal_id)
        .eq("evaluator_id", evaluator_id);

      if (trackerError) return { error: trackerError };

      // 2. proposal_evaluators stays pending (no change needed)

      // 3. Insert notification
      await this.db.from("notifications").insert({
        user_id: evaluator_id,
        message: `Your extension request for proposal #${proposal_id} has been denied. You may accept with the original deadline or decline.`,
      });

      // 4. Insert proposal log
      await this.db.from("proposal_logs").insert({
        proposal_id,
        action: "extension_denied",
        performed_by: rnd_id,
        remarks: remarks || "Extension request denied",
      });

      return { data: { proposal_id, evaluator_id, action }, error: null };
    }

    return { error: new Error("Invalid decision") };
  }
}
