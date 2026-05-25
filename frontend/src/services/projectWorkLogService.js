import axiosInstance from "../api/axiosInstance";
import { ENDPOINTS } from "../api/endpoints";

export const getProjectWorkLogsApi = async (projectIdentifier) => {
  const res = await axiosInstance.get(ENDPOINTS.PROJECT_WORKLOGS.PROJECT(projectIdentifier));
  return res.data;
};

export const addProjectWorkLogApi = async (projectIdentifier, payload) => {
  const config = {};

  const res = await axiosInstance.post(
    ENDPOINTS.PROJECT_WORKLOGS.PROJECT(projectIdentifier),
    payload,
    config
  );

  return res.data;
};
