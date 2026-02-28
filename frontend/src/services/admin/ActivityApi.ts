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

export const ActivityApi = {
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
