import axiosInstance from "../api/axiosInstance";
import { ENDPOINTS } from "../api/endpoints";

export const getMyProfileApi = async () => {
  const res = await axiosInstance.get(ENDPOINTS.PROFILE.ME);
  return res.data;
};

export const createProfileRequestApi = async (payload) => {
  const res = await axiosInstance.post(ENDPOINTS.PROFILE.CREATE_REQUEST, payload);
  return res.data;
};

export const getMyRequestsApi = async () => {
  const res = await axiosInstance.get(ENDPOINTS.PROFILE.MY_REQUESTS);
  return res.data;
};

export const getAllRequestsApi = async () => {
  const res = await axiosInstance.get(ENDPOINTS.PROFILE.ALL_REQUESTS);
  return res.data;
};

export const approveRequestApi = async (id, payload) => {
  const res = await axiosInstance.patch(ENDPOINTS.PROFILE.APPROVE(id), payload);
  return res.data;
};

export const rejectRequestApi = async (id, payload) => {
  const res = await axiosInstance.patch(ENDPOINTS.PROFILE.REJECT(id), payload);
  return res.data;
};

export const adminChangePasswordApi = async (id, payload) => {
  const res = await axiosInstance.put(ENDPOINTS.PROFILE.ADMIN_CHANGE_PASSWORD(id), payload);
  return res.data;
};
