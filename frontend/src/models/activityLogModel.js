import {
  getProjectActivityLogsApi,
  getTicketActivityLogsApi,
} from "../services/activityLogService";

export const getProjectActivityLogs = async (id, params) => await getProjectActivityLogsApi(id, params);
export const getTicketActivityLogs = async (id, params) => await getTicketActivityLogsApi(id, params);