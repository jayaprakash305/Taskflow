import {
  getInboxApi, getConversationApi,
  sendMessageApi, getUnreadCountApi,
  searchUsersApi, createDirectChatApi,
  createGroupChatApi, renameGroupChatApi,
  addGroupMembersApi, removeGroupMemberApi, makeGroupAdminApi, removeGroupAdminApi
} from "../services/messageService";

export const getInbox = async () => await getInboxApi();
export const getConversation = async (chatId, page, limit) => await getConversationApi(chatId, page, limit);
export const sendMessage = async (payload) => await sendMessageApi(payload);
export const getUnreadCount = async () => await getUnreadCountApi();
export const searchUsers = async (query) => await searchUsersApi(query);
export const createDirectChat = async (participantId) => await createDirectChatApi(participantId);
export const createGroupChat = async (name, participantIds) => await createGroupChatApi(name, participantIds);
export const renameGroupChat = async (chatId, name) => await renameGroupChatApi(chatId, name);
export const addGroupMembers = async (chatId, userIds) => await addGroupMembersApi(chatId, userIds);
export const removeGroupMember = async (chatId, userId) => await removeGroupMemberApi(chatId, userId);
export const makeGroupAdmin = async (chatId, userId) => await makeGroupAdminApi(chatId, userId);
export const removeGroupAdmin = async (chatId, userId) => await removeGroupAdminApi(chatId, userId);
