import {
  getMentionUsersApi,
  getAllUsersApi,
  createUserApi,
  updateUserApi,
  toggleUserStatusApi,
} from "../services/userService";

export const getMentionUsers = async () => {
  return await getMentionUsersApi();
};

export const getAllUsers = async () => {
  return await getAllUsersApi();
};

export const createUser = async (payload) => {
  return await createUserApi(payload);
};

export const updateUser = async (id, payload) => {
  return await updateUserApi(id, payload);
};

export const toggleUserStatus = async (id) => {
  return await toggleUserStatusApi(id);
};
