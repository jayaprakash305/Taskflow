import {
  getMyProfileApi,
  createProfileRequestApi,
  getMyRequestsApi,
  getAllRequestsApi,
  approveRequestApi,
  rejectRequestApi,
  adminChangePasswordApi,
} from "../services/profileService";

export const getMyProfile = async () => await getMyProfileApi();
export const createProfileRequest = async (payload) => await createProfileRequestApi(payload);
export const getMyRequests = async () => await getMyRequestsApi();
export const getAllRequests = async () => await getAllRequestsApi();
export const approveRequest = async (id, payload) => await approveRequestApi(id, payload);
export const rejectRequest = async (id, payload) => await rejectRequestApi(id, payload);
export const adminChangePassword = async (id, payload) => await adminChangePasswordApi(id, payload);
