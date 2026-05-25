import {
  getProjectWorkLogs,
  addProjectWorkLog,
} from "../models/projectWorkLogModel";

export const handleGetProjectWorkLogs = async (projectIdentifier) => {
  return await getProjectWorkLogs(projectIdentifier);
};

export const handleAddProjectWorkLog = async (projectIdentifier, payload) => {
  return await addProjectWorkLog(projectIdentifier, payload);
};
