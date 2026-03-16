import { api } from "../utils/axios";
import { type AboutInfo } from "../schemas/about-schema";

export const AboutApi = {
  getAboutInfo: async (): Promise<AboutInfo> => {
    const { data } = await api.get<{ data: AboutInfo }>("/public/about");
    return data.data;
  },

  updateAboutInfo: async (aboutData: AboutInfo): Promise<boolean> => {
    try {
      await api.put<{ message: string; data: AboutInfo }>("/admin/update-about", aboutData, {
        withCredentials: true,
      });
      return true;
    } catch (error) {
      console.error("Error updating about info:", error);
      throw error;
    }
  },
};
