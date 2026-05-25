import axiosInstance from "../api/axiosInstance";

export const getInboxApi = () => axiosInstance.get("/chats").then(r => r.data);
export const getConversationApi = (id, page = 1, limit = 20) => axiosInstance.get(`/chats/${id}/messages?page=${page}&limit=${limit}`).then(r => r.data);
export const sendMessageApi = (payload) => {
  const chatId = payload instanceof FormData ? payload.get("chatId") : payload.chatId;
  const config = payload instanceof FormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};
  return axiosInstance.post(`/chats/${chatId}/messages`, payload, config).then(r => r.data);
};
export const getUnreadCountApi = () => axiosInstance.get("/chats/unread-count").then(r => r.data);
export const searchUsersApi = (query) => axiosInstance.get(`/chats/search-users?query=${query}`).then(r => r.data);
export const createDirectChatApi = (participantId) => axiosInstance.post("/chats/direct", { participantId }).then(r => r.data);
export const createGroupChatApi = (name, participantIds) => axiosInstance.post("/chats/group", { name, participantIds }).then(r => r.data);
export const renameGroupChatApi = (chatId, name) => axiosInstance.put(`/chats/${chatId}/group-name`, { name }).then(r => r.data);
export const addGroupMembersApi = (chatId, userIds) => axiosInstance.post(`/chats/${chatId}/members`, { userIds }).then(r => r.data);
export const removeGroupMemberApi = (chatId, userId) => axiosInstance.delete(`/chats/${chatId}/members/${userId}`).then(r => r.data);
export const makeGroupAdminApi = (chatId, userId) => axiosInstance.put(`/chats/${chatId}/admins/${userId}`).then(r => r.data);
export const removeGroupAdminApi = (chatId, userId) => axiosInstance.delete(`/chats/${chatId}/admins/${userId}`).then(r => r.data);
