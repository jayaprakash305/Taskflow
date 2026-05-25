import axiosInstance from "../api/axiosInstance";
import { ENDPOINTS } from "../api/endpoints";

export const getTicketWorkLogsApi = async (ticketIdentifier) => {
  const res = await axiosInstance.get(ENDPOINTS.WORKLOGS.TICKET(ticketIdentifier));
  return res.data;
};

export const addTicketWorkLogApi = async (ticketIdentifier, payload) => {
  const config = {};

  const res = await axiosInstance.post(
    ENDPOINTS.WORKLOGS.TICKET(ticketIdentifier),
    payload,
    config
  );

  return res.data;
};
