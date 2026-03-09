import { api } from "../utils/axios";
import type { ContactInfo } from "../schemas/contact-schema";

export const ContactApi = {
  getContacts: async (): Promise<ContactInfo> => {
    const { data } = await api.get<ContactInfo>("/public/contacts");
    return data;
  },

  updateContacts: async (payload: ContactInfo): Promise<{ message: string; data: ContactInfo }> => {
    const { data } = await api.put<{ message: string; data: ContactInfo }>("/admin/update-contacts", payload, {
      withCredentials: true,
    });
    return data;
  },
};
