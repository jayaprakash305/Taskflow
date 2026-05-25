import {
  addProjectComment,
  createProject,
  getMyAssignedProjects,
  getMyCreatedProjects,
  getProjectComments,
  getProjectDetails,
  getAllProjects,

  assignProject,
  updateProjectDetails,
  deleteProject,
} from "../models/projectModel";

export const handleGetMyCreatedProjects = async () => {
  return await getMyCreatedProjects();
};

export const handleGetMyAssignedProjects = async () => {
  return await getMyAssignedProjects();
};

export const handleCreateProject = async (payload) => {
  return await createProject(payload);
};

export const handleGetProjectDetails = async (projectIdentifier) => {
  return await getProjectDetails(projectIdentifier);
};

export const handleGetAllProjects = async () => {
  return await getAllProjects();
};

export const handleGetProjectComments = async (projectIdentifier, params) => {
  return await getProjectComments(projectIdentifier, params);
};

export const handleAddProjectComment = async (projectIdentifier, payload) => {
  return await addProjectComment(projectIdentifier, payload);
};

export const handleAssignProject = async (projectIdentifier, payload) => {
  return await assignProject(projectIdentifier, payload);
};

export const handleUpdateProjectDetails = async (projectIdentifier, payload) => {
  return await updateProjectDetails(projectIdentifier, payload);
};

export const handleDeleteProject = async (projectIdentifier) => {
  return await deleteProject(projectIdentifier);
};
