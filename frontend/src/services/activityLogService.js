import axiosInstance from "../api/axiosInstance";
import { ENDPOINTS } from "../api/endpoints";

export const getProjectActivityLogsApi = async (id, params = {}) => {
  const res = await axiosInstance.get(ENDPOINTS.ACTIVITY_LOGS.PROJECT(id), { params });
  return res.data;
};

export const getTicketActivityLogsApi = async (id, params = {}) => {
  const res = await axiosInstance.get(ENDPOINTS.ACTIVITY_LOGS.TICKET(id), { params });
  return res.data;
};