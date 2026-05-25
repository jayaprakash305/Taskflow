import {
  createTicket,
  getMyAssignedTickets,
  getMyRaisedTickets,
  getTicketDetails,
  updateTicketStatus,
  updateTicketPriority,
  getTicketComments,
  addTicketComment,
  getTicketsByProject,
  assignTicket,
  searchTickets,
} from "../models/ticketModel";

export const handleCreateTicket = async (payload) => {
  return await createTicket(payload);
};

export const handleGetMyRaisedTickets = async () => {
  return await getMyRaisedTickets();
};

export const handleGetMyAssignedTickets = async () => {
  return await getMyAssignedTickets();
};

export const handleGetTicketDetails = async (id) => {
  return await getTicketDetails(id);
};

export const handleUpdateTicketStatus = async (id, payload) => {
  return await updateTicketStatus(id, payload);
};

export const handleUpdateTicketPriority = async (id, payload) => {
  return await updateTicketPriority(id, payload);
};

export const handleGetTicketComments = async (id) => {
  return await getTicketComments(id);
};

export const handleAddTicketComment = async (id, payload) => {
  return await addTicketComment(id, payload);
};

export const handleGetTicketsByProject = async (projectId) => {
  return await getTicketsByProject(projectId);
};

export const handleAssignTicket = async (id, payload) => {
  return await assignTicket(id, payload);
};

export const handleSearchTickets = async (params) => {
  return await searchTickets(params);
};