import {
  createTicketApi,
  getMyAssignedTicketsApi,
  getMyRaisedTicketsApi,
  getTicketDetailsApi,
  updateTicketStatusApi,
  updateTicketPriorityApi,
  getTicketCommentsApi,
  addTicketCommentApi,
  getTicketsByProjectApi,
  assignTicketApi,
  searchTicketsApi,
} from "../services/ticketService"

export const createTicket = async (payload) => {
  return await createTicketApi(payload);
};

export const getMyRaisedTickets = async () => {
  return await getMyRaisedTicketsApi();
};

export const getMyAssignedTickets = async () => {
  return await getMyAssignedTicketsApi();
};

export const getTicketDetails = async (id) => {
  return await getTicketDetailsApi(id);
};

export const updateTicketStatus = async (id, payload) => {
  return await updateTicketStatusApi(id, payload);
};

export const updateTicketPriority = async (id, payload) => {
  return await updateTicketPriorityApi(id, payload);
};

export const getTicketComments = async (id, params) => {
  return await getTicketCommentsApi(id, params);
};

export const addTicketComment = async (id, payload) => {
  return await addTicketCommentApi(id, payload);
};

export const getTicketsByProject = async (projectId) => {
  return await getTicketsByProjectApi(projectId);
};

export const assignTicket = async (id, payload) => {
  return await assignTicketApi(id, payload);
};

export const searchTickets = async (params) => {
  return await searchTicketsApi(params);
};