import {
  addTicketWorkLog,
  getTicketWorkLogs,
} from "../models/workLogModel";

export const handleGetTicketWorkLogs = async (ticketIdentifier) => {
  return await getTicketWorkLogs(ticketIdentifier);
};

export const handleAddTicketWorkLog = async (ticketIdentifier, payload) => {
  return await addTicketWorkLog(ticketIdentifier, payload);
};
