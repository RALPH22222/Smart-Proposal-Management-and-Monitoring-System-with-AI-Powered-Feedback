import { type LogosInfo } from "../../schemas/logo-schema";
import { api } from "../../utils/axios";

export const LogosApi = {
  /**
   * Fetch system logos (public)
   */
  async getLogos(): Promise<LogosInfo> {
    const response = await api.get<{ data: LogosInfo }>("/public/logos");
    return response.data.data;
  },

  /**
   * Update system logos (Admin only)
   */
  async updateLogos(logos: LogosInfo): Promise<void> {
    await api.put("/admin/update-logos", logos);
  },
};
