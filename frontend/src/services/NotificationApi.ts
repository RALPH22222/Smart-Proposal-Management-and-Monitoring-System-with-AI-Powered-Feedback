import { api } from "../utils/axios";

export interface AppNotification {
  id: number;
  user_id: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface NotificationsResponse {
  data: AppNotification[];
  unread_count: number;
  total: number;
}

export const NotificationApi = {
  async getNotifications(limit = 50, offset = 0): Promise<NotificationsResponse> {
    const res = await api.get("/admin/notifications", {
      params: { limit, offset },
    });
    return res.data;
  },

  async markAsRead(notificationIds: number[]): Promise<void> {
    await api.post("/admin/mark-notification-read", {
      notification_ids: notificationIds,
    });
  },

  async markAllAsRead(): Promise<void> {
    await api.post("/admin/mark-notification-read", {
      mark_all: true,
    });
  },
};
