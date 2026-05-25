import {
  addTicketWorkLogApi,
  getTicketWorkLogsApi,
} from "../services/workLogService";

export const getTicketWorkLogs = async (ticketIdentifier) => {
  return await getTicketWorkLogsApi(ticketIdentifier);
};

export const addTicketWorkLog = async (ticketIdentifier, payload) => {
  return await addTicketWorkLogApi(ticketIdentifier, payload);
};
