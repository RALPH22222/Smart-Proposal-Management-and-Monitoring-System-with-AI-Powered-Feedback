import { SupabaseClient } from "@supabase/supabase-js";
import { Status, ResearchClass, DevelopmentClass, ImplementationMode, PriorityArea } from "../types/proposal";

type ProposalInput = {
  proponent_id: number;
  department_id: number;
  sector_id: number;
  discpline_id: number;
  agency_id: number;
  program_title: string;
  project_title: string;
  email?: string;
  phone?: string;
  research_class: ResearchClass;
  development_class: DevelopmentClass;
  implementation_mode: ImplementationMode;
  priority_area: PriorityArea;
  plan_start_date: Date;
  plant_end_date: Date;
  source: string;
  ps: number;
  mooe: number;
};

export class ProposalService {
  constructor(private db: SupabaseClient) {}

  async create(payload: ProposalInput) {
    const { error } = await this.db.from("proposals").insert({ ...payload, status: Status.REVIEW_RND });

    return { error };
  }

  async getAll() {
    const { data, error } = await this.db.from("proposals").select(`
      *,
      proponent:users(name),
      department:departments(name),
      sector:sectors(name),
      discipline:disciplines(name),
      agency:agencies(name)
    `);

    return { data, error };
  }
}
