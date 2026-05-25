import axiosInstance from "../api/axiosInstance";
import { ENDPOINTS } from "../api/endpoints";

export const createTicketApi = async (payload) => {
  const config = {};
  const res = await axiosInstance.post(ENDPOINTS.TICKETS.CREATE, payload, config);
  return res.data;
};

export const getMyRaisedTicketsApi = async () => {
  const res = await axiosInstance.get(ENDPOINTS.TICKETS.MY_RAISED);
  return res.data;
};

export const getMyAssignedTicketsApi = async () => {
  const res = await axiosInstance.get(ENDPOINTS.TICKETS.MY_ASSIGNED);
  return res.data;
};

export const getTicketDetailsApi = async (id) => {
  const res = await axiosInstance.get(ENDPOINTS.TICKETS.DETAILS(id));
  return res.data;
};

export const updateTicketStatusApi = async (id, payload) => {
  const res = await axiosInstance.patch(
    ENDPOINTS.TICKETS.UPDATE_STATUS(id),
    payload
  );
  return res.data;
};

export const updateTicketPriorityApi = async (id, payload) => {
  const res = await axiosInstance.patch(
    ENDPOINTS.TICKETS.UPDATE_PRIORITY(id),
    payload
  );
  return res.data;
};

export const getTicketCommentsApi = async (id, params = {}) => {
  const res = await axiosInstance.get(ENDPOINTS.COMMENTS.TICKET(id), { params });
  return res.data;
};

export const addTicketCommentApi = async (id, payload) => {
  const res = await axiosInstance.post(
    ENDPOINTS.COMMENTS.TICKET(id),
    payload
  );
  return res.data;
};

export const getTicketsByProjectApi = async (projectId) => {
  const res = await axiosInstance.get(ENDPOINTS.TICKETS.BY_PROJECT(projectId));
  return res.data;
};

export const assignTicketApi = async (id, payload) => {
  const res = await axiosInstance.patch(
    ENDPOINTS.TICKETS.ASSIGN(id),
    payload
  );
  return res.data;
};

export const searchTicketsApi = async (params) => {
  const res = await axiosInstance.get(ENDPOINTS.TICKETS.SEARCH, { params });
  return res.data;
};