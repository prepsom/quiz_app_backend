import express from "express";
import { authenticateUser } from "../middlewares/auth.middleware";
import {
  createChatBotMessage,
  getChatMessages,
  getChats,
} from "../controllers/chat.controller";
import { sanitizeMessage } from "../middlewares/chat.middleware";

const router = express.Router();

router.post(
  "/message",
  authenticateUser,
  sanitizeMessage,
  createChatBotMessage
);
router.get("/:chatId/messages", authenticateUser, getChatMessages);
router.get("/chats", authenticateUser, getChats);

export default router;

// get chats
// create message
// get chat messages
