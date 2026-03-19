import { api } from "../utils/axios";
import { type FaqInfo } from "../schemas/faq-schema";

export const FaqApi = {
  getFaqInfo: async (): Promise<FaqInfo> => {
    const { data } = await api.get<{ data: FaqInfo }>("/public/faq");
    return data.data;
  },

  updateFaqInfo: async (faqData: FaqInfo): Promise<boolean> => {
    try {
      await api.put<{ message: string; data: FaqInfo }>("/admin/update-faq", faqData, {
        withCredentials: true,
      });
      return true;
    } catch (error) {
      console.error("Error updating faq info:", error);
      throw error;
    }
  },
};
