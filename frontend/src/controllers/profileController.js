import {
  getMyProfile,
  createProfileRequest,
  getMyRequests,
  getAllRequests,
  approveRequest,
  rejectRequest,
  adminChangePassword,
} from "../models/profileModel";

export const handleGetMyProfile = async () => await getMyProfile();
export const handleCreateProfileRequest = async (payload) => await createProfileRequest(payload);
export const handleGetMyRequests = async () => await getMyRequests();
export const handleGetAllRequests = async () => await getAllRequests();
export const handleApproveRequest = async (id, payload) => await approveRequest(id, payload);
export const handleRejectRequest = async (id, payload) => await rejectRequest(id, payload);
export const handleAdminChangePassword = async (id, payload) => await adminChangePassword(id, payload);
