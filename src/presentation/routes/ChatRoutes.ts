import { Router } from "express";
import { ChatController } from "../controllers/ChatController";
import { ChatRepository } from "@/infrastructure/repositories/ChatRepository";
import { MessageRepository } from "@/infrastructure/repositories/MessageRepository";
import { SocketService } from "@/infrastructure/services/SocketService";
import { Server } from "http";
import { authMiddleware } from "../middleware/authMiddleware";
import { S3Service } from "@/infrastructure/services/S3_Service";

export const createChatRouter = (httpServer: Server) => {
    
    const chatRouter = Router();
    const chatRepository = new ChatRepository();
    const messageRepository = new MessageRepository();
    const socketService = new SocketService(httpServer);
    const s3Service = new S3Service()

    const chatController = new ChatController(chatRepository, messageRepository, socketService, s3Service);

    chatRouter.post('/create', authMiddleware, (req, res, next) => {
        chatController.createChat(req, res, next).catch(next);
    });

    chatRouter.get('/user', authMiddleware, (req, res, next) => {
        chatController.getUserChats(req, res, next).catch(next)
    })

    chatRouter.get('/developer', authMiddleware, (req, res, next) => {
        chatController.getDeveloperChats(req, res, next).catch(next)
    })

    chatRouter.get('/:chatId/messages', authMiddleware, (req, res, next) => {
        chatController.getChatMessages(req, res, next).catch(next)
    })

    chatRouter.post('/message', authMiddleware, (req, res, next) => {
        chatController.sendMessage(req, res, next).catch(next)
    })

    chatRouter.patch('/:chatId/read', authMiddleware, (req, res, next) => {
        chatController.markMessagesAsRead(req, res, next).catch(next)
    })

    return chatRouter
}
