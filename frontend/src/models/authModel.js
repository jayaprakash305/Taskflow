import { getMeApi, getUsersApi, loginApi } from "../services/authService";

export const loginUser = async (payload) => {
  return await loginApi(payload);
};

export const getCurrentUser = async () => {
  return await getMeApi();
};

export const getUsers = async () => {
  return await getUsersApi();
};