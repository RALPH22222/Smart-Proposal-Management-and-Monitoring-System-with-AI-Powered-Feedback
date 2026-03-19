import { api } from "../utils/axios";
import { type HomeInfo } from "../schemas/home-schema";

export const HomeApi = {
  getHomeInfo: async (): Promise<HomeInfo> => {
    try {
      const response = await api.get<{ data: HomeInfo }>("/public/home");
      return response.data.data;
    } catch (error) {
      console.error("Error fetching home info:", error);
      throw error;
    }
  },

  updateHomeInfo: async (data: HomeInfo): Promise<HomeInfo> => {
    try {
      const response = await api.put<{ data: HomeInfo }>("/admin/update-home", data, {
        withCredentials: true,
      });
      return response.data.data;
    } catch (error) {
      console.error("Error updating home info:", error);
      throw error;
    }
  },
};
