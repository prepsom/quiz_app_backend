import { Request, Response } from "express";
import { openai, prisma } from "..";
import { Chat, Message } from "@prisma/client";
import { ChatCompletionMessageParam } from "openai/resources";

type createChatBotMessageRequest = {
  messageText: string;
  chatId?: string;
};

const createChatBotMessage = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const { messageText, chatId } = req.body as createChatBotMessageRequest;

    if (!messageText || messageText.trim() === "") {
      res
        .status(400)
        .json({ success: false, message: "Message text cannot be empty" });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        grade: true,
      },
    });
    if (!user) {
      res.status(400).json({ success: false, message: "invalid user id" });
      return;
    }

    const bot = await prisma.user.findUnique({
      where: { email: "chatbot@bot.com" },
    });
    if (!bot) {
      res
        .status(500)
        .json({ success: false, message: "Bot account not found" });
      return;
    }

    let chat: Chat | null = null;
    let chatMessages: Message[] = [];
    if (chatId) {
      chat = await prisma.chat.findUnique({
        where: { id: chatId },
      });
      if (!chat) {
        res.status(400).json({ success: false, message: "chat not found" });
        return;
      }

      // lets take only the 30 latest messages for context
      chatMessages = await prisma.message.findMany({
        where: {
          chatId: chat.id,
        },
        orderBy: {
          messageCreatedAt: "desc",
        },
        take: 30,
      });
    } else {
      // create new chat
      // get chat title from open ai api
      const titleMessages: ChatCompletionMessageParam[] = [
        {
          role: "system",
          content:
            "you are an assistant that gives summarized titles according to a message being passed to you",
        },
        {
          role: "user",
          content: messageText.trim(),
        },
      ];

      const openAIResponse = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: titleMessages,
      });

      const chatTitle = openAIResponse.choices[0].message.content;
      chat = await prisma.chat.create({
        data: {
          title: chatTitle || "chat 1",
          userId: user.id,
          botId: bot.id,
        },
      });
    }

    // Create user's message
    const newMessage = await prisma.message.create({
      data: {
        messageText: messageText.trim(),
        messageSenderId: user.id,
        messageReceiverId: bot.id,
        chatId: chat.id,
      },
    });

    // Prepare messages for OpenAI API with proper typing
    const formattedMessages: ChatCompletionMessageParam[] = chatMessages
      .sort(
        (a, b) => a.messageCreatedAt.getTime() - b.messageCreatedAt.getTime()
      )
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
                with the previous context then only focus on the new prompt.The student is in grade ${user.grade?.grade} so 
                curate answers accordingly`,
    });

    // Add current message
    formattedMessages.push({
      role: "user",
      content: messageText.trim(),
    });

    const openAIResponse = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: formattedMessages,
    });

    const replyMessageText = openAIResponse.choices[0].message.content;
    if (!replyMessageText) {
      throw new Error("Failed to reply. Please try again");
    }

    const replyMessage = await prisma.message.create({
      data: {
        messageText: replyMessageText.trim(),
        messageSenderId: bot.id,
        messageReceiverId: user.id,
        chatId: chat.id,
      },
    });

    type createChatBotMessageResponse = {
      success: boolean;
      chat?: Chat; // if a new chat was created
      response: Message;
    };

    let response: createChatBotMessageResponse;
    if (chatId) {
      response = {
        success: true,
        response: replyMessage,
      };
    } else {
      response = {
        success: true,
        chat: chat,
        response: replyMessage,
      };
    }

    res.status(200).json(response);
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "internal server error" });
  }
};

const getChatMessages = async (req: Request, res: Response) => {
  try {
    const { chatId } = req.params as { chatId: string };
    const userId = req.userId;
    const { page, limit } = req.query as { page: string; limit: string };

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(400).json({
        success: false,
        message: "invalid user id",
      });
      return;
    }

    const chat = await prisma.chat.findUnique({ where: { id: chatId } });
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

    const messages = await prisma.message.findMany({
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

    const totalMessages = await prisma.message.count({
      where: { chatId: chat.id },
    });
    const totalPages = Math.ceil(totalMessages / limitNum);

    res
      .status(200)
      .json({ success: true, messages: messages, totalPages: totalPages });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "internal server error",
    });
  }
};

const getChats = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      res.status(400).json({ success: false, message: "invalid user id" });
      return;
    }

    const chats = await prisma.chat.findMany({ where: { userId: user.id } });
    res.status(200).json({
      success: true,
      chats,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "internal server error" });
  }
};

export { createChatBotMessage, getChatMessages, getChats };
