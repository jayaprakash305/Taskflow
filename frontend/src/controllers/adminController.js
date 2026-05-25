import {
  getAllUsersAdminModel,
  createUserModel,
  updateUserModel,
  toggleUserStatusModel,
} from "../models/adminModel";

export const handleGetAllUsersAdmin = async () => {
  return await getAllUsersAdminModel();
};

export const handleCreateUser = async (payload) => {
  return await createUserModel(payload);
};

export const handleUpdateUser = async (id, payload) => {
  return await updateUserModel(id, payload);
};

export const handleToggleUserStatus = async (id) => {
  return await toggleUserStatusModel(id);
};
