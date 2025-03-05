import { SendMessageDTO } from "@/application/dto/chat/ChatDTO";
import { AppError } from "@/domain/errors/AppError";
import { IChatRepository } from "@/domain/interfaces/IChatRepository";
import { IMessageRepository } from "@/domain/interfaces/IMessageRepository";
import { SocketService } from "@/infrastructure/services/SocketService";
import { StatusCodes } from "http-status-codes";
import mongoose from "mongoose";

export class SendMessageUseCase {
    constructor(
        private messageRepository: IMessageRepository,
        private chatRepository: IChatRepository,
        private socketService: SocketService
    ) { }
    
    async execute({ chatId, content, senderId, senderType }: SendMessageDTO) {
        try {
            const message = await this.messageRepository.createMessage({
                chatId: new mongoose.Types.ObjectId(chatId),
                content,
                senderId: new mongoose.Types.ObjectId(senderId),
                senderType,
                read: false
            });
            await this.chatRepository.updateLastMessage(chatId, content, senderType);
            const chat = await this.chatRepository.getChatById(chatId);
            if (!chat) {
                throw new AppError('Chat not found', StatusCodes.NOT_FOUND)
            }

            this.socketService.emitToChat(chatId, 'new-message', {
                message,
                chat
            })
            if (senderType === 'user') {
                this.socketService.emitToDeveloper(chat.developerId.toString(), 'new-message-notification', {
                    chatId,
                    message,
                    sender: chat.userId
                })
            } else {
                this.socketService.emitToUser(chat.userId.toString(), 'new-message-notification', {
                    chatId,
                    message,
                    sender: chat.developerId
                });
            }
            return message
        } catch (error) {
            throw new AppError('Failed to send message', StatusCodes.INTERNAL_SERVER_ERROR)
        }
    }
}