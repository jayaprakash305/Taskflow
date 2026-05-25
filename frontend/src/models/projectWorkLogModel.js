import {
  getProjectWorkLogsApi,
  addProjectWorkLogApi,
} from "../services/projectWorkLogService";

export const getProjectWorkLogs = async (projectIdentifier) => {
  return await getProjectWorkLogsApi(projectIdentifier);
};

export const addProjectWorkLog = async (projectIdentifier, payload) => {
  return await addProjectWorkLogApi(projectIdentifier, payload);
};
