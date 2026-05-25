import axiosInstance from "../api/axiosInstance";
import { ENDPOINTS } from "../api/endpoints";

export const getMentionUsersApi = async (params = {}) => {
  const res = await axiosInstance.get(ENDPOINTS.USERS.MENTIONS, { params });
  return res.data;
};

export const getAllUsersApi = async () => {
  const res = await axiosInstance.get(ENDPOINTS.ADMIN.USERS.GET_ALL);
  return res.data;
};

export const createUserApi = async (payload) => {
  const res = await axiosInstance.post(ENDPOINTS.ADMIN.USERS.CREATE, payload);
  return res.data;
};

export const updateUserApi = async (id, payload) => {
  const res = await axiosInstance.put(ENDPOINTS.ADMIN.USERS.UPDATE(id), payload);
  return res.data;
};

export const toggleUserStatusApi = async (id) => {
  const res = await axiosInstance.patch(ENDPOINTS.ADMIN.USERS.TOGGLE_STATUS(id));
  return res.data;
};
