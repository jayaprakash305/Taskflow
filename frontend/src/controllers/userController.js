import {
  getMentionUsers,
  getAllUsers,
  createUser,
  updateUser,
  toggleUserStatus,
} from "../models/userModel";

export const handleGetMentionUsers = async () => {
  return await getMentionUsers();
};

export const handleGetUsers = async () => {
  return await getAllUsers();
};

export const handleCreateUser = async (payload) => {
  return await createUser(payload);
};

export const handleUpdateUser = async (id, payload) => {
  return await updateUser(id, payload);
};

export const handleToggleUserStatus = async (id) => {
  return await toggleUserStatus(id);
};
