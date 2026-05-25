import { 
  getInbox, getConversation, sendMessage, getUnreadCount, searchUsers, createDirectChat,
  createGroupChat, renameGroupChat, addGroupMembers, removeGroupMember, makeGroupAdmin
} from "../models/messageModel";

export const handleGetInbox = async () => await getInbox();
export const handleGetConversation = async (id, page, limit) => await getConversation(id, page, limit);
export const handleSendMessage = async (payload) => await sendMessage(payload);
export const handleGetUnreadCount = async () => await getUnreadCount();
export const handleSearchUsers = async (query) => await searchUsers(query);
export const handleCreateDirectChat = async (participantId) => await createDirectChat(participantId);
export const handleCreateGroupChat = async (name, participantIds) => await createGroupChat(name, participantIds);
export const handleRenameGroupChat = async (chatId, name) => await renameGroupChat(chatId, name);
export const handleAddGroupMembers = async (chatId, userIds) => await addGroupMembers(chatId, userIds);
export const handleRemoveGroupMember = async (chatId, userId) => await removeGroupMember(chatId, userId);
export const handleMakeGroupAdmin = async (chatId, userId) => await makeGroupAdmin(chatId, userId);
