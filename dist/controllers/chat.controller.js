"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getChats = exports.getChatMessages = exports.createChatBotMessage = void 0;
const __1 = require("..");
const createChatBotMessage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = req.userId;
        const { messageText, chatId } = req.body;
        if (!messageText || messageText.trim() === "") {
            res
                .status(400)
                .json({ success: false, message: "Message text cannot be empty" });
            return;
        }
        const user = yield __1.prisma.user.findUnique({
            where: { id: userId },
            include: {
                grade: true,
            },
        });
        if (!user) {
            res.status(400).json({ success: false, message: "invalid user id" });
            return;
        }
        const bot = yield __1.prisma.user.findUnique({
            where: { email: "chatbot@bot.com" },
        });
        if (!bot) {
            res
                .status(500)
                .json({ success: false, message: "Bot account not found" });
            return;
        }
        let chat = null;
        let chatMessages = [];
        if (chatId) {
            chat = yield __1.prisma.chat.findUnique({
                where: { id: chatId },
            });
            if (!chat) {
                res.status(400).json({ success: false, message: "chat not found" });
                return;
            }
            // lets take only the 30 latest messages for context
            chatMessages = yield __1.prisma.message.findMany({
                where: {
                    chatId: chat.id,
                },
                orderBy: {
                    messageCreatedAt: "desc",
                },
                take: 30,
            });
        }
        else {
            // create new chat
            // get chat title from open ai api
            const titleMessages = [
                {
                    role: "system",
                    content: "you are an assistant that gives summarized titles according to a message being passed to you",
                },
                {
                    role: "user",
                    content: messageText.trim(),
                },
            ];
            const openAIResponse = yield __1.openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: titleMessages,
            });
            const chatTitle = openAIResponse.choices[0].message.content;
            chat = yield __1.prisma.chat.create({
                data: {
                    title: chatTitle || "chat 1",
                    userId: user.id,
                    botId: bot.id,
                },
            });
        }
        // Create user's message
        const newMessage = yield __1.prisma.message.create({
            data: {
                messageText: messageText.trim(),
                messageSenderId: user.id,
                messageReceiverId: bot.id,
                chatId: chat.id,
            },
        });
        // Prepare messages for OpenAI API with proper typing
        const formattedMessages = chatMessages
            .sort((a, b) => a.messageCreatedAt.getTime() - b.messageCreatedAt.getTime())
            .map((msg) => ({
            role: msg.messageSenderId === bot.id ? "assistant" : "user",
            content: msg.messageText,
        }));
        // Add system message at the beginning
        formattedMessages.unshift({
            role: "system",
            content: `You are an AI Assistant that will be assisting students questions,queries and doubts
                regarding academic subjects like maths, science, AI and more.you will receive 
                a list of messages that provide context of the conversation so give response accordingly. 
                The last message in the array of messages is the actual prompt so if the new prompt topic has no context 
                with the previous context then only focus on the new prompt.The student is in grade ${(_a = user.grade) === null || _a === void 0 ? void 0 : _a.grade} so 
                curate answers accordingly`,
        });
        // Add current message
        formattedMessages.push({
            role: "user",
            content: messageText.trim(),
        });
        const openAIResponse = yield __1.openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: formattedMessages,
        });
        const replyMessageText = openAIResponse.choices[0].message.content;
        if (!replyMessageText) {
            throw new Error("Failed to reply. Please try again");
        }
        const replyMessage = yield __1.prisma.message.create({
            data: {
                messageText: replyMessageText.trim(),
                messageSenderId: bot.id,
                messageReceiverId: user.id,
                chatId: chat.id,
            },
        });
        let response;
        if (chatId) {
            response = {
                success: true,
                response: replyMessage,
            };
        }
        else {
            response = {
                success: true,
                chat: chat,
                response: replyMessage,
            };
        }
        res.status(200).json(response);
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "internal server error" });
    }
});
exports.createChatBotMessage = createChatBotMessage;
const getChatMessages = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { chatId } = req.params;
        const userId = req.userId;
        const { page, limit } = req.query;
        const user = yield __1.prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            res.status(400).json({
                success: false,
                message: "invalid user id",
            });
            return;
        }
        const chat = yield __1.prisma.chat.findUnique({ where: { id: chatId } });
        if (!chat) {
            res.status(400).json({
                success: false,
                message: "invalid chat id",
            });
            return;
        }
        // get 20 latest messages
        const pageNum = parseInt(page) || 1;
        const limitNum = parseInt(limit) || 20;
        const messages = yield __1.prisma.message.findMany({
            where: {
                chatId: chat.id,
            },
            orderBy: {
                messageCreatedAt: "desc",
            },
            skip: pageNum * limitNum - limitNum,
            take: limitNum,
        });
        // so currently its ordered from latest to oldest
        // but we want to display it from oldest to latest
        messages.reverse();
        const totalMessages = yield __1.prisma.message.count({
            where: { chatId: chat.id },
        });
        const totalPages = Math.ceil(totalMessages / limitNum);
        res
            .status(200)
            .json({ success: true, messages: messages, totalPages: totalPages });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "internal server error",
        });
    }
});
exports.getChatMessages = getChatMessages;
const getChats = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId;
        const user = yield __1.prisma.user.findUnique({
            where: {
                id: userId,
            },
        });
        if (!user) {
            res.status(400).json({ success: false, message: "invalid user id" });
            return;
        }
        const chats = yield __1.prisma.chat.findMany({ where: { userId: user.id } });
        res.status(200).json({
            success: true,
            chats,
        });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "internal server error" });
    }
});
exports.getChats = getChats;
