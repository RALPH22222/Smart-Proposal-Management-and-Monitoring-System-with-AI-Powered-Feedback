import { api } from "../../utils/axios";
import type { User } from "../../types/admin";

export type CreateAccountPayload = {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  middle_ini?: string;
  roles: string[];
};

export type UpdateAccountPayload = {
  user_id: string;
  first_name?: string;
  last_name?: string;
  middle_ini?: string;
  roles?: string[];
};

export const AccountApi = {
  createAccount: async (payload: CreateAccountPayload) => {
    const { data } = await api.post("/admin/create-account", payload, {
      withCredentials: true,
    });
    return data;
  },

  getAccounts: async (filters?: { role?: string; is_disabled?: string }): Promise<User[]> => {
    const params = new URLSearchParams();
    if (filters?.role) params.append("role", filters.role);
    if (filters?.is_disabled !== undefined) params.append("is_disabled", filters.is_disabled);

    const { data } = await api.get<User[]>(`/admin/accounts?${params.toString()}`, {
      withCredentials: true,
    });
    return data;
  },

  updateAccount: async (payload: UpdateAccountPayload) => {
    const { data } = await api.post("/admin/update-account", payload, {
      withCredentials: true,
    });
    return data;
  },

  toggleAccountStatus: async (userId: string, isDisabled: boolean) => {
    const { data } = await api.post(
      "/admin/toggle-account-status",
      { user_id: userId, is_disabled: isDisabled },
      { withCredentials: true },
    );
    return data;
  },
};
