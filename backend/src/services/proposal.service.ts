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
  ProponentExtensionStatus,
} from "../types/proposal";
import { logActivity } from "../utils/activity-logger";
import {
  decisionEvaluatorToProposalInput,
  EndorseForFundingInput,
  ForwardToEvaluatorsInput,
  ForwardToRndInput,
  FundingDecisionInput,
  FundingDecisionType,
  HandleExtensionRequestInput,
  ProposalInput,
  ProposalVersionInput,
  rejectProposalToProponentInput,
  revisionProposalToProponentInput,
  createEvaluationScoresToProposaltInput,
  SubmitRevisedProposalInput,
  RequestProponentExtensionInput,
  ReviewProponentExtensionInput,
  RequestRndTransferInput,
  RespondRndTransferInput,
  ApproveRndTransferInput,
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

  // `strict: true` means an unrecognized name returns null instead of creating
  // a new lookup row. Use it for admin-managed taxonomies (sectors, disciplines,
  // funding agencies) where silent auto-creation would pollute the list. The
  // handler above this layer surfaces the null as a validation error.
  private async resolveLookupId(args: {
    table: Table;
    value: IdOrName;
    nameColumn?: string; // defaults to "name"
    strict?: boolean;
  }): Promise<number | null> {
    const { table, value, strict = false } = args;
    const nameColumn = args.nameColumn ?? "name";

    // already an id -> use directly
    if (isId(value)) return value;

    // string -> treat as new/existing name
    const name = cleanName(value);
    if (!name) return null;

    // numeric string (e.g. "5") -> treat as ID, not as a name
    const parsed = Number(name);
    if (Number.isFinite(parsed) && parsed > 0 && Number.isInteger(parsed)) {
      return parsed;
    }

    // 1) try to find existing
    const existing = await this.db.from(table).select("id").eq(nameColumn, name).maybeSingle();

    if (existing.data?.id) return existing.data.id;

    // 2) strict lookups never auto-create — return null so the caller can reject.
    if (strict) return null;

    // 3) non-strict: insert new and return id
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

    // Admin-managed taxonomies — reject unknown names instead of silently
    // inserting them into the lookup. The proponent form must submit a real
    // FK; this is a backstop against a stale payload or bypassed frontend.
    const sector_id = await this.resolveLookupId({
      table: Table.SECTORS,
      value: sector,
      strict: true,
    });
    if (sector_id == null) {
      throw new Error(`Unknown sector: "${sector}". Please pick one from the list or contact admin to add it.`);
    }

    const discipline_id = await this.resolveLookupId({
      table: Table.DISCIPLINES,
      value: discipline,
      strict: true,
    });
    if (discipline_id == null) {
      throw new Error(`Unknown discipline: "${discipline}". Please pick one from the list or contact admin to add it.`);
    }

    const agency_id = await this.resolveLookupId({
      table: Table.AGENCIES,
      value: agency,
      strict: true,
    });
    if (agency_id == null) {
      throw new Error(`Unknown funding agency: "${agency}". Please pick one from the list or contact admin to add it.`);
    }

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
    // Verify every submitted tag_id exists in `tags` before we insert into the
    // join table. The frontend's AI "Other" fallback used to fabricate a
    // Date.now() id on cache miss, which passed the client-side check but
    // crashed here with a 500 (proposal_tags_tag_fk). Drop unknown ids
    // silently instead of blowing up mid-transaction.
    if (Array.isArray(tags) && tags.length > 0) {
      const rawTagIds = Array.from(new Set(tags)).filter(
        (id): id is number => typeof id === "number" && Number.isFinite(id),
      );
      let validTagIds: number[] = [];
      if (rawTagIds.length > 0) {
        const { data: existingTags } = await this.db
          .from("tags")
          .select("id")
          .in("id", rawTagIds);
        const found = new Set((existingTags ?? []).map((t: { id: number }) => t.id));
        validTagIds = rawTagIds.filter((id) => found.has(id));
      }
      if (validTagIds.length > 0) {
        const tagRows = validTagIds.map((tagId) => ({ proposal_id, tag_id: tagId }));
        const tagJoin = await this.db.from("proposal_tags").insert(tagRows);
        if (tagJoin.error) throw new Error(`proposal_tags upsert failed: ${tagJoin.error.message}`);
      }
    }

    // Cooperating agencies split into two buckets per the new schema:
    //   - FK row (agency_id): proponent picked an admin-managed agency
    //   - free-text row (agency_name_text): an external partner not in the
    //     lookup (e.g. local barangay council, NGO, private firm). Strict: true
    //     on resolveLookupId so we never pollute the `agencies` table.
    const fkIds = new Set<number>();
    const freeTexts = new Set<string>();

    for (const v of cooperating_agencies ?? []) {
      if (isId(v)) {
        if (!agency_id || v !== agency_id) fkIds.add(v);
        continue;
      }
      const name = cleanName(v);
      if (!name) continue;
      // Numeric string → treat as id for back-compat
      const parsed = Number(name);
      if (Number.isFinite(parsed) && parsed > 0 && Number.isInteger(parsed)) {
        if (!agency_id || parsed !== agency_id) fkIds.add(parsed);
        continue;
      }
      // Name string → look up strictly; unresolved names go to free text
      const match = await this.resolveLookupId({
        table: Table.AGENCIES,
        value: name,
        strict: true,
      });
      if (match != null) {
        if (!agency_id || match !== agency_id) fkIds.add(match);
      } else {
        freeTexts.add(name);
      }
    }

    const coopRows: Array<{ proposal_id: number; agency_id: number | null; agency_name_text: string | null }> = [
      ...Array.from(fkIds).map((id) => ({ proposal_id, agency_id: id, agency_name_text: null })),
      ...Array.from(freeTexts).map((name) => ({ proposal_id, agency_id: null, agency_name_text: name })),
    ];

    if (coopRows.length > 0) {
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

    // BUDGET JOIN — Phase 1 of LIB feature (with Phase 4 legacy-write retained).
    // Writes to the new structured tables (proposal_budget_versions + proposal_budget_items) AND
    // mirrors to the legacy estimated_budget table. The mirror is kept because ~15 proposal read
    // paths (R&D endorsement, evaluator views, admin proposals, proponent Profile, etc.) still
    // SELECT estimated_budget. Migrating those reads is its own follow-up; until then, dropping
    // the write here would make every new proposal show ₱0 on those screens.
    if (Array.isArray(budget) && budget.length > 0) {
      const categories = [Budget.PS, Budget.MOOE, Budget.CO] as const;

      let grand_total = 0;
      for (const entry of budget) {
        for (const category of categories) {
          for (const line of entry.budget[category] ?? []) {
            grand_total += Number(line.totalAmount) || 0;
          }
        }
      }

      const versionInsert = await this.db
        .from("proposal_budget_versions")
        .insert({
          proposal_id,
          version_number: 1,
          grand_total,
          created_by: proposal.proponent_id,
        })
        .select("id")
        .single();

      if (versionInsert.error || !versionInsert.data) {
        throw new Error(
          `proposal_budget_versions insert failed: ${versionInsert.error?.message ?? "no data returned"}`,
        );
      }
      const version_id = versionInsert.data.id as number;

      const item_rows: Array<Record<string, unknown>> = [];
      let display_order = 0;
      for (const entry of budget) {
        const source = entry.source;
        for (const category of categories) {
          for (const line of entry.budget[category] ?? []) {
            display_order += 1;
            item_rows.push({
              version_id,
              source,
              category,
              subcategory_id: line.subcategoryId ?? null,
              custom_subcategory_label: line.customSubcategoryLabel ?? null,
              item_name: line.itemName,
              spec: line.spec ?? null,
              quantity: line.quantity,
              unit: line.unit ?? null,
              unit_price: line.unitPrice,
              total_amount: line.totalAmount,
              display_order,
            });
          }
        }
      }

      if (item_rows.length > 0) {
        const itemInsert = await this.db.from("proposal_budget_items").insert(item_rows);
        if (itemInsert.error) {
          throw new Error(`proposal_budget_items insert failed: ${itemInsert.error.message}`);
        }
      }

      // Legacy mirror so existing read paths keep returning the budget for new proposals
      // until every consumer is migrated to read from proposal_budget_items instead.
      const legacy_rows = budget.flatMap((entry) => {
        const source = entry.source;
        const toRows = (category: Budget) =>
          (entry.budget[category] ?? []).map((line) => ({
            proposal_id,
            source,
            budget: category,
            item: line.itemName,
            amount: line.totalAmount,
          }));
        return [...toRows(Budget.PS), ...toRows(Budget.MOOE), ...toRows(Budget.CO)];
      });

      if (legacy_rows.length > 0) {
        const legacy_join = await this.db.from("estimated_budget").insert(legacy_rows);
        if (legacy_join.error) throw new Error(`estimated_budget insert failed: ${legacy_join.error.message}`);
      }
    }

    // PRIORITIES JOIN
    if (Array.isArray(priorities_id) && priorities_id.length > 0) {
      const priorityIds = Array.from(new Set(priorities_id));
      const priorityRows = priorityIds.map((priority_id) => ({ proposal_id, priority_id }));

      const priorityJoin = await this.db.from("proposal_priorities").insert(priorityRows);

      if (priorityJoin.error) throw new Error(`proposal_priorities insert failed: ${priorityJoin.error.message}`);
    }

    await logActivity(this.db, {
      user_id: proposal.proponent_id,
      action: "proposal_created",
      category: "proposal",
      target_id: String(proposal_id),
      target_type: "proposal",
      details: { project_title: proposal.project_title },
    });

    return { data: insertRes.data, error: insertRes.error };
  }

  // Saves link from aws S3 to proposal version and points the proposal at it
  // as the current version, so active-side queries always see this row as live.
  async createVersion(payload: ProposalVersionInput) {
    const { data, error } = await this.db
      .from("proposal_version")
      .insert({
        proposal_id: payload.proposal_id,
        file_url: payload.file_url,
      })
      .select()
      .single();

    if (error || !data) {
      return { data, error };
    }

    const { error: pointerError } = await this.db
      .from("proposals")
      .update({ current_version_id: data.id })
      .eq("id", payload.proposal_id);

    if (pointerError) {
      return { data: null, error: pointerError };
    }

    return { data, error: null };
  }

  async forwardToEvaluators(input: ForwardToEvaluatorsInput, rnd_id: string) {
    const { proposal_id, evaluators, deadline_at, commentsForEvaluators, anonymized_file_url } = input;

    // Validate proposal status + capture current_version_id so every inserted
    // assignment row is scoped to the version R&D is forwarding for review.
    const { data: proposal, error: fetchError } = await this.db
      .from("proposals")
      .select("status, current_version_id")
      .eq("id", proposal_id)
      .single();

    if (fetchError || !proposal) {
      return { error: fetchError || new Error("Proposal not found"), assignments: null };
    }

    const allowedStatuses = [
      Status.REVIEW_RND,
      Status.PENDING,
      Status.REVISED_PROPOSAL,
      Status.UNDER_EVALUATION,
    ];

    if (!allowedStatuses.includes(proposal.status as Status)) {
      return {
        error: new Error(
          `Cannot assign evaluators: proposal is in '${proposal.status}' status. Evaluators can only be assigned when proposal is pending review or under evaluation.`
        ),
        assignments: null,
      };
    }


    let currentVersionId: number | null = proposal.current_version_id as number | null;

    if (!currentVersionId) {
      const { data: latestVersion } = await this.db
        .from("proposal_version")
        .select("id")
        .eq("proposal_id", proposal_id)
        .order("id", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (latestVersion?.id) {

        currentVersionId = latestVersion.id;
        await this.db.from("proposals").update({ current_version_id: currentVersionId }).eq("id", proposal_id);
      }
    }

    let existingQuery = this.db
      .from("proposal_evaluators")
      .select("evaluator_id, proponent_info_visibility, anonymized_file_url")
      .eq("proposal_id", proposal_id);
    if (currentVersionId) {
      existingQuery = existingQuery.eq("proposal_version_id", currentVersionId);
    }
    const { data: existingAssignments } = await existingQuery;

    const existingIds = new Set((existingAssignments || []).map((a) => a.evaluator_id));
    const newEvaluators = evaluators.filter((ev) => !existingIds.has(ev.id));

    // When adding/replacing evaluators on a proposal that is already under
    // evaluation, preserve the active blind-review settings instead of letting
    // the caller silently reset visibility back to "both".
    const inheritedAssignmentConfig = (existingAssignments || []).find((assignment) => {
      const visibility = assignment.proponent_info_visibility;
      return (visibility && visibility !== "both") || !!assignment.anonymized_file_url;
    }) || existingAssignments?.[0];

    const inheritedVisibility = inheritedAssignmentConfig?.proponent_info_visibility || undefined;
    const inheritedAnonymizedFileUrl = inheritedAssignmentConfig?.anonymized_file_url || undefined;

    if (newEvaluators.length === 0) {
      return { 
        error: new Error("All selected evaluators are already assigned to this proposal version."), 
        assignments: null 
      };
    }

    const deadline_number_weeks = new Date();
    deadline_number_weeks.setDate(deadline_number_weeks.getDate() + deadline_at);

    const assignmentsPayload = newEvaluators.map((ev) => ({
      proposal_id: proposal_id,
      proposal_version_id: currentVersionId,
      evaluator_id: ev.id,
      forwarded_by_rnd: rnd_id,
      deadline_at: deadline_number_weeks.toISOString(),
      comments_for_evaluators: commentsForEvaluators ?? null,
      status: EvaluatorStatus.PENDING,
      proponent_info_visibility: inheritedVisibility || ev.visibility || "both",
      ...((anonymized_file_url || inheritedAnonymizedFileUrl)
        ? { anonymized_file_url: anonymized_file_url || inheritedAnonymizedFileUrl }
        : {}),
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

    const assignmentsTrackerPayload = newEvaluators.map((ev) => ({
      proposal_id: proposal_id,
      proposal_version_id: currentVersionId,
      evaluator_id: ev.id,
      status: AssignmentTracker.PENDING,
    }));

    const { error: insertv2Error } = await this.db
      .from("proposal_assignment_tracker")
      .insert(assignmentsTrackerPayload);

    if (insertv2Error) {
      return { error: insertv2Error, assignments: null };
    }

    // Fetch evaluator names for history logging
    const evalIds = newEvaluators.map((ev) => ev.id);
    const { data: evalUsers } = await this.db
      .from("users")
      .select("id, first_name, last_name")
      .in("id", evalIds);
    const evalNameMap = new Map((evalUsers || []).map((u) => [u.id, `${u.first_name || ""} ${u.last_name || ""}`.trim()]));

    // Log one entry per evaluator for granular history
    for (const ev of newEvaluators) {
      await logActivity(this.db, {
        user_id: rnd_id,
        action: "evaluator_assigned",
        category: "evaluation",
        target_id: String(proposal_id),
        target_type: "proposal",
        details: {
          evaluator_id: ev.id,
          evaluator_name: evalNameMap.get(ev.id) || "Unknown",
          evaluator_count: newEvaluators.length,
        },
      });
    }

    return {
      error: null,
      assignments,
    };
  }

  async removeEvaluator(proposal_id: number, evaluator_id: string) {
    // Validate proposal status + capture current version so the removal only
    // affects the live assignment, never a historical v1 row for the same
    // (proposal, evaluator).
    const { data: proposal, error: fetchError } = await this.db
      .from("proposals")
      .select("status, current_version_id")
      .eq("id", proposal_id)
      .single();

    if (fetchError || !proposal) {
      return { error: fetchError || new Error("Proposal not found") };
    }

    if (proposal.status !== Status.UNDER_EVALUATION) {
      return {
        error: new Error(
          `Cannot remove evaluator: proposal is in '${proposal.status}' status. Evaluators can only be removed when proposal is under evaluation.`
        ),
      };
    }

    if (!proposal.current_version_id) {
      return { error: new Error("Proposal has no current version.") };
    }

    const currentVersionId = proposal.current_version_id as number;

    // Fetch evaluator name before deletion for history logging
    const { data: removedUser } = await this.db
      .from("users")
      .select("first_name, last_name")
      .eq("id", evaluator_id)
      .single();
    const removedName = removedUser ? `${removedUser.first_name || ""} ${removedUser.last_name || ""}`.trim() : "Unknown";

    // Fetch tracker remarks (decline reason) before deletion for history
    const { data: trackerRecord } = await this.db
      .from("proposal_assignment_tracker")
      .select("status, remarks")
      .eq("proposal_id", proposal_id)
      .eq("evaluator_id", evaluator_id)
      .eq("proposal_version_id", currentVersionId)
      .single();

    // 1. Remove from proposal_evaluators — current version only
    const { error: evalError } = await this.db
      .from("proposal_evaluators")
      .delete()
      .eq("proposal_id", proposal_id)
      .eq("evaluator_id", evaluator_id)
      .eq("proposal_version_id", currentVersionId);

    if (evalError) return { error: evalError };

    // 2. Remove from proposal_assignment_tracker — current version only
    const { error: trackerError } = await this.db
      .from("proposal_assignment_tracker")
      .delete()
      .eq("proposal_id", proposal_id)
      .eq("evaluator_id", evaluator_id)
      .eq("proposal_version_id", currentVersionId);

    if (trackerError) return { error: trackerError };

    await logActivity(this.db, {
      user_id: evaluator_id,
      action: "evaluator_removed",
      category: "evaluation",
      target_id: String(proposal_id),
      target_type: "proposal",
      details: {
        evaluator_id,
        evaluator_name: removedName,
        previous_status: trackerRecord?.status || null,
        remarks: trackerRecord?.remarks || null,
      },
    });

    return { error: null };
  }

  async decisionEvaluatorToProposal(
    input: Omit<decisionEvaluatorToProposalInput, "deadline_at">,
    evaluator_id: string,
    deadline_at?: string,
  ) {
    // Scope this evaluator's decision to the CURRENT proposal version, so old
    // v1 rows are never accidentally updated when the evaluator accepts or
    // declines v2.
    const { data: proposalRow, error: proposalErr } = await this.db
      .from("proposals")
      .select("current_version_id")
      .eq("id", input.proposal_id)
      .single();

    if (proposalErr || !proposalRow?.current_version_id) {
      return {
        error: proposalErr || new Error("Proposal has no current version."),
      };
    }

    const currentVersionId = proposalRow.current_version_id as number;

    const { data: insertedData, error: insertError } = await this.db
      .from("proposal_assignment_tracker")
      .update({ ...input, evaluator_id })
      .eq("evaluator_id", evaluator_id)
      .eq("proposal_id", input.proposal_id)
      .or(`proposal_version_id.eq.${currentVersionId},proposal_version_id.is.null`);

    if (insertError) {
      return { error: insertError };
    }

    if (input.status === AssignmentTracker.EXTEND) {
      const { error: insertError } = await this.db
        .from("proposal_assignment_tracker")
        .update({ request_deadline_at: deadline_at })
        .eq("evaluator_id", evaluator_id)
        .eq("proposal_id", input.proposal_id)
        .or(`proposal_version_id.eq.${currentVersionId},proposal_version_id.is.null`);

      if (insertError) {
        return { error: insertError };
      }
    }

    if (input.status === AssignmentTracker.ACCEPT) {
      const { error: updateError } = await this.db
        .from("proposal_evaluators")
        .update({ status: EvaluatorStatus.FOR_REVIEW })
        .eq("evaluator_id", evaluator_id)
        .eq("proposal_id", input.proposal_id)
        .or(`proposal_version_id.eq.${currentVersionId},proposal_version_id.is.null`);

      if (updateError) {
        return { error: updateError };
      }
    } else if (input.status === AssignmentTracker.EXTEND) {
      const { error: updateError } = await this.db
        .from("proposal_evaluators")
        .update({ status: EvaluatorStatus.EXTEND })
        .eq("evaluator_id", evaluator_id)
        .eq("proposal_id", input.proposal_id)
        .or(`proposal_version_id.eq.${currentVersionId},proposal_version_id.is.null`);

      if (updateError) {
        return { error: updateError };
      }
    } else if (input.status === AssignmentTracker.DECLINE) {
      const { error: updateError } = await this.db
        .from("proposal_evaluators")
        .update({ status: EvaluatorStatus.DECLINE })
        .eq("evaluator_id", evaluator_id)
        .eq("proposal_id", input.proposal_id)
        .or(`proposal_version_id.eq.${currentVersionId},proposal_version_id.is.null`);

      if (updateError) {
        return { error: updateError };
      }
    }

    const decisionMap: Record<string, string> = {
      [AssignmentTracker.ACCEPT]: "evaluator_accepted",
      [AssignmentTracker.DECLINE]: "evaluator_declined",
      [AssignmentTracker.EXTEND]: "evaluator_extension_requested",
    };

    // Fetch evaluator name for history logging
    const { data: decisionUser } = await this.db
      .from("users")
      .select("first_name, last_name")
      .eq("id", evaluator_id)
      .single();
    const decisionUserName = decisionUser ? `${decisionUser.first_name || ""} ${decisionUser.last_name || ""}`.trim() : "Unknown";

    await logActivity(this.db, {
      user_id: evaluator_id,
      action: decisionMap[input.status] || `evaluator_decision_${input.status}`,
      category: "evaluation",
      target_id: String(input.proposal_id),
      target_type: "proposal",
      details: {
        decision: input.status,
        evaluator_id,
        evaluator_name: decisionUserName,
        remarks: input.remarks || null,
        requested_deadline: deadline_at || null,
      },
    });

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

    // Log for each assigned RND (use the first one as the actor)
    for (const id of rnd_id) {
      await logActivity(this.db, {
        user_id: id,
        action: "proposal_forwarded_to_rnd",
        category: "proposal",
        target_id: String(proposal_id),
        target_type: "proposal",
        details: { rnd_count: rnd_id.length },
      });
    }

    return {
      error: null,
      assignments,
    };
  }

  /**
   * Find the least-loaded available RND user in the given department.
   * "Load" = number of active proposals (status review_rnd or under_evaluation) in proposal_rnd.
   */
  async getLeastLoadedRnd(departmentId: number) {
    // 1. Get eligible RND users (not disabled, matching department)
    const { data: rndUsers, error: rndError } = await this.db
      .from("users")
      .select("id")
      .contains("roles", ["rnd"])
      .eq("is_disabled", false)
      .eq("department_id", departmentId);

    if (rndError) return { data: null, error: rndError };
    if (!rndUsers || rndUsers.length === 0) return { data: null, error: null };

    // 2. For each candidate, count active proposals
    const candidates: { id: string; load: number }[] = [];
    for (const rnd of rndUsers) {
      const { count, error: countError } = await this.db
        .from("proposal_rnd")
        .select("proposals!inner(id, status)", { count: "exact", head: true })
        .eq("rnd_id", rnd.id)
        .in("proposals.status", ["review_rnd", "under_evaluation"]);

      if (countError) continue;
      candidates.push({ id: rnd.id, load: count || 0 });
    }

    if (candidates.length === 0) return { data: null, error: null };

    // 3. Pick the one with fewest. If tied, random among tied.
    const minLoad = Math.min(...candidates.map((c) => c.load));
    const tied = candidates.filter((c) => c.load === minLoad);
    const selected = tied[Math.floor(Math.random() * tied.length)];

    return { data: { id: selected.id, load: selected.load }, error: null };
  }

  /**
   * Auto-distribute pending proposals to RND staff evenly per department.
   * If proposalIds is provided, only those proposals are distributed.
   * Otherwise, ALL proposals with status 'pending' are distributed.
   */
  async autoDistribute(proposalIds?: number[]) {
    // 1. Fetch target proposals
    let query = this.db
      .from("proposals")
      .select("id, department_id")
      .eq("status", Status.PENDING);

    if (proposalIds && proposalIds.length > 0) {
      query = query.in("id", proposalIds);
    }

    const { data: proposals, error: fetchError } = await query;
    if (fetchError) return { data: null, error: fetchError };
    if (!proposals || proposals.length === 0) {
      return { data: { distributed: 0, results: [] }, error: null };
    }

    // 2. Group proposals by department
    const byDepartment = new Map<number, number[]>();
    for (const p of proposals) {
      if (!p.department_id) continue;
      const list = byDepartment.get(p.department_id) || [];
      list.push(p.id);
      byDepartment.set(p.department_id, list);
    }

    // 3. For each department, distribute evenly across RND staff
    const results: { proposal_id: number; rnd_id: string; rnd_load: number }[] = [];
    const errors: { proposal_id: number; reason: string }[] = [];

    for (const [departmentId, pIds] of byDepartment) {
      // Get all eligible RND users for this department
      const { data: rndUsers, error: rndError } = await this.db
        .from("users")
        .select("id")
        .contains("roles", ["rnd"])
        .eq("is_disabled", false)
        .eq("department_id", departmentId);

      if (rndError || !rndUsers || rndUsers.length === 0) {
        for (const pid of pIds) {
          errors.push({ proposal_id: pid, reason: "No eligible RND staff in department" });
        }
        continue;
      }

      // Build load map for each RND
      const loadMap = new Map<string, number>();
      for (const rnd of rndUsers) {
        const { count } = await this.db
          .from("proposal_rnd")
          .select("proposals!inner(id, status)", { count: "exact", head: true })
          .eq("rnd_id", rnd.id)
          .in("proposals.status", ["review_rnd", "under_evaluation"]);
        loadMap.set(rnd.id, count || 0);
      }

      // Assign each proposal to the least-loaded RND, updating load as we go
      for (const pid of pIds) {
        // Pick the RND with minimum load
        let minLoad = Infinity;
        let candidates: string[] = [];
        for (const [id, load] of loadMap) {
          if (load < minLoad) {
            minLoad = load;
            candidates = [id];
          } else if (load === minLoad) {
            candidates.push(id);
          }
        }

        if (candidates.length === 0) {
          errors.push({ proposal_id: pid, reason: "No eligible RND staff" });
          continue;
        }

        const selectedId = candidates[Math.floor(Math.random() * candidates.length)];

        // Forward the proposal
        const { error: fwdError } = await this.forwardToRnd({ proposal_id: pid, rnd_id: [selectedId] });
        if (fwdError) {
          errors.push({ proposal_id: pid, reason: String(fwdError.message || fwdError) });
          continue;
        }

        results.push({ proposal_id: pid, rnd_id: selectedId, rnd_load: minLoad });

        // Increment load so the next proposal goes to the next-least-loaded RND
        loadMap.set(selectedId, (loadMap.get(selectedId) || 0) + 1);
      }
    }

    return {
      data: { distributed: results.length, results, errors },
      error: null,
    };
  }

  /**
   * Request a transfer of a proposal from one RND to another.
   * If the proposal has already been transferred once, escalate to admin.
   */
  async requestRndTransfer(input: RequestRndTransferInput & { from_rnd_id: string }) {
    const { proposal_id, to_rnd_id, reason, from_rnd_id } = input;

    // Validate from_rnd is current assignee
    const { data: assignment, error: assignErr } = await this.db
      .from("proposal_rnd")
      .select("rnd_id")
      .eq("proposal_id", proposal_id)
      .eq("rnd_id", from_rnd_id)
      .maybeSingle();

    if (assignErr) return { data: null, error: assignErr };
    if (!assignment) return { data: null, error: { message: "You are not the current RND assignee for this proposal" } };

    // Validate target RND is not disabled
    const { data: targetUser, error: targetErr } = await this.db
      .from("users")
      .select("id, is_disabled, department_id")
      .eq("id", to_rnd_id)
      .maybeSingle();

    if (targetErr) return { data: null, error: targetErr };
    if (!targetUser) return { data: null, error: { message: "Target RND user not found" } };
    if (targetUser.is_disabled) return { data: null, error: { message: "Target RND user is disabled" } };

    // Check proposal department matches target RND department
    const { data: proposal, error: propErr } = await this.db
      .from("proposals")
      .select("department_id")
      .eq("id", proposal_id)
      .maybeSingle();

    if (propErr) return { data: null, error: propErr };
    if (!proposal) return { data: null, error: { message: "Proposal not found" } };
    if (proposal.department_id !== targetUser.department_id) {
      return { data: null, error: { message: "Target RND must be in the same department as the proposal" } };
    }

    // Count accepted transfers for this proposal — if >= 1, escalate to admin
    const { count: acceptedCount, error: countErr } = await this.db
      .from("proposal_rnd_transfers")
      .select("*", { count: "exact", head: true })
      .eq("proposal_id", proposal_id)
      .eq("status", "accepted");

    if (countErr) return { data: null, error: countErr };

    const status = (acceptedCount || 0) >= 1 ? "admin_required" : "pending";

    const { data: transfer, error: insertErr } = await this.db
      .from("proposal_rnd_transfers")
      .insert({
        proposal_id,
        from_rnd_id,
        to_rnd_id,
        reason,
        status,
      })
      .select()
      .single();

    if (insertErr) return { data: null, error: insertErr };

    return { data: transfer, error: null };
  }

  /**
   * Target RND responds to a transfer request (accept/decline).
   */
  async respondRndTransfer(input: RespondRndTransferInput & { responder_id: string }) {
    const { transfer_id, status, responder_id } = input;

    // Fetch transfer
    const { data: transfer, error: fetchErr } = await this.db
      .from("proposal_rnd_transfers")
      .select("*")
      .eq("id", transfer_id)
      .eq("status", "pending")
      .maybeSingle();

    if (fetchErr) return { data: null, error: fetchErr };
    if (!transfer) return { data: null, error: { message: "Transfer request not found or already processed" } };
    if (transfer.to_rnd_id !== responder_id) {
      return { data: null, error: { message: "Only the target RND can respond to this transfer" } };
    }

    if (status === "accepted") {
      // Reassign the proposal
      await this.forwardToRnd({ proposal_id: transfer.proposal_id, rnd_id: [transfer.to_rnd_id] });
    }

    const { data: updated, error: updateErr } = await this.db
      .from("proposal_rnd_transfers")
      .update({
        status,
        responded_at: new Date().toISOString(),
      })
      .eq("id", transfer_id)
      .select()
      .single();

    if (updateErr) return { data: null, error: updateErr };

    return { data: updated, error: null };
  }

  /**
   * Admin approves/declines an escalated transfer (status = admin_required).
   */
  async approveRndTransfer(input: ApproveRndTransferInput & { admin_id: string }) {
    const { transfer_id, status, review_note, admin_id } = input;

    const { data: transfer, error: fetchErr } = await this.db
      .from("proposal_rnd_transfers")
      .select("*")
      .eq("id", transfer_id)
      .eq("status", "admin_required")
      .maybeSingle();

    if (fetchErr) return { data: null, error: fetchErr };
    if (!transfer) return { data: null, error: { message: "Transfer request not found or not escalated to admin" } };

    if (status === "accepted") {
      await this.forwardToRnd({ proposal_id: transfer.proposal_id, rnd_id: [transfer.to_rnd_id] });
    }

    const { data: updated, error: updateErr } = await this.db
      .from("proposal_rnd_transfers")
      .update({
        status,
        reviewed_by: admin_id,
        review_note: review_note || null,
        responded_at: new Date().toISOString(),
      })
      .eq("id", transfer_id)
      .select()
      .single();

    if (updateErr) return { data: null, error: updateErr };

    return { data: updated, error: null };
  }

  /**
   * Get transfer requests, optionally filtered by proposal or RND user.
   */
  async getRndTransfers(filters?: { proposal_id?: number; rnd_id?: string; status?: string }) {
    let query = this.db
      .from("proposal_rnd_transfers")
      .select(`
        *,
        from_rnd:users!proposal_rnd_transfers_from_rnd_id_fkey(id, first_name, last_name, email),
        to_rnd:users!proposal_rnd_transfers_to_rnd_id_fkey(id, first_name, last_name, email),
        proposals(id, project_title)
      `)
      .order("created_at", { ascending: false });

    if (filters?.proposal_id) {
      query = query.eq("proposal_id", filters.proposal_id);
    }
    if (filters?.rnd_id) {
      query = query.or(`from_rnd_id.eq.${filters.rnd_id},to_rnd_id.eq.${filters.rnd_id}`);
    }
    if (filters?.status) {
      query = query.eq("status", filters.status);
    }

    const { data, error } = await query;
    return { data, error };
  }

  async revisionProposalToProponent(input: revisionProposalToProponentInput, rnd_id: string) {
    // Store created_at in UTC so "deadline = created_at + N days" is exactly 24*N hours everywhere
    const created_at = new Date().toISOString();
    const { data, error: insertError } = await this.db
      .from("proposal_revision_summary")
      .insert({
        ...input,
        included_evaluator_ids: input.included_evaluator_ids ?? [],
        rnd_id,
        created_at,
      });

    if (insertError) return { error: insertError };

    const { error: updateError } = await this.db
      .from("proposals")
      .update({
        status: Status.REVISION_RND,
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.proposal_id);

    if (updateError) return { error: updateError };

    await logActivity(this.db, {
      user_id: rnd_id,
      action: "proposal_revision_requested",
      category: "proposal",
      target_id: String(input.proposal_id),
      target_type: "proposal",
    });

    return { data };
  }

  async rejectProposalToProponent(input: rejectProposalToProponentInput, rnd_id: string) {
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

    await logActivity(this.db, {
      user_id: rnd_id,
      action: "proposal_rejected",
      category: "proposal",
      target_id: String(input.proposal_id),
      target_type: "proposal",
    });

    return { data };
  }

  async createEvaluationScoresToProposal(
    input: Omit<createEvaluationScoresToProposaltInput, "status">,
    status: EvaluatorFinalDecision,
    evaluator_id: string,
  ) {
    const normalizedComment =
      typeof input.comment === "string" && input.comment.trim().length > 0
        ? input.comment.trim()
        : null;

    // Look up the evaluator's live assignment row so the score attaches to the
    // exact version they were asked to review. Without this, a late v1 submission
    // could silently land against v2 after a revision.
    const { data: assignment, error: assignmentError } = await this.db
      .from("proposal_evaluators")
      .select("id, proposal_version_id")
      .eq("proposal_id", input.proposal_id)
      .eq("evaluator_id", evaluator_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (assignmentError) {
      return { data: null, error: assignmentError };
    }

    if (!assignment || !assignment.proposal_version_id) {
      return {
        data: null,
        error: new Error("Evaluator has no active assignment for this proposal."),
      };
    }

    const proposal_version_id = assignment.proposal_version_id as number;

    // Insert evaluation score tagged with the version the assignment was made for.
    const { data, error } = await this.db
      .from("evaluation_scores")
      .insert({ ...input, comment: normalizedComment, evaluator_id, proposal_version_id });

    if (error) {
      return { data: null, error };
    }

    // Update proposal_evaluators status to approve/revise/reject.
    // Scope the update to the specific assignment row (via its id) so historical
    // rows for earlier versions of the same proposal are never touched.
    if (
      status === EvaluatorFinalDecision.APPROVE ||
      status === EvaluatorFinalDecision.REVISE ||
      status === EvaluatorFinalDecision.REJECT
    ) {
      const { error: updateError } = await this.db
        .from("proposal_evaluators")
        .update({ status: status, updated_at: new Date().toISOString() })
        .eq("id", assignment.id);

      if (updateError) {
        return { data: null, error: updateError };
      }
    }

    // Fetch evaluator name for history logging
    const { data: scoreUser } = await this.db
      .from("users")
      .select("first_name, last_name")
      .eq("id", evaluator_id)
      .single();
    const scoreUserName = scoreUser ? `${scoreUser.first_name || ""} ${scoreUser.last_name || ""}`.trim() : "Unknown";

    await logActivity(this.db, {
      user_id: evaluator_id,
      action: "evaluation_scores_submitted",
      category: "evaluation",
      target_id: String(input.proposal_id),
      target_type: "proposal",
      details: {
        decision: status,
        evaluator_id,
        evaluator_name: scoreUserName,
      },
    });

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

    // Always exclude disabled users
    query = query.eq("is_disabled", false);

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
          photo_profile_url: u.photo_profile_url,
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
      cooperating_agencies(agency_name_text, agencies(name)),
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
      proposal_budget_versions(id, version_number, proposal_budget_items(id, category, subcategory_id, custom_subcategory_label, item_name, spec, quantity, unit, unit_price, total_amount, source, budget_subcategories(label))),
      proposal_version!proposal_version_proposal_id_fkey(id,file_url),
      funded_projects(id,funding_document_url,project_lead_id),
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
        created_at,
        updated_at,
        status,
        deadline_at,
        comments_for_evaluators,
        proponent_info_visibility,
        anonymized_file_url,
        proposal_version_id,
        evaluator_id(first_name,last_name),
        forwarded_by_rnd(first_name,last_name),
        proposal_id(
          *,
          cooperating_agencies(agency_name_text, agencies(name)),
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
          proposal_budget_versions(id, version_number, proposal_budget_items(id, category, subcategory_id, custom_subcategory_label, item_name, spec, quantity, unit, unit_price, total_amount, source, budget_subcategories(label))),
          proposal_version!proposal_version_proposal_id_fkey(id,file_url,created_at)
        )
      `,
      )
      .eq("evaluator_id", evaluator_id)
      // Keep the newest assignment/version first so evaluator views do not
      // accidentally surface stale visibility settings or pre-redaction files.
      .order("proposal_version_id", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });

    if (search) {
      // filter on related table column
      query = query.ilike("proposal.project_title", `%${search}%`);
    }

    if (status) {
      // filter on base table column
      query = query.eq("status", status);
    }

    const { data: rawData, error } = await query;

    if (error) {
      return { data: null, error };
    }

    const data = rawData?.map((item: any) => {
      const p = item.proposal_id;
      if (!p) return item;

      const vis = item.proponent_info_visibility || p.proponent_info_visibility;
      if (item.proponent_info_visibility) {
        p.proponent_info_visibility = item.proponent_info_visibility;
      }
      if (!vis || vis === "both") return item;

      // Note: 'agency' visibility means "Show Agency Only" (Hide Name)
      //       'name' visibility means "Show Name Only" (Hide Agency)
      //       'none' visibility means "Hide Both"

      const shouldHideName = vis === "agency" || vis === "none";
      const shouldHideAgency = vis === "name" || vis === "none";

      if (shouldHideName) {
        if (p.proponent_id) {
          p.proponent_id.first_name = "Confidential";
          p.proponent_id.last_name = "";
          if (p.proponent_id.department) {
            p.proponent_id.department.name = "Confidential";
          }
        }
        // Scrub contact info
        p.email = "Confidential";
        p.phone = 0; // Set to 0 or null if number type required, frontend logic handles display
      }

      if (shouldHideAgency) {
        if (p.agency) {
          // p.agency is { name: string } from the join
          if (typeof p.agency === "object") p.agency.name = "Confidential";
        }
        if (p.agency_address) {
          p.agency_address.city = "Confidential";
          p.agency_address.street = "Confidential";
          p.agency_address.barangay = "Confidential";
        }
      }

      // Replace file URL with anonymized version when available
      if (item.anonymized_file_url && p.proposal_version) {
        for (const version of p.proposal_version) {
          version.file_url = item.anonymized_file_url;
        }
      }

      return item;
    });

    return { data, error: null };
  }

  async getRndProposals(rnd_id: string) {
    const { data, error } = await this.db
      .from("proposal_rnd")
      .select(
        `
        id,
        proposal_id(
          *,
          cooperating_agencies(agency_name_text, agencies(name)),
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
          proposal_budget_versions(id, version_number, proposal_budget_items(id, category, subcategory_id, custom_subcategory_label, item_name, spec, quantity, unit, unit_price, total_amount, source, budget_subcategories(label))),
          proposal_version!proposal_version_proposal_id_fkey(id,file_url,created_at),
          funded_projects(id,funding_document_url,project_lead_id)
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

  async getProposalsForEndorsement(
    search?: string,
    rnd_id?: string,
    statuses?: Status[],
    isAdmin?: boolean,
  ) {
    // 1. Get proposals in the requested status(es) assigned to this RND user.
    // Default = UNDER_EVALUATION (the "active" endorsement queue); callers can pass
    // [REVISION_RND] or [REJECTED_RND] to load the history tabs.
    // Admin bypasses the proposal_rnd filter and sees every proposal.
    const statusFilter = statuses && statuses.length > 0 ? statuses : [Status.UNDER_EVALUATION];
    const rndJoin = isAdmin ? "proposal_rnd(rnd_id)" : "proposal_rnd!inner(rnd_id)";
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
        updated_at,
        current_version_id,
        ${rndJoin},
        proposal_evaluators(
          evaluator_id,
          status,
          deadline_at,
          updated_at,
          proposal_version_id
        ),
        proposal_budget_versions(
          id,
          version_number,
          proposal_budget_items(
            category,
            item_name,
            spec,
            custom_subcategory_label,
            quantity,
            unit,
            unit_price,
            total_amount,
            source,
            budget_subcategories(label)
          )
        ),
        estimated_budget(id,budget,item,amount,source)
      `,
      )
      .in("status", statusFilter);

    // Filter by RND user unless admin — admin sees all proposals.
    if (rnd_id && !isAdmin) {
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

    // Version-scope: keep only evaluator assignment rows tied to each proposal's
    // CURRENT version. Historical rows from earlier versions stay in the DB
    // (audit trail) but never influence the active endorsement page.
    for (const p of proposals as any[]) {
      const currentVersionId = p.current_version_id;
      p.proposal_evaluators = (p.proposal_evaluators || []).filter(
        (ev: any) => ev.proposal_version_id === currentVersionId,
      );
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

    // 4. Fetch users, departments, scores, budgets, budget_versions, and version history in parallel
    const [usersResult, departmentsResult, scoresResult, budgetsResult, propBudgetVersionsResult, versionsResult] =
      await Promise.all([
        allUserIds.length > 0
          ? this.db
            .from("users")
            .select("id, first_name, last_name, email, photo_profile_url, department:department_id(name)")
            .in("id", allUserIds)
          : { data: [], error: null },
        departmentIds.length > 0
          ? this.db.from("departments").select("id, name").in("id", departmentIds)
          : { data: [], error: null },
        // Updated to use new column structure: title, budget, timeline, comment.
        // Version-scope via proposal_version_id so v1 scores don't leak into v2.
        this.db
          .from("evaluation_scores")
          .select(
            "proposal_id, evaluator_id, title, budget, timeline, comment, created_at, proposal_version_id",
          )
          .in("proposal_id", proposalIds),
        this.db
          .from("estimated_budget")
          .select("id, proposal_id, item, source, budget, amount")
          .in("proposal_id", proposalIds),
        this.db
          .from("proposal_budget_versions")
          .select("id, version_number, proposal_id, proposal_budget_items(id, category, subcategory_id, custom_subcategory_label, item_name, spec, quantity, unit, unit_price, total_amount, source, budget_subcategories(label))")
          .in("proposal_id", proposalIds),
        // Pull all version rows for these proposals so we can derive a
        // human-readable version number (v1 / v2 / …) per proposal.
        // Order by id — the auto-increment guarantees insert order even when
        // two versions share a created_at timestamp.
        this.db
          .from("proposal_version")
          .select("id, proposal_id")
          .in("proposal_id", proposalIds)
          .order("id", { ascending: true }),
      ]);

    if (usersResult.error) return { data: null, error: usersResult.error };
    if (departmentsResult.error) return { data: null, error: departmentsResult.error };
    if (scoresResult.error) return { data: null, error: scoresResult.error };
    if (budgetsResult.error) return { data: null, error: budgetsResult.error };
    if (propBudgetVersionsResult.error) return { data: null, error: propBudgetVersionsResult.error };
    if (versionsResult.error) return { data: null, error: versionsResult.error };

    // Create lookup maps for quick access
    const usersMap = new Map((usersResult.data || []).map((u) => [u.id, u]));
    const departmentsMap = new Map((departmentsResult.data || []).map((d) => [d.id, d]));
    const allScores = scoresResult.data || [];
    const allBudgets = budgetsResult.data || [];
    const allBudgetVersions = propBudgetVersionsResult.data || [];

    // Build a per-proposal ordered list of version IDs so we can look up the
    // 1-based index of each proposal's current_version_id (= display version).
    const versionsByProposal = new Map<number, number[]>();
    for (const v of versionsResult.data || []) {
      const list = versionsByProposal.get(v.proposal_id) || [];
      list.push(v.id);
      versionsByProposal.set(v.proposal_id, list);
    }

    // 5. Transform data for frontend
    const endorsementProposals = proposals.map((proposal) => {
      const evaluators = proposal.proposal_evaluators || [];
      const currentVersionId = (proposal as any).current_version_id;

      // Scope evaluation scores to the proposal's CURRENT version only — same
      // reasoning as the proposal_evaluators filter above. Old scores stay in
      // the DB for audit but never feed the active endorsement UI.
      const proposalScores = allScores.filter(
        (s) => s.proposal_id === proposal.id && (s as any).proposal_version_id === currentVersionId,
      );

      // Build evaluator decisions
      const evaluatorDecisions = evaluators.map((ev: any) => {
        // Find the score record for this evaluator (now one row per evaluator with all scores)
        const evaluatorScore = proposalScores.find((s) => s.evaluator_id === ev.evaluator_id);

        // Build ratings from the new column structure
        const ratings = {
          title: evaluatorScore?.title ?? 0,
          budget: evaluatorScore?.budget ?? 0,
          timeline: evaluatorScore?.timeline ?? 0,
        };

        // Map evaluator status to decision
        let decision: "Approve" | "Revise" | "Reject" | "Pending" | "Declined" | "In Review" | "Extension Requested" = "Pending";
        if (ev.status === EvaluatorStatus.APPROVE) decision = "Approve";
        else if (ev.status === EvaluatorStatus.REVISE) decision = "Revise";
        else if (ev.status === EvaluatorStatus.REJECT) decision = "Reject";
        else if (ev.status === EvaluatorStatus.DECLINE) decision = "Declined";
        else if (ev.status === EvaluatorStatus.ACCEPT || ev.status === EvaluatorStatus.FOR_REVIEW) decision = "In Review";
        else if (ev.status === EvaluatorStatus.EXTEND) decision = "Extension Requested";

        // Get evaluator name from lookup map
        const evaluator = usersMap.get(ev.evaluator_id);

        return {
          evaluatorId: ev.evaluator_id,
          evaluatorName: evaluator
            ? `${evaluator.first_name || ""} ${evaluator.last_name || ""}`.trim() || "Unknown"
            : "Unknown",
          // Adding department and email
          evaluatorDepartment: Array.isArray((evaluator as any)?.department)
            ? (evaluator as any)?.department[0]?.name
            : (evaluator as any)?.department?.name || "N/A",
          evaluatorEmail: evaluator?.email || "N/A",
          evaluatorProfilePicture: evaluator?.photo_profile_url || null,
          decision,
          status: ev.status,
          // Use status change timestamp (set when evaluator submits), then score creation date, then deadline as last resort
          // Note: deadline_at is date-only (no time), updated_at is a proper timestamp
          submittedDate: ev.updated_at || evaluatorScore?.created_at || ev.deadline_at,
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

      // Compute average scores across all evaluators who have submitted ratings
      const scoredDecisions = evaluatorDecisions.filter(
        (d) => d.ratings && (d.ratings.title > 0 || d.ratings.budget > 0 || d.ratings.timeline > 0),
      );
      const averageScores =
        scoredDecisions.length > 0
          ? {
            title:
              scoredDecisions.reduce((sum, d) => sum + d.ratings.title, 0) / scoredDecisions.length,
            budget:
              scoredDecisions.reduce((sum, d) => sum + d.ratings.budget, 0) / scoredDecisions.length,
            timeline:
              scoredDecisions.reduce((sum, d) => sum + d.ratings.timeline, 0) / scoredDecisions.length,
            overall:
              scoredDecisions.reduce(
                (sum, d) => sum + d.ratings.title + d.ratings.budget + d.ratings.timeline,
                0,
              ) /
              (scoredDecisions.length * 3),
            evaluatorCount: scoredDecisions.length,
          }
          : null;

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

      // Compute 1-based version number of the current live version so the
      // UI can show "v2" etc. Falls back to 1 when no version rows exist.
      const versionIds = versionsByProposal.get(proposal.id) || [];
      const totalVersions = versionIds.length || 1;
      const idx = currentVersionId ? versionIds.indexOf(currentVersionId) : -1;
      const versionNumber = idx >= 0 ? idx + 1 : totalVersions;

      return {
        id: String(proposal.id),
        title: proposal.project_title,
        submittedBy: proponent
          ? `${proponent.first_name || ""} ${proponent.last_name || ""}`.trim() || "Unknown"
          : "Unknown",
        department: department?.name || "Unknown",
        proponentProfilePicture: proponent?.photo_profile_url || null,
        proponentEmail: proponent?.email || "",
        status: proposal.status,
        actionDate: proposal.updated_at || proposal.created_at,
        versionNumber,
        totalVersions,
        evaluatorDecisions,
        overallRecommendation,
        averageScores,
        readyForEndorsement,
        budget,
        estimated_budget: proposalBudgets, // raw items with item, source, budget(category), amount
        proposal_budget_versions: allBudgetVersions.filter((v: any) => v.proposal_id === proposal.id),
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

      // Log the endorsement action
      await logActivity(this.db, {
        user_id: rnd_id,
        action: "proposal_endorsed_for_funding",
        category: "proposal",
        target_id: String(proposal_id),
        target_type: "proposal",
        details: { remarks: remarks || "Proposal endorsed for funding" },
      });

      return { data: { proposal_id, status: "endorsed_for_funding" }, error: null };
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
      await logActivity(this.db, {
        user_id: rnd_id,
        action: "proposal_revision_after_evaluation",
        category: "proposal",
        target_id: String(proposal_id),
        target_type: "proposal",
        details: { remarks: remarks || "Revision requested after evaluation review" },
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
      await logActivity(this.db, {
        user_id: rnd_id,
        action: "proposal_rejected_after_evaluation",
        category: "proposal",
        target_id: String(proposal_id),
        target_type: "proposal",
        details: { remarks: remarks || "Proposal rejected after evaluation review" },
      });

      return { data: { proposal_id, status: Status.REJECTED_RND }, error: null };
    }

    return { error: new Error("Invalid decision type") };
  }

  async fundingDecision(input: FundingDecisionInput, userId: string) {
    const { proposal_id, decision, file_url, remarks } = input;

    // 1. Fetch proposal
    const { data: proposal, error: fetchError } = await this.db
      .from("proposals")
      .select("id, proponent_id, status")
      .eq("id", proposal_id)
      .single();

    if (fetchError || !proposal) {
      return { error: fetchError || new Error("Proposal not found") };
    }

    // 2. Verify proposal is in endorsed_for_funding status
    if (proposal.status !== Status.ENDORSED_FOR_FUNDING) {
      return {
        error: new Error(
          `Proposal must be in 'endorsed_for_funding' status. Current status: ${proposal.status}`,
        ),
      };
    }

    // 3. Handle based on decision type
    if (decision === FundingDecisionType.FUNDED) {
      // Update proposal status to funded
      const { error: updateError } = await this.db
        .from("proposals")
        .update({
          status: Status.FUNDED,
          updated_at: new Date().toISOString(),
        })
        .eq("id", proposal_id);

      if (updateError) {
        return { error: updateError };
      }

      // Phase 4 of LIB feature: look up the proposal's latest budget version and set it as
      // the funded project's active version at creation time. This eliminates the lazy
      // backfill in getActiveBudgetVersion (which writes on every read when NULL) and makes
      // the pointer correct from the moment the project becomes funded.
      const { data: latestBudgetVersion } = await this.db
        .from("proposal_budget_versions")
        .select("id")
        .eq("proposal_id", proposal_id)
        .order("version_number", { ascending: false })
        .limit(1)
        .maybeSingle();

      // Create funded_projects record
      const { data: fundedProject, error: insertError } = await this.db
        .from("funded_projects")
        .insert({
          proposal_id: proposal_id,
          project_lead_id: proposal.proponent_id,
          status: ProjectsStatus.ON_GOING,
          funded_date: new Date().toISOString().split("T")[0],
          funding_document_url: file_url || null,
          current_budget_version_id: latestBudgetVersion?.id ?? null,
        })
        .select()
        .single();

      if (insertError) {
        return { error: insertError };
      }

      await logActivity(this.db, {
        user_id: userId,
        action: "proposal_funded",
        category: "proposal",
        target_id: String(proposal_id),
        target_type: "proposal",
        details: { remarks: remarks || "Proposal approved for funding" },
      });

      return { data: { proposal_id, funded_project: fundedProject, status: Status.FUNDED }, error: null };
    } else if (decision === FundingDecisionType.REVISION_FUNDING) {
      const { error: updateError } = await this.db
        .from("proposals")
        .update({
          status: Status.REVISION_FUNDING,
          updated_at: new Date().toISOString(),
        })
        .eq("id", proposal_id);

      if (updateError) {
        return { error: updateError };
      }

      await logActivity(this.db, {
        user_id: userId,
        action: "proposal_revision_funding",
        category: "proposal",
        target_id: String(proposal_id),
        target_type: "proposal",
        details: { remarks: remarks || "Revision requested at funding stage" },
      });

      return { data: { proposal_id, status: Status.REVISION_FUNDING }, error: null };
    } else if (decision === FundingDecisionType.REJECTED_FUNDING) {
      const { error: updateError } = await this.db
        .from("proposals")
        .update({
          status: Status.REJECTED_FUNDING,
          updated_at: new Date().toISOString(),
        })
        .eq("id", proposal_id);

      if (updateError) {
        return { error: updateError };
      }

      await logActivity(this.db, {
        user_id: userId,
        action: "proposal_rejected_funding",
        category: "proposal",
        target_id: String(proposal_id),
        target_type: "proposal",
        details: { remarks: remarks || "Proposal rejected at funding stage" },
      });

      return { data: { proposal_id, status: Status.REJECTED_FUNDING }, error: null };
    }

    return { error: new Error("Invalid funding decision type") };
  }

  async submitRevision(input: Omit<SubmitRevisedProposalInput, "file_url">, fileUrl: string) {
    const { proposal_id, proponent_id, project_title, revision_response, plan_start_date, plan_end_date, budget, work_plan_file_url, classification, classification_details, priority_areas, discipline, sector } =
      input;

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

    // 3. Verify status is revision_rnd or revision_funding
    if (proposal.status !== Status.REVISION_RND && proposal.status !== Status.REVISION_FUNDING) {
      return {
        error: new Error(
          `Proposal must be in 'revision_rnd' or 'revision_funding' status to submit revision. Current status: ${proposal.status}`,
        ),
      };
    }

    // 3b. Deadline enforcement
    const { data: revisionSummary } = await this.db
      .from("proposal_revision_summary")
      .select("created_at, deadline")
      .eq("proposal_id", proposal_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (revisionSummary?.created_at && revisionSummary?.deadline) {
      const deadlineMs = new Date(revisionSummary.created_at).getTime() + revisionSummary.deadline * 86400000;
      const now = Date.now();

      if (now > deadlineMs) {
        // Check if there's an approved extension giving a new deadline
        const { data: approvedExtension } = await this.db
          .from("proposal_extension_requests")
          .select("new_deadline_days, reviewed_at")
          .eq("proposal_id", proposal_id)
          .eq("status", ProponentExtensionStatus.APPROVED)
          .order("reviewed_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (approvedExtension?.reviewed_at && approvedExtension?.new_deadline_days) {
          const extendedDeadlineMs = new Date(approvedExtension.reviewed_at).getTime()
            + approvedExtension.new_deadline_days * 86400000;
          if (now > extendedDeadlineMs) {
            return { error: new Error("Your extended revision deadline has expired. Please request another extension from R&D.") };
          }
          // Within extended deadline — allow submission
        } else {
          return { error: new Error("Your revision deadline has expired. Please request an extension from R&D.") };
        }
      }
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

    // 6. Update proposal status + advance current_version_id to the new row.
    // Setting current_version_id is what makes v1's evaluator state fall out of
    // active-side queries (endorsement page, evaluator active queue) without
    // deleting any history. v1 rows stay in the DB for audit / Completed Reviews.
    const isRndRevision = proposal.status === Status.REVISION_RND;
    const targetStatus = isRndRevision
      ? Status.REVIEW_RND                // Back to R&D queue; R&D re-reviews then forwards to evaluators
      : Status.ENDORSED_FOR_FUNDING;     // Funding revision — back to Funding page

    const updatePayload: Record<string, any> = {
      status: targetStatus,
      updated_at: new Date().toISOString(),
      current_version_id: versionData.id,
    };

    if (project_title) updatePayload.project_title = project_title;
    if (plan_start_date) updatePayload.plan_start_date = plan_start_date;
    if (plan_end_date) updatePayload.plan_end_date = plan_end_date;

    // Optional classification / priority / discipline / sector updates
    if (classification) updatePayload.classification = classification;
    if (classification_details) updatePayload.classification_details = classification_details;
    if (priority_areas) {
      // Resolve priority name to ID and update the join table
      const { data: priorityRow } = await this.db
        .from("priorities")
        .select("id")
        .eq("name", priority_areas)
        .maybeSingle();
      if (priorityRow) {
        // Replace existing priority join rows
        await this.db.from("proposal_priorities").delete().eq("proposal_id", proposal_id);
        await this.db.from("proposal_priorities").insert({ proposal_id, priority_id: priorityRow.id });
      }
    }
    if (discipline) {
      const { data: disciplineRow } = await this.db
        .from("disciplines")
        .select("id")
        .eq("name", discipline)
        .maybeSingle();
      if (disciplineRow) updatePayload.discipline_id = disciplineRow.id;
    }
    if (sector) {
      const { data: sectorRow } = await this.db
        .from("sectors")
        .select("id")
        .eq("name", sector)
        .maybeSingle();
      if (sectorRow) updatePayload.sector_id = sectorRow.id;
    }

    // Optional Form 3 (Work & Financial Plan) replacement. Overwrites the column; we
    // don't version the attachment itself, just stamp who/when for audit purposes.
    if (work_plan_file_url) {
      updatePayload.work_plan_file_url = work_plan_file_url;
      updatePayload.work_plan_file_updated_at = new Date().toISOString();
      updatePayload.work_plan_file_updated_by = proponent_id;
    }

    const { error: updateError } = await this.db.from("proposals").update(updatePayload).eq("id", proposal_id);

    if (updateError) {
      return { error: updateError };
    }

    // 6b. Replace budget if provided. Revision happens before funding approval, so there's only
    // ever a v1 to replace — destructive replace is fine here. Realignment-style versioning
    // (Phase 3) only kicks in after the project is funded.
    // Writes to both the new tables AND the legacy estimated_budget mirror — dropping the
    // mirror would make resubmitted proposals show ₱0 on every downstream read path.
    if (Array.isArray(budget) && budget.length > 0) {
      // Wipe both sides so the replace is consistent. CASCADE on proposal_budget_versions
      // takes the items with it.
      const { error: deleteLegacyError } = await this.db
        .from("estimated_budget")
        .delete()
        .eq("proposal_id", proposal_id);
      if (deleteLegacyError) {
        return { error: deleteLegacyError };
      }

      const { error: deleteVersionsError } = await this.db
        .from("proposal_budget_versions")
        .delete()
        .eq("proposal_id", proposal_id);
      if (deleteVersionsError) {
        return { error: deleteVersionsError };
      }

      const categories = [Budget.PS, Budget.MOOE, Budget.CO] as const;

      let grand_total = 0;
      for (const entry of budget) {
        for (const category of categories) {
          for (const line of entry.budget[category] ?? []) {
            grand_total += Number(line.totalAmount) || 0;
          }
        }
      }

      const versionInsert = await this.db
        .from("proposal_budget_versions")
        .insert({
          proposal_id,
          version_number: 1,
          grand_total,
          created_by: proponent_id,
        })
        .select("id")
        .single();

      if (versionInsert.error || !versionInsert.data) {
        return { error: versionInsert.error ?? new Error("budget version insert returned no data") };
      }
      const version_id = versionInsert.data.id as number;

      const item_rows: Array<Record<string, unknown>> = [];
      let display_order = 0;
      for (const entry of budget) {
        const source = entry.source;
        for (const category of categories) {
          for (const line of entry.budget[category] ?? []) {
            display_order += 1;
            item_rows.push({
              version_id,
              source,
              category,
              subcategory_id: line.subcategoryId ?? null,
              custom_subcategory_label: line.customSubcategoryLabel ?? null,
              item_name: line.itemName,
              spec: line.spec ?? null,
              quantity: line.quantity,
              unit: line.unit ?? null,
              unit_price: line.unitPrice,
              total_amount: line.totalAmount,
              display_order,
            });
          }
        }
      }

      if (item_rows.length > 0) {
        const itemInsert = await this.db.from("proposal_budget_items").insert(item_rows);
        if (itemInsert.error) {
          return { error: itemInsert.error };
        }
      }

      // Legacy mirror — see the matching comment in create() for why this stays.
      const legacy_rows = budget.flatMap((entry) => {
        const source = entry.source;
        const toRows = (category: Budget) =>
          (entry.budget[category] ?? []).map((line) => ({
            proposal_id,
            source,
            budget: category,
            item: line.itemName,
            amount: line.totalAmount,
          }));
        return [...toRows(Budget.PS), ...toRows(Budget.MOOE), ...toRows(Budget.CO)];
      });

      if (legacy_rows.length > 0) {
        const { error: budgetError } = await this.db.from("estimated_budget").insert(legacy_rows);
        if (budgetError) {
          return { error: budgetError };
        }
      }
    }

    // 7. Log the action
    await logActivity(this.db, {
      user_id: proponent_id,
      action: "proposal_revision_submitted",
      category: "proposal",
      target_id: String(proposal_id),
      target_type: "proposal",
      details: { version_number: newVersionNumber, revision_response },
    });

    return {
      data: {
        proposal_id,
        version_number: newVersionNumber,
        version_id: versionData.id,
        file_url: fileUrl,
        status: targetStatus,
      },
      error: null,
    };
  }

  async getRevisionSummary(proposal_id: number, proponent_id: string, isAdmin = false) {
    // 1. Verify access: User must be the Proponent, an assigned RND, or an Admin
    if (!isAdmin) {
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

    // 4. Build anonymized evaluator comments block if R&D opted to include any.
    // Order is assignment order (earliest-assigned evaluator = "Evaluator 1").
    // Never return evaluator real names to this endpoint — proponents read it.
    // Version-scope to the proposal's current version so repeat evaluators
    // across versions don't collide on the same label or comment.
    const includedIds: string[] = Array.isArray(data.included_evaluator_ids)
      ? data.included_evaluator_ids
      : [];

    let evaluator_comments: { label: string; comment: string }[] = [];
    if (includedIds.length > 0) {
      const { data: proposalRow } = await this.db
        .from("proposals")
        .select("current_version_id")
        .eq("id", proposal_id)
        .single();

      const currentVersionId = (proposalRow as any)?.current_version_id ?? null;

      let assignmentQuery = this.db
        .from("proposal_evaluators")
        .select("evaluator_id, created_at")
        .eq("proposal_id", proposal_id)
        .order("created_at", { ascending: true });
      if (currentVersionId) assignmentQuery = assignmentQuery.eq("proposal_version_id", currentVersionId);
      const { data: assignments } = await assignmentQuery;

      const orderIndex = new Map<string, number>();
      (assignments ?? []).forEach((row: { evaluator_id: string }, idx: number) => {
        if (!orderIndex.has(row.evaluator_id)) orderIndex.set(row.evaluator_id, idx + 1);
      });

      let scoreQuery = this.db
        .from("evaluation_scores")
        .select("evaluator_id, comment")
        .eq("proposal_id", proposal_id)
        .in("evaluator_id", includedIds);
      if (currentVersionId) scoreQuery = scoreQuery.eq("proposal_version_id", currentVersionId);
      const { data: scores } = await scoreQuery;

      const scoreByEvaluator = new Map<string, string>();
      (scores ?? []).forEach((row: { evaluator_id: string; comment: string | null }) => {
        if (row.comment) scoreByEvaluator.set(row.evaluator_id, row.comment);
      });

      evaluator_comments = includedIds
        .map((evId) => ({
          label: `Evaluator ${orderIndex.get(evId) ?? "?"}`,
          comment: scoreByEvaluator.get(evId) ?? "",
          order: orderIndex.get(evId) ?? Number.MAX_SAFE_INTEGER,
        }))
        .filter((e) => e.comment.trim().length > 0)
        .sort((a, b) => a.order - b.order)
        .map(({ label, comment }) => ({ label, comment }));
    }

    return {
      data: {
        proposal_id: data.proposal_id,
        rnd_id: data.rnd_id,
        rnd_name,
        title_comment: data.title_comment,
        budget_comment: data.budget_comment,
        timeline_comment: data.timeline_comment,
        overall_comment: data.overall_comment,
        deadline: data.deadline,
        created_at: data.created_at,
        evaluator_comments,
      },
      error: null,
    };
  }

  async getRejectionSummary(proposal_id: number, requesting_user_id: string, isAdmin = false) {
    // 1. Verify access: User must be the Proponent, an assigned RND, or an Admin
    if (!isAdmin) {
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

      if (!isProponent && !isRnd) {
        return { data: null, error: new Error("Proposal not found or you don't have access") };
      }
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
        .select("first_name, last_name, roles")
        .eq("id", data.rnd_id)
        .maybeSingle();

      if (rndUser) {
        rnd_name = `${rndUser.first_name || ""} ${rndUser.last_name || ""}`.trim() || "Unknown";
        // Use first role or find relevant one
        const roles = rndUser.roles || [];
        if (Array.isArray(roles)) {
          if (roles.includes("admin")) rejected_by_role = "admin";
          else if (roles.includes("rnd")) rejected_by_role = "rnd";
          else rejected_by_role = roles[0] || "rnd";
        }
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
        versions: (data || []).map((v, i) => ({ ...v, version_number: i + 1 })),
      },
      error: null,
    };
  }

  async getAssignmentTracker(proposal_id: number, user_sub: string, roles: string[]) {
    const isAdmin = roles.includes("admin");

    let query = this.db.from("proposal_assignment_tracker").select(
      `
        id,
        proposal_version_id,
        proposals:proposals(
          id,
          project_title,
          status,
          current_version_id,
          created_at,
          proposal_tags(
            tags:tags(name)
          )
        ),
        evaluator_id:users(id, first_name, last_name, middle_ini, email, photo_profile_url, department_id:departments(name)),
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

    // Version-scope: the tracker has one row per (evaluator, version). R&D's
    // "evaluator assignment tracker" UI must only show live rows for each
    // proposal's CURRENT version — old v1 rows stay in the DB for audit but
    // must not appear alongside the freshly-forwarded v2 assignments.
    const versionFiltered = (trackerData || []).filter((row: any) => {
      const currentVersionId = row.proposals?.current_version_id;
      // Show if: proposal has no version tracking, or row is a legacy record
      // (null version_id), or row matches the current version.
      return !currentVersionId || !row.proposal_version_id || row.proposal_version_id === currentVersionId;
    });

    // Admin sees all tracker records; RND only sees evaluators they assigned
    let filtered = versionFiltered;

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
        const allowedSet = new Set(allowedAssignments.map((a: any) => `${a.proposal_id}-${a.evaluator_id}`));

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
        status: row.proposals?.status,
        proposal_tags: row.proposals?.proposal_tags,
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

    // Scope extension handling to the CURRENT version so we never accidentally
    // reopen a historical v1 row when acting on a v2 extension request.
    const { data: proposalRow, error: proposalErr } = await this.db
      .from("proposals")
      .select("current_version_id")
      .eq("id", proposal_id)
      .single();

    if (proposalErr || !proposalRow?.current_version_id) {
      return { error: proposalErr || new Error("Proposal has no current version.") };
    }

    const currentVersionId = proposalRow.current_version_id as number;

    // Fetch tracker rows scoped to current version first.
    // We intentionally avoid `.single()` because historical data can contain
    // multiple rows (e.g. reassignment/re-forward flows), which causes:
    // "Cannot coerce the result to a single JSON object."
    const { data: versionScopedRows, error: fetchError } = await this.db
      .from("proposal_assignment_tracker")
      .select("id, deadline_at, request_deadline_at, status")
      .eq("proposal_id", proposal_id)
      .eq("evaluator_id", evaluator_id)
      .eq("proposal_version_id", currentVersionId);

    if (fetchError) {
      return { error: fetchError || new Error("Extension request not found") };
    }

    let trackerRows = versionScopedRows || [];

    // Backward-compat fallback:
    // some legacy rows may not carry proposal_version_id consistently.
    if (trackerRows.length === 0) {
      const { data: fallbackRows, error: fallbackError } = await this.db
        .from("proposal_assignment_tracker")
        .select("id, deadline_at, request_deadline_at, status")
        .eq("proposal_id", proposal_id)
        .eq("evaluator_id", evaluator_id)
        .order("id", { ascending: false });

      if (fallbackError || !fallbackRows || fallbackRows.length === 0) {
        return { error: fallbackError || new Error("Extension request not found") };
      }

      trackerRows = fallbackRows;
    }

    // Prefer the row that represents a pending extension request.
    // Fallback to the first row so we can return a domain error gracefully.
    const tracker =
      trackerRows.find((row: any) => row.status === AssignmentTracker.EXTEND)
      || trackerRows.find((row: any) => row.status === AssignmentTracker.PENDING && !!row.request_deadline_at)
      || trackerRows.find((row: any) => row.status === "extension_requested")
      || trackerRows[0];

    const hasPendingExtensionRequest =
      tracker.status === AssignmentTracker.EXTEND ||
      (tracker.status === AssignmentTracker.PENDING && !!tracker.request_deadline_at) ||
      tracker.status === "extension_requested";

    if (!hasPendingExtensionRequest) {
      return { error: new Error("No pending extension request for this evaluator and proposal") };
    }

    // Fetch evaluator name for history logging
    const { data: extUser } = await this.db
      .from("users")
      .select("first_name, last_name")
      .eq("id", evaluator_id)
      .single();
    const extUserName = extUser ? `${extUser.first_name || ""} ${extUser.last_name || ""}`.trim() : "Unknown";

    if (action === ExtensionDecision.APPROVED) {
      const newDeadline = tracker.request_deadline_at;

      // 1. Update tracker: status to accept, deadline_at to the requested date
      const { error: trackerError } = await this.db
        .from("proposal_assignment_tracker")
        .update({ status: AssignmentTracker.ACCEPT, deadline_at: newDeadline })
        .eq("id", tracker.id);

      if (trackerError) return { error: trackerError };

      // 2. Update proposal_evaluators: status to for_review, deadline_at to the requested date
      const { error: evalError } = await this.db
        .from("proposal_evaluators")
        .update({
          status: EvaluatorStatus.FOR_REVIEW,
          deadline_at: newDeadline,
        })
        .eq("proposal_id", proposal_id)
        .eq("evaluator_id", evaluator_id)
        .eq("proposal_version_id", currentVersionId);

      if (evalError) return { error: evalError };

      // 3. Insert notification
      await this.db.from("notifications").insert({
        user_id: evaluator_id,
        message: `Your extension request for proposal #${proposal_id} has been approved.`,
        link: "proposals",
      });

      // 4. Insert log
      await logActivity(this.db, {
        user_id: rnd_id,
        action: "evaluator_extension_approved",
        category: "evaluation",
        target_id: String(proposal_id),
        target_type: "proposal",
        details: { evaluator_id, evaluator_name: extUserName, remarks: remarks || "Extension request approved" },
      });

      return { data: { proposal_id, evaluator_id, action }, error: null };
    } else if (action === ExtensionDecision.DENIED || action === ExtensionDecision.REJECTED) {
      // 1. Reset tracker status to pending, clear request_deadline_at
      const { error: trackerError } = await this.db
        .from("proposal_assignment_tracker")
        .update({ status: AssignmentTracker.PENDING, request_deadline_at: null })
        .eq("id", tracker.id);

      if (trackerError) return { error: trackerError };

      // 2. Reset proposal_evaluators to pending as well.
      // Primary: current-version evaluator row.
      const { error: evalError } = await this.db
        .from("proposal_evaluators")
        .update({ status: EvaluatorStatus.PENDING })
        .eq("proposal_id", proposal_id)
        .eq("evaluator_id", evaluator_id)
        .eq("proposal_version_id", currentVersionId);

      if (evalError) return { error: evalError };

      // Backward-compat cleanup:
      // legacy rows may carry stale extend/extension_requested statuses on
      // non-current or null proposal_version_id rows. If left unchanged,
      // evaluator listing can still surface "Extension Requested".
      const { error: staleEvalError } = await this.db
        .from("proposal_evaluators")
        .update({ status: EvaluatorStatus.PENDING })
        .eq("proposal_id", proposal_id)
        .eq("evaluator_id", evaluator_id)
        .in("status", [EvaluatorStatus.EXTEND, "extension_requested"]);

      if (staleEvalError) return { error: staleEvalError };

      // 3. Insert notification
      await this.db.from("notifications").insert({
        user_id: evaluator_id,
        message: `Your extension request for proposal #${proposal_id} has been denied. You may accept with the original deadline or decline.`,
        link: "proposals",
      });

      // 4. Insert log
      await logActivity(this.db, {
        user_id: rnd_id,
        action: "evaluator_extension_denied",
        category: "evaluation",
        target_id: String(proposal_id),
        target_type: "proposal",
        details: { evaluator_id, evaluator_name: extUserName, remarks: remarks || "Extension request denied" },
      });

      return { data: { proposal_id, evaluator_id, action }, error: null };
    }

    return { error: new Error("Invalid decision") };
  }

  // --- Assignment History ---

  async getAssignmentHistory(proposal_id: number) {
    const evaluationActions = [
      "evaluator_assigned",
      "evaluator_accepted",
      "evaluator_declined",
      "evaluator_extension_requested",
      "evaluator_extension_approved",
      "evaluator_extension_denied",
      "evaluator_removed",
      "evaluation_scores_submitted",
      "proposal_forwarded_to_evaluators",
    ];

    const { data, error } = await this.db
      .from("pms_logs")
      .select("id, user_id, action, details, created_at")
      .eq("target_id", String(proposal_id))
      .eq("target_type", "proposal")
      .in("action", evaluationActions)
      .order("created_at", { ascending: true });

    if (error) {
      return { data: null, error };
    }

    // Collect all user_ids to fetch names
    const userIds = [...new Set((data || []).map((row: any) => row.user_id).filter(Boolean))];
    const { data: users } = userIds.length > 0
      ? await this.db.from("users").select("id, first_name, last_name").in("id", userIds)
      : { data: [] };
    const nameMap = new Map((users || []).map((u: any) => [u.id, `${u.first_name || ""} ${u.last_name || ""}`.trim()]));

    const history = (data || []).map((row: any) => ({
      id: row.id,
      action: row.action,
      performedBy: nameMap.get(row.user_id) || "System",
      performedById: row.user_id,
      evaluatorName: row.details?.evaluator_name || null,
      evaluatorId: row.details?.evaluator_id || null,
      remarks: row.details?.remarks || null,
      decision: row.details?.decision || null,
      timestamp: row.created_at,
    }));

    return { data: history, error: null };
  }

  // --- Proponent Extension Request Methods ---

  async requestProponentExtension(input: RequestProponentExtensionInput, proponentId: string) {
    const { proposal_id, reason } = input;

    // 1. Verify proposal exists and belongs to proponent
    const { data: proposal, error: fetchError } = await this.db
      .from("proposals")
      .select("id, proponent_id, status, project_title")
      .eq("id", proposal_id)
      .single();

    if (fetchError || !proposal) {
      return { error: fetchError || new Error("Proposal not found") };
    }

    if (proposal.proponent_id !== proponentId) {
      return { error: new Error("You do not have permission for this proposal") };
    }

    // 2. Verify status allows extension request
    const allowedStatuses = [Status.REVISION_RND, Status.REVISION_FUNDING, Status.NOT_SUBMITTED];
    if (!allowedStatuses.includes(proposal.status)) {
      return { error: new Error("Extension can only be requested for proposals pending revision") };
    }

    // 3. Check late_submission_policy
    const { data: policySetting } = await this.db
      .from("system_settings")
      .select("value")
      .eq("key", "late_submission_policy")
      .maybeSingle();

    if (policySetting?.value) {
      const policy = policySetting.value;
      if (policy.enabled === false) {
        return { error: new Error("Extension requests are not allowed. Late submission policy is disabled.") };
      }
      if (policy.type === "until_date" && new Date() > new Date(policy.deadline)) {
        return { error: new Error("Extension requests are no longer accepted. The late submission window has closed.") };
      }
    }

    // 4. Check that the deadline has actually expired
    const { data: revisionSummary } = await this.db
      .from("proposal_revision_summary")
      .select("created_at, deadline")
      .eq("proposal_id", proposal_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (revisionSummary?.created_at && revisionSummary?.deadline) {
      const deadlineMs = new Date(revisionSummary.created_at).getTime() + revisionSummary.deadline * 86400000;
      if (Date.now() <= deadlineMs) {
        return { error: new Error("Your revision deadline has not expired yet. Please submit your revision directly.") };
      }
    }

    // 5. Check no pending extension request already exists
    const { data: existingRequest } = await this.db
      .from("proposal_extension_requests")
      .select("id")
      .eq("proposal_id", proposal_id)
      .eq("status", ProponentExtensionStatus.PENDING)
      .maybeSingle();

    if (existingRequest) {
      return { error: new Error("You already have a pending extension request for this proposal") };
    }

    // 6. Insert extension request
    const { data: extensionRequest, error: insertError } = await this.db
      .from("proposal_extension_requests")
      .insert({
        proposal_id,
        proponent_id: proponentId,
        reason,
      })
      .select()
      .single();

    if (insertError) return { error: insertError };

    // 7. Update proposal status to not_submitted if not already
    if (proposal.status !== Status.NOT_SUBMITTED) {
      await this.db
        .from("proposals")
        .update({ status: Status.NOT_SUBMITTED, updated_at: new Date().toISOString() })
        .eq("id", proposal_id);
    }

    // 8. Notify assigned RND user(s)
    const { data: rndAssignments } = await this.db
      .from("proposal_rnd")
      .select("rnd_id")
      .eq("proposal_id", proposal_id);

    if (rndAssignments?.length) {
      const notifications = rndAssignments.map((a: { rnd_id: string }) => ({
        user_id: a.rnd_id,
        message: `Proponent has requested a deadline extension for proposal "${proposal.project_title}" (#${proposal_id}).`,
        link: "proposals",
      }));
      await this.db.from("notifications").insert(notifications);
    }

    // 9. Log activity
    await logActivity(this.db, {
      user_id: proponentId,
      action: "proponent_extension_requested",
      category: "proposal",
      target_id: String(proposal_id),
      target_type: "proposal",
      details: { reason },
    });

    return { data: extensionRequest, error: null };
  }

  async reviewProponentExtension(input: ReviewProponentExtensionInput, rndId: string) {
    const { extension_request_id, proposal_id, action, review_note, new_deadline_days } = input;

    // 1. Fetch the extension request
    const { data: extRequest, error: fetchError } = await this.db
      .from("proposal_extension_requests")
      .select("*")
      .eq("id", extension_request_id)
      .single();

    if (fetchError || !extRequest) {
      return { error: fetchError || new Error("Extension request not found") };
    }

    if (extRequest.status !== ProponentExtensionStatus.PENDING) {
      return { error: new Error("This extension request has already been reviewed") };
    }

    if (extRequest.proposal_id !== proposal_id) {
      return { error: new Error("Extension request does not match the specified proposal") };
    }

    // 2. Fetch proposal for context
    const { data: proposal } = await this.db
      .from("proposals")
      .select("id, status, project_title, proponent_id")
      .eq("id", proposal_id)
      .single();

    if (!proposal) {
      return { error: new Error("Proposal not found") };
    }

    if (action === "approved") {
      // 3a. Approve: update extension request
      const { error: updateExtError } = await this.db
        .from("proposal_extension_requests")
        .update({
          status: ProponentExtensionStatus.APPROVED,
          reviewed_by: rndId,
          reviewed_at: new Date().toISOString(),
          review_note: review_note || null,
          new_deadline_days: new_deadline_days,
        })
        .eq("id", extension_request_id);

      if (updateExtError) return { error: updateExtError };

      // 3b. Update proposal: status back to revision, flag as late submission
      const targetStatus = proposal.status === Status.NOT_SUBMITTED
        ? Status.REVISION_RND
        : proposal.status;

      const { error: updateProposalError } = await this.db
        .from("proposals")
        .update({
          status: targetStatus,
          is_late_submission: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", proposal_id);

      if (updateProposalError) return { error: updateProposalError };

      // 3c. Notify proponent
      await this.db.from("notifications").insert({
        user_id: proposal.proponent_id,
        message: `Your extension request for proposal "${proposal.project_title}" has been approved. You have ${new_deadline_days} day(s) to submit your revision.`,
        link: "profile",
      });

      // 3d. Log
      await logActivity(this.db, {
        user_id: rndId,
        action: "proponent_extension_approved",
        category: "proposal",
        target_id: String(proposal_id),
        target_type: "proposal",
        details: { extension_request_id, new_deadline_days, review_note },
      });

      return { data: { proposal_id, action, new_deadline_days }, error: null };

    } else if (action === "rejected") {
      // 4a. Reject: update extension request
      const { error: updateExtError } = await this.db
        .from("proposal_extension_requests")
        .update({
          status: ProponentExtensionStatus.REJECTED,
          reviewed_by: rndId,
          reviewed_at: new Date().toISOString(),
          review_note: review_note || null,
        })
        .eq("id", extension_request_id);

      if (updateExtError) return { error: updateExtError };

      // 4b. Update proposal status to rejected_rnd
      const { error: updateProposalError } = await this.db
        .from("proposals")
        .update({
          status: Status.REJECTED_RND,
          updated_at: new Date().toISOString(),
        })
        .eq("id", proposal_id);

      if (updateProposalError) return { error: updateProposalError };

      // 4c. Notify proponent
      await this.db.from("notifications").insert({
        user_id: proposal.proponent_id,
        message: `Your extension request for proposal "${proposal.project_title}" has been rejected. The proposal has been closed.`,
        link: "profile",
      });

      // 4d. Log
      await logActivity(this.db, {
        user_id: rndId,
        action: "proponent_extension_rejected",
        category: "proposal",
        target_id: String(proposal_id),
        target_type: "proposal",
        details: { extension_request_id, review_note },
      });

      return { data: { proposal_id, action }, error: null };
    }

    return { error: new Error("Invalid action") };
  }

  async getProponentExtensionRequests(proposalId?: number) {
    let query = this.db
      .from("proposal_extension_requests")
      .select("*, proponent:users!proposal_extension_requests_proponent_id_fkey(id, first_name, last_name, email), proposal:proposals!proposal_extension_requests_proposal_id_fkey(id, project_title, status)")
      .order("created_at", { ascending: false });

    if (proposalId) {
      query = query.eq("proposal_id", proposalId);
    }

    const { data, error } = await query;
    return { data, error };
  }

  /**
   * Scheduled task: find evaluators who haven't responded by their deadline
   * and auto-decline them. Notify RND + Admin users.
   */
  async checkAndDeclineOverdueEvaluators(): Promise<{
    processed: number;
    errors: string[];
    details: Array<{ proposal_id: number; evaluator_id: string }>;
  }> {
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD in PH time (TZ set)

    // Find pending assignments past their deadline.
    // Include proposal_version_id so the corresponding proposal_evaluators
    // update can be version-scoped — otherwise a stale v1 row could also get
    // auto-declined alongside the live v2 row.
    const { data: overdueRecords, error: fetchError } = await this.db
      .from("proposal_assignment_tracker")
      .select("id, proposal_id, evaluator_id, deadline_at, proposal_version_id")
      .eq("status", AssignmentTracker.PENDING)
      .lt("deadline_at", today);

    if (fetchError) {
      console.error("Failed to fetch overdue records:", fetchError);
      return { processed: 0, errors: [fetchError.message], details: [] };
    }

    if (!overdueRecords || overdueRecords.length === 0) {
      return { processed: 0, errors: [], details: [] };
    }

    const errors: string[] = [];
    const details: Array<{ proposal_id: number; evaluator_id: string }> = [];

    for (const record of overdueRecords) {
      try {
        // 1. Update tracker status to decline
        await this.db
          .from("proposal_assignment_tracker")
          .update({
            status: AssignmentTracker.DECLINE,
            remarks: "Auto-declined: evaluator did not respond by deadline",
          })
          .eq("id", record.id);

        // 2. Update proposal_evaluators status to decline (only if still pending)
        //    — scoped to the same version this tracker row points at.
        const versionFilter = (record as any).proposal_version_id;
        {
          let pe = this.db
            .from("proposal_evaluators")
            .update({ status: EvaluatorStatus.DECLINE })
            .eq("proposal_id", record.proposal_id)
            .eq("evaluator_id", record.evaluator_id)
            .eq("status", EvaluatorStatus.PENDING);
          if (versionFilter) pe = pe.eq("proposal_version_id", versionFilter);
          await pe;
        }

        // 3. Fetch evaluator info and RND user who assigned them
        let evalDataQuery = this.db
          .from("proposal_evaluators")
          .select("forwarded_by_rnd, proposal_id(project_title)")
          .eq("proposal_id", record.proposal_id)
          .eq("evaluator_id", record.evaluator_id);
        if (versionFilter) evalDataQuery = evalDataQuery.eq("proposal_version_id", versionFilter);
        const { data: evalData } = await evalDataQuery.single();

        const { data: evaluator } = await this.db
          .from("users")
          .select("first_name, last_name")
          .eq("id", record.evaluator_id)
          .single();

        const evalName = evaluator
          ? `${evaluator.first_name} ${evaluator.last_name}`.trim()
          : "An evaluator";
        const proposalTitle =
          (evalData?.proposal_id as any)?.project_title || `#${record.proposal_id}`;

        const message = `${evalName} did not respond to the evaluation request for "${proposalTitle}" by the deadline and has been auto-removed. Please assign a replacement evaluator.`;

        // 4. Notify the RND user who assigned this evaluator
        if (evalData?.forwarded_by_rnd) {
          await this.db.from("notifications").insert({
            user_id: evalData.forwarded_by_rnd,
            message,
            is_read: false,
            link: "proposals",
          });
        }

        // 5. Notify all admin users
        const { data: admins } = await this.db
          .from("users")
          .select("id")
          .contains("roles", ["admin"]);

        if (admins && admins.length > 0) {
          const adminNotifs = admins
            .filter((a) => a.id !== evalData?.forwarded_by_rnd) // avoid duplicate
            .map((a) => ({ user_id: a.id, message, is_read: false, link: "proposals" }));

          if (adminNotifs.length > 0) {
            await this.db.from("notifications").insert(adminNotifs);
          }
        }

        // 6. Log activity
        await logActivity(this.db, {
          user_id: record.evaluator_id,
          action: "evaluator_auto_declined_overdue",
          category: "evaluation",
          target_id: String(record.proposal_id),
          target_type: "proposal",
          details: {
            reason: "deadline_exceeded",
            deadline_at: record.deadline_at,
          },
        });

        details.push({
          proposal_id: record.proposal_id,
          evaluator_id: record.evaluator_id,
        });
      } catch (err: any) {
        console.error(
          `Failed to process overdue record ${record.id}:`,
          err
        );
        errors.push(`Record ${record.id}: ${err.message}`);
      }
    }

    return { processed: details.length, errors, details };
  }

  // ============================================================
  // Phase 1 of LIB feature: budget subcategories
  // ============================================================
  // Draft autosave lives entirely in the browser's localStorage — server-side drafts were
  // removed because they added a stale-draft UX problem without meaningfully improving
  // the crash-resilience story.

  // Returns the admin-managed subcategory list. Frontend uses this to populate the budget
  // breakdown dropdown. Filter by category (ps/mooe/co) when provided to keep payloads small.
  async getBudgetSubcategories(category?: string) {
    let query = this.db
      .from("budget_subcategories")
      .select("id, category, code, label, sort_order, active")
      .eq("active", true)
      .order("category", { ascending: true })
      .order("sort_order", { ascending: true });

    if (category) {
      query = query.eq("category", category);
    }

    return query;
  }

  // ── Feature 3: Proposal Timeline ──────────────────────────────────────────
  async getProposalTimeline(proposal_id: number) {
    const { data, error } = await this.db
      .from("pms_logs")
      .select("id, user_id, action, details, created_at")
      .eq("target_id", String(proposal_id))
      .eq("target_type", "proposal")
      .order("created_at", { ascending: true });

    if (error) return { data: null, error };

    // Fetch user names for all actors
    const userIds = [...new Set((data || []).map((l: any) => l.user_id))];
    const { data: users } =
      userIds.length > 0
        ? await this.db.from("users").select("id, first_name, last_name").in("id", userIds)
        : { data: [] as any[] };

    const userMap = new Map(
      (users || []).map((u: any) => [u.id, `${u.first_name || ""}${u.last_name ? " " + u.last_name : ""}`.trim()]),
    );

    return {
      data: (data || []).map((log: any) => ({
        id: log.id,
        action: log.action,
        actor: userMap.get(log.user_id) || "System",
        details: log.details,
        timestamp: log.created_at,
      })),
      error: null,
    };
  }

  // ── Feature 4: Proposal Revision Context ──────────────────────────────────
  async getProposalRevisionContext(proposal_id: number) {
    const [versions, revisions, budgetVersions] = await Promise.all([
      this.db
        .from("proposal_version")
        .select("id, file_url, created_at")
        .eq("proposal_id", proposal_id)
        .order("created_at", { ascending: true }),
      this.db
        .from("proposal_revision_summary")
        .select("*")
        .eq("proposal_id", proposal_id)
        .order("created_at", { ascending: true }),
      this.db
        .from("proposal_budget_versions")
        .select("id, version_number, grand_total, created_at, proposal_budget_items(id, source, category, item_name, spec, quantity, unit, unit_price, total_amount, display_order)")
        .eq("proposal_id", proposal_id)
        .order("version_number", { ascending: true }),
    ]);

    // Fetch RND names for revision summaries
    const rndIds = [...new Set((revisions.data || []).filter((r: any) => r.rnd_id).map((r: any) => r.rnd_id))];
    const { data: rndUsers } =
      rndIds.length > 0
        ? await this.db.from("users").select("id, first_name, last_name").in("id", rndIds)
        : { data: [] as any[] };
    const rndMap = new Map(
      (rndUsers || []).map((u: any) => [u.id, `${u.first_name || ""}${u.last_name ? " " + u.last_name : ""}`.trim()]),
    );

    const enrichedRevisions = (revisions.data || []).map((r: any) => ({
      ...r,
      rnd_name: rndMap.get(r.rnd_id) || "Unknown",
    }));

    return {
      data: {
        versions: versions.data || [],
        revision_summaries: enrichedRevisions,
        budget_versions: budgetVersions.data || [],
      },
      error: versions.error || revisions.error || budgetVersions.error || null,
    };
  }
}
