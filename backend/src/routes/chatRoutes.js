import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";
import {
  getOrCreateDirectChat,
  createGroupChat,
  getMyChats,
  getChatMessages,
  sendMessage,
  getUnreadCount,
  deleteMessageForMe,
  searchUsersForChat,
  renameGroupChat,
  addGroupMembers,
  removeGroupMember,
  makeGroupAdmin,
  removeGroupAdmin,
} from "../controllers/chatController.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/",                      getMyChats);
router.post("/direct",               getOrCreateDirectChat);
router.post("/group",                createGroupChat);
router.get("/unread-count",          getUnreadCount);
router.get("/search-users",          searchUsersForChat);
router.get("/:chatId/messages",      getChatMessages);
router.post("/:chatId/messages",     upload.array("attachments", 5), sendMessage);
router.delete("/messages/:messageId",deleteMessageForMe);

router.put("/:chatId/group-name", renameGroupChat);
router.post("/:chatId/members", addGroupMembers);
router.delete("/:chatId/members/:userId", removeGroupMember);
router.put("/:chatId/admins/:userId", makeGroupAdmin);
router.delete("/:chatId/admins/:userId", removeGroupAdmin);

export default router;
