import { api } from "../../utils/axios";

export type LookupTable = "departments" | "sectors" | "disciplines" | "agencies" | "priorities" | "tags";

export type LookupEntry = {
  id: number;
  name: string;
};

export type AgencyAddress = {
  id: string;
  city: string;
  barangay: string | null;
  street: string | null;
};

interface ApiResponse<T> {
  data: T;
}

export const LookupApi = {
  create: async (table: LookupTable, name: string): Promise<LookupEntry> => {
    const { data } = await api.post<ApiResponse<LookupEntry>>(
      "/admin/manage-lookup",
      { action: "create", table, name },
      { withCredentials: true },
    );
    return data.data;
  },

  update: async (table: LookupTable, id: number, name: string): Promise<LookupEntry> => {
    const { data } = await api.post<ApiResponse<LookupEntry>>(
      "/admin/manage-lookup",
      { action: "update", table, id, name },
      { withCredentials: true },
    );
    return data.data;
  },

  delete: async (table: LookupTable, id: number): Promise<void> => {
    await api.post(
      "/admin/manage-lookup",
      { action: "delete", table, id },
      { withCredentials: true },
    );
  },

  // Agency Address CRUD
  getAddresses: async (agencyId: number): Promise<AgencyAddress[]> => {
    const { data } = await api.post<AgencyAddress[]>(
      "/admin/manage-lookup",
      { action: "get_addresses", agency_id: agencyId },
      { withCredentials: true },
    );
    return data;
  },

  createAddress: async (agencyId: number, address: { city: string; barangay?: string; street?: string }): Promise<AgencyAddress> => {
    const { data } = await api.post<ApiResponse<AgencyAddress>>(
      "/admin/manage-lookup",
      { action: "create_address", agency_id: agencyId, ...address },
      { withCredentials: true },
    );
    return data.data;
  },

  updateAddress: async (id: string, address: { city: string; barangay?: string; street?: string }): Promise<AgencyAddress> => {
    const { data } = await api.post<ApiResponse<AgencyAddress>>(
      "/admin/manage-lookup",
      { action: "update_address", id, ...address },
      { withCredentials: true },
    );
    return data.data;
  },

  deleteAddress: async (id: string): Promise<void> => {
    await api.post(
      "/admin/manage-lookup",
      { action: "delete_address", id },
      { withCredentials: true },
    );
  },
};
