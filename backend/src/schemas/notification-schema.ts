import { z } from "zod";

export const getNotificationsSchema = z.object({
  user_id: z.string().uuid(),
  is_read: z.boolean().optional(),
  limit: z.number().int().positive().optional().default(50),
  offset: z.number().int().nonnegative().optional().default(0),
});

export type GetNotificationsInput = z.infer<typeof getNotificationsSchema>;

export const markNotificationReadSchema = z.object({
  notification_ids: z.array(z.number().int().positive()).min(1),
});

export type MarkNotificationReadInput = z.infer<typeof markNotificationReadSchema> & {
  user_id: string;
};

export const markAllNotificationsReadSchema = z.object({});

export type MarkAllNotificationsReadInput = {
  user_id: string;
};
