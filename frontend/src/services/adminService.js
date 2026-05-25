import axiosInstance from "../api/axiosInstance";
import { ENDPOINTS } from "../api/endpoints";

export const getAllUsersAdminApi = async () => {
  const response = await axiosInstance.get(ENDPOINTS.ADMIN.USERS.GET_ALL);
  return response.data;
};

export const createUserApi = async (payload) => {
  const response = await axiosInstance.post(ENDPOINTS.ADMIN.USERS.CREATE, payload);
  return response.data;
};

export const updateUserApi = async (id, payload) => {
  const response = await axiosInstance.patch(ENDPOINTS.ADMIN.USERS.UPDATE(id), payload);
  return response.data;
};

export const toggleUserStatusApi = async (id) => {
  const response = await axiosInstance.patch(ENDPOINTS.ADMIN.USERS.TOGGLE_STATUS(id));
  return response.data;
};

// ── Admin Panel APIs ────────────────────────────────────────────
export const adminGetStatsApi = async () => {
  const response = await axiosInstance.get(ENDPOINTS.ADMIN.PANEL.STATS);
  return response.data;
};

export const adminGetAllProjectsApi = async (includeDeleted = false) => {
  const response = await axiosInstance.get(ENDPOINTS.ADMIN.PANEL.ALL_PROJECTS, {
    params: { includeDeleted },
  });
  return response.data;
};

export const adminGetAllTicketsApi = async () => {
  const response = await axiosInstance.get(ENDPOINTS.ADMIN.PANEL.ALL_TICKETS);
  return response.data;
};

export const adminDeleteTicketApi = async (id) => {
  const response = await axiosInstance.delete(ENDPOINTS.ADMIN.PANEL.DELETE_TICKET(id));
  return response.data;
};

export const adminRestoreProjectApi = async (id) => {
  const response = await axiosInstance.patch(ENDPOINTS.ADMIN.PANEL.RESTORE_PROJECT(id));
  return response.data;
};
