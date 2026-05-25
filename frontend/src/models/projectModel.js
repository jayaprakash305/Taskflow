import {
  addProjectCommentApi,
  createProjectApi,
  getMyAssignedProjectsApi,
  getMyCreatedProjectsApi,
  getProjectCommentsApi,
  getProjectDetailsApi,
  getAllProjectsApi,

  assignProjectApi,
  updateProjectDetailsApi,
  deleteProjectApi,
} from "../services/projectService";

export const getMyCreatedProjects = async () => {
  return await getMyCreatedProjectsApi();
};

export const getMyAssignedProjects = async () => {
  return await getMyAssignedProjectsApi();
};

export const createProject = async (payload) => {
  return await createProjectApi(payload);
};

export const getProjectDetails = async (projectIdentifier) => {
  return await getProjectDetailsApi(projectIdentifier);
};

export const getAllProjects = async () => {
  return await getAllProjectsApi();
};

export const getProjectComments = async (projectIdentifier, params) => {
  return await getProjectCommentsApi(projectIdentifier, params);
};

export const addProjectComment = async (projectIdentifier, payload) => {
  return await addProjectCommentApi(projectIdentifier, payload);
};

export const assignProject = async (projectIdentifier, payload) => {
  return await assignProjectApi(projectIdentifier, payload);
};

export const updateProjectDetails = async (projectIdentifier, payload) => {
  return await updateProjectDetailsApi(projectIdentifier, payload);
};

export const deleteProject = async (projectIdentifier) => {
  return await deleteProjectApi(projectIdentifier);
};
