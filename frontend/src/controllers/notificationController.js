import {
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../models/notificationModel";

export const handleGetNotifications = async () => await getNotifications();
export const handleGetUnreadNotificationCount = async () => await getUnreadNotificationCount();
export const handleMarkNotificationAsRead = async (id) => await markNotificationAsRead(id);
export const handleMarkAllNotificationsAsRead = async () => await markAllNotificationsAsRead();