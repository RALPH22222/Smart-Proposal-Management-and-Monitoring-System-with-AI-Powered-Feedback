import { api } from "../../utils/axios";

export interface ActivityLog {
  id: number;
  user_id: string;
  action: string;
  category: string;
  target_id: string | null;
  target_type: string | null;
  details: Record<string, any>;
  created_at: string;
  user_name: string;
  user_roles: string[];
}

export interface ActivityLogsResponse {
  data: ActivityLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

export interface ActivityLogsFilters {
  category?: string;
  action?: string;
  user_id?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

export interface DashboardStats {
  users: {
    total: number;
    active: number;
    by_role: {
      proponent: number;
      evaluator: number;
      rnd: number;
      admin: number;
    };
  };
  proposals: {
    total: number;
    review_rnd: number;
    under_evaluation: number;
    revision_rnd: number;
    rejected_rnd: number;
    endorsed_for_funding: number;
    funded: number;
  };
  projects: {
    total: number;
    on_going: number;
    completed: number;
    on_hold: number;
    blocked: number;
  };
  activity: {
    last_24h: number;
    last_7d: number;
    recent: {
      id: number;
      action: string;
      category: string;
      target_id: string | null;
      target_type: string | null;
      details: Record<string, any>;
      created_at: string;
      user_name: string;
    }[];
  };
}

export const ActivityApi = {
  getDashboardStats: async (): Promise<DashboardStats> => {
    const { data } = await api.get<DashboardStats>("/admin/dashboard-stats", {
      withCredentials: true,
    });
    return data;
  },

  getLogs: async (filters?: ActivityLogsFilters): Promise<ActivityLogsResponse> => {
    const params = new URLSearchParams();
    if (filters?.category) params.append("category", filters.category);
    if (filters?.action) params.append("action", filters.action);
    if (filters?.user_id) params.append("user_id", filters.user_id);
    if (filters?.from) params.append("from", filters.from);
    if (filters?.to) params.append("to", filters.to);
    if (filters?.page) params.append("page", String(filters.page));
    if (filters?.limit) params.append("limit", String(filters.limit));

    const { data } = await api.get<ActivityLogsResponse>(
      `/admin/activity-logs?${params.toString()}`,
      { withCredentials: true }
    );
    return data;
  },
};
