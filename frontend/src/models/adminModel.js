import {
  getAllUsersAdminApi,
  createUserApi,
  updateUserApi,
  toggleUserStatusApi,
} from "../services/adminService";

export const getAllUsersAdminModel = async () => {
  return await getAllUsersAdminApi();
};

export const createUserModel = async (payload) => {
  return await createUserApi(payload);
};

export const updateUserModel = async (id, payload) => {
  return await updateUserApi(id, payload);
};

export const toggleUserStatusModel = async (id) => {
  return await toggleUserStatusApi(id);
};
