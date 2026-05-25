import axiosInstance from "../api/axiosInstance";
import { ENDPOINTS } from "../api/endpoints";

export const getMyCreatedProjectsApi = async () => {
  const response = await axiosInstance.get(ENDPOINTS.PROJECTS.MY_CREATED);
  return response.data;
};

export const getMyAssignedProjectsApi = async () => {
  const response = await axiosInstance.get(ENDPOINTS.PROJECTS.MY_ASSIGNED);
  return response.data;
};

export const createProjectApi = async (payload) => {
  const response = await axiosInstance.post(ENDPOINTS.PROJECTS.CREATE, payload);
  return response.data;
};

export const getProjectDetailsApi = async (projectIdentifier) => {
  const response = await axiosInstance.get(
    ENDPOINTS.PROJECTS.DETAILS(projectIdentifier)
  );
  return response.data;
};

export const getAllProjectsApi = async () => {
  const response = await axiosInstance.get(ENDPOINTS.PROJECTS.ALL);
  return response.data;
};

export const getProjectCommentsApi = async (projectIdentifier, params = {}) => {
  const response = await axiosInstance.get(ENDPOINTS.COMMENTS.PROJECT(projectIdentifier), { params });
  return response.data;
};

export const addProjectCommentApi = async (projectIdentifier, payload) => {
  const response = await axiosInstance.post(
    ENDPOINTS.COMMENTS.PROJECT(projectIdentifier),
    payload
  );
  return response.data;
};

export const assignProjectApi = async (projectIdentifier, payload) => {
  const response = await axiosInstance.patch(
    ENDPOINTS.PROJECTS.ASSIGN(projectIdentifier),
    payload
  );
  return response.data;
};

export const updateProjectDetailsApi = async (projectIdentifier, payload) => {
  const response = await axiosInstance.put(
    ENDPOINTS.PROJECTS.UPDATE_DETAILS(projectIdentifier),
    payload
  );
  return response.data;
};

export const deleteProjectApi = async (projectIdentifier) => {
  const response = await axiosInstance.delete(
    ENDPOINTS.PROJECTS.DELETE(projectIdentifier)
  );
  return response.data;
};
