"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_middleware_1 = require("../middlewares/auth.middleware");
const chat_controller_1 = require("../controllers/chat.controller");
const chat_middleware_1 = require("../middlewares/chat.middleware");
const router = express_1.default.Router();
router.post("/message", auth_middleware_1.authenticateUser, chat_middleware_1.sanitizeMessage, chat_controller_1.createChatBotMessage);
router.get("/:chatId/messages", auth_middleware_1.authenticateUser, chat_controller_1.getChatMessages);
router.get("/chats", auth_middleware_1.authenticateUser, chat_controller_1.getChats);
exports.default = router;
// get chats
// create message
// get chat messages
