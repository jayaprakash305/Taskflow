import axiosInstance from "../api/axiosInstance";
import { ENDPOINTS } from "../api/endpoints";

export const getNotificationsApi = async () => {
  const res = await axiosInstance.get(ENDPOINTS.NOTIFICATIONS.GET_ALL);
  return res.data;
};

export const getUnreadNotificationCountApi = async () => {
  const res = await axiosInstance.get(ENDPOINTS.NOTIFICATIONS.UNREAD_COUNT);
  return res.data;
};

export const markNotificationAsReadApi = async (id) => {
  const res = await axiosInstance.patch(ENDPOINTS.NOTIFICATIONS.MARK_AS_READ(id));
  return res.data;
};

export const markAllNotificationsAsReadApi = async () => {
  const res = await axiosInstance.patch(ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ);
  return res.data;
};