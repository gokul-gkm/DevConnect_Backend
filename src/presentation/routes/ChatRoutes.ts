import { Router } from "express";
import { ChatController } from "../controllers/ChatController";
import { Server } from "http";
import { authMiddleware } from "../middleware/authMiddleware";
import { autherization } from "../middleware/autherization";
import { upload } from "@/utils/multer";
import { container } from "@/infrastructure/config/inversify.config";
import { TYPES } from "@/types/types";

export const createChatRouter = (httpServer: Server) => {
    
    const chatRouter = Router();
    const chatController = container.get<ChatController>(TYPES.ChatController);

    chatRouter.post('/', authMiddleware, autherization,  (req, res, next) => {
        chatController.createChat(req, res, next).catch(next);
    });

    chatRouter.get('/user', authMiddleware, autherization, (req, res, next) => {
        chatController.getUserChats(req, res, next).catch(next)
    })

    chatRouter.get('/developer', authMiddleware, autherization, (req, res, next) => {
        chatController.getDeveloperChats(req, res, next).catch(next)
    })

    chatRouter.get('/:chatId/messages', authMiddleware, autherization, (req, res, next) => {
        chatController.getChatMessages(req, res, next).catch(next)
    })

    chatRouter.post('/message', 
        authMiddleware, 
        autherization, 
        upload.single('mediaFile'),
        (req, res, next) => {
            chatController.sendMessage(req, res, next).catch(next);
        }
    );

    chatRouter.patch('/:chatId/read', authMiddleware, autherization, (req, res, next) => {
        chatController.markMessagesAsRead(req, res, next).catch(next)
    })

    return chatRouter
}
