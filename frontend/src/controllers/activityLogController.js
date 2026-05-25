import {
  getProjectActivityLogs,
  getTicketActivityLogs,
} from "../models/activityLogModel";

export const handleGetProjectActivityLogs = async (id, params) => await getProjectActivityLogs(id, params);
export const handleGetTicketActivityLogs = async (id, params) => await getTicketActivityLogs(id, params);