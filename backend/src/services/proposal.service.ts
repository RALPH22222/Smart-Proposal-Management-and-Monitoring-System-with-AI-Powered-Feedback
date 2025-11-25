import { SupabaseClient } from "@supabase/supabase-js";
import { Status } from "../types/proposal";
import { ProposalInput } from "../schemas/proposal-schema";

export class ProposalService {
  constructor(private db: SupabaseClient) {}

  async create(payload: ProposalInput) {
    const { budget, ...proposal } = payload;
    const { data, error } = await this.db
      .from("proposals")
      .insert({ ...proposal, status: Status.REVIEW_RND })
      .select()
      .single();

    if (!error) {
      const proposal_id = data.id;
      const estimated_budget = budget.map((item) => ({ ...item, proposal_id }));
      const budget_result = await this.db
        .from("estimated_budget")
        .insert(estimated_budget);

      return { error: budget_result.error };
    }

    return { error };
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
      filters.push(`title.ilike.${search}`);
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

  async getAgency(search: string) {
    const { data, error } = await this.db
      .from("agencies")
      .select(`*`)
      .ilike("name", `%${search}%`);

    return { data, error };
  }
  async getCooperatingAgency(search: string) {
    const { data, error } = await this.db
      .from("cooperating_agencies")
      .select(`*`)
      .ilike("name", `%${search}%`);

    return { data, error };
  }
  async getDepartment(search: string) {
    const { data, error } = await this.db
      .from("departments")
      .select(`*`)
      .ilike("name", `%${search}%`);

    return { data, error };
  }
  async getDiscipline(search: string) {
    const { data, error } = await this.db
      .from("disciplines")
      .select(`*`)
      .ilike("name", `%${search}%`);

    return { data, error };
  }
  async getSector(search: string) {
    const { data, error } = await this.db
      .from("sectors")
      .select(`*`)
      .ilike("name", `%${search}%`);

    return { data, error };
  }
}
