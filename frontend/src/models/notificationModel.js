import {
  getNotificationsApi,
  getUnreadNotificationCountApi,
  markAllNotificationsAsReadApi,
  markNotificationAsReadApi,
} from "../services/notificationService";

export const getNotifications = async () => await getNotificationsApi();
export const getUnreadNotificationCount = async () => await getUnreadNotificationCountApi();
export const markNotificationAsRead = async (id) => await markNotificationAsReadApi(id);
export const markAllNotificationsAsRead = async () => await markAllNotificationsAsReadApi();