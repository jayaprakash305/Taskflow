import axiosInstance from "../api/axiosInstance";
import { ENDPOINTS } from "../api/endpoints";

export const loginApi = async (payload) => {
  const response = await axiosInstance.post(ENDPOINTS.AUTH.LOGIN, payload);
  return response.data;
};

export const getMeApi = async () => {
  const response = await axiosInstance.get(ENDPOINTS.AUTH.ME);
  return response.data;
};

export const getUsersApi = async () => {
  const response = await axiosInstance.get(ENDPOINTS.AUTH.USERS);
  return response.data;
};